'use client'

import type { Editor, RecordsDiff, TLComponents, TLRecord } from 'tldraw'
import { useEffect, useEffectEvent, useRef } from 'react'
import { DefaultColorStyle, Tldraw } from 'tldraw'
import { RoomEvent } from 'livekit-client'
import { useRoomContext } from '@livekit/components-react'
import { useParamsState } from '@/hooks'
import { LiveKitAction } from '@/feat/Meeting/enum'

import 'tldraw/tldraw.css'

type WhiteboardMessage =
  | {
      action: LiveKitAction.WhiteboardRequest
    }
  | {
      action: LiveKitAction.WhiteboardClose
    }
  | {
      action: LiveKitAction.WhiteboardUpdate
      payload: RecordsDiff<TLRecord>
    }

const encoder = new TextEncoder()
const decoder = new TextDecoder()

const components: TLComponents = {
  MainMenu: null,
  PageMenu: null,
  NavigationPanel: null,
  HelpMenu: null,
  DebugMenu: null,
  SharePanel: null,
}

export const Whiteboard = () => {
  const room = useRoomContext()
  const editorRef = useRef<Editor | null>(null)
  const { openWhiteboard, closeScreen } = useParamsState()

  /**
   * Prevent rebroadcast loop
   */
  const isRemoteApplyingRef = useRef(false)

  /**
   * Queue scheduler flag
   */
  const flushScheduledRef = useRef(false)

  /**
   * Coalesced updates
   */
  const addedRef = useRef<Record<string, TLRecord>>({})

  /**
   * Flush and scheduled updates
   */
  const updatedRef = useRef<Record<string, TLRecord>>({})
  const removedRef = useRef<Set<string>>(new Set())
  const flushRef = useRef<() => void>(null)
  const scheduleFlushRef = useRef<() => void>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  const handleDataReceived = useEffectEvent((payload: Uint8Array) => {
    try {
      const message = JSON.parse(decoder.decode(payload)) as WhiteboardMessage

      switch (message.action) {
        case LiveKitAction.WhiteboardRequest: {
          return openWhiteboard()
        }

        case LiveKitAction.WhiteboardClose: {
          return closeScreen()
        }

        case LiveKitAction.WhiteboardUpdate: {
          const { added, updated, removed } = message.payload

          /**
           * Coalesce added
           */
          for (const id in added) {
            addedRef.current[id] = added[id as keyof typeof added]
          }

          /**
           * Keep latest update only
           */
          for (const id in updated) {
            updatedRef.current[id] = updated[id as keyof typeof updated][1]
          }

          /**
           * Coalesce removed
           */
          for (const id in removed) {
            removedRef.current.add(id)
          }

          scheduleFlushRef.current?.()

          return
        }
      }
    } catch (err) {
      console.error('Whiteboard sync error:', err)
    }
  })

  const handleOnmount = (editor: Editor) => {
    editorRef.current = editor

    DefaultColorStyle.setDefaultValue('red')
    editor.setCurrentTool('draw')

    unsubscribeRef.current = editor.store.listen(
      ({ changes, source }) => {
        /**
         * Prevent echo
         */
        if (isRemoteApplyingRef.current) {
          return
        }

        /**
         * Ignore non-user changes
         */
        if (source !== 'user') {
          return
        }

        const message: WhiteboardMessage = {
          action: LiveKitAction.WhiteboardUpdate,
          payload: changes,
        }

        room.localParticipant.publishData(encoder.encode(JSON.stringify(message)), {
          reliable: false,
        })
      },
      {
        scope: 'document',
      }
    )
  }

  useEffect(() => {
    flushRef.current ??= () => {
      flushScheduledRef.current = false

      const editor = editorRef.current

      if (!editor) return

      const added = Object.values(addedRef.current)
      const updated = Object.values(updatedRef.current)
      const removed = Array.from(removedRef.current)

      if (added.length === 0 && updated.length === 0 && removed.length === 0) {
        return
      }

      addedRef.current = {}
      updatedRef.current = {}
      removedRef.current.clear()

      isRemoteApplyingRef.current = true
      editor.store.mergeRemoteChanges(() => {
        /**
         * Single put operation
         */
        if (added.length || updated.length) {
          editor.store.put([...added, ...updated])
        }

        /**
         * Single remove operation
         */
        if (removed.length) {
          editor.store.remove(removed as never)
        }
      })

      isRemoteApplyingRef.current = false
    }

    scheduleFlushRef.current ??= () => {
      if (flushScheduledRef.current) return

      flushScheduledRef.current = true

      /**
       * Faster than RAF for small bursts
       */
      queueMicrotask(() => {
        flushRef.current?.()
      })
    }

    return () => {
      unsubscribeRef.current?.()
    }
  }, [])

  useEffect(() => {
    room.on(RoomEvent.DataReceived, handleDataReceived)

    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived)
    }
  }, [room])

  return (
    <div className='absolute inset-0 z-5 overflow-hidden rounded-md ring-4 ring-blue-500 [&_.tl-watermark\_SEE-LICENSE]:hidden!'>
      <Tldraw
        components={components}
        onMount={handleOnmount}
        overrides={{
          tools(_, tools) {
            delete tools.note
            delete tools.asset

            return tools
          },
        }}
      />
    </div>
  )
}

export default Whiteboard

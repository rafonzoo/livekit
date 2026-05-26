'use client'

import type { Editor, TLComponents, TLRecord, RecordsDiff } from 'tldraw'
import type { FC } from 'react'
import type { LiveKitChannelAction } from '@/feat/Meeting/enum'
import { useEffect, useEffectEvent, useRef, useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { DefaultColorStyle, Tldraw } from 'tldraw'
import { RoomEvent } from 'livekit-client'
import { useRoomContext } from '@livekit/components-react'
import { omit, qstring } from '@/lib/utils'
import { LiveKitChannelTopic, LiveKitConfig, SearchParamsKey } from '@/feat/Meeting/enum'
import 'tldraw/tldraw.css'

const whiteboardConfig: TLComponents = {
  MainMenu: null,
  PageMenu: null,
  NavigationPanel: null,
  HelpMenu: null,
  DebugMenu: null,
  SharePanel: null,
}

export const Whiteboard: FC = () => {
  const room = useRoomContext()
  const editorRef = useRef<Editor | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const openWhiteboard = useEffectEvent((payload: Uint8Array) => {
    try {
      const message = JSON.parse(new TextDecoder().decode(payload)) as {
        action: LiveKitChannelAction
      }

      if (message.action === 'WHITEBOARD_REQUEST') {
        router[LiveKitConfig.TabsPushMethod](
          qstring(pathname, {
            ...Object.fromEntries(searchParams),
            [SearchParamsKey.Whiteboard]: 1,
          })
        )
      }

      if (message.action === 'WHITEBOARD_CLOSE') {
        router[LiveKitConfig.TabsPushMethod](
          qstring(pathname, {
            ...omit(Object.fromEntries(searchParams), [SearchParamsKey.Whiteboard]),
          })
        )
      }
    } catch (err) {
      console.error('Failed to open whiteboard:', err)
    }
  })

  const updateWhiteboard = useEffectEvent((payload: Uint8Array) => {
    try {
      const editor = editorRef.current
      const decoder = new TextDecoder()
      const message = JSON.parse(decoder.decode(payload)) as {
        action: LiveKitChannelAction
        payload: object
      }

      if (message.action === 'WHITEBOARD_UPDATE') {
        editorRef.current?.store.mergeRemoteChanges(() => {
          const { added, updated, removed } = message.payload

          // // 1. Jika ada objek baru atau objek yang di-redo (muncul kembali)
          // if (Object.keys(added).length > 0) {
          //   editor.store.put(Object.values(added))
          // }

          // 2. Jika ada objek yang bergeser/berubah warna
          if (Object.keys(updated).length > 0) {
            // updated berisi array [before, after], kita ambil data 'after' (index 1)
            const updatedRecords = Object.values(updated).map(([, after]) => after)
            editor.store.put(updatedRecords)
            console.log(updatedRecords)
          }

          // // 3. Jika ada objek yang di-undo (dihapus dari kanvas)
          // if (Object.keys(removed).length > 0) {
          //   editor.store.remove(Object.keys(removed))
          // }
        })
      }
    } catch (err) {
      console.error('Failed to update whiteboard:', err)
    }
  })

  useEffect(() => {
    room.on(RoomEvent.DataReceived, openWhiteboard)
    room.on(RoomEvent.DataReceived, updateWhiteboard)

    return () => {
      room.off(RoomEvent.DataReceived, openWhiteboard)
      room.off(RoomEvent.DataReceived, updateWhiteboard)
    }
  }, [room])

  return (
    <div className='absolute inset-0 z-5 overflow-hidden rounded-md ring-4 ring-blue-500 [&_.tl-background]:bg-transparent! [&_.tl-watermark\_SEE-LICENSE]:invisible [&_.tlui-style-panel__section:not(:first-child)]:hidden'>
      <Tldraw
        components={whiteboardConfig}
        onMount={(editor) => {
          editorRef.current = editor

          DefaultColorStyle.setDefaultValue('red')
          editor.setCurrentTool('draw')

          editor.store.listen(
            ({ changes }) => {
              const hasChanges =
                Object.keys(changes.added).length > 0 ||
                Object.keys(changes.updated).length > 0 ||
                Object.keys(changes.removed).length > 0

              if (!hasChanges) return

              const message = JSON.stringify({
                action: 'WHITEBOARD_UPDATE',
                payload: changes, // Kirim struktur added, updated, dan removed
              })

              const encoder = new TextEncoder()
              const data = encoder.encode(message)

              room.localParticipant.publishData(data, { reliable: true })
            },
            { scope: 'document' }
          )
        }}
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

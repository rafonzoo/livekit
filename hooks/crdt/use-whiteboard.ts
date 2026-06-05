import type { ExcalidrawImperativeAPI, ExcalidrawProps } from '@excalidraw/excalidraw/types'
import type { AwarenessState } from '@/feat/Realtime/LiveKitYjsProvider'
import { useRef, useEffect, useState } from 'react'
import * as Y from 'yjs'
import { ExcalidrawBinding, yjsToExcalidraw } from '@mizuka-wu/y-excalidraw'
import { useRoomContext } from '@livekit/components-react'
import { useRoomState } from '@/feat/Room'
import { LiveKitYjsProvider } from '@/feat/Realtime/LiveKitYjsProvider'

export function useWhiteboard(onReady?: () => void) {
  const { screen } = useRoomState()
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null)
  const excalidrawRef = useRef<HTMLDivElement | null>(null)
  const room = useRoomContext()
  const onReadyRef = useRef(onReady)
  const yElementsRef = useRef<Y.Array<Y.Map<unknown>>>(null)
  const providerRef = useRef<LiveKitYjsProvider | null>(null)
  const bindingRef = useRef<ExcalidrawBinding | null>(null)

  useEffect(() => {
    if (!api) return

    const ydoc = new Y.Doc()
    const yElements = ydoc.getArray<Y.Map<unknown>>('elements')
    const provider = new LiveKitYjsProvider(ydoc, room)
    const { name } = provider.awareness.getLocalState() as AwarenessState

    provider.awareness.setLocalStateField('user', { name })
    const excalidrawApi = new ExcalidrawBinding(yElements, null, api, provider.awareness)

    yElementsRef.current = yElements
    providerRef.current = provider
    bindingRef.current = excalidrawApi
    onReadyRef.current?.()

    return () => {
      // `isHost` cannot be use here since the `screen` it self updated
      if (room.localParticipant.identity === screen?.host) {
        yElements.delete(0, yElements.length)
      }
      excalidrawApi.destroy()
      provider.destroy()
      ydoc.destroy()
    }
  }, [api, room, screen?.host])

  return {
    binding: bindingRef.current,
    setApi,
    excalidrawRef,
    initialData: {
      appState: {
        activeTool: {
          type: 'freedraw',
          locked: false,
          customType: null,
          lastActiveTool: {
            type: 'freedraw',
            customType: null,
          },
        },
      },
      elements: yElementsRef.current ? yjsToExcalidraw(yElementsRef.current) : null,
    } satisfies ExcalidrawProps['initialData'],
  }
}

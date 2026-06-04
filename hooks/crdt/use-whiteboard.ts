import type { ExcalidrawImperativeAPI, ExcalidrawProps } from '@excalidraw/excalidraw/types'
import type { AwarenessState } from '@/feat/Realtime/LiveKitYjsProvider'
import { useRef, useEffect, useState } from 'react'
import * as Y from 'yjs'
import { useRoomContext } from '@livekit/components-react'
import { LiveKitYjsProvider } from '@/feat/Realtime/LiveKitYjsProvider'
import { ExcalidrawLiveKitBinding, yjsToExcalidraw } from '@/feat/Realtime/LiveKitExcalidrawBinding'

export function useWhiteboard(onReady?: () => void) {
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null)
  const excalidrawRef = useRef<HTMLDivElement | null>(null)
  const room = useRoomContext()
  const onReadyRef = useRef(onReady)
  const yElementsRef = useRef<Y.Array<Y.Map<unknown>>>(null)
  const ydocRef = useRef(new Y.Doc())
  const providerRef = useRef<LiveKitYjsProvider | null>(null)
  const bindingRef = useRef<ExcalidrawLiveKitBinding | null>(null)

  useEffect(() => {
    if (!api) return

    const ydoc = ydocRef.current
    const provider = new LiveKitYjsProvider(ydoc, room)
    const current = provider.awareness.getLocalState() as AwarenessState

    provider.awareness.setLocalStateField('user', { name: current.name })
    const excalidrawApi = new ExcalidrawLiveKitBinding(api, provider)

    providerRef.current = provider
    bindingRef.current = excalidrawApi
    onReadyRef.current?.()

    return () => {
      bindingRef.current?.destroy()
      bindingRef.current = null
      provider.destroy()
    }
  }, [api, room])

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
      elements: (yElementsRef.current ? yjsToExcalidraw(yElementsRef.current) : null) as never,
    } satisfies ExcalidrawProps['initialData'],
  }
}

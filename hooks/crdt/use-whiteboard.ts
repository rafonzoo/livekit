import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'
import { useRef, useEffect, useState } from 'react'
import * as Y from 'yjs'
import { ExcalidrawBinding, yjsToExcalidraw } from '@mizuka-wu/y-excalidraw'
import { useRoomContext } from '@livekit/components-react'
import { LiveKitYjsProvider } from '@/feat/Realtime/LiveKitYjsProvider'

export function useWhiteboard(onReady?: () => void) {
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null)
  const excalidrawRef = useRef<HTMLDivElement | null>(null)
  const room = useRoomContext()
  const onReadyRef = useRef(onReady)
  const yElementsRef = useRef<Y.Array<Y.Map<unknown>>>(undefined)
  const ydocRef = useRef(new Y.Doc())
  const providerRef = useRef<LiveKitYjsProvider | null>(null)
  const bindingRef = useRef<ExcalidrawBinding | null>(null)

  useEffect(() => {
    if (!api) return

    const ydoc = ydocRef.current
    const yElements = ydoc.getArray<Y.Map<unknown>>('elements')
    const yAssets = ydoc.getMap('assets')
    const provider = new LiveKitYjsProvider(ydoc, room)

    providerRef.current = provider
    bindingRef.current = new ExcalidrawBinding(yElements, yAssets, api, provider.awareness)
    onReadyRef.current?.()

    return () => {
      bindingRef.current?.destroy()
      provider.destroy()
    }
  }, [api, room])

  return {
    binding: bindingRef.current,
    setApi,
    excalidrawRef,
    initialData: { elements: yElementsRef.current ? yjsToExcalidraw(yElementsRef.current) : [] },
  }
}

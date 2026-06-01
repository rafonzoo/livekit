import type { HistoryEntry, TLDefaultColorStyle, TLRecord } from 'tldraw'
import type { AwarenessState } from '@/feat/Realtime/LiveKitYjsProvider'
import { useEffect, useRef } from 'react'
import * as Y from 'yjs'
import { createTLStore, DefaultColorStyle, defaultShapeUtils } from 'tldraw'
import { useRoomContext } from '@livekit/components-react'
import { LiveKitYjsProvider } from '@/feat/Realtime/LiveKitYjsProvider'
import { LiveKitKey } from '@/feat/enum'

export function useWhiteboard(options?: { onReady?: () => void }) {
  const room = useRoomContext()
  const ydocRef = useRef<Y.Doc | null>(null)
  const onReadyRef = useRef(options?.onReady)
  const providerRef = useRef<LiveKitYjsProvider | null>(null)
  const storeRef = useRef(createTLStore({ shapeUtils: defaultShapeUtils }))

  useEffect(() => {
    const ydoc = new Y.Doc()
    const yRecords = ydoc.getMap<TLRecord>(LiveKitKey.TLDrawRecord)
    const provider = new LiveKitYjsProvider(ydoc, room)
    const store = storeRef.current

    ydocRef.current = ydoc
    providerRef.current = provider

    // ── Yjs → TLDraw ─────────────────────────────────────────────────────
    // Observe changes in Y.Map and apply them to the TLDraw store
    const observeYjs = (event: Y.YMapEvent<TLRecord>) => {
      if (event.transaction.origin === 'tldraw') return

      store.mergeRemoteChanges(() => {
        event.changes.keys.forEach((change, key) => {
          if (change.action === 'delete') {
            store.remove([key as TLRecord['id']])
          } else {
            const record = yRecords.get(key)
            if (record) store.put([record])
          }
        })
      })
    }

    yRecords.observe(observeYjs)
    onReadyRef.current?.()

    // ── TLDraw → Yjs ─────────────────────────────────────────────────────
    // Listen to TLDraw store changes and sync them to the Y.Map
    const unsubscribeTldraw = store.listen(
      ({ changes, source }: HistoryEntry<TLRecord>) => {
        if (source !== 'user') return

        // Use 'tldraw' as origin so observeYjs doesn't re-apply to the store
        ydoc.transact(() => {
          Object.values(changes.added).forEach((r) => yRecords.set(r.id, r))
          Object.values(changes.updated).forEach(([, r]) => yRecords.set(r.id, r))
          Object.values(changes.removed).forEach((r) => yRecords.delete(r.id))
        }, 'tldraw')
      },
      { scope: 'document' }
    )

    return () => {
      yRecords.unobserve(observeYjs)
      unsubscribeTldraw()
      provider.destroy()
      ydoc.destroy()
    }
  }, [room])

  useEffect(() => {
    if (providerRef.current) {
      const { color } = providerRef.current.awareness.getLocalState() as AwarenessState
      let palette: TLDefaultColorStyle = 'green'

      try {
        palette = DefaultColorStyle.validate(color.tldraw)
      } catch (e) {
        console.warn('Color key is ignored. TLDraw might update their color enum.', e)
      }

      DefaultColorStyle.setDefaultValue(palette)
    }
  }, [])

  return { store: storeRef.current, provider: providerRef.current }
}

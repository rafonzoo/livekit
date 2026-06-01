import type { FC } from 'react'
import type { LiveKitYjsProvider, AwarenessState } from '@/feat/Realtime/LiveKitYjsProvider'
import { useEffect, useRef } from 'react'
import { useEditor } from 'tldraw'
import { useCursors } from '@/hooks/crdt/use-cursors'

export const WhiteboardCursor: FC<{ provider: LiveKitYjsProvider }> = ({ provider }) => {
  const editor = useEditor()
  const cursors = useCursors(provider)
  const containerRef = useRef<HTMLDivElement>(null)

  // Update awareness state when the mouse moves over the canvas
  useEffect(() => {
    const el = editor.getContainer()

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()

      // Convert screen coords → canvas coords (handle zoom + pan)
      const screenPoint = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
      const canvasPoint = editor.screenToPage(screenPoint)

      const current = provider.awareness.getLocalState() as AwarenessState
      provider.awareness.setLocalState({
        ...current,
        cursor: canvasPoint,
      })
    }

    const handleMouseLeave = () => {
      const current = provider.awareness.getLocalState() as AwarenessState
      provider.awareness.setLocalState({ ...current, cursor: null })
    }

    el.addEventListener('mousemove', handleMouseMove)
    el.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      el.removeEventListener('mousemove', handleMouseMove)
      el.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [editor, provider])

  // Render cursor at canvas coordinates (follows TLDraw zoom + pan)
  return (
    <div ref={containerRef} className='pointer-events-none absolute inset-0 overflow-hidden'>
      {cursors.map(({ clientId, cursor, name, color }) => {
        if (!cursor) return null

        // Convert canvas coords → screen coords for CSS positioning
        const screenPoint = editor.pageToScreen(cursor)

        return (
          <div
            key={clientId}
            className='absolute transition-transform duration-75'
            style={{
              transform: `translate(${screenPoint.x}px, ${screenPoint.y}px)`,
              // Adjust slightly so the cursor tip matches the mouse position
              marginLeft: -2,
              marginTop: -2,
            }}
          >
            {/* Cursor SVG */}
            <svg width='20' height='20' viewBox='0 0 20 20' fill='none'>
              <path
                d='M4 2L16 9.5L10.5 11L8 17L4 2Z'
                fill={color.hex}
                stroke='white'
                strokeWidth='1.2'
              />
            </svg>

            {/* Name label */}
            <div
              className='absolute top-4 left-4 rounded px-2 py-0.5 text-xs whitespace-nowrap text-white'
              style={{ backgroundColor: color.hex, fontSize: 11 }}
            >
              {name}
            </div>
          </div>
        )
      })}
    </div>
  )
}

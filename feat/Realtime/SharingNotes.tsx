'use client'
import type { FC, ReactNode } from 'react'
import type { Transaction } from 'prosemirror-state'
import type { MarkType } from 'prosemirror-model'
import type { AwarenessState } from '@/feat/Realtime/LiveKitYjsProvider'
import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react'
import * as Y from 'yjs'
import { ySyncPlugin, yUndoPlugin, yCursorPlugin } from 'y-prosemirror'
import { EditorView } from 'prosemirror-view'
import { EditorState } from 'prosemirror-state'
import { liftListItem, wrapInList, addListNodes } from 'prosemirror-schema-list'
import { schema as basicSchema } from 'prosemirror-schema-basic'
import { Schema } from 'prosemirror-model'
import { exampleSetup } from 'prosemirror-example-setup'
import { setBlockType, toggleMark } from 'prosemirror-commands'
import { ArrowLineDownIcon, TextBolderIcon, TextItalicIcon } from '@phosphor-icons/react'
import { useRoomContext } from '@livekit/components-react'
import { LiveKitYjsProvider } from '@/feat/Realtime/LiveKitYjsProvider'
import {
  HugeIcon,
  LeftToRightListBulletIcon,
  LeftToRightListNumberIcon,
} from '@/components/HugeIcon'

import '@/app/prose.css'

const schema = new Schema({
  nodes: addListNodes(basicSchema.spec.nodes, 'paragraph block*', 'block'),
  marks: basicSchema.spec.marks,
})

// ── Toolbar ──────────────────────────────────────────────────────────────────
interface ToolbarButtonProps {
  label: ReactNode
  title: string
  active?: boolean
  onMouseDown: (e: React.MouseEvent) => void
}

const ToolbarButton: FC<ToolbarButtonProps> = ({ label, title, active, onMouseDown }) => (
  <button
    title={title}
    onMouseDown={onMouseDown}
    className={`rounded px-2 py-1 text-sm font-medium transition-colors ${
      active ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`}
  >
    {label}
  </button>
)

const Divider = () => <div className='mx-1 h-5 w-px bg-gray-200' />

async function downloadDoc(editorEl: HTMLElement) {
  const style = document.createElement('style')
  style.textContent = `
    * {
      color: revert !important;
      background-color: revert !important;
      border-color: revert !important;
    }
  `

  document.head.appendChild(style)

  try {
    const { default: jsPDF } = await import('jspdf')
    const pdf = new jsPDF('p', 'mm', 'a4')

    await pdf.html(editorEl, {
      callback: function (doc) {
        doc.save('dokumen.pdf')
      },
      width: 190, // lebar konten dalam mm (sesuaikan dengan lebar A4)
      windowWidth: 794, // lebar area konten dalam pixel
      margin: [20, 20, 20, 20],
      autoPaging: 'text', // Ini kunci agar teks tidak terpotong di tengah
    })
  } catch (error) {
    alert('Gagal mengunduh dokumen')
    console.log('Failure to download document:', error)
  } finally {
    document.head.removeChild(style)
  }
}

const ToolbarEditor: FC<{ getView: () => EditorView | null; editorEl: HTMLElement | null }> = ({
  getView,
  editorEl,
}) => {
  // Re-render on every selection change so active states update
  const [, forceUpdate] = useState(0)

  // Requires `useCallback` due to force update
  const run = useCallback(
    (command: (state: EditorState, dispatch?: (tr: Transaction) => void) => boolean) => {
      const view = getView()

      if (view) {
        command(view.state, view.dispatch)
        view.focus()
      }
    },
    [getView]
  )

  const view = getView()
  const state = view?.state

  // prettier-ignore
  const isHeading = (level: number) => (
    state?.selection.$from.parent.type === schema.nodes.heading &&
    state?.selection.$from.parent.attrs.level === level
  )

  const isInList = (listType: 'bullet_list' | 'ordered_list') => {
    if (state) {
      const { $from } = state.selection

      for (let d = $from.depth; d >= 0; d--) {
        if ($from.node(d).type === schema.nodes[listType]) {
          return true
        }
      }
    }

    return false
  }

  const isMark = (markType: MarkType) => {
    if (state) {
      const { from, $from, to, empty } = state.selection

      if (empty) {
        return !!markType.isInSet(state.storedMarks ?? $from.marks())
      }

      return state.doc.rangeHasMark(from, to, markType)
    }

    return false
  }

  useEffect(() => {
    // Poll isn't ideal — better to subscribe via a ProseMirror plugin,
    // but for simplicity this works fine for a toolbar.
    const id = setInterval(() => forceUpdate((n) => n + 1), 150)
    return () => clearInterval(id)
  }, [])

  return (
    <div className='flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-white px-3 py-1.5 pr-29'>
      {/* Bold / Italic */}
      <ToolbarButton
        label={<TextBolderIcon weight='bold' size={18} />}
        title='Bold'
        active={isMark(schema.marks.strong)}
        onMouseDown={(e) => {
          e.preventDefault()
          run(toggleMark(schema.marks.strong))
        }}
      />
      <ToolbarButton
        label={<TextItalicIcon weight='bold' size={18} />}
        title='Italic'
        active={isMark(schema.marks.em)}
        onMouseDown={(e) => {
          e.preventDefault()
          run(toggleMark(schema.marks.em))
        }}
      />

      <Divider />

      {/* Headings */}
      {([1, 2, 3] as const).map((level) => (
        <ToolbarButton
          key={level}
          label={`H${level}`}
          title={`Heading ${level}`}
          active={isHeading(level)}
          onMouseDown={(e) => {
            e.preventDefault()

            if (isHeading(level)) {
              run(setBlockType(schema.nodes.paragraph))
            } else {
              run(setBlockType(schema.nodes.heading, { level }))
            }
          }}
        />
      ))}

      <Divider />

      {/* Lists */}
      <button
        title='Unordered list'
        onMouseDown={(e) => {
          e.preventDefault()

          if (isInList('bullet_list')) {
            run(liftListItem(schema.nodes.list_item))
          } else {
            run(wrapInList(schema.nodes.bullet_list))
          }
        }}
        className={`rounded p-1.5 transition-colors ${
          isInList('bullet_list') ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <HugeIcon icon={LeftToRightListBulletIcon} size={20} />
      </button>
      <button
        title='Ordered list'
        onMouseDown={(e) => {
          e.preventDefault()

          if (isInList('ordered_list')) {
            run(liftListItem(schema.nodes.list_item))
          } else {
            run(wrapInList(schema.nodes.ordered_list))
          }
        }}
        className={`rounded p-1.5 transition-colors ${
          isInList('ordered_list') ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <HugeIcon icon={LeftToRightListNumberIcon} size={20} />
      </button>

      <Divider />

      {/* Download */}
      <button
        title='Download as .txt'
        className='rounded p-1.5 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900'
        onMouseDown={(e) => {
          e.preventDefault()
          if (editorEl) downloadDoc(editorEl)
        }}
      >
        <ArrowLineDownIcon size={20} />
      </button>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export const SharingNotes: FC<{ onReady?: () => void }> = ({ onReady }) => {
  const room = useRoomContext()
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onReadyRef = useRef(onReady)
  const providerRef = useRef<LiveKitYjsProvider | null>(null)

  const cursorBuilder = useEffectEvent((user: { name: string; color: string }) => {
    const id = user.name.toLowerCase().replace('user: ', '')
    const participant = providerRef.current?.awareness.states.get(+id) as
      | Omit<AwarenessState, 'cursor'>
      | undefined

    const cursor = document.createElement('span')
    cursor.classList.add('ProseMirror-yjs-cursor')
    cursor.style.setProperty('--cursor-color', participant?.color.hex ?? user.color)

    const label = document.createElement('div')
    label.style.setProperty('--cursor-color', participant?.color.hex ?? user.color)
    label.textContent = participant?.name ?? user.name

    cursor.appendChild(label)
    return cursor
  })

  const selectionBuilder = useEffectEvent((user: { name: string; color: string }) => {
    const id = user.name.toLowerCase().replace('user: ', '')
    const participant = providerRef.current?.awareness.states.get(+id) as
      | Omit<AwarenessState, 'cursor'>
      | undefined

    return {
      class: 'ProseMirror-yjs-selection',
      style: `background-color: ${participant?.color.hex ?? 'red'};`,
    }
  })

  useEffect(() => {
    if (!editorRef.current || !room) return

    const ydoc = new Y.Doc()
    const yXmlFragment = ydoc.getXmlFragment('prosemirror')

    const provider = new LiveKitYjsProvider(ydoc, room)
    providerRef.current = provider

    const state = EditorState.create({
      schema,
      plugins: [
        ySyncPlugin(yXmlFragment),
        yCursorPlugin(provider.awareness, { selectionBuilder, cursorBuilder }),
        yUndoPlugin(),
        ...exampleSetup({ schema, menuBar: false }),
      ],
    })

    const view = new EditorView(editorRef.current, { state })
    viewRef.current = view
    onReadyRef.current?.()

    return () => {
      view.destroy()
      provider.destroy()
    }
  }, [room])

  return (
    <div className='absolute inset-0 flex flex-col bg-white text-black'>
      <ToolbarEditor getView={() => viewRef.current} editorEl={editorRef.current} />
      <div ref={editorRef} className='h-full w-full flex-1 overflow-auto p-5' />
    </div>
  )
}

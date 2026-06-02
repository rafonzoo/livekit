'use client'

import type { FC } from 'react'
import { useSharingNotes } from '@/hooks/crdt/use-sharing-notes'
import { ToolbarEditor } from '@/feat/Realtime/SharingNotesToolbar'

import '@/app/prose.css'

export const SharingNotes: FC<{ onReady?: () => void }> = ({ onReady }) => {
  const { viewRef, editorRef } = useSharingNotes({ onReady })

  return (
    <div className='absolute inset-0 flex flex-col bg-white text-black'>
      <ToolbarEditor getView={() => viewRef.current} editorEl={editorRef.current} />
      <div ref={editorRef} className='h-full w-full flex-1 overflow-auto p-5' />
    </div>
  )
}

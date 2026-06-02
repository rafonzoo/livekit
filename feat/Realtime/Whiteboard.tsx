'use client'

import type { TLComponents } from 'tldraw'
import type { FC } from 'react'
import { Tldraw } from 'tldraw'
import { useWhiteboard } from '@/hooks/crdt/use-whiteboard'
import { WhiteboardCursor } from '@/feat/Realtime/WhiteboardCursor'
import 'tldraw/tldraw.css'

const components: TLComponents = {
  MainMenu: null,
  PageMenu: null,
  NavigationPanel: null,
  HelpMenu: null,
  DebugMenu: null,
  SharePanel: null,
}

export const Whiteboard: FC<{ onReady?: () => void }> = ({ onReady }) => {
  const { store, provider } = useWhiteboard(onReady)

  return (
    <div className='absolute inset-0'>
      <Tldraw
        store={store} // sync already
        components={components}
        onMount={(editor) => {
          editor.setCurrentTool('draw')
        }}
        overrides={{
          tools(_, tools) {
            delete tools.note
            delete tools.asset
            return tools
          },
        }}
      >
        {provider && <WhiteboardCursor provider={provider} />}
      </Tldraw>
    </div>
  )
}

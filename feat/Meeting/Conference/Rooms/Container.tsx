'use client'

import type { ComponentProps, FC } from 'react'
import { useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ConferenceTabsPanel } from '@/feat/Meeting/Conference/Tabs'
import { RoomsAction } from '@/feat/Meeting/Conference/Rooms/Actions'

export interface RoomsContainerProps extends ComponentProps<'main'> {
  tabs: {
    id: number
    title: string
    icon: FC
    content: FC
  }[]
}

export const RoomsContainer: FC<RoomsContainerProps> = ({
  tabs,
  className,
  children,
  ...props
}) => {
  const searchParams = useSearchParams()
  const currentTab = tabs.find((tab) => Number(searchParams.get('tab')) === tab.id)
  const ConferencePanelContent = currentTab?.content ?? (() => null)

  return (
    <main className={cn('bg-secondary/40 fixed inset-0 p-3', className)} {...props}>
      <div className='flex h-full flex-col gap-3'>
        <div
          className={cn(
            '*:bg-background relative grid grow grid-cols-1 gap-3',
            !!currentTab && 'xl:grid-cols-[1fr_25rem]'
          )}
        >
          <div className='flex items-center justify-center rounded-md border shadow'>
            <p>GRID</p>
          </div>
          <ConferenceTabsPanel
            tabs={tabs.filter(({ id, title }) => ({ id, title }))}
            className='xl:static'
          >
            <ConferencePanelContent />
          </ConferenceTabsPanel>
        </div>
        <div className='bg-background flex items-center justify-center gap-4 rounded-md border px-1 py-2 shadow xl:min-h-28 xl:px-5 xl:py-6'>
          <RoomsAction />
        </div>

        {children}
      </div>
    </main>
  )
}

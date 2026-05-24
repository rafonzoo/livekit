'use client'

import type { ComponentProps, FC } from 'react'
import { useSearchParams } from 'next/navigation'
import { MicDisabledIcon, CameraDisabledIcon } from '@livekit/components-react'
import { ChevronUp } from '@hugeicons/core-free-icons'
import { cn, num } from '@/lib/utils'
import { RoomsTabPanel } from '@/feat/Meeting/Rooms/TabPanel'
import { ConnectionSearch } from '@/feat/Meeting/enum'
import { RoomTabs } from '@/feat/Meeting/const'
import { HugeIcon } from '@/components/HugeIcon'
import { ButtonIcon } from '@/components/Button'

export const RoomsLiveKit: FC<ComponentProps<'main'>> = ({ className, children, ...props }) => {
  const searchParams = useSearchParams()
  const tab = num(searchParams.get(ConnectionSearch.Tabs))
  const isOpen = num(searchParams.get(ConnectionSearch.TabsState))
  const currentTab = RoomTabs.find(({ id }) => tab === id)
  const RoomsPanelContent = currentTab?.content ?? (() => null)

  return (
    <main className={cn('bg-secondary/40 fixed inset-0 p-3', className)} {...props}>
      <div className='flex h-full flex-col gap-3'>
        <div
          className={cn(
            '*:bg-background relative grid grow grid-cols-1 gap-3',
            isOpen && 'xl:grid-cols-[1fr_25rem]'
          )}
        >
          <div className='flex items-center justify-center rounded-md border shadow'>
            <p>GRID</p>
          </div>
          <RoomsTabPanel className='xl:static'>
            <RoomsPanelContent />
          </RoomsTabPanel>
        </div>
        <div className='bg-background flex items-center justify-center gap-4 rounded-md border px-1 py-2 shadow xl:min-h-28 xl:px-5 xl:py-6'>
          <ButtonIcon>
            <MicDisabledIcon />
          </ButtonIcon>
          <div className='dark:bg-primary/50 flex items-center gap-1 rounded-full bg-red-200'>
            <div className='p-1'>
              <ButtonIcon className='size-10'>
                <CameraDisabledIcon />
              </ButtonIcon>
            </div>
            <button className='dark:hover:bg-primary/50 relative mr-2 -ml-1 inline-flex size-10 items-center justify-center rounded-full hover:bg-red-300'>
              <HugeIcon icon={ChevronUp} strokeWidth={2} />
            </button>
          </div>
        </div>

        {children}
      </div>
    </main>
  )
}

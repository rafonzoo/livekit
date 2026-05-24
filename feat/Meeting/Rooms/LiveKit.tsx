'use client'

import type { ComponentProps, FC } from 'react'
import { useSearchParams } from 'next/navigation'
import { HandIcon, MonitorPlayIcon, PhoneSlashIcon, SmileyIcon } from '@phosphor-icons/react'
import { MicDisabledIcon, CameraDisabledIcon } from '@livekit/components-react'
import { cn, num } from '@/lib/utils'
import { RoomsTabPanel } from '@/feat/Meeting/Rooms/TabPanel'
import { SearchParamsKey } from '@/feat/Meeting/enum'
import { RoomTabs } from '@/feat/Meeting/const'
import { HugeIcon, ChevronUp } from '@/components/HugeIcon'
import { ButtonIcon } from '@/components/Button'

export const RoomsLiveKit: FC<ComponentProps<'main'>> = ({ className, children, ...props }) => {
  const searchParams = useSearchParams()
  const tab = num(searchParams.get(SearchParamsKey.Tabs))
  const isOpen = num(searchParams.get(SearchParamsKey.TabsState))
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
          <RoomsTabPanel className='xl:bottom-34'>
            <RoomsPanelContent />
          </RoomsTabPanel>
        </div>
        <div className='bg-background flex items-center justify-center gap-2 rounded-md border px-1 py-2 shadow *:not-[div]:size-10 md:*:not-[div]:size-12 xl:min-h-28 xl:gap-4 xl:px-5 xl:py-6'>
          <ButtonIcon>
            <MicDisabledIcon className='md:scale-[1.2]' />
          </ButtonIcon>
          <div className='dark:bg-primary/50 flex h-10 items-center gap-1 rounded-full bg-red-200 p-1 *:size-8 md:h-12 md:*:size-10'>
            <ButtonIcon>
              <CameraDisabledIcon />
            </ButtonIcon>
            <button className='dark:hover:bg-primary/50 relative inline-flex items-center justify-center rounded-full hover:bg-red-300'>
              <HugeIcon icon={ChevronUp} strokeWidth={2} />
            </button>
          </div>
          <ButtonIcon isActive>
            <HandIcon weight='fill' size={20} />
          </ButtonIcon>
          <ButtonIcon isActive>
            <MonitorPlayIcon weight='fill' size={22} />
          </ButtonIcon>
          <ButtonIcon isActive>
            <SmileyIcon weight='fill' size={24} />
          </ButtonIcon>
          <ButtonIcon>
            <PhoneSlashIcon weight='fill' size={20} />
          </ButtonIcon>
        </div>

        {children}
      </div>
    </main>
  )
}

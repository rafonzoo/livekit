'use client'

import type { ComponentProps, FC } from 'react'
import { Activity } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ArrowLeftIcon, XIcon } from '@phosphor-icons/react'
import { cn, num, omit, qstring } from '@/lib/utils'
import { ConnectionSearch, LiveKitConfig } from '@/feat/Meeting/enum'
import { RoomTabsCopy, RoomTabs } from '@/feat/Meeting/const'

export const RoomsTabPanel: FC<ComponentProps<'aside'>> = ({ className, children, ...props }) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tab = num(searchParams.get(ConnectionSearch.Tabs))
  const isOpen = num(searchParams.get(ConnectionSearch.TabsState))
  const title = RoomTabsCopy.find((copy) => copy.tabIds.includes(tab))?.title ?? ''
  const currentTab = RoomTabs.find(({ id }) => id === tab)
  const parentId = currentTab?.parentId
  const hasChild = !!parentId
  const SubTabsComponent = currentTab?.content ?? (() => null)

  if (!isOpen) {
    return null
  }

  return (
    <aside
      data-slot='rooms-tab-panel'
      className={cn(
        'fixed top-3 right-3 bottom-16 left-3 z-10 rounded-md border p-5 shadow md:left-auto md:w-100 md:max-w-100',
        className
      )}
      {...props}
    >
      <div data-slot='conference-panel-header' className='flex items-center justify-between'>
        <div className='flex -translate-x-1 items-center'>
          {hasChild && (
            <button
              className='text-primary mr-1 flex size-6 cursor-pointer items-center justify-center hover:not-disabled:opacity-40'
              onClick={() => {
                router[LiveKitConfig.TabsPushMethod](
                  qstring(pathname, {
                    ...Object.fromEntries(searchParams),
                    [ConnectionSearch.Tabs]: parentId,
                  })
                )
              }}
            >
              <ArrowLeftIcon />
            </button>
          )}
          <h2 className='text-primary font-semibold'>{title}</h2>
        </div>
        <button
          type='button'
          className='text-destructive inline-flex size-11 cursor-pointer items-center justify-center rounded-md bg-red-200 hover:bg-red-300'
          onClick={() =>
            router[LiveKitConfig.TabsPushMethod](
              qstring(pathname, {
                ...omit(Object.fromEntries(searchParams), [ConnectionSearch.TabsState]),
              })
            )
          }
        >
          <XIcon size={20} />
        </button>
      </div>
      <hr className='border-primary my-6 border' />
      <div className='overflow-hidden'>
        <div
          className={cn(
            'grid auto-cols-[100%] grid-flow-col items-stretch transition-transform *:min-w-full',
            hasChild ? '-translate-x-full' : 'translate-none'
          )}
        >
          <div>{children}</div>
          <div>
            <Activity mode={hasChild ? 'visible' : 'hidden'}>
              <SubTabsComponent />
            </Activity>
          </div>
        </div>
      </div>
    </aside>
  )
}

export const RoomsTabPanelTitle: FC<ComponentProps<'h3'>> = ({ className, ...props }) => {
  return (
    <h3
      data-slot='rooms-tab-panel-title'
      className={cn('text-muted-foreground mb-4 font-semibold', className)}
      {...props}
    />
  )
}

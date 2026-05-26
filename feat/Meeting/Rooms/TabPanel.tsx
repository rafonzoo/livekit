'use client'

import type { ComponentProps, FC } from 'react'
import { Activity } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ArrowLeftIcon, XIcon } from '@phosphor-icons/react'
import { cn, num, omit, qstring } from '@/lib/utils'
import { SearchParamsKey, LiveKitConfig } from '@/feat/Meeting/enum'
import { RoomTabsCopy, RoomTabs } from '@/feat/Meeting/const'

export const RoomsTabPanel: FC<ComponentProps<'aside'>> = ({ className, children, ...props }) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tab = num(searchParams.get(SearchParamsKey.Tabs))
  const isOpen = num(searchParams.get(SearchParamsKey.TabsState))
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
        'fixed top-3 right-3 bottom-16 left-3 z-10 flex flex-col overflow-auto rounded-md border shadow md:left-auto md:w-100 md:max-w-100',
        className
      )}
      {...props}
    >
      <div data-slot='rooms-tab-panel-header' className='flex flex-col px-5 pt-5'>
        <div className='flex items-center justify-between'>
          {hasChild && (
            <button
              className='text-primary mr-1 flex size-6 cursor-pointer items-center justify-center hover:not-disabled:opacity-40'
              onClick={() => {
                router[LiveKitConfig.TabsPushMethod](
                  qstring(pathname, {
                    ...Object.fromEntries(searchParams),
                    [SearchParamsKey.Tabs]: parentId,
                  })
                )
              }}
            >
              <ArrowLeftIcon />
            </button>
          )}
          <h2 className={cn('text-primary mr-auto font-semibold', hasChild && '-translate-x-1')}>
            {title}
          </h2>
          <button
            type='button'
            className='text-destructive inline-flex size-11 cursor-pointer items-center justify-center rounded-md bg-red-200 hover:bg-red-300'
            onClick={() =>
              router[LiveKitConfig.TabsPushMethod](
                qstring(pathname, {
                  ...omit(Object.fromEntries(searchParams), [SearchParamsKey.TabsState]),
                })
              )
            }
          >
            <XIcon size={20} />
          </button>
        </div>
        {currentTab?.description && <p className='pr-11 text-sm'>{currentTab.description}</p>}
        <hr className='border-primary mt-6 mb-1 border' />
      </div>
      <div
        className={cn(
          'grid grow auto-cols-[100%] grid-flow-col transition-transform *:min-w-full *:p-5',
          hasChild ? '-translate-x-full' : 'translate-none'
        )}
      >
        {children}
        <Activity mode={hasChild ? 'visible' : 'hidden'}>
          <SubTabsComponent />
        </Activity>
      </div>
    </aside>
  )
}

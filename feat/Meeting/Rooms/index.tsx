'use client'

import type { FC, MouseEvent } from 'react'
import type { RoomsConferenceProps } from '@/feat/Meeting/Rooms/Conference'
import { Activity, useEffect, useRef, useState } from 'react'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ChatIcon, CopyIcon } from '@phosphor-icons/react'
import { cn, num, qstring } from '@/lib/utils'
import { TabsButton } from '@/feat/Meeting/Tabs'
import { RoomsConference } from '@/feat/Meeting/Rooms/Conference'
import { copyHandler } from '@/feat/Meeting/helpers'
import { SearchParamsKey, LiveKitConfig } from '@/feat/Meeting/enum'
import { RoomTabsCopy, RoomTabs } from '@/feat/Meeting/const'
import {
  HugeIcon,
  AiMagicFreeIcons,
  Settings02FreeIcons,
  ToolsFreeIcons,
  UserMultiple02FreeIcons,
  Menu,
} from '@/components/HugeIcon'

export const Rooms: FC<RoomsConferenceProps> = (props) => {
  const [mobileOpen, setMobileOpen] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams<{ name: string }>()
  const searchParams = useSearchParams()
  const tab = num(searchParams.get(SearchParamsKey.Tabs))
  const isOpen = num(searchParams.get(SearchParamsKey.TabsState))
  const searchParamsObject = Object.fromEntries(searchParams)

  const copyText = useRef((code: string) => {
    return (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()

      copyHandler(code)
    }
  })

  const copyIcon = useRef({
    tools: () => <HugeIcon size={22} icon={ToolsFreeIcons} />,
    multiple: () => <HugeIcon size={22} icon={UserMultiple02FreeIcons} />,
    chat: () => <ChatIcon size={22} />,
    magic: () => <HugeIcon size={22} icon={AiMagicFreeIcons} />,
    settings: () => <HugeIcon size={22} icon={Settings02FreeIcons} />,
  })

  useEffect(() => {
    function showLeaveAlert(e: Event) {
      if (window.location.origin.startsWith('https')) {
        e.preventDefault()
      }
    }

    window.addEventListener('beforeunload', showLeaveAlert)

    return () => {
      window.removeEventListener('beforeunload', showLeaveAlert)
    }
  }, [])

  return (
    <RoomsConference {...props}>
      <Activity mode='hidden'>
        <div className='bg-background border-muted-foreground/40 *:bg-secondary fixed top-17 bottom-48 left-11 w-18 rounded-md border p-5 shadow *:size-8 *:rounded-[inherit]'>
          <div></div>
        </div>
      </Activity>
      <div className='flex items-center justify-between gap-3 xl:-mt-31 xl:px-5 xl:py-6'>
        <div className={cn('grow text-sm', mobileOpen ? 'hidden xl:block' : 'block')}>
          <button
            type='submit'
            className='text-primary bg-background border-primary hover:not-disabled:bg-primary/20 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border px-3 font-semibold disabled:opacity-40 xl:hidden'
            onClick={copyText.current(params.name)}
          >
            <CopyIcon size={20} />
            Salin kode
          </button>
          <div className='hidden flex-col gap-2 xl:flex'>
            <p>Kode ruangan</p>
            <div className='flex gap-2'>
              <div className='flex h-9 w-50 cursor-text items-center rounded-md border px-3 shadow'>
                {params.name}
              </div>
              <TabsButton
                className='size-9'
                title='Salin kode ruangan'
                onClick={copyText.current(params.name)}
              >
                <CopyIcon size={20} />
              </TabsButton>
            </div>
          </div>
        </div>
        <TabsButton
          className='xl:hidden'
          onClick={(e) => {
            e.preventDefault()
            setMobileOpen((prev) => !prev)
          }}
        >
          <HugeIcon icon={Menu} size={22} />
        </TabsButton>
        <div
          className={cn(
            'flex grow gap-3 justify-self-stretch xl:flex xl:grow-0',
            !mobileOpen && 'hidden'
          )}
        >
          {RoomTabsCopy.map(({ id, icon, tabIds }) => (
            <TabsButton
              key={id}
              isActive={tabIds.includes(tab) && !!isOpen}
              className='w-full xl:w-10'
              onClick={() => {
                // const selectedTab = RoomTabs.find((tabs) => tabs.metaId === id)?.id ?? null
                const selectedTab = RoomTabs.find((tabs) => tabIds.includes(tabs.id))?.id ?? null
                const toggle = isOpen ? (tabIds.includes(tab) ? null : 1) : 1

                router[LiveKitConfig.TabsPushMethod](
                  qstring(
                    pathname,
                    {
                      ...searchParamsObject,
                      [SearchParamsKey.TabsState]: toggle,
                      [SearchParamsKey.Tabs]: tab
                        ? tabIds.includes(tab)
                          ? tab
                          : selectedTab
                        : selectedTab,
                    },
                    { skipNulls: true }
                  )
                )
              }}
            >
              {copyIcon.current[icon]()}
            </TabsButton>
          ))}
        </div>
      </div>
    </RoomsConference>
  )
}

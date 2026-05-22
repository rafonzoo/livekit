'use client'

import type { FC } from 'react'
import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { ChatIcon } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import {
  ConferenceTabs,
  ConferenceTabsButton,
  ConferenceTabsChats,
  ConferenceTabsMeeting,
  ConferenceTabsParticipant,
  ConferenceTabsPersonalize,
  ConferenceTabsSettings,
} from '@/feat/LiveKit/Conference/Tabs'
import { ConferencePanel } from '@/feat/LiveKit/Conference/Panel'
import {
  HugeIcon,
  AiMagicFreeIcons,
  Settings02FreeIcons,
  ToolsFreeIcons,
  UserMultiple02FreeIcons,
} from '@/components/HugeIcon'

const STATIC_TABS = [
  {
    id: 1,
    title: 'Perangkat rapat',
    icon: () => <HugeIcon size={22} icon={ToolsFreeIcons} />,
    content: ConferenceTabsMeeting,
  },
  {
    id: 2,
    title: 'Daftar peserta',
    icon: () => <HugeIcon size={22} icon={UserMultiple02FreeIcons} />,
    content: ConferenceTabsParticipant,
  },
  { id: 3, title: 'Percakapan', icon: () => <ChatIcon size={22} />, content: ConferenceTabsChats },
  {
    id: 4,
    title: 'Latar belakang virtual',
    icon: () => <HugeIcon size={22} icon={AiMagicFreeIcons} />,
    content: ConferenceTabsPersonalize,
  },
  {
    id: 5,
    title: 'Alat pengaturan',
    icon: () => <HugeIcon size={22} icon={Settings02FreeIcons} />,
    content: ConferenceTabsSettings,
  },
]

export const VideoConference: FC = () => {
  const searchParams = useSearchParams()
  const currentTab = STATIC_TABS.find((tab) => Number(searchParams.get('tab')) === tab.id)
  const ConferencePanelContent = currentTab?.content ?? (() => null)

  useEffect(() => {
    function showLeaveAlert(e: Event) {
      e.preventDefault()
    }

    window.addEventListener('beforeunload', showLeaveAlert)

    return () => {
      window.removeEventListener('beforeunload', showLeaveAlert)
    }
  }, [])

  return (
    <main className='bg-secondary/40 fixed inset-0 p-3'>
      <div className='flex h-full flex-col gap-3'>
        <div
          className={cn(
            '*:bg-background relative grid grow grid-cols-1 gap-3',
            !!currentTab && 'lg:grid-cols-[1fr_25rem]'
          )}
        >
          <div className='flex items-center justify-center rounded-md border shadow'>
            <p>GRID</p>
          </div>
          <ConferencePanel tabs={STATIC_TABS.filter(({ id, title }) => ({ id, title }))}>
            <ConferencePanelContent />
          </ConferencePanel>
        </div>
        <div className='bg-background flex items-center justify-between rounded-md border px-5 py-6 shadow'>
          <p>left</p>
          <p>center</p>
          <ConferenceTabs>
            {STATIC_TABS.map(({ id, icon: Icon }) => (
              <ConferenceTabsButton key={id} tab={id}>
                <Icon />
              </ConferenceTabsButton>
            ))}
          </ConferenceTabs>
        </div>
      </div>
    </main>
  )
}

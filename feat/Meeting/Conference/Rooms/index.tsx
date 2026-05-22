'use client'

import type { FC, MouseEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { ChatIcon, CopyIcon } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { copyHandler } from '@/feat/Meeting/helpers'
import {
  ConferenceTabsButton,
  ConferenceTabsChats,
  ConferenceTabsMeeting,
  ConferenceTabsParticipant,
  ConferenceTabsPersonalize,
  ConferenceTabsSettings,
} from '@/feat/Meeting/Conference/Tabs'
import { RoomsContainer } from '@/feat/Meeting/Conference/Rooms/Container'
import {
  HugeIcon,
  AiMagicFreeIcons,
  Settings02FreeIcons,
  ToolsFreeIcons,
  UserMultiple02FreeIcons,
  Menu,
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

export const Rooms: FC = () => {
  const params = useParams<{ name: string }>()
  const { name: roomCode } = params
  const [mobileOpen, setMobileOpen] = useState(true)

  const copyText = useRef((code: string) => {
    return (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()

      copyHandler(code)
    }
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
    <RoomsContainer tabs={STATIC_TABS}>
      <div className='flex items-center justify-between gap-3 xl:-mt-31 xl:px-5 xl:py-6'>
        <div className={cn('grow text-sm', mobileOpen ? 'hidden xl:block' : 'block')}>
          <button
            type='submit'
            className='text-primary bg-background border-primary hover:not-disabled:bg-primary/20 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border px-3 font-semibold disabled:opacity-40 xl:hidden'
            onClick={copyText.current(roomCode)}
          >
            <CopyIcon size={20} />
            Salin kode
          </button>
          <div className='hidden flex-col gap-2 xl:flex'>
            <p>Kode ruangan</p>
            <div className='flex gap-2'>
              <div className='flex h-9 w-50 cursor-text items-center rounded-md border px-3 shadow'>
                {roomCode}
              </div>
              <ConferenceTabsButton
                className='size-9'
                title='Salin kode ruangan'
                onClick={copyText.current(roomCode)}
              >
                <CopyIcon size={20} />
              </ConferenceTabsButton>
            </div>
          </div>
        </div>
        <ConferenceTabsButton className='xl:hidden' onClick={() => setMobileOpen((prev) => !prev)}>
          <HugeIcon icon={Menu} size={22} />
        </ConferenceTabsButton>
        <div
          className={cn(
            'flex grow gap-3 justify-self-stretch xl:flex xl:grow-0',
            !mobileOpen && 'hidden'
          )}
        >
          {STATIC_TABS.map(({ id, icon: Icon }) => (
            <ConferenceTabsButton key={id} tab={id} className='w-full xl:w-10' toggle={true}>
              <Icon />
            </ConferenceTabsButton>
          ))}
        </div>
      </div>
    </RoomsContainer>
  )
}

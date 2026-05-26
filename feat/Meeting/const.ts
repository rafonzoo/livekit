import type { TabProps } from '@/feat/Meeting/types'
import {
  TabsChats,
  TabsMeeting,
  TabsParticipant,
  TabsPersonalize,
  TabsSettings,
} from '@/feat/Meeting/Tabs'
import { WatchYoutube } from '@/feat/Meeting/Addons/WatchYoutube'
import { SharedNotes } from '@/feat/Meeting/Addons/SharedNotes'
import { Polling } from '@/feat/Meeting/Addons/Polling'

export const RoomTabs = [
  {
    id: 1,
    content: TabsMeeting,
    hide: false,
  },
  {
    id: 11,
    parentId: 1,
    content: SharedNotes,
    hide: false,
    description: 'Berbagi catatan',
  },
  {
    id: 12,
    parentId: 1,
    content: Polling,
    hide: false,
    description: 'Pendapat',
  },
  {
    id: 13,
    parentId: 1,
    content: WatchYoutube,
    hide: false,
    description: 'Bagikan video youtube',
  },
  {
    id: 2,
    content: TabsParticipant,
    hide: false,
  },
  {
    id: 3,
    content: TabsChats,
    hide: false,
    description: 'Semua orang',
  },
  {
    id: 4,
    content: TabsPersonalize,
    hide: false,
  },
  {
    id: 5,
    content: TabsSettings,
    hide: false,
    description: 'Gunakan pengaturan ini untuk mengatur rapat Anda.',
  },
] satisfies TabProps[]

export const RoomTabsCopy = [
  {
    id: 1,
    title: 'Perangkat rapat',
    icon: 'tools' as const,
    tabIds: [1, 11, 12, 13],
  },
  {
    id: 2,
    title: 'Daftar peserta',
    icon: 'multiple' as const,
    tabIds: [2],
  },
  {
    id: 3,
    title: 'Percakapan',
    icon: 'chat' as const,
    tabIds: [3],
  },
  {
    id: 4,
    title: 'Latar belakang virtual',
    icon: 'magic' as const,
    tabIds: [4],
  },
  {
    id: 5,
    title: 'Alat pengaturan',
    icon: 'settings' as const,
    tabIds: [5],
  },
]

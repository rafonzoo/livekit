import type { TabProps } from '@/feat/Meeting/types'
import {
  TabsChats,
  TabsMeeting,
  TabsParticipant,
  TabsPersonalize,
  TabsSettings,
} from '@/feat/Meeting/Tabs'
import { SharedNotes } from '@/feat/Meeting/Addons/SharedNotes'

export const RoomTabs = [
  {
    id: 1,
    metaId: 1,
    content: TabsMeeting,
  },
  {
    id: 11,
    metaId: 1,
    parentId: 1,
    content: SharedNotes,
  },
  {
    id: 2,
    metaId: 2,
    content: TabsParticipant,
  },
  {
    id: 3,
    metaId: 3,
    content: TabsChats,
  },
  {
    id: 4,
    metaId: 4,
    content: TabsPersonalize,
  },
  {
    id: 5,
    metaId: 5,
    content: TabsSettings,
  },
] satisfies TabProps[]

export const RoomTabsCopy = [
  {
    id: 1,
    title: 'Perangkat rapat',
    icon: 'tools' as const,
    tabIds: [1, 11],
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

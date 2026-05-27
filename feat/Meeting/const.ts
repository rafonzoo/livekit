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
    content: () => TabsMeeting,
    hide: false,
  },
  {
    id: 11,
    parentId: 1,
    content: () => SharedNotes,
    hide: false,
    description: 'Berbagi catatan',
  },
  {
    id: 12,
    parentId: 1,
    content: () => Polling,
    hide: false,
    description: 'Pendapat',
  },
  {
    id: 13,
    parentId: 1,
    content: () => WatchYoutube,
    hide: false,
    description: 'Bagikan video youtube',
  },
  {
    id: 2,
    content: () => TabsParticipant,
    hide: false,
  },
  {
    id: 3,
    content: () => TabsChats,
    hide: false,
    description: 'Semua orang',
  },
  {
    id: 4,
    content: () => TabsPersonalize,
    hide: false,
  },
  {
    id: 5,
    content: () => TabsSettings,
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

export const TabsContents = [
  {
    id: 1,
    headline: 'Kolaborasi',
    hide: false,
    lists: [
      {
        id: 'share-note' as const,
        icon: 'phosphor/notebook' as const,
        title: 'Berbagi catatan',
        description: 'Mencatat bersama - sama secara langsung',
        hide: false,
      },
      {
        id: 'polling' as const,
        icon: 'hugeicons/anaytics-01' as const,
        title: 'Jajak pendapat',
        description: 'Buat & kelola jajak pendapat',
        hide: false,
      },
      {
        id: 'whiteboard' as const,
        icon: 'phosphor/presentation' as const,
        title: 'Papan tulis',
        description: 'Kanvas menggambar kolaboratif',
        hide: false,
      },
    ],
  },
  {
    id: 2,
    headline: 'Konten',
    hide: false,
    lists: [
      {
        id: 'presentation' as const,
        icon: 'phosphor/projector-screen-chart' as const,
        title: 'Presentasi',
        description: 'Lihat berkas presentasi yang diunggah',
        hide: false,
      },
    ],
  },
  {
    id: 3,
    headline: 'Media',
    hide: false,
    lists: [
      {
        id: 'watch-youtube' as const,
        icon: 'phosphor/youtube-logo' as const,
        title: 'Berbagi video online ke pihak luar',
        description: 'Tonton video YouTube bersama',
        hide: false,
      },
    ],
  },
  {
    id: 4,
    headline: 'Admin',
    hide: false,
    lists: [
      {
        id: 'recording' as const,
        icon: 'hugeicons/live-streaming-03' as const,
        title: 'Mulai rekam rapat',
        description: 'Rekam rapat sekarang',
        hide: false,
      },
      {
        id: 'pick-random' as const,
        icon: 'phosphor/dice-six' as const,
        title: 'Pilih peserta acak',
        description: 'Pilih peserta secara acak',
        hide: false,
      },
    ],
  },
]

export type TabsContentIconKey = (typeof TabsContents)[number]['lists'][number]['icon']

export type TabsContentIconId = (typeof TabsContents)[number]['lists'][number]['id']

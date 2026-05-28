import type { TabProps } from '@/feat/types'
import { TabsChats, TabsMeeting, TabsParticipant, TabsPersonalize, TabsSettings } from '@/feat/Tabs'
import { GroupCode, GroupsCode } from '@/feat/enum'
import { WatchYoutube } from '@/feat/Collab/WatchYoutube'
import { SharedNotes } from '@/feat/Collab/SharedNotes'
import { Polling } from '@/feat/Collab/Polling'

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

export const RoomTabsTools = [
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
    id: GroupsCode.Collaboration,
    headline: 'Kolaborasi',
    hide: false,
    lists: [
      {
        id: GroupCode.ShareNote,
        icon: 'phosphor/notebook' as const,
        title: 'Berbagi catatan',
        description: 'Mencatat bersama - sama secara langsung',
        hide: false,
      },
      {
        id: GroupCode.Polling,
        icon: 'hugeicons/anaytics-01' as const,
        title: 'Jajak pendapat',
        description: 'Buat & kelola jajak pendapat',
        hide: false,
      },
      {
        id: GroupCode.Whiteboard,
        icon: 'phosphor/presentation' as const,
        title: 'Papan tulis',
        description: 'Kanvas menggambar kolaboratif',
        hide: false,
      },
    ],
  },
  {
    id: GroupsCode.Content,
    headline: 'Konten',
    hide: false,
    lists: [
      {
        id: GroupCode.Presentation,
        icon: 'phosphor/projector-screen-chart' as const,
        title: 'Presentasi',
        description: 'Lihat berkas presentasi yang diunggah',
        hide: false,
      },
    ],
  },
  {
    id: GroupsCode.Media,
    headline: 'Media',
    hide: false,
    lists: [
      {
        id: GroupCode.WatchYoutube,
        icon: 'phosphor/youtube-logo' as const,
        title: 'Berbagi video online ke pihak luar',
        description: 'Tonton video YouTube bersama',
        hide: false,
      },
    ],
  },
  {
    id: GroupsCode.Admin,
    headline: 'Admin',
    hide: false,
    lists: [
      {
        id: GroupCode.Recording,
        icon: 'hugeicons/live-streaming-03' as const,
        title: 'Mulai rekam rapat',
        description: 'Rekam rapat sekarang',
        hide: false,
      },
      {
        id: GroupCode.PickRandom,
        icon: 'phosphor/dice-six' as const,
        title: 'Pilih peserta acak',
        description: 'Pilih peserta secara acak',
        hide: false,
      },
    ],
  },
]

export type TabsRoomToolsIconKey = (typeof RoomTabsTools)[number]['icon']

export type TabsContentIconKey = (typeof TabsContents)[number]['lists'][number]['icon']

export type TabsContentList = (typeof TabsContents)[number]['lists'][number]

export type TabsContentIconId = (typeof TabsContents)[number]['lists'][number]['id']

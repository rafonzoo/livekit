export const defaultPrejoin = {
  autoCheck: false,
  isLoading: false,
  isLoadingLabel: 'Menghubungkan...',
  pageTitle: 'MEET',
  roomTitle: 'Test Room',
  roomIntro: 'Siap untuk bergabung?',
  joinLabel: 'Masuk Ruang Rapat',
  micLabel: 'Mikrofon utama',
  camLabel: 'Kamera utama',
  camOffLabel: 'Kamera mati',
  cancelLabel: 'Batal',
  rolesLabel: 'Bergabung sebagai',
  roleName: 'Super Admin',
  isGuest: true,
  withPassword: false,
  persistUserChoices: true,
}

export const TabsContent = [
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

export type TabsContentIconKey = (typeof TabsContent)[number]['lists'][number]['icon']

export type TabsContentIconId = (typeof TabsContent)[number]['lists'][number]['id']

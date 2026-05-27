'use client'

import { default as dynamic } from 'next/dynamic'
import { SpinnerIcon } from '@phosphor-icons/react'

export const Rooms = dynamic(() => import('@/feat/Meeting/Rooms'), {
  ssr: false,
  loading: () => (
    <div className='bg-background text-muted-foreground fixed inset-0 flex items-center justify-center overflow-hidden rounded-md text-sm'>
      <SpinnerIcon size={24} className='mr-2 animate-spin' /> Sedang memuat...
    </div>
  ),
})

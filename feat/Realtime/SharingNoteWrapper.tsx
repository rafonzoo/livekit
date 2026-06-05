'use client'

import type { FC } from 'react'
import { default as dynamic } from 'next/dynamic'
import { cn } from '@/lib/utils'
import { useParamsState } from '@/hooks'
import { Loading } from '@/components/Loading'

const SharingNotes = dynamic(async () => await import('@/feat/Realtime/SharingNotes'), {
  ssr: false,
  loading: () => <Loading className='left-full' />,
})

export const SharingNoteWrapper: FC = () => {
  const { isTabsMeetingSharedNotes } = useParamsState()

  return (
    <div
      inert={!isTabsMeetingSharedNotes}
      className={cn(
        'absolute inset-0 left-full',
        !isTabsMeetingSharedNotes ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'
      )}
    >
      <SharingNotes />
    </div>
  )
}

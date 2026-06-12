'use client'

import type { FC } from 'react'
import { ListParticipant, ListParticipantPending } from '@/components/ListParticipant'

export const TabsParticipant: FC = () => {
  return (
    <div className='flex flex-col gap-6'>
      <ListParticipantPending />
      <ListParticipant />
    </div>
  )
}

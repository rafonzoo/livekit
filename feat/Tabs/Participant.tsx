'use client'

import type { FC } from 'react'
import { default as WaitingParticipant } from '@/components/WaitingParticipant'
import { default as ListParticipant } from '@/components/ListParticipant'

export const TabsParticipant: FC = () => {
  return (
    <div className='flex flex-col gap-6'>
      <WaitingParticipant />
      <ListParticipant />
    </div>
  )
}

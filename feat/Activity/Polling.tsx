'use client'

import type { FC } from 'react'
import { usePollingSession } from '@/hooks'
import { PollingCard } from '@/feat/Tabs'

export const Polling: FC<{ onReady?: () => void }> = ({ onReady }) => {
  const { question, options, isHost, totalParticipant, selectVote, endPolling } =
    usePollingSession(onReady)

  return (
    <div className='bg-secondary flex h-full w-full items-center justify-center overflow-hidden'>
      <div className='w-105 max-w-[87.5%]'>
        <PollingCard
          totalParticipant={totalParticipant}
          question={question}
          options={options}
          isResult={isHost}
          onCheckedChange={selectVote}
          onClosePolling={endPolling}
        />
      </div>
    </div>
  )
}

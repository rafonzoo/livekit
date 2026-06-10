'use client'

import type { FC } from 'react'
import type { PollingMessage } from '@/feat/Tabs'
import { useEffect, useRef } from 'react'
import { useRoomContext } from '@livekit/components-react'
import { useDataChannel } from '@/hooks'
import { PollingCard } from '@/feat/Tabs'
import { useRoomState } from '@/feat/Room'
import { LiveKitAction, ParticipantAttribute } from '@/feat/enum'

export const Polling: FC<{ onReady?: () => void }> = ({ onReady }) => {
  const { screen, isHost } = useRoomState()
  const pollings = JSON.parse(screen?.polling ?? '') as PollingMessage[]
  const { id, question = '', options = [] } = { ...pollings.find((polling) => polling.active) }
  const room = useRoomContext()
  const onReadyRef = useRef(onReady)
  const { send: updateVote } = useDataChannel<{
    optionId: number
    pollingId: number
    identity: string
    name: string
  }>(LiveKitAction.PollingStart, async ({ payload }) => {
    const prev = room.localParticipant.attributes[ParticipantAttribute.ScreenActivePolling]
    if (!prev || !payload) return

    const prevMessages = JSON.parse(prev) as PollingMessage[] // ✅ array
    const newMessages = prevMessages.map((message) => {
      // cari polling yang sesuai, misal berdasarkan question atau id
      if (message.id !== payload.pollingId) return message // skip polling lain

      return {
        ...message,
        options: message.options.map((option) =>
          option.id === payload.optionId
            ? {
                ...option,
                votes: [
                  ...option.votes.filter(
                    (vote) => vote.identity !== payload.identity // ✅ identity voter
                  ),
                  {
                    identity: payload.identity, // ✅
                    name: payload.name, // ✅
                  },
                ],
              }
            : {
                ...option,
                votes: option.votes.filter(
                  (vote) => vote.identity !== payload.identity // ✅
                ),
              }
        ),
      }
    })

    await room.localParticipant.setAttributes({
      [ParticipantAttribute.ScreenActivePolling]: JSON.stringify(newMessages),
    })
  })

  console.log(pollings)

  useEffect(() => onReadyRef.current?.(), [])

  return (
    <div className='bg-secondary flex h-full w-full items-center justify-center overflow-hidden'>
      <PollingCard
        question={question}
        options={options}
        isResult={isHost}
        onCheckedChange={(optionId) => {
          if (!isHost && screen) {
            // updateVote(optionId, { reliable: false, destinationIdentities: [screen.host] })
            updateVote(
              {
                optionId,
                pollingId: id ?? -1,
                identity: room.localParticipant.identity,
                name: room.localParticipant.name ?? '',
              },
              { reliable: true, destinationIdentities: [screen.host] }
            )
          }
        }}
      />
    </div>
  )
}

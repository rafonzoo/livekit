'use client'

import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { useParticipants, useRoomInfo } from '@livekit/components-react'

interface HostMessage {
  status: string
  participantName: string
  participants: string[]
}

export const TabsParticipant: FC = () => {
  const roomInfo = useRoomInfo()
  const [loadingId, setLoadingId] = useState<string[]>([])
  const [pending, setPending] = useState<string[]>([])
  const mergedParticipant = useParticipants()
  const pendingParticipant = pending.map((name) => ({ name, key: `${name}_${Date.now()}` }))

  // Host UI
  useEffect(() => {
    const url = new URL('/api/waiting-room/hosts', window.location.origin)
    url.searchParams.append('roomName', roomInfo.name)

    const es = new EventSource(url)
    es.onmessage = (e: MessageEvent<string>) => {
      const { status, participantName, participants }: HostMessage = JSON.parse(e.data)

      // prettier-ignore
      switch (status) {
        case 'initial-waiting': return setPending(participants)
        case 'new-waiting':     return setPending((prev) => [...prev, participantName])
        case 'cancel-waiting':  return setPending((prev) => prev.filter((p) => p !== participantName))
      }
    }

    return () => es.close()
  }, [roomInfo.name])

  async function handleParticipant(key: string, name: string, status: 'accepted' | 'rejected') {
    try {
      const url = new URL('/api/waiting-room/hosts', window.location.origin)

      setLoadingId((prev) => [...prev, key])
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, name }),
      })
    } catch (e) {
      console.log('Failed to accept/reject:', e)
    } finally {
      setLoadingId((prev) => prev.filter((id) => id !== key))
    }
  }

  return (
    <div>
      {!!pendingParticipant.length && (
        <div>
          <h3>Pending</h3>
          <ul>
            {pendingParticipant.map(({ key, name }) => (
              <li key={key} className='flex items-center justify-between'>
                <p>{name}</p>
                <button
                  className='text-destructive disabled:opacity-40'
                  disabled={loadingId.includes(key)}
                  onClick={() => handleParticipant(key, name, 'rejected')}
                >
                  Tolak
                </button>
                <button
                  className='disabled:opacity-40'
                  disabled={loadingId.includes(key)}
                  onClick={() => handleParticipant(key, name, 'accepted')}
                >
                  Terima
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div>
        <h3>Semua</h3>
        <ul>
          {mergedParticipant.map(({ identity, ...participant }) => (
            <li key={identity}>
              <p>{participant.name}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

'use client'

import type { FC } from 'react'
import type { RemoteParticipant } from 'livekit-client'
import type { ScreenID } from '@/feat/Room'
import { memo, useEffect, useEffectEvent } from 'react'
import { RoomEvent } from 'livekit-client'
import { useRoomContext } from '@livekit/components-react'
import { decoder, encoder, loginfo } from '@/lib/utils'
import { useRoomState } from '@/feat/Room'
import { LiveKitAction } from '@/feat/enum'

interface SnapshotRequest {
  action: LiveKitAction.SnapshotRequest
  topic: ScreenID
}

interface SnapshotReply {
  action: LiveKitAction.SnapshotReply
  topic: ScreenID
  payload: unknown
}

// getSnapshot → host provide current snapshot data (e.g. all shapes)
// applySnapshot → newcomer accepts and applies snapshot
interface SnapshotOptions<T> {
  getSnapshot: () => T
  applySnapshot: (payload: T) => void
}

type UseSnapshotOptions<T> = () => SnapshotOptions<T>

type SnapshotMessage = SnapshotRequest | SnapshotReply

const encode = (msg: SnapshotMessage) => encoder.encode(JSON.stringify(msg))
const decode = (data: Uint8Array) => JSON.parse(decoder.decode(data)) as SnapshotMessage

export const withSnapshot = <T, R extends object>(
  code: ScreenID,
  Comp: FC<R>,
  useOptions: UseSnapshotOptions<T>
) => {
  const MemoizedComponent = memo(Comp)
  const Component: FC<R> = (props) => {
    const { screen } = useRoomState()
    const room = useRoomContext()
    const isHost = screen?.host === room.localParticipant.identity
    const { getSnapshot, applySnapshot } = useOptions()

    // Newcomer: request snapshot to host while screen is active
    const requestSnapshot = useEffectEvent((current: typeof screen) => {
      if (!current || isHost) return

      loginfo('Requesting snapshot', { action: LiveKitAction.SnapshotRequest, topic: code })
      room.localParticipant.publishData(
        encode({ action: LiveKitAction.SnapshotRequest, topic: code }),
        { reliable: true, destinationIdentities: [current.host] }
      )
    })

    // Host: reply snapshot to requester
    const replySnapshot = useEffectEvent((identity: string) => {
      if (!isHost) return

      const payload: SnapshotMessage = {
        action: LiveKitAction.SnapshotReply,
        topic: code,
        payload: getSnapshot(),
      }

      loginfo('Replying snapshot', payload)
      room.localParticipant.publishData(encode(payload), {
        reliable: true,
        destinationIdentities: [identity],
      })
    })

    // Newcomer request when first joining / screen changes
    useEffect(() => requestSnapshot(screen), [screen])

    // Listen incoming DataChannel messages
    useEffect(() => {
      const handleData = (data: Uint8Array, participant: RemoteParticipant | undefined) => {
        const message = decode(data)

        if (!participant || message.topic !== code) return

        switch (message.action) {
          // Host get request → send snapshot back
          case LiveKitAction.SnapshotRequest:
            loginfo('Getting snapshot', participant.identity)
            replySnapshot(participant.identity)
            break

          // Newcomer received reply → apply snapshot
          case LiveKitAction.SnapshotReply:
            loginfo('Applying snapshot', message.payload)
            applySnapshot(message.payload as T)
            break
        }
      }

      room.on(RoomEvent.DataReceived, handleData)

      return () => {
        room.off(RoomEvent.DataReceived, handleData)
      }
    }, [applySnapshot, room])

    return <MemoizedComponent {...props} />
  }

  return Component
}

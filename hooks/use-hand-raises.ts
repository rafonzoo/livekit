import type { Room } from 'livekit-client'
import { useState, useEffect } from 'react'
import { RoomEvent } from 'livekit-client'

export interface HandRaiseEventOption {
  action: string
  participantId?: string
  targetParticipantId?: string
}

export function useHandRaises<T extends HandRaiseEventOption>(room: Room) {
  const [handRaises, setHandRaises] = useState<string[]>([])
  const [isHandRaised, setIsHandRaised] = useState(false)

  const handleHandRaise = (attributes: T) => {
    const encoder = new TextEncoder()
    const payload = encoder.encode(JSON.stringify(attributes))

    room.localParticipant
      .publishData(payload, { reliable: true })
      .catch((error) => console.error(`Error when handle "${attributes.action}"`, error))
      .then(() => {
        // This will listened only by you (not anyone in the room)
        // prettier-ignore
        switch (attributes.action) {
          case 'hand_raise': return setIsHandRaised(true)
          case 'lower_hand': return setHandRaises(
            (prev) => prev.filter((sid) => sid !== attributes.targetParticipantId)
          )
        }
      })
  }

  // Sync hand raise from admin
  useEffect(() => {
    room.on(RoomEvent.DataReceived, (payload) => {
      const decoder = new TextDecoder()
      const message: T = JSON.parse(decoder.decode(payload as never))

      // This will listened by everyone in the room
      switch (message.action) {
        case 'hand_raise': {
          return setHandRaises((prev) =>
            Array.from(new Set([...prev, message.participantId ?? ''].filter(Boolean)))
          )
        }

        case 'lower_hand': {
          setHandRaises((prev) => prev.filter((sid) => sid !== message.targetParticipantId))
          setIsHandRaised(false)
          return
        }
      }
    })
  }, [room])

  return { handRaises, isHandRaised, handleHandRaise }
}

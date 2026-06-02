import type {
  DataPacket_Kind,
  DataPublishOptions,
  Encryption_Type,
  RemoteParticipant,
} from 'livekit-client'
import type { LiveKitAction } from '@/feat/enum'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { RoomEvent } from 'livekit-client'
import { useRoomContext } from '@livekit/components-react'
import { decoder, encoder, loginfo } from '@/lib/utils'

export function useDataChannel<P>(
  action: LiveKitAction,
  onMessage: (arg: { payload?: P; participant: RemoteParticipant }) => void
) {
  const room = useRoomContext()
  const [message, setMessage] = useState<P>()

  const handleData = useEffectEvent(
    (
      data: Uint8Array,
      participant?: RemoteParticipant,
      _kind?: DataPacket_Kind,
      _topic?: string,
      _encryptionType?: Encryption_Type
    ) => {
      const { action, payload } = JSON.parse(decoder.decode(data)) as {
        action: LiveKitAction
        payload: P
      }

      if (!participant) return

      if (payload && action === action) {
        loginfo(`Receiving action "${action}"`, payload)
        onMessage({ payload, participant })
      }
    }
  )

  const send = useRef((payload?: P, options?: DataPublishOptions) => {
    setMessage(payload)

    loginfo(`Requesting action "${action}"`, payload)
    room.localParticipant.publishData(encoder.encode(JSON.stringify({ action, payload })), options)
  })

  useEffect(() => {
    room.on(RoomEvent.DataReceived, handleData)
    return () => {
      room.off(RoomEvent.DataReceived, handleData)
    }
  }, [room])

  return { message, send: send.current }
}

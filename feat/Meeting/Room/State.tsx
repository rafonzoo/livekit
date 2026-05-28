'use client'

import type { FC, ReactNode } from 'react'
import type { RemoteParticipant } from 'livekit-client'
import type { ScreenCode } from '@/feat/Meeting/enum'
import { createContext, useContext, useEffect, useState } from 'react'
import { ConnectionState, RoomEvent } from 'livekit-client'
import { useMaybeRoomContext } from '@livekit/components-react'
import { loginfo, num } from '@/lib/utils'
import { ParticipantAttribute } from '@/feat/Meeting/enum'

type ScreenID = Exclude<ScreenCode, ScreenCode.Recording>

interface StateContextProps {
  screen: { id: ScreenID; host: string } | null
  record: string | null
  startActiveScreen: (code: ScreenID) => Promise<void>
  stopActiveScreen: () => Promise<void>
  startRecording: () => Promise<void>
  stopRecording: () => Promise<void>
}

export const StateContext = createContext<StateContextProps>(undefined!)
export const useRoomState = () => useContext(StateContext)

export const RoomState: FC<{ children?: ReactNode }> = ({ children }) => {
  const room = useMaybeRoomContext()
  const [screen, setScreen] = useState<StateContextProps['screen'] | null>(null)
  const [record, setRecord] = useState<StateContextProps['record'] | null>(null)

  const startRecording = async () => {
    if (!room?.localParticipant) return
    await room.localParticipant.setAttributes({
      [ParticipantAttribute.ScreenRecord]: room.localParticipant.sid,
    })
  }

  const stopRecording = async () => {
    if (!room?.localParticipant) return
    await room.localParticipant.setAttributes({
      [ParticipantAttribute.ScreenRecord]: '',
    })
  }

  const startActiveScreen = async (code: ScreenID) => {
    if (!room?.localParticipant) return
    await room.localParticipant.setAttributes({
      [ParticipantAttribute.ScreenActive]: String(code),
      [ParticipantAttribute.ScreenActiveHost]: room.localParticipant.sid,
    })
  }

  const stopActiveScreen = async () => {
    if (!room?.localParticipant) return
    await room.localParticipant.setAttributes({
      [ParticipantAttribute.ScreenActive]: '',
      [ParticipantAttribute.ScreenActiveHost]: '',
    })
  }

  useEffect(() => {
    if (!room) return

    const syncRoomState = () => {
      let newScreen: StateContextProps['screen'] = null
      let newRecord: StateContextProps['record'] = null

      // REMEMBER TO SCAN BOTH LOCALPARTICIPANT + REMOTEPARTICIPAN
      const allParticipants = [
        room.localParticipant,
        ...Array.from(room.remoteParticipants.values()),
      ]

      allParticipants.forEach((participant) => {
        const currentScreen = num(participant.attributes?.[ParticipantAttribute.ScreenActive])
        if (currentScreen) {
          newScreen = { id: currentScreen, host: participant.sid }
        }

        const hostId = participant.attributes?.[ParticipantAttribute.ScreenRecord]
        if (hostId) {
          newRecord = hostId
        }
      })

      setScreen((prev) => {
        const prevId = num(prev?.id)
        const idNow = num(newScreen?.id)
        if (prevId !== idNow) {
          if (!idNow) loginfo(`Active screen ended`)
          else loginfo(`Active screen changed: ${prevId} -> ${idNow}`, newScreen ?? 0)
        }
        return newScreen
      })

      setRecord((prev) => {
        if (prev !== newRecord) {
          if (!newRecord) loginfo(`Recording ended`)
          else loginfo(`Recording started by ${newRecord}`)
        }
        return newRecord
      })
    }

    const handleLeavingHost = ({ attributes, sid }: RemoteParticipant) => {
      const wasScreenHost =
        ParticipantAttribute.ScreenActiveHost in attributes &&
        attributes[ParticipantAttribute.ScreenActiveHost] === sid

      const wasRecordHost =
        ParticipantAttribute.ScreenRecord in attributes &&
        attributes[ParticipantAttribute.ScreenRecord] === sid

      if (wasScreenHost || wasRecordHost) {
        syncRoomState()
      }
    }

    room.on(RoomEvent.Connected, syncRoomState)
    room.on(RoomEvent.LocalTrackPublished, syncRoomState)
    room.on(RoomEvent.ParticipantAttributesChanged, syncRoomState)
    room.on(RoomEvent.ParticipantDisconnected, handleLeavingHost)

    return () => {
      room.off(RoomEvent.Connected, syncRoomState)
      room.off(RoomEvent.LocalTrackPublished, syncRoomState)
      room.off(RoomEvent.ParticipantAttributesChanged, syncRoomState)
      room.off(RoomEvent.ParticipantDisconnected, handleLeavingHost)

      if (room.state === ConnectionState.Connected) {
        room.disconnect()
      }
    }
  }, [room])

  return (
    <StateContext.Provider
      value={{ screen, record, startRecording, stopRecording, startActiveScreen, stopActiveScreen }}
    >
      {children}
    </StateContext.Provider>
  )
}

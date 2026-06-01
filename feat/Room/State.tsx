'use client'

import type { Editor } from 'tldraw'
import type { FC, ReactNode, RefObject } from 'react'
import type { RemoteParticipant } from 'livekit-client'
import type { ScreenCode } from '@/feat/enum'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { RoomEvent } from 'livekit-client'
import { useMaybeRoomContext } from '@livekit/components-react'
import { loginfo, num } from '@/lib/utils'
import { ParticipantAttribute } from '@/feat/enum'

export type ScreenID = Exclude<ScreenCode, ScreenCode.Recording>

export interface PresentationContext {
  getSnapshot: () => number
  loadSnapshot: (page: number) => void
}

export interface ScreenMessage {
  id: ScreenID
  host: string
  url?: string
}

export interface StateContextProps {
  screen: ScreenMessage | null
  record: string | null
  editorRef: RefObject<Editor | null>
  viewerRef: RefObject<PresentationContext>
  isHost: boolean
  startActiveScreen: (code: ScreenID, url?: string) => Promise<void>
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
  const editorRef = useRef<Editor | null>(null)
  const isHost = room?.localParticipant.identity === screen?.host
  const viewerRef = useRef<PresentationContext>({
    getSnapshot: () => 1,
    loadSnapshot: () => void 0,
  })

  const startRecording = async () => {
    if (!room?.localParticipant) return
    await room.localParticipant.setAttributes({
      [ParticipantAttribute.ScreenRecord]: room.localParticipant.identity,
    })
  }

  const stopRecording = async () => {
    if (!room?.localParticipant) return
    await room.localParticipant.setAttributes({
      [ParticipantAttribute.ScreenRecord]: '',
    })
  }

  const startActiveScreen = async (code: ScreenID, url?: string) => {
    if (!room?.localParticipant) return
    await room.localParticipant.setAttributes({
      [ParticipantAttribute.ScreenActive]: String(code),
      [ParticipantAttribute.ScreenActiveHost]: room.localParticipant.identity,
      ...(url ? { [ParticipantAttribute.ScreenActiveUrl]: url } : {}),
    })
  }

  const stopActiveScreen = async () => {
    if (!room?.localParticipant) return
    await room.localParticipant.setAttributes({
      [ParticipantAttribute.ScreenActive]: '',
      [ParticipantAttribute.ScreenActiveHost]: '',
      [ParticipantAttribute.ScreenActiveUrl]: '',
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
        const url = participant.attributes?.[ParticipantAttribute.ScreenActiveUrl]

        if (currentScreen) {
          const payload = { id: currentScreen, host: participant.identity }
          newScreen = url ? { ...payload, url } : payload
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

    const handleLeavingHost = ({ attributes, identity }: RemoteParticipant) => {
      const wasScreenHost =
        ParticipantAttribute.ScreenActiveHost in attributes &&
        attributes[ParticipantAttribute.ScreenActiveHost] === identity

      const wasRecordHost =
        ParticipantAttribute.ScreenRecord in attributes &&
        attributes[ParticipantAttribute.ScreenRecord] === identity

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
    }
  }, [room])

  return (
    <StateContext.Provider
      value={{
        screen,
        record,
        isHost,
        editorRef,
        viewerRef,
        startRecording,
        stopRecording,
        startActiveScreen,
        stopActiveScreen,
      }}
    >
      {children}
    </StateContext.Provider>
  )
}

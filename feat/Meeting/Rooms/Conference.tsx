'use client'

import type { FC, ReactNode } from 'react'
import type {
  RoomOptions,
  TrackPublishDefaults,
  VideoCaptureOptions,
  VideoCodec,
} from 'livekit-client'
import type { LocalUserChoices } from '@livekit/components-react'
import type { ConnectionDetails } from '@/feat/Meeting/types'
import { useEffect, useRef } from 'react'
import { ConnectionState, MediaDeviceFailure, Room, RoomEvent, VideoPresets } from 'livekit-client'
import { RoomContext } from '@livekit/components-react'
import { useParamsState } from '@/hooks/use-params-state'
import { RoomsLiveKit } from '@/feat/Meeting/Rooms/LiveKit'

export interface RoomsConferenceProps {
  children?: ReactNode
  userChoices: LocalUserChoices
  connectionDetails: ConnectionDetails
  options: {
    hq: boolean
    codec: VideoCodec
    singlePeerConnection: boolean
  }
}

export const RoomsConference: FC<RoomsConferenceProps> = ({ children, ...props }) => {
  const propsRef = useRef(props)
  const roomOptions = useRef((): RoomOptions => {
    const { current } = propsRef
    const videoCodec: VideoCodec | undefined = current.options.codec ?? 'vp9'
    const videoCaptureDefaults: VideoCaptureOptions = {
      deviceId: current.userChoices.videoDeviceId ?? undefined,
      resolution: current.options.hq ? VideoPresets.h2160 : VideoPresets.h720,
    }
    const publishDefaults: TrackPublishDefaults = {
      dtx: false,
      videoSimulcastLayers: current.options.hq
        ? [VideoPresets.h1080, VideoPresets.h720]
        : [VideoPresets.h540, VideoPresets.h216],
      red: true,
      videoCodec,
    }

    return {
      videoCaptureDefaults: videoCaptureDefaults,
      publishDefaults: publishDefaults,
      audioCaptureDefaults: {
        deviceId: current.userChoices.audioDeviceId ?? undefined,
      },
      adaptiveStream: true,
      dynacast: true,
      singlePeerConnection: current.options.singlePeerConnection,
    }
  })

  const room = useRef(new Room(roomOptions.current()))
  const { params, goTo } = useParamsState<{ name: string }>()
  const roomEvent = useRef({
    leave: () => goTo(params.name),
    error: (err: unknown) => {
      console.error(err)

      alert(
        `Encountered an unexpected error, check the console logs for details: ${(err as Error).message}`
      )
    },
  })

  useEffect(() => {
    const { serverUrl, participantToken } = propsRef.current.connectionDetails
    const { localParticipant } = room.current
    const { leave, error } = roomEvent.current
    const currentRoom = room.current

    currentRoom.on(RoomEvent.Disconnected, leave)
    currentRoom.on(RoomEvent.MediaDevicesError, error)

    currentRoom.on(RoomEvent.MediaDevicesError, (error) => {
      const failure = MediaDeviceFailure.getFailure(error)

      if (failure === MediaDeviceFailure.PermissionDenied) {
        console.log('User disallowed access to the capturing device.')
      } else if (failure === MediaDeviceFailure.NotFound) {
        console.log('The requested device is unavailable.')
      }
    })

    currentRoom.connect(serverUrl, participantToken, { autoSubscribe: true }).catch(error)

    if (propsRef.current.userChoices.videoEnabled) {
      localParticipant.setCameraEnabled(true).catch(error)
    }

    if (propsRef.current.userChoices.audioEnabled) {
      localParticipant.setMicrophoneEnabled(true).catch(error)
    }

    return () => {
      currentRoom.off(RoomEvent.Disconnected, leave)
      currentRoom.off(RoomEvent.MediaDevicesError, error)

      if (currentRoom.state === ConnectionState.Connected) {
        currentRoom.disconnect()
      }
    }
  }, [])

  return (
    <RoomContext.Provider value={room.current}>
      <RoomsLiveKit>{children}</RoomsLiveKit>
    </RoomContext.Provider>
  )
}

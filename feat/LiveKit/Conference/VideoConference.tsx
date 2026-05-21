'use client'

import type { FC } from 'react'
import type {
  RoomOptions,
  TrackPublishDefaults,
  VideoCaptureOptions,
  VideoCodec,
} from 'livekit-client'
import type { LocalUserChoices } from '@livekit/components-react'
import type { ConnectionDetails } from '@/feat/LiveKit/types'
import { useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ConnectionState, MediaDeviceFailure, Room, RoomEvent, VideoPresets } from 'livekit-client'
import { formatChatMessageLinks, RoomContext } from '@livekit/components-react'
import { VideoConferenceLive } from '@/feat/LiveKit/Conference/VideoConferenceLive'

interface VideoConferenceProps {
  userChoices: LocalUserChoices
  connectionDetails: ConnectionDetails
  options: {
    hq: boolean
    codec: VideoCodec
    singlePeerConnection: boolean
  }
}

export const VideoConference: FC<VideoConferenceProps> = (props) => {
  const propsRef = useRef(props)
  const params: { name: string } = useParams()
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

  const router = useRouter()
  const room = useRef(new Room(roomOptions.current()))
  const roomEvent = useRef({
    leave: () => router.push(`/?from=${params.name}`),
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
      console.log(error)
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
    <div data-lk-theme='default' className='fixed inset-0'>
      <div className='lk-room-container'>
        <RoomContext.Provider value={room.current}>
          {/* <KeyboardShortcuts /> */}
          <VideoConferenceLive
            chatMessageFormatter={formatChatMessageLinks}
            // SettingsComponent={SHOW_SETTINGS_MENU ? SettingsMenu : undefined}
          />
          {/* <DebugMode />
        <RecordingIndicator /> */}
        </RoomContext.Provider>
      </div>
    </div>
  )
}

'use client'

import type { FC, ReactNode } from 'react'
import type { CameraResolution } from '@/feat/enum'
import { useEffect, useState } from 'react'
import { ConnectionState, Track, VideoPresets } from 'livekit-client'
import { CheckIcon, PhoneSlashIcon } from '@phosphor-icons/react'
import {
  CameraIcon,
  CameraDisabledIcon,
  MicDisabledIcon,
  MicIcon,
  useRoomContext,
  useConnectionState,
  useLocalParticipant,
  usePersistentUserChoices,
  useTracks,
} from '@livekit/components-react'
import { cn } from '@/lib/utils'
import { CameraResolutionOptions } from '@/feat/const'
import { ToggleTrack } from '@/components/ToggleTrack'
// import { ReactionIcon } from '@/components/ReactionIcon'
import { HugeIcon, ChevronUp } from '@/components/HugeIcon'
import { HandRaisedIcon } from '@/components/HandRaised'
import { ButtonIcon } from '@/components/Button'

const useControls = () => {
  const { localParticipant } = useLocalParticipant()
  const { userChoices, saveVideoInputEnabled, saveAudioInputEnabled } = usePersistentUserChoices()
  const [activeState, setActiveState] = useState<'camera' | 'reaction' | ''>('')
  const [audioEnabled, setAudioEnabled] = useState(userChoices.audioEnabled)
  const [videoEnabled, setVideoEnabled] = useState(userChoices.videoEnabled)
  const [resolution, setResolution] = useState(VideoPresets.h720.resolution)
  const [maxResolution, setMaxResolution] = useState<number>(Infinity)
  const room = useRoomContext()
  const state = useConnectionState(room)
  const isConnecting = state === ConnectionState.Connecting
  const isCameraActive = activeState === 'camera'
  const disconnect = room.disconnect

  // Remote track
  const cameraTrack = useTracks([Track.Source.Camera])
  const track = cameraTrack.find(({ participant: { identity } }) => identity === localParticipant.identity) // prettier-ignore
  const chevronEnable = !(!track || !videoEnabled)

  // Resolution option
  const resolutionOptions = CameraResolutionOptions.map((option) => ({
    ...option,
    disabled: !track || option.value > maxResolution,
  }))

  // Sync storage, for prejoin
  useEffect(() => saveVideoInputEnabled(videoEnabled), [saveVideoInputEnabled, videoEnabled])
  useEffect(() => saveAudioInputEnabled(audioEnabled), [saveAudioInputEnabled, audioEnabled])

  // Sync active state
  useEffect(
    () => (!videoEnabled ? setActiveState((prev) => (prev === 'camera' ? '' : prev)) : void 0),
    [videoEnabled]
  )

  // Sync video camera by its resolution
  useEffect(
    () => void localParticipant.setCameraEnabled(videoEnabled, { resolution }),
    [localParticipant, videoEnabled, resolution]
  )

  // Sync max resolution by media stream video
  useEffect(() => {
    const stream = track?.publication.track?.mediaStreamTrack
    if (stream?.id) {
      const max = Math.max(
        stream.getCapabilities().height?.max ?? -1,
        stream.getSettings().height ?? -1
      )

      if (max > 0) setMaxResolution(max)
    }
  }, [track])

  async function changeResolution(quality: CameraResolution) {
    const localTrack = localParticipant?.getTrackPublication(Track.Source.Camera)?.videoTrack
    const preset = VideoPresets[`h${quality}` as keyof typeof VideoPresets]
    if (!localTrack || !preset) return

    try {
      await localTrack.restartTrack({ resolution: preset.resolution })
      setResolution(preset.resolution)
    } catch (error) {
      console.error('Gagal mengubah resolusi kamera:', error)
    }
  }

  return {
    isConnecting,
    isCameraActive,
    chevronEnable,
    audioEnabled,
    videoEnabled,
    resolution,
    maxResolution,
    resolutionOptions,
    disconnect,
    changeResolution,
    setAudioEnabled,
    setVideoEnabled,
    setActiveState,
    setResolution,
    setMaxResolution,
  }
}

export const RoomControl: FC<{ children?: ReactNode }> = ({ children }) => {
  const {
    chevronEnable,
    isConnecting,
    audioEnabled,
    videoEnabled,
    resolution,
    resolutionOptions,
    isCameraActive,
    disconnect,
    changeResolution,
    setAudioEnabled,
    setVideoEnabled,
    setActiveState,
  } = useControls()

  if (isConnecting) {
    return null
  }

  return (
    <div className='bg-background flex items-center justify-center gap-2 rounded-md border px-1 py-2 shadow *:not-[div]:size-10 md:*:not-[div]:size-12 xl:min-h-28 xl:gap-4 xl:px-5 xl:py-6'>
      <ToggleTrack
        title={audioEnabled ? 'Bisukan mikrofon' : 'Aktifkan mikrofon'}
        isActive={audioEnabled}
        className='size-10 md:size-12'
        onClick={() => setAudioEnabled((prev) => !prev)}
      >
        {audioEnabled ? <MicIcon /> : <MicDisabledIcon />}
      </ToggleTrack>
      <div className='dark:bg-primary/50 flex items-center gap-1 rounded-full bg-red-200 p-1'>
        <div className='relative inline-block'>
          {isCameraActive && (
            <div className='absolute bottom-full left-1/2 mb-3 w-56 -translate-x-1/2 rounded-xl bg-white p-1.5 shadow-xl ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-white/10'>
              <div className='px-3 py-1.5 text-[11px] font-semibold tracking-wider text-gray-400 uppercase'>
                Camera Quality
              </div>
              <div className='mt-1 space-y-0.5'>
                {resolutionOptions.map(({ disabled, ...option }) => (
                  <button
                    key={option.value}
                    disabled={disabled}
                    onClick={() => changeResolution(option.value)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      disabled
                        ? 'cursor-not-allowed text-gray-400 opacity-40 dark:text-zinc-600'
                        : resolution.height === option.value
                          ? 'bg-gray-100 font-medium text-gray-900 dark:bg-zinc-800 dark:text-white'
                          : 'text-gray-700 hover:bg-gray-50 dark:text-zinc-300 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <span>
                      {option.label}{' '}
                      {disabled && (
                        <span className='text-[10px] font-normal text-red-500'>
                          (Tidak didukung)
                        </span>
                      )}
                    </span>
                    {resolution.height === option.value && !disabled && (
                      <CheckIcon className='size-4 text-gray-900 dark:text-white' weight='bold' />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className='dark:bg-primary/50 flex items-center gap-1 rounded-full bg-red-200 p-1'>
            <ToggleTrack
              title={videoEnabled ? 'Tutup kamera' : 'Aktifkan kamera'}
              isActive={videoEnabled}
              onClick={() => setVideoEnabled((prev) => !prev)}
              className='size-8 md:size-10'
            >
              {videoEnabled ? <CameraIcon /> : <CameraDisabledIcon />}
            </ToggleTrack>
            <button
              disabled={!chevronEnable}
              inert={!chevronEnable}
              onClick={() => setActiveState((prev) => (!prev || prev !== 'camera' ? 'camera' : ''))}
              className={cn(
                'dark:hover:bg-primary/50 relative inline-flex size-8 items-center justify-center rounded-full transition-transform duration-200 hover:bg-red-300 md:size-10',
                isCameraActive ? 'rotate-180' : '',
                !chevronEnable ? 'cursor-not-allowed opacity-40' : ''
              )}
            >
              <HugeIcon icon={ChevronUp} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
      {/* <ButtonIcon isActive={!shareScreenEnabled} onClick={handleToggleShareScreen}>
        <MonitorPlayIcon weight='fill' size={22} />
      </ButtonIcon> */}
      {/* <ReactionIcon
        isOpen={isReactionActive}
        onClick={() => setActiveState((prev) => (!prev || prev !== 'reaction' ? 'reaction' : ''))}
      /> */}
      <HandRaisedIcon />
      {children}
      <ButtonIcon onClick={() => disconnect()} className='text-error bg-red-200 hover:bg-red-200!'>
        <PhoneSlashIcon weight='fill' size={20} />
      </ButtonIcon>
    </div>
  )
}

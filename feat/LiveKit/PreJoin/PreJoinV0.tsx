'use client'

import type { FC, MouseEvent } from 'react'
import type { LocalUserChoices, PreJoinProps as PrejoinPropsBase } from '@livekit/components-react'
import { useEffect, useRef, useState } from 'react'
import { Loader } from 'lucide-react'
import { facingModeFromLocalTrack, Track } from 'livekit-client'
import {
  CameraDisabledIcon,
  CameraIcon,
  Chevron,
  MediaDeviceMenu,
  MicIcon,
  TrackToggle,
  usePersistentUserChoices,
  usePreviewTracks,
} from '@livekit/components-react'
import { log } from '@livekit/components-core'
import { cn } from '@/lib/utils'

interface PreJoinProps extends PrejoinPropsBase {
  camOffLabel?: string
  roomTitle?: string
  roomIntro?: string
  pageTitle?: string
  cancelLabel?: string
  rolesLabel?: string
  roleName?: string
  isLoading?: boolean
  isLoadingLabel?: string
}

export const PreJoin: FC<PreJoinProps> = ({
  defaults = {},
  onValidate,
  onSubmit,
  onError,
  debug: _debug,
  isLoading = false,
  isLoadingLabel = 'Menghubungkan...',
  pageTitle = 'MEET',
  roomTitle = 'Test Room',
  roomIntro = 'Siap untuk bergabung?',
  joinLabel = 'Masuk Ruang Rapat',
  micLabel = 'Mikrofon utama',
  camLabel = 'Kamera utama',
  camOffLabel = 'Kamera mati',
  userLabel: _userLabel = 'Username',
  cancelLabel = 'Batal',
  rolesLabel = 'Bergabung sebagai',
  roleName = 'Super Admin',
  persistUserChoices = true,
  videoProcessor,
  ...wrapperProps
}) => {
  const {
    userChoices: initialUserChoices,
    saveAudioInputDeviceId,
    saveAudioInputEnabled,
    saveVideoInputDeviceId,
    saveVideoInputEnabled,
    saveUsername,
  } = usePersistentUserChoices({
    defaults,
    preventSave: !persistUserChoices,
    preventLoad: !persistUserChoices,
  })

  // Initialize device settings
  const [userChoices, setUserChoices] = useState(initialUserChoices)
  const [audioEnabled, setAudioEnabled] = useState(userChoices.audioEnabled)
  const [videoEnabled, setVideoEnabled] = useState(userChoices.videoEnabled)
  const [audioDeviceId, setAudioDeviceId] = useState(userChoices.audioDeviceId)
  const [videoDeviceId, setVideoDeviceId] = useState(userChoices.videoDeviceId)
  const [username] = useState(userChoices.username)

  const tracks = usePreviewTracks(
    {
      audio: audioEnabled ? { deviceId: initialUserChoices.audioDeviceId } : false,
      video: videoEnabled
        ? {
            deviceId: initialUserChoices.videoDeviceId,
            processor: videoProcessor,
          }
        : false,
    },
    (e) => {
      onError?.(e)
    }
  )

  const videoEl = useRef(null)
  const videoTrack = tracks?.find((track) => track.kind === Track.Kind.Video)
  const audioTrack = tracks?.find((track) => track.kind === Track.Kind.Audio)
  const facingMode = !videoTrack ? 'undefined' : facingModeFromLocalTrack(videoTrack)?.facingMode

  const [, setIsValid] = useState<boolean>()
  const handleValidation = useRef((values: LocalUserChoices) => {
    if (typeof onValidate === 'function') {
      return onValidate(values)
    } else {
      return values.username !== ''
    }
  })

  // Save user choices to persistent storage.
  useEffect(() => saveAudioInputEnabled(audioEnabled), [audioEnabled, saveAudioInputEnabled])
  useEffect(() => saveVideoInputEnabled(videoEnabled), [videoEnabled, saveVideoInputEnabled])
  useEffect(() => saveAudioInputDeviceId(audioDeviceId), [audioDeviceId, saveAudioInputDeviceId])
  useEffect(() => saveVideoInputDeviceId(videoDeviceId), [videoDeviceId, saveVideoInputDeviceId])
  useEffect(() => saveUsername(username), [username, saveUsername])
  useEffect(() => {
    if (videoEl.current && videoTrack) {
      videoTrack.unmute()
      videoTrack.attach(videoEl.current)
    }

    return () => {
      videoTrack?.detach()
    }
  }, [videoTrack])

  useEffect(() => {
    const newUserChoices = {
      username,
      videoEnabled,
      videoDeviceId,
      audioEnabled,
      audioDeviceId,
    }
    setUserChoices(newUserChoices)
    setIsValid(handleValidation.current(newUserChoices))
  }, [username, videoEnabled, audioEnabled, audioDeviceId, videoDeviceId])

  function handleSubmit(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()

    if (handleValidation.current(userChoices)) {
      return onSubmit?.(userChoices)
    }

    log.warn('Validation failed with: ', userChoices)
  }

  return (
    <div {...wrapperProps} className='h-full min-h-screen py-10'>
      <div className='fixed inset-0 bg-black'></div>
      <div className='relative mx-auto w-125 max-w-[87.5%]'>
        <h2 className='mb-6 text-center text-[48px] leading-12 font-semibold text-white'>
          {pageTitle}
        </h2>
        <div className='bg-background flex flex-col gap-4 rounded-md p-8 text-sm'>
          <header className='text-center'>
            <p className='text-primary text-2xl font-semibold'>{roomIntro}</p>
            <p className='mt-2'>{roomTitle}</p>
          </header>
          <div className='bg-secondary relative aspect-video w-full overflow-hidden rounded-md'>
            <div className='absolute inset-0 flex flex-col items-center justify-end p-4'>
              {videoTrack && (
                <video
                  ref={videoEl}
                  width='1280'
                  height='720'
                  data-facing-mode={facingMode}
                  className='absolute inset-0 bg-cover data-[facing-mode=user]:rotate-y-180'
                />
              )}
              {(!videoTrack || !videoEnabled) && (
                <div className='text-muted-foreground absolute inset-0 flex flex-col items-center justify-center'>
                  <CameraDisabledIcon className='scale-[2]' />
                  <p className='mt-5 text-base font-semibold'>{camOffLabel}</p>
                </div>
              )}
              <div className='relative flex gap-3 overflow-hidden rounded-full bg-white p-1 *:flex *:size-10 *:items-center *:justify-center *:rounded-full'>
                <div className='bg-primary/20 absolute inset-0 h-auto! w-auto!' />
                <TrackToggle
                  initialState={audioEnabled}
                  source={Track.Source.Microphone}
                  onChange={(enabled) => setAudioEnabled(enabled)}
                  className={cn(
                    'bg-primary text-primary-foreground relative',
                    'data-[lk-enabled=true]:bg-background data-[lk-enabled=true]:text-primary data-[lk-enabled=true]:border-muted-foreground data-[lk-enabled=true]:border'
                  )}
                />
                <TrackToggle
                  initialState={videoEnabled}
                  source={Track.Source.Camera}
                  onChange={(enabled) => setVideoEnabled(enabled)}
                  className={cn(
                    'bg-primary text-primary-foreground relative',
                    'data-[lk-enabled=true]:bg-background data-[lk-enabled=true]:text-primary data-[lk-enabled=true]:border-muted-foreground data-[lk-enabled=true]:border'
                  )}
                />
              </div>
            </div>
          </div>
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <div className='flex flex-col gap-2'>
              <p>Mikrofon</p>
              <div className='h-11 rounded-md border'>
                <MediaDeviceMenu
                  initialSelection={audioDeviceId}
                  kind='audioinput'
                  disabled={!audioTrack || !audioEnabled}
                  tracks={{ audioinput: audioTrack }}
                  onActiveDeviceChange={(_, id) => setAudioDeviceId(id)}
                  className={cn(
                    'inline-flex h-11 w-full items-center justify-between rounded-md px-3 disabled:opacity-40',
                    '[&+*]:bg-background [&+*]:absolute [&+*]:z-1 [&+*]:w-max [&+*]:min-w-40 [&+*]:rounded-md [&+*]:p-2 [&+*]:shadow-lg',
                    '[&+*>ul>li:not(:first-child)]:hover:bg-secondary [&+*_button]:h-10 [&+*_button]:w-full [&+*_button]:px-4 [&+*_button]:text-left [&+*>ul>li]:overflow-hidden [&+*>ul>li]:rounded-md [&+*>ul>li:not(:first-child)]:mt-1',
                    '[&+*_[data-lk-active="true"]>button]:bg-primary [&+*_[data-lk-active="true"]>button]:text-primary-foreground [&+*_[data-lk-active="true"]>button]:font-semibold'
                  )}
                >
                  <div className='flex items-center gap-3'>
                    <MicIcon />
                    {micLabel}
                  </div>
                  <Chevron />
                </MediaDeviceMenu>
              </div>
            </div>
            <div className='flex flex-col gap-2'>
              <p>Kamera</p>
              <div className='h-11 rounded-md border'>
                <MediaDeviceMenu
                  initialSelection={videoDeviceId}
                  kind='videoinput'
                  disabled={!videoTrack || !videoEnabled}
                  tracks={{ videoinput: videoTrack }}
                  onActiveDeviceChange={(_, id) => setVideoDeviceId(id)}
                  className={cn(
                    'inline-flex h-11 w-full items-center justify-between rounded-md px-3 disabled:opacity-40',
                    '[&+*]:bg-background [&+*]:absolute [&+*]:z-1 [&+*]:w-max [&+*]:min-w-40 [&+*]:rounded-md [&+*]:p-2 [&+*]:shadow-lg',
                    '[&+*>ul>li:not(:first-child)]:hover:bg-secondary [&+*_button]:h-10 [&+*_button]:w-full [&+*_button]:px-4 [&+*_button]:text-left [&+*>ul>li]:overflow-hidden [&+*>ul>li]:rounded-md [&+*>ul>li:not(:first-child)]:mt-1',
                    '[&+*_[data-lk-active="true"]>button]:bg-primary [&+*_[data-lk-active="true"]>button]:text-primary-foreground [&+*_[data-lk-active="true"]>button]:font-semibold'
                  )}
                >
                  <div className='flex items-center gap-3'>
                    <CameraIcon />
                    {camLabel}
                  </div>
                  <Chevron />
                </MediaDeviceMenu>
              </div>
            </div>
          </div>
          <div className='flex items-center justify-center gap-2.5'>
            <p className='text-right'>{rolesLabel}</p>
            <span className='border-primary text-primary rounded-full border p-3 whitespace-nowrap'>
              {roleName}
            </span>
          </div>
          <div className='grid grid-cols-1 gap-3'>
            <button
              type='button'
              className='bg-primary text-primary-foreground inline-flex h-11 items-center justify-center rounded-md px-4 font-semibold disabled:opacity-40'
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader size={20} className='animate-spin' />
                  {isLoadingLabel && <span className='ml-2 inline-block'>{isLoadingLabel}</span>}
                </>
              ) : (
                joinLabel
              )}
            </button>
            <button
              type='button'
              className='border-muted-foreground inline-flex h-11 items-center justify-center rounded-md border px-4 font-semibold'
            >
              {cancelLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

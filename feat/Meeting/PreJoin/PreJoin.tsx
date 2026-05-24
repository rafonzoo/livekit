'use client'

import type { FC, MouseEvent } from 'react'
import type { CreateLocalTracksOptions } from 'livekit-client'
import type { LocalUserChoices, PreJoinProps as PrejoinPropsBase } from '@livekit/components-react'
import { useEffect, useRef, useState } from 'react'
import { facingModeFromLocalTrack, Track } from 'livekit-client'
import {
  CameraDisabledIcon,
  CameraIcon,
  Chevron,
  MediaDeviceMenu,
  MicDisabledIcon,
  MicIcon,
  usePersistentUserChoices,
} from '@livekit/components-react'
import { log } from '@livekit/components-core'
import { cn } from '@/lib/utils'
import { ToggleTrack } from '@/feat/Meeting/PreJoin/ToggleTrack'
import { useProgressiveTracks, useTabEffect } from '@/feat/Meeting/hooks'
import { HugeIcon, Alert01FreeIcons, Loading03FreeIcons } from '@/components/HugeIcon'

export interface LocalUserChoicesPassword extends LocalUserChoices {
  password: string
}

export interface PreJoinProps extends Omit<PrejoinPropsBase, 'onSubmit' | 'onValidate'> {
  autoCheck?: boolean
  camOffLabel?: string
  roomTitle?: string
  roomIntro?: string
  pageTitle?: string
  cancelLabel?: string
  rolesLabel?: string
  roleName?: string
  isLoading?: boolean
  isLoadingLabel?: string
  isGuest?: boolean
  withPassword?: boolean
  onSubmit?: (values: LocalUserChoicesPassword) => void
  onValidate?: (values: LocalUserChoicesPassword) => boolean
}

export const PreJoin: FC<PreJoinProps> = ({
  defaults = {},
  onValidate,
  onSubmit,
  onError,
  debug: _debug,
  autoCheck = false,
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
  isGuest = false,
  withPassword = false,
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
  } = usePersistentUserChoices({
    defaults: { ...defaults, username: isGuest ? '' : (defaults.username ?? '') },
    preventSave: !persistUserChoices,
    preventLoad: !persistUserChoices,
  })

  // Initialize device settings
  const [userChoices, setUserChoices] = useState(initialUserChoices)
  const [audioEnabled, setAudioEnabled] = useState(userChoices.audioEnabled)
  const [videoEnabled, setVideoEnabled] = useState(userChoices.videoEnabled)
  const [audioDeviceId, setAudioDeviceId] = useState(userChoices.audioDeviceId)
  const [videoDeviceId, setVideoDeviceId] = useState(userChoices.videoDeviceId)
  const [deniedDevices, setDeniedDevices] = useState<string[]>([])
  const [activeAudioLabel, setActiveAudioLabel] = useState(micLabel)
  const [activeVideoLabel, setActiveVideoLabel] = useState(camLabel)
  const [username, setUsername] = useState(userChoices.username)
  const [password, setPassword] = useState('')
  const [isValid, setIsValid] = useState(false)

  // Capture config
  const audioConfig = { deviceId: initialUserChoices.audioDeviceId }
  const videoConfig = {
    deviceId: initialUserChoices.videoDeviceId,
    processor: videoProcessor,
  }

  const [media, setMedia] = useState<CreateLocalTracksOptions>({
    audio: autoCheck ? audioConfig : audioEnabled ? audioConfig : false,
    video: autoCheck ? videoConfig : videoEnabled ? videoConfig : false,
  })

  const formattedLabel = deniedDevices
    .map((media) => media.replace('video', 'kamera').replace('audio', 'mikrofon'))
    .join(' dan ')

  const tracks = useProgressiveTracks(media, (error, errorKind) => {
    setDeniedDevices((prev) => Array.from(new Set([...prev, errorKind])))
    onError?.(error)

    if (errorKind === Track.Kind.Audio) setAudioEnabled(false)
    if (errorKind === Track.Kind.Video) setVideoEnabled(false)
  })

  const videoTrack = tracks?.find((track) => track.kind === Track.Kind.Video)
  const audioTrack = tracks?.find((track) => track.kind === Track.Kind.Audio)
  const facingMode = !videoTrack ? 'undefined' : facingModeFromLocalTrack(videoTrack)?.facingMode
  const videoEl = useRef(null)

  // With ref because its param is already in effect, and `onValidate` might not wrapped in `useCallback`
  const handleValidation = useRef((values: LocalUserChoicesPassword) =>
    (onValidate?.(values) ?? (isGuest && withPassword))
      ? !!values.password && !!values.username.trim()
      : withPassword
        ? !!values.password
        : !!values.username.trim()
  )

  const handleSubmit = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()

    if (handleValidation.current({ ...userChoices, password })) {
      return onSubmit?.({ ...userChoices, password })
    }

    log.warn('Validation failed with: ', userChoices)
  }

  const handleToggleAudio = () => {
    setAudioEnabled((v) => !v)

    if (!audioEnabled) {
      setMedia((prev) => ({
        ...prev,
        audio: { deviceId: audioDeviceId },
      }))
    } else {
      setMedia((prev) => ({ ...prev, audio: false }))
    }
  }

  const handleToggleVideo = () => {
    setVideoEnabled((v) => !v)

    if (!videoEnabled) {
      setMedia((prev) => ({
        ...prev,
        video: {
          deviceId: videoDeviceId,
          processor: videoProcessor,
        },
      }))
    } else {
      setMedia((prev) => ({ ...prev, video: false }))
    }
  }

  // Save user choices to persistent storage.
  useEffect(() => saveAudioInputEnabled(audioEnabled), [audioEnabled, saveAudioInputEnabled])
  useEffect(() => saveVideoInputEnabled(videoEnabled), [videoEnabled, saveVideoInputEnabled])
  useEffect(() => saveAudioInputDeviceId(audioDeviceId), [audioDeviceId, saveAudioInputDeviceId])
  useEffect(() => saveVideoInputDeviceId(videoDeviceId), [videoDeviceId, saveVideoInputDeviceId])

  // Sync choices
  useEffect(() => {
    const newUserChoices = {
      username,
      videoEnabled,
      videoDeviceId,
      audioEnabled,
      audioDeviceId,
    }
    setUserChoices(newUserChoices)
    setIsValid(handleValidation.current({ ...newUserChoices, password }))
  }, [username, password, videoEnabled, audioEnabled, audioDeviceId, videoDeviceId])

  // Sync video
  useEffect(() => {
    if (videoEl.current && videoTrack) {
      videoTrack.unmute()
      videoTrack.attach(videoEl.current)
    }

    return () => {
      videoTrack?.detach()
    }
  }, [videoTrack])

  // Sync state based on audio track
  useEffect(() => {
    if (audioTrack) {
      setAudioEnabled((prev) => (!prev ? !!audioTrack : prev))
      setActiveAudioLabel((prev) => audioTrack?.mediaStreamTrack.label ?? prev)
      setDeniedDevices((prev) =>
        !prev.includes(Track.Kind.Audio)
          ? prev
          : prev.filter((previous) => previous !== Track.Kind.Audio)
      )
    }
  }, [audioTrack])

  // Sync state based on audio track
  useEffect(() => {
    if (videoTrack) {
      setVideoEnabled((prev) => (!prev ? !!videoTrack : prev))
      setActiveVideoLabel((prev) => videoTrack?.mediaStreamTrack.label ?? prev)
      setDeniedDevices((prev) =>
        !prev.includes(Track.Kind.Video)
          ? prev
          : prev.filter((previous) => previous !== Track.Kind.Video)
      )
    }
  }, [videoTrack])

  // Handle redirect invalid tabs
  useTabEffect()

  return (
    <main
      {...wrapperProps}
      className={cn(
        'flex h-full min-h-screen w-full items-center justify-center py-10',
        wrapperProps.className
      )}
    >
      <figure className='fixed inset-0'>
        <img
          src='/img/prejoin-background.jpg'
          width={960}
          className='h-full w-full bg-black object-cover brightness-75'
        />
      </figure>
      <div className='relative mx-auto w-125 max-w-[87.5%]'>
        <h2 className='mb-6 text-center text-[48px] leading-12 font-semibold text-white'>
          {pageTitle}
        </h2>
        <div className='bg-background flex flex-col gap-4 rounded-md p-4 pt-8 text-sm md:p-8'>
          <header className='text-center'>
            <p className='text-primary text-2xl font-semibold'>{roomIntro}</p>
            <p className='mt-2'>{roomTitle}</p>
          </header>
          {!!deniedDevices.length && (
            <p className='text-destructive grid grid-cols-[18px_1fr] gap-3 rounded-md bg-red-200 p-4'>
              <HugeIcon icon={Alert01FreeIcons} size={18} />
              Error: Tidak dapat menemukan {formattedLabel}, atau pengguna menolak atas izin akses{' '}
              {formattedLabel}. Silahkan muat ulang halaman ini, atau tutup dan kembali ke halaman
              ini untuk mengaktifkan {formattedLabel}.
            </p>
          )}
          <div className='bg-secondary relative aspect-video min-h-50 w-full overflow-hidden rounded-md'>
            <div className='absolute inset-0 flex flex-col items-center justify-end p-4'>
              <video
                ref={videoEl}
                width='1280'
                height='720'
                data-facing-mode={facingMode}
                className={cn(
                  'absolute inset-0 bg-cover data-[facing-mode=user]:rotate-y-180',
                  (!videoTrack || !videoEnabled) && 'invisible'
                )}
              />
              {(!videoTrack || !videoEnabled) && (
                <div className='text-muted-foreground absolute inset-0 flex flex-col items-center justify-center'>
                  <CameraDisabledIcon className='scale-[2]' />
                  <p className='mt-5 text-base font-semibold'>{camOffLabel}</p>
                </div>
              )}
              <div className='bg-background relative flex gap-1 overflow-hidden rounded-full'>
                <div className='bg-primary/20 absolute inset-0 h-auto! w-auto!' />
                <ToggleTrack
                  title={audioEnabled ? 'Bisukan mikrofon' : 'Aktifkan mikrofon'}
                  isActive={audioEnabled}
                  onClick={handleToggleAudio}
                >
                  {audioEnabled ? <MicIcon /> : <MicDisabledIcon />}
                </ToggleTrack>
                <ToggleTrack
                  title={videoEnabled ? 'Tutup kamera' : 'Aktifkan kamera'}
                  isActive={videoEnabled}
                  onClick={handleToggleVideo}
                >
                  {videoEnabled ? <CameraIcon /> : <CameraDisabledIcon />}
                </ToggleTrack>
              </div>
            </div>
          </div>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div className='flex flex-col gap-2'>
              <p>Mikrofon</p>
              <div id='list-audio' className='h-11 rounded-md border'>
                <MediaDeviceMenu
                  initialSelection={audioDeviceId}
                  kind='audioinput'
                  disabled={!audioTrack || !audioEnabled}
                  tracks={{ audioinput: audioTrack }}
                  onActiveDeviceChange={(_, id) => {
                    setAudioDeviceId(id)
                    setMedia((prev) => ({
                      ...prev,
                      audio:
                        typeof prev.audio === 'object'
                          ? { ...prev.audio, deviceId: id }
                          : prev.audio,
                    }))
                  }}
                  className={cn(
                    'hover:not-disabled:bg-secondary inline-flex h-11 w-full items-center justify-between gap-3 rounded-md px-3 disabled:opacity-40',
                    '[&+*]:bg-background [&+*]:absolute [&+*]:z-1 [&+*]:w-max [&+*]:min-w-40 [&+*]:rounded-md [&+*]:border [&+*]:p-2 [&+*]:shadow-lg',
                    '[&+*>ul>li:not(:first-child)]:hover:not-disabled:bg-secondary [&+*_button]:h-10 [&+*_button]:w-full [&+*_button]:px-4 [&+*_button]:text-left [&+*>ul>li]:overflow-hidden [&+*>ul>li]:rounded-md [&+*>ul>li:not(:first-child)]:mt-1',
                    '[&+*_[data-lk-active="true"]>button]:bg-primary [&+*_[data-lk-active="true"]>button]:text-primary-foreground [&+*_[data-lk-active="true"]>button]:font-semibold'
                  )}
                >
                  <span className='flex items-center gap-2 truncate text-left'>
                    <MicIcon />
                    <span className='block w-full truncate'>{activeAudioLabel}</span>
                  </span>
                  <Chevron />
                </MediaDeviceMenu>
              </div>
            </div>
            <div className='flex flex-col gap-2'>
              <p>Kamera</p>
              <div id='list-video' className='h-11 rounded-md border'>
                <MediaDeviceMenu
                  initialSelection={videoDeviceId}
                  kind='videoinput'
                  disabled={!videoTrack || !videoEnabled}
                  tracks={{ videoinput: videoTrack }}
                  onActiveDeviceChange={(_, id) => {
                    setVideoDeviceId(id)
                    setMedia((prev) => ({
                      ...prev,
                      video:
                        typeof prev.video === 'object'
                          ? { ...prev.video, deviceId: id }
                          : prev.video,
                    }))
                  }}
                  className={cn(
                    'hover:not-disabled:bg-secondary inline-flex h-11 w-full items-center justify-between gap-3 rounded-md px-3 disabled:opacity-40',
                    '[&+*]:bg-background [&+*]:absolute [&+*]:z-1 [&+*]:w-max [&+*]:min-w-40 [&+*]:rounded-md [&+*]:border [&+*]:p-2 [&+*]:shadow-lg',
                    '[&+*>ul>li:not(:first-child)]:hover:not-disabled:bg-secondary [&+*_button]:h-10 [&+*_button]:w-full [&+*_button]:px-4 [&+*_button]:text-left [&+*>ul>li]:overflow-hidden [&+*>ul>li]:rounded-md [&+*>ul>li:not(:first-child)]:mt-1',
                    '[&+*_[data-lk-active="true"]>button]:bg-primary [&+*_[data-lk-active="true"]>button]:text-primary-foreground [&+*_[data-lk-active="true"]>button]:font-semibold'
                  )}
                >
                  <span className='flex items-center gap-2 truncate text-left'>
                    <CameraIcon />
                    <span className='block w-full truncate'>{activeVideoLabel}</span>
                  </span>
                  <Chevron />
                </MediaDeviceMenu>
              </div>
            </div>
          </div>
          <div className='flex items-center justify-center gap-2.5'>
            <p className='text-right'>{rolesLabel}</p>
            <span className='border-primary text-primary rounded-full border p-3 whitespace-nowrap'>
              {isGuest ? 'Tamu' : roleName}
            </span>
          </div>
          <form className='grid grid-cols-1 gap-3'>
            {isGuest && (
              <div className='flex items-center justify-center'>
                <input
                  id='username'
                  name='username'
                  type='text'
                  className='hover:not-disabled:bg-secondary inline-flex h-11 w-full items-center justify-between rounded-md border px-3 text-sm disabled:opacity-40'
                  value={username}
                  required
                  onChange={(e) => setUsername(e.currentTarget.value.trim())}
                  autoComplete='off'
                  placeholder='Masukkan nama'
                />
              </div>
            )}
            {withPassword && (
              <div className='flex items-center justify-center'>
                <input
                  id='password'
                  name='password'
                  type='password'
                  className='hover:not-disabled:bg-secondary inline-flex h-11 w-full items-center justify-between rounded-md border px-3 disabled:opacity-40'
                  required
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete='off'
                  placeholder='Masukkan kata sandi'
                />
              </div>
            )}
            <button
              type='submit'
              className='bg-primary text-primary-foreground inline-flex h-11 items-center justify-center rounded-md px-4 font-semibold hover:bg-red-900 disabled:opacity-40'
              onClick={handleSubmit}
              disabled={!isValid || isLoading}
            >
              {isLoading ? (
                <>
                  <HugeIcon icon={Loading03FreeIcons} size={20} className='animate-spin' />
                  {isLoadingLabel && <span className='ml-2 inline-block'>{isLoadingLabel}</span>}
                </>
              ) : (
                joinLabel
              )}
            </button>
            <button
              type='button'
              className='hover:not-disabled:bg-secondary inline-flex h-11 items-center justify-center rounded-md border px-4 font-semibold shadow'
            >
              {cancelLabel}
            </button>
          </form>
        </div>
        <p className='text-background mt-6 text-center text-sm font-semibold'>
          Dengan bergabung, Anda menyetujui Ketentuan Layanan dan Kebijakan Privasi kami.
        </p>
      </div>
    </main>
  )
}

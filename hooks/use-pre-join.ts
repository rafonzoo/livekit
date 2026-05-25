import type { MouseEvent } from 'react'
import type { CreateLocalTracksOptions } from 'livekit-client'
import type { ToggleSource } from '@livekit/components-core'
import type { LocalUserChoicesPassword, PreJoinProps } from '@/feat/Meeting/PreJoin/PreJoin'
import { useState, useEffect, useRef, useEffectEvent, useMemo } from 'react'
import { Track, facingModeFromLocalTrack } from 'livekit-client'
import { useMaybeRoomContext, usePersistentUserChoices } from '@livekit/components-react'
import { log, setupMediaToggle } from '@livekit/components-core'
import { useProgressiveTrack } from '@/hooks'
import { defaultPrejoin } from '@/feat/Meeting/Tabs/content'

export function usePreJoin(config?: PreJoinProps) {
  const {
    defaults = {},
    onValidate,
    onSubmit,
    onError,
    autoCheck,
    micLabel,
    camLabel,
    isGuest,
    withPassword,
    persistUserChoices,
    videoProcessor,
  } = useMemo(() => ({ ...defaultPrejoin, ...config }), [config])

  const {
    userChoices: initialUserChoices,
    saveAudioInputDeviceId,
    saveAudioInputEnabled,
    saveVideoInputDeviceId,
    saveVideoInputEnabled,
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
  const [deniedDevices, setDeniedDevices] = useState<string[]>([])
  const [activeAudioLabel, setActiveAudioLabel] = useState(micLabel)
  const [activeVideoLabel, setActiveVideoLabel] = useState(camLabel)
  const [username, setUsername] = useState(isGuest ? '' : userChoices.username)
  const [shareScreenEnabled, setShareScreenEnabled] = useState(false)
  const [password, setPassword] = useState('')
  const [isValid, setIsValid] = useState(false)

  // Capture config
  const room = useMaybeRoomContext() /** Undefined in PreJoin */
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

  const tracks = useProgressiveTrack(media, (error, errorKind) => {
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

  const handlePublishTrack = useEffectEvent((source: ToggleSource, enabled: boolean) => {
    if (!room) return

    const shareScreenOption = { audio: true, selfBrowserSurface: 'include' } as const
    const captureOptions = source === Track.Source.ScreenShare ? shareScreenOption : undefined
    const track = setupMediaToggle(source, room, captureOptions, undefined, (error) => {
      if (source === Track.Source.ScreenShare) {
        setShareScreenEnabled(false)
      }
      console.log(`Error when publishing track: `, error)
    })

    track.toggle(enabled)
  })

  const handleSubmit = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()

    if (handleValidation.current({ ...userChoices, password })) {
      return onSubmit?.({ ...userChoices, password })
    }

    log.warn('Validation failed with: ', userChoices)
  }

  const handleToggleAudio = () => {
    setAudioEnabled((prev) => !prev)

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
    setVideoEnabled((prev) => !prev)

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

  const handleToggleShareScreen = () => {
    if (!room) return

    const track = setupMediaToggle(
      Track.Source.ScreenShare,
      room,
      { audio: true, selfBrowserSurface: 'include' },
      undefined,
      (error) => {
        console.log(`Error when publishing track: `, error)
      }
    )

    track.toggle(!shareScreenEnabled).then((result) => setShareScreenEnabled(result ?? false))
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

  // Sync state based on local audio track
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

  // Sync state based on local video track
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

  // Sync published track with local track
  useEffect(() => handlePublishTrack(Track.Source.Microphone, audioEnabled), [audioEnabled])
  useEffect(() => handlePublishTrack(Track.Source.Camera, videoEnabled), [videoEnabled])

  return {
    userChoices,
    audioEnabled,
    videoEnabled,
    audioDeviceId,
    videoDeviceId,
    videoTrack,
    audioTrack,
    shareScreenEnabled,
    deniedDevices,
    activeAudioLabel,
    activeVideoLabel,
    username,
    password,
    isValid,
    formattedLabel,
    facingMode,
    videoEl,
    media,
    setUserChoices,
    setAudioEnabled,
    setVideoEnabled,
    setAudioDeviceId,
    setVideoDeviceId,
    setShareScreenEnabled,
    setDeniedDevices,
    setActiveAudioLabel,
    setActiveVideoLabel,
    setUsername,
    setPassword,
    setIsValid,
    setMedia,
    handleSubmit,
    handleToggleAudio,
    handleToggleVideo,
    handleToggleShareScreen,
  }
}

'use client'

import { useEffect, useState } from 'react'
import { Track, VideoPresets } from 'livekit-client'
import { useLocalParticipant, useTracks } from '@livekit/components-react'
import { CameraResolution } from '@/feat/enum'

export const useCameraQuality = () => {
  const { localParticipant } = useLocalParticipant()
  const [selectedQuality, setSelectedQuality] = useState<CameraResolution>(CameraResolution.LOW)
  const [maxCapabilities, setMaxCapabilities] = useState({ width: Infinity, height: Infinity })
  const tracks = useTracks([Track.Source.Camera])
  const videoTrack = tracks.find((t) => t.participant.identity === localParticipant.identity)
  const track = videoTrack?.publication.track?.mediaStreamTrack
  const activeSettings = track?.getSettings()

  useEffect(() => {
    if (track) {
      const capabilities = track.getCapabilities()
      const settings = track.getSettings()
      const constraint = track.getConstraints()

      console.log(capabilities)

      // console.log({
      //   width: [capabilities.width?.max ?? 0, settings.width ?? 0, constraint.width as number],
      //   height: [capabilities.height?.max ?? 0, settings.height ?? 0, constraint.height as number],
      // })

      // No need to reset, let livekit does
      setMaxCapabilities({
        width: Math.max(
          capabilities.width?.max ?? 0,
          settings.width ?? 0,
          constraint.width as number
        ),
        height: Math.max(
          capabilities.height?.max ?? 0,
          settings.height ?? 0,
          constraint.height as number
        ),
      })
    }
  }, [track])

  console.log(maxCapabilities)

  useEffect(() => {
    // console.log(activeSettings?.height)

    if (!activeSettings?.width || !activeSettings.height) {
      return
    }
    console.log(`Resolusi berhasil diubah ke: ${activeSettings?.width}x${activeSettings?.height}`)
    setSelectedQuality(activeSettings.height)
  }, [activeSettings])

  // "handleToggleMenuResolution" should listen video track in effect

  const changeResolution = async (quality: CameraResolution) => {
    const localTrack = localParticipant?.getTrackPublication(Track.Source.Camera)?.videoTrack
    const targetPreset = { value: VideoPresets.h360 }

    if (!track || !localTrack) {
      return
    }

    switch (quality) {
      case CameraResolution.LOW:
        targetPreset.value = VideoPresets.h360
        break
      case CameraResolution.STANDART:
        targetPreset.value = VideoPresets.h540
        break
      case CameraResolution.HIGH:
        targetPreset.value = VideoPresets.h720
        break
      case CameraResolution.FULLHD:
        targetPreset.value = VideoPresets.h1080
        break
      case CameraResolution.QHD:
        targetPreset.value = VideoPresets.h1440
        break
      case CameraResolution.UHD:
        targetPreset.value = VideoPresets.h2160
        break
      default:
        break
    }

    try {
      const { value } = targetPreset

      await localParticipant.setCameraEnabled(false)
      await localParticipant.unpublishTrack(track)

      await localParticipant.setCameraEnabled(true, {
        resolution: value.resolution,
      })

      await localTrack?.restartTrack({
        resolution: value.resolution,
      })
    } catch (error) {
      console.error('Gagal mengubah resolusi kamera:', error)
    }
  }

  return {
    selectedQuality,
    maxCapabilities,
    changeResolution,
    setMaxCapabilities,
  }
}

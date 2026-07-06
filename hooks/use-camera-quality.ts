'use client'

import type { CameraResolution } from '@/feat/enum'
import { useEffect, useRef, useState } from 'react'
import { Track, VideoPresets } from 'livekit-client'
import { useLocalParticipant, useTracks } from '@livekit/components-react'

export const useCameraQuality = () => {
  const { localParticipant } = useLocalParticipant()
  const [resolution, setResolution] = useState(VideoPresets.h720.resolution)
  const [maxResolution, setMaxResolution] = useState<number>(Infinity)
  const pendingResolutionRef = useRef(VideoPresets.h720.resolution)
  const tracks = useTracks([Track.Source.Camera])
  const videoTrack = tracks.find((t) => t.participant.identity === localParticipant.identity)
  const track = videoTrack?.publication.track?.mediaStreamTrack

  const changeResolution = async (quality: CameraResolution) => {
    const localTrack = localParticipant?.getTrackPublication(Track.Source.Camera)?.videoTrack
    const preset = VideoPresets[`h${quality}` as keyof typeof VideoPresets]

    if (!preset) return

    pendingResolutionRef.current = preset.resolution

    if (!localTrack) return

    try {
      await localTrack.restartTrack({ resolution: preset.resolution })
      setResolution(preset.resolution)
    } catch (error) {
      console.error('Gagal mengubah resolusi kamera:', error)
    }
  }

  // Gunakan ini untuk toggle camera — bukan setCameraEnabled langsung
  const toggleCamera = async () => {
    if (!localParticipant.isCameraEnabled) {
      // Pass resolution saat enable — browser acquire langsung dengan constraint yang benar
      await localParticipant.setCameraEnabled(true, {
        resolution: pendingResolutionRef.current,
      })
    } else {
      await localParticipant.setCameraEnabled(false)
    }
  }

  // Deteksi max capability
  useEffect(() => {
    if (!track) return
    const max = Math.max(
      track.getCapabilities().height?.max ?? -1,
      track.getSettings().height ?? -1
    )

    console.log(max)
    if (max > 0) setMaxResolution(max)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.id])

  // Sync state resolusi saat track baru muncul
  useEffect(() => {
    if (!track) return
    const currentHeight = track.getSettings().height
    if (currentHeight) {
      // Update state sesuai realita track, bukan force restart lagi
      setResolution((prev) => ({
        ...prev,
        height: currentHeight,
        width: track.getSettings().width ?? prev.width,
      }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.id])

  console.log(resolution)

  return {
    resolution,
    maxResolution,
    changeResolution,
    isCameraEnabled: localParticipant.isCameraEnabled,
    toggleCamera, // <-- pakai ini di komponen, bukan setCameraEnabled
  }
}

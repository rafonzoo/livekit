'use client'
import type { default as YT } from 'youtube'
import type { FC } from 'react'
import { useEffect, useRef, useEffectEvent } from 'react'
import { RoomEvent } from 'livekit-client'
import { useRoomContext } from '@livekit/components-react'
import { cn, decoder, encoder } from '@/lib/utils'
import { useRoomState } from '@/feat/Room'
import { parseYoutubeURL } from '@/feat/helpers'
import { LiveKitAction } from '@/feat/enum'

declare global {
  interface Window {
    YT: typeof YT
    onYouTubeIframeAPIReady: () => void
  }
}

interface YoutubeMessage {
  action: LiveKitAction.YoutubeUpdate
  payload: {
    videoId: string
    currentTime: number
    isPlaying: boolean
    timestamp: number
  }
}

declare global {
  interface Window {
    YT: typeof YT
    onYouTubeIframeAPIReady: () => void
  }
}

export const WatchYoutube: FC<{ onReady?: () => void }> = ({ onReady }) => {
  const { screen } = useRoomState()
  const room = useRoomContext()
  const videoUrl = screen?.url ?? ''
  const hasControl = room.localParticipant.identity === screen?.host
  const playerRef = useRef<YT.Player | null>(null)
  const iframeContainerRef = useRef<HTMLDivElement>(null)
  const isRemoteApplyingRef = useRef(false)
  const syncIntervalRef = useRef<number | null>(null)
  const videoIdRef = useRef(parseYoutubeURL(videoUrl))
  const isPlayerReadyRef = useRef(false)
  const pendingPayloadRef = useRef<YoutubeMessage['payload'] | null>(null)

  // Host: broadcast state to all participants via rAF, throttled to every 200ms
  const startBroadcast = useEffectEvent((current: typeof room) => {
    let lastTime = 0

    const loop = (now: number) => {
      if (!syncIntervalRef.current) return

      // Only broadcast every 200ms — no need to send every frame
      if (now - lastTime > 200) {
        if (playerRef.current) {
          const message: YoutubeMessage = {
            action: LiveKitAction.YoutubeUpdate,
            payload: {
              videoId: videoIdRef.current,
              currentTime: playerRef.current.getCurrentTime(),
              isPlaying: playerRef.current.getPlayerState() === window.YT.PlayerState.PLAYING,
              timestamp: Date.now(), // Wall clock at time of broadcast
            },
          }
          current.localParticipant.publishData(encoder.encode(JSON.stringify(message)), {
            reliable: false,
          })
          lastTime = now
        }
      }
      syncIntervalRef.current = requestAnimationFrame(loop)
    }

    syncIntervalRef.current = requestAnimationFrame(loop)
  })

  const stopBroadcast = () => {
    if (!syncIntervalRef.current) return

    clearInterval(syncIntervalRef.current)
    syncIntervalRef.current = null
  }

  // Participant: receive and apply sync from host
  const handleDataReceived = useEffectEvent((payload: Uint8Array) => {
    try {
      const message = JSON.parse(decoder.decode(payload)) as YoutubeMessage
      if (message.action !== LiveKitAction.YoutubeUpdate || hasControl) return

      // Player not ready yet — buffer the latest payload
      if (!playerRef.current || !isPlayerReadyRef.current) {
        pendingPayloadRef.current = message.payload
        return
      }

      const player = playerRef.current
      const { videoId, currentTime, isPlaying, timestamp } = message.payload

      // --- LATENCY COMPENSATION ---
      // Estimate how long the data was in transit
      const networkLatency = (Date.now() - timestamp) / 1000
      const adjustedTime = currentTime + networkLatency + 0.1 // +0.1s extra buffer

      // Switch video if ID changed
      if (videoId !== videoIdRef.current) {
        videoIdRef.current = videoId
        player.loadVideoById({ videoId, startSeconds: adjustedTime })
        return
      }

      // Resync if drift exceeds 300ms tolerance
      const drift = Math.abs(player.getCurrentTime() - adjustedTime)
      if (drift > 0.3) {
        player.seekTo(adjustedTime, true)
      }

      // Handle play/pause state
      if (isPlaying && player.getPlayerState() !== window.YT.PlayerState.PLAYING) {
        player.playVideo()
      } else if (!isPlaying && player.getPlayerState() === window.YT.PlayerState.PLAYING) {
        player.pauseVideo()
      }
    } catch (err) {
      console.error(err)
    }
  })

  const initPlayer = useEffectEvent((current: typeof room) => {
    if (!iframeContainerRef.current) return

    playerRef.current = new window.YT.Player(iframeContainerRef.current, {
      videoId: videoIdRef.current,
      playerVars: {
        autoplay: 0,
        controls: hasControl ? 1 : 0,
        modestbranding: 1,
        rel: 0,
      },
      events: {
        onReady: () => {
          isPlayerReadyRef.current = true
          onReady?.()

          const pending = pendingPayloadRef.current

          // Apply buffered payload if it arrived before the player was ready
          if (pending) {
            pendingPayloadRef.current = null
            const { videoId, currentTime, isPlaying, timestamp } = pending

            // Apply the same latency compensation as the live handler
            const networkLatency = (Date.now() - timestamp) / 1000
            const seekTime = currentTime + networkLatency

            // Use a one-time onStateChange listener instead of setTimeout
            const handlePendingState = (event: YT.OnStateChangeEvent) => {
              if (event.data === window.YT.PlayerState.PLAYING) {
                if (!isPlaying) {
                  playerRef.current?.pauseVideo()
                  playerRef.current?.removeEventListener('onStateChange', handlePendingState)
                }
              }
            }

            playerRef.current?.addEventListener('onStateChange', handlePendingState)
            playerRef.current?.loadVideoById({ videoId, startSeconds: seekTime })
          }
        },
        onStateChange: (event) => {
          if (!hasControl) return
          if (isRemoteApplyingRef.current) return

          const now = Date.now()

          // Immediately broadcast on play/pause/seek
          const message: YoutubeMessage = {
            action: LiveKitAction.YoutubeUpdate,
            payload: {
              videoId: videoIdRef.current,
              currentTime: playerRef.current?.getCurrentTime() ?? 0,
              isPlaying: event.data === window.YT.PlayerState.PLAYING,
              timestamp: now,
            },
          }

          current.localParticipant.publishData(encoder.encode(JSON.stringify(message)), {
            reliable: true, // Reliable for important state-change events
          })

          // Start or stop the periodic broadcast loop
          if (event.data === window.YT.PlayerState.PLAYING) {
            startBroadcast(current)
          } else {
            stopBroadcast()
          }
        },
      },
    })
  })

  // Init YouTube IFrame API
  useEffect(() => {
    if (window.YT?.Player) {
      initPlayer(room)
    } else {
      // Inject the API script if not already loaded
      const tag = document.createElement('script')

      tag.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(tag)
      window.onYouTubeIframeAPIReady = initPlayer.bind(null, room)
    }

    return () => {
      stopBroadcast()
      isPlayerReadyRef.current = false
      pendingPayloadRef.current = null
      playerRef.current?.destroy()
      playerRef.current = null
    }
  }, [room])

  useEffect(() => {
    room.on(RoomEvent.DataReceived, handleDataReceived)
    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived)
    }
  }, [room])

  return (
    <div className='absolute inset-0 bg-black'>
      {/* URL input — only visible to the host */}
      {hasControl && (
        <div className='absolute top-0 right-0 z-10 flex w-100 max-w-full gap-2'>
          <input
            type='text'
            placeholder='Masukkan URL youtube atau video id'
            defaultValue={videoUrl}
            className='bg-background h-9 flex-1 border px-3 py-1 text-sm text-black shadow'
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return
              const input = e.currentTarget.value.trim()
              const newVideoId = parseYoutubeURL(input)

              videoIdRef.current = newVideoId
              playerRef.current?.loadVideoById({ videoId: newVideoId })
            }}
          />
        </div>
      )}

      <div
        className={cn(
          'absolute inset-0 flex items-center justify-center',
          hasControl && 'inset-[36px_0_0]'
        )}
      >
        <div
          ref={iframeContainerRef}
          tabIndex={hasControl ? void 0 : -1}
          className={cn(
            'aspect-video h-full max-h-full w-auto max-w-full',
            !hasControl && 'pointer-events-none'
          )}
        />
      </div>
    </div>
  )
}

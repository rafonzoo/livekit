'use client'

import type { ScreenCode } from '@/feat/enum'
import { useState, useEffect, useRef } from 'react'
import { useParticipants, useLocalParticipant, useRoomContext } from '@livekit/components-react'
import { useDataChannel } from '@/hooks'
import { EventBus, LiveKitAction, ParticipantAttribute } from '@/feat/enum'

export interface ParticipantAttributes {
  SCREEN_ACTIVE_URL: string
  SCREEN_ACTIVE: string
  SCREEN_ACTIVE_HOST: ScreenCode
  HAND_RAISED: boolean
}

export interface ParticipantList {
  id: string
  name: string
  isSpeaking: boolean
  isMuted: boolean
  isModerator?: boolean
  attributes?: ParticipantAttributes
  hide: boolean
}

export interface ParticipantListPending extends Omit<
  ParticipantList,
  'isSpeaking' | 'isMuted' | 'isModerator'
> {
  status?: 'PENDING' | 'APPROVED' | 'REJECTED'
}

export interface ParticipantPendingGroup {
  id: string
  headline: string
  hide: boolean
  lists: ParticipantListPending[]
}

export interface ParticipantGroup {
  id: string
  headline: string
  hide: boolean
  lists: ParticipantList[]
}

function SyncTabParticipant() {
  const room = useRoomContext()

  const handleManualToggleAudio = () => {
    if (!room) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    room.emit(EventBus.ManualToggleAudio as any, { enabled: false })
  }

  useDataChannel<{ enabled: boolean }>(LiveKitAction.AllMicrophoneUpdate, ({ payload }) => {
    if (payload?.enabled !== undefined) {
      handleManualToggleAudio()
    }
  })

  useDataChannel<{ enabled: boolean }>(LiveKitAction.MicrophoneUpdate, ({ payload }) => {
    if (payload?.enabled !== undefined) {
      handleManualToggleAudio()
    }
  })

  useDataChannel<{ disconnect: boolean }>(LiveKitAction.DisconnectRoom, ({ payload }) => {
    if (payload?.disconnect) {
      room.disconnect()
    }
  })

  return
}

export function useTabsParticipant() {
  const room = useRoomContext()
  const remoteParticipants = useParticipants()
  const { localParticipant } = useLocalParticipant()
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // NOTE: jika sudah pake dropdown shadcn. event ini di hapus
  useEffect(() => {
    function handleClickOutside(event: globalThis.MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const shouldMuteAll = remoteParticipants.some((p) => {
    if (p.identity === localParticipant?.identity) return false
    return p.isMicrophoneEnabled
  })

  // TODO: Participant pending masih coba2
  const [waitingParticipants, setWaitingParticipants] = useState<ParticipantListPending[]>([
    {
      hide: false,
      id: 'satu',
      name: 'Anto',
      status: 'PENDING',
    },
    {
      hide: false,
      id: 'dua',
      name: 'Anto Example',
      status: 'PENDING',
    },
    {
      hide: false,
      id: 'tiga',
      name: 'Anto tiga exampe',
      status: 'PENDING',
    },
  ])
  const waitingParticipantGroups: ParticipantPendingGroup[] = [
    {
      id: 'waiting',
      headline: 'Menunggu',
      hide: false,
      lists: waitingParticipants,
    },
  ]

  const participantGroups: ParticipantGroup[] = [
    {
      id: 'Participants',
      headline: 'Peserta',
      hide: false,
      lists: remoteParticipants
        .sort((a, b) => {
          const isRaised = (v: unknown) => v === true || v === 'true' || v === '1'

          const aRaised = isRaised(a.attributes?.[ParticipantAttribute.HandRaised])
          const bRaised = isRaised(b.attributes?.[ParticipantAttribute.HandRaised])

          const aIsLocal = a.isLocal
          const bIsLocal = b.isLocal

          if (aIsLocal !== bIsLocal) return Number(bIsLocal) - Number(aIsLocal)

          if (aRaised !== bRaised) return Number(bRaised) - Number(aRaised)

          return (a.name ?? '').localeCompare(b.name ?? '')
        })
        .map((participant) => {
          const isMuted = !participant.isMicrophoneEnabled

          return {
            id: participant.identity,
            name: participant.name ?? '',
            isModerator: participant.isLocal, // TODO: .isLocal, Nanti ambil dari session misal
            isSpeaking: participant.isSpeaking,
            isMuted,
            attributes: participant.attributes as unknown as ParticipantAttributes,
            hide: false,
          }
        }),
    },
  ]

  // SEND DATA CHANNEL
  const { send: sendWaiting } = useDataChannel<{
    subAction: 'APPROVED' | 'REJECTED'
    targetId: string
  }>(LiveKitAction.WaitingUpdate, () => null)

  const { send: sendbroadcastMicrophoneMuteAll } = useDataChannel<{ enabled: boolean }>(
    LiveKitAction.AllMicrophoneUpdate,
    () => null
  )

  const { send: sendDirectMicrophoneMute } = useDataChannel<{ enabled: boolean }>(
    LiveKitAction.MicrophoneUpdate,
    () => null
  )

  const { send: sendDisconnect } = useDataChannel<{ disconnect: boolean }>(
    LiveKitAction.DisconnectRoom,
    () => null
  )

  // LISTENER
  useDataChannel<{ subAction: 'APPROVED' | 'REJECTED'; targetId: string }>(
    LiveKitAction.WaitingUpdate,
    ({ payload }) => {
      if (payload?.subAction === 'APPROVED' || payload?.subAction === 'REJECTED') {
        handleLocaParticipantPending(payload.targetId)
      }
    }
  )

  const syncTabParticipant = SyncTabParticipant

  // HANDLER
  const handleLocaParticipantPending = (identity: string) => {
    if (identity === 'ALL') {
      setWaitingParticipants([])
    } else {
      setWaitingParticipants((prev) => prev.filter((p) => p.id !== identity))
    }
  }

  const handleRemoteParticipantPending = (identity: string, status: 'APPROVED' | 'REJECTED') => {
    if (identity === 'ALL') {
      waitingParticipants.forEach((participant) => {
        sendWaiting(
          {
            subAction: status,
            targetId: participant.id,
          },
          {
            reliable: true,
          }
        )
      })
      handleLocaParticipantPending('ALL')
    } else {
      sendWaiting(
        {
          subAction: status,
          targetId: identity,
        },
        {
          reliable: true,
        }
      )
      handleLocaParticipantPending(identity)
    }
  }

  const handleBroadcastMuteAll = async () => {
    const nextState = !shouldMuteAll
    try {
      // TODO: ganti pake modal jika suka ada shadcn
      const confirm = window.confirm(`Bisukan semua peserta ?`)
      if (!confirm) return
      sendbroadcastMicrophoneMuteAll({ enabled: nextState })
    } catch (error) {
      console.error('Gagal mengirim perintah mic masal:', error)
    }
  }

  const handleParticipantMute = ({
    identity,
    isLocal = false,
  }: {
    identity: string
    isLocal?: boolean
  }) => {
    if (isLocal) {
      if (!room) return

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      room.emit('app:trigger-manual-audio' as any, { enabled: false })
    }

    sendDirectMicrophoneMute(
      { enabled: false },
      { destinationIdentities: [identity], reliable: true }
    )
    setActiveMenuId(null)
  }

  const handleDismissParticipant = (identity: string) => {
    sendDisconnect({ disconnect: true }, { destinationIdentities: [identity], reliable: true })
  }

  return {
    participantGroups,
    waitingParticipantGroups,
    shouldMuteAll,
    activeMenuId,
    menuRef,
    waitingParticipants,
    setActiveMenuId,
    handleBroadcastMuteAll,
    handleParticipantMute,
    handleDismissParticipant,
    handleLocaParticipantPending,
    handleRemoteParticipantPending,
    syncTabParticipant,
  }
}

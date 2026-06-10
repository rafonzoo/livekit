import type { PollingMessage, PollingOption } from '@/feat/Tabs'
import { useEffect, useState, useEffectEvent } from 'react'
import { RoomEvent } from 'livekit-client'
import { useRoomContext } from '@livekit/components-react'
import { useParamsState } from '@/hooks/use-params-state'
import { useDataChannel } from '@/hooks/use-data-channel'
import { useRoomState } from '@/feat/Room'
import { LiveKitAction, ParticipantAttribute, ScreenCode } from '@/feat/enum'

interface VoteMessage {
  optionId: number
  id: number
  identity: string
  name: string
}

export function usePollingSession(onReady?: () => void) {
  const { screen, isHost, stopActiveScreen } = useRoomState()
  const { openPanelOpen, closePanel } = useParamsState()
  const parsed = JSON.parse(screen?.polling ?? '') as PollingMessage[]
  const pollings = { ...parsed.find((polling) => !polling.closedAt) }
  const { id, totalParticipant = 100, question = '', options = [] } = pollings
  const room = useRoomContext()

  const { send: updateVote } = useDataChannel<VoteMessage>(
    LiveKitAction.PollingVoteNow,
    ({ payload }) => listenVote(payload)
  )

  const prepareToAnswer = useEffectEvent(() => {
    onReady?.()
    closePanel()
  })

  function listenVote(payload?: VoteMessage) {
    const prev = room.localParticipant.attributes[ParticipantAttribute.ScreenActivePolling]
    if (!prev || !payload) return

    const prevMessages = JSON.parse(prev) as PollingMessage[]
    const newMessages = prevMessages.map((message) => {
      if (message.id !== payload.id) return message

      return {
        ...message,
        options: message.options.map((option) =>
          option.id === payload.optionId
            ? {
                ...option,
                votes: [
                  ...option.votes.filter((vote) => vote.identity !== payload.identity),
                  {
                    identity: payload.identity,
                    name: payload.name,
                  },
                ],
              }
            : {
                ...option,
                votes: option.votes.filter((vote) => vote.identity !== payload.identity),
              }
        ),
      }
    })

    room.localParticipant.setAttributes({
      [ParticipantAttribute.ScreenActivePolling]: JSON.stringify(newMessages),
    })
  }

  function selectVote(optionId: number) {
    if (!screen || !id) {
      return
    }

    updateVote(
      {
        optionId,
        id,
        identity: room.localParticipant.identity,
        name: room.localParticipant.name ?? '',
      },
      { reliable: true, destinationIdentities: [screen.host] }
    )
  }

  function endPolling() {
    const prev = room.localParticipant.attributes[ParticipantAttribute.ScreenActivePolling]
    if (!prev) return

    const prevMessages = JSON.parse(prev) as PollingMessage[]
    const closePolling = prevMessages.map((message) =>
      message.identity === room.localParticipant.identity
        ? { ...message, closedAt: Date.now() }
        : message
    )

    stopActiveScreen({ polling: JSON.stringify(closePolling) })
    openPanelOpen()
  }

  useEffect(() => prepareToAnswer(), [])

  return { totalParticipant, question, options, isHost, selectVote, endPolling }
}

export function usePollingQuestion(config?: { optionLength?: number }) {
  const room = useRoomContext()
  const { optionLength = 2 } = { ...config }
  const { screen, startActiveScreen } = useRoomState()
  const [question, setQuestion] = useState('')
  const [history, setHistory] = useState<PollingMessage[]>([])
  const [collapse, setCollapse] = useState(false)
  const [options, setOptions] = useState<PollingOption[]>(
    Array.from({ length: optionLength }, (_, index) => index + 1).map((id) => ({
      id,
      value: '',
      votes: [],
    }))
  )

  const disabled =
    !question ||
    options.filter((option) => !!option.value).length < 2 ||
    options
      .filter((option) => !!option.value)
      .reduce(
        (acc, opt) => {
          if (opt.value.toLowerCase() === acc.text.toLowerCase()) {
            acc.dup = true
          } else {
            acc.text = opt.value.toLowerCase()
          }

          return acc
        },
        { text: '', dup: false }
      ).dup

  function startPolling(totalParticipant: number) {
    const participant = room.localParticipant
    const prev = participant.attributes[ParticipantAttribute.ScreenActivePolling] || '[]'

    try {
      const prevMessage: PollingMessage[] = JSON.parse(prev)
      const payload: PollingMessage = {
        id: history.length + 1,
        identity: room.localParticipant.identity,
        totalParticipant,
        question,
        openedAt: Date.now(),
        closedAt: null,
        options: [
          ...options.filter((option) => !!option.value),
          { id: -2, value: 'Tidak menjawab', votes: [] },
          { id: -1, value: 'Lewati pendapat', votes: [] },
        ],
      }

      const broadcast = startActiveScreen(ScreenCode.Polling, {
        polling: JSON.stringify([...prevMessage, payload]),
      })

      broadcast.then(() => {
        setQuestion('')
        setOptions((prev) => prev.map((previous) => ({ ...previous, value: '', votes: [] })))
        setCollapse(history.length > 0)
      })
    } catch (e) {
      console.log(e)
    }
  }

  useEffect(() => {
    function getRoomPolling() {
      const remoteParticipants = Array.from(room.remoteParticipants.values())
      const allParticipants = [room.localParticipant, ...remoteParticipants]
      const histories: PollingMessage[] = []

      allParticipants.forEach((participant) => {
        const polling = participant.attributes?.[ParticipantAttribute.ScreenActivePolling]

        if (polling) {
          const prevPolling = JSON.parse(polling) as PollingMessage[]
          histories.push(...prevPolling)
        }
      })

      setHistory(histories)
      setCollapse((prev) => (!prev ? !!histories.length : prev))
    }

    getRoomPolling()

    room.addListener(RoomEvent.ParticipantAttributesChanged, getRoomPolling)
    return () => {
      room.removeListener(RoomEvent.ParticipantAttributesChanged, getRoomPolling)
    }
  }, [room])

  return {
    allowNewPolling: !screen,
    collapse,
    options,
    question,
    history,
    disabled,
    setQuestion,
    setOptions,
    startPolling,
    toggleCollapse: () => setCollapse((prev) => !prev),
  }
}

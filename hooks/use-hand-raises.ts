import { useCallback, useMemo } from 'react'
import { useLocalParticipant, useParticipants } from '@livekit/components-react'
import { ParticipantAttribute } from '@/feat/enum'

export interface RaisedHandUser {
  identity: string
  name: string
  isMe: boolean
}

export function useHandRaises() {
  const { localParticipant } = useLocalParticipant()
  const participants = useParticipants()

  const isRaised = localParticipant.attributes?.[ParticipantAttribute.HandRaised] === 'true'

  const toggleHand = useCallback(async () => {
    await localParticipant.setAttributes({
      [ParticipantAttribute.HandRaised]: String(!isRaised),
    })
  }, [localParticipant, isRaised])
  const raisedHands = useMemo(() => {
    const all = [localParticipant, ...participants]

    const list = all
      .filter((p) => p.attributes?.[ParticipantAttribute.HandRaised] === 'true')
      .map((p) => ({
        identity: p.identity,
        name: p.name ?? p.identity,
        isMe: p.identity === localParticipant.identity,
      }))

    list.sort((a, b) => {
      if (a.isMe) return -1
      if (b.isMe) return 1
      return 0
    })

    return new Map(list.map((user) => [user.identity, user]))
  }, [participants, localParticipant])

  return {
    isRaised,
    raisedHands,
    toggleHand,
  }
}

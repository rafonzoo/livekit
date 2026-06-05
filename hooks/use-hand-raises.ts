import { useLocalParticipant, useParticipants } from '@livekit/components-react'
import { useDataChannel } from './use-data-channel'
import { LiveKitAction, ParticipantAttribute } from '@/feat/enum'

export interface RaisedHandUser {
  identity: string
  name: string
  isMe: boolean
}

export function useHandRaises() {
  const { localParticipant } = useLocalParticipant()
  const remoteParticipants = useParticipants()

  const isRaised = localParticipant.attributes?.[ParticipantAttribute.HandRaised] === 'true'

  const setHandStatus = async (shouldRaise: boolean) => {
    try {
      await localParticipant.setAttributes({
        [ParticipantAttribute.HandRaised]: String(shouldRaise),
      })
    } catch (error) {
      console.error('Failed to update hand raise attribute:', error)
    }
  }

  const { send } = useDataChannel<string>(LiveKitAction.HandRaisedLower, ({ payload }) => {
    const targetLower = remoteParticipants.map((p) => p.identity).includes(payload ?? '')
    if (targetLower) {
      setHandStatus(false)
    }
  })

  const raisedHands = () => {
    const listMap = new Map<string, RaisedHandUser>()

    const uniqueParticipants = Array.from(new Set([localParticipant, ...remoteParticipants]))

    uniqueParticipants.forEach((p) => {
      if (p.attributes?.[ParticipantAttribute.HandRaised] === 'true') {
        const isMe = p.identity === localParticipant.identity

        listMap.set(p.identity, {
          identity: p.identity,
          name: p.name ?? p.identity,
          isMe,
        })
      }
    })

    return listMap
  }

  const raiseHand = () => setHandStatus(true)
  const lowerHand = (identity: string) => send(identity)
  const toggleHand = () => setHandStatus(!isRaised)

  return {
    isRaised,
    raisedHands: raisedHands(),
    raiseHand,
    lowerHand,
    toggleHand,
  }
}

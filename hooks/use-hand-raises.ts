import { useLocalParticipant, useParticipants } from '@livekit/components-react'
import { useDataChannel } from '@/hooks'
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
    } catch (e) {
      console.log('Failed to update hand raise attribute:', e)
    }
  }

  const { send: sendLowerHand } = useDataChannel<{ identity: string }>(
    LiveKitAction.HandRaisedLower,
    ({ payload }) => {
      if (payload?.identity) {
        setHandStatus(false)
      }
    }
  )

  const raisedHands = () => {
    const listMap = new Map<string, RaisedHandUser>()
    const uniqueParticipants = Array.from(new Set([localParticipant, ...remoteParticipants]))

    uniqueParticipants.forEach(({ attributes, identity, name = '' }) => {
      if (attributes?.[ParticipantAttribute.HandRaised] === 'true') {
        listMap.set(identity, { identity, name, isMe: identity === localParticipant.identity })
      }
    })

    return listMap
  }

  const raiseHand = () => setHandStatus(true)
  const lowerHand = (identity: string) =>
    sendLowerHand({ identity }, { destinationIdentities: [identity], reliable: true })
  const lowerHandLocal = () => setHandStatus(false)
  const toggleHand = () => setHandStatus(!isRaised)

  return {
    isRaised,
    raisedHands: raisedHands(),
    raiseHand,
    lowerHand,
    lowerHandLocal,
    toggleHand,
  }
}

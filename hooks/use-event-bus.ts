import type { EventEmitter } from 'events'
import type { EventBus } from '@/feat/enum'
import { useEffect } from 'react'
import { useRoomContext } from '@livekit/components-react'

interface EventBusPayloads {
  [EventBus.ManualToggleAudio]: { enabled: boolean }
}

type EventName = keyof EventBusPayloads

export function useRoomEventBus<T extends EventName>(
  eventName: T,
  callback: (payload: EventBusPayloads[T]) => void
) {
  const room = useRoomContext()

  useEffect(() => {
    if (!room) return

    const emitter = room as unknown as EventEmitter

    const handler = (payload: EventBusPayloads[T]) => {
      callback(payload)
    }

    emitter.on(eventName, handler)

    return () => {
      emitter.off(eventName, handler)
    }
  }, [room, eventName, callback])

  const emit = (payload: EventBusPayloads[T]) => {
    if (!room) return
    const emitter = room as unknown as EventEmitter
    emitter.emit(eventName, payload)
  }

  return { emit }
}

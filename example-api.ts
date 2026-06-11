'use server'

import { RoomServiceClient } from 'livekit-server-sdk'

const svc = new RoomServiceClient(
  process.env.LIVEKIT_URL ?? '',
  process.env.LIVEKIT_API_KEY,
  process.env.LIVEKIT_API_SECRET
)

export async function updateRoomMetadata(roomName: string, metadataData: object) {
  const metadataString = JSON.stringify(metadataData)

  try {
    await svc.updateRoomMetadata(roomName, metadataString)

    return { data: 'Success' }
  } catch (error) {
    console.log(error)
    return { data: null, error: { message: 'Failed to update room metadata:', error } }
  }
}

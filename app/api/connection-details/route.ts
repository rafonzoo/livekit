import type { NextRequest } from 'next/server'
import type { AccessTokenOptions, VideoGrant } from 'livekit-server-sdk'
import type { ConnectionDetails } from '@/feat/types'
import { NextResponse } from 'next/server'
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk'
import { randomString } from '@/lib/utils'
import { getLiveKitURL } from '@/feat/helpers'
import { ConnectionInterceptor } from '@/feat/enum'

const API_KEY = process.env.LIVEKIT_API_KEY
const API_SECRET = process.env.LIVEKIT_API_SECRET
const LIVEKIT_URL = process.env.LIVEKIT_URL

const COOKIE_KEY = 'random-participant-postfix'

// Simple in-memory store (tell backend to use Redis or other mechanism)
export const waitingClients = new Map<string, ReadableStreamDefaultController>()
export const blockedClients = new Map<string, ReadableStreamDefaultController>()
export const hostClients = new Map<string, ReadableStreamDefaultController>()
export const heartbeatMap = new Map<string, ReturnType<typeof setInterval>>()

const svc = new RoomServiceClient(
  process.env.LIVEKIT_URL ?? '',
  process.env.LIVEKIT_API_KEY,
  process.env.LIVEKIT_API_SECRET
)

export async function GET(request: NextRequest) {
  const pendingParticipant: string[] = ['asd'] // From backend, in-memory or redis
  const bannedParticipant: string[] = ['xxx'] // From backend, in-memory or redis

  try {
    // Parse query parameters
    const roomName = request.nextUrl.searchParams.get('roomName')
    const participantName = request.nextUrl.searchParams.get('participantName')
    const metadata = request.nextUrl.searchParams.get('metadata') ?? ''
    const region = request.nextUrl.searchParams.get('region')
    const status = request.nextUrl.searchParams.get('status')
    if (!LIVEKIT_URL) {
      throw new Error('LIVEKIT_URL is not defined')
    }
    const livekitServerUrl = region ? getLiveKitURL(LIVEKIT_URL, region) : LIVEKIT_URL
    const randomParticipantPostfix = request.cookies.get(COOKIE_KEY)?.value ?? randomString(4)
    if (livekitServerUrl === undefined) {
      throw new Error('Invalid region')
    }

    if (typeof roomName !== 'string') {
      return NextResponse.json(
        { message: 'Missing required query parameter: roomName' },
        {
          status: 400,
        }
      )
    }

    if (participantName === null) {
      return NextResponse.json(
        { message: 'Missing required query parameter: participantName' },
        { status: 400 }
      )
    }

    if (!status && pendingParticipant.includes(participantName)) {
      return NextResponse.json({ interceptor: ConnectionInterceptor.Pending }, { status: 302 })
    }

    if (!status && bannedParticipant.includes(participantName)) {
      return NextResponse.json({ interceptor: ConnectionInterceptor.Banned }, { status: 302 })
    }

    const participantToken = await createParticipantToken(
      {
        identity: `${participantName}__${randomParticipantPostfix}`,
        name: participantName,
        metadata,
      },
      roomName
    )

    // Return connection details
    const data: ConnectionDetails = {
      serverUrl: livekitServerUrl,
      roomName: roomName,
      participantToken: participantToken,
      participantName: participantName,
    }

    // NOTE: THIS IS FOR TESTING PURPOSE. EVERYONE - EVEN BANNED/BLOCKED CAN CREATE ROOM
    // EXPECTED: ROOM ONLY CAN BE CREATED BY THE HOST (THIS IS ONLY FOR TESTING PURPOSE)
    try {
      await svc.createRoom({
        emptyTimeout: 10 * 60,
        name: roomName,
        metadata: JSON.stringify({ polling: [], banned: [] }),
      })
      // eslint-disable-next-line no-empty
    } catch {}

    return NextResponse.json(
      { data },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': `${COOKIE_KEY}=${randomParticipantPostfix}; Path=/; HttpOnly; SameSite=Strict; Secure; Expires=${getCookieExpirationTime()}`,
        },
      }
    )
  } catch (e) {
    const err = new Error(e instanceof Error ? e.message : 'Internal server error')
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse query parameters
    const roomName = request.nextUrl.searchParams.get('roomName')
    const participantName = request.nextUrl.searchParams.get('participantName')
    const metadata = request.nextUrl.searchParams.get('metadata') ?? ''
    const region = request.nextUrl.searchParams.get('region')
    const status = request.nextUrl.searchParams.get('status')
    if (!LIVEKIT_URL) {
      throw new Error('LIVEKIT_URL is not defined')
    }
    const livekitServerUrl = region ? getLiveKitURL(LIVEKIT_URL, region) : LIVEKIT_URL
    const randomParticipantPostfix = request.cookies.get(COOKIE_KEY)?.value ?? randomString(4)
    if (livekitServerUrl === undefined) {
      throw new Error('Invalid region')
    }

    if (typeof roomName !== 'string') {
      return NextResponse.json(
        { message: 'Missing required query parameter: roomName' },
        {
          status: 400,
        }
      )
    }

    if (participantName === null) {
      return NextResponse.json(
        { message: 'Missing required query parameter: participantName' },
        { status: 400 }
      )
    }

    if (status === null) {
      return NextResponse.json(
        { message: 'Missing required query parameter: status' },
        { status: 400 }
      )
    }

    const controller = waitingClients.get(participantName)
    if (!controller) {
      return NextResponse.json({ message: 'No pending participant' }, { status: 403 })
    }

    const participantToken = await createParticipantToken(
      {
        identity: `${participantName}__${randomParticipantPostfix}`,
        name: participantName,
        metadata,
      },
      roomName
    )

    // Return connection details
    const data: ConnectionDetails = {
      serverUrl: livekitServerUrl,
      roomName: roomName,
      participantToken: participantToken,
      participantName: participantName,
    }

    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ status, data })}\n\n`))
    waitingClients.delete(participantName)

    return NextResponse.json({ message: 'Success' })
  } catch (e) {
    const err = new Error(e instanceof Error ? e.message : 'Internal server error')
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

function createParticipantToken(userInfo: AccessTokenOptions, roomName: string) {
  const at = new AccessToken(API_KEY, API_SECRET, userInfo)
  at.ttl = '5m'
  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
    canUpdateOwnMetadata: true,
  }
  at.addGrant(grant)
  return at.toJwt()
}

function getCookieExpirationTime(): string {
  var now = new Date()
  var time = now.getTime()
  var expireTime = time + 60 * 120 * 1000
  now.setTime(expireTime)
  return now.toUTCString()
}

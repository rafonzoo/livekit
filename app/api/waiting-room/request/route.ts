import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { heartbeatMap, hostClients, waitingClients } from '@/app/api/connection-details/route'

export async function GET(request: NextRequest) {
  const roomName = request.nextUrl.searchParams.get('roomName')
  const participantName = request.nextUrl.searchParams.get('participantName')

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

  const stream = new ReadableStream({
    start(controller) {
      waitingClients.set(participantName, controller)

      // First ping - avoid timeout
      controller.enqueue(
        new TextEncoder().encode(`data: ${JSON.stringify({ status: 'connected' })}\n\n`)
      )

      // Notify host
      const hostController = hostClients.get(roomName)
      if (hostController) {
        hostController.enqueue(
          new TextEncoder().encode(
            `data: ${JSON.stringify({ status: 'new-waiting', participantName })}\n\n`
          )
        )
      }

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify({ status: 'ping' })}\n\n`)
          )
        } catch {
          clearInterval(heartbeat)
        }
      }, 10_000)

      // Keep the heartbeat in separated map - cancel can access
      heartbeatMap.set(participantName, heartbeat)
    },
    cancel() {
      waitingClients.delete(participantName)

      // Notify host if participant cancel/disconnect from waiting
      const hostController = hostClients.get(roomName)
      if (hostController) {
        hostController.enqueue(
          new TextEncoder().encode(
            `data: ${JSON.stringify({ status: 'cancel-waiting', participantName })}\n\n`
          )
        )
      }

      const heartbeat = heartbeatMap.get(participantName)
      if (heartbeat) {
        clearInterval(heartbeat)
        heartbeatMap.delete(participantName)
      }
    },
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}

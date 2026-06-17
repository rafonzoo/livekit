import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { hostClients, waitingClients } from '@/app/api/connection-details/route'

export async function GET(request: NextRequest) {
  const roomName = request.nextUrl.searchParams.get('roomName')
  if (!roomName) return NextResponse.json({ message: 'Missing roomName' }, { status: 400 })

  const stream = new ReadableStream({
    start(controller) {
      hostClients.set(roomName, controller)
      controller.enqueue(
        new TextEncoder().encode(`data: ${JSON.stringify({ status: 'connected' })}\n\n`)
      )

      // Send waiting list when host connect
      const currentWaiting = Array.from(waitingClients.keys())
      if (currentWaiting.length > 0) {
        controller.enqueue(
          new TextEncoder().encode(
            `data: ${JSON.stringify({ status: 'initial-waiting', participants: currentWaiting })}\n\n`
          )
        )
      }
    },
    cancel() {
      hostClients.delete(roomName)
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

export async function POST(request: NextRequest) {
  const req: { status: string; name: string } = await request.json()
  const { status, name: participantName } = req

  const controller = waitingClients.get(participantName)
  if (!controller) {
    return NextResponse.json({ message: 'No pending participant' }, { status: 403 })
  }

  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ status })}\n\n`))
  waitingClients.delete(participantName)

  return NextResponse.json({ message: 'success' })
}

import type { FC } from 'react'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { pdfjs } from 'react-pdf'
import { LocalVideoTrack } from 'livekit-client'
import { useRoomContext } from '@livekit/components-react'
import { useRoomState } from '@/feat/Room'
import { ScreenCode } from '@/feat/enum'
import { withSnapshot } from '@/feat/Channel/WithSnapshot'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

export const PresentationWrapper: FC<{ onReady?: () => void }> = ({ onReady }) => {
  const { screen, viewerRef, isHost } = useRoomState()
  const [page, setPage] = useState(0)
  const room = useRoomContext()
  const trackRef = useRef<LocalVideoTrack | null>(null)
  const url = screen?.url ?? ''
  const canvasElementRef = useRef<HTMLCanvasElement>(null)
  const pdfRef = useRef<pdfjs.PDFDocumentProxy | null>(null)
  const onReadyRef = useRef(onReady)
  const isRenderingRef = useRef(false)

  const renderPage = useEffectEvent(async (pageNumber: number) => {
    const canvas = canvasElementRef.current
    if (!canvas || !pdfRef.current || isRenderingRef.current) return

    // Mark first
    isRenderingRef.current = true

    try {
      const page = await pdfRef.current.getPage(pageNumber)
      const viewport = page.getViewport({
        scale: 1.5,
      })

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      canvas.width = viewport.width
      canvas.height = viewport.height

      const task = page.render({
        canvas,
        canvasContext: ctx,
        viewport,
      })

      await task.promise
    } finally {
      isRenderingRef.current = false
    }
  })

  useEffect(() => {
    if (!url) return

    const loadPdf = async () => {
      pdfRef.current = await pdfjs.getDocument(url).promise

      setPage(1)
      onReadyRef.current?.()
    }

    loadPdf()
  }, [url, viewerRef])

  useEffect(() => {
    renderPage(page)

    if (pdfRef.current) {
      viewerRef.current = {
        getSnapshot: () => page,
        loadSnapshot: setPage,
      }
    }
  }, [page, viewerRef])

  useEffect(() => {
    const publish = async () => {
      const canvas = canvasElementRef.current
      if (!canvas) return

      const stream = canvas.captureStream(10)
      const mediaTrack = stream.getVideoTracks()[0]
      const track = new LocalVideoTrack(mediaTrack, undefined, false, {
        loggerName: 'presentation',
      })

      await room.localParticipant.publishTrack(track)
      trackRef.current = track
    }

    publish()

    return () => {
      const track = trackRef.current
      if (!track) return

      room.localParticipant.unpublishTrack(track)
      track.stop()
    }
  }, [room, viewerRef])

  return (
    <div className='absolute inset-0 bg-[#3c3c3c]'>
      <canvas ref={canvasElementRef} className='h-full w-full object-contain' />
      {isHost && (
        <div className='absolute right-4 bottom-4 flex gap-2'>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
          <button onClick={() => setPage((p) => Math.min(3, p + 1))}>Next</button>
        </div>
      )}
    </div>
  )
}

export const Presentation = withSnapshot(ScreenCode.Presentation, PresentationWrapper, () => {
  const { viewerRef } = useRoomState()

  return {
    getSnapshot: () => viewerRef.current?.getSnapshot?.(),
    applySnapshot: (payload) => {
      if (!payload || !viewerRef.current) return

      viewerRef.current.loadSnapshot?.(payload)
    },
  }
})

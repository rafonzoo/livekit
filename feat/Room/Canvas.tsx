'use client'

import type { ComponentProps, FC } from 'react'
import type { ScreenID } from '@/feat/Room/State'
import { useEffect, useState } from 'react'
import { default as dynamic } from 'next/dynamic'
import { RecordIcon } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { useRoomState } from '@/feat/Room/State'
import { ScreenCode } from '@/feat/enum'
import { Loading } from '@/components/Loading'

const Whiteboard = dynamic(async () => (await import('@/feat/Collab/Whiteboard')).Whiteboard, {
  ssr: false,
  loading: () => <Loading className='absolute' />,
})

const WatchYoutube = dynamic(
  async () => (await import('@/feat/Collab/WatchYoutube')).WatchYoutube,
  {
    ssr: false,
    loading: () => <Loading className='absolute' />,
  }
)

export interface RoomCanvasProps extends ComponentProps<'div'> {
  screenId: ScreenID
}

const config = {
  [ScreenCode.Whiteboard]: {
    border: cn('border-blue-500'),
    background: cn('bg-blue-500'),
    title: 'Papan Tulis',
    comp: Whiteboard,
    // comp: () => null,
  },
  [ScreenCode.WatchYoutube]: {
    border: cn('border-green-500'),
    background: cn('bg-green-500'),
    title: 'YouTube',
    comp: WatchYoutube,
    // comp: () => null,
  },
  [ScreenCode.Presentation]: {
    border: cn('border-orange-500'),
    background: cn('bg-orange-500'),
    title: 'Presentasi',
    comp: () => null,
  },
}

export const RoomCanvas: FC<ComponentProps<'div'>> = ({ className, ...props }) => {
  const { screen, record } = useRoomState()
  const [isReady, setIsReady] = useState(false)

  // Reset
  useEffect(() => setIsReady(false), [screen?.id])

  const {
    border,
    background,
    title,
    comp: Component,
  } = screen?.id ? config[screen.id] : { border: '', background: '', title: '', comp: () => null }
  const borderColor = border || (record ? 'border-destructive' : 'border-transparent')

  return (
    <div {...props} className={cn('absolute inset-0 z-1', className)}>
      {/* Content layer */}
      <div className='absolute inset-2 [&_.tl-watermark\\_SEE-LICENSE]:hidden!'>
        {screen && (
          <>
            <Loading
              className={cn(
                'absolute transition-opacity duration-300',
                isReady ? 'pointer-events-none opacity-0' : 'opacity-100'
              )}
            />
            <div className={cn('absolute inset-0', !isReady && 'invisible')}>
              <Component onReady={() => setIsReady(true)} />
            </div>
          </>
        )}
      </div>

      {/* Frame overlay */}
      <div
        className={cn('pointer-events-none absolute inset-0 z-10 rounded-md border-8', borderColor)}
      >
        <div
          className={cn(
            'pointer-events-auto absolute top-0 right-0 flex items-center gap-2 rounded-bl-md px-3 pt-1.5 pb-3.5',
            background
          )}
        >
          {record && (
            <button className='flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-xs font-semibold text-white'>
              <RecordIcon size={16} weight='fill' className='animate-pulse text-red-500' />
              REC
            </button>
          )}
          {title && <p className='-translate-y-px font-semibold first:translate-y-0'>{title}</p>}
        </div>
      </div>
    </div>
  )
}

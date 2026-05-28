'use client'

import type { FC } from 'react'
import { cn } from '@/lib/utils'
import { useRoomState } from '@/feat/Meeting/Room/State'
import { ScreenCode } from '@/feat/Meeting/enum'

export const RoomCanvas: FC = () => {
  const { screen } = useRoomState()
  const ringColor = {
    [ScreenCode.Whiteboard]: cn('border-blue-500'),
    [ScreenCode.WatchYoutube]: cn('border-lime-500'),
    [ScreenCode.Presentation]: cn('border-amber-500'),
  }

  // if (!screen) {
  //   return null
  // }

  return (
    <>
      {screen && (
        <div
          className={cn(
            'absolute inset-0 z-5 overflow-hidden rounded-md',
            screen.id > 1 && ['border-8', ringColor[screen.id]]
          )}
        />
      )}
    </>
  )
}

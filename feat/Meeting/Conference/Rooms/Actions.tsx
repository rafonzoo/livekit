'use client'

import type { FC } from 'react'
import { MicDisabledIcon, CameraDisabledIcon } from '@livekit/components-react'
import { ChevronUp } from '@hugeicons/core-free-icons'
import { HugeIcon } from '@/components/HugeIcon'
import { ButtonIcon } from '@/components/Button'

export const RoomsAction: FC = () => {
  return (
    <>
      <ButtonIcon>
        <MicDisabledIcon />
      </ButtonIcon>
      <div className='dark:bg-primary/50 flex items-center gap-1 rounded-full bg-red-200'>
        <div className='p-1'>
          <ButtonIcon className='size-10'>
            <CameraDisabledIcon />
          </ButtonIcon>
        </div>
        <button className='dark:hover:bg-primary/50 relative mr-2 -ml-1 inline-flex size-10 items-center justify-center rounded-full hover:bg-red-300'>
          <HugeIcon icon={ChevronUp} strokeWidth={2} />
        </button>
      </div>
    </>
  )
}

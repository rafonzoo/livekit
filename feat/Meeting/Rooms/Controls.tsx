'use client'

import type { FC, ReactNode } from 'react'
import { MonitorPlayIcon, PhoneSlashIcon, SmileyIcon } from '@phosphor-icons/react'
import {
  MicDisabledIcon,
  CameraDisabledIcon,
  MicIcon,
  CameraIcon,
  useRoomContext,
} from '@livekit/components-react'
import { setupDisconnectButton } from '@livekit/components-core'
import { useMediaControls } from '@/hooks'
import { ToggleTrack } from '@/feat/Meeting/PreJoin/ToggleTrack'
import { HugeIcon, ChevronUp } from '@/components/HugeIcon'
import { ButtonIcon } from '@/components/Button'

export const RoomsControl: FC<{ children?: ReactNode }> = ({ children }) => {
  const room = useRoomContext()
  const { disconnect } = setupDisconnectButton(room)
  const {
    audioEnabled,
    videoEnabled,
    shareScreenEnabled,
    handleToggleAudio,
    handleToggleVideo,
    handleToggleShareScreen,
  } = useMediaControls({ room })

  return (
    <div className='bg-background flex items-center justify-center gap-2 rounded-md border px-1 py-2 shadow *:not-[div]:size-10 md:*:not-[div]:size-12 xl:min-h-28 xl:gap-4 xl:px-5 xl:py-6'>
      <ToggleTrack
        title={audioEnabled ? 'Bisukan mikrofon' : 'Aktifkan mikrofon'}
        isActive={audioEnabled}
        onClick={handleToggleAudio}
        className='size-10 md:size-12'
      >
        {audioEnabled ? <MicIcon /> : <MicDisabledIcon />}
      </ToggleTrack>
      <div className='dark:bg-primary/50 flex items-center gap-1 rounded-full bg-red-200 p-1'>
        <ToggleTrack
          title={videoEnabled ? 'Tutup kamera' : 'Aktifkan kamera'}
          isActive={videoEnabled}
          onClick={handleToggleVideo}
          className='size-8 md:size-10'
        >
          {videoEnabled ? <CameraIcon /> : <CameraDisabledIcon />}
        </ToggleTrack>
        <button className='dark:hover:bg-primary/50 relative inline-flex size-8 items-center justify-center rounded-full hover:bg-red-300 md:size-10'>
          <HugeIcon icon={ChevronUp} strokeWidth={2} />
        </button>
      </div>
      {children}
      <ButtonIcon isActive={shareScreenEnabled} onClick={handleToggleShareScreen}>
        <MonitorPlayIcon weight='fill' size={22} />
      </ButtonIcon>
      <ButtonIcon isActive>
        <SmileyIcon weight='fill' size={24} />
      </ButtonIcon>
      <ButtonIcon
        onClick={(e) => {
          disconnect(true)
          e.currentTarget.disabled = true
        }}
      >
        <PhoneSlashIcon weight='fill' size={20} />
      </ButtonIcon>
    </div>
  )
}

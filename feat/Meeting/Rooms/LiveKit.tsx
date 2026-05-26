'use client'

import type { ComponentProps, CSSProperties, FC, ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'
import { default as dynamic } from 'next/dynamic'
import {
  HandIcon,
  MonitorPlayIcon,
  PhoneSlashIcon,
  SmileyIcon,
  SpinnerIcon,
} from '@phosphor-icons/react'
import {
  MicDisabledIcon,
  CameraDisabledIcon,
  useCreateLayoutContext,
  LayoutContextProvider,
  CarouselLayout,
  FocusLayout,
  FocusLayoutContainer,
  GridLayout,
  ParticipantTile,
  MicIcon,
  CameraIcon,
  RoomAudioRenderer,
  useMaybeRoomContext,
} from '@livekit/components-react'
import { cn, num } from '@/lib/utils'
import { useConferenceRoom, useMediaControls } from '@/hooks'
import { RoomsTabPanel } from '@/feat/Meeting/Rooms/TabPanel'
import { ToggleTrack } from '@/feat/Meeting/PreJoin/ToggleTrack'
import { SearchParamsKey } from '@/feat/Meeting/enum'
import { RoomTabs } from '@/feat/Meeting/const'
import { HugeIcon, ChevronUp } from '@/components/HugeIcon'
import { ButtonIcon } from '@/components/Button'

const Whiteboard = dynamic(() => import('@/feat/Meeting/Addons/Whiteboard'), {
  ssr: false,
  loading: () => (
    <div className='bg-background text-muted-foreground absolute inset-0 z-5 flex items-center justify-center overflow-hidden rounded-md text-sm'>
      <SpinnerIcon size={24} className='mr-2 animate-spin' /> Tunggu sebentar...
    </div>
  ),
})

export const RoomsControl: FC<{ children?: ReactNode }> = ({ children }) => {
  // useMediaControls needs the live room so it can publish/toggle tracks.
  // useMaybeRoomContext() is called here (inside the LiveKit tree) so it resolves correctly.
  const room = useMaybeRoomContext()
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
      <ButtonIcon>
        <PhoneSlashIcon weight='fill' size={20} />
      </ButtonIcon>
      {/*
        EXPERIMENTAL: Testing autoplayback
        <StartMediaButton />
      */}
    </div>
  )
}

export const RoomsLiveKit: FC<ComponentProps<'main'>> = ({ className, children, ...props }) => {
  const layoutContext = useCreateLayoutContext()
  const { tracks, focusTrack, carouselTracks } = useConferenceRoom({ layoutContext })

  // UI
  const searchParams = useSearchParams()
  const tab = num(searchParams.get(SearchParamsKey.Tabs))
  const isOpen = num(searchParams.get(SearchParamsKey.TabsState))
  const currentTab = RoomTabs.find(({ id }) => tab === id)
  const RoomsPanelContent = currentTab?.content ?? (() => null)
  const isWhiteboardOpen = !!num(searchParams.get(SearchParamsKey.Whiteboard))

  return (
    <LayoutContextProvider value={layoutContext}>
      <RoomAudioRenderer />
      {/* {!!handRaises.length && (
        <div className='bg-foreground text-background fixed top-5 right-10 left-10 z-10 h-6'>
          {handRaises.map((targetParticipantId) => (
            <button
              key={targetParticipantId}
              onClick={() => handleHandRaise({ action: 'lower_hand', targetParticipantId })}
            >
              {targetParticipantId}
            </button>
          ))}
        </div>
      )} */}
      <main {...props} className={cn('bg-secondary/40 fixed inset-0 p-3', className)}>
        <div className='flex h-full flex-col gap-3'>
          <div
            className={cn(
              '*:bg-background relative grid grow grid-cols-1 gap-3',
              isOpen && 'xl:grid-cols-[1fr_25rem]'
            )}
          >
            <div
              className='relative flex items-center justify-center rounded-md border shadow'
              data-lk-theme='default'
              style={{ '--lk-control-bar-height': '0px' } as CSSProperties}
            >
              <div className={cn(!isWhiteboardOpen ? 'hidden' : void 0)}>
                <Whiteboard />
              </div>
              <div className='absolute inset-0 *:h-full *:w-full'>
                {!focusTrack ? (
                  <div className='lk-grid-layout-wrapper'>
                    <GridLayout tracks={tracks}>
                      <ParticipantTile />
                    </GridLayout>
                  </div>
                ) : (
                  <div className='lk-focus-layout-wrapper'>
                    <FocusLayoutContainer>
                      {carouselTracks.length ? (
                        <CarouselLayout tracks={carouselTracks}>
                          <ParticipantTile />
                        </CarouselLayout>
                      ) : (
                        <div className='lk-carousel text-muted-foreground bg-secondary flex items-center justify-center rounded-md border p-5 text-center text-sm'>
                          Kamu sendirian <br /> diruangan ini.
                        </div>
                      )}
                      {focusTrack && <FocusLayout trackRef={focusTrack} />}
                    </FocusLayoutContainer>
                  </div>
                )}
              </div>
            </div>
            <RoomsTabPanel className='xl:bottom-34'>
              <RoomsPanelContent />
            </RoomsTabPanel>
          </div>
          <RoomsControl>
            <ButtonIcon
              isActive
              // onClick={() =>
              //   handleHandRaise({ action: 'hand_raise', participantId: room.localParticipant.sid })
              // }
            >
              <HandIcon weight='fill' size={20} />
            </ButtonIcon>
          </RoomsControl>
          {children}
        </div>
      </main>
    </LayoutContextProvider>
  )
}

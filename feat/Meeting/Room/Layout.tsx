'use client'

import type { ComponentProps, CSSProperties, FC } from 'react'
import { ConnectionState } from 'livekit-client'
import { HandIcon } from '@phosphor-icons/react'
import {
  useCreateLayoutContext,
  LayoutContextProvider,
  CarouselLayout,
  FocusLayout,
  FocusLayoutContainer,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  useMaybeRoomContext,
  useConnectionState,
} from '@livekit/components-react'
import { cn } from '@/lib/utils'
import { useParamsState, useConferenceRoom } from '@/hooks'
import { RoomToastInfo, RoomTabPanel, RoomControl, RoomCanvas } from '@/feat/Meeting/Room'
import { RoomTabs } from '@/feat/Meeting/const'
import { ButtonIcon } from '@/components/Button'

// const Whiteboard = dynamic(() => import('@/feat/Meeting/Addons/Whiteboard'), {
//   ssr: false,
//   loading: () => (
//     <div className='bg-background text-muted-foreground absolute inset-0 z-5 flex items-center justify-center overflow-hidden rounded-md text-sm'>
//       <SpinnerIcon size={24} className='mr-2 animate-spin' /> Sedang memuat...
//     </div>
//   ),
// })

export const RoomLayout: FC<ComponentProps<'main'>> = ({ className, children, ...props }) => {
  const layoutContext = useCreateLayoutContext()
  const { tracks, focusTrack, carouselTracks } = useConferenceRoom({ layoutContext })
  const { tabsCode, isPanelActive } = useParamsState()
  const currentTab = RoomTabs.find(({ id }) => tabsCode === id)
  const RoomPanelContent = currentTab?.content?.() ?? (() => null)
  const room = useMaybeRoomContext()
  const state = useConnectionState(room)

  return (
    <LayoutContextProvider value={layoutContext}>
      <RoomAudioRenderer />
      <main {...props} className={cn('bg-secondary/40 fixed inset-0 p-3', className)}>
        <div className='flex h-full flex-col gap-3'>
          <div
            className={cn(
              '*:bg-background relative grid grow grid-cols-1 gap-3',
              isPanelActive && state !== ConnectionState.Connecting && 'xl:grid-cols-[1fr_25rem]'
            )}
          >
            <div
              className='relative flex items-center justify-center rounded-md border shadow'
              data-lk-theme='default'
              style={{ '--lk-control-bar-height': '0px' } as CSSProperties}
            >
              {/* <div className={cn(!isWhiteboard ? 'hidden' : void 0)}>
                <Whiteboard />
              </div> */}
              <RoomCanvas />
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
              <RoomToastInfo />
            </div>
            <RoomTabPanel className='xl:bottom-34'>
              <RoomPanelContent />
            </RoomTabPanel>
          </div>
          {state !== ConnectionState.Connecting && (
            <RoomControl>
              <ButtonIcon isActive>
                <HandIcon weight='fill' size={20} />
              </ButtonIcon>
            </RoomControl>
          )}
          {children}
        </div>
      </main>
    </LayoutContextProvider>
  )
}

'use client'

import type { ParticipantStatus } from '@/feat/types'
import {
  BlockGameIcon,
  DoNotTouch01Icon,
  EllipsisVertical,
  HandIcon,
  Logout,
  Mic,
  MicOff,
} from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'
import { useTabsParticipant } from '@/hooks/use-tabs-participant'
import { useHandRaises } from '@/hooks'
import {
  TabsList,
  TabsListItemContent,
  TabsListGroup,
  TabsListItem,
  TabsListTitle,
  TabsListItemText,
  TabsListItemTitle,
  TabsListGroups,
} from '@/feat/Tabs/List'
import { getParticipantStatus } from '@/feat/helpers'
import { HugeIcon } from '@/components/HugeIcon'
import { Button } from '@/components/Button'

function ListParticipant() {
  const {
    participantGroups,
    shouldMuteAll,
    activeMenuId,
    menuRef,
    setActiveMenuId,
    handleBroadcastMuteAll,
    handleParticipantMute,
    handleDisconnect,
  } = useTabsParticipant()
  const { lowerHand, lowerHandLocal } = useHandRaises()

  return (
    <div className='flex w-full max-w-sm flex-col bg-white'>
      <TabsListGroups>
        {participantGroups.map(({ id, headline, lists }) => (
          <TabsListGroup key={id} className='flex flex-col'>
            <div className='flex items-center justify-between pb-2'>
              <TabsListTitle>{headline}</TabsListTitle>
            </div>

            <TabsList className='max-h-90 space-y-2 overflow-y-auto px-2'>
              {lists.map(({ id: identity, name, isSpeaking, isMuted, isModerator, attributes }) => {
                const statusList = getParticipantStatus(
                  isSpeaking,
                  attributes,
                  'arrayString'
                ) as string[]
                const statusText = statusList.length > 0 ? statusList.join(', ') : 'Idle'
                const status = getParticipantStatus(
                  isSpeaking,
                  attributes,
                  'object'
                ) as ParticipantStatus

                return (
                  <TabsListItem
                    key={identity}
                    className='relative flex items-center justify-between'
                  >
                    <div className='flex h-10 w-10 items-center justify-center rounded-full border border-neutral-400 bg-red-50'>
                      <span className='font-semibold text-red-800 uppercase'>
                        {name?.slice(0, 2)}
                      </span>
                    </div>

                    <TabsListItemContent>
                      <TabsListItemTitle className='max-w-47.5 truncate'>{name}</TabsListItemTitle>
                      <TabsListItemText
                        className='max-w-50 truncate text-xs text-neutral-500'
                        title={statusText}
                      >
                        {isModerator ? 'Moderator' : statusText}
                      </TabsListItemText>
                    </TabsListItemContent>

                    <menu className='flex items-center'>
                      <button
                        onClick={() => (isModerator ? lowerHandLocal() : lowerHand(identity))}
                        className={cn('cursor-pointer rounded-full p-2 hover:bg-neutral-100', {
                          'cursor-default hover:bg-transparent': !status.isHandRaised,
                        })}
                      >
                        {status.isHandRaised ? (
                          <HugeIcon icon={HandIcon} size={18} color='#991B1B' />
                        ) : (
                          <HugeIcon icon={DoNotTouch01Icon} size={18} color='#A3A3A3' />
                        )}
                      </button>
                      <button
                        onClick={() =>
                          isModerator
                            ? handleParticipantMute({
                                isLocal: true,
                                identity,
                              })
                            : handleParticipantMute({
                                identity,
                              })
                        }
                        className={cn('cursor-pointer rounded-full p-2 hover:bg-neutral-100', {
                          'cursor-default hover:bg-transparent': isMuted ?? isModerator,
                        })}
                      >
                        {isMuted ? (
                          <HugeIcon icon={MicOff} size={18} color='#A3A3A3' />
                        ) : (
                          <HugeIcon icon={Mic} size={18} color='#991B1B' />
                        )}
                      </button>

                      <div
                        className={cn('relative', { hidden: isModerator })}
                        ref={activeMenuId === identity ? menuRef : null}
                      >
                        <button
                          onClick={() =>
                            setActiveMenuId(activeMenuId === identity ? null : identity)
                          }
                          className='rounded-full p-2 hover:bg-neutral-100'
                        >
                          <HugeIcon icon={EllipsisVertical} size={18} />
                        </button>

                        {activeMenuId === identity && (
                          <div className='absolute top-full right-0 z-50 mt-2 w-56 rounded-xl border bg-white p-2 shadow-lg'>
                            <div className='absolute -top-2 right-6 h-4 w-4 rotate-45 border-t border-l bg-white' />

                            {[
                              {
                                icon: Logout,
                                text: 'Keluarkan peserta',
                                className: cn('bg-red-100 text-red-600 hover:bg-red-200'),
                                iconColor: '#dc2626',
                                onClick: () => handleDisconnect(identity),
                              },
                              {
                                icon: BlockGameIcon,
                                text: 'Blokir peserta',
                                className: 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200',
                              },
                            ].map((button, index) => (
                              <Button
                                key={index}
                                onClick={button.onClick}
                                className={cn(
                                  'mb-2 flex w-full items-center justify-start gap-2 rounded-lg px-4 py-3 text-sm transition-colors',
                                  button.className
                                )}
                              >
                                <HugeIcon icon={button.icon} size={18} color={button.iconColor} />
                                {button.text}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </menu>
                  </TabsListItem>
                )
              })}
            </TabsList>
          </TabsListGroup>
        ))}
      </TabsListGroups>

      <Button
        onClick={handleBroadcastMuteAll}
        className={cn(
          'mt-4 flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-red-200 p-3 text-sm text-red-800',
          {
            hidden: !shouldMuteAll,
          }
        )}
      >
        <HugeIcon icon={MicOff} size={16} />
        <span>Bisukan Semua Peserta</span>
      </Button>
    </div>
  )
}

export default ListParticipant

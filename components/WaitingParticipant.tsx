'use client'

import type { ParticipantStatus } from '@/feat/types'
import { cn } from '@/lib/utils'
import { useTabsParticipant } from '@/hooks/use-tabs-participant'
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
import { Button } from '@/components/Button'

function WaitingParticipant() {
  const { waitingParticipantGroups, handleBroadcastMuteAll } = useTabsParticipant()

  return (
    <div className='flex w-full max-w-sm flex-col bg-white'>
      <TabsListGroups>
        {waitingParticipantGroups.map(({ id, headline, lists }) => (
          <TabsListGroup key={id} className='flex flex-col'>
            <div className='flex items-center justify-between pb-2'>
              <TabsListTitle>{headline}</TabsListTitle>
            </div>

            <TabsList className='max-h-58 space-y-2 overflow-y-auto px-2'>
              {lists.map(({ id: identity, name, isSpeaking, isModerator, attributes }) => {
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

                    <menu className='grid grid-cols-2 items-center gap-2'>
                      <Button
                        onClick={handleBroadcastMuteAll}
                        className={cn(
                          'mt-4 flex w-full shrink-0 items-center justify-center gap-2 rounded-md border-red-200 bg-transparent p-1 px-3 text-xs text-red-800'
                        )}
                      >
                        <span>Tolak </span>
                      </Button>
                      <Button
                        onClick={handleBroadcastMuteAll}
                        className={cn(
                          'mt-4 flex w-full shrink-0 items-center justify-center gap-2 rounded-md border-green-200 bg-transparent p-1 px-3 text-xs text-green-800'
                        )}
                      >
                        <span>Terima </span>
                      </Button>
                    </menu>
                  </TabsListItem>
                )
              })}
            </TabsList>
          </TabsListGroup>
        ))}
      </TabsListGroups>

      <div className='grid grid-cols-2 gap-2'>
        <Button
          onClick={handleBroadcastMuteAll}
          className={cn(
            'mt-4 flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-red-200 p-3 text-sm text-red-800'
          )}
        >
          <span>Tolak Semua</span>
        </Button>
        <Button
          onClick={handleBroadcastMuteAll}
          className={cn(
            'mt-4 flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-green-200 p-3 text-sm text-green-800'
          )}
        >
          <span>Terima Semua</span>
        </Button>
      </div>
    </div>
  )
}

export default WaitingParticipant

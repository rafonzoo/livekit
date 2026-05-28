'use client'

import type { FC } from 'react'
import { RecordIcon, StopIcon } from '@phosphor-icons/react'
import { useTabsMeeting } from '@/hooks'
import {
  TabsList,
  TabsListItemContent,
  TabsListGroup,
  TabsListItemIcon,
  TabsListItem,
  TabsListTitle,
  TabsListItemText,
  TabsListItemTitle,
  TabsListGroups,
  TabsListItemAction,
  TabsListItemActionStart,
  TabsMeetingIcon,
  TabsListItemActionRecord,
} from '@/feat/Tabs'

export const TabsMeeting: FC = () => {
  const { activeScreen, items } = useTabsMeeting()

  return (
    <TabsListGroups>
      {items.map(({ id, headline, lists }) => (
        <TabsListGroup key={id}>
          <TabsListTitle>{headline}</TabsListTitle>
          <TabsList>
            {lists.map(({ id, code, title, description, isRecording, icon, handle }) => (
              <TabsListItem key={id}>
                {!code && <TabsListItemAction onClick={handle} />}
                <TabsListItemIcon>
                  <TabsMeetingIcon name={icon} />
                </TabsListItemIcon>
                <TabsListItemContent>
                  <TabsListItemTitle>{title}</TabsListItemTitle>
                  <TabsListItemText>{description}</TabsListItemText>
                </TabsListItemContent>
                {code > 0 &&
                  (typeof isRecording === 'undefined' ? (
                    <TabsListItemActionStart
                      onClick={handle}
                      disabled={activeScreen && activeScreen !== code}
                    >
                      {activeScreen === code ? 'Berhenti' : 'Mulai'}
                    </TabsListItemActionStart>
                  ) : (
                    <TabsListItemActionRecord onClick={handle}>
                      {isRecording ? (
                        <StopIcon size={27} weight='fill' />
                      ) : (
                        <RecordIcon size={27} weight='fill' />
                      )}
                    </TabsListItemActionRecord>
                  ))}
              </TabsListItem>
            ))}
          </TabsList>
        </TabsListGroup>
      ))}
    </TabsListGroups>
  )
}

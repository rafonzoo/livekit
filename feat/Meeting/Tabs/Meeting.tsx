'use client'

import type { FC } from 'react'
import type { TabsContentIconId } from '@/feat/Meeting/const'
import { useRoomContext } from '@livekit/components-react'
import { useParamsState } from '@/hooks/use-params-state'
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
  TabsIcon,
} from '@/feat/Meeting/Tabs'
import { LiveKitAction, ScreenCode } from '@/feat/Meeting/enum'
import { TabsContents } from '@/feat/Meeting/const'

export const TabsMeeting: FC = () => {
  const room = useRoomContext()
  const { isWhiteboard, toggleScreen, openTabsSharedNotes, openTabsPolling, openTabsWatchYoutube } =
    useParamsState()

  const tablistAction: Partial<Record<TabsContentIconId, () => unknown>> = {
    'share-note': openTabsSharedNotes,
    polling: openTabsPolling,
  }

  const tablistActionStart: Partial<Record<TabsContentIconId, () => unknown>> = {
    // 'pick-random': () => void 0,
    // recording: () => void 0,
    'watch-youtube': openTabsWatchYoutube,
    presentation: () => void 0,
    whiteboard: async () => {
      toggleScreen(ScreenCode.Whiteboard)

      const encoder = new TextEncoder()
      const message = encoder.encode(
        JSON.stringify({
          action: !isWhiteboard ? LiveKitAction.WhiteboardRequest : LiveKitAction.WhiteboardClose,
        })
      )

      room.localParticipant.publishData(message, { reliable: false })
    },
  }

  return (
    <TabsListGroups>
      {TabsContents.filter(({ hide }) => !hide).map(({ id, headline, lists }) => (
        <TabsListGroup key={id}>
          <TabsListTitle>{headline}</TabsListTitle>
          <TabsList>
            {lists
              .filter(({ hide }) => !hide)
              .map(({ id, title, description, icon }) => (
                <TabsListItem key={id}>
                  {id in tablistAction && (
                    <TabsListItemAction onClick={() => tablistAction[id]?.()} />
                  )}
                  <TabsListItemIcon>
                    <TabsIcon name={icon} />
                  </TabsListItemIcon>
                  <TabsListItemContent>
                    <TabsListItemTitle>{title}</TabsListItemTitle>
                    <TabsListItemText>{description}</TabsListItemText>
                  </TabsListItemContent>
                  {id in tablistActionStart && (
                    <TabsListItemActionStart onClick={() => tablistActionStart[id]?.()}>
                      Mulai
                    </TabsListItemActionStart>
                  )}
                </TabsListItem>
              ))}
          </TabsList>
        </TabsListGroup>
      ))}
    </TabsListGroups>
  )
}

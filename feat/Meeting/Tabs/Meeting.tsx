'use client'

import type { FC } from 'react'
import type { TabsContentIconId } from '@/feat/Meeting/Tabs/content'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { qstring } from '@/lib/utils'
import {
  TabsList,
  TabsListItemContent,
  TabsListGroup,
  TabsListItemIcon,
  TabsListItem,
  TabsListTitle,
  TabsListItemText,
  TabsListItemTitle,
  TabsGroups,
  TabsListItemAction,
  TabsListItemActionStart,
} from '@/feat/Meeting/Tabs/List'
import { TabsIcon } from '@/feat/Meeting/Tabs/Icon'
import { TabsContent } from '@/feat/Meeting/Tabs/content'

export const TabsMeeting: FC = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentParams = Object.fromEntries(searchParams)

  const tablistAction: Partial<Record<TabsContentIconId, () => unknown>> = {
    'share-note': () => router.replace(qstring(pathname, { ...currentParams, tab: 11 })),
    polling: () => router.replace(qstring(pathname, { ...currentParams, tab: 12 })),
  }

  const tablistActionStart: Partial<Record<TabsContentIconId, () => unknown>> = {
    // 'pick-random': () => void 0,
    // recording: () => void 0,
    'watch-youtube': () => router.replace(qstring(pathname, { ...currentParams, tab: 13 })),
    presentation: () => void 0,
    whiteboard: () => void 0,
  }

  return (
    <TabsGroups>
      {TabsContent.filter(({ hide }) => !hide).map(({ id, headline, lists }) => (
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
    </TabsGroups>
  )
}

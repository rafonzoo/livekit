import { useEffect, useEffectEvent } from 'react'
import { omit, qstring } from '@/lib/utils'
import { useParamsState } from '@/hooks/use-params-state'
import { SearchParamsKey } from '@/feat/Meeting/enum'
import { RoomTabs } from '@/feat/Meeting/const'

export function useTabEffect() {
  const { router, tabsCode, pathname, currentParams, isWhiteboard, closeScreen } = useParamsState()

  const redirectInvalidTab = useEffectEvent((tabId: number) => {
    if (!RoomTabs.find((tabs) => tabs.id === tabId)) {
      router.replace(
        qstring(
          pathname,
          omit(currentParams, [SearchParamsKey.TabsCode, SearchParamsKey.PanelCode])
        )
      )
    }
  })

  const redirectUnauthorizedWhiteboard = useEffectEvent(() => {
    if (isWhiteboard) {
      closeScreen()
    }
  })

  useEffect(() => redirectInvalidTab(tabsCode), [tabsCode])
  useEffect(() => redirectUnauthorizedWhiteboard(), [])
}

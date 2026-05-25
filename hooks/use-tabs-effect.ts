import { useEffect, useEffectEvent } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { num, omit, qstring } from '@/lib/utils'
import { SearchParamsKey, LiveKitConfig } from '@/feat/Meeting/enum'
import { RoomTabs } from '@/feat/Meeting/const'

export function useTabEffect() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tab = num(searchParams.get(SearchParamsKey.Tabs))

  const redirectInvalidTab = useEffectEvent((tabId: number) => {
    if (!RoomTabs.find((tabs) => tabs.id === tabId)) {
      router[LiveKitConfig.TabsPushMethod](
        qstring(
          pathname,
          omit({ ...Object.fromEntries(searchParams) }, [
            SearchParamsKey.Tabs,
            SearchParamsKey.TabsState,
          ])
        )
      )
    }
  })

  useEffect(() => redirectInvalidTab(tab), [tab])
}

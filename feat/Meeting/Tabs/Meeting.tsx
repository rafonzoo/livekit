'use client'

import type { FC } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { qstring } from '@/lib/utils'
import { LiveKitConfig } from '@/feat/Meeting/enum'

export const TabsMeeting: FC = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  return (
    <div data-slot='tabs-meeting'>
      <p>TabsMeeting</p>
      <button
        onClick={() =>
          router[LiveKitConfig.TabsPushMethod](
            qstring(pathname, { ...Object.fromEntries(searchParams), tab: 11 })
          )
        }
      >
        Go to Shared Notes
      </button>
    </div>
  )
}

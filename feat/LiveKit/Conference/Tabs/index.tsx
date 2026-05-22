'use client'

import type { ComponentProps, FC } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { cn, qstring } from '@/lib/utils'

export * from '@/feat/LiveKit/Conference/Tabs/Chat'

export * from '@/feat/LiveKit/Conference/Tabs/Meeting'

export * from '@/feat/LiveKit/Conference/Tabs/Participant'

export * from '@/feat/LiveKit/Conference/Tabs/Personalize'

export * from '@/feat/LiveKit/Conference/Tabs/Settings'

export const ConferenceTabs: FC<ComponentProps<'div'>> = ({ className, ...props }) => {
  return <div data-slot='conference-tabs' className={cn('flex gap-3', className)} {...props} />
}

export const ConferenceTabsButton: FC<ComponentProps<'button'> & { tab: number }> = ({
  className,
  tab,
  onClick,
  ...props
}) => {
  const searchParams = useSearchParams()
  const currentTab = Number(searchParams.get('tab'))
  const router = useRouter()
  const pathname = usePathname()

  return (
    <button
      type='button'
      data-slot='conference-tabs-button'
      className={cn(
        'focus:ring-primary inline-flex size-10 items-center justify-center rounded-md border shadow',
        currentTab === tab
          ? 'bg-primary text-primary-foreground hover:not-disabled:bg-red-900'
          : 'text-muted-foreground hover:not-disabled:text-primary hover:not-disabled:border-primary hover:not-disabled:bg-primary/20',
        className
      )}
      onClick={(e) => {
        onClick?.(e)

        if (!e.defaultPrevented) {
          router.replace(
            !currentTab || currentTab !== tab
              ? qstring(pathname, { ...Object.fromEntries(searchParams), tab })
              : pathname
          )
        }
      }}
      {...props}
    />
  )
}

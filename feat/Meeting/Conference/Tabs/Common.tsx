'use client'

import type { ComponentProps, FC } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { XIcon } from '@phosphor-icons/react'
import { cn, omit, qstring } from '@/lib/utils'

export * from '@/feat/Meeting/Conference/Tabs/Chat'

export * from '@/feat/Meeting/Conference/Tabs/Meeting'

export * from '@/feat/Meeting/Conference/Tabs/Participant'

export * from '@/feat/Meeting/Conference/Tabs/Personalize'

export * from '@/feat/Meeting/Conference/Tabs/Settings'

export interface ConferencePanelProps extends ComponentProps<'aside'> {
  tabs: {
    id: number
    title: string
  }[]
}

export const ConferenceTabsPanel: FC<ConferencePanelProps> = ({
  tabs,
  className,
  children,
  ...props
}) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tab = Number(searchParams.get('tab'))
  const currentTab = tabs.find(({ id }) => id === tab)

  if (!currentTab) {
    return null
  }

  return (
    <aside
      data-slot='conference-panel'
      className={cn(
        'fixed top-3 right-3 bottom-16 left-3 z-10 rounded-md border p-5 shadow md:left-auto md:w-100 md:max-w-100',
        className
      )}
      {...props}
    >
      <div data-slot='conference-panel-header' className='flex items-center justify-between'>
        <h2 className='text-primary font-semibold'>{currentTab.title}</h2>
        <button
          type='button'
          className='text-destructive inline-flex size-11 cursor-pointer items-center justify-center rounded-md bg-red-200 hover:bg-red-300'
          onClick={() =>
            router.replace(
              qstring(pathname, { ...omit(Object.fromEntries(searchParams), ['tab']) })
            )
          }
        >
          <XIcon size={20} />
        </button>
      </div>
      <hr className='border-primary my-6 border' />
      {children}
    </aside>
  )
}

export const ConferenceTabsTitle: FC<ComponentProps<'h3'>> = ({ className, ...props }) => {
  return (
    <h3
      data-slot='conference-tabs-title'
      className={cn('text-muted-foreground mb-4 font-semibold', className)}
      {...props}
    />
  )
}

export const ConferenceTabsButton: FC<
  ComponentProps<'button'> & { tab?: number; toggle?: boolean }
> = ({ className, tab = -1, toggle = false, onClick, ...props }) => {
  const searchParams = useSearchParams()
  const currentTab = Number(searchParams.get('tab'))
  const router = useRouter()
  const pathname = usePathname()

  return (
    <button
      type='button'
      data-slot='conference-tabs-button'
      className={cn(
        'focus:ring-primary inline-flex size-10 cursor-pointer items-center justify-center rounded-md border shadow',
        currentTab === tab
          ? 'bg-primary text-primary-foreground hover:not-disabled:bg-red-900'
          : 'text-muted-foreground hover:not-disabled:text-primary hover:not-disabled:border-primary hover:not-disabled:bg-primary/20',
        className
      )}
      onClick={(e) => {
        onClick?.(e)

        if (!e.defaultPrevented && toggle) {
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

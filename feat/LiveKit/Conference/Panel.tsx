'use client'

import type { ComponentProps, FC } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { XIcon } from '@phosphor-icons/react'
import { cn, omit, qstring } from '@/lib/utils'

export const ConferencePanelHeader: FC<ComponentProps<'p'>> = ({ className, ...props }) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  return (
    <div data-slot='conference-panel-header' className='flex items-center justify-between'>
      <p className={cn('text-primary font-semibold', className)} {...props} />
      <button
        type='button'
        className='text-destructive inline-flex size-11 items-center justify-center rounded-md bg-red-200'
        onClick={() =>
          router.replace(qstring(pathname, { ...omit(Object.fromEntries(searchParams), ['tabs']) }))
        }
      >
        <XIcon />
      </button>
    </div>
  )
}

export interface ConferencePanelProps extends ComponentProps<'aside'> {
  tabs: {
    id: number
    title: string
  }[]
}

export const ConferencePanel: FC<ConferencePanelProps> = ({
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
        'absolute top-0 right-0 bottom-0 w-100 max-w-full rounded-md border p-5 shadow lg:relative',
        className
      )}
      {...props}
    >
      <div data-slot='conference-panel-header' className='flex items-center justify-between'>
        <p className='text-primary font-semibold'>{currentTab.title}</p>
        <button
          type='button'
          className='text-destructive inline-flex size-11 items-center justify-center rounded-md bg-red-200'
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

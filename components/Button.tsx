'use client'

import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export const ButtonIcon = ({
  isActive,
  ...props
}: ComponentProps<'button'> & { isActive?: boolean }) => {
  return (
    <button
      type='button'
      {...props}
      className={cn(
        'relative flex size-12 items-center justify-center rounded-full',
        isActive
          ? 'text-primary border-muted-foreground border bg-white hover:not-disabled:bg-zinc-100'
          : 'bg-primary text-primary-foreground hover:not-disabled:bg-red-900',

        props.className
      )}
    />
  )
}

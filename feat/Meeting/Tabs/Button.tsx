'use client'

import type { ComponentProps, FC } from 'react'
import { cn } from '@/lib/utils'

export const TabsButton: FC<ComponentProps<'button'> & { isActive?: boolean }> = ({
  className,
  isActive,
  ...props
}) => {
  return (
    <button
      type='button'
      data-slot='tabs-button'
      className={cn(
        'focus:ring-primary inline-flex size-10 items-center justify-center rounded-md border shadow not-disabled:cursor-pointer',
        isActive
          ? 'bg-primary text-primary-foreground hover:not-disabled:bg-red-900'
          : 'text-muted-foreground hover:not-disabled:text-primary hover:not-disabled:border-primary hover:not-disabled:bg-primary/20',
        className
      )}
      {...props}
    />
  )
}

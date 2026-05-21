'use client'

import type { ComponentProps } from 'react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

export const ToggleTrack = ({
  isActive,
  ...props
}: ComponentProps<'button'> & { isActive?: boolean }) => {
  const [mounted, setMounted] = useState(false)

  // Required for hydration
  useEffect(() => setMounted(true), [])

  return mounted ? (
    <div className='p-1'>
      <button
        type='button'
        {...props}
        className={cn(
          'relative flex size-10 items-center justify-center rounded-full',
          isActive
            ? 'bg-background text-primary border-muted-foreground hover:not-disabled:bg-secondary border'
            : 'bg-primary text-primary-foreground hover:not-disabled:bg-red-900',

          props.className
        )}
      />
    </div>
  ) : null
}

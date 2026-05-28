'use client'

import type { ComponentProps, FC } from 'react'
import { cn } from '@/lib/utils'

export const TabsListGroups: FC<ComponentProps<'div'>> = ({ className, ...props }) => {
  return <div data-slot='tabs-groups' {...props} className={cn('flex flex-col gap-2', className)} />
}

export const TabsListGroup: FC<ComponentProps<'div'>> = ({ className, ...props }) => {
  return (
    <div data-slot='tabs-list-group' {...props} className={cn('flex flex-col gap-2', className)} />
  )
}

export const TabsListTitle: FC<ComponentProps<'h3'>> = ({ className, ...props }) => {
  return (
    <h3
      data-slot='tabs-list-title'
      {...props}
      className={cn('text-muted-foreground font-semibold', className)}
    />
  )
}

export const TabsList: FC<ComponentProps<'ul'>> = ({ className, ...props }) => {
  return <ul data-slot='tabs-list' {...props} className={cn('-mx-2.5 flex flex-col', className)} />
}

export const TabsListItem: FC<ComponentProps<'li'>> = ({ className, ...props }) => {
  return (
    <li
      data-slot='tabs-list-item'
      {...props}
      className={cn(
        'has-[[data-slot="tabs-list-item-action"]:hover:not(:disabled)]:bg-primary/10 has-[[data-slot="tabs-list-item-action"]:hover:not(:disabled)]:border-primary relative flex items-center gap-2 rounded-md border border-transparent px-2.5 py-2 text-sm',
        className
      )}
    />
  )
}

export const TabsListItemIcon: FC<ComponentProps<'div'>> = ({ className, ...props }) => {
  return (
    <div
      data-slot='tabs-list-item-icon'
      {...props}
      className={cn(
        'border-primary bg-primary/10 text-primary flex size-10 items-center justify-center rounded-md border *:size-5',
        className
      )}
    />
  )
}

export const TabsListItemContent: FC<ComponentProps<'div'>> = ({ className, ...props }) => {
  return (
    <div
      data-slot='tabs-list-content'
      {...props}
      className={cn('mr-auto flex h-10 flex-col justify-between', className)}
    />
  )
}

export const TabsListItemTitle: FC<ComponentProps<'p'>> = ({ className, ...props }) => {
  return (
    <p
      data-slot='tabs-list-item-title'
      {...props}
      className={cn('text-primary font-semibold', className)}
    />
  )
}

export const TabsListItemText: FC<ComponentProps<'p'>> = ({ className, ...props }) => {
  return <p data-slot='tabs-list-item-text' {...props} className={cn('text-xs', className)} />
}

export const TabsListItemAction: FC<ComponentProps<'button'>> = ({
  className,
  onClick,
  ...props
}) => {
  return (
    <button
      data-slot='tabs-list-item-action'
      type='button'
      {...props}
      onClick={(e) => onClick?.(e)}
      className={cn('absolute inset-0 rounded-md', !props.disabled && 'cursor-pointer', className)}
    />
  )
}

export const TabsListItemActionStart: FC<ComponentProps<'button'>> = ({
  className,
  onClick,
  ...props
}) => {
  return (
    <button
      data-slot='tabs-list-item-action-start'
      type='button'
      {...props}
      onClick={(e) => onClick?.(e)}
      className={cn(
        'border-primary bg-primary/10 text-primary hover:bg-primary/20 inline-flex h-8 items-center justify-center rounded-md border px-2.5 font-semibold hover:not-disabled:cursor-pointer disabled:opacity-40',
        !props.disabled && 'cursor-pointer',
        className
      )}
    />
  )
}

export const TabsListItemActionRecord: FC<ComponentProps<'button'>> = ({
  className,
  onClick,
  ...props
}) => {
  return (
    <button
      data-slot='tabs-list-item-action-record'
      type='button'
      {...props}
      onClick={(e) => onClick?.(e)}
      className={cn(
        'border-destructive text-destructive rounded-full',
        !props.disabled && 'cursor-pointer',
        className
      )}
    />
  )
}

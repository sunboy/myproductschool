import * as React from 'react'
import { Slot } from 'radix-ui'
import { cn } from '@/lib/utils'

/** List row: leading badge, title, trailing meta, one action. 40px min height. */
export interface RowProps extends Omit<React.ComponentProps<'div'>, 'title'> {
  leading?: React.ReactNode
  title: React.ReactNode
  meta?: React.ReactNode
  action?: React.ReactNode
  asChild?: boolean
  titleClassName?: string
}

export function Row({ leading, title, meta, action, asChild = false, className, titleClassName, ...props }: RowProps) {
  const Comp = asChild ? Slot.Root : 'div'
  return (
    <Comp
      data-slot="row"
      className={cn('grid min-h-control-lg grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3.5 border-b border-hairline px-3 py-1.5 text-ink-strong last:border-b-0 hover:bg-surface-container-low', className)}
      {...props}
    >
      {asChild ? props.children : (
        <>
          <div className="flex min-w-0 items-center">{leading}</div>
          <div className={cn('min-w-0 truncate font-headline text-body font-strong', titleClassName)}>{title}</div>
          <div className="whitespace-nowrap text-meta font-ui text-ink-secondary">{meta}</div>
          <div className="flex items-center justify-end">{action}</div>
        </>
      )}
    </Comp>
  )
}

/** Bordered container for a stack of Rows. */
export function RowList({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="row-list" className={cn('overflow-hidden rounded-card border border-hairline bg-card-bright', className)} {...props} />
}

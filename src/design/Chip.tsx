'use client'
import * as React from 'react'
import { Slot } from 'radix-ui'
import { cn } from '@/lib/utils'

/** Chips: `filter` (toggle in a row of options), `suggestion` (tactile prompt
 *  chip, always with an icon), `tag` (static label). */
export interface ChipProps extends React.ComponentProps<'button'> {
  variant?: 'filter' | 'suggestion' | 'tag'
  selected?: boolean
  icon?: React.ReactNode
  count?: number | string
  asChild?: boolean
}

export function Chip({ variant = 'filter', selected = false, icon, count, asChild = false, className, children, type, ...props }: ChipProps) {
  const Comp = asChild ? Slot.Root : variant === 'tag' ? 'span' : 'button'
  return (
    <Comp
      data-slot="chip"
      data-variant={variant}
      aria-pressed={variant === 'filter' && !asChild ? selected : undefined}
      type={Comp === 'button' ? (type ?? 'button') : undefined}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-control border font-ui text-meta text-ink-strong transition-[background-color,transform] duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 [&_svg]:size-4 [&_svg]:shrink-0',
        variant === 'filter' && 'h-control-sm px-3 border-hairline-strong bg-card-bright hover:bg-surface-container-low active:translate-y-px',
        variant === 'filter' && selected && 'border-forest-800 bg-forest-800 text-white hover:bg-forest-800',
        variant === 'suggestion' && 'h-control-md border-hairline bg-surface-container-low px-3 pl-2.5 shadow-[0_1px_0_rgba(32,41,31,0.06)] hover:border-primary-fixed hover:bg-primary-fixed active:translate-y-px active:shadow-none [&_svg]:text-primary',
        variant === 'tag' && 'h-control-sm cursor-default px-2.5 border-hairline bg-surface-container-low',
        className,
      )}
      {...props}
    >
      {icon}
      {children}
      {count !== undefined && <b className="font-bold">{count}</b>}
    </Comp>
  )
}

'use client'
import * as React from 'react'
import { Slot } from 'radix-ui'
import { cn } from '@/lib/utils'
import { AppTooltip } from '@/components/ui/AppTooltip'

/** Icon-only control: 32px visual (md) or 28px (sm) with a 40px hit area via
 *  the ::after pseudo. `label` is required and doubles as the tooltip. */
export interface IconButtonProps extends React.ComponentProps<'button'> {
  label: string
  variant?: 'outline' | 'ghost' | 'primary'
  size?: 'sm' | 'md' | 'lg'
  tooltip?: boolean
  tooltipSide?: 'top' | 'bottom' | 'left' | 'right'
  asChild?: boolean
  active?: boolean
}

const VARIANT = {
  outline: 'border-hairline bg-card-bright hover:bg-surface-container',
  ghost: 'border-transparent bg-transparent hover:bg-surface-container',
  primary: 'border-transparent bg-forest-800 text-white hover:bg-forest-950',
}
const SIZE = { sm: 'size-control-sm [&_svg]:size-4', md: 'size-control-md [&_svg]:size-4', lg: 'size-control-lg [&_svg]:size-5' }

export function IconButton({ label, variant = 'outline', size = 'md', tooltip = true, tooltipSide = 'bottom', asChild = false, active, className, type, ...props }: IconButtonProps) {
  const Comp = asChild ? Slot.Root : 'button'
  const el = (
    <Comp
      data-slot="icon-button"
      aria-label={label}
      aria-pressed={active}
      type={asChild ? undefined : (type ?? 'button')}
      className={cn(
        'relative inline-grid shrink-0 place-items-center rounded-control border text-ink-strong transition-[background-color,transform] duration-100 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-50',
        'after:absolute after:-inset-1 after:content-[""]',
        VARIANT[variant], SIZE[size], active && variant !== 'primary' && 'bg-forest-800 text-white hover:bg-forest-800', className,
      )}
      {...props}
    />
  )
  return tooltip ? <AppTooltip label={label} side={tooltipSide}>{el}</AppTooltip> : el
}

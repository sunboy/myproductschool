'use client'
import * as React from 'react'
import { Slot } from 'radix-ui'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { AppTooltip } from '@/components/ui/AppTooltip'

/** UI-language button. The only way to render a button-shaped control in
 *  density / shell-v2 code. Sizes follow the control scale (28 / 32 / 40).
 *  `hint` renders a keyboard hint as a tooltip, never inline. */
export const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-control border border-transparent font-ui text-ui text-ink-strong transition-[background-color,transform] duration-100 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-forest-800 text-white hover:bg-forest-950',
        tonal: 'bg-surface-container text-ink-strong hover:bg-surface-container-high',
        ghost: 'bg-transparent hover:bg-surface-container',
        outline: 'border-hairline-strong bg-card-bright hover:bg-surface-container-low',
        danger: 'bg-error text-white hover:opacity-90',
      },
      size: {
        sm: 'h-control-sm px-3 text-meta font-strong [&_svg]:size-3.5',
        md: 'h-control-md px-3.5 font-strong [&_svg]:size-4',
        lg: 'h-control-lg px-4.5 text-body font-strong [&_svg]:size-[18px]',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

export interface ButtonProps extends React.ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
  /** Keyboard hint shown in a tooltip (e.g. "⌘⏎"). */
  hint?: string
  hintSide?: 'top' | 'bottom' | 'left' | 'right'
}

export function Button({ className, variant, size, asChild = false, hint, hintSide = 'bottom', type, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button'
  const el = (
    <Comp
      data-slot="button"
      data-variant={variant ?? 'primary'}
      type={asChild ? undefined : (type ?? 'button')}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
  return hint ? <AppTooltip label={hint} side={hintSide}>{el}</AppTooltip> : el
}

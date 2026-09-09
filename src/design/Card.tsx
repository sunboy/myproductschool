import * as React from 'react'
import { Slot } from 'radix-ui'
import { cn } from '@/lib/utils'

/** Card contract: tonal surface, no fixed height, and a CSS container so
 *  children size with `cqw` clamps instead of pixel heights. */
export interface CardProps extends React.ComponentProps<'div'> {
  tone?: 'bright' | 'surface' | 'tinted' | 'forest'
  padding?: 'none' | 'sm' | 'md'
  radius?: 'card' | 'panel'
  interactive?: boolean
  asChild?: boolean
}

export function Card({ tone = 'bright', padding = 'md', radius = 'card', interactive = false, asChild = false, className, ...props }: CardProps) {
  const Comp = asChild ? Slot.Root : 'div'
  return (
    <Comp
      data-slot="card"
      data-tone={tone}
      className={cn(
        '@container relative flex min-w-0 flex-col overflow-hidden border',
        radius === 'card' ? 'rounded-card' : 'rounded-panel',
        tone === 'bright' && 'border-hairline bg-card-bright',
        tone === 'surface' && 'border-transparent bg-surface-container',
        tone === 'tinted' && 'border-transparent bg-surface-container-low',
        tone === 'forest' && 'border-transparent bg-forest-800 text-white',
        padding === 'sm' && 'p-3', padding === 'md' && 'p-4',
        interactive && 'transition-shadow hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
        className,
      )}
      {...props}
    />
  )
}

/** Art slot with an aspect ratio instead of a height. */
export function CardArt({ ratio = '16/6', className, ...props }: React.ComponentProps<'div'> & { ratio?: string }) {
  return <div data-slot="card-art" className={cn('relative overflow-hidden', className)} style={{ aspectRatio: ratio }} {...props} />
}

'use client'
import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SegmentedTab<T extends string = string> { value: T; label: React.ReactNode; testId?: string }

/** Pill tabs in a tonal track. Reads as a control at a glance. */
export function SegmentedTabs<T extends string>({ items, value, onChange, size = 'sm', className, ariaLabel, wrap = false }: {
  items: SegmentedTab<T>[]; value: T; onChange: (v: T) => void; size?: 'sm' | 'md'; className?: string; ariaLabel?: string; wrap?: boolean
}) {
  return (
    <div role="tablist" aria-label={ariaLabel} data-slot="segmented-tabs" className={cn('inline-flex max-w-full gap-0.5 rounded-control bg-surface-container p-[3px]', wrap ? 'flex-wrap rounded-card' : 'overflow-x-auto', className)}>
      {items.map(it => {
        const on = it.value === value
        return (
          <button
            key={it.value}
            role="tab"
            type="button"
            aria-selected={on}
            data-testid={it.testId}
            onClick={() => onChange(it.value)}
            className={cn(
              'inline-flex shrink-0 items-center whitespace-nowrap rounded-control px-3 font-ui text-meta text-ink-secondary transition-colors hover:text-ink-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
              size === 'sm' ? 'h-6' : 'h-control-md text-ui',
              on && 'bg-card-bright font-strong text-ink-strong shadow-[0_1px_2px_rgba(32,41,31,0.12)]',
            )}
          >{it.label}</button>
        )
      })}
    </div>
  )
}

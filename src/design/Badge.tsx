import * as React from 'react'
import { cn } from '@/lib/utils'

export type BadgeTone = 'type' | 'difficulty' | 'status' | 'pro' | 'neutral' | 'warn'

const TYPE: Record<string, string> = {
  algorithm: 'bg-primary-fixed text-forest-800', coding: 'bg-primary-fixed text-forest-800',
  sql: 'bg-[#ece6f7] text-[#4b3a7a]', system_design: 'bg-ai-assisted-soft text-[#2a4e8a]', design: 'bg-ai-assisted-soft text-[#2a4e8a]',
  data_modeling: 'bg-secondary-container text-on-secondary-container', flow: 'bg-[#e0eefb] text-[#1e4d7a]', product: 'bg-[#e0eefb] text-[#1e4d7a]', freeform: 'bg-[#e0eefb] text-[#1e4d7a]',
  analytics: 'bg-amber-soft text-tertiary', autopsy: 'bg-secondary-container text-on-secondary-container', guide: 'bg-primary-fixed text-forest-800', plan: 'bg-amber-soft text-tertiary',
}
const DIFF: Record<string, string> = { easy: 'text-forest-800', medium: 'text-tertiary', hard: 'text-error' }

/** Small status pills. `tone="type"` colours by challenge/content type,
 *  `tone="difficulty"` colours the text by level; both read `value`. */
export function Badge({ tone = 'neutral', value, className, children, ...props }: React.ComponentProps<'span'> & { tone?: BadgeTone; value?: string | null }) {
  const key = (value ?? '').toLowerCase()
  return (
    <span
      data-slot="badge"
      data-tone={tone}
      className={cn(
        'inline-flex h-5 shrink-0 items-center whitespace-nowrap rounded-control px-2 text-caption font-bold',
        tone === 'type' && cn('uppercase tracking-[.06em]', TYPE[key] ?? 'bg-surface-container-highest text-on-surface-variant'),
        tone === 'difficulty' && cn('bg-surface-container font-ui', DIFF[key] ?? 'text-ink-secondary'),
        tone === 'status' && 'bg-primary-fixed text-forest-800',
        tone === 'pro' && 'bg-amber-soft uppercase tracking-[.06em] text-tertiary',
        tone === 'neutral' && 'bg-surface-container font-ui text-ink-secondary',
        tone === 'warn' && 'bg-error-container font-ui text-on-error-container',
        className,
      )}
      {...props}
    >{children}</span>
  )
}

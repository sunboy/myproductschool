import * as React from 'react'
import { Slot } from 'radix-ui'
import { cn } from '@/lib/utils'

const VARIANT = {
  display: 'font-headline text-display font-bold text-ink-strong',
  h1: 'font-headline text-h1 font-bold text-ink-strong',
  h2: 'font-headline text-h2 font-bold text-ink-strong',
  h3: 'font-headline text-h3 font-bold text-ink-strong',
  h4: 'font-headline text-h4 font-bold text-ink-strong',
  lede: 'text-lede font-text',
  body: 'text-body font-text',
  ui: 'text-ui font-ui',
  meta: 'text-meta font-ui text-ink-secondary',
  caption: 'text-caption font-bold uppercase tracking-[.08em] text-ink-secondary',
} as const
const TONE = { strong: 'text-ink-strong', ink: 'text-on-surface', secondary: 'text-ink-secondary', primary: 'text-primary', forest: 'text-forest-800', inverse: 'text-white', gold: 'text-gold' } as const

/** Typographic step + ink role. Use instead of ad-hoc text-[Npx]. */
export function Text({ variant = 'body', tone, as, asChild = false, className, ...props }: React.ComponentProps<'p'> & { variant?: keyof typeof VARIANT; tone?: keyof typeof TONE; as?: keyof React.JSX.IntrinsicElements; asChild?: boolean }) {
  const Comp = (asChild ? Slot.Root : (as ?? (variant.startsWith('h') ? variant : variant === 'display' ? 'h1' : variant === 'body' || variant === 'lede' ? 'p' : 'div'))) as React.ElementType
  return <Comp data-slot="text" className={cn(VARIANT[variant], tone && TONE[tone], className)} {...props} />
}

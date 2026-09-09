import Link from 'next/link'
import type { ReactNode } from 'react'
import { Chip, Text } from '@/design'
import { cn } from '@/lib/utils'

export interface BandChip { label: string; href?: string; onClick?: () => void; active?: boolean; testId?: string }

/** Compact page band: title, optional ≤60-char subtitle, chips, and a right
 *  slot (usually a HatchPickCard). Geometric accents live behind the title. */
export function HeaderBand({ title, subtitle, chips = [], right, className = '', testId = 'header-band' }: { title: string; subtitle?: string; chips?: BandChip[]; right?: ReactNode; className?: string; testId?: string }) {
  if (subtitle && subtitle.length > 60) throw new Error(`HeaderBand subtitle over 60 chars: "${subtitle}"`)
  return (
    <div data-testid={testId} className={cn('relative mb-3 flex flex-col gap-3 overflow-hidden rounded-panel bg-surface-container px-4 py-2.5 lg:flex-row lg:items-center', className)}>
      <div className="pointer-events-none absolute inset-0 opacity-55" aria-hidden>
        <i className="absolute block rounded-2xl bg-primary-fixed" style={{ right: 520, top: -50, width: 150, height: 150, transform: 'rotate(45deg)' }} />
        <i className="absolute block rounded-full bg-amber-soft" style={{ right: 600, top: 30, width: 56, height: 56 }} />
      </div>
      <div className="relative min-w-0 flex-1">
        <Text variant="h2" as="h1" className="leading-none">{title}</Text>
        {subtitle && <Text variant="ui" tone="secondary" className="mt-1">{subtitle}</Text>}
        {chips.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {chips.map(c => c.href
              ? <Chip key={c.label} asChild selected={c.active}><Link href={c.href} data-testid={c.testId} aria-current={c.active ? 'page' : undefined}>{c.label}</Link></Chip>
              : <Chip key={c.label} selected={c.active} data-testid={c.testId} onClick={c.onClick}>{c.label}</Chip>)}
          </div>
        )}
      </div>
      {right && <div className="relative w-full lg:w-[480px]">{right}</div>}
    </div>
  )
}

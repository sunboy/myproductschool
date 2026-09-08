import Link from 'next/link'
import type { ReactNode } from 'react'

export interface BandChip { label: string; href?: string; onClick?: () => void; active?: boolean; testId?: string }

export function HeaderBand({ title, subtitle, chips = [], right, className = '', testId = 'header-band' }: { title: string; subtitle?: string; chips?: BandChip[]; right?: ReactNode; className?: string; testId?: string }) {
  if (subtitle && subtitle.length > 60) throw new Error(`HeaderBand subtitle over 60 chars: "${subtitle}"`)
  return (
    <div data-testid={testId} className={`relative mb-3 flex flex-col gap-3 overflow-hidden rounded-2xl bg-surface-container px-4 py-3 lg:min-h-[88px] lg:flex-row lg:items-center ${className}`}>
      <div className="pointer-events-none absolute inset-0 opacity-55" aria-hidden>
        <i className="absolute block rounded-2xl bg-primary-fixed" style={{ right: 520, top: -50, width: 150, height: 150, transform: 'rotate(45deg)' }} />
        <i className="absolute block rounded-full bg-amber-soft" style={{ right: 600, top: 30, width: 56, height: 56 }} />
      </div>
      <div className="relative min-w-0 flex-1">
        <h1 className="font-headline text-[26px] font-bold leading-none text-ink-strong">{title}</h1>
        {subtitle && <p className="mt-1 text-[13px] text-ink-secondary">{subtitle}</p>}
        {chips.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {chips.map(c => {
              const cls = `rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${c.active ? 'border-forest-800 bg-forest-800 text-white' : 'border-hairline bg-card-bright text-ink-strong'}`
              return c.href ? <Link key={c.label} href={c.href} data-testid={c.testId} aria-current={c.active ? 'page' : undefined} className={cls}>{c.label}</Link>
                : <button key={c.label} type="button" data-testid={c.testId} aria-pressed={c.active} onClick={c.onClick} className={cls}>{c.label}</button>
            })}
          </div>
        )}
      </div>
      {right && <div className="relative w-full lg:w-[480px]">{right}</div>}
    </div>
  )
}

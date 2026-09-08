import Link from 'next/link'
import type { ReactNode } from 'react'
import { GeoArt } from './GeoArt'

export interface CoverCardProps {
  href: string
  seed: string
  eyebrow?: string
  title: string
  meta?: Array<{ value: string | number; label: string }>
  /** 0-100; undefined hides the ring; 0 shows a play glyph. */
  pct?: number
  artHeight?: number
  artIndex?: number
  footer?: ReactNode
  className?: string
  testId?: string
}

export function CoverCard({ href, seed, eyebrow, title, meta = [], pct, artHeight = 64, artIndex, footer, className = '', testId }: CoverCardProps) {
  return (
    <Link href={href} data-testid={testId} className={`group flex flex-col overflow-hidden rounded-2xl border border-hairline bg-card-bright transition-shadow hover:shadow-sm ${className}`}>
      <GeoArt seed={seed} index={artIndex} height={artHeight} className="px-3 py-2.5 text-white">
        {eyebrow && <div className="relative text-[9px] font-bold uppercase tracking-[.08em] opacity-85">{eyebrow}</div>}
        <div className="relative mt-0.5 line-clamp-2 font-headline text-[14px] font-bold leading-[1.15]">{title}</div>
      </GeoArt>
      <div className="flex items-center gap-3 px-3 py-2 text-[10px] text-ink-secondary">
        {meta.map(m => <div key={m.label}><b className="block font-headline text-[15px] text-ink-strong">{m.value}</b>{m.label}</div>)}
        {footer}
        {pct !== undefined && (
          <div className="ml-auto grid size-8 place-items-center rounded-full" style={{ background: `conic-gradient(var(--color-primary) ${pct}%, var(--color-surface-container-highest) 0)` }} aria-label={pct > 0 ? `${pct}% complete` : 'Not started'}>
            <span className="grid size-6 place-items-center rounded-full bg-card-bright text-[8px] font-bold text-forest-800">{pct > 0 ? `${pct}%` : '▶'}</span>
          </div>
        )}
      </div>
    </Link>
  )
}

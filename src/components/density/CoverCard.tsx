import Link from 'next/link'
import type { ReactNode } from 'react'
import { GeoArt } from './GeoArt'
import { Card, Text } from '@/design'
import { cn } from '@/lib/utils'

export interface CoverCardProps {
  href: string
  seed: string
  eyebrow?: string
  title: string
  meta?: Array<{ value: string | number; label: string }>
  /** 0-100; undefined hides the ring; 0 shows a play glyph. */
  pct?: number
  /** Art aspect ratio (width/height). */
  artRatio?: string
  artIndex?: number
  footer?: ReactNode
  className?: string
  testId?: string
}

/** Shelf tile: geometric art with an aspect ratio, title clamped to two lines,
 *  meta row. Sizes to its container; never a fixed height. */
export function CoverCard({ href, seed, eyebrow, title, meta = [], pct, artRatio = '16/6', artIndex, footer, className = '', testId }: CoverCardProps) {
  return (
    <Card asChild tone="bright" padding="none" interactive className={cn('group', className)}>
      <Link href={href} data-testid={testId}>
        <GeoArt seed={seed} index={artIndex} height="auto" style={{ aspectRatio: artRatio }} className="flex flex-col justify-end px-3 py-2.5 text-white">
          {eyebrow && <div className="relative truncate text-caption font-bold uppercase tracking-[.08em] opacity-85">{eyebrow}</div>}
          <div className="relative mt-0.5 line-clamp-2 font-headline text-[clamp(13px,7cqw,15px)] font-bold leading-[1.15]">{title}</div>
        </GeoArt>
        <div className="flex items-center gap-3 px-3 py-2 text-caption font-ui text-ink-secondary">
          {meta.map(m => <div key={m.label}><b className="block font-headline text-lede text-ink-strong">{m.value}</b>{m.label}</div>)}
          {footer}
          {pct !== undefined && (
            <div className="ml-auto grid size-8 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(var(--color-primary) ${pct}%, var(--color-surface-container-highest) 0)` }} aria-label={pct > 0 ? `${pct}% complete` : 'Not started'}>
              <span className="grid size-6 place-items-center rounded-full bg-card-bright text-[0.6rem] font-bold leading-none text-forest-800">{pct > 0 ? `${pct}%` : '▶'}</span>
            </div>
          )}
        </div>
        <Text variant="caption" className="sr-only">{eyebrow}</Text>
      </Link>
    </Card>
  )
}

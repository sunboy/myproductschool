'use client'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { resolveReadingTarget } from './reading'

export interface TocGroup { label: string; items: Array<{ id: string; label: string; done?: boolean; href?: string }> }

/** Right-hand table of contents. 13px/550 items, active 650 forest with a bar. */
export function Toc({ groups, activeId, progressPct, onSelect, testId = 'right-toc', className }: { groups: TocGroup[]; activeId: string | null; progressPct?: number; onSelect?: (id: string) => void; testId?: string; className?: string }) {
  const scrollTo = (id: string) => {
    onSelect?.(id)
    const reduceMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const target = resolveReadingTarget(id)
    target?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
  }
  return (
    <nav data-testid={testId} data-slot="toc" aria-label="On this page" className={cn('sticky top-[72px] hidden w-[200px] shrink-0 text-ui font-ui leading-[1.5] text-ink-secondary lg:block', className)}>
      {progressPct !== undefined && (
        <div className="mb-3 h-0.75 overflow-hidden rounded bg-surface-container-highest" aria-label={`${Math.round(progressPct)}% read`}>
          <i className="block h-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, progressPct))}%` }} />
        </div>
      )}
      {groups.map(g => (
        <div key={g.label} data-toc-group={g.label} className="mb-4">
          <div className="mb-1.5 text-caption font-bold uppercase tracking-[.08em] text-ink-muted">{g.label}</div>
          {g.items.map(it => {
            const isActive = it.id === activeId
            const cls = cn(
              'flex w-full items-center gap-1.5 border-l-2 py-1 pl-3 text-left transition-colors',
              isActive ? 'border-primary font-strong text-forest-800' : 'border-hairline hover:text-ink-strong',
            )
            const body = <><span className="min-w-0 truncate">{it.label}</span>{it.done && <Check size={12} aria-label="done" className="shrink-0 text-primary" />}</>
            return it.href
              ? <a key={it.id} href={it.href} className={cls} aria-current={isActive ? 'true' : undefined}>{body}</a>
              : <button key={it.id} type="button" onClick={() => scrollTo(it.id)} className={cls} aria-current={isActive ? 'true' : undefined}>{body}</button>
          })}
        </div>
      ))}
    </nav>
  )
}

'use client'
export interface TocGroup { label: string; items: Array<{ id: string; label: string; done?: boolean; href?: string }> }

export function RightToc({ groups, activeId, progressPct, onSelect, testId = 'right-toc' }: { groups: TocGroup[]; activeId: string | null; progressPct?: number; onSelect?: (id: string) => void; testId?: string }) {
  return (
    <nav data-testid={testId} aria-label="On this page" className="sticky top-[72px] hidden w-[200px] shrink-0 text-[12px] leading-[1.9] text-ink-muted xl:block">
      {progressPct !== undefined && (
        <div className="mb-2 h-[3px] overflow-hidden rounded bg-surface-container-highest" aria-label={`${Math.round(progressPct)}% read`}>
          <i className="block h-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, progressPct))}%` }} />
        </div>
      )}
      {groups.map(g => (
        <div key={g.label} className="mb-3">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-[.08em] text-ink-muted">{g.label}</div>
          {g.items.map(it => {
            const isActive = it.id === activeId
            const cls = `block truncate border-l-2 pl-2.5 ${isActive ? 'border-primary font-bold text-forest-800' : 'border-transparent hover:text-ink-secondary'} ${it.done ? 'text-ink-muted' : ''}`
            return it.href
              ? <a key={it.id} href={it.href} className={cls} aria-current={isActive ? 'true' : undefined}>{it.done ? '✓ ' : ''}{it.label}</a>
              : <button key={it.id} type="button" onClick={() => {
                  onSelect?.(it.id)
                  const reduceMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
                  document.getElementById(it.id)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
                }} className={`w-full text-left ${cls}`} aria-current={isActive ? 'true' : undefined}>{it.done ? '✓ ' : ''}{it.label}</button>
          })}
        </div>
      ))}
    </nav>
  )
}

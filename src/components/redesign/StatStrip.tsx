import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface StatStripCell {
  key: string
  label: string
  /**
   * Optional bare stroke icon (16px, 1.6-1.8 stroke, discipline/fg color)
   * rendered inline beside the label. Spec §2 — never a tile box (§4).
   */
  icon?: ReactNode
  /** The serif tabular-nums headline value, e.g. "68%" or "9,860". */
  value: ReactNode
  /** Optional small non-serif suffix rendered beside the value, e.g. "Level 12". */
  valueSuffix?: ReactNode
  /** Delta line, e.g. "↑ 12% this week". Rendered in forest-600. Omit if there's no real delta (spec: no invented metrics). */
  delta?: ReactNode
  /** 0-100 progress fill shown as a thin bar under the cell (dashboard "Overall Progress" cell only). */
  progressPercent?: number
}

export interface StatStripProps {
  cells: StatStripCell[]
  className?: string
}

/**
 * Hairline-separated stat cells: optional bare inline stroke icon + label,
 * serif Literata tabular-nums number, delta line. Icons are bare glyphs in
 * the discipline/fg color per spec §2 — icon TILES stay banned per §4.
 */
export function StatStrip({ cells, className }: StatStripProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-y-4 rounded-2xl border border-hairline bg-card-bright py-4 shadow-[0_1px_2px_rgba(30,27,20,.04),0_12px_32px_-24px_rgba(30,27,20,.18)] sm:grid-cols-3 md:gap-y-0 md:[grid-template-columns:var(--statstrip-cols)]',
        className
      )}
      style={{ '--statstrip-cols': `repeat(${cells.length}, minmax(0, 1fr))` } as CSSProperties}
    >
      {cells.map((cell, i) => (
        <div
          key={cell.key}
          className={cn(
            'flex min-w-0 flex-col gap-2 px-5',
            i < cells.length - 1 && 'md:border-r md:border-hairline'
          )}
        >
          <div className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-ink-secondary">
            {cell.icon}
            <span className="min-w-0 truncate">{cell.label}</span>
          </div>
          <div className="flex items-baseline gap-1.5 font-headline text-[25px] font-bold tabular-nums text-ink-strong">
            {cell.value}
            {cell.valueSuffix && (
              <span className="font-body text-[11.5px] font-bold text-ink-muted">{cell.valueSuffix}</span>
            )}
          </div>
          {cell.delta && (
            <div className="text-[11.5px] font-bold tabular-nums text-forest-600">{cell.delta}</div>
          )}
          {typeof cell.progressPercent === 'number' && (
            <div className="mt-0.5 h-[5px] overflow-hidden rounded-full bg-hairline">
              <div
                className="h-full rounded-full bg-forest-700"
                style={{ width: `${Math.max(0, Math.min(100, cell.progressPercent))}%` }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

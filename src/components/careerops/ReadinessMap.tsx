'use client'
// The per-discipline Readiness Map — the conversion surface. One card per demanded
// discipline, each routing into that discipline's practice + mock-interview flow.

import Link from 'next/link'
import { disciplineLabel, disciplineIcon } from '@/lib/careerops/readiness'
import { readinessChip } from './grade'
import type { ReadinessRow } from '@/lib/careerops/types'

// One readiness row. Shared between the legacy ReadinessMap and the redesigned
// report ReadinessCard. `showActions` hides the auth-gated practice/interview
// links on anonymous surfaces.
export function ReadinessRowItem({
  row,
  compact = false,
  showActions = true,
  className,
}: {
  row: ReadinessRow
  compact?: boolean
  showActions?: boolean
  className?: string
}) {
  const chip = readinessChip(row.user_readiness)
  return (
    <div className={className ?? 'rounded-xl bg-surface-container p-4'}>
      <div className="flex items-start gap-3">
        <span
          className="material-symbols-outlined text-[22px] text-primary"
          style={{ fontVariationSettings: "'FILL' 1, 'wght' 500" }}
          aria-hidden
        >
          {disciplineIcon(row.discipline)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-headline text-base font-semibold text-on-surface">
              {disciplineLabel(row.discipline)}
            </h4>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-label text-xs font-semibold ${chip.classes}`}>
              <span className="material-symbols-outlined text-[14px]" aria-hidden>{chip.icon}</span>
              {chip.label}
            </span>
          </div>
          {row.bar && (
            <p className="mt-1 font-body text-sm text-on-surface-variant">{row.bar}</p>
          )}
          {!compact && row.top_gap && (
            <p className="mt-1.5 font-body text-sm text-on-surface">
              <span className="font-semibold">Biggest gap:</span> {row.top_gap}
            </p>
          )}
          {!compact && row.recommended_rep && (
            <p className="mt-1 font-body text-sm text-on-surface-variant">
              Next rep: {row.recommended_rep}
            </p>
          )}

          {showActions && (row.practice_href || row.interview_href) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {row.practice_href && (
                <Link
                  href={row.practice_href}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 font-label text-sm font-semibold text-on-primary no-underline transition-opacity hover:opacity-90"
                >
                  <span className="material-symbols-outlined text-[16px]" aria-hidden>fitness_center</span>
                  Practice
                </Link>
              )}
              {row.interview_href && (
                <Link
                  href={row.interview_href}
                  className="inline-flex items-center gap-1.5 rounded-full bg-secondary-container px-4 py-1.5 font-label text-sm font-semibold text-on-secondary-container no-underline transition-opacity hover:opacity-90"
                >
                  <span className="material-symbols-outlined text-[16px]" aria-hidden>graphic_eq</span>
                  Mock interview
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function ReadinessMap({ rows, compact = false }: { rows: ReadinessRow[]; compact?: boolean }) {
  const demanded = rows.filter((r) => r.demanded)
  if (demanded.length === 0) {
    return (
      <p className="font-body text-sm text-on-surface-variant">
        No specific practice discipline stood out for this role.
      </p>
    )
  }

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {demanded.map((row) => (
        <ReadinessRowItem key={row.discipline} row={row} compact={compact} />
      ))}
    </div>
  )
}

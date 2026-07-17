'use client'

import type { PracticeCoverageItem } from '@/lib/data/challenges'

export interface SkillCoverageCardProps {
  coverage: PracticeCoverageItem[]
}

/** Pure-props progress bars for completion share per topic or discipline. */
export function SkillCoverageCard({ coverage }: SkillCoverageCardProps) {
  if (coverage.length === 0) return null

  return (
    <div className="rounded-2xl border border-hairline bg-card-bright p-4 shadow-[0_1px_2px_rgba(30,27,20,.04),0_12px_32px_-24px_rgba(30,27,20,.18)]">
      <div className="mb-3 font-body text-[15.5px] font-bold text-ink-strong">Skill coverage</div>
      <div className="flex flex-col gap-3">
        {coverage.map(item => {
          const pct = item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0
          return (
            <div key={item.label}>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="truncate text-[12.5px] font-bold text-ink-strong">{item.label}</span>
                <span className="shrink-0 tabular-nums text-[12px] text-ink-secondary">{pct}%</span>
              </div>
              <div className="h-1.5 rounded-full border border-hairline bg-page-field">
                <div className="h-full rounded-full bg-forest-600" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

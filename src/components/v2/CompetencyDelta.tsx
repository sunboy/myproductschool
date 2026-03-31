'use client'

interface CompetencyDeltaProps {
  label: string
  before: number
  after: number
  icon?: string
}

export function CompetencyDelta({ label, before, after, icon }: CompetencyDeltaProps) {
  const delta = Math.round(after - before)
  const afterPct = Math.min(100, Math.max(0, after))
  const beforePct = Math.min(100, Math.max(0, before))

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-label text-sm text-on-surface">
          {icon && (
            <span
              className="material-symbols-outlined text-[16px] text-on-surface-variant"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 16" }}
            >
              {icon}
            </span>
          )}
          <span>{label}</span>
        </div>
        <div className="flex items-center gap-2 font-label text-xs">
          <span className="text-on-surface-variant">{Math.round(before)} → {Math.round(after)}</span>
          {delta > 0 ? (
            <span className="bg-primary-fixed text-primary rounded-full px-2 py-0.5 font-semibold">+{delta}</span>
          ) : delta < 0 ? (
            <span className="bg-surface-container-high text-error rounded-full px-2 py-0.5 font-semibold">{delta}</span>
          ) : (
            <span className="text-on-surface-variant">–</span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 bg-surface-container-high rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-500"
          style={{ width: `${afterPct}%` }}
        />
        {/* Before marker */}
        <div
          className="absolute inset-y-0 w-0.5 bg-on-surface-variant opacity-50"
          style={{ left: `${beforePct}%` }}
        />
      </div>
    </div>
  )
}

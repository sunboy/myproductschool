interface PrepStatusWidgetProps {
  companyName: string
  interviewDate?: string
  daysRemaining?: number
  readinessPercent?: number
  comparativeInsight?: string
}

export function PrepStatusWidget({
  companyName,
  interviewDate,
  daysRemaining = 14,
  readinessPercent = 35,
  comparativeInsight,
}: PrepStatusWidgetProps) {
  return (
    <div className="bg-surface-container rounded-2xl p-5 space-y-4">
      <h3 className="font-label font-semibold text-on-surface">Prep Status</h3>

      {interviewDate && (
        <div className="flex items-center gap-2 text-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-base">calendar_today</span>
          Interview: <span className="text-on-surface font-semibold">{interviewDate}</span>
        </div>
      )}

      <div>
        <div className="flex justify-between text-xs text-on-surface-variant mb-1">
          <span>{daysRemaining} days remaining</span>
          <span className="text-primary font-semibold">{readinessPercent}% ready</span>
        </div>
        <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${readinessPercent}%` }}
          />
        </div>
      </div>

      {comparativeInsight && (
        <p className="text-xs text-on-surface-variant italic border-l-2 border-primary pl-3">
          {comparativeInsight}
        </p>
      )}
    </div>
  )
}

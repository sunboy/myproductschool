interface Props {
  responseCount: number
  participantCount: number
  avgScore?: number
  completedPct?: number
}

export function CommunityStatsPanel({ responseCount, participantCount, avgScore, completedPct }: Props) {
  return (
    <div className="bg-white rounded-xl border border-outline-variant/20 p-4 shadow-sm">
      <h3 className="text-sm font-bold text-on-surface mb-3">Community Stats</h3>
      <div className="space-y-2.5">
        <div className="flex items-center gap-2 text-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-base text-primary">forum</span>
          <span><span className="font-bold text-on-surface">{responseCount}</span> responses</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-base text-primary">group</span>
          <span><span className="font-bold text-on-surface">{participantCount}</span> participants</span>
        </div>
        {avgScore !== undefined && (
          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-base text-tertiary">bar_chart</span>
            <span>Avg Score: <span className="font-bold text-on-surface">{avgScore.toFixed(1)}</span></span>
          </div>
        )}
        {completedPct !== undefined && (
          <div className="pt-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-on-surface-variant">Completed</span>
              <span className="text-xs font-bold text-on-surface">{completedPct}%</span>
            </div>
            <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.max(0, completedPct))}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

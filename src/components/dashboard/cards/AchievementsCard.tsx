interface Achievement {
  id: string
  name: string
  icon: string
  unlocked: boolean
  color: string
}

interface AchievementsCardProps {
  achievements: Achievement[]
  unlockedCount: number
  totalCount: number
}

const ICON_COLOR_MAP: Record<string, string> = {
  first_challenge: '#4a7c59',
  ten_challenges: '#c9933a',
  fifty_challenges: '#705c30',
  week_streak: '#c9933a',
  month_streak: '#6b8edb',
  first_simulation: '#7c59a4',
  pattern_cleared: '#59897c',
}

const ICON_MAP: Record<string, string> = {
  first_challenge: 'star',
  ten_challenges: 'emoji_events',
  fifty_challenges: 'military_tech',
  week_streak: 'local_fire_department',
  month_streak: 'diamond',
  first_simulation: 'mic',
  pattern_cleared: 'visibility',
}

export function AchievementsCard({ achievements, unlockedCount, totalCount }: AchievementsCardProps) {
  return (
    <div className="rounded-2xl p-5 bg-surface border border-outline-variant/40">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-tertiary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
          <h3 className="font-headline text-[15px] font-semibold text-on-surface">Achievements</h3>
        </div>
        <span className="text-[11px] font-label font-bold text-on-surface-variant">
          {unlockedCount} / {totalCount}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {achievements.map(a => (
          <div
            key={a.id}
            className="flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl text-center"
            style={{
              background: a.unlocked ? 'var(--color-surface-container-low)' : 'transparent',
              border: `1px ${a.unlocked ? 'solid transparent' : 'dashed var(--color-outline-variant)'}`,
              opacity: a.unlocked ? 1 : 0.45,
            }}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{
                background: a.unlocked ? a.color : 'var(--color-surface-container-high)',
                color: a.unlocked ? '#fff' : 'var(--color-on-surface-variant)',
              }}
            >
              <span
                className="material-symbols-outlined text-[17px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {a.icon}
              </span>
            </div>
            <div className="text-[10px] font-bold font-label leading-tight text-on-surface">{a.name}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export { ICON_COLOR_MAP, ICON_MAP }

interface LeaderboardEntry {
  rank: number
  name: string
  xp: number
  isCurrentUser?: boolean
}

interface LeaderboardPeekCardProps {
  entries: LeaderboardEntry[]
  userRank: number
}

// Top-3 get a tonal medal glyph (Material Symbol, never an emoji — emoji are
// banned in UI). Gold/silver/bronze via Terra-harmonious tints, not raw neon.
const RANK_MEDAL_COLOR: Record<number, string> = {
  1: '#a9772f', // amber/gold (Terra tertiary family)
  2: '#8a8a82', // muted silver
  3: '#9c6b3f', // warm bronze
}

export function LeaderboardPeekCard({ entries, userRank }: LeaderboardPeekCardProps) {
  if (entries.length < 3) return null

  return (
    <div className="bg-surface-container-low rounded-2xl p-5 flex flex-col gap-3 border border-outline-variant/40">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="material-symbols-outlined text-[18px] leading-none text-tertiary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            leaderboard
          </span>
          <h3 className="font-headline font-semibold text-sm text-on-surface">This week</h3>
        </div>
      </div>

      <div className="flex flex-col gap-0.5">
        {entries.map((entry) => (
          <div
            key={entry.rank}
            className={`flex items-center gap-2.5 py-2 px-2 -mx-2 rounded-xl transition-colors duration-150 ${
              entry.isCurrentUser ? 'bg-primary-fixed/70' : 'hover:bg-surface-container'
            }`}
          >
            <span className="w-5 flex items-center justify-center shrink-0 leading-none">
              {RANK_MEDAL_COLOR[entry.rank] ? (
                <span
                  className="material-symbols-outlined text-[18px] leading-none"
                  style={{ color: RANK_MEDAL_COLOR[entry.rank], fontVariationSettings: "'FILL' 1" }}
                >
                  workspace_premium
                </span>
              ) : (
                <span className="text-[11px] font-bold text-on-surface-variant font-label tabular-nums">{entry.rank}</span>
              )}
            </span>
            <span className={`flex-1 text-[13px] font-label min-w-0 truncate ${entry.isCurrentUser ? 'font-bold text-on-surface' : 'text-on-surface'}`}>
              {entry.name}{entry.isCurrentUser && <span className="text-primary font-bold"> · you</span>}
            </span>
            <span className="text-[11px] text-on-surface-variant font-label tabular-nums shrink-0">{entry.xp.toLocaleString()} XP</span>
          </div>
        ))}
      </div>

      {userRank > 3 && (
        <div className="flex items-center gap-1.5 px-2 pt-1 border-t border-outline-variant/20">
          <span className="text-[11px] text-on-surface-variant font-label">Your rank:</span>
          <span className="text-xs font-bold text-primary font-label">#{userRank}</span>
        </div>
      )}
    </div>
  )
}

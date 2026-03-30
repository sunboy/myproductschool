import Link from 'next/link'

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

export function LeaderboardPeekCard({ entries, userRank }: LeaderboardPeekCardProps) {
  return (
    <div className="bg-surface-container rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-tertiary text-xl">leaderboard</span>
        <h3 className="font-headline font-semibold text-base text-on-surface">Leaderboard</h3>
      </div>

      <div className="flex flex-col gap-1.5">
        {entries.map((entry) => (
          <div
            key={entry.rank}
            className={`flex items-center gap-2.5 py-1.5 px-2 rounded-lg ${entry.isCurrentUser ? 'bg-primary-fixed' : ''}`}
          >
            <span className={`text-sm font-bold w-5 text-center ${entry.rank <= 3 ? 'text-tertiary' : 'text-on-surface-variant'}`}>
              {entry.rank}
            </span>
            <span className={`flex-1 text-sm font-label ${entry.isCurrentUser ? 'font-bold text-on-surface' : 'text-on-surface'}`}>
              {entry.name} {entry.isCurrentUser && '(you)'}
            </span>
            <span className="text-xs text-on-surface-variant font-label">{entry.xp.toLocaleString()} XP</span>
          </div>
        ))}
      </div>

      {userRank > 3 && (
        <div className="flex items-center gap-2 px-2">
          <span className="text-xs text-on-surface-variant">Your rank:</span>
          <span className="text-sm font-bold text-primary">#{userRank}</span>
        </div>
      )}

      <Link
        href="/cohort"
        className="text-xs text-primary font-label font-semibold hover:underline self-start"
      >
        Full leaderboard
      </Link>
    </div>
  )
}

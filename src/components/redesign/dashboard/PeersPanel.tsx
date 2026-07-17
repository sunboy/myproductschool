import Link from 'next/link'

export interface PeerEntry {
  rank: number
  name: string
  xp: number
  isCurrentUser?: boolean
}

export interface PeersPanelProps {
  entries: PeerEntry[]
  viewLeaderboardHref?: string
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/**
 * "Peers & community" panel: top learners from the real leaderboard peek,
 * with the current user's row visually set apart. Avatar circles for people
 * are the one allowed initials-in-a-circle exception (spec §8).
 */
export function PeersPanel({ entries, viewLeaderboardHref }: PeersPanelProps) {
  if (entries.length === 0) return null

  const you = entries.find(e => e.isCurrentUser)
  const others = entries.filter(e => !e.isCurrentUser)

  return (
    <div className="rounded-2xl border border-hairline bg-card-bright p-4 pb-[18px] shadow-[0_1px_2px_rgba(30,27,20,.04),0_12px_32px_-24px_rgba(30,27,20,.18)]">
      <div className="mb-3.5 flex items-center justify-between">
        <div className="font-body text-[15.5px] font-bold text-ink-strong">Peers &amp; community</div>
        {viewLeaderboardHref && (
          <Link href={viewLeaderboardHref} className="text-[11.5px] font-bold text-forest-700 no-underline">
            View leaderboard →
          </Link>
        )}
      </div>

      <div className="flex flex-col">
        {others.map((entry, i) => (
          <div key={entry.rank} className={`flex items-center gap-2.5 py-2 ${i > 0 ? 'border-t border-hairline' : ''}`}>
            <span className="w-5 shrink-0 text-center text-[12.5px] font-extrabold tabular-nums text-ink-muted">{entry.rank}</span>
            <span
              className="flex size-[30px] shrink-0 items-center justify-center rounded-full text-[11.5px] font-extrabold text-white"
              style={{ background: 'linear-gradient(160deg, #78a886, #4a7c59)' }}
            >
              {initialsFor(entry.name)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-bold text-ink-strong">{entry.name}</div>
            </div>
            <span className="shrink-0 text-[12.5px] font-bold tabular-nums text-ink-strong">{entry.xp.toLocaleString()} XP</span>
          </div>
        ))}

        {you && (
          <div className="mt-1 flex items-center gap-2.5 border-t border-hairline pt-3">
            <span className="w-5 shrink-0 text-center text-[12.5px] font-extrabold tabular-nums text-ink-muted">{you.rank}</span>
            <span className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-forest-800 text-[11.5px] font-extrabold text-white">
              {initialsFor(you.name)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-bold text-ink-strong">{you.name}</div>
            </div>
            <span className="shrink-0 text-[12.5px] font-bold tabular-nums text-ink-strong">{you.xp.toLocaleString()} XP</span>
          </div>
        )}
      </div>
    </div>
  )
}

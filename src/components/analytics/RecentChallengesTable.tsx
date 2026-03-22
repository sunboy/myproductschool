import Link from 'next/link'
import { RecentAttempt } from '@/lib/types'

interface Props {
  attempts: RecentAttempt[]
}

export function RecentChallengesTable({ attempts }: Props) {
  return (
    <div className="bg-surface-container rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center">
        <h2 className="text-xl font-bold font-headline text-on-surface">Recent Challenges</h2>
        <Link href="/challenges" className="text-primary font-bold text-sm hover:underline">
          View All
        </Link>
      </div>

      {attempts.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-on-surface-variant text-sm">No challenges completed yet.</p>
        </div>
      ) : (
        <table className="w-full text-left">
          <thead className="bg-surface-container-high/50 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            <tr>
              <th className="px-6 py-4">Challenge</th>
              <th className="px-6 py-4">Domain</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Score</th>
              <th className="px-6 py-4">Trend</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {attempts.map(attempt => {
              const maxTrend = Math.max(...attempt.trend, 1)
              return (
                <tr key={attempt.id} className="hover:bg-surface-container-high/30 transition-colors">
                  {/* Challenge */}
                  <td className="px-6 py-4">
                    <p className="font-bold text-on-surface">{attempt.challenge_title}</p>
                    <p className="text-xs text-on-surface-variant">{attempt.domain}</p>
                  </td>

                  {/* Domain */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-on-surface-variant">{attempt.domain}</span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                        attempt.status === 'completed'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-tertiary/10 text-tertiary'
                      }`}
                    >
                      {attempt.status === 'completed' ? 'Completed' : 'In Progress'}
                    </span>
                  </td>

                  {/* Score */}
                  <td className="px-6 py-4">
                    <span className="font-bold text-on-surface">
                      {attempt.status === 'in_progress' && attempt.score === 0
                        ? '—'
                        : attempt.score}
                    </span>
                  </td>

                  {/* Trend sparkline */}
                  <td className="px-6 py-4">
                    <div className="w-20 h-6 flex items-end gap-0.5">
                      {attempt.trend.map((val, i) => {
                        const isLast = i === attempt.trend.length - 1
                        const heightPct = Math.max(20, Math.round((val / maxTrend) * 100))
                        return (
                          <div
                            key={i}
                            className={`w-1 rounded-sm ${isLast ? 'bg-primary' : 'bg-primary/40'}`}
                            style={{ height: `${heightPct}%` }}
                          />
                        )
                      })}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <button className="p-2 hover:bg-surface-container-high rounded-full text-on-surface-variant transition-colors">
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 20, fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
                      >
                        more_vert
                      </span>
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

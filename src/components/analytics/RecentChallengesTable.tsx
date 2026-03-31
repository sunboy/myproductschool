import Link from 'next/link'
import { RecentAttempt } from '@/lib/types'

interface Props {
  attempts: RecentAttempt[]
}

export function RecentChallengesTable({ attempts }: Props) {
  return (
    <div className="bg-surface-container-lowest rounded-xl ghost-border editorial-shadow overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-surface-container-highest flex justify-between items-center">
        <h3 className="font-headline text-xl font-bold text-on-background">Recent Challenges</h3>
        <Link href="/challenges" className="text-primary font-bold text-sm hover:underline">
          View All Challenges
        </Link>
      </div>

      {attempts.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-on-surface-variant text-sm">No challenges completed yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low text-xs font-bold uppercase tracking-wider text-outline">
              <tr>
                <th className="px-6 py-3">Challenge</th>
                <th className="px-6 py-3">Domain</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Score</th>
                <th className="px-6 py-3">Trend</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-highest">
              {attempts.map(attempt => {
                const maxTrend = Math.max(...attempt.trend, 1)
                const isCompleted = attempt.status === 'completed'

                return (
                  <tr key={attempt.id} className="hover:bg-surface-container-low transition-colors group">
                    {/* Challenge name with icon */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center">
                          <span
                            className="material-symbols-outlined text-on-surface-variant"
                            style={{ fontSize: 20, fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
                          >
                            {isCompleted ? 'task_alt' : 'edit_note'}
                          </span>
                        </div>
                        <span className="font-bold text-on-background">{attempt.challenge_title}</span>
                      </div>
                    </td>

                    {/* Domain */}
                    <td className="px-6 py-4 text-sm font-mono text-outline">{attempt.domain}</td>

                    {/* Status badge */}
                    <td className="px-6 py-4">
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-tertiary/10 text-tertiary text-xs font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                          In Progress
                        </span>
                      )}
                    </td>

                    {/* Score */}
                    <td className="px-6 py-4 font-bold">
                      {attempt.status === 'in_progress' && attempt.score === 0
                        ? '\u2014'
                        : attempt.score}
                    </td>

                    {/* Trend sparkline */}
                    <td className="px-6 py-4">
                      {isCompleted ? (
                        <div className="w-24 h-6 bg-primary/5 rounded flex items-center gap-0.5 px-1">
                          {attempt.trend.filter(v => v > 0).map((val, i, arr) => {
                            const heightPct = Math.max(20, Math.round((val / maxTrend) * 100))
                            const opacityStep = 30 + Math.round((i / Math.max(arr.length - 1, 1)) * 70)
                            return (
                              <div
                                key={i}
                                className="w-1.5 rounded-full"
                                style={{
                                  height: `${heightPct}%`,
                                  backgroundColor: `rgba(74, 124, 89, ${opacityStep / 100})`,
                                }}
                              />
                            )
                          })}
                        </div>
                      ) : (
                        <div className="w-24 h-6 bg-tertiary/5 rounded flex items-center gap-0.5 px-1">
                          {attempt.trend.filter(v => v > 0).map((val, i, arr) => {
                            const heightPct = Math.max(20, Math.round((val / maxTrend) * 100))
                            const opacityStep = 30 + Math.round((i / Math.max(arr.length - 1, 1)) * 70)
                            return (
                              <div
                                key={i}
                                className="w-1.5 rounded-full"
                                style={{
                                  height: `${heightPct}%`,
                                  backgroundColor: `rgba(112, 92, 48, ${opacityStep / 100})`,
                                }}
                              />
                            )
                          })}
                        </div>
                      )}
                    </td>

                    {/* Arrow */}
                    <td className="px-6 py-4 text-right">
                      <button className="material-symbols-outlined text-outline group-hover:text-primary transition-colors">
                        arrow_forward
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { normalizeToTen } from '@/lib/feedback/score'

interface HistoryRow {
  id: string
  companyName: string
  roleId: string
  overallScore: number | null
  grade: string | null
  durationSeconds: number | null
  endedAt: string | null
  status?: string
  scenarioTitle?: string | null
  disciplineLabel?: string | null
}

interface SessionRow {
  id: string
  company: string
  role: string
  score: number | null
  grade: string | null
  date: string
  status: string
  scenarioTitle: string | null
  disciplineLabel: string | null
}

/** Compact "Recent sessions" column for the density setup layout. Same
 *  /api/live-interview/history source and normalizeToTen scale as the
 *  legacy PastSessionsTable, trimmed to a single-column list. */
export function RecentSessionsColumn() {
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/live-interview/history')
      .then((r) => { if (!r.ok) throw new Error('history failed'); return r.json() })
      .then((data: { sessions?: HistoryRow[] }) => {
        if (cancelled || !data?.sessions) return
        setSessions(data.sessions.map((s) => ({
          id: s.id,
          company: s.companyName,
          role: s.roleId,
          score: s.overallScore,
          grade: s.grade ?? null,
          date: s.endedAt ? new Date(s.endedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
          status: s.status ?? 'completed',
          scenarioTitle: s.scenarioTitle ?? null,
          disciplineLabel: s.disciplineLabel ?? null,
        })))
      })
      .catch(() => { if (!cancelled) setError(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return (
    <div className="rounded-xl border border-hairline bg-surface-container-low p-4" data-testid="recent-sessions-column">
      <h2 className="font-headline text-base font-semibold text-ink-strong">Recent sessions</h2>

      {loading && (
        <div className="mt-3 flex flex-col gap-2">
          {[0, 1, 2].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-surface-container-high" />)}
        </div>
      )}

      {!loading && error && (
        <p className="mt-3 text-sm text-ink-secondary">Could not load past sessions.</p>
      )}

      {!loading && !error && sessions.length === 0 && (
        <p className="mt-3 text-sm text-ink-secondary">Completed interviews will appear here with score and debrief access.</p>
      )}

      {!loading && !error && sessions.length > 0 && (
        <ul className="mt-3 flex flex-col divide-y divide-hairline">
          {sessions.map((s) => {
            const isScored = s.score != null
            const content = (
              <div className="flex items-start justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink-strong capitalize">
                    {s.company} <span className="font-normal text-ink-secondary">· {s.role}</span>
                  </p>
                  <p className="mt-0.5 truncate text-xs text-ink-secondary">
                    {[s.scenarioTitle ?? 'Persona-led interview', s.disciplineLabel, s.date].filter(Boolean).join(' · ')}
                  </p>
                </div>
                {isScored ? (
                  <span className="shrink-0 rounded-full bg-primary-fixed px-2 py-0.5 text-xs font-bold text-primary">
                    {normalizeToTen(s.score ?? 0, 5).toFixed(1)}/10
                  </span>
                ) : (
                  <span className="shrink-0 text-xs font-semibold text-ink-secondary">
                    {s.status === 'abandoned' ? 'Incomplete' : 'Completed'}
                  </span>
                )}
              </div>
            )
            return (
              <li key={s.id}>
                {isScored ? (
                  <Link href={`/live-interviews/${s.id}/debrief`} className="block hover:opacity-80" data-testid="recent-session-debrief-link">
                    {content}
                  </Link>
                ) : content}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

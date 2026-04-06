'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface InterviewSession {
  id: string
  companyName: string
  roleId: string
  status: string
  overallScore: number | null
  grade: string | null
  durationSeconds: number | null
  endedAt: string | null
}

export default function PastInterviews() {
  const [sessions, setSessions] = useState<InterviewSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/live-interview/history')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.sessions) setSessions(data.sessions)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <section className="space-y-3">
        <h2 className="font-headline text-lg font-bold text-on-surface">Past Interviews</h2>
        <div className="grid gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 bg-surface-container rounded-xl animate-pulse" />
          ))}
        </div>
      </section>
    )
  }

  if (sessions.length === 0) return null

  return (
    <section className="space-y-3">
      <h2 className="font-headline text-lg font-bold text-on-surface">Past Interviews</h2>
      <div className="grid gap-2">
        {sessions.map((s) => {
          const mins = s.durationSeconds ? Math.floor(s.durationSeconds / 60) : 0
          const secs = s.durationSeconds ? s.durationSeconds % 60 : 0
          const duration = s.durationSeconds ? `${mins}:${String(secs).padStart(2, '0')}` : '—'
          const date = s.endedAt
            ? new Date(s.endedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : ''

          return (
            <Link
              key={s.id}
              href={s.status === 'completed' ? `/live-interviews/${s.id}/debrief` : '#'}
              className="flex items-center justify-between p-4 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors border border-outline-variant/20"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary-fixed flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-lg">mic</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-on-surface">{s.companyName}</p>
                  <p className="text-[11px] text-on-surface-variant">{s.roleId} Round · {duration} · {date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {s.status === 'completed' && s.overallScore != null ? (
                  <span className="text-sm font-bold text-primary bg-primary-fixed rounded-full px-3 py-1">
                    {s.overallScore}
                  </span>
                ) : s.status === 'abandoned' ? (
                  <span className="text-[10px] font-semibold text-on-surface-variant bg-surface-container-highest rounded-full px-2 py-0.5">
                    Incomplete
                  </span>
                ) : null}
                {s.status === 'completed' && (
                  <span className="material-symbols-outlined text-on-surface-variant text-lg">chevron_right</span>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

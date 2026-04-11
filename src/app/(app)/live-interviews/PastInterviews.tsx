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
        <p className="font-label font-bold text-xs text-on-surface-variant uppercase tracking-widest">Past interviews</p>
        <div className="space-y-2 pl-4 border-l-2 border-outline-variant/30">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-10 bg-surface-container rounded-lg animate-pulse" />
          ))}
        </div>
      </section>
    )
  }

  if (sessions.length === 0) return null

  return (
    <section className="space-y-3">
      <p className="font-label font-bold text-xs text-on-surface-variant uppercase tracking-widest">Past interviews</p>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-outline-variant/30" />
        <div className="space-y-0.5 pl-5">
          {sessions.map((s) => {
            const mins = s.durationSeconds ? Math.floor(s.durationSeconds / 60) : 0
            const secs = s.durationSeconds ? s.durationSeconds % 60 : 0
            const duration = s.durationSeconds ? `${mins}:${String(secs).padStart(2, '0')}` : '—'
            const date = s.endedAt
              ? new Date(s.endedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : ''
            const isCompleted = s.status === 'completed'

            return (
              <div key={s.id} className="relative">
                {/* Timeline dot */}
                <span
                  className="absolute -left-[22px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border-2 border-surface"
                  style={{ backgroundColor: isCompleted ? '#4a7c59' : '#c4c8bc' }}
                />

                <Link
                  href={isCompleted ? `/live-interviews/${s.id}/debrief` : '#'}
                  className={`flex items-center justify-between -mx-1 px-3 py-2.5 rounded-xl transition-colors ${isCompleted ? 'hover:bg-surface-container cursor-pointer' : 'cursor-default'}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-on-surface truncate">
                        {s.companyName}
                        <span className="text-on-surface-variant font-normal"> · {s.roleId}</span>
                      </p>
                      <p className="text-[11px] text-on-surface-variant font-label tabular-nums">
                        {duration} · {date}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {isCompleted && s.overallScore != null ? (
                      <span className="text-xs font-bold text-primary bg-primary-fixed rounded-full px-2.5 py-0.5 tabular-nums">
                        {s.overallScore}
                      </span>
                    ) : s.status === 'abandoned' ? (
                      <span className="text-[11px] text-on-surface-variant italic font-label">incomplete</span>
                    ) : null}
                    {isCompleted && (
                      <span className="material-symbols-outlined text-on-surface-variant text-[16px]">arrow_forward</span>
                    )}
                  </div>
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

'use client'
// Application pipeline — a status-column board over job_applications. v1 uses a
// status <select> per card (no drag) to keep it simple and accessible.

import { useCallback, useEffect, useState } from 'react'
import { APPLICATION_STATUSES, type ApplicationStatus } from '@/lib/careerops/types'
import { gradeClasses } from './grade'

interface Application {
  id: string
  company: string | null
  role_title: string | null
  status: ApplicationStatus
  fit_score: number | null
  fit_grade: string | null
  next_action: string | null
  jd_url: string | null
}

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  saved: 'Saved',
  applied: 'Applied',
  interviewing: 'Interviewing',
  offer: 'Offer',
  rejected: 'Rejected',
  archived: 'Archived',
}

const ACTIVE_STATUSES: ApplicationStatus[] = ['saved', 'applied', 'interviewing', 'offer']

export function CareerPipelineBoard() {
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/career-ops/applications')
      if (res.ok) {
        const data = await res.json()
        setApps(data.applications ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function changeStatus(id: string, status: ApplicationStatus) {
    setApps((cur) => cur.map((a) => (a.id === id ? { ...a, status } : a)))
    await fetch(`/api/career-ops/applications/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status }),
    })
  }

  async function remove(id: string) {
    setApps((cur) => cur.filter((a) => a.id !== id))
    await fetch(`/api/career-ops/applications/${id}`, { method: 'DELETE' })
  }

  if (loading) {
    return <div className="h-40 animate-pulse rounded-2xl bg-surface-container" aria-busy />
  }

  if (apps.length === 0) {
    return (
      <div className="rounded-2xl bg-surface-container p-6 text-center">
        <span className="material-symbols-outlined text-3xl text-on-surface-variant" aria-hidden>inbox</span>
        <p className="mt-2 font-body text-sm text-on-surface-variant">
          No applications yet. Save a job from the feed or score a JD to start your pipeline.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {ACTIVE_STATUSES.map((status) => {
        const column = apps.filter((a) => a.status === status)
        return (
          <div key={status} className="rounded-2xl bg-surface-container-low p-3">
            <div className="mb-2 flex items-center justify-between px-1">
              <h3 className="font-label text-sm font-semibold text-on-surface">{STATUS_LABEL[status]}</h3>
              <span className="font-label text-xs text-on-surface-variant">{column.length}</span>
            </div>
            <div className="space-y-2">
              {column.map((app) => (
                <div key={app.id} className="rounded-xl bg-surface p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 truncate font-body text-sm font-semibold text-on-surface">
                      {app.role_title ?? 'Untitled role'}
                    </p>
                    {app.fit_grade && (
                      <span className={`shrink-0 rounded-full px-2 py-0.5 font-label text-xs font-bold ${gradeClasses(app.fit_grade as never)}`}>
                        {app.fit_grade}
                      </span>
                    )}
                  </div>
                  {app.company && <p className="truncate font-body text-xs text-on-surface-variant">{app.company}</p>}
                  {app.next_action && (
                    <p className="mt-1 font-body text-xs text-tertiary">Next: {app.next_action}</p>
                  )}
                  <div className="mt-2 flex items-center gap-1.5">
                    <select
                      value={app.status}
                      onChange={(e) => changeStatus(app.id, e.target.value as ApplicationStatus)}
                      className="min-w-0 flex-1 rounded-lg border border-outline-variant bg-surface-container px-2 py-1 font-label text-xs text-on-surface outline-none"
                    >
                      {APPLICATION_STATUSES.map((s) => (
                        <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => remove(app.id)}
                      aria-label="Delete application"
                      className="grid h-7 w-7 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container-highest"
                    >
                      <span className="material-symbols-outlined text-[16px]" aria-hidden>delete</span>
                    </button>
                  </div>
                </div>
              ))}
              {column.length === 0 && (
                <p className="px-1 py-2 font-body text-xs text-on-surface-variant">Nothing here yet.</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

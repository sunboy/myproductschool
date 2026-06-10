'use client'
// Application detail — status, next action, notes, fit report, and (when the
// résumé flag is on) the tailoring panel.

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ResumeTailorPanel } from './ResumeTailorPanel'
import { CareerOpsFeatureGate } from './CareerOpsFeatureGate'
import { gradeClasses } from './grade'
import { APPLICATION_STATUSES, type ApplicationStatus } from '@/lib/careerops/types'

interface Application {
  id: string
  company: string | null
  role_title: string | null
  jd_url: string | null
  jd_text: string | null
  status: ApplicationStatus
  fit_score: number | null
  fit_grade: string | null
  fit_breakdown: Array<{ dimension: string; score: number }> | null
  next_action: string | null
  notes: string | null
}

export function ApplicationDetail({ id }: { id: string }) {
  const [app, setApp] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/career-ops/applications/${id}`)
      if (res.status === 404) { setNotFound(true); return }
      if (res.ok) setApp((await res.json()).application)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  async function patch(fields: Partial<Application>) {
    setApp((cur) => (cur ? { ...cur, ...fields } : cur))
    await fetch(`/api/career-ops/applications/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(fields),
    })
  }

  if (loading) return <div className="h-40 animate-pulse rounded-2xl bg-surface-container" aria-busy />
  if (notFound || !app) {
    return (
      <div className="rounded-2xl bg-surface-container p-6 text-center">
        <p className="font-body text-sm text-on-surface-variant">Application not found.</p>
        <Link href="/career-ops" className="mt-2 inline-block font-label text-sm text-primary">Back to Career</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/career-ops" className="inline-flex items-center gap-1 font-label text-sm text-on-surface-variant no-underline hover:text-on-surface">
          <span className="material-symbols-outlined text-[18px]" aria-hidden>arrow_back</span>
          Career
        </Link>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div>
            <h1 className="font-headline text-2xl font-bold text-on-surface">{app.role_title ?? 'Untitled role'}</h1>
            {app.company && <p className="font-body text-on-surface-variant">{app.company}</p>}
          </div>
          {app.fit_grade && (
            <span className={`shrink-0 rounded-full px-3 py-1 font-label text-sm font-bold ${gradeClasses(app.fit_grade as never)}`}>
              {app.fit_grade}{app.fit_score != null ? ` · ${app.fit_score}` : ''}
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="font-label text-xs font-semibold text-on-surface-variant">Status</span>
          <select
            value={app.status}
            onChange={(e) => patch({ status: e.target.value as ApplicationStatus })}
            className="mt-1 w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 font-body text-sm outline-none focus:border-primary"
          >
            {APPLICATION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="font-label text-xs font-semibold text-on-surface-variant">Next action</span>
          <input
            defaultValue={app.next_action ?? ''}
            onBlur={(e) => patch({ next_action: e.target.value })}
            placeholder="e.g. Follow up with recruiter"
            className="mt-1 w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 font-body text-sm outline-none focus:border-primary"
          />
        </label>
      </div>

      <label className="block">
        <span className="font-label text-xs font-semibold text-on-surface-variant">Notes</span>
        <textarea
          defaultValue={app.notes ?? ''}
          onBlur={(e) => patch({ notes: e.target.value })}
          rows={4}
          className="mt-1 w-full resize-y rounded-xl border border-outline-variant bg-surface px-3 py-2 font-body text-sm outline-none focus:border-primary"
        />
      </label>

      {app.jd_url && (
        <a href={app.jd_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-label text-sm text-primary no-underline">
          <span className="material-symbols-outlined text-[16px]" aria-hidden>open_in_new</span>
          View original posting
        </a>
      )}

      <CareerOpsFeatureGate feature="resume">
        <ResumeTailorPanel applicationId={app.id} jdText={app.jd_text ?? undefined} />
      </CareerOpsFeatureGate>
    </div>
  )
}

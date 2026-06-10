'use client'
// Paste a JD → fit score + dimension breakdown + gaps + level strategy + the
// Readiness Map (the conversion centerpiece). Save the result to the pipeline.

import { useState } from 'react'
import { ReadinessMap } from './ReadinessMap'
import { gradeClasses } from './grade'
import { FitShareActions } from './public/FitShareActions'
import { isCareerOpsFeatureEnabled } from '@/lib/careerops/flags'
import type { FitEvaluation } from '@/lib/careerops/types'

export function ScorePanel() {
  const [company, setCompany] = useState('')
  const [roleTitle, setRoleTitle] = useState('')
  const [jdText, setJdText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [evaluation, setEvaluation] = useState<FitEvaluation | null>(null)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const trackerOn = isCareerOpsFeatureEnabled('tracker')

  async function score() {
    if (jdText.trim().length < 40) { setError('Paste the full job description first.'); return }
    setLoading(true)
    setError(null)
    setEvaluation(null)
    setShareUrl(null)
    setSaved(false)
    try {
      const res = await fetch('/api/career-ops/score', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jd_text: jdText.trim(), company: company.trim() || undefined, role_title: roleTitle.trim() || undefined }),
      })
      if (res.status === 402) { window.dispatchEvent(new Event('open-upgrade-modal')); setError('You have used your free scores this month.'); return }
      if (!res.ok) throw new Error('score_failed')
      const data = await res.json()
      setEvaluation(data.evaluation as FitEvaluation)
      setShareUrl((data.share_url as string | null) ?? null)
    } catch {
      setError('Scoring failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  async function saveToPipeline() {
    if (!evaluation) return
    const res = await fetch('/api/career-ops/applications', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        company: company.trim() || null,
        role_title: roleTitle.trim() || null,
        jd_text: jdText.trim(),
        fit_score: evaluation.score,
        fit_grade: evaluation.grade,
        fit_breakdown: evaluation.breakdown,
      }),
    })
    if (res.status === 402) { window.dispatchEvent(new Event('open-upgrade-modal')); return }
    if (res.ok) setSaved(true)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Input */}
      <div className="rounded-2xl bg-surface-container-low p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Company (optional)"
            className="rounded-xl border border-outline-variant bg-surface px-3 py-2 font-body text-sm outline-none focus:border-primary"
          />
          <input
            value={roleTitle}
            onChange={(e) => setRoleTitle(e.target.value)}
            placeholder="Role title (optional)"
            className="rounded-xl border border-outline-variant bg-surface px-3 py-2 font-body text-sm outline-none focus:border-primary"
          />
        </div>
        <textarea
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          placeholder="Paste the full job description here..."
          rows={14}
          className="mt-3 w-full resize-y rounded-xl border border-outline-variant bg-surface px-3 py-2 font-body text-sm outline-none focus:border-primary"
        />
        {error && <p className="mt-2 font-body text-sm text-error">{error}</p>}
        <button
          onClick={score}
          disabled={loading}
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 font-label text-sm font-semibold text-on-primary disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden>auto_awesome</span>
          {loading ? 'Scoring...' : 'Score this job'}
        </button>
      </div>

      {/* Result */}
      <div className="rounded-2xl bg-surface-container-low p-5">
        {!evaluation ? (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined text-3xl text-on-surface-variant" aria-hidden>insights</span>
            <p className="mt-2 font-body text-sm text-on-surface-variant">
              Your fit score and a per-discipline readiness map appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <span className={`grid h-14 w-14 place-items-center rounded-2xl font-headline text-2xl font-bold ${gradeClasses(evaluation.grade)}`}>
                {evaluation.grade}
              </span>
              <div>
                <p className="font-headline text-xl font-bold text-on-surface">{evaluation.score}/100</p>
                <p className="font-body text-sm text-on-surface-variant">Overall fit</p>
              </div>
            </div>

            {evaluation.breakdown.length > 0 && (
              <div className="space-y-2">
                {evaluation.breakdown.map((d, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between font-label text-xs text-on-surface-variant">
                      <span>{d.dimension}</span>
                      <span>{Math.round(d.score * 100)}%</span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round(d.score * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {evaluation.level_strategy && (
              <div className="rounded-xl bg-surface-container p-3">
                <p className="font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Level strategy</p>
                <p className="mt-1 font-body text-sm text-on-surface">{evaluation.level_strategy}</p>
              </div>
            )}

            {evaluation.gaps.length > 0 && (
              <div>
                <p className="font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Gaps to close</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 font-body text-sm text-on-surface">
                  {evaluation.gaps.map((g, i) => <li key={i}>{g}</li>)}
                </ul>
              </div>
            )}

            <div>
              <p className="mb-2 font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Readiness map</p>
              <ReadinessMap rows={evaluation.readiness_map} />
            </div>

            {shareUrl && (
              <div>
                <p className="mb-2 font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Share it</p>
                <FitShareActions
                  shareUrl={shareUrl}
                  shareText={`I scored ${evaluation.score}/100 fit against ${(company.trim() || 'a role I want')} with Hatch.`}
                  mode="job_fit"
                />
              </div>
            )}

            {trackerOn && (
              <button
                onClick={saveToPipeline}
                disabled={saved}
                className="inline-flex items-center gap-1.5 rounded-full bg-secondary-container px-5 py-2 font-label text-sm font-semibold text-on-secondary-container disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-[16px]" aria-hidden>{saved ? 'check' : 'bookmark_add'}</span>
                {saved ? 'Saved to pipeline' : 'Save to pipeline'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

'use client'
// Paste a JD → fit score + dimension breakdown + gaps + level strategy + the
// Readiness Map (the conversion centerpiece). Save the result to the pipeline.

import { useState } from 'react'
import { FitReportDashboard } from './report/FitReportDashboard'
import { HatchScene } from './report/HatchScene'
import { LoadingTheater } from './report/LoadingTheater'
import { ShareBand } from './report/ShareBand'
import { fromFitEvaluation } from './report/types'
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

  const focused = company.trim().length > 0 || roleTitle.trim().length > 0
  const hasText = jdText.trim().length > 0

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

  const saveButton = trackerOn ? (
    <button
      onClick={saveToPipeline}
      disabled={saved}
      className="inline-flex items-center gap-1.5 rounded-full bg-secondary-container px-5 py-2 font-label text-sm font-semibold text-on-secondary-container disabled:opacity-60"
    >
      <span className="material-symbols-outlined text-[16px]" aria-hidden>{saved ? 'check' : 'bookmark_add'}</span>
      {saved ? 'Saved to pipeline' : 'Save to pipeline'}
    </button>
  ) : null

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Input panel */}
      <div className="rounded-2xl bg-surface-container-low p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Company (optional)"
            className="rounded-2xl border border-outline-variant bg-surface px-3 py-2 font-body text-sm outline-none focus:border-primary"
          />
          <input
            value={roleTitle}
            onChange={(e) => setRoleTitle(e.target.value)}
            placeholder="Role title (optional)"
            className="rounded-2xl border border-outline-variant bg-surface px-3 py-2 font-body text-sm outline-none focus:border-primary"
          />
        </div>
        <textarea
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          placeholder="Paste the full job description here..."
          rows={14}
          className="mt-3 w-full resize-y rounded-2xl border border-outline-variant bg-surface px-3 py-2 font-body text-sm outline-none focus:border-primary"
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

      {/* Result panel */}
      <div className="rounded-2xl bg-surface-container-low p-5">
        {loading ? (
          <LoadingTheater mode="job_fit" />
        ) : !evaluation ? (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-3 text-center">
            <HatchScene scene={focused || hasText ? 'typing' : 'empty'} size={110} />
            <p className="font-body text-sm text-on-surface-variant">
              Your fit score and a per-discipline readiness map appear here.
            </p>
          </div>
        ) : (
          <FitReportDashboard
            variant="member"
            data={fromFitEvaluation(evaluation, { company: company.trim() || null, roleTitle: roleTitle.trim() || null })}
            ctaSlot={saveButton}
            shareSlot={
              shareUrl ? (
                <ShareBand
                  shareUrl={shareUrl}
                  shareText={`I scored ${evaluation.score}/100 fit against ${company.trim() || 'a role I want'} with Hatch.`}
                  mode="job_fit"
                />
              ) : null
            }
          />
        )}
      </div>
    </div>
  )
}

'use client'
// The public /job-fit tool: one free anonymous run of the job-fit scorer or
// the resume roast. Full result inline, share card link, and the signup CTAs
// that turn a visitor into a member with the report claimed to their account.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { HatchGlyph, type HatchState } from '@/components/shell/HatchGlyph'
import { TurnstileWidget } from '@/components/auth/TurnstileWidget'
import { gradeClasses, readinessChip } from '@/components/careerops/grade'
import { FitShareActions } from './FitShareActions'
import { trackEvent } from '@/lib/posthog/client'
import {
  EVENT_FIT_RUN_STARTED,
  EVENT_FIT_SIGNUP_CTA_CLICKED,
  EVENT_FIT_TOOL_VIEWED,
} from '@/lib/posthog/events'
import type { PublicFitMode, SharedFitReport } from '@/lib/careerops/public/types'

const SEVERITY_CLASSES: Record<string, string> = {
  fatal: 'bg-surface-container-highest text-error',
  major: 'bg-tertiary-container text-on-surface',
  minor: 'bg-secondary-container text-on-secondary-container',
}

function SignupCta({ mode, source, label }: { mode: PublicFitMode; source: 'result' | 'gate'; label: string }) {
  return (
    <Link
      href="/signup?redirectTo=/career-ops"
      onClick={() => trackEvent(EVENT_FIT_SIGNUP_CTA_CLICKED, { mode, source })}
      className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 font-label text-sm font-semibold text-on-primary no-underline"
    >
      <span className="material-symbols-outlined text-[18px]" aria-hidden>rocket_launch</span>
      {label}
    </Link>
  )
}

export function PublicFitTool() {
  const [mode, setMode] = useState<PublicFitMode>('job_fit')
  const [company, setCompany] = useState('')
  const [roleTitle, setRoleTitle] = useState('')
  const [jdText, setJdText] = useState('')
  const [resumeText, setResumeText] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [gated, setGated] = useState(false)
  const [report, setReport] = useState<SharedFitReport | null>(null)
  const [shareUrl, setShareUrl] = useState('')
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    trackEvent(EVENT_FIT_TOOL_VIEWED, { mode })
    // Mode switches are deliberate funnel signals, not noise.
  }, [mode])

  const hatchState: HatchState = loading
    ? 'reviewing'
    : report
      ? (report.score ?? 0) >= 70
        ? 'celebrating'
        : 'speaking'
      : focused || jdText || resumeText
        ? 'listening'
        : 'idle'

  async function run() {
    if (mode === 'job_fit' && jdText.trim().length < 40) {
      setError('Paste the job description first. The whole posting works best.')
      return
    }
    if (mode === 'resume_roast' && resumeText.trim().length < 100) {
      setError('Paste the resume text first. Plain text is fine.')
      return
    }

    setLoading(true)
    setError(null)
    setReport(null)
    trackEvent(EVENT_FIT_RUN_STARTED, { mode })

    try {
      const res = await fetch('/api/public/careerops/score', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          mode,
          jd_text: jdText.trim() || undefined,
          resume_text: resumeText.trim() || undefined,
          company: company.trim() || undefined,
          role_title: roleTitle.trim() || undefined,
          turnstileToken: turnstileToken || undefined,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setReport(data.report as SharedFitReport)
        setShareUrl(data.share_url as string)
        return
      }

      const body = await res.json().catch(() => null)
      const code = body?.code as string | undefined
      if (code === 'free_run_used' || code === 'capacity') {
        setGated(true)
      } else if (code === 'signed_in') {
        window.location.href = '/career-ops/score'
      } else if (code === 'not_a_job') {
        setError('That text does not read like a job description. Paste the posting itself.')
      } else if (code === 'not_a_resume') {
        setError('That text does not read like a resume. Paste the resume itself.')
      } else if (code === 'turnstile_failed') {
        setError('Complete the security check below, then run it again.')
      } else if (res.status === 429) {
        setError('Too many attempts. Wait a moment and try again.')
      } else if (code === 'invalid_request' && body?.issues?.[0]?.message) {
        setError(String(body.issues[0].message))
      } else {
        setError('Scoring failed. Try again.')
      }
    } catch {
      setError('Scoring failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const demanded = report?.readinessMap.filter((r) => r.demanded) ?? []

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-10">
      {/* Hero */}
      <div className="flex flex-col items-center text-center">
        <HatchGlyph size={64} state={hatchState} className="text-primary" />
        <h1 className="mt-4 font-headline text-3xl font-bold text-on-surface md:text-4xl">
          {mode === 'job_fit' ? 'Score yourself against any job posting' : 'Get your resume roasted'}
        </h1>
        <p className="mt-3 max-w-2xl font-body text-base text-on-surface-variant">
          {mode === 'job_fit'
            ? 'Paste a job description. Hatch reads the real bar behind the listing, scores your fit, and names the gaps worth closing. One free run, no account.'
            : 'Paste your resume. Hatch reads it the way a tired hiring manager does and tells you exactly what fails, line by line. One free run, no account.'}
        </p>
      </div>

      {/* Tabs */}
      <div className="mt-8 flex justify-center gap-2">
        {(
          [
            { key: 'job_fit', label: 'Job fit score', icon: 'target' },
            { key: 'resume_roast', label: 'Resume roast', icon: 'local_fire_department' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setMode(tab.key); setError(null) }}
            className={`inline-flex items-center gap-1.5 rounded-full px-5 py-2 font-label text-sm font-semibold ${
              mode === tab.key
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {gated ? (
        <div className="mx-auto mt-10 max-w-xl rounded-2xl bg-surface-container-low p-8 text-center">
          <HatchGlyph size={48} state="speaking" className="mx-auto text-primary" />
          <h2 className="mt-4 font-headline text-2xl font-bold text-on-surface">Your free run is used</h2>
          <p className="mt-2 font-body text-sm text-on-surface-variant">
            Members score every job they consider, track the gaps over time, and get a practice plan that moves the score. The report you already ran comes with you.
          </p>
          <div className="mt-5 flex justify-center">
            <SignupCta mode={mode} source="gate" label="Sign up and keep scoring" />
          </div>
        </div>
      ) : (
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {/* Input */}
          <div className="rounded-2xl bg-surface-container-low p-5">
            {mode === 'job_fit' && (
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
            )}

            {mode === 'job_fit' ? (
              <>
                <textarea
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder="Paste the full job description here..."
                  rows={10}
                  className="mt-3 w-full resize-y rounded-xl border border-outline-variant bg-surface px-3 py-2 font-body text-sm outline-none focus:border-primary"
                />
                <p className="mt-3 font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                  Your background
                </p>
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder="Paste your resume, or three lines on what you have built. Without it you get the role's bar; with it you get your score against that bar."
                  rows={5}
                  className="mt-1 w-full resize-y rounded-xl border border-outline-variant bg-surface px-3 py-2 font-body text-sm outline-none focus:border-primary"
                />
              </>
            ) : (
              <>
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder="Paste your resume as plain text..."
                  rows={12}
                  className="mt-3 w-full resize-y rounded-xl border border-outline-variant bg-surface px-3 py-2 font-body text-sm outline-none focus:border-primary"
                />
                <textarea
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder="Optional: paste a job description to roast against a specific bar."
                  rows={4}
                  className="mt-3 w-full resize-y rounded-xl border border-outline-variant bg-surface px-3 py-2 font-body text-sm outline-none focus:border-primary"
                />
              </>
            )}

            {error && <p className="mt-2 font-body text-sm text-error">{error}</p>}

            <TurnstileWidget onToken={setTurnstileToken} className="mt-3" />

            <button
              onClick={run}
              disabled={loading}
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 font-label text-sm font-semibold text-on-primary disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden>auto_awesome</span>
              {loading ? 'Hatch is reading...' : mode === 'job_fit' ? 'Score my fit' : 'Roast my resume'}
            </button>
          </div>

          {/* Result */}
          <div className="rounded-2xl bg-surface-container-low p-5">
            {!report ? (
              <div className="flex h-full min-h-[240px] flex-col items-center justify-center text-center">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant" aria-hidden>insights</span>
                <p className="mt-2 max-w-xs font-body text-sm text-on-surface-variant">
                  {mode === 'job_fit'
                    ? 'Your fit score, the dimension breakdown, and the readiness bar per discipline appear here.'
                    : 'The verdict, the graded teardown, and the fixes appear here.'}
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {report.score != null && report.grade ? (
                  <div className="flex items-center gap-3">
                    <span className={`grid h-14 w-14 place-items-center rounded-2xl font-headline text-2xl font-bold ${gradeClasses(report.grade)}`}>
                      {report.grade}
                    </span>
                    <div>
                      <p className="font-headline text-xl font-bold text-on-surface">{report.score}/100</p>
                      <p className="font-body text-sm text-on-surface-variant">
                        {report.mode === 'job_fit' ? 'Overall fit' : 'Resume score'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl bg-surface-container p-3">
                    <p className="font-body text-sm text-on-surface">
                      This is the role&apos;s bar. Add your background above to get a personal score against it.
                    </p>
                  </div>
                )}

                {report.roast?.verdict_line && (
                  <blockquote className="rounded-xl bg-surface-container p-4 font-body text-base italic text-on-surface">
                    &ldquo;{report.roast.verdict_line}&rdquo;
                  </blockquote>
                )}

                {report.breakdown.length > 0 && (
                  <div className="space-y-2">
                    {report.breakdown.map((d, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between font-label text-xs text-on-surface-variant">
                          <span>{d.dimension}</span>
                          <span>{Math.round(d.score * 100)}%</span>
                        </div>
                        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round(d.score * 100)}%` }} />
                        </div>
                        {d.note && <p className="mt-1 font-body text-xs text-on-surface-variant">{d.note}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {report.roast && report.roast.sections.length > 0 && (
                  <div className="space-y-3">
                    {report.roast.sections.map((section, i) => (
                      <div key={i} className="rounded-xl bg-surface-container p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-headline text-base font-semibold text-on-surface">{section.title}</h4>
                          <span className={`rounded-full px-2.5 py-0.5 font-label text-xs font-semibold ${SEVERITY_CLASSES[section.severity] ?? SEVERITY_CLASSES.major}`}>
                            {section.severity}
                          </span>
                        </div>
                        <p className="mt-1.5 font-body text-sm text-on-surface">{section.finding}</p>
                        <p className="mt-1 font-body text-sm text-on-surface-variant">
                          <span className="font-semibold text-on-surface">Fix:</span> {section.fix}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {report.gaps.length > 0 && (
                  <div>
                    <p className="font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Gaps to close</p>
                    <ul className="mt-1 list-disc space-y-1 pl-5 font-body text-sm text-on-surface">
                      {report.gaps.map((g, i) => <li key={i}>{g}</li>)}
                    </ul>
                  </div>
                )}

                {demanded.length > 0 && (
                  <div>
                    <p className="mb-2 font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                      What this loop tests
                    </p>
                    <div className="space-y-2">
                      {demanded.map((row) => {
                        const chip = readinessChip(row.user_readiness)
                        return (
                          <div key={row.discipline} className="rounded-xl bg-surface-container p-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-headline text-sm font-semibold capitalize text-on-surface">
                                {row.discipline.replaceAll('_', ' ')}
                              </span>
                              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-label text-xs font-semibold ${chip.classes}`}>
                                <span className="material-symbols-outlined text-[14px]" aria-hidden>{chip.icon}</span>
                                {chip.label}
                              </span>
                            </div>
                            {row.bar && <p className="mt-1 font-body text-sm text-on-surface-variant">{row.bar}</p>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="rounded-xl bg-primary-fixed p-4">
                  <p className="font-body text-sm text-on-surface">
                    {report.mode === 'job_fit'
                      ? 'The score is a snapshot. Members get the practice plan that moves it: one rep per gap, tracked until the readiness map turns green.'
                      : 'The roast finds the problems. Members get the rewrite plan and the practice reps that give the bullets something real to say.'}
                  </p>
                  <div className="mt-3">
                    <SignupCta mode={report.mode} source="result" label="Save this report and get the plan" />
                  </div>
                </div>

                {shareUrl && (
                  <div>
                    <p className="mb-2 font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                      Share it
                    </p>
                    <FitShareActions
                      shareUrl={shareUrl}
                      shareText={
                        report.mode === 'resume_roast'
                          ? 'Hatch roasted my resume. The verdict is fair and it hurts.'
                          : 'I ran a job posting through Hatch to see the real bar behind the listing.'
                      }
                      mode={report.mode}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

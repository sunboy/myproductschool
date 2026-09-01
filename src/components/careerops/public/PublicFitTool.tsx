'use client'
// The public /job-fit tool: one free anonymous run of the job-fit scorer or
// the resume roast. Full result inline, share card link, and the signup CTAs
// that turn a visitor into a member with the report claimed to their account.

import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { FitReportDashboard } from '@/components/careerops/report/FitReportDashboard'
import { HatchScene } from '@/components/careerops/report/HatchScene'
import { LoadingTheater } from '@/components/careerops/report/LoadingTheater'
import { ShareBand } from '@/components/careerops/report/ShareBand'
import { fromSharedFitReport } from '@/components/careerops/report/types'
import { trackEvent } from '@/lib/posthog/client'
import {
  EVENT_FIT_RUN_STARTED,
  EVENT_FIT_SIGNUP_CTA_CLICKED,
  EVENT_FIT_TOOL_VIEWED,
} from '@/lib/posthog/events'
import type { PublicFitMode, SharedFitReport } from '@/lib/careerops/public/types'

import { FitToolForm } from './FitToolForm'
import { FitToolGate } from './FitToolGate'
import { ModeToggle } from './ModeToggle'

type Phase = 'form' | 'loading' | 'gated' | 'report'

const PHASE_VARIANTS = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

function SignupCtaBand({ mode, report }: { mode: PublicFitMode; report: SharedFitReport }) {
  return (
    <div className="rounded-xl bg-primary-fixed p-4">
      <p className="font-body text-sm text-on-surface">
        {report.mode === 'job_fit'
          ? 'The score is a snapshot. Members get the practice plan that moves it: one rep per gap, tracked until the readiness map turns green.'
          : 'The roast finds the problems. Members get the rewrite plan and the practice reps that give the bullets something real to say.'}
      </p>
      <div className="mt-3">
        <Link
          href="/signup?redirectTo=/career-ops"
          onClick={() => trackEvent(EVENT_FIT_SIGNUP_CTA_CLICKED, { mode, source: 'result' })}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 font-label text-sm font-semibold text-on-primary no-underline"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden>
            rocket_launch
          </span>
          Save this report and get the plan
        </Link>
      </div>
    </div>
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

  // Derive phase
  const phase: Phase = gated
    ? 'gated'
    : loading
      ? 'loading'
      : report
        ? 'report'
        : 'form'

  // Derive Hatch scene
  const scene = loading
    ? 'loading'
    : report
      ? (report.score ?? 0) >= 70
        ? 'reveal-high'
        : 'reveal-low'
      : focused || jdText || resumeText
        ? 'typing'
        : 'empty'

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

  function handleModeChange(next: PublicFitMode) {
    setMode(next)
    setError(null)
  }

  const shareText =
    report?.mode === 'resume_roast'
      ? 'Hatch roasted my resume. The verdict is fair and it hurts.'
      : 'I ran a job posting through Hatch to see the real bar behind the listing.'

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-10">
      {/* Hero — Hatch lives here only in the form phase; the loading theater,
          report hero card, and gate panel each bring their own. */}
      <div className="flex flex-col items-center text-center">
        {phase === 'form' && <HatchScene scene={scene} size={96} />}
        <h1 className="mt-4 font-headline text-3xl font-bold text-on-surface md:text-4xl">
          {mode === 'job_fit'
            ? 'Score yourself against any job posting'
            : 'Get your resume roasted'}
        </h1>
        <p className="mt-3 max-w-2xl font-body text-base text-on-surface-variant">
          {mode === 'job_fit'
            ? 'Paste a job description. Hatch reads the real bar behind the listing, scores your fit, and names the gaps worth closing. One free run, no account.'
            : 'Paste your resume. Hatch reads it the way a tired hiring manager does and tells you exactly what fails, line by line. One free run, no account.'}
        </p>
      </div>

      {/* Mode toggle */}
      <div className="mt-8">
        <ModeToggle mode={mode} onChange={handleModeChange} />
      </div>

      {/* Phase-switched content */}
      <div className="mt-10">
        <AnimatePresence mode="wait">
          {phase === 'form' && (
            <motion.div
              key="form"
              initial={PHASE_VARIANTS.initial}
              animate={PHASE_VARIANTS.animate}
              exit={PHASE_VARIANTS.exit}
              transition={{ duration: 0.22 }}
            >
              <FitToolForm
                mode={mode}
                company={company}
                setCompany={setCompany}
                roleTitle={roleTitle}
                setRoleTitle={setRoleTitle}
                jdText={jdText}
                setJdText={setJdText}
                resumeText={resumeText}
                setResumeText={setResumeText}
                onTurnstileToken={setTurnstileToken}
                onSubmit={run}
                onFocusChange={setFocused}
                loading={loading}
                error={error}
              />
            </motion.div>
          )}

          {phase === 'loading' && (
            <motion.div
              key="loading"
              initial={PHASE_VARIANTS.initial}
              animate={PHASE_VARIANTS.animate}
              exit={PHASE_VARIANTS.exit}
              transition={{ duration: 0.22 }}
            >
              <LoadingTheater mode={mode} />
            </motion.div>
          )}

          {phase === 'gated' && (
            <motion.div
              key="gated"
              initial={PHASE_VARIANTS.initial}
              animate={PHASE_VARIANTS.animate}
              exit={PHASE_VARIANTS.exit}
              transition={{ duration: 0.22 }}
            >
              <FitToolGate mode={mode} />
            </motion.div>
          )}

          {phase === 'report' && report && (
            <motion.div
              key="report"
              initial={PHASE_VARIANTS.initial}
              animate={PHASE_VARIANTS.animate}
              exit={PHASE_VARIANTS.exit}
              transition={{ duration: 0.22 }}
            >
              <FitReportDashboard
                variant="tool"
                data={fromSharedFitReport(report)}
                ctaSlot={<SignupCtaBand mode={mode} report={report} />}
                shareSlot={
                  shareUrl ? (
                    <ShareBand shareUrl={shareUrl} shareText={shareText} mode={mode} />
                  ) : null
                }
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

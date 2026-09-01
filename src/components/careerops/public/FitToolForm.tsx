'use client'

import { TurnstileWidget } from '@/components/auth/TurnstileWidget'
import type { PublicFitMode } from '@/lib/careerops/public/types'

interface FitToolFormProps {
  mode: PublicFitMode
  company: string
  setCompany: (v: string) => void
  roleTitle: string
  setRoleTitle: (v: string) => void
  jdText: string
  setJdText: (v: string) => void
  resumeText: string
  setResumeText: (v: string) => void
  onTurnstileToken: (token: string) => void
  onSubmit: () => void
  onFocusChange: (focused: boolean) => void
  loading: boolean
  error: string | null
}

export function FitToolForm({
  mode,
  company,
  setCompany,
  roleTitle,
  setRoleTitle,
  jdText,
  setJdText,
  resumeText,
  setResumeText,
  onTurnstileToken,
  onSubmit,
  onFocusChange,
  loading,
  error,
}: FitToolFormProps) {
  const inputBase =
    'w-full rounded-2xl border border-outline-variant bg-surface-container-low px-3 py-2 font-body text-sm outline-none focus:border-primary'

  return (
    <div className="rounded-2xl bg-surface-container-low p-5">
      {mode === 'job_fit' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Company (optional)"
            className={inputBase}
          />
          <input
            value={roleTitle}
            onChange={(e) => setRoleTitle(e.target.value)}
            placeholder="Role title (optional)"
            className={inputBase}
          />
        </div>
      )}

      {mode === 'job_fit' ? (
        <>
          <textarea
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            onFocus={() => onFocusChange(true)}
            onBlur={() => onFocusChange(false)}
            placeholder="Paste the full job description here..."
            rows={10}
            className={`mt-3 resize-y ${inputBase}`}
          />
          <p className="mt-3 font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
            Your background
          </p>
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            onFocus={() => onFocusChange(true)}
            onBlur={() => onFocusChange(false)}
            placeholder="Paste your resume, or three lines on what you have built. Without it you get the role's bar; with it you get your score against that bar."
            rows={5}
            className={`mt-1 resize-y ${inputBase}`}
          />
        </>
      ) : (
        <>
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            onFocus={() => onFocusChange(true)}
            onBlur={() => onFocusChange(false)}
            placeholder="Paste your resume as plain text..."
            rows={12}
            className={`mt-3 resize-y ${inputBase}`}
          />
          <textarea
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            onFocus={() => onFocusChange(true)}
            onBlur={() => onFocusChange(false)}
            placeholder="Optional: paste a job description to roast against a specific bar."
            rows={4}
            className={`mt-3 resize-y ${inputBase}`}
          />
        </>
      )}

      {error && <p className="mt-2 font-body text-sm text-error">{error}</p>}

      <TurnstileWidget onToken={onTurnstileToken} className="mt-3" />

      <button
        onClick={onSubmit}
        disabled={loading}
        className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 font-label text-sm font-semibold text-on-primary disabled:opacity-60"
      >
        <span className="material-symbols-outlined text-[18px]" aria-hidden>
          auto_awesome
        </span>
        {loading
          ? 'Hatch is reading...'
          : mode === 'job_fit'
            ? 'Score my fit'
            : 'Roast my resume'}
      </button>
    </div>
  )
}

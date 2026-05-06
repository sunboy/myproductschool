'use client'

import { useMemo, useState } from 'react'

type ReportCategory = 'harmful' | 'harassment' | 'spam' | 'broken_incorrect' | 'other'
type ReportTargetType = 'hatch_response' | 'share_scorecard' | 'discussion_comment'

type ReportMetadata = Record<string, string | number | boolean | null>

interface ReportButtonProps {
  targetType: ReportTargetType
  targetId?: string
  targetUrl?: string
  metadata?: ReportMetadata
  label?: string
  compact?: boolean
  className?: string
}

const CATEGORIES: Array<{ value: ReportCategory; label: string; helper: string }> = [
  { value: 'harmful', label: 'Harmful', helper: 'Unsafe or harmful advice' },
  { value: 'harassment', label: 'Harassment', helper: 'Abusive or targeted content' },
  { value: 'spam', label: 'Spam', helper: 'Promotional or repeated content' },
  { value: 'broken_incorrect', label: 'Broken or incorrect', helper: 'Wrong, broken, or misleading' },
  { value: 'other', label: 'Other', helper: 'Anything else that needs review' },
]

function currentRelativeUrl() {
  if (typeof window === 'undefined') return undefined
  return `${window.location.pathname}${window.location.search}`
}

export function ReportButton({
  targetType,
  targetId,
  targetUrl,
  metadata,
  label = 'Report',
  compact = false,
  className = '',
}: ReportButtonProps) {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<ReportCategory>('broken_incorrect')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const buttonClassName = useMemo(() => {
    if (className) return className
    if (compact) {
      return 'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface disabled:opacity-50'
    }
    return 'inline-flex items-center gap-2 rounded-full border border-outline-variant px-3 py-1.5 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface disabled:opacity-50'
  }, [className, compact])

  async function submitReport() {
    if (submitting) return
    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/abuse-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType,
          targetId,
          targetUrl: targetUrl ?? currentRelativeUrl(),
          category,
          message: message.trim() || undefined,
          metadata,
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null
        setError(payload?.error ?? 'Could not send report. Try again.')
        return
      }

      setSent(true)
      setOpen(false)
      setMessage('')
      window.setTimeout(() => setSent(false), 3000)
    } catch {
      setError('Could not send report. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true)
          setError(null)
        }}
        className={buttonClassName}
        disabled={submitting}
      >
        <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 0" }}>
          flag
        </span>
        <span>{sent ? 'Report sent' : label}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-dialog-title"
          onClick={() => !submitting && setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-outline-variant bg-surface p-5 text-on-surface shadow-2xl"
            onClick={event => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="report-dialog-title" className="font-headline text-lg font-bold">
                  Report content
                </h2>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Pick the closest reason so the team can review it quickly.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !submitting && setOpen(false)}
                className="rounded-full p-1 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                aria-label="Close report dialog"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="mt-4 grid gap-2">
              {CATEGORIES.map(item => (
                <label
                  key={item.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                    category === item.value
                      ? 'border-primary bg-primary-container text-on-primary-container'
                      : 'border-outline-variant bg-surface-container-low hover:bg-surface-container'
                  }`}
                >
                  <input
                    type="radio"
                    name="report-category"
                    value={item.value}
                    checked={category === item.value}
                    onChange={() => setCategory(item.value)}
                    className="mt-1 accent-primary"
                  />
                  <span>
                    <span className="block text-sm font-bold">{item.label}</span>
                    <span className="block text-xs opacity-75">{item.helper}</span>
                  </span>
                </label>
              ))}
            </div>

            <label className="mt-4 block">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                Optional note
              </span>
              <textarea
                value={message}
                onChange={event => setMessage(event.target.value.slice(0, 1000))}
                rows={3}
                className="mt-2 w-full resize-none rounded-lg border border-outline-variant bg-surface-container-low p-3 text-sm text-on-surface outline-none focus:border-primary"
                placeholder="Add context for the review team"
              />
            </label>

            {error && (
              <p className="mt-3 text-sm font-semibold text-error">{error}</p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => !submitting && setOpen(false)}
                className="rounded-full px-4 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitReport}
                disabled={submitting}
                className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-on-primary hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? 'Sending...' : 'Send report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

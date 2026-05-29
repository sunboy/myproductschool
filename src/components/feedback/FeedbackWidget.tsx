'use client'

import { useEffect, useRef, useState } from 'react'

type FeedbackMode = 'feedback' | 'nps'

const RATING_LABELS = [
  'Poor',
  'Rough',
  'Okay',
  'Useful',
  'Great',
] as const

function currentRelativePath() {
  if (typeof window === 'undefined') return '/'
  return `${window.location.pathname}${window.location.search}`
}

export function FeedbackWidget() {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<FeedbackMode>('feedback')
  const [rating, setRating] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const npsPromptedRef = useRef(false)

  useEffect(() => {
    let cancelled = false

    async function loadPromptState() {
      try {
        const response = await fetch('/api/feedback', { cache: 'no-store' })
        if (!response.ok) return
        const data = await response.json() as { shouldPromptNps?: boolean }
        if (cancelled || !data.shouldPromptNps || npsPromptedRef.current) return

        npsPromptedRef.current = true
        setMode('nps')
        setRating(null)
        setMessage('')
        setError(null)
        setOpen(true)
        void recordPromptEvent('shown')
      } catch {
        // Feedback prompting should never block the app shell.
      }
    }

    void loadPromptState()

    return () => {
      cancelled = true
    }
  }, [])

  async function recordPromptEvent(event: 'shown' | 'dismissed') {
    try {
      await fetch('/api/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptType: 'nps', event }),
      })
    } catch {
      // Non-critical cap bookkeeping.
    }
  }

  function openFeedback() {
    setMode('feedback')
    setRating(null)
    setMessage('')
    setError(null)
    setOpen(true)
  }

  function closeDialog() {
    if (submitting) return
    if (mode === 'nps') void recordPromptEvent('dismissed')
    setOpen(false)
  }

  async function submitFeedback() {
    if (!rating || submitting) return
    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: mode,
          rating,
          message: message.trim() || undefined,
          path: currentRelativePath(),
          metadata: {
            trigger: mode === 'nps' ? 'nps_prompt' : 'floating_button',
          },
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null
        setError(payload?.error ?? 'Could not send feedback. Try again.')
        return
      }

      setSent(true)
      setOpen(false)
      setRating(null)
      setMessage('')
      window.setTimeout(() => setSent(false), 3000)
    } catch {
      setError('Could not send feedback. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const title = mode === 'nps' ? 'How useful is HackProduct right now?' : 'Send feedback'
  const description = mode === 'nps'
    ? 'Rate the product and add a note if something would make it more useful.'
    : 'Tell us what felt broken, confusing, or worth improving.'

  return (
    <>
      <button
        type="button"
        onClick={openFeedback}
        className="fixed right-5 bottom-24 z-[55] inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface px-3.5 py-2 text-xs font-bold text-on-surface shadow-lg transition-transform hover:-translate-y-0.5 hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:bottom-24"
        aria-label="Send feedback"
      >
        <span className="material-symbols-outlined text-[17px]" style={{ fontVariationSettings: "'FILL' 0" }}>
          rate_review
        </span>
        <span>{sent ? 'Sent' : 'Feedback'}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[95] flex items-center justify-center bg-black/50 px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="feedback-dialog-title"
          onClick={closeDialog}
        >
          <div
            className="w-full max-w-md rounded-xl border border-outline-variant bg-surface p-5 text-on-surface shadow-2xl"
            onClick={event => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="feedback-dialog-title" className="font-headline text-lg font-bold">
                  {title}
                </h2>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {description}
                </p>
              </div>
              <button
                type="button"
                onClick={closeDialog}
                disabled={submitting}
                className="rounded-full p-1 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface disabled:opacity-50"
                aria-label="Close feedback dialog"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="mt-5 grid grid-cols-5 gap-2" role="radiogroup" aria-label="Rating">
              {RATING_LABELS.map((label, index) => {
                const value = index + 1
                const selected = rating === value
                return (
                  <button
                    key={label}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setRating(value)}
                    className={`flex min-h-16 flex-col items-center justify-center rounded-lg border px-1.5 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      selected
                        ? 'border-primary bg-primary-container text-on-primary-container'
                        : 'border-outline-variant bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                    }`}
                  >
                    <span className="text-base font-black">{value}</span>
                    <span className="mt-1 text-[10px] font-semibold leading-tight">{label}</span>
                  </button>
                )
              })}
            </div>

            <label className="mt-4 block">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                Optional note
              </span>
              <textarea
                value={message}
                onChange={event => setMessage(event.target.value.slice(0, 2000))}
                rows={4}
                className="mt-2 w-full resize-none rounded-lg border border-outline-variant bg-surface-container-low p-3 text-sm text-on-surface outline-none focus:border-primary"
                placeholder="What should we fix or keep doing?"
              />
            </label>

            {error && (
              <p className="mt-3 text-sm font-semibold text-error">{error}</p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeDialog}
                disabled={submitting}
                className="rounded-full px-4 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high disabled:opacity-50"
              >
                Later
              </button>
              <button
                type="button"
                onClick={submitFeedback}
                disabled={!rating || submitting}
                className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-on-primary hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

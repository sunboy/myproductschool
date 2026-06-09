'use client'

import { useState, useEffect, useRef, type ReactNode } from 'react'
import { useMagnetTracking } from './useMagnetTracking'
import {
  EVENT_MAGNET_GATE_VIEWED,
  EVENT_MAGNET_GATE_SUBMITTED,
  EVENT_MAGNET_CTA_CLICKED,
} from '@/lib/posthog/events'
import { getStoredUtm } from '@/lib/lead-magnets/utm'

type GateMode = 'gate' | 'signup'

interface LeadGateFormProps {
  /** Magnet slug — stored as source_slug on the lead row. */
  sourceSlug: string
  mode: GateMode
  /** The computed surface result + utm, persisted with the lead. */
  magnetResult?: Record<string, unknown>
  /** Headline above the form (gate mode). */
  title: string
  /** Supporting line under the title. */
  subtitle?: string
  /** Button label. */
  ctaLabel: string
  /** Where signup-mode (and the post-unlock secondary CTA) sends the account. */
  signupNext?: string
  /** Rendered once the gate is cleared (gate mode only). */
  children?: ReactNode
  /** Secondary CTA label shown after unlock (gate mode). Defaults provided. */
  postUnlockCtaLabel?: string
}

function openSignup(next: string) {
  window.dispatchEvent(
    new CustomEvent('open-auth-modal', { detail: { mode: 'signup', next } }),
  )
}

/**
 * Shared lead capture for the /go/* pages. Two modes:
 *  - `gate`   — email unlocks the deep result inline + triggers the unlock email.
 *  - `signup` — surface value is already shown; this routes straight to the
 *               in-page signup modal (V3AuthGate handles the rest).
 *
 * Posts to /api/leads with the page's source_slug + computed magnet_result.
 * Spam defence: a hidden honeypot `website` field + a client submit-time trap.
 */
export function LeadGateForm({
  sourceSlug,
  mode,
  magnetResult,
  title,
  subtitle,
  ctaLabel,
  signupNext = '/dashboard',
  children,
  postUnlockCtaLabel = 'Start training free',
}: LeadGateFormProps) {
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('') // honeypot
  const [status, setStatus] = useState<'idle' | 'submitting' | 'unlocked' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [reportUrl, setReportUrl] = useState<string | null>(null)

  const { track } = useMagnetTracking(sourceSlug)

  // Fire gate_viewed once when the form scrolls into view.
  const formRef = useRef<HTMLFormElement | HTMLDivElement>(null)
  const viewedRef = useRef(false)
  useEffect(() => {
    const el = formRef.current
    if (!el || viewedRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !viewedRef.current) {
          viewedRef.current = true
          track(EVENT_MAGNET_GATE_VIEWED, { mode })
          observer.disconnect()
        }
      },
      { threshold: 0.2 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [track, mode])

  if (mode === 'signup') {
    return (
      <div id="lm-gate" className="lm-gate lm-gate-signup" ref={formRef as React.RefObject<HTMLDivElement>}>
        <button type="button" className="btn btn-forest lm-gate-cta" onClick={() => openSignup(signupNext)}>
          {ctaLabel}
        </button>
      </div>
    )
  }

  if (status === 'unlocked') {
    return (
      <div className="lm-unlocked">
        <div className="lm-unlocked-body">
          {reportUrl ? (
            <a
              href={reportUrl}
              className="btn btn-forest lm-gate-cta lm-report-cta"
              onClick={() => track(EVENT_MAGNET_CTA_CLICKED, { cta: 'report' })}
            >
              Open your full report
            </a>
          ) : null}
          {children}
        </div>
        <div className="lm-unlocked-foot">
          <p>We also sent this to your inbox.</p>
          <button
            type="button"
            className="btn btn-forest lm-gate-cta"
            onClick={() => {
              track(EVENT_MAGNET_CTA_CLICKED, { cta: 'signup' })
              openSignup(signupNext)
            }}
          >
            {postUnlockCtaLabel}
          </button>
        </div>
      </div>
    )
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (status === 'submitting') return
    setStatus('submitting')
    setErrorMsg('')

    track(EVENT_MAGNET_GATE_SUBMITTED)

    try {
      // Merge stored UTM into the payload so the server can segment by campaign.
      const utm = getStoredUtm()
      const enrichedResult =
        magnetResult && Object.keys(utm).length > 0
          ? { ...magnetResult, utm }
          : magnetResult

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          source_slug: sourceSlug,
          magnet_result: enrichedResult,
          website,
        }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setErrorMsg(data.error === 'Invalid request' ? 'Enter a valid email.' : 'Something went wrong. Try again.')
        setStatus('error')
        return
      }
      const data = (await res.json()) as { success: boolean; reportUrl?: string | null }
      setReportUrl(data.reportUrl ?? null)
      setStatus('unlocked')
    } catch {
      setErrorMsg('Something went wrong. Try again.')
      setStatus('error')
    }
  }

  return (
    <form id="lm-gate" className="lm-gate" onSubmit={onSubmit} noValidate ref={formRef as React.RefObject<HTMLFormElement>}>
      <p className="lm-gate-title">{title}</p>
      {subtitle ? <p className="lm-gate-sub">{subtitle}</p> : null}
      <div className="lm-gate-row">
        <input
          type="email"
          className="lm-input"
          placeholder="you@work.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          aria-label="Email address"
        />
        <button type="submit" className="btn btn-amber lm-gate-cta" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Unlocking...' : ctaLabel}
        </button>
      </div>
      {/* Honeypot — visually hidden, must stay empty. */}
      <input
        type="text"
        name="website"
        className="lm-hp"
        tabIndex={-1}
        autoComplete="off"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        aria-hidden="true"
      />
      {status === 'error' ? <p className="lm-gate-err">{errorMsg}</p> : null}
      <p className="lm-gate-fine">No spam. Unsubscribe anytime.</p>
    </form>
  )
}

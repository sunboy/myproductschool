'use client'

import { useState, type ReactNode } from 'react'

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

  if (mode === 'signup') {
    return (
      <div className="lm-gate lm-gate-signup">
        <button type="button" className="btn btn-forest lm-gate-cta" onClick={() => openSignup(signupNext)}>
          {ctaLabel}
        </button>
      </div>
    )
  }

  if (status === 'unlocked') {
    return (
      <div className="lm-unlocked">
        <div className="lm-unlocked-body">{children}</div>
        <div className="lm-unlocked-foot">
          <p>We also sent this to your inbox.</p>
          <button type="button" className="btn btn-forest lm-gate-cta" onClick={() => openSignup(signupNext)}>
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
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          source_slug: sourceSlug,
          magnet_result: magnetResult,
          website,
        }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setErrorMsg(data.error === 'Invalid request' ? 'Enter a valid email.' : 'Something went wrong. Try again.')
        setStatus('error')
        return
      }
      setStatus('unlocked')
    } catch {
      setErrorMsg('Something went wrong. Try again.')
      setStatus('error')
    }
  }

  return (
    <form className="lm-gate" onSubmit={onSubmit} noValidate>
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

'use client'

import { useState } from 'react'

// Minimal placeholder implementation. A parallel workstream owns the richer
// version of this component at the same path — this one only needs to be
// correct and self-contained so the blog pages build and function today.
// Contract (keep stable so either version drops in cleanly):
//   props: { source: 'blog' | 'footer' }
//   POST /api/newsletter/subscribe  body: { email: string, source: string }
//   success shape: { ok: true } (or any 2xx) — treat as subscribed
//   error shape: { ok: false, error: string } — show `error` if present

export type SubscribeBoxSource = 'blog' | 'footer'

interface SubscribeBoxProps {
  source: SubscribeBoxSource
}

type SubscribeState = 'idle' | 'submitting' | 'success' | 'error'

export function SubscribeBox({ source }: SubscribeBoxProps) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<SubscribeState>('idle')
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (state === 'submitting') return

    setState('submitting')
    setMessage(null)

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, source }),
      })
      const body = await res.json().catch(() => ({}))

      if (!res.ok || body?.ok === false) {
        setState('error')
        setMessage(body?.error ?? 'Something went wrong. Try again in a moment.')
        return
      }

      setState('success')
      setMessage('You are on the list. Hatch will send the next issue straight to your inbox.')
      setEmail('')
    } catch {
      setState('error')
      setMessage('Something went wrong. Try again in a moment.')
    }
  }

  if (state === 'success') {
    return (
      <div className="rounded-xl bg-primary-container p-6 text-center">
        <p className="font-body text-sm font-semibold text-on-primary-container">{message}</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-surface-container p-6">
      <p className="font-headline text-lg font-bold text-on-surface">The HackProduct Letter</p>
      <p className="mt-1 font-body text-sm text-on-surface-variant">
        Hatch sends one email when there is something worth your time. No fluff, no daily noise.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <label htmlFor={`subscribe-email-${source}`} className="sr-only">
          Email address
        </label>
        <input
          id={`subscribe-email-${source}`}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="w-full flex-1 rounded-full border border-outline-variant bg-surface px-4 py-2.5 font-body text-sm text-on-surface outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={state === 'submitting'}
          className="rounded-full bg-primary px-6 py-2.5 font-label text-sm font-semibold text-on-primary disabled:opacity-60"
        >
          {state === 'submitting' ? 'Subscribing…' : 'Subscribe'}
        </button>
      </form>
      {state === 'error' && message ? (
        <p className="mt-2 font-label text-sm text-error">{message}</p>
      ) : null}
    </div>
  )
}

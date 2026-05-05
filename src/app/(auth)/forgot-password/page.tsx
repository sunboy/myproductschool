'use client'
import { useState } from 'react'
import Link from 'next/link'
import { TurnstileWidget, isTurnstileClientEnabled } from '@/components/auth/TurnstileWidget'
import { passwordResetRequestSchema, zodFieldErrors } from '@/lib/auth/validation'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<'email', string>>>({})
  const [turnstileToken, setTurnstileToken] = useState('')
  const [turnstileResetSignal, setTurnstileResetSignal] = useState(0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setFieldErrors({})

    const validation = passwordResetRequestSchema.safeParse({ email })
    if (!validation.success) {
      setFieldErrors(zodFieldErrors<'email'>(validation.error))
      setLoading(false)
      return
    }

    if (isTurnstileClientEnabled() && !turnstileToken) {
      setError('Complete the security check.')
      setLoading(false)
      return
    }

    const response = await fetch('/api/auth/password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: validation.data.email,
        turnstileToken,
        redirectTo: `${window.location.origin}/reset-password`,
      }),
    })
    const data = await response.json().catch(() => ({})) as { error?: string; retryAfter?: number }

    if (!response.ok) {
      const message = data.error === 'rate_limited'
        ? 'Too many attempts. Try again in a minute.'
        : data.error ?? 'Something went wrong. Try again.'
      setError(message)
      setTurnstileToken('')
      setTurnstileResetSignal(value => value + 1)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="font-headline text-2xl font-bold text-on-surface">Reset password</h1>
          <p className="text-on-surface-variant text-sm mt-1">We&apos;ll send you a link to reset it</p>
        </div>
        {sent ? (
          <div className="p-4 bg-primary-container rounded-xl text-on-primary-container text-sm text-center">
            Check your email for the reset link.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={e => {
                setEmail(e.target.value)
                setFieldErrors({})
              }}
              required
              placeholder="you@company.com"
              className="w-full px-4 py-3 bg-surface-container border border-outline-variant rounded-xl text-on-surface focus:outline-none focus:border-primary transition-colors"
            />
            {fieldErrors.email && <p className="text-sm text-error">{fieldErrors.email}</p>}
            <TurnstileWidget
              onToken={setTurnstileToken}
              resetSignal={turnstileResetSignal}
            />
            {error && <p className="text-sm text-error">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-on-primary font-medium rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
        )}
        <p className="text-center text-sm">
          <Link href="/login" className="text-primary hover:underline">Back to sign in</Link>
        </p>
      </div>
    </div>
  )
}

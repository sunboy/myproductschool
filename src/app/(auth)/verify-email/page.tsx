'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { authRedirectFromParams } from '@/lib/auth/redirect'
import { HatchImage } from '@/components/redesign/HatchImage'

type VerifyEmailPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const params = use(searchParams)
  const email = firstParam(params.email)?.trim() ?? ''
  const destination = authRedirectFromParams(params) ?? '/dashboard'
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleResend() {
    if (!email) {
      setError('Enter your email again from the sign-up page.')
      return
    }

    setLoading(true)
    setMessage(null)
    setError(null)

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(destination)}`,
        }),
      })
      const data = await response.json().catch(() => ({})) as { error?: string }

      if (!response.ok) {
        setError(data.error === 'rate_limited'
          ? 'Too many attempts. Try again in a minute.'
          : data.error ?? 'Could not resend the email. Try again.'
        )
      } else {
        setMessage('Verification email sent.')
      }

    } catch {
      setError('Could not resend the email. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-outline-variant bg-surface p-6 text-center shadow-sm">
        <div className="flex justify-center">
          <HatchImage size={40} state="speaking" />
        </div>

        <div className="space-y-2">
          <h1 className="font-headline text-2xl font-bold text-on-surface">Verify your email</h1>
          <p className="text-sm text-on-surface-variant">
            {email ? <>We sent a link to <span className="font-medium text-on-surface">{email}</span>.</> : 'We sent a verification link.'}
          </p>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleResend}
            disabled={loading || !email}
            className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-on-primary transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Resend verification email'}
          </button>
          {message && <p className="text-sm text-primary">{message}</p>}
          {error && <p className="text-sm text-error">{error}</p>}
        </div>

        <p className="text-sm text-on-surface-variant">
          Already verified?{' '}
          <Link href={`/login?returnTo=${encodeURIComponent(destination)}`} className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}

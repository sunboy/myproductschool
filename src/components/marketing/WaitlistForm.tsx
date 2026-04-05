'use client'

import { useState } from 'react'

const inputClass =
  'w-full rounded-xl border border-outline-variant bg-surface px-4 py-3 text-on-surface text-sm font-medium placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary'

const submitButtonClass =
  'relative w-full bg-primary text-on-primary text-3xl font-black px-12 py-6 rounded-full uppercase tracking-tighter transition-all hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed disabled:opacity-90 shadow-[0_4px_0_0_var(--color-primary)] active:translate-y-1 active:shadow-none'

const successPanelClass =
  'relative w-full rounded-full bg-primary px-12 py-6 text-center text-xl font-black text-on-primary sm:text-2xl shadow-[0_4px_0_0_var(--color-primary)]'

export function WaitlistForm() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim()
      const body: { name?: string; email: string; company?: string } = {
        email: email.trim(),
      }
      if (fullName) body.name = fullName
      if (company.trim()) body.company = company.trim()

      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Something went wrong')
      }
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="w-full max-w-md">
        <p className={successPanelClass} role="status">
          You&apos;re in. We&apos;ll be live soon!
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:gap-4">
        <input
          type="text"
          value={firstName}
          onChange={e => setFirstName(e.target.value)}
          placeholder="First name"
          required
          aria-label="First name"
          autoComplete="given-name"
          className={`flex-1 ${inputClass}`}
        />
        <input
          type="text"
          value={lastName}
          onChange={e => setLastName(e.target.value)}
          placeholder="Last name"
          required
          aria-label="Last name"
          autoComplete="family-name"
          className={`flex-1 ${inputClass}`}
        />
      </div>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Email address"
        required
        aria-label="Email address"
        autoComplete="email"
        className={inputClass}
      />
      <input
        type="text"
        value={company}
        onChange={e => setCompany(e.target.value)}
        placeholder="Current company"
        aria-label="Current company"
        autoComplete="organization"
        className={inputClass}
      />
      {error && (
        <p className="text-sm font-medium text-error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" disabled={loading} className={submitButtonClass}>
        {loading ? 'Joining...' : 'Join the Waitlist'}
      </button>
    </form>
  )
}

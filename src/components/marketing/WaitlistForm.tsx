'use client'

import { useState } from 'react'

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
      const body: { name?: string; email: string; company?: string } = { email }
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
      <div className="flex items-center gap-2 py-3">
        <span
          className="material-symbols-outlined text-primary text-xl"
          style={{ fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 20" }}
        >
          check_circle
        </span>
        <span className="font-label font-semibold text-sm text-primary">
          You&apos;re on the list! We&apos;ll be in touch soon.
        </span>
      </div>
    )
  }

  const inputClass = "px-4 py-3 rounded-lg bg-surface-container-low border border-outline-variant text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-body text-sm"

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2.5 max-w-lg">
      <div className="flex flex-col sm:flex-row gap-2.5">
        <input
          type="text"
          value={firstName}
          onChange={e => setFirstName(e.target.value)}
          placeholder="First name"
          required
          className={`flex-1 ${inputClass}`}
        />
        <input
          type="text"
          value={lastName}
          onChange={e => setLastName(e.target.value)}
          placeholder="Last name"
          required
          className={`flex-1 ${inputClass}`}
        />
      </div>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="you@email.com"
        required
        className={`w-full ${inputClass}`}
      />
      <div className="flex flex-col sm:flex-row gap-2.5">
        <input
          type="text"
          value={company}
          onChange={e => setCompany(e.target.value)}
          placeholder="Company (optional)"
          className={`sm:flex-1 ${inputClass}`}
        />
        <button
          type="submit"
          disabled={loading}
          className="sm:flex-1 bg-primary text-on-primary font-label font-bold text-sm px-6 py-3 rounded-full hover:bg-primary/90 hover:shadow-sm transition-all duration-200 flex items-center justify-center gap-1.5 whitespace-nowrap disabled:opacity-50"
        >
          {loading ? 'Joining...' : 'Join Waitlist'}
          {!loading && (
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          )}
        </button>
      </div>
      {error && <p className="text-xs font-label text-error">{error}</p>}
    </form>
  )
}

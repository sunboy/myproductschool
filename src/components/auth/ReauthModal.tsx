'use client'

import { useEffect, useState } from 'react'

interface ReauthModalProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  onCancel: () => void
  onVerified: (password: string) => Promise<void> | void
}

export function ReauthModal({
  open,
  title,
  description,
  confirmLabel = 'Continue',
  onCancel,
  onVerified,
}: ReauthModalProps) {
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setPassword('')
      setVisible(false)
      setLoading(false)
      setError(null)
    }
  }, [open])

  if (!open) return null

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/reauthenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json().catch(() => ({})) as { error?: string }
      if (!res.ok) {
        throw new Error(data.error === 'rate_limited'
          ? 'Too many attempts. Try again in a few minutes.'
          : data.error ?? 'Could not verify your password.')
      }

      await onVerified(password)
      onCancel()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not verify your password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[420px] rounded-[22px] border border-outline-variant/50 bg-background p-5 shadow-[0_24px_70px_rgba(20,18,14,0.28)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reauth-title"
      >
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-fixed text-[20px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
            shield_lock
          </span>
          <div>
            <h2 id="reauth-title" className="font-headline text-xl font-bold leading-tight text-on-surface">
              {title}
            </h2>
            <p className="mt-1 text-sm font-body leading-relaxed text-on-surface-variant">
              {description}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-1.5">
          <label htmlFor="reauth-password" className="block text-xs font-label font-bold text-on-surface-variant">
            Current password
          </label>
          <div className="relative">
            <input
              id="reauth-password"
              autoFocus
              type={visible ? 'text' : 'password'}
              value={password}
              onChange={e => {
                setPassword(e.target.value)
                setError(null)
              }}
              className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-3 pr-10 text-sm font-body text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setVisible(value => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors hover:text-on-surface"
              aria-label={visible ? 'Hide current password' : 'Show current password'}
            >
              <span className="material-symbols-outlined text-[18px]">
                {visible ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
        </div>

        {error && (
          <p className="mt-3 rounded-xl bg-error/10 px-3 py-2 text-sm font-body text-error">{error}</p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-2xl border border-outline-variant/70 px-4 py-2.5 text-sm font-label font-bold text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !password}
            className="rounded-2xl bg-primary px-4 py-2.5 text-sm font-label font-bold text-on-primary transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Verifying' : confirmLabel}
          </button>
        </div>
      </form>
    </div>
  )
}

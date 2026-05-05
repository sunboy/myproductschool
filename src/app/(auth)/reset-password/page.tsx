'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import { newPasswordSchema, zodFieldErrors } from '@/lib/auth/validation'

type Status = 'loading' | 'ready' | 'invalid' | 'success'

export default function ResetPasswordPage() {
  const [status, setStatus] = useState<Status>('loading')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<'password' | 'confirm', string>>>({})
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const hash = window.location.hash.slice(1)
    const params = new URLSearchParams(hash)
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    const type = params.get('type')

    if (!accessToken || !refreshToken || type !== 'recovery') {
      setStatus('invalid')
      return
    }

    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (error) {
          setStatus('invalid')
        } else {
          // Clear the hash so a refresh doesn't re-exchange a used token
          window.history.replaceState(null, '', window.location.pathname)
          setStatus('ready')
        }
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    const validation = newPasswordSchema.safeParse({ password, confirm })
    if (!validation.success) {
      setFieldErrors(zodFieldErrors<'password' | 'confirm'>(validation.error))
      return
    }

    setSubmitting(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setSubmitting(false)
    } else {
      router.push('/dashboard')
    }
  }

  const inputClass = [
    'w-full px-4 py-2.5 text-sm rounded-xl transition-all duration-200',
    'bg-white/[0.08] border border-white/20 text-white',
    'placeholder:text-white/40',
    'focus:outline-none focus:border-white/50 focus:bg-white/[0.12]',
  ].join(' ')

  return (
    <div
      className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden"
      style={{
        background: 'linear-gradient(118deg, #07100c 0%, #0c1610 25%, #163324 48%, #1e4a31 60%, #29623f 70%, #3d7a52 80%, #5a9468 90%, #7ab088 100%)',
      }}
    >
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.035'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
          mixBlendMode: 'overlay',
          zIndex: 0,
        }}
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-sm px-6 py-10">
        {/* Brand mark */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <HatchGlyph size={28} state="idle" className="text-primary" />
          <span className="font-headline font-bold text-white" style={{ fontSize: 17, letterSpacing: '-0.01em' }}>
            HackProduct
          </span>
        </div>

        <div
          className="w-full rounded-2xl p-8 space-y-5"
          style={{
            background: 'rgba(8,18,12,0.72)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow: '0 16px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-3 py-6">
              <span className="material-symbols-outlined animate-spin text-[32px]" style={{ color: 'rgba(142,207,158,0.7)' }}>progress_activity</span>
              <p className="text-sm font-body" style={{ color: 'rgba(255,255,255,0.5)' }}>Verifying your link…</p>
            </div>
          )}

          {status === 'invalid' && (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3 py-2 text-center">
                <span className="material-symbols-outlined text-[36px]" style={{ color: 'rgba(248,113,113,0.8)' }}>link_off</span>
                <p className="font-headline font-bold text-white text-base">Link expired or invalid</p>
                <p className="text-sm font-body leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  This password reset link has already been used or has expired. Request a new one.
                </p>
              </div>
              <Link
                href="/login"
                className="block w-full text-center rounded-full py-2.5 font-semibold font-label text-sm transition-all duration-200 active:scale-[0.98]"
                style={{ background: '#4a7c59', color: '#ffffff' }}
              >
                Back to log in
              </Link>
            </div>
          )}

          {status === 'ready' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <p className="font-headline font-bold text-white text-base mb-1">Choose a new password</p>
                <p className="text-xs font-body" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  Use at least 10 characters with a number or symbol.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold font-label" style={{ color: 'rgba(255,255,255,0.75)' }}>New password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value)
                      setFieldErrors(prev => ({ ...prev, password: undefined }))
                    }}
                    required
                    minLength={10}
                    className={`${inputClass} pr-11`}
                    placeholder="10+ characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(value => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 transition-colors hover:text-white/80"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {fieldErrors.password && <p className="text-xs text-error">{fieldErrors.password}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold font-label" style={{ color: 'rgba(255,255,255,0.75)' }}>Confirm password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => {
                      setConfirm(e.target.value)
                      setFieldErrors(prev => ({ ...prev, confirm: undefined }))
                    }}
                    required
                    minLength={10}
                    className={`${inputClass} pr-11`}
                    placeholder="Same password again"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(value => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 transition-colors hover:text-white/80"
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showConfirm ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {fieldErrors.confirm && <p className="text-xs text-error">{fieldErrors.confirm}</p>}
              </div>

              {error && <p className="text-xs leading-relaxed" style={{ color: '#f87171' }}>{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full py-2.5 font-semibold font-label text-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
                style={{ background: '#4a7c59', color: '#ffffff' }}
              >
                {submitting ? 'Updating…' : 'Set new password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

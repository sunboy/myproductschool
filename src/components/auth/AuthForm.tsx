'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import { TurnstileWidget, isTurnstileClientEnabled } from '@/components/auth/TurnstileWidget'
import { useHatchSonics } from '@/hooks/useHatchSonics'
import { loginSchema, passwordResetRequestSchema, signupSchema, zodFieldErrors } from '@/lib/auth/validation'

interface AuthFormProps {
  mode: 'login' | 'signup'
}

type AuthMode = 'login' | 'signup' | 'forgot' | 'magic'

const AUTH_DISCIPLINES = [
  { label: 'Coding', icon: 'data_object', color: '#7aa7ff', copy: 'DSA with live execution' },
  { label: 'SQL', icon: 'database', color: '#c89df5', copy: 'Queries against real datasets' },
  { label: 'Product sense', icon: 'psychology', color: '#8ecf9e', copy: 'Decision reps with Hatch' },
  { label: 'Data modeling', icon: 'account_tree', color: '#f0c36a', copy: 'Schemas, grain, contracts' },
  { label: 'System design', icon: 'hub', color: '#f5a76c', copy: 'Scale and tradeoffs' },
] as const

// Hatch mascot as giant outline-only line art — no fills, strokes only
function HatchLineArt() {
  // viewBox="0 0 64 72", scaled ~10.5x, centered in left half
  const s = 10.5
  const ox = 82
  const oy = 58
  const sp = (x: number, y: number) => ({ x: x * s + ox, y: y * s + oy })
  const sc = (x: number, y: number) => `${x * s + ox},${y * s + oy}`

  const headTL = sp(14, 22)
  const earL = sp(8, 32), earR = sp(50, 32)
  const capRect = sp(22, 10)
  const eyeL = sp(25, 36), eyeR = sp(39, 36)
  const mouthL = sp(27, 44), mouthR = sp(37, 44)
  const arrL1 = sp(48, 18), arrL2 = sp(54, 10)
  const capPoly = [sc(18, 22), sc(46, 22), sc(50, 16), sc(14, 16)].join(' ')
  const arrPoly = [sc(50, 10), sc(54, 10), sc(54, 14)].join(' ')

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none select-none"
      viewBox="0 0 800 900"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
    >
      {/* Ear nubs */}
      <rect x={earL.x} y={earL.y} width={6 * s} height={10 * s} rx={3 * s} fill="none" stroke="rgba(142,207,158,0.09)" strokeWidth="2.5" />
      <rect x={earR.x} y={earR.y} width={6 * s} height={10 * s} rx={3 * s} fill="none" stroke="rgba(142,207,158,0.09)" strokeWidth="2.5" />
      {/* Head */}
      <rect x={headTL.x} y={headTL.y} width={36 * s} height={30 * s} rx={8 * s} fill="none" stroke="rgba(142,207,158,0.13)" strokeWidth="3" />
      {/* Eyes */}
      <circle cx={eyeL.x} cy={eyeL.y} r={3 * s} fill="none" stroke="rgba(142,207,158,0.08)" strokeWidth="2.5" />
      <circle cx={eyeR.x} cy={eyeR.y} r={3 * s} fill="none" stroke="rgba(142,207,158,0.08)" strokeWidth="2.5" />
      {/* Mouth */}
      <line x1={mouthL.x} y1={mouthL.y} x2={mouthR.x} y2={mouthR.y} stroke="rgba(142,207,158,0.07)" strokeWidth="2.5" strokeLinecap="round" />
      {/* Cap brim */}
      <polygon points={capPoly} fill="none" stroke="rgba(142,207,158,0.11)" strokeWidth="2.5" strokeLinejoin="round" />
      {/* Cap top */}
      <rect x={capRect.x} y={capRect.y} width={20 * s} height={12 * s} rx={s} fill="none" stroke="rgba(142,207,158,0.11)" strokeWidth="2.5" />
      {/* Growth arrow */}
      <line x1={arrL1.x} y1={arrL1.y} x2={arrL2.x} y2={arrL2.y} stroke="rgba(142,207,158,0.14)" strokeWidth="3" strokeLinecap="round" />
      <polyline points={arrPoly} fill="none" stroke="rgba(142,207,158,0.14)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

      {/* Ambient wobbly lines */}
      <path d="M -40 80 C 120 60, 200 200, 300 260 C 420 330, 340 480, 460 560 C 580 640, 720 620, 840 700"
        stroke="rgba(142,207,158,0.06)" strokeWidth="1.5" fill="none" strokeLinecap="round"
        style={{ strokeDasharray: 1800, strokeDashoffset: 1800, animationName: 'hatchDrawA', animationDuration: '70s', animationTimingFunction: 'linear', animationIterationCount: 'infinite' }} />
      <path d="M -60 600 C 80 570, 160 630, 260 600 C 360 570, 400 640, 500 610 C 600 580, 680 630, 760 605"
        stroke="rgba(142,207,158,0.05)" strokeWidth="1" fill="none" strokeLinecap="round"
        style={{ strokeDasharray: 1200, strokeDashoffset: 1200, animationName: 'hatchDrawB', animationDuration: '90s', animationTimingFunction: 'linear', animationIterationCount: 'infinite', animationDelay: '-20s' }} />

      <style>{`
        @keyframes hatchDrawA {
          0%   { stroke-dashoffset: 1800; opacity: 0; }
          5%   { opacity: 1; }
          90%  { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 0; }
        }
        @keyframes hatchDrawB {
          0%   { stroke-dashoffset: 1200; opacity: 0; }
          5%   { opacity: 1; }
          90%  { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 0; }
        }
      `}</style>
    </svg>
  )
}

function DisciplineSignalBoard() {
  return (
    <div className="hidden md:grid max-w-[520px] grid-cols-5 gap-2 pt-7">
      {AUTH_DISCIPLINES.map((discipline) => (
        <div
          key={discipline.label}
          className="relative min-h-[96px] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.075] p-3"
        >
          <div
            aria-hidden
            className="absolute -right-4 -top-5 h-14 w-14 rounded-full"
            style={{ background: discipline.color, opacity: 0.13 }}
          />
          <span
            className="material-symbols-outlined relative text-[20px]"
            style={{ color: discipline.color, fontVariationSettings: "'FILL' 1" }}
          >
            {discipline.icon}
          </span>
          <div className="relative mt-3 font-label text-[11px] font-black leading-tight text-white">
            {discipline.label}
          </div>
          <div className="relative mt-1 text-[9.5px] font-semibold leading-tight text-white/45">
            {discipline.copy}
          </div>
        </div>
      ))}
    </div>
  )
}

export function AuthForm({ mode: initialMode }: AuthFormProps) {
  const [activeMode, setActiveMode] = useState<AuthMode>(initialMode)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [turnstileResetSignal, setTurnstileResetSignal] = useState(0)
  const [website, setWebsite] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<'name' | 'email' | 'password', string>>>({})
  const router = useRouter()
  const supabase = createClient()
  const { play } = useHatchSonics()

  function siteOrigin() {
    return process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin
  }

  async function postAuthAction<T>(path: string, payload: Record<string, unknown>): Promise<T> {
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await response.json().catch(() => ({})) as { error?: string; retryAfter?: number }

    if (!response.ok) {
      if (data.error === 'rate_limited') {
        throw new Error('Too many attempts. Try again in a minute.')
      }
      throw new Error(data.error ?? 'Something went wrong. Try again.')
    }

    return data as T
  }

  function switchMode(mode: AuthMode) {
    if (mode !== activeMode) play('nudge')
    setActiveMode(mode)
    setError(null)
    setSuccess(null)
    setFieldErrors({})
    resetTurnstile()
  }

  function resetTurnstile() {
    setTurnstileToken('')
    setTurnstileResetSignal(value => value + 1)
  }

  function requireTurnstileToken() {
    if (!isTurnstileClientEnabled() || turnstileToken) return true
    setError('Complete the security check.')
    play('error')
    setLoading(false)
    return false
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    play('submit')
    setLoading(true)
    setError(null)
    setSuccess(null)
    setFieldErrors({})

    if (activeMode === 'forgot') {
      const validation = passwordResetRequestSchema.safeParse({ email })
      if (!validation.success) {
        setFieldErrors(zodFieldErrors<'email'>(validation.error))
        play('error')
        setLoading(false)
        return
      }
      if (!requireTurnstileToken()) return

      try {
        await postAuthAction('/api/auth/password-reset', {
          email: validation.data.email,
          turnstileToken,
          redirectTo: `${siteOrigin()}/reset-password`,
        })
        // Always show success after the server accepts the request.
        setSuccess('Check your email. We sent a password reset link.')
        play('success')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong. Try again.')
        resetTurnstile()
        play('error')
      } finally {
        setLoading(false)
      }
      return
    }

    if (activeMode === 'magic') {
      const validation = passwordResetRequestSchema.safeParse({ email })
      if (!validation.success) {
        setFieldErrors(zodFieldErrors<'email'>(validation.error))
        play('error')
        setLoading(false)
        return
      }
      if (!requireTurnstileToken()) return

      try {
        await postAuthAction('/api/auth/magic-link', {
          email: validation.data.email,
          turnstileToken,
          redirectTo: `${siteOrigin()}/auth/callback`,
        })
        play('success')
        router.push(`/magic-link-sent?email=${encodeURIComponent(validation.data.email)}`)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong. Try again.')
        resetTurnstile()
        play('error')
      } finally {
        setLoading(false)
      }
      return
    }

    if (activeMode === 'login') {
      const validation = loginSchema.safeParse({ email, password })
      if (!validation.success) {
        setFieldErrors(zodFieldErrors<'email' | 'password'>(validation.error))
        play('error')
        setLoading(false)
        return
      }

      try {
        const data = await postAuthAction<{ onboardingCompleted: boolean }>('/api/auth/login', validation.data)
        play('success')
        router.push(data.onboardingCompleted ? '/dashboard' : '/onboarding/welcome')
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong. Try again.')
        play('error')
      }
    } else {
      const validation = signupSchema.safeParse({ name, email, password })
      if (!validation.success) {
        setFieldErrors(zodFieldErrors<'name' | 'email' | 'password'>(validation.error))
        play('error')
        setLoading(false)
        return
      }
      if (!requireTurnstileToken()) return

      try {
        const data = await postAuthAction<{ hasSession: boolean }>('/api/auth/signup', {
          ...validation.data,
          turnstileToken,
          website,
          redirectTo: `${siteOrigin()}/dashboard`,
        })
        if (data.hasSession) {
          play('success')
          router.push('/onboarding/welcome')
          router.refresh()
        } else {
          resetTurnstile()
          play('success')
          router.push(`/verify-email?email=${encodeURIComponent(validation.data.email)}`)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong. Try again.')
        resetTurnstile()
        play('error')
      }
    }
    setLoading(false)
  }

  async function handleGoogleSignIn() {
    play('open')
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${siteOrigin()}/dashboard` }
    })
  }

  const inputClass = [
    'w-full px-4 py-2.5 text-sm rounded-xl transition-all duration-200',
    'bg-white/[0.08] border border-white/20 text-white',
    'placeholder:text-white/40',
    'focus:outline-none focus:border-white/50 focus:bg-white/[0.12]',
  ].join(' ')

  return (
    /*
     * ONE unified background — the gradient lives here, on a single element.
     * No separate panel backgrounds. The form card floats on top.
     * Mobile: stacks vertically with the same gradient top→bottom.
     */
    <div
      className="relative min-h-[100dvh] overflow-hidden"
      style={{
        background: 'linear-gradient(118deg, #07100c 0%, #0c1610 25%, #163324 48%, #1e4a31 60%, #29623f 70%, #3d7a52 80%, #5a9468 90%, #7ab088 100%)',
      }}
    >
      {/* Grain overlay — fixed so it doesn't repaint on scroll */}
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

      {/* Hatch line art — left half only */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        <HatchLineArt />
      </div>

      {/* Radial glow — top left */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-5%', left: '-5%', width: '55%', height: '65%',
          background: 'radial-gradient(ellipse, rgba(74,124,89,0.18) 0%, transparent 65%)',
          zIndex: 1,
        }}
        aria-hidden
      />

      {/* Content: left brand/headline + right form card — on desktop side by side */}
      <div className="relative min-h-[100dvh] flex flex-col md:flex-row md:items-center" style={{ zIndex: 2 }}>

        {/* ── Left: brand + headline ───────────────────── */}
        <div className="flex flex-col justify-center px-10 py-12 md:px-16 md:py-0 md:flex-1">
          {/* Brand mark */}
          <div className="flex items-center gap-2 mb-10 md:mb-12">
            <HatchGlyph size={30} state="idle" className="text-primary" />
            <span
              className="font-headline font-bold text-white"
              style={{ fontSize: 19, letterSpacing: '-0.01em' }}
            >
              HackProduct
            </span>
          </div>

          {/* Headline */}
          <h1
            className="font-headline font-extrabold text-white"
            style={{
              fontSize: 'clamp(32px, 4.5vw, 68px)',
              lineHeight: 1.04,
              letterSpacing: '-0.03em',
              maxWidth: '11ch',
            } as React.CSSProperties}
          >
            Build with judgment.
          </h1>
          <p
            className="font-body mt-4 leading-relaxed"
            style={{ fontSize: 'clamp(13px, 1.2vw, 16px)', color: 'rgba(255,255,255,0.45)', maxWidth: '38ch' }}
          >
            Practice product, systems, data, SQL, and coding judgment. Stay sharp as AI reshapes the job.
          </p>

          {/* Feature bullets — desktop only */}
          <ul className="hidden md:flex flex-col gap-3 mt-10">
            {[
              'Product sense, system design, data modeling, SQL, and coding in one track',
              'Hatch coaches in real time and pushes back when you hand-wave',
              'Role-aware plans without human scheduling',
            ].map(item => (
              <li key={item} className="flex items-center gap-3">
                <span
                  className="material-symbols-outlined shrink-0"
                  style={{ fontSize: 16, color: '#8ecf9e', fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
                <span className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>{item}</span>
              </li>
            ))}
          </ul>

          <DisciplineSignalBoard />
        </div>

        {/* ── Right: form card — glass on the gradient ─── */}
        <div className="flex items-center justify-center px-6 py-10 md:py-0 md:px-12 md:w-[460px] md:shrink-0">
          <div
            className="w-full max-w-sm rounded-2xl p-8 space-y-5"
            style={{
              background: 'rgba(8,18,12,0.72)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              border: '1px solid rgba(255,255,255,0.10)',
              boxShadow: '0 16px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
          >
            {/* Tab switcher — hidden in single-email modes */}
            {activeMode !== 'forgot' && activeMode !== 'magic' && (
              <div className="flex gap-1 p-1 rounded-full w-fit" style={{ background: 'rgba(255,255,255,0.08)' }}>
                {(['signup', 'login'] as const).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => switchMode(m)}
                    className="px-5 py-1.5 rounded-full text-sm font-semibold font-label transition-all duration-200"
                    style={activeMode === m
                      ? { background: 'rgba(255,255,255,0.92)', color: '#0f1a14' }
                      : { color: 'rgba(255,255,255,0.65)' }
                    }
                  >
                    {m === 'signup' ? 'Sign Up' : 'Log In'}
                  </button>
                ))}
              </div>
            )}

            {/* Single-email modes */}
            {activeMode === 'forgot' || activeMode === 'magic' ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="flex items-center gap-1 text-xs font-label mb-4 transition-colors"
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                  >
                    <span className="material-symbols-outlined text-[14px]">arrow_back</span>
                    Back to log in
                  </button>
                  <p className="font-headline font-bold text-white text-base mb-1">
                    {activeMode === 'forgot' ? 'Reset your password' : 'Email magic link'}
                  </p>
                  <p className="text-xs font-body" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {activeMode === 'forgot'
                      ? 'Enter your email and we\'ll send a reset link.'
                      : 'Enter your email and we\'ll send a one-time sign-in link.'}
                  </p>
                </div>

                {success ? (
                  <div className="rounded-xl px-4 py-3 text-xs font-body leading-relaxed" style={{ background: 'rgba(142,207,158,0.15)', color: '#86efac', border: '1px solid rgba(142,207,158,0.2)' }}>
                    {success}
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold font-label" style={{ color: 'rgba(255,255,255,0.75)' }}>Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={e => {
                          setEmail(e.target.value)
                          setFieldErrors(prev => ({ ...prev, email: undefined }))
                        }}
                        required
                        className={inputClass}
                        placeholder="you@company.com"
                      />
                      {fieldErrors.email && <p className="text-xs text-error">{fieldErrors.email}</p>}
                    </div>
                    <TurnstileWidget
                      onToken={setTurnstileToken}
                      resetSignal={turnstileResetSignal}
                      className="pt-1"
                      theme="dark"
                    />
                    {error && <p className="text-xs leading-relaxed" style={{ color: '#f87171' }}>{error}</p>}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-full py-2.5 font-semibold font-label text-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
                      style={{ background: '#4a7c59', color: '#ffffff' }}
                    >
                      {loading ? 'Sending...' : activeMode === 'forgot' ? 'Send reset link' : 'Send magic link'}
                    </button>
                  </>
                )}
              </form>
            ) : (
              <>
                {/* Google OAuth */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full flex items-center justify-center gap-2.5 rounded-full py-2.5 text-sm font-medium font-label transition-all duration-200 active:scale-[0.98]"
                  style={{
                    background: 'rgba(255,255,255,0.10)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: 'rgba(255,255,255,0.9)',
                  }}
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.12)' }} />
                  <span className="text-xs font-label" style={{ color: 'rgba(255,255,255,0.45)' }}>or</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.12)' }} />
                </div>

                {/* Email form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {activeMode === 'signup' && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold font-label" style={{ color: 'rgba(255,255,255,0.75)' }}>Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={e => {
                          setName(e.target.value)
                          setFieldErrors(prev => ({ ...prev, name: undefined }))
                        }}
                        required
                        className={inputClass}
                        placeholder="Your name"
                      />
                      {fieldErrors.name && <p className="text-xs text-error">{fieldErrors.name}</p>}
                      <input
                        name="website"
                        hidden
                        tabIndex={-1}
                        autoComplete="off"
                        value={website}
                        onChange={e => setWebsite(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold font-label" style={{ color: 'rgba(255,255,255,0.75)' }}>Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => {
                        setEmail(e.target.value)
                        setFieldErrors(prev => ({ ...prev, email: undefined }))
                      }}
                      required
                      className={inputClass}
                      placeholder="you@company.com"
                    />
                    {fieldErrors.email && <p className="text-xs text-error">{fieldErrors.email}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold font-label" style={{ color: 'rgba(255,255,255,0.75)' }}>Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => {
                          setPassword(e.target.value)
                          setFieldErrors(prev => ({ ...prev, password: undefined }))
                        }}
                        required
                        minLength={activeMode === 'signup' ? 10 : 1}
                        className={`${inputClass} pr-11`}
                        placeholder={activeMode === 'signup' ? '10+ characters' : 'Password'}
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
                    {activeMode === 'login' && (
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => switchMode('magic')}
                          className="text-xs font-label transition-colors hover:opacity-80"
                          style={{ color: 'rgba(255,255,255,0.55)' }}
                        >
                          Email me a magic link instead
                        </button>
                        <button
                          type="button"
                          onClick={() => switchMode('forgot')}
                          className="text-xs font-label transition-colors hover:opacity-80"
                          style={{ color: 'rgba(255,255,255,0.55)' }}
                        >
                          Forgot password?
                        </button>
                      </div>
                    )}
                  </div>

                  {activeMode === 'signup' && (
                    <TurnstileWidget
                      onToken={setTurnstileToken}
                      resetSignal={turnstileResetSignal}
                      className="pt-1"
                      theme="dark"
                    />
                  )}

                  {error && <p className="text-xs leading-relaxed" style={{ color: '#f87171' }}>{error}</p>}
                  {success && <p className="text-xs leading-relaxed" style={{ color: '#86efac' }}>{success}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-full py-2.5 font-semibold font-label text-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
                    style={{ background: '#4a7c59', color: '#ffffff' }}
                  >
                    {loading ? 'Just a moment...' : activeMode === 'login' ? 'Log In' : 'Create Account'}
                  </button>

                  {activeMode === 'signup' && (
                    <p className="text-xs text-center font-label" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      You&apos;ll meet Hatch right after.
                    </p>
                  )}
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

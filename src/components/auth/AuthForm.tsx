'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { HatchGlyph } from '@/components/shell/HatchGlyph'

interface AuthFormProps {
  mode: 'login' | 'signup'
}

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

export function AuthForm({ mode: initialMode }: AuthFormProps) {
  const [activeMode, setActiveMode] = useState<'login' | 'signup' | 'forgot'>(initialMode)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  function siteOrigin() {
    return process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin
  }

  function switchMode(mode: 'login' | 'signup' | 'forgot') {
    setActiveMode(mode)
    setError(null)
    setSuccess(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (activeMode === 'forgot') {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteOrigin()}/reset-password`,
      })
      // Always show success (don't reveal whether email exists)
      setSuccess('Check your email — we sent a password reset link.')
      setLoading(false)
      return
    }

    if (activeMode === 'login') {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed_at, display_name')
          .eq('id', data.user.id)
          .single()
        const meta = data.user.user_metadata
        const metaName = meta?.display_name ?? meta?.full_name ?? meta?.name ?? null
        if (!profile?.display_name && metaName) {
          await fetch('/api/profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ display_name: metaName }),
          })
        }
        router.push(profile?.onboarding_completed_at ? '/dashboard' : '/onboarding/welcome')
        router.refresh()
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: name },
          emailRedirectTo: `${siteOrigin()}/dashboard`,
        }
      })
      if (error) {
        setError(error.message)
      } else if (data.session) {
        router.push('/onboarding/welcome')
        router.refresh()
      } else {
        setSuccess('Check your email to confirm your account. You\'ll start with Hatch next.')
      }
    }
    setLoading(false)
  }

  async function handleGoogleSignIn() {
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
            Think like a product person.
          </h1>
          <p
            className="font-body mt-4 leading-relaxed"
            style={{ fontSize: 'clamp(13px, 1.2vw, 16px)', color: 'rgba(255,255,255,0.45)', maxWidth: '38ch' }}
          >
            Build the thinking. Ship the confidence.
          </p>

          {/* Feature bullets — desktop only */}
          <ul className="hidden md:flex flex-col gap-3 mt-10">
            {[
              'Scenario-based interview practice',
              'Real-time coaching from Hatch',
              'Daily product thinking drills',
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
            {/* Tab switcher — hidden in forgot mode */}
            {activeMode !== 'forgot' && (
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

            {/* Forgot password mode */}
            {activeMode === 'forgot' ? (
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
                  <p className="font-headline font-bold text-white text-base mb-1">Reset your password</p>
                  <p className="text-xs font-body" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    Enter your email and we&apos;ll send a reset link.
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
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className={inputClass} placeholder="you@company.com" />
                    </div>
                    {error && <p className="text-xs leading-relaxed" style={{ color: '#f87171' }}>{error}</p>}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-full py-2.5 font-semibold font-label text-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
                      style={{ background: '#4a7c59', color: '#ffffff' }}
                    >
                      {loading ? 'Sending...' : 'Send reset link'}
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
                      <input type="text" value={name} onChange={e => setName(e.target.value)} required className={inputClass} placeholder="Your name" />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold font-label" style={{ color: 'rgba(255,255,255,0.75)' }}>Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className={inputClass} placeholder="you@company.com" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold font-label" style={{ color: 'rgba(255,255,255,0.75)' }}>Password</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} className={inputClass} placeholder="8+ characters" />
                    {activeMode === 'login' && (
                      <div className="text-right">
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

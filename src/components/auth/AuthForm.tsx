'use client'

import { LearningGeometry } from '@/components/redesign/LearningGeometry'
import { HackProductWordmark } from '@/components/brand/HackProductBrand'
import { TurnstileWidget } from '@/components/auth/TurnstileWidget'
import { useAuthForm } from '@/hooks/useAuthForm'

interface AuthFormProps {
  mode: 'login' | 'signup'
  redirectTo?: string
  /** Archetype slug carried from the public /quiz/archetype CTA, claimed onto the new profile. */
  archetype?: string
}

export function AuthForm({ mode: initialMode, redirectTo, archetype }: AuthFormProps) {
  const {
    activeMode,
    switchMode,
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    honeypotProps,
    setTurnstileToken,
    turnstileResetSignal,
    loading,
    error,
    success,
    fieldErrors,
    setFieldErrors,
    handleSubmit,
    handleGoogleSignIn,
  } = useAuthForm({ mode: initialMode, redirectTo, archetype })
  const inputClass = [
    'w-full min-h-11 px-4 py-2.5 text-base rounded-xl transition-all duration-200',
    'bg-white/[0.08] border border-white/20 text-white',
    'placeholder:text-white/40',
    'focus:outline-none focus:border-white/50 focus:bg-white/[0.12]',
  ].join(' ')

  return (
    /*
     * ONE unified background - the gradient lives here, on a single element.
     * No separate panel backgrounds. The form card floats on top.
     * Mobile: stacks vertically with the same gradient top to bottom.
     */
    <div
      className="learning-auth relative min-h-[100svh] overflow-x-hidden"
      style={{
        background: '#f8f5ef',
      }}
    >
      {/* Content: left brand/headline + right form card — on desktop side by side */}
      <div className="relative flex min-h-[100svh] flex-col md:min-h-[100dvh] md:flex-row md:items-center" style={{ zIndex: 2 }}>

        {/* ── Left: brand + headline ───────────────────── */}
        <div className="learning-auth-story relative isolate flex flex-col justify-center px-5 pb-5 pt-6 sm:px-8 sm:pt-8 md:flex-1 md:px-12 md:py-0 lg:px-16">
          <LearningGeometry />
          {/* Brand mark */}
          <div className="mb-6 flex items-center md:mb-10 lg:mb-12">
            <HackProductWordmark
              className="h-10 w-[190px] rounded-md bg-[#fffdf7]/95 object-cover shadow-[0_10px_30px_rgba(0,0,0,0.18)]"
              priority
            />
          </div>

          {/* Headline */}
          <h1
            className="relative font-headline text-[34px] font-medium leading-[1.2] text-forest-950 sm:text-[44px] lg:text-[56px]"
            style={{
              letterSpacing: 0,
              maxWidth: '11ch',
            } as React.CSSProperties}
          >
            Keep growing. Build with confidence.
          </h1>
          <p
            className="relative font-body mt-4 max-w-[38ch] text-base leading-relaxed text-ink-secondary"
          >
            Learn through real challenges, thoughtful reading, and feedback that helps you take the next step.
          </p>

          {/* Feature bullets — desktop only */}
          <ul className="mt-8 hidden flex-col gap-3 min-[1200px]:flex">
            {[
              'Start with the practice Hatch thinks matters today',
              'Move from autopsy reading to hands-on practice',
              'Drive a live AI analyst on real data when you are ready',
            ].map(item => (
              <li key={item} className="flex items-center gap-3">
                <span
                  className="material-symbols-outlined shrink-0"
                  style={{ fontSize: 16, color: '#8ecf9e', fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
                <span className="relative font-body text-base text-ink-secondary">{item}</span>
              </li>
            ))}
          </ul>

        </div>

        {/* ── Right: form card — glass on the gradient ─── */}
        <div className="flex items-start justify-center px-4 pb-6 pt-2 sm:px-6 sm:pb-10 md:w-[460px] md:shrink-0 md:items-center md:px-10 md:py-8 lg:px-12">
          <div
            className="w-full max-w-sm space-y-4 rounded-2xl p-5 shadow-2xl sm:space-y-5 sm:p-7 md:p-8"
            style={{
              background: '#103e30',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              border: '1px solid rgba(255,255,255,0.10)',
              boxShadow: '0 20px 60px -32px rgba(16,62,48,0.35)',
            }}
          >
            {/* Tab switcher - hidden in single-email modes */}
            {activeMode !== 'forgot' && activeMode !== 'magic' && (
              <div className="flex gap-1 p-1 rounded-full w-fit" style={{ background: 'rgba(255,255,255,0.08)' }}>
                {(['signup', 'login'] as const).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => switchMode(m)}
                    className="min-h-11 px-5 py-1.5 rounded-full text-sm font-semibold font-label transition-all duration-200"
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
                      <label htmlFor="auth-recovery-email" className="block text-xs font-semibold font-label" style={{ color: 'rgba(255,255,255,0.75)' }}>Email</label>
                      <input
                        id="auth-recovery-email"
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
                      className="w-full min-h-11 rounded-full py-2.5 font-semibold font-label text-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
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
                  className="w-full min-h-11 flex items-center justify-center gap-2.5 rounded-full py-2.5 text-sm font-medium font-label transition-all duration-200 active:scale-[0.98]"
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
                      <label htmlFor="auth-name" className="block text-xs font-semibold font-label" style={{ color: 'rgba(255,255,255,0.75)' }}>Name</label>
                      <input
                        id="auth-name"
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
                      <input {...honeypotProps} />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label htmlFor="auth-email" className="block text-xs font-semibold font-label" style={{ color: 'rgba(255,255,255,0.75)' }}>Email</label>
                    <input
                      id="auth-email"
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
                    <label htmlFor="auth-password" className="block text-xs font-semibold font-label" style={{ color: 'rgba(255,255,255,0.75)' }}>Password</label>
                    <div className="relative">
                      <input
                        id="auth-password"
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
                        className="absolute right-2 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center text-white/50 transition-colors hover:text-white/80"
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
                    className="w-full min-h-11 rounded-full py-2.5 font-semibold font-label text-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
                    style={{ background: '#4a7c59', color: '#ffffff' }}
                  >
                    {loading ? 'Just a moment...' : activeMode === 'login' ? 'Log In' : 'Create Account'}
                  </button>

                  {activeMode === 'signup' && (
                    <p className="text-xs text-center font-label" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      You&apos;ll meet Hatch right after.
                    </p>
                  )}

                  {activeMode === 'signup' && (
                    <p className="text-xs text-center font-label leading-5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      By creating an account, you agree to our{' '}
                      <a href="/terms" className="underline" style={{ color: 'rgba(255,255,255,0.7)' }}>
                        Terms of Service
                      </a>{' '}
                      and{' '}
                      <a href="/privacy" className="underline" style={{ color: 'rgba(255,255,255,0.7)' }}>
                        Privacy Policy
                      </a>
                      .
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

'use client'

import Link from 'next/link'
import { TurnstileWidget } from '@/components/auth/TurnstileWidget'
import { useAuthForm } from '@/hooks/useAuthForm'

interface AuthCardProps {
  mode: 'login' | 'signup'
  redirectTo?: string
  /** Archetype slug carried from the public /quiz/archetype CTA, claimed onto the new profile. */
  archetype?: string
  compact?: boolean
  /** Turnstile widget theme — 'dark' on the dark-editorial concept, 'light' elsewhere. */
  turnstileTheme?: 'light' | 'dark'
}

/**
 * Shared, real auth card consumed by all 3 Editorial Evidence login concepts.
 * Matches the DOM shape and class names of the Codex mockup's AuthForm.tsx
 * (auth-card / auth-head / social-stack / social-button / or / password-field /
 * auth-options / login-button / signup-line) so each concept's globals.css
 * reskins it without any markup changes. Behavior is real: wired to the same
 * useAuthForm hook the production /login and /signup pages consume — no
 * onSubmit={(e) => e.preventDefault()} placeholders, no GitHub button (not a
 * real auth method in this app).
 */
export function AuthCard({ mode: initialMode, redirectTo, archetype, compact = false, turnstileTheme = 'light' }: AuthCardProps) {
  const {
    activeMode, switchMode,
    name, setName,
    email, setEmail,
    password, setPassword,
    showPassword, setShowPassword,
    honeypotProps,
    setTurnstileToken,
    turnstileResetSignal,
    loading,
    error,
    success,
    fieldErrors, setFieldErrors,
    handleSubmit,
    handleGoogleSignIn,
  } = useAuthForm({ mode: initialMode, redirectTo, archetype })

  const isSingleEmailMode = activeMode === 'forgot' || activeMode === 'magic'

  return (
    <section className={`auth-card ${compact ? 'auth-card-compact' : ''}`} aria-label={activeMode === 'signup' ? 'Sign up' : 'Log in'}>
      {isSingleEmailMode ? (
        <>
          <div className="auth-head">
            <button type="button" onClick={() => switchMode('login')} className="auth-back-link">
              ← Back to log in
            </button>
            <h1>{activeMode === 'forgot' ? 'Reset your password' : 'Email magic link'}</h1>
            <p>
              {activeMode === 'forgot'
                ? "Enter your email and we'll send a reset link."
                : "Enter your email and we'll send a one-time sign-in link."}
            </p>
          </div>

          {success ? (
            <div className="auth-success">{success}</div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label>
                Email
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value)
                    setFieldErrors(prev => ({ ...prev, email: undefined }))
                  }}
                  required
                />
                {fieldErrors.email && <span className="auth-field-error">{fieldErrors.email}</span>}
              </label>
              <TurnstileWidget onToken={setTurnstileToken} resetSignal={turnstileResetSignal} theme={turnstileTheme} />
              {error && <div className="auth-error">{error}</div>}
              <button className="login-button" type="submit" disabled={loading}>
                {loading ? 'Sending…' : activeMode === 'forgot' ? 'Send reset link' : 'Send magic link'}
              </button>
            </form>
          )}
        </>
      ) : (
        <>
          <div className="auth-head">
            <h1>{activeMode === 'signup' ? 'Create your account' : 'Welcome back'}</h1>
            <p>{activeMode === 'signup' ? 'Start practicing in under a minute.' : 'Log in to continue your interview practice.'}</p>
          </div>

          <div className="social-stack">
            <button className="social-button" type="button" aria-label="Continue with Google" onClick={handleGoogleSignIn}>
              <span className="google-g">G</span>Continue with Google
            </button>
          </div>

          <div className="or"><span />OR<span /></div>

          <form onSubmit={handleSubmit}>
            {activeMode === 'signup' && (
              <label>
                Name
                <input
                  type="text"
                  autoComplete="name"
                  placeholder="Your name"
                  value={name}
                  onChange={e => {
                    setName(e.target.value)
                    setFieldErrors(prev => ({ ...prev, name: undefined }))
                  }}
                  required
                />
                {fieldErrors.name && <span className="auth-field-error">{fieldErrors.name}</span>}
                <input {...honeypotProps} />
              </label>
            )}

            <label>
              Email
              <input
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={e => {
                  setEmail(e.target.value)
                  setFieldErrors(prev => ({ ...prev, email: undefined }))
                }}
                required
              />
              {fieldErrors.email && <span className="auth-field-error">{fieldErrors.email}</span>}
            </label>

            <label>
              Password
              <div className="password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={activeMode === 'signup' ? 'new-password' : 'current-password'}
                  placeholder={activeMode === 'signup' ? '10+ characters' : 'Enter your password'}
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value)
                    setFieldErrors(prev => ({ ...prev, password: undefined }))
                  }}
                  required
                  minLength={activeMode === 'signup' ? 10 : 1}
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {fieldErrors.password && <span className="auth-field-error">{fieldErrors.password}</span>}
            </label>

            {activeMode === 'login' && (
              <div className="auth-options">
                <button type="button" className="auth-link" onClick={() => switchMode('magic')}>
                  Email me a magic link instead
                </button>
                <button type="button" className="auth-link" onClick={() => switchMode('forgot')}>
                  Forgot password?
                </button>
              </div>
            )}

            {activeMode === 'signup' && <TurnstileWidget onToken={setTurnstileToken} resetSignal={turnstileResetSignal} theme={turnstileTheme} />}

            {error && <div className="auth-error">{error}</div>}

            <button className="login-button" type="submit" disabled={loading}>
              {loading ? 'Just a moment…' : activeMode === 'signup' ? 'Create Account' : 'Log in'}
            </button>

            {activeMode === 'signup' && (
              <p className="auth-legal">
                By creating an account, you agree to our{' '}
                <Link href="/terms">Terms of Service</Link> and <Link href="/privacy">Privacy Policy</Link>.
              </p>
            )}
          </form>

          <div className="signup-line">
            {activeMode === 'signup' ? (
              <>Already have an account? <button type="button" className="auth-link" onClick={() => switchMode('login')}>Log in</button></>
            ) : (
              <>Don&apos;t have an account? <button type="button" className="auth-link" onClick={() => switchMode('signup')}>Sign up</button></>
            )}
          </div>
        </>
      )}
    </section>
  )
}

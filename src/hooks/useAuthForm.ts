'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { isTurnstileClientEnabled } from '@/components/auth/TurnstileWidget'
import { useHatchSonics } from '@/hooks/useHatchSonics'
import { loginSchema, passwordResetRequestSchema, signupSchema, zodFieldErrors } from '@/lib/auth/validation'
import { consumeMagnetSource } from '@/lib/lead-magnets/utm'
import { safeAuthRedirect } from '@/lib/auth/redirect'

export interface UseAuthFormOptions {
  mode: 'login' | 'signup'
  redirectTo?: string
  /** Archetype slug carried from the public /quiz/archetype CTA, claimed onto the new profile. */
  archetype?: string
}

export type AuthMode = 'login' | 'signup' | 'forgot' | 'magic'

export function useAuthForm({ mode: initialMode, redirectTo, archetype }: UseAuthFormOptions) {
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

  // For OAuth / magic-link round-trips, prefer the actual host the user is on.
  // Baking NEXT_PUBLIC_APP_URL (apex) causes an apex→www 307 mid-flow that drops
  // the PKCE code-verifier cookie, breaking exchangeCodeForSession. Using the live
  // origin also makes local dev (localhost:3000) work.
  function oauthOrigin() {
    if (typeof window !== 'undefined') return window.location.origin
    return process.env.NEXT_PUBLIC_APP_URL ?? ''
  }

  function resolvedRedirectTo(fallback: string) {
    return safeAuthRedirect(redirectTo) ?? fallback
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
          redirectTo: `${oauthOrigin()}/auth/callback?next=${encodeURIComponent(resolvedRedirectTo('/dashboard'))}`,
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
        await postAuthAction<{ onboardingCompleted: boolean }>('/api/auth/login', validation.data)
        // The server route validated credentials + rate-limits + returned onboardingCompleted.
        // Now sign in with the BROWSER client so the chunked sb-*-auth-token cookies are
        // written locally and onAuthStateChange fires (V3AuthGate updates) — this guarantees
        // a committed session before the hard navigation so the proxy never bounces to /login.
        const { error: clientError } = await supabase.auth.signInWithPassword({
          email: validation.data.email,
          password: validation.data.password,
        })
        if (clientError) {
          setError('Something went wrong. Try again.')
          play('error')
          setLoading(false)
          return
        }
        play('success')
        const dest = resolvedRedirectTo('/dashboard')
        window.location.href = dest
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
        const magnetSource = consumeMagnetSource()
        // Fresh signups with no explicit redirect go to /first-run (one role tap into
        // a pre-warmed interview) instead of the dashboard. An explicit redirectTo — a
        // pricing/checkout deep-link, or a /go/* magnet's post-signup CTA — still wins,
        // so intent-to-pay and magnet-attributed users aren't diverted.
        const dest = resolvedRedirectTo('/first-run')
        const data = await postAuthAction<{ hasSession: boolean }>('/api/auth/signup', {
          ...validation.data,
          turnstileToken,
          website,
          // Route the email-confirmation link through /auth/callback so it commits
          // the session AND forwards the user to their post-signup destination
          // (e.g. a /pricing plan deep-link that resumes checkout), not just /dashboard.
          redirectTo: `${siteOrigin()}/auth/callback?next=${encodeURIComponent(dest)}`,
          // Best-effort claim of a /quiz/archetype result onto the new profile.
          ...(archetype ? { archetype } : {}),
          // Attribute the signup to the /go/* lead magnet that earned it, if any.
          ...(magnetSource ? { magnetSource } : {}),
        })
        if (data.hasSession) {
          play('success')
          // Hard nav (like login) so the session cookie is committed before the proxy
          // evaluates the destination, and so a plan deep-link resumes checkout.
          window.location.href = dest
        } else {
          resetTurnstile()
          play('success')
          router.push(`/verify-email?email=${encodeURIComponent(validation.data.email)}&next=${encodeURIComponent(dest)}`)
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
    // Send Google back through /auth/callback (which runs exchangeCodeForSession)
    // and carry the post-login destination as ?next=, which the callback's safeNextPath
    // reads it. Redirecting straight to /dashboard skips the code exchange, so no
    // session is set and the proxy bounces the user to /login.
    const next = resolvedRedirectTo('/dashboard')
    const callback = `${oauthOrigin()}/auth/callback?next=${encodeURIComponent(next)}`
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callback },
    })
    if (error) {
      setError('Could not start Google sign-in. Please try again.')
      play('error')
    }
  }

  return {
    // mode
    activeMode,
    switchMode,
    // fields
    name, setName,
    email, setEmail,
    password, setPassword,
    showPassword, setShowPassword,
    // honeypot — every presentation MUST render this hidden field via honeypotProps
    honeypotProps: {
      name: 'website',
      hidden: true,
      tabIndex: -1,
      autoComplete: 'off',
      value: website,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => setWebsite(e.target.value),
    },
    // turnstile
    turnstileToken, setTurnstileToken,
    turnstileResetSignal,
    // request state
    loading,
    error,
    success,
    fieldErrors, setFieldErrors,
    // actions
    handleSubmit,
    handleGoogleSignIn,
  }
}

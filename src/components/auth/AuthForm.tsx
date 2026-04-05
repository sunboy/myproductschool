'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

interface AuthFormProps {
  mode: 'login' | 'signup'
}

export function AuthForm({ mode: initialMode }: AuthFormProps) {
  const [activeMode, setActiveMode] = useState<'login' | 'signup'>(initialMode)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (activeMode === 'login') {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        // Check if user completed onboarding
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed_at, display_name')
          .eq('id', data.user.id)
          .single()
        // Backfill display_name for existing users whose profile.display_name is null
        const meta = data.user.user_metadata
        const metaName = meta?.display_name ?? meta?.full_name ?? meta?.name ?? null
        if (!profile?.display_name && metaName) {
          await fetch('/api/profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ display_name: metaName }),
          })
        }
        router.push('/dashboard')
        router.refresh()
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: name },
          emailRedirectTo: `${window.location.origin}/onboarding/welcome`,
        }
      })
      if (error) {
        setError(error.message)
      } else if (data.session) {
        // Auto-confirmed (no email verification required in dev)
        router.push('/dashboard')
        router.refresh()
      } else {
        setSuccess('Check your email to confirm your account. You\'ll start with Luma next.')
      }
    }
    setLoading(false)
  }

  async function handleGoogleSignIn() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/onboarding/welcome` }
    })
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="w-2/5 bg-surface-container-low flex flex-col justify-center px-12 py-16">
        <div className="flex items-center gap-2 mb-8">
          <LumaGlyph size={36} state="idle" className="text-primary" />
          <span className="font-headline text-2xl font-bold text-primary">HackProduct</span>
        </div>
        <h2 className="font-headline text-3xl text-on-surface mb-3 leading-snug">
          Tell me where you are. I&apos;ll tell you where to go.
        </h2>
        <p className="text-sm text-on-surface-variant italic mb-10">— Luma, Product Sense Coach</p>

        <ul className="space-y-4">
          {[
            'Scenario-based interview practice',
            'Real-time feedback from Luma',
            'Daily product thinking drills',
          ].map(bullet => (
            <li key={bullet} className="flex items-center gap-3">
              <span
                className="material-symbols-outlined text-primary text-xl"
                style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
              >check_circle</span>
              <span className="text-sm text-on-surface font-body">{bullet}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center px-12 py-16 bg-background">
        <div className="w-full max-w-sm mx-auto space-y-6">
          {/* Tab switcher */}
          <div className="flex gap-1 p-1 bg-surface-container rounded-full w-fit">
            <button
              type="button"
              onClick={() => { setActiveMode('signup'); setError(null); setSuccess(null) }}
              className={`px-5 py-1.5 rounded-full text-sm font-semibold font-label transition-all ${
                activeMode === 'signup'
                  ? 'bg-primary text-on-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => { setActiveMode('login'); setError(null); setSuccess(null) }}
              className={`px-5 py-1.5 rounded-full text-sm font-semibold font-label transition-all ${
                activeMode === 'login'
                  ? 'bg-primary text-on-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Log In
            </button>
          </div>

          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-2 border border-outline-variant rounded-full py-2.5 text-on-surface text-sm font-medium hover:bg-surface-container transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-outline-variant" />
            <span className="text-xs text-on-surface-variant">or</span>
            <div className="flex-1 h-px bg-outline-variant" />
          </div>

          {/* Email form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {activeMode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1.5 font-label">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant rounded-xl text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary transition-colors text-sm"
                  placeholder="Your name"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5 font-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant rounded-xl text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary transition-colors text-sm"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5 font-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant rounded-xl text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary transition-colors text-sm"
                placeholder="Password"
              />
              {activeMode === 'login' && (
                <div className="mt-1.5 text-right">
                  <a href="/forgot-password" className="text-sm text-primary hover:underline">Forgot password?</a>
                </div>
              )}
            </div>

            {error && (
              <p className="text-sm text-error">{error}</p>
            )}

            {success && (
              <p className="text-sm text-primary">{success}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-on-primary rounded-full py-2.5 font-semibold font-label text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? '...' : activeMode === 'login' ? 'Log In' : 'Create Account'}
            </button>

            {activeMode === 'signup' && (
              <p className="text-sm text-on-surface-variant mt-3">New? You&apos;ll meet Luma next.</p>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

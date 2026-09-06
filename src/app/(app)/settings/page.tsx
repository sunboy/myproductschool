'use client'

import { LearningPageHeading } from '@/components/redesign/LearningPageHeading'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogOut,
  Pencil,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { FreemiumUsageSummary } from '@/components/billing/FreemiumUsageSummary'
import { ReauthModal } from '@/components/auth/ReauthModal'
import { newPasswordSchema, zodFieldErrors } from '@/lib/auth/validation'
import { clearOnboardingState } from '@/lib/onboarding/state-client'
import { useOnboardingModal } from '@/context/OnboardingModalContext'

type SubscriptionInfo = {
  plan?: string | null
  status?: string | null
  current_period_end?: string | null
  billing_interval?: 'month' | 'year' | null
  cancel_at_period_end?: boolean | null
  cancel_at?: string | null
  canceled_at?: string | null
}

type ProfileResponse = {
  display_name?: string
  email?: string
  preferred_role?: string
  avatar_url?: string
  plan?: string
  subscription?: SubscriptionInfo | null
}

type BillingPrice = {
  formatted?: string | null
  interval?: 'month' | 'year' | null
  source?: 'stripe' | 'fallback'
}

type BillingPrices = {
  monthly?: BillingPrice
  annual?: BillingPrice
}

type LinkedIdentity = {
  identity_id: string
  provider: string
  identity_data?: {
    email?: string
    full_name?: string
    name?: string
    [key: string]: unknown
  }
}

type IdentityAction = 'link-google' | 'unlink-google'
type PasswordField = 'password' | 'confirm'
type ReauthRequest = {
  title: string
  description: string
  confirmLabel?: string
  onVerified: (password: string) => Promise<void>
}

function formatBillingDate(value?: string | null) {
  if (!value) return 'Not available'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not available'
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export default function SettingsPage() {
  const router = useRouter()
  const { openModal } = useOnboardingModal()
  const [redoingCalibration, setRedoingCalibration] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileInitial, setProfileInitial] = useState('?')
  const [email, setEmail] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [plan, setPlan] = useState<string>('free')
  const [planLoading, setPlanLoading] = useState(true)
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [billingAction, setBillingAction] = useState<string | null>(null)
  const [billingError, setBillingError] = useState<string | null>(null)
  const [prices, setPrices] = useState<BillingPrices | null>(null)
  const [linkedIdentities, setLinkedIdentities] = useState<LinkedIdentity[]>([])
  const [identitiesLoading, setIdentitiesLoading] = useState(true)
  const [identityAction, setIdentityAction] = useState<IdentityAction | null>(null)
  const [identityError, setIdentityError] = useState<string | null>(null)
  const [passwordForm, setPasswordForm] = useState({
    password: '',
    confirm: '',
  })
  const [passwordFieldErrors, setPasswordFieldErrors] = useState<Partial<Record<PasswordField, string>>>({})
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [visiblePasswordFields, setVisiblePasswordFields] = useState<Partial<Record<PasswordField, boolean>>>({})
  const [reauthRequest, setReauthRequest] = useState<ReauthRequest | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteEmail, setDeleteEmail] = useState('')
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleteSaving, setDeleteSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleRedoCalibration() {
    setRedoingCalibration(true)
    try {
      await clearOnboardingState()
      openModal('settings')
    } finally {
      setRedoingCalibration(false)
    }
  }

  async function refreshProfile() {
    const data: ProfileResponse | null = await fetch('/api/profile')
      .then(r => r.ok ? r.json() : null)
    if (!data) return
    if (data.display_name) {
      setDisplayName(data.display_name)
      setProfileInitial(data.display_name[0]?.toUpperCase() ?? '?')
    }
    if (data.email) setEmail(data.email)
    if (data.avatar_url) setAvatarUrl(data.avatar_url)
    if (data.plan) setPlan(data.plan)
    setSubscription(data.subscription ?? null)
  }

  async function refreshIdentities() {
    setIdentitiesLoading(true)
    setIdentityError(null)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.getUserIdentities()
      if (error) throw error
      setLinkedIdentities(data.identities)
    } catch {
      setIdentityError('Could not load linked accounts.')
    } finally {
      setIdentitiesLoading(false)
    }
  }

  useEffect(() => {
    refreshProfile().catch(() => {}).finally(() => setPlanLoading(false))
    refreshIdentities().catch(() => {})
    fetch('/api/billing/prices')
      .then(r => r.ok ? r.json() : null)
      .then((data: BillingPrices | null) => setPrices(data))
      .catch(() => {})
  }, [])

  const saveDisplayName = async () => {
    if (!displayName.trim()) return
    setProfileSaving(true)
    try {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: displayName.trim() }),
      })
      setProfileInitial(displayName.trim()[0]?.toUpperCase() ?? '?')
      setEditingName(false)
    } finally {
      setProfileSaving(false)
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/profile/avatar', { method: 'POST', body: form })
      if (res.ok) {
        const data = await res.json()
        setAvatarUrl(data.avatar_url)
      }
    } finally {
      setAvatarUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  async function handleLinkGoogle() {
    setIdentityAction('link-google')
    setIdentityError(null)
    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=/settings`
      const res = await fetch('/api/auth/link-identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redirectTo }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Could not connect Google.')
      if (data.url) {
        window.location.assign(data.url)
        return
      }
      await refreshIdentities()
    } catch (error) {
      setIdentityError(error instanceof Error ? error.message : 'Could not connect Google.')
    } finally {
      setIdentityAction(null)
    }
  }

  async function handleUnlinkGoogle() {
    const googleIdentity = linkedIdentities.find(identity => identity.provider === 'google')
    if (!googleIdentity) return

    setIdentityAction('unlink-google')
    setIdentityError(null)
    try {
      const res = await fetch('/api/auth/link-identity', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'google',
          identityId: googleIdentity.identity_id,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Could not remove Google.')
      await refreshIdentities()
    } catch (error) {
      setIdentityError(error instanceof Error ? error.message : 'Could not remove Google.')
    } finally {
      setIdentityAction(null)
    }
  }

  function updatePasswordField(field: PasswordField, value: string) {
    setPasswordForm(current => ({ ...current, [field]: value }))
    setPasswordFieldErrors(current => ({ ...current, [field]: undefined }))
    setPasswordError(null)
    setPasswordSuccess(null)
  }

  function togglePasswordVisibility(field: PasswordField) {
    setVisiblePasswordFields(current => ({ ...current, [field]: !current[field] }))
  }

  async function handlePasswordChange(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(null)
    setPasswordFieldErrors({})

    const validation = newPasswordSchema.safeParse(passwordForm)
    if (!validation.success) {
      setPasswordFieldErrors(zodFieldErrors<PasswordField>(validation.error))
      return
    }

    setReauthRequest({
      title: 'Confirm password change',
      description: 'Enter your current password before choosing a new one.',
      confirmLabel: 'Update password',
      onVerified: async (currentPassword) => {
        setPasswordSaving(true)
        try {
          const res = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...validation.data, currentPassword }),
          })
          const data = await res.json().catch(() => ({}))
          if (!res.ok) {
            if (res.status === 429) {
              throw new Error('Too many attempts. Try again in a minute.')
            }
            if (data.error === 'reauth_required') {
              throw new Error('Confirm your password and try again.')
            }
            throw new Error(data.error ?? 'Could not change password.')
          }
          setPasswordForm({ password: '', confirm: '' })
          setPasswordSuccess('Password updated.')
        } catch (error) {
          setPasswordError(error instanceof Error ? error.message : 'Could not change password.')
          throw error
        } finally {
          setPasswordSaving(false)
        }
      },
    })
  }

  async function runBillingAction(action: string, body: Record<string, unknown> = {}) {
    const title = action === 'cancel' ? 'Confirm cancellation' : 'Confirm billing change'
    const description = action === 'cancel'
      ? 'Enter your current password before scheduling Pro cancellation.'
      : 'Enter your current password before changing your subscription.'
    setReauthRequest({
      title,
      description,
      confirmLabel: 'Continue',
      onVerified: async () => {
        await performBillingAction(action, body)
      },
    })
  }

  async function performBillingAction(action: string, body: Record<string, unknown> = {}) {
    setBillingAction(action)
    setBillingError(null)
    try {
      const res = await fetch('/api/billing/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...body }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Billing update failed')
      await refreshProfile()
      window.dispatchEvent(new CustomEvent('profile-stats-updated'))
    } catch (error) {
      setBillingError(error instanceof Error ? error.message : 'Billing update failed')
    } finally {
      setBillingAction(null)
    }
  }

  async function openBillingPortal() {
    const portalWindow = window.open('about:blank', '_blank')
    if (portalWindow) portalWindow.opener = null

    setBillingAction('portal')
    setBillingError(null)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      if (res.status >= 500) throw new Error('Billing is temporarily unavailable. Please try again shortly. Your membership has not changed.')
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? 'Could not open billing portal')
      }

      if (portalWindow) {
        portalWindow.location.href = data.url
      } else {
        window.location.assign(data.url)
      }
    } catch (error) {
      if (portalWindow) portalWindow.close()
      setBillingError(error instanceof Error ? error.message : 'Could not open billing portal')
    } finally {
      setBillingAction(null)
    }
  }

  function closeDeleteDialog() {
    if (deleteSaving) return
    setDeleteDialogOpen(false)
    setDeleteEmail('')
    setDeleteConfirmation('')
    setDeleteError(null)
  }

  async function handleDeleteAccount(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setDeleteError(null)

    if (!email || deleteEmail.trim().toLowerCase() !== email.toLowerCase() || deleteConfirmation !== 'DELETE') {
      setDeleteError('Enter your email and DELETE to continue.')
      return
    }

    setReauthRequest({
      title: 'Confirm account deletion',
      description: 'Enter your current password before permanently deleting this account.',
      confirmLabel: 'Delete account',
      onVerified: async () => {
        setDeleteSaving(true)
        try {
          const res = await fetch('/api/profile/delete', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: deleteEmail, confirmation: deleteConfirmation }),
          })
          const data = await res.json().catch(() => ({}))
          if (!res.ok) {
            if (data.error === 'reauth_required') {
              throw new Error('Confirm your password and try again.')
            }
            throw new Error(data.error ?? 'Could not delete account.')
          }
          const supabase = createClient()
          await supabase.auth.signOut()
          router.push('/')
          router.refresh()
        } catch (error) {
          setDeleteError(error instanceof Error ? error.message : 'Could not delete account.')
          throw error
        } finally {
          setDeleteSaving(false)
        }
      },
    })
  }

  const isPro = plan === 'pro'
  const interval = subscription?.billing_interval === 'year' ? 'Annual' : 'Monthly'
  const statusLabel = subscription?.status
    ? subscription.status.replaceAll('_', ' ')
    : isPro ? 'active' : 'free'
  const periodEndLabel = formatBillingDate(subscription?.current_period_end)
  const cancelScheduled = !!subscription?.cancel_at_period_end
  const currentPrice = subscription?.billing_interval === 'year'
    ? prices?.annual?.formatted
    : prices?.monthly?.formatted
  const switchPlan = subscription?.billing_interval === 'year' ? 'monthly' : 'annual'
  const switchPrice = switchPlan === 'annual' ? prices?.annual?.formatted : prices?.monthly?.formatted
  const switchInterval = switchPlan === 'annual' ? 'year' : 'month'
  const upgradePrice = prices?.monthly?.formatted
  const googleIdentity = linkedIdentities.find(identity => identity.provider === 'google')
  const googleEmail = typeof googleIdentity?.identity_data?.email === 'string'
    ? googleIdentity.identity_data.email
    : null
  const canUnlinkGoogle = !!googleIdentity && linkedIdentities.length > 1
  const inputClass = 'w-full min-h-11 rounded-[8px] border border-hairline bg-card-bright px-3 py-2 font-body text-base text-ink-strong placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-forest-600/25 focus:border-forest-600/50'
  const quietButtonClass = 'inline-flex min-h-11 items-center gap-1.5 rounded-[10px] border border-hairline bg-card-bright px-3.5 py-2 font-label text-sm font-bold text-ink-secondary transition-colors hover:border-forest-600/40 hover:text-ink-strong disabled:cursor-not-allowed disabled:opacity-50'
  const primaryButtonClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] bg-forest-950 px-4 py-2.5 font-label text-sm font-bold text-white transition-colors hover:bg-forest-900 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60'
  const passwordFields: Array<{
    field: PasswordField
    label: string
    placeholder: string
    autoComplete: string
  }> = [
    {
      field: 'password',
      label: 'New password',
      placeholder: '10+ characters',
      autoComplete: 'new-password',
    },
    {
      field: 'confirm',
      label: 'Confirm password',
      placeholder: 'Same password again',
      autoComplete: 'new-password',
    },
  ]

  return (
    <main className="learning-account mx-auto max-w-[1060px] px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      <LearningPageHeading eyebrow="Your account" title="Make it yours." action={isPro ? <span className="rounded-full bg-note-amber px-4 py-2 text-sm font-semibold text-forest-950">Pro member</span> : undefined}>Manage your profile, sign-in preferences, and membership.</LearningPageHeading>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
        {/* ── Profile & security card ─────────────────────────────────────── */}
        <section className="h-fit rounded-2xl border border-hairline bg-card-bright p-5">
          <div className="flex items-start gap-4">
            <button
              type="button"
              className="group relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-forest-800 text-lg font-bold text-white transition-transform active:scale-[0.98]"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Update avatar"
            >
              {avatarUrl
                ? <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                : <span className="font-label" suppressHydrationWarning>{profileInitial}</span>
              }
              <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white transition-colors group-hover:bg-black/25">
                <Pencil className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" strokeWidth={1.8} />
              </span>
              {avatarUploading && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/45">
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.8} />
                </span>
              )}
            </button>

            <div className="min-w-0 flex-1">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    aria-label="Display name"
                    autoComplete="nickname"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveDisplayName(); if (e.key === 'Escape') setEditingName(false) }}
                    className={`min-w-0 flex-1 ${inputClass}`}
                  />
                  <button
                    onClick={saveDisplayName}
                    disabled={profileSaving}
                    className="flex size-11 shrink-0 items-center justify-center rounded-[8px] bg-forest-950 text-white transition-opacity disabled:opacity-50"
                    aria-label="Save display name"
                  >
                    <Check className="h-4 w-4" strokeWidth={2} />
                  </button>
                  <button
                    onClick={() => setEditingName(false)}
                    className="flex size-11 shrink-0 items-center justify-center rounded-[8px] text-ink-secondary transition-colors hover:bg-page-field"
                    aria-label="Cancel display name edit"
                  >
                    <X className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-body text-[16px] font-extrabold leading-tight text-ink-strong">
                      {displayName || 'Add your name'}
                    </p>
                    <p className="mt-0.5 truncate font-body text-[13px] text-ink-secondary" suppressHydrationWarning>
                      {email ?? 'Signed in email'}
                    </p>
                  </div>
                  <button
                    onClick={() => setEditingName(true)}
                    className="flex size-11 shrink-0 items-center justify-center rounded-[8px] text-ink-secondary transition-colors hover:bg-page-field hover:text-ink-strong"
                    aria-label="Edit display name"
                  >
                    <Pencil className="h-3.5 w-3.5" strokeWidth={1.8} />
                  </button>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          {/* Hairline-separated rows (spec §4: de-carded list content) */}
          <div className="mt-4 divide-y divide-hairline border-y border-hairline">
            <div className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="font-body text-[13px] font-bold text-ink-strong">Email</p>
                <p className="mt-0.5 truncate font-body text-xs text-ink-secondary">{email ?? 'Signed in email'}</p>
              </div>
              <Lock className="h-4 w-4 shrink-0 text-ink-muted" strokeWidth={1.8} />
            </div>

            <Link
              href="/settings/notifications"
              className="group flex items-center justify-between gap-3 py-3 transition-colors"
            >
              <div className="min-w-0">
                <p className="font-body text-[13px] font-bold text-ink-strong">Notifications</p>
                <p className="mt-0.5 font-body text-xs text-ink-secondary">Email preferences</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted transition-colors group-hover:text-ink-strong" strokeWidth={1.8} />
            </Link>

            <div className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="font-body text-[13px] font-bold text-ink-strong">Calibration</p>
                <p className="mt-0.5 font-body text-xs text-ink-secondary">
                  Reset your FLOW baseline. Takes about 5 minutes.
                </p>
              </div>
              <button
                type="button"
                onClick={handleRedoCalibration}
                disabled={redoingCalibration}
                className={quietButtonClass}
              >
                {redoingCalibration ? 'Opening' : 'Redo'}
              </button>
            </div>

            <div className="py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-body text-[13px] font-bold text-ink-strong">Google sign-in</p>
                  <p className="mt-0.5 truncate font-body text-xs text-ink-secondary">
                    {identitiesLoading
                      ? 'Checking linked accounts'
                      : googleEmail ?? (googleIdentity ? 'Connected' : 'Not connected')}
                  </p>
                </div>
                {identitiesLoading ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-ink-muted" strokeWidth={1.8} />
                ) : googleIdentity ? (
                  <button
                    type="button"
                    onClick={handleUnlinkGoogle}
                    disabled={identityAction !== null || !canUnlinkGoogle}
                    className={quietButtonClass}
                    title={canUnlinkGoogle ? 'Remove Google sign-in' : 'Add another sign-in method before removing Google'}
                  >
                    {identityAction === 'unlink-google' ? 'Removing' : 'Remove'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleLinkGoogle}
                    disabled={identityAction !== null}
                    className={quietButtonClass}
                  >
                    {identityAction === 'link-google' ? 'Connecting' : 'Connect'}
                  </button>
                )}
              </div>
              {identityError && (
                <p className="mt-2 rounded-[8px] bg-error/10 px-3 py-2 font-body text-xs text-error">{identityError}</p>
              )}
            </div>
          </div>

          {/* Password */}
          <form onSubmit={handlePasswordChange} className="mt-4">
            <p className="font-body text-[13px] font-bold text-ink-strong">Change password</p>
            <p className="mt-0.5 font-body text-xs text-ink-secondary">
              Use at least 10 characters with a number or symbol.
            </p>

            <div className="mt-3 space-y-3">
              {passwordFields.map(({ field, label, placeholder, autoComplete }) => {
                const visible = Boolean(visiblePasswordFields[field])
                return (
                  <div key={field} className="space-y-1.5">
                    <label htmlFor={`settings-${field}`} className="block font-label text-xs font-bold text-ink-secondary">
                      {label}
                    </label>
                    <div className="relative">
                      <input
                        id={`settings-${field}`}
                        type={visible ? 'text' : 'password'}
                        value={passwordForm[field]}
                        onChange={e => updatePasswordField(field, e.target.value)}
                        className={`${inputClass} pr-10`}
                        placeholder={placeholder}
                        autoComplete={autoComplete}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility(field)}
                        className="absolute right-2 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center text-ink-muted transition-colors hover:text-ink-strong"
                        aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
                      >
                        {visible
                          ? <EyeOff className="h-4 w-4" strokeWidth={1.8} />
                          : <Eye className="h-4 w-4" strokeWidth={1.8} />}
                      </button>
                    </div>
                    {passwordFieldErrors[field] && (
                      <p className="font-body text-xs text-error">{passwordFieldErrors[field]}</p>
                    )}
                  </div>
                )
              })}
            </div>

            {passwordError && (
              <p className="mt-3 rounded-[8px] bg-error/10 px-3 py-2 font-body text-xs text-error">{passwordError}</p>
            )}
            {passwordSuccess && (
              <p className="mt-3 note-mint px-3 py-2 font-body text-xs font-bold text-forest-800">{passwordSuccess}</p>
            )}

            <button
              type="submit"
              disabled={passwordSaving || reauthRequest !== null}
              className={`mt-3 w-full ${primaryButtonClass}`}
            >
              {passwordSaving ? 'Updating' : 'Update password'}
            </button>
          </form>

          <button
            onClick={handleLogout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-[10px] border border-hairline bg-transparent px-4 py-2.5 font-label text-sm font-bold text-ink-secondary transition-colors hover:border-forest-600/40 hover:text-ink-strong active:scale-[0.99]"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.8} />
            Sign out
          </button>
        </section>

        {/* ── Plan & billing card ─────────────────────────────────────────── */}
        <section className="h-fit overflow-hidden rounded-2xl border border-hairline bg-card-bright">
          {planLoading ? (
            /* Neutral skeleton while the plan/billing query resolves — never
               default to the free/upsell state during loading */
            <div className="animate-pulse" aria-hidden="true">
              <div className="px-5 py-4">
                <div className="h-3 w-16 rounded bg-page-field" />
                <div className="mt-2 h-7 w-48 rounded bg-page-field" />
                <div className="mt-2 h-4 w-36 rounded bg-page-field" />
              </div>
              <div className="p-5">
                <div className="h-[74px] rounded-[12px] bg-page-field" />
                <div className="mt-4 h-10 rounded-[10px] bg-page-field" />
                <div className="mt-4 h-10 w-40 rounded-[10px] bg-page-field" />
              </div>
            </div>
          ) : (
          <>
          {/* Dark pricing band (Codex ref 10 language) — the page's one dark surface */}
          <div
            className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            style={{ background: 'linear-gradient(120deg, #052316 0%, #123b20 78%, #1e472d 100%)' }}
          >
            <div>
              <p className="font-label text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">
                Your plan
              </p>
              <h2 className="mt-1 font-headline text-[22px] font-semibold leading-tight tracking-[-0.01em] text-white">
                {isPro ? 'HackProduct Pro' : 'Free plan'}
              </h2>
              <p className="mt-0.5 font-body text-[12.5px] capitalize text-white/65">
                {isPro ? `${interval} · ${statusLabel}` : 'Monthly free practice limits'}
              </p>
            </div>

            {!isPro && (
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-upgrade-modal'))}
                className="inline-flex w-fit items-center justify-center gap-2 rounded-[10px] bg-white px-4 py-2.5 font-label text-sm font-bold text-forest-950 transition-opacity hover:opacity-90 active:scale-[0.98]"
              >
                {upgradePrice ? `Get Pro · ${upgradePrice}/mo` : 'Get Pro'}
              </button>
            )}
          </div>

          <div className="p-5">
            {/* Stat cells: label + number, hairline separators, no boxes (spec §4) */}
            <div className="grid grid-cols-1 divide-y divide-hairline rounded-[12px] border border-hairline sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <div className="px-4 py-3">
                <p className="font-label text-[10px] font-extrabold uppercase tracking-[0.08em] text-ink-secondary">Current</p>
                <p className="mt-1.5 font-body text-sm font-bold tabular-nums text-ink-strong">
                  {isPro ? `${interval}${currentPrice ? ` · ${currentPrice}/${subscription?.billing_interval === 'year' ? 'yr' : 'mo'}` : ''}` : 'Free · $0'}
                </p>
              </div>
              <div className="px-4 py-3">
                <p className="font-label text-[10px] font-extrabold uppercase tracking-[0.08em] text-ink-secondary">Next billing</p>
                <p className="mt-1.5 font-body text-sm font-bold tabular-nums text-ink-strong">{isPro ? periodEndLabel : 'None'}</p>
              </div>
              <div className="px-4 py-3">
                <p className="font-label text-[10px] font-extrabold uppercase tracking-[0.08em] text-ink-secondary">Switch price</p>
                <p className="mt-1.5 font-body text-sm font-bold tabular-nums text-ink-strong">
                  {isPro && switchPrice ? `${switchPrice}/${switchInterval === 'year' ? 'yr' : 'mo'}` : upgradePrice ? `${upgradePrice}/mo` : 'Loading'}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <FreemiumUsageSummary plan={plan} />
            </div>

            {cancelScheduled && (
              <div className="note-amber mt-4 px-4 py-3 font-body text-sm text-ink-strong">
                Pro remains active until {periodEndLabel}, then your account moves to Free.
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {isPro ? (
                <>
                  <button
                    onClick={openBillingPortal}
                    disabled={!!billingAction}
                    className={primaryButtonClass}
                  >
                    {billingAction === 'portal' ? 'Opening billing' : 'Manage billing'}
                  </button>
                  <button
                    onClick={() => runBillingAction('change-plan', { plan: switchPlan })}
                    disabled={!!billingAction || reauthRequest !== null}
                    className={`${quietButtonClass} px-4 py-2.5 text-sm`}
                  >
                    Switch to {switchPlan} {switchPrice ? `(${switchPrice}/${switchInterval === 'year' ? 'yr' : 'mo'})` : ''}
                  </button>
                  {cancelScheduled ? (
                    <button
                      onClick={() => runBillingAction('reactivate')}
                      disabled={!!billingAction || reauthRequest !== null}
                      className={`${quietButtonClass} px-4 py-2.5 text-sm`}
                    >
                      Keep Pro
                    </button>
                  ) : (
                    <button
                      onClick={() => runBillingAction('cancel')}
                      disabled={!!billingAction || reauthRequest !== null}
                      className={`${quietButtonClass} px-4 py-2.5 text-sm`}
                    >
                      Cancel at renewal
                    </button>
                  )}
                </>
              ) : (
                upgradePrice && (
                  <p className="font-body text-[13px] text-ink-secondary">
                    Pro is {upgradePrice}/mo. Prices come from Stripe when this page loads.
                  </p>
                )
              )}
            </div>

            {billingError && (
              <p className="mt-3 rounded-[8px] bg-error/10 px-3 py-2 font-body text-sm text-error">{billingError}</p>
            )}

            <div className="mt-5 border-t border-hairline pt-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-label text-[10px] font-extrabold uppercase tracking-[0.08em] text-error">Danger zone</p>
                  <p className="mt-1 font-body text-sm font-bold text-ink-strong">Delete your account</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-error/45 px-4 py-2.5 font-label text-sm font-bold text-error transition-colors hover:bg-error/10 active:scale-[0.98]"
                >
                  Delete my account
                </button>
              </div>
            </div>
          </div>
          </>
          )}
        </section>
      </div>

      {deleteDialogOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-forest-950/50 px-4">
          <form
            onSubmit={handleDeleteAccount}
            className="w-full max-w-[460px] rounded-2xl border border-hairline bg-card-bright p-5 shadow-[0_24px_70px_rgba(5,35,22,0.30)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-error" strokeWidth={1.8} />
              <div>
                <h2 id="delete-account-title" className="font-body text-[17px] font-extrabold leading-tight text-ink-strong">
                  Delete account
                </h2>
                <p className="mt-1 font-body text-sm leading-relaxed text-ink-secondary">
                  This permanently removes your account and connected profile data.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="space-y-1.5">
                <label htmlFor="delete-email" className="block font-label text-xs font-bold text-ink-secondary">
                  Account email
                </label>
                <input
                  id="delete-email"
                  type="email"
                  value={deleteEmail}
                  onChange={e => {
                    setDeleteEmail(e.target.value)
                    setDeleteError(null)
                  }}
                  className={inputClass}
                  placeholder={email ?? 'name@example.com'}
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="delete-confirmation" className="block font-label text-xs font-bold text-ink-secondary">
                  Type DELETE
                </label>
                <input
                  id="delete-confirmation"
                  value={deleteConfirmation}
                  onChange={e => {
                    setDeleteConfirmation(e.target.value)
                    setDeleteError(null)
                  }}
                  className={inputClass}
                  placeholder="DELETE"
                />
              </div>
            </div>

            {deleteError && (
              <p className="mt-3 rounded-[8px] bg-error/10 px-3 py-2 font-body text-sm text-error">{deleteError}</p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeDeleteDialog}
                disabled={deleteSaving}
                className={`${quietButtonClass} px-4 py-2.5 text-sm`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={deleteSaving}
                className="min-h-11 rounded-[10px] bg-error px-4 py-2.5 font-label text-sm font-bold text-white transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleteSaving ? 'Deleting' : 'Continue'}
              </button>
            </div>
          </form>
        </div>
      )}

      <ReauthModal
        open={reauthRequest !== null}
        title={reauthRequest?.title ?? ''}
        description={reauthRequest?.description ?? ''}
        confirmLabel={reauthRequest?.confirmLabel}
        onCancel={() => setReauthRequest(null)}
        onVerified={password => reauthRequest?.onVerified(password)}
      />

      <footer className="mt-8 flex items-center justify-between pb-8">
        <p className="font-label text-[10px] uppercase tracking-widest text-ink-muted">HackProduct</p>
        <div className="flex gap-4">
          <Link href="/privacy" className="font-label text-[10px] text-ink-muted transition-colors hover:text-ink-secondary">Privacy</Link>
          <Link href="/terms" className="font-label text-[10px] text-ink-muted transition-colors hover:text-ink-secondary">Terms</Link>
        </div>
      </footer>
    </main>
  )
}

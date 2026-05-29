'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FreemiumUsageSummary } from '@/components/billing/FreemiumUsageSummary'
import { ReauthModal } from '@/components/auth/ReauthModal'
import { authEmailSchema, newPasswordSchema, zodFieldErrors } from '@/lib/auth/validation'

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
type EmailChangeField = 'email'
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
  const [displayName, setDisplayName] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileInitial, setProfileInitial] = useState('?')
  const [email, setEmail] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [plan, setPlan] = useState<string>('free')
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
  const [emailChangeForm, setEmailChangeForm] = useState({
    email: '',
  })
  const [emailChangeFieldErrors, setEmailChangeFieldErrors] = useState<Partial<Record<EmailChangeField, string>>>({})
  const [emailChangeError, setEmailChangeError] = useState<string | null>(null)
  const [emailChangeSuccess, setEmailChangeSuccess] = useState<string | null>(null)
  const [emailChangeSaving, setEmailChangeSaving] = useState(false)
  const [reauthRequest, setReauthRequest] = useState<ReauthRequest | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteEmail, setDeleteEmail] = useState('')
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleteSaving, setDeleteSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    refreshProfile().catch(() => {})
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

  function updateEmailChangeField(field: EmailChangeField, value: string) {
    setEmailChangeForm(current => ({ ...current, [field]: value }))
    setEmailChangeFieldErrors(current => ({ ...current, [field]: undefined }))
    setEmailChangeError(null)
    setEmailChangeSuccess(null)
  }

  async function handleEmailChange(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEmailChangeError(null)
    setEmailChangeSuccess(null)
    setEmailChangeFieldErrors({})

    const validation = authEmailSchema.safeParse(emailChangeForm.email)
    if (!validation.success) {
      setEmailChangeFieldErrors({ email: validation.error.issues[0]?.message ?? 'Enter a valid email.' })
      return
    }

    const nextEmail = validation.data
    setReauthRequest({
      title: 'Confirm email change',
      description: 'Enter your current password before changing your sign-in email.',
      confirmLabel: 'Send confirmation',
      onVerified: async (currentPassword) => {
        setEmailChangeSaving(true)
        try {
          const redirectTo = `${window.location.origin}/auth/callback?next=/settings`
          const res = await fetch('/api/auth/request-email-change', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: nextEmail, currentPassword, redirectTo }),
          })
          const data = await res.json().catch(() => ({}))
          if (!res.ok) {
            if (res.status === 429) {
              throw new Error('Too many attempts. Try again in a minute.')
            }
            if (data.error === 'reauth_required') {
              throw new Error('Confirm your password and try again.')
            }
            throw new Error(data.error ?? 'Could not request email change.')
          }
          setEmailChangeForm({ email: '' })
          setEmailChangeSuccess(`Check ${nextEmail} for confirmation.`)
        } catch (error) {
          setEmailChangeError(error instanceof Error ? error.message : 'Could not request email change.')
          throw error
        } finally {
          setEmailChangeSaving(false)
        }
      },
    })
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
  const passwordInputClass = 'w-full rounded-xl border border-outline-variant bg-background px-3 py-2 text-sm font-body text-on-surface placeholder:text-on-surface-variant/55 focus:outline-none focus:ring-2 focus:ring-primary/30'
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
    <main className="mx-auto max-w-[1060px] px-4 py-7 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-label text-[11px] font-extrabold uppercase tracking-[0.14em] text-on-surface-variant">
            Account
          </p>
          <h1 className="mt-1 font-headline text-[32px] font-bold leading-none text-on-surface" style={{ letterSpacing: '-0.03em' }}>
            Settings
          </h1>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-outline-variant/50 bg-surface-container-low px-3 py-1.5 text-xs font-label font-bold text-on-surface-variant">
          <span className="material-symbols-outlined text-[15px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
            verified_user
          </span>
          {isPro ? 'Pro workspace' : 'Free workspace'}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[360px_1fr]">
        <section className="rounded-[22px] border border-outline-variant/45 bg-surface-container-low p-5 shadow-[0_18px_50px_rgba(56,47,33,0.07)]">
          <div className="flex items-start gap-4">
            <button
              type="button"
              className="group relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[18px] bg-primary text-xl font-bold text-on-primary transition-transform active:scale-[0.98]"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Update avatar"
            >
              {avatarUrl
                ? <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                : <span className="font-label" suppressHydrationWarning>{profileInitial}</span>
              }
              <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white transition-colors group-hover:bg-black/25">
                <span className="material-symbols-outlined text-[18px] opacity-0 transition-opacity group-hover:opacity-100">photo_camera</span>
              </span>
              {avatarUploading && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/45">
                  <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                </span>
              )}
            </button>

            <div className="min-w-0 flex-1">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveDisplayName(); if (e.key === 'Escape') setEditingName(false) }}
                    className="min-w-0 flex-1 rounded-xl border border-outline-variant bg-background px-3 py-2 text-sm font-body text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <button
                    onClick={saveDisplayName}
                    disabled={profileSaving}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition-opacity disabled:opacity-50"
                    aria-label="Save display name"
                  >
                    <span className="material-symbols-outlined text-[17px]">check</span>
                  </button>
                  <button
                    onClick={() => setEditingName(false)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-on-surface-variant transition-colors hover:bg-surface-container"
                    aria-label="Cancel display name edit"
                  >
                    <span className="material-symbols-outlined text-[17px]">close</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-headline text-xl font-bold leading-tight text-on-surface" style={{ letterSpacing: '-0.02em' }}>
                      {displayName || 'Add your name'}
                    </p>
                    <p className="mt-1 truncate text-sm font-body text-on-surface-variant" suppressHydrationWarning>
                      {email ?? 'Signed in email'}
                    </p>
                  </div>
                  <button
                    onClick={() => setEditingName(true)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
                    aria-label="Edit display name"
                  >
                    <span className="material-symbols-outlined text-[17px]">edit</span>
                  </button>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          <div className="mt-5 rounded-2xl bg-background/70 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-label text-[10px] font-extrabold uppercase tracking-[0.12em] text-on-surface-variant">Email</p>
                <p className="mt-1 truncate text-sm font-body font-semibold text-on-surface">{email ?? 'Signed in email'}</p>
              </div>
              <span className="material-symbols-outlined shrink-0 text-[17px] text-on-surface-variant">lock</span>
            </div>
          </div>

          <Link
            href="/settings/notifications"
            className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-background/70 px-4 py-3 transition-colors hover:bg-background"
          >
            <div className="min-w-0">
              <p className="font-label text-[10px] font-extrabold uppercase tracking-[0.12em] text-on-surface-variant">Notifications</p>
              <p className="mt-1 text-sm font-body font-semibold text-on-surface">Email and push preferences</p>
            </div>
            <span className="material-symbols-outlined shrink-0 text-[17px] text-on-surface-variant">chevron_right</span>
          </Link>

          <form onSubmit={handleEmailChange} className="mt-4 rounded-2xl bg-background/70 px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-label text-[10px] font-extrabold uppercase tracking-[0.12em] text-on-surface-variant">Email change</p>
                <p className="mt-1 text-sm font-body font-semibold text-on-surface">Request a new sign-in email</p>
              </div>
              <span className="material-symbols-outlined shrink-0 text-[17px] text-on-surface-variant">alternate_email</span>
            </div>

            <div className="mt-3 space-y-1.5">
              <label htmlFor="settings-new-email" className="block text-xs font-label font-bold text-on-surface-variant">
                New email
              </label>
              <input
                id="settings-new-email"
                type="email"
                value={emailChangeForm.email}
                onChange={e => updateEmailChangeField('email', e.target.value)}
                className={passwordInputClass}
                placeholder={email ?? 'name@example.com'}
                autoComplete="email"
              />
              {emailChangeFieldErrors.email && (
                <p className="text-xs font-body text-error">{emailChangeFieldErrors.email}</p>
              )}
            </div>

            {emailChangeError && (
              <p className="mt-3 rounded-xl bg-error/10 px-3 py-2 text-sm font-body text-error">{emailChangeError}</p>
            )}
            {emailChangeSuccess && (
              <p className="mt-3 rounded-xl bg-primary-fixed px-3 py-2 text-sm font-body font-semibold text-primary">{emailChangeSuccess}</p>
            )}

            <button
              type="submit"
              disabled={emailChangeSaving || reauthRequest !== null}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-outline-variant/70 px-4 py-3 text-sm font-label font-bold text-on-surface transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[17px]">outgoing_mail</span>
              {emailChangeSaving ? 'Sending' : 'Send confirmation'}
            </button>
          </form>

          <div className="mt-4 rounded-2xl bg-background/70 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-label text-[10px] font-extrabold uppercase tracking-[0.12em] text-on-surface-variant">Linked accounts</p>
                <p className="mt-1 truncate text-sm font-body font-semibold text-on-surface">
                  {googleIdentity ? 'Google connected' : 'No Google account connected'}
                </p>
              </div>
              {identitiesLoading ? (
                <span className="material-symbols-outlined shrink-0 animate-spin text-[17px] text-on-surface-variant">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined shrink-0 text-[17px] text-on-surface-variant">hub</span>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-outline-variant/45 bg-surface-container-lowest px-3 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="material-symbols-outlined flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-container text-[19px] text-on-surface-variant">
                  account_circle
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-label font-bold text-on-surface">Google</p>
                  <p className="mt-0.5 truncate text-xs font-body text-on-surface-variant">
                    {googleEmail ?? (googleIdentity ? 'Connected' : 'Use Google sign-in')}
                  </p>
                </div>
              </div>

              {googleIdentity ? (
                <button
                  type="button"
                  onClick={handleUnlinkGoogle}
                  disabled={identityAction !== null || identitiesLoading || !canUnlinkGoogle}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-outline-variant/70 px-3 py-2 text-xs font-label font-bold text-on-surface-variant transition-colors hover:bg-background hover:text-on-surface disabled:cursor-not-allowed disabled:opacity-50"
                  title={canUnlinkGoogle ? 'Remove Google sign-in' : 'Add another sign-in method before removing Google'}
                >
                  {identityAction === 'unlink-google' ? 'Removing' : 'Remove'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleLinkGoogle}
                  disabled={identityAction !== null || identitiesLoading}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-label font-bold text-on-primary transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {identityAction === 'link-google' ? 'Connecting' : 'Connect'}
                </button>
              )}
            </div>

            {identityError && (
              <p className="mt-3 rounded-xl bg-error/10 px-3 py-2 text-sm font-body text-error">{identityError}</p>
            )}
          </div>

          <form onSubmit={handlePasswordChange} className="mt-4 rounded-2xl bg-background/70 px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-label text-[10px] font-extrabold uppercase tracking-[0.12em] text-on-surface-variant">Password</p>
                <p className="mt-1 text-sm font-body font-semibold text-on-surface">Change your password</p>
                <p className="mt-1 text-xs font-body text-on-surface-variant">
                  Use at least 10 characters with a number or symbol.
                </p>
              </div>
              <span className="material-symbols-outlined shrink-0 text-[17px] text-on-surface-variant">password</span>
            </div>

            <div className="mt-3 space-y-3">
              {passwordFields.map(({ field, label, placeholder, autoComplete }) => {
                const visible = Boolean(visiblePasswordFields[field])
                return (
                  <div key={field} className="space-y-1.5">
                    <label htmlFor={`settings-${field}`} className="block text-xs font-label font-bold text-on-surface-variant">
                      {label}
                    </label>
                    <div className="relative">
                      <input
                        id={`settings-${field}`}
                        type={visible ? 'text' : 'password'}
                        value={passwordForm[field]}
                        onChange={e => updatePasswordField(field, e.target.value)}
                        className={`${passwordInputClass} pr-10`}
                        placeholder={placeholder}
                        autoComplete={autoComplete}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility(field)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors hover:text-on-surface"
                        aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {visible ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                    {passwordFieldErrors[field] && (
                      <p className="text-xs font-body text-error">{passwordFieldErrors[field]}</p>
                    )}
                  </div>
                )
              })}
            </div>

            {passwordError && (
              <p className="mt-3 rounded-xl bg-error/10 px-3 py-2 text-sm font-body text-error">{passwordError}</p>
            )}
            {passwordSuccess && (
              <p className="mt-3 rounded-xl bg-primary-fixed px-3 py-2 text-sm font-body font-semibold text-primary">{passwordSuccess}</p>
            )}

            <button
              type="submit"
              disabled={passwordSaving || reauthRequest !== null}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-label font-bold text-on-primary transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[17px]">key</span>
              {passwordSaving ? 'Updating' : 'Update password'}
            </button>
          </form>

          <button
            onClick={handleLogout}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-outline-variant/60 bg-transparent px-4 py-3 text-sm font-label font-bold text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface active:scale-[0.99]"
          >
            <span className="material-symbols-outlined text-[17px]">logout</span>
            Sign out
          </button>
        </section>

        <section className="rounded-[22px] border border-outline-variant/45 bg-surface-container-low p-5 shadow-[0_18px_50px_rgba(56,47,33,0.07)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary-fixed px-3 py-1 text-xs font-label font-bold text-primary">
                <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                {isPro ? 'Active subscription' : 'Free plan'}
              </div>
              <h2 className="mt-3 font-headline text-2xl font-bold leading-tight text-on-surface" style={{ letterSpacing: '-0.025em' }}>
                {isPro ? 'HackProduct Pro' : 'Free workspace'}
              </h2>
              <p className="mt-1 text-sm font-body capitalize text-on-surface-variant">
                {isPro ? `${interval} · ${statusLabel}` : 'Monthly free practice limits'}
              </p>
            </div>

            {!isPro && (
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-upgrade-modal'))}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-label font-bold text-on-primary transition-opacity hover:opacity-95 active:scale-[0.98]"
              >
                Upgrade
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            )}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-background/75 px-4 py-3">
              <p className="font-label text-[10px] font-extrabold uppercase tracking-[0.12em] text-on-surface-variant">Current</p>
              <p className="mt-2 text-sm font-body font-semibold text-on-surface">
                {isPro ? `${interval}${currentPrice ? ` · ${currentPrice}/${subscription?.billing_interval === 'year' ? 'yr' : 'mo'}` : ''}` : 'Free · $0'}
              </p>
            </div>
            <div className="rounded-2xl bg-background/75 px-4 py-3">
              <p className="font-label text-[10px] font-extrabold uppercase tracking-[0.12em] text-on-surface-variant">Next billing</p>
              <p className="mt-2 text-sm font-body font-semibold text-on-surface">{isPro ? periodEndLabel : 'None'}</p>
            </div>
            <div className="rounded-2xl bg-background/75 px-4 py-3">
              <p className="font-label text-[10px] font-extrabold uppercase tracking-[0.12em] text-on-surface-variant">Switch price</p>
              <p className="mt-2 text-sm font-body font-semibold text-on-surface">
                {isPro && switchPrice ? `${switchPrice}/${switchInterval === 'year' ? 'yr' : 'mo'}` : upgradePrice ? `${upgradePrice}/mo` : 'Loading'}
              </p>
            </div>
          </div>

          <div className="mt-5">
            <FreemiumUsageSummary plan={plan} />
          </div>

          {cancelScheduled && (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-[#f3e2b9]/55 px-4 py-3 text-sm font-body text-on-surface">
              Pro remains active until {periodEndLabel}, then your account moves to Free.
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            {isPro ? (
              <>
                <button
                  onClick={openBillingPortal}
                  disabled={!!billingAction}
                  className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-label font-bold text-on-primary transition-opacity hover:opacity-95 disabled:opacity-60 active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-[17px]">account_balance_wallet</span>
                  {billingAction === 'portal' ? 'Opening billing' : 'Manage billing'}
                </button>
                <button
                  onClick={() => runBillingAction('change-plan', { plan: switchPlan })}
                  disabled={!!billingAction || reauthRequest !== null}
                  className="inline-flex items-center gap-2 rounded-2xl border border-outline-variant/70 px-4 py-3 text-sm font-label font-bold text-on-surface transition-colors hover:bg-background disabled:opacity-60 active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-[17px]">sync_alt</span>
                  Switch to {switchPlan} {switchPrice ? `(${switchPrice}/${switchInterval === 'year' ? 'yr' : 'mo'})` : ''}
                </button>
                {cancelScheduled ? (
                  <button
                    onClick={() => runBillingAction('reactivate')}
                    disabled={!!billingAction || reauthRequest !== null}
                    className="inline-flex items-center gap-2 rounded-2xl border border-outline-variant/70 px-4 py-3 text-sm font-label font-bold text-on-surface transition-colors hover:bg-background disabled:opacity-60 active:scale-[0.98]"
                  >
                    <span className="material-symbols-outlined text-[17px]">restart_alt</span>
                    Keep Pro
                  </button>
                ) : (
                  <button
                    onClick={() => runBillingAction('cancel')}
                    disabled={!!billingAction || reauthRequest !== null}
                    className="inline-flex items-center gap-2 rounded-2xl border border-outline-variant/70 px-4 py-3 text-sm font-label font-bold text-on-surface-variant transition-colors hover:bg-background hover:text-on-surface disabled:opacity-60 active:scale-[0.98]"
                  >
                    <span className="material-symbols-outlined text-[17px]">event_busy</span>
                    Cancel at renewal
                  </button>
                )}
              </>
            ) : (
              upgradePrice && (
                <p className="text-sm font-body text-on-surface-variant">
                  Pro starts at {upgradePrice}/mo. Prices are fetched from Stripe when this page loads.
                </p>
              )
            )}
          </div>

          {billingError && (
            <p className="mt-3 rounded-xl bg-error/10 px-3 py-2 text-sm font-body text-error">{billingError}</p>
          )}

          <div className="mt-6 border-t border-outline-variant/45 pt-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-label text-[10px] font-extrabold uppercase tracking-[0.12em] text-error">Danger zone</p>
                <p className="mt-1 text-sm font-body font-semibold text-on-surface">Delete your account</p>
              </div>
              <button
                type="button"
                onClick={() => setDeleteDialogOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-error/45 px-4 py-3 text-sm font-label font-bold text-error transition-colors hover:bg-error/10 active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[17px]">delete_forever</span>
                Delete my account
              </button>
            </div>
          </div>
        </section>
      </div>

      {deleteDialogOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 px-4">
          <form
            onSubmit={handleDeleteAccount}
            className="w-full max-w-[460px] rounded-[22px] border border-error/35 bg-background p-5 shadow-[0_24px_70px_rgba(20,18,14,0.28)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
          >
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-error/10 text-[20px] text-error" style={{ fontVariationSettings: "'FILL' 1" }}>
                warning
              </span>
              <div>
                <h2 id="delete-account-title" className="font-headline text-xl font-bold leading-tight text-on-surface">
                  Delete account
                </h2>
                <p className="mt-1 text-sm font-body leading-relaxed text-on-surface-variant">
                  This permanently removes your account and connected profile data.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="space-y-1.5">
                <label htmlFor="delete-email" className="block text-xs font-label font-bold text-on-surface-variant">
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
                  className={passwordInputClass}
                  placeholder={email ?? 'name@example.com'}
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="delete-confirmation" className="block text-xs font-label font-bold text-on-surface-variant">
                  Type DELETE
                </label>
                <input
                  id="delete-confirmation"
                  value={deleteConfirmation}
                  onChange={e => {
                    setDeleteConfirmation(e.target.value)
                    setDeleteError(null)
                  }}
                  className={passwordInputClass}
                  placeholder="DELETE"
                />
              </div>
            </div>

            {deleteError && (
              <p className="mt-3 rounded-xl bg-error/10 px-3 py-2 text-sm font-body text-error">{deleteError}</p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeDeleteDialog}
                disabled={deleteSaving}
                className="rounded-2xl border border-outline-variant/70 px-4 py-2.5 text-sm font-label font-bold text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={deleteSaving}
                className="rounded-2xl bg-error px-4 py-2.5 text-sm font-label font-bold text-white transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
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
        <p className="text-[10px] text-on-surface-variant/45 font-label uppercase tracking-widest">HackProduct · Sunboy Labs</p>
        <div className="flex gap-4">
          <Link href="/privacy" className="text-[10px] text-on-surface-variant/45 font-label transition-colors hover:text-on-surface-variant">Privacy</Link>
          <Link href="/terms" className="text-[10px] text-on-surface-variant/45 font-label transition-colors hover:text-on-surface-variant">Terms</Link>
          <a href="https://status.hackproduct.com" target="_blank" rel="noopener noreferrer" className="text-[10px] text-on-surface-variant/45 font-label transition-colors hover:text-on-surface-variant">Status</a>
        </div>
      </footer>
    </main>
  )
}

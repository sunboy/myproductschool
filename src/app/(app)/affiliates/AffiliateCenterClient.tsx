'use client'

import { useEffect, useMemo, useState } from 'react'

type AffiliatePartner = {
  id: string
  slug: string
  displayName: string
  email: string | null
  commissionBps: number
  status: string
  stripeAccountStatus: string
  hasStripeAccount: boolean
  referralUrl: string
}

type AffiliatePayload = {
  partner: AffiliatePartner | null
  stats: {
    clicks: number
    referrals: number
    commissions: {
      currency: string
      paid: number
      ready: number
      pending: number
      failed: number
    }
  }
  autopayoutsEnabled: boolean
  defaultCommissionBps: number
  onboardingUrl?: string
}

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

function formatCommission(bps: number) {
  return `${Math.round(bps / 100)}%`
}

function suggestedSlug() {
  return `partner-${Math.random().toString(36).slice(2, 8)}`
}

export function AffiliateCenterClient() {
  const [payload, setPayload] = useState<AffiliatePayload | null>(null)
  const [slug, setSlug] = useState('')
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/affiliates/connect')
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error ?? 'Could not load affiliate center')
      setPayload(data)
      if (data.partner?.slug) setSlug(data.partner.slug)
      else setSlug(suggestedSlug())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load affiliate center')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh().catch(() => {})
  }, [])

  const partner = payload?.partner ?? null
  const commissionBps = partner?.commissionBps ?? payload?.defaultCommissionBps ?? 2000
  const commissionLabel = formatCommission(commissionBps)
  const payoutStatus = useMemo(() => {
    if (!partner?.hasStripeAccount) return 'Not connected'
    if (partner.stripeAccountStatus === 'active') return 'Ready'
    if (partner.stripeAccountStatus === 'restricted') return 'Needs info'
    if (partner.stripeAccountStatus === 'disabled') return 'Disabled'
    return 'Onboarding'
  }, [partner])

  async function connect() {
    setConnecting(true)
    setError(null)
    try {
      const res = await fetch('/api/affiliates/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error ?? 'Could not start Stripe onboarding')
      setPayload(data)
      if (data.onboardingUrl) window.location.href = data.onboardingUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start Stripe onboarding')
    } finally {
      setConnecting(false)
    }
  }

  async function copyReferralLink() {
    if (!partner?.referralUrl) return
    await navigator.clipboard.writeText(partner.referralUrl)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <main className="mx-auto max-w-[1120px] px-4 py-7 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-label text-[11px] font-extrabold uppercase tracking-[0.14em] text-on-surface-variant">
            Growth
          </p>
          <h1 className="mt-1 font-headline text-[32px] font-bold leading-none text-on-surface" style={{ letterSpacing: '-0.03em' }}>
            Affiliate Center
          </h1>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-outline-variant/50 bg-surface-container-low px-3 py-1.5 text-xs font-label font-bold text-on-surface-variant">
          <span className="material-symbols-outlined text-[15px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
            payments
          </span>
          {commissionLabel} recurring commission
        </div>
      </div>

      <section className="rounded-[22px] border border-outline-variant/45 bg-surface-container-low p-5 shadow-[0_18px_50px_rgba(56,47,33,0.07)]">
        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-fixed px-3 py-1 text-xs font-label font-bold text-primary">
              <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>handshake</span>
              {partner ? partner.slug : 'Create link'}
            </div>

            <h2 className="mt-4 font-headline text-3xl font-bold leading-tight text-on-surface" style={{ letterSpacing: '-0.025em' }}>
              Promote HackProduct
            </h2>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl bg-background/75 px-4 py-3">
                <p className="font-label text-[10px] font-extrabold uppercase tracking-[0.12em] text-on-surface-variant">Clicks</p>
                <p className="mt-2 font-headline text-2xl font-bold text-on-surface">{payload?.stats.clicks ?? 0}</p>
              </div>
              <div className="rounded-2xl bg-background/75 px-4 py-3">
                <p className="font-label text-[10px] font-extrabold uppercase tracking-[0.12em] text-on-surface-variant">Referrals</p>
                <p className="mt-2 font-headline text-2xl font-bold text-on-surface">{payload?.stats.referrals ?? 0}</p>
              </div>
              <div className="rounded-2xl bg-background/75 px-4 py-3">
                <p className="font-label text-[10px] font-extrabold uppercase tracking-[0.12em] text-on-surface-variant">Ready</p>
                <p className="mt-2 font-headline text-2xl font-bold text-on-surface">
                  {formatMoney(payload?.stats.commissions.ready ?? 0, payload?.stats.commissions.currency ?? 'usd')}
                </p>
              </div>
              <div className="rounded-2xl bg-background/75 px-4 py-3">
                <p className="font-label text-[10px] font-extrabold uppercase tracking-[0.12em] text-on-surface-variant">Paid</p>
                <p className="mt-2 font-headline text-2xl font-bold text-on-surface">
                  {formatMoney(payload?.stats.commissions.paid ?? 0, payload?.stats.commissions.currency ?? 'usd')}
                </p>
              </div>
            </div>

            {partner?.referralUrl && (
              <div className="mt-5 rounded-2xl bg-background/75 p-3">
                <p className="mb-2 font-label text-[10px] font-extrabold uppercase tracking-[0.12em] text-on-surface-variant">Referral link</p>
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
                  <input
                    readOnly
                    value={partner.referralUrl}
                    className="min-w-0 flex-1 rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm font-body font-semibold text-on-surface focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={copyReferralLink}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-label font-bold text-on-primary transition-opacity hover:opacity-95 active:scale-[0.98]"
                  >
                    <span className="material-symbols-outlined text-[17px]">{copied ? 'check' : 'content_copy'}</span>
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <aside className="rounded-[20px] border border-outline-variant/50 bg-background/70 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-label text-[10px] font-extrabold uppercase tracking-[0.12em] text-on-surface-variant">Payouts</p>
                <h3 className="mt-2 font-headline text-2xl font-bold text-on-surface">{payoutStatus}</h3>
              </div>
              <span className="material-symbols-outlined text-2xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                account_balance_wallet
              </span>
            </div>

            <div className="mt-5 space-y-3">
              <label className="block">
                <span className="mb-1 block font-label text-[10px] font-extrabold uppercase tracking-[0.12em] text-on-surface-variant">
                  Link code
                </span>
                <input
                  value={slug}
                  onChange={event => setSlug(event.target.value)}
                  disabled={!!partner}
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm font-body font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-65"
                  placeholder="your-name"
                />
              </label>

              <div className="grid grid-cols-2 gap-2 text-sm font-body">
                <div className="rounded-xl bg-surface-container-low px-3 py-2">
                  <p className="font-label text-[10px] font-extrabold uppercase tracking-[0.12em] text-on-surface-variant">Transfer mode</p>
                  <p className="mt-1 font-semibold text-on-surface">{payload?.autopayoutsEnabled ? 'Automatic' : 'Manual review'}</p>
                </div>
                <div className="rounded-xl bg-surface-container-low px-3 py-2">
                  <p className="font-label text-[10px] font-extrabold uppercase tracking-[0.12em] text-on-surface-variant">Pending</p>
                  <p className="mt-1 font-semibold text-on-surface">
                    {formatMoney(payload?.stats.commissions.pending ?? 0, payload?.stats.commissions.currency ?? 'usd')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={connect}
                disabled={connecting || loading || slug.trim().length < 3}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-label font-bold text-on-primary transition-opacity hover:opacity-95 disabled:opacity-60 active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[17px]">open_in_new</span>
                {partner?.hasStripeAccount ? 'Resume Stripe onboarding' : 'Connect Stripe payouts'}
              </button>
            </div>
          </aside>
        </div>
      </section>

      {loading && (
        <p className="mt-4 rounded-2xl bg-surface-container-low px-4 py-3 text-sm font-body text-on-surface-variant">
          Loading affiliate center...
        </p>
      )}

      {error && (
        <p className="mt-4 rounded-2xl bg-error/10 px-4 py-3 text-sm font-body text-error">
          {error}
        </p>
      )}
    </main>
  )
}

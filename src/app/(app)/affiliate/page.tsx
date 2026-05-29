'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'

type Affiliate = {
  id: string
  code: string
  status: 'pending' | 'active' | 'disabled'
  connectStatus: 'not_started' | 'created' | 'onboarding' | 'active' | 'restricted' | 'disabled'
  connectRequirements: Record<string, unknown>
  connectFutureRequirements: Record<string, unknown>
  connectCapabilities: Record<string, unknown>
  commissionPct: number
  hasStripeAccount: boolean
  shareUrl: string
  createdAt: string
}

type AffiliateStats = {
  clickCount: number
  pendingCents: number
  paidCents: number
}

type AffiliateResponse = {
  affiliate: Affiliate | null
  stats: AffiliateStats
  onboardingUrl?: string | null
  error?: string
}

const AFFILIATES_ENABLED = process.env.NEXT_PUBLIC_ENABLE_AFFILIATES === 'true'

function formatMoney(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function statusCopy(affiliate: Pick<Affiliate, 'status' | 'connectStatus'>) {
  if (affiliate.status === 'active') return 'Active'
  if (affiliate.status === 'disabled' || affiliate.connectStatus === 'disabled') return 'Disabled'
  if (affiliate.connectStatus === 'restricted') return 'Needs info'
  return 'Onboarding'
}

function MetricCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: string
  label: string
  value: string
  detail: string
}) {
  return (
    <div className="rounded-lg border border-outline-variant bg-surface-container-low p-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-bold uppercase text-on-surface-variant">{label}</p>
        <span className="material-symbols-outlined text-[20px] text-primary">{icon}</span>
      </div>
      <p className="mt-4 text-3xl font-black text-on-surface">{value}</p>
      <p className="mt-1 text-sm text-on-surface-variant">{detail}</p>
    </div>
  )
}

export default function AffiliatePage() {
  const [data, setData] = useState<AffiliateResponse | null>(null)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const affiliate = data?.affiliate ?? null
  const stats = data?.stats ?? { clickCount: 0, pendingCents: 0, paidCents: 0 }
  const totalCents = stats.pendingCents + stats.paidCents

  const codePreview = useMemo(() => code.trim().toUpperCase(), [code])

  useEffect(() => {
    if (!AFFILIATES_ENABLED) {
      setLoading(false)
      return
    }

    let ignore = false
    fetch('/api/affiliate/signup', { cache: 'no-store' })
      .then(async response => {
        const body = await response.json()
        if (!response.ok) throw new Error(body.error ?? 'Could not load affiliate dashboard.')
        if (!ignore) setData(body)
      })
      .catch(err => {
        if (!ignore) setError(err instanceof Error ? err.message : 'Could not load affiliate dashboard.')
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [])

  async function submitSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setCreating(true)

    try {
      const response = await fetch('/api/affiliate/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codePreview || undefined }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error ?? 'Could not create affiliate account.')
      setData(body)
      if (body.onboardingUrl) window.location.assign(body.onboardingUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create affiliate account.')
    } finally {
      setCreating(false)
    }
  }

  async function continueOnboarding() {
    setError(null)
    setCreating(true)
    try {
      const response = await fetch('/api/affiliate/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error ?? 'Could not start Stripe onboarding.')
      setData(body)
      if (body.onboardingUrl) window.location.assign(body.onboardingUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start Stripe onboarding.')
    } finally {
      setCreating(false)
    }
  }

  async function copyLink() {
    if (!affiliate?.shareUrl) return
    await navigator.clipboard?.writeText(affiliate.shareUrl)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  if (!AFFILIATES_ENABLED) {
    return (
      <div className="mx-auto max-w-[720px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-outline-variant bg-background p-6">
          <p className="text-xs font-black uppercase text-primary">Affiliate Program</p>
          <h1 className="mt-2 text-3xl font-black text-on-surface">Referral commissions are unavailable</h1>
          <p className="mt-3 text-sm leading-6 text-on-surface-variant">
            Affiliate onboarding is closed while payout setup is being finalized.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-5 border-b border-outline-variant pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase text-primary">Affiliate Program</p>
          <h1 className="mt-2 text-3xl font-black text-on-surface sm:text-4xl">Referral commissions</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">
            Earn {affiliate?.commissionPct ?? 20}% when your referral becomes a paid Pro subscriber.
          </p>
        </div>
        {affiliate && (
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-outline-variant bg-surface-container-low px-3 py-2 text-sm font-bold text-on-surface">
            <span className="material-symbols-outlined text-[18px] text-primary">
              {affiliate.status === 'active' ? 'verified' : 'pending'}
            </span>
            {statusCopy(affiliate)}
          </div>
        )}
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm font-semibold text-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {['Clicks', 'Pending', 'Paid'].map(label => (
            <div key={label} className="h-32 animate-pulse rounded-lg bg-surface-container-low" />
          ))}
        </div>
      ) : affiliate ? (
        <>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <MetricCard
              icon="ads_click"
              label="Referral clicks"
              value={stats.clickCount.toLocaleString()}
              detail={`Tracking started ${formatDate(affiliate.createdAt)}`}
            />
            <MetricCard
              icon="hourglass_top"
              label="Pending payout"
              value={formatMoney(stats.pendingCents)}
              detail="Eligible for the next monthly run"
            />
            <MetricCard
              icon="payments"
              label="Lifetime paid"
              value={formatMoney(stats.paidCents)}
              detail={`${formatMoney(totalCents)} total attributed`}
            />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_.8fr]">
            <section className="rounded-lg border border-outline-variant bg-background p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase text-on-surface-variant">Share link</p>
                  <p className="mt-2 break-all text-lg font-black text-on-surface">{affiliate.shareUrl}</p>
                </div>
                <button
                  type="button"
                  onClick={copyLink}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-on-primary transition-opacity hover:opacity-90"
                >
                  <span className="material-symbols-outlined text-[18px]">{copied ? 'done' : 'content_copy'}</span>
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </section>

            <section className="rounded-lg border border-outline-variant bg-surface-container-low p-5">
              <p className="text-xs font-bold uppercase text-on-surface-variant">Stripe Connect</p>
              <p className="mt-2 text-xl font-black text-on-surface">{statusCopy(affiliate)}</p>
              <p className="mt-1 text-xs font-bold uppercase text-on-surface-variant">
                Account status: {affiliate.connectStatus.replace(/_/g, ' ')}
              </p>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                {affiliate.status === 'active'
                  ? 'Transfers are enabled for monthly commission payouts.'
                  : 'Finish onboarding before commissions can be transferred.'}
              </p>
              {affiliate.status !== 'active' && (
                <button
                  type="button"
                  onClick={continueOnboarding}
                  disabled={creating}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-on-surface px-4 py-2.5 text-sm font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                  {creating ? 'Opening Stripe' : 'Continue onboarding'}
                </button>
              )}
            </section>
          </div>
        </>
      ) : (
        <section className="mt-8 rounded-lg border border-outline-variant bg-background p-6">
          <form onSubmit={submitSignup} className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <label htmlFor="affiliate-code" className="text-xs font-bold uppercase text-on-surface-variant">
                Affiliate code
              </label>
              <input
                id="affiliate-code"
                value={code}
                onChange={event => setCode(event.target.value)}
                placeholder="YOUR-CODE"
                className="mt-2 w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 text-lg font-black uppercase text-on-surface outline-none transition-colors focus:border-primary"
                maxLength={24}
              />
              <p className="mt-2 text-sm text-on-surface-variant">
                {codePreview || 'Leave blank to generate one from your profile.'}
              </p>
            </div>
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-on-primary transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[18px]">handshake</span>
              {creating ? 'Opening Stripe' : 'Create affiliate account'}
            </button>
          </form>
        </section>
      )}
    </div>
  )
}

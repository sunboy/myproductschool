'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type SubscriptionInfo = {
  status?: string | null
  current_period_end?: string | null
  billing_interval?: 'month' | 'year' | null
  cancel_at_period_end?: boolean | null
  cancel_at?: string | null
}

type ProfileResponse = {
  plan?: string
  subscription?: SubscriptionInfo | null
}

type BillingPrices = {
  monthly?: { formatted?: string | null }
  annual?: { formatted?: string | null }
}

function formatDate(value?: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export default function BillingSettingsPage() {
  const [plan, setPlan] = useState<string>('free')
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [prices, setPrices] = useState<BillingPrices | null>(null)

  useEffect(() => {
    fetch('/api/billing/prices')
      .then(r => r.ok ? r.json() : null)
      .then((data: BillingPrices | null) => setPrices(data))
      .catch(() => {})
    fetch('/api/profile')
      .then(r => r.ok ? r.json() : null)
      .then((data: ProfileResponse | null) => {
        if (!data) return
        if (data.plan) setPlan(data.plan)
        setSubscription(data.subscription ?? null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function openPortal() {
    const portalWindow = window.open('about:blank', '_blank')
    if (portalWindow) portalWindow.opener = null

    setPortalLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? 'Could not open billing portal.')
      }
      if (portalWindow) {
        portalWindow.location.href = data.url
      } else {
        window.location.assign(data.url)
      }
    } catch (err) {
      if (portalWindow) portalWindow.close()
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setPortalLoading(false)
    }
  }

  const isPro = plan === 'pro'
  const interval = subscription?.billing_interval === 'year' ? 'Annual' : 'Monthly'
  const priceFormatted = subscription?.billing_interval === 'year'
    ? prices?.annual?.formatted
    : prices?.monthly?.formatted
  const price = priceFormatted
    ? `${priceFormatted}/${subscription?.billing_interval === 'year' ? 'yr' : 'mo'}`
    : null
  const nextBillingDate = formatDate(subscription?.current_period_end)
  const cancelScheduled = !!subscription?.cancel_at_period_end
  const cancelDate = formatDate(subscription?.cancel_at ?? subscription?.current_period_end)

  return (
    <div className="max-w-xl">
      <h2 className="font-headline text-xl text-on-surface mb-1">Billing</h2>
      <p className="text-sm font-body text-on-surface-variant mb-6">
        Manage your subscription, payment method, and invoices.
      </p>

      {/* Current plan card */}
      <div className="bg-surface-container rounded-xl p-6 border border-outline-variant mb-4">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="font-label text-[10px] font-extrabold uppercase tracking-[0.12em] text-on-surface-variant mb-1.5">
              Current plan
            </p>
            {loading ? (
              <div className="h-5 w-24 rounded-full bg-surface-container-highest animate-pulse" />
            ) : isPro ? (
              <span className="inline-flex items-center gap-1.5 bg-primary text-on-primary rounded-full px-3 py-1 text-xs font-label font-semibold">
                <span
                  className="material-symbols-outlined text-[13px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  workspace_premium
                </span>
                Pro
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-surface-container-high text-on-surface rounded-full px-3 py-1 text-xs font-label font-semibold">
                Free
              </span>
            )}
          </div>

          {isPro && !loading && price && (
            <div className="text-right">
              <p className="font-label text-[10px] font-extrabold uppercase tracking-[0.12em] text-on-surface-variant mb-1">
                Price
              </p>
              <p className="text-sm font-body font-semibold text-on-surface">{price}</p>
            </div>
          )}
        </div>

        {isPro && !loading && (
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="rounded-2xl bg-background/70 px-4 py-3">
              <p className="font-label text-[10px] font-extrabold uppercase tracking-[0.12em] text-on-surface-variant">
                Billing
              </p>
              <p className="mt-1.5 text-sm font-body font-semibold text-on-surface">{interval}</p>
            </div>
            <div className="rounded-2xl bg-background/70 px-4 py-3">
              <p className="font-label text-[10px] font-extrabold uppercase tracking-[0.12em] text-on-surface-variant">
                {cancelScheduled ? 'Cancels on' : 'Next billing'}
              </p>
              <p className="mt-1.5 text-sm font-body font-semibold text-on-surface">
                {nextBillingDate ?? 'Not available'}
              </p>
            </div>
          </div>
        )}

        {cancelScheduled && cancelDate && !loading && (
          <div className="mb-5 flex items-start gap-2 rounded-2xl border border-amber-200 bg-[#f3e2b9]/55 px-4 py-3 text-sm font-body text-on-surface">
            <span className="material-symbols-outlined text-base text-tertiary mt-0.5 shrink-0">
              event_busy
            </span>
            Pro remains active until {cancelDate}, then your account moves to Free.
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-sm font-body text-on-surface-variant">
            {isPro
              ? 'Update payment method, cancel, or view invoices'
              : 'Invoices and payment method are managed through Stripe'}
          </div>
          {isPro && (
            <button
              onClick={openPortal}
              disabled={portalLoading || loading}
              className="inline-flex items-center gap-2 bg-primary text-on-primary rounded-full px-5 py-2 text-sm font-label font-semibold disabled:opacity-60 hover:opacity-90 transition-opacity shrink-0 ml-4"
            >
              <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
              {portalLoading ? 'Opening…' : 'Manage billing'}
            </button>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-error/10 border border-error/20 rounded-lg text-sm font-body text-error">
            {error}
          </div>
        )}
      </div>

      {/* Free upgrade nudge */}
      {!isPro && !loading && (
        <div className="bg-surface-container rounded-xl p-6 border border-outline-variant">
          <div className="flex items-start gap-4">
            <span
              className="material-symbols-outlined text-2xl text-primary shrink-0 mt-0.5"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              workspace_premium
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-label font-semibold text-on-surface mb-1">Ready to go further?</p>
              <p className="text-sm font-body text-on-surface-variant mb-4">
                Unlimited challenges, unlimited live interviews, and priority Hatch coaching
                {prices?.monthly?.formatted ? `, starting at ${prices.monthly.formatted}/mo` : ''}.
              </p>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 bg-primary text-on-primary rounded-full px-5 py-2 text-sm font-label font-semibold hover:opacity-90 transition-opacity"
              >
                See pricing
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

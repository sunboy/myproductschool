'use client'

import { LearningPageHeading } from '@/components/redesign/LearningPageHeading'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { usePlanLimits } from '@/lib/usage/use-plan-limits'
import { scheduledCancellationState } from '@/lib/billing/subscription-cancellation'

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
  const { pro } = usePlanLimits()
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
      if (res.status >= 500) throw new Error('Billing is temporarily unavailable. Please try again shortly. Your membership has not changed.')
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
  const cancellation = scheduledCancellationState(subscription)
  const cancelScheduled = cancellation.scheduled
  const cancelDate = formatDate(cancellation.endsAt)

  return (
    <main className="learning-account mx-auto max-w-[720px] px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      <Link href="/settings" className="inline-flex min-h-11 items-center gap-2 text-sm text-ink-secondary"><ArrowLeft size={16} /> Account settings</Link>
      <LearningPageHeading eyebrow="Membership" title="Your plan and billing.">Manage your subscription, payment method, and invoices.</LearningPageHeading>

      {/* Current plan card */}
      <div className="mb-4 rounded-2xl border border-hairline bg-card-bright p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="mb-1.5 font-label text-[10px] font-extrabold uppercase tracking-[0.08em] text-ink-secondary">
              Current plan
            </p>
            {loading ? (
              <div className="h-5 w-24 animate-pulse rounded-full bg-page-field" />
            ) : isPro ? (
              <span className="inline-flex items-center rounded-full border-[1.5px] border-gold bg-note-amber px-3 py-1 font-label text-xs font-bold text-forest-800">
                Pro
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full border border-hairline bg-page-field px-3 py-1 font-label text-xs font-bold text-ink-secondary">
                Free
              </span>
            )}
          </div>

          {isPro && !loading && price && (
            <div className="text-right">
              <p className="mb-1 font-label text-[10px] font-extrabold uppercase tracking-[0.08em] text-ink-secondary">
                Price
              </p>
              <p className="font-body text-sm font-bold tabular-nums text-ink-strong">{price}</p>
            </div>
          )}
        </div>

        {isPro && !loading && (
          <div className="mb-4 grid grid-cols-2 divide-x divide-hairline rounded-[12px] border border-hairline">
            <div className="px-4 py-3">
              <p className="font-label text-[10px] font-extrabold uppercase tracking-[0.08em] text-ink-secondary">
                Billing
              </p>
              <p className="mt-1.5 font-body text-sm font-bold text-ink-strong">{interval}</p>
            </div>
            <div className="px-4 py-3">
              <p className="font-label text-[10px] font-extrabold uppercase tracking-[0.08em] text-ink-secondary">
                {cancelScheduled ? 'Cancels on' : 'Next billing'}
              </p>
              <p className="mt-1.5 font-body text-sm font-bold tabular-nums text-ink-strong">
                {nextBillingDate ?? 'Not available'}
              </p>
            </div>
          </div>
        )}

        {cancelScheduled && cancelDate && !loading && (
          <div className="note-amber mb-4 px-4 py-3 font-body text-sm text-ink-strong">
            Pro remains active until {cancelDate}, then your account moves to Free.
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <p className="font-body text-[13px] text-ink-secondary">
            {isPro
              ? 'Update payment method, cancel, or view invoices'
              : 'Invoices and payment method are managed through Stripe'}
          </p>
          {isPro && (
            <button
              onClick={openPortal}
              disabled={portalLoading || loading}
              className="inline-flex shrink-0 items-center gap-2 rounded-[10px] bg-forest-950 px-4 py-2.5 font-label text-sm font-bold text-white transition-colors hover:bg-forest-900 active:scale-[0.98] disabled:opacity-60"
            >
              {portalLoading ? 'Opening' : 'Manage billing'}
            </button>
          )}
        </div>

        {error && (
          <p className="mt-4 rounded-[8px] bg-error/10 px-3 py-2 font-body text-sm text-error">
            {error}
          </p>
        )}
      </div>

      {/* Free upgrade path — plan management surface, live limits only */}
      {!isPro && !loading && (
        <div
          className="flex flex-col gap-3 rounded-2xl px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
          style={{ background: 'linear-gradient(120deg, #052316 0%, #123b20 78%, #1e472d 100%)' }}
        >
          <div>
            <p className="font-headline text-[18px] font-semibold text-white">HackProduct Pro</p>
            <p className="mt-0.5 font-body text-[12.5px] tabular-nums text-white/65">
              {pro.challenges} challenge starts and {pro.interviews} interview starts a month
              {prices?.monthly?.formatted ? `, from ${prices.monthly.formatted}/mo` : ''}.
            </p>
          </div>
          <Link
            href="/pricing"
            className="inline-flex w-fit shrink-0 items-center gap-2 rounded-[10px] bg-white px-4 py-2.5 font-label text-sm font-bold text-forest-950 transition-opacity hover:opacity-90"
          >
            See pricing
            <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
          </Link>
        </div>
      )}
    </main>
  )
}

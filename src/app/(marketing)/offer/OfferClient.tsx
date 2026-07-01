'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { trackEvent } from '@/lib/posthog/client'
import { EVENT_CHECKOUT_STARTED, EVENT_PRICING_VIEWED } from '@/lib/posthog/events'
import { BILLING_PLANS, formatPlanPrice } from '@/lib/billing/plans'

// The founding-member offer is promo-agnostic on purpose. It is NOT a new
// Stripe price. Founding pricing = the existing monthly plan plus a percent-off
// promotion code created out-of-band with scripts/billing/create-promo.ts
// (allow_promotion_codes is already on at checkout, so the code works the moment
// the script succeeds, no deploy). The secondary CTA below deep-links to
// /pricing?plan=monthly&checkout=1, which PricingClient reads on mount to resume
// checkout straight into Stripe. Users apply the founding code on that page.
const FOUNDING_CHECKOUT_HREF = '/pricing?plan=monthly&checkout=1'

// Live monthly price shape returned by /api/billing/prices. We read the ACTIVE
// price at runtime so the number here follows Stripe, never a hardcoded dollar
// figure. The static plan config is only a first-paint fallback.
interface LiveMonthlyPrice {
  formatted: string | null
  interval: 'month' | 'year'
}

function isLiveMonthlyPrice(value: unknown): value is LiveMonthlyPrice {
  if (!value || typeof value !== 'object') return false
  const price = value as Record<string, unknown>
  return (
    (typeof price.formatted === 'string' || price.formatted === null) &&
    (price.interval === 'month' || price.interval === 'year')
  )
}

type Remaining = { days: number; hours: number; minutes: number; seconds: number }

function computeRemaining(target: number): Remaining | null {
  const gap = target - Date.now()
  if (gap <= 0) return null
  return {
    days: Math.floor(gap / 86_400_000),
    hours: Math.floor((gap % 86_400_000) / 3_600_000),
    minutes: Math.floor((gap % 3_600_000) / 60_000),
    seconds: Math.floor((gap % 60_000) / 1_000),
  }
}

function CountdownCell({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex min-w-[4.5rem] flex-col items-center rounded-xl bg-surface-container px-4 py-3">
      <span className="font-headline text-3xl font-black tabular-nums text-on-surface md:text-4xl">
        {String(value).padStart(2, '0')}
      </span>
      <span className="mt-1 font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant">
        {label}
      </span>
    </div>
  )
}

interface OfferClientProps {
  /** Live free-plan monthly challenge starts, read from plan_limits server-side. */
  freeChallengeStarts: number
  /** ISO timestamp for the founding window close. */
  deadlineIso: string
}

export function OfferClient({ freeChallengeStarts, deadlineIso }: OfferClientProps) {
  const deadline = useMemo(() => new Date(deadlineIso).getTime(), [deadlineIso])
  const fallbackPrice = formatPlanPrice(BILLING_PLANS.monthly)

  const [priceFormatted, setPriceFormatted] = useState<string>(fallbackPrice)
  const [remaining, setRemaining] = useState<Remaining | null>(() =>
    Number.isFinite(deadline) ? computeRemaining(deadline) : null,
  )
  const [expired, setExpired] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  useEffect(() => {
    trackEvent(EVENT_PRICING_VIEWED, { surface: 'offer' })
  }, [])

  // Read the active monthly price live (mirrors PricingClient). Falls back to
  // the static plan config on any failure so the page still renders a number.
  useEffect(() => {
    let cancelled = false
    fetch('/api/billing/prices', { headers: { Accept: 'application/json' } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { monthly?: unknown } | null) => {
        if (cancelled || !data || !isLiveMonthlyPrice(data.monthly)) return
        if (data.monthly.formatted) setPriceFormatted(data.monthly.formatted)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!Number.isFinite(deadline)) return
    function tick() {
      const next = computeRemaining(deadline)
      if (!next) {
        setExpired(true)
        setRemaining(null)
        return
      }
      setRemaining(next)
      timer = window.setTimeout(tick, 1_000)
    }
    let timer = window.setTimeout(tick, 1_000)
    tick()
    return () => window.clearTimeout(timer)
  }, [deadline])

  async function claimFounding() {
    if (checkoutLoading) return
    setCheckoutError(null)
    setCheckoutLoading(true)
    trackEvent(EVENT_CHECKOUT_STARTED, { plan: 'monthly', surface: 'offer' })

    try {
      // Try to resume checkout directly for signed-in users. On 401 we route to
      // signup with a next= back to the founding deeplink, so the flow lands in
      // Stripe right after auth. This mirrors PricingClient's startCheckout.
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'monthly' }),
      })

      if (response.status === 401) {
        window.location.href = `/signup?next=${encodeURIComponent(FOUNDING_CHECKOUT_HREF)}`
        return
      }

      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data.url) {
        // Fall back to the pricing deeplink, which resumes checkout on mount.
        window.location.href = FOUNDING_CHECKOUT_HREF
        return
      }
      window.location.href = data.url
    } catch {
      window.location.href = FOUNDING_CHECKOUT_HREF
    }
  }

  return (
    <section className="v3-section">
      <div className="shell">
        <div className="mx-auto max-w-3xl rounded-xl bg-surface-container-low p-6 md:p-10">
          <div className="flex flex-col items-center text-center">
            <span className="rounded-full bg-primary-container px-4 py-1.5 font-label text-sm font-bold text-on-primary-container">
              First 100 engineers
            </span>
            <h2 className="mt-5 font-headline text-3xl font-black text-on-surface md:text-4xl">
              Founding member price
            </h2>
            <p className="mt-3 max-w-xl font-body text-on-surface-variant">
              Lock the founding rate on Pro before it goes up. The price you claim now is the
              price you keep. When the window closes, new members pay the standard {priceFormatted}
              {' '}per month.
            </p>

            {expired ? (
              <div className="mt-8 rounded-xl bg-surface-container px-6 py-4">
                <p className="font-headline text-xl font-black text-on-surface">
                  The founding window has closed.
                </p>
                <p className="mt-1 font-body text-sm text-on-surface-variant">
                  Standard Pro is still the fastest way to train. Start free and upgrade when
                  the reps become a habit.
                </p>
              </div>
            ) : remaining ? (
              <div
                className="mt-8 flex items-center gap-2 md:gap-3"
                role="timer"
                aria-label="Founding price window closes in"
              >
                <CountdownCell value={remaining.days} label="days" />
                <CountdownCell value={remaining.hours} label="hrs" />
                <CountdownCell value={remaining.minutes} label="min" />
                <CountdownCell value={remaining.seconds} label="sec" />
              </div>
            ) : (
              <div className="mt-8 h-[5.5rem]" aria-hidden />
            )}

            <div className="v3-page-hero-cta mt-9 justify-center">
              <Link href="/signup" className="btn btn-primary">
                Start free <span aria-hidden>→</span>
              </Link>
              <button
                type="button"
                onClick={claimFounding}
                disabled={checkoutLoading || expired}
                className="btn btn-amber"
              >
                {checkoutLoading ? 'Opening Stripe...' : 'Claim founding price'}{' '}
                <span aria-hidden>→</span>
              </button>
            </div>

            <p className="mt-4 font-label text-sm text-on-surface-variant">
              Start free means no card. {freeChallengeStarts} challenge starts every month, then
              claim the founding rate whenever practice becomes weekly.
            </p>

            {checkoutError ? (
              <p role="alert" className="mt-3 font-body text-sm text-error">
                {checkoutError}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}

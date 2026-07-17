'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js'
import { ArrowLeft, Check, X } from 'lucide-react'
import { HatchImage } from '@/components/redesign/HatchImage'
import {
  BILLING_PLANS,
  ANALYTICS_PLANS,
  annualSavingsPercent,
  annualAnalyticsSavingsPercent,
  formatMonthlyEquivalent,
  formatPlanPrice,
  type AnyPlanId,
  type BillingPlanConfig,
} from '@/lib/billing/plans'
import { usePlanLimits } from '@/lib/usage/use-plan-limits'
import { trackEvent } from '@/lib/posthog/client'
import { EVENT_CHECKOUT_STARTED, EVENT_PAYWALL_SHOWN, EVENT_PAYWALL_DISMISSED, EVENT_UPGRADE_CLICKED } from '@/lib/posthog/events'

// ── The single paywall modal for the whole app ──────────────────────────────
// Every upgrade surface routes through this: limit-hit gates (challenges,
// interviews, Hatch coaching), entitlement gates (Claude Code Analytics), and
// the proactive "Upgrade to Pro" entry points (settings, nav, dashboard nudge).
// It shows plan selection (monthly/annual toggle + the right tier's features),
// then an embedded Stripe checkout inline so the user never leaves the page.
//
// Chrome follows the Codex ref-10 pricing language: deep-forest band header,
// serif display headline, rounded-rectangle forest CTA, check-list features.
// Plan limits are threaded live via usePlanLimits — never hardcoded.

const stripePublishableKey =
  process.env.NEXT_PUBLIC_STRIPE_MODE === 'test'
    ? process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    : process.env.NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : Promise.resolve(null)

// Feature keys that sell the Claude Code Analytics tier (a Pro super-set) rather
// than plain Pro. They flip the modal to analytics plans, features, and copy.
const ANALYTICS_FEATURE_KEYS = new Set(['claude_code_analytics', 'claude_code_sessions'])

const ANALYTICS_FEATURES = [
  'Everything in Pro',
  'Live Claude Code sessions on real data',
  'BigQuery analysis with Hatch coaching',
  'Reusable skills and shareable reports',
]

function proFeatures(pro: { challenges: number; interviews: number }) {
  return [
    `${pro.challenges} challenge starts/month`,
    `${pro.interviews} AI interview starts/month`,
    'Fair-use Hatch AI budget',
    'Learner DNA, competency radar',
    'Study plans and autopsies',
    'Early access to new features',
  ]
}

// Per-feature copy. `headline` is optional — when omitted and used/limit are
// present, the modal renders a dynamic "You've used X of Y" headline instead.
const FEATURE_COPY: Record<string, { eyebrow: string; headline?: string; detail: string }> = {
  challenges: {
    eyebrow: 'HackProduct Pro',
    detail: 'Monthly limit reached. Upgrade to keep practicing.',
  },
  interviews: {
    eyebrow: 'Interview sessions',
    detail: 'Monthly limit reached. Upgrade to keep practicing.',
  },
  hatch_chat_msgs: {
    eyebrow: 'Hatch coaching limit',
    headline: 'You have used your free Hatch coaching messages.',
    detail: 'Pro keeps Hatch available across chat, reviews, and planning.',
  },
  hatch_nudges: {
    eyebrow: 'Hatch nudge limit',
    headline: 'You have used your free Hatch nudges.',
    detail: 'Pro keeps timely hints available while you work through reps.',
  },
  hatch_canvas_interprets: {
    eyebrow: 'Canvas coaching limit',
    headline: 'You have used your free Hatch canvas reviews.',
    detail: 'Pro keeps Hatch available for diagrams, schemas, and code feedback.',
  },
  simulation_turns: {
    eyebrow: 'Simulation limit',
    headline: 'You have used your free simulation turns.',
    detail: 'Pro gives you more reps for realistic interview practice.',
  },
  live_interview_turns: {
    eyebrow: 'Live interview limit',
    headline: 'You have used your free live interview turns.',
    detail: 'Pro gives you more live interview practice with Hatch.',
  },
  quick_takes: {
    eyebrow: 'Quick take limit',
    headline: 'You have used your free quick takes.',
    detail: 'Pro keeps quick feedback available for short daily reps.',
  },
  ai_grading_runs: {
    eyebrow: 'Review limit',
    headline: 'You have used your free Hatch reviews.',
    detail: 'Pro keeps grading and debriefs available across your practice.',
  },
  claude_code_analytics: {
    eyebrow: 'HackProduct Analytics',
    headline: 'Claude Code Analytics is a special tier.',
    detail: 'Live analyst sessions on real datasets, on top of everything in Pro.',
  },
  claude_code_sessions: {
    eyebrow: 'Analytics session limit',
    headline: 'You have used your analytics sessions this month.',
    detail: 'Your monthly Claude Code Analytics sessions reset on a rolling 30-day window.',
  },
}

type BillingCycle = 'monthly' | 'annual'

interface PaywallModalProps {
  open: boolean
  onClose: () => void
  /** Feature key (drives copy + which tier is sold). Omit for a generic Pro upsell. */
  feature?: string
  /** Rolling-window usage, when this is a usage-cap gate. Omit for entitlement/proactive. */
  used?: number
  limit?: number
  /** When false, hides the close affordances so the user must make a choice. Default true. */
  dismissible?: boolean
  /** Optional secondary action below the upgrade CTA (e.g. "End session & view debrief"). */
  secondaryAction?: { label: string; onClick: () => void }
}

export function PaywallModal({
  open,
  onClose,
  feature,
  used,
  limit,
  dismissible = true,
  secondaryAction,
}: PaywallModalProps) {
  const { pro } = usePlanLimits()
  const [billing, setBilling] = useState<BillingCycle>('monthly')
  const [checkoutPlan, setCheckoutPlan] = useState<AnyPlanId | null>(null)
  const [checkoutClientSecret, setCheckoutClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isAnalytics = feature ? ANALYTICS_FEATURE_KEYS.has(feature) : false
  const checkoutOpen = checkoutClientSecret != null

  const planFor = useCallback(
    (cycle: BillingCycle): BillingPlanConfig =>
      isAnalytics
        ? cycle === 'annual'
          ? ANALYTICS_PLANS.analytics_annual
          : ANALYTICS_PLANS.analytics_monthly
        : BILLING_PLANS[cycle],
    [isAnalytics],
  )

  const selectedPlan = planFor(billing)
  const annualSavings = isAnalytics ? annualAnalyticsSavingsPercent() : annualSavingsPercent()
  const monthlyEquivalent = formatMonthlyEquivalent(planFor('annual'))

  const featureList = isAnalytics ? ANALYTICS_FEATURES : proFeatures(pro)
  const featureCopy = feature ? FEATURE_COPY[feature] : null
  const eyebrow = featureCopy?.eyebrow ?? (isAnalytics ? 'HackProduct Analytics' : 'HackProduct Pro')

  const hasUsage = typeof used === 'number' && typeof limit === 'number' && limit > 0
  const headline =
    featureCopy?.headline ??
    (hasUsage ? `You've used ${used} of ${limit}.` : 'Everything in Pro, one plan.')
  const detail = featureCopy?.detail ?? 'Practice without monthly limits.'
  const progressPct = hasUsage ? Math.min((used! / limit!) * 100, 100) : 0
  const remaining = hasUsage ? Math.max(limit! - used!, 0) : 0

  const ctaLabel = isAnalytics ? 'Get Analytics' : 'Get Pro'

  // Tracks whether the user has clicked the upgrade CTA at least once during this
  // open session, so closeAll can tell a genuine dismissal apart from closing the
  // modal after checkout was already kicked off (e.g. backing out of embedded
  // checkout counts as abandoning that checkout, not dismissing the paywall pitch).
  const upgradeClickedRef = useRef(false)

  // paywall_shown: fire once per mount-with-open, carrying the same feature/used/
  // limit context the modal renders with. Reset the upgrade-clicked guard so a
  // reused modal instance (open toggled false→true again) tracks fresh state.
  useEffect(() => {
    if (!open) return
    upgradeClickedRef.current = false
    trackEvent(EVENT_PAYWALL_SHOWN, { feature, used, limit })
  }, [open, feature, used, limit])

  const closeAll = useCallback(() => {
    // paywall_dismissed: only a genuine close-without-upgrading, not a step back
    // out of an already-started checkout.
    if (!upgradeClickedRef.current) {
      trackEvent(EVENT_PAYWALL_DISMISSED, { feature, used, limit })
    }
    setCheckoutClientSecret(null)
    setCheckoutPlan(null)
    setError(null)
    onClose()
  }, [onClose, feature, used, limit])

  // Close on Escape (only when dismissible).
  useEffect(() => {
    if (!open || !dismissible) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeAll() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, dismissible, closeAll])

  // Lock body scroll while open.
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  async function handleUpgrade() {
    setLoading(true)
    setError(null)
    const planId = selectedPlan.id
    upgradeClickedRef.current = true
    trackEvent(EVENT_UPGRADE_CLICKED, { feature, plan: planId })
    // Fire checkout_started here — this modal is the dominant in-app upgrade surface,
    // and it previously emitted nothing, so the funnel's checkout_started stage read
    // ~0 despite users opening checkout. Mirrors the marketing pricing page.
    trackEvent(EVENT_CHECKOUT_STARTED, { plan: planId })
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId, embedded: true }),
      })
      const data = await res.json()
      if (data.clientSecret) {
        setCheckoutPlan(planId)
        setCheckoutClientSecret(data.clientSecret)
      } else {
        setError(data.error ?? 'Could not start checkout. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // EmbeddedCheckoutProvider pulls a fresh secret if the cached one is gone.
  const fetchClientSecret = useCallback(async () => {
    if (checkoutClientSecret) return checkoutClientSecret
    const res = await fetch('/api/stripe/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: checkoutPlan ?? selectedPlan.id, embedded: true }),
    })
    const data = await res.json()
    return data.clientSecret as string
  }, [checkoutClientSecret, checkoutPlan, selectedPlan.id])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={`Upgrade to ${isAnalytics ? 'Analytics' : 'Pro'}`}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-forest-950/60"
        style={{ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
        onClick={dismissible ? closeAll : undefined}
      />

      {/* Modal panel */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-hairline bg-card-bright shadow-[0_32px_80px_rgba(5,35,22,0.35)] animate-step-enter">
        {/* Header — deep-forest pricing band (ref 10) */}
        <div
          className="px-5 pt-4 pb-4"
          style={{ background: 'linear-gradient(120deg, #052316 0%, #123b20 78%, #1e472d 100%)' }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              {checkoutOpen && (
                <button
                  onClick={() => { setCheckoutClientSecret(null); setCheckoutPlan(null) }}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Back"
                >
                  <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
                </button>
              )}
              <HatchImage state="avatar" size={34} className="shrink-0" alt="Hatch" />
              <div className="min-w-0">
                <p className="truncate font-label text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">
                  {eyebrow}
                </p>
                <p className="truncate font-headline text-[17px] font-semibold leading-tight tracking-[-0.01em] text-white">
                  {checkoutOpen ? `HackProduct ${isAnalytics ? 'Analytics' : 'Pro'}` : headline}
                </p>
              </div>
            </div>
            {dismissible && (
              <button
                onClick={closeAll}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" strokeWidth={1.8} />
              </button>
            )}
          </div>

          {/* Usage progress (only for usage-cap gates) */}
          {!checkoutOpen && hasUsage && (
            <div className="mt-3">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15">
                <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${progressPct}%` }} />
              </div>
              <p className="mt-2 font-body text-xs tabular-nums text-white/60">
                {remaining <= 0 ? detail : `${remaining} remaining this month`}
              </p>
            </div>
          )}
          {!checkoutOpen && !hasUsage && (
            <p className="mt-2 font-body text-xs leading-relaxed text-white/65">{detail}</p>
          )}
        </div>

        {checkoutOpen ? (
          /* ── Embedded Stripe Checkout ── */
          <div className="p-1">
            <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret }}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
        ) : (
          /* ── Plan selection ── */
          <>
            {/* Billing toggle + price */}
            <div className="px-5 pt-4">
              <div className="flex gap-1 rounded-xl border border-hairline bg-page-field p-1">
                {(['monthly', 'annual'] as BillingCycle[]).map((cycle) => {
                  const active = billing === cycle
                  return (
                    <button
                      key={cycle}
                      onClick={() => setBilling(cycle)}
                      className={[
                        'relative flex flex-1 items-center justify-center gap-2 rounded-lg py-1.5 font-label text-xs font-bold transition-all duration-200',
                        active ? 'bg-forest-950 text-white' : 'text-ink-secondary hover:text-ink-strong',
                      ].join(' ')}
                    >
                      {cycle === 'annual' ? 'Annual' : 'Monthly'}
                      {cycle === 'annual' && (
                        <span
                          className={[
                            'rounded-full px-1.5 py-0.5 font-label text-[10px] font-bold tabular-nums',
                            active ? 'bg-gold text-forest-950' : 'bg-note-amber text-forest-800',
                          ].join(' ')}
                        >
                          Save {annualSavings}%
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              <div className="mt-3 flex items-end gap-2">
                <span className="font-headline text-[30px] font-bold leading-none tracking-[-0.02em] tabular-nums text-ink-strong">
                  {formatPlanPrice(selectedPlan)}
                </span>
                <div className="space-y-0.5 pb-0.5">
                  <p className="font-label text-xs font-semibold text-ink-secondary">
                    {billing === 'annual' ? 'per year' : 'per month'}
                  </p>
                  {billing === 'annual' && (
                    <p className="font-label text-[10px] font-bold tabular-nums text-forest-600">
                      ~{monthlyEquivalent}/mo, billed annually
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Feature list */}
            <ul className="grid grid-cols-1 gap-y-1.5 px-5 pb-3 pt-3">
              {featureList.map((text) => (
                <li key={text} className="flex items-center gap-2">
                  <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-sd-bg">
                    <Check className="h-3 w-3 text-forest-600" strokeWidth={2.4} />
                  </span>
                  <span className="font-body text-[12px] tabular-nums text-ink-strong">{text}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <div className="space-y-2 px-5 pb-5">
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-forest-950 py-3 font-label text-sm font-bold text-white transition-all duration-200 hover:bg-forest-900 active:scale-[0.98] disabled:opacity-70"
              >
                {loading && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                )}
                {loading
                  ? 'Loading checkout...'
                  : `${ctaLabel} · ${formatPlanPrice(selectedPlan)}/${selectedPlan.interval === 'year' ? 'yr' : 'mo'}`}
              </button>
              {error && (
                <p className="text-center font-body text-[11px] text-error">{error}</p>
              )}
              <p className="text-center font-body text-[11px] text-ink-secondary">
                7-day free trial. Secure checkout via Stripe. Cancel anytime.
              </p>
              {secondaryAction && (
                <button
                  onClick={secondaryAction.onClick}
                  className="w-full pt-1 text-center font-body text-xs text-ink-secondary transition-colors hover:text-ink-strong"
                >
                  {secondaryAction.label}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

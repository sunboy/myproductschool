'use client'

import { useState, useEffect, useCallback } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
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

// ── The single paywall modal for the whole app ──────────────────────────────
// Every upgrade surface routes through this: limit-hit gates (challenges,
// interviews, Hatch coaching), entitlement gates (Claude Code Analytics), and
// the proactive "Upgrade to Pro" entry points (settings, nav, dashboard nudge).
// It shows plan selection (monthly/annual toggle + the right tier's features),
// then an embedded Stripe checkout inline so the user never leaves the page.

const stripePublishableKey =
  process.env.NEXT_PUBLIC_STRIPE_MODE === 'test'
    ? process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    : process.env.NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : Promise.resolve(null)

// Feature keys that sell the Claude Code Analytics tier (a Pro super-set) rather
// than plain Pro. They flip the modal to analytics plans, features, and copy.
const ANALYTICS_FEATURE_KEYS = new Set(['claude_code_analytics', 'claude_code_sessions'])

const ANALYTICS_FEATURES = [
  { icon: 'verified',     text: 'Everything in Pro' },
  { icon: 'terminal',     text: 'Live Claude Code sessions on real data' },
  { icon: 'database',     text: 'BigQuery analysis with Hatch coaching' },
  { icon: 'construction', text: 'Reusable skills and shareable reports' },
]

function proFeatures(pro: { challenges: number; interviews: number }) {
  return [
    { icon: 'fitness_center',    text: `${pro.challenges} challenge starts/month` },
    { icon: 'psychology',        text: 'Fair-use Hatch AI budget' },
    { icon: 'analytics',         text: 'Learner DNA, competency radar' },
    { icon: 'school',            text: 'Study plans and autopsies' },
    { icon: 'mic',               text: `${pro.interviews} AI interview starts/month` },
    { icon: 'workspace_premium', text: 'Early access to new features' },
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
    detail: 'Unlock live analyst sessions on real datasets, on top of everything in Pro.',
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
    (hasUsage ? `You've used ${used} of ${limit}.` : 'Unlock everything in Pro.')
  const detail = featureCopy?.detail ?? 'Practice without monthly limits.'
  const progressPct = hasUsage ? Math.min((used! / limit!) * 100, 100) : 0
  const remaining = hasUsage ? Math.max(limit! - used!, 0) : 0

  const ctaLabel = isAnalytics ? 'Get Analytics' : 'Unlock Pro'

  const closeAll = useCallback(() => {
    setCheckoutClientSecret(null)
    setCheckoutPlan(null)
    setError(null)
    onClose()
  }, [onClose])

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
        className="fixed inset-0 bg-inverse-surface/60"
        style={{ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
        onClick={dismissible ? closeAll : undefined}
      />

      {/* Modal panel */}
      <div
        className="relative w-full max-w-md rounded-2xl animate-step-enter"
        style={{
          background: '#ffffff',
          boxShadow: '0 32px 80px rgba(46,50,48,0.22), 0 0 0 1px rgba(196,200,188,0.3)',
        }}
      >
        {/* Header */}
        <div
          className="px-5 pt-4 pb-4 rounded-t-2xl"
          style={{ background: 'linear-gradient(145deg, #2d5a3d 0%, #4a7c59 60%, #3a6b4a 100%)' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              {checkoutOpen && (
                <button
                  onClick={() => { setCheckoutClientSecret(null); setCheckoutPlan(null) }}
                  className="w-7 h-7 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors mr-1 shrink-0"
                  aria-label="Back"
                >
                  <span className="material-symbols-outlined text-[17px]">arrow_back</span>
                </button>
              )}
              <HatchGlyph size={32} state="idle" className="text-white shrink-0" />
              <div className="min-w-0">
                <p className="font-label text-[10px] uppercase tracking-[0.18em] font-bold text-white/60 truncate">
                  {eyebrow}
                </p>
                <p className="font-headline font-bold text-white text-base leading-tight truncate" style={{ letterSpacing: '-0.02em' }}>
                  {checkoutOpen ? `HackProduct ${isAnalytics ? 'Analytics' : 'Pro'}` : headline}
                </p>
              </div>
            </div>
            {dismissible && (
              <button
                onClick={closeAll}
                className="w-7 h-7 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-[17px]">close</span>
              </button>
            )}
          </div>

          {/* Usage progress (only for usage-cap gates) */}
          {!checkoutOpen && hasUsage && (
            <div className="mt-3">
              <div className="w-full h-1.5 rounded-full bg-white/20 overflow-hidden">
                <div className="h-full rounded-full bg-white transition-all" style={{ width: `${progressPct}%` }} />
              </div>
              <p className="font-body text-xs text-white/60 mt-2">
                {remaining <= 0 ? detail : `${remaining} remaining this month`}
              </p>
            </div>
          )}
          {!checkoutOpen && !hasUsage && (
            <p className="font-body text-xs text-white/70 mt-2 leading-relaxed">{detail}</p>
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
              <div className="flex rounded-xl p-1 gap-1" style={{ background: '#f0ece4' }}>
                {(['monthly', 'annual'] as BillingCycle[]).map((cycle) => (
                  <button
                    key={cycle}
                    onClick={() => setBilling(cycle)}
                    className="relative flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-label font-semibold transition-all duration-200"
                    style={{
                      background: billing === cycle ? '#ffffff' : 'transparent',
                      color: billing === cycle ? '#2e3230' : '#74796e',
                      boxShadow: billing === cycle
                        ? '0 1px 4px rgba(46,50,48,0.10), 0 0 0 1px rgba(196,200,188,0.25)'
                        : 'none',
                    }}
                  >
                    {cycle === 'annual' ? 'Annual' : 'Monthly'}
                    {cycle === 'annual' && (
                      <span
                        className="font-label text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(74,124,89,0.12)', color: '#4a7c59' }}
                      >
                        Save {annualSavings}%
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex items-end gap-2 mt-2">
                <span
                  className="font-headline font-bold text-on-surface tabular-nums"
                  style={{ fontSize: '1.9rem', letterSpacing: '-0.03em', lineHeight: 1 }}
                >
                  {formatPlanPrice(selectedPlan)}
                </span>
                <div className="pb-0.5 space-y-0.5">
                  <p className="font-label text-xs text-on-surface-variant font-semibold">
                    {billing === 'annual' ? 'per year' : 'per month'}
                  </p>
                  {billing === 'annual' && (
                    <p className="font-label text-[10px] text-primary font-semibold">
                      ~{monthlyEquivalent}/mo, billed annually
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Feature list */}
            <ul className="px-5 pt-3 pb-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
              {featureList.map(({ icon, text }) => (
                <li key={text} className="flex items-center gap-2">
                  <span
                    className="material-symbols-outlined text-primary text-[14px] shrink-0"
                    style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}
                  >
                    {icon}
                  </span>
                  <span className="font-body text-[11px] text-on-surface">{text}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <div className="px-5 pb-5 space-y-2">
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-full py-3 font-label font-bold text-sm text-white transition-all duration-200 active:scale-[0.98] disabled:opacity-70"
                style={{
                  background: 'linear-gradient(135deg, #4a7c59 0%, #3a6b4a 100%)',
                  boxShadow: '0 4px 16px rgba(74,124,89,0.30)',
                }}
              >
                {loading ? (
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    workspace_premium
                  </span>
                )}
                {loading
                  ? 'Loading checkout...'
                  : `${ctaLabel} - ${formatPlanPrice(selectedPlan)}/${selectedPlan.interval === 'year' ? 'yr' : 'mo'}`}
              </button>
              {error && (
                <p className="text-center font-body text-[11px] text-error">{error}</p>
              )}
              <p className="text-center font-body text-[11px] text-on-surface-variant">
                7-day free trial. Secure checkout via Stripe. Cancel anytime.
              </p>
              {secondaryAction && (
                <button
                  onClick={secondaryAction.onClick}
                  className="w-full text-center font-body text-xs text-on-surface-variant hover:text-on-surface transition-colors pt-1"
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

export type BillingPlanId = 'monthly' | 'annual'

export type BillingInterval = 'month' | 'year'

export interface BillingPlanConfig {
  id: BillingPlanId | AnalyticsPlanId
  label: string
  shortLabel: string
  unitAmount: number
  interval: BillingInterval
}

export const BILLING_PLANS: Record<BillingPlanId, BillingPlanConfig> = {
  monthly: {
    id: 'monthly',
    label: 'HackProduct Pro - Monthly',
    shortLabel: 'Monthly',
    unitAmount: 3900,
    interval: 'month',
  },
  annual: {
    id: 'annual',
    label: 'HackProduct Pro - Annual',
    shortLabel: 'Annual',
    unitAmount: 19900,
    interval: 'year',
  },
}

export function isBillingPlanId(value: unknown): value is BillingPlanId {
  return value === 'monthly' || value === 'annual'
}

// ── Claude Code Analytics — special add-on tier (Pro super-set) ──────────────
// Separate paid tier with its own monthly + annual prices. Holding it grants
// everything Pro does PLUS the Claude Code Analytics feature. Gated behind the
// analytics feature flag (see src/lib/flags/analytics.ts) — never sold while the
// flag is off. Kept as its own plan group so the Pro monthly/annual config above
// is untouched.

export type AnalyticsPlanId = 'analytics_monthly' | 'analytics_annual'

/** Any subscription plan id we accept at checkout (Pro cycles + analytics tier). */
export type AnyPlanId = BillingPlanId | AnalyticsPlanId

export const ANALYTICS_PLANS: Record<AnalyticsPlanId, BillingPlanConfig> = {
  analytics_monthly: {
    id: 'analytics_monthly',
    label: 'HackProduct Analytics - Monthly',
    shortLabel: 'Monthly',
    unitAmount: 4999, // $49.99/mo
    interval: 'month',
  },
  analytics_annual: {
    id: 'analytics_annual',
    label: 'HackProduct Analytics - Annual',
    shortLabel: 'Annual',
    // Same discount strategy as Pro (~58% off the 12-month sticker):
    // $49.99 x 12 = $599.88, discounted to $249.99/yr (~$20.83/mo equivalent).
    unitAmount: 24999, // $249.99/yr
    interval: 'year',
  },
}

export function isAnalyticsPlanId(value: unknown): value is AnalyticsPlanId {
  return value === 'analytics_monthly' || value === 'analytics_annual'
}

export function isAnyPlanId(value: unknown): value is AnyPlanId {
  return isBillingPlanId(value) || isAnalyticsPlanId(value)
}

export function annualAnalyticsSavingsPercent(): number {
  const monthlyAnnualized = ANALYTICS_PLANS.analytics_monthly.unitAmount * 12
  const annual = ANALYTICS_PLANS.analytics_annual.unitAmount
  return Math.round(((monthlyAnnualized - annual) / monthlyAnnualized) * 100)
}

export function formatPlanPrice(plan: BillingPlanConfig): string {
  const amount = plan.unitAmount / 100
  return Number.isInteger(amount) ? `$${amount}` : `$${amount.toFixed(2)}`
}

export function formatMonthlyEquivalent(plan: BillingPlanConfig): string {
  const monthlyAmount = plan.interval === 'year' ? plan.unitAmount / 12 : plan.unitAmount
  return `$${(monthlyAmount / 100).toFixed(2)}`
}

export function annualSavingsPercent(): number {
  const monthlyAnnualized = BILLING_PLANS.monthly.unitAmount * 12
  const annual = BILLING_PLANS.annual.unitAmount
  return Math.round(((monthlyAnnualized - annual) / monthlyAnnualized) * 100)
}

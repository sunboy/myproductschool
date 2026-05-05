export type BillingPlanId = 'monthly' | 'annual'

export type BillingInterval = 'month' | 'year'

export interface BillingPlanConfig {
  id: BillingPlanId
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
    unitAmount: 2900,
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

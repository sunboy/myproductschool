import { createAdminClient } from '@/lib/supabase/admin'

export const AI_PLAN_LIMIT_FEATURES = [
  'hatch_chat_msgs',
  'hatch_nudges',
  'hatch_canvas_interprets',
  'simulation_turns',
  'live_interview_turns',
  'quick_takes',
  'ai_grading_runs',
] as const

export type AiPlanLimitFeature = (typeof AI_PLAN_LIMIT_FEATURES)[number]
export type BillingPlan = 'free' | 'pro'

interface PlanLimitRecord {
  limitValue: number
  windowDays: number
}

interface CounterIncrementResult {
  allowed: boolean
  used: number
  limit: number
}

export interface PlanLimitStore {
  getLimit(plan: BillingPlan, feature: AiPlanLimitFeature): Promise<PlanLimitRecord | null>
  incrementCounter(input: {
    userId: string
    feature: AiPlanLimitFeature
    periodStart: string
    limit: number
  }): Promise<CounterIncrementResult>
}

export interface PlanLimitUsage {
  feature: AiPlanLimitFeature
  used: number
  limit: number
  windowDays: number
  resetAt: Date
}

interface CreatePlanLimitAsserterOptions {
  store?: PlanLimitStore
  now?: () => Date
}

export class PlanLimitExceeded extends Error {
  readonly feature: AiPlanLimitFeature
  readonly used: number
  readonly limit: number
  readonly windowDays: number
  readonly resetAt: Date

  constructor(usage: PlanLimitUsage) {
    super(`Plan limit exceeded for ${usage.feature}`)
    this.name = 'PlanLimitExceeded'
    this.feature = usage.feature
    this.used = usage.used
    this.limit = usage.limit
    this.windowDays = usage.windowDays
    this.resetAt = usage.resetAt
  }
}

const FALLBACK_AI_PLAN_LIMITS: Record<BillingPlan, Record<AiPlanLimitFeature, PlanLimitRecord>> = {
  free: {
    hatch_chat_msgs: { limitValue: 50, windowDays: 30 },
    hatch_nudges: { limitValue: 25, windowDays: 30 },
    hatch_canvas_interprets: { limitValue: 20, windowDays: 30 },
    simulation_turns: { limitValue: 40, windowDays: 30 },
    live_interview_turns: { limitValue: 80, windowDays: 30 },
    quick_takes: { limitValue: 30, windowDays: 30 },
    ai_grading_runs: { limitValue: 30, windowDays: 30 },
  },
  pro: {
    hatch_chat_msgs: { limitValue: 1500, windowDays: 30 },
    hatch_nudges: { limitValue: 500, windowDays: 30 },
    hatch_canvas_interprets: { limitValue: 500, windowDays: 30 },
    simulation_turns: { limitValue: 800, windowDays: 30 },
    live_interview_turns: { limitValue: 1500, windowDays: 30 },
    quick_takes: { limitValue: 1000, windowDays: 30 },
    ai_grading_runs: { limitValue: 1000, windowDays: 30 },
  },
}

function normalizePlan(plan: string | null | undefined): BillingPlan {
  return plan === 'pro' ? 'pro' : 'free'
}

export function monthlyPeriodStart(date: Date): string {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)).toISOString().slice(0, 10)
}

export function nextMonthlyResetAt(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1))
}

function fallbackLimit(plan: BillingPlan, feature: AiPlanLimitFeature): PlanLimitRecord {
  return FALLBACK_AI_PLAN_LIMITS[plan][feature]
}

function createSupabasePlanLimitStore(): PlanLimitStore {
  const admin = createAdminClient()

  return {
    async getLimit(plan, feature) {
      const { data, error } = await admin
        .from('plan_limits')
        .select('limit_value, window_days')
        .eq('plan', plan)
        .eq('feature', feature)
        .maybeSingle()

      if (error || !data) return null

      return {
        limitValue: Number.isInteger(data.limit_value) ? data.limit_value : fallbackLimit(plan, feature).limitValue,
        windowDays: Number.isInteger(data.window_days) ? data.window_days : fallbackLimit(plan, feature).windowDays,
      }
    },

    async incrementCounter(input) {
      const { data, error } = await admin.rpc('increment_usage_counter', {
        p_user_id: input.userId,
        p_feature: input.feature,
        p_period_start: input.periodStart,
        p_limit: input.limit,
      })

      if (error) throw error

      const row = Array.isArray(data) ? data[0] : data
      return {
        allowed: Boolean(row?.allowed),
        used: Number(row?.used ?? 0),
        limit: Number(row?.limit_value ?? input.limit),
      }
    },
  }
}

export function createPlanLimitAsserter(options: CreatePlanLimitAsserterOptions = {}) {
  const store = options.store ?? createSupabasePlanLimitStore()
  const now = options.now ?? (() => new Date())

  return async function assertPlanLimit(
    userId: string,
    userPlan: string | null | undefined,
    feature: AiPlanLimitFeature
  ): Promise<PlanLimitUsage> {
    const plan = normalizePlan(userPlan)
    const currentDate = now()
    const limitRecord = await store.getLimit(plan, feature) ?? fallbackLimit(plan, feature)
    const periodStart = monthlyPeriodStart(currentDate)
    const resetAt = nextMonthlyResetAt(currentDate)

    const reservation = await store.incrementCounter({
      userId,
      feature,
      periodStart,
      limit: limitRecord.limitValue,
    })

    const usage: PlanLimitUsage = {
      feature,
      used: reservation.used,
      limit: reservation.limit,
      windowDays: limitRecord.windowDays,
      resetAt,
    }

    if (!reservation.allowed) {
      throw new PlanLimitExceeded(usage)
    }

    return usage
  }
}

let defaultAssertPlanLimit: ReturnType<typeof createPlanLimitAsserter> | null = null

export async function assertPlanLimit(
  userId: string,
  userPlan: string | null | undefined,
  feature: AiPlanLimitFeature
): Promise<PlanLimitUsage> {
  defaultAssertPlanLimit ??= createPlanLimitAsserter()
  return defaultAssertPlanLimit(userId, userPlan, feature)
}

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  createPlanLimitAsserter,
  monthlyPeriodStart,
  nextMonthlyResetAt,
  PlanLimitExceeded,
  type AiPlanLimitFeature,
  type BillingPlan,
  type PlanLimitStore,
} from '../../../src/lib/usage/assert-plan-limit'

class MemoryPlanLimitStore implements PlanLimitStore {
  readonly limits = new Map<string, { limitValue: number; windowDays: number }>()
  readonly counters = new Map<string, number>()

  setLimit(plan: BillingPlan, feature: AiPlanLimitFeature, limitValue: number, windowDays = 30) {
    this.limits.set(`${plan}:${feature}`, { limitValue, windowDays })
  }

  async getLimit(plan: BillingPlan, feature: AiPlanLimitFeature) {
    return this.limits.get(`${plan}:${feature}`) ?? null
  }

  async incrementCounter(input: {
    userId: string
    feature: AiPlanLimitFeature
    periodStart: string
    limit: number
  }) {
    const key = `${input.userId}:${input.feature}:${input.periodStart}`
    const next = (this.counters.get(key) ?? 0) + 1
    const allowed = next <= input.limit
    if (allowed) {
      this.counters.set(key, next)
      return { allowed, used: next, limit: input.limit }
    }

    return { allowed, used: this.counters.get(key) ?? 0, limit: input.limit }
  }
}

test('monthly period helpers use UTC month boundaries', () => {
  const date = new Date('2026-05-31T23:59:59.000Z')
  assert.equal(monthlyPeriodStart(date), '2026-05-01')
  assert.equal(nextMonthlyResetAt(date).toISOString(), '2026-06-01T00:00:00.000Z')
})

test('assertPlanLimit reserves usage until the configured limit is reached', async () => {
  const store = new MemoryPlanLimitStore()
  store.setLimit('free', 'hatch_chat_msgs', 2)
  const assertPlanLimit = createPlanLimitAsserter({
    store,
    now: () => new Date('2026-05-05T12:00:00.000Z'),
  })

  const first = await assertPlanLimit('user-1', 'free', 'hatch_chat_msgs')
  const second = await assertPlanLimit('user-1', 'free', 'hatch_chat_msgs')

  assert.equal(first.used, 1)
  assert.equal(first.limit, 2)
  assert.equal(second.used, 2)
  assert.equal(second.resetAt.toISOString(), '2026-06-01T00:00:00.000Z')

  await assert.rejects(
    () => assertPlanLimit('user-1', 'free', 'hatch_chat_msgs'),
    (error) => {
      assert.ok(error instanceof PlanLimitExceeded)
      assert.equal(error.feature, 'hatch_chat_msgs')
      assert.equal(error.used, 2)
      assert.equal(error.limit, 2)
      return true
    }
  )
})

test('assertPlanLimit falls back to default free limits when DB limit is missing', async () => {
  const store = new MemoryPlanLimitStore()
  const assertPlanLimit = createPlanLimitAsserter({
    store,
    now: () => new Date('2026-05-05T12:00:00.000Z'),
  })

  const usage = await assertPlanLimit('user-2', 'free', 'quick_takes')
  assert.equal(usage.used, 1)
  assert.equal(usage.limit, 30)
})

test('assertPlanLimit normalizes unknown plans to free', async () => {
  const store = new MemoryPlanLimitStore()
  store.setLimit('free', 'simulation_turns', 1)
  store.setLimit('pro', 'simulation_turns', 99)
  const assertPlanLimit = createPlanLimitAsserter({
    store,
    now: () => new Date('2026-05-05T12:00:00.000Z'),
  })

  const usage = await assertPlanLimit('user-3', 'enterprise', 'simulation_turns')
  assert.equal(usage.limit, 1)
})

import { createAdminClient } from '@/lib/supabase/admin'
import { getEffectiveUserPlan } from '@/lib/billing/entitlements'
import { checkUsageLimit, recordUsageEvent } from '@/lib/usage/check-limit'

type AnthropicUsageLike = {
  input_tokens?: number | null
  output_tokens?: number | null
  cache_creation_input_tokens?: number | null
  cache_read_input_tokens?: number | null
}

type AnthropicRate = {
  inputCentsPerMtok: number
  outputCentsPerMtok: number
  cacheWriteCentsPerMtok: number
  cacheReadCentsPerMtok: number
}

export class AiBudgetExceededError extends Error {
  used: number
  limit: number
  windowDays: number

  constructor({ used, limit, windowDays }: { used: number; limit: number; windowDays: number }) {
    super('Hatch AI budget reached')
    this.name = 'AiBudgetExceededError'
    this.used = used
    this.limit = limit
    this.windowDays = windowDays
  }
}

function envNumber(name: string, fallback: number) {
  const value = Number(process.env[name])
  return Number.isFinite(value) && value >= 0 ? value : fallback
}

function rateFor(model: string): AnthropicRate {
  const normalized = model.toLowerCase()

  if (normalized.includes('opus')) {
    const input = envNumber('HATCH_COST_OPUS_INPUT_CENTS_PER_MTOK', 1500)
    const output = envNumber('HATCH_COST_OPUS_OUTPUT_CENTS_PER_MTOK', 7500)
    return {
      inputCentsPerMtok: input,
      outputCentsPerMtok: output,
      cacheWriteCentsPerMtok: envNumber('HATCH_COST_OPUS_CACHE_WRITE_CENTS_PER_MTOK', input * 1.25),
      cacheReadCentsPerMtok: envNumber('HATCH_COST_OPUS_CACHE_READ_CENTS_PER_MTOK', input * 0.1),
    }
  }

  if (normalized.includes('haiku')) {
    const input = envNumber('HATCH_COST_HAIKU_INPUT_CENTS_PER_MTOK', 100)
    const output = envNumber('HATCH_COST_HAIKU_OUTPUT_CENTS_PER_MTOK', 500)
    return {
      inputCentsPerMtok: input,
      outputCentsPerMtok: output,
      cacheWriteCentsPerMtok: envNumber('HATCH_COST_HAIKU_CACHE_WRITE_CENTS_PER_MTOK', input * 1.25),
      cacheReadCentsPerMtok: envNumber('HATCH_COST_HAIKU_CACHE_READ_CENTS_PER_MTOK', input * 0.1),
    }
  }

  const input = envNumber('HATCH_COST_SONNET_INPUT_CENTS_PER_MTOK', 300)
  const output = envNumber('HATCH_COST_SONNET_OUTPUT_CENTS_PER_MTOK', 1500)
  return {
    inputCentsPerMtok: input,
    outputCentsPerMtok: output,
    cacheWriteCentsPerMtok: envNumber('HATCH_COST_SONNET_CACHE_WRITE_CENTS_PER_MTOK', input * 1.25),
    cacheReadCentsPerMtok: envNumber('HATCH_COST_SONNET_CACHE_READ_CENTS_PER_MTOK', input * 0.1),
  }
}

function charCountToTokens(charCount: number) {
  return Math.max(1, Math.ceil(charCount / 4))
}

export function estimateAnthropicCostCents(model: string, usage: AnthropicUsageLike): number {
  const rate = rateFor(model)
  const inputTokens = usage.input_tokens ?? 0
  const outputTokens = usage.output_tokens ?? 0
  const cacheWriteTokens = usage.cache_creation_input_tokens ?? 0
  const cacheReadTokens = usage.cache_read_input_tokens ?? 0

  const cost =
    (inputTokens * rate.inputCentsPerMtok +
      outputTokens * rate.outputCentsPerMtok +
      cacheWriteTokens * rate.cacheWriteCentsPerMtok +
      cacheReadTokens * rate.cacheReadCentsPerMtok) /
    1_000_000

  if (cost <= 0) return 0
  return Math.max(1, Math.ceil(cost))
}

export function estimateAnthropicPreflightCents(model: string, maxTokens: number, charCount: number): number {
  return estimateAnthropicCostCents(model, {
    input_tokens: charCountToTokens(charCount),
    output_tokens: maxTokens,
  })
}

export async function getUserPlanForBudget(userId: string): Promise<string> {
  const admin = createAdminClient()
  return (await getEffectiveUserPlan(admin, userId)).plan
}

export async function assertAiBudget(
  userId: string,
  userPlan: string,
  estimatedCostCents: number
): Promise<void> {
  const nextQuantity = Math.max(1, estimatedCostCents)
  const result = await checkUsageLimit(userId, 'hatch_ai_cents', userPlan, nextQuantity)

  if (!result.allowed) {
    throw new AiBudgetExceededError({
      used: result.used,
      limit: result.limit,
      windowDays: result.windowDays,
    })
  }
}

export async function recordAnthropicUsage({
  userId,
  model,
  usage,
  fallbackCostCents = 1,
  route,
}: {
  userId: string
  model: string
  usage?: AnthropicUsageLike
  fallbackCostCents?: number
  route: string
}): Promise<void> {
  const costCents = usage ? estimateAnthropicCostCents(model, usage) : fallbackCostCents
  const quantity = Math.max(1, costCents)

  await recordUsageEvent(userId, 'hatch_ai_cents', quantity, {
    route,
    model,
    input_tokens: usage?.input_tokens ?? null,
    output_tokens: usage?.output_tokens ?? null,
    cache_creation_input_tokens: usage?.cache_creation_input_tokens ?? null,
    cache_read_input_tokens: usage?.cache_read_input_tokens ?? null,
  })
}

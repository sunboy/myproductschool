import Anthropic from '@anthropic-ai/sdk'
import {
  assertAiBudget,
  estimateAnthropicPreflightCents,
  recordAnthropicUsage,
} from '@/lib/usage/ai-budget'

let client: Anthropic | null = null

export interface CachedMessageOptions {
  model: string
  max_tokens: number
  thinking?: { type: 'enabled'; budget_tokens: number } | { type: 'adaptive' }
  budget?: { userId: string; userPlan: string; route: string }
}

export function getAnthropicClient() {
  if (!client) client = new Anthropic()
  return client
}

/**
 * Creates a message with Anthropic prompt caching enabled on the system prompt.
 * The system prompt is marked with cache_control: ephemeral, so repeated calls
 * with the same system prompt get 90% input token discount.
 */
export async function createCachedMessage(
  systemPrompt: string,
  userContent: string,
  options: CachedMessageOptions
) {
  const preflightCostCents = estimateAnthropicPreflightCents(
    options.model,
    options.max_tokens,
    systemPrompt.length + userContent.length
  )

  if (options.budget) {
    await assertAiBudget(options.budget.userId, options.budget.userPlan, preflightCostCents)
  }

  const message = await getAnthropicClient().messages.create({
    model: options.model,
    max_tokens: options.max_tokens,
    ...(options.thinking ? { thinking: options.thinking } : {}),
    system: [
      {
        type: 'text' as const,
        text: systemPrompt,
        cache_control: { type: 'ephemeral' as const },
      },
    ],
    messages: [{ role: 'user' as const, content: userContent }],
  })

  if (options.budget) {
    await recordAnthropicUsage({
      userId: options.budget.userId,
      model: options.model,
      usage: message.usage,
      fallbackCostCents: preflightCostCents,
      route: options.budget.route,
    })
  }

  return message
}

/**
 * Creates a message with multiple system blocks, where the first block is cached.
 * Use when you have a static system prompt prefix + dynamic context.
 */
export async function createCachedMessageMultiSystem(
  cachedPrefix: string,
  dynamicContext: string,
  userContent: string,
  options: CachedMessageOptions
) {
  const preflightCostCents = estimateAnthropicPreflightCents(
    options.model,
    options.max_tokens,
    cachedPrefix.length + dynamicContext.length + userContent.length
  )

  if (options.budget) {
    await assertAiBudget(options.budget.userId, options.budget.userPlan, preflightCostCents)
  }

  const message = await getAnthropicClient().messages.create({
    model: options.model,
    max_tokens: options.max_tokens,
    ...(options.thinking ? { thinking: options.thinking } : {}),
    system: [
      {
        type: 'text' as const,
        text: cachedPrefix,
        cache_control: { type: 'ephemeral' as const },
      },
      {
        type: 'text' as const,
        text: dynamicContext,
      },
    ],
    messages: [{ role: 'user' as const, content: userContent }],
  })

  if (options.budget) {
    await recordAnthropicUsage({
      userId: options.budget.userId,
      model: options.model,
      usage: message.usage,
      fallbackCostCents: preflightCostCents,
      route: options.budget.route,
    })
  }

  return message
}

export const anthropicClient = new Proxy({} as Anthropic, {
  get(_target, property) {
    return getAnthropicClient()[property as keyof Anthropic]
  },
})

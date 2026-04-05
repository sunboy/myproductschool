import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

interface CachedMessageOptions {
  model: string
  max_tokens: number
  thinking?: { type: 'enabled'; budget_tokens: number } | { type: 'adaptive' }
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
  return client.messages.create({
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
  return client.messages.create({
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
}

export { client as anthropicClient }

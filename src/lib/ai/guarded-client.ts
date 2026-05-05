import {
  createCachedMessage,
  createCachedMessageMultiSystem,
  type CachedMessageOptions,
} from '@/lib/anthropic/cached-client'
import { sanitizeAiOutput, type AiVoiceViolation } from '@/lib/ai/sanitize'
export {
  HATCH_IDENTITY_OPACITY_INSTRUCTION,
  USER_INPUT_SAFETY_INSTRUCTION,
} from '@/lib/hatch/system-prompt'

type CachedMessage = Awaited<ReturnType<typeof createCachedMessage>>

export type GuardedCachedMessage = CachedMessage & {
  sanitized: string
  violations: AiVoiceViolation[]
}

function escapeUserInputTags(text: string) {
  return text
    .replace(/<\/USER_INPUT>/gi, '</USER_INPUT_ESCAPE>')
    .replace(/<USER_INPUT>/gi, '<USER_INPUT_ESCAPE>')
}

export function wrapUserInput(text: string): string {
  return `<USER_INPUT>\n${escapeUserInputTags(text)}\n</USER_INPUT>`
}

function firstTextBlock(message: CachedMessage) {
  return message.content.find((block) => block.type === 'text' && 'text' in block)
}

function sanitizeMessage(message: CachedMessage, options: CachedMessageOptions): GuardedCachedMessage {
  const textBlock = firstTextBlock(message)
  if (!textBlock || !('text' in textBlock)) {
    return Object.assign(message, { sanitized: '', violations: [] })
  }

  const { text, violations } = sanitizeAiOutput({
    text: textBlock.text,
    route: options.budget?.route ?? 'unknown',
    model: options.model,
    userId: options.budget?.userId,
  })

  textBlock.text = text
  return Object.assign(message, { sanitized: text, violations })
}

export async function guardedCachedMessage(
  systemPrompt: string,
  userContent: string,
  options: CachedMessageOptions
): Promise<GuardedCachedMessage> {
  const message = await createCachedMessage(systemPrompt, wrapUserInput(userContent), options)
  return sanitizeMessage(message, options)
}

export async function guardedCachedMessageMultiSystem(
  cachedPrefix: string,
  dynamicContext: string,
  userContent: string,
  options: CachedMessageOptions
): Promise<GuardedCachedMessage> {
  const message = await createCachedMessageMultiSystem(
    cachedPrefix,
    dynamicContext,
    wrapUserInput(userContent),
    options
  )
  return sanitizeMessage(message, options)
}

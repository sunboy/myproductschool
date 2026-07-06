import {
  createCachedMessageStream,
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

/**
 * Streaming variant for latency-critical voice callers: yields SANITIZED
 * text at sentence boundaries as tokens arrive, so TTS can start speaking
 * after the first sentence instead of waiting for the full completion.
 * Sanitization runs per flushed segment (voice replies are short; the word-
 * level bans this guards are intra-sentence). Usage is recorded when the
 * stream finishes, even if it dies early.
 */
export async function guardedCachedSentenceStream(
  systemPrompt: string,
  userContent: string,
  options: CachedMessageOptions
): Promise<AsyncGenerator<string, void, unknown>> {
  const { stream, finalize } = await createCachedMessageStream(
    systemPrompt,
    wrapUserInput(userContent),
    options
  )

  const sanitize = (segment: string): string =>
    sanitizeAiOutput({
      text: segment,
      route: options.budget?.route ?? 'unknown',
      model: options.model,
      userId: options.budget?.userId,
    }).text

  async function* sentences(): AsyncGenerator<string, void, unknown> {
    let buffer = ''
    // Flush on sentence enders followed by whitespace, or hard newlines.
    const boundary = /([.!?]["')\]]?)(\s+)/
    try {
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          buffer += event.delta.text
          let match = boundary.exec(buffer)
          while (match) {
            const end = match.index + match[1].length
            const sentence = sanitize(buffer.slice(0, end))
            buffer = buffer.slice(end).replace(/^\s+/, '')
            if (sentence.trim()) yield sentence + ' '
            match = boundary.exec(buffer)
          }
        }
      }
      const tail = sanitize(buffer)
      if (tail.trim()) yield tail
    } finally {
      await finalize()
    }
  }

  return sentences()
}

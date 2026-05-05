import { createAdminClient } from '@/lib/supabase/admin'
import { VOICE_PATTERNS_IN_ORDER, type VoicePattern, type VoiceRule } from '@/lib/ai/voice-rules'

export interface AiVoiceViolation {
  rule: VoiceRule
  needle: string
  replacement: string
  contextExcerpt: string
  route: string
  model: string
  userId?: string | null
}

export interface SanitizeAiOutputInput {
  text: string
  route: string
  model: string
  userId?: string | null
  log?: boolean
}

export interface SanitizeAiOutputResult {
  text: string
  violations: AiVoiceViolation[]
}

type CodeFence = {
  token: string
  value: string
}

const CODE_FENCE_RE = /```[\s\S]*?```/g

function extractCodeFences(text: string): { masked: string; fences: CodeFence[] } {
  const fences: CodeFence[] = []
  const masked = text.replace(CODE_FENCE_RE, (value) => {
    const token = `@@HATCH_CODE_FENCE_${fences.length}@@`
    fences.push({ token, value })
    return token
  })

  return { masked, fences }
}

function restoreCodeFences(text: string, fences: CodeFence[]) {
  return fences.reduce((current, fence) => current.replace(fence.token, fence.value), text)
}

function excerptFor(text: string, index: number, length: number) {
  const start = Math.max(0, index - 40)
  const end = Math.min(text.length, index + length + 40)
  return text.slice(start, end)
}

function cleanupText(text: string) {
  return text
    .replace(/[ \t]+([,.!?;:])/g, '$1')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .trim()
}

function applyPattern(
  text: string,
  pattern: VoicePattern,
  metadata: Pick<SanitizeAiOutputInput, 'model' | 'route' | 'userId'>,
  violations: AiVoiceViolation[]
) {
  pattern.re.lastIndex = 0

  return text.replace(pattern.re, (needle: string, ...args: unknown[]) => {
    const offset = typeof args.at(-2) === 'number' ? args.at(-2) as number : 0
    violations.push({
      rule: pattern.rule,
      needle,
      replacement: pattern.replacement,
      contextExcerpt: excerptFor(text, offset, needle.length),
      route: metadata.route,
      model: metadata.model,
      userId: metadata.userId,
    })
    return pattern.replacement
  })
}

async function logViolations(violations: AiVoiceViolation[]) {
  if (violations.length === 0) return
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return

  const admin = createAdminClient()
  const rows = violations.map((violation) => ({
    user_id: violation.userId ?? null,
    route: violation.route,
    model: violation.model,
    rule: violation.rule,
    needle: violation.needle,
    replacement: violation.replacement,
    context_excerpt: violation.contextExcerpt,
  }))

  const { error } = await admin.from('ai_voice_violations').insert(rows)
  if (error) {
    console.warn('Failed to log AI voice violations', error.message)
  }
}

export function sanitizeAiOutput(input: SanitizeAiOutputInput): SanitizeAiOutputResult {
  const { masked, fences } = extractCodeFences(input.text)
  const violations: AiVoiceViolation[] = []

  const sanitized = VOICE_PATTERNS_IN_ORDER.reduce(
    (current, pattern) => applyPattern(current, pattern, input, violations),
    masked
  )

  const text = restoreCodeFences(cleanupText(sanitized), fences)

  if (input.log !== false) {
    void logViolations(violations).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error)
      console.warn('Failed to log AI voice violations', message)
    })
  }

  return { text, violations }
}

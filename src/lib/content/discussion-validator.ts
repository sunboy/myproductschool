import {
  EM_DASH_PATTERNS,
  ROLE_FRAMING_PATTERNS,
  SLOP_PATTERNS,
  type VoicePattern,
} from '@/lib/ai/voice-rules'

export interface DiscussionValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

function matchingNeedles(patterns: VoicePattern[], text: string): string[] {
  const matches = new Set<string>()

  for (const pattern of patterns) {
    pattern.re.lastIndex = 0
    for (const match of text.matchAll(pattern.re)) {
      if (match[0]) matches.add(match[0].trim())
    }
  }

  return [...matches]
}

export function validateDiscussionContent(text: string): DiscussionValidationResult {
  const trimmed = text.trim()
  const errors: string[] = []
  const warnings: string[] = []

  if (!trimmed) {
    errors.push('Write something before posting.')
  }

  if (trimmed.length > 500) {
    errors.push('Keep discussion posts under 500 characters.')
  }

  if (matchingNeedles(EM_DASH_PATTERNS, trimmed).length > 0) {
    errors.push('Use a comma or period instead of an em dash.')
  }

  if (matchingNeedles(ROLE_FRAMING_PATTERNS, trimmed).length > 0) {
    warnings.push('Drop role framing and get straight to the point.')
  }

  const slopMatches = matchingNeedles(SLOP_PATTERNS, trimmed)
  if (slopMatches.length > 0) {
    warnings.push(`Trim vague launch words: ${slopMatches.join(', ')}.`)
  }

  return {
    valid: errors.length === 0 && warnings.length === 0,
    errors,
    warnings,
  }
}

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

  // Matches the composer's MAX_LENGTH in DiscussionInput.tsx. The old 500-char
  // cap silently blocked multi-paragraph / code-block posts before they could be
  // submitted, even though the API accepts up to 10,000.
  if (trimmed.length > 4000) {
    errors.push('Keep discussion posts under 4000 characters.')
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

/**
 * Structural validation for challenge descriptions, per docs/CHALLENGE_DESCRIPTION_SPEC.md.
 *
 * Voice rules (em dash, role framing, slop) reuse src/lib/ai/voice-rules.ts.
 * Structural rules are per challenge_type: algorithm needs ## Examples + ## Constraints,
 * sql needs ## Output + a real body, canvas types need ## Requirements and must not
 * duplicate the context into trigger/question, flow needs a single-ask question.
 */

import { EM_DASH_PATTERNS, ROLE_FRAMING_PATTERNS, SLOP_PATTERNS } from '@/lib/ai/voice-rules'

export interface DescriptionIssue {
  field: string
  message: string
}

export interface DescriptionValidationResult {
  errors: DescriptionIssue[]
  warnings: DescriptionIssue[]
}

export interface DescriptionInput {
  context?: string | null
  trigger?: string | null
  question?: string | null
  prompt_text?: string | null
  metadata?: Record<string, unknown> | null
}

const CANVAS_BOILERPLATE = [
  /design your solution on the canvas/i,
  /^you have \d+\s*minutes\.?$/i,
]

function normalize(value: string | null | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim().toLowerCase()
}

function body(input: DescriptionInput): string {
  const context = (input.context ?? '').trim()
  const prompt = (input.prompt_text ?? '').trim()
  return context.length >= prompt.length ? context : prompt
}

function hasHeading(text: string, names: string[]): boolean {
  return names.some((name) => new RegExp(`^#{2,3}\\s+${name}\\b`, 'im').test(text))
}

/** A fenced code block containing both Input: and Output: lines (LeetCode example shape). */
function hasExampleBlock(text: string): boolean {
  const fences = text.match(/```[\s\S]*?```/g) ?? []
  return fences.some((block) => /input\s*:/i.test(block) && /output\s*:/i.test(block))
}

function hasBulletUnderHeading(text: string, names: string[]): boolean {
  for (const name of names) {
    const re = new RegExp(`^#{2,3}\\s+${name}\\b[^\\n]*\\n([\\s\\S]*?)(?=^#{2,3}\\s|$(?![\\s\\S]))`, 'im')
    const match = text.match(re)
    if (match && /^\s*[-*]\s+\S/m.test(match[1])) return true
  }
  return false
}

function checkVoice(field: string, text: string, errors: DescriptionIssue[], warnings: DescriptionIssue[]) {
  if (EM_DASH_PATTERNS.some((p) => new RegExp(p.re.source, p.re.flags).test(text))) {
    errors.push({ field, message: 'Contains an em dash or double hyphen. Rewrite with a comma, period, or clearer sentence.' })
  }
  if (ROLE_FRAMING_PATTERNS.some((p) => new RegExp(p.re.source, p.re.flags).test(text))) {
    warnings.push({ field, message: 'Contains second-person role framing ("you are a...", "as a..."). Drop into the situation.' })
  }
  const slop = SLOP_PATTERNS.flatMap((p) => text.match(new RegExp(p.re.source, p.re.flags)) ?? [])
  if (slop.length > 0) {
    warnings.push({ field, message: `Contains banned voice copy: ${slop.join(', ')}` })
  }
}

export function validateDescription(
  challengeType: string,
  input: DescriptionInput,
  options: { skipVoice?: boolean } = {},
): DescriptionValidationResult {
  const errors: DescriptionIssue[] = []
  const warnings: DescriptionIssue[] = []
  const text = body(input)
  const trigger = (input.trigger ?? '').trim()
  const question = (input.question ?? '').trim()

  // Voice checks on every populated field (skippable when the caller already runs them)
  if (!options.skipVoice) {
    for (const [field, value] of [
      ['context', text],
      ['trigger', trigger],
      ['question', question],
    ] as const) {
      if (value) checkVoice(field, value, errors, warnings)
    }
  }

  if (/^#\s+/m.test(text)) {
    warnings.push({ field: 'context', message: 'Body contains an H1 heading. The page renders the title; body headings start at ##.' })
  }

  if (!text) {
    errors.push({ field: 'context', message: 'Description body is empty.' })
    return { errors, warnings }
  }

  switch (challengeType) {
    case 'algorithm': {
      if (!hasHeading(text, ['Examples?'])) {
        errors.push({ field: 'context', message: 'Missing "## Examples" section.' })
      } else if (!hasExampleBlock(text)) {
        errors.push({ field: 'context', message: '"## Examples" must contain at least one fenced block with Input: and Output: lines.' })
      }
      if (!hasHeading(text, ['Constraints'])) {
        errors.push({ field: 'context', message: 'Missing "## Constraints" section.' })
      } else if (!hasBulletUnderHeading(text, ['Constraints'])) {
        errors.push({ field: 'context', message: '"## Constraints" must contain at least one bullet.' })
      }
      break
    }

    case 'sql': {
      if (text.length < 150) {
        errors.push({ field: 'context', message: `Body is ${text.length} chars; needs business context + question + Output section (>= 150).` })
      }
      if (!hasHeading(text, ['Output'])) {
        errors.push({ field: 'context', message: 'Missing "## Output" section (columns, grain, ordering/rounding rules).' })
      }
      for (const [field, value] of [['trigger', trigger], ['question', question]] as const) {
        if (value && CANVAS_BOILERPLATE.some((re) => re.test(value))) {
          errors.push({ field, message: 'Canvas boilerplate on an editor challenge.' })
        }
      }
      break
    }

    case 'system_design':
    case 'data_modeling': {
      if (!hasHeading(text, ['Requirements', 'Functional Requirements'])) {
        errors.push({ field: 'context', message: 'Missing "## Requirements" section.' })
      }
      if (challengeType === 'system_design' && !hasHeading(text, ['Scale', 'Scale Assumptions', 'Non-Functional Requirements'])) {
        warnings.push({ field: 'context', message: 'No "## Scale" section. System design needs specific scale numbers.' })
      }
      if (question && normalize(question).slice(0, 80) === normalize(text).slice(0, 80)) {
        errors.push({ field: 'question', message: 'scenario_question duplicates scenario_context. Set it to NULL.' })
      }
      if (trigger && normalize(trigger).slice(0, 80) === normalize(text).slice(0, 80)) {
        errors.push({ field: 'trigger', message: 'scenario_trigger duplicates scenario_context. Set it to NULL or a one-sentence constraint.' })
      }
      if (/\bat scale\b|\blarge volumes?\b|\bmassive\b/i.test(text)) {
        warnings.push({ field: 'context', message: 'Vague scale language. Use specific numbers (10K writes/s, 100M users).' })
      }
      break
    }

    case 'flow':
    case 'quick_take': {
      if (question) {
        const questionMarks = (question.match(/\?/g) ?? []).length
        const words = question.split(/\s+/).filter(Boolean).length
        if (questionMarks > 1) {
          errors.push({ field: 'question', message: `Question has ${questionMarks} question marks; it must be a single ask.` })
        }
        if (words > 35) {
          warnings.push({ field: 'question', message: `Question is ${words} words (max 35). Tighten to one ask.` })
        }
        if (/\b(?:and|then)\s+(?:propose|name|enumerate|list|frame|identify|recommend)\b/i.test(question) && words > 25) {
          warnings.push({ field: 'question', message: 'Question chains multiple asks. Keep the single highest-leverage ask.' })
        }
      }
      if (trigger) {
        const sentences = trigger.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0).length
        if (sentences > 2) {
          warnings.push({ field: 'trigger', message: `Trigger is ${sentences} sentences; it should be exactly one.` })
        }
      }
      break
    }
  }

  return { errors, warnings }
}

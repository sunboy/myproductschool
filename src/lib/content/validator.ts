// src/lib/content/validator.ts
import type { ChallengeJson, DraftFlowStep, DraftQuestion } from '@/lib/types'

export interface ValidationError {
  path: string
  message: string
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
}

const FLOW_STEPS = ['frame', 'list', 'optimize', 'win'] as const
const QUALITIES = ['best', 'good_but_incomplete', 'surface', 'plausible_wrong'] as const
const COMPETENCIES = [
  'motivation_theory', 'cognitive_empathy', 'taste',
  'strategic_thinking', 'creative_execution', 'domain_expertise',
] as const

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

interface OptionChecks {
  errors: ValidationError[]
  warnings: ValidationError[]
}

function validateOptions(q: DraftQuestion, path: string): OptionChecks {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []

  if (q.options.length !== 4) {
    errors.push({ path, message: `Expected 4 options, got ${q.options.length}` })
    return { errors, warnings }
  }

  const qualities = q.options.map(o => o.quality)
  for (const qual of QUALITIES) {
    const count = qualities.filter(q => q === qual).length
    if (count !== 1) {
      errors.push({ path, message: `Expected exactly 1 option with quality "${qual}", got ${count}` })
    }
  }

  const wordCounts = q.options.map(o => wordCount(o.text))
  const maxWords = Math.max(...wordCounts)
  const minWords = Math.min(...wordCounts)
  const variance = maxWords > 0 ? (maxWords - minWords) / maxWords : 0
  // Word count variance is a style guideline — warn, don't fail
  if (variance > 0.2) {
    warnings.push({ path, message: `Option word count variance ${(variance * 100).toFixed(0)}% exceeds 20% (style guideline)` })
  }

  const bestOption = q.options.find(o => o.quality === 'best')
  if (bestOption) {
    const bestWords = wordCount(bestOption.text)
    // Best-not-longest is a style guideline — warn, don't fail
    if (bestWords === maxWords && q.options.filter(o => wordCount(o.text) === maxWords).length === 1) {
      warnings.push({ path, message: 'The "best" option is the longest (style guideline: consider shortening)' })
    }
  }

  for (const option of q.options) {
    for (const comp of option.competencies) {
      if (!COMPETENCIES.includes(comp as typeof COMPETENCIES[number])) {
        errors.push({ path: `${path}.${option.label}`, message: `Unknown competency: ${comp}` })
      }
    }
  }

  return { errors, warnings }
}

interface StepChecks {
  errors: ValidationError[]
  warnings: ValidationError[]
}

function validateStep(step: DraftFlowStep, idx: number): StepChecks {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []
  const path = `flow_steps[${idx}]`

  if (!FLOW_STEPS.includes(step.step as typeof FLOW_STEPS[number])) {
    errors.push({ path, message: `Unknown step: ${step.step}` })
  }

  const nudgeWords = wordCount(step.step_nudge)
  if (nudgeWords > 40) {
    warnings.push({ path, message: `step_nudge is ${nudgeWords} words (max 40)` })
  }
  if (!step.step_nudge.trim().endsWith('?')) {
    warnings.push({ path, message: 'step_nudge must end with "?"' })
  }

  if (step.questions.length === 0) {
    errors.push({ path, message: 'Must have at least 1 question' })
  }

  for (let qi = 0; qi < step.questions.length; qi++) {
    const result = validateOptions(step.questions[qi], `${path}.questions[${qi}]`)
    errors.push(...result.errors)
    warnings.push(...result.warnings)
  }

  return { errors, warnings }
}

// Second-person role-framing patterns we never want in user-facing copy
const ROLE_FRAMING_PATTERNS: RegExp[] = [
  /^you are (a|an) /i,
  /\bas a (senior|staff|tech lead|founding|engineer|pm|em|designer|product manager|data scientist)/i,
  /\bimagine you\b/i,
  /\byou(?:'re| are) (a|an) /i,
]

const STOP_WORDS = new Set([
  'the','a','an','and','or','but','is','are','was','were','in','on','at','to','for','of','with','by',
  'from','as','it','this','that','these','those','your','their','its','you','we','they','he','she',
  'do','does','did','be','been','being','have','has','had','will','would','could','should','can','may',
  'what','which','how','when','where','why','who','if','so','then','than','not','no','yes'
])

function tokenize(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 4 && !STOP_WORDS.has(w))
}

function groundingTokens(json: ChallengeJson): Set<string> {
  const tokens = new Set<string>()
  const add = (s?: string | string[]) => {
    if (!s) return
    const arr = Array.isArray(s) ? s : [s]
    for (const v of arr) for (const t of tokenize(v)) tokens.add(t)
  }
  add(json.scenario.specific_detail)
  add(json.scenario.data_points)
  add(json.scenario.insights)
  if (json.scenario.excerpts) {
    for (const e of json.scenario.excerpts) add(e.quote)
  }
  return tokens
}

function hasRoleFraming(text: string): boolean {
  return ROLE_FRAMING_PATTERNS.some(re => re.test(text))
}

export function validateChallengeJson(json: ChallengeJson): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []

  if (!json.scenario?.role) errors.push({ path: 'scenario.role', message: 'Required' })
  if (!json.scenario?.context) errors.push({ path: 'scenario.context', message: 'Required' })
  if (!json.scenario?.trigger) errors.push({ path: 'scenario.trigger', message: 'Required' })
  if (!json.scenario?.question) errors.push({ path: 'scenario.question', message: 'Required' })
  if (!json.scenario?.explanation) errors.push({ path: 'scenario.explanation', message: 'Required' })

  if (json.flow_steps.length !== 4) {
    errors.push({ path: 'flow_steps', message: `Expected 4 FLOW steps, got ${json.flow_steps.length}` })
  }

  for (let i = 0; i < json.flow_steps.length; i++) {
    const result = validateStep(json.flow_steps[i], i)
    errors.push(...result.errors)
    warnings.push(...result.warnings)
  }

  if (!json.metadata?.paradigm) errors.push({ path: 'metadata.paradigm', message: 'Required' })
  if (!json.metadata?.industry) errors.push({ path: 'metadata.industry', message: 'Required' })
  if (!json.metadata?.difficulty) errors.push({ path: 'metadata.difficulty', message: 'Required' })
  if (!json.metadata?.primary_competencies?.length) {
    errors.push({ path: 'metadata.primary_competencies', message: 'At least 1 required' })
  }

  // --- Grounding warnings (non-blocking) ---
  const groundTokens = groundingTokens(json)

  if (groundTokens.size > 0) {
    for (let i = 0; i < json.flow_steps.length; i++) {
      const step = json.flow_steps[i]
      for (let qi = 0; qi < step.questions.length; qi++) {
        const q = step.questions[qi]
        const combinedText = q.options.map(o => o.text).join(' ')
        const optionTokens = new Set(tokenize(combinedText))
        const hit = [...optionTokens].some(t => groundTokens.has(t))
        if (!hit) {
          warnings.push({
            path: `flow_steps[${i}].questions[${qi}]`,
            message: 'No MCQ option references a grounding token (data_points / specific_detail / insights). Options may be too generic.',
          })
        }
      }
    }
  }

  // --- Sibling-question overlap warnings ---
  for (let i = 0; i < json.flow_steps.length; i++) {
    const step = json.flow_steps[i]
    if (step.questions.length < 2) continue
    for (let a = 0; a < step.questions.length; a++) {
      for (let b = a + 1; b < step.questions.length; b++) {
        const tA = new Set(tokenize(step.questions[a].question_text))
        const tB = tokenize(step.questions[b].question_text)
        const shared = tB.filter(t => tA.has(t)).length
        if (shared >= 3) {
          warnings.push({
            path: `flow_steps[${i}].questions`,
            message: `Questions Q${step.questions[a].sequence} and Q${step.questions[b].sequence} share ${shared} content words. May overlap.`,
          })
        }
      }
    }
  }

  // --- Voice warnings: reject second-person role framing in user-facing copy ---
  const copyFields: Array<{ path: string; text: string }> = []
  if (json.scenario?.context) copyFields.push({ path: 'scenario.context', text: json.scenario.context })
  if (json.scenario?.trigger) copyFields.push({ path: 'scenario.trigger', text: json.scenario.trigger })
  if (json.scenario?.question) copyFields.push({ path: 'scenario.question', text: json.scenario.question })
  if (json.scenario?.explanation) copyFields.push({ path: 'scenario.explanation', text: json.scenario.explanation })
  for (let i = 0; i < json.flow_steps.length; i++) {
    const step = json.flow_steps[i]
    if (step.step_nudge) copyFields.push({ path: `flow_steps[${i}].step_nudge`, text: step.step_nudge })
    for (let qi = 0; qi < step.questions.length; qi++) {
      const q = step.questions[qi]
      copyFields.push({ path: `flow_steps[${i}].questions[${qi}].question_text`, text: q.question_text })
      if (q.question_nudge) copyFields.push({ path: `flow_steps[${i}].questions[${qi}].question_nudge`, text: q.question_nudge })
      for (const opt of q.options) {
        copyFields.push({ path: `flow_steps[${i}].questions[${qi}].options.${opt.label}.text`, text: opt.text })
      }
    }
  }

  for (const { path, text } of copyFields) {
    if (hasRoleFraming(text)) {
      warnings.push({ path, message: 'Contains second-person role framing ("you are a…", "as a…"). Rewrite to drop into the situation.' })
    }
  }

  return { valid: errors.length === 0, errors, warnings }
}

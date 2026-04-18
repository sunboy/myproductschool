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

  return { valid: errors.length === 0, errors, warnings }
}

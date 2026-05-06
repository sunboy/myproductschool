type CompletedAttemptRow = {
  total_score?: number | string | null
  max_score?: number | string | null
  grade_label?: string | null
  feedback_json?: unknown
  mental_models_breakdown?: unknown
  primary_competency?: string | null
  weakest_competency?: string | null
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function finiteNumber(value: unknown, fallback: number): number {
  const parsed = typeof value === 'number'
    ? value
    : typeof value === 'string'
      ? Number(value)
      : Number.NaN

  return Number.isFinite(parsed) ? parsed : fallback
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null
}

function arrayOrEmpty(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

export function buildCompletedAttemptResult(attempt: CompletedAttemptRow) {
  const feedback = asRecord(attempt.feedback_json)

  return {
    total_score: finiteNumber(feedback.total_score, finiteNumber(attempt.total_score, 0)),
    max_score: finiteNumber(feedback.max_score, finiteNumber(attempt.max_score, 0)),
    grade_label: stringOrNull(feedback.grade_label) ?? attempt.grade_label ?? 'Completed',
    xp_awarded: finiteNumber(feedback.xp_awarded, 0),
    competency_deltas: arrayOrEmpty(feedback.competency_deltas),
    step_breakdown: arrayOrEmpty(feedback.step_breakdown),
    step_signals: arrayOrEmpty(feedback.step_signals),
    mental_models_breakdown: feedback.mental_models_breakdown ?? attempt.mental_models_breakdown ?? null,
    primary_competency: stringOrNull(feedback.primary_competency) ?? attempt.primary_competency ?? null,
    weakest_competency: stringOrNull(feedback.weakest_competency) ?? attempt.weakest_competency ?? null,
    alreadyCompleted: true,
  }
}

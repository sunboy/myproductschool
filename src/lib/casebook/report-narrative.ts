// Casebook Loop — assembles report.narrative_md for a graded Challenge attempt.
//
// SCOPE: this module owns narrative_md only. report.chart_specs is built
// separately by chart-specs.ts (deterministic, from extracted queries) and
// assembled into the same `report` object by the file route — this module
// never touches chart_specs itself.
//
// User-facing copy: no "case"/"debrief"/"casebook" vocabulary, no em dashes,
// no AI slop. "Challenge" for the full case, "Feedback" for what this report is.

import type { MoveDiffResult } from './move-diff'
import type { CaseGradeResult } from './case-grader'

export interface NarrativeInput {
  caseTitle: string
  diff: MoveDiffResult
  verdict: CaseGradeResult['verdict']
  grade: CaseGradeResult['grade']
}

// The grader model can emit an em dash even when instructed not to
// (sanitizeAiOutput in src/lib/ai/sanitize.ts screens for AI-slop words, not
// punctuation) — strip any string sourced from the model before it lands in
// this user-facing narrative, rather than trusting the prompt alone.
function stripEmDash(text: string): string {
  return text.replace(/\s*—\s*/g, ', ')
}

function formatMoveList(moves: Array<{ id: string; label: string }>): string {
  if (moves.length === 0) return '_None._'
  // Authored expert move labels/descriptions are not run through
  // sanitizeAiOutput (they are human-authored content, not model output) but
  // stripEmDash is defensive here too since move labels are user-visible.
  return moves.map((m) => `- ${stripEmDash(m.label)}`).join('\n')
}

function formatObjectives(objectives: CaseGradeResult['grade']['objectives']): string {
  return objectives
    .map((o) => {
      const mark = o.status === 'met' ? 'Met' : o.status === 'partial' ? 'Partial' : 'Missed'
      const evidence = o.evidence ? `. ${stripEmDash(o.evidence)}` : ''
      return `- **${mark}**: ${o.label}${evidence}`
    })
    .join('\n')
}

/** Builds the markdown narrative for the Feedback report. Pure, no I/O. */
export function buildNarrativeMd(input: NarrativeInput): string {
  const { caseTitle, diff, verdict, grade } = input

  const sections = [
    `# ${caseTitle}: Feedback`,
    '',
    `**Grade: ${grade.grade_label}** (${grade.total_score}/100)`,
    '',
    stripEmDash(grade.overall_note),
    '',
    '## Your verdict',
    '',
    stripEmDash(verdict.cause),
    '',
    `Confidence: ${verdict.confidence}.`,
    '',
    verdict.falsifiable_check
      ? `Falsifiable check: ${stripEmDash(verdict.falsifiable_check)}`
      : 'No falsifiable check was stated. A strong verdict names a specific, checkable condition that would disprove it.',
    '',
    '## Moves you hit',
    '',
    formatMoveList(diff.matched),
    '',
    '## Moves you missed',
    '',
    formatMoveList(diff.missed),
    '',
    '## Objective breakdown',
    '',
    formatObjectives(grade.objectives),
  ]

  return sections.join('\n')
}

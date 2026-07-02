import type { ReactNode } from 'react'
import type { MagnetResultPayload } from '@/lib/lead-magnets/quiz-types'
import { buildAnswerFixReport } from './answer-fix'
import { buildFailureModeReport } from './failure-mode'
import { buildAiPmReadinessReport } from './ai-pm-readiness'
import { buildSpotTheFlawReport } from './spot-the-flaw'
import { buildSwitchReport } from './switch'
import { buildSalaryReport } from './salary'
import { buildAiPmQuestionsReport } from './ai-pm-questions'

export interface ReportSection {
  id: string
  title: string
  body: ReactNode
}

export interface ReportContent {
  /** Display title, e.g. "Your interview-answer structure" */
  title: string
  /** Optional one-sentence intro rendered above the sections. */
  intro?: string
  sections: ReportSection[]
}

type ReportBuilder = (
  result: MagnetResultPayload,
  name?: string | null,
) => ReportContent

/** Per-slug registry. Add a builder here when a magnet gets its report content. */
const BUILDERS: Record<string, ReportBuilder> = {
  'answer-fix': buildAnswerFixReport,
  'failure-mode': buildFailureModeReport,
  'ai-pm-readiness': buildAiPmReadinessReport,
  'spot-the-flaw': buildSpotTheFlawReport,
  switch: buildSwitchReport,
  salary: buildSalaryReport,
  'ai-pm-questions': buildAiPmQuestionsReport,
}

/**
 * Returns the printable report content for a given slug + result, or null
 * when the slug has no builder yet (the page renders a graceful fallback).
 */
export function getReportContent(
  slug: string,
  result: MagnetResultPayload,
  name?: string | null,
): ReportContent | null {
  const builder = BUILDERS[slug]
  if (!builder) return null
  return builder(result, name)
}

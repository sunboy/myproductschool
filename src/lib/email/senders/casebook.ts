import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { EMAIL_ART } from '@/lib/email/art'
import {
  appUrl,
  sendTransactionalEmail,
  type BaseTransactionalInput,
} from '@/lib/email/send-core'

// Casebook Loop senders.
//
// Reuses the existing `challenge_completion` TransactionalEmailKind rather
// than adding a new one — TransactionalEmailKind lives in send-core.ts,
// which is shared infra this feature does not own. A graded Challenge
// (full case) report is the same class of event as a graded FLOW
// challenge: Hatch finished reviewing an attempt and there is feedback
// ready to read. `email_dedupes.template` just stores this string; nothing
// downstream branches on the exact TransactionalEmailKind value.

export interface CaseReportReadyInput extends Omit<BaseTransactionalInput, 'dedupeKey'> {
  /** cc_case_attempts.id — used to build a dedupe key unique per attempt, not just per user. */
  attemptId: string
  caseTitle: string
  gradeLabel?: string | null
  totalScore?: number | null
  /** cc_cases.id (a text slug) — used to build the CTA back into the workspace. */
  caseId: string
}

/**
 * Sent once a filed Challenge (full case) attempt has been graded — the
 * moment cc_case_attempts transitions filed -> graded (see
 * src/app/api/casebook/case/[attemptId]/file/route.ts). Only fired on the
 * CAS winner path of that transition, so a lost-race re-read never
 * double-sends (the per-attempt dedupeKey below is the second, durable
 * guard against that).
 *
 * dedupeKey is scoped to the attempt, not the user, so a user's second
 * Challenge report still emails — matching the shape of other per-event
 * dedupe keys in this file (e.g. resume_challenge is per resumeUrl target,
 * challenge_completion is effectively per attempt via its caller).
 */
export function sendCaseReportReadyEmail(admin: SupabaseClient, input: CaseReportReadyInput) {
  const stats = [
    ...(input.gradeLabel ? [{ label: 'Grade', value: input.gradeLabel }] : []),
    ...(input.totalScore != null ? [{ label: 'Score', value: `${input.totalScore}/100` }] : []),
  ]

  return sendTransactionalEmail(admin, {
    ...input,
    dedupeKey: `casebook_report_ready:${input.userId ?? input.to ?? 'unknown'}:${input.attemptId}`,
    kind: 'challenge_completion',
    subject: `Your report on ${input.caseTitle} is ready`,
    previewText: 'What the investigation shows about your moves, while it is still fresh.',
    eyebrow: 'Case filed',
    tone: 'celebratory',
    heroImageUrl: EMAIL_ART['hatch-celebrate'],
    heroAlt: 'Hatch celebrating your filed case report',
    heading: input.caseTitle,
    body: `Hatch finished grading your investigation on ${input.caseTitle}. The report breaks down which expert moves you demonstrated, which ones you missed, and how your verdict compares to the reference case.`,
    bodyParagraphs: [
      'Read it while the case is still fresh in your head. The gap between the moves you made and the ones you missed is the most useful part, and it is easiest to place while you still remember why you went the direction you did.',
    ],
    stats: stats.length > 0 ? stats : null,
    ctaLabel: 'Read your report',
    ctaUrl: appUrl(`/modules/${input.caseId}/challenge`),
  })
}

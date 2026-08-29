import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAppFlag } from '@/lib/config/app-flags'
import { ChallengeClient } from './ChallengeClient'
import type { ChallengeCase, ChallengePayload } from '@/components/casebook/challenge/types'

// Same allowlist the case-start API route uses (src/app/api/casebook/
// case/start/route.ts) — `lab_casebook` stays off this phase, but the
// launch case needs the full Challenge flow working end to end. Duplicated
// as its own module-level constant per that route's stated convention (each
// route owns its own copy rather than importing a shared one).
const CHALLENGE_CASE_IDS = new Set(['tuesday-dip'])

interface CaseRow {
  id: string
  title: string
  hook: string
  brief_md: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  est_minutes: number
}

/**
 * Server component: fetches READ-ONLY case content for first paint.
 * Deliberately does NOT call POST /api/casebook/case/start here — that
 * route provisions a real sandbox and meters a lifetime allowance, so it
 * must stay behind the learner's own "Start challenge" click, not run on
 * page load. This query selects an explicit column allowlist and NEVER
 * selects `objectives` or `verdict_spec` (the grading rubric — see
 * types.ts's contract comment). The `(app)` route group's proxy already
 * gates auth for this page; no separate requireAuth() call is needed here.
 */
export default async function ChallengePage({
  params,
}: {
  params: Promise<{ caseId: string }>
}) {
  const { caseId } = await params
  if (!caseId) notFound()

  const isAllowlisted = CHALLENGE_CASE_IDS.has(caseId)
  if (!isAllowlisted) {
    const flagOn = await getAppFlag('lab_casebook', false)
    if (!flagOn) notFound()
  }

  const admin = createAdminClient()

  const caseResult = await admin
    .from('cc_cases')
    .select('id, title, hook, brief_md, difficulty, est_minutes')
    .eq('id', caseId)
    .maybeSingle()

  if (caseResult.error || !caseResult.data) notFound()

  const caseRow = caseResult.data as CaseRow

  const caseSummary: ChallengeCase = {
    id: caseRow.id,
    title: caseRow.title,
    hook: caseRow.hook,
    brief_md: caseRow.brief_md,
    difficulty: caseRow.difficulty,
    est_minutes: caseRow.est_minutes,
  }

  const payload: ChallengePayload = { case: caseSummary }

  return <ChallengeClient caseId={caseId} initialPayload={payload} />
}

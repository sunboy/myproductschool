import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAppFlag } from '@/lib/config/app-flags'
import { PracticeClient } from './PracticeClient'
import type { PracticePayload, PracticeScene, SkillLane } from '@/components/casebook/practice/types'

// Same allowlist the practice-start API route uses (src/app/api/casebook/
// practice/start/route.ts) — `lab_casebook` stays off this phase, but the
// launch module needs Practice working end to end. Duplicated as its own
// module-level constant per that route's stated convention (each route owns
// its own copy rather than importing a shared one).
const PRACTICE_CASE_IDS = new Set(['tuesday-dip'])

interface SceneRow {
  id: string
  case_id: string
  ordinal: number
  title: string
  goal_md: string
  skill_lane: string
  preload: { context_md?: string; seed_transcript?: unknown[]; visible_tables?: string[] }
  time_budget_s: number
}

/**
 * Server component: fetches READ-ONLY scene + module content for first
 * paint. Deliberately does NOT call POST /api/casebook/practice/start here
 * — that route provisions a real sandbox and meters a weekly allowance, so
 * it must stay behind the learner's own "Start practice" click, not run on
 * page load. This query selects the same non-rubric columns that route
 * selects from cc_scenes (id, case_id, title, goal_md, skill_lane, preload,
 * time_budget_s) and NEVER selects `rubric` — see types.ts's contract
 * comment. The `(app)` route group's proxy already gates auth for this
 * page; no separate requireAuth() call is needed here.
 */
export default async function PracticePage({
  params,
}: {
  params: Promise<{ caseId: string; sceneId: string }>
}) {
  const { caseId, sceneId } = await params
  if (!caseId || !sceneId) notFound()

  const isAllowlisted = PRACTICE_CASE_IDS.has(caseId)
  if (!isAllowlisted) {
    const flagOn = await getAppFlag('lab_casebook', false)
    if (!flagOn) notFound()
  }

  const admin = createAdminClient()

  const [caseResult, scenesResult] = await Promise.all([
    admin.from('cc_cases').select('id, title').eq('id', caseId).maybeSingle(),
    admin
      .from('cc_scenes')
      .select('id, case_id, ordinal, title, goal_md, skill_lane, preload, time_budget_s')
      .eq('case_id', caseId)
      .order('ordinal', { ascending: true }),
  ])

  if (caseResult.error || !caseResult.data) notFound()
  if (scenesResult.error || !scenesResult.data) notFound()

  const scenes = scenesResult.data as SceneRow[]
  const sceneIndexInList = scenes.findIndex((s) => s.id === sceneId)
  if (sceneIndexInList === -1) notFound()
  const sceneRow = scenes[sceneIndexInList]

  const scene: PracticeScene = {
    id: sceneRow.id,
    moduleId: sceneRow.case_id,
    ordinal: sceneRow.ordinal,
    title: sceneRow.title,
    goal_md: sceneRow.goal_md,
    skill_lane: sceneRow.skill_lane as SkillLane,
    preload: {
      context_md: sceneRow.preload?.context_md ?? '',
      visible_tables: sceneRow.preload?.visible_tables ?? [],
    },
    time_budget_s: sceneRow.time_budget_s,
  }

  const payload: PracticePayload = {
    module: { id: caseResult.data.id as string, title: caseResult.data.title as string },
    scene,
    sceneIndex: sceneIndexInList + 1,
    sceneCount: scenes.length,
  }

  return <PracticeClient caseId={caseId} sceneId={sceneId} initialPayload={payload} />
}

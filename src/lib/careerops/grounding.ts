// Builds the per-user competency/practice signal the scorer grounds on, so the
// readiness map reflects real history instead of guesses.

import type { SupabaseClient } from '@supabase/supabase-js'
import { challengeTypeToDiscipline, type LiveInterviewDiscipline } from '@/lib/live-interview/disciplines'

export interface CareerGrounding {
  competencyText: string
  practiceText: string
  practiceByDiscipline: Record<LiveInterviewDiscipline, number>
}

const EMPTY_PRACTICE: Record<LiveInterviewDiscipline, number> = {
  product_sense: 0,
  system_design: 0,
  data_modeling: 0,
  coding: 0,
  sql: 0,
}

export async function buildCareerGrounding(
  userId: string,
  admin: SupabaseClient,
): Promise<CareerGrounding> {
  const practiceByDiscipline = { ...EMPTY_PRACTICE }

  const [{ data: comps }, { data: attempts }] = await Promise.all([
    admin
      .from('learner_competencies')
      .select('competency, score, trend')
      .eq('user_id', userId),
    admin
      .from('challenge_attempts')
      .select('challenge_id, challenges!inner(challenge_type)')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .limit(500),
  ])

  const competencyText = (comps ?? []).length
    ? (comps ?? [])
        .map((c) => `${c.competency}: ${Math.round(Number(c.score))}/100 (${c.trend})`)
        .join('; ')
    : 'No competency history yet.'

  for (const row of attempts ?? []) {
    const joined = (row as { challenges?: { challenge_type?: string } | Array<{ challenge_type?: string }> }).challenges
    const challengeType = Array.isArray(joined) ? joined[0]?.challenge_type : joined?.challenge_type
    const discipline = challengeTypeToDiscipline(challengeType)
    if (discipline) practiceByDiscipline[discipline] += 1
  }

  const practiceText = Object.entries(practiceByDiscipline)
    .map(([discipline, count]) => `${discipline}: ${count} completed`)
    .join('; ')

  return { competencyText, practiceText, practiceByDiscipline }
}

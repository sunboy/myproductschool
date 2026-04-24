import { createAdminClient } from '@/lib/supabase/admin'

// ── Public interface ─────────────────────────────────────────

export interface HatchUserContext {
  displayName: string | null
  preferredRole: string | null
  overallLevel: 'Beginner' | 'Developing' | 'Advanced' | 'Expert'
  competencies: Array<{ competency: string; score: number; trend: string }>
  weakestCompetency: string | null
  moveLevels: Array<{ move: string; level: number; progress_pct: number }>
  recurringPatterns: Array<{ pattern_id: string; pattern_name: string; count: number }>
  recentStepAttempts: Array<{ step: string; score: number | null; competencies_demonstrated: string[] }>
  recentCompletions: Array<{ challengeId: string; gradeLabel: string; totalScore: number }>
  hatchInsights: string[]
}

// ── Helpers ──────────────────────────────────────────────────

function deriveOverallLevel(competencies: HatchUserContext['competencies']): HatchUserContext['overallLevel'] {
  if (!competencies.length) return 'Beginner'
  const avg = competencies.reduce((sum, c) => sum + c.score, 0) / competencies.length
  if (avg >= 80) return 'Expert'
  if (avg >= 60) return 'Advanced'
  if (avg >= 40) return 'Developing'
  return 'Beginner'
}

function deriveWeakestCompetency(competencies: HatchUserContext['competencies']): string | null {
  if (!competencies.length) return null
  const sorted = [...competencies].sort((a, b) => a.score - b.score)
  return sorted[0].competency
}

const EMPTY_CONTEXT: HatchUserContext = {
  displayName: null,
  preferredRole: null,
  overallLevel: 'Beginner',
  competencies: [],
  weakestCompetency: null,
  moveLevels: [],
  recurringPatterns: [],
  recentStepAttempts: [],
  recentCompletions: [],
  hatchInsights: [],
}

// ── Main query function ──────────────────────────────────────

export async function getHatchContext(userId: string): Promise<HatchUserContext> {
  try {
    const admin = createAdminClient()

    const [
      profileResult,
      competenciesResult,
      moveLevelsResult,
      failurePatternsResult,
      stepAttemptsResult,
      completionsResult,
      hatchInsightsResult,
    ] = await Promise.all([
      // 1. profiles
      (async () => {
        try {
          const { data } = await admin
            .from('profiles')
            .select('preferred_role, display_name')
            .eq('id', userId)
            .single()
          return data
        } catch {
          return null
        }
      })(),

      // 2. learner_competencies
      (async () => {
        try {
          const { data } = await admin
            .from('learner_competencies')
            .select('competency, score, trend')
            .eq('user_id', userId)
          return data ?? []
        } catch {
          return []
        }
      })(),

      // 3. move_levels
      (async () => {
        try {
          const { data } = await admin
            .from('move_levels')
            .select('move, level, progress_pct')
            .eq('user_id', userId)
          return data ?? []
        } catch {
          return []
        }
      })(),

      // 4. user_failure_patterns — top 20 recent, group by pattern_id, top 5 by count
      (async () => {
        try {
          const { data } = await admin
            .from('user_failure_patterns')
            .select('pattern_id, pattern_name')
            .eq('user_id', userId)
            .order('detected_at', { ascending: false })
            .limit(20)
          if (!data?.length) return []
          // Group by pattern_id and count occurrences
          const counts = new Map<string, { pattern_id: string; pattern_name: string; count: number }>()
          for (const row of data) {
            const existing = counts.get(row.pattern_id)
            if (existing) {
              existing.count++
            } else {
              counts.set(row.pattern_id, { pattern_id: row.pattern_id, pattern_name: row.pattern_name, count: 1 })
            }
          }
          return [...counts.values()]
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
        } catch {
          return []
        }
      })(),

      // 5. step_attempts joined with challenge_attempts — last 10 for user
      (async () => {
        try {
          const { data } = await admin
            .from('step_attempts')
            .select('step, score, competencies_demonstrated, challenge_attempts!inner(user_id)')
            .eq('challenge_attempts.user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10)
          if (!data?.length) return []
          return data.map((row) => ({
            step: row.step as string,
            score: row.score as number | null,
            competencies_demonstrated: (row.competencies_demonstrated ?? []) as string[],
          }))
        } catch {
          return []
        }
      })(),

      // 6. challenge_attempts — last 3 completed
      (async () => {
        try {
          const { data } = await admin
            .from('challenge_attempts')
            .select('challenge_id, grade_label, total_score')
            .eq('user_id', userId)
            .eq('status', 'completed')
            .order('completed_at', { ascending: false })
            .limit(3)
          if (!data?.length) return []
          return data.map((row) => ({
            challengeId: row.challenge_id as string,
            gradeLabel: (row.grade_label ?? '') as string,
            totalScore: (row.total_score ?? 0) as number,
          }))
        } catch {
          return []
        }
      })(),

      // 7. hatch_context — last 3 active insights
      (async () => {
        try {
          const { data } = await admin
            .from('hatch_context')
            .select('content')
            .eq('user_id', userId)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(3)
          if (!data?.length) return []
          return data.map((row) => row.content as string)
        } catch {
          return []
        }
      })(),
    ])

    const competencies = (competenciesResult as Array<{ competency: string; score: number; trend: string }>) ?? []

    return {
      displayName: (profileResult as { preferred_role: string | null; display_name: string | null } | null)?.display_name ?? null,
      preferredRole: (profileResult as { preferred_role: string | null; display_name: string | null } | null)?.preferred_role ?? null,
      overallLevel: deriveOverallLevel(competencies),
      competencies,
      weakestCompetency: deriveWeakestCompetency(competencies),
      moveLevels: (moveLevelsResult as Array<{ move: string; level: number; progress_pct: number }>) ?? [],
      recurringPatterns: (failurePatternsResult as HatchUserContext['recurringPatterns']) ?? [],
      recentStepAttempts: (stepAttemptsResult as HatchUserContext['recentStepAttempts']) ?? [],
      recentCompletions: (completionsResult as HatchUserContext['recentCompletions']) ?? [],
      hatchInsights: (hatchInsightsResult as string[]) ?? [],
    }
  } catch {
    return { ...EMPTY_CONTEXT }
  }
}

// ── Context string builder ───────────────────────────────────

function isEmptyContext(ctx: HatchUserContext): boolean {
  return (
    ctx.preferredRole === null &&
    ctx.competencies.length === 0 &&
    ctx.moveLevels.length === 0 &&
    ctx.recurringPatterns.length === 0 &&
    ctx.recentStepAttempts.length === 0 &&
    ctx.recentCompletions.length === 0 &&
    ctx.hatchInsights.length === 0
  )
}

export function buildHatchContextString(
  ctx: HatchUserContext,
  mode: 'feedback' | 'chat' | 'nudge' | 'coaching'
): string {
  if (isEmptyContext(ctx)) return ''

  const top3Patterns = ctx.recurringPatterns.slice(0, 3)

  switch (mode) {
    case 'feedback': {
      const patternsStr = top3Patterns.length
        ? top3Patterns.map((p) => `${p.pattern_name} (${p.count} times)`).join(', ')
        : 'none detected'
      const completionsStr = ctx.recentCompletions.length
        ? ctx.recentCompletions.map((c) => `${c.gradeLabel} (${c.totalScore}/100)`).join(', ')
        : 'no completions yet'
      const lines: string[] = []
      if (ctx.displayName) lines.push(`Learner name: ${ctx.displayName}`)
      lines.push(
        `User role: ${ctx.preferredRole ?? 'not specified'}`,
        `Skill level: ${ctx.overallLevel}`,
        `Weakest competency: ${ctx.weakestCompetency ?? 'unknown'}`,
        `Recurring failure patterns: ${patternsStr}`,
        `Recent performance: ${completionsStr}`,
      )
      return lines.join('\n')
    }

    case 'chat': {
      const moveLevelsStr = ctx.moveLevels.length
        ? ctx.moveLevels.map((m) => `${m.move}: Lv.${m.level}`).join(' | ')
        : 'not yet assessed'
      const patternsStr = top3Patterns.length
        ? top3Patterns.map((p) => p.pattern_name).join(', ')
        : 'none detected'
      const last5Steps = ctx.recentStepAttempts.slice(0, 5)
      const stepsStr = last5Steps.length
        ? last5Steps.map((s) => `${s.step}(${s.score ?? '?'})`).join(' → ')
        : 'no attempts yet'
      const lines: string[] = []
      if (ctx.displayName) lines.push(`Learner name: ${ctx.displayName}`)
      lines.push(
        `User role: ${ctx.preferredRole ?? 'not specified'}`,
        `Skill level: ${ctx.overallLevel}`,
        `FLOW move levels: ${moveLevelsStr}`,
        `Recurring patterns to watch: ${patternsStr}`,
        `Recent step quality: ${stepsStr}`,
      )
      return lines.join('\n')
    }

    case 'nudge': {
      const lines: string[] = []
      if (ctx.displayName) lines.push(`Learner name: ${ctx.displayName}`)
      lines.push(`Weakest area: ${ctx.weakestCompetency ?? 'unknown'}`)
      return lines.join('\n')
    }

    case 'coaching': {
      const competenciesStr = ctx.competencies.length
        ? ctx.competencies.map((c) => `${c.competency}: ${c.score}/100`).join(' | ')
        : 'not yet assessed'
      const topPattern = ctx.recurringPatterns[0]?.pattern_name ?? 'none detected'
      const last5Steps = ctx.recentStepAttempts.slice(0, 5)
      const stepsStr = last5Steps.length
        ? last5Steps.map((s) => `${s.step}(${s.score ?? '?'})`).join(' → ')
        : 'no attempts yet'
      const lines: string[] = []
      if (ctx.displayName) lines.push(`Learner name: ${ctx.displayName}`)
      lines.push(
        `User role: ${ctx.preferredRole ?? 'not specified'}`,
        `Skill level: ${ctx.overallLevel}`,
        `Competency scores: ${competenciesStr}`,
        `Top recurring pattern: ${topPattern}`,
        `Recent step attempts: ${stepsStr}`,
      )
      return lines.join('\n')
    }
  }
}

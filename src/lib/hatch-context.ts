import { createAdminClient } from '@/lib/supabase/admin'

// ── Public interface ─────────────────────────────────────────

export interface HatchUserContext {
  displayName: string | null
  preferredRole: string | null
  activeRole: string | null
  roleContext: string | null
  interviewDate: string | null
  overallLevel: 'Beginner' | 'Developing' | 'Advanced' | 'Expert'
  competencies: Array<{ competency: string; score: number; trend: string }>
  weakestCompetency: string | null
  moveLevels: Array<{ move: string; level: number; progress_pct: number }>
  recurringPatterns: Array<{ pattern_id: string; pattern_name: string; count: number }>
  recentStepAttempts: Array<{ step: string; score: number | null; competencies_demonstrated: string[] }>
  recentCompletions: Array<{
    challengeId: string
    gradeLabel: string
    totalScore: number
    completedAt: string | null
  }>
  recentLiveInterviews: Array<{
    roleId: string | null
    grade: string | null
    overallScore: number | null
    endedAt: string | null
    topImprovement: string | null
  }>
  practiceStats: {
    completedChallenges: number
    completedLiveInterviews: number
    averageChallengeScore: number | null
    averageLiveInterviewScore: number | null
  }
  hatchInsights: string[]
  communitySignals: {
    optedIntoSharing: boolean
    sharedSubmissionCount: number
    feedbackGivenCount: number
    feedbackReceivedCount: number
    badges: Array<{ badge_key: string; reason: string | null }>
    recentLenses: string[]
  }
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
  activeRole: null,
  roleContext: null,
  interviewDate: null,
  overallLevel: 'Beginner',
  competencies: [],
  weakestCompetency: null,
  moveLevels: [],
  recurringPatterns: [],
  recentStepAttempts: [],
  recentCompletions: [],
  recentLiveInterviews: [],
  practiceStats: {
    completedChallenges: 0,
    completedLiveInterviews: 0,
    averageChallengeScore: null,
    averageLiveInterviewScore: null,
  },
  hatchInsights: [],
  communitySignals: {
    optedIntoSharing: false,
    sharedSubmissionCount: 0,
    feedbackGivenCount: 0,
    feedbackReceivedCount: 0,
    badges: [],
    recentLenses: [],
  },
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
      liveInterviewHistoryResult,
      hatchInsightsResult,
      communitySignalsResult,
    ] = await Promise.all([
      // 1. profiles
      (async () => {
        try {
          const { data } = await admin
            .from('profiles')
            .select('preferred_role, display_name, active_role, role_context, interview_date')
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

      // 6. challenge_attempts — recent completed practice sessions
      (async () => {
        try {
          const { data } = await admin
            .from('challenge_attempts')
            .select('challenge_id, grade_label, total_score, completed_at')
            .eq('user_id', userId)
            .eq('status', 'completed')
            .order('completed_at', { ascending: false })
            .limit(8)
          if (!data?.length) return []
          return data.map((row) => ({
            challengeId: row.challenge_id as string,
            gradeLabel: (row.grade_label ?? '') as string,
            totalScore: (row.total_score ?? 0) as number,
            completedAt: (row.completed_at ?? null) as string | null,
          }))
        } catch {
          return []
        }
      })(),

      // 7. live_interview_sessions — last 5 completed interview debriefs
      (async () => {
        try {
          const { data } = await admin
            .from('live_interview_sessions')
            .select('role_id, debrief_json, ended_at')
            .eq('user_id', userId)
            .eq('status', 'completed')
            .order('ended_at', { ascending: false })
            .limit(5)
          if (!data?.length) return []
          return data.map((row) => {
            const debrief = (row.debrief_json ?? {}) as Record<string, unknown>
            const improvements = Array.isArray(debrief.improvements) ? debrief.improvements : []
            return {
              roleId: (row.role_id ?? null) as string | null,
              grade: (debrief.grade ?? null) as string | null,
              overallScore: typeof debrief.overallScore === 'number' ? debrief.overallScore : null,
              endedAt: (row.ended_at ?? null) as string | null,
              topImprovement: typeof improvements[0] === 'string' ? improvements[0] : null,
            }
          })
        } catch {
          return []
        }
      })(),

      // 8. hatch_context — last 3 active insights
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

      // 9. Community signals: sharing, feedback trades, badges
      (async () => {
        try {
          const [submissionsResult, feedbackGivenResult, feedbackReceivedResult, badgesResult] = await Promise.all([
            admin
              .from('community_submissions')
              .select('status, lens_tag, display_mode')
              .eq('user_id', userId)
              .order('created_at', { ascending: false })
              .limit(8),
            admin
              .from('community_feedback_trades')
              .select('id', { count: 'exact', head: true })
              .eq('reviewer_user_id', userId),
            admin
              .from('community_feedback_trades')
              .select('id', { count: 'exact', head: true })
              .eq('recipient_user_id', userId),
            admin
              .from('community_badges')
              .select('badge_key, reason')
              .eq('user_id', userId)
              .order('created_at', { ascending: false })
              .limit(4),
          ])

          const submissions = submissionsResult.data ?? []
          return {
            optedIntoSharing: submissions.some(s => s.status === 'published' || s.status === 'featured'),
            sharedSubmissionCount: submissions.filter(s => s.status === 'published' || s.status === 'featured').length,
            feedbackGivenCount: feedbackGivenResult.count ?? 0,
            feedbackReceivedCount: feedbackReceivedResult.count ?? 0,
            badges: (badgesResult.data ?? []) as Array<{ badge_key: string; reason: string | null }>,
            recentLenses: submissions.map(s => s.lens_tag as string).filter(Boolean).slice(0, 4),
          }
        } catch {
          return EMPTY_CONTEXT.communitySignals
        }
      })(),
    ])

    const competencies = (competenciesResult as Array<{ competency: string; score: number; trend: string }>) ?? []
    const recentCompletions = (completionsResult as HatchUserContext['recentCompletions']) ?? []
    const recentLiveInterviews = (liveInterviewHistoryResult as HatchUserContext['recentLiveInterviews']) ?? []
    const challengeScores = recentCompletions.map((c) => c.totalScore).filter((score) => Number.isFinite(score))
    const liveScores = recentLiveInterviews
      .map((session) => session.overallScore)
      .filter((score): score is number => typeof score === 'number' && Number.isFinite(score))

    return {
      displayName: (profileResult as {
        preferred_role: string | null
        display_name: string | null
        active_role: string | null
        role_context: string | null
        interview_date: string | null
      } | null)?.display_name ?? null,
      preferredRole: (profileResult as {
        preferred_role: string | null
        display_name: string | null
        active_role: string | null
        role_context: string | null
        interview_date: string | null
      } | null)?.preferred_role ?? null,
      activeRole: (profileResult as {
        preferred_role: string | null
        display_name: string | null
        active_role: string | null
        role_context: string | null
        interview_date: string | null
      } | null)?.active_role ?? null,
      roleContext: (profileResult as {
        preferred_role: string | null
        display_name: string | null
        active_role: string | null
        role_context: string | null
        interview_date: string | null
      } | null)?.role_context ?? null,
      interviewDate: (profileResult as {
        preferred_role: string | null
        display_name: string | null
        active_role: string | null
        role_context: string | null
        interview_date: string | null
      } | null)?.interview_date ?? null,
      overallLevel: deriveOverallLevel(competencies),
      competencies,
      weakestCompetency: deriveWeakestCompetency(competencies),
      moveLevels: (moveLevelsResult as Array<{ move: string; level: number; progress_pct: number }>) ?? [],
      recurringPatterns: (failurePatternsResult as HatchUserContext['recurringPatterns']) ?? [],
      recentStepAttempts: (stepAttemptsResult as HatchUserContext['recentStepAttempts']) ?? [],
      recentCompletions,
      recentLiveInterviews,
      practiceStats: {
        completedChallenges: recentCompletions.length,
        completedLiveInterviews: recentLiveInterviews.length,
        averageChallengeScore: challengeScores.length
          ? Math.round((challengeScores.reduce((sum, score) => sum + score, 0) / challengeScores.length) * 10) / 10
          : null,
        averageLiveInterviewScore: liveScores.length
          ? Math.round((liveScores.reduce((sum, score) => sum + score, 0) / liveScores.length) * 10) / 10
          : null,
      },
      hatchInsights: (hatchInsightsResult as string[]) ?? [],
      communitySignals: (communitySignalsResult as HatchUserContext['communitySignals']) ?? EMPTY_CONTEXT.communitySignals,
    }
  } catch {
    return { ...EMPTY_CONTEXT }
  }
}

// ── Context string builder ───────────────────────────────────

function isEmptyContext(ctx: HatchUserContext): boolean {
  return (
    ctx.preferredRole === null &&
    ctx.activeRole === null &&
    ctx.roleContext === null &&
    ctx.interviewDate === null &&
    ctx.competencies.length === 0 &&
    ctx.moveLevels.length === 0 &&
    ctx.recurringPatterns.length === 0 &&
    ctx.recentStepAttempts.length === 0 &&
    ctx.recentCompletions.length === 0 &&
    ctx.recentLiveInterviews.length === 0 &&
    ctx.hatchInsights.length === 0 &&
    ctx.communitySignals.sharedSubmissionCount === 0 &&
    ctx.communitySignals.feedbackGivenCount === 0 &&
    ctx.communitySignals.feedbackReceivedCount === 0 &&
    ctx.communitySignals.badges.length === 0
  )
}

export function buildHatchContextString(
  ctx: HatchUserContext,
  mode: 'feedback' | 'chat' | 'nudge' | 'coaching'
): string {
  if (isEmptyContext(ctx)) return ''

  const top3Patterns = ctx.recurringPatterns.slice(0, 3)
  const role = ctx.preferredRole ?? ctx.activeRole ?? 'not specified'
  const practiceStats = [
    `${ctx.practiceStats.completedChallenges} recent completed challenges`,
    `${ctx.practiceStats.completedLiveInterviews} recent completed live interviews`,
    ctx.practiceStats.averageChallengeScore != null
      ? `avg challenge score ${ctx.practiceStats.averageChallengeScore}/5`
      : null,
    ctx.practiceStats.averageLiveInterviewScore != null
      ? `avg live interview score ${ctx.practiceStats.averageLiveInterviewScore}/5`
      : null,
  ].filter(Boolean).join(' | ')

  const recentLiveInterviewStr = ctx.recentLiveInterviews.length
    ? ctx.recentLiveInterviews
        .slice(0, 3)
        .map((session) => {
          const score = session.overallScore != null ? `${session.overallScore}/5` : 'unscored'
          const improvement = session.topImprovement ? `; next improvement: ${session.topImprovement}` : ''
          return `${session.roleId ?? 'role unknown'} ${session.grade ?? ''} (${score})${improvement}`
        })
        .join(' | ')
    : 'none yet'

  const completionStr = ctx.recentCompletions.length
    ? ctx.recentCompletions
        .slice(0, 5)
        .map((c) => `${c.gradeLabel || 'ungraded'} (${c.totalScore}/5)`)
        .join(' | ')
    : 'no completions yet'

  const hatchInsightsStr = ctx.hatchInsights.length
    ? ctx.hatchInsights.map((insight) => `- ${insight}`).join('\n')
    : 'none'

  switch (mode) {
    case 'feedback': {
      const patternsStr = top3Patterns.length
        ? top3Patterns.map((p) => `${p.pattern_name} (${p.count} times)`).join(', ')
        : 'none detected'
      const lines: string[] = []
      if (ctx.displayName) lines.push(`Learner name: ${ctx.displayName}`)
      lines.push(
        `User role: ${role}`,
        `Interview date: ${ctx.interviewDate ?? 'not set'}`,
        `Skill level: ${ctx.overallLevel}`,
        `Weakest competency: ${ctx.weakestCompetency ?? 'unknown'}`,
        `Recurring failure patterns: ${patternsStr}`,
        `Practice stats: ${practiceStats}`,
        `Recent challenge performance: ${completionStr}`,
        `Recent live interviews: ${recentLiveInterviewStr}`,
        `Community context: sharing ${ctx.communitySignals.optedIntoSharing ? 'opted in' : 'not opted in'}, feedback given ${ctx.communitySignals.feedbackGivenCount}, feedback received ${ctx.communitySignals.feedbackReceivedCount}`,
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
        `User role: ${role}`,
        `Interview date: ${ctx.interviewDate ?? 'not set'}`,
        `Skill level: ${ctx.overallLevel}`,
        `FLOW move levels: ${moveLevelsStr}`,
        `Recurring patterns to watch: ${patternsStr}`,
        `Recent step quality: ${stepsStr}`,
        `Recent live interviews: ${recentLiveInterviewStr}`,
        `Community badges: ${ctx.communitySignals.badges.map(b => b.badge_key).join(', ') || 'none yet'}`,
      )
      return lines.join('\n')
    }

    case 'nudge': {
      const lines: string[] = []
      if (ctx.displayName) lines.push(`Learner name: ${ctx.displayName}`)
      lines.push(`Weakest area: ${ctx.weakestCompetency ?? 'unknown'}`)
      lines.push(`Recent practice context: ${practiceStats}`)
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
        `User role: ${role}`,
        `Role context: ${ctx.roleContext ?? 'not specified'}`,
        `Interview date: ${ctx.interviewDate ?? 'not set'}`,
        `Skill level: ${ctx.overallLevel}`,
        `Practice stats: ${practiceStats}`,
        `Competency scores: ${competenciesStr}`,
        `Top recurring pattern: ${topPattern}`,
        `Recent step attempts: ${stepsStr}`,
        `Recent challenge completions: ${completionStr}`,
        `Recent live interview debriefs: ${recentLiveInterviewStr}`,
        `Hatch memory / insights:\n${hatchInsightsStr}`,
        `Community signals: ${ctx.communitySignals.sharedSubmissionCount} shared answers, ${ctx.communitySignals.feedbackGivenCount} reviews given, lenses ${ctx.communitySignals.recentLenses.join(', ') || 'none yet'}`,
      )
      return lines.join('\n')
    }
  }
}

import { NextResponse, type NextRequest } from 'next/server'
import { sanitizeAiOutput } from '@/lib/ai/sanitize'
import { sendWeeklyDigestEmail } from '@/lib/email/transactional'
import { createUnsubscribeToken } from '@/lib/notifications/unsubscribe'
import { createAdminClient } from '@/lib/supabase/admin'

const ATTEMPT_LIMIT = 2000
const CHALLENGE_POOL_LIMIT = 250

type JsonRecord = Record<string, unknown>

type ChallengeJoin = {
  id: string
  title: string | null
  slug: string | null
  move_tags: string[] | null
  primary_competencies: string[] | null
}

type ChallengeAttemptRow = {
  id: string
  user_id: string
  challenge_id: string
  total_score: number | string | null
  max_score: number | string | null
  completed_at: string | null
  feedback_json: unknown
  challenges: ChallengeJoin | ChallengeJoin[] | null
}

type StepAttemptRow = {
  attempt_id: string
  score: number | string | null
  competencies_demonstrated: string[] | null
  competency_signal: unknown
}

type NotificationPrefRow = {
  user_id: string
  weekly_digest: boolean | null
}

type NotificationLogRow = {
  dedupe_key: string
}

type ProfileRow = {
  id: string
  display_name: string | null
}

type MoveLevelRow = {
  user_id: string
  move: string
  xp: number | string | null
}

type LearnerCompetencyRow = {
  user_id: string
  competency: string
  score: number | string | null
}

type PublishedChallengeRow = {
  id: string
  title: string | null
  slug: string | null
  move_tags: string[] | null
  primary_competencies: string[] | null
}

type CompletionRow = {
  user_id: string
  challenge_id: string
}

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  return Boolean(secret && request.headers.get('authorization') === `Bearer ${secret}`)
}

function appUrl(request: NextRequest, path: string) {
  return new URL(path, process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin).toString()
}

function toNumber(value: number | string | null | undefined) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function toRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as JsonRecord
}

function challengeFromAttempt(row: ChallengeAttemptRow) {
  if (Array.isArray(row.challenges)) return row.challenges[0] ?? null
  return row.challenges ?? null
}

function labelFromSlug(value: string | null | undefined) {
  if (!value) return null
  const lower = value.replace(/_/g, ' ').trim()
  if (!lower) return null
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

function weeklyWindow(now = new Date()) {
  const end = new Date(now)
  const start = new Date(end)
  start.setUTCDate(start.getUTCDate() - 7)
  return { start, end }
}

function isoDate(value: Date) {
  return value.toISOString().slice(0, 10)
}

function xpFromAttempt(row: ChallengeAttemptRow) {
  const feedback = toRecord(row.feedback_json)
  const explicitXp = toNumber(feedback.xp_awarded as number | string | null | undefined)
    ?? toNumber(feedback.xp_earned as number | string | null | undefined)
  if (explicitXp !== null) return Math.max(0, Math.round(explicitXp))

  const total = toNumber(row.total_score)
  const max = toNumber(row.max_score)
  if (total === null || !max) return 0
  return Math.max(0, Math.round((total / max) * 100))
}

function addToSetMap(map: Map<string, Set<string>>, key: string, value: string) {
  const existing = map.get(key) ?? new Set<string>()
  existing.add(value)
  map.set(key, existing)
}

function addStat(
  map: Map<string, Map<string, { sum: number; count: number }>>,
  userId: string,
  competency: string,
  score: number
) {
  const userStats = map.get(userId) ?? new Map<string, { sum: number; count: number }>()
  const existing = userStats.get(competency) ?? { sum: 0, count: 0 }
  existing.sum += score
  existing.count += 1
  userStats.set(competency, existing)
  map.set(userId, userStats)
}

function competencyNames(row: StepAttemptRow) {
  const names = new Set<string>()
  for (const competency of row.competencies_demonstrated ?? []) {
    if (competency) names.add(competency)
  }

  const signal = toRecord(row.competency_signal)
  const signalCompetency = signal.competency ?? signal.primary
  if (typeof signalCompetency === 'string' && signalCompetency) {
    names.add(signalCompetency)
  }

  return Array.from(names)
}

function rankedCompetencies(stats: Map<string, { sum: number; count: number }> | undefined) {
  if (!stats) return []
  return Array.from(stats.entries())
    .filter(([, stat]) => stat.count > 0)
    .map(([competency, stat]) => ({ competency, score: stat.sum / stat.count }))
    .sort((a, b) => b.score - a.score)
}

function sanitizeDigestCopy(text: string, userId: string) {
  return sanitizeAiOutput({
    text,
    route: 'email:weekly_digest',
    model: 'deterministic-weekly-digest',
    userId,
    log: false,
  }).text
}

function challengePath(challenge: PublishedChallengeRow) {
  return `/workspace/challenges/${encodeURIComponent(challenge.slug ?? challenge.id)}`
}

function pickRecommendation(options: {
  userId: string
  challengePool: PublishedChallengeRow[]
  completedByUser: Map<string, Set<string>>
  weakestCompetency: string | null
  weakestMove: string | null
}) {
  const completed = options.completedByUser.get(options.userId) ?? new Set<string>()
  const available = options.challengePool.filter(challenge => !completed.has(challenge.id))
  if (available.length === 0) return null

  if (options.weakestCompetency) {
    const byCompetency = available.find(challenge =>
      (challenge.primary_competencies ?? []).includes(options.weakestCompetency!)
    )
    if (byCompetency) return byCompetency
  }

  if (options.weakestMove) {
    const byMove = available.find(challenge => (challenge.move_tags ?? []).includes(options.weakestMove!))
    if (byMove) return byMove
  }

  return available[0]
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return unauthorized()

  const admin = createAdminClient()
  const { start, end } = weeklyWindow()
  const weekKey = isoDate(start)

  const { data: attemptsData, error: attemptsError } = await admin
    .from('challenge_attempts')
    .select('id, user_id, challenge_id, total_score, max_score, completed_at, feedback_json, challenges(id, title, slug, move_tags, primary_competencies)')
    .eq('status', 'completed')
    .gte('completed_at', start.toISOString())
    .lt('completed_at', end.toISOString())
    .order('completed_at', { ascending: false })
    .limit(ATTEMPT_LIMIT)

  if (attemptsError) {
    return NextResponse.json({ error: 'Could not load weekly completions.' }, { status: 500 })
  }

  const attempts = (attemptsData ?? []) as ChallengeAttemptRow[]
  const userIds = Array.from(new Set(attempts.map(row => row.user_id)))
  if (userIds.length === 0) {
    return NextResponse.json({ ok: true, attempted: 0, sent: 0, skipped: 0 })
  }

  const attemptIds = attempts.map(row => row.id)
  const dedupeKeys = userIds.map(userId => `weekly_digest:${weekKey}:${userId}`)

  const [
    prefsResult,
    logsResult,
    profilesResult,
    stepAttemptsResult,
    levelsResult,
    competenciesResult,
    completionsResult,
    challengePoolResult,
  ] = await Promise.all([
    admin
      .from('notification_prefs')
      .select('user_id, weekly_digest')
      .in('user_id', userIds),
    admin
      .from('notification_log')
      .select('dedupe_key')
      .eq('kind', 'weekly_digest')
      .in('dedupe_key', dedupeKeys),
    admin
      .from('profiles')
      .select('id, display_name')
      .in('id', userIds),
    admin
      .from('step_attempts')
      .select('attempt_id, score, competencies_demonstrated, competency_signal')
      .in('attempt_id', attemptIds),
    admin
      .from('move_levels')
      .select('user_id, move, xp')
      .in('user_id', userIds)
      .order('xp', { ascending: true }),
    admin
      .from('learner_competencies')
      .select('user_id, competency, score')
      .in('user_id', userIds),
    admin
      .from('challenge_attempts')
      .select('user_id, challenge_id')
      .eq('status', 'completed')
      .in('user_id', userIds)
      .limit(10000),
    admin
      .from('challenges')
      .select('id, title, slug, move_tags, primary_competencies')
      .eq('is_published', true)
      .neq('challenge_type', 'quick_take')
      .neq('challenge_type', 'freeform')
      .order('created_at', { ascending: false })
      .limit(CHALLENGE_POOL_LIMIT),
  ])

  if (
    prefsResult.error ||
    logsResult.error ||
    profilesResult.error ||
    stepAttemptsResult.error ||
    levelsResult.error ||
    competenciesResult.error ||
    completionsResult.error ||
    challengePoolResult.error
  ) {
    return NextResponse.json({ error: 'Could not load weekly digest state.' }, { status: 500 })
  }

  const prefs = new Map(
    ((prefsResult.data ?? []) as NotificationPrefRow[]).map(row => [row.user_id, row.weekly_digest])
  )
  const alreadyLogged = new Set(((logsResult.data ?? []) as NotificationLogRow[]).map(row => row.dedupe_key))
  const profiles = new Map(((profilesResult.data ?? []) as ProfileRow[]).map(row => [row.id, row]))
  const challengePool = (challengePoolResult.data ?? []) as PublishedChallengeRow[]

  const attemptsByUser = new Map<string, ChallengeAttemptRow[]>()
  const attemptUser = new Map<string, string>()
  const completedByUser = new Map<string, Set<string>>()

  for (const attempt of attempts) {
    attemptUser.set(attempt.id, attempt.user_id)
    const existing = attemptsByUser.get(attempt.user_id) ?? []
    existing.push(attempt)
    attemptsByUser.set(attempt.user_id, existing)
  }

  for (const completion of (completionsResult.data ?? []) as CompletionRow[]) {
    addToSetMap(completedByUser, completion.user_id, completion.challenge_id)
  }

  const recentCompetencyStats = new Map<string, Map<string, { sum: number; count: number }>>()
  for (const row of (stepAttemptsResult.data ?? []) as StepAttemptRow[]) {
    const userId = attemptUser.get(row.attempt_id)
    const score = toNumber(row.score)
    if (!userId || score === null) continue
    for (const competency of competencyNames(row)) {
      addStat(recentCompetencyStats, userId, competency, score)
    }
  }

  const learnerCompetencyStats = new Map<string, Map<string, { sum: number; count: number }>>()
  for (const row of (competenciesResult.data ?? []) as LearnerCompetencyRow[]) {
    const score = toNumber(row.score)
    if (score === null) continue
    addStat(learnerCompetencyStats, row.user_id, row.competency, score)
  }

  const weakestMoveByUser = new Map<string, string>()
  for (const row of (levelsResult.data ?? []) as MoveLevelRow[]) {
    if (!weakestMoveByUser.has(row.user_id)) {
      weakestMoveByUser.set(row.user_id, row.move)
    }
  }

  let attempted = 0
  let sent = 0
  let skipped = 0

  for (const userId of userIds) {
    const dedupeKey = `weekly_digest:${weekKey}:${userId}`
    if (prefs.get(userId) === false || alreadyLogged.has(dedupeKey)) {
      skipped += 1
      continue
    }

    const userAttempts = attemptsByUser.get(userId) ?? []
    if (userAttempts.length === 0) {
      skipped += 1
      continue
    }

    const recentRanked = rankedCompetencies(recentCompetencyStats.get(userId))
    const fallbackRanked = rankedCompetencies(learnerCompetencyStats.get(userId))
    const ranked = recentRanked.length > 0 ? recentRanked : fallbackRanked
    const strongestRaw = ranked[0]?.competency ?? null
    const weakestRaw = ranked.at(-1)?.competency ?? null
    const strongestCompetency = labelFromSlug(strongestRaw)
    const weakestCompetency = labelFromSlug(weakestRaw)
    const weakestMove = weakestMoveByUser.get(userId) ?? null
    const recommendation = pickRecommendation({
      userId,
      challengePool,
      completedByUser,
      weakestCompetency: weakestRaw,
      weakestMove,
    })
    const recommendationTitle = recommendation?.title ?? null
    const recommendationCopy = sanitizeDigestCopy(
      recommendationTitle
        ? `Next: ${recommendationTitle}${weakestCompetency ? ` targets ${weakestCompetency}` : ' is ready for another focused practice rep'}.`
        : 'Review last week, then pick the next focused practice rep.',
      userId
    )
    const challengeTitles = userAttempts
      .map(challengeFromAttempt)
      .map(challenge => challenge?.title)
      .filter((title): title is string => Boolean(title))
      .slice(0, 5)

    attempted += 1
    const token = createUnsubscribeToken({ userId, preference: 'weekly_digest' })
    const unsubscribeUrl = token ? appUrl(request, `/api/notifications/unsubscribe?token=${token}`) : null

    await sendWeeklyDigestEmail(admin, {
      dedupeKey,
      userId,
      name: profiles.get(userId)?.display_name,
      challengesCompleted: userAttempts.length,
      xpEarned: userAttempts.reduce((sum, attempt) => sum + xpFromAttempt(attempt), 0),
      strongestCompetency,
      weakestCompetency,
      recommendationCopy,
      url: recommendation ? appUrl(request, challengePath(recommendation)) : appUrl(request, '/dashboard'),
      unsubscribeUrl,
    })

    const { data: emailEvent } = await admin
      .from('email_dedupes')
      .select('status')
      .eq('dedupe_key', dedupeKey)
      .maybeSingle()

    if (emailEvent?.status === 'sent') {
      await admin.from('notification_log').upsert({
        user_id: userId,
        kind: 'weekly_digest',
        channel: 'email',
        dedupe_key: dedupeKey,
        metadata: {
          week_start: start.toISOString(),
          week_end: end.toISOString(),
          challenges_completed: userAttempts.length,
          challenge_titles: challengeTitles,
          strongest_competency: strongestRaw,
          weakest_competency: weakestRaw,
          recommended_challenge_id: recommendation?.id ?? null,
        },
        sent_at: new Date().toISOString(),
      }, { onConflict: 'dedupe_key' })
      sent += 1
    }
  }

  return NextResponse.json({ ok: true, attempted, sent, skipped, weekStart: start.toISOString(), weekEnd: end.toISOString() })
}

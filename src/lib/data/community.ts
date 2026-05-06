import { createAdminClient } from '@/lib/supabase/admin'
import { IS_MOCK } from '@/lib/mock'
import type {
  ActivityFeedEvent,
  CommunityBadgeKey,
  CommunityDisplayMode,
  CommunityFeedbackTrade,
  CommunityGalleryResponse,
  CommunityLensTag,
  CommunityReactionTarget,
  CommunityReactionType,
  CommunitySubmission,
  WeeklyRoom,
} from '@/lib/types'
import {
  COMMUNITY_BADGE_LABELS,
  deriveLensTag,
  formatCommunityDisplayName,
} from '@/lib/community-shared'

export {
  COMMUNITY_BADGE_LABELS,
  COMMUNITY_LENS_LABELS,
  deriveLensTag,
  formatCommunityDisplayName,
} from '@/lib/community-shared'

type ProfileJoin = { display_name?: string | null } | { display_name?: string | null }[] | null
type ChallengeJoin = { title?: string | null; move_tags?: string[] | null; slug?: string | null } | { title?: string | null; move_tags?: string[] | null; slug?: string | null }[] | null

type AttemptRow = {
  id: string
  user_id: string
  challenge_id: string
  response_text: string | null
  total_score: number | null
  max_score: number | null
  grade_label: string | null
  feedback_json: Record<string, unknown> | null
  completed_at: string | null
  challenges?: ChallengeJoin
}

type SubmissionRow = CommunitySubmission & {
  profiles?: ProfileJoin
}

type ActivityRow = ActivityFeedEvent & {
  profiles?: ProfileJoin
  challenges?: ChallengeJoin
}

const MOCK_SUBMISSIONS: CommunitySubmission[] = [
  {
    id: 'mock-community-1',
    user_id: 'peer-1',
    challenge_id: 'mock-challenge',
    attempt_id: 'mock-attempt-peer-1',
    display_mode: 'anonymous',
    status: 'featured',
    response_text: 'I would split the drop by acquisition channel, platform, and returning vs new users before touching roadmap decisions.',
    excerpt: 'Split the drop by acquisition channel, platform, and returning vs new users before touching roadmap decisions.',
    lens_tag: 'segment-first',
    score: 0.86,
    hatch_summary: 'Clear segmentation before solutioning.',
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    display_name: null,
    reaction_counts: { clarity_builder: 4, upvote: 8 },
    feedback_count: 2,
  },
  {
    id: 'mock-community-2',
    user_id: 'peer-2',
    challenge_id: 'mock-challenge',
    attempt_id: 'mock-attempt-peer-2',
    display_mode: 'anonymous',
    status: 'published',
    response_text: 'I would anchor on activation and retention metrics, then call out the tradeoff between shipping a fix and learning from the failure.',
    excerpt: 'Anchor on activation and retention metrics, then call out the tradeoff between shipping a fix and learning from the failure.',
    lens_tag: 'metric-first',
    score: 0.78,
    hatch_summary: 'Good metric anchor with a useful tradeoff.',
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    display_name: null,
    reaction_counts: { metric_hawk: 3, tradeoff_catcher: 2 },
    feedback_count: 1,
  },
]

function firstJoin<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

function safeText(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function clampExcerpt(text: string, max = 280): string {
  const squashed = text.replace(/\s+/g, ' ').trim()
  if (squashed.length <= max) return squashed
  return `${squashed.slice(0, max - 3).trim()}...`
}

function normalizeSubmission(row: SubmissionRow): CommunitySubmission {
  const profile = firstJoin(row.profiles)
  return {
    ...row,
    display_name: row.display_mode === 'named' ? profile?.display_name ?? null : null,
  }
}

function normalizeActivity(row: ActivityRow): ActivityFeedEvent {
  const profile = firstJoin(row.profiles)
  const challenge = firstJoin(row.challenges)
  return {
    ...row,
    actor_display_name: row.display_mode === 'named' ? profile?.display_name ?? null : null,
    challenge_title: challenge?.title ?? null,
  }
}

async function getAttemptResponseText(admin: ReturnType<typeof createAdminClient>, attempt: AttemptRow): Promise<string> {
  if (attempt.response_text?.trim()) return attempt.response_text.trim()

  const { data: stepRows } = await admin
    .from('step_attempts')
    .select('step, user_text, selected_option_id, grading_explanation')
    .eq('attempt_id', attempt.id)
    .order('created_at', { ascending: true })

  const parts = (stepRows ?? []).map((row: { step: string; user_text: string | null; selected_option_id: string | null; grading_explanation: string | null }) => {
    const answer = row.user_text?.trim() || (row.selected_option_id ? `Selected ${row.selected_option_id}` : 'Completed')
    const signal = row.grading_explanation?.trim()
    return signal ? `${row.step}: ${answer}. Hatch signal: ${signal}` : `${row.step}: ${answer}`
  })

  return parts.join('\n') || 'Completed the challenge through structured FLOW steps.'
}

async function insertActivityEvent(input: {
  actorUserId: string | null
  eventType: ActivityFeedEvent['event_type']
  challengeId?: string | null
  submissionId?: string | null
  badgeKey?: CommunityBadgeKey | null
  displayMode?: CommunityDisplayMode
  headline: string
  metadata?: Record<string, unknown>
  visibility?: ActivityFeedEvent['visibility']
}) {
  try {
    const admin = createAdminClient()
    await admin.from('activity_feed_events').insert({
      actor_user_id: input.actorUserId,
      event_type: input.eventType,
      challenge_id: input.challengeId ?? null,
      submission_id: input.submissionId ?? null,
      badge_key: input.badgeKey ?? null,
      display_mode: input.displayMode ?? 'anonymous',
      headline: input.headline,
      metadata: input.metadata ?? {},
      visibility: input.visibility ?? 'authenticated',
    })
  } catch (error) {
    console.warn('[community] activity feed insert failed', error)
  }
}

async function awardCommunityBadge(input: {
  userId: string
  badgeKey: CommunityBadgeKey
  sourceType: 'reaction' | 'expert_pick' | 'feedback_trade'
  sourceId?: string | null
  sourceUserId?: string | null
  challengeId?: string | null
  submissionId?: string | null
  displayMode?: CommunityDisplayMode
  reason?: string
}) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('community_badges')
    .upsert(
      {
        user_id: input.userId,
        badge_key: input.badgeKey,
        source_type: input.sourceType,
        source_id: input.sourceId ?? null,
        source_user_id: input.sourceUserId ?? null,
        reason: input.reason ?? null,
      },
      { onConflict: 'user_id,badge_key,source_type,source_id' }
    )
    .select('id')
    .maybeSingle()

  if (data?.id) {
    await insertActivityEvent({
      actorUserId: input.userId,
      eventType: 'earned_badge',
      challengeId: input.challengeId,
      submissionId: input.submissionId,
      badgeKey: input.badgeKey,
      displayMode: input.displayMode ?? 'anonymous',
      headline: `Earned ${COMMUNITY_BADGE_LABELS[input.badgeKey]}`,
      metadata: { source_type: input.sourceType },
    })
  }
}

function reactionBadge(reactionType: CommunityReactionType): CommunityBadgeKey | null {
  if (reactionType === 'metric_hawk') return 'metric_hawk'
  if (reactionType === 'tradeoff_catcher') return 'tradeoff_catcher'
  if (reactionType === 'clarity_builder') return 'clarity_builder'
  if (reactionType === 'strong_win') return 'frame_sharpener'
  return null
}

async function addSubmissionStats(submissions: CommunitySubmission[]): Promise<CommunitySubmission[]> {
  if (!submissions.length || IS_MOCK) return submissions
  const admin = createAdminClient()
  const ids = submissions.map(s => s.id)

  const [{ data: reactions }, { data: feedback }] = await Promise.all([
    admin
      .from('community_reactions')
      .select('target_id, reaction_type')
      .eq('target_type', 'community_submission')
      .in('target_id', ids),
    admin
      .from('community_feedback_trades')
      .select('submission_id')
      .in('submission_id', ids),
  ])

  const reactionCounts = new Map<string, Partial<Record<CommunityReactionType, number>>>()
  for (const row of reactions ?? []) {
    const targetId = row.target_id as string
    const type = row.reaction_type as CommunityReactionType
    const counts = reactionCounts.get(targetId) ?? {}
    counts[type] = (counts[type] ?? 0) + 1
    reactionCounts.set(targetId, counts)
  }

  const feedbackCounts = new Map<string, number>()
  for (const row of feedback ?? []) {
    const submissionId = row.submission_id as string
    feedbackCounts.set(submissionId, (feedbackCounts.get(submissionId) ?? 0) + 1)
  }

  return submissions.map(submission => ({
    ...submission,
    reaction_counts: reactionCounts.get(submission.id) ?? {},
    feedback_count: feedbackCounts.get(submission.id) ?? 0,
  }))
}

export async function createCommunitySubmissionCandidate(input: {
  userId: string
  attemptId: string
  challengeId?: string
}): Promise<CommunitySubmission | null> {
  if (IS_MOCK) return null
  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('community_submissions')
    .select('*, profiles(display_name)')
    .eq('attempt_id', input.attemptId)
    .eq('user_id', input.userId)
    .maybeSingle()

  if (existing) return normalizeSubmission(existing as SubmissionRow)

  const { data: attempt, error } = await admin
    .from('challenge_attempts')
    .select('id, user_id, challenge_id, response_text, total_score, max_score, grade_label, feedback_json, completed_at, challenges(title, move_tags, slug)')
    .eq('id', input.attemptId)
    .eq('user_id', input.userId)
    .maybeSingle()

  if (error || !attempt) return null

  const attemptRow = attempt as AttemptRow
  const responseText = await getAttemptResponseText(admin, attemptRow)
  const scoreRatio = attemptRow.max_score && attemptRow.max_score > 0 && attemptRow.total_score !== null
    ? attemptRow.total_score / attemptRow.max_score
    : null

  const { data: inserted, error: insertError } = await admin
    .from('community_submissions')
    .insert({
      user_id: input.userId,
      challenge_id: input.challengeId ?? attemptRow.challenge_id,
      attempt_id: input.attemptId,
      display_mode: 'anonymous',
      status: 'private',
      response_text: responseText,
      excerpt: clampExcerpt(responseText),
      lens_tag: deriveLensTag({
        responseText,
        gradeLabel: attemptRow.grade_label,
        score: attemptRow.total_score,
        maxScore: attemptRow.max_score,
      }),
      score: scoreRatio,
      hatch_summary: safeText((attemptRow.feedback_json?.step_signals as Array<{ hatch_signal?: string | null }> | undefined)?.[0]?.hatch_signal) || null,
    })
    .select('*, profiles(display_name)')
    .single()

  if (insertError || !inserted) return null
  return normalizeSubmission(inserted as SubmissionRow)
}

export async function recordCommunityCompletion(input: {
  userId: string
  challengeId: string
  attemptId: string
  gradeLabel?: string | null
}) {
  if (IS_MOCK) return

  await insertActivityEvent({
    actorUserId: input.userId,
    eventType: 'completed_challenge',
    challengeId: input.challengeId,
    displayMode: 'anonymous',
    headline: 'Completed a practice challenge',
    metadata: {
      attempt_id: input.attemptId,
      grade_label: input.gradeLabel ?? null,
    },
  })
}

export async function getCommunityGallery(input: {
  userId: string
  challengeId: string
  attemptId?: string | null
}): Promise<CommunityGalleryResponse> {
  if (IS_MOCK) {
    return {
      own_submission: null,
      peer_submissions: MOCK_SUBMISSIONS,
      has_feedback_trade: false,
      locked_count: 3,
    }
  }

  if (input.attemptId) {
    await createCommunitySubmissionCandidate({
      userId: input.userId,
      attemptId: input.attemptId,
      challengeId: input.challengeId,
    })
  }

  const admin = createAdminClient()
  const [{ data: ownSubmission }, { data: feedbackTrades }, { data: peers }] = await Promise.all([
    input.attemptId
      ? admin
          .from('community_submissions')
          .select('*, profiles(display_name)')
          .eq('user_id', input.userId)
          .eq('attempt_id', input.attemptId)
          .maybeSingle()
      : admin
          .from('community_submissions')
          .select('*, profiles(display_name)')
          .eq('user_id', input.userId)
          .eq('challenge_id', input.challengeId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
    admin
      .from('community_feedback_trades')
      .select('id')
      .eq('reviewer_user_id', input.userId)
      .eq('challenge_id', input.challengeId)
      .limit(1),
    admin
      .from('community_submissions')
      .select('*, profiles(display_name)')
      .eq('challenge_id', input.challengeId)
      .in('status', ['published', 'featured'])
      .neq('user_id', input.userId)
      .order('status', { ascending: true })
      .order('published_at', { ascending: false })
      .limit(12),
  ])

  const hasFeedbackTrade = (feedbackTrades ?? []).length > 0
  const visibleLimit = hasFeedbackTrade ? 8 : 2
  const normalizedPeers = (peers ?? []).map(row => normalizeSubmission(row as SubmissionRow))
  const visiblePeers = await addSubmissionStats(normalizedPeers.slice(0, visibleLimit))

  return {
    own_submission: ownSubmission ? normalizeSubmission(ownSubmission as SubmissionRow) : null,
    peer_submissions: visiblePeers,
    has_feedback_trade: hasFeedbackTrade,
    locked_count: Math.max(0, normalizedPeers.length - visiblePeers.length),
  }
}

export async function publishCommunitySubmission(input: {
  userId: string
  attemptId: string
  displayMode: CommunityDisplayMode
}): Promise<CommunitySubmission> {
  if (IS_MOCK) {
    return { ...MOCK_SUBMISSIONS[0], user_id: input.userId, attempt_id: input.attemptId, display_mode: input.displayMode, status: 'published' }
  }

  await createCommunitySubmissionCandidate({ userId: input.userId, attemptId: input.attemptId })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('community_submissions')
    .update({
      display_mode: input.displayMode,
      status: 'published',
      published_at: new Date().toISOString(),
    })
    .eq('user_id', input.userId)
    .eq('attempt_id', input.attemptId)
    .select('*, profiles(display_name)')
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Failed to publish submission')
  const submission = normalizeSubmission(data as SubmissionRow)

  await insertActivityEvent({
    actorUserId: input.userId,
    eventType: 'shared_answer',
    challengeId: submission.challenge_id,
    submissionId: submission.id,
    displayMode: input.displayMode,
    headline: 'Shared an answer for peer study',
  })

  return submission
}

export async function submitFeedbackTrade(input: {
  reviewerUserId: string
  submissionId: string
  oneSharpThing: string
  oneQuestion: string
  suggestedRewrite?: string | null
}): Promise<CommunityFeedbackTrade> {
  if (IS_MOCK) {
    return {
      id: `mock-feedback-${Date.now()}`,
      submission_id: input.submissionId,
      challenge_id: 'mock-challenge',
      reviewer_user_id: input.reviewerUserId,
      recipient_user_id: 'peer',
      one_sharp_thing: input.oneSharpThing,
      one_question: input.oneQuestion,
      suggested_rewrite: input.suggestedRewrite ?? null,
      created_at: new Date().toISOString(),
    }
  }

  const admin = createAdminClient()
  const { data: submission, error: submissionError } = await admin
    .from('community_submissions')
    .select('id, user_id, challenge_id, display_mode')
    .eq('id', input.submissionId)
    .in('status', ['published', 'featured'])
    .single()

  if (submissionError || !submission) throw new Error('Submission not found')
  if (submission.user_id === input.reviewerUserId) throw new Error('You cannot trade feedback on your own answer')

  const { data, error } = await admin
    .from('community_feedback_trades')
    .insert({
      submission_id: input.submissionId,
      challenge_id: submission.challenge_id,
      reviewer_user_id: input.reviewerUserId,
      recipient_user_id: submission.user_id,
      one_sharp_thing: input.oneSharpThing.trim(),
      one_question: input.oneQuestion.trim(),
      suggested_rewrite: input.suggestedRewrite?.trim() || null,
    })
    .select('*')
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Failed to submit feedback')

  await awardCommunityBadge({
    userId: submission.user_id,
    badgeKey: 'clarity_builder',
    sourceType: 'feedback_trade',
    sourceId: data.id,
    sourceUserId: input.reviewerUserId,
    challengeId: submission.challenge_id,
    submissionId: input.submissionId,
    displayMode: submission.display_mode as CommunityDisplayMode,
    reason: 'Received structured peer feedback',
  })

  await insertActivityEvent({
    actorUserId: input.reviewerUserId,
    eventType: 'feedback_trade',
    challengeId: submission.challenge_id,
    submissionId: input.submissionId,
    displayMode: 'anonymous',
    headline: 'Traded feedback to unlock more peer approaches',
  })

  return data as CommunityFeedbackTrade
}

export async function toggleReaction(input: {
  userId: string
  targetType: CommunityReactionTarget
  targetId: string
  reactionType: CommunityReactionType
}): Promise<{ reacted: boolean; count: number }> {
  if (IS_MOCK) return { reacted: true, count: 1 }

  const admin = createAdminClient()
  const { data: existing } = await admin
    .from('community_reactions')
    .select('id')
    .eq('user_id', input.userId)
    .eq('target_type', input.targetType)
    .eq('target_id', input.targetId)
    .eq('reaction_type', input.reactionType)
    .maybeSingle()

  let reacted = false
  if (existing?.id) {
    await admin.from('community_reactions').delete().eq('id', existing.id)
  } else {
    const { error } = await admin.from('community_reactions').insert({
      user_id: input.userId,
      target_type: input.targetType,
      target_id: input.targetId,
      reaction_type: input.reactionType,
    })
    if (error) throw new Error(error.message)
    reacted = true
  }

  const { count } = await admin
    .from('community_reactions')
    .select('id', { count: 'exact', head: true })
    .eq('target_type', input.targetType)
    .eq('target_id', input.targetId)
    .eq('reaction_type', input.reactionType)

  const nextCount = count ?? 0

  if (input.targetType === 'discussion' && input.reactionType === 'upvote') {
    await admin.from('challenge_discussions').update({ upvote_count: nextCount }).eq('id', input.targetId)
  }

  if (reacted && input.targetType === 'community_submission') {
    const badgeKey = reactionBadge(input.reactionType)
    if (badgeKey) {
      const { data: submission } = await admin
        .from('community_submissions')
        .select('id, user_id, challenge_id, display_mode')
        .eq('id', input.targetId)
        .maybeSingle()

      if (submission && submission.user_id !== input.userId) {
        await awardCommunityBadge({
          userId: submission.user_id,
          badgeKey,
          sourceType: 'reaction',
          sourceId: input.targetId,
          sourceUserId: input.userId,
          challengeId: submission.challenge_id,
          submissionId: submission.id,
          displayMode: submission.display_mode as CommunityDisplayMode,
          reason: `Peer reaction: ${input.reactionType}`,
        })
      }
    }
  }

  return { reacted, count: nextCount }
}

export async function getWeeklyRoom(userId: string): Promise<{
  room: WeeklyRoom | null
  submission: {
    id: string
    cohort_challenge_id: string
    response_text: string
    score: number | null
    submitted_at: string
  } | null
  days_remaining: number
  participants: number
  highlights: Array<{ label: string; submission_id: string; display_name: string; score: number | null; excerpt: string }>
  hatch_digest: string | null
}> {
  if (IS_MOCK) {
    return {
      room: {
        id: 'mock-room',
        cohort_challenge_id: 'cohort-1',
        title: 'Diagnose the Drop',
        prompt_text: 'Daily active users for a social app dropped 15% last Tuesday. Walk through the diagnosis.',
        difficulty: 'standard',
        move_tag: 'frame',
        week_start: new Date().toISOString(),
        week_end: new Date(Date.now() + 4 * 86400000).toISOString(),
        is_active: true,
        hatch_digest: 'Most strong answers separated product, acquisition, and instrumentation changes before proposing fixes.',
        curated_highlights: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      submission: null,
      days_remaining: 4,
      participants: 48,
      highlights: [
        { label: 'Metric-first', submission_id: 's1', display_name: 'Anonymous peer', score: 94, excerpt: 'Started with DAU decomposition before naming fixes.' },
        { label: 'Tradeoff-aware', submission_id: 's2', display_name: 'Anonymous peer', score: 88, excerpt: 'Separated rollback urgency from learning value.' },
      ],
      hatch_digest: 'Most strong answers separated product, acquisition, and instrumentation changes before proposing fixes.',
    }
  }

  const admin = createAdminClient()
  const { data: activeRoom } = await admin
    .from('weekly_rooms')
    .select('*')
    .eq('is_active', true)
    .order('week_start', { ascending: false })
    .limit(1)
    .maybeSingle()

  let room: WeeklyRoom | null = activeRoom as WeeklyRoom | null

  if (!room) {
    const { data: cohort } = await admin
      .from('cohort_challenges')
      .select('*')
      .eq('is_active', true)
      .order('week_start', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (cohort) {
      room = {
        id: cohort.id,
        cohort_challenge_id: cohort.id,
        title: cohort.title,
        prompt_text: cohort.prompt_text,
        difficulty: cohort.difficulty,
        move_tag: cohort.move_tag,
        week_start: cohort.week_start,
        week_end: cohort.week_end,
        is_active: cohort.is_active,
        hatch_digest: null,
        curated_highlights: [],
        created_at: cohort.created_at,
        updated_at: cohort.created_at,
      }
    }
  }

  if (!room) {
    return { room: null, submission: null, days_remaining: 0, participants: 0, highlights: [], hatch_digest: null }
  }

  const cohortChallengeId = room.cohort_challenge_id ?? room.id
  const weekEnd = new Date(room.week_end)
  const daysRemaining = Math.max(0, Math.ceil((weekEnd.getTime() - Date.now()) / 86400000))

  const [{ data: submission }, participantsResult, { data: topRows }] = await Promise.all([
    admin
      .from('cohort_submissions')
      .select('id, cohort_challenge_id, response_text, score, submitted_at')
      .eq('user_id', userId)
      .eq('cohort_challenge_id', cohortChallengeId)
      .maybeSingle(),
    admin
      .from('cohort_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('cohort_challenge_id', cohortChallengeId),
    admin
      .from('cohort_submissions')
      .select('id, response_text, score, profiles(display_name)')
      .eq('cohort_challenge_id', cohortChallengeId)
      .not('score', 'is', null)
      .order('score', { ascending: false })
      .limit(4),
  ])

  const labels = ['Strong win', 'Metric-first', 'Tradeoff-aware', 'Clarity builder']
  const highlights = (topRows ?? []).map((row: { id: string; response_text: string; score: number | null; profiles?: ProfileJoin }, index: number) => ({
    label: labels[index] ?? 'Peer approach',
    submission_id: row.id,
    display_name: formatCommunityDisplayName('anonymous', firstJoin(row.profiles)?.display_name ?? null),
    score: row.score,
    excerpt: clampExcerpt(row.response_text, 180),
  }))

  return {
    room,
    submission: submission ?? null,
    days_remaining: daysRemaining,
    participants: participantsResult.count ?? 0,
    highlights,
    hatch_digest: room.hatch_digest ?? (highlights.length ? 'This week is already producing useful contrast. Study the top approaches, then submit your own before the room closes.' : null),
  }
}

export async function getCommunityActivityFeed(limit = 8): Promise<ActivityFeedEvent[]> {
  if (IS_MOCK) {
    return [
      {
        id: 'mock-feed-1',
        actor_user_id: 'peer',
        event_type: 'shared_answer',
        challenge_id: 'mock-challenge',
        submission_id: 'mock-community-1',
        badge_key: null,
        display_mode: 'anonymous',
        headline: 'Shared an answer for peer study',
        metadata: {},
        visibility: 'authenticated',
        created_at: new Date().toISOString(),
        actor_display_name: null,
        challenge_title: 'Diagnose the Drop',
      },
    ]
  }

  const admin = createAdminClient()
  const { data } = await admin
    .from('activity_feed_events')
    .select('*, profiles(display_name), challenges(title)')
    .in('visibility', ['public', 'authenticated'])
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data ?? []).map(row => normalizeActivity(row as ActivityRow))
}

export async function curateCommunitySubmission(input: {
  adminUserId: string
  submissionId: string
  action: 'feature' | 'hide' | 'publish' | 'retag'
  lensTag?: CommunityLensTag
  hatchSummary?: string | null
}): Promise<CommunitySubmission> {
  const admin = createAdminClient()
  const { data: submission, error: submissionError } = await admin
    .from('community_submissions')
    .select('*')
    .eq('id', input.submissionId)
    .single()

  if (submissionError || !submission) throw new Error('Submission not found')

  const nextStatus =
    input.action === 'feature' ? 'featured'
      : input.action === 'hide' ? 'hidden'
        : input.action === 'publish' ? 'published'
          : submission.status

  const { data, error } = await admin
    .from('community_submissions')
    .update({
      status: nextStatus,
      lens_tag: input.lensTag ?? submission.lens_tag,
      hatch_summary: input.hatchSummary ?? submission.hatch_summary,
      published_at: nextStatus === 'published' || nextStatus === 'featured'
        ? (submission.published_at ?? new Date().toISOString())
        : submission.published_at,
    })
    .eq('id', input.submissionId)
    .select('*, profiles(display_name)')
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Failed to curate submission')

  const updated = normalizeSubmission(data as SubmissionRow)

  if (input.action === 'feature') {
    await awardCommunityBadge({
      userId: updated.user_id,
      badgeKey: updated.lens_tag === 'metric-first'
        ? 'metric_hawk'
        : updated.lens_tag === 'tradeoff-aware'
          ? 'tradeoff_catcher'
          : updated.lens_tag === 'strong win'
            ? 'frame_sharpener'
            : 'clarity_builder',
      sourceType: 'expert_pick',
      sourceId: updated.id,
      sourceUserId: input.adminUserId,
      challengeId: updated.challenge_id,
      submissionId: updated.id,
      displayMode: updated.display_mode,
      reason: 'Expert-picked answer',
    })

    await insertActivityEvent({
      actorUserId: updated.user_id,
      eventType: 'expert_picked_answer',
      challengeId: updated.challenge_id,
      submissionId: updated.id,
      displayMode: updated.display_mode,
      headline: 'Had an answer expert-picked',
      metadata: { lens_tag: updated.lens_tag },
    })
  }

  return updated
}

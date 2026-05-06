import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

export type MoveKey = 'frame' | 'list' | 'optimize' | 'win'

export interface SharedMoveLevel {
  move: MoveKey
  level: number
  progressPct: number
}

export interface SharedAttemptScorecard {
  attemptId: string
  challengeId: string
  challengeTitle: string
  shareId: string
  scorePercent: number
  scoreLabel: string
  gradeLabel: string | null
  timeSpentSeconds: number | null
  moveLevels: SharedMoveLevel[]
}

interface AttemptRow {
  id: string
  user_id: string
  challenge_id: string
  total_score: number | string | null
  max_score: number | string | null
  grade_label: string | null
  time_spent_seconds: number | null
  share_id: string | null
}

interface ChallengeRow {
  title: string | null
}

interface MoveLevelRow {
  move: MoveKey
  level: number
  progress_pct: number
}

function createShareId() {
  return `${crypto.randomUUID()}${crypto.randomUUID()}`.replaceAll('-', '').slice(0, 32)
}

function isUniqueViolation(error: { code?: string } | null) {
  return error?.code === '23505'
}

function isMissingShareColumn(error: { code?: string; message?: string } | null) {
  return error?.code === '42703' || /challenge_attempts\.share_id.*does not exist/i.test(error?.message ?? '')
}

function numberValue(value: number | string | null | undefined) {
  if (value == null) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function scorePercent(totalScore: number | string | null, maxScore: number | string | null) {
  const total = numberValue(totalScore)
  const max = numberValue(maxScore)
  if (total == null || !max) return 0
  return Math.max(0, Math.min(100, Math.round((total / max) * 100)))
}

function scoreLabel(totalScore: number | string | null, maxScore: number | string | null) {
  const total = numberValue(totalScore)
  const max = numberValue(maxScore)
  if (total == null || !max) return 'Not scored'
  return `${total.toFixed(1).replace(/\.0$/, '')}/${max.toFixed(0)}`
}

async function loadMoveLevels(admin: SupabaseClient, userId: string): Promise<SharedMoveLevel[]> {
  const { data } = await admin
    .from('move_levels')
    .select('move, level, progress_pct')
    .eq('user_id', userId)
    .in('move', ['frame', 'list', 'optimize', 'win'])

  return ((data ?? []) as MoveLevelRow[]).map(row => ({
    move: row.move,
    level: row.level,
    progressPct: Math.max(0, Math.min(100, row.progress_pct ?? 0)),
  }))
}

async function loadAttemptShareId(admin: SupabaseClient, attemptId: string) {
  const { data, error } = await admin
    .from('challenge_attempts')
    .select('share_id')
    .eq('id', attemptId)
    .maybeSingle()

  if (isMissingShareColumn(error)) return null
  if (error) throw new Error(error.message)
  return (data as Pick<AttemptRow, 'share_id'> | null)?.share_id ?? null
}

async function loadChallengeTitle(admin: SupabaseClient, challengeId: string) {
  const { data } = await admin
    .from('challenges')
    .select('title')
    .eq('id', challengeId)
    .maybeSingle()

  return ((data as ChallengeRow | null)?.title ?? 'HackProduct challenge')
}

async function toScorecard(admin: SupabaseClient, attempt: AttemptRow): Promise<SharedAttemptScorecard | null> {
  if (!attempt.share_id) return null
  const [challengeTitle, moveLevels] = await Promise.all([
    loadChallengeTitle(admin, attempt.challenge_id),
    loadMoveLevels(admin, attempt.user_id),
  ])

  return {
    attemptId: attempt.id,
    challengeId: attempt.challenge_id,
    challengeTitle,
    shareId: attempt.share_id,
    scorePercent: scorePercent(attempt.total_score, attempt.max_score),
    scoreLabel: scoreLabel(attempt.total_score, attempt.max_score),
    gradeLabel: attempt.grade_label,
    timeSpentSeconds: attempt.time_spent_seconds,
    moveLevels,
  }
}

export async function getOrCreateAttemptShare(
  admin: SupabaseClient,
  input: { attemptId: string; userId: string; challengeId: string }
) {
  const { data, error } = await admin
    .from('challenge_attempts')
    .select('id, user_id, challenge_id, total_score, max_score, grade_label, time_spent_seconds, share_id')
    .eq('id', input.attemptId)
    .maybeSingle()

  if (isMissingShareColumn(error)) return null
  if (error) throw new Error(error.message)
  const attempt = data as AttemptRow | null
  if (!attempt || attempt.user_id !== input.userId || attempt.challenge_id !== input.challengeId) return null

  if (!attempt.share_id) {
    for (let tries = 0; tries < 3; tries += 1) {
      const shareId = createShareId()
      const { data: updated, error: updateError } = await admin
        .from('challenge_attempts')
        .update({ share_id: shareId })
        .eq('id', attempt.id)
        .is('share_id', null)
        .select('share_id')
        .maybeSingle()

      if (updated?.share_id) {
        attempt.share_id = updated.share_id as string
        break
      }

      if (isMissingShareColumn(updateError)) return null
      if (updateError && !isUniqueViolation(updateError)) throw new Error(updateError.message)

      const existingShareId = await loadAttemptShareId(admin, attempt.id)
      if (existingShareId) {
        attempt.share_id = existingShareId
        break
      }
    }
  }

  return toScorecard(admin, attempt)
}

export async function getSharedAttemptScorecard(
  admin: SupabaseClient,
  input: { challengeId: string; shareId: string }
) {
  const { data, error } = await admin
    .from('challenge_attempts')
    .select('id, user_id, challenge_id, total_score, max_score, grade_label, time_spent_seconds, share_id')
    .eq('challenge_id', input.challengeId)
    .eq('share_id', input.shareId)
    .maybeSingle()

  if (isMissingShareColumn(error)) return null
  if (error) throw new Error(error.message)
  return data ? toScorecard(admin, data as AttemptRow) : null
}

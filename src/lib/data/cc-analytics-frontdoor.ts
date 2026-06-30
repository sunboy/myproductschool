import type { SupabaseClient } from '@supabase/supabase-js'
import { getAnalyticsAccess, isAnalyticsFeatureEnabled } from '@/lib/flags/analytics'
import { listUserSkills } from '@/lib/coding-grading/workspace-inspector'

export interface CcAnalyticsFrontDoor {
  enabled: boolean
  hasAccess: boolean
  skillsCount: number
  entryChallengeSlug: string | null
  entryChallengeTitle: string | null
  isResume: boolean
  lastSession: {
    challengeTitle: string | null
    gradeLabel: string | null
    shareId: string | null
    challengeSlug: string | null
  } | null
}

const EMPTY: CcAnalyticsFrontDoor = {
  enabled: false,
  hasAccess: false,
  skillsCount: 0,
  entryChallengeSlug: null,
  entryChallengeTitle: null,
  isResume: false,
  lastSession: null,
}

export async function getCcAnalyticsFrontDoor(
  admin: SupabaseClient,
  userId: string,
): Promise<CcAnalyticsFrontDoor> {
  if (!isAnalyticsFeatureEnabled() || !userId) return EMPTY

  let access: { enabled: boolean; hasAccess: boolean }
  try {
    access = await getAnalyticsAccess(admin, userId)
  } catch {
    return EMPTY
  }
  if (!access.enabled) return EMPTY

  const [skillsCount, entry, lastSession] = await Promise.all([
    countSkills(admin, userId),
    resolveEntryChallenge(admin, userId),
    resolveLastSession(admin, userId),
  ])

  return {
    enabled: true,
    hasAccess: access.hasAccess,
    skillsCount,
    entryChallengeSlug: entry.slug,
    entryChallengeTitle: entry.title,
    isResume: entry.isResume,
    lastSession,
  }
}

async function countSkills(admin: SupabaseClient, userId: string): Promise<number> {
  try {
    const { data } = await admin
      .from('profiles')
      .select('cc_claude_state_uri')
      .eq('id', userId)
      .maybeSingle()
    const uri = (data?.cc_claude_state_uri as string | null) ?? null
    if (!uri) return 0
    const skills = await listUserSkills(uri)
    return skills.length
  } catch {
    return 0
  }
}

async function resolveEntryChallenge(
  admin: SupabaseClient,
  userId: string,
): Promise<{ slug: string | null; title: string | null; isResume: boolean }> {
  try {
    const { data: inProgress } = await admin
      .from('challenge_attempts')
      .select('challenge_id, challenges!inner(slug, title, challenge_type, is_published)')
      .eq('user_id', userId)
      .eq('status', 'in_progress')
      .eq('challenges.challenge_type', 'claude_code_analytics')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    const ipChallenge = (inProgress as { challenges?: { slug?: string; title?: string } } | null)?.challenges
    if (ipChallenge?.slug) return { slug: ipChallenge.slug, title: ipChallenge.title ?? null, isResume: true }

    const { data: first } = await admin
      .from('challenges')
      .select('slug, title')
      .eq('challenge_type', 'claude_code_analytics')
      .eq('is_published', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    return { slug: (first?.slug as string) ?? null, title: (first?.title as string) ?? null, isResume: false }
  } catch {
    return { slug: null, title: null, isResume: false }
  }
}

async function resolveLastSession(
  admin: SupabaseClient,
  userId: string,
): Promise<CcAnalyticsFrontDoor['lastSession']> {
  try {
    const { data } = await admin
      .from('challenge_attempts')
      .select('grade_label, share_id, challenges!inner(slug, title, challenge_type)')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .eq('challenges.challenge_type', 'claude_code_analytics')
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (!data) return null
    const row = data as {
      grade_label?: string | null
      share_id?: string | null
      challenges?: { slug?: string; title?: string }
    }
    return {
      gradeLabel: row.grade_label ?? null,
      shareId: row.share_id ?? null,
      challengeTitle: row.challenges?.title ?? null,
      challengeSlug: row.challenges?.slug ?? null,
    }
  } catch {
    return null
  }
}

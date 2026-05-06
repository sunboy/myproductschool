import { createAdminClient } from '@/lib/supabase/admin'
import { IS_MOCK } from '@/lib/mock'
import type { ActivityFeedEvent } from '@/lib/types'

type ProfileJoin = { display_name?: string | null } | { display_name?: string | null }[] | null
type ChallengeJoin = { title?: string | null } | { title?: string | null }[] | null

type ActivityRow = ActivityFeedEvent & {
  profiles?: ProfileJoin
  challenges?: ChallengeJoin
}

const MOCK_ACTIVITY: ActivityFeedEvent[] = [
  {
    id: 'mock-activity-1',
    actor_user_id: 'peer-1',
    event_type: 'shared_answer',
    challenge_id: 'mock-challenge',
    submission_id: 'mock-submission-1',
    badge_key: null,
    display_mode: 'anonymous',
    headline: 'shared a segment-first answer',
    metadata: {},
    visibility: 'authenticated',
    created_at: new Date().toISOString(),
    actor_display_name: null,
    challenge_title: 'Spotify DAU up, revenue flat',
  },
  {
    id: 'mock-activity-2',
    actor_user_id: 'peer-2',
    event_type: 'earned_badge',
    challenge_id: 'mock-challenge',
    submission_id: 'mock-submission-2',
    badge_key: 'metric_hawk',
    display_mode: 'anonymous',
    headline: 'earned Metric Hawk',
    metadata: {},
    visibility: 'authenticated',
    created_at: new Date().toISOString(),
    actor_display_name: null,
    challenge_title: 'DoorDash driver retention',
  },
]

function firstJoin<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
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

export async function getCommunityActivityFeed(limit = 6): Promise<ActivityFeedEvent[]> {
  if (IS_MOCK) return MOCK_ACTIVITY.slice(0, limit)

  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('activity_feed_events')
      .select(`
        id,
        actor_user_id,
        event_type,
        challenge_id,
        submission_id,
        badge_key,
        display_mode,
        headline,
        metadata,
        visibility,
        created_at,
        profiles(display_name),
        challenges(title)
      `)
      .in('visibility', ['public', 'authenticated'])
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) return []
    return ((data ?? []) as unknown as ActivityRow[]).map(normalizeActivity)
  } catch {
    return []
  }
}

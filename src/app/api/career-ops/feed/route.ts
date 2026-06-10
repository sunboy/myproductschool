import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiError } from '@/lib/api/error'
import { AiBudgetExceededError, getUserPlanForBudget } from '@/lib/usage/ai-budget'
import { PlanLimitExceeded, assertPlanLimit } from '@/lib/usage/assert-plan-limit'
import { assertCareerOpsFeature } from '@/lib/careerops/assert-feature'
import { isCareerOpsFeatureEnabled } from '@/lib/careerops/flags'
import { rankListings, profileFingerprint } from '@/lib/careerops/feed'
import { buildCareerGrounding } from '@/lib/careerops/grounding'
import { scoreJob } from '@/lib/careerops/scorer'
import type { CareerProfile, JobListing, FeedEntry, FeedResponse, FitGrade, ReadinessRow } from '@/lib/careerops/types'

const ROUTE_KEY = 'careerops_feed'
const FEED_PAGE_SIZE = 25
const LISTING_POOL = 300

function autoScoreTopN(): number {
  const raw = Number(process.env.CAREEROPS_FEED_AUTOSCORE_N)
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 5
}

interface CachedScore {
  listing_id: string
  score: number | null
  grade: string | null
  readiness_map: ReadinessRow[] | null
  gaps: string[] | null
  profile_fingerprint: string | null
}

export async function GET() {
  const gate = assertCareerOpsFeature('discovery')
  if (gate) return gate

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError(401, 'auth_required', 'Unauthorized')

  const admin = createAdminClient()
  const { data: profileRow } = await admin
    .from('career_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  // No target role yet → the UI shows a "set your target role" prompt.
  if (!profileRow || !profileRow.target_role) {
    return NextResponse.json({ listings: [], scored_count: 0, limit_reached: false, needs_profile: true })
  }
  const profile = profileRow as CareerProfile

  const { data: listingRows } = await admin
    .from('job_listings')
    .select('*')
    .eq('is_active', true)
    .order('last_seen_at', { ascending: false })
    .limit(LISTING_POOL)

  const ranked = rankListings(profile, (listingRows ?? []) as JobListing[], FEED_PAGE_SIZE)
  if (ranked.length === 0) {
    return NextResponse.json({ listings: [], scored_count: 0, limit_reached: false } satisfies FeedResponse)
  }

  const fingerprint = profileFingerprint(profile)

  // Load any cached scores for these listings.
  const { data: cacheRows } = await admin
    .from('job_listing_scores')
    .select('listing_id, score, grade, readiness_map, gaps, profile_fingerprint')
    .eq('user_id', user.id)
    .in('listing_id', ranked.map((l) => l.id))

  const cache = new Map<string, CachedScore>()
  for (const row of (cacheRows ?? []) as CachedScore[]) cache.set(row.listing_id, row)

  const applyCache = (entry: FeedEntry): FeedEntry => {
    const cached = cache.get(entry.id)
    if (cached && cached.profile_fingerprint === fingerprint && cached.score != null) {
      return {
        ...entry,
        score: cached.score,
        grade: (cached.grade as FitGrade) ?? undefined,
        readiness_map: cached.readiness_map ?? undefined,
        gaps: cached.gaps ?? undefined,
      }
    }
    return entry
  }

  const entries = ranked.map(applyCache)

  // Stage B: auto-score the top N that lack a fresh cached score.
  const userPlan = await getUserPlanForBudget(user.id)
  const routingEnabled = isCareerOpsFeatureEnabled('routing')
  const topN = autoScoreTopN()
  let scoredCount = entries.filter((e) => e.score != null).length
  let limitReached = false
  let grounding: Awaited<ReturnType<typeof buildCareerGrounding>> | null = null

  for (let i = 0; i < entries.length && i < topN; i++) {
    const entry = entries[i]
    if (entry.score != null) continue // already cached/fresh

    if (limitReached) {
      entry.locked = true
      continue
    }

    try {
      await assertPlanLimit(user.id, userPlan, 'careerops_feed_scores')
      grounding ??= await buildCareerGrounding(user.id, admin)
      const evaluation = await scoreJob({
        userId: user.id,
        userPlan,
        profile,
        grounding,
        jdText: entry.description || `${entry.role_title} at ${entry.company}`,
        company: entry.company,
        roleTitle: entry.role_title,
        routingEnabled,
        route: ROUTE_KEY,
      })

      entry.score = evaluation.score
      entry.grade = evaluation.grade
      entry.readiness_map = evaluation.readiness_map
      entry.gaps = evaluation.gaps
      scoredCount++

      await admin.from('job_listing_scores').upsert(
        {
          user_id: user.id,
          listing_id: entry.id,
          score: evaluation.score,
          grade: evaluation.grade,
          breakdown: evaluation.breakdown,
          readiness_map: evaluation.readiness_map,
          gaps: evaluation.gaps,
          profile_fingerprint: fingerprint,
          scored_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,listing_id' },
      )
    } catch (error) {
      if (error instanceof PlanLimitExceeded || error instanceof AiBudgetExceededError) {
        limitReached = true
        entry.locked = true
        continue
      }
      console.error('[careerops/feed] auto-score failed:', error)
      // Leave this entry unscored but do not fail the whole feed.
    }
  }

  return NextResponse.json({ listings: entries, scored_count: scoredCount, limit_reached: limitReached } satisfies FeedResponse)
}

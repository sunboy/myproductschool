import { createClient, getCachedUser } from '@/lib/supabase/server'
import { IS_MOCK } from '@/lib/mock'
import type { SessionProfile } from '@/context/SessionContext'
import { AppLayoutClient } from './AppLayoutClient'

/**
 * Server layout for all (app) routes. Fetches the profile ONCE on the server
 * and seeds SessionProvider with it, so the top utility bar renders the real
 * display name and streak/XP pills on first paint of EVERY (app) route — no
 * "You" fallback while the client /api/profile fetch is in flight. The client
 * SessionProvider still refreshes in the background for subscription, usage,
 * and dunning state.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let initialProfile: SessionProfile | null = null

  if (!IS_MOCK) {
    try {
      const { user } = await getCachedUser()
      if (user) {
        const supabase = await createClient()
        const [{ data: profile }, { data: bestStreakRow }] = await Promise.all([
          supabase
            .from('profiles')
            .select('id, display_name, avatar_url, plan, streak_days, xp_total, onboarding_completed_at, has_seen_hatch_intro')
            .eq('id', user.id)
            .maybeSingle(),
          supabase
            .from('user_streaks')
            .select('streak_days')
            .eq('user_id', user.id)
            .order('streak_days', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ])
        if (profile) {
          initialProfile = {
            id: profile.id,
            streak_days: profile.streak_days ?? 0,
            longest_streak: Math.max(bestStreakRow?.streak_days ?? 0, profile.streak_days ?? 0),
            xp_total: profile.xp_total ?? 0,
            display_name: profile.display_name ?? null,
            avatar_url: profile.avatar_url ?? null,
            plan: profile.plan ?? null,
            onboarding_completed_at: profile.onboarding_completed_at ?? null,
            has_seen_hatch_intro: profile.has_seen_hatch_intro ?? false,
          }
        }
      }
    } catch {
      // Seed is best-effort — the client SessionProvider fetch remains the
      // fallback path (identical to the pre-seed behavior).
    }
  }

  return <AppLayoutClient initialProfile={initialProfile}>{children}</AppLayoutClient>
}

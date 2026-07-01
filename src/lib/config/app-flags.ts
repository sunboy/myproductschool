import { createAdminClient } from '@/lib/supabase/admin'

// Minimal runtime feature-flag reader backed by the `app_flags` table
// (key text PK, value jsonb). Modeled on getPublicPlanLimits
// (src/lib/usage/public-limits.ts): short in-memory TTL cache so a flag
// flip in the DB takes effect within ~60s, no deploy required. Server only
// (imports the admin client) — client components hit GET /api/config/flags
// (src/app/api/config/flags/route.ts) instead of importing this directly.

export type AppFlagKey = 'onboarding_value_first'

const CACHE_TTL_MS = 60_000
const cache = new Map<AppFlagKey, { value: boolean; fetchedAt: number }>()

/**
 * Reads a boolean app flag from `app_flags`. Fails safe to `fallback` on any
 * error (missing row, DB hiccup, non-boolean value) so a flag outage always
 * degrades to current behavior rather than flipping a growth experiment on
 * for everyone.
 */
export async function getAppFlag(key: AppFlagKey, fallback = false): Promise<boolean> {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached.value

  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('app_flags')
      .select('value')
      .eq('key', key)
      .maybeSingle()

    if (error || !data) return fallback

    const value = typeof data.value === 'boolean' ? data.value : fallback
    cache.set(key, { value, fetchedAt: Date.now() })
    return value
  } catch {
    return fallback
  }
}

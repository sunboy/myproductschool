import { createClient } from '@/lib/supabase/server'

interface RateLimitResult {
  success: boolean
  retryAfter?: number
}

const LIMITS = {
  free: { requests: 20, windowSeconds: 60 },
  pro:  { requests: 60, windowSeconds: 60 },
}

export async function checkRateLimit(
  userId: string,
  planTier: 'free' | 'pro' = 'free'
): Promise<RateLimitResult> {
  const { requests, windowSeconds } = LIMITS[planTier] ?? LIMITS.free

  try {
    const supabase = await createClient()
    const windowStart = new Date(Date.now() - windowSeconds * 1000).toISOString()

    const { count } = await supabase
      .from('rate_limit_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', windowStart)

    if ((count ?? 0) >= requests) {
      return { success: false, retryAfter: windowSeconds }
    }

    await supabase.from('rate_limit_events').insert({ user_id: userId })

    return { success: true }
  } catch {
    // Fail open — don't block requests if the rate limit check itself fails
    return { success: true }
  }
}

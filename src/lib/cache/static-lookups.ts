import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export const getPlanLimits = unstable_cache(
  async (planTier: string) => {
    const supabase = await createClient()
    const { data } = await supabase
      .from('plan_limits')
      .select('*')
      .eq('plan_tier', planTier)
      .single()
    return data
  },
  ['plan-limits'],
  { revalidate: 3600, tags: ['plan-limits'] }
)

export const getAchievements = unstable_cache(
  async () => {
    const supabase = await createClient()
    const { data } = await supabase.from('achievements').select('*')
    return data || []
  },
  ['achievements'],
  { revalidate: 3600, tags: ['achievements'] }
)

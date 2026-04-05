import { UserSettings } from '@/lib/types'
import { IS_MOCK } from '@/lib/mock'

const MOCK_SETTINGS: UserSettings = {
  id: 'mock-us-1',
  user_id: 'mock-user',
  notifications: {
    weekly_summary: true,
    streak_reminder: true,
    new_challenges: false,
    cohort_updates: true,
  },
  daily_goal_count: 3,
  preferred_role: 'SWE',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  if (IS_MOCK) return MOCK_SETTINGS

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data } = await supabase.from('user_settings').select('*').eq('user_id', userId).single()
  return data ?? null
}

export async function updateUserSettings(
  userId: string,
  updates: Partial<Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<void> {
  if (IS_MOCK) return

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  await supabase
    .from('user_settings')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
}

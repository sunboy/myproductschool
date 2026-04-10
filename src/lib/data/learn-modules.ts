import type { LearnModule } from '@/lib/types'
import { LEARN_MODULES_SEED } from '@/lib/learn-seed'
import { IS_MOCK } from '@/lib/mock'

const MOCK_MODULES: LearnModule[] = LEARN_MODULES_SEED.map((m, i) => ({
  ...m,
  id: `mock-module-${i + 1}`,
  created_at: new Date().toISOString(),
}))

export async function getLearnModuleSummaries(limit?: number): Promise<LearnModule[]> {
  if (IS_MOCK) {
    return limit ? MOCK_MODULES.slice(0, limit) : MOCK_MODULES
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  let query = supabase
    .from('learn_modules')
    .select('*')
    .order('sort_order', { ascending: true })

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

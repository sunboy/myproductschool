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

/**
 * Exact total count of learn_modules ("guides"). Used for the "See all (N)"
 * label and meta chip on the explore page, where only a few preview cards are
 * rendered but the link should reflect the full catalog size.
 */
export async function getLearnModuleCount(): Promise<number> {
  if (IS_MOCK) return MOCK_MODULES.length

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('learn_modules')
    .select('id', { count: 'exact', head: true })
  if (error) throw error
  return count ?? 0
}

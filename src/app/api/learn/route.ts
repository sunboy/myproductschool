import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { LearnModule } from '@/lib/types'
import { LEARN_MODULES_SEED } from '@/lib/learn-seed'

const MOCK_MODULES: LearnModule[] = LEARN_MODULES_SEED.map((m, i) => ({
  ...m,
  id: `mock-module-${i + 1}`,
  created_at: new Date().toISOString(),
}))

export async function GET() {
  if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
    return NextResponse.json({ modules: MOCK_MODULES })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()
  const { data: modules, error } = await adminClient
    .from('learn_modules')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Attach progress counts
  const { data: progress } = await adminClient
    .from('user_learn_progress')
    .select('module_id')
    .eq('user_id', user.id)

  const completedByModule: Record<string, number> = {}
  for (const p of progress ?? []) {
    completedByModule[p.module_id] = (completedByModule[p.module_id] ?? 0) + 1
  }

  const modulesWithProgress = (modules ?? []).map((m: LearnModule) => ({
    ...m,
    completed_chapters: completedByModule[m.id] ?? 0,
    progress_percentage: m.chapter_count > 0
      ? Math.round(((completedByModule[m.id] ?? 0) / m.chapter_count) * 100)
      : 0,
  }))

  return NextResponse.json({ modules: modulesWithProgress })
}

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  const [modulesResult, chaptersResult, progressResult] = await Promise.all([
    admin.from('learn_modules').select('id, title, slug').eq('is_published', true).order('sort_order'),
    admin.from('learn_chapters').select('id, module_id'),
    admin.from('user_learn_progress').select('chapter_id').eq('user_id', user.id),
  ])

  const completedSet = new Set((progressResult.data ?? []).map(r => r.chapter_id))
  const chapters = chaptersResult.data ?? []

  const result = (modulesResult.data ?? []).map(mod => {
    const modChapters = chapters.filter(c => c.module_id === mod.id)
    const completed = modChapters.filter(c => completedSet.has(c.id)).length
    return {
      module_id: mod.id,
      module_title: mod.title,
      module_slug: mod.slug,
      total_chapters: modChapters.length,
      completed_chapters: completed,
    }
  })

  return NextResponse.json({ modules: result })
}

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { LearnModule, LearnChapter } from '@/lib/types'
import { LEARN_MODULES_SEED, LEARN_CHAPTERS_SEED } from '@/lib/learn-seed'

function buildMockModule(slug: string): { module: LearnModule; chapters: LearnChapter[] } | null {
  const seedModule = LEARN_MODULES_SEED.find(m => m.slug === slug)
  if (!seedModule) return null
  const module: LearnModule = { ...seedModule, id: `mock-${slug}`, created_at: new Date().toISOString() }
  const chapterDefs = LEARN_CHAPTERS_SEED[slug] ?? []
  const chapters: LearnChapter[] = chapterDefs.map((c, i) => ({
    id: `mock-${slug}-ch-${i + 1}`,
    module_id: module.id,
    slug: `chapter-${i + 1}`,
    title: c.title,
    subtitle: c.subtitle,
    sort_order: i + 1,
    hook_text: c.hook_text,
    body_mdx: `# ${c.title}\n\n*${c.subtitle}*\n\n${c.hook_text}\n\n---\n\n*Full chapter content coming soon.*`,
    created_at: new Date().toISOString(),
  }))
  return { module, chapters }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
    const mock = buildMockModule(slug)
    if (!mock) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(mock)
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()
  const { data: module, error: modError } = await adminClient
    .from('learn_modules')
    .select('*')
    .eq('slug', slug)
    .single()

  if (modError || !module) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: chapters, error: chapError } = await adminClient
    .from('learn_chapters')
    .select('*')
    .eq('module_id', module.id)
    .order('sort_order', { ascending: true })

  if (chapError) return NextResponse.json({ error: chapError.message }, { status: 500 })

  const { data: progress } = await adminClient
    .from('user_learn_progress')
    .select('chapter_id')
    .eq('user_id', user.id)
    .eq('module_id', module.id)

  const completedIds = new Set((progress ?? []).map((p: { chapter_id: string }) => p.chapter_id))

  const chaptersWithProgress = (chapters ?? []).map((ch: LearnChapter, i: number) => ({
    ...ch,
    is_completed: completedIds.has(ch.id),
    is_unlocked: i === 0 || completedIds.has((chapters ?? [])[i - 1]?.id),
  }))

  return NextResponse.json({ module, chapters: chaptersWithProgress })
}

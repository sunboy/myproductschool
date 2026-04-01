import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { LEARN_MODULES_SEED, LEARN_CHAPTERS_SEED } from '@/lib/learn-seed'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string; chapter: string }> }
) {
  const { slug, chapter } = await params

  if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
    const seedModule = LEARN_MODULES_SEED.find(m => m.slug === slug)
    if (!seedModule) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const chapterDefs = LEARN_CHAPTERS_SEED[slug] ?? []
    const chapterIndex = parseInt(chapter.replace('chapter-', ''), 10) - 1
    const def = chapterDefs[chapterIndex]
    if (!def) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({
      id: `mock-${slug}-ch-${chapterIndex + 1}`,
      module_id: `mock-${slug}`,
      slug: chapter,
      title: def.title,
      subtitle: def.subtitle,
      sort_order: chapterIndex + 1,
      hook_text: def.hook_text,
      body_mdx: `# ${def.title}\n\n*${def.subtitle}*\n\n${def.hook_text}\n\n---\n\n*Full chapter content coming soon. This will be a long-form article with section anchors, inline illustrations, and real product case examples.*`,
      created_at: new Date().toISOString(),
    })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()
  const { data: mod } = await adminClient.from('learn_modules').select('id').eq('slug', slug).single()
  if (!mod) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: ch, error } = await adminClient
    .from('learn_chapters')
    .select('*')
    .eq('module_id', mod.id)
    .eq('slug', chapter)
    .single()

  if (error || !ch) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(ch)
}

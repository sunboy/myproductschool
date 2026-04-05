import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { IS_MOCK } from '@/lib/mock'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ slug: string; chapter: string }> }
) {
  const { slug, chapter } = await params

  if (IS_MOCK) {
    return NextResponse.json({ ok: true })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()
  const { data: mod } = await adminClient.from('learn_modules').select('id').eq('slug', slug).single()
  if (!mod) return NextResponse.json({ error: 'Module not found' }, { status: 404 })

  const { data: ch } = await adminClient
    .from('learn_chapters')
    .select('id')
    .eq('module_id', mod.id)
    .eq('slug', chapter)
    .single()
  if (!ch) return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })

  const { error } = await adminClient
    .from('user_learn_progress')
    .upsert({
      user_id: user.id,
      module_id: mod.id,
      chapter_id: ch.id,
    }, { onConflict: 'user_id,chapter_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

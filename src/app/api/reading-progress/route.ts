import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const PutSchema = z.object({
  content_type: z.enum(['module_chapter', 'autopsy_story']),
  parent_id: z.string().min(1).max(200),
  content_id: z.string().min(1).max(200),
  progress: z.number().min(0).max(1),
  last_heading: z.string().max(300).nullable().optional(),
})

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const limit = Math.min(20, Math.max(1, Number(new URL(request.url).searchParams.get('limit') ?? 6)))
  const { data, error } = await supabase
    .from('reading_progress')
    .select('content_type, parent_id, content_id, progress, last_heading, updated_at')
    .eq('user_id', user.id)
    .gt('progress', 0)
    .lt('progress', 0.98)
    .order('updated_at', { ascending: false })
    .limit(limit)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ rows: data ?? [] }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const parsed = PutSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body', issues: parsed.error.issues }, { status: 400 })
  const row = { user_id: user.id, ...parsed.data, last_heading: parsed.data.last_heading ?? null, updated_at: new Date().toISOString() }
  const { error } = await supabase.from('reading_progress').upsert(row, { onConflict: 'user_id,content_type,content_id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

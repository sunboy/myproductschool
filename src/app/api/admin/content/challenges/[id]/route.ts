import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkAdminSecret } from '@/lib/content/admin-auth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = checkAdminSecret(req)
  if (deny) return deny

  const { id } = await params
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('challenges')
    .select('id,title,paradigm,industry,sub_vertical,difficulty,estimated_minutes,primary_competencies,secondary_competencies,frameworks,relevant_roles,company_tags,tags,is_published,is_premium,is_calibration')
    .eq('id', id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
  return NextResponse.json({ challenge: data })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = checkAdminSecret(req)
  if (deny) return deny

  const { id } = await params
  const body = await req.json()

  // Only allow updating tag/taxonomy fields, nothing structural
  const allowed = [
    'paradigm', 'industry', 'sub_vertical', 'difficulty', 'estimated_minutes',
    'primary_competencies', 'secondary_competencies', 'frameworks',
    'relevant_roles', 'company_tags', 'tags', 'is_premium',
  ]
  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('challenges').update(update).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

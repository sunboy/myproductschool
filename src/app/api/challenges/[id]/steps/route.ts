import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('challenge_steps')
    .select('id, move, step_index, prompt, hint, scaffold_options')
    .eq('challenge_id', id)
    .order('step_index')

  if (error) return NextResponse.json({ error: 'Failed to fetch steps' }, { status: 500 })

  return NextResponse.json({ steps: data ?? [] })
}

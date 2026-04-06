import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()

  const [sessionResult, turnsResult] = await Promise.all([
    adminClient
      .from('simulation_sessions')
      .select('*, company_profiles(name, industry, interview_style), challenges(title, prompt_text)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single(),
    adminClient
      .from('simulation_turns')
      .select('*')
      .eq('session_id', id)
      .order('turn_index', { ascending: true }),
  ])

  if (sessionResult.error || !sessionResult.data) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  return NextResponse.json({
    session: sessionResult.data,
    turns: turnsResult.data ?? [],
  })
}

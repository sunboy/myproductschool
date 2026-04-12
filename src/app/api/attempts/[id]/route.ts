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

  const [attemptResult, patternsResult] = await Promise.all([
    adminClient
      .from('challenge_attempts')
      .select('*, challenges(id, title, prompt_text, difficulty, domain_id)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single(),
    adminClient
      .from('user_failure_patterns')
      .select('*')
      .eq('attempt_id', id)
      .eq('user_id', user.id),
  ])

  if (attemptResult.error || !attemptResult.data) {
    return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
  }

  return NextResponse.json({
    attempt: attemptResult.data,
    feedback: attemptResult.data.feedback_json,
    patterns: patternsResult.data ?? [],
  })
}

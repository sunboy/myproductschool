import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/challenges/drafts?limit=1
 *
 * Returns the most recent in-progress challenge attempts for the current user.
 * "In-progress" = a challenge_attempt row where submitted_at IS NULL.
 * Used by the dashboard to surface the "continue where you left off" card.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '3', 10), 10)

  const adminClient = createAdminClient()

  // Fetch incomplete attempts (no submitted_at) with challenge title
  const { data: drafts, error } = await adminClient
    .from('challenge_attempts')
    .select(`
      id,
      prompt_id,
      steps_completed,
      created_at,
      challenge_prompts!inner(
        id,
        title
      )
    `)
    .eq('user_id', user.id)
    .is('submitted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[drafts] DB error:', error.message)
    return NextResponse.json([], { status: 200 })
  }

  if (!drafts || drafts.length === 0) {
    return NextResponse.json([])
  }

  const result = drafts.map((d: {
    id: string
    prompt_id: string
    steps_completed: number | null
    created_at: string
    challenge_prompts: { id: string; title: string } | { id: string; title: string }[]
  }) => {
    // Supabase inner join can return object or array depending on client version
    const cp = Array.isArray(d.challenge_prompts) ? d.challenge_prompts[0] : d.challenge_prompts
    return {
      id: d.id,
      challenge_id: d.prompt_id,
      challenge_title: cp?.title ?? 'Untitled Challenge',
      steps_completed: d.steps_completed ?? 1,
      created_at: d.created_at,
    }
  })

  return NextResponse.json(result)
}

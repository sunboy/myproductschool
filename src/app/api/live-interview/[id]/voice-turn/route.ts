import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { apiError } from '@/lib/api/error'
import { z, ZodError } from 'zod'

const RequestSchema = z.object({
  content: z.string().trim().min(1).max(20000),
  role: z.enum(['hatch', 'user']),
  turnIndex: z.number().int().min(0).optional(),
})

function validationIssues(error: ZodError) {
  return error.issues.map(issue => ({
    path: issue.path.join('.'),
    message: issue.message,
  }))
}

function sameTurn(
  turn: { role: string; content: string } | null | undefined,
  role: 'hatch' | 'user',
  content: string
) {
  return turn?.role === role && turn.content.trim() === content
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (process.env.USE_MOCK_DATA === 'true') {
    return Response.json({ ok: true, skipped: true })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return apiError(401, 'auth_required', 'Unauthorized')

  let body: z.infer<typeof RequestSchema>
  try {
    body = RequestSchema.parse(await request.json())
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(400, 'invalid_request', 'Invalid request body', {
        issues: validationIssues(error),
      })
    }
    return apiError(400, 'invalid_json', 'Invalid JSON body')
  }

  const adminClient = createAdminClient()

  const { data: session } = await adminClient
    .from('live_interview_sessions')
    .select('status')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!session || session.status !== 'active') {
    return apiError(404, 'session_not_found', 'Session not found or not active')
  }

  const { data: recentTurns, count, error: turnsError } = await adminClient
    .from('live_interview_turns')
    .select('id, role, content, turn_index', { count: 'exact' })
    .eq('session_id', id)
    .order('turn_index', { ascending: false })
    .limit(8)

  if (turnsError) return apiError(500, 'live_interview_turns_load_failed', 'Internal Server Error')

  const latestTurn = recentTurns?.[0]
  if (sameTurn(latestTurn, body.role, body.content)) {
    return Response.json({ ok: true, duplicate: true, turnIndex: latestTurn.turn_index })
  }

  const currentCount = count ?? recentTurns?.length ?? 0
  let nextIndex = currentCount

  if (typeof body.turnIndex === 'number') {
    const existingAtRequestedIndex = recentTurns?.find(turn => turn.turn_index === body.turnIndex)
    if (sameTurn(existingAtRequestedIndex, body.role, body.content)) {
      return Response.json({ ok: true, duplicate: true, turnIndex: body.turnIndex })
    }
    if (!existingAtRequestedIndex) nextIndex = Math.max(currentCount, body.turnIndex)
  }

  const { error: insertError } = await adminClient
    .from('live_interview_turns')
    .insert({
      session_id: id,
      turn_index: nextIndex,
      role: body.role,
      content: body.content,
    })

  if (insertError) {
    console.error('Failed to save voice turn:', insertError)
    return apiError(500, 'live_interview_turn_save_failed', 'Failed to save turn')
  }

  const { count: latestCount } = await adminClient
    .from('live_interview_turns')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', id)

  await adminClient
    .from('live_interview_sessions')
    .update({ total_turns: latestCount ?? nextIndex + 1 })
    .eq('id', id)

  return Response.json({ ok: true, turnIndex: nextIndex })
}

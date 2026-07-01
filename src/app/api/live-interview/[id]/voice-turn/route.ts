import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { apiError } from '@/lib/api/error'
import { z, ZodError } from 'zod'
import { IS_MOCK } from '@/lib/mock'

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

// Normalized comparison for echo detection: lowercased, punctuation stripped,
// whitespace collapsed. Mirrors the client-side normalizer.
function normalizeForEcho(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const ECHO_MIN_LEN = 12
const ECHO_LEN_RATIO = 0.8

// True when two normalized strings are near-complete echoes of each other: identical,
// or one contains the other AND they're close in length. Mirrors the client heuristic.
// Deliberately conservative — requiring near-equality (not any substring overlap) so a
// user quoting a fragment of what Hatch said is never mistaken for an echo.
function isNearEcho(a: string, b: string): boolean {
  if (a === b) return true
  const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a]
  return longer.includes(shorter) && shorter.length / longer.length >= ECHO_LEN_RATIO
}

// Safety net for the acoustic-echo bug: an incoming USER turn that near-matches a
// recent HATCH turn is Hatch's own TTS echoed back through the mic, not the user. The
// client suppresses these, but a role-inverted echo must never reach the DB (it
// corrupts the transcript — see the greeting-echo bug), so we drop it server-side too.
// Scans the recent hatch turns (not just the latest) to catch an echo that lands after
// another turn slips in. Only fires user-echoing-hatch, never the reverse.
function isRoleInvertedEcho(
  recent: { role: string; content: string }[] | null | undefined,
  role: 'hatch' | 'user',
  content: string
): boolean {
  if (role !== 'user' || !recent?.length) return false
  const incoming = normalizeForEcho(content)
  if (incoming.length < ECHO_MIN_LEN) return false
  return recent.some(
    (t) => t.role === 'hatch' && isNearEcho(normalizeForEcho(t.content), incoming)
  )
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (IS_MOCK) {
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
  // Drop an acoustic echo of Hatch persisted as a user turn (defense in depth behind
  // the client-side suppression). Scans the recent turns we already fetched.
  if (isRoleInvertedEcho(recentTurns, body.role, body.content)) {
    return Response.json({ ok: true, echoSuppressed: true })
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

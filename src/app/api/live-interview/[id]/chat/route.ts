import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { parseGradingSignal } from '@/lib/live-interview/parse-grading-signal'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Mock mode
  if (process.env.USE_MOCK_DATA === 'true') {
    return Response.json({
      reply: "That's a great observation. Let me push back a little — how would you measure the success of that approach? What metric would tell you it's working?",
      signal: { flowMove: 'frame', competency: 'motivation_theory', signal: 'Good instinct to question the metric.' },
    })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { message } = await request.json()
  if (!message?.trim()) return new Response('Bad Request', { status: 400 })

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 })
  }
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const adminClient = createAdminClient()

  // Load session (verify ownership + get system prompt + flow_coverage)
  const { data: session } = await adminClient
    .from('live_interview_sessions')
    .select('system_prompt, status, flow_coverage')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!session) return new Response('Session not found', { status: 404 })
  if (session.status === 'completed') return new Response('Session ended', { status: 410 })

  // Load existing turns for conversation history
  const { data: turnsData, count, error: turnsError } = await adminClient
    .from('live_interview_turns')
    .select('role, content, turn_index', { count: 'exact' })
    .eq('session_id', id)
    .order('turn_index', { ascending: true })

  if (turnsError) return new Response('Internal Server Error', { status: 500 })
  const nextIndex = count ?? 0

  // Build conversation messages
  const conversationMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [
    ...(turnsData ?? []).map((t) => ({
      role: (t.role === 'luma' ? 'assistant' : 'user') as 'user' | 'assistant',
      content: t.content,
    })),
    { role: 'user' as const, content: message.trim() },
  ]

  // Call Claude with caching on system prompt
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    system: [{ type: 'text', text: session.system_prompt ?? '', cache_control: { type: 'ephemeral' } }],
    messages: conversationMessages,
  })

  const rawContent = response.content[0].type === 'text' ? response.content[0].text : ''
  const { cleanContent, signal } = parseGradingSignal(rawContent)

  // Save both turns to DB (with signal on luma turn)
  const { error: insertError } = await adminClient.from('live_interview_turns').insert([
    {
      session_id: id,
      turn_index: nextIndex,
      role: 'user',
      content: message.trim(),
    },
    {
      session_id: id,
      turn_index: nextIndex + 1,
      role: 'luma',
      content: cleanContent,
      flow_move_detected: signal?.flowMove || null,
      competency_signals: signal ? { competency: signal.competency, signal: signal.signal } : null,
    },
  ])

  if (insertError) {
    console.error('Failed to save turns:', insertError)
    return new Response('Failed to save turn', { status: 500 })
  }

  // Update FLOW coverage on session if a valid flow move was detected
  if (signal?.flowMove) {
    const coverage = (session.flow_coverage ?? { frame: 0, list: 0, optimize: 0, win: 0 }) as Record<string, number>
    const current = coverage[signal.flowMove] ?? 0
    coverage[signal.flowMove] = Math.min(1.0, current + 0.15)
    await adminClient
      .from('live_interview_sessions')
      .update({ flow_coverage: coverage, total_turns: nextIndex + 2 })
      .eq('id', id)
  }

  return Response.json({ reply: cleanContent, signal: signal ?? undefined })
}

import { createAdminClient } from '@/lib/supabase/admin'
import { parseGradingSignal } from '@/lib/live-interview/parse-grading-signal'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (process.env.USE_MOCK_DATA === 'true') {
    return Response.json({
      choices: [{
        message: {
          role: 'assistant',
          content: "That's a great point. Can you tell me more about who specifically is affected by this problem?",
        },
        finish_reason: 'stop',
      }],
    })
  }

  const body = await request.json()
  const messages: Array<{ role: string; content: string }> = body.messages ?? []

  const adminClient = createAdminClient()

  const { data: session } = await adminClient
    .from('live_interview_sessions')
    .select('*')
    .eq('id', id)
    .single()

  if (!session || session.status !== 'active') {
    return new Response('Session not found or not active', { status: 404 })
  }

  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content ?? ''

  // Get existing turns
  const { data: turns, count } = await adminClient
    .from('live_interview_turns')
    .select('role, content, turn_index', { count: 'exact' })
    .eq('session_id', id)
    .order('turn_index', { ascending: true })

  const turnCount = count ?? 0

  // Build conversation messages from turns table
  const conversationMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [
    ...(turns ?? []).map((t) => ({
      role: (t.role === 'luma' ? 'assistant' : 'user') as 'user' | 'assistant',
      content: t.content,
    })),
    { role: 'user' as const, content: lastUserMsg },
  ]

  // Call Claude with multi-turn messages format
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    system: [{ type: 'text', text: session.system_prompt, cache_control: { type: 'ephemeral' } }],
    messages: conversationMessages,
  })

  const rawContent = response.content[0].type === 'text' ? response.content[0].text : ''
  const { cleanContent, signal } = parseGradingSignal(rawContent)

  // Update flow_coverage from LLM signal
  const currentCoverage = (session.flow_coverage ?? { frame: 0, list: 0, optimize: 0, win: 0 }) as Record<string, number>
  if (signal?.flowMove) {
    const current = currentCoverage[signal.flowMove] ?? 0
    currentCoverage[signal.flowMove] = Math.min(1.0, current + 0.15)
  }

  // Save turns and update session in parallel
  const nextIndex = turnCount
  await Promise.all([
    adminClient.from('live_interview_turns').insert([
      {
        session_id: id,
        turn_index: nextIndex,
        role: 'user',
        content: lastUserMsg,
      },
      {
        session_id: id,
        turn_index: nextIndex + 1,
        role: 'luma',
        content: cleanContent,
        flow_move_detected: signal?.flowMove || null,
        competency_signals: signal ? { competency: signal.competency, signal: signal.signal } : null,
      },
    ]),
    adminClient
      .from('live_interview_sessions')
      .update({ flow_coverage: currentCoverage, total_turns: nextIndex + 2 })
      .eq('id', id),
  ])

  return Response.json({
    choices: [{
      message: { role: 'assistant', content: cleanContent },
      finish_reason: 'stop',
    }],
  })
}

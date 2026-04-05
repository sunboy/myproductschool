import { createAdminClient } from '@/lib/supabase/admin'
import { detectFlowMove } from '@/lib/live-interview/flow-detector'
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

  const flowMove = detectFlowMove(lastUserMsg)

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

  // Strip grading signal JSON block (appended by Luma after each response)
  const signalMatch = rawContent.match(/\{["']?flow_move["']?:[\s\S]*$/)
  const cleanContent = rawContent.replace(/\n?\{["']?flow_move["']?:[\s\S]*$/, '').trim()

  let signal: { flow_move: string; competency: string; signal: string } | null = null
  if (signalMatch) {
    try {
      signal = JSON.parse(signalMatch[0])
    } catch {
      // ignore parse errors
    }
  }

  // Update flow_coverage
  const currentCoverage = (session.flow_coverage ?? {}) as Record<string, number>
  if (flowMove) {
    const current = currentCoverage[flowMove] ?? 0
    currentCoverage[flowMove] = Math.min(1.0, current + 0.2)
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
        flow_move_detected: flowMove,
      },
      {
        session_id: id,
        turn_index: nextIndex + 1,
        role: 'luma',
        content: cleanContent,
        competency_signals: signal,
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

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildCoverageNote } from '@/lib/live-interview/system-prompt'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Mock mode
  if (process.env.USE_MOCK_DATA === 'true') {
    return Response.json({
      reply: "Hold on — you jumped straight to a solution. What's the actual problem here? If I asked the user, what would they say is broken?",
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

  // Load session
  const { data: session } = await adminClient
    .from('live_interview_sessions')
    .select('system_prompt, status, flow_coverage, conversation_memory, started_at, challenge_id')
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
      role: (t.role === 'hatch' ? 'assistant' : 'user') as 'user' | 'assistant',
      content: t.content,
    })),
    { role: 'user' as const, content: message.trim() },
  ]

  // Build dynamic context to inject alongside the stored system prompt
  const dynamicContext: string[] = []

  // FLOW coverage steering
  const flowCoverage = (session.flow_coverage ?? { frame: 0, list: 0, optimize: 0, win: 0 }) as Record<string, number>
  dynamicContext.push(buildCoverageNote(flowCoverage))

  // Conversation memory — salient items from earlier in the interview
  const memory = (session.conversation_memory ?? []) as string[]
  if (memory.length > 0) {
    dynamicContext.push(
      `[THINGS THE CANDIDATE HAS SAID]\n${memory.map((m) => `- ${m}`).join('\n')}\nReference these when relevant — especially contradictions.`
    )
  }

  // Time-based soft closing signal
  if (session.started_at) {
    const elapsed = (Date.now() - new Date(session.started_at).getTime()) / 1000 / 60
    if (elapsed >= 20) {
      dynamicContext.push(
        `[TIME CHECK] The interview has been going for ${Math.round(elapsed)} minutes. Start looking for a natural closing point when the candidate reaches a good stopping place.`
      )
    }
  }

  const fullSystemPrompt = [
    session.system_prompt ?? '',
    ...dynamicContext,
  ].join('\n\n')

  // Generate Hatch's response — no grading signals, pure conversation
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 600,
    system: [{ type: 'text', text: fullSystemPrompt, cache_control: { type: 'ephemeral' } }],
    messages: conversationMessages,
  })

  const reply = response.content[0].type === 'text' ? response.content[0].text : ''

  // Save both turns to DB
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
      role: 'hatch',
      content: reply,
    },
  ])

  if (insertError) {
    console.error('Failed to save turns:', insertError)
    return new Response('Failed to save turn', { status: 500 })
  }

  // Update total turns
  await adminClient
    .from('live_interview_sessions')
    .update({ total_turns: nextIndex + 2 })
    .eq('id', id)

  // Fire async grading — non-blocking, don't await
  const recentTurns = [
    // Include last 2 existing turns for context + the new exchange
    ...(turnsData ?? []).slice(-2).map((t) => ({
      role: t.role as 'user' | 'hatch',
      content: t.content,
    })),
    { role: 'user' as const, content: message.trim() },
    { role: 'hatch' as const, content: reply },
  ]

  const origin = request.headers.get('origin') ?? request.headers.get('host') ?? ''
  const protocol = origin.startsWith('http') ? '' : 'http://'
  const gradeUrl = `${protocol}${origin}/api/live-interview/${id}/grade-turn`

  fetch(gradeUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recentTurns, challengeId: session.challenge_id }),
  }).catch((err) => {
    console.error('Async grade-turn failed:', err)
  })

  return Response.json({ reply })
}

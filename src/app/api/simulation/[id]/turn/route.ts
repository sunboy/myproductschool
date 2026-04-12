import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Anthropic from '@anthropic-ai/sdk'
import { LUMA_CHAT_SYSTEM_PROMPT } from '@/lib/luma/system-prompt'
import { NextResponse } from 'next/server'
import { IS_MOCK } from '@/lib/mock'
import { getLumaContext, buildLumaContextString } from '@/lib/luma-context'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { content } = await request.json()
  if (!content?.trim()) return NextResponse.json({ error: 'Content required' }, { status: 400 })

  const adminClient = createAdminClient()

  const { data: session, error: sessionError } = await adminClient
    .from('simulation_sessions')
    .select('*, company_profiles(name, industry, product_focus, interview_style), challenges(title, prompt_text)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (sessionError || !session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  if (session.status === 'completed') return NextResponse.json({ error: 'Session already completed' }, { status: 400 })

  const [existingTurnsResult, lumaCtx] = await Promise.all([
    adminClient
      .from('simulation_turns')
      .select('role, content, turn_index')
      .eq('session_id', id)
      .order('turn_index', { ascending: true }),
    getLumaContext(user.id),
  ])

  const existingTurns = existingTurnsResult.data
  const nextTurnIndex = (existingTurns?.length ?? 0)

  const companyContext = session.company_profiles
    ? `\n\nYou are interviewing for ${session.company_profiles.name} (${session.company_profiles.industry}). Interview style: ${session.company_profiles.interview_style}.`
    : ''
  const challengeContext = session.challenges
    ? `\n\nChallenge prompt: ${session.challenges.prompt_text}`
    : ''
  const candidateContext = buildLumaContextString(lumaCtx, 'chat')
  const baseSystemPrompt = LUMA_CHAT_SYSTEM_PROMPT + companyContext + challengeContext
  const systemPrompt = baseSystemPrompt + (candidateContext ? '\n\n## Candidate Profile\n' + candidateContext : '')

  const messages = [
    ...(existingTurns ?? []).map(t => ({
      role: t.role === 'luma' ? 'assistant' as const : 'user' as const,
      content: t.content,
    })),
    { role: 'user' as const, content },
  ]

  let lumaReply: string
  if (IS_MOCK || !process.env.ANTHROPIC_API_KEY) {
    lumaReply = "That's an interesting perspective. Can you walk me through how you'd measure the success of that approach? What specific metrics would you track in the first 30 days?"
  } else {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      system: systemPrompt,
      messages,
    })
    lumaReply = response.content[0].type === 'text' ? response.content[0].text : ''
  }

  await adminClient.from('simulation_turns').insert([
    { session_id: id, role: 'user', content, turn_index: nextTurnIndex },
    { session_id: id, role: 'luma', content: lumaReply, turn_index: nextTurnIndex + 1 },
  ])

  const questionsRemaining = Math.max(0, 5 - Math.floor((nextTurnIndex + 2) / 2))

  return NextResponse.json({ reply: lumaReply, turn_index: nextTurnIndex + 1, questions_remaining: questionsRemaining })
}

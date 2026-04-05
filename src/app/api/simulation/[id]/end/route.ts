import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Anthropic from '@anthropic-ai/sdk'
import { LUMA_SIMULATION_DEBRIEF_PROMPT } from '@/lib/luma/system-prompt'
import { LumaFeedbackSchema, clampFeedbackScores } from '@/lib/luma/feedback-schema'
import { NextResponse } from 'next/server'
import { IS_MOCK } from '@/lib/mock'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()

  const [sessionResult, turnsResult] = await Promise.all([
    adminClient.from('simulation_sessions').select('*, company_profiles(name)').eq('id', id).eq('user_id', user.id).single(),
    adminClient.from('simulation_turns').select('role, content, turn_index').eq('session_id', id).order('turn_index', { ascending: true }),
  ])

  if (sessionResult.error || !sessionResult.data) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  if (sessionResult.data.status === 'completed') return NextResponse.json(sessionResult.data.debrief_json)

  const transcript = (turnsResult.data ?? []).map(t => `${t.role === 'luma' ? 'Interviewer' : 'Candidate'}: ${t.content}`).join('\n\n')

  let debrief: object
  if (IS_MOCK || !process.env.ANTHROPIC_API_KEY) {
    debrief = { overall_score: 72, dimensions: [], strengths: ['Clear structure'], improvements: ['Add more metrics'], detected_patterns: [], interview_summary: 'Good overall performance.' }
  } else {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: LUMA_SIMULATION_DEBRIEF_PROMPT,
      messages: [{ role: 'user', content: `Interview transcript:\n\n${transcript}` }],
    })
    const raw = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const parsed = JSON.parse(raw)
    const validated = LumaFeedbackSchema.safeParse(parsed)
    debrief = validated.success ? clampFeedbackScores(validated.data) : parsed
  }

  await adminClient.from('simulation_sessions').update({
    status: 'completed',
    debrief_json: debrief,
    completed_at: new Date().toISOString(),
  }).eq('id', id)

  // Insert luma_context challenge_insight (fire-and-forget, non-mock only)
  if (!IS_MOCK && process.env.ANTHROPIC_API_KEY) {
    const debriefAny = debrief as { dimensions?: Array<{ dimension: string; score: number }> }
    const dimensions = debriefAny.dimensions ?? []
    let strongestDimension: string | undefined
    let weakestDimension: string | undefined
    if (dimensions.length > 0) {
      const sorted = [...dimensions].sort((a, b) => b.score - a.score)
      strongestDimension = sorted[0].dimension
      weakestDimension = sorted[sorted.length - 1].dimension
      // Only set weakest as a growth area if it's meaningfully lower than strongest
      if (sorted[0].score === sorted[sorted.length - 1].score) {
        weakestDimension = undefined
      }
    }
    const sessionData = sessionResult.data as { company_profiles?: { name?: string } | null }
    const companyName = sessionData.company_profiles?.name ?? undefined
    const contentStr = strongestDimension
      ? `Completed simulation${companyName ? ' "' + companyName + '"' : ''}. Strongest dimension: ${strongestDimension}. Growth area: ${weakestDimension ?? 'keep practising'}.`
      : `Completed simulation${companyName ? ' "' + companyName + '"' : ''}.`
    adminClient.from('luma_context').insert({
      user_id: user.id,
      context_type: 'challenge_insight',
      content: contentStr,
      is_active: true,
      created_at: new Date().toISOString(),
    }).then(() => {}, () => {})
  }

  // Trigger achievement check
  await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/achievements/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-service-key': process.env.SUPABASE_SERVICE_ROLE_KEY ?? '' },
    body: JSON.stringify({ user_id: user.id, event_type: 'simulation_complete', event_value: 1 }),
  }).catch(() => {})

  return NextResponse.json(debrief)
}

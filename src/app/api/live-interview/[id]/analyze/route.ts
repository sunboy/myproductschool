import { createAdminClient } from '@/lib/supabase/admin'
import Anthropic from '@anthropic-ai/sdk'

const VALID_FLOW_MOVES = new Set(['frame', 'list', 'optimize', 'win'])

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ ok: false }, { status: 503 })
  }

  const { content, role } = await request.json()
  if (!content || role !== 'user') {
    // Only analyze user turns for FLOW move detection
    return Response.json({ ok: true, flowMove: null })
  }

  const adminClient = createAdminClient()

  const { data: session } = await adminClient
    .from('live_interview_sessions')
    .select('flow_coverage, total_turns, status')
    .eq('id', id)
    .single()

  if (!session || session.status !== 'active') {
    return Response.json({ ok: false }, { status: 404 })
  }

  // Use a fast model to classify the FLOW move
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 50,
    system: `Classify the following interview response into exactly one FLOW move. Reply with ONLY one word: frame, list, optimize, win, or none.

- frame: identifying the root problem, diagnosing causes, scoping the issue
- list: brainstorming solutions, identifying stakeholders, generating options
- optimize: evaluating tradeoffs, prioritizing, choosing criteria
- win: defining success metrics, making the case, proposing a plan`,
    messages: [{ role: 'user', content }],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text.trim().toLowerCase() : ''
  const flowMove = VALID_FLOW_MOVES.has(raw) ? raw : null

  if (flowMove) {
    const coverage = (session.flow_coverage ?? { frame: 0, list: 0, optimize: 0, win: 0 }) as Record<string, number>
    const current = coverage[flowMove] ?? 0
    coverage[flowMove] = Math.min(1.0, current + 0.15)

    await adminClient
      .from('live_interview_sessions')
      .update({ flow_coverage: coverage, total_turns: (session.total_turns ?? 0) + 1 })
      .eq('id', id)
  }

  return Response.json({ ok: true, flowMove })
}

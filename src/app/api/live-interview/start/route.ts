import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getLumaContext, buildLumaContextString } from '@/lib/luma-context'
import { buildLiveInterviewSystemPrompt } from '@/lib/live-interview/system-prompt'

export async function POST(request: Request) {
  if (process.env.USE_MOCK_DATA === 'true') {
    return Response.json({ sessionId: 'mock-session-id', companyName: 'Uber', role: 'PM' })
  }

  const { companyId, roleId } = await request.json()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const adminClient = createAdminClient()

  // Fetch user data in parallel
  const [profileResult, moveLevelsResult, competenciesResult, failurePatternsResult] = await Promise.all([
    adminClient.from('profiles').select('archetype, archetype_description, active_role').eq('id', user.id).single(),
    adminClient.from('move_levels').select('*').eq('user_id', user.id),
    adminClient.from('learner_competencies').select('*').eq('user_id', user.id),
    adminClient.from('user_failure_patterns').select('*').eq('user_id', user.id).order('detected_at', { ascending: false }).limit(5),
  ])

  let companyRow: { name: string; interview_persona_prompt: string | null; roles: string[] | null } | null = null
  if (companyId) {
    const { data } = await adminClient
      .from('company_profiles')
      .select('name, interview_persona_prompt, roles')
      .eq('id', companyId)
      .single()
    companyRow = data
  }

  const profile = profileResult.data
  const moveLevels = moveLevelsResult.data ?? []
  const competencies = competenciesResult.data ?? []
  const failurePatterns = failurePatternsResult.data ?? []

  // Build Luma context string
  const lumaCtx = await getLumaContext(user.id)
  const lumaContextStr = buildLumaContextString(lumaCtx, 'coaching')

  // Build move levels object for system prompt
  const moveLevelsObj = {
    frame: moveLevels.find((m) => m.move === 'frame')?.level ?? 1,
    list: moveLevels.find((m) => m.move === 'list')?.level ?? 1,
    optimize: moveLevels.find((m) => m.move === 'optimize')?.level ?? 1,
    win: moveLevels.find((m) => m.move === 'win')?.level ?? 1,
  }

  // Search for relevant notes (graceful fallback if notes system unavailable)
  let relevantNotes = ''
  try {
    const { searchSimilarNotes } = await import('@/lib/notes/embeddings')
    const notesQuery = companyRow
      ? `${companyRow.name} ${roleId ?? 'PM'} product interview`
      : 'product interview preparation'
    const notes = await searchSimilarNotes(user.id, notesQuery, 3)
    if (notes && notes.length > 0) {
      relevantNotes = notes.map((n: { content: string }) => `- ${n.content}`).join('\n')
    }
  } catch {
    // Notes system unavailable — continue without notes
  }

  const systemPrompt = buildLiveInterviewSystemPrompt({
    archetype: profile?.archetype ?? 'Analyst',
    archetypeDescription: profile?.archetype_description ?? '',
    moveLevels: moveLevelsObj,
    failurePatterns: failurePatterns.map((fp) => ({ pattern_name: fp.pattern_name })),
    competencies: competencies.map((c) => ({ competency: c.competency, score: c.score })),
    lumaContext: lumaContextStr,
    companyName: companyRow?.name,
    roleId: roleId ?? 'PM',
    personaPrompt: companyRow?.interview_persona_prompt ?? undefined,
    relevantNotes: relevantNotes || undefined,
  })

  const { data: session } = await adminClient
    .from('live_interview_sessions')
    .insert({
      user_id: user.id,
      company_id: companyId ?? null,
      role_id: roleId ?? 'PM',
      status: 'active',
      started_at: new Date().toISOString(),
      system_prompt: systemPrompt,
      calibration_snapshot: {
        archetype: profile?.archetype ?? 'Analyst',
        moveLevels: moveLevelsObj,
        failurePatterns: failurePatterns.map((fp) => ({ pattern_name: fp.pattern_name })),
      },
    })
    .select('id')
    .single()

  return Response.json({ sessionId: session?.id, systemPrompt, companyName: companyRow?.name, role: roleId ?? 'PM' })
}

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { IS_MOCK } from '@/lib/mock'
import Anthropic from '@anthropic-ai/sdk'

export async function GET() {
  if (IS_MOCK) {
    return NextResponse.json({
      scores: { frame: 72, list: 65, optimize: 58, win: 81 },
      archetype: 'The Strategist',
      archetype_description: 'You excel at framing problems clearly and making crisp recommendations. Your next growth area is listing all relevant options before converging.',
      starting_levels: { frame: 3, list: 2, optimize: 2, win: 3 },
      percentile: 68,
      luma_observation: "Your framing instincts are already sharp — you lead with the right questions before jumping to solutions. Win is your growth edge: practice landing your recommendation with the confidence it deserves.",
      strengths: ['Clear problem framing', 'Structured thinking'],
      focus_area: 'Win move — crisp recommendation delivery',
    })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()

  const [profileResult, levelsResult, attemptResult] = await Promise.all([
    adminClient.from('profiles').select('archetype, archetype_description').eq('id', user.id).single(),
    adminClient.from('move_levels').select('move, level, xp').eq('user_id', user.id),
    adminClient
      .from('calibration_attempts')
      .select('scores_json, percentile')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const levels = levelsResult.data ?? []
  const startingLevels = Object.fromEntries(levels.map(l => [l.move, l.level]))

  const scores = attemptResult.data?.scores_json ?? { frame: 0, list: 0, optimize: 0, win: 0 }
  const archetype = profileResult.data?.archetype ?? 'Unknown'

  // Generate Luma observation via Claude (non-fatal)
  let observation = ''
  let strengths: string[] = []
  let focus_area = ''

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const message = await anthropicClient.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        system: 'You are Luma, a warm and direct product thinking coach. Respond only with a JSON object, no markdown.',
        messages: [
          {
            role: 'user',
            content: `The user just completed a calibration. FLOW scores: Frame ${scores.frame}, List ${scores.list}, Optimize ${scores.optimize}, Win ${scores.win}. Archetype: "${archetype}".\n\nReturn JSON: { "observation": "1-2 warm sentences — lead with a strength, name the focus area", "strengths": ["2-3 short strength labels"], "focus_area": "one short focus area label" }`,
          },
        ],
      })

      const raw = message.content[0].type === 'text' ? message.content[0].text : '{}'
      const parsed = JSON.parse(raw)
      observation = parsed.observation ?? ''
      strengths = parsed.strengths ?? []
      focus_area = parsed.focus_area ?? ''
    } catch (err) {
      console.error('Luma calibration observation failed (non-fatal):', err)
    }
  }

  // Insert into luma_context (non-fatal)
  if (observation) {
    try {
      await adminClient.from('luma_context').insert({
        user_id: user.id,
        context_type: 'calibration',
        content: observation,
        is_active: true,
        created_at: new Date().toISOString(),
      })
    } catch (err) {
      console.error('Failed to insert luma_context (non-fatal):', err)
    }
  }

  return NextResponse.json({
    scores,
    archetype,
    archetype_description: profileResult.data?.archetype_description ?? '',
    starting_levels: startingLevels,
    percentile: attemptResult.data?.percentile ?? 50,
    luma_observation: observation,
    strengths,
    focus_area,
  })
}

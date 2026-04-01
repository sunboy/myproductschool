import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getLumaContext } from '@/lib/v2/luma-context'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: challengeId } = await params
  const body = await req.json().catch(() => ({})) as {
    attempt_id?: string
    question_id?: string
    option_id?: string
    step?: string
    role_id?: string
    user_text?: string
  }
  const { attempt_id, question_id, option_id, step, user_text } = body

  if (!attempt_id || !question_id || !step) {
    return NextResponse.json({ error: 'Missing required fields: attempt_id, question_id, step' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Fetch attempt to get role_id
  const { data: attempt, error: attemptError } = await admin
    .from('challenge_attempts_v2')
    .select('role_id, user_id')
    .eq('id', attempt_id)
    .eq('user_id', user.id)
    .single()

  if (attemptError || !attempt) {
    return NextResponse.json({ error: 'Attempt not found or unauthorized' }, { status: 404 })
  }

  const roleId = attempt.role_id as string

  // Freeform path — no selected option
  if (!option_id) {
    const cacheKey = `${user.id}:${challengeId}:${step}:${question_id}:freeform`

    const { data: cached } = await admin
      .from('coaching_cache')
      .select('role_context, career_signal, hit_count')
      .eq('cache_key', cacheKey)
      .single()

    if (cached) {
      await admin
        .from('coaching_cache')
        .update({ hit_count: cached.hit_count + 1, last_hit_at: new Date().toISOString() })
        .eq('cache_key', cacheKey)
      return NextResponse.json({ role_context: cached.role_context, career_signal: cached.career_signal, cached: true })
    }

    // Cache miss — fetch question + challenge + role lens
    const [
      { data: question },
      { data: challenge },
      { data: roleLens },
    ] = await Promise.all([
      admin.from('step_questions').select('question_text').eq('id', question_id).single(),
      admin.from('challenges').select('scenario_context, scenario_trigger').eq('id', challengeId).single(),
      admin.from('role_lenses').select('label').eq('role_id', roleId).single(),
    ])

    const roleLabel = roleLens?.label ?? roleId
    const questionText = question?.question_text ?? ''
    const scenarioContext = challenge?.scenario_context ?? ''
    const scenarioTrigger = challenge?.scenario_trigger ?? ''
    const lumaContext = await getLumaContext(user.id, challengeId, step)

    const systemPrompt = `You are Luma, an AI coach at HackProduct. You give personalized, career-relevant coaching to engineers practicing product thinking.`
    let userPrompt = `The learner is a ${roleLabel} who just answered the ${step} step.
Challenge: ${scenarioContext} ${scenarioTrigger}
Question: ${questionText}
Their answer: "${user_text ?? '(no answer provided)'}"`

    if (lumaContext) {
      userPrompt += `\n\nLearner context:\n${lumaContext}`
    }

    userPrompt += `

Generate two short paragraphs:
1. "role_context" (2-3 sentences): Connect their answer to a real-world situation a ${roleLabel} faces.
2. "career_signal" (1 sentence): How this skill/gap affects their career. Be concrete.

Tone: Direct, warm. Senior ${roleLabel} mentoring a junior. No filler.
Return ONLY JSON: {"role_context":"...","career_signal":"..."}`

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 800,
      thinking: { type: 'adaptive' },
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    let rawText = ''
    for (const block of message.content) {
      if (block.type === 'text') { rawText = block.text; break }
    }

    let role_context = ''
    let career_signal = ''
    try {
      const parsed = JSON.parse(rawText)
      role_context = parsed.role_context ?? ''
      career_signal = parsed.career_signal ?? ''
    } catch {
      const rcMatch = rawText.match(/"role_context"\s*:\s*"([^"]+)"/)
      const csMatch = rawText.match(/"career_signal"\s*:\s*"([^"]+)"/)
      role_context = rcMatch?.[1] ?? ''
      career_signal = csMatch?.[1] ?? ''
    }

    await admin.from('coaching_cache').upsert({
      cache_key: cacheKey,
      role_context,
      career_signal,
      hit_count: 0,
      last_hit_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    })

    await admin
      .from('step_attempts')
      .update({ role_context, career_signal })
      .eq('attempt_id', attempt_id)
      .eq('question_id', question_id)

    return NextResponse.json({ role_context, career_signal, cached: false })
  }

  // Option-based path
  // Cache key: userId:challengeId:step:questionId:optionId:roleId
  const cacheKey = `${user.id}:${challengeId}:${step}:${question_id}:${option_id}:${roleId}`

  // Check coaching_cache for hit
  const { data: cached } = await admin
    .from('coaching_cache')
    .select('role_context, career_signal, hit_count')
    .eq('cache_key', cacheKey)
    .single()

  if (cached) {
    // Increment hit_count, update last_hit_at
    await admin
      .from('coaching_cache')
      .update({ hit_count: cached.hit_count + 1, last_hit_at: new Date().toISOString() })
      .eq('cache_key', cacheKey)
    return NextResponse.json({ role_context: cached.role_context, career_signal: cached.career_signal, cached: true })
  }

  // Cache miss — fetch all needed data in parallel
  const [
    { data: question },
    { data: option },
    { data: challenge },
    { data: roleLens },
  ] = await Promise.all([
    admin.from('step_questions')
      .select('question_text')
      .eq('id', question_id)
      .single(),
    admin.from('flow_options')
      .select('option_text, quality, explanation')
      .eq('id', option_id)
      .single(),
    admin.from('challenges')
      .select('scenario_context, scenario_trigger')
      .eq('id', challengeId)
      .single(),
    admin.from('role_lenses')
      .select('label, short_label')
      .eq('role_id', roleId)
      .single(),
  ])

  // Get best option for this question
  const { data: bestOption } = await admin
    .from('flow_options')
    .select('option_text')
    .eq('question_id', question_id)
    .eq('quality', 'best')
    .limit(1)
    .single()

  const roleLabel = roleLens?.label ?? roleId
  const selectedText = option?.option_text ?? ''
  const qualityLabel = option?.quality ?? ''
  const staticExplanation = option?.explanation ?? ''
  const bestText = bestOption?.option_text ?? ''
  const scenarioContext = challenge?.scenario_context ?? ''
  const scenarioTrigger = challenge?.scenario_trigger ?? ''
  const questionText = question?.question_text ?? ''

  // Get Luma context for personalization
  const lumaContext = await getLumaContext(user.id, challengeId, step)

  // Build the prompt
  const systemPrompt = `You are Luma, Luma is an AI coach at HackProduct. You give personalized, career-relevant coaching to engineers practicing product thinking.`

  let userPrompt = `The learner is a ${roleLabel} who just answered the ${step} step.
Challenge: ${scenarioContext} ${scenarioTrigger}
Question: ${questionText}
They selected: "${selectedText}" (${qualityLabel})
Best answer: "${bestText}"
Static explanation: ${staticExplanation}`

  if (lumaContext) {
    userPrompt += `\n\nLearner context:\n${lumaContext}`
  }

  userPrompt += `

Generate two short paragraphs:
1. "role_context" (2-3 sentences): Connect their choice to a real-world situation a ${roleLabel} faces.
2. "career_signal" (1 sentence): How this skill/gap affects their career. Be concrete.

Tone: Direct, warm. Senior ${roleLabel} mentoring a junior. No filler.
Return ONLY JSON: {"role_context":"...","career_signal":"..."}`

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 800,
    thinking: { type: 'adaptive' },
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  // Extract text content from response
  let rawText = ''
  for (const block of message.content) {
    if (block.type === 'text') {
      rawText = block.text
      break
    }
  }

  let role_context = ''
  let career_signal = ''

  try {
    const parsed = JSON.parse(rawText)
    role_context = parsed.role_context ?? ''
    career_signal = parsed.career_signal ?? ''
  } catch {
    // If JSON parse fails, try to extract from text
    const rcMatch = rawText.match(/"role_context"\s*:\s*"([^"]+)"/)
    const csMatch = rawText.match(/"career_signal"\s*:\s*"([^"]+)"/)
    role_context = rcMatch?.[1] ?? ''
    career_signal = csMatch?.[1] ?? ''
  }

  // Store result in coaching_cache
  await admin.from('coaching_cache').upsert({
    cache_key: cacheKey,
    role_context,
    career_signal,
    hit_count: 0,
    last_hit_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  })

  // Update step_attempts with role_context and career_signal
  await admin
    .from('step_attempts')
    .update({ role_context, career_signal })
    .eq('attempt_id', attempt_id)
    .eq('question_id', question_id)

  return NextResponse.json({ role_context, career_signal, cached: false })
}

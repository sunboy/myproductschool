import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { HATCH_CHAT_SYSTEM_PROMPT, HATCH_GLOBAL_CHAT_SYSTEM_PROMPT } from '@/lib/hatch/system-prompt'
import { IS_MOCK } from '@/lib/mock'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getHatchContext, buildHatchContextString } from '@/lib/hatch-context'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const MOCK_REPLIES = [
  "That's an interesting framing. Can you tell me more about *why* users would behave that way — what's driving their motivation here?",
  "Good instinct. How would you validate that hypothesis before committing engineering resources to it?",
  "You mentioned metrics — what would tell you this feature is working *well enough* to ship more?",
  "Walk me through the trade-offs in your top proposal. What are you giving up by going in that direction?",
  "Interesting. How does this change if the user is a power user vs someone brand new to the product?",
]

interface Message {
  role: 'user' | 'hatch'
  content: string
}

interface PageContext {
  pageType: string
  entityId: string | null
  pathname: string
}

/** Fetch 3 recommended challenges for the user based on their weakest competency/move. */
async function buildRecommendedChallengesBlock(userId: string): Promise<string> {
  try {
    const admin = createAdminClient()

    // Find their weakest FLOW move (lowest level)
    const { data: moveLevels } = await admin
      .from('move_levels')
      .select('move, level')
      .eq('user_id', userId)
      .order('level', { ascending: true })
      .limit(1)

    const weakestMove: string | null = moveLevels?.[0]?.move ?? null

    // Find challenges they've already completed
    const { data: completedAttempts } = await admin
      .from('challenge_attempts')
      .select('challenge_id')
      .eq('user_id', userId)
      .eq('status', 'completed')

    const completedIds = new Set((completedAttempts ?? []).map(a => a.challenge_id as string))

    // Fetch published challenges, preferring weakest move tag
    let query = admin
      .from('challenges')
      .select('id, slug, title, difficulty, move_tags, challenge_type')
      .eq('is_published', true)
      .neq('challenge_type', 'quick_take')
      .limit(20)

    if (weakestMove) {
      query = query.contains('move_tags', [weakestMove])
    }

    const { data: candidates } = await query

    // Filter out completed, pick up to 3
    const picks = (candidates ?? [])
      .filter(c => !completedIds.has(c.id))
      .slice(0, 3)

    if (!picks.length) return ''

    const lines = ['## Recommended Challenges', `Based on the learner's progress, suggest these specific challenges (use exact titles and URLs — do not make up other challenges):`]
    for (const c of picks) {
      const url = `/workspace/challenges/${c.slug ?? c.id}`
      const tags = (c.move_tags as string[] | null)?.join(', ') ?? 'general'
      lines.push(`- **${c.title}** (${c.difficulty ?? 'standard'}, FLOW: ${tags}) → ${url}`)
    }
    if (weakestMove) lines.push(`\nThese are selected because the learner's weakest FLOW move is **${weakestMove}**.`)
    lines.push(`\nWhen recommending challenges, always format the link as a markdown link: [Challenge Title](url)`)

    return lines.join('\n')
  } catch {
    return ''
  }
}

/** Fetch DB content relevant to the current page and return a formatted block. */
async function buildPageContextBlock(pageContext: PageContext): Promise<string> {
  const { pageType, entityId } = pageContext
  if (!entityId) {
    // No specific entity — just describe the page type
    const pageLabels: Record<string, string> = {
      dashboard: 'User is on the Dashboard — their home screen with streak, XP, quick take, and next challenge.',
      explore: 'User is on the Explore hub — browsing challenges, study plans, and domains.',
      practice: 'User is on the Practice hub — browsing FLOW challenges to attempt.',
      progress: 'User is on the Progress & Analytics page — reviewing their FLOW skill levels, archetype, and certification progress.',
      cohort: 'User is on the Cohort Leaderboard — weekly competitive rankings.',
    }
    const label = pageLabels[pageType]
    return label ? `## Current Page\n${label}` : ''
  }

  const admin = createAdminClient()

  try {
    if (pageType === 'challenge' || pageType === 'challenge_feedback') {
      // entityId may be a slug or UUID — try both
      const { data: challenge } = await admin
        .from('challenges')
        .select('title, difficulty, domain_id, move_tags, challenge_type, prompt_text, scenario_context, scenario_question, scenario_trigger, scenario_role')
        .or(`slug.eq.${entityId},id.eq.${entityId}`)
        .eq('is_published', true)
        .maybeSingle()

      if (!challenge) return ''

      const lines = [
        `## Current Page`,
        `User is ${pageType === 'challenge_feedback' ? 'reviewing feedback for' : 'working on'} a challenge:`,
        `**Title**: ${challenge.title}`,
        `**Type**: ${challenge.challenge_type ?? 'flow'} | **Difficulty**: ${challenge.difficulty ?? 'standard'}`,
      ]
      if (challenge.move_tags?.length) lines.push(`**FLOW moves**: ${challenge.move_tags.join(', ')}`)
      if (challenge.scenario_role) lines.push(`**Role**: ${challenge.scenario_role}`)
      if (challenge.scenario_context) lines.push(`**Scenario**: ${challenge.scenario_context.slice(0, 300)}${challenge.scenario_context.length > 300 ? '…' : ''}`)
      if (challenge.scenario_question) lines.push(`**Key question**: ${challenge.scenario_question}`)
      if (!challenge.scenario_context && challenge.prompt_text) lines.push(`**Prompt**: ${challenge.prompt_text.slice(0, 300)}`)

      if (pageType === 'challenge_feedback') {
        lines.push(`\nThe user has completed this challenge and is reviewing Hatch's feedback. You can discuss what they did well or how to improve.`)
      } else {
        lines.push(`\nThe user is actively working on this challenge. You can coach on approach without giving away answers.`)
      }

      return lines.join('\n')
    }

    if (pageType === 'study_plan') {
      const { data: plan } = await admin
        .from('study_plans')
        .select('title, description, difficulty, estimated_hours, item_count:study_plan_items(count)')
        .eq('slug', entityId)
        .eq('is_published', true)
        .maybeSingle()

      if (!plan) return ''

      const lines = [
        `## Current Page`,
        `User is viewing a study plan:`,
        `**Plan**: ${plan.title}`,
      ]
      if (plan.description) lines.push(`**About**: ${plan.description}`)
      if (plan.difficulty) lines.push(`**Difficulty**: ${plan.difficulty}`)
      if (plan.estimated_hours) lines.push(`**Est. time**: ~${plan.estimated_hours} hours`)

      return lines.join('\n')
    }

    if (pageType === 'domain') {
      const { data: domain } = await admin
        .from('domains')
        .select('title, description')
        .eq('slug', entityId)
        .eq('is_published', true)
        .maybeSingle()

      if (!domain) return ''

      const lines = [
        `## Current Page`,
        `User is browsing the "${domain.title}" topic area.`,
      ]
      if (domain.description) lines.push(domain.description)

      return lines.join('\n')
    }
  } catch {
    // Non-critical — don't fail the whole request
  }

  return ''
}

export async function POST(req: NextRequest) {
  const { challengeId, challengePrompt, message, history, pageContext } = await req.json()

  if (!message?.trim()) {
    return NextResponse.json({ reply: null })
  }

  if (IS_MOCK || !process.env.ANTHROPIC_API_KEY) {
    const reply = MOCK_REPLIES[Math.floor(Math.random() * MOCK_REPLIES.length)]
    return NextResponse.json({ reply })
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Build all context blocks in parallel
    const [hatchCtx, pageContextBlock, recommendedBlock] = await Promise.all([
      user ? getHatchContext(user.id) : Promise.resolve(null),
      pageContext ? buildPageContextBlock(pageContext as PageContext) : Promise.resolve(''),
      user ? buildRecommendedChallengesBlock(user.id) : Promise.resolve(''),
    ])

    const contextBlock = hatchCtx ? buildHatchContextString(hatchCtx, 'chat') : ''

    const basePrompt = challengeId ? HATCH_CHAT_SYSTEM_PROMPT : HATCH_GLOBAL_CHAT_SYSTEM_PROMPT

    let systemPrompt = basePrompt
    if (contextBlock) systemPrompt += '\n\n## Learner Context\n' + contextBlock
    if (pageContextBlock) systemPrompt += '\n\n' + pageContextBlock
    if (recommendedBlock) systemPrompt += '\n\n' + recommendedBlock

    // Build message history
    const messages: Anthropic.MessageParam[] = []

    // Add challenge context as first Hatch message (challenge workspace mode)
    if (challengePrompt) {
      messages.push({
        role: 'assistant',
        content: challengePrompt,
      })
    }

    // Add conversation history
    if (history?.length) {
      for (const msg of history as Message[]) {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
        })
      }
    }

    // Add current user message
    messages.push({ role: 'user', content: message })

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      system: systemPrompt,
      messages,
    })

    const content = response.content[0]
    const reply = content.type === 'text' ? content.text.trim() : null
    return NextResponse.json({ reply })
  } catch (error) {
    console.error('Hatch chat error:', error)
    const fallback = MOCK_REPLIES[Math.floor(Math.random() * MOCK_REPLIES.length)]
    return NextResponse.json({ reply: fallback })
  }
}

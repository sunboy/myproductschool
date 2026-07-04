import { createAdminClient } from '@/lib/supabase/admin'
import { buildHatchContextString, getHatchContext, type HatchUserContext } from '@/lib/hatch-context'
import { generateEmbedding } from '@/lib/embeddings'
import type { ChallengeType, FlowStep } from '@/lib/types'
import { coerceDifficulty } from '@/lib/practice/difficulty'

export type SkillSurface =
  | 'grading'
  | 'nudge'
  | 'chat'
  | 'recommendation'
  | 'reflection'
  | 'study_plan'
  | 'digest'
  | 'coaching'
  | 'live_interview'
  | 'artifact_watch'
  | 'interview_debrief'

export type SkillDiscipline =
  | 'product'
  | 'software'
  | 'data'
  | 'design'
  | 'leadership'
  | 'analytics'

export type SubmissionQuality = 'empty' | 'too_thin' | 'substantive'

export interface PracticeLink {
  type: 'challenge' | 'module' | 'study_plan'
  title: string
  href: string
  reason: string
}

export interface RetrievalHint {
  type: 'thinking_trap'
  title: string
  summary: string
  suggestion: string
  similarity: number | null
}

export interface SkillContextPack {
  surface: SkillSurface
  discipline: SkillDiscipline
  roleLabel: string
  weakestCompetency: string | null
  weakestFlowMove: string | null
  compactLearnerContext: string
  promptBlock: string
  responseContract: string
  practiceLink: PracticeLink | null
  retrievalHints: RetrievalHint[]
  submissionQuality?: SubmissionQuality
  raw: HatchUserContext
}

interface BuildSkillContextPackInput {
  userId: string
  surface: SkillSurface
  challengeType?: ChallengeType | 'claude_code_analytics' | null
  challengeTitle?: string | null
  challengePrompt?: string | null
  currentStep?: FlowStep | string | null
  submissionText?: string | null
  includePracticeLink?: boolean
  includeRetrieval?: boolean
}

interface ChallengeCandidate {
  id: string
  slug: string | null
  title: string | null
  challenge_type: string | null
  difficulty: string | null
  move_tags: string[] | null
  primary_competencies: string[] | null
  secondary_competencies: string[] | null
  relevant_roles: string[] | null
}

interface LearnModuleCandidate {
  slug: string
  name: string
  tagline: string | null
  difficulty: string | null
}

interface ThinkingTrapMatch {
  id: string
  name: string | null
  description: string | null
  fix_suggestion: string | null
  similarity: number | null
}

const ROLE_LABELS: Record<string, string> = {
  swe: 'Software Engineer',
  data_eng: 'Data Engineer',
  ml_eng: 'ML Engineer',
  devops: 'DevOps / Platform Engineer',
  founding_eng: 'Founding Engineer',
  em: 'Engineering Manager',
  tech_lead: 'Tech Lead / Staff Engineer',
  pm: 'Product Manager',
  designer: 'Product Designer',
  data_scientist: 'Data Scientist',
}

const ROLE_DISCIPLINE: Record<string, SkillDiscipline> = {
  swe: 'software',
  ml_eng: 'software',
  devops: 'software',
  founding_eng: 'software',
  tech_lead: 'software',
  data_eng: 'data',
  data_scientist: 'data',
  pm: 'product',
  designer: 'design',
  em: 'leadership',
}

const DISCIPLINE_GUIDANCE: Record<SkillDiscipline, string> = {
  product: 'Tune feedback toward user segments, causal mechanisms, tradeoffs, metrics, and a clear recommendation.',
  software: 'Tune feedback toward implementation tradeoffs, correctness, edge cases, reliability, and how the solution behaves under constraints.',
  data: 'Tune feedback toward schema grain, metric definitions, query correctness, data lifecycle, and analytical reliability.',
  design: 'Tune feedback toward user state, journey clarity, interaction details, and the tradeoff between delight and clarity.',
  leadership: 'Tune feedback toward prioritization, stakeholder translation, ownership, team capacity, and decision clarity.',
  analytics: 'Tune feedback toward the question being answered, available data, measurement limits, and what decision the analysis supports.',
}

const CHALLENGE_DISCIPLINE: Partial<Record<ChallengeType | 'claude_code_analytics', SkillDiscipline>> = {
  flow: 'product',
  freeform: 'product',
  quick_take: 'product',
  system_design: 'software',
  data_modeling: 'data',
  sql: 'data',
  algorithm: 'software',
  claude_code_analytics: 'analytics',
}

const MODULE_KEYWORDS: Record<SkillDiscipline, string[]> = {
  product: ['product', 'flow', 'framing', 'strategy'],
  software: ['system', 'coding', 'engineering', 'architecture'],
  data: ['data', 'sql', 'modeling', 'analytics'],
  design: ['design', 'user', 'journey'],
  leadership: ['leadership', 'staff', 'communication'],
  analytics: ['analytics', 'data', 'metrics'],
}

export const HATCH_ACTION_RESPONSE_CONTRACT = [
  'Response contract:',
  '- Keep the response crisp. No filler and no generic praise.',
  '- Give a 1-2 sentence summary.',
  '- Give 1-3 concrete next actions.',
  '- Include the supplied practice link only if it fits the learner and the current task.',
  '- If the submission is empty or too thin, ask for the minimum next artifact instead of grading it.',
].join('\n')

function titleCaseLabel(value: string | null | undefined) {
  if (!value) return null
  return value
    .replace(/[_-]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function truncate(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) return normalized
  return normalized.slice(0, maxLength - 1).trimEnd() + '...'
}

function shouldRunRetrieval(input: BuildSkillContextPackInput, quality: SubmissionQuality | undefined) {
  if (input.includeRetrieval === false) return false
  if (quality !== 'substantive' || !input.submissionText) return false
  if (input.surface === 'grading' || input.surface === 'reflection' || input.surface === 'study_plan') return true
  if (input.surface !== 'chat') return false
  return /\b(study|practice|recommend|next|learn|read|module|weak|improve|work on)\b/i.test(input.submissionText)
}

async function findRetrievalHints(input: BuildSkillContextPackInput, quality: SubmissionQuality | undefined) {
  if (!shouldRunRetrieval(input, quality)) return []
  const embedding = await generateEmbedding(input.submissionText ?? '')
  if (!embedding) return []

  const admin = createAdminClient()
  const rpcClient = admin as unknown as {
    rpc(
      fn: 'match_thinking_traps',
      args: { query_embedding: number[]; match_threshold: number; match_count: number }
    ): Promise<{ data: ThinkingTrapMatch[] | null; error: unknown }>
  }
  const { data, error } = await rpcClient.rpc('match_thinking_traps', {
    query_embedding: embedding,
    match_threshold: 0.72,
    match_count: 2,
  })
  if (error || !data?.length) return []

  return data
    .filter((row) => row.name && row.description)
    .map((row): RetrievalHint => ({
      type: 'thinking_trap',
      title: row.name ?? 'Thinking trap',
      summary: row.description ?? '',
      suggestion: row.fix_suggestion ?? 'Name the assumption, then test it with one concrete piece of evidence.',
      similarity: row.similarity,
    }))
}

export function inferSkillDiscipline(
  challengeType?: ChallengeType | 'claude_code_analytics' | null,
  role?: string | null
): SkillDiscipline {
  if (challengeType && CHALLENGE_DISCIPLINE[challengeType]) {
    return CHALLENGE_DISCIPLINE[challengeType]!
  }
  if (role && ROLE_DISCIPLINE[role]) return ROLE_DISCIPLINE[role]
  return 'product'
}

export function detectSubmissionQuality(text: string | null | undefined, minWords = 8): SubmissionQuality {
  const trimmed = text?.trim() ?? ''
  if (!trimmed) return 'empty'
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length
  if (wordCount < minWords || trimmed.length < 24) return 'too_thin'
  return 'substantive'
}

export function buildEmptyStateResponse(input: {
  surface: SkillSurface
  discipline?: SkillDiscipline
  challengeType?: string | null
}) {
  const discipline = input.discipline ?? 'product'
  const artifact =
    input.challengeType === 'sql'
      ? 'a query'
      : input.challengeType === 'algorithm'
        ? 'working code'
        : input.challengeType === 'system_design'
          ? 'a first diagram or component list'
          : input.challengeType === 'data_modeling'
            ? 'the core entities and one row-grain statement'
            : input.challengeType === 'claude_code_analytics'
              ? 'a short analysis plan'
            : 'a short attempt'

  return {
    summary: `I need ${artifact} before I can give useful feedback.`,
    next_actions: [
      input.challengeType === 'system_design'
        ? 'Add the main components, one data flow, and the first constraint the design must handle.'
        : input.challengeType === 'claude_code_analytics' || discipline === 'analytics'
          ? 'Name the question, the data you would use, and the comparison that would answer it.'
          : input.challengeType === 'quick_take'
            ? 'Write 2-3 sentences that name the problem, your read of the situation, and one next move.'
            : discipline === 'software'
              ? 'State the approach, then handle the smallest test case first.'
              : discipline === 'data'
                ? 'Name the question, the grain, and the fields you would return.'
                : 'Write 3-5 sentences that name the user, the problem, and your first move.',
    ],
  }
}

function roleLabel(ctx: HatchUserContext) {
  const role = ctx.preferredRole ?? ctx.activeRole
  return ROLE_LABELS[role ?? ''] ?? titleCaseLabel(role) ?? 'not specified'
}

function weakestMove(ctx: HatchUserContext) {
  if (!ctx.moveLevels.length) return null
  return [...ctx.moveLevels].sort((a, b) => a.level - b.level)[0]?.move ?? null
}

const SKILL_GOAL_LABELS: Record<string, string> = {
  land_pm_adjacent: 'aiming for a PM or PM-adjacent role',
  level_up_current: 'aiming to get promoted in current eng role',
  ship_better: 'making sharper product calls at work',
  explore: 'exploring product thinking',
}

const SKILL_TIMELINE_LABELS: Record<string, string> = {
  lt_1mo: 'within a month',
  '1_3mo': 'one to three months',
  gt_3mo: 'longer than three months',
  no_timeline: 'no fixed timeline',
}

function buildLearnerLines(ctx: HatchUserContext, discipline: SkillDiscipline, surface: SkillSurface) {
  const weakMove = weakestMove(ctx)
  const topPattern = ctx.recurringPatterns[0]
  const recentAttempts = ctx.recentStepAttempts.slice(0, 3)
  const lines: string[] = []

  if (ctx.displayName) lines.push(`Learner: ${ctx.displayName}`)
  lines.push(`Role: ${roleLabel(ctx)}`)
  if (ctx.roleContext) lines.push(`Role context: ${truncate(ctx.roleContext, 180)}`)
  if (ctx.goal) lines.push(`Goal: ${SKILL_GOAL_LABELS[ctx.goal] ?? ctx.goal}`)
  if (ctx.prepTimeline) lines.push(`Timeline: ${SKILL_TIMELINE_LABELS[ctx.prepTimeline] ?? ctx.prepTimeline}`)
  if (ctx.targetCompany) lines.push(`Target company: ${ctx.targetCompany}`)
  lines.push(`Discipline lens: ${discipline}`)
  lines.push(`Skill level: ${ctx.overallLevel}`)
  if (ctx.weakestCompetency) lines.push(`Weakest competency: ${ctx.weakestCompetency}`)
  if (weakMove) lines.push(`Weakest FLOW move: ${weakMove}`)
  if (topPattern) lines.push(`Recurring pattern: ${topPattern.pattern_name} (${topPattern.count} recent signals)`)
  if (recentAttempts.length) {
    lines.push(`Recent step quality: ${recentAttempts.map((a) => `${a.step} ${a.score ?? '?'}/5`).join(' | ')}`)
  }
  if (surface !== 'nudge' && ctx.recentCompletions.length) {
    lines.push(`Recent completions: ${ctx.recentCompletions.slice(0, 3).map((c) => `${c.gradeLabel || 'ungraded'} ${c.totalScore}/5`).join(' | ')}`)
  }

  return lines
}

function challengeTypeFitsDiscipline(challengeType: string | null, discipline: SkillDiscipline) {
  if (!challengeType) return false
  if (discipline === 'product') return ['flow', 'freeform', 'quick_take', 'product_sense'].includes(challengeType)
  if (discipline === 'software') return ['system_design', 'algorithm'].includes(challengeType)
  if (discipline === 'data') return ['data_modeling', 'sql'].includes(challengeType)
  if (discipline === 'analytics') return ['claude_code_analytics', 'sql'].includes(challengeType)
  return false
}

function scoreChallengeCandidate(candidate: ChallengeCandidate, ctx: HatchUserContext, discipline: SkillDiscipline, completedIds: Set<string>) {
  let score = completedIds.has(candidate.id) ? -10 : 0
  if (challengeTypeFitsDiscipline(candidate.challenge_type, discipline)) score += 5
  if (ctx.weakestCompetency) {
    if ((candidate.primary_competencies ?? []).includes(ctx.weakestCompetency)) score += 4
    if ((candidate.secondary_competencies ?? []).includes(ctx.weakestCompetency)) score += 2
  }
  const move = weakestMove(ctx)
  if (move && (candidate.move_tags ?? []).includes(move)) score += 3
  const role = ctx.preferredRole ?? ctx.activeRole
  if (role && (candidate.relevant_roles ?? []).includes(role)) score += 2
  if (coerceDifficulty(candidate.difficulty) === 'medium') score += 1
  return score
}

function moduleFitsDiscipline(module: LearnModuleCandidate, discipline: SkillDiscipline) {
  const haystack = `${module.name} ${module.tagline ?? ''}`.toLowerCase()
  return MODULE_KEYWORDS[discipline].some((keyword) => haystack.includes(keyword))
}

async function findPracticeLink(userId: string, ctx: HatchUserContext, discipline: SkillDiscipline): Promise<PracticeLink | null> {
  const admin = createAdminClient()
  const [{ data: completedRows }, { data: challengeRows }] = await Promise.all([
    admin
      .from('challenge_attempts')
      .select('challenge_id')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .limit(500),
    admin
      .from('challenges')
      .select('id, slug, title, challenge_type, difficulty, move_tags, primary_competencies, secondary_competencies, relevant_roles')
      .eq('is_published', true)
      .neq('challenge_type', 'quick_take')
      .limit(40),
  ])

  const completedIds = new Set((completedRows ?? []).map((row: { challenge_id: string }) => row.challenge_id))
  const candidates = ((challengeRows ?? []) as ChallengeCandidate[])
    .filter((candidate) => !completedIds.has(candidate.id))
    .map((candidate) => ({
      candidate,
      score: scoreChallengeCandidate(candidate, ctx, discipline, completedIds),
    }))
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => b.score - a.score)

  const challenge = candidates[0]?.candidate
  if (challenge?.title) {
    return {
      type: 'challenge',
      title: challenge.title,
      href: `/workspace/challenges/${challenge.slug ?? challenge.id}`,
      reason: ctx.weakestCompetency
        ? `Matches ${ctx.weakestCompetency} and the ${discipline} practice lane.`
        : `Matches the ${discipline} practice lane.`,
    }
  }

  const { data: modules } = await admin
    .from('learn_modules')
    .select('slug, name, tagline, difficulty')
    .order('sort_order', { ascending: true })
    .limit(24)

  const learnModule = ((modules ?? []) as LearnModuleCandidate[]).find((item) => moduleFitsDiscipline(item, discipline))
  if (!learnModule) return null

  return {
    type: 'module',
    title: learnModule.name,
    href: `/explore/modules/${learnModule.slug}`,
    reason: learnModule.tagline ?? `Good supporting content for the ${discipline} practice lane.`,
  }
}

/**
 * Recent stored coaching context (hatch_context rows: calibration takeaways,
 * role observations, weakness alerts, CC session summaries). This store was
 * written by several routes but read by nothing until the 2026-07-04 vector
 * audit wired it in here, where every Hatch surface inherits it.
 */
async function fetchStoredContextLines(userId: string): Promise<string[]> {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('hatch_context')
      .select('context_type, content, created_at, expires_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(12)
    const now = Date.now()
    const fresh = (data ?? []).filter(
      (r) => !r.expires_at || new Date(r.expires_at as string).getTime() > now,
    )
    // One line per context_type (most recent wins) keeps the block compact.
    const seen = new Set<string>()
    const lines: string[] = []
    for (const r of fresh) {
      if (seen.has(r.context_type as string)) continue
      seen.add(r.context_type as string)
      lines.push(`- ${truncate(String(r.content), 220)}`)
      if (lines.length >= 4) break
    }
    return lines
  } catch {
    return []
  }
}

export async function buildSkillContextPack(input: BuildSkillContextPackInput): Promise<SkillContextPack> {
  const ctx = await getHatchContext(input.userId)
  const discipline = inferSkillDiscipline(input.challengeType, ctx.preferredRole ?? ctx.activeRole)
  const learnerLines = buildLearnerLines(ctx, discipline, input.surface)
  const quality = input.submissionText !== undefined
    ? detectSubmissionQuality(input.submissionText, input.surface === 'nudge' ? 5 : 8)
    : undefined

  let practiceLink: PracticeLink | null = null
  let retrievalHints: RetrievalHint[] = []
  if (input.includePracticeLink !== false && input.surface !== 'nudge') {
    try {
      practiceLink = await findPracticeLink(input.userId, ctx, discipline)
    } catch {
      practiceLink = null
    }
  }
  try {
    retrievalHints = await findRetrievalHints(input, quality)
  } catch {
    retrievalHints = []
  }
  const storedContextLines = input.surface === 'nudge' ? [] : await fetchStoredContextLines(input.userId)

  const taskLines: string[] = []
  if (input.challengeTitle) taskLines.push(`Current challenge: ${input.challengeTitle}`)
  if (input.challengeType) taskLines.push(`Challenge type: ${input.challengeType}`)
  if (input.currentStep) taskLines.push(`Current step: ${input.currentStep}`)
  if (input.challengePrompt) taskLines.push(`Prompt excerpt: ${truncate(input.challengePrompt, 360)}`)
  if (quality) taskLines.push(`Submission quality: ${quality}`)
  if (practiceLink) taskLines.push(`Suggested next practice: [${practiceLink.title}](${practiceLink.href}) - ${practiceLink.reason}`)

  const retrievalLines = retrievalHints.map((hint) =>
    `- ${hint.title}: ${hint.summary} Next move: ${hint.suggestion}`
  )

  const promptBlock = [
    '## Compact Learner Context',
    learnerLines.join('\n'),
    '',
    '## Discipline Lens',
    DISCIPLINE_GUIDANCE[discipline],
    taskLines.length ? '\n## Current Task\n' + taskLines.join('\n') : '',
    storedContextLines.length ? '\n## What Hatch Remembers\n' + storedContextLines.join('\n') : '',
    retrievalLines.length ? '\n## Relevant Practice Notes\n' + retrievalLines.join('\n') : '',
    '',
    HATCH_ACTION_RESPONSE_CONTRACT,
  ].filter(Boolean).join('\n')

  return {
    surface: input.surface,
    discipline,
    roleLabel: roleLabel(ctx),
    weakestCompetency: ctx.weakestCompetency ? titleCaseLabel(ctx.weakestCompetency) : null,
    weakestFlowMove: weakestMove(ctx),
    compactLearnerContext: learnerLines.join('\n'),
    promptBlock,
    responseContract: HATCH_ACTION_RESPONSE_CONTRACT,
    practiceLink,
    retrievalHints,
    submissionQuality: quality,
    raw: ctx,
  }
}

export async function buildSkillContextPrompt(
  userId: string,
  input: Omit<BuildSkillContextPackInput, 'userId'>
) {
  const pack = await buildSkillContextPack({ userId, ...input })
  return pack.promptBlock
}

export function legacyHatchContextMode(surface: SkillSurface): 'feedback' | 'chat' | 'nudge' | 'coaching' {
  if (surface === 'chat') return 'chat'
  if (surface === 'nudge') return 'nudge'
  if (surface === 'grading') return 'feedback'
  return 'coaching'
}

export async function buildLegacyCompatibleContext(userId: string, surface: SkillSurface) {
  const ctx = await getHatchContext(userId)
  return buildHatchContextString(ctx, legacyHatchContextMode(surface))
}

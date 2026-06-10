// Shared job fit-scorer — used by the manual /score route, the feed's Stage-B
// auto-scoring, and the public anonymous /job-fit tool. Builds grounding from
// the profile + competency/practice signal, calls Sonnet, and returns a
// validated FitEvaluation with the readiness map hrefs filled in locally.
//
// Scoring is rubric-fixed: the model rates four fixed dimensions 0..1 and the
// top-line score is computed server-side from fixed weights at temperature 0.
// A score that fluctuates between runs on the same JD kills trust the first
// time two people compare share cards.

import { guardedCachedMessage } from '@/lib/ai/guarded-client'
import { buildReadinessMap } from './readiness'
import type { CareerProfile, FitEvaluation, FitGrade, FitBreakdownDimension } from './types'
import type { CareerGrounding } from './grounding'

const SCORER_MODEL = 'claude-sonnet-4-6'

// Fixed rubric. Keys and weights are the contract; the model fills in scores
// and notes. Weights sum to 1.
export const FIT_RUBRIC = [
  { key: 'skill_match', label: 'Skill match', weight: 0.35 },
  { key: 'level_match', label: 'Level match', weight: 0.25 },
  { key: 'domain_fit', label: 'Domain fit', weight: 0.2 },
  { key: 'loop_readiness', label: 'Interview loop readiness', weight: 0.2 },
] as const

export type FitRubricKey = (typeof FIT_RUBRIC)[number]['key']

// Thrown when the pasted text is not actually a job description. Routes map
// this to a 422 instead of producing a confident-looking score for garbage.
export class NotAJobDescriptionError extends Error {
  constructor() {
    super('Input does not look like a job description')
    this.name = 'NotAJobDescriptionError'
  }
}

const SYSTEM_PROMPT = `You are Hatch, a career coach for engineers. You read a job description, compare it against a candidate's profile and real practice history, and produce a fit assessment that converts into concrete practice.

Voice: direct, confident, slightly opinionated. Coherent full sentences, not fragments. Never use em dashes. Never use AI slop (delve, leverage, utilize, holistic, robust, seamlessly, in order to, as well as, navigate, unlock, landscape, ensure, tailored). Never use second-person role framing ("as a senior engineer"). Do not name any frameworks or authors.

The platform teaches five practice disciplines: product_sense, system_design, data_modeling, coding, sql. For each job, infer which disciplines the role actually tests and at what bar, then compare against the candidate's competency scores and completed practice counts to rate readiness. The candidate's competency scores are platform practice metrics named motivation_theory, cognitive_empathy, taste, strategic_thinking, creative_execution, domain_expertise; treat them as evidence of product_sense strength, and the completed practice counts as evidence per discipline. Every gap must point to a concrete next rep in one of those five disciplines.

First decide whether the JOB text is actually a job description. If it is marketing copy, an article, random text, or anything else that no one could apply to, set input_kind to "not_a_job" and leave the other fields minimal.

Rate the fit on exactly these four dimensions, each scored 0 to 1:
- skill_match: how much of the role's core stack and skills the candidate demonstrably has
- level_match: how well the candidate's seniority matches the level this role hires at
- domain_fit: familiarity with the product domain and industry context
- loop_readiness: how prepared the candidate is for the disciplines this interview loop will test, based on their practice history

Do not produce a top-line score; it is computed from your dimension scores. Return VALID JSON ONLY, no prose outside it:
{
  "input_kind": "job_description" | "not_a_job",
  "breakdown": [
    { "dimension": "skill_match" | "level_match" | "domain_fit" | "loop_readiness", "score": <0-1>, "note": "<one specific sentence>" }
  ],
  "gaps": ["<specific gap>", "..."],
  "level_strategy": "<one or two sentences on how to position for this level>",
  "report_md": "<a short markdown report the candidate reads>",
  "readiness_map": [
    {
      "discipline": "coding" | "sql" | "data_modeling" | "system_design" | "product_sense",
      "demanded": <bool>,
      "bar": "<what bar the role sets for this discipline, or empty if not demanded>",
      "user_readiness": "ready" | "gaps" | "unknown",
      "top_gap": "<the single biggest gap for this discipline, or null>",
      "recommended_rep": "<the one highest-leverage next practice rep, or null>"
    }
  ]
}
Include all four breakdown dimensions exactly once each, and one readiness_map entry per demanded discipline. When the candidate has no history for a demanded discipline, rate it "unknown" rather than guessing.`

function clamp01(value: unknown): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(1, n))
}

export function gradeFromScore(score: number): FitGrade {
  if (score >= 85) return 'A'
  if (score >= 70) return 'B'
  if (score >= 55) return 'C'
  if (score >= 40) return 'D'
  return 'F'
}

// Coerce the model's breakdown onto the fixed rubric: one entry per rubric
// dimension, fixed weight, model score clamped to 0..1, missing entries score 0.
export function normalizeBreakdown(value: unknown): FitBreakdownDimension[] {
  const byKey = new Map<string, { score: number; note: string }>()
  if (Array.isArray(value)) {
    for (const d of value) {
      if (!d || typeof d !== 'object') continue
      const rec = d as Record<string, unknown>
      const key = String(rec.dimension ?? '')
      if (!byKey.has(key)) {
        byKey.set(key, { score: clamp01(rec.score), note: String(rec.note ?? '') })
      }
    }
  }
  return FIT_RUBRIC.map((dim) => {
    const entry = byKey.get(dim.key)
    return {
      dimension: dim.label,
      weight: dim.weight,
      score: entry?.score ?? 0,
      note: entry?.note ?? '',
    }
  })
}

// The top-line score is arithmetic over the rubric, never a model opinion.
export function scoreFromBreakdown(breakdown: FitBreakdownDimension[]): number {
  const total = breakdown.reduce((sum, dim) => sum + dim.weight * dim.score, 0)
  return Math.max(0, Math.min(100, Math.round(total * 100)))
}

function parseJson(raw: string): Record<string, unknown> {
  const text = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  return JSON.parse(text)
}

export interface ScoreJobInput {
  // Optional so the public anonymous tool can run without a per-user budget
  // ledger entry; spend there is bounded by its own rate limits instead.
  userId?: string
  userPlan?: string
  profile: CareerProfile
  grounding: CareerGrounding
  jdText: string
  company?: string | null
  roleTitle?: string | null
  routingEnabled: boolean
  route: string
}

export async function scoreJob(input: ScoreJobInput): Promise<FitEvaluation> {
  const { profile, grounding } = input

  const userContent = [
    `CANDIDATE PROFILE`,
    `Target role: ${profile.target_role ?? 'unspecified'}`,
    `Seniority: ${profile.seniority ?? 'unspecified'}`,
    `Locations: ${(profile.locations ?? []).join(', ') || 'unspecified'}`,
    `Key skills: ${(profile.key_skills ?? []).join(', ') || 'unspecified'}`,
    `Competency scores: ${grounding.competencyText}`,
    `Completed practice by discipline: ${grounding.practiceText}`,
    profile.resume_text ? `Résumé:\n${profile.resume_text.slice(0, 4000)}` : '',
    ``,
    `JOB`,
    input.company ? `Company: ${input.company}` : '',
    input.roleTitle ? `Role: ${input.roleTitle}` : '',
    `Job description:\n${input.jdText.slice(0, 8000)}`,
  ]
    .filter(Boolean)
    .join('\n')

  const callOptions = {
    model: SCORER_MODEL,
    max_tokens: 2000,
    temperature: 0,
    ...(input.userId && input.userPlan
      ? { budget: { userId: input.userId, userPlan: input.userPlan, route: input.route } }
      : {}),
  }

  // One retry on malformed JSON: a clipped or fenced response should cost the
  // user a second of latency, not a 502.
  let parsed: Record<string, unknown>
  try {
    parsed = parseJson((await guardedCachedMessage(SYSTEM_PROMPT, userContent, callOptions)).sanitized)
  } catch {
    parsed = parseJson((await guardedCachedMessage(SYSTEM_PROMPT, userContent, callOptions)).sanitized)
  }

  if (parsed.input_kind === 'not_a_job') {
    throw new NotAJobDescriptionError()
  }

  const breakdown = normalizeBreakdown(parsed.breakdown)
  const score = scoreFromBreakdown(breakdown)

  return {
    score,
    grade: gradeFromScore(score),
    breakdown,
    gaps: Array.isArray(parsed.gaps) ? parsed.gaps.map(String) : [],
    level_strategy: typeof parsed.level_strategy === 'string' ? parsed.level_strategy : '',
    report_md: typeof parsed.report_md === 'string' ? parsed.report_md : '',
    readiness_map: buildReadinessMap(
      Array.isArray(parsed.readiness_map)
        ? (parsed.readiness_map as Parameters<typeof buildReadinessMap>[0])
        : [],
      input.routingEnabled,
    ),
  }
}

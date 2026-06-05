// Shared job fit-scorer — used by both the manual /score route and the feed's
// Stage-B auto-scoring. Builds grounding from the profile + competency/practice
// signal, calls Sonnet, and returns a validated FitEvaluation with the readiness
// map hrefs filled in locally.

import { guardedCachedMessage } from '@/lib/ai/guarded-client'
import { buildReadinessMap } from './readiness'
import type { CareerProfile, FitEvaluation, FitGrade, FitBreakdownDimension } from './types'
import type { CareerGrounding } from './grounding'

const SCORER_MODEL = 'claude-sonnet-4-6'

const SYSTEM_PROMPT = `You are Hatch, a career coach for engineers. You read a job description, compare it against a candidate's profile and real practice history, and produce a fit assessment that converts into concrete practice.

Voice: direct, confident, slightly opinionated. Coherent full sentences, not fragments. Never use em dashes. Never use AI slop (delve, leverage, utilize, holistic, robust, seamlessly, in order to, as well as, navigate, unlock, landscape, ensure, tailored). Never use second-person role framing ("as a senior engineer"). Do not name any frameworks or authors.

The platform teaches five practice disciplines: product_sense, system_design, data_modeling, coding, sql. For each job, infer which disciplines the role actually tests and at what bar, then compare against the candidate's competency scores and completed practice counts to rate readiness. Every gap must point to a concrete next rep in one of those five disciplines.

Score the fit across weighted dimensions. Return VALID JSON ONLY, no prose outside it:
{
  "score": <integer 0-100>,
  "grade": "A" | "B" | "C" | "D" | "F",
  "breakdown": [
    { "dimension": "<short name>", "weight": <0-1>, "score": <0-1>, "note": "<one specific sentence>" }
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
Include one readiness_map entry per demanded discipline. Weights in breakdown should sum to roughly 1.`

function clampScore(value: unknown): number {
  const n = Math.round(Number(value))
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(100, n))
}

function normalizeGrade(value: unknown, score: number): FitGrade {
  if (value === 'A' || value === 'B' || value === 'C' || value === 'D' || value === 'F') return value
  if (score >= 85) return 'A'
  if (score >= 70) return 'B'
  if (score >= 55) return 'C'
  if (score >= 40) return 'D'
  return 'F'
}

function normalizeBreakdown(value: unknown): FitBreakdownDimension[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((d) => d && typeof d === 'object')
    .map((d) => ({
      dimension: String((d as Record<string, unknown>).dimension ?? ''),
      weight: Number((d as Record<string, unknown>).weight) || 0,
      score: Math.max(0, Math.min(1, Number((d as Record<string, unknown>).score) || 0)),
      note: String((d as Record<string, unknown>).note ?? ''),
    }))
}

function parseJson(raw: string): Record<string, unknown> {
  const text = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  return JSON.parse(text)
}

export interface ScoreJobInput {
  userId: string
  userPlan: string
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

  const msg = await guardedCachedMessage(SYSTEM_PROMPT, userContent, {
    model: SCORER_MODEL,
    max_tokens: 1600,
    budget: { userId: input.userId, userPlan: input.userPlan, route: input.route },
  })

  const parsed = parseJson(msg.sanitized)
  const score = clampScore(parsed.score)

  return {
    score,
    grade: normalizeGrade(parsed.grade, score),
    breakdown: normalizeBreakdown(parsed.breakdown),
    gaps: Array.isArray(parsed.gaps) ? parsed.gaps.map(String) : [],
    level_strategy: typeof parsed.level_strategy === 'string' ? parsed.level_strategy : '',
    report_md: typeof parsed.report_md === 'string' ? parsed.report_md : '',
    readiness_map: buildReadinessMap(
      Array.isArray(parsed.readiness_map) ? (parsed.readiness_map as Array<Record<string, unknown>>) : [],
      input.routingEnabled,
    ),
  }
}

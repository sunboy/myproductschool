// Resume roast — the second public hook. A brutal scored teardown of a pasted
// resume, optionally against a specific job description. Same rubric-fixed
// discipline as the scorer: the model rates fixed dimensions, the top-line
// score is computed server-side at temperature 0.

import { guardedCachedMessage } from '@/lib/ai/guarded-client'
import { gradeFromScore } from '@/lib/careerops/scorer'
import type { FitBreakdownDimension } from '@/lib/careerops/types'
import type { RoastEvaluation, RoastSection, RoastSeverity } from './types'

const ROAST_MODEL = 'claude-sonnet-4-6'

export const ROAST_RUBRIC = [
  { key: 'evidence', label: 'Evidence over adjectives', weight: 0.35 },
  { key: 'signal_density', label: 'Signal density', weight: 0.25 },
  { key: 'scope_clarity', label: 'Scope and level clarity', weight: 0.2 },
  { key: 'target_fit', label: 'Fit for the target', weight: 0.2 },
] as const

// Thrown when the pasted text is not actually a resume.
export class NotAResumeError extends Error {
  constructor() {
    super('Input does not look like a resume')
    this.name = 'NotAResumeError'
  }
}

const SYSTEM_PROMPT = `You are Hatch, a resume reviewer for engineers. You read a resume and deliver a brutal, specific teardown that the writer can act on the same day.

Voice: direct, confident, slightly opinionated, funny when the material earns it. Coherent full sentences, not fragments. Never use em dashes. Never use AI slop (delve, leverage, utilize, holistic, robust, seamlessly, in order to, as well as, navigate, unlock, landscape, ensure, tailored). Never use second-person role framing ("as a senior engineer"). Do not name any frameworks or authors.

Rules of evidence: every finding must point at something actually present in the resume, or something verifiably absent from it. Quoting a weak bullet back is fair. Saying there is not a single number in three years of work is fair. Inventing employers, dates, metrics, or claims the writer never made is forbidden. If the resume is thin, say exactly what is missing rather than imagining what should be there. When a job description is supplied, roast against that bar specifically.

First decide whether the text is actually a resume. If it is an article, a cover letter, marketing copy, or random text, set input_kind to "not_a_resume" and leave the other fields minimal.

Rate the resume on exactly these four dimensions, each scored 0 to 1:
- evidence: bullets prove impact with numbers and outcomes instead of listing duties and adjectives
- signal_density: every line earns its place; no filler, no buzzword padding
- scope_clarity: a reader can tell within seconds what level this person operates at and what they own
- target_fit: how well the resume positions for the supplied job description, or for the role its own summary claims to want

Do not produce a top-line score; it is computed from your dimension scores. Return VALID JSON ONLY, no prose outside it:
{
  "input_kind": "resume" | "not_a_resume",
  "verdict_line": "<one quotable sentence that sums up the roast>",
  "breakdown": [
    { "dimension": "evidence" | "signal_density" | "scope_clarity" | "target_fit", "score": <0-1>, "note": "<one specific sentence>" }
  ],
  "sections": [
    { "title": "<short name of the problem>", "severity": "minor" | "major" | "fatal", "finding": "<the specific problem, quoting the resume where possible>", "fix": "<the concrete rewrite or addition>" }
  ],
  "strengths": ["<something genuinely strong, if anything>", "..."],
  "report_md": "<a short markdown report the writer reads>"
}
Include all four breakdown dimensions exactly once each, 3 to 6 sections ordered worst first, and at most 3 strengths.`

function clamp01(value: unknown): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(1, n))
}

function normalizeSeverity(value: unknown): RoastSeverity {
  return value === 'fatal' || value === 'major' || value === 'minor' ? value : 'major'
}

export function normalizeRoastBreakdown(value: unknown): FitBreakdownDimension[] {
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
  return ROAST_RUBRIC.map((dim) => {
    const entry = byKey.get(dim.key)
    return {
      dimension: dim.label,
      weight: dim.weight,
      score: entry?.score ?? 0,
      note: entry?.note ?? '',
    }
  })
}

export function normalizeRoastSections(value: unknown): RoastSection[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((s) => s && typeof s === 'object')
    .slice(0, 6)
    .map((s) => {
      const rec = s as Record<string, unknown>
      return {
        title: String(rec.title ?? ''),
        severity: normalizeSeverity(rec.severity),
        finding: String(rec.finding ?? ''),
        fix: String(rec.fix ?? ''),
      }
    })
}

function parseJson(raw: string): Record<string, unknown> {
  const text = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  return JSON.parse(text)
}

export interface RoastResumeInput {
  resumeText: string
  jdText?: string | null
  // Optional, same contract as scoreJob: omitted for anonymous runs.
  userId?: string
  userPlan?: string
  route: string
}

export interface RoastResult extends RoastEvaluation {
  breakdown: FitBreakdownDimension[]
}

export async function roastResume(input: RoastResumeInput): Promise<RoastResult> {
  const userContent = [
    `RESUME`,
    input.resumeText.slice(0, 12000),
    input.jdText ? `\nTARGET JOB DESCRIPTION\n${input.jdText.slice(0, 6000)}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  const callOptions = {
    model: ROAST_MODEL,
    max_tokens: 2400,
    temperature: 0,
    ...(input.userId && input.userPlan
      ? { budget: { userId: input.userId, userPlan: input.userPlan, route: input.route } }
      : {}),
  }

  let parsed: Record<string, unknown>
  try {
    parsed = parseJson((await guardedCachedMessage(SYSTEM_PROMPT, userContent, callOptions)).sanitized)
  } catch {
    parsed = parseJson((await guardedCachedMessage(SYSTEM_PROMPT, userContent, callOptions)).sanitized)
  }

  if (parsed.input_kind === 'not_a_resume') {
    throw new NotAResumeError()
  }

  const breakdown = normalizeRoastBreakdown(parsed.breakdown)
  const score = Math.max(
    0,
    Math.min(100, Math.round(breakdown.reduce((sum, dim) => sum + dim.weight * dim.score, 0) * 100)),
  )

  return {
    score,
    grade: gradeFromScore(score),
    verdict_line: typeof parsed.verdict_line === 'string' ? parsed.verdict_line : '',
    sections: normalizeRoastSections(parsed.sections),
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 3).map(String) : [],
    report_md: typeof parsed.report_md === 'string' ? parsed.report_md : '',
    breakdown,
  }
}

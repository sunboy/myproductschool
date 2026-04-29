// src/lib/interview-loops/loop-debrief-generator.ts
import { createCachedMessage } from '@/lib/anthropic/cached-client'
import type { LoopDebriefResult, LoopRound, CrossRoundMemoryItem } from './types'

const SYSTEM_PROMPT = `You are an expert interview loop evaluator. You receive per-round debriefs from a multi-round engineering interview loop and must synthesise them into a single cross-round assessment.

Rules:
- Give a hire signal based on the overall picture — do NOT average scores mechanically. Weight rounds by their relevance to the target role.
- Surface 1-3 cross-cutting insights: patterns the candidate showed across multiple rounds. These are the most valuable part of this report.
- Keep strengths and improvements to the top 3 each, cross-cutting.
- next_3_challenges: recommend 3 specific practice challenge IDs from the platform. If you don't have IDs, return empty strings with a reason.
- Respond with ONLY valid JSON matching the schema exactly. No explanation. No markdown. No code fences.

JSON schema:
{
  "hire_signal": "hire|lean_hire|lean_no_hire|no_hire",
  "overall_score": <0-100 integer>,
  "round_scores": [{ "discipline": "<string>", "score": <0-100>, "grade": "<Excellent|Strong|Good|Developing>" }],
  "cross_round_insights": [{ "pattern": "<string>", "rounds_seen_in": ["<discipline>"], "observation": "<1-2 sentences>" }],
  "strengths": ["<string>"],
  "improvements": ["<string>"],
  "next_3_challenges": [{ "id": "<string>", "reason": "<string>" }]
}`

export async function generateLoopDebrief(params: {
  rounds: LoopRound[]
  crossRoundMemory: CrossRoundMemoryItem[]
  targetCompany: string | null
  targetRole: string | null
  calibrationSnapshot: Record<string, unknown>
}): Promise<LoopDebriefResult> {
  const { rounds, crossRoundMemory, targetCompany, targetRole, calibrationSnapshot } = params

  const userContent = JSON.stringify({
    target: { company: targetCompany, role: targetRole },
    calibration: calibrationSnapshot,
    cross_round_memory: crossRoundMemory,
    rounds: rounds.map((r) => ({
      round_index: r.round_index,
      discipline: r.discipline,
      score: r.round_score,
      debrief: r.round_debrief_json,
    })),
  })

  const response = await createCachedMessage(SYSTEM_PROMPT, userContent, {
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : '{}'

  try {
    return JSON.parse(raw) as LoopDebriefResult
  } catch {
    // Fallback if JSON parse fails
    return {
      hire_signal: 'lean_hire',
      overall_score: Math.round(
        rounds.reduce((sum, r) => sum + (r.round_score ?? 0), 0) / Math.max(rounds.length, 1)
      ),
      round_scores: rounds.map((r) => ({
        discipline: r.discipline,
        score: r.round_score ?? 0,
        grade: 'Good',
      })),
      cross_round_insights: [],
      strengths: [],
      improvements: [],
      next_3_challenges: [],
    }
  }
}

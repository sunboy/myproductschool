import { createCachedMessage } from '@/lib/anthropic/cached-client'

export interface DebriefResult {
  overallScore: number
  grade: string
  flowScores: { frame: number; list: number; optimize: number; win: number }
  competencySignals: Array<{ competency: string; signal: string; stepDetected: string }>
  failurePatternsDetected: Array<{ patternId: string; patternName: string; evidence: string }>
  strengths: string[]
  improvements: string[]
  nextChallengeRecommendation: string
}

export interface DebriefParams {
  /** Session ID — available for future logging/tracing */
  sessionId: string
  turns: Array<{ role: 'luma' | 'user'; content: string; turnIndex: number }>
  calibrationSnapshot: { archetype: string; moveLevels: Record<string, number> }
}

const SYSTEM_PROMPT = `You are an expert PM interview evaluator for HackProduct. Analyze the provided interview transcript against the FLOW rubric and return a structured JSON debrief.

FLOW Rubric:
Frame: F1 (symptom→root cause, 0.35), F2 (why-before-how, 0.30), F3 (problem statement, 0.20), F4 (scope boundary, 0.15)
List: L1 (stakeholder completeness, 0.30), L2 (solution space width, 0.30), L3 (second-order effects, 0.25), L4 (workarounds, 0.15)
Optimize: O1 (named criterion, 0.30), O2 (the sacrifice, 0.30), O3 (metric+guardrail, 0.20), O4 (options vs criterion, 0.20)
Win: W1 (specificity, 0.30), W2 (defensibility, 0.25), W3 (falsifiability, 0.30), W4 (ownership, 0.15)

Scoring per criterion: strong=1.0 (≥0.75), partial=0.5 (≥0.45), needs_work=0.0 (<0.45)

Six competency keys: motivation_theory, cognitive_empathy, taste, strategic_thinking, creative_execution, domain_expertise

Respond with ONLY valid JSON. No explanation. No markdown. No code fences. The JSON must exactly match this shape:
{
  "overallScore": <0-100 integer>,
  "flowScores": { "frame": <0-100>, "list": <0-100>, "optimize": <0-100>, "win": <0-100> },
  "competencySignals": [{ "competency": "<key>", "signal": "<1-2 sentences>", "stepDetected": "<frame|list|optimize|win>" }],
  "failurePatternsDetected": [{ "patternId": "<FP-XX>", "patternName": "<name>", "evidence": "<1-2 sentences>" }],
  "strengths": ["<string>"],
  "improvements": ["<string>"],
  "nextChallengeRecommendation": "<string>"
}`

function scoreToGrade(score: number): string {
  if (score >= 80) return 'Strong'
  if (score >= 65) return 'Good'
  if (score >= 45) return 'Developing'
  return 'Needs Work'
}

export async function generateDebrief(params: DebriefParams): Promise<DebriefResult> {
  if (process.env.USE_MOCK_DATA === 'true') {
    const { MOCK_LIVE_DEBRIEF } = await import('@/lib/mock-live-interviews')
    return MOCK_LIVE_DEBRIEF
  }

  const { turns, calibrationSnapshot } = params

  // Build transcript sorted by turnIndex
  const sorted = [...turns].sort((a, b) => a.turnIndex - b.turnIndex)
  const transcript = sorted
    .map((t) => {
      const speaker = t.role === 'luma' ? 'LUMA' : 'CANDIDATE'
      return `${speaker}: ${t.content}`
    })
    .join('\n')

  const userMessage = `Candidate archetype: ${calibrationSnapshot.archetype}
Move levels: Frame L${calibrationSnapshot.moveLevels.frame ?? '?'}, List L${calibrationSnapshot.moveLevels.list ?? '?'}, Optimize L${calibrationSnapshot.moveLevels.optimize ?? '?'}, Win L${calibrationSnapshot.moveLevels.win ?? '?'}

Interview transcript:
${transcript}`

  const response = await createCachedMessage(SYSTEM_PROMPT, userMessage, {
    model: 'claude-opus-4-6',
    max_tokens: 1500,
  })

  const rawText = response.content
    .filter((block) => block.type === 'text')
    .map((block) => (block as { type: 'text'; text: string }).text)
    .join('')

  // Strip markdown code fences if Claude wrapped the JSON despite instructions
  const cleanText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()

  let parsed: Omit<DebriefResult, 'grade'>
  try {
    parsed = JSON.parse(cleanText) as Omit<DebriefResult, 'grade'>
  } catch {
    throw new Error(`Debrief parse failed. Raw response: ${rawText.slice(0, 200)}`)
  }

  return {
    ...parsed,
    grade: scoreToGrade(parsed.overallScore),
  }
}

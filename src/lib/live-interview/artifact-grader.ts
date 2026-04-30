import Anthropic from '@anthropic-ai/sdk'

export interface ArtifactGradingInput {
  type: 'canvas' | 'editor'
  elementCount?: number
  code?: string
  language?: string
  runResult?: unknown
  discipline?: string
}

export interface ArtifactDimension {
  score: number // 0-5
  evidence: string
}

export interface ArtifactGrading {
  artifact_score: number // 0-100
  artifact_verdict: string
  artifact_dimensions: {
    completeness: ArtifactDimension
    correctness: ArtifactDimension
    clarity: ArtifactDimension
  }
  flow_signal_boosts: {
    frame: number
    list: number
    optimize: number
    win: number
  }
}

const SYSTEM_PROMPT = `You are an expert technical interview evaluator grading a candidate's artifact (canvas diagram or code editor work) from a live interview.

Return ONLY valid JSON with this exact shape — no markdown, no code fences:
{
  "artifact_score": <0-100 integer>,
  "artifact_verdict": "<one sentence summary of overall quality>",
  "artifact_dimensions": {
    "completeness": { "score": <0-5 integer>, "evidence": "<1 sentence>" },
    "correctness": { "score": <0-5 integer>, "evidence": "<1 sentence>" },
    "clarity": { "score": <0-5 integer>, "evidence": "<1 sentence>" }
  },
  "flow_signal_boosts": {
    "frame": <0.0-0.1 float, how much this artifact demonstrates problem framing>,
    "list": <0.0-0.1 float, how much it shows breadth of exploration>,
    "optimize": <0.0-0.1 float, how much it shows tradeoff reasoning>,
    "win": <0.0-0.1 float, how much it shows a clear recommendation>
  }
}

Scoring guide for dimensions (0=absent, 1-2=weak, 3=adequate, 4=strong, 5=exceptional):
- completeness: Are all major components/steps present given the problem scope?
- correctness: Is the approach technically sound? Are there logic errors or critical gaps?
- clarity: Is the structure, naming, and organisation easy to follow?

Keep artifact_score as a weighted summary: completeness 35%, correctness 40%, clarity 25%.
Keep flow_signal_boosts small (max 0.1 per move) — they are additive nudges, not replacements.`

function buildUserContent(input: ArtifactGradingInput): string {
  const { type, elementCount, code, language, runResult, discipline } = input
  const disciplineLabel = discipline ?? (type === 'canvas' ? 'system design' : 'coding')

  if (type === 'canvas') {
    return `Discipline: ${disciplineLabel}
Canvas element count: ${elementCount ?? 0}

Grade this canvas artifact. With only element count available, infer from the count:
- 0-2 elements: minimal/abandoned work
- 3-6: sketch started but likely incomplete
- 7-15: reasonable attempt at a diagram
- 16+: detailed diagram

Provide conservative estimates given limited data.`
  }

  const truncatedCode = (code ?? '').slice(0, 1500)
  const codeSnippet = code && code.length > 1500 ? `${truncatedCode}\n...(truncated)` : truncatedCode
  const runSummary = runResult
    ? `Last run result: ${JSON.stringify(runResult).slice(0, 400)}`
    : 'Code was not run.'

  return `Discipline: ${disciplineLabel}
Language: ${language ?? 'unknown'}

Code:
\`\`\`${language ?? ''}
${codeSnippet}
\`\`\`

${runSummary}`
}

export async function gradeArtifact(input: ArtifactGradingInput): Promise<ArtifactGrading> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not set')
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserContent(input) }],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : ''

  // Strip markdown fences if model wraps anyway
  const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()

  const parsed = JSON.parse(cleaned) as ArtifactGrading

  // Clamp all values defensively
  return {
    artifact_score: Math.min(100, Math.max(0, Math.round(parsed.artifact_score ?? 0))),
    artifact_verdict: parsed.artifact_verdict ?? '',
    artifact_dimensions: {
      completeness: {
        score: Math.min(5, Math.max(0, Math.round(parsed.artifact_dimensions?.completeness?.score ?? 0))),
        evidence: parsed.artifact_dimensions?.completeness?.evidence ?? '',
      },
      correctness: {
        score: Math.min(5, Math.max(0, Math.round(parsed.artifact_dimensions?.correctness?.score ?? 0))),
        evidence: parsed.artifact_dimensions?.correctness?.evidence ?? '',
      },
      clarity: {
        score: Math.min(5, Math.max(0, Math.round(parsed.artifact_dimensions?.clarity?.score ?? 0))),
        evidence: parsed.artifact_dimensions?.clarity?.evidence ?? '',
      },
    },
    flow_signal_boosts: {
      frame: Math.min(0.1, Math.max(0, parsed.flow_signal_boosts?.frame ?? 0)),
      list: Math.min(0.1, Math.max(0, parsed.flow_signal_boosts?.list ?? 0)),
      optimize: Math.min(0.1, Math.max(0, parsed.flow_signal_boosts?.optimize ?? 0)),
      win: Math.min(0.1, Math.max(0, parsed.flow_signal_boosts?.win ?? 0)),
    },
  }
}

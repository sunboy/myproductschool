---
name: hackproduct-grading
description: "Rubric-anchored grading pipeline for HackProduct FLOW challenges. Use this skill whenever building, modifying, or debugging the grading system — including the submit API route, freeform grader, elaboration evaluator, scoring functions, or any code that evaluates a user's challenge response. Triggers on: grading, scoring, rubric, freeform evaluation, MCQ scoring, response evaluation, elaboration adjustment, confidence gating, submit route."
---

# HackProduct Grading Pipeline

Every question has 4 MCQ options that serve as the **rubric** — they define what scores 0, 1, 2, and 3 look like. The AI grader compares freeform text against these exemplars, never grades from scratch.

## The 4 Grading Paths

| Response type | Path | Latency | AI? |
|---|---|---|---|
| `pure_mcq` — picks option, no text | Deterministic lookup | <5ms | No |
| `mcq_plus_elaboration` — picks + adds text | Deterministic base ± AI adjustment | ~1-2s | Yes |
| `modified_option` — picks but edits text | Full AI evaluation | ~2-3s | Yes |
| `freeform` — ignores options, writes own | Full AI evaluation | ~2-3s | Yes |

## Routing Logic

```typescript
export function routeResponse(responseType: ResponseType): 'deterministic' | 'hybrid' | 'ai' {
  switch (responseType) {
    case 'pure_mcq': return 'deterministic'
    case 'mcq_plus_elaboration': return 'hybrid'
    case 'modified_option': return 'ai'
    case 'freeform': return 'ai'
  }
}
```

## Path 1: Pure MCQ (deterministic)

```typescript
const QUALITY_POINTS = { best: 3, good_but_incomplete: 2, surface: 1, plausible_wrong: 0 }

export function scoreOption(selectedOptionId: string, options: FlowOption[]) {
  const option = options.find(o => o.id === selectedOptionId)
  if (!option) throw new Error(`Option ${selectedOptionId} not found`)
  return {
    score: QUALITY_POINTS[option.quality],
    quality_label: option.quality,
    competencies_demonstrated: option.competencies,
    grading_explanation: option.explanation,
    is_correct: option.quality === 'best',
  }
}
```

## Path 2: MCQ + Elaboration (hybrid)

Base score from selected option + AI adjustment of ±0.5. See `references/elaboration-prompt.md` for the Claude prompt.

**Tier capping (deterministic, post-AI):**
```typescript
const TIER_CAPS = { 0: 0.5, 1: 1.75, 2: 2.75, 3: 3.0 }
function capElaborationScore(baseScore: number, adjustment: number): number {
  return Math.max(0, Math.min(baseScore + adjustment, TIER_CAPS[baseScore]))
}
```

## Path 3 & 4: Freeform / Modified (full AI)

See `references/freeform-grading-prompt.md` for the exact Claude prompt.

**Zod validation:**
```typescript
const GradingResponseSchema = z.object({
  score: z.number().min(0).max(3),
  quality_label: z.enum(['best','good_but_incomplete','surface','plausible_wrong','between_levels']),
  competencies_demonstrated: z.array(z.string()),
  grading_explanation: z.string().max(500),
  confidence: z.number().min(0).max(1),
})
```

## Confidence Gating (post-AI, deterministic)

```typescript
function applyConfidenceGate(result: GradingResponse): GradingResponse {
  if (result.confidence >= 0.8) return result
  if (result.confidence >= 0.5) {
    const nearest = Math.round(result.score)
    const blended = result.score * result.confidence + nearest * (1 - result.confidence)
    return { ...result, score: Math.round(blended * 100) / 100 }
  }
  return { ...result, score: Math.round(result.score) }
}
```

## Error Handling

- Claude API failure → return `{ score: 1.0, quality_label: 'surface', confidence: 0.2 }`
- JSON parse failure → retry once with stricter prompt, then fall back
- Zod validation failure → use parsed data but clamp score to [0, 3]

## Step Score Aggregation

After grading individual questions, aggregate within a FLOW step:
```typescript
function calculateStepScore(
  questionScores: Array<{ score: number; weight: number }>,
  step: FlowStep, roleLens: RoleLens
): number {
  const weightSum = questionScores.reduce((s, q) => s + q.weight, 0)
  const stepScore = questionScores.reduce((s, q) => s + (q.score * q.weight / weightSum), 0)
  return stepScore * roleLens[`${step}_weight`]
}
```

## Submit Route Pattern

The route at `POST /api/v2/challenges/[id]/step/[step]/submit`:
1. Validate attempt ownership and status
2. Load rubric (all 4 flow_options for the question)
3. Route via `routeResponse()`
4. Grade via appropriate path
5. Insert `step_attempts` row
6. Check if step complete → aggregate if so
7. Update `challenge_attempts_v2.current_step`
8. Return score + all options revealed with quality labels

## Files This Skill Produces

```
src/lib/v2/skills/option-scorer.ts
src/lib/v2/skills/step-score-calculator.ts
src/lib/v2/skills/score-aggregator.ts
src/lib/v2/skills/grading-router.ts
src/lib/v2/skills/ai/freeform-grader.ts
src/app/api/v2/challenges/[id]/step/[step]/submit/route.ts
```

---
name: hackproduct-grading
description: "Rubric-anchored grading pipeline for HackProduct FLOW challenges. Use when building, modifying, or debugging the grading system, including the submit API route, freeform grader, elaboration evaluator, scoring functions, or any code that evaluates a user's challenge response. Triggers on: grading, scoring, rubric, freeform evaluation, MCQ scoring, response evaluation, elaboration adjustment, confidence gating, submit route."
---

# HackProduct Grading Pipeline

Every question has 4 MCQ options that serve as the **rubric**. They define what scores 0, 1, 2, and 3 look like. The AI grader compares freeform text against these exemplars and never grades from scratch.

## The 4 Grading Paths

| Response type | Path | Latency | AI? |
|---|---|---|---|
| `pure_mcq` (picks option, no text) | Deterministic lookup | <5ms | No |
| `mcq_plus_elaboration` (picks + adds text) | Deterministic base +/- AI adjustment | ~1-2s | Yes |
| `modified_option` (picks but edits text) | Full AI evaluation | ~2-3s | Yes |
| `freeform` (ignores options, writes own) | Full AI evaluation | ~2-3s | Yes |

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
const ThemeSignalSchema = z.object({
  theme: z.enum(['T1','T2','T3','T4','T5','T6','T7']),
  name: z.string(),
  reasoning_move: z.string().max(200),
  theme_applied: z.boolean(),
  anti_pattern: z.string().max(200).nullable(),
})

const GradingResponseSchema = z.object({
  score: z.number().min(0).max(3),
  quality_label: z.enum(['best','good_but_incomplete','surface','plausible_wrong','between_levels']),
  competencies_demonstrated: z.array(z.string()),
  grading_explanation: z.string().max(500),
  confidence: z.number().min(0).max(1),
  theme_signal: ThemeSignalSchema,
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

## Intellectual Themes: The 7 Reasoning Traditions Behind the Rubric

Every FLOW criterion belongs to one of 7 intellectual themes. The grading prompts inject a compact version of this map so Luma can identify which tradition the learner's answer engaged with, and whether they applied that reasoning move correctly. The full breakdown is in `content/THINKER_THEMES.md`.

| Theme | Criteria (primary) | Thinkers | Anti-pattern caught |
|---|---|---|---|
| **T1** Upstream Before Downstream | F1, F2 | Shreyas Doshi, Cagan, Dunford | Accepting the stated problem as the real problem |
| **T2** The Job Behind the Feature | F3, L1, L4 | Ben Erez, Rahul/cognitive_empathy | Treating the feature as the job; same-interest stakeholder map |
| **T3** Simulate the Other Side | W4 | Rahul Pandey | Handing ownership to "the team" without naming who acts |
| **T4** Width Before Depth | L2, L3 | Rahul/creative_execution, Dunford, Gergely | Variations of one idea presented as an option space |
| **T5** Name the Criterion, Name the Sacrifice | O1, O2, O4 | Gergely Orosz, Rahul/taste | "It depends" as a conclusion; gain named without sacrifice |
| **T6** Exclusion Is Precision | F4 | April Dunford | Scope as given, not chosen; unbounded problem statement |
| **T7** A Recommendation Is a Falsifiable Hypothesis | W1, W2, W3 | Marty Cagan, Gibson Biddle | Qualitative success definition; no metric/threshold/timeline |

### Step → primary theme(s) at-a-glance

```
FRAME    → T1 (F1, F2)  ·  T2 (F3)  ·  T6 (F4)
LIST     → T2 (L1, L4)  ·  T4 (L2, L3)
OPTIMIZE → T5 (O1, O2, O4)  ·  [T7 secondary on O3]
WIN      → T7 (W1, W2, W3)  ·  T3 (W4)
```

### theme_signal in grading output

Both freeform and elaboration graders return a `theme_signal` block:

```typescript
// Freeform result
theme_signal: {
  theme: 'T5',
  name: 'Name the Criterion, Name the Sacrifice',
  reasoning_move: 'State the criterion before comparing options, then name what is given up.',
  theme_applied: false,
  anti_pattern: 'Options compared by description without a stated criterion. Reads as preference, not analysis.',
}

// Elaboration result
theme_signal: {
  theme: 'T5',
  theme_applied: true,
  reasoning_move: 'Learner named the sacrifice explicitly: "we give up speed in favour of trust, which is acceptable because this is a compliance product."',
}
```

**Downstream consumers of `theme_signal`:**
- Feedback page "What you were building" section: surfaces `reasoning_move` and `name`
- Luma coaching copy: uses `anti_pattern` text when `theme_applied: false`
- Learner DNA: aggregates theme weakness across challenges for next-challenge routing
- `/api/v2/dna/recommend`: selects the next challenge to exercise the weakest theme

### 6 competency dimensions → theme mapping

The `competencies_demonstrated` array uses these six values. Each maps to a theme:

```
motivation_theory   → T1 (friction identification at Frame)
cognitive_empathy   → T2, T3 (stakeholder simulation)
taste               → T5 (feel the real tradeoff vs preference)
strategic_thinking  → T5, T7 (criterion + hypothesis)
creative_execution  → T4 (structurally distinct options)
domain_expertise    → T7 (real metric requires domain knowledge)
```

## Writing Style

All grading copy (explanations, theme signals, anti-pattern descriptions, reasoning-move text, feedback fragments) follows the canonical HackProduct Writing Style Guide: [`docs/notes/writing-style-guide.md`](../../../../docs/notes/writing-style-guide.md), summarized in `CLAUDE.md` at the repo root.

**Grading-specific applications of the rules:**
- No second-person role framing. Grading explanations describe what the answer did and what a better answer would do, not what the learner should do next time. Keep the learner out of the second person.
- No em dashes. No AI slop words.
- Grading explanations are direct about what the answer got right or wrong. No diplomatic softening. "Names the tradeoff but not the sacrifice" beats "could be strengthened by naming the sacrifice".
- Anti-pattern descriptions name the reasoning failure precisely. "Treats the retention drop as the thing to explain rather than as the thing to be explained by a change upstream of retention" beats "missed the root cause".
- Theme signals explain which reasoning move was engaged and whether it was applied correctly. One sentence per field is enough.

**Worked examples:**

Grading explanation, bad (diplomatic): *"The answer demonstrates some good thinking but could be strengthened."*

Grading explanation, good: *"The answer names a tradeoff but not the sacrifice, which is the move that separates a real tradeoff from a preference."*

Anti-pattern, bad: *"Options were not fully distinct."*

Anti-pattern, good: *"Options compared by description without a stated criterion, so the answer reads as preference rather than analysis."*

## Files This Skill Produces

```
src/lib/v2/skills/option-scorer.ts
src/lib/v2/skills/step-score-calculator.ts
src/lib/v2/skills/score-aggregator.ts
src/lib/v2/skills/grading-router.ts
src/lib/v2/skills/ai/freeform-grader.ts
src/app/api/v2/challenges/[id]/step/[step]/submit/route.ts
```

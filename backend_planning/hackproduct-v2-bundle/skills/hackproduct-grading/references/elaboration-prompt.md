# Elaboration Evaluator Prompt

## User message template

```
A learner selected an MCQ option and added elaboration text.

SCENARIO: {{scenario_context}} {{scenario_trigger}}
FLOW STEP: {{step}}

SELECTED OPTION: "{{selected_option_text}}"
(Rated: {{selected_quality}}, base score: {{selected_points}}/3)

ELABORATION: "{{elaboration_text}}"

BEST ANSWER FOR REFERENCE: "{{best_option_text}}"

Evaluate:
1. ADDS depth? +0.25 per: specific tradeoff, new competency, second-order consequence (max +0.5)
2. CONTRADICTS? -0.25 per: misunderstanding, harmful reasoning (max -0.5)
3. NEUTRAL? No adjustment → 0

Return ONLY JSON:
{"adjustment":<float -0.5 to 0.5>,"adjustment_reason":"<1-2 sentences>","additional_competencies":[<strings>]}
```

## Zod schema

```typescript
const ElaborationSchema = z.object({
  adjustment: z.number().min(-0.5).max(0.5),
  adjustment_reason: z.string().max(300),
  additional_competencies: z.array(z.string()),
})
```

## Tier capping (deterministic, post-AI)

```typescript
const TIER_CAPS: Record<number, number> = { 0: 0.5, 1: 1.75, 2: 2.75, 3: 3.0 }
function capElaborationScore(basePoints: number, adjustment: number): number {
  return Math.max(0, Math.min(basePoints + adjustment, TIER_CAPS[basePoints]))
}
```

## Model: `claude-sonnet-4-6`, max_tokens: 300

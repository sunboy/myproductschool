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

INTELLECTUAL THEMES (the reasoning traditions this FLOW step draws on):
{{step_themes}}

Theme-aligned depth signals (elaboration that advances the step's primary theme earns full +0.25):
- Frame step  → T1: names a root cause upstream of the symptom; T2: frames problem as a job the user is trying to do
- List step   → T4: adds a structurally distinct option or a second-order effect; T2: names a non-obvious stakeholder
- Optimize    → T5: names the sacrifice explicitly ("we give up X because Y"); names a guardrail metric
- Win step    → T7: adds a falsifiability condition (metric + threshold + timeline); T3: names who owns the outcome

Evaluate:
1. ADDS depth? +0.25 per theme-aligned signal: specific tradeoff, new competency, second-order consequence, named sacrifice, falsifiability condition, or non-obvious stakeholder (max +0.5)
2. CONTRADICTS? -0.25 per: misunderstanding, harmful reasoning, or anti-pattern (e.g. "it depends" as conclusion on an Optimize step) (max -0.5)
3. NEUTRAL? No adjustment → 0

Return ONLY JSON:
{"adjustment":<float -0.5 to 0.5>,"adjustment_reason":"<1-2 sentences>","additional_competencies":[<strings>],"theme_signal":{"theme":"<T1|T2|T3|T4|T5|T6|T7>","theme_applied":<true|false>,"reasoning_move":"<1 sentence: what theme-aligned move the elaboration made, or failed to make>"}}
```

## Step themes injection ({{step_themes}} values)

```typescript
const STEP_THEMES: Record<FlowStep, string> = {
  frame:    'T1 Upstream Before Downstream (F1, F2) · T2 The Job Behind the Feature (F3) · T6 Exclusion Is Precision (F4)',
  list:     'T2 The Job Behind the Feature (L1, L4) · T4 Width Before Depth (L2, L3)',
  optimize: 'T5 Name the Criterion, Name the Sacrifice (O1, O2, O4)',
  win:      'T7 A Recommendation Is a Falsifiable Hypothesis (W1, W2, W3) · T3 Simulate the Other Side (W4)',
}
```

## Zod schema

```typescript
const ElaborationThemeSignalSchema = z.object({
  theme: z.enum(['T1','T2','T3','T4','T5','T6','T7']),
  theme_applied: z.boolean(),
  reasoning_move: z.string().max(200),
})

const ElaborationSchema = z.object({
  adjustment: z.number().min(-0.5).max(0.5),
  adjustment_reason: z.string().max(300),
  additional_competencies: z.array(z.string()),
  theme_signal: ElaborationThemeSignalSchema,
})
```

## Tier capping (deterministic, post-AI)

```typescript
const TIER_CAPS: Record<number, number> = { 0: 0.5, 1: 1.75, 2: 2.75, 3: 3.0 }
function capElaborationScore(basePoints: number, adjustment: number): number {
  return Math.max(0, Math.min(basePoints + adjustment, TIER_CAPS[basePoints]))
}
```

## Model: `claude-sonnet-4-6`, max_tokens: 350

# Freeform Grading Prompt

## User message template

```
You are a product sense grading agent. Grade this response against 4 rubric exemplars.

SCENARIO: {{scenario_context}} {{scenario_trigger}}
FLOW STEP: {{step}} — {{step_purpose}}
TARGET COMPETENCIES: {{target_competencies}}

RUBRIC:

SCORE 3 — BEST:
"{{best_option_text}}"
Competencies: {{best_competencies}}
Why best: {{best_explanation}}

SCORE 2 — GOOD BUT INCOMPLETE:
"{{good_option_text}}"
Competencies: {{good_competencies}}
Why good-but-incomplete: {{good_explanation}}

SCORE 1 — SURFACE:
"{{surface_option_text}}"
Why surface: {{surface_explanation}}

SCORE 0 — PLAUSIBLE WRONG:
"{{wrong_option_text}}"
Why wrong: {{wrong_explanation}}

LEARNER'S RESPONSE:
"{{user_text}}"

GRADING INSTRUCTIONS:
1. Compare by SUBSTANCE (ideas), not wording. "Instrument the funnel" = "add step-level tracking".
2. Score 0.0–3.0 continuously:
   2.5–3.0: Core insight of BEST exemplar
   2.0–2.4: Good but missing a key dimension
   1.0–1.9: Directionally correct but shallow
   0.0–0.9: Fundamentally misreads the situation
3. Identify competencies demonstrated from: {{target_competencies}}
4. Rate confidence 0.0–1.0
5. Can exceed 2.8 if response covers BEST AND adds genuine insight. Rare.

Return ONLY valid JSON:
{"score":<float>,"quality_label":"<best|good_but_incomplete|surface|plausible_wrong|between_levels>","competencies_demonstrated":[<strings>],"grading_explanation":"<2 sentences>","confidence":<float>}
```

## Step purpose values

```typescript
const STEP_PURPOSE: Record<FlowStep, string> = {
  frame: 'Identify the real problem, audience, and stakes',
  list: 'Generate comprehensive, relevant options or metrics',
  optimize: 'Evaluate tradeoffs and identify the best path',
  win: 'Deliver a crisp, actionable recommendation',
}
```

## Model: `claude-sonnet-4-6`, max_tokens: 500

## Retry on parse failure

```typescript
messages: [
  { role: 'user', content: originalPrompt },
  { role: 'assistant', content: rawFailedText },
  { role: 'user', content: 'Invalid JSON. Return ONLY the raw JSON object. No markdown backticks.' },
]
```

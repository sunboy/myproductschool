# Freeform Grading Prompt

## User message template

```
You are a product sense grading agent. Grade this response against 4 rubric exemplars.

SCENARIO: {{scenario_context}} {{scenario_trigger}}
FLOW STEP: {{step}} ({{step_purpose}})
TARGET COMPETENCIES: {{target_competencies}}

RUBRIC:

SCORE 3 (BEST):
"{{best_option_text}}"
Competencies: {{best_competencies}}
Why best: {{best_explanation}}

SCORE 2 (GOOD BUT INCOMPLETE):
"{{good_option_text}}"
Competencies: {{good_competencies}}
Why good-but-incomplete: {{good_explanation}}

SCORE 1 (SURFACE):
"{{surface_option_text}}"
Why surface: {{surface_explanation}}

SCORE 0 (PLAUSIBLE WRONG):
"{{wrong_option_text}}"
Why wrong: {{wrong_explanation}}

LEARNER'S RESPONSE:
"{{user_text}}"

INTELLECTUAL THEMES (each FLOW criterion belongs to one of these 7 reasoning traditions):
T1 Upstream Before Downstream   → F1 (symptom→root), F2 (why-before-how)          [Shreyas Doshi, Cagan, Dunford]
T2 The Job Behind the Feature   → F3 (problem stmt), L1 (stakeholders), L4 (workarounds) [Ben Erez, Rahul/empathy]
T3 Simulate the Other Side      → W4 (ownership)                                   [Rahul/cognitive_empathy]
T4 Width Before Depth           → L2 (solution width), L3 (2nd-order effects)      [Rahul/creative_exec, Dunford, Gergely]
T5 Name the Criterion, Name the Sacrifice → O1 (named criterion), O2 (sacrifice), O4 (eval vs criterion) [Gergely, Rahul/taste]
T6 Exclusion Is Precision       → F4 (scope boundary)                              [April Dunford]
T7 A Recommendation Is a Falsifiable Hypothesis → W1 (specificity), W2 (defensibility), W3 (falsifiability) [Cagan, Biddle]

Use the theme map to identify: (a) which theme the learner's response most engages with, and (b) whether it applies that theme's reasoning move correctly.

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
6. Identify the PRIMARY theme engaged (T1–T7) based on the FLOW step and what the learner's response attempts. Use the theme map above. If the response misses the theme's reasoning move entirely, set theme_applied correctly to false and name the anti_pattern.

Return ONLY valid JSON:
{"score":<float>,"quality_label":"<best|good_but_incomplete|surface|plausible_wrong|between_levels>","competencies_demonstrated":[<strings>],"grading_explanation":"<2 sentences>","confidence":<float>,"theme_signal":{"theme":"<T1|T2|T3|T4|T5|T6|T7>","name":"<theme name>","reasoning_move":"<1 sentence: what the theme requires at this step>","theme_applied":<true|false>,"anti_pattern":"<1 sentence: what was done instead, or null if theme_applied is true>"}}
```

## Step purpose values

```typescript
const STEP_PURPOSE: Record<FlowStep, string> = {
  frame: 'Identify the real problem, audience, and stakes',
  list: 'Generate a wide set of relevant options or metrics',
  optimize: 'Evaluate tradeoffs and identify the best path',
  win: 'Deliver a crisp, specific recommendation',
}
```

## Step → Primary theme mapping (inject as {{step_primary_theme}} to help ground the model)

```typescript
const STEP_PRIMARY_THEME: Record<FlowStep, string> = {
  frame:    'T1 (Upstream Before Downstream) and T2 (The Job Behind the Feature)',
  list:     'T2 (The Job Behind the Feature) and T4 (Width Before Depth)',
  optimize: 'T5 (Name the Criterion, Name the Sacrifice)',
  win:      'T7 (A Recommendation Is a Falsifiable Hypothesis)',
}
```

## Zod schema (updated)

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

## Model: `claude-sonnet-4-6`, max_tokens: 600

## Retry on parse failure

```typescript
messages: [
  { role: 'user', content: originalPrompt },
  { role: 'assistant', content: rawFailedText },
  { role: 'user', content: 'Invalid JSON. Return ONLY the raw JSON object. No markdown backticks.' },
]
```

## theme_signal usage downstream

The `theme_signal` field is used by:
- **Challenge feedback page** (`/challenges/[id]/feedback`): renders "What you were building" section with theme name and reasoning move
- **Luma coaching panel**: if `theme_applied: false`, Luma references the `anti_pattern` in its coaching message
- **Learner DNA**: `theme_signal.theme` is aggregated per-challenge to surface the user's weakest reasoning tradition across sessions
- **Next-challenge routing**: `/api/v2/dna/recommend` uses theme weakness to select challenges that stress the underdeveloped theme

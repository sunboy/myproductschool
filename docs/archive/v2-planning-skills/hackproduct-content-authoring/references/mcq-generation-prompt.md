# MCQ Option Generation Prompt

## User message template

```
You are generating MCQ options for a product sense training platform.

SCENARIO:
Role: {{scenario_role}}
Context: {{scenario_context}}
Trigger: {{scenario_trigger}}

FLOW STEP: {{step}} ({{step_purpose}})
REFERENCE ANSWER: "{{flow_answer_text}}"
TARGET COMPETENCIES: {{target_competencies}}

Generate exactly 4 options:

BEST (3): Full competency stack. Compressed reference answer. 2-4 sentences.
GOOD BUT INCOMPLETE (2): Correct but missing one perspective. 2-4 sentences.
SURFACE (1): Restates problem, generic. Sounds plausible but shallow. 2-4 sentences.
PLAUSIBLE WRONG (0): Sounds sophisticated but misreads situation. 2-4 sentences.

RULES:
- All 4 within 20% word count of each other
- Longest must NOT be the best
- No cross-references between options
- Each works independently (shuffleable)

Return ONLY valid JSON array:
[{"text":"...","quality":"best|good_but_incomplete|surface|plausible_wrong","competencies":[...],"explanation":"..."},...]
```

## Post-generation validation

```typescript
function validateOptions(options: GeneratedOption[]): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  if (options.length !== 4) errors.push('Must have exactly 4 options')
  const qualities = options.map(o => o.quality)
  for (const q of ['best','good_but_incomplete','surface','plausible_wrong']) {
    if (!qualities.includes(q)) errors.push(`Missing ${q} option`)
  }
  const wc = options.map(o => o.text.split(/\s+/).length)
  if ((Math.max(...wc) - Math.min(...wc)) / Math.max(...wc) > 0.2) errors.push('Word count variance >20%')
  if (wc[options.findIndex(o => o.quality === 'best')] === Math.max(...wc)) errors.push('Best is longest')
  return { valid: errors.length === 0, errors }
}
```

## Model: `claude-sonnet-4-6`, max_tokens: 2000

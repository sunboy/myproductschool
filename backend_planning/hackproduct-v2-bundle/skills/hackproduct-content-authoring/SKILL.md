---
name: hackproduct-content-authoring
description: "Content authoring pipeline for HackProduct challenges. Use when creating, generating, validating, or publishing FLOW challenges, whether from raw markdown, from scratch, or via admin API. Triggers on: create challenge, generate MCQ, write nudges, tag competencies, seed challenges, populate database, content pipeline, authoring, publish."
---

# HackProduct Content Authoring Pipeline

Takes raw questions and turns them into structured FLOW challenges with MCQ options, nudges, taxonomy tags, and validation.

## Pipeline: 8 steps, ~$0.18/challenge, ~40s

```
Raw markdown → scenario_extractor → competency_tagger → taxonomy_tagger
  → mcq_option_generator (×4 steps × N questions)
  → nudge_writer (×4) → difficulty_calibrator → content_validator → publish
```

## Voice and Writing Style

All generated content uses the voice of a senior product thinker who has seen this problem before, not a trainer building curriculum. Think Shreyas Doshi writing a tweet thread, not a PM certification course.

**Tone:**
- Direct, confident, slightly opinionated. Not academic, not corporate.
- No scene-setting fluff: never open with "the VP wants", "stakeholders are asking", "the executive team needs". Drop straight into the situation.
- Explanations read like insight, not instruction. "Here's why this matters" not "this question tests your ability to..."
- Nudges feel like a smart colleague leaning over: a pointed question that makes you think differently, not a hint that telegraphs the answer.
- Option text sounds like something a real person would actually say or think, not a textbook category label.

**Hard rules:**
- No em dashes. Use a comma, period, or restructure the sentence.
- No AI slop: never use "delve", "leverage", "utilize", "holistic", "robust", "seamlessly", "it's worth noting", "in order to", "as well as", or any phrase that reads like padding.
- The best option must be genuinely better in its reasoning, not just more comprehensive-sounding or longer.
- Cut anything that exists to sound thorough. Every sentence should earn its place.

**What good looks like:**

Scenario context (bad): "The VP of Product has asked you to evaluate whether the company should expand into a new market segment. Stakeholders across the organization have differing opinions."

Scenario context (good): "You're three months into owning the SMB product at a Series B fintech. Growth is flat. The sales team says enterprise is the obvious move. You're not so sure."

Nudge (bad): "Consider what the root cause of the problem might be before jumping to solutions."

Nudge (good): "What would have to be true for this to still be a problem six months from now?"

Explanation (bad): "This question tests strategic thinking and the ability to identify upstream causes rather than treating symptoms."

Explanation (good): "Most people fix the thing that's visibly broken. The better move is asking what made it breakable in the first place. That's the difference between a patch and a structural change."

## Questions Per FLOW Step

Each FLOW step gets 1 to 3 questions. The default is 1. Add a second or third question only when the source material contains enough distinct sub-problems to justify it.

**Add a second question to a step when:**
- The step has two genuinely separable decisions (e.g. Frame has both a scope question and a root-cause question that don't collapse into each other)
- The source material contains a second concrete situation that tests a different aspect of the same theme
- Omitting it would leave a meaningful insight from the source unused

**Do not add a second question when:**
- The second question is a variation of the first (same reasoning pattern, slightly different wording)
- The source material is thin (a short question prompt or a brief article)
- You are adding it to seem thorough

**Hard limits:**
- 1 question: default for all steps
- 2 questions: allowed when source richness justifies it
- 3 questions: only for exceptionally dense source material (long detailed article, multi-part scenario); rare
- Never more than 3 per step

Each question still gets exactly 4 MCQ options (one of each quality archetype).

The `step_questions` insert count reflects this: 1–3 rows per `flow_step`, not always 1.

## MCQ Option Generation

For each question, generate exactly 4 options. See `references/mcq-generation-prompt.md` for the full Claude prompt.

**4 archetypes (every question has exactly one of each):**

| Quality | Points | What it demonstrates |
|---|---|---|
| `best` | 3 | Full competency stack, compressed FLOW answer |
| `good_but_incomplete` | 2 | Correct but missing one perspective |
| `surface` | 1 | Restates problem, generic, lacks depth |
| `plausible_wrong` | 0 | Sounds smart but misreads the situation |

**Constraints:**
- Exactly 4 options, one of each quality
- Word count variance ≤ 20% across options
- Longest option must NOT be the best one
- No "all of the above" or cross-references between options
- Each option tagged with `competencies[]` and `explanation`

## Nudge Writing

One nudge per FLOW step. Must be a question, max 40 words, must not share key terms with the best option, must reference the scenario.

## Taxonomy Tagging

Tags: `paradigm` (traditional/ai_assisted/agentic/ai_native), `industry`, `relevant_roles[]`, `frameworks[]`, `company_tags[]`

## Competency Tagging

2-3 primary + 1-2 secondary from: motivation_theory, cognitive_empathy, taste, strategic_thinking, creative_execution, domain_expertise

### Scenario Output Fields (Extended)

The scenario object must include these fields:

| Field | Required | Description |
|-------|----------|-------------|
| `role` | Yes | Specific role, company type, stage |
| `context` | Yes | 2-3 sentences: company, product, current situation |
| `trigger` | Yes | 1 sentence: concrete event forcing a decision |
| `question` | Yes | The core PM question being tested (not a restatement of trigger) |
| `explanation` | Yes | 2-3 sentences: why this question matters to product thinking |
| `engineer_standout` | Yes | 1-2 sentences: what makes an engineer's answer valuable here |
| `data_points` | No | String[]. Quantitative facts from source. Only populate when source contains real metrics. Leave empty otherwise. |
| `visuals` | No | String[]. SVG strings or markdown tables only. Use only when structural/tabular content from source genuinely aids comprehension. Never generate images. |

**Rules for `data_points` and `visuals`:**
- Only include if the source material genuinely contains quantitative data or structural/tabular content
- Never fabricate data points
- For visuals: use SVG strings or markdown tables only — never image URLs or base64
- Absence is preferred over noise — empty arrays are the correct default

### FLOW Step → Intellectual Theme Mapping

Each FLOW step is anchored to a primary intellectual theme. The `theme` and `theme_name` fields are **required** in each `flow_step` in the JSON output. MCQ options for each step must apply the theme's reasoning pattern:

| Step | Primary Theme | Secondary Theme | `theme` value | MCQ Generation Instruction |
|------|--------------|-----------------|---------------|----------------------------|
| Frame | T1: Upstream Before Downstream | T6: Exclusion Is Precision | `"T1"` | Best option identifies root cause upstream of the stated problem. Plausible_wrong diagnoses a downstream symptom. |
| List | T4: Width Before Depth | T2: The Job Behind the Feature | `"T4"` | Options must represent structurally distinct paradigms, not variations of one approach. Best option addresses a distinct user job. |
| Optimize | T5: Name the Criterion, Name the Sacrifice | — | `"T5"` | Best option explicitly names the optimization criterion AND the named sacrifice. Surface option gives vague tradeoffs. |
| Win | T7: A Recommendation Is a Falsifiable Hypothesis | T3: Simulate the Other Side | `"T7"` | Best option makes a crisp, testable recommendation. Plausible_wrong hedges or gives consensus non-answer. |

**Validation:** Content validator will reject any `flow_step` missing `theme` or `theme_name`.

## Content Validator (deterministic)

Checks: 4 flow_steps each with 1+ questions each with 4 options; exactly 1 "best" per question; word count variance ≤ 20%; valid competency enums; nudge < 40 words ending with "?"; estimated_minutes 5-20.

## Database Insert Order

```
1. INSERT challenges → challenge.id
2. INSERT flow_steps ×4 → flow_step.id per step
3. INSERT step_questions (1-3 per step) → question.id
4. INSERT flow_options ×4 per question (id = "{challenge_id}-{step}-Q{seq}-{label}")
```

## Challenge ID Format

`HP-{PARADIGM}-{INDUSTRY}-{FRAMEWORK}-{NUMBER}`
Paradigm: TR/AA/AG/AN. Industry: FIN/ECM/DT/HC/SOC/etc.

## Files This Skill Produces

```
scripts/seed-v2-challenges.ts
src/lib/v2/skills/deterministic/content-validator.ts
src/lib/v2/skills/deterministic/challenge-id-gen.ts
src/lib/v2/skills/ai/mcq-option-gen.ts
src/lib/v2/skills/ai/nudge-writer.ts
src/lib/v2/skills/ai/competency-tagger.ts
src/lib/v2/skills/ai/taxonomy-tagger.ts
```

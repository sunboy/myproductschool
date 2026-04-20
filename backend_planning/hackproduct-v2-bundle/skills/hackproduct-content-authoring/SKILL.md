---
name: hackproduct-content-authoring
description: "Content authoring pipeline for HackProduct challenges. Use when creating, generating, validating, or publishing FLOW challenges, whether from raw markdown, from scratch, or via admin API. Triggers on: create challenge, generate MCQ, write nudges, tag competencies, seed challenges, populate database, content pipeline, authoring, publish."
---

# HackProduct Content Authoring Pipeline

Turns raw source material into structured FLOW challenges with MCQ options, nudges, taxonomy tags, and validation.

## Audience

HackProduct is a product sense gym for **engineers**: staff engineers, tech leads, founding engineers, EMs, SWEs who want to reason about product decisions like a senior PM would. PMs are a secondary audience. All content skews to engineering-relevant decisions, technical tradeoffs, and system-level thinking.

The audience shapes WHAT decisions get tested and HOW options are framed. It does NOT change HOW the reader is addressed. User-facing copy NEVER uses second-person role framing like "you are a tech lead" or "as a senior engineer". Role is metadata, not copy.

## Pipeline

```
rawText (URL → scraped, text, or question)
  → [if open-ended question] expand_source → verify_source
  → scrape (Haiku): situation_summary, data_points, insights, excerpts, source_richness
  → scenario (Sonnet): role, context, trigger, question, explanation, engineer_standout, specific_detail
  → for each FLOW step:
       step_question_plan (Haiku): 1-3 questions with distinct focus strings
       for each question: mcq_with_grounding (Sonnet) — gets excerpts, data_points, insights, focus, siblingFocuses
  → taxonomy (Sonnet): paradigm, industry, difficulty, roles, competencies
  → validate: structure (hard fail) + grounding/voice warnings
```

## Grounding Rules (the difference between good and generic)

Every MCQ generation call receives a grounding pack:
- **focus**: the specific decision or reasoning move this question tests (from the plan step)
- **sourceExcerpts**: 2-3 verbatim passages from the source, filtered by step topic
- **dataPoints**: real numbers from the source
- **insights**: the 2-4 non-obvious observations the scraper pulled out
- **engineerStandout**: what an engineer sees here that a pure PM might miss
- **siblingFocuses**: focuses of other questions in the same step, to avoid overlap

**The BEST option must reference at least one source-specific element** (named entity, metric, or insight). Generic product truisms disqualify an option from being BEST.

## Open-Ended Prompts

For short open-ended question inputs (e.g. "how do you improve ChatGPT"), the pipeline runs two extra Claude calls before scraping:

1. **Expand**: narrow the open prompt into 2-3 specific product tensions, pick the most interesting, write 600-1000 words of source-like material around it, self-report every factual claim
2. **Verify**: a second Claude call flags fabricated or unsubstantiated claims. Metrics without substantiation get stripped or converted to qualitative framing. If the whole source is unreliable, the job fails with a reason.

The verifier exists to mitigate hallucination bias introduced by the expansion step. For URL and long text inputs, both steps are skipped — those already have real source.

## Voice and Writing Style

Write like Shreyas Doshi in a tweet thread or an opinionated staff engineer thinking out loud. Not a trainer. Not a certification course.

**Tone:**
- Direct, confident, slightly opinionated. Not academic, not corporate.
- Drop straight into the situation. No "the VP wants", "stakeholders are asking", "the executive team needs".
- Explanations read like insight, not instruction. "Here's why this matters" not "this question tests your ability to..."
- Nudges feel like a smart colleague leaning over: a pointed question that makes you think differently, not a hint that telegraphs the answer.
- Option text sounds like someone actually reasoning, not a textbook category label.

**Hard rules:**
- **No second-person role framing in user-facing copy.** No "you are a tech lead", "as a senior engineer", "imagine you work at". This is the number one smell that the model fell back to interview-prep framing.
- No em dashes. Use a comma, period, or restructure.
- No AI slop: never use "delve", "leverage", "utilize", "holistic", "robust", "seamlessly", "it's worth noting", "in order to", "as well as", or padding phrases.
- The best option must be genuinely better in its reasoning, not longer or more comprehensive-sounding.
- Best option must reference something source-specific: a named company, a metric, a contrarian take, a listed insight. No generic truisms.

**What good looks like:**

Scenario context (bad, role-framed): *"You're three months into owning the SMB product at a Series B fintech."*

Scenario context (bad, corporate): *"The VP of Product has asked you to evaluate whether the company should expand into a new market segment."*

Scenario context (good): *"Notifications went from 3 a day to 18. DAU dropped 14% the same week. The activity digest quadrupled notification volume. Customer success is hearing 'too many pings' on every call."*

Nudge (bad): *"Consider what the root cause might be before jumping to solutions."*

Nudge (good): *"What would have to be true for this to still be a problem six months from now?"*

Explanation (bad): *"This question tests strategic thinking and the ability to identify upstream causes rather than treating symptoms."*

Explanation (good): *"Most people fix the thing that's visibly broken. The better move is asking what made it breakable in the first place. That's the difference between a patch and a structural change."*

Option text (bad, role-framed): *"As a tech lead, I would segment users by notification volume and measure churn correlation."*

Option text (good): *"Segment users by notifications received per day. If the top quintile is churning faster than the median, volume is a proxy for the real problem. The real problem is signal."*

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
| `role` | Yes | Metadata only, not rendered as copy. Engineer-leaning by default (tech lead, staff engineer, founding engineer, EM). |
| `context` | Yes | 2-3 sentences. Drop into the situation. NO second-person role framing. |
| `trigger` | Yes | 1 sentence: the concrete thing that just happened. Specific. |
| `question` | Yes | The decision being tested. Not a restatement of the trigger. |
| `explanation` | Yes | 2-3 sentences: why this problem is interesting, as insight not instruction. |
| `engineer_standout` | Yes | 1-2 sentences: what an engineer sees here that a pure PM might miss. System-level or technical-angle observation. |
| `specific_detail` | Yes | A verbatim or near-verbatim phrase from the source (company name, metric, stakeholder quote, contrarian claim). `context` or `trigger` must incorporate this. |
| `data_points` | No | String[]. Real quantitative facts from source. Never fabricate. Leave empty otherwise. |
| `insights` | No | String[]. 2-4 non-obvious observations the scraper extracted. Used to ground MCQ best-option explanations. |
| `excerpts` | No | `{id, quote, topic}[]`. Verbatim source passages tagged by FLOW step topic. Filtered into the MCQ grounding pack per step. |
| `visuals` | No | String[]. SVG strings or markdown tables only. Never image URLs or base64. |

**Rules for optional fields:**
- Only include if the source material genuinely contains the content. Never fabricate.
- Absence is preferred over noise. Empty arrays are the correct default.

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

**Hard errors (block publish):**
- 4 flow_steps each with ≥1 questions, each with 4 options, one of each quality
- Valid competency enum values
- Required scenario fields present
- Required metadata fields present

**Warnings (non-blocking, surfaced to reviewer):**
- Word count variance across options > 20%
- Best option is the longest
- step_nudge > 40 words or missing "?"
- **Grounding**: No MCQ option references a token from `data_points`, `specific_detail`, or `insights` — signals the question may be generic
- **Sibling overlap**: Two questions in the same step share ≥3 content words
- **Voice**: Any user-facing copy contains second-person role framing ("you are a…", "as a…", "imagine you") — hard smell of interview-prep framing

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

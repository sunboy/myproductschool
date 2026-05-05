# Content Authoring Architecture

How FLOW challenges are generated, grounded, validated, and published. This is the architecture reference. For how to run the pipeline, see [content-generation-runbook.md](./content-generation-runbook.md).

## Audience

HackProduct is a product sense gym for **engineers** first: staff engineers, tech leads, founding engineers, EMs, SWEs. PMs are a secondary audience. Generated content skews to engineering-relevant decisions, technical tradeoffs, and system-level thinking.

The audience shapes WHICH decisions get tested and HOW options are framed. It does not change HOW the reader is addressed. User-facing copy never uses second-person role framing like "you are a tech lead" or "as a senior engineer". Role is metadata, not copy.

## Pipeline overview

```
rawText  (URL scraped, raw text, or short question)
  │
  ├─ [if open-ended question] ──► expand_source  ──► verify_source
  │                                (Sonnet)          (Sonnet)
  │
  ├─ scrape                    ──► situation_summary, data_points, insights[], excerpts[], source_richness
  │  (Haiku)
  │
  ├─ scenario                  ──► role, context, trigger, question, explanation, engineer_standout, specific_detail
  │  (Sonnet)
  │
  ├─ for each FLOW step:
  │     ├─ question_plan       ──► 1-3 questions with distinct focus strings
  │     │  (Haiku)
  │     └─ for each question:
  │           mcq_with_grounding (Sonnet)
  │           ← focus, sourceExcerpts, dataPoints, insights, engineerStandout, siblingFocuses
  │
  ├─ taxonomy                  ──► paradigm, industry, difficulty, engineering-biased relevant_roles, competencies
  │  (Sonnet)
  │
  └─ validate                  ──► structural errors (hard fail) + grounding/voice warnings (surfaced to reviewer)
```

Two pipelines, same shape:
- **Local mode** — `scripts/job-server.ts` shells out to the `claude` CLI using your Claude Code subscription (zero API cost)
- **API mode** — `src/lib/content/generator.ts` uses the Anthropic SDK with Haiku + Sonnet

## Grounding: the core idea

The earlier version of this pipeline had one load-bearing bug: the MCQ generator saw only a 3-sentence paraphrase of the scenario. The source article, its metrics, its contrarian takes, its specific named entities — all dropped before questions were generated. Output became "intellectually correct but generic."

The fix threads a **grounding pack** into every MCQ generation call:

| Field | Source | Purpose |
|---|---|---|
| `focus` | `buildStepQuestionPlanPrompt` output | The specific reasoning move this question tests. Makes multi-question steps distinct. |
| `sourceExcerpts` | `scenario.excerpts[]` filtered by step topic | 2-3 verbatim passages from source. Options can reference these verbatim or near-verbatim. |
| `dataPoints` | `scenario.data_points[]` | Real metrics extracted by the scraper. Never fabricated. |
| `insights` | `scenario.insights[]` | 2-4 non-obvious observations from source. Best option explanation MUST paraphrase or cite one. |
| `engineerStandout` | `scenario.engineer_standout` | What an engineer sees that a PM might miss. Shapes the best-option angle. |
| `siblingFocuses` | Other questions in this step | Forbids overlap. The MCQ generator must avoid these angles. |

**Grounding rule in the prompt:** the BEST option must reference at least one source-specific element (named entity, metric, or insight). Generic product truisms disqualify an option from being BEST.

## Scenario fields

| Field | Required | Description |
|---|---|---|
| `role` | Yes | Metadata only, never rendered as copy. Engineer-leaning by default. |
| `context` | Yes | 2-3 sentences. Drops into the situation. No role framing. |
| `trigger` | Yes | 1 sentence. Concrete thing that just happened. Specific. |
| `question` | Yes | The decision being tested. Not a restatement of trigger. |
| `explanation` | Yes | 2-3 sentences. Why this problem is interesting, as insight not instruction. |
| `engineer_standout` | Yes | 1-2 sentences. What an engineer sees that a PM might miss. Feeds into MCQ grounding. |
| `specific_detail` | Yes | A verbatim or near-verbatim phrase from the source. `context` or `trigger` MUST incorporate this. |
| `data_points` | Optional | Real metrics from source. Never fabricate. |
| `insights` | Optional | Non-obvious observations from source. |
| `excerpts` | Optional | `{id, quote, topic}[]` — verbatim passages tagged by FLOW-step topic. |
| `visuals` | Optional | SVG strings or markdown tables only. Never image URLs. |

## Open-ended prompts

Short question inputs like *"how do you improve ChatGPT"* lack source material to ground against. Two extra Claude calls run before the main pipeline:

1. **Expand** (`buildExpandOpenEndedPrompt`) — the model picks 2-3 concrete tensions in the product or company, chooses the most interesting, writes 600-1000 words of source-like material around it, and self-reports every factual claim with a confidence level.

2. **Verify** (`buildVerifierPrompt`) — a second call flags fabricated or unsubstantiated claims. Low-confidence metrics get stripped or converted to qualitative framing ("users have reported X" instead of invented numbers). If the source is unsalvageable, the verifier returns `{ verified_source: null, reason }` and the job fails with that reason surfaced.

From that point the pipeline runs normally against the verified source. For URL or long-text inputs, both steps are skipped. The job-server logs indicate which path ran.

Trigger heuristic in `isOpenEndedPrompt()`:
- `input_type === 'question'` AND input < 200 chars
- AND (starts with open-ended verbs like "how do you", "what would", "why" OR lacks concrete anchors like company names, metrics, version numbers, or "X vs Y" framing)

## FLOW step → intellectual theme mapping

Every step is anchored to a primary theme. The MCQ prompt injects the theme's reasoning pattern.

| Step | Primary Theme | Secondary | Best-option test |
|---|---|---|---|
| Frame | T1: Upstream Before Downstream | T6: Exclusion Is Precision | Identifies the root cause upstream of the stated problem. Plausible_wrong diagnoses a downstream symptom. |
| List | T4: Width Before Depth | T2: The Job Behind the Feature | Options are structurally distinct paradigms, not variations. Best option addresses a distinct user job. |
| Optimize | T5: Name the Criterion, Name the Sacrifice | — | Best option explicitly names the criterion AND the sacrifice. Surface option gives vague tradeoffs. |
| Win | T7: A Recommendation Is a Falsifiable Hypothesis | T3: Simulate the Other Side | Crisp, testable recommendation. Plausible_wrong hedges or gives a consensus non-answer. |

Default grading weights: 25% per step. Default questions per step: 1 (up to 3 when `source_richness=rich`).

## MCQ structure

Every question has exactly 4 options, one of each quality:

| Quality | Points | Description |
|---|---|---|
| `best` | 3 | Applies the primary intellectual theme, compressed, grounded in source |
| `good_but_incomplete` | 2 | Right direction, misses the key distinction |
| `surface` | 1 | The answer someone gives without thinking hard |
| `plausible_wrong` | 0 | Sounds confident, solving the wrong problem |

Option constraints:
- Exactly 4 options, one of each quality
- Word count variance ≤ 20% across options (style warning, not hard fail)
- BEST option must NOT be the longest (style warning)
- No "all of the above", no cross-references between options
- No `"As a [role], I would..."` option openers
- Each option tagged with its own `competencies[]` and `explanation`

## Validator behavior

The validator is deterministic and runs after generation, before the draft is written.

**Hard errors** (block publish):
- 4 FLOW steps, each with ≥1 questions, each with exactly 4 options
- One of each quality per question
- Valid competency enum values
- Required scenario and metadata fields present

**Warnings** (surfaced in logs and review UI, do not block):
- Word count variance > 20%
- Best option is the longest single option
- `step_nudge` > 40 words or missing "?"
- **Grounding**: No MCQ option in a question references any token from `data_points`, `specific_detail`, or `insights` — signals a generic question
- **Sibling overlap**: Two questions in the same step share ≥3 content words
- **Voice**: User-facing copy matches role-framing patterns (`^you are (a|an) `, `\bas a (senior|staff|tech lead|founding|engineer|pm|em|designer)`, `\bimagine you\b`, `\byou're a `) — the reviewer should rewrite before publishing.

## Voice and writing rules

Applied in every prompt, enforced by the validator.

**Tone:**
- Shreyas Doshi or an opinionated staff engineer thinking out loud
- Direct, confident, slightly opinionated. Not academic, not corporate.
- Drop into the situation. No "the VP wants", "stakeholders are asking", "the executive team needs"
- Explanations read like insight, not instruction
- Nudges are a pointed question that makes you think differently, not a hint that telegraphs the answer

**Hard rules:**
- **No second-person role framing in user-facing copy.** Never "you are a tech lead", "as a senior engineer", "imagine you work at". This is the number one smell.
- No em dashes. Use commas, periods, or restructure.
- No AI slop: never use "delve", "leverage", "utilize", "holistic", "robust", "seamlessly", "it's worth noting", "in order to", "as well as".
- Best option must be genuinely better in reasoning, not longer. Must reference something source-specific.

## Database insert order on publish

```
1. INSERT challenges → challenge.id
2. INSERT flow_steps ×4 → flow_step.id per step
3. INSERT step_questions (1-3 per step)
4. INSERT flow_options ×4 per question
```

Challenge ID format: `HP-{PARADIGM}-{INDUSTRY}-{FRAMEWORK}-{NUMBER}`. Paradigm: TR/AA/AG/AN. Industry: FIN/ECM/DT/HC/SOC/etc.

Paradigm normalization runs in `src/lib/content/publisher.ts` to coerce LLM output to the DB constraint (`traditional`, `ai_assisted`, `agentic`, `ai_native`).

## Files that implement this

| File | Responsibility |
|---|---|
| `src/lib/content/prompts.ts` | All Claude prompts: scrape, scenario, MCQ, taxonomy, plan, expand, verify, nudge. Also `isOpenEndedPrompt()` and `ScrapeResult` type. |
| `src/lib/content/scraper.ts` | URL fetching and text extraction |
| `src/lib/content/generator.ts` | API-mode pipeline using Anthropic SDK |
| `src/lib/content/validator.ts` | Deterministic post-generation checks; structural errors + grounding/voice warnings |
| `src/lib/content/publisher.ts` | Draft → challenges table insert with paradigm normalization |
| `src/lib/content/admin-auth.ts` | `x-admin-secret` check for admin routes |
| `scripts/job-server.ts` | Local-mode poller running the pipeline via `claude` CLI subprocess |
| `scripts/bulk-ingest.ts` | Reads Queued rows from a Notion database and submits them to the job server |
| `src/app/api/admin/content/jobs/route.ts` | Create and list jobs |
| `src/app/api/admin/content/jobs/[id]/route.ts` | Get one job + its draft; DELETE removes job + draft + published challenge |
| `src/app/api/admin/content/drafts/[id]/**` | Approve step, approve all, regenerate step, publish |
| `src/app/api/admin/content/challenges/[id]/route.ts` | Tag editor GET/PATCH for published challenges |
| `src/app/(admin)/admin/content/page.tsx` | Job list dashboard with View / Review / Tags / Delete actions |
| `src/app/(admin)/admin/content/review/[job_id]/page.tsx` | Draft review page with inline edits and step approvals |
| `src/app/(admin)/admin/content/challenges/[challenge_id]/page.tsx` | Published challenge tag editor |
| `supabase/migrations/035_content_management.sql` | `generation_jobs`, `draft_challenges`, schema extensions |

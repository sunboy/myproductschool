---
name: hackproduct-content-authoring
description: "Content authoring pipeline for HackProduct challenges. Use when creating, generating, validating, or publishing FLOW challenges — from raw markdown, from scratch, or via admin API. Triggers on: create challenge, generate MCQ, write nudges, tag competencies, seed challenges, populate database, content pipeline, authoring, publish."
---

# HackProduct Content Authoring Pipeline

Transforms raw questions into structured FLOW challenges with MCQ options, nudges, taxonomy tags, and validation.

## Pipeline: 8 steps, ~$0.18/challenge, ~40s

```
Raw markdown → scenario_extractor → competency_tagger → taxonomy_tagger
  → mcq_option_generator (×4 steps × N questions)
  → nudge_writer (×4) → difficulty_calibrator → content_validator → publish
```

## MCQ Option Generation

For each question, generate exactly 4 options. See `references/mcq-generation-prompt.md` for the full Claude prompt.

**4 archetypes (every question has exactly one of each):**

| Quality | Points | What it demonstrates |
|---|---|---|
| `best` | 3 | Full competency stack — compressed FLOW answer |
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

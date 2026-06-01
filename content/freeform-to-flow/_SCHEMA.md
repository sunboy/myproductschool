# Freeform → FLOW conversion JSON schema

One file per challenge, named `<challenge_id>.json`, consumed by `scripts/convert-freeform-to-flow.ts`.

The file rewrites an EXISTING freeform challenge row into a FLOW challenge. `id` must be the existing freeform challenge's id (do not invent one).

## Shape

```jsonc
{
  "id": "c0000001-0000-0000-0000-000000000001",   // existing freeform row id — REQUIRED
  "title": "Spotify's 15% Session Drop",            // keep or refine
  "scenario_role": null,                             // optional; usually null (role is metadata, not copy)
  "scenario_context": "Spotify's growth team shipped a Share to Story button...",  // situation-first, NO "you are a..."
  "scenario_trigger": "Two weeks later, daily active session count is down 15% globally...",
  "scenario_question": "Diagnose why sessions dropped and decide what to do about the button.",
  "engineer_standout": "A strong answer treats the 15% drop as the signal and the 3% CTR as the cost...", // optional
  "paradigm": "traditional",        // 'traditional' | 'ai_assisted' | 'agentic' | 'ai_native'
  "difficulty": "medium",           // 'easy' | 'medium' | 'hard' (the script also accepts warmup/standard/advanced and maps them)
  "estimated_minutes": 20,
  "primary_competencies": ["strategic_thinking", "cognitive_empathy"],
  "secondary_competencies": ["motivation_theory"],
  "topic_tags": ["engagement", "growth"],
  "technique_tags": [],
  "move_tags": ["frame", "list", "optimize", "win"],
  "steps": [ /* exactly 4: frame, list, optimize, win */ ]
}
```

### steps[] — exactly 4, one each: frame, list, optimize, win

```jsonc
{
  "step": "frame",
  "step_nudge": "Find the problem behind the problem — what is actually breaking?",
  "grading_weight": 0.25,            // the 4 steps MUST sum to 1.0 (e.g. 0.25/0.25/0.30/0.20)
  "questions": [ /* 1-2 questions */ ]
}
```

### questions[] — 1-2 per step

```jsonc
{
  "question_text": "What is the most accurate framing of the session drop?",
  "question_nudge": null,
  "sequence": 1,                       // 1-based; unique within the step
  "grading_weight_within_step": 1.0,   // questions within a step MUST sum to 1.0
  "target_competencies": ["strategic_thinking"],
  "response_type": "mcq_plus_elaboration",  // default is fine
  "options": [ /* EXACTLY 4: one each best / good_but_incomplete / surface / plausible_wrong */ ]
}
```

### options[] — EXACTLY 4 per question, labels A/B/C/D, one of each quality

```jsonc
{
  "option_label": "A",
  "option_text": "The Share button cannibalized session time by sending users out to Stories.",
  "quality": "best",                  // one of: best | good_but_incomplete | surface | plausible_wrong
  "competencies": ["strategic_thinking"],
  "explanation": "Reads like insight, not instruction. Explains WHY this is right/wrong in THIS scenario.",
  "framework_hint": "Motivation Theory → Friction: the button adds an exit ramp mid-session."  // optional
}
```
`points` is derived automatically from `quality` (best=3, good_but_incomplete=2, surface=1, plausible_wrong=0) — do NOT include it.

## Hard rules (the validator enforces structure; you enforce voice)
- All 4 FLOW steps present; step grading_weights sum to 1.0; per-step question weights sum to 1.0.
- Every question has exactly 4 options: labels A,B,C,D and one of each quality.
- The BEST option must reference something specific to THIS scenario (a named metric, entity, or constraint from the source).
- **Voice:** situation-first. NO "you are a tech lead" / "as a PM" / "imagine you work at". NO em dashes. No AI slop (delve, leverage, utilize, holistic, robust, seamlessly, ensure, etc.). Coherent flowing sentences, not fragments.
- `framework_hint` (when present) grounds the option in a competency × FLOW-step reasoning move (motivation_theory, cognitive_empathy, taste, strategic_thinking, creative_execution, domain_expertise).

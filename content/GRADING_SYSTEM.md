# Luma Grading System

## Philosophy

Luma grades reasoning moves, not right answers. There is no answer key. The grading system evaluates whether the user applied a specific reasoning pattern — the same pattern expert product thinkers apply when they encounter this type of problem.

Each FLOW step trains one reasoning move:
- **Frame**: Distinguish symptom from root cause before engaging with solutions
- **List**: Expand the solution space before narrowing
- **Optimize**: Name what you are optimizing for, then name what you sacrifice
- **Win**: Make one specific, defensible, falsifiable call — and own it

A user who applies the right reasoning move on a weak scenario is better prepared for real product work than a user who produces a polished answer by accident.

---

## Architecture

### One Rubric Per Step

Four rubric files, one per FLOW step:

| File | Step | Core reasoning move |
|------|------|---------------------|
| `grading_rubrics/frame_rubric.json` | Frame | Symptom → root cause |
| `grading_rubrics/list_rubric.json` | List | Expand before narrowing |
| `grading_rubrics/optimize_rubric.json` | Optimize | Name criterion + sacrifice |
| `grading_rubrics/win_rubric.json` | Win | Specific + defensible + falsifiable |

Each rubric is a JSON object with: criteria definitions, scoring weights, output format, worked examples (strong/partial/needs_work), anti-patterns, and module-specific notes.

### Criteria Structure

Each rubric has 4 criteria. Each criterion contains:
- `id` — alphanumeric (F1, L2, O3, W4)
- `name` — short label
- `description` — what this criterion is testing and why it matters
- `strong_signals` — what strong answers do
- `partial_signals` — what partial answers do (right direction, incomplete execution)
- `failure_signals` — what weak answers do
- `luma_coaching_weak` — coaching message for partial scores
- `luma_coaching_failure` — coaching message for needs_work scores

Some criteria include additional structural fields:
- `components` (F3) — the four components of a complete problem statement
- `structure` (O2, W3) — the canonical phrasing pattern for the reasoning move
- `categories` (L1) — the stakeholder categories to cover

---

## Scoring

### Method: Criteria-Weighted

Each criterion is scored: `strong` (1.0), `partial` (0.5), `needs_work` (0.0)

Weighted sum produces a composite score (0.0–1.0):

| Threshold | Score | Meaning |
|-----------|-------|---------|
| Strong | ≥ 0.75 | Reasoning move executed well |
| Partial | ≥ 0.45 | Right direction, incomplete |
| Needs Work | < 0.45 | Reasoning move not applied |

### Weights by Step

**Frame**
| Criterion | Weight |
|-----------|--------|
| F1 — Symptom vs. root cause | 0.35 |
| F2 — Why-before-how check | 0.30 |
| F3 — Problem statement completeness | 0.20 |
| F4 — Scope boundary | 0.15 |

**List**
| Criterion | Weight |
|-----------|--------|
| L1 — Stakeholder completeness | 0.30 |
| L2 — Solution space width | 0.30 |
| L3 — Second-order effects | 0.25 |
| L4 — Workarounds and existing behavior | 0.15 |

**Optimize**
| Criterion | Weight |
|-----------|--------|
| O1 — Named optimization criterion | 0.30 |
| O2 — The naming of the sacrifice | 0.30 |
| O3 — Primary metric and guardrail | 0.20 |
| O4 — Options evaluated against criterion | 0.20 |

**Win**
| Criterion | Weight |
|-----------|--------|
| W1 — Specificity | 0.30 |
| W2 — Defensibility | 0.25 |
| W3 — Falsifiability | 0.30 |
| W4 — Ownership | 0.15 |

### Minimum Requirements

Strong answers require at least `partial` on the primary criteria:
- Frame: F1 and F2 must both be partial or better
- List: L1 and L2 must both be partial or better
- Optimize: O1 and O2 must both be partial or better
- Win: W1, W2, and W3 must all be partial or better

A high score on secondary criteria alone cannot produce a `strong` overall rating.

---

## Luma's Output Format

For every graded answer, Luma produces:

```json
{
  "score": "strong | partial | needs_work",
  "criteria_scores": {
    "F1": "strong | partial | needs_work",
    "F2": "strong | partial | needs_work",
    "F3": "strong | partial | needs_work",
    "F4": "strong | partial | needs_work"
  },
  "detected": "What Luma found in the answer — named specifically, not generically",
  "missed": "What was expected but not present — named specifically",
  "coaching": "One to three sentences. References the specific criterion missed. No praise for weak answers."
}
```

### Output Tone Rules

- `detected` names what the user actually wrote — specific, not generic ("You named the timeline contradiction" not "Good analysis")
- `missed` names what was absent — specific, not generic ("You didn't name the business consequence of leaving the root cause unresolved" not "More depth needed")
- `coaching` references a criterion, gives one concrete next move, does not praise weak answers, does not hedge
- For `strong` answers: coaching addresses the one gap that would elevate it further
- For `needs_work` answers: coaching gives the single most important missing move, not a list of everything wrong

---

## Canonical Reasoning Structures

These structures appear in the rubric files as `structure` fields. They are the patterns Luma is grading against.

**Frame — Problem Statement (F3)**
> [Specific person/group] is trying to [accomplish X]. [Blocker] is preventing them. If this remains unsolved, [business/product consequence].

**Optimize — The Naming of the Sacrifice (O2)**
> We get [optimization gain]. We give up [sacrifice]. [Sacrifice] is acceptable because [reason bounded to this context].

**Win — Falsifiability (W3)**
> We will know this worked if [metric] reaches [threshold] by [timeline]. We will know it failed if [counter-signal].

These structures are not templates users are expected to quote. They are the patterns Luma uses to recognize whether the reasoning move was made.

---

## Skill Profile Accumulation

Each graded step contributes to the user's skill profile. The profile tracks per-criterion performance across all challenges:

```
skill_profile = {
  "F1": { "strong": 3, "partial": 5, "needs_work": 2 },
  "F2": { "strong": 2, "partial": 6, "needs_work": 2 },
  ...
  "W4": { "strong": 1, "partial": 3, "needs_work": 6 }
}
```

From this profile, Luma can:
- Identify the user's weakest criterion across all attempts
- Surface the anti-pattern the user most consistently triggers
- Route the user toward challenges in modules where their weak criteria are most tested
- Generate a "skill radar" showing relative strength across all 16 criteria (4 steps × 4 criteria)

### Module-Criterion Routing

Each rubric file contains `module_notes` — one note per module — describing how the criterion manifests in that module's challenges. This allows routing:

- User consistently weak on F1 (symptom/root-cause)? Route to MOD2 (Problem Identification) challenges, where F1 is most directly tested.
- User consistently weak on W3 (falsifiability)? Route to MOD3 (Success Metrics), where falsifiability and metric precision are central.

---

## Anti-Patterns Each Step Catches

These are the systematic reasoning failures the rubric was designed to detect.

**Frame**
- Jumping to solutions before the problem is defined
- Treating the most visible problem as the most important one
- Accepting a symptom as a root cause because it's measurable
- Scoping too broadly — a problem that could justify any solution is not a problem statement

**List**
- Naming only the primary user and ignoring everyone else with a stake
- Generating variations of one idea instead of structurally distinct options
- Skipping directly to the preferred solution without mapping alternatives
- Missing second-order effects — analysis that stops at the immediate outcome

**Optimize**
- Using "it depends" as a conclusion rather than a starting point
- Recommending an option without naming the criterion it optimizes for
- Naming the gain without naming the sacrifice
- Treating all options as equally valid to avoid making a judgment

**Win**
- Listing options instead of choosing one
- Hedging after completing prior steps that were supposed to resolve the uncertainty
- Recommending a direction instead of an action
- No falsification condition — success is qualitative and unverifiable
- Handing ownership to someone else

---

## Connecting Rubrics to the Generation Pipeline

Each challenge in `challenges_all.json` has a `flow` array with 12 questions (3 per step). The rubric grading criteria map directly to these steps:

```
challenge.flow[0..2]  → Frame questions  → frame_rubric.json
challenge.flow[3..5]  → List questions   → list_rubric.json
challenge.flow[6..8]  → Optimize questions → optimize_rubric.json
challenge.flow[9..11] → Win questions    → win_rubric.json
```

The grading system does not need to know which module a challenge belongs to at grade time — the rubric's `module_notes` field is used for coaching context and routing, not for scoring.

### Grading Invocation (Future Implementation)

```python
def grade_step_answer(step: str, answer: str, challenge: dict, prior_steps: dict) -> dict:
    """
    step: "frame" | "list" | "optimize" | "win"
    answer: user's free-text answer to the 3 step questions
    challenge: full challenge object (for context)
    prior_steps: graded outputs from earlier steps (for W2 defensibility check)

    Returns: Luma output dict (score, criteria_scores, detected, missed, coaching)
    """
    rubric = load_rubric(f"grading_rubrics/{step}_rubric.json")
    prompt = build_grading_prompt(rubric, answer, challenge, prior_steps)
    response = call_luma(prompt)
    return parse_grading_output(response)
```

The Win step requires `prior_steps` (Frame + Optimize outputs) so Luma can check W2 defensibility — whether the recommendation follows from the earlier diagnosis.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-31 | Initial rubrics for all four FLOW steps |

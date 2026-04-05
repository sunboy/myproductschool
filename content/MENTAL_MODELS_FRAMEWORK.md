# Mental Models Framework
## How Expert Product Thinking Maps to FLOW

**Version:** 1.0
**Date:** 2026-04-03

---

## The Core Idea

HackProduct doesn't teach frameworks by name. It teaches the reasoning moves those frameworks are trying to produce. A user who has never read a product thinking book can still score strong on a FLOW challenge — if they make the right reasoning move.

But knowing *which mental model you're building* turns a graded answer into a micro-lesson. This document maps six expert thinking traditions into FLOW's rubric criteria and competency dimensions, so that every piece of feedback Luma gives is connected to the underlying intellectual tradition it's developing.

---

## The Six Competency Dimensions

These six competencies appear in the `learner_competencies` table. They are not self-reported. They are inferred from which MCQ options a user selects across challenges, and how they score on FLOW step criteria.

| Competency | What it measures |
|---|---|
| `motivation_theory` | Understanding what drives users: motivation, friction, satisfaction, nudge |
| `cognitive_empathy` | Simulating other people's goals, constraints, and success metrics |
| `taste` | Feeling the difference between a real tradeoff and a preference |
| `strategic_thinking` | Positioning decisions in a competitive, long-term context |
| `creative_execution` | Generating structurally distinct options, not variations of one idea |
| `domain_expertise` | Applying specific knowledge to name real metrics, thresholds, timelines |

These six dimensions are the product sense taxonomy from Rahul Pandey's Product Sense Course — absorbed and translated from a learning curriculum into a grading rubric.

---

## The Thinker-to-FLOW Map

### 1. Rahul Pandey — Product Sense as Six Competencies

**His model:** Product sense is not one skill — it's six. Motivation Theory, Cognitive Empathy, Taste, Strategic Thinking, Creative Execution, and Domain Expertise. Each is teachable. Each is measurable. Communication is a separate skill and is not product sense.

**What FLOW absorbed:**

The six competency dimensions are his six nodes, renamed to snake_case and embedded in the `learner_competencies` table. They are not taught directly. They are measured indirectly through which options a user picks and how they score on FLOW criteria.

| His node | Our competency | Where it's measured in FLOW |
|---|---|---|
| Motivation Theory | `motivation_theory` | Frame/F1, Frame/F3 |
| Cognitive Empathy | `cognitive_empathy` | Frame/F2, List/L1, Win/W4 |
| Taste | `taste` | Optimize/O1, Optimize/O2 |
| Strategic Thinking | `strategic_thinking` | Optimize/O4, Win/W2 |
| Creative Execution | `creative_execution` | List/L2, List/L3 |
| Domain Expertise | `domain_expertise` | Win/W1, Win/W3 |

**What got left behind:** The Communication module (product artifacts, influence, interviewing for product sense). HackProduct grades thinking, not presentation. A user who makes the right reasoning move in plain prose scores the same as one who writes well.

---

### 2. Shreyas Doshi — Upstream Thinking + Ownership

**His model:** The best product thinkers work upstream — they influence outcomes before they become problems. Not all work is equal: leverage tasks compound, neutral tasks maintain, overhead tasks drain. Real product ownership means naming who is accountable for the outcome, not just the decision.

**What FLOW absorbed:**

- **Frame** — the entire Frame step is upstream thinking. Don't solve the problem you were handed. Solve the problem behind it. Frame/F1 (symptom vs. root cause) and Frame/F2 (why-before-how) are Shreyas's upstream move in rubric form.
- **Win/W4 (Ownership)** — his insistence on accountability translates directly. A recommendation without a named owner is advice, not a decision. W4 grades who watches the metric and what they do when the signal says the recommendation was wrong.

**What got left behind:** His PM archetype taxonomy (visionary/execution/PMF-focused). Useful for career reflection; not a reasoning move that can be graded in a single challenge answer.

---

### 3. Gergely Orosz — The Pragmatic Engineer Lens

**His model:** Engineers who understand product aren't trying to become PMs. They're trying to make better technical decisions by understanding why the product exists and what "good" means in their context. Most engineers optimize locally (code quality, performance) without understanding the system-level product consequence of that optimization.

**What FLOW absorbed:**

- **Optimize/O1 (Named Criterion)** — engineers often optimize without naming what they're optimizing for. The O1 criterion makes that naming explicit: state the criterion before you compare options.
- **Optimize/O2 (The Sacrifice)** — every technical choice gives something up. Naming it is what makes you trustworthy to the product team. An engineer who can say "we get X, we give up Y, Y is acceptable because Z" is operating at a different level than one who says "this is the right technical call."
- **Module 8** (Engineer-to-PM Mindset) is built on his thesis: engineers don't lack product intuition, they lack the vocabulary for it.

**What got left behind:** His compensation benchmarks and career ladder analysis. Relevant to his newsletter audience; not a product thinking framework.

---

### 4. Ben Erez — Jobs to Be Done as an Emotional Lens

**His model:** Users don't want features. They hire products to make progress in their lives. That progress is functional (accomplish a task), emotional (feel a certain way), or social (be seen a certain way). Products that win the emotional or social job have stronger retention than products that only win the functional one.

**What FLOW absorbed:**

- **Frame/F3 (Problem Statement)** — the "what they are trying to accomplish" component is the job, not the feature. This forces the user to answer "hired to do what?" before diagnosing the problem.
- **List/L1 (Stakeholder Completeness)** — the three stakeholder categories (direct users, indirect stakeholders, business stakeholders) map to the three job types: functional (the user), emotional (how they feel about the outcome), social (who else is affected and how they're perceived).
- **Module 6** (Jobs to Be Done) is directly his territory — optimize for which job, name the sacrifice of not serving the others.

**What got left behind:** The full Switch interview methodology (pushes, pulls, anxieties, habits). Too granular for a single FLOW answer; better suited for a dedicated user research module.

---

### 5. Marty Cagan — Outcome Over Output

**His model:** The fundamental failure mode of product teams is shipping features that don't change behavior. Real product work is discovering what will actually move a metric before committing to building it. Four product risks: value (will customers buy it?), usability (can they use it?), feasibility (can we build it?), viability (should the business build it?).

**What FLOW absorbed:**

- **Win/W3 (Falsifiability)** — this is Cagan's "outcome, not output" in rubric form. A recommendation without a metric and a threshold is a feature request, not a product decision. The falsifiability formula (metric + threshold + timeline + counter-signal) is the minimum viable test of whether an outcome was achieved.
- **Frame/F2 (Why-Before-How)** — his insistence on discovery before delivery maps to the why-before-how check. Don't design until you know why the problem is worth solving.

**What got left behind:** His specific discovery techniques (continuous interviews, assumption testing, prototyping). These are methods for finding answers, not reasoning moves for evaluating decisions.

---

### 6. Gibson Biddle — DHM + Strategy as Hypothesis

**His model:** Good products Delight customers in Hard-to-copy, Margin-enhancing ways. Strategy is not a plan — it's a hypothesis: "We believe that if we do X, we will achieve Y because Z." The because-Z is the moat thesis. Without it, strategy is just a priority list.

**What FLOW absorbed:**

- **Optimize/O3 (Primary Metric + Guardrail)** — the Hard-to-copy constraint maps to the guardrail. A metric that goes up but is easily copied isn't a real win. The guardrail asks: what would tell you this is working but breaking something harder to see?
- **Win/W2 (Defensibility)** — a defensible recommendation exposes its hypothesis, not just its conclusion. This is Biddle's "because Z." The recommendation must be traceable back through the reasoning, not defended by assertion.

**What got left behind:** The full DHM framework as a product strategy evaluation tool. Useful for Module 7 (Product Strategy) challenges but too specific to be a universal rubric criterion across all eight modules.

---

### 7. April Dunford — Positioning as the Frame

**His model:** Positioning is the context you set before a customer evaluates your product. Get the frame wrong and the best product loses. The positioning move: name who you're for, what you're against, and what your proof is. Explicitly naming what you're NOT is as important as naming what you are.

**What FLOW absorbed:**

- **Frame/F4 (Scope Boundary)** — Dunford's positioning move applied to problem framing. Naming what you're not solving is as important as naming what you are. F4 grades whether the user set an intentional boundary, not just accepted the problem as given.
- **List/L2 (Solution Space Width)** — her point that you're always competing against something, including "do nothing," maps to including a descope or do-nothing option in the List step.

**What got left behind:** The full competitive landscape analysis and proof-point methodology. Too positioning-specific for a general product thinking rubric.

---

## The Synthesis Table

```
FLOW Step    Primary competencies     Thinkers absorbed
─────────────────────────────────────────────────────────────────
FRAME        motivation_theory        Rahul (friction identification)
             cognitive_empathy        Shreyas (upstream / why-before-how)
                                      Cagan (discovery before delivery)
                                      Ben Erez (the job, not the feature)
                                      Dunford (name what you're not solving)

LIST         cognitive_empathy        Rahul (simulation)
             creative_execution       Ben Erez (three job types → stakeholder map)
                                      Dunford (do-nothing as a legitimate option)
                                      Gergely (second-order technical consequences)

OPTIMIZE     taste                    Rahul (taste → real tradeoff vs. preference)
             strategic_thinking       Gergely (name the criterion, name the sacrifice)
                                      Biddle (hard-to-copy as guardrail)
                                      Shreyas (not all criteria are equal)

WIN          strategic_thinking       Cagan (outcome over output → falsifiability)
             domain_expertise         Biddle (strategy as hypothesis → defensibility)
             cognitive_empathy        Shreyas (ownership — who watches, who acts)
```

---

## The 10 Active Competency-Step Mappings

These are the connective tissue between the grading system and the mental models. Every challenge feedback page renders the relevant mappings for the steps the user completed.

| Step | Competency | The reasoning move being built |
|---|---|---|
| FRAME | `motivation_theory` | Identify friction before designing the fix |
| FRAME | `cognitive_empathy` | Ask whose goal is served by solving this |
| LIST | `cognitive_empathy` | Simulate every stakeholder's success metric |
| LIST | `creative_execution` | Generate structurally distinct options, not variations |
| OPTIMIZE | `taste` | Feel the difference between a tradeoff and a preference |
| OPTIMIZE | `strategic_thinking` | Name the criterion — what are we actually optimizing for? |
| WIN | `strategic_thinking` | Strategy is a hypothesis — what's the because-Z? |
| WIN | `domain_expertise` | A real metric requires domain knowledge to name |
| WIN | `motivation_theory` | Satisfaction: what does success look like after the fix? |
| WIN | `cognitive_empathy` | Phrase it so the decision-maker feels heard, not blocked |

---

## How This Appears in the Product

### Surface 1 — Per-MCQ Option Explanation

Each answer option in a FLOW question shows which mental model it demonstrates or violates. The explanation field has two layers:

**Layer 1 — What this option does right or wrong** (rubric layer):
> "You identified the root cause, not the symptom. Amara's evidence isolates one screen — that's the difference between diagnosing and guessing."

**Layer 2 — Which mental model it's building** (framework layer):
> 🧠 **Motivation Theory → Friction**
> The job isn't "reduce complaints." It's "remove what's blocking drivers from trusting their earnings data."

For wrong answers:
> "This confuses age with causation. It optimizes for aesthetics (feels old) rather than the actual friction (information architecture is broken)."
>
> 🧠 **Taste failure → Components of Product Taste**
> Taste isn't aesthetic preference. It's knowing which quality signal actually predicts user behavior.

---

### Surface 2 — Per-Step Grading Output

Luma's step-level feedback includes a `competency_signal` block alongside the standard `detected` / `missed` / `coaching` output:

```json
{
  "score": "partial",
  "criteria_scores": { "F1": "partial", "F2": "needs_work" },
  "detected": "You traced the complaint data to a specific screen...",
  "missed": "You accepted that fixing the screen is the right goal without questioning why...",
  "coaching": "You're applying Motivation Theory correctly on Friction — you found what's blocking drivers. The missing move is the Why-Before-How check.",
  "competency_signal": {
    "primary": "motivation_theory",
    "signal": "You're identifying friction well. The next level is asking what satisfaction looks like after the friction is removed — that's what separates a fix from a solution.",
    "framework_hint": "Motivation Theory: Motivation → Friction → Satisfaction → Nudge. You're at Friction. What does Satisfaction look like here?"
  }
}
```

---

### Surface 3 — Post-Challenge Mental Models Breakdown

After completing all four FLOW steps, the feedback page shows a full map from this challenge back to the frameworks being built:

```
What you were building in this challenge
─────────────────────────────────────────

FRAME   →   Motivation Theory
            You were practicing: identify friction before designing the fix.
            The upstream move — solve the friction cause, not the friction
            symptom.

LIST    →   Cognitive Empathy → Simulation
            You were practicing: step into every stakeholder's position
            before generating options. The PM has a different success metric
            than Amara. The next tech lead has a different one still.

OPTIMIZE →  Taste + Strategic Thinking
            You were practicing: feel the difference between a tradeoff and
            a preference. Naming the sacrifice is what makes a decision
            trustworthy to the people who have to live with it.

WIN     →   Domain Expertise + Cognitive Empathy
            You were practicing: a falsifiable recommendation requires domain
            knowledge (to name a real metric) and empathy (to phrase it so
            the PM feels heard, not blocked).

─────────────────────────────────────────
Your weakest competency this challenge: Cognitive Empathy

You generated options but didn't distinguish what the PM wants vs. what
drivers want vs. what the next engineer inherits. That distinction is the
simulation move — the core of Cognitive Empathy.

Next challenge to develop this:
→ The Silent Order Bug (EM · MOD5)
  Requires heavy stakeholder simulation across three competing interests.
```

---

## Design Principle: No Attribution in the Product

The mental models are presented as reasoning moves, not as frameworks with author names attached. This is intentional:

1. **Attribution creates authority bias.** Users shouldn't accept a reasoning move because Shreyas Doshi said it. They should accept it because it produces better decisions.

2. **The frameworks are in tension.** Cagan and Biddle sometimes disagree. Presenting them as competing named frameworks would confuse rather than clarify.

3. **The goal is internalization, not citation.** A user who can make the falsifiability move without knowing it came from Cagan has internalized it. A user who can cite Cagan but can't make the move has learned trivia.

The frameworks live in this document, in the rubrics, and in Luma's internal grading logic. They surface in the product as reasoning patterns — framed as "what you were building," not "what this framework says."

---

## Implementation Checklist

- [ ] Update `enrich_challenges.py` enrichment prompt to add `framework_hint` field to each MCQ option explanation
- [ ] Re-enrich existing 20 challenges with richer `explanation` fields
- [ ] Add `competency_signal` block to all four FLOW rubric files (`grading_rubrics/`)
- [ ] Build Mental Models breakdown component on challenge feedback page (`/challenges/[id]/feedback`)
- [ ] Map the 10 active competency-step combinations to static description text (24 possible, ~10 active)
- [ ] Wire `competency_signal` output from Luma's grading API into the feedback page
- [ ] Add "next challenge" routing logic based on weakest competency from this challenge

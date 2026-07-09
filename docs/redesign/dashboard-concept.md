# Dashboard — A Creative Rethink

**Live mock:** [`previews/dashboard-rich.html`](./previews/dashboard-rich.html) · rendered in Direction A (Precision Instrument) chrome. Screenshots: `images/dashboard-rich-1440-full.png`, `images/dashboard-rich-390.png`.

## The reframe

The audit answered "how do we stop the dashboard being overwhelming" with a defensive cut (≤8 cards). That is necessary but not sufficient — a stripped dashboard is calm but forgettable. The founder is right that the dashboard can be **visually rich AND disciplined at the same time**, if richness comes from *curation and personalization* rather than *accumulation of cards*.

Five brains worked this: a Codex brainstorm plus a 4-concept / 3-judge exploration (the Claude concept agents hit the Fable usage limit before returning, so the synthesis leans on the Codex pass, which independently landed on the same hybrid).

## Three concepts considered

| Concept | Spectrum position | Echoes | The risk |
|---|---|---|---|
| **Daily Flight Plan** | programmed daily session | Duolingo + Whoop | too prescriptive / repetitive |
| **The Product Desk** | infinite curated feed | LinkedIn done right + NYT briefing | passive consumption over deliberate practice |
| **The Readiness Cockpit** | analytics instrument | Whoop + Strava | cold / judgmental for a struggling user |

## The winner: Flight Plan spine + Cockpit signals + a feed below the fold

One dashboard, three layers, in priority order:

1. **Readiness bar (Cockpit, thin).** A dark forest strip across the top: interview readiness %, weakest move, two competency trends (one rising, one flat). The user's *state* framed as instrument readouts — serious, quantified, and every number resolves to an action below. Guardrail: no metric is a dead end.

2. **Today's Session (Flight Plan spine, the hero).** Hatch composes a finite, ordered daily block with a visible arc: warm-up quick take (done) → main rep on the weakest move (active) → cooldown autopsy → optional resume-loop. One dominant CTA: **Resume session**. Richness here is *sequencing, progress states, and context*, not exposed modules. It closes — "1 of 4 done, ~22 min left" — which creates the daily appointment.

3. **The Feed (below the fold).** A single curated, heterogeneous stream mixing typed cards: analytics insight, autopsy case-file cover, community reply, guide resume. It serves the session, it is not the dashboard's main behavior. Diversity cap (max two of a type up the stream) prevents feed-mono-culture; the first screen always contains the practice CTA, so it never becomes passive scrolling.

**Identity rail** (right): FLOW move bars (the one FLOW-branded surface, weakest move in amber), study-plan step progress, a 60-day activity heatmap, and the merged Interviews card. These are the persistent "where I stand" without competing for the primary action.

## The mechanic that ties it together: "Why this"

Every surfaced item — every session block, every feed card — carries a terse, visible reason built from real signals, recommendation first, reason immediately under it:

- "Because **Frame is your weakest move** and it is holding your readiness down."
- "Because your **interview is in 18 days** and this loop is going cold."
- "Because you're on **Product Sense Sprint week 2**."
- "Because your **latest debrief flagged weak problem framing**."

Not a tooltip behind an icon. Visible and confidence-building — it makes the personalization feel intelligent instead of magic, which is exactly what an engineer audience trusts. It is also the structural guarantee against regressing to 20-card chaos: **nothing appears on the dashboard without a why-line**, so there is no home for a generic always-on card.

## Why it can't regress into clutter

- The session spine is a fixed shape (warm-up / main / cooldown / optional), not a card slot machine.
- The feed enforces a per-type diversity cap and a single scroll direction.
- The "Why this" rule means every item must be *earned* by a user-state signal.
- The identity rail is bounded (4 fixed modules), separate from the action surface.

## Curation rules (the ranking logic, concrete)

For the sample user (12-day streak, weak Frame Lv2, Product Sense Sprint W2 step 3/5, paused loop, interview in 18 days):

- `interview_date <= 21 days` → boost interview-readiness items; frame readiness deltas against the date
- `paused_live_interview_loop` exists → slot as the session's optional resume block
- enrolled study plan → its current week is the session backbone
- lowest FLOW move → gets the main rep
- active streak + nothing done today → include a sub-3-min streak saver (the quick take)
- falling competency trend (taste flat 3 wks) → surface one analytics insight in the feed
- autopsy whose theme maps to the day's skill → cooldown block or feed card
- community reply → feed only, and only if it responds to a recent attempt

## Build note

This is a design reference, not production code, but it is deliberately buildable as an evolution of the current RSC dashboard: every signal it uses already exists (streaks, FLOW levels, competency trends, plan position, paused loops, debriefs, attempt history). The "session composer" is a ranking function over those signals; the feed is the same function widened. No ML infra required — the feasibility judge's bar. Implementation would follow the audit's sequencing (dashboard hero merge last).

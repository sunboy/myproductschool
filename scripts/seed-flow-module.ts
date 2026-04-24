// scripts/seed-flow-module.ts
//
// Seeds FLOW module: prose + structured figures.
// Idempotent. Safe to re-run.
//
// Run: npx tsx --tsconfig tsconfig.json scripts/seed-flow-module.ts

import { createClient } from '@supabase/supabase-js'
import type { ChapterFigure } from '../src/lib/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const MODULE_SLUG = 'flow'

const MODULE_ROW = {
  slug: MODULE_SLUG,
  name: 'FLOW',
  tagline: 'The four reasoning moves that separate product thinking from technical thinking.',
  difficulty: 'foundation' as const,
  chapter_count: 8,
  est_minutes: 80,
  cover_color: '#4a7c59',
  accent_color: '#c4a66a',
  sort_order: 1,
}

type ChapterSeed = {
  slug: string
  title: string
  subtitle: string
  hook_text: string
  sort_order: number
  body_mdx: string
  figures: ChapterFigure[]
}

// ── Chapter 1: Why FLOW ──────────────────────────────────────────────────────

const CH1: ChapterSeed = {
  slug: 'why-flow',
  title: 'Why FLOW',
  subtitle: 'And why engineers with strong intuition freeze in product reviews.',
  hook_text: 'Engineers do not lack product intuition. They lack vocabulary and reps.',
  sort_order: 1,
  body_mdx: `## What FLOW is

FLOW is four reasoning moves that separate product thinking from technical thinking, giving you a vocabulary for decisions you already make rather than a framework to memorize.

<!-- figure:0 -->

## Why engineers already have most of this

Five of the six competencies that define product sense already show up in engineering work every week, which means engineers are not missing product intuition so much as the vocabulary and reps that turn that intuition into visible reasoning.

<!-- figure:1 -->

The raw material is there, so what engineers need is a name for each move and a place to practice it where the stakes do not punish practice.

## The four moves, concretely

Each move corrects one anti-pattern, and once you can name the anti-pattern active in a room you can name the move that breaks it.

**Frame.** The stated problem is almost never the real problem, which means a complaint like *"users are churning"* is a symptom worth pushing past by asking what is upstream until the complaint would still be true if every proposed fix already existed.

**List.** A list of five variations of the same idea is really a list of one idea, so a real option space contains structurally distinct bets, and if the winner looks obvious before you have written the second option the list is too narrow.

**Optimize.** A tradeoff you cannot name is a preference, which is why the move is to state the criterion you are optimizing for and the thing you are explicitly giving up, along the lines of *"we ship speed at the cost of polish, because this audience forgives ugly before it forgives slow."*

**Win.** A recommendation that cannot be proven wrong is a hedge, not a recommendation, so a real call picks a direction, predicts a measurable result, and commits to a timeline that lets someone else disagree.

## Where this shows up in engineering language

The same four moves already live inside engineering work under different names, which is why the vocabulary transfers rather than having to be learned from scratch.

<!-- figure:2 -->

## Why not just read the books

The alternative to FLOW is ten books and a guess at the distillation, starting with *Inspired*, *Empowered*, *Obviously Awesome*, *The Build Trap*, *Measure What Matters*, *Competing Against Luck*, *Upstream*, *The Mom Test*, *Working Backwards*, and *The Making of a Manager*.

Every one of those books is worth reading, but none of them on its own names the four moves cleanly, which is what FLOW does so that the challenges in the rest of this product can act as the reps.

## What is in this module

- **Ch 2. Frame.** The root-cause move, and how to find what is upstream without getting lost in it.
- **Ch 3. List.** Widening the option space on purpose rather than by accident.
- **Ch 4. Optimize.** Naming the criterion and the sacrifice, and what an answer looks like instead of *"it depends"*.
- **Ch 5. Win.** Turning the recommendation into a falsifiable hypothesis.
- **Ch 6. Seven themes.** Mapping the four moves onto Doshi, Dunford, Cagan, Pandey, Orosz, and Biddle.
- **Ch 7. Engineer to product.** What you already have, and what you still need to learn.
- **Ch 8. FLOW live.** Running the four moves when the clock is ticking and the room is watching.

## One handle to take with you

The whole module compresses into four sentences: the real problem is upstream of the stated one, the best option is usually not on the first list, a tradeoff is a sacrifice rather than a preference, and a recommendation is a hypothesis someone could prove wrong.

That is the vocabulary to reach for in the next review meeting.`,
  figures: [
    {
      kind: 'connected_boxes',
      ariaLabel: 'The four FLOW moves',
      caption: 'The four moves, each paired with the anti-pattern it corrects (shown in red italic).',
      orientation: 'horizontal',
      showArrows: true,
      boxes: [
        { label: 'Frame', body: ['Find the real problem'], anti: 'not the stated one', tone: 'ok' },
        { label: 'List', body: ['Widen the option space'], anti: 'structurally distinct', tone: 'neutral' },
        { label: 'Optimize', body: ['Name criterion + sacrifice'], anti: 'not a preference', tone: 'neutral' },
        { label: 'Win', body: ['Falsifiable recommendation'], anti: 'not a hedge', tone: 'ok' },
      ],
    },
    {
      kind: 'comparison_table',
      ariaLabel: 'Product sense competencies mapped to engineering work',
      caption: "Rahul Pandey's six competencies minus domain expertise, with the five an engineer already exercises weekly on the left and taste flagged as uncalibrated rather than missing.",
      headers: ['Product sense competency', 'Where engineers already do it'],
      rows: [
        { cells: ['Motivation theory', 'On-call. Why users rage. Why metrics move.'], tone: 'ok' },
        { cells: ['Cognitive empathy', 'API design. Imagining the next caller.'], tone: 'ok' },
        { cells: ['Taste', 'Uncalibrated. Nobody named this as the thing being judged.'], tone: 'warn' },
        { cells: ['Strategic thinking', 'Build vs buy. Tech debt payoff timing.'], tone: 'ok' },
        { cells: ['Creative execution', 'Architecture reviews. Structurally distinct options.'], tone: 'ok' },
      ],
    },
    {
      kind: 'comparison_table',
      ariaLabel: 'FLOW moves mapped to engineering practices',
      caption: 'Same reasoning move, different room.',
      headers: ['FLOW move', 'Engineering version', 'Product version'],
      rows: [
        { cells: ['Frame', 'Root-cause debugging', 'Problem upstream of the stated complaint'], tone: 'ok' },
        { cells: ['List', 'Architecture review options', 'Structurally distinct solution paths'], tone: 'neutral' },
        { cells: ['Optimize', 'Build vs buy. Latency vs cost.', 'Criterion named, sacrifice named'], tone: 'neutral' },
        { cells: ['Win', 'PR with a rollout plan + metric', 'Falsifiable recommendation + timeline'], tone: 'ok' },
      ],
    },
  ],
}

// ── Chapter 2: Frame ─────────────────────────────────────────────────────────

const CH2: ChapterSeed = {
  slug: 'frame',
  title: 'Frame',
  subtitle: 'The real problem is never the stated one.',
  hook_text: 'The stated problem is the enemy of the real problem.',
  sort_order: 2,
  body_mdx: `## The move

Frame is the reasoning move that finds the real problem by refusing to accept the stated one, because the stated problem is almost always a symptom of something further upstream.

Every decision starts with a framing, whether anyone names it or not, and the default framing in most rooms is whatever the loudest person said first. The move is to treat that opening framing as a hypothesis worth testing rather than a fact worth acting on, and the test is simple: ask what would still be true if every proposed solution already existed. If the complaint survives, the framing is too shallow and the real problem is upstream of it.

<!-- figure:0 -->

## A concrete example

In 2004, Gmail shipped with 1GB of free storage at a moment when Hotmail and Yahoo Mail capped users at 2MB and 4MB, and the product team had to decide whether the real problem was storage or something further upstream. The stated problem was that users kept hitting quota, but walking upstream revealed that users were deleting valuable mail to stay under quota, which meant the real problem was that email was being treated as temporary communication rather than a permanent archive. Fixing quota would have satisfied the stated problem; reframing email as an archive is what made Gmail a category-defining product.

The general pattern is that users stop complaining about problems they have learned to work around, so a good frame often shows up as something users have stopped asking for rather than something they are asking for loudly.

## Where engineers already do this

Root-cause debugging is Frame, because an engineer who finds that a test is failing never ships a fix to the test; they ask what change upstream made the test fail and fix that instead. The same move shows up in incident postmortems, where the Five Whys exercise exists specifically to keep the team from stopping at the symptom.

The harder application is in product framings, where the stated problem often comes from a credible source (a senior stakeholder, a customer interview, a dashboard alert) and refusing the frame feels like pushing back on the person who gave it. The move is the same, but the room treats it as insubordination rather than rigor.

## One handle to take with you

Frame is not "understand the problem more". It is "refuse to solve the problem you were handed until you have walked upstream far enough that the thing you are solving would stay true even if every proposed solution already existed."

Next: **List**, the move that widens the option space so the real winner is not the first thing anyone proposes.`,
  figures: [
    {
      kind: 'connected_boxes',
      ariaLabel: 'Upstream versus downstream framing',
      caption: 'Every stated problem sits downstream of a real problem, so the job of Frame is to walk upstream until the complaint would no longer be true even if every proposed fix already existed.',
      orientation: 'horizontal',
      showArrows: true,
      boxes: [
        { label: 'Root cause', body: ['Systemic condition'], tone: 'ok' },
        { label: 'Contributing factor', body: ['Makes the symptom worse'], tone: 'neutral' },
        { label: 'Stated problem', body: ['the symptom'], tone: 'warn' },
      ],
    },
  ],
}

// ── Chapter 3: List ──────────────────────────────────────────────────────────

const CH3: ChapterSeed = {
  slug: 'list',
  title: 'List',
  subtitle: 'The options you missed matter more than the ones you found.',
  hook_text: 'A list of five variations of one idea is a list of one idea.',
  sort_order: 3,
  body_mdx: `## The move

List is the reasoning move that widens the option space on purpose, because the first list of options in any room is almost always a list of variations on a single idea rather than a set of genuinely different paths forward.

A real option list contains bets that are structurally distinct, meaning they are trying to solve different underlying jobs, making different tradeoffs, or betting on different assumptions about the future. A fake option list contains the same bet phrased three ways, which produces the illusion of choice without any real decision power. The test for whether a list is real is whether the options, if all four shipped independently, would produce materially different products or outcomes.

<!-- figure:0 -->

## A concrete example

When Instagram launched Stories in 2016, the option that won was not on the Instagram team's original list, because Snapchat had spent two years building the "ephemeral content" job and Instagram's own list was full of variations on photo feeds. The move Kevin Systrom's team made was to treat the Snapchat product as a listed option rather than a competitor, which widened the space far enough to include "copy the job, not the features" as a real path forward. That option shipped, ate Snapchat's growth, and changed what Instagram was.

The pattern is that the best option is often one someone outside the room has already built, and refusing to list it because it feels like copying is what keeps weak option lists small.

## Where engineers already do this

Architecture reviews do List well when they work, because the format forces the team to write out structurally different approaches (synchronous vs event-driven, monolith vs service, rewrite vs incremental migration) before picking one. A good ADR names two or three options that would each produce a different system, not three variations of the same system with different function names.

Where engineering teams go wrong on List is in sprint planning, where the list of options is almost always "which of these tickets do we do", never "is any ticket on this list the right thing to build". That is the same failure mode as a product team listing four onboarding tweaks when the real option space includes "no onboarding at all".

## One handle to take with you

List is not "generate more options". It is "make sure every option on the list is a different bet", and the check is whether each option, if it shipped alone, would produce a materially different outcome.

Next: **Optimize**, the move that takes a real option list and turns it into a decision by naming what you are optimizing for and what you are giving up.`,
  figures: [
    {
      kind: 'comparison_table',
      ariaLabel: 'Structurally distinct options versus variations',
      caption: 'A list of four onboarding variations is really one option, while a list of four structurally distinct bets forces a real decision about what onboarding is for in the first place.',
      headers: ['Variations (fake list)', 'Structurally distinct (real list)'],
      rows: [
        { cells: ['Ship onboarding A', 'Onboarding teaches the product'], tone: 'neutral' },
        { cells: ['Ship onboarding A with a tooltip', 'Defaults remove the need to learn'], tone: 'neutral' },
        { cells: ['Ship onboarding A with a video intro', 'Human-led setup for first 100 users'], tone: 'neutral' },
        { cells: ['Ship onboarding A with both', 'Narrow the audience until onboarding is unnecessary'], tone: 'neutral' },
      ],
    },
  ],
}

// ── Chapter 4: Optimize ──────────────────────────────────────────────────────

const CH4: ChapterSeed = {
  slug: 'optimize',
  title: 'Optimize',
  subtitle: 'Name the criterion. Name the sacrifice.',
  hook_text: 'A tradeoff you cannot name is a preference, not a tradeoff.',
  sort_order: 4,
  body_mdx: `## The move

Optimize is the reasoning move that turns a list of real options into a decision by naming both the thing you are optimizing for and the thing you are explicitly giving up, because a tradeoff without a named sacrifice is a preference dressed up as analysis.

Every decision between structurally distinct options involves a tradeoff, and the tradeoff is only legible if both sides are named out loud. Saying "we picked option B because it is better" is a preference. Saying "we picked option B because it optimizes for time to first value, which means we are giving up the surface area option C would have covered, and we think time to first value matters more for this audience" is a tradeoff. The second version can be disagreed with on specific grounds; the first version cannot be disagreed with at all.

<!-- figure:0 -->

## A concrete example

When Shopify decided in 2019 to let Amazon become the default fulfillment layer for many of its merchants rather than building out Shopify Fulfillment Network as a full counter, it named the tradeoff clearly: they optimized for merchant reach over platform lock-in, and they gave up the revenue that owning fulfillment end-to-end would have produced. The decision was controversial, and Tobi Lutke reversed parts of it later, but the fact that the original decision named both the criterion and the sacrifice is why a reversal was even possible. A decision made on preference alone cannot be revisited because nobody can point to what changed.

The pattern is that decisions made with both sides named become legible to the team, and decisions made with only the upside named become personality-dependent.

## Where engineers already do this

Latency vs cost is a canonical engineering tradeoff that works because both sides are named: "we are optimizing for p99 latency at the cost of a 3x infra bill, because this is on the hot path for a paying tier". Build vs buy is another one: "we are buying Stripe at the cost of 2.9% on every transaction, because integrating Stripe costs two engineer-weeks and building a payments stack costs two engineer-years".

Engineers go wrong on Optimize when the sacrifice is implicit. "We refactored the auth module" sounds like a statement of fact, but the decision underneath it optimized for future velocity at the cost of current sprint capacity, and if the sacrifice was never named the PR will land as a surprise on anyone who expected that sprint capacity to go to shipping features.

## One handle to take with you

Optimize is not "pick the best option". It is "pick an option and name the sacrifice", and the test for whether you have done it is whether someone reading your decision could disagree with it on specific grounds rather than on taste.

Next: **Win**, the move that turns a decision into a recommendation someone could prove wrong.`,
  figures: [
    {
      kind: 'connected_boxes',
      ariaLabel: 'Criterion and sacrifice paired',
      caption: 'A real tradeoff names both sides explicitly, because the sacrifice is what lets someone else disagree with the decision on specific grounds rather than on taste.',
      orientation: 'horizontal',
      showArrows: false,
      boxes: [
        { label: 'Criterion', body: ['What you are optimizing for', '"Time to first value"'], tone: 'ok' },
        { label: 'Sacrifice', body: ['What you are explicitly giving up', '"Surface area across features"'], tone: 'warn' },
      ],
    },
  ],
}

// ── Chapter 5: Win ───────────────────────────────────────────────────────────

const CH5: ChapterSeed = {
  slug: 'win',
  title: 'Win',
  subtitle: 'A recommendation is a falsifiable hypothesis.',
  hook_text: 'If you cannot say what would prove you wrong, you are not recommending.',
  sort_order: 5,
  body_mdx: `## The move

Win is the reasoning move that turns a decision into a recommendation by making it falsifiable, because a recommendation that cannot be proven wrong is a hedge rather than a call.

A real recommendation has three parts that travel together: a direction (what to do), a predicted result (what outcome will follow), and a timeline (by when). Each part is what makes the next part possible: the direction is what someone can execute, the predicted result is what someone can disagree with, and the timeline is what lets the team know when to come back and check. Drop any one of the three and the recommendation degrades into a status update.

<!-- figure:0 -->

## A concrete example

Netflix's 2013 decision to move from quantity to quality on original content was a real recommendation rather than a preference because it came with all three parts named: direction was "invest in fewer, larger original productions", predicted result was "subscriber retention rises and acquisition cost falls as word of mouth compounds", and timeline was "over the next three to four years, with the first data from House of Cards within 18 months". Ten years later, the evidence would have been unambiguous either way, and the fact that Netflix could have been proven wrong is exactly what made the call a call.

The pattern is that recommendations which cannot be disagreed with cannot be acted on either, because the team has nothing to check against when the timeline comes due.

## Where engineers already do this

A good PR description has all three parts: "this PR migrates the notification queue from Redis to SQS (direction), so p99 enqueue latency will drop from 40ms to under 10ms (predicted result), which we will verify in staging this week before the next release (timeline)." A PR that says "cleanup of notification infrastructure" has none of the three, and the reviewer has nothing to push back on except personal taste.

Rollout plans are the other place this shows up. A rollout that says "ship to 1%, then 10%, then 100% as metrics allow" is a hedge dressed up as a plan; a rollout that says "ship to 1% and hold for 48 hours, expanding if conversion stays within 2% of control, rolling back if error rate exceeds X" is a real recommendation that someone else could prove wrong.

## One handle to take with you

Win is not "be confident". It is "make a claim someone could prove wrong by a specific date", and the test for whether you have done it is whether a teammate could sincerely disagree with the predicted result on evidence.

Next: **The seven themes**, which map the four FLOW moves onto the seven reasoning traditions the rubric is compressing.`,
  figures: [
    {
      kind: 'connected_boxes',
      ariaLabel: 'Anatomy of a falsifiable recommendation',
      caption: 'A falsifiable recommendation is a direction, a predicted result, and a timeline travelling together, because the three pieces are what make it possible for someone to check whether the recommendation was right.',
      orientation: 'horizontal',
      showArrows: false,
      boxes: [
        { label: 'Direction', body: ['What to do', '"Ship the two-click flow"'], tone: 'ok' },
        { label: 'Predicted result', body: ['What outcome follows', '"Activation up 8%"'], tone: 'neutral' },
        { label: 'Timeline', body: ['By when', '"Within 4 weeks"'], tone: 'ok' },
      ],
    },
  ],
}

// ── Chapter 6: Seven themes ──────────────────────────────────────────────────

const CH6: ChapterSeed = {
  slug: 'seven-themes',
  title: 'The seven themes behind the rubric',
  subtitle: 'Which reasoning move each FLOW step is training, and which tradition it comes from.',
  hook_text: 'FLOW is the compression. These are the traditions it compresses.',
  sort_order: 6,
  body_mdx: `## The move

FLOW is a compression of seven reasoning traditions, so understanding which tradition each move is drawing from makes the move legible in rooms where the tradition is named by its original author rather than by its FLOW label.

The four moves (Frame, List, Optimize, Win) are the operational layer, and the seven themes (T1 through T7) are the reasoning layer that justifies why each move is the right move. This chapter is a map: for each FLOW step, which theme is the primary reasoning move being trained, which thinker named the tradition, and what anti-pattern the theme catches.

<!-- figure:0 -->

## Why the themes matter operationally

Every time Luma grades an answer, the output includes a theme signal block that names which theme was engaged and whether the reasoning move was applied correctly, because a grade without a theme attached is just a score. The theme is what makes the feedback actionable: knowing you scored low on Frame is not useful, knowing you scored low because you accepted the stated problem as real (T1) points at the specific reasoning move to practice next.

The seven themes also show up in the admin content-authoring pipeline, where the MCQ prompt injects the primary theme's reasoning move into the generation call so that the BEST option actually applies T1 or T4 or T5 rather than generic product advice.

## Where engineers already do this

Engineers who have read *A Philosophy of Software Design* (Ousterhout) or *Working Effectively with Legacy Code* (Feathers) already carry several of these themes in their engineering practice, because good engineering and good product thinking share the same set of reasoning moves applied to different surfaces. An engineer who names the sacrifice when picking a caching strategy is doing T5, and an engineer who refuses to fix a flaky test without finding the upstream race condition is doing T1.

The difference is that in engineering the themes are baked into the culture through code review norms and postmortem templates, while in product thinking they often have to be named explicitly because the feedback loop is slower and the anti-patterns hide longer.

## One handle to take with you

The themes are not new ideas, they are a compression of seven named traditions into one rubric, so that when a room invokes "Shreyas says do the upstream thing" or "Dunford says positioning is exclusion" you can recognize which FLOW move is being named and respond on the same layer.

Next: **Engineer to product**, the chapter that names what engineers already bring and the one specific competency that needs new reps.`,
  figures: [
    {
      kind: 'comparison_table',
      ariaLabel: 'FLOW moves mapped to seven intellectual themes',
      caption: 'Each FLOW step maps to one primary theme and often a secondary one, with each theme tracing back to a named thinker whose work is the source material the rubric compresses.',
      headers: ['FLOW step', 'Theme', 'Tradition (thinker)', 'Anti-pattern caught'],
      rows: [
        { cells: ['Frame', 'T1. Upstream Before Downstream', 'Shreyas Doshi, Marty Cagan', 'Accepting the stated problem as real'], tone: 'ok' },
        { cells: ['Frame', 'T6. Exclusion Is Precision', 'April Dunford', 'Scope taken as given, not chosen'], tone: 'ok' },
        { cells: ['List', 'T4. Width Before Depth', 'Rahul Pandey, Gergely Orosz', 'Variations presented as an option space'], tone: 'neutral' },
        { cells: ['List', 'T2. The Job Behind the Feature', 'Ben Erez, Clayton Christensen', 'Treating the feature as the job'], tone: 'neutral' },
        { cells: ['Optimize', 'T5. Name Criterion and Sacrifice', 'Gergely Orosz, Rahul Pandey', '"It depends" as a conclusion'], tone: 'neutral' },
        { cells: ['Win', 'T7. Falsifiable Hypothesis', 'Marty Cagan, Gibson Biddle', 'Qualitative success, no metric'], tone: 'ok' },
        { cells: ['Win', 'T3. Simulate the Other Side', 'Rahul Pandey', 'Handing ownership to "the team"'], tone: 'ok' },
      ],
    },
  ],
}

// ── Chapter 7: Engineer to product ───────────────────────────────────────────

const CH7: ChapterSeed = {
  slug: 'engineer-to-product',
  title: 'Engineer to product',
  subtitle: 'What engineers already have. What engineers still need.',
  hook_text: 'Five of the six competencies are already in your week. One is not.',
  sort_order: 7,
  body_mdx: `## The move

The transition from engineer to product thinker is not a rebuild, because five of the six competencies that define product sense are already active in engineering work; the rebuild is limited to a single competency that the engineering environment never asks you to practice in the open.

Rahul Pandey's six competencies are motivation theory, cognitive empathy, taste, strategic thinking, creative execution, and domain expertise, and five of those six have visible engineering analogs that most engineers have been exercising for years. The one that tends to arrive uncalibrated is taste, because engineering culture rewards correctness over preference and taste is specifically the skill of feeling the difference between a real tradeoff and a preference before anyone has named it out loud.

<!-- figure:0 -->

## Why taste is the one that needs reps

Taste is the skill of recognizing which tradeoff is the real one before anyone has named the criterion and sacrifice explicitly, which means taste is the competency that shows up earliest in a product conversation and cannot be substituted by more analysis. An engineer with calibrated taste can walk into a debate between two options and say "the real question is not A versus B, it is whether we are optimizing for retention or for acquisition, and if it is retention then A is obvious", which collapses a twenty-minute argument into two sentences.

Engineering culture does not punish weak taste because engineering decisions usually come with a correctness signal (the tests pass, the latency is within budget, the build is green). Product decisions often lack a correctness signal at the moment the decision is made, which is why taste has to carry more weight in product rooms, and why practicing taste outside the cost-of-being-wrong feedback loop is the specific value HackProduct adds.

## What engineers already bring that most PMs envy

The inverse is also true: strategic thinking that is grounded in actual system behavior, cognitive empathy shaped by designing APIs that other humans have to use, and creative execution that has been tested against real failure modes are all harder to develop than taste alone. A product engineer with calibrated taste is consistently the strongest product thinker in the room, because the five engineering-native competencies act as a grounding force that keeps the product thinking honest.

Gergely Orosz names this "the product engineer" and argues it is the most undervalued role in most companies, which tracks with what people mean when they say "Stripe-style engineer" or "Linear-style engineer": an engineer whose product instincts are calibrated enough to replace much of what a PM traditionally did, not because the PM role is unnecessary but because the tradeoffs are legible earlier.

## One handle to take with you

The engineer-to-product transition is not a rebuild, it is a calibration of taste, which the rest of HackProduct exists to let you practice without the real cost of being wrong.

Next: **Using FLOW live**, which puts the four moves together in the room where the clock is ticking.`,
  figures: [
    {
      kind: 'comparison_table',
      ariaLabel: 'What engineers already bring and what needs new reps',
      caption: 'Five of the six competencies carry across from engineering without retraining, which leaves taste as the single skill most engineers need new practice in before it becomes legible to a product room.',
      headers: ['Competency', 'Engineering analog (already fluent)', 'Product use'],
      rows: [
        { cells: ['Motivation theory', 'On-call rotations, why users rage, why metrics move', 'User friction, activation drops'], tone: 'ok' },
        { cells: ['Cognitive empathy', 'API design, imagining the next caller', 'Stakeholder positions, UX'], tone: 'ok' },
        { cells: ['Taste', 'Uncalibrated, not missing', 'Real tradeoff vs preference'], tone: 'warn' },
        { cells: ['Strategic thinking', 'Build vs buy, tech debt payoff timing', 'Competitive positioning, roadmap bets'], tone: 'ok' },
        { cells: ['Creative execution', 'Architecture reviews, structurally distinct options', 'Widening the option space'], tone: 'ok' },
        { cells: ['Domain expertise', 'Performance budgets, real latency thresholds', 'Real metrics, real timelines'], tone: 'ok' },
      ],
    },
  ],
}

// ── Chapter 8: Using FLOW live ───────────────────────────────────────────────

const CH8: ChapterSeed = {
  slug: 'using-flow-live',
  title: 'Using FLOW live',
  subtitle: 'In a meeting, in a review, in an interview.',
  hook_text: 'The four moves when the clock is ticking and the CEO is watching.',
  sort_order: 8,
  body_mdx: `## The move

FLOW is a sequence, and using it live means knowing which of the four moves the room needs next rather than running all four in order every time, because meetings move faster than a rubric and a ten-minute product review will rarely accommodate a full Frame-List-Optimize-Win pass.

The reading skill is recognizing which move is missing from the conversation already happening, because rooms tend to skip moves rather than do them badly. If everyone is arguing about which option wins, the missing move is usually Frame (they are optimizing the wrong problem) or List (they are choosing between two variations of the same bet). If the direction is clear but the team is hesitant, the missing move is usually Win (no one has named the falsifiable prediction) or Optimize (no one has named the sacrifice). Naming the missing move out loud is what unsticks the conversation.

<!-- figure:0 -->

## A 20-minute product review using FLOW live

The practical skill is a loose sequence that fits inside a normal meeting slot. Spend the first three or four minutes on Frame by asking what would still be true if every proposed fix already existed, which surfaces whether the stated problem is the real one and often ends the meeting early if the frame is wrong. Spend the next five minutes on List, explicitly naming the structurally distinct options rather than the variations, which is usually where disagreements about taste start to show up productively.

The middle eight minutes belong to Optimize, where someone names the criterion the decision will be made on and the sacrifice the winning option will require, and this is the part of the meeting where a strong product engineer earns their value because they can name the sacrifice in the language of the system rather than in the language of preference. The final three or four minutes are Win, where the direction, predicted result, and timeline get written down in a place the team can come back to when the timeline arrives.

## Where engineers already do this

Incident command structure uses the same shape: the incident commander frames what is actually broken (not what the alert said), lists the structurally distinct mitigations (rollback, hotfix, traffic redirect), optimizes by naming the criterion (minimize blast radius vs minimize customer-visible downtime) and the sacrifice, then commits to a direction with a timeline ("roll back now, hotfix within 30 minutes, postmortem by end of day"). The cadence transfers directly to product rooms; only the vocabulary changes.

The difference is that incident command has a norm that keeps the commander from skipping moves, while product rooms rely on whichever participant notices a missing move and is willing to name it. Building that norm is what the rest of HackProduct's practice challenges are for.

## One handle to take with you

FLOW live is not a script you run through, it is a reading skill for naming which of the four moves the current conversation has skipped, and the conversation will usually fix itself the moment the skipped move is spoken out loud.

That is the end of the module. The next step is practice: pick a challenge tagged with the FLOW step you feel least sure about and run the move against a scenario where the stakes do not punish the practice.`,
  figures: [
    {
      kind: 'comparison_table',
      ariaLabel: 'Reading which FLOW move a room needs next',
      caption: 'Most real decisions fail because one of the four moves was skipped rather than done badly, and the live skill is naming the missing move out loud before the room commits to the wrong thing.',
      headers: ['If the room is...', 'The missing move is...'],
      rows: [
        { cells: ['Arguing about which option wins', 'Frame (probably optimizing the wrong problem)'], badge: 'Frame', tone: 'ok' },
        { cells: ['Presenting variations that feel identical', 'List (fake option space disguised as choice)'], badge: 'List', tone: 'neutral' },
        { cells: ['Stuck on "it depends"', 'Optimize (criterion and sacrifice not named)'], badge: 'Optimize', tone: 'neutral' },
        { cells: ['Direction clear but team hesitant', 'Win (no falsifiable prediction + timeline)'], badge: 'Win', tone: 'ok' },
        { cells: ['Loudest person has the winning idea', 'Frame (defaulted to stated problem, never tested)'], badge: 'Frame', tone: 'ok' },
        { cells: ['Recommendation has no deadline', 'Win (timeline missing)'], badge: 'Win', tone: 'ok' },
        { cells: ['Team agrees too quickly', 'List (option space is too narrow to disagree)'], badge: 'List', tone: 'neutral' },
      ],
    },
  ],
}

const CHAPTERS: ChapterSeed[] = [CH1, CH2, CH3, CH4, CH5, CH6, CH7, CH8]

async function run() {
  console.log(`[seed-flow] Upserting module ${MODULE_SLUG}...`)
  const { data: mod, error: modErr } = await supabase
    .from('learn_modules')
    .upsert(MODULE_ROW, { onConflict: 'slug' })
    .select('id')
    .single()
  if (modErr || !mod) {
    console.error('[seed-flow] module failed:', modErr)
    process.exit(1)
  }

  for (const ch of CHAPTERS) {
    const { error } = await supabase
      .from('learn_chapters')
      .upsert(
        {
          module_id: mod.id,
          slug: ch.slug,
          title: ch.title,
          subtitle: ch.subtitle,
          hook_text: ch.hook_text,
          sort_order: ch.sort_order,
          body_mdx: ch.body_mdx,
          figures: ch.figures,
        },
        { onConflict: 'module_id,slug' }
      )
    if (error) {
      console.error(`  ${ch.slug} failed:`, error)
      process.exit(1)
    }
    console.log(`  ${ch.sort_order}. ${ch.slug} (${ch.body_mdx.length} chars, ${ch.figures.length} figure${ch.figures.length === 1 ? '' : 's'})`)
  }

  console.log('\n[seed-flow] Done.')
}

run().catch(e => { console.error(e); process.exit(1) })

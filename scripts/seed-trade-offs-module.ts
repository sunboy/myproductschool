// scripts/seed-trade-offs-module.ts
//
// Seeds Trade-offs module prose + structured figures.
// Run: npx tsx --tsconfig tsconfig.json scripts/seed-trade-offs-module.ts

import { createClient } from '@supabase/supabase-js'
import type { ChapterFigure } from '../src/lib/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const MODULE_SLUG = 'trade-offs'

type ChapterSeed = {
  slug: string
  sort_order: number
  body_mdx: string
  figures: ChapterFigure[]
}

// ── Chapter 1 ────────────────────────────────────────────────────────────────

const CH1: ChapterSeed = {
  slug: 'chapter-1',
  sort_order: 1,
  body_mdx: `## The problem with "it depends"

Every experienced PM says "it depends." The best ones immediately say what it depends on.

Shreyas Doshi made this observation on LinkedIn in 2023: "In product management, 'it depends' sounds like a very smart answer, but it moves nothing." The phrase signals awareness of tradeoffs without doing any of the actual work. It is the product equivalent of a shrug. It tells the room that the speaker has noticed that decisions are contextual, but stops precisely where the thinking needs to start. Doshi's sharper version of the same insight: "It takes thoughtful work to put informed opinions out there on what 'it depends' means, and that's basically what PMs are paid for."

## What naming the dependency actually looks like

When a product leader says "it depends on whether we are optimizing for daily active usage or net revenue retention", they have done something meaningful. They have named the axis. The decision is now about which axis matters more, and that question has an answer that the team can look up, debate, or escalate. "It depends" without the axis is a conversation stopper pretending to be nuance.

## The three parts of a complete answer

<!-- figure:0 -->

## Why engineers often do this better than PMs

Engineers are trained to name constraints explicitly. A performance discussion does not end at "it depends on the hardware." It ends at "it depends on whether the bottleneck is memory bandwidth or CPU cache misses, and here's how to tell the difference." The constraint is named, the diagnostic is named, and the resolution path is named. Product decisions deserve the same structure. The constraint is the strategic axis. The diagnostic is the data source that tells you which side of the axis you're on. The resolution path is the recommendation that follows.

## One handle to take with you

In any product discussion where the honest answer starts with "it depends," commit to finishing the sentence before speaking. Name the axis, name what evidence would resolve it, and name which way the evidence currently points. That structure transforms a hedge into a recommendation.

Next: **RICE scoring**, the framework that turns implicit prioritization assumptions into explicit numbers.`,
  figures: [
    {
      kind: 'connected_boxes',
      ariaLabel: 'Three parts of a complete trade-off answer',
      caption: '"It depends" is the start of an answer, not the end of one. A complete answer names the axis, names the evidence, and names the current position on that axis.',
      orientation: 'horizontal',
      showArrows: true,
      boxes: [
        { label: 'Name the axis', body: ['What two things are in tension?', 'Growth vs retention, speed vs reliability, revenue vs engagement'], tone: 'ok' },
        { label: 'Name the evidence', body: ['What data or signal would resolve which side of the axis matters more right now?'], tone: 'neutral' },
        { label: 'Name your position', body: ['Given what you know today, which way does the evidence point?', 'This is the recommendation.'], tone: 'ok' },
      ],
    },
  ],
}

// ── Chapter 2 ────────────────────────────────────────────────────────────────

const CH2: ChapterSeed = {
  slug: 'chapter-2',
  sort_order: 2,
  body_mdx: `## The framework

RICE scoring does not make prioritization decisions for you. It forces you to make your assumptions explicit, which is almost as good.

Sean McBride published the RICE framework at Intercom in 2016 as a response to a recurring problem: engineers and PMs had strong opinions about feature priority but no shared language for comparing bets across different surfaces. The formula is Reach times Impact times Confidence, divided by Effort. Each variable is estimated before the meeting starts, which means the disagreements that surface in the meeting are about assumptions rather than vibes. That is the actual value. The math is secondary.

## The four variables

**Reach** is the number of users affected in a given time period. A payment flow change that touches every checkout is high reach. A power-user shortcut affects a smaller audience. Reach is almost always underestimated for core flows and overestimated for new features.

**Impact** is how much the change moves the needle for each affected user. McBride used a scale from 0.25 (minimal) to 3 (massive). The honest answer for most product changes is 0.5. Very few changes are 3. Using 3 to justify a pet project is the most common way the framework gets gamed.

**Confidence** is the percentage certainty about the reach and impact estimates. Fifty percent means "we have a hypothesis and some qualitative signal." Eighty percent means "we have quantitative data from a comparable shipped feature." Confidence is the variable most people lie about. Anchoring it to an evidence type (user research, comparable data, intuition only) makes it harder to inflate.

**Effort** is the total person-months required, across engineering, design, and PM. Effort is almost always underestimated. A common calibration heuristic: take the first estimate and multiply by 1.5 for anything touching a legacy system and by 2 for anything that requires infrastructure changes.

## RICE in practice

<!-- figure:0 -->

## Where the framework breaks

RICE fails in two predictable ways. First, the frame problem: RICE compares features within a defined set, but the highest-leverage decision is often what to exclude from the set entirely. A feature with a RICE score of 40 is still a worse bet than a product investment that was never put on the list. Second, the strategic override: a feature with a RICE score of 8 might still be the right call if it unlocks a partnership, closes a segment, or signals a strategic direction. RICE is a prioritization tool, not a strategy tool, and using it as a strategy tool is a category error.

## One handle to take with you

Run RICE on the next three things on the roadmap before the next prioritization meeting. The goal is not to produce a definitive ranking. The goal is to force the team to state the assumptions, surface the disagreements about those assumptions, and have the real debate. The number is the prompt, not the answer.

Next: **The 2x2 impact-effort matrix**, the most used and most abused prioritization tool in product.`,
  figures: [
    {
      kind: 'comparison_table',
      ariaLabel: 'RICE scoring example comparing three features',
      caption: 'A worked example showing how RICE produces comparable scores across features that would otherwise be hard to rank. The scores are less important than the conversation about the variables that produces them.',
      headers: ['Feature', 'Reach', 'Impact', 'Confidence', 'Effort', 'RICE Score'],
      rows: [
        { cells: ['Checkout redesign', '5,000/mo', '1.0', '80%', '3 pm', '1,333'], tone: 'ok' },
        { cells: ['Power-user shortcut', '200/mo', '2.0', '60%', '0.5 pm', '480'], tone: 'neutral' },
        { cells: ['New onboarding flow', '1,000/mo', '3.0', '50%', '4 pm', '375'], tone: 'neutral' },
        { cells: ['Email digest feature', '3,000/mo', '0.5', '40%', '2 pm', '300'], tone: 'warn' },
      ],
      footer: {
        cells: ['Note', 'Checkout redesign wins despite lower per-user impact because reach dominates. Onboarding\'s high confidence gap and effort drag it below the shortcut.', ''],
      },
    },
  ],
}

// ── Chapter 3 ────────────────────────────────────────────────────────────────

const CH3: ChapterSeed = {
  slug: 'chapter-3',
  sort_order: 3,
  body_mdx: `## The tool

The 2x2 impact-effort matrix is the most used prioritization framework in product. It is also the most abused, because it is easy to draw, hard to calibrate, and trivial to game.

The matrix divides features into four quadrants: high impact, low effort (do first); high impact, high effort (plan carefully); low impact, low effort (do if there's time); low impact, high effort (drop). The original insight comes from portfolio management and industrial engineering, where it predates product management by decades. The BCG growth-share matrix from 1970 uses a similar two-axis structure to classify business units. The impact-effort version adapted that structure for feature prioritization and became standard practice in the 1990s as software product teams needed a fast tool to reason about backlogs with 50 to 500 items.

## The abuse pattern

<!-- figure:0 -->

## Why the quadrants drift

In any given sprint planning meeting where the team fills out the matrix collaboratively, a predictable migration happens. Features start scattered across all four quadrants. Over the next 20 minutes, they migrate toward the top-left: high impact, low effort. The team does not consciously lie. They round up on impact because they believe in the feature, and they round down on effort because they want to build it. The result is a matrix where every feature looks like a quick win, which is a prioritization tool that has stopped prioritizing.

The calibration fix is external anchoring. Impact should be anchored to a specific metric and a specific threshold: "high impact" means "moves DAU by more than 2% in the first 30 days." Effort should be anchored to actual time: "low effort" means "ships in under two sprints without pulling in a second engineer." Without anchors, the quadrants are opinions. With anchors, disagreements become falsifiable.

## Where the matrix is genuinely useful

The 2x2 is most useful in the early stages of a roadmap conversation, when the team needs a shared visual to orient around before any scoring happens. It is useful for quickly sorting a list of 30 to 50 ideas into rough buckets, before running RICE or a similar scoring exercise on the top 10. It is useful for communicating prioritization rationale to stakeholders who will not read a scoring spreadsheet. It is not useful as the final decision tool for a roadmap with real dependencies, real team constraints, or real strategic bets.

## One handle to take with you

Before the next team session where a 2x2 is drawn, write down two anchor definitions for each axis. What specific metric makes something "high impact"? What specific time threshold makes something "low effort"? Put both anchors on the whiteboard before any features are placed. The session will be shorter and the output will be more durable.

Next: **The Naming Move**, the language pattern senior PMs use to own a trade-off rather than hedge it.`,
  figures: [
    {
      kind: 'comparison_table',
      ariaLabel: 'Impact-effort matrix quadrants with calibration notes',
      caption: 'The four quadrants and how they drift without explicit anchors. Most teams\' matrices end up with 80% of features in the top-left because impact is rounded up and effort is rounded down.',
      headers: ['Quadrant', 'Default behavior', 'Common failure mode'],
      rows: [
        { cells: ['High impact, low effort', 'Do first — "quick wins"', 'Overcrowded. Every feature migrates here without anchors.'], tone: 'ok' },
        { cells: ['High impact, high effort', 'Plan carefully — strategic bets', 'Underused. Teams avoid placing features here because it feels like a demotion.'], tone: 'neutral' },
        { cells: ['Low impact, low effort', 'Do if there\'s time', 'Usually honest. The one quadrant teams are accurate about.'], tone: 'neutral' },
        { cells: ['Low impact, high effort', 'Drop', 'Underused. Features that belong here get relabeled to avoid conflict.'], tone: 'warn' },
      ],
    },
  ],
}

// ── Chapter 4 ────────────────────────────────────────────────────────────────

const CH4: ChapterSeed = {
  slug: 'chapter-4',
  sort_order: 4,
  body_mdx: `## The move

The most senior PMs do not hedge. They name the trade-off explicitly, own the sacrifice, and state the reasoning. That structure is learnable.

Shreyas Doshi has written about this repeatedly across his newsletter and LinkedIn posts. His canonical framing: "I would optimize for X at the cost of Y, because Z." Three parts, stated in sequence. The X is the thing you are prioritizing. The Y is the thing you are consciously sacrificing. The Z is the strategic reasoning that makes the sacrifice defensible. Most product people say X. Some say X and Y. Almost nobody says all three, and the third part is where the senior thinking lives.

## Why the sacrifice matters

Stating the sacrifice is uncomfortable because it makes the cost of the decision visible. If the decision turns out wrong, the person who named the sacrifice will be remembered as the one who chose it. That risk is real, but the alternative is worse. A decision that was never named can be disavowed. A decision that was named cannot, which means teams that name their decisions build a shared accountability structure that makes future decisions cleaner.

The other reason to name the sacrifice: it surfaces the implicit disagreement. In most product rooms, the debate is not about the preferred outcome. It is about the acceptable cost. If the team agrees that "high NPS at the cost of slower growth" is the right call, the feature list writes itself. If they disagree on whether that cost is acceptable, the disagreement is now a real conversation rather than a recurring passive-aggressive sprint planning argument.

## The three-part structure

<!-- figure:0 -->

## The Naming Move in interviews

In a product-sense interview, the Naming Move is the single fastest signal of experience level. A candidate who says "I would prioritize retention" is making a statement. A candidate who says "I would optimize for 90-day retention at the cost of new user growth in Q3, because the cohort data shows that users who stay past 90 days have 4x lifetime value" is making an argument. Arguments are what senior PMs produce. Interviewers are listening for the argument structure, not the conclusion.

The failure mode Doshi names is hedging: giving both sides of the trade-off equal weight without committing to either. Hedging sounds like wisdom but reads as indecision. The interviewer hears it as a candidate who knows the vocabulary of trade-offs but has not practiced making them.

## One handle to take with you

In the next product review, design critique, or roadmap discussion, write "We optimize for ______ at the cost of _______, because _______" on a note before the meeting starts. If the note cannot be filled in, the team does not yet have a decision. Fill in the note before presenting.

Next: **Tech debt as a product decision**, why every deferred refactor is a product bet most PMs are not aware they are making.`,
  figures: [
    {
      kind: 'connected_boxes',
      ariaLabel: 'Three parts of the Naming Move',
      caption: 'The Naming Move is a three-part structure. Most product people deliver only the first part. The third part is where the reasoning lives and where senior judgment is demonstrated.',
      orientation: 'horizontal',
      showArrows: true,
      boxes: [
        { label: 'We optimize for X', body: ['The thing you are prioritizing', 'Be specific: "90-day retention" not "retention"'], tone: 'ok' },
        { label: 'At the cost of Y', body: ['The thing you are consciously sacrificing', 'Naming this makes the decision real and accountable'], tone: 'warn' },
        { label: 'Because Z', body: ['The strategic reasoning', 'This is the senior thinking. Data, context, or business logic that makes the sacrifice defensible.'], tone: 'ok' },
      ],
    },
  ],
}

// ── Chapter 5 ────────────────────────────────────────────────────────────────

const CH5: ChapterSeed = {
  slug: 'chapter-5',
  sort_order: 5,
  body_mdx: `## The bet

Every time a team defers a refactor, skips a migration, or ships on top of a known architectural problem, they are making a product bet. Most PMs do not know they are making it.

Ward Cunningham introduced the technical debt metaphor in 1992 to describe the cost of expedient code that accumulates interest over time. The metaphor was precise: like financial debt, technical debt is not inherently bad. Taken deliberately with a plan to repay it, it can accelerate a product bet worth making. Accumulated without accounting, it compounds until the interest payments (in velocity lost, bugs shipped, and engineers burned out) exceed the original benefit. The PM's job in a technical debt conversation is not to defer to engineering on whether to take on debt. It is to understand what product bet is being made and whether that bet is the right one.

## Stripe's approach

Stripe has been explicit about this framing in engineering blog posts and conference talks. The internal principle: tech debt decisions should be evaluated with the same rigor as product investments, including a clear articulation of the expected return and a defined repayment plan. Stripe treats a major refactor as a product bet with a timeline, a sponsor, and a measurable outcome, not as a maintenance cost that engineering absorbs. That framing changes the conversation in planning. The PM is no longer approving or denying an engineering request. They are co-owning a product decision with engineering.

## What PMs need to understand about tech debt

<!-- figure:0 -->

## The three failure modes

**Deferred indefinitely.** The team ships on a known problem with no repayment plan. The debt compounds until a senior engineer leaves or a production incident forces the conversation. The product outcome is a velocity cliff at some unknown future date.

**Repaid at the wrong time.** A refactor is started in the middle of a critical growth period because the engineering team has finally had enough. The PM approved it in isolation without understanding the product cost of reduced shipping velocity during that window.

**Invisible to stakeholders.** The product roadmap shows features but no tech investments. Leadership is surprised when velocity drops in Q3 despite the roadmap looking healthy. The disconnect is structural: the roadmap never surfaced the accumulated debt as a first-class item.

## One handle to take with you

At the start of each quarter, ask the engineering lead: "What technical debt are we carrying that will affect product velocity in the next six months, and what would it cost in engineering time to eliminate it?" Put that answer next to the product roadmap. The juxtaposition is the decision.

Next: **Brand, trust, and regulatory constraints**, the non-technical factors that senior engineers consistently underweight in product decisions.`,
  figures: [
    {
      kind: 'mapping_diagram',
      ariaLabel: 'Technical debt types mapped to product impact',
      caption: 'Different categories of tech debt produce different kinds of product risk. PMs who understand this mapping can have informed conversations about which debt to prioritize, rather than deferring the decision entirely to engineering.',
      sourcesLabel: 'Type of technical debt',
      targetsLabel: 'Product impact',
      sources: ['Architectural debt (wrong abstraction)', 'Test debt (low coverage)', 'Dependency debt (outdated libraries)', 'Data model debt (schema mismatch)'],
      targets: [
        { label: 'Velocity cliff', body: 'Feature development slows as the codebase fights the architecture', tone: 'warn' },
        { label: 'Reliability risk', body: 'Regressions ship faster; incidents are harder to prevent', tone: 'warn' },
        { label: 'Security exposure', body: 'Known CVEs in outdated dependencies; compliance risk', tone: 'warn' },
        { label: 'Data quality risk', body: 'Analytics are unreliable; migrations become high-stakes events', tone: 'neutral' },
      ],
      links: [
        { from: 0, to: 0 },
        { from: 1, to: 1 },
        { from: 2, to: 2 },
        { from: 3, to: 3 },
      ],
    },
  ],
}

// ── Chapter 6 ────────────────────────────────────────────────────────────────

const CH6: ChapterSeed = {
  slug: 'chapter-6',
  sort_order: 6,
  body_mdx: `## The checklist

The best idea technically is often the wrong idea commercially. Brand, trust, and regulatory constraints are the factors that senior engineers consistently underweight in product decisions, not because they are irrational, but because engineering training has no systematic way to reason about them.

Three examples from the past five years illustrate the pattern. Apple's App Tracking Transparency, launched in April 2021, required iOS apps to ask users for explicit permission before tracking across apps and websites. Meta's Q1 2022 earnings showed a $10B revenue impact attributable to ATT in a single fiscal year. The constraint was not technical. It was regulatory and brand, and engineers at Meta who built features assuming tracking availability were blindsided by the scope of the change. The FTC's 2023 settlement with Amazon over dark patterns in the Prime cancellation flow resulted in required product changes plus $25M in penalties. The patterns that drove the dark-pattern design were not accidental. They were effective. But "effective" is not the same as "durable," and regulatory exposure is a product risk with a concrete financial downside. GDPR, enforced from 2018, rewrote the product surface area for any company handling EU user data. Products that assumed user data was freely available for personalization and A/B testing had to be redesigned at significant cost.

## The three constraint categories

<!-- figure:0 -->

## How to reason about brand constraints

Brand constraints are the hardest to reason about because they are probabilistic and long-horizon. A feature that degrades trust today may not show up in retention data for six months. The signal is always lagged, and by the time it arrives, attribution is hard. The practical heuristic: before shipping any feature that changes the user's relationship with their data, their attention, or their money, ask whether it would generate a negative headline in a technology publication. If the answer is "possibly," run it through a senior stakeholder review that includes someone with brand or communications context, not just product and engineering.

## How to reason about regulatory constraints

Regulatory risk follows a pattern. Regulators act after consumer harm is visible and documented at scale. The FTC, the EU DPC, and equivalent bodies rarely act on theoretical harm. By the time a practice is in enforcement scope, it has usually been visible as a problem for 18 to 36 months. The practical implication: read the enforcement actions in your product category and work backwards. If the FTC just fined a competitor for a data collection practice, the clock is running on that practice industry-wide. Build the product as if the enforcement is coming in 12 months, not as if it might never come.

## One handle to take with you

Before the next launch, run the following three-question check: Would this feature generate a negative headline? Does it involve user data or attention in a way that a regulator has recently scrutinized in a comparable product? Does it change the user's relationship with money, data, or access in a way that is hard to reverse? If any answer is yes, the feature needs a second review before it ships.

Next: **Case: Spotify Wrapped**, a feature with no direct revenue that generated 2 billion impressions. Here is how to see that trade-off clearly before the data is in.`,
  figures: [
    {
      kind: 'comparison_table',
      ariaLabel: 'Three constraint categories with examples and questions to ask',
      caption: 'Brand, trust, and regulatory constraints each require a different reasoning approach. Engineers who skip this checklist before shipping are not being irresponsible. They are applying the wrong frame to a problem that falls outside engineering\'s natural domain.',
      headers: ['Constraint type', 'Recent example', 'Question to ask before shipping'],
      rows: [
        { cells: ['Brand', 'Amazon dark patterns FTC settlement 2023', 'Would this generate a negative headline in a technology publication?'], tone: 'warn' },
        { cells: ['Trust (user data)', 'Apple ATT impact on Meta, $10B revenue hit Q1 2022', 'Does this change the user\'s relationship with their data in a way they would object to if they knew?'], tone: 'warn' },
        { cells: ['Regulatory (compliance)', 'GDPR enforcement from 2018, Meta fined €1.2B in 2023', 'Has a regulator recently acted against a comparable practice in this product category?'], tone: 'warn' },
      ],
    },
  ],
}

// ── Chapter 7 ────────────────────────────────────────────────────────────────

const CH7: ChapterSeed = {
  slug: 'chapter-7',
  sort_order: 7,
  body_mdx: `## The case

Spotify built a feature with no direct monetization path. It generated 2 billion impressions in 2023, 90 million user shares, and became the most visible annual product moment in consumer technology. The trade-off was obvious in hindsight. Here is how to see it in the moment.

Spotify Wrapped launched in 2016 as a simple year-end summary of each user's listening stats. By 2023, it had grown into a full product surface with personalized visual cards, genre personalities, AI DJ summaries, and deep sharing integration across every major social platform. The 2023 numbers: 227 million monthly active users interacted with Wrapped, content generated over 2 billion impressions globally, and more than 90 million users shared their results on social media. No other feature in Spotify's history has produced a comparable marketing return. And there is no paywall, no premium gating, and no direct revenue attached to any of it.

## The trade-off, named explicitly

<!-- figure:0 -->

## Why this was hard to approve

In any product review in 2015 or 2016, a feature like Wrapped would face predictable objections. It requires significant data infrastructure to generate personalized stats at scale. It has no conversion path. The engineering cost is real. The attribution is indirect and long-horizon. A PM optimizing for quarterly OKRs built around subscriber growth or average revenue per user would have a hard time justifying the investment on a spreadsheet. The trade-off requires a belief that brand equity converts to subscriber growth over a multi-year horizon, that social sharing generates lower-cost user acquisition than paid channels, and that a distinctive annual moment creates an emotional switching cost that does not appear in churn models.

None of those beliefs were provable in 2015. They required a judgment call about which bets are worth making when the return is invisible to short-horizon metrics.

## How to see this trade-off before the data is in

The Naming Move from Chapter 4 applied here: "We optimize for brand equity and social acquisition at the cost of direct revenue and engineering cycles in Q4, because we believe that an emotional annual moment creates a switching cost that compounds over years and cannot be replicated by paid acquisition."

That sentence was not written anywhere in 2015. But it is the argument that made Wrapped defensible. The trade-off is not complicated in retrospect. It was hard in the moment because the timescale of the return is longer than the timescale of most product planning processes, and because brand equity is measured differently from revenue.

## What this case teaches

Three things are replicable from Spotify Wrapped that are not specific to Spotify's scale or resources. First: the best product bets often optimize for a return that does not appear in the current measurement system. Building the argument explicitly, in the format of the Naming Move, is what makes those bets survivable in planning. Second: features that generate social sharing have a compounding return that short-horizon models undervalue. The question to ask is not "what is the projected conversion rate?" but "what happens if this becomes a cultural moment?" Third: the trade-off between direct monetization and brand investment is a real strategic choice that has a right answer in different market positions. Spotify in 2016 was not yet dominant. The brand bet was the right call for that position. A company with 80% market share might make a different call.

## One handle to take with you

That is the end of the module. The trade-off skill is not about frameworks. It is about naming things clearly. Name the axis. Name the sacrifice. Name the reasoning. Do that before the meeting, in writing, and the decisions in the room become faster, more honest, and more durable.`,
  figures: [
    {
      kind: 'comparison_table',
      ariaLabel: 'Spotify Wrapped trade-off analysis',
      caption: 'Wrapped\'s trade-off structure named explicitly. The feature optimized for long-horizon brand return at the cost of short-horizon revenue and engineering capacity. The bet paid off because the timescale of the return matched Spotify\'s market position at the time.',
      headers: ['Dimension', 'What Spotify gave up', 'What Spotify got'],
      rows: [
        { cells: ['Revenue', 'No direct monetization on Wrapped', '90M+ shares = organic acquisition worth hundreds of millions in paid equivalents'], tone: 'ok' },
        { cells: ['Engineering', 'Significant Q4 data infrastructure investment', '2B+ annual impressions with no media spend'], tone: 'ok' },
        { cells: ['Metrics', 'Feature does not appear in quarterly conversion models', 'Emotional switching cost compounding over years'], tone: 'neutral' },
        { cells: ['Risk', 'If sharing behavior did not follow, sunk cost with no recovery', 'Cultural moment status, impossible to replicate with paid media'], tone: 'ok' },
      ],
      footer: {
        cells: ['Decision', 'We optimize for brand equity and social acquisition at the cost of direct revenue, because we believe a distinctive annual moment creates switching cost that compounds over years.', ''],
      },
    },
  ],
}

const CHAPTERS: ChapterSeed[] = [CH1, CH2, CH3, CH4, CH5, CH6, CH7]

async function run() {
  const mod = await supabase.from('learn_modules').select('id').eq('slug', MODULE_SLUG).single()
  if (mod.error || !mod.data) {
    console.error(`[seed-trade-offs] module ${MODULE_SLUG} not found:`, mod.error)
    process.exit(1)
  }
  console.log(`[seed-trade-offs] module ${MODULE_SLUG} -> ${mod.data.id}`)

  for (const ch of CHAPTERS) {
    const { error } = await supabase
      .from('learn_chapters')
      .update({ body_mdx: ch.body_mdx, figures: ch.figures })
      .eq('module_id', mod.data.id)
      .eq('slug', ch.slug)
    if (error) {
      console.error(`  ${ch.slug} failed:`, error)
      process.exit(1)
    }
    console.log(`  ${ch.sort_order}. ${ch.slug} (${ch.body_mdx.length} chars, ${ch.figures.length} figure${ch.figures.length === 1 ? '' : 's'})`)
  }

  console.log('\n[seed-trade-offs] Done.')
}

run().catch(e => { console.error(e); process.exit(1) })

// scripts/seed-flow-module.ts
//
// Seeds the FLOW course module into learn_modules + learn_chapters.
// Idempotent. Safe to re-run.
//
// Run: npx tsx --tsconfig tsconfig.json scripts/seed-flow-module.ts
//
// Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from '@supabase/supabase-js'

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

// ── Chapter 1: full body ─────────────────────────────────────────────────────
//
// Renderer supports: headings, bold, italic, code, hrules, lists, links, and
// pass-through for block-level HTML (svg, figure, div, ul, ol, table).
// Voice: direct, no scene-setting, diagrams carry the load.

const CHAPTER_1_BODY = `## What FLOW is

FLOW is four reasoning moves that separate product thinking from technical thinking, giving you a vocabulary for decisions you already make rather than a framework to memorize.

<figure>
<svg viewBox="0 0 720 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="The four FLOW moves">
  <defs>
    <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#4a4e4a"/></marker>
  </defs>
  <g font-family="Nunito Sans, sans-serif" font-size="13">
    <g><rect x="8" y="30" width="160" height="100" rx="14" fill="#d8f0de" stroke="#4a7c59" stroke-width="1.5"/><text x="88" y="62" text-anchor="middle" font-weight="700" fill="#2e3230">Frame</text><text x="88" y="88" text-anchor="middle" fill="#4a4e4a" font-size="11">Find the real</text><text x="88" y="104" text-anchor="middle" fill="#4a4e4a" font-size="11">problem</text><text x="88" y="122" text-anchor="middle" fill="#b83230" font-size="10" font-style="italic">not the stated one</text></g>
    <g><rect x="188" y="30" width="160" height="100" rx="14" fill="#f0e8db" stroke="#6b6358" stroke-width="1.5"/><text x="268" y="62" text-anchor="middle" font-weight="700" fill="#2e3230">List</text><text x="268" y="88" text-anchor="middle" fill="#4a4e4a" font-size="11">Widen the</text><text x="268" y="104" text-anchor="middle" fill="#4a4e4a" font-size="11">option space</text><text x="268" y="122" text-anchor="middle" fill="#b83230" font-size="10" font-style="italic">structurally distinct</text></g>
    <g><rect x="368" y="30" width="160" height="100" rx="14" fill="#c4a66a33" stroke="#705c30" stroke-width="1.5"/><text x="448" y="62" text-anchor="middle" font-weight="700" fill="#2e3230">Optimize</text><text x="448" y="88" text-anchor="middle" fill="#4a4e4a" font-size="11">Name the</text><text x="448" y="104" text-anchor="middle" fill="#4a4e4a" font-size="11">criterion + sacrifice</text><text x="448" y="122" text-anchor="middle" fill="#b83230" font-size="10" font-style="italic">not a preference</text></g>
    <g><rect x="548" y="30" width="160" height="100" rx="14" fill="#78a88644" stroke="#4a7c59" stroke-width="1.5"/><text x="628" y="62" text-anchor="middle" font-weight="700" fill="#2e3230">Win</text><text x="628" y="88" text-anchor="middle" fill="#4a4e4a" font-size="11">Falsifiable</text><text x="628" y="104" text-anchor="middle" fill="#4a4e4a" font-size="11">recommendation</text><text x="628" y="122" text-anchor="middle" fill="#b83230" font-size="10" font-style="italic">not a hedge</text></g>
    <line x1="168" y1="80" x2="186" y2="80" stroke="#4a4e4a" stroke-width="1.5" marker-end="url(#arr)"/>
    <line x1="348" y1="80" x2="366" y2="80" stroke="#4a4e4a" stroke-width="1.5" marker-end="url(#arr)"/>
    <line x1="528" y1="80" x2="546" y2="80" stroke="#4a4e4a" stroke-width="1.5" marker-end="url(#arr)"/>
  </g>
</svg>
<figcaption>The four moves, each paired with the anti-pattern it corrects (shown in red italic).</figcaption>
</figure>

## Why engineers already have most of this

Five of the six competencies that define product sense already show up in engineering work every week, which means engineers are not missing product intuition so much as the vocabulary and reps that turn that intuition into visible reasoning.

<figure>
<svg viewBox="0 0 720 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Product sense competencies mapped to engineering work">
  <g font-family="Nunito Sans, sans-serif" font-size="12">
    <text x="140" y="26" text-anchor="middle" font-weight="700" fill="#2e3230" font-size="13">Product sense competency</text>
    <text x="480" y="26" text-anchor="middle" font-weight="700" fill="#2e3230" font-size="13">Where engineers already do it</text>

    <g transform="translate(0,44)">
      <rect x="16" y="0" width="248" height="30" rx="6" fill="#d8f0de" stroke="#4a7c59"/>
      <text x="32" y="20" fill="#2e3230" font-weight="600">Motivation theory</text>
      <text x="300" y="20" fill="#4a4e4a">On-call. Why users rage. Why metrics move.</text>
    </g>
    <g transform="translate(0,82)">
      <rect x="16" y="0" width="248" height="30" rx="6" fill="#d8f0de" stroke="#4a7c59"/>
      <text x="32" y="20" fill="#2e3230" font-weight="600">Cognitive empathy</text>
      <text x="300" y="20" fill="#4a4e4a">API design. Imagining the next caller.</text>
    </g>
    <g transform="translate(0,120)">
      <rect x="16" y="0" width="248" height="30" rx="6" fill="#f0e8db" stroke="#b83230" stroke-dasharray="4 3"/>
      <text x="32" y="20" fill="#2e3230" font-weight="600">Taste</text>
      <text x="300" y="20" fill="#b83230" font-style="italic">Uncalibrated. Nobody named this as the thing being judged.</text>
    </g>
    <g transform="translate(0,158)">
      <rect x="16" y="0" width="248" height="30" rx="6" fill="#d8f0de" stroke="#4a7c59"/>
      <text x="32" y="20" fill="#2e3230" font-weight="600">Strategic thinking</text>
      <text x="300" y="20" fill="#4a4e4a">Build vs buy. Tech debt payoff timing.</text>
    </g>
    <g transform="translate(0,196)">
      <rect x="16" y="0" width="248" height="30" rx="6" fill="#d8f0de" stroke="#4a7c59"/>
      <text x="32" y="20" fill="#2e3230" font-weight="600">Creative execution</text>
      <text x="300" y="20" fill="#4a4e4a">Architecture reviews. Structurally distinct options.</text>
    </g>
  </g>
</svg>
<figcaption>Rahul Pandey's six competencies minus domain expertise, with the five an engineer already exercises weekly on the left and taste flagged as uncalibrated rather than missing.</figcaption>
</figure>

The raw material is there, so what engineers need is a name for each move and a place to practice it where the stakes do not punish practice.

## The four moves, concretely

Each move corrects one anti-pattern, and once you can name the anti-pattern active in a room you can name the move that breaks it.

**Frame.** The stated problem is almost never the real problem, which means a complaint like *"users are churning"* is a symptom worth pushing past by asking what is upstream until the complaint would still be true if every proposed fix already existed.

**List.** A list of five variations of the same idea is really a list of one idea, so a real option space contains structurally distinct bets, and if the winner looks obvious before you have written the second option the list is too narrow.

**Optimize.** A tradeoff you cannot name is a preference, which is why the move is to state the criterion you are optimizing for and the thing you are explicitly giving up, along the lines of *"we ship speed at the cost of polish, because this audience forgives ugly before it forgives slow."*

**Win.** A recommendation that cannot be proven wrong is a hedge, not a recommendation, so a real call picks a direction, predicts a measurable result, and commits to a timeline that lets someone else disagree.

## Where this shows up in engineering language

The same four moves already live inside engineering work under different names, which is why the vocabulary transfers rather than having to be learned from scratch.

<figure>
<svg viewBox="0 0 720 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="FLOW moves mapped to engineering practices">
  <g font-family="Nunito Sans, sans-serif" font-size="12">
    <rect x="16" y="12" width="688" height="30" fill="#eae6de" stroke="#c4c8bc"/>
    <text x="32" y="32" font-weight="700" fill="#2e3230">FLOW move</text>
    <text x="200" y="32" font-weight="700" fill="#2e3230">Engineering version</text>
    <text x="440" y="32" font-weight="700" fill="#2e3230">Product version</text>

    <g transform="translate(0,42)">
      <rect x="16" y="0" width="688" height="40" fill="#faf6f0" stroke="#c4c8bc"/>
      <text x="32" y="24" fill="#4a7c59" font-weight="700">Frame</text>
      <text x="200" y="24" fill="#4a4e4a">Root-cause debugging</text>
      <text x="440" y="24" fill="#4a4e4a">Problem upstream of the stated complaint</text>
    </g>
    <g transform="translate(0,82)">
      <rect x="16" y="0" width="688" height="40" fill="#f5f1ea" stroke="#c4c8bc"/>
      <text x="32" y="24" fill="#6b6358" font-weight="700">List</text>
      <text x="200" y="24" fill="#4a4e4a">Architecture review options</text>
      <text x="440" y="24" fill="#4a4e4a">Structurally distinct solution paths</text>
    </g>
    <g transform="translate(0,122)">
      <rect x="16" y="0" width="688" height="40" fill="#faf6f0" stroke="#c4c8bc"/>
      <text x="32" y="24" fill="#705c30" font-weight="700">Optimize</text>
      <text x="200" y="24" fill="#4a4e4a">Build vs buy. Latency vs cost.</text>
      <text x="440" y="24" fill="#4a4e4a">Criterion named, sacrifice named</text>
    </g>
    <g transform="translate(0,162)">
      <rect x="16" y="0" width="688" height="40" fill="#f5f1ea" stroke="#c4c8bc"/>
      <text x="32" y="24" fill="#4a7c59" font-weight="700">Win</text>
      <text x="200" y="24" fill="#4a4e4a">PR with a rollout plan + metric</text>
      <text x="440" y="24" fill="#4a4e4a">Falsifiable recommendation + timeline</text>
    </g>
  </g>
</svg>
<figcaption>The same reasoning move expressed in two rooms, so that the engineering version is recognizable as the product version.</figcaption>
</figure>

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

That is the vocabulary to reach for in the next review meeting.`.trim()

// ── Chapter 2: Frame ─────────────────────────────────────────────────────────

const CHAPTER_2_BODY = `## The move

Frame is the reasoning move that finds the real problem by refusing to accept the stated one, because the stated problem is almost always a symptom of something further upstream.

Every decision starts with a framing, whether anyone names it or not, and the default framing in most rooms is whatever the loudest person said first. The move is to treat that opening framing as a hypothesis worth testing rather than a fact worth acting on, and the test is simple: ask what would still be true if every proposed solution already existed. If the complaint survives, the framing is too shallow and the real problem is upstream of it.

<figure>
<svg viewBox="0 0 720 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Upstream versus downstream framing">
  <defs>
    <marker id="arr2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#4a4e4a"/></marker>
  </defs>
  <g font-family="Nunito Sans, sans-serif" font-size="12">
    <text x="360" y="22" text-anchor="middle" font-weight="700" fill="#2e3230" font-size="13">Upstream of stated problem</text>

    <g transform="translate(40,44)">
      <rect width="200" height="56" rx="10" fill="#d8f0de" stroke="#4a7c59" stroke-width="1.5"/>
      <text x="100" y="26" text-anchor="middle" font-weight="700" fill="#2e3230">Root cause</text>
      <text x="100" y="44" text-anchor="middle" fill="#4a4e4a" font-size="11">Systemic condition</text>
    </g>
    <g transform="translate(280,44)">
      <rect width="200" height="56" rx="10" fill="#f0e8db" stroke="#6b6358" stroke-width="1.5"/>
      <text x="100" y="26" text-anchor="middle" font-weight="700" fill="#2e3230">Contributing factor</text>
      <text x="100" y="44" text-anchor="middle" fill="#4a4e4a" font-size="11">Makes the symptom worse</text>
    </g>
    <g transform="translate(520,44)">
      <rect width="160" height="56" rx="10" fill="#faf6f0" stroke="#b83230" stroke-width="1.5" stroke-dasharray="4 3"/>
      <text x="80" y="26" text-anchor="middle" font-weight="700" fill="#b83230">Stated problem</text>
      <text x="80" y="44" text-anchor="middle" fill="#b83230" font-size="11" font-style="italic">the symptom</text>
    </g>

    <line x1="240" y1="72" x2="278" y2="72" stroke="#4a4e4a" stroke-width="1.5" marker-end="url(#arr2)"/>
    <line x1="480" y1="72" x2="518" y2="72" stroke="#4a4e4a" stroke-width="1.5" marker-end="url(#arr2)"/>

    <text x="360" y="140" text-anchor="middle" font-weight="700" fill="#2e3230" font-size="13">The framing test</text>
    <text x="360" y="164" text-anchor="middle" fill="#4a4e4a">If every proposed fix already existed, would the complaint still be true?</text>
    <g transform="translate(160,186)">
      <rect width="170" height="36" rx="8" fill="#78a88644" stroke="#4a7c59"/>
      <text x="85" y="22" text-anchor="middle" fill="#2e3230">No → frame is real</text>
    </g>
    <g transform="translate(390,186)">
      <rect width="170" height="36" rx="8" fill="#f0e8db" stroke="#b83230"/>
      <text x="85" y="22" text-anchor="middle" fill="#b83230">Yes → frame is downstream</text>
    </g>
  </g>
</svg>
<figcaption>Every stated problem sits downstream of a real problem, so the job of Frame is to walk upstream until the complaint would no longer be true even if every proposed fix already existed.</figcaption>
</figure>

## A concrete example

In 2004, Gmail shipped with 1GB of free storage at a moment when Hotmail and Yahoo Mail capped users at 2MB and 4MB, and the product team had to decide whether the real problem was storage or something further upstream. The stated problem was that users kept hitting quota, but walking upstream revealed that users were deleting valuable mail to stay under quota, which meant the real problem was that email was being treated as temporary communication rather than a permanent archive. Fixing quota would have satisfied the stated problem; reframing email as an archive is what made Gmail a category-defining product.

The general pattern is that users stop complaining about problems they have learned to work around, so a good frame often shows up as something users have stopped asking for rather than something they are asking for loudly.

## Where engineers already do this

Root-cause debugging is Frame, because an engineer who finds that a test is failing never ships a fix to the test; they ask what change upstream made the test fail and fix that instead. The same move shows up in incident postmortems, where the Five Whys exercise exists specifically to keep the team from stopping at the symptom.

The harder application is in product framings, where the stated problem often comes from a credible source (a senior stakeholder, a customer interview, a dashboard alert) and refusing the frame feels like pushing back on the person who gave it. The move is the same, but the room treats it as insubordination rather than rigor.

## One handle to take with you

Frame is not "understand the problem more". It is "refuse to solve the problem you were handed until you have walked upstream far enough that the thing you are solving would stay true even if every proposed solution already existed."

Next: **List**, the move that widens the option space so the real winner is not the first thing anyone proposes.`.trim()

// ── Chapter 3: List ──────────────────────────────────────────────────────────

const CHAPTER_3_BODY = `## The move

List is the reasoning move that widens the option space on purpose, because the first list of options in any room is almost always a list of variations on a single idea rather than a set of genuinely different paths forward.

A real option list contains bets that are structurally distinct, meaning they are trying to solve different underlying jobs, making different tradeoffs, or betting on different assumptions about the future. A fake option list contains the same bet phrased three ways, which produces the illusion of choice without any real decision power. The test for whether a list is real is whether the options, if all four shipped independently, would produce materially different products or outcomes.

<figure>
<svg viewBox="0 0 720 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Structurally distinct options versus variations">
  <g font-family="Nunito Sans, sans-serif" font-size="12">
    <text x="170" y="22" text-anchor="middle" font-weight="700" fill="#b83230" font-size="13">Variations (fake list)</text>
    <text x="540" y="22" text-anchor="middle" font-weight="700" fill="#4a7c59" font-size="13">Structurally distinct (real list)</text>

    <g transform="translate(24,36)">
      <rect width="292" height="36" rx="8" fill="#f0e8db" stroke="#b83230" stroke-dasharray="4 3"/>
      <text x="16" y="22" fill="#2e3230" font-size="11">Ship onboarding A</text>
    </g>
    <g transform="translate(24,80)">
      <rect width="292" height="36" rx="8" fill="#f0e8db" stroke="#b83230" stroke-dasharray="4 3"/>
      <text x="16" y="22" fill="#2e3230" font-size="11">Ship onboarding A with a tooltip</text>
    </g>
    <g transform="translate(24,124)">
      <rect width="292" height="36" rx="8" fill="#f0e8db" stroke="#b83230" stroke-dasharray="4 3"/>
      <text x="16" y="22" fill="#2e3230" font-size="11">Ship onboarding A with a video intro</text>
    </g>
    <g transform="translate(24,168)">
      <rect width="292" height="36" rx="8" fill="#f0e8db" stroke="#b83230" stroke-dasharray="4 3"/>
      <text x="16" y="22" fill="#2e3230" font-size="11">Ship onboarding A with both</text>
    </g>
    <text x="170" y="228" text-anchor="middle" fill="#b83230" font-size="11" font-style="italic">All four solve the same job the same way.</text>

    <g transform="translate(394,36)">
      <rect width="292" height="36" rx="8" fill="#d8f0de" stroke="#4a7c59"/>
      <text x="16" y="22" fill="#2e3230" font-size="11">Onboarding teaches the product</text>
    </g>
    <g transform="translate(394,80)">
      <rect width="292" height="36" rx="8" fill="#d8f0de" stroke="#4a7c59"/>
      <text x="16" y="22" fill="#2e3230" font-size="11">Defaults remove the need to learn</text>
    </g>
    <g transform="translate(394,124)">
      <rect width="292" height="36" rx="8" fill="#d8f0de" stroke="#4a7c59"/>
      <text x="16" y="22" fill="#2e3230" font-size="11">Human-led setup for first 100 users</text>
    </g>
    <g transform="translate(394,168)">
      <rect width="292" height="36" rx="8" fill="#d8f0de" stroke="#4a7c59"/>
      <text x="16" y="22" fill="#2e3230" font-size="11">Narrow the audience until onboarding is unnecessary</text>
    </g>
    <text x="540" y="228" text-anchor="middle" fill="#4a7c59" font-size="11" font-style="italic">Each one bets on a different job the product is doing.</text>
  </g>
</svg>
<figcaption>A list of four onboarding variations is really one option, while a list of four structurally distinct bets forces a real decision about what onboarding is for in the first place.</figcaption>
</figure>

## A concrete example

When Instagram launched Stories in 2016, the option that won was not on the Instagram team's original list, because Snapchat had spent two years building the "ephemeral content" job and Instagram's own list was full of variations on photo feeds. The move Kevin Systrom's team made was to treat the Snapchat product as a listed option rather than a competitor, which widened the space far enough to include "copy the job, not the features" as a real path forward. That option shipped, ate Snapchat's growth, and changed what Instagram was.

The pattern is that the best option is often one someone outside the room has already built, and refusing to list it because it feels like copying is what keeps weak option lists small.

## Where engineers already do this

Architecture reviews do List well when they work, because the format forces the team to write out structurally different approaches (synchronous vs event-driven, monolith vs service, rewrite vs incremental migration) before picking one. A good ADR names two or three options that would each produce a different system, not three variations of the same system with different function names.

Where engineering teams go wrong on List is in sprint planning, where the list of options is almost always "which of these tickets do we do", never "is any ticket on this list the right thing to build". That is the same failure mode as a product team listing four onboarding tweaks when the real option space includes "no onboarding at all".

## One handle to take with you

List is not "generate more options". It is "make sure every option on the list is a different bet", and the check is whether each option, if it shipped alone, would produce a materially different outcome.

Next: **Optimize**, the move that takes a real option list and turns it into a decision by naming what you are optimizing for and what you are giving up.`.trim()

// ── Chapter 4: Optimize ──────────────────────────────────────────────────────

const CHAPTER_4_BODY = `## The move

Optimize is the reasoning move that turns a list of real options into a decision by naming both the thing you are optimizing for and the thing you are explicitly giving up, because a tradeoff without a named sacrifice is a preference dressed up as analysis.

Every decision between structurally distinct options involves a tradeoff, and the tradeoff is only legible if both sides are named out loud. Saying "we picked option B because it is better" is a preference. Saying "we picked option B because it optimizes for time to first value, which means we are giving up the surface area option C would have covered, and we think time to first value matters more for this audience" is a tradeoff. The second version can be disagreed with on specific grounds; the first version cannot be disagreed with at all.

<figure>
<svg viewBox="0 0 720 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Criterion and sacrifice paired">
  <g font-family="Nunito Sans, sans-serif" font-size="12">
    <g transform="translate(60,40)">
      <rect width="260" height="120" rx="14" fill="#d8f0de" stroke="#4a7c59" stroke-width="1.5"/>
      <text x="130" y="30" text-anchor="middle" font-weight="700" fill="#2e3230" font-size="14">Criterion</text>
      <text x="130" y="54" text-anchor="middle" fill="#4a4e4a" font-size="11">What you are optimizing for</text>
      <text x="130" y="84" text-anchor="middle" fill="#2e3230" font-style="italic" font-size="11">"Time to first value"</text>
      <text x="130" y="104" text-anchor="middle" fill="#4a4e4a" font-size="10">Specific, measurable, debatable</text>
    </g>

    <g transform="translate(400,40)">
      <rect width="260" height="120" rx="14" fill="#f0e8db" stroke="#b83230" stroke-width="1.5"/>
      <text x="130" y="30" text-anchor="middle" font-weight="700" fill="#b83230" font-size="14">Sacrifice</text>
      <text x="130" y="54" text-anchor="middle" fill="#4a4e4a" font-size="11">What you are explicitly giving up</text>
      <text x="130" y="84" text-anchor="middle" fill="#2e3230" font-style="italic" font-size="11">"Surface area across features"</text>
      <text x="130" y="104" text-anchor="middle" fill="#4a4e4a" font-size="10">Named out loud, not implied</text>
    </g>

    <text x="360" y="186" text-anchor="middle" font-weight="700" fill="#2e3230">Both named → tradeoff.  Only one named → preference.</text>
  </g>
</svg>
<figcaption>A real tradeoff names both sides explicitly, because the sacrifice is what lets someone else disagree with the decision on specific grounds rather than on taste.</figcaption>
</figure>

## A concrete example

When Shopify decided in 2019 to let Amazon become the default fulfillment layer for many of its merchants rather than building out Shopify Fulfillment Network as a full counter, it named the tradeoff clearly: they optimized for merchant reach over platform lock-in, and they gave up the revenue that owning fulfillment end-to-end would have produced. The decision was controversial, and Tobi Lutke reversed parts of it later, but the fact that the original decision named both the criterion and the sacrifice is why a reversal was even possible. A decision made on preference alone cannot be revisited because nobody can point to what changed.

The pattern is that decisions made with both sides named become legible to the team, and decisions made with only the upside named become personality-dependent.

## Where engineers already do this

Latency vs cost is a canonical engineering tradeoff that works because both sides are named: "we are optimizing for p99 latency at the cost of a 3x infra bill, because this is on the hot path for a paying tier". Build vs buy is another one: "we are buying Stripe at the cost of 2.9% on every transaction, because integrating Stripe costs two engineer-weeks and building a payments stack costs two engineer-years".

Engineers go wrong on Optimize when the sacrifice is implicit. "We refactored the auth module" sounds like a statement of fact, but the decision underneath it optimized for future velocity at the cost of current sprint capacity, and if the sacrifice was never named the PR will land as a surprise on anyone who expected that sprint capacity to go to shipping features.

## One handle to take with you

Optimize is not "pick the best option". It is "pick an option and name the sacrifice", and the test for whether you have done it is whether someone reading your decision could disagree with it on specific grounds rather than on taste.

Next: **Win**, the move that turns a decision into a recommendation someone could prove wrong.`.trim()

// ── Chapter 5: Win ───────────────────────────────────────────────────────────

const CHAPTER_5_BODY = `## The move

Win is the reasoning move that turns a decision into a recommendation by making it falsifiable, because a recommendation that cannot be proven wrong is a hedge rather than a call.

A real recommendation has three parts that travel together: a direction (what to do), a predicted result (what outcome will follow), and a timeline (by when). Each part is what makes the next part possible: the direction is what someone can execute, the predicted result is what someone can disagree with, and the timeline is what lets the team know when to come back and check. Drop any one of the three and the recommendation degrades into a status update.

<figure>
<svg viewBox="0 0 720 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Anatomy of a falsifiable recommendation">
  <g font-family="Nunito Sans, sans-serif" font-size="12">
    <g transform="translate(32,40)">
      <rect width="204" height="120" rx="14" fill="#d8f0de" stroke="#4a7c59" stroke-width="1.5"/>
      <text x="102" y="28" text-anchor="middle" font-weight="700" fill="#2e3230" font-size="14">Direction</text>
      <text x="102" y="50" text-anchor="middle" fill="#4a4e4a" font-size="11">What to do</text>
      <text x="102" y="80" text-anchor="middle" fill="#2e3230" font-style="italic" font-size="11">"Ship the two-click flow"</text>
      <text x="102" y="100" text-anchor="middle" fill="#4a4e4a" font-size="10">Concrete, executable</text>
    </g>
    <g transform="translate(258,40)">
      <rect width="204" height="120" rx="14" fill="#c4a66a33" stroke="#705c30" stroke-width="1.5"/>
      <text x="102" y="28" text-anchor="middle" font-weight="700" fill="#2e3230" font-size="14">Predicted result</text>
      <text x="102" y="50" text-anchor="middle" fill="#4a4e4a" font-size="11">What outcome follows</text>
      <text x="102" y="80" text-anchor="middle" fill="#2e3230" font-style="italic" font-size="11">"Activation up 8%"</text>
      <text x="102" y="100" text-anchor="middle" fill="#4a4e4a" font-size="10">Measurable, disputable</text>
    </g>
    <g transform="translate(484,40)">
      <rect width="204" height="120" rx="14" fill="#78a88644" stroke="#4a7c59" stroke-width="1.5"/>
      <text x="102" y="28" text-anchor="middle" font-weight="700" fill="#2e3230" font-size="14">Timeline</text>
      <text x="102" y="50" text-anchor="middle" fill="#4a4e4a" font-size="11">By when</text>
      <text x="102" y="80" text-anchor="middle" fill="#2e3230" font-style="italic" font-size="11">"Within 4 weeks"</text>
      <text x="102" y="100" text-anchor="middle" fill="#4a4e4a" font-size="10">Bounded, checkable</text>
    </g>
    <text x="360" y="192" text-anchor="middle" font-weight="700" fill="#b83230">Missing any one piece collapses the recommendation into a hedge.</text>
  </g>
</svg>
<figcaption>A falsifiable recommendation is a direction, a predicted result, and a timeline travelling together, because the three pieces are what make it possible for someone to check whether the recommendation was right.</figcaption>
</figure>

## A concrete example

Netflix's 2013 decision to move from quantity to quality on original content was a real recommendation rather than a preference because it came with all three parts named: direction was "invest in fewer, larger original productions", predicted result was "subscriber retention rises and acquisition cost falls as word of mouth compounds", and timeline was "over the next three to four years, with the first data from House of Cards within 18 months". Ten years later, the evidence would have been unambiguous either way, and the fact that Netflix could have been proven wrong is exactly what made the call a call.

The pattern is that recommendations which cannot be disagreed with cannot be acted on either, because the team has nothing to check against when the timeline comes due.

## Where engineers already do this

A good PR description has all three parts: "this PR migrates the notification queue from Redis to SQS (direction), so p99 enqueue latency will drop from 40ms to under 10ms (predicted result), which we will verify in staging this week before the next release (timeline)." A PR that says "cleanup of notification infrastructure" has none of the three, and the reviewer has nothing to push back on except personal taste.

Rollout plans are the other place this shows up. A rollout that says "ship to 1%, then 10%, then 100% as metrics allow" is a hedge dressed up as a plan; a rollout that says "ship to 1% and hold for 48 hours, expanding if conversion stays within 2% of control, rolling back if error rate exceeds X" is a real recommendation that someone else could prove wrong.

## One handle to take with you

Win is not "be confident". It is "make a claim someone could prove wrong by a specific date", and the test for whether you have done it is whether a teammate could sincerely disagree with the predicted result on evidence.

Next: **The seven themes**, which map the four FLOW moves onto the seven reasoning traditions the rubric is compressing.`.trim()

// ── Chapter 6: Seven themes ──────────────────────────────────────────────────

const CHAPTER_6_BODY = `## The move

FLOW is a compression of seven reasoning traditions, so understanding which tradition each move is drawing from makes the move legible in rooms where the tradition is named by its original author rather than by its FLOW label.

The four moves (Frame, List, Optimize, Win) are the operational layer, and the seven themes (T1 through T7) are the reasoning layer that justifies why each move is the right move. This chapter is a map: for each FLOW step, which theme is the primary reasoning move being trained, which thinker named the tradition, and what anti-pattern the theme catches.

<figure>
<svg viewBox="0 0 720 460" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="FLOW moves mapped to seven intellectual themes">
  <g font-family="Nunito Sans, sans-serif" font-size="11">
    <rect x="16" y="12" width="688" height="32" fill="#eae6de" stroke="#c4c8bc"/>
    <text x="32" y="32" font-weight="700" fill="#2e3230">FLOW step</text>
    <text x="140" y="32" font-weight="700" fill="#2e3230">Theme</text>
    <text x="320" y="32" font-weight="700" fill="#2e3230">Tradition (primary thinker)</text>
    <text x="520" y="32" font-weight="700" fill="#2e3230">Anti-pattern caught</text>

    <g transform="translate(0,46)">
      <rect x="16" y="0" width="688" height="54" fill="#d8f0de" stroke="#4a7c59"/>
      <text x="32" y="22" font-weight="700" fill="#4a7c59">Frame</text>
      <text x="140" y="22" fill="#2e3230" font-weight="600">T1. Upstream Before Downstream</text>
      <text x="320" y="22" fill="#4a4e4a">Shreyas Doshi, Marty Cagan</text>
      <text x="520" y="22" fill="#4a4e4a">Accepting the stated problem as real</text>
      <text x="140" y="42" fill="#2e3230" font-weight="600">T6. Exclusion Is Precision</text>
      <text x="320" y="42" fill="#4a4e4a">April Dunford</text>
      <text x="520" y="42" fill="#4a4e4a">Scope taken as given, not chosen</text>
    </g>
    <g transform="translate(0,106)">
      <rect x="16" y="0" width="688" height="54" fill="#f0e8db" stroke="#6b6358"/>
      <text x="32" y="22" font-weight="700" fill="#6b6358">List</text>
      <text x="140" y="22" fill="#2e3230" font-weight="600">T4. Width Before Depth</text>
      <text x="320" y="22" fill="#4a4e4a">Rahul Pandey, Gergely Orosz</text>
      <text x="520" y="22" fill="#4a4e4a">Variations presented as an option space</text>
      <text x="140" y="42" fill="#2e3230" font-weight="600">T2. The Job Behind the Feature</text>
      <text x="320" y="42" fill="#4a4e4a">Ben Erez, Clayton Christensen</text>
      <text x="520" y="42" fill="#4a4e4a">Treating the feature as the job</text>
    </g>
    <g transform="translate(0,166)">
      <rect x="16" y="0" width="688" height="54" fill="#c4a66a33" stroke="#705c30"/>
      <text x="32" y="22" font-weight="700" fill="#705c30">Optimize</text>
      <text x="140" y="22" fill="#2e3230" font-weight="600">T5. Name Criterion and Sacrifice</text>
      <text x="320" y="22" fill="#4a4e4a">Gergely Orosz, Rahul Pandey</text>
      <text x="520" y="22" fill="#4a4e4a">"It depends" as a conclusion</text>
      <text x="140" y="42" fill="#4a4e4a" font-style="italic">(primary theme; no secondary)</text>
    </g>
    <g transform="translate(0,226)">
      <rect x="16" y="0" width="688" height="54" fill="#78a88644" stroke="#4a7c59"/>
      <text x="32" y="22" font-weight="700" fill="#4a7c59">Win</text>
      <text x="140" y="22" fill="#2e3230" font-weight="600">T7. Falsifiable Hypothesis</text>
      <text x="320" y="22" fill="#4a4e4a">Marty Cagan, Gibson Biddle</text>
      <text x="520" y="22" fill="#4a4e4a">Qualitative success, no metric</text>
      <text x="140" y="42" fill="#2e3230" font-weight="600">T3. Simulate the Other Side</text>
      <text x="320" y="42" fill="#4a4e4a">Rahul Pandey</text>
      <text x="520" y="42" fill="#4a4e4a">Handing ownership to "the team"</text>
    </g>

    <rect x="16" y="300" width="688" height="32" fill="#eae6de" stroke="#c4c8bc"/>
    <text x="32" y="320" font-weight="700" fill="#2e3230" font-size="12">Thinker summary</text>

    <text x="32" y="350" fill="#2e3230" font-weight="700">Shreyas Doshi</text>
    <text x="180" y="350" fill="#4a4e4a">Upstream influence, high-agency work, leverage/neutral/overhead model</text>

    <text x="32" y="372" fill="#2e3230" font-weight="700">April Dunford</text>
    <text x="180" y="372" fill="#4a4e4a">Positioning as exclusion, precision comes from what is out</text>

    <text x="32" y="394" fill="#2e3230" font-weight="700">Marty Cagan, Gibson Biddle</text>
    <text x="220" y="394" fill="#4a4e4a">Outcome-based product, DHM model, strategy bets</text>

    <text x="32" y="416" fill="#2e3230" font-weight="700">Rahul Pandey</text>
    <text x="180" y="416" fill="#4a4e4a">Product sense as six competencies, width before depth</text>

    <text x="32" y="438" fill="#2e3230" font-weight="700">Gergely Orosz</text>
    <text x="180" y="438" fill="#4a4e4a">The product engineer, named tradeoffs over preference</text>
  </g>
</svg>
<figcaption>Each FLOW step maps to one primary theme and often a secondary one, with each theme tracing back to a named thinker whose work is the source material the rubric compresses.</figcaption>
</figure>

## Why the themes matter operationally

Every time Luma grades an answer, the output includes a \`theme_signal\` block that names which theme was engaged and whether the reasoning move was applied correctly, because a grade without a theme attached is just a score. The theme is what makes the feedback actionable: knowing you scored low on Frame is not useful, knowing you scored low because you accepted the stated problem as real (T1) points at the specific reasoning move to practice next.

The seven themes also show up in the admin content-authoring pipeline, where the MCQ prompt injects the primary theme's reasoning move into the generation call so that the BEST option actually applies T1 or T4 or T5 rather than generic product advice.

## Where engineers already do this

Engineers who have read *A Philosophy of Software Design* (Ousterhout) or *Working Effectively with Legacy Code* (Feathers) already carry several of these themes in their engineering practice, because good engineering and good product thinking share the same set of reasoning moves applied to different surfaces. An engineer who names the sacrifice when picking a caching strategy is doing T5, and an engineer who refuses to fix a flaky test without finding the upstream race condition is doing T1.

The difference is that in engineering the themes are baked into the culture through code review norms and postmortem templates, while in product thinking they often have to be named explicitly because the feedback loop is slower and the anti-patterns hide longer.

## One handle to take with you

The themes are not new ideas, they are a compression of seven named traditions into one rubric, so that when a room invokes "Shreyas says do the upstream thing" or "Dunford says positioning is exclusion" you can recognize which FLOW move is being named and respond on the same layer.

Next: **Engineer to product**, the chapter that names what engineers already bring and the one specific competency that needs new reps.`.trim()

// ── Chapter 7: Engineer to product ───────────────────────────────────────────

const CHAPTER_7_BODY = `## The move

The transition from engineer to product thinker is not a rebuild, because five of the six competencies that define product sense are already active in engineering work; the rebuild is limited to a single competency that the engineering environment never asks you to practice in the open.

Rahul Pandey's six competencies are motivation theory, cognitive empathy, taste, strategic thinking, creative execution, and domain expertise, and five of those six have visible engineering analogs that most engineers have been exercising for years. The one that tends to arrive uncalibrated is taste, because engineering culture rewards correctness over preference and taste is specifically the skill of feeling the difference between a real tradeoff and a preference before anyone has named it out loud.

<figure>
<svg viewBox="0 0 720 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="What engineers already bring and what needs new reps">
  <g font-family="Nunito Sans, sans-serif" font-size="11">
    <rect x="16" y="12" width="688" height="32" fill="#eae6de" stroke="#c4c8bc"/>
    <text x="32" y="32" font-weight="700" fill="#2e3230">Competency</text>
    <text x="220" y="32" font-weight="700" fill="#2e3230">Engineering analog (already fluent)</text>
    <text x="500" y="32" font-weight="700" fill="#2e3230">Product use</text>

    <g transform="translate(0,46)">
      <rect x="16" y="0" width="688" height="38" fill="#d8f0de" stroke="#4a7c59"/>
      <text x="32" y="24" fill="#2e3230" font-weight="600">Motivation theory</text>
      <text x="220" y="24" fill="#4a4e4a">On-call rotations, why users rage, why metrics move</text>
      <text x="500" y="24" fill="#4a4e4a">User friction, activation drops</text>
    </g>
    <g transform="translate(0,88)">
      <rect x="16" y="0" width="688" height="38" fill="#d8f0de" stroke="#4a7c59"/>
      <text x="32" y="24" fill="#2e3230" font-weight="600">Cognitive empathy</text>
      <text x="220" y="24" fill="#4a4e4a">API design, imagining the next caller</text>
      <text x="500" y="24" fill="#4a4e4a">Stakeholder positions, UX</text>
    </g>
    <g transform="translate(0,130)">
      <rect x="16" y="0" width="688" height="38" fill="#f0e8db" stroke="#b83230" stroke-dasharray="4 3"/>
      <text x="32" y="24" fill="#2e3230" font-weight="600">Taste</text>
      <text x="220" y="24" fill="#b83230" font-style="italic">Uncalibrated, not missing</text>
      <text x="500" y="24" fill="#b83230" font-style="italic">Real tradeoff vs preference</text>
    </g>
    <g transform="translate(0,172)">
      <rect x="16" y="0" width="688" height="38" fill="#d8f0de" stroke="#4a7c59"/>
      <text x="32" y="24" fill="#2e3230" font-weight="600">Strategic thinking</text>
      <text x="220" y="24" fill="#4a4e4a">Build vs buy, tech debt payoff timing</text>
      <text x="500" y="24" fill="#4a4e4a">Competitive positioning, roadmap bets</text>
    </g>
    <g transform="translate(0,214)">
      <rect x="16" y="0" width="688" height="38" fill="#d8f0de" stroke="#4a7c59"/>
      <text x="32" y="24" fill="#2e3230" font-weight="600">Creative execution</text>
      <text x="220" y="24" fill="#4a4e4a">Architecture reviews, structurally distinct options</text>
      <text x="500" y="24" fill="#4a4e4a">Widening the option space</text>
    </g>
    <g transform="translate(0,256)">
      <rect x="16" y="0" width="688" height="38" fill="#d8f0de" stroke="#4a7c59"/>
      <text x="32" y="24" fill="#2e3230" font-weight="600">Domain expertise</text>
      <text x="220" y="24" fill="#4a4e4a">Performance budgets, real latency thresholds</text>
      <text x="500" y="24" fill="#4a4e4a">Real metrics, real timelines</text>
    </g>
  </g>
</svg>
<figcaption>Five of the six competencies carry across from engineering without retraining, which leaves taste as the single skill most engineers need new practice in before it becomes legible to a product room.</figcaption>
</figure>

## Why taste is the one that needs reps

Taste is the skill of recognizing which tradeoff is the real one before anyone has named the criterion and sacrifice explicitly, which means taste is the competency that shows up earliest in a product conversation and cannot be substituted by more analysis. An engineer with calibrated taste can walk into a debate between two options and say "the real question is not A versus B, it is whether we are optimizing for retention or for acquisition, and if it is retention then A is obvious", which collapses a twenty-minute argument into two sentences.

Engineering culture does not punish weak taste because engineering decisions usually come with a correctness signal (the tests pass, the latency is within budget, the build is green). Product decisions often lack a correctness signal at the moment the decision is made, which is why taste has to carry more weight in product rooms, and why practicing taste outside the cost-of-being-wrong feedback loop is the specific value HackProduct adds.

## What engineers already bring that most PMs envy

The inverse is also true: strategic thinking that is grounded in actual system behavior, cognitive empathy shaped by designing APIs that other humans have to use, and creative execution that has been tested against real failure modes are all harder to develop than taste alone. A product engineer with calibrated taste is consistently the strongest product thinker in the room, because the five engineering-native competencies act as a grounding force that keeps the product thinking honest.

Gergely Orosz names this "the product engineer" and argues it is the most undervalued role in most companies, which tracks with what people mean when they say "Stripe-style engineer" or "Linear-style engineer": an engineer whose product instincts are calibrated enough to replace much of what a PM traditionally did, not because the PM role is unnecessary but because the tradeoffs are legible earlier.

## One handle to take with you

The engineer-to-product transition is not a rebuild, it is a calibration of taste, which the rest of HackProduct exists to let you practice without the real cost of being wrong.

Next: **Using FLOW live**, which puts the four moves together in the room where the clock is ticking.`.trim()

// ── Chapter 8: Using FLOW live ───────────────────────────────────────────────

const CHAPTER_8_BODY = `## The move

FLOW is a sequence, and using it live means knowing which of the four moves the room needs next rather than running all four in order every time, because meetings move faster than a rubric and a ten-minute product review will rarely accommodate a full Frame-List-Optimize-Win pass.

The reading skill is recognizing which move is missing from the conversation already happening, because rooms tend to skip moves rather than do them badly. If everyone is arguing about which option wins, the missing move is usually Frame (they are optimizing the wrong problem) or List (they are choosing between two variations of the same bet). If the direction is clear but the team is hesitant, the missing move is usually Win (no one has named the falsifiable prediction) or Optimize (no one has named the sacrifice). Naming the missing move out loud is what unsticks the conversation.

<figure>
<svg viewBox="0 0 720 360" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Reading which FLOW move a room needs next">
  <g font-family="Nunito Sans, sans-serif" font-size="11">
    <rect x="16" y="12" width="688" height="32" fill="#eae6de" stroke="#c4c8bc"/>
    <text x="32" y="32" font-weight="700" fill="#2e3230">If the room is...</text>
    <text x="380" y="32" font-weight="700" fill="#2e3230">The missing move is...</text>

    <g transform="translate(0,46)">
      <rect x="16" y="0" width="688" height="38" fill="#faf6f0" stroke="#c4c8bc"/>
      <text x="32" y="24" fill="#4a4e4a">Arguing about which option wins</text>
      <text x="380" y="24" fill="#4a7c59" font-weight="700">Frame</text>
      <text x="500" y="24" fill="#4a4e4a" font-size="10">(probably optimizing the wrong problem)</text>
    </g>
    <g transform="translate(0,88)">
      <rect x="16" y="0" width="688" height="38" fill="#f5f1ea" stroke="#c4c8bc"/>
      <text x="32" y="24" fill="#4a4e4a">Presenting variations that feel identical</text>
      <text x="380" y="24" fill="#6b6358" font-weight="700">List</text>
      <text x="500" y="24" fill="#4a4e4a" font-size="10">(fake option space disguised as choice)</text>
    </g>
    <g transform="translate(0,130)">
      <rect x="16" y="0" width="688" height="38" fill="#faf6f0" stroke="#c4c8bc"/>
      <text x="32" y="24" fill="#4a4e4a">Stuck on "it depends"</text>
      <text x="380" y="24" fill="#705c30" font-weight="700">Optimize</text>
      <text x="500" y="24" fill="#4a4e4a" font-size="10">(criterion and sacrifice not named)</text>
    </g>
    <g transform="translate(0,172)">
      <rect x="16" y="0" width="688" height="38" fill="#f5f1ea" stroke="#c4c8bc"/>
      <text x="32" y="24" fill="#4a4e4a">Direction clear but team hesitant</text>
      <text x="380" y="24" fill="#4a7c59" font-weight="700">Win</text>
      <text x="500" y="24" fill="#4a4e4a" font-size="10">(no falsifiable prediction + timeline)</text>
    </g>
    <g transform="translate(0,214)">
      <rect x="16" y="0" width="688" height="38" fill="#faf6f0" stroke="#c4c8bc"/>
      <text x="32" y="24" fill="#4a4e4a">Loudest person has the winning idea</text>
      <text x="380" y="24" fill="#4a7c59" font-weight="700">Frame</text>
      <text x="500" y="24" fill="#4a4e4a" font-size="10">(defaulted to stated problem, never tested)</text>
    </g>
    <g transform="translate(0,256)">
      <rect x="16" y="0" width="688" height="38" fill="#f5f1ea" stroke="#c4c8bc"/>
      <text x="32" y="24" fill="#4a4e4a">Recommendation has no deadline</text>
      <text x="380" y="24" fill="#4a7c59" font-weight="700">Win</text>
      <text x="500" y="24" fill="#4a4e4a" font-size="10">(timeline missing, check-in never scheduled)</text>
    </g>
    <g transform="translate(0,298)">
      <rect x="16" y="0" width="688" height="38" fill="#faf6f0" stroke="#c4c8bc"/>
      <text x="32" y="24" fill="#4a4e4a">Team agrees too quickly</text>
      <text x="380" y="24" fill="#6b6358" font-weight="700">List</text>
      <text x="500" y="24" fill="#4a4e4a" font-size="10">(option space is too narrow to disagree)</text>
    </g>
  </g>
</svg>
<figcaption>Most real decisions fail because one of the four moves was skipped rather than done badly, and the live skill is naming the missing move out loud before the room commits to the wrong thing.</figcaption>
</figure>

## A 20-minute product review using FLOW live

The practical skill is a loose sequence that fits inside a normal meeting slot. Spend the first three or four minutes on Frame by asking what would still be true if every proposed fix already existed, which surfaces whether the stated problem is the real one and often ends the meeting early if the frame is wrong. Spend the next five minutes on List, explicitly naming the structurally distinct options rather than the variations, which is usually where disagreements about taste start to show up productively.

The middle eight minutes belong to Optimize, where someone names the criterion the decision will be made on and the sacrifice the winning option will require, and this is the part of the meeting where a strong product engineer earns their value because they can name the sacrifice in the language of the system rather than in the language of preference. The final three or four minutes are Win, where the direction, predicted result, and timeline get written down in a place the team can come back to when the timeline arrives.

## Where engineers already do this

Incident command structure uses the same shape: the incident commander frames what is actually broken (not what the alert said), lists the structurally distinct mitigations (rollback, hotfix, traffic redirect), optimizes by naming the criterion (minimize blast radius vs minimize customer-visible downtime) and the sacrifice, then commits to a direction with a timeline ("roll back now, hotfix within 30 minutes, postmortem by end of day"). The cadence transfers directly to product rooms; only the vocabulary changes.

The difference is that incident command has a norm that keeps the commander from skipping moves, while product rooms rely on whichever participant notices a missing move and is willing to name it. Building that norm is what the rest of HackProduct's practice challenges are for.

## One handle to take with you

FLOW live is not a script you run through, it is a reading skill for naming which of the four moves the current conversation has skipped, and the conversation will usually fix itself the moment the skipped move is spoken out loud.

That is the end of the module. The next step is practice: pick a challenge tagged with the FLOW step you feel least sure about and run the move against a scenario where the stakes do not punish the practice.`.trim()

const PLACEHOLDER_BODY = '## In draft\n\nThis chapter is being written. Check back soon.'

const CHAPTERS = [
  {
    slug: 'why-flow',
    title: 'Why FLOW',
    subtitle: 'And why engineers with strong intuition freeze in product reviews.',
    hook_text: 'Engineers do not lack product intuition. They lack vocabulary and reps.',
    body_mdx: CHAPTER_1_BODY,
    sort_order: 1,
  },
  {
    slug: 'frame',
    title: 'Frame',
    subtitle: 'The real problem is never the stated one.',
    hook_text: 'The stated problem is the enemy of the real problem.',
    body_mdx: CHAPTER_2_BODY,
    sort_order: 2,
  },
  {
    slug: 'list',
    title: 'List',
    subtitle: 'The options you missed matter more than the ones you found.',
    hook_text: 'A list of five variations of one idea is a list of one idea.',
    body_mdx: CHAPTER_3_BODY,
    sort_order: 3,
  },
  {
    slug: 'optimize',
    title: 'Optimize',
    subtitle: 'Name the criterion. Name the sacrifice.',
    hook_text: 'A tradeoff you cannot name is a preference, not a tradeoff.',
    body_mdx: CHAPTER_4_BODY,
    sort_order: 4,
  },
  {
    slug: 'win',
    title: 'Win',
    subtitle: 'A recommendation is a falsifiable hypothesis.',
    hook_text: 'If you cannot say what would prove you wrong, you are not recommending.',
    body_mdx: CHAPTER_5_BODY,
    sort_order: 5,
  },
  {
    slug: 'seven-themes',
    title: 'The seven themes behind the rubric',
    subtitle: 'Which reasoning move each FLOW step is training, and which tradition it comes from.',
    hook_text: 'FLOW is the compression. These are the traditions it compresses.',
    body_mdx: CHAPTER_6_BODY,
    sort_order: 6,
  },
  {
    slug: 'engineer-to-product',
    title: 'Engineer to product',
    subtitle: 'What engineers already have. What engineers still need.',
    hook_text: 'Five of the six competencies are already in your week. One is not.',
    body_mdx: CHAPTER_7_BODY,
    sort_order: 7,
  },
  {
    slug: 'using-flow-live',
    title: 'Using FLOW live',
    subtitle: 'In a meeting, in a review, in an interview.',
    hook_text: 'The four moves when the clock is ticking and the CEO is watching.',
    body_mdx: CHAPTER_8_BODY,
    sort_order: 8,
  },
]

async function run() {
  console.log(`[seed-flow-module] Upserting module "${MODULE_SLUG}"...`)
  const { data: mod, error: modErr } = await supabase
    .from('learn_modules')
    .upsert(MODULE_ROW, { onConflict: 'slug' })
    .select('id, slug, name')
    .single()

  if (modErr || !mod) {
    console.error('[seed-flow-module] Failed to upsert module:', modErr)
    process.exit(1)
  }
  console.log(`[seed-flow-module] ✓ module: ${mod.slug} (${mod.id})`)

  console.log(`[seed-flow-module] Upserting ${CHAPTERS.length} chapters...`)
  for (const ch of CHAPTERS) {
    const { error: chErr } = await supabase
      .from('learn_chapters')
      .upsert(
        { module_id: mod.id, ...ch },
        { onConflict: 'module_id,slug' }
      )
    if (chErr) {
      console.error(`[seed-flow-module] ✗ chapter "${ch.slug}" failed:`, chErr)
      process.exit(1)
    }
    const isPlaceholder = ch.body_mdx === PLACEHOLDER_BODY
    console.log(`  ${isPlaceholder ? '○' : '●'} ${ch.sort_order}. ${ch.slug} — ${ch.title}`)
  }

  console.log('\n[seed-flow-module] Done.')
  console.log(`[seed-flow-module] Visit http://localhost:3000/learn/${MODULE_SLUG} to review.`)
}

run().catch(err => {
  console.error('[seed-flow-module] Fatal:', err)
  process.exit(1)
})

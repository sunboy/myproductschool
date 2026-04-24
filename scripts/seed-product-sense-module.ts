// scripts/seed-product-sense-module.ts
//
// Seeds Product Sense module prose + structured figures.
// Run: npx tsx --tsconfig tsconfig.json scripts/seed-product-sense-module.ts

import { createClient } from '@supabase/supabase-js'
import type { ChapterFigure } from '../src/lib/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const MODULE_SLUG = 'product-sense'

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
  body_mdx: `## The claim

Engineers who get told they "lack product sense" almost always made the move and could not name it, and the failure is about vocabulary rather than reasoning.

Every week, most engineers exercise the raw material of product thinking without calling it that. Root-cause debugging is problem framing. API design is user empathy. Build-versus-buy is tradeoff naming. PR rollout plans are falsifiable recommendations. The reasoning is already happening, it is just happening under engineering labels, which means product rooms do not see it and the engineer does not realize they did it. Jules Walter defines product sense in Lenny's Newsletter as "the skill of consistently being able to craft products that have the intended impact on their users", and the two pillars he names, empathy and creativity, are both present in strong engineering work.

## The same move, different room

<!-- figure:0 -->

## The canonical framing

Gergely Orosz wrote the canonical definition in 2019 after years at Uber, Microsoft, Skype, and Skyscanner, and his version is worth quoting exactly: "Product-minded engineers are developers with lots of interest in the product itself. They want to understand why decisions are made, how people use the product, and love to be involved in making product decisions." Marty Cagan's *Empowered* (2020) pushes the framing further: an empowered engineer is not someone who figures out the best way to code something, an empowered engineer figures out the best way to solve a problem. Both are naming the same thing the reader has probably been doing intermittently for years without the label.

## Where engineers already do this

The strongest engineer-led products in recent memory (Stripe, Linear, Figma) ran for years without dedicated PMs on core surfaces, not because product thinking was absent but because the engineers already had it and the culture named their calls as product decisions rather than implementation details. Shopify's former Head of Engineering Jean-Michel Lemieux, cited in Orosz's essay, described product engineers as those who engage with the "why" actively and understand that "minimum lovable products need the right depth" during building. The lack was never intuition. It was a label for the intuition.

## One handle to take with you

The fastest way to acquire product sense is not to learn new skills but to name the reasoning moves you already make, which turns invisible competence into legible judgment that product rooms can respond to.

Next: **The "how" vs "why" mindset shift**, the single biggest unlock for engineers who want the product room to hear what they already know.`,
  figures: [
    {
      kind: 'comparison_table',
      ariaLabel: 'Same reasoning move under engineering and product labels',
      caption: 'Five reasoning moves, each with an engineering label the reader is already fluent in and a product-sense label that unlocks the same move in a product room.',
      headers: ['Engineering label', 'Product-sense label'],
      rows: [
        { cells: ['Root-cause debugging a flaky test', 'Frame: problem upstream of the symptom'], arrow: true, tone: 'neutral' },
        { cells: ['API design: imagining the next caller', 'Cognitive empathy with the user'], arrow: true, tone: 'neutral' },
        { cells: ['Architecture review options', 'List: structurally distinct paths forward'], arrow: true, tone: 'neutral' },
        { cells: ['Build vs buy decision', 'Optimize: criterion + named sacrifice'], arrow: true, tone: 'neutral' },
        { cells: ['PR with rollout plan and metric', 'Win: falsifiable recommendation + timeline'], arrow: true, tone: 'neutral' },
      ],
    },
  ],
}

// ── Chapter 2 ────────────────────────────────────────────────────────────────

const CH2: ChapterSeed = {
  slug: 'chapter-2',
  sort_order: 2,
  body_mdx: `## The shift

Engineering culture rewards fast execution and competence lives in the "how", but the single biggest unlock in product thinking is staying in "why" long enough for the "how" to get a different answer.

Every ten minutes an engineer spends upstream on "why" often saves weeks downstream on "how", because the best "how" changes when the "why" changes. Product thinking is not less rigor applied to fewer details. It is the same rigor applied to the layer above the one engineers normally inhabit. Orosz names this as the third of his nine traits of product-minded engineers: "they are curious and keen to ask 'why?' Product-minded engineers ask why certain features are prioritized, why certain milestones are picked, and why certain things are measured."

## Why the default order is wrong

<!-- figure:0 -->

## A concrete example

In 2010, Kevin Systrom's team was shipping a location-based check-in app called Burbn with photo sharing as one feature among a dozen. The "how" question produced diminishing returns: how do we make the check-in flow faster, how do we improve the badge system, how do we onboard new users to the full feature set. The "why" question, asked seriously, revealed that only the photo filter use case had real traction, and the founders killed everything else to ship Instagram. The single best engineering decision in that period was to delete nine features and keep one, which was not an engineering decision at all. It was a "why" answer that rewrote what the "how" had to solve. Paul Buchheit tells a parallel story about Gmail's 2004 1GB storage decision: the team stopped asking "how do we give users a bigger quota button" and started asking "why do users keep running out of space", and the answer reframed email from temporary communication to permanent archive, which rewrote the entire product.

## Where engineers already do this

The Five Whys exercise from Toyota production and Google's postmortem culture is exactly this shift applied to incidents. Saying "the test is flaky" is a "how" framing that produces quick patches and recurring incidents. Asking "why is the test flaky" walks upstream until the answer is "because the service has a race condition between the cache warm-up and the health check", which is a different fix in a different file and eliminates the whole class. Product rooms are just slower feedback loops for the same move. An engineer who has sat through one real postmortem already knows the discipline. The reps transfer directly.

## One handle to take with you

In any room where a feature decision is being made, ask exactly one "why" question before any "how" conversation starts, and keep asking until the "why" would still be true if every proposed solution already existed. That is the unlock.

Next: **The nine traits of a product-minded engineer**, Gergely Orosz's canonical list, mapped onto the habits the reader can start practicing Monday.`,
  figures: [
    {
      kind: 'connected_boxes',
      ariaLabel: 'Why flows into how, not the other way around',
      caption: 'Product thinking asks "why" first and lets the answer constrain the "how". The engineer default is to start at "how" and back-fill the "why" to justify it, which is how strong implementations end up solving weak problems.',
      orientation: 'vertical',
      showArrows: true,
      boxes: [
        { label: 'Why', body: ['Problem, user, business context'], tone: 'ok' },
        { label: 'How', body: ['Architecture, implementation, release'], tone: 'neutral' },
      ],
    },
  ],
}

// ── Chapter 3 ────────────────────────────────────────────────────────────────

const CH3: ChapterSeed = {
  slug: 'chapter-3',
  sort_order: 3,
  body_mdx: `## The list

Gergely Orosz's nine traits of product-minded engineers are not a personality checklist, they are nine specific habits that, when practiced together, describe the engineer every product team wishes they had on every project.

Orosz wrote the list in 2019 after years at Uber, Microsoft, Skype, and Skyscanner, and the observation has held up. Each trait is a small behavior the reader can practice independently, without permission from a PM, a manager, or a career ladder. Several of the traits are already active in most engineering cultures, which means the reader is closer to the list than they think. Two traits tend to need deliberate new reps. This chapter names all nine and flags which ones are usually the new work.

## The nine traits

<!-- figure:0 -->

## What the list points at

Orosz grounds trait 1 with a sharp observation: "Product-minded engineers don't settle for getting a specification and jumping to implement it. They think about other ideas and approach the product manager with these. They often challenge existing specifications, suggesting alternative product approaches." That is a permission statement as much as a behavioral one. Most engineering cultures implicitly discourage it. Trait 3 is the same pattern applied to meetings: "Product-minded engineers ask why certain features are prioritized, why certain milestones are picked, and why certain things are measured." Both traits are free to practice. Neither requires a promotion.

## A concrete example

Jean-Michel Lemieux, then Head of Engineering at Shopify, is cited in Orosz's essay as the canonical example of several of these traits, particularly trait 3 and trait 8. Lemieux's own quote in the piece: product engineers are those who engage with the "why" actively and have a "thirst for using technologies to leapfrog human/user problems." At Shopify under Lemieux, engineers were expected to monitor user behavior and business metrics after every ship, which is trait 8 made institutional. Ebi Atawodi, now Director of PM at YouTube Studio and formerly at Uber and Netflix, described standout engineers on her teams with a similar list, which Orosz referenced on X in 2022: the engineers who asked "why" earliest and owned the outcome longest were consistently the strongest product thinkers regardless of title.

## Where engineers already do this

Trait 9 is particularly worth naming: "strong product instincts built through repeated cycles of questioning, suggesting improvements, building, and learning from real-world results." That is the same mechanism by which engineering taste develops. An engineer who has shipped, watched a service fail under load, and rewritten it knows something a junior engineer does not, and the knowing comes from the cycle, not from reading. Product instincts form the same way. The reps are different, the mechanism is identical.

## One handle to take with you

Pick one of traits 1 or 3 (the two that need new reps for most engineers) and practice it for a week before adding anything else. One week of asking one "why" per meeting, or one week of bringing one unsolicited product suggestion to the PM, does more than a month of reading about the other seven.

Next: **The Why-First Check**, a three-gate filter that takes trait 3 and makes it a hard rule for any feature spec.`,
  figures: [
    {
      kind: 'comparison_table',
      ariaLabel: 'Nine traits of product-minded engineers with engineering analogs',
      caption: 'Seven of the nine traits have direct engineering analogs the reader probably already practices. Traits 1 and 3, which ask the engineer to be proactive with product ideas and to push for "why" in product meetings, are the two that usually need new reps because most engineering cultures explicitly defer those moves to PMs.',
      headers: ['Trait', 'Engineering analog the reader probably has'],
      rows: [
        { cells: ['1. Proactive with product ideas and opinions', 'Needs new reps for most engineers'], tone: 'warn' },
        { cells: ['2. Interest in business, user behavior, and data', 'On-call rotations, analytics dashboards'], tone: 'ok' },
        { cells: ['3. Curiosity and keen interest in "why?"', 'Needs new reps for most engineers'], tone: 'warn' },
        { cells: ['4. Strong communicator with non-engineers', 'Code review comments, design docs'], tone: 'ok' },
        { cells: ['5. Offering product/engineering tradeoffs upfront', 'Latency vs cost, build vs buy memos'], tone: 'ok' },
        { cells: ['6. Pragmatic handling of edge cases', 'SRE work, what an error budget defends'], tone: 'ok' },
        { cells: ['7. Quick product validation cycles', 'Canary deploys, feature flags, hallway testing'], tone: 'ok' },
        { cells: ['8. End-to-end product feature ownership', '"You build it, you run it" DevOps culture'], tone: 'ok' },
        { cells: ['9. Strong product instincts from repeated cycles', 'Same mechanism as engineering taste'], tone: 'ok' },
      ],
    },
  ],
}

// ── Chapter 4 ────────────────────────────────────────────────────────────────

const CH4: ChapterSeed = {
  slug: 'chapter-4',
  sort_order: 4,
  body_mdx: `## The check

Before any feature spec leaves engineering, it passes three questions in order: user impact, business viability, engineering sense. Engineering sense comes third, not first, and that ordering is the whole lesson.

Engineers default to evaluating ideas in the order they feel competent, which is engineering sense first, then business, then user. Product-minded engineers invert that order. The Why-First Check is a three-gate filter that catches bad features before code is written, and the check is cheap. The failure of not running it is expensive. Jules Walter, writing in Lenny's Newsletter, names the failure mode directly: "many PMs jump into solution-finding before they truly understand the problem, which leads to ineffective solutions." The check is the corrective.

## The three gates

<!-- figure:0 -->

## Why the order matters

Marty Cagan's four product risks in *Inspired* (value, usability, feasibility, business viability) name the same issue from a different angle: feasibility is what engineers are trained to solve first, but the other three risks are what kill products. Shreyas Doshi catches a related failure mode with what he calls the "execution orientation fallacy", summarized as "building what's easiest today rather than tackling harder, higher-value problems." The pattern is consistent across every experienced product leader: the highest-leverage question is whether the problem is worth solving, not whether the team can solve it. Engineers who learn to pause at Gate 1 and Gate 2 ship less code, but the code they ship matters more.

## A concrete example

Google+ launched in 2011 with strong engineering: the circles model, the hangouts video infrastructure, the integration with Gmail and YouTube. Gate 3 was passed handily. Gate 1 was effectively "none of our users actually asked for this social network", and Gate 2 was "Facebook already owns this job and our users have no switching pressure." The product was shut down in 2019 after burning nearly a decade of engineering effort. On the other side, the Dropbox MVP in 2008 skipped Gate 3 entirely for the initial validation: Drew Houston's first ship was a demo video posted to Hacker News that sent signup conversions through the roof before a single line of sync code existed. Gates 1 and 2 were proven first, Gate 3 was addressed after. Both stories point at the same lesson. Skipping upstream gates is expensive; deferring the downstream gate is cheap.

## Where engineers already do this

Architecture reviews at companies with strong engineering cultures (Google, Stripe, Amazon) typically require the author to write down the user need, the business case, and the engineering plan as separate sections, in that order. The review fails if the engineering section is strong and the other two are thin. The Why-First Check is the same discipline applied to any feature, not just the architecturally-significant ones, and the engineer who has written one good ADR already knows the mechanics.

## One handle to take with you

On any feature the reader proposes or reviews this week, write the three gates on a sticky note in order and refuse to discuss Gate 3 until Gates 1 and 2 have answers that would survive a skeptical stakeholder. Feature quality rises the moment the order becomes habit.

Next: **Four common failure modes in product-sense interviews**, the specific patterns that interviewers use to separate reasoning from recitation.`,
  figures: [
    {
      kind: 'connected_boxes',
      ariaLabel: 'Three gates of the Why-First Check, top to bottom',
      caption: 'The check runs top-down. Engineer instinct is to start at Gate 3 and back-fill the other two, which is how technically excellent features end up solving weak problems.',
      orientation: 'vertical',
      showArrows: true,
      boxes: [
        { label: 'Gate 1: User impact', body: ['What changes for a real named person if this ships?'], tone: 'ok' },
        { label: 'Gate 2: Business viability', body: ["Does this connect to a stakeholder's actual need or the business model?"], tone: 'neutral' },
        { label: 'Gate 3: Engineering sense', body: ['Can we build it well with what we have?'], tone: 'neutral' },
      ],
    },
  ],
}

// ── Chapter 5 ────────────────────────────────────────────────────────────────

const CH5: ChapterSeed = {
  slug: 'chapter-5',
  sort_order: 5,
  body_mdx: `## The four modes

Interviewers can usually tell within the first two minutes whether a candidate is a product thinker or a framework reciter, and the signal comes from four recognizable failure modes that show up in the opening exchange.

Exponent's 2024 PM Interview Report names product sense as the number-one reason candidates fail PM interviews at FAANG companies, cited in 43% of rejection debriefs. The failure is almost never lack of knowledge. It is four patterns that appear in the first five minutes and that experienced interviewers have seen hundreds of times: skipping straight to solutions, reciting a framework mechanically, optimizing the wrong problem, and failing to name the sacrifice. This chapter names each pattern, describes what the interviewer sees, and gives the recovery move.

## The four modes, with their tells

<!-- figure:0 -->

## Why interviewers see these so fast

Himanshu Prakash, writing on the framework-recitation failure, observes that most PM candidates learn frameworks like CIRCLES and go through mechanical steps that "make them sound robotic, starting with 'Using the CIRCLES method, I will first comprehend the situation' and immediately losing the interviewer's attention." The problem is that the interviewer has heard the same opening hundreds of times, and it never correlates with strong product thinking. Strong candidates do not skip frameworks, they internalize them, and the frameworks show up as structure rather than scaffolding. The same logic applies to the other three modes. Each is a shortcut that saves thinking time and signals exactly that to the interviewer.

## A concrete example

The CIRCLES framework from Lewis Lin's *Decode and Conquer* (2013) is the most recited framework in PM interview prep, and it is the canonical example of how a good framework becomes a failure signal when misused. Lin himself has written that CIRCLES is meant as a teaching scaffold, not a ritual. The PM interview industry took it as the latter, which is why interviewers at Meta, Google, and Stripe have all written that hearing "I'll use the CIRCLES framework" in the first sentence is now a negative signal. Rohan Katyal's essay on preparing for Meta PM interviews (Medium, 2023) walks through this explicitly and demonstrates how to replace the mechanical opening with a conversational reframing move that still hits every point CIRCLES would have hit, without naming the framework once.

## Where engineers already do this

The same four failure modes appear in technical interviews. Jumping to code without clarifying requirements is mode 1. Reciting a design-patterns checklist is mode 2. Building the wrong system because the candidate never probed the problem statement is mode 3. Picking an architecture without naming the consistency-vs-availability or cost-vs-latency tradeoff is mode 4. Any engineer who has sat on the interviewer side of a system-design round will recognize all four instantly, which means the reps transfer. Practicing product-sense answers is the same discipline as practicing system-design answers, and the signals the interviewer is reading for are structurally identical.

## One handle to take with you

In the first minute of any product-sense question, name a user, reframe the problem if it needs reframing, and then commit to one criterion with one sacrifice. Skip any of the three and at least one of the four failure modes is active.

Next: **Framework recitation vs actual thinking**, a closer look at why the internet's PM interview prep has optimized away the reasoning the frameworks were invented to produce.`,
  figures: [
    {
      kind: 'comparison_table',
      ariaLabel: 'Four failure modes and what the interviewer sees',
      caption: "Each failure mode maps to a specific skipped FLOW step. The recovery move in each case is the move the candidate skipped, applied deliberately in the first minute of the answer.",
      headers: ['Failure mode', "The interviewer's tell"],
      rows: [
        { cells: ['1. Solution-first', 'No user named. No problem framing. Why-First skipped.'], tone: 'warn' },
        { cells: ['2. Framework recitation', 'Mechanical "Using CIRCLES, I will first..."'], tone: 'warn' },
        { cells: ['3. Optimizing the wrong problem', 'No reframe. Frame step skipped.'], tone: 'warn' },
        { cells: ['4. No named tradeoff', 'Only the upside. Optimize step incomplete.'], tone: 'warn' },
      ],
    },
  ],
}

// ── Chapter 6 ────────────────────────────────────────────────────────────────

const CH6: ChapterSeed = {
  slug: 'chapter-6',
  sort_order: 6,
  body_mdx: `## The trap

The internet has optimized PM interview prep into a recitation exam, and candidates can pass the test of knowing CIRCLES, DIGS, RICE, HEART, and AARRR without once demonstrating the reasoning those frameworks were invented to produce.

Frameworks are compression of past reasoning. They work backward, not forward: someone made a good decision, noticed the pattern, and named the steps. Using a framework as a scaffold for the reader's own thinking is fine. Using it as a substitute for thinking is what interviewers are trained to detect, and what produces weak product work on the job as well. Jules Walter puts it plainly: "the best product managers don't recite frameworks, they tell stories that reveal their natural curiosity and user empathy." Shreyas Doshi names the deeper failure as "Maslow's Hammer": over-relying on familiar tools or frameworks everywhere, regardless of fit.

## What the popular frameworks actually compress

<!-- figure:0 -->

## The mapping, briefly

CIRCLES (Lewis Lin) compresses Frame plus List: Comprehend, Identify, Report, Cut, List, Evaluate, Summarize. Under the labels, the moves are "name the user, cut scope, list options, evaluate with criteria, recommend." Every move is already in FLOW. RICE (Intercom's Sean McBride) compresses the Optimize step into a numeric scorecard: Reach times Impact times Confidence divided by Effort. The scoring is less important than the move of naming all four dimensions before picking. HEART (Google UX Research, 2010) and AARRR (Dave McClure) are metric taxonomies that compress the Win step's "predicted result" into a checklist of outcome categories, happiness-engagement-adoption-retention-task-success for HEART, acquisition-activation-retention-referral-revenue for AARRR. Knowing the compression is useful. Reciting the compression without the reasoning is the trap.

## A concrete example

Lewis Lin wrote *Decode and Conquer* in 2013, and the CIRCLES framework inside it was meant as a teaching scaffold for candidates who had never seen a product question before. Lin has been explicit in his own writing that CIRCLES should become invisible once the candidate has internalized it. The PM interview industry took it the other way, building cottage industries around drilling candidates on the seven letters until they could recite the framework in their sleep. The result is a generation of candidates who pass early-stage screens and fail on-sites, because the on-site interviewers at Meta, Google, and Stripe are specifically listening for reasoning that is not scripted. The framework is not broken. The use of it as a script is.

## Where engineers already do this

The same trap exists in engineering, where candidates who cite "SOLID" or "microservices" or "hexagonal architecture" as a substitute for system design thinking fail design rounds for the same reason. A senior engineer who has debugged a distributed system in production can explain when to violate SOLID and why. A junior who has memorized the acronym cannot. Frameworks are load-bearing only when the reader knows the conditions under which they break, and that knowledge comes from reps, not from lists.

## One handle to take with you

The reader should learn the reasoning move, name it in their own words, and reference the framework only when it helps the listener place what the reader is doing. Saying "I am going to name the criterion and the sacrifice first" is worth more than saying "using the RICE framework."

Next: **How to build product reps**, a weekly schedule the reader can run in their current job to convert the frameworks into the reasoning they were meant to produce.`,
  figures: [
    {
      kind: 'mapping_diagram',
      ariaLabel: 'Popular frameworks mapped onto the underlying reasoning moves',
      caption: 'Every popular PM framework is a compression of one or two FLOW moves. The framework names help listeners locate what you are doing, but the reasoning move is the thing being evaluated.',
      sourcesLabel: 'Framework (what the candidate memorizes)',
      targetsLabel: 'The move (what the interviewer is listening for)',
      sources: ['CIRCLES', 'RICE', 'HEART', 'AARRR'],
      targets: [
        { label: 'Frame + List', body: 'user, problem, options', tone: 'ok' },
        { label: 'Optimize', body: 'criterion + sacrifice', tone: 'neutral' },
        { label: 'Win', body: 'predicted outcome + metric', tone: 'ok' },
      ],
      links: [
        { from: 0, to: 0 },
        { from: 1, to: 1 },
        { from: 2, to: 2 },
        { from: 3, to: 2 },
      ],
    },
  ],
}

// ── Chapter 7 ────────────────────────────────────────────────────────────────

const CH7: ChapterSeed = {
  slug: 'chapter-7',
  sort_order: 7,
  body_mdx: `## The rep schedule

Product sense is a cumulative skill that responds to frequency, not intensity, and the engineer who practices four small reps a week for six months ends up with better product instincts than the engineer who reads five books over a weekend.

The reader cannot practice product thinking in the abstract. They need feedback loops, and most engineering jobs have more of them available than most engineers realize. This chapter prescribes a weekly schedule of four small reps that fit inside a normal engineering job, without changing roles, asking permission, or writing a single spec. Teresa Torres, whose *Continuous Discovery Habits* (2021) is the canonical text on product-side rep-building, argues that discovery is a rhythm of lightweight interactions, not a one-time research project. The same pattern is what engineers need. Four reps. Under three hours of calendar time. Sustained over months.

## Four reps, one week

<!-- figure:0 -->

## Why these four reps specifically

Each rep corresponds to one of the FLOW moves. The Monday rep, observing a real user, builds the empathy Jules Walter names as one of the two pillars of product sense. Walter's recommendation is two to four user sessions a month; once a week stays in that range. The Wednesday rep, asking one specific "why" in a meeting, is Gergely Orosz's trait 3 made into a weekly practice, and the specificity matters. Asking "why are we doing this" is cheap noise, while asking "why does this user need this now rather than six months from now" is a reframing move. The Thursday deconstruction is Walter's exercise directly, applied to one product per week rather than one or two per month, which is a higher cadence but a shorter written artifact. The Friday tradeoff note embeds the Optimize step into work the reader is already producing. Writing "this decision optimizes for X at the cost of Y" on a PR nobody reads still forces the reasoning, and occasionally someone does read it.

## A concrete example

Stripe's engineering culture has made "writing is thinking" a load-bearing norm under Patrick Collison, and engineers at Stripe are expected to produce written rationale for meaningful decisions. The Friday tradeoff rep is that norm at individual scale. Linear's founders have described on podcasts that every feature at Linear goes through a product review before shipping, typically with founder-engineers rather than a dedicated PM, which is the Wednesday "why" rep made mandatory. Shopify under Jean-Michel Lemieux expected engineers to monitor user behavior and business metrics after every ship, which is the Monday observation rep scaled to an entire engineering org. The pattern transfers. The reader does not need their company to adopt it. They can start alone on Monday.

## Where engineers already do this

Engineers already build reps the same way in their craft. Reading other people's code is the Thursday deconstruction applied to systems rather than products. Attending design reviews is the Monday observation applied to architecture rather than UX. Writing postmortems is the Friday tradeoff note applied to incidents rather than features. The mechanism is the same. The reps transfer. What is new is the target surface, and the target surface for product sense happens to be available to almost every engineer in almost every job.

## One handle to take with you

Pick one of the four reps and run it for two weeks before adding the second. Sustained single-rep practice for six months produces more product judgment than four-rep practice for two weeks followed by nothing.

That is the end of the module. The next step is to put the vocabulary to work: pick a challenge tagged with the FLOW step you feel least sure about and run the move against a scenario where the stakes do not punish the practice.`,
  figures: [
    {
      kind: 'comparison_table',
      ariaLabel: 'Weekly product-reps schedule for engineers',
      caption: 'Each rep is small enough to fit inside an existing engineering job. The total weekly commitment is under three hours, and the skill grows in the same cumulative way engineering taste grows: slowly, reliably, through reps.',
      headers: ['Day', 'Rep', 'Time'],
      rows: [
        { cells: ['Mon', 'Attend one user research session or customer call', '30 min'], tone: 'ok' },
        { cells: ['Wed', 'Ask one "why" question in a product or design meeting', '2 min'], tone: 'neutral' },
        { cells: ['Thu', 'Deconstruct one product in 200 words', '20 min'], tone: 'neutral' },
        { cells: ['Fri', 'Write one tradeoff note on the week\'s PR or design doc', '10 min'], tone: 'ok' },
      ],
      footer: {
        cells: ['Total', 'Under three hours a week. Compounds over six months.', ''],
      },
    },
  ],
}

const CHAPTERS: ChapterSeed[] = [CH1, CH2, CH3, CH4, CH5, CH6, CH7]

async function run() {
  const mod = await supabase.from('learn_modules').select('id').eq('slug', MODULE_SLUG).single()
  if (mod.error || !mod.data) {
    console.error(`[seed-product-sense] module ${MODULE_SLUG} not found:`, mod.error)
    process.exit(1)
  }
  console.log(`[seed-product-sense] module ${MODULE_SLUG} -> ${mod.data.id}`)

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

  console.log('\n[seed-product-sense] Done.')
}

run().catch(e => { console.error(e); process.exit(1) })

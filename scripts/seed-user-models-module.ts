// scripts/seed-user-models-module.ts
//
// Seeds User Models module prose + structured figures.
// Run: npx tsx --tsconfig tsconfig.json scripts/seed-user-models-module.ts

import { createClient } from '@supabase/supabase-js'
import type { ChapterFigure } from '../src/lib/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const MODULE_SLUG = 'user-models'

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
  body_mdx: `## The proxy problem

The most reliable way to build something nobody wants is to build it for yourself without noticing that's what you're doing.

Engineers are trained to have strong opinions about tools, APIs, and interfaces. That training is valuable. But it creates a systematic blind spot: when asked to design for users, the strongest engineers often design for a sharper, faster, more technically sophisticated version of themselves. The result is not bad engineering. It is good engineering aimed at the wrong person.

This is not a character flaw. It is a structural problem with how most product decisions get made. The person closest to the keyboard, with the most context about what the system can do, is also the person least likely to represent a median user's mental model, patience level, or failure mode. Alan Cooper named this in *The Inmates Are Running the Asylum* (1999): engineers build features that make sense to engineers, and the users experience the gap.

## Why the gap is systematic

<!-- figure:0 -->

## The research behind it

The cognitive science literature has a name for this: the curse of knowledge. Pinker describes it in *The Sense of Style* (2014) as the inability to remember what it felt like not to know something. Once a person understands a system deeply, they cannot easily simulate what a first-time user sees. The gap between expert and novice mental models is not a matter of effort or empathy. It is a structural difference in what each person holds in working memory when they encounter the interface.

This shows up in every early-stage product that engineers built for themselves and then struggled to expand. Vim is the canonical example: extraordinarily powerful, with a learning curve that is invisible to people who already know it because they cannot remember what "modal editing" felt like before it was automatic. Early GitHub required git fluency to get started. Early Stripe's API, for all its elegance, assumed the developer already knew what a webhook was and why they wanted one.

The problem is not the product. The problem is mistaking fluency for normalcy.

## What the research says to do about it

The fix is not empathy as a value. Empathy as a feeling gets invoked in sprint reviews and then evaporates when scope pressure arrives. The fix is empathy as a method: structured ways of generating an accurate model of a user who is different from the designer. That means personas with behavior, not demographics. Jobs-to-be-done interviews rather than feature surveys. Watching someone use a product rather than asking them to rate it.

The next six chapters of this module are each a method. Each one produces a more accurate user model than the engineering default. None of them require a UX research team or a formal process.

## One handle to take with you

Before the next product or API design decision, name the user with a behavior rather than a title. Not "a junior developer" but "someone who has never configured a webhook and is trying to get the first event to fire before the CEO walks in." That specificity is the beginning of an accurate model.

Next: **Segment by behavior, not demographics**, why the age-and-gender mental model is almost always wrong and what to use instead.`,
  figures: [
    {
      kind: 'comparison_table',
      ariaLabel: 'Engineer self-model vs actual user model across five dimensions',
      caption: 'The engineer building the product and the median user of that product diverge on almost every dimension that matters for product decisions. Designing for yourself without noticing is the root of most usability failures.',
      headers: ['Dimension', 'Engineer building it', 'Median user of it'],
      rows: [
        { cells: ['Familiarity with the domain', 'Deep, multi-year', 'Recent or none'], arrow: false, tone: 'neutral' },
        { cells: ['Tolerance for error messages', 'High, will debug', 'Low, will stop and leave'], arrow: false, tone: 'neutral' },
        { cells: ['Mental model of the system', 'Accurate, detailed', 'Partial, often wrong'], arrow: false, tone: 'neutral' },
        { cells: ['Goal when encountering the product', 'Curious, exploring', 'Task-specific, impatient'], arrow: false, tone: 'neutral' },
        { cells: ['Default on ambiguity', 'Infer and proceed', 'Stop and abandon'], arrow: false, tone: 'neutral' },
      ],
    },
  ],
}

// ── Chapter 2 ────────────────────────────────────────────────────────────────

const CH2: ChapterSeed = {
  slug: 'chapter-2',
  sort_order: 2,
  body_mdx: `## The fallacy

The most common user model in early-stage products is a demographic slot: a 23-year-old female professional in a metro area who values convenience. That model predicts almost nothing about what the product should do.

Demographic segmentation is a legacy of advertising, where the goal is reaching audiences through channels that are organized by age, gender, and geography. Broadcast TV slots, magazine inserts, and billboard placements are sold on demographic reach. If the goal is buying a slot for a beer ad that runs during Sunday football, demographics are the right tool. If the goal is designing a product that solves a specific problem for a specific type of person, demographics are nearly useless, because two people with identical demographics can have entirely different behaviors, goals, and decision-making patterns.

Forrester Research's work on "jobs-based segmentation" makes the point directly: the segments that predict purchase and retention behavior are behavioral segments, not demographic ones. People with the same job to be done cluster together across demographic lines. People with the same demographics are often trying to do entirely different jobs.

## Demographics vs behavior

<!-- figure:0 -->

## The research behind it

The foundational example is Clayton Christensen's milkshake study at McDonald's, described in *The Innovator's Dilemma* and later in *Competing Against Luck* (2016). McDonald's wanted to improve milkshake sales and initially segmented by demographics: age, flavor preferences, time of purchase. Nothing worked. A researcher spent a day observing who actually bought milkshakes and when, and found two completely different behavioral segments using the same product for entirely different jobs. Morning commuters were "hiring" the milkshake to keep one hand occupied on a long drive and stay full until lunch. Afternoon buyers were parents getting a small reward for children after school. The product optimizations for these two segments are almost opposite: thickness and portability for the commuter, flavor and size options for the parent. The demographics of both groups were similar. Their behaviors were not.

The takeaway is not that demographics are always wrong. It is that demographics describe populations and behavior predicts decisions. A product decision that is justified by demographic data without behavioral grounding is guessing with extra steps.

## How behavioral segments work in practice

Behavioral segmentation starts with observation and clustering. What are users actually doing before, during, and after they use the product? What problem forced them to start looking? What made them stop using a previous solution? What do they do when the product fails?

The clusters that emerge from these questions rarely map onto demographic groups. They map onto situations: the person who needs a quick answer before a meeting, the person managing a complex ongoing project, the person who is trying to learn something for the first time. Those situations cut across age, gender, geography, and job title. They are durable signals precisely because they are about what the user is doing, not who the user is.

## One handle to take with you

The next time a user model comes up in a product conversation, ask "what are they trying to get done right now, and what forced them to try to do it." That question produces a behavioral segment. The demographic question "who are they" produces a broadcast audience.

Next: **Jobs to Be Done**, the framework that turns behavioral observation into a structured method for understanding what users actually want from a product.`,
  figures: [
    {
      kind: 'comparison_table',
      ariaLabel: 'Demographic vs behavioral segmentation compared across five criteria',
      caption: 'Demographic segmentation describes who a population is. Behavioral segmentation predicts what individuals will do. For product decisions, the second type is almost always the right tool.',
      headers: ['Criterion', 'Demographic segmentation', 'Behavioral segmentation'],
      rows: [
        { cells: ['What it measures', 'Who people are (age, gender, income)', 'What people do and why'], tone: 'neutral' },
        { cells: ['Predicts purchase decision?', 'Weakly, for commodities', 'Strongly, across demographics'], tone: 'neutral' },
        { cells: ['Useful for', 'Reaching audiences via channels', 'Designing features and flows'], tone: 'neutral' },
        { cells: ['Fails when', 'The product is not a commodity', 'Observation data is unavailable'], tone: 'warn' },
        { cells: ['Example signal', '"Women 25-34 in urban areas"', '"People stuck waiting who need to stay occupied"'], tone: 'ok' },
      ],
    },
  ],
}

// ── Chapter 3 ────────────────────────────────────────────────────────────────

const CH3: ChapterSeed = {
  slug: 'chapter-3',
  sort_order: 3,
  body_mdx: `## The hire

Nobody buys a drill. They buy a hole. Nobody buys a hole. They buy a shelf installed before the guests arrive. The product is never the end. It is always the means to a job.

Jobs to Be Done (JTBD) is a framework for describing what users hire a product to accomplish. The language is deliberate: "hire" implies that the user had a choice, that they were looking for something to do the job before the product existed, and that they will fire the product if something else does the job better. Clayton Christensen developed the framework at Harvard Business School, and the milkshake study from chapter 2 is its canonical illustration. The framework has three layers: functional, emotional, and social. Most product teams design for the functional layer and forget the other two, which is where most product decisions go wrong.

## The three layers of a job

<!-- figure:0 -->

## Functional jobs: the obvious layer

A functional job is the practical task the user is trying to accomplish. Send a message. Find a restaurant. Schedule a meeting. Get to the airport. This is the layer most product teams design for because it is the easiest to describe and measure. Features map directly onto functional jobs: the "send" button does the sending job, the search bar does the finding job. Engineers are particularly comfortable with functional jobs because they decompose into discrete steps that can be implemented.

The problem is that functional jobs rarely explain why users choose one product over another when multiple products do the functional job adequately. Gmail and Superhuman both send email. Notion and Google Docs both store text. Slack and email both deliver messages. The differentiation that drives adoption and retention almost always lives in the emotional or social layer, not the functional one.

## Emotional jobs: the less obvious layer

An emotional job is how the user wants to feel, or avoid feeling, as a result of using the product. Calm rather than overwhelmed. Confident rather than uncertain. In control rather than reactive. These jobs are real even when users do not articulate them directly. A productivity tool that reduces decision fatigue is doing an emotional job. A design tool that makes non-designers feel like designers is doing an emotional job. A dashboard that shows progress clearly is doing an emotional job for someone who needs to feel that effort is not invisible.

Emotional jobs are harder to discover than functional ones because users will not typically describe them in interviews. Asking "what do you want to feel when you use this app" produces vague answers. Watching where users slow down, hesitate, or abandon a flow and asking "what were you worried about right there" gets closer to the emotional job.

## Social jobs: the most neglected layer

A social job is how the user wants to be perceived by others as a result of using the product. Smart. Competent. In-the-know. Ahead of trends. Part of a community. Social jobs are the most powerful and least designed-for layer. When a product has organic social virality that nobody planned, it is almost always because the product was doing a social job that the team did not realize they were building.

LinkedIn is a social-job machine: every post and credential is the user performing competence for an audience. Figma's collaborative multiplayer was initially a functional feature (multiple people editing) that turned out to do a social job (designers could show their process in real time, making skill visible). Duolingo's streak leaderboards are a social job system layered on top of a functional job (learning a language).

## One handle to take with you

For any product or feature being designed, write one sentence for each of the three jobs: what does this let the user accomplish, feel, and signal to others. If the social sentence is blank, that is usually where the organic growth will come from when it eventually arrives.

Next: **Multi-sided markets**, what happens when the product has more than one user and solving for one can break the other.`,
  figures: [
    {
      kind: 'connected_boxes',
      ariaLabel: 'Three layers of a job to be done, from functional to social',
      caption: 'Most products design for the functional layer. The emotional and social layers drive retention and virality, and are almost never surfaced by asking users what they want.',
      orientation: 'vertical',
      showArrows: true,
      boxes: [
        {
          label: 'Functional job',
          body: ['The practical task: send, find, schedule, complete'],
          tone: 'neutral',
        },
        {
          label: 'Emotional job',
          body: ['How the user wants to feel: calm, confident, in control'],
          tone: 'neutral',
        },
        {
          label: 'Social job',
          body: ['How the user wants to be seen: competent, current, part of something'],
          tone: 'ok',
        },
      ],
    },
  ],
}

// ── Chapter 4 ────────────────────────────────────────────────────────────────

const CH4: ChapterSeed = {
  slug: 'chapter-4',
  sort_order: 4,
  body_mdx: `## The chicken-and-egg problem

The most counterintuitive thing about multi-sided markets is that the product has more than one user, and the users need each other. That dependency is not a feature. It is a constraint that breaks half the standard product playbook.

Rochet and Tirole's 2003 paper "Platform Competition in Two-Sided Markets" is the formal origin of multi-sided platform theory, and its central insight is simple: a two-sided platform creates value by connecting two distinct user groups, and the value of being on one side depends entirely on how many people are on the other. This is the chicken-and-egg problem. Riders won't use Uber without drivers. Drivers won't sign up without riders. Buyers won't join a marketplace without sellers. Sellers won't list without buyers. The product is worthless to both sides until it has solved for both sides.

This matters for product decisions because optimizing for one side without considering the other is the fastest way to break a multi-sided market. And most product teams, because they have an easier time with one user type, do exactly that.

## The two sides and their different jobs

<!-- figure:0 -->

## How Airbnb solved the cold-start problem

Airbnb's origin is the canonical chicken-and-egg solution story. In 2009, Airbnb had supply (hosts listing apartments) and almost no demand. Brian Chesky and Joe Gebbia flew to New York, the city with the most listings and the least demand, and personally photographed each listed property with professional equipment. This was not a technical solution. It was a manual supply-quality intervention that made the demand side (guests) more willing to book, which then made the supply side (hosts) more likely to re-list and recruit other hosts. The sequencing mattered: fix the supply quality, which unlocks the demand, which generates the flywheel.

The Airbnb story is not primarily about growth hacking. It is about correctly identifying which side of the market was the binding constraint, and what specific intervention on that side would unblock the other. The engineers who shipped that solution had to understand two different user models simultaneously: the host who was nervous about strangers, and the guest who was nervous about photos that did not match reality.

## The platform design trap

The most common multi-sided platform mistake is picking one side to optimize for and treating the other side as a given. Marketplaces often do this with sellers: they build great seller tools, fill inventory, and then discover that buyers cannot find what they need because the catalog is optimized for listing ease rather than discovery. The seller experience is excellent. The buyer experience fails. The platform does not grow because it solved the wrong side first.

Uber's early growth had the opposite problem in dense cities: strong rider demand and thin driver supply during peak hours. The product team that focused only on rider experience was not wrong, it was solving the right side for the stage they were in. But they had to eventually build the driver-side product (earnings dashboards, driver-partner centers, surge pricing transparency) with equal care, or the supply side would not hold.

## One handle to take with you

For any product that connects two or more distinct user types, write separate JTBD sentences for each side. The jobs will be different, the emotional layers will be different, and the social layers will almost certainly be different. Designing for one user model without the other is designing half the product.

Next: **The Reach x Underservedness matrix**, a two-axis tool for deciding which user segment to focus on when resources are scarce.`,
  figures: [
    {
      kind: 'comparison_table',
      ariaLabel: 'Two sides of a multi-sided platform with their distinct jobs',
      caption: 'Multi-sided platforms have two or more user types with different functional, emotional, and social jobs. Solving for one side without understanding the other is the root cause of most platform failures.',
      headers: ['Dimension', 'Supply side (e.g., hosts, drivers, sellers)', 'Demand side (e.g., guests, riders, buyers)'],
      rows: [
        { cells: ['Primary functional job', 'Generate income from an existing asset or skill', 'Get a specific outcome reliably and on demand'], tone: 'neutral' },
        { cells: ['Primary emotional job', 'Feel safe trusting strangers with their asset', 'Feel confident the outcome will match expectations'], tone: 'neutral' },
        { cells: ['Primary social job', 'Be seen as a reliable, professional provider', 'Signal taste or access to peers'], tone: 'neutral' },
        { cells: ['Binding constraint early', 'Quality and trust signals to attract demand', 'Enough supply density to make search worthwhile'], tone: 'warn' },
        { cells: ['What breaks them', 'Demand-only optimization that ignores supply experience', 'Supply-only optimization that ignores findability'], tone: 'warn' },
      ],
    },
  ],
}

// ── Chapter 5 ────────────────────────────────────────────────────────────────

const CH5: ChapterSeed = {
  slug: 'chapter-5',
  sort_order: 5,
  body_mdx: `## The two axes

The hardest product decision is not which feature to build. It is which user segment to focus on when every segment looks equally legitimate and resources are limited. The Reach x Underservedness matrix makes that decision tractable.

The matrix has two axes: how many users are in the segment (Reach), and how poorly their current needs are being met (Underservedness). A segment that is large and well-served is a competitive market. A segment that is small and underserved is a niche. A segment that is large and underserved is a product waiting to be built. The matrix does not produce the answer automatically. It surfaces the tradeoffs so the decision can be made explicitly rather than by default.

Teresa Torres's opportunity solution tree, described in *Continuous Discovery Habits* (2021), uses a similar structure: opportunities are problems worth solving, and the criteria for prioritizing among them include how many people have the problem, how intensely they feel it, and how often it occurs. The Reach x Underservedness matrix is a simplified version of that prioritization logic, applied to user segments rather than feature opportunities.

## The matrix

<!-- figure:0 -->

## How reach is measured

Reach is not the size of the total addressable market. It is the number of users the product can realistically serve in the next 12 to 18 months given the current acquisition model. A segment of 50 million people that requires enterprise sales contracts to reach is effectively a small segment for an early-stage team. A segment of 500,000 people that can be reached through a specific Slack community or subreddit is effectively a large segment for the same team.

Reach is a product of audience size, channel accessibility, and acquisition friction. The right estimate for a given team is usually smaller than the team assumes, because TAM calculations count everyone in the segment and ignore the channel constraints.

## How underservedness is measured

Underservedness is the gap between what users currently use to solve the problem and what an ideal solution would do. It has two components: how bad the current solution is, and how much users care about the gap.

A segment can be large and have a bad current solution without being underserved in a way that matters, if the users have adapted to the bad solution and stopped feeling its cost. Early smartphone users had terrible mobile email clients, but for many of them the friction was familiar enough that they were not actively looking for a replacement. The segment was large. The badness of the existing solution was real. But the felt urgency was low. Reach and badness without urgency is not underservedness. It is an untriggered market.

The trigger question is: "what event makes someone suddenly unsatisfied with the current solution?" That event defines the moment of highest underservedness, and the product that shows up at that moment has the highest conversion.

## Kano model as a supplement

The Kano model (Noriaki Kano, 1984) adds a useful nuance to underservedness: not all unmet needs create the same reaction when satisfied. Basic needs create dissatisfaction when absent but not delight when present. Performance needs scale linearly. Excitement needs create delight when present and are not missed when absent. A product entering a segment with high underservedness should identify whether the unmet need is basic (table stakes) or excitement (differentiator), because the investment required and the retention impact are different.

## One handle to take with you

Plot the two or three candidate segments on the matrix before committing to a roadmap. The segment with highest Reach and highest Underservedness is not automatically the right choice, because it might also have the highest competitive intensity. But the exercise makes the reasoning explicit, which is the first step toward a decision that survives contact with stakeholders.

Next: **Accessibility as product signal**, why designing for edge-case users reveals the assumptions baked into a product's core experience.`,
  figures: [
    {
      kind: 'mapping_diagram',
      ariaLabel: 'Reach versus Underservedness matrix with four quadrant outcomes',
      caption: 'The Reach x Underservedness matrix forces an explicit prioritization decision. The upper-right quadrant, large and underserved, is where new products are built. The lower-left is where existing incumbents sit.',
      sourcesLabel: 'Underservedness (how poorly needs are met)',
      targetsLabel: 'Strategic posture',
      sources: ['High Reach + High Underserved', 'High Reach + Low Underserved', 'Low Reach + High Underserved', 'Low Reach + Low Underserved'],
      targets: [
        { label: 'Build here', body: 'Large segment, unmet need. This is the whitespace.', tone: 'ok' },
        { label: 'Compete carefully', body: 'Large segment, well-served. You need a strong differentiation angle.', tone: 'neutral' },
        { label: 'Validate then expand', body: 'Small segment, unmet need. Beachhead strategy.', tone: 'neutral' },
        { label: 'Skip', body: 'Small segment, well-served. Not a product opportunity.', tone: 'warn' },
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
  body_mdx: `## The signal

Accessibility is treated in most product development processes as a compliance requirement: a list of WCAG criteria to meet before launch, a checkbox in the audit, a legal obligation to satisfy. That framing misses something. Accessibility constraints are the most reliable way to surface the invisible assumptions baked into a product's default design.

When Apple's VoiceOver team builds screen reader support for iOS, they are not adding an accessibility layer on top of the existing product. They are discovering what the existing product assumed about how users interact: that they can see the screen, tap precisely, distinguish colors, and read at native speed. VoiceOver support requires rethinking each of those assumptions, and the process of rethinking them almost always reveals ways the default experience is also worse for non-disabled users.

The curb-cut effect, named after the dropped curb cuts installed in sidewalks for wheelchair users, is the canonical example. Curb cuts made sidewalks universally easier to navigate: cyclists, parents with strollers, delivery workers, and anyone with a heavy bag all benefited. The design constraint imposed for one user group improved the experience for everyone. The same pattern shows up in digital products with enough regularity that "the curb-cut effect" is now a standard term in UX research.

## Accessibility constraints and what they reveal

<!-- figure:0 -->

## Apple VoiceOver as engineering constraint

The story of Apple's VoiceOver, launched with the iPhone 3GS in 2009, is worth understanding in detail. The challenge the accessibility team faced was that the iPhone's entire input model was a touch screen: there was no tactile keyboard, no separate navigation layer, and no way to know what element was focused without looking at it. Designing for blind users required inventing a new interaction model from scratch.

The team's solution, a separate gesture language for VoiceOver users (single-tap to identify, double-tap to activate, swipe to move), also revealed that the standard tap-to-activate model had an accessibility problem for sighted users: there was no way to "try" a button without activating it. VoiceOver's "tap to identify, double-tap to activate" logic became the basis for iOS's long-press preview feature, which is now used by hundreds of millions of sighted users.

The engineering constraint of serving one underserved segment produced a user model that was more complete, and the completeness improved the product for everyone.

## The design assumption audit

Any product can be audited for embedded assumptions by asking: what does this interface assume about the user's sensory capabilities, motor capabilities, cognitive load, internet connection, device, language, and time available? Each assumption is a potential point of failure for a segment of real users, and each failure is also a product signal.

The keyboard-only navigation path is almost never designed deliberately. Most teams discover it exists only when an accessibility audit reveals that tab focus skips critical elements. But keyboard-only users include not just screen reader users but also power users who navigate without lifting their hands from the keyboard. Fixing keyboard navigation for the accessibility case almost always makes the power-user case better.

Cognitive accessibility, designing for users with different processing speeds, reading levels, and attention spans, is the least-designed dimension and the one with the widest reach. The user who is reading the interface in their second language, the user who is tired, the user who is using the product for the first time, and the user with a cognitive disability are all being served by the same interface. Simplifying that interface for the hardest case usually improves it for everyone else.

## One handle to take with you

Pick one accessibility constraint that is not currently met in a product or interface under active development. Do the engineering work to meet it. Document what assumptions the constraint revealed. The documentation is the product signal.

Next: **Case: Spotify Wrapped**, how a summary report became an identity signal that nobody planned, and what the user model reveals about social jobs.`,
  figures: [
    {
      kind: 'comparison_table',
      ariaLabel: 'Accessibility constraints and the assumptions they surface',
      caption: 'Each accessibility dimension reveals a hidden assumption in the default design. Meeting the constraint usually improves the experience for a much broader group than the target accessibility segment.',
      headers: ['Accessibility dimension', 'Assumption revealed', 'Who else benefits'],
      rows: [
        { cells: ['Screen reader support', '"Users can see and read the interface"', 'Voice interface users, eyes-occupied contexts'], tone: 'neutral' },
        { cells: ['Keyboard-only navigation', '"Users can use a pointing device precisely"', 'Power users, developers, RSI-limited users'], tone: 'neutral' },
        { cells: ['Color contrast requirements', '"Users distinguish colors at standard contrast"', 'Bright sunlight users, aging eyes'], tone: 'neutral' },
        { cells: ['Captions and transcripts', '"Users can hear audio content"', 'Public-place viewers, second-language listeners'], tone: 'neutral' },
        { cells: ['Cognitive accessibility', '"Users process information at baseline speed"', 'Tired users, first-time users, non-native speakers'], tone: 'neutral' },
      ],
    },
  ],
}

// ── Chapter 7 ────────────────────────────────────────────────────────────────

const CH7: ChapterSeed = {
  slug: 'chapter-7',
  sort_order: 7,
  body_mdx: `## What they actually built

Spotify did not plan Wrapped as a viral feature. The original version, called "Year in Music," launched in 2015 as a personal listening summary: a webpage with your top artists, songs, and genre, sent to subscribers once a year. The engineering behind it was a batch aggregation job. The goal was listener retention and a reason to stay subscribed through the holiday period.

What happened next is the object lesson. Users started sharing their Year in Music results on social media, unprompted and without a share button. By the time Spotify added the share button in 2016 and rebranded to "Wrapped" in 2017, the behavior was already established. The team had built a functional feature (a listening summary) and users had discovered a social job (a public identity signal) that the team had not designed for.

Tony Elison, who led Wrapped's design evolution from 2019 onward, described the shift in interviews as a deliberate decision to lean into the social job once the team recognized it: making the cards visually distinctive enough to be recognizable on a social feed, adding the identity-signal slides ("you're a #1 fan of"), and building the sharing flow to be frictionless. By 2023, Wrapped generated over 600 million social shares and reached cultural moment status. The product team did not invent the behavior. They recognized the social job after users demonstrated it, and then designed for it explicitly.

## The three-layer read on Wrapped

<!-- figure:0 -->

## What the user model looks like, in retrospect

If a product team had written the JTBD for Spotify Wrapped before it launched, they would have gotten the functional layer right: users want to see a summary of their listening year. They might have gotten the emotional layer: users want to feel that their listening is meaningful, that their taste is real. They would almost certainly have missed the social layer: users want to signal their identity to their network through a shared artifact that is legible to peers who are not Spotify users.

The social job is the one that drove the virality. And the social job is the one that is hardest to surface through standard user research, because it requires asking not "what do you want to do with this" but "how does using this change how other people see you." That question is socially awkward in most interview contexts, which is why most teams never ask it.

The design implication is that every user-generated artifact, every summary, every achievement, every stat, is a potential social job waiting to be discovered. GitHub's contribution graph is a social job machine. LinkedIn's profile is a social job machine. Goodreads' reading lists are a social job machine. None of these were designed primarily as identity signals, but each one became one because users found the social job inside the functional feature.

## The engineering takeaway

For engineers building data products, the Wrapped case points at something specific: every aggregation is a potential summary, and every summary is a potential social signal. The batch job that generates a user's listening history is also the engine of a feature that 600 million people share voluntarily. The technical work is table stakes. The product work is asking what the user does with the output after the job runs, and whether there is a social job hiding inside the functional one.

The user model that unlocks a Wrapped-scale feature is not built from demographic data or usage statistics alone. It is built from observation of what users do when they get something they did not expect to want, which is the hardest and most important kind of product signal to see.

## Build the practice

This module covered seven methods for building accurate user models: avoiding the self-proxy trap, segmenting by behavior, applying Jobs to Be Done across all three layers, mapping multi-sided markets, using the Reach x Underservedness matrix, reading accessibility constraints as product signals, and learning from cases where social jobs emerged unexpectedly.

Each method is a lens. None of them produces the answer. Together they produce a user model that is specific enough to make product decisions against, which is the goal. The next step is to apply one of these lenses to a real product decision, and see what it reveals that the default model would have missed.`,
  figures: [
    {
      kind: 'connected_boxes',
      ariaLabel: 'Three-layer JTBD read on Spotify Wrapped',
      caption: 'Wrapped is a clean case study in all three job layers. The functional layer was planned. The emotional layer was partially understood. The social layer was discovered after launch and then designed for explicitly.',
      orientation: 'vertical',
      showArrows: false,
      boxes: [
        {
          label: 'Functional job',
          body: ['See a summary of your listening year', 'Planned, built, and shipped in 2015'],
          tone: 'neutral',
        },
        {
          label: 'Emotional job',
          body: ['Feel that your taste is real and your listening is meaningful', 'Partially understood, became the design focus in 2019'],
          tone: 'neutral',
        },
        {
          label: 'Social job',
          body: ['Signal your musical identity to your network via a shareable, legible artifact', 'Not planned, discovered by watching users, redesigned for from 2016 onward'],
          tone: 'ok',
        },
      ],
    },
  ],
}

const CHAPTERS: ChapterSeed[] = [CH1, CH2, CH3, CH4, CH5, CH6, CH7]

async function run() {
  const mod = await supabase.from('learn_modules').select('id').eq('slug', MODULE_SLUG).single()
  if (mod.error || !mod.data) {
    console.error(`[seed-user-models] module ${MODULE_SLUG} not found:`, mod.error)
    process.exit(1)
  }
  console.log(`[seed-user-models] module ${MODULE_SLUG} -> ${mod.data.id}`)

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

  console.log('\n[seed-user-models] Done.')
}

run().catch(e => { console.error(e); process.exit(1) })

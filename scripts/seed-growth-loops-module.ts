// scripts/seed-growth-loops-module.ts
//
// Seeds Growth Loops module prose + structured figures.
// Run: npx tsx --tsconfig tsconfig.json scripts/seed-growth-loops-module.ts

import { createClient } from '@supabase/supabase-js'
import type { ChapterFigure } from '../src/lib/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const MODULE_SLUG = 'growth-loops'

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
  body_mdx: `## The core distinction

A funnel is a pipeline. Data enters at the top, gets transformed through discrete stages, and exits. Every step is one-directional: acquisition flows into activation, activation flows into retention, and nothing flows back. Engineers know this pattern cold. It is synchronous, stateless across passes, and easy to instrument.

A loop is a recursive call. The output of one cycle becomes the input of the next, and the system compounds over time rather than consuming users in a single pass. Brian Balfour articulated this distinction in his 2019 Reforge essay "Loops, Not Funnels": "The best product companies in the world use loops to power their growth, not funnels." His argument is not that funnels are useless, it is that funnels are a snapshot of one pass and loops are a model of compounding over many passes. The distinction matters because optimizing a funnel and designing a loop require completely different reasoning.

## What the structures look like

<!-- figure:0 -->

## Why engineers get this intuitively

Engineers already think in loops. Event-driven architectures, message queues, feedback control systems, retry mechanisms with backoff: all of these are systems where the output influences the next round of inputs. A load balancer that measures latency and reroutes traffic is a loop. A cache that warms itself from production traffic is a loop. The domain vocabulary is different but the structural intuition is identical.

The funnel metaphor came from industrial sales pipelines, where contacts enter, get worked, and either convert or fall out. That model was never designed to capture retention, virality, or compounding value, because those properties did not exist in physical sales pipelines. Products that are genuinely loops look broken when measured only as funnels: Instagram's growth in 2011 through 2013 appeared stagnant in funnel metrics because the acquisition came almost entirely from in-app sharing, which is a loop output feeding the next cycle's top of funnel. Measuring only new-user acquisition missed the entire mechanism.

## The Reforge synthesis

Balfour's loop framework, developed through Reforge with Andrew Chen and Casey Winters, distinguishes three loop types: acquisition loops (new users generate more new users), engagement loops (existing users generate more engagement), and monetization loops (revenue generates more revenue or more product). Most products have one strong loop and several weak ones, and the strong loop is usually the one that was designed last. Teams build onboarding funnels first and discover the acquisition loop years later when they notice a usage pattern they did not engineer.

## One handle to take with you

Before the next feature conversation, identify whether the feature is a funnel optimization (improving conversion in a one-pass process) or a loop investment (making the output feed the next cycle's input). The framing changes the metric, the success criteria, and the time horizon, and none of those changes are small.

Next: **Acquisition, engagement, monetization loops** — the three archetypes, what each compounding mechanism looks like, and how to tell which one a product actually runs on.`,
  figures: [
    {
      kind: 'comparison_table',
      ariaLabel: 'Funnel vs loop structural comparison',
      caption: 'Funnels and loops are structurally different. Funnels model one-directional flow; loops model compounding cycles. Most analytics tools default to funnel views, which can make a healthy loop look flat.',
      headers: ['Dimension', 'Funnel', 'Loop'],
      rows: [
        { cells: ['Direction', 'One-directional (top to bottom)', 'Cyclical (output feeds input)'], tone: 'neutral' },
        { cells: ['Primary metric', 'Conversion rate per stage', 'Cycle output per input (K-factor, engagement rate)'], tone: 'neutral' },
        { cells: ['Time horizon', 'Single pass', 'Compounds over multiple cycles'], tone: 'neutral' },
        { cells: ['Engineering analog', 'ETL pipeline', 'Feedback control loop or message queue'], tone: 'ok' },
        { cells: ['Optimization target', 'Reduce drop-off at each stage', 'Increase output-to-input ratio per cycle'], tone: 'ok' },
      ],
    },
  ],
}

// ── Chapter 2 ────────────────────────────────────────────────────────────────

const CH2: ChapterSeed = {
  slug: 'chapter-2',
  sort_order: 2,
  body_mdx: `## Three archetypes, three mechanisms

Not every loop is a growth loop. Some loops spin without compounding: a user returns, re-engages, and generates no output that brings in a new user or increases the next cycle's input. Andrew Chen's "The Cold Start Problem" (2021) distinguishes sharply between loops that generate external effects and those that do not. The three archetypes map to where the compounding happens.

Acquisition loops produce more users. Engagement loops produce more content, data, or social proof. Monetization loops produce more capital that re-enters the product as a force multiplier. A product can run all three simultaneously, but they compound at different rates and respond to different investments. Conflating them produces confused roadmaps.

## The three loops and their mechanics

<!-- figure:0 -->

## Acquisition loops in practice

The canonical acquisition loop is viral sharing: a user takes an action, that action exposes the product to a non-user, and a fraction of those non-users become users. Dropbox's referral program, launched in 2008 and studied extensively since, produced a 35% permanent increase in signups over the year following launch. The mechanism was explicit: refer a friend, both users get storage, and the referring user has a structural incentive to bring in more users. The loop closed tightly because the reward (storage) was the core product value, not a discount on something else.

Paid acquisition can also be a loop when revenue per user exceeds customer acquisition cost by enough to fund the next acquisition cycle. Subscription businesses with high LTV:CAC ratios often compound this way, but the loop breaks the moment CAC rises faster than LTV, which is what happened to most DTC brands in the 2019 through 2022 Facebook and Instagram ad cycle.

## Engagement loops in practice

Engagement loops compound when user activity generates content, data, or social proof that makes the product more valuable to the next user's session. YouTube's recommendation engine is an engagement loop: watch history improves recommendations, better recommendations increase watch time, longer watch time generates more training signal. TikTok's version of this is more aggressive (covered in chapter 7), but the mechanism is structurally identical.

Andrew Chen's framework distinguishes content loops (where user-generated content attracts more users) from data loops (where usage data improves the product for everyone). Spotify's Discover Weekly is a data loop: listening behavior trains the model, better recommendations increase listening, more listening improves the model. Neither type creates new users directly, but both make retention more durable.

## Monetization loops in practice

Monetization loops are rarer and usually appear at scale. Amazon's flywheel (more sellers lower prices, lower prices attract more buyers, more buyers attract more sellers) is the canonical example. The loop requires enough transaction volume to generate a price advantage, which requires scale before the loop becomes load-bearing. For most products, monetization is a funnel inside an acquisition or engagement loop, not a loop of its own.

## One handle to take with you

Identify the one loop in the current product that is actually compounding, measure its cycle time and output-to-input ratio, and treat everything else as a funnel. Investing in a weak loop because it looks like a loop archetype is a common and expensive mistake.

Next: **Viral coefficient** — the math behind acquisition loops, and why most products that claim viral growth are actually running sub-1 K-factors.`,
  figures: [
    {
      kind: 'connected_boxes',
      ariaLabel: 'Three growth loop archetypes and their compounding mechanisms',
      caption: 'Each loop archetype compounds through a different mechanism. A product can run all three, but each requires different investment and measures success differently.',
      orientation: 'vertical',
      showArrows: true,
      boxes: [
        {
          label: 'Acquisition loop',
          body: [
            'User action exposes the product to non-users',
            'Fraction of non-users convert to users',
            'Example: referral program, viral share, SEO content',
          ],
          tone: 'ok',
        },
        {
          label: 'Engagement loop',
          body: [
            'User activity generates content, data, or social proof',
            'Better content / data increases value of next session',
            'Example: UGC platforms, recommendation engines, social feeds',
          ],
          tone: 'neutral',
        },
        {
          label: 'Monetization loop',
          body: [
            'Revenue re-enters as a force multiplier (lower prices, more features, more sellers)',
            'Force multiplier increases retention or acquisition',
            'Example: Amazon flywheel, paid acquisition with high LTV:CAC',
          ],
          tone: 'neutral',
        },
      ],
    },
  ],
}

// ── Chapter 3 ────────────────────────────────────────────────────────────────

const CH3: ChapterSeed = {
  slug: 'chapter-3',
  sort_order: 3,
  body_mdx: `## The math

The viral coefficient, or K-factor, is the number of new users each existing user generates. The formula is K = invitations sent per user times conversion rate on those invitations. When K is greater than 1, each user generates more than one user, and growth is genuinely exponential. When K is less than 1, the product still grows if acquisition inflow exceeds churn, but the loop is not self-sustaining.

Most products that describe themselves as viral are running K-factors well below 1. This is not a failure. A K-factor of 0.7 with strong paid acquisition still produces healthy growth. The confusion arises when teams treat sub-1 viral loops as their primary growth mechanism and under-invest in the acquisition channels that are actually load-bearing.

## K-factor and what it means at each range

<!-- figure:0 -->

## Dropbox and the referral mechanics

Dropbox's 2008 referral program is the most studied viral acquisition loop in consumer software history. Drew Houston's team offered 500MB of free storage to the referring user and 250MB to the invited user for each successful signup. The program produced a 35% permanent increase in signup rates, measured by the Dropbox team and cited in Houston's multiple public talks between 2009 and 2012. The K-factor was not reported publicly, but the mechanics were clean: every user had a structural incentive to invite, the reward was the core product value, and the conversion on invites was high because the invitee received value at signup rather than after.

The key design decision was tying the reward to product value rather than to discount pricing. Storage was what Dropbox sold, and giving storage as the referral reward meant that the most engaged users (those who needed more storage) were also the most motivated to refer. The loop fed from the product's own demand signal.

## WhatsApp and the organic network loop

WhatsApp's growth to 450 million monthly active users by February 2014, ahead of its $19 billion acquisition by Facebook, was almost entirely organic. The product did not run a referral program. The K-factor came from the contact-import mechanism: a new user imports their address book, the app shows which contacts are already on WhatsApp, and the presence of existing contacts creates immediate value, which drives the new user to invite the contacts who are not yet on the platform. Each new user generated roughly one to two additional users through direct invitation, sustained over a user base that grew by a million users per day in the two weeks before the acquisition.

The insight from WhatsApp is that a K-factor above 1 does not require a formal referral program. It requires that the product be genuinely better with more of the user's specific network on it, which is a product design requirement, not a marketing mechanic.

## Where K-factor breaks

K-factor is a cycle-level metric, and the cycle time matters as much as the coefficient. A K-factor of 1.2 with a 30-day cycle time produces slower compounding than a K-factor of 0.9 with a 3-day cycle time in the short term. Growth teams often optimize K-factor alone and ignore cycle time, which distorts investment priorities.

K-factor also degrades as the addressable network saturates. WhatsApp's K-factor was above 1 in 2011 when penetration was low and fell below 1 as the contact network saturated in each geography. Growth slowed and then plateaued in mature markets at the same time it exploded in new ones, following the same saturation curve every viral product experiences.

## One handle to take with you

Calculate the actual K-factor for the current product by measuring invitations sent per active user per month and the conversion rate on those invitations. If the product claims virality but the K-factor is below 0.3, the growth mechanism is something other than viral, and the viral loop should be treated as a nice-to-have rather than a strategy.

Next: **Retention curves** — what the shape of a retention curve tells you about whether you have a real product, and why the flatline is the only shape that matters.`,
  figures: [
    {
      kind: 'comparison_table',
      ariaLabel: 'Viral coefficient ranges and their implications',
      caption: 'K-factor interpretation depends on the growth strategy. A sub-1 K-factor is not a failure unless the team is treating the viral loop as load-bearing when it is not.',
      headers: ['K-factor range', 'Interpretation', 'Growth implication'],
      rows: [
        {
          cells: ['K > 1.0', 'True viral: each user generates more than one user', 'Exponential growth until network saturation'],
          tone: 'ok',
        },
        {
          cells: ['K = 0.5 – 1.0', 'Assisted growth: viral loop reduces CAC but does not sustain without acquisition inflow', 'Healthy supplement to paid or SEO acquisition'],
          tone: 'neutral',
        },
        {
          cells: ['K = 0.1 – 0.5', 'Low virality: loop exists but is not a meaningful force multiplier', 'Optimize other acquisition channels first'],
          tone: 'warn',
        },
        {
          cells: ['K < 0.1', 'Minimal loop: product is effectively non-viral', 'Do not invest in viral mechanics; fix retention first'],
          tone: 'warn',
        },
      ],
      footer: {
        cells: ['Note', 'Cycle time matters as much as K. A fast 0.9-K loop can outpace a slow 1.2-K loop in the short term.', ''],
      },
    },
  ],
}

// ── Chapter 4 ────────────────────────────────────────────────────────────────

const CH4: ChapterSeed = {
  slug: 'chapter-4',
  sort_order: 4,
  body_mdx: `## What the curve tells you

Retention is plotted as the percentage of users still active N days after their first session. A curve that declines to zero tells you the product has a leaky bucket: it is acquiring users it cannot keep, and all acquisition spend is funding churn rather than a user base. A curve that flattens above zero is the signal that a real product exists, because some fraction of users found enough value to stay permanently.

Andrew Chen, writing in his "Red Flags and Magic Numbers" investor post, calls the flattening curve the single most important metric in consumer software: "If your D30 or D90 retention is flat or showing a slight positive slope, you have something. If it's declining toward zero, no amount of top-of-funnel fixes it." The flat line is the proof that a retention loop exists, not just a one-time conversion event.

## Retention curve shapes and what each means

<!-- figure:0 -->

## D30 and L28 benchmarks

Industry benchmarks vary widely by category, but Chen's post and subsequent analysis from Andreessen Horowitz and Sequoia put D30 retention for social and consumer apps at roughly 20 to 40 percent for strong performers and below 10 percent for products in the leaky-bucket category. L28 (users active on at least one day in the last 28) is a softer measure that smooths over weekly patterns, and most consumer apps that survive to Series B sit above 30 percent L28. Utility and productivity apps (where usage is less habitual and more task-driven) can retain with much lower daily active rates but require strong L90 and L180 curves.

The benchmark is less important than the shape. A 15 percent D30 curve that is flat is a stronger signal than a 35 percent D30 curve that is still declining at D30, because the flat curve proves the loop and the declining curve proves the bucket. Investors reading early-stage metrics understand this distinction, and the teams that survive fundraising in down markets are usually the ones with flat curves at low numbers rather than impressive curves still in free-fall.

## Why the "smile" is a trap

Some retention curves show a dip followed by recovery: a "smile" shape where D7 is lower than D1 and D30 is higher than D7. This can be a real signal of a re-engagement loop working, where users who go dormant are brought back through notifications or social activity. More often, it is a measurement artifact: the D7 dip is cohort self-selection (casual users churning early) and the D30 number is the retained hardcore, not genuine re-engagement. The difference matters because a smile caused by re-engagement justifies notification investment, and a smile caused by cohort selection does not.

The clean test is to segment the cohort by engagement at signup: users who completed the core action in session one versus those who did not. If the smile appears in both segments, re-engagement is probably real. If it appears only in the low-engagement segment, it is selection.

## Where engineers already think about this

Uptime and reliability curves have the same shape problem. A service with 99.9 percent uptime that degrades asymptotically toward a new lower floor is structurally different from one that degraded once and recovered. On-call engineers learn to read the shape of the degradation curve, not just the current number, because the shape predicts whether a fix holds. Retention curves reward the same reading practice.

## One handle to take with you

For any product with more than 60 days of usage data, plot the D1, D7, D14, D30, and D60 retention curve for the last three cohorts and look only at the shape. A flat tail at any level is evidence of a real loop. A declining tail at any level is evidence of a problem that acquisition spend cannot fix.

Next: **Network effects as compounding loops** — what separates a real network effect from a handwaved one, and why most products that claim network effects do not have them.`,
  figures: [
    {
      kind: 'comparison_table',
      ariaLabel: 'Retention curve shapes and what each implies about product health',
      caption: 'The shape of a retention curve is more diagnostic than the absolute percentage. A flat tail at 10% is a stronger signal than a declining tail at 30%, because the flat tail proves a retention loop exists.',
      headers: ['Curve shape', 'What it means', 'Correct response'],
      rows: [
        {
          cells: ['Flat tail above 0% (flatline)', 'Real product: a retention loop exists. Some users found durable value.', 'Invest in acquisition. The bucket holds water.'],
          tone: 'ok',
        },
        {
          cells: ['"Smile" (dip then recovery)', 'Either re-engagement loop working, or cohort self-selection artifact. Requires segmentation to diagnose.', 'Segment by session-1 engagement before investing in notifications.'],
          tone: 'neutral',
        },
        {
          cells: ['Slow decline toward zero', 'Leaky bucket: acquisition is funding churn. No durable loop exists.', 'Fix retention before scaling acquisition. Acquisition spend is wasted.'],
          tone: 'warn',
        },
        {
          cells: ['Sharp cliff (D1 to D7 drop)', 'Onboarding failure: users are not reaching the core value event.', 'Instrument the onboarding flow. Find the drop-off step and fix it first.'],
          tone: 'warn',
        },
      ],
    },
  ],
}

// ── Chapter 5 ────────────────────────────────────────────────────────────────

const CH5: ChapterSeed = {
  slug: 'chapter-5',
  sort_order: 5,
  body_mdx: `## The hardest moat

Network effects compound value with users: the more people use the product, the more valuable it becomes to each user. James Currier and the NFX team call this the strongest moat in technology in "The Network Effects Bible" (2018), and the data supports the claim. Of the hundred largest technology companies by market cap in 2023, roughly 70 percent depend on network effects as their primary value driver, compared to 35 percent a decade earlier.

The problem is that network effects are also the most frequently misidentified property in product discussions. A product is not a network effect because more users might make it better. It is a network effect when a specific, measurable mechanism makes it better for an existing user when a new user joins, and when that mechanism is strong enough that losing users makes it measurably worse.

## Same-side vs cross-side effects

<!-- figure:0 -->

## Metcalfe's Law and its limits

Robert Metcalfe's original formulation (1980) proposed that the value of a network scales with the square of the number of connected nodes (n²). The intuition is correct for a communication network where every node can connect to every other node: two fax machines have one useful connection, four have six, ten have 45. But most product networks are not fully connected. Users do not interact with every other user; they interact with a meaningful subset. Dense sub-networks (friend groups, professional communities, topic clusters) are load-bearing in ways that the aggregate user count is not.

This matters for growth strategy. Adding the ten-millionth user to a network that is already dense at the relevant sub-network level adds near-zero marginal value to most existing users. The compounding only holds while the network is sparse relative to the user's potential connection set. LinkedIn's professional network effects were strongest in the 2006 through 2012 period when a user's professional contacts were not yet fully on the platform. By 2020, LinkedIn's core professional connections were largely saturated, and the company was reinvesting in content and media loops to sustain growth.

## Same-side vs cross-side in practice

Same-side network effects increase value for existing users when more users like them join. WhatsApp and iMessage have same-side effects: each new user in a user's contact list makes the platform more useful. Uber and Airbnb have cross-side effects: more drivers make the platform more valuable for riders (shorter wait times), and more hosts make it more valuable for travelers (more options, lower prices). Cross-side effects are stronger moats because they are harder to replicate: a competitor needs to build both sides of the market simultaneously, whereas a same-side network can be cloned one cohort at a time.

A third type, data network effects, operates differently. The product becomes better for all users as aggregate usage generates more training data or behavioral signal, regardless of whether users are connected to each other. Spotify's Discover Weekly, Google Search's ranking, and Netflix's recommendation engine all run on data network effects. These are real compounding loops but they are not social networks, and confusing them with social network effects leads to product decisions (adding social sharing, social profiles, friend graphs) that do not reinforce the actual loop.

## How to tell if a network effect is real

The test is bilateral degradation: if a significant fraction of users left the platform today, would the remaining users have a measurably worse experience? For WhatsApp, yes: a 30 percent drop in users would remove 30 percent of potential message recipients and the product would be worse. For a SaaS product that claims network effects because shared templates make the product slightly better, probably not: the templates persist and the remaining users are largely unaffected. Real network effects have sharp bilateral degradation. Claimed ones are usually just scale benefits dressed up in stronger language.

## One handle to take with you

Before claiming network effects in a product review or strategy document, answer the degradation test: what happens to a specific user's experience if 20 percent of users churn tomorrow? If the answer is "roughly nothing", the product does not have load-bearing network effects.

Next: **When growth hacks kill the product** — what dark patterns are, why they work in the short term, and the specific cost every one of them extracts from the product and the company.`,
  figures: [
    {
      kind: 'comparison_table',
      ariaLabel: 'Same-side vs cross-side network effects with examples',
      caption: 'Same-side effects add value when users like you join. Cross-side effects add value when users unlike you join. Both are real network effects, but they respond to different growth strategies and create different competitive moats.',
      headers: ['Type', 'Mechanism', 'Example', 'Moat strength'],
      rows: [
        {
          cells: ['Same-side', 'More users like me makes the platform more useful for me', 'WhatsApp, iMessage, Facebook Groups', 'Strong — but clonable one cohort at a time'],
          tone: 'ok',
        },
        {
          cells: ['Cross-side', 'More users unlike me (opposite side) makes the platform more useful for me', 'Uber (drivers/riders), Airbnb (hosts/guests), Stripe (merchants/payers)', 'Very strong — requires building both sides simultaneously'],
          tone: 'ok',
        },
        {
          cells: ['Data network effect', 'More aggregate usage generates better data or models, improving the product for all users', 'Spotify Discover Weekly, Google Search, Netflix', 'Strong for model quality, but not social — no bilateral degradation'],
          tone: 'neutral',
        },
        {
          cells: ['Scale benefit (not a network effect)', 'More users lower per-unit cost or expand feature investment, but individual experience is unchanged by user count', 'Most SaaS products claiming network effects', 'Not a moat — do not call it one'],
          tone: 'warn',
        },
      ],
    },
  ],
}

// ── Chapter 6 ────────────────────────────────────────────────────────────────

const CH6: ChapterSeed = {
  slug: 'chapter-6',
  sort_order: 6,
  body_mdx: `## The trajectory of a dark pattern

Every dark pattern started as a growth experiment that worked. A notification increased daily active users. A misleading cancellation flow reduced churn. A confirmshaming prompt increased upgrade conversion. The metrics moved, the team shipped, and the next sprint started from the assumption that the pattern was valid because the A/B test said so.

Harry Brignull documented the first dark pattern taxonomy in 2010 at darkpatterns.org, naming confirmshaming, roach motel, misdirection, and disguised ads among the canonical types. The naming came from observation of patterns that were already widespread, which means the industry industrialized dark patterns before anyone had a vocabulary for them. The question is not whether the patterns work in the short term. They do. The question is what they cost.

## Dark pattern archetypes and their costs

<!-- figure:0 -->

## Zynga and the notification trap

Zynga's 2009 through 2012 growth was built substantially on aggressive notification patterns: FarmVille and CityVille sent multiple daily notifications to Facebook friends of players, regardless of those friends' interest in the game. The notifications generated significant acquisition and re-engagement in the short term. The mechanism was a growth loop in the technical sense: active players generated notifications, notifications produced new players or re-engaged dormant ones, new players generated more notifications.

The cost was extractive and eventually fatal to Zynga's platform position. Facebook imposed notification restrictions in 2012, directly limiting Zynga's distribution channel. Zynga's revenue fell from $1.28 billion in 2012 to $720 million in 2013. The growth loop had been running on borrowed trust from Facebook's social graph, and when Facebook removed the subsidy, the loop collapsed. The 2012 restriction was predictable from the pattern: Zynga was optimizing its own metrics at the expense of a metric Facebook cared about (user trust in the notification channel), and Facebook's response was rational.

## LinkedIn and the "people you may know" expansion

LinkedIn's "people you may know" email campaign in the mid-2010s sent connection suggestion emails to users' contacts who were not on LinkedIn, using uploaded contact data that users had shared in their own connection flows. Users whose email addresses appeared in other users' contact books received LinkedIn connection emails without having opted in to any LinkedIn communication. The campaign drove significant signup growth. It also generated substantial press coverage characterizing it as spam, multiple regulatory complaints in Europe, and a class action lawsuit filed in 2013 that settled for $13 million in 2015.

The growth loop worked on the acquisition side for several years. The reputational cost was significant and harder to measure, but surveys from that period consistently showed LinkedIn's brand perception among non-users declining while signups increased, which is the signature of a dark-pattern loop: metrics that look healthy in the product dashboard while brand equity erodes in channels the dashboard does not measure.

## The engineering perspective

Engineers who have worked in on-call rotations recognize the pattern. A quick fix that suppresses an alert makes the alerting dashboard look clean while the underlying condition worsens. Dark patterns are the growth equivalent: they move the metrics the team is watching while degrading the user relationship in a dimension the team is not watching. The fix becomes technical debt in the user trust account, which pays interest in churn, press coverage, and regulatory attention.

The practical implication for engineers building growth features is that any experiment that works by reducing friction on something the user did not choose to do deserves an explicit cost model before it ships. The notification that increases DAU by 3 percent should be weighed against the unsubscribe rate, the complaint rate, and the downstream retention effect on users who received it without wanting it.

## One handle to take with you

Before shipping any growth experiment that works by reducing the user's ability to say no (pre-checked boxes, hidden cancellation, misleading confirmations, unsolicited communications), model the full loop cost explicitly: short-term metric gain, estimated churn effect on manipulated users, and platform or regulatory exposure. If the model does not include all three, the experiment is incomplete.

Next: **Case: TikTok's algorithm as a growth loop** — the engineering behind the For You page, why it is a retention loop rather than a recommendation system, and what makes it structurally different from every prior social product.`,
  figures: [
    {
      kind: 'comparison_table',
      ariaLabel: 'Dark pattern archetypes, examples, and actual costs',
      caption: 'Dark patterns move short-term metrics while extracting costs in dimensions the dashboard does not measure. The cost is real and eventually larger than the gain.',
      headers: ['Pattern', 'Example', 'Short-term gain', 'Actual cost'],
      rows: [
        {
          cells: ['Roach motel', 'Easy to sign up, deliberately difficult to cancel (multiple confirmation screens, hidden cancel button)', 'Reduced churn rate', 'Regulatory exposure (FTC), retained users with negative sentiment who churn with complaints'],
          tone: 'warn',
        },
        {
          cells: ['Confirmshaming', '"No thanks, I don\'t want to save money" decline button on upgrade prompt', 'Increased upgrade conversion', 'Erodes user trust; detected quickly by design press; negative brand association'],
          tone: 'warn',
        },
        {
          cells: ['Unsolicited contact harvesting', 'Sending connection or signup emails to contacts uploaded by other users (LinkedIn)', 'Acquisition growth', 'Class action exposure, regulatory complaints, brand perception decline among non-users'],
          tone: 'warn',
        },
        {
          cells: ['Notification spam', 'Multiple daily re-engagement notifications regardless of user preference (Zynga)', 'DAU increase, re-engagement rate', 'Platform distribution risk; when platform cuts access, the loop collapses instantly'],
          tone: 'warn',
        },
      ],
    },
  ],
}

// ── Chapter 7 ────────────────────────────────────────────────────────────────

const CH7: ChapterSeed = {
  slug: 'chapter-7',
  sort_order: 7,
  body_mdx: `## What makes TikTok different

TikTok's For You page is not a recommendation system in the conventional sense. A recommendation system takes a user's stated preferences or prior behavior and returns content the user is likely to enjoy. The For You page does something different: it uses immediate engagement signal (watch time, replay, completion, share, comment) to continuously update a real-time model of what will produce more of that engagement in the next session. It is a perpetual retention loop, not a recommendation engine.

The distinction matters for the engineering. A recommendation system is a function from user history to ranked content. A retention loop is a feedback control system where every session's output (engagement signal) becomes the next session's input (model weights or ranking parameters). ByteDance's engineers built the second thing, and the product behavior it produces is categorically different from anything that ran on a social graph.

## The loop structure

<!-- figure:0 -->

## The interest graph vs the social graph

Every major social product before TikTok was built on a social graph: Instagram showed you content from people you followed, Twitter showed you tweets from accounts you subscribed to, YouTube showed you content from channels you subscribed to or from videos similar to ones you had watched. The social graph is a proxy for interest, and it works reasonably well when users' social connections are good proxies for their content preferences.

TikTok launched in Western markets in 2018 with a product that had no social graph requirement. The For You page showed content to new users with zero followers before any social graph could be established, and the content was often better than what users saw on Instagram or Twitter from accounts they had curated over years. The mechanism was the interest graph: a direct model of content preferences built from engagement signal rather than social relationships.

The engineering insight is that the social graph is a high-latency signal. It requires the user to make explicit choices (follow, subscribe, connect) and then update those choices over time as their interests change. The engagement signal is a low-latency signal: every watch completion, every scroll-past, every replay is a near-instantaneous preference update. The interest graph built from engagement signal converges faster and tracks taste drift more accurately than the social graph.

## The perpetual scroll mechanism

TikTok's retention loop has a second structural property that distinguishes it from prior social products: the content format (short video, 15 seconds to 3 minutes) is designed to minimize the cognitive cost of continuing. Each video ends and the next one begins automatically. The decision to continue is opt-out rather than opt-in.

Instagram and Facebook both implemented infinite scroll, but the content format (static images, longer captions) required a visible re-engagement decision at the end of each item. TikTok's auto-advance converts the engagement decision from "should I keep scrolling" to "should I stop scrolling," which is psychologically distinct. Behavioral economics literature on defaults (Thaler and Sunstein's "Nudge," 2008) documents that opt-out default behaviors increase participation rates substantially relative to opt-in defaults. TikTok applied this to session continuation.

## What the loop produces at scale

ByteDance has reported TikTok session lengths of 89 minutes per day for US users (2022 estimate, cited in multiple advertising deck leaks and press analyses). For context, Instagram's equivalent figure was approximately 30 minutes per day and Facebook's was approximately 33 minutes in 2022. The difference is not primarily explained by content quality. It is explained by the retention loop architecture: TikTok's feedback cycle has a shorter cycle time (each video is seconds long), a tighter engagement signal (watch completion is an unambiguous preference signal), and a default-continue mechanic that eliminates the friction of re-engagement at the end of each item.

The loop also has a creator-side flywheel. TikTok's algorithm surfaces new creators based on early engagement signal rather than follower count, which means a creator with zero followers can reach a large audience in their first week if their content generates strong watch completion. This creates a content supply loop: potential creators see others with zero followers going viral, lower their barrier to posting, post, receive immediate feedback from the algorithm, and either continue posting or exit. The supply of content is continuously self-replenishing in a way that YouTube and Instagram, where audience building required years of follower accumulation, were not.

## The engineering summary

The For You page is a feedback control system with three load-bearing properties: a low-latency input signal (video engagement), a short cycle time (seconds per feedback loop), and a default-continue mechanic that reduces session exit friction. The social graph is an optional layer that adds signal but is not required for the loop to function. This architecture produced the fastest user acquisition to 1 billion monthly active users of any consumer product in history (achieved in roughly five years from the 2016 global launch).

The lesson for engineers building growth loops is structural: the signal quality, cycle time, and default behavior of a loop matter more than the content or the social features. TikTok did not win because it had better content or a larger social graph. It won because its feedback loop converged faster and continued with less friction.

## One handle to take with you

For any engagement loop, identify the cycle time, the signal quality, and the default behavior at loop end. TikTok's advantage on all three dimensions is what separates it from prior social products. Most products can be improved on at least one dimension without a full rebuild.

That is the end of the module. The growth loop vocabulary, the K-factor math, the retention curve diagnostics, and the architectural lesson from TikTok are the tools. Put them to work on the product in front of you.`,
  figures: [
    {
      kind: 'connected_boxes',
      ariaLabel: "TikTok's For You page retention loop, step by step",
      caption: "TikTok's retention loop is a feedback control system. Every session's engagement signal updates the model for the next session. The short cycle time (seconds per video) means the loop converges on user preference far faster than any social-graph-based product.",
      orientation: 'vertical',
      showArrows: true,
      boxes: [
        {
          label: 'User opens TikTok',
          body: ['For You page serves content based on current interest model', 'No social graph required for first session'],
          tone: 'neutral',
        },
        {
          label: 'Engagement signal captured',
          body: [
            'Watch time, completion rate, replay, share, comment, scroll-past',
            'Each video generates a preference signal within seconds',
          ],
          tone: 'neutral',
        },
        {
          label: 'Interest model updated',
          body: [
            'Signal updates content ranking for the current and future sessions',
            'Interest graph converges faster than social graph because signal is immediate',
          ],
          tone: 'ok',
        },
        {
          label: 'Auto-advance to next video',
          body: [
            'Default-continue mechanic: user must opt out, not opt in, to stop',
            'Eliminates re-engagement friction at the end of each item',
          ],
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
    console.error(`[seed-growth-loops] module ${MODULE_SLUG} not found:`, mod.error)
    process.exit(1)
  }
  console.log(`[seed-growth-loops] module ${MODULE_SLUG} -> ${mod.data.id}`)

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

  console.log('\n[seed-growth-loops] Done.')
}

run().catch(e => { console.error(e); process.exit(1) })

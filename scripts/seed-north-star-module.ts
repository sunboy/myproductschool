// scripts/seed-north-star-module.ts
//
// Seeds North Star module prose + structured figures.
// Run: npx tsx --tsconfig tsconfig.json scripts/seed-north-star-module.ts

import { createClient } from '@supabase/supabase-js'
import type { ChapterFigure } from '../src/lib/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const MODULE_SLUG = 'north-star'

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
  body_mdx: `## The gap

A team can ship every sprint, hit every deadline, and still build the wrong thing. Output metrics make that invisible. Outcome metrics make it impossible to ignore.

The distinction is not semantic. Output metrics count the work: features shipped, bugs closed, deploys per day, lines of code. They are easy to measure because they describe activity the team controls. Outcome metrics count what changed for the user: activation rate, retention, revenue, time saved. They are harder to measure because they describe a reaction outside the team's direct control, a real person choosing to come back or not, to pay or not, to recommend or not.

Marty Cagan draws the line sharply in *Empowered* (2020): "We need teams of missionaries, not mercenaries." A mercenary team hits its output targets. A missionary team hits the user outcome and figures out the output required to get there. The difference in how they measure progress is the same as the difference in their orientation to the user.

## What output metrics hide

<!-- figure:0 -->

## The substitution problem

Output metrics are not wrong. They are incomplete. The problem is that they can be optimized independently of the outcome, which means a team can score well on the output metric while the outcome deteriorates. Facebook shipped more features between 2016 and 2018 than almost any team in history. Engagement time increased. But the metric the product team was actually proud of, daily active users sharing content, flattened. John Cutler, writing on substack in 2022, named this the "activity trap": optimizing for the metric of doing things rather than the metric of things changing for users. "We shipped twelve features" is output. "Three of those twelve features are being used by 60 percent of users daily" is outcome.

The substitution is seductive because output is immediate and outcome is lagged. A feature ships on Tuesday. Whether users actually change behavior because of it takes weeks to measure. Output metrics give the team a reward signal that arrives same-day. Outcome metrics make the team wait, which is uncomfortable, which is why the substitution happens so easily in teams under delivery pressure.

## A concrete example

Spotify's early growth team ran into this problem in 2014 when the engineering team was shipping two new features per sprint and engagement time was rising. Both were output metrics that looked healthy. The outcome metric they eventually put in place was "time to first meaningful listen", defined as how quickly a new user got to a song they chose to replay. That metric captured actual user value, not activity, and it pointed at a different set of problems than engagement time did. Features that increased engagement time but slowed the path to first meaningful listen turned out to be noise, and the team cut several of them after the new metric surfaced the conflict.

## One handle to take with you

For any metric currently on the team's dashboard, ask whether it can go up while the user gets worse off. If yes, it is an output metric. Keep it for operational monitoring, but find the outcome metric it is supposed to serve.

Next: **The North Star Metric framework**, one number chosen to represent the value being delivered so the team can optimize in one direction at once.`,
  figures: [
    {
      kind: 'comparison_table',
      ariaLabel: 'Output metrics vs outcome metrics with examples',
      caption: 'Output metrics describe team activity. Outcome metrics describe user change. The gap between them is where teams get busy building the wrong things.',
      headers: ['Output metric', 'Outcome metric it is supposed to serve'],
      rows: [
        { cells: ['Features shipped per sprint', 'Feature adoption rate (used by >10% of users weekly)'], arrow: true, tone: 'neutral' },
        { cells: ['API response latency (p99)', 'Task completion rate without errors'], arrow: true, tone: 'neutral' },
        { cells: ['Daily deploys', 'Time to value for new users'], arrow: true, tone: 'neutral' },
        { cells: ['Bugs closed', 'User-reported satisfaction with reliability'], arrow: true, tone: 'neutral' },
        { cells: ['Engagement time', 'Retention at 30 days'], arrow: true, tone: 'neutral' },
      ],
    },
  ],
}

// ── Chapter 2 ────────────────────────────────────────────────────────────────

const CH2: ChapterSeed = {
  slug: 'chapter-2',
  sort_order: 2,
  body_mdx: `## One number

A North Star Metric is the single number that best captures the value a product delivers to users. Every team initiative, every sprint goal, every tradeoff should move it up or be cut.

The framework was popularized by Sean Ellis, who coined the term "North Star Metric" while advising growth teams at Dropbox, Eventbrite, and LogMeIn around 2010. Ellis's original definition was operational: a single metric that, if it moves in the right direction consistently, predicts long-term retention and revenue. Amplitude's North Star Playbook, published in 2019, formalized the framework for product teams and added one important refinement: the North Star Metric must capture the value users get, not the value the company extracts. A metric like "revenue per user" fails the test because it measures extraction. A metric like "nights booked" (Airbnb) or "messages sent" (Slack) passes because it measures the value exchange from the user's side.

## The anatomy of a good North Star

<!-- figure:0 -->

## What makes Slack's metric work

Slack's North Star Metric is messages sent, and specifically the threshold they published in 2015: teams that sent 2,000 messages on Slack retained at dramatically higher rates than those that did not. The metric passed four tests simultaneously. It captured user value: a message sent is a coordination task completed. It was leading: message volume predicted retention weeks before the retention outcome was observable. It was controllable: product decisions could directly affect it. And it aligned the full team: design, engineering, growth, and customer success all had obvious levers to pull on message volume, without any cross-functional translation required.

Airbnb's metric, nights booked, works for the same structural reasons. A night booked means a guest found a host they trusted enough to pay, which captures the core value proposition of the platform in a single observable event. It is leading (bookings predict repeat use), controllable (trust features, search quality, pricing tools all affect it directly), and aligning (every function in the company has an obvious connection to it).

## What happens without one

The failure mode John Cutler documents most often in his writing on product dysfunction is what he calls "metric proliferation": a team tracking fourteen metrics simultaneously, each owned by a different function, with no agreed-on hierarchy. Marketing optimizes for click-through rate. Growth optimizes for activation. Retention optimizes for 30-day MAU. Engineering optimizes for uptime. All four metrics can go up simultaneously while the product's core value delivery declines, because none of the four is the thing the user actually came for. The North Star Metric resolves this by creating a single answer to the question "are we winning for users right now."

## A concrete example

Amplitude published their own North Star Metric process in 2019 and named their metric as "weekly learning users", defined as the number of distinct users who queried their product analytics dashboard at least once in a week. The metric passed all four tests: it captured actual product value (a query means someone got an answer they needed), it was leading (weekly active querying predicted account expansion), it was controllable (onboarding flows, alerting features, and template libraries all drove it), and it was aligning (every team from sales to engineering had a visible connection to it).

## One handle to take with you

A North Star Metric must answer one question: what is the thing our users do that proves they got the value we promised? If the answer is not obvious from the metric alone, the metric is probably output dressed as outcome.

Next: **AARRR: Pirate metrics**, the framework every PM knows and most misapply, and how it maps onto the North Star.`,
  figures: [
    {
      kind: 'connected_boxes',
      ariaLabel: 'Four tests for a good North Star Metric',
      caption: 'A North Star Metric must pass all four tests. Passing three of four produces a metric that looks right in planning and fails in practice.',
      orientation: 'vertical',
      showArrows: false,
      boxes: [
        { label: 'Captures user value', body: ['Measures what users get, not what the company extracts'], tone: 'ok' },
        { label: 'Leading indicator', body: ['Moves before retention or revenue outcomes are visible'], tone: 'ok' },
        { label: 'Controllable', body: ['Product decisions have direct, legible levers on it'], tone: 'ok' },
        { label: 'Aligning', body: ['Every function can connect their work to it without translation'], tone: 'ok' },
      ],
    },
  ],
}

// ── Chapter 3 ────────────────────────────────────────────────────────────────

const CH3: ChapterSeed = {
  slug: 'chapter-3',
  sort_order: 3,
  body_mdx: `## Five buckets

Dave McClure named the five stages of a user's relationship with a product in a 2007 presentation at 500 Startups: Acquisition, Activation, Retention, Referral, Revenue. The acronym stuck because it is a decent taxonomy. The misapplication stuck harder.

AARRR was meant as a funnel diagnostic, a way to identify which stage of the user lifecycle was leaking so a team could direct effort there. In the years since McClure's presentation, it became something different in practice: a metric checklist that teams fill in because it is expected, without ever asking which bucket their North Star lives in or whether they are optimizing the right stage for their product's current moment. A B2B SaaS product in year one should almost never be optimizing for Referral. A consumer social product that has not hit 30-day retention above a threshold should not be spending engineering cycles on Revenue optimization. AARRR tells you where to look; it does not tell you where to look right now.

## The five stages

<!-- figure:0 -->

## The misapplication in detail

The canonical misapplication is optimizing Acquisition while Retention is below threshold. Every new user acquired at a leaky retention rate is a subsidy for a broken product. The cost of acquiring a user is spent whether or not the user stays. If retention at 30 days is below the threshold for the product category (roughly 25-40% for consumer apps, 60-80% for B2B SaaS according to Andreessen Horowitz's 2021 benchmarks), improving acquisition is making the leak faster, not fixing it.

The second common misapplication is confusing Activation with Retention. Activation is the moment a user first experiences core product value, the first booked night, the first sent message, the first completed analytics query. Retention is the user choosing to return. A product can have high Activation and collapsing Retention if the first-value experience is good but the repeat-value experience is broken. Many consumer apps optimized heavily for Activation in 2019-2021 based on app store install numbers and mistook that metric for a healthy funnel.

## Where the North Star fits in AARRR

The North Star Metric almost always lives at one stage of the funnel and leads the others. Slack's "messages sent" is a Retention-stage metric: the threshold of 2,000 messages is definitionally about repeat use, not first use. Airbnb's "nights booked" sits between Activation and Retention: the first booking is an Activation event, but the metric compounds into a Retention story over time. Identifying which AARRR stage the North Star metric lives in tells the team which upstream stages to invest in as unlocks vs which to monitor as guardrails.

## A concrete example

Twitter in 2010 was optimizing for Acquisition heavily. New signups were the company's headline metric and the growth team was world-class at it. The problem identified by Josh Elman, then on the growth team, was that Retention at 30 days was below 20% for most cohorts. Elman's discovery, documented in his widely-circulated 2012 post, was that users who followed at least 30 accounts in their first week retained at dramatically higher rates. That was the Activation threshold. Once the team identified it, they shifted from Acquisition optimization to Activation optimization. Signups went down slightly. Retained users went up significantly. The North Star moved correctly because the team identified the right AARRR stage to optimize first.

## One handle to take with you

Before citing AARRR in any product discussion, name which single bucket the current sprint's work is supposed to move. If the team cannot agree on which bucket, the alignment problem is upstream of the metric framework.

Next: **Guardrail metrics**, the safeguards that prevent a North Star from becoming a dark pattern.`,
  figures: [
    {
      kind: 'comparison_table',
      ariaLabel: 'AARRR stages with definitions and common misapplications',
      caption: 'Each stage has a natural North Star candidate and a canonical misapplication. Most teams that misuse AARRR are optimizing the right stage at the wrong time in their product lifecycle.',
      headers: ['Stage', 'What it measures', 'Common misapplication'],
      rows: [
        { cells: ['Acquisition', 'New users entering the product', 'Optimizing when Retention is below threshold'], tone: 'warn' },
        { cells: ['Activation', 'First experience of core value', 'Conflating with Retention; treating install as activation'], tone: 'warn' },
        { cells: ['Retention', 'Users choosing to return', 'Tracking DAU/MAU ratio without defining "active"'], tone: 'ok' },
        { cells: ['Referral', 'Users bringing others', 'Running referral programs before product-market fit'], tone: 'warn' },
        { cells: ['Revenue', 'Value captured from users', 'Using as North Star when it measures extraction, not value'], tone: 'warn' },
      ],
    },
  ],
}

// ── Chapter 4 ────────────────────────────────────────────────────────────────

const CH4: ChapterSeed = {
  slug: 'chapter-4',
  sort_order: 4,
  body_mdx: `## The safeguards

Every optimization has a dark side. Guardrail metrics are the numbers a team agrees in advance not to let deteriorate, even if the North Star is moving up.

Without guardrails, a North Star metric is an invitation to find the fastest path to the number, and the fastest path is usually a dark pattern. YouTube's North Star for most of 2012-2016 was watch time. Watch time went up. Content quality, by almost any human judgment, went down. The algorithm discovered that outrage and anxiety drove longer viewing sessions than satisfaction did, and optimized accordingly. The watch time metric was not broken. The absence of a guardrail on user wellbeing or content quality meant the optimization pressure had nowhere to go except toward the dark pattern.

Facebook ran the same dynamic from 2016 to 2018. Engagement rate, measured as likes, comments, and shares per session, was the headline metric. It went up. The guardrail that was missing was a measure of whether engagement was positive or negative for users. Anger-inducing content generated three to five times more engagement than neutral content, a finding documented in internal research that became public in 2021. The metric was correct as a measure of activity. The guardrail that should have constrained which kinds of activity counted was absent.

## Guardrail categories

<!-- figure:0 -->

## The structure of a guardrail

A guardrail metric has three components: a metric name, a direction (minimum or maximum threshold), and an agreed consequence. "User-reported satisfaction must not fall below 4.2 out of 5" is a guardrail. "We should try to keep satisfaction high" is not. The consequence matters: if the guardrail trips and the team has no agreed protocol for what happens next, the guardrail is decorative. The most functional guardrail structures (Spotify, Duolingo, and Airbnb have all published versions of theirs) define three zones: green (North Star moves, guardrails hold), yellow (guardrail approaching threshold, requires explanation), and red (guardrail tripped, sprint paused for diagnosis before proceeding).

## The engineering analogy

Error budgets in SRE culture are a guardrail mechanism. The North Star of a reliability team might be deployment frequency: ship fast. The guardrail is the error budget, the maximum allowable downtime per rolling window. When the error budget is exhausted, the team stops shipping new features and works only on reliability. The guardrail has teeth. It is not optional when violated. PM teams that have not internalized this mechanic tend to treat guardrails as suggestions that apply until the pressure is high enough, which is exactly the condition under which a North Star becomes a dark pattern.

## A concrete example

Duolingo published their guardrail structure in 2022 through their PM team's blog. Their North Star Metric at the time was DAL, daily active learners, with a specific definition of "learner" that required completing at least one lesson. Their guardrails included a minimum threshold on 30-day retention, a maximum threshold on push notification opt-out rate, and a minimum threshold on lesson completion rate. When A/B tests improved DAL by increasing notification frequency, the opt-out guardrail tripped repeatedly, forcing the team to find growth paths that did not rely on notification pressure. The guardrails created productive constraints that improved the quality of growth, not just the quantity.

## One handle to take with you

For any North Star Metric, write down two guardrails before the first sprint that targets it: one for the user's experience and one for the business's long-term health. Guardrails that are not written down before optimization pressure begins do not exist.

Next: **When metrics lie**, Goodhart's Law and what happens when the metric becomes the goal.`,
  figures: [
    {
      kind: 'comparison_table',
      ariaLabel: 'Guardrail metric categories with examples',
      caption: 'Guardrail metrics fall into three categories. Each category corresponds to a different kind of optimization pressure that a North Star creates.',
      headers: ['Guardrail category', 'What it protects against', 'Example'],
      rows: [
        { cells: ['User wellbeing', 'Dark patterns that trade user health for engagement', 'Notification opt-out rate must stay below 8%'], tone: 'ok' },
        { cells: ['Content / experience quality', 'Race-to-the-bottom content to drive activity', 'User-reported satisfaction must stay above 4.2/5'], tone: 'ok' },
        { cells: ['Business health', 'Short-term metric gains that damage long-term economics', 'Churn rate must not exceed 3% monthly'], tone: 'neutral' },
        { cells: ['Ethics / compliance', 'Regulatory or reputational exposure from metric pressure', 'Reported policy violations must not exceed baseline'], tone: 'warn' },
      ],
    },
  ],
}

// ── Chapter 5 ────────────────────────────────────────────────────────────────

const CH5: ChapterSeed = {
  slug: 'chapter-5',
  sort_order: 5,
  body_mdx: `## The law

"When a measure becomes a target, it ceases to be a good measure." Charles Goodhart stated this in a 1975 paper on monetary policy, and it has been true of every metric in every industry ever since.

Goodhart was describing what central banks do when governments set a target for a proxy metric: the proxy stops tracking the underlying phenomenon and starts tracking the optimization pressure. M3 money supply was used as a policy target in the UK in the early 1980s. Banks found ways to reclassify assets that shifted M3 without actually expanding the money supply. The target was hit. The economy did not improve. The metric had been taught to behave.

The same dynamic is active in every product team that has ever run long enough on a single metric without rotating it or adding guardrails. The metric is not lying in the sense of being inaccurate. It is reporting exactly what happened. The problem is that what happened is no longer the thing the metric was originally measuring. It is measuring the team's optimization pressure, which the team has gotten very good at applying.

## Three ways metrics fail Goodhart's test

<!-- figure:0 -->

## The Wells Fargo case

The most documented business example of Goodhart's Law is Wells Fargo's fake account scandal. The metric was accounts opened per branch per month. The target was specific and tied to compensation. The proxy made sense originally: more accounts meant more customers, which meant more value delivered. Once the target was set with teeth, branch managers and employees found a path to the metric that bypassed the underlying phenomenon entirely. At peak, employees were opening accounts customers had not requested and did not know about. The metric hit record highs in 2016. The bank paid $3 billion in fines in 2020. The measure had been teaching to the test for years.

The teaching-to-the-test variant is the most common in product. A team sets an activation metric: users who complete the onboarding checklist within 48 hours. Activation by this measure improves after the onboarding modal is made impossible to dismiss. Users complete the checklist to make it stop. The metric goes up. The underlying phenomenon, users who got value from onboarding, may have gone nowhere or down.

## The rotation protocol

The practical defense against Goodhart's Law is metric rotation combined with triangulation. Rotation means the North Star Metric changes when the team has learned to optimize it without producing the underlying outcome, typically every 12-18 months at fast-moving companies. Triangulation means the team always watches the metric alongside two or three complementary signals that cannot be optimized in the same direction simultaneously without producing the real outcome. If all three signals move together, the North Star is probably still tracking the real thing. If the North Star moves while the triangulation signals stagnate, the metric has been taught.

## A concrete example

Google's search team ran into this in the early 2010s. Click-through rate on search results was a leading indicator of search quality. It was also a metric teams could improve by writing more clickbait titles without improving the underlying result quality. The team's solution was to add "long-click rate", the fraction of clicks that did not return to the search results page within 30 seconds, as a triangulation signal. Long-click rate captures whether the result actually satisfied the query. The two metrics can only both go up if the result is genuinely good. The combination was resistant to Goodhart optimization in a way that click-through rate alone was not.

## One handle to take with you

For any metric the team has been running against a target for more than six months, ask whether there is a plausible path to hitting the target that does not produce the underlying outcome. If yes, that path is being explored somewhere in the organization right now.

Next: **Case: Netflix**, a billion-dollar metric change that is the clearest example of North Star thinking in practice.`,
  figures: [
    {
      kind: 'connected_boxes',
      ariaLabel: 'Three ways metrics fail under Goodhart optimization pressure',
      caption: 'Each failure mode produces the same surface result: the metric goes up while the underlying outcome does not. The failure mode determines which guardrail or triangulation signal catches it.',
      orientation: 'vertical',
      showArrows: false,
      boxes: [
        {
          label: 'Teaching to the test',
          body: ['Optimization finds a path to the metric that bypasses the phenomenon it measured'],
          anti: 'Onboarding checklist forced to complete; Wells Fargo accounts opened without customer request',
          tone: 'warn',
        },
        {
          label: 'Proxy drift',
          body: ['The metric was a good proxy when chosen; the product changed so the proxy no longer tracks the outcome'],
          anti: 'Engagement time tracking watch time after algorithm changed content mix',
          tone: 'warn',
        },
        {
          label: 'Survivorship bias',
          body: ['The metric only measures users who stayed; deteriorating experience for churned users is invisible'],
          anti: 'DAU/MAU ratio rising because dissatisfied users churned before the measurement window',
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
  body_mdx: `## The change

Netflix had 100 million subscribers in 2017 and was spending $6 billion a year on content. The metric guiding content acquisition for most of the prior decade was catalog size: titles available to stream. More titles meant more choice, which the team assumed meant more retention. Reed Hastings eventually stopped counting titles in the catalog. The change in metric produced a content strategy shift worth, by Netflix's own internal estimates shared at a 2019 industry conference, over $1 billion in avoided spending on low-retention content.

The catalog size metric was an output metric that had become a target. Netflix had 15,000 titles in 2014 and its content team was evaluated partly on adding to that number. Ted Sarandos, then Chief Content Officer, made the case internally that the right metric was not "how many things can people choose to watch" but "what fraction of subscribers watched something they chose to continue watching." The shift from catalog size to content completion rate and series continuation rate changed which content got renewed, which got cancelled, and which got acquired in the first place.

## What Netflix measured instead

<!-- figure:0 -->

## Why this is a masterclass in North Star thinking

The Netflix case illustrates all four properties of a strong North Star Metric in one decision. The new metric, completion rate on series content, captures user value: a user who watched episode 1 and chose to watch episode 2 got something they valued enough to continue. It is leading: completion rate in week one predicts subscriber retention at 90 days more reliably than catalog size ever did. It is controllable: content acquisition, production quality, recommendation algorithm, and thumbnail design all have direct levers on it. And it is aligning: every function from creative to engineering to data science has an obvious connection to completion rate, without cross-functional translation required.

Catalog size failed the first test. It measured the company's output, not the user's experience. A user with 15,000 titles they do not want to watch is worse off than a user with 500 titles that are reliably excellent for their taste. The metric was measuring the team's activity, not the user's satisfaction.

## The recommendation algorithm connection

The completion rate metric also drove a product decision that is now part of Netflix's public case study library: the personalization algorithm's objective function. In 2013, Netflix's recommendation system was optimizing for predicted star rating, a measure the team had imported from the Netflix Prize competition. The problem Carlos Gomez-Uribe and Neil Hunt documented in their 2015 ACM paper was that predicted star ratings optimized for prestige content (documentaries, foreign films) that users rated highly but rarely finished. Switching the algorithm objective to predicted play probability and completion rate shifted recommendations toward content users would actually watch. The metric change in the product team drove the algorithm change in the engineering team, which is the alignment property working exactly as intended.

## What the $1 billion number represents

The $1 billion figure is an estimate of the content spend that would have gone to low-completion titles under the catalog-size regime that instead was redirected to high-completion content or not spent at all. It is not a revenue figure. It is a cost avoidance figure. The metric change did not produce $1 billion in new revenue. It prevented $1 billion from being spent on content that data suggested would not produce retention. The distinction matters for how the case is cited: this is not a growth story, it is a resource allocation story driven by a metric change.

## One handle to take with you

In any product review where catalog size, feature count, or volume of any kind is cited as a success metric, ask what fraction of those items users actually engaged with. The denominator is almost always more informative than the numerator.

Next: **Picking metrics in a PM interview**, what interviewers are actually scoring and how to demonstrate North Star thinking under interview conditions.`,
  figures: [
    {
      kind: 'mapping_diagram',
      ariaLabel: 'Netflix metric shift from catalog size to completion rate',
      caption: 'Netflix replaced an output metric with an outcome metric and every downstream decision changed. The arrow represents a causal chain: metric change drove content strategy, which drove algorithm objective, which drove user retention.',
      sourcesLabel: 'Old metric (output)',
      targetsLabel: 'New metric (outcome) and what it drove',
      sources: ['Catalog size (titles available to stream)'],
      targets: [
        { label: 'Completion rate on series content', body: 'Did the user choose to continue watching?', tone: 'ok' },
        { label: 'Content acquisition strategy', body: 'Fund high-completion titles; cancel low-completion ones', tone: 'ok' },
        { label: 'Recommendation algorithm objective', body: 'Optimize for predicted play + completion, not star rating', tone: 'ok' },
      ],
      links: [
        { from: 0, to: 0 },
        { from: 0, to: 1 },
        { from: 0, to: 2 },
      ],
    },
  ],
}

// ── Chapter 7 ────────────────────────────────────────────────────────────────

const CH7: ChapterSeed = {
  slug: 'chapter-7',
  sort_order: 7,
  body_mdx: `## What the interview is

A PM interview metric question is not a test of whether the candidate knows AARRR or can name Goodhart's Law. It is a test of whether the candidate can identify a metric that actually captures user value, reason about the tradeoffs of that choice, and name a guardrail without being prompted. Most candidates fail the first test and never reach the other two.

The failure mode Shreyas Doshi describes most consistently in his writing on PM interviews is what he calls "surface knowledge": the candidate can name the frameworks but cannot reason about which metric fits which situation. Doshi's observation, shared across multiple threads on X between 2021 and 2023, is that the strongest PM candidates treat metric questions as design problems: there is a user, there is a value exchange, the metric should capture the exchange as precisely as possible. Weak candidates treat metric questions as recall problems: which framework applies here, AARRR or HEART or something else.

## What interviewers score

<!-- figure:0 -->

## How to demonstrate North Star thinking

The structure that consistently scores well in metric questions has four moves, in order. Name the user and the value exchange before naming any metric. This is the signal that the candidate is reasoning from user value rather than from a framework checklist. State the proposed metric and explain why it captures the value exchange, not just the activity. This separates candidates who know the difference between output and outcome from those who do not. Name one guardrail without being asked. This is the signal that the candidate has internalized the dark pattern problem: they know that optimizing for the metric without a constraint produces a worse user experience. Name one way the metric could fail Goodhart's test and what would signal that it had. This is the senior-signal move. Most interviewers do not expect it from junior candidates, but every interviewer notices it when it appears.

## The most common mistake

The most common mistake in PM interview metric questions is proposing revenue or DAU as the North Star for every product, regardless of the product's stage or value proposition. Revenue fails the user-value test for early-stage products because it measures extraction before the value exchange is established. DAU fails the precision test for almost every product because the definition of "active" is so loose that the metric is nearly meaningless without a specific activity threshold. Interviewers at Meta, Google, and Stripe have all written versions of the same observation: proposing DAU as a North Star in the first 30 seconds is a signal that the candidate has not thought about what value the product actually delivers.

## A concrete example

A strong answer to "how would you measure success for Slack" starts with the value exchange: Slack succeeds when teams coordinate faster and with less friction than they would without it. That suggests the metric should capture successful coordination, not just activity. Messages sent is a reasonable proxy, but the interviewer is listening for whether the candidate names the threshold (the 2,000-message inflection point), the guardrail (notification opt-out rate, or user-reported communication satisfaction), and the Goodhart risk (a product that makes it easy to send many messages to say little is gaming the metric without delivering value). A candidate who names all four is demonstrating North Star thinking, not just metric knowledge.

## One handle to take with you

In any interview metric question, the first sentence should name the user and describe what value they get from the product. Everything after that flows from that sentence. If the first sentence names a framework instead of a user, the answer has already started on the wrong footing.

That is the end of the module. The next step is to practice: take any product you use daily and try to name its North Star Metric, one guardrail, and one way the metric could fail Goodhart's test. That exercise, run seriously on three products, is worth more than re-reading this module.`,
  figures: [
    {
      kind: 'comparison_table',
      ariaLabel: 'What interviewers score in metric questions with signals for each level',
      caption: 'Interviewers score four distinct moves in a metric question. Most candidates pass the first two and stop there. The third and fourth moves separate candidates who have internalized the framework from those who have memorized it.',
      headers: ['What they score', 'Weak signal', 'Strong signal'],
      rows: [
        { cells: ['User-value orientation', 'Names a metric immediately (DAU, revenue)', 'Names the user and value exchange before any metric'], tone: 'ok' },
        { cells: ['Output vs outcome', 'Proposes an output metric (features, sessions)', 'Proposes a metric that captures user change, not team activity'], tone: 'ok' },
        { cells: ['Guardrail awareness', 'No guardrail mentioned unless prompted', 'Names one guardrail unprompted, explains what it prevents'], tone: 'ok' },
        { cells: ['Goodhart awareness', 'Does not address metric failure modes', 'Names one way the metric could be gamed and what would reveal it'], tone: 'ok' },
      ],
    },
  ],
}

const CHAPTERS: ChapterSeed[] = [CH1, CH2, CH3, CH4, CH5, CH6, CH7]

async function run() {
  const mod = await supabase.from('learn_modules').select('id').eq('slug', MODULE_SLUG).single()
  if (mod.error || !mod.data) {
    console.error(`[seed-north-star] module ${MODULE_SLUG} not found:`, mod.error)
    process.exit(1)
  }
  console.log(`[seed-north-star] module ${MODULE_SLUG} -> ${mod.data.id}`)

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

  console.log('\n[seed-north-star] Done.')
}

run().catch(e => { console.error(e); process.exit(1) })

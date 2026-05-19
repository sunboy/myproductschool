// scripts/seed-product-debug-module.ts
//
// Seeds Product Debug module prose + structured figures.
// Run: npx tsx --tsconfig tsconfig.json scripts/seed-product-debug-module.ts

import { createClient } from '@supabase/supabase-js'
import type { ChapterFigure } from '../src/lib/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const MODULE_SLUG = 'product-debug'

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
  body_mdx: `## The first instinct will be wrong

DAU dropped 15%. The number lands in a Slack channel at 9am and the room immediately produces a theory. Someone says it was the deploy on Wednesday. Someone else says they heard TikTok had an outage that redirected traffic. A third person pulls up the dashboard and says "looks like iOS is down." Three theories, none of them tested, all of them produced in under two minutes by people who have not yet seen a single disaggregated metric.

That is the diagnostic loop's biggest enemy: premature convergence. The human brain reaches for pattern matching because pattern matching is fast and usually correct. In product debugging it is fast and usually wrong, because metric drops have dozens of plausible causes and the most salient-sounding one is almost never the right one. Brian Balfour, who ran growth at HubSpot for years, calls this "hypothesis debt": every unexamined theory that feels satisfying keeps the team from running the hypothesis that would actually isolate the cause.

## The loop

<!-- figure:0 -->

## What the loop is doing

The diagnostic loop is a four-step cycle: observe, decompose, hypothesize, test. Observe means reading the raw number in context, not just its face value, including time of change, platform breakdown, and whether any other metrics moved simultaneously. Decompose means breaking the top-line metric into its constituent parts until the drop has a location in the funnel. Hypothesize means generating a list of explanations that are consistent with the decomposed data, not with prior intuition. Test means eliminating hypotheses cheaply before committing engineering resources to any of them.

The reason the loop exists is that debugging a metric is structurally different from debugging code. In code debugging, the feedback loop is seconds, the state is observable, and the failure surface is usually local. In metric debugging, the feedback loop is days, the state is partially observable, and the failure surface can be anywhere from infrastructure to competitor pricing. The loop compensates for the slow feedback by making each step much cheaper than the one that follows it. Decomposition costs minutes. A hypothesis costs nothing. An A/B test costs weeks. Running the loop in order keeps the expensive steps reserved for the hypotheses that survive the cheap ones.

Lenny Rachitsky's metric drop analysis framework, which he documented in his newsletter after interviewing growth practitioners at Airbnb, Figma, and Duolingo, describes the same sequence under different labels. His core observation is that practitioners who skip decomposition almost always waste their first experiment, because they are testing the wrong hypothesis against the wrong segment. The loop's value is sequencing, not any individual step.

## Why engineers are well-positioned for this

Debugging a metric and debugging a system share the same underlying structure: a symptom, a search space, a set of instruments, and a hypothesis-elimination process. Engineers who have debugged distributed systems under production load already know the discipline of not touching the system until the diagnostic reads are complete. The same discipline applies to metric debugging. The instinct to open a console and start changing things is exactly what kills both processes. Observe first. Decompose before hypothesizing. Hypothesize before testing.

## One handle to take with you

Before any theory leaves the room in a metric drop discussion, the team needs one thing: the metric broken down by at least two dimensions. Platform, time window, acquisition cohort, feature surface, anything. A theory generated before decomposition is noise. A theory generated after decomposition has at least a fighting chance of being testable.

Next: **External vs. internal causes**, why the first question is always whether the world changed, not whether the product changed.`,
  figures: [
    {
      kind: 'connected_boxes',
      ariaLabel: 'The four-step diagnostic loop',
      caption: 'The loop runs in sequence. Each step is cheaper than the one that follows it, so skipping steps always costs more than it saves.',
      orientation: 'horizontal',
      showArrows: true,
      boxes: [
        { label: 'Observe', body: ['Raw number in context', 'Other metrics moving?'], tone: 'neutral' },
        { label: 'Decompose', body: ['Break into constituent parts', 'Find where the drop lives'], tone: 'neutral' },
        { label: 'Hypothesize', body: ['List explanations consistent with data', 'Not with intuition'], tone: 'neutral' },
        { label: 'Test', body: ['Cheapest elimination first', 'Reserve experiments for survivors'], tone: 'ok' },
      ],
    },
  ],
}

// ── Chapter 2 ────────────────────────────────────────────────────────────────

const CH2: ChapterSeed = {
  slug: 'chapter-2',
  sort_order: 2,
  body_mdx: `## The world changes

The single most underweighted question in any metric drop is whether something outside the product changed. Practitioners skip it not because they know the answer but because it feels less actionable. If TikTok ran a big campaign and pulled attention away from your app for a week, there is nothing to fix. The instinct to find something fixable is strong enough to bypass the question entirely, which means teams spend two weeks investigating a bug that does not exist while a competitor's acquisition spike resolves on its own.

External causes come in three categories: seasonality, platform changes, and competitive events. Each has a different signal pattern and a different diagnostic approach.

## External cause categories

<!-- figure:0 -->

## Seasonality

Most consumer apps see weekly seasonality that averages out over months, but January and February are structurally different from April and May, and any year-over-year comparison that does not control for this will generate false positives. Fitness apps spike in January and decline in February. Tax software spikes in March. Travel apps spike before summer and before holidays. These patterns look like drops if the comparison window is wrong. The correct diagnostic is a year-over-year comparison against the same calendar period, not a week-over-week or month-over-month comparison. If the year-over-year is flat, the drop is seasonal. If the year-over-year is also down, something else is happening.

The pandemic years created a second seasonality problem: the 2020 and 2021 baselines for almost every consumer product are artificially high because people were at home with more time and more attention. Apps that benchmarked against pandemic peaks were diagnosing drops that were actually normalization. Products that had never seen that traffic before saw their growth reverse and called it a problem. It was, in a narrow sense, but the diagnostic had to be separated from the normalization signal before any remediation made sense.

## Platform changes

Apple's App Tracking Transparency rollout in April 2021 is the clearest large-scale natural experiment on external platform changes. ATT required apps to request explicit user permission before tracking behavior across other apps and websites. Opt-in rates settled around 25-30% for most categories. This effectively eliminated 70-75% of the data that mobile performance advertisers had used to target acquisition campaigns, and acquisition costs rose 30-50% across most mobile categories within weeks of the rollout. Facebook reported a $10 billion revenue headwind in 2022 attributable to ATT. Apps that saw acquisition DAU drop in Q3 2021 were not experiencing a product failure. They were experiencing the end of cheap mobile acquisition.

Any time a metric drop coincides with a platform-level event (iOS update, Android policy change, App Store algorithm shift, browser privacy change), external causation should be confirmed or ruled out first. The diagnostic is usually straightforward: check whether the drop pattern is uniform across acquisition cohorts or concentrated in paid/tracked acquisition channels. ATT showed up almost entirely in paid channels. Organic acquisition, including app store search and word-of-mouth referrals, was largely unaffected.

## Competitive events

A competitor's viral campaign, a major product launch, or a negative press cycle can pull attention away from a product for days or weeks. These events are detectable in two ways. The first is direct: check whether the competitor shows up in Google Trends, App Store charts, or social listening tools at the same time as the drop. The second is behavioral: attention-driven drops tend to be acquisition-side (fewer new users) rather than retention-side (existing users behaving differently). If DAU drops because new user acquisition fell, external attention is the first hypothesis. If DAU drops because existing users are returning less frequently, look inside the product.

The TikTok attention effect on every short-form app category from 2020 through 2023 is the canonical example. Every competitor saw some combination of acquisition slowdown and engagement drop as TikTok's time-in-app numbers rose. Attributing those drops to internal product failures, absent other evidence, was a diagnostic mistake that many growth teams made.

## One handle to take with you

The first three checks in any metric drop should be external: seasonality comparison against the prior year, platform event timeline, and competitor activity. If all three are clean, the investigation moves internal. Teams that skip this step regularly waste their first month of investigation on internal causes that do not exist.

Next: **Funnel decomposition**, finding where in the product the drop actually lives before generating any theory about why.`,
  figures: [
    {
      kind: 'comparison_table',
      ariaLabel: 'Three categories of external causes with diagnostic signals',
      caption: 'Each external cause category has a different signature in the data. Misdiagnosing an external cause as an internal one is one of the most common and expensive errors in metric debugging.',
      headers: ['Category', 'Signal pattern', 'Diagnostic check'],
      rows: [
        { cells: ['Seasonality', 'Drop matches prior-year calendar pattern', 'Year-over-year same-period comparison'], tone: 'neutral' },
        { cells: ['Platform change', 'Drop concentrated in paid/tracked channels', 'Correlate with platform event timeline'], tone: 'warn' },
        { cells: ['Competitive event', 'Acquisition-side drop, retention intact', 'Google Trends, App Store charts, social listening'], tone: 'warn' },
      ],
    },
  ],
}

// ── Chapter 3 ────────────────────────────────────────────────────────────────

const CH3: ChapterSeed = {
  slug: 'chapter-3',
  sort_order: 3,
  body_mdx: `## The drop has a location

A metric drop is not evenly distributed across the product. It lives somewhere specific in the funnel, and finding that location before generating theories about causes is the most important step in the diagnostic. Teams that skip funnel decomposition spend weeks building theories about the wrong part of the product.

The AARRR framework, acquisition-activation-retention-referral-revenue, is the canonical funnel decomposition for growth metrics. Dave McClure introduced it in 2007, and it has held up not because every product has all five stages but because it forces the diagnostic to name which stage is failing before asking why. DAU is a composite metric. It includes newly acquired users, re-engaged dormant users, and retained active users, all counted together. A 15% drop in DAU could be a 15% drop in any of those components, or a smaller drop in several of them, or a catastrophic drop in one of them offset by a rise in another. The face value of the metric tells you none of this.

## Where the drop lives

<!-- figure:0 -->

## The acquisition funnel

If DAU drops because fewer new users are reaching the activated state, the problem is in acquisition or onboarding. The signal is: new user counts are down, existing-user behavior is unchanged or only slightly affected. The next decomposition is to find where in the acquisition funnel the drop is: impressions, click-through, install, first session, activation. Each step has its own set of causes, and the step where the drop concentrates is the step to investigate.

Activation is particularly important and particularly undermonitored. The activation step is the moment a new user first experiences the core value of the product. For a social app, it might be the first time a user sees content from someone they follow. For a productivity app, it might be the first completed task. Defining this step is not always done cleanly, and many analytics implementations measure proxy events (account created, first login) rather than true activation events. When activation is poorly defined or poorly instrumented, drops in the activation stage are often invisible until they are large.

## The engagement and retention funnels

If DAU drops because existing users are returning less frequently, the problem is in engagement or retention. These two stages have different failure modes. Engagement failures tend to be content or feature problems: the feed algorithm changed, a key feature degraded, a content category dried up. Retention failures tend to be habit-loop problems: something about the product stopped generating the trigger that brought users back. Both are internal to the product, but they point at different teams and different fixes.

The hardest decomposition to do correctly is separating engagement from retention, because both show up in DAU. The most useful diagnostic is to break DAU by return frequency: users who return daily, users who return 2-4 times per week, users who return 1-4 times per month. A drop concentrated in the 2-4x per week segment is an engagement problem. A drop concentrated in the 1-4x per month segment, or a rise in dormancy, is a retention problem. These groups are genuinely different populations with different relationships to the product, and treating them the same way produces the wrong fix.

## The reactivation channel

Many products have a meaningful portion of DAU coming from reactivation: users who had gone dormant and came back via a push notification, email, or paid retargeting. If the reactivation channel degrades, DAU drops even if acquisition and organic retention are both healthy. This is a surprisingly common false alarm, because reactivation channels are often owned by a different team than the one investigating the DAU drop, and the handoff between teams means the diagnosis can take weeks to converge.

## One handle to take with you

The funnel decomposition question to answer before any theory is formed: at which stage of the funnel did fewer users pass through? Write the answer down. A theory generated before answering that question is almost certainly pointing at the wrong location.

Next: **Cohort analysis**, understanding whether the drop affects new users, existing users, or both, because those are completely different problems.`,
  figures: [
    {
      kind: 'connected_boxes',
      ariaLabel: 'Funnel decomposition stages from acquisition to revenue',
      caption: 'A DAU drop lives in one or more of these stages. Identifying the stage before theorizing about cause cuts the hypothesis space by roughly 80%.',
      orientation: 'horizontal',
      showArrows: true,
      boxes: [
        { label: 'Acquisition', body: ['Impressions, installs, store visits'], tone: 'neutral' },
        { label: 'Activation', body: ['First core-value moment'], tone: 'neutral' },
        { label: 'Engagement', body: ['Session depth, feature use'], tone: 'neutral' },
        { label: 'Retention', body: ['Return frequency, dormancy rate'], tone: 'neutral' },
        { label: 'Reactivation', body: ['Push, email, paid retargeting'], tone: 'ok' },
      ],
    },
  ],
}

// ── Chapter 4 ────────────────────────────────────────────────────────────────

const CH4: ChapterSeed = {
  slug: 'chapter-4',
  sort_order: 4,
  body_mdx: `## Same drop, different population

Two products, both reporting a 15% DAU drop, both with clean external checks, both with the drop located in the retention stage. One product's drop is driven entirely by users who joined in the last 30 days. The other's drop is driven entirely by users who joined more than a year ago. These are not the same problem. The first is an onboarding or early activation failure that affects new cohorts. The second is a long-term habit-loop failure, a change in what brings established users back. Running the same diagnostic and proposing the same fix for both is how six weeks of A/B testing produces nothing.

Cohort analysis is the diagnostic that separates these cases. The defining dimension is tenure: how long has this user been in the product? New users, existing users, and power users have genuinely different relationships to the product, and a change that affects one group almost never affects the others in the same way.

## Cohort breakdowns by dimension

<!-- figure:0 -->

## New users

A drop concentrated in users with tenure under 30 days is almost always an acquisition-quality or onboarding problem. Acquisition quality means the channels that delivered users changed: a paid campaign ended, an organic source dried up, or a new source is delivering users with weaker intent. Onboarding problems mean the product failed to activate new users into habitual behavior. The diagnostic is to look at activation rates (users who hit the core-value moment) and early retention rates (users who return in days 1, 3, and 7) for the affected cohorts. If both are declining, the problem is onboarding. If only day-1 activation is declining, the problem is acquisition quality.

The new-user cohort is also the most sensitive to product changes, because new users have not yet built habits that override confusion. A redesign that experienced users navigate easily can create significant drop-off for new users who do not have the prior mental model. Teams that A/B test a major redesign only against existing users, then roll it out to all users, regularly discover this effect in the first week after full rollout.

## Existing users

A drop in users with 1-12 months of tenure usually points at feature or content changes. These users have established habits, and something disrupted them. The most productive diagnostic is to look at what changed in the product in the weeks before the drop: algorithm adjustments, feature changes, notification policy changes, content moderation changes. The timing between a product change and a retention drop in the 1-12 month cohort is typically 2-4 weeks, because the disruption to habit takes a few cycles to manifest in the numbers.

## Power users

A drop in power users, typically defined as users in the top 10-20% of engagement, is the most alarming scenario and the one most often misread. Power users drive a disproportionate share of DAU and an even more disproportionate share of content creation, reviews, and referrals on two-sided platforms. When power users disengage, the effect on the product can be large relative to their numeric share of the user base. The diagnostic for power-user drops is different from the others: power users respond most strongly to platform trust signals, monetization pressure, and changes that affect the quality of their experience relative to other users. A drop in creator reach, a change in how content is distributed, or the introduction of new monetization pressure in high-value use cases are all common triggers.

## Platform and device cohorts

Platform cohorts, iOS versus Android, mobile versus desktop, old app versions versus new, are cross-cutting and should always be checked alongside tenure cohorts. A drop that is entirely confined to one platform is almost certainly a technical issue, a bad release, a platform-specific API change, or a device compatibility regression. These are the quickest to diagnose and the quickest to fix. A drop that is evenly distributed across platforms is almost certainly a product or content issue, not a technical one.

## One handle to take with you

After funnel decomposition, the cohort question is: which population of users drove the drop? Break by tenure first (new, established, power), then by platform. The intersection of funnel stage and cohort is where the diagnosis gets specific enough to produce a testable hypothesis.

Next: **Instrumentation gaps**, what to do when the metric you need does not exist.`,
  figures: [
    {
      kind: 'comparison_table',
      ariaLabel: 'Cohort dimensions and what a drop in each cohort signals',
      caption: 'The same retention drop points at fundamentally different root causes depending on which cohort is affected. Running the same fix for all cohorts is a reliable way to fix none of them.',
      headers: ['Cohort', 'Drop signals', 'First diagnostic step'],
      rows: [
        { cells: ['New users (0-30d)', 'Activation or acquisition quality failure', 'Compare activation rates across acquisition channels'], tone: 'warn' },
        { cells: ['Existing users (1-12mo)', 'Feature or content change disrupted habit', 'Correlate drop timing with product changes in prior 4 weeks'], tone: 'neutral' },
        { cells: ['Power users (top 10-20%)', 'Platform trust or monetization pressure', 'Check creator/power-user specific metrics and policy changes'], tone: 'warn' },
        { cells: ['iOS only / Android only', 'Technical regression on one platform', 'Isolate to specific app version, correlate with release dates'], tone: 'ok' },
      ],
    },
  ],
}

// ── Chapter 5 ────────────────────────────────────────────────────────────────

const CH5: ChapterSeed = {
  slug: 'chapter-5',
  sort_order: 5,
  body_mdx: `## The problem you cannot see

The most dangerous metric drop is not the one where the data points clearly at a cause. It is the one where the data is silent. Missing instrumentation is common enough in production analytics stacks that every serious diagnostic must begin with a brief audit of what the data actually covers before trusting what the data says.

The standard analytics platforms, Amplitude, Mixpanel, Segment, all have the same structural weakness: they track events that developers decided to track, not events that are diagnostically important. The gap between what the team thought they should measure and what they actually needed to measure tends to be invisible until a drop happens that no available metric can explain.

## Common instrumentation blind spots

<!-- figure:0 -->

## Where events go missing

Events go missing for four reasons. The first is deliberate omission: the event was not considered important when instrumentation was designed. Second is client-side failure: the event fires in code but the SDK drops it when the network is poor or the device is low-memory. Third is version drift: new app versions add new instrumentation but old versions still in use do not have it, creating a bimodal data set that looks like a drop when a new version rolls out. Fourth is sampling: some analytics implementations sample high-frequency events to reduce costs, which produces accurate averages but loses tail behavior and rare but important events.

Client-side instrumentation failure is particularly insidious because it looks identical to a real product problem. If 5% of sessions produce no events, that 5% looks like abandonment in the funnel. The diagnostic is to compare server-side signals, network logs, backend request counts, against client-side event counts for the same period. If the server-side signals are healthy and the client-side events are missing, the problem is instrumentation, not product.

## The event you most often do not have

The activation event is the most commonly missing or misdefined event in consumer product analytics. Teams often instrument a proxy: account created, first login, onboarding completed. These are not activation events. An activation event is the first moment a user experiences the core value of the product, and it requires someone to have made a product decision about what that value is and translated it into a measurable event. Many teams have never done that work explicitly, which means their activation funnel is measuring the wrong thing, which means their new-user diagnostics are systematically misleading.

The session quality event is the second most commonly missing piece of instrumentation. DAU counts unique users per day, but it does not distinguish between a user who opened the app and immediately closed it and a user who spent 45 minutes in it. Median session depth, defined as the number of meaningful interactions per session, is a far better signal of engagement health than DAU, and it is often not tracked or not surfaced in the dashboards that teams look at first.

## Diagnosing invisible metrics

When the diagnostic loop reaches a dead end because no available metric illuminates the cause, the answer is to look at signal sources outside the standard analytics stack. Server logs tell you what requests were made, regardless of whether the client-side SDK fired correctly. App store reviews and ratings give a qualitative signal about what users are experiencing that may not surface in any event stream. Social listening on Twitter, Reddit, and Discord often surfaces user-reported issues days before they appear in support tickets or reviews. App Store review velocity, the rate at which new reviews appear, is a particularly sensitive leading indicator of user distress.

Customer support ticket volume is one of the most underutilized diagnostic signals. A 15% DAU drop that correlates with a 30% spike in support tickets is telling you something explicit about what users are experiencing, even if the analytics say nothing. The ticket content also gives the hypothesis: if 40% of the spike is in tickets about a specific feature, the diagnostic has a target.

## One handle to take with you

Before concluding that no cause exists, spend one hour auditing what the analytics stack is actually measuring. Check three things: whether the activation event is defined and correctly instrumented, whether client-side event counts match server-side request counts for the same period, and whether the support ticket volume moved at the same time as the metric. Two out of three will often surface the diagnosis.

Next: **Communicating findings**, how to present a diagnosis without overclaiming what the data shows.`,
  figures: [
    {
      kind: 'comparison_table',
      ariaLabel: 'Common instrumentation blind spots and how to work around them',
      caption: 'Missing data looks like product failure in the funnel. These four checks catch the most common instrumentation gaps before a team spends weeks investigating a problem the data cannot see.',
      headers: ['Blind spot', 'Why it happens', 'Workaround'],
      rows: [
        { cells: ['Activation event undefined or proxy', 'No explicit product decision about core value moment', 'Define activation explicitly, audit vs current instrumentation'], tone: 'warn' },
        { cells: ['Client-side SDK drops on poor network', 'Mobile analytics unreliable on low-bandwidth sessions', 'Compare client event counts to server-side request counts'], tone: 'warn' },
        { cells: ['Version drift across app releases', 'Old versions missing new instrumentation', 'Segment event counts by app version, check install-weighted averages'], tone: 'neutral' },
        { cells: ['Sampled high-frequency events', 'Cost optimization removes tail behavior', 'Use backend logs for high-frequency events, not sampled client SDK'], tone: 'neutral' },
      ],
    },
  ],
}

// ── Chapter 6 ────────────────────────────────────────────────────────────────

const CH6: ChapterSeed = {
  slug: 'chapter-6',
  sort_order: 6,
  body_mdx: `## Data tells you what happened

One of the most common failure modes in presenting a metric diagnosis is conflating what the data shows with what the data means. Data tells you what happened: DAU is down 15%, the drop is concentrated in new users acquired through paid channels, activation rates for that segment fell from 42% to 28%. Data does not tell you why those activation rates fell. That requires a separate step of reasoning, and presenting the reasoning as if it were data is how diagnostic meetings produce confident wrong answers that take months to unwind.

This matters at every level of the organization. A presentation that says "DAU dropped because we changed the onboarding flow" is a hypothesis, not a finding, and running remediation on a hypothesis that was never validated is expensive. A presentation that says "DAU dropped, the drop is concentrated in new paid users, activation rates are down 14 points for that segment, we have three hypotheses about why and here is what it would take to test each" is defensible and actionable.

## What data proves vs. what it suggests

<!-- figure:0 -->

## Correlation and causation

The most common overclaim in diagnostic presentations is treating temporal correlation as causation. The deploy happened on Wednesday, the drop started Thursday, therefore the deploy caused the drop. This logic is seductive because it is often right, but it is often right for the wrong reasons, and it is wrong often enough to justify slowing down before concluding. Two things that happened at the same time can both be caused by a third thing (the iOS update that broke the deploy and affected user behavior independently), or the correlation can be coincidental.

The correct framing is: the deploy is the leading hypothesis, the evidence for it is the timing correlation, and the evidence against it is that the drop affects segments we have not shipped to yet. Presenting both sides of the evidence is not hedging, it is accuracy. Stakeholders who hear a definitive diagnosis and then watch it be retracted two weeks later lose trust in the diagnostic process. Stakeholders who hear a calibrated diagnosis with explicit confidence levels and a clear test plan tend to give more room and more resources.

## The role of qualitative evidence

Quantitative data tells you where the problem is. Qualitative evidence, user interviews, app store reviews, support tickets, session recordings, often tells you what the user experience of the problem is, which is where the "why" comes from. A diagnostic that synthesizes both is more defensible and more actionable than one that treats either source alone as sufficient.

The session recording is particularly underused in metric diagnostics. Tools like FullStory, LogRocket, and Hotjar capture full session replays for a sample of users, and watching five sessions from users who dropped off in the activation funnel will often produce a more accurate hypothesis than a week of statistical analysis. This is not because qualitative evidence is more reliable than quantitative, it is because the feature that is confusing users is usually obvious in video in a way that is invisible in event data.

## Handling uncertainty in a diagnosis

Every metric drop diagnosis should include an explicit uncertainty level and a list of alternative explanations that have not been ruled out. The audience for a diagnostic is usually a mix of stakeholders who will act on the findings, and some of them will hear a partial diagnosis as a complete one unless the gaps are made explicit. "We know the drop is in new paid users and we know activation rates are down for that segment. We do not yet know whether this is the onboarding flow, the ad targeting, or a platform-level change. These are the three tests we would run to find out, and here is what each test would cost."

That framing is not a sign of weakness. It is a sign of calibration, and calibration is what makes a diagnostic credible over time. Teams that always present definitive diagnoses train their stakeholders to discount them. Teams that present calibrated diagnoses with clear tests earn trust that pays dividends when the diagnosis really does need rapid action.

## One handle to take with you

In any diagnostic presentation, physically separate the "what we know" section from the "what we believe" section. What we know: data, direct observations, verified facts. What we believe: hypotheses, inferences, patterns. If those sections are the same length, the presentation is overclaiming.

Next: **Case study: the Instagram feed change**, where a deliberate algorithm shift looked like a product bug from the outside and a strategic win from the inside, and how both sides ran their diagnostics wrong.`,
  figures: [
    {
      kind: 'comparison_table',
      ariaLabel: 'What data proves versus what it suggests',
      caption: 'Every diagnostic finding should live in one column or the other. Presenting a hypothesis as a finding is the most common way a good diagnosis turns into a six-week detour.',
      headers: ['Data proves (observable, direct)', 'Data suggests (inference, hypothesis)'],
      rows: [
        { cells: ['DAU is down 15% vs. prior 28-day average', 'The onboarding change caused the drop'], tone: 'neutral', arrow: false },
        { cells: ['Activation rate for paid users fell from 42% to 28%', 'Ad targeting quality degraded'], tone: 'neutral', arrow: false },
        { cells: ['Drop began Thursday, 14h after deploy', 'Deploy is the root cause'], tone: 'neutral', arrow: false },
        { cells: ['Support tickets up 30%, 40% about onboarding step 3', 'Step 3 is the friction point for most users'], tone: 'neutral', arrow: false },
      ],
    },
  ],
}

// ── Chapter 7 ────────────────────────────────────────────────────────────────

const CH7: ChapterSeed = {
  slug: 'chapter-7',
  sort_order: 7,
  body_mdx: `## The algorithm shift no one expected

In July 2022, Instagram began a major shift in its content distribution algorithm, de-emphasizing photos from accounts users followed in favor of Reels and algorithmically recommended video content from accounts users did not follow. Creator reach fell sharply and quickly. Posts from large accounts reached 30-60% fewer followers than the same accounts had reached six months earlier. The drop was steep enough that Kylie Jenner, with over 350 million followers, posted a public complaint about Instagram "trying to be TikTok" and asked her followers if they felt the same way. The post went viral and was cited in press coverage as evidence that Instagram had made a product mistake.

Adam Mosseri, Instagram's head, responded publicly on Twitter, acknowledging the change and defending it as an intentional bet on video. His framing was explicit: Instagram was shifting its distribution model toward interest-based recommendation rather than social graph-based distribution because user data showed that interest-based content drove higher engagement, and TikTok's growth had demonstrated that social graph distribution was not the only viable model.

## Two diagnostics, same data

<!-- figure:0 -->

## The creator's diagnostic

From the outside, the creator's diagnostic ran exactly as this module describes a correct diagnosis should run: observe the drop in reach, decompose by content type and account size, generate hypotheses, find that the drop was consistent across content types but concentrated in photo over video, and conclude that the algorithm had changed. The conclusion was correct. The diagnosis was clean.

What the creator's diagnostic could not access was the intent behind the change. Algorithm changes on Instagram are not announced in advance. They are not documented in any creator-facing material. The creators who diagnosed the reach drop as a product bug were making a reasonable inference from the available data, but they were missing the key fact: this was a deliberate strategic shift, not an error. The diagnostic was correct about what happened and wrong about why. That distinction matters enormously for what the creator should do next. A bug gets fixed. A strategic shift requires a different response: adapt to the new distribution model, migrate to the platform that still rewards the old one, or accept the reduced reach and hold.

## Instagram's diagnostic

Instagram's internal diagnostic ran against a different set of signals. Their data showed that Reels content drove higher average watch time and higher share rates than photo content, that interest-based recommendation increased DAU among new and younger users, and that the platform was losing younger users to TikTok at a rate that threatened long-term health. The decision to shift distribution toward video was a response to those signals.

What Instagram's internal diagnostic missed, or underweighted, was the creator ecosystem effect. The platform's long-term engagement health was heavily dependent on a relatively small number of high-follower accounts that produced the content other users came to see. Reducing reach for those accounts reduced their motivation to create on the platform. The creator exit risk was real and measurable but was apparently weighted less heavily than the new-user acquisition benefit from interest-based recommendation. Whether that weighting was correct is a product judgment call that reasonable people disagree on, but the point is that the internal diagnosis treated it as a data question when it was also a values question about which user population to optimize for.

## What both sides missed

The diagnostic failure on both sides was the same: treating a strategic tradeoff as a metric optimization problem. Instagram optimized DAU and watch time without fully modeling the second-order effect on the creator supply that produced the content driving DAU. Creators diagnosed a distribution loss without a framework for distinguishing intentional platform changes from bugs, which would have changed their response and saved them months of posting optimization that could not solve a deliberate algorithm shift.

The lesson is not that diagnostics fail. They did not fail here. Both sides correctly identified what happened. The lesson is that a metric diagnosis is always a partial picture, because it can only measure what is currently instrumented and can only reveal cause when the cause is accessible from the data available. Strategic intent is not accessible from the creator's data. Second-order ecosystem effects are not always visible in the platform's dashboards until they are large enough to reverse a trend. Both are real parts of what happened, and neither diagnostic fully captured them.

## One handle to take with you

The final question in any completed diagnosis is: what does this data not show? A diagnosis that cannot answer that question is presenting false confidence. The Instagram case is a reminder that some of the most important causes are invisible from the diagnostic position, and naming that limitation explicitly is more useful than pretending it does not exist.

That is the end of this module. The diagnostic loop, external causes, funnel decomposition, cohort analysis, instrumentation gaps, and communication discipline are the six instruments a practitioner needs to debug any significant metric drop. The case study shows what happens when any one of them is used in isolation. Used together, with appropriate uncertainty, they are sufficient to find the cause in almost every case where the cause is findable.`,
  figures: [
    {
      kind: 'mapping_diagram',
      ariaLabel: 'Two diagnostic perspectives on the Instagram feed change and what each missed',
      caption: "The same algorithm shift produced two valid but incomplete diagnoses. Neither side had access to what the other's diagnostic position could see.",
      sourcesLabel: 'Diagnostic position',
      targetsLabel: 'What the diagnosis missed',
      sources: ['Creator external view', 'Instagram internal view'],
      targets: [
        { label: 'Strategic intent', body: 'Algorithm change was deliberate, not a bug. Adapt or migrate.', tone: 'warn' },
        { label: 'Creator ecosystem effect', body: 'Reach reduction reduces creator motivation. Second-order DAU risk.', tone: 'warn' },
        { label: 'Platform values tradeoff', body: 'Which user population to optimize for is a values call, not a data call.', tone: 'neutral' },
      ],
      links: [
        { from: 0, to: 0 },
        { from: 0, to: 2 },
        { from: 1, to: 1 },
        { from: 1, to: 2 },
      ],
    },
  ],
}

const CHAPTERS: ChapterSeed[] = [CH1, CH2, CH3, CH4, CH5, CH6, CH7]

async function run() {
  const mod = await supabase.from('learn_modules').select('id').eq('slug', MODULE_SLUG).single()
  if (mod.error || !mod.data) {
    console.error(`[seed-product-debug] module ${MODULE_SLUG} not found:`, mod.error)
    process.exit(1)
  }
  console.log(`[seed-product-debug] module ${MODULE_SLUG} -> ${mod.data.id}`)

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

  console.log('\n[seed-product-debug] Done.')
}

run().catch(e => { console.error(e); process.exit(1) })

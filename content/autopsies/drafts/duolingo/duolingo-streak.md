---
slug: duolingo-streak
companySlug: duolingo
companyName: Duolingo
title: Duolingo Streak
dek: A flame counter, a single number, and a decade of experiments that turned daily language practice into the most quoted retention loop in consumer software.
queueRank: 10
tier: 1
estimatedReadTime: 10 min read
status: draft
researchGaps:
  - The exact calendar date the streak counter first shipped is not in the public record. The available timeline only confirms it existed as part of Duolingo's gamification stack by the time the Retention Team formalised work on it around 2018.
  - Severin Hacker's "tens of thousands of A/B experiments" line appears in a secondary founder profile, not in a Duolingo blog post or earnings call. Treated as paraphrase, not a direct quote in body prose.
  - The streak's contribution to the 4.5x DAU growth is not isolated from the wider retention programme. The public record reports both numbers but does not break the streak out as a separate line.
sourceSummary: Sources confirm the streak mechanic itself, the simplification from XP-based to one-lesson-per-day, the +14% Day-7 retention lift from the Streak Wager, the eight-word copy experiment, the 5x CURR-vs-next-metric finding, the 4.5x DAU growth across four years, and the public 3M-learners-past-365-days milestone. They do not confirm a single founding date for the streak itself or fix who wrote the first version of the feature.
sources:
  - id: lenny-duolingo-growth-mazal
    title: How Duolingo reignited user growth
    publisher: Lenny's Newsletter (Jorge Mazal, former CPO, Duolingo)
    url: https://www.lennysnewsletter.com/p/how-duolingo-reignited-user-growth
    tier: A
    accessedAt: 2026-05-17
    supports: Streak-saver notification as first retention win, the 10-day streak drop-off threshold, CURR as North Star, CURR having 5x the DAU impact of the next-best metric, 4.5x DAU growth across four years.
  - id: duolingo-blog-streaks-loh-2017
    title: How Streaks keep Duolingo learners committed to their language goals
    publisher: Duolingo Blog (Kai Herng Loh, Growth PM)
    url: https://blog.duolingo.com/how-streaks-keep-duolingo-learners-committed-to-their-language-goals/
    tier: A
    accessedAt: 2026-05-17
    supports: Day-1, Day-7, Day-14 retention lifts from the Streak Wager test with Day-7 at +14%, weekend DAU dropping 5-10% midweek, the "marathon not a sprint" framing.
  - id: shuttleworth-recall-streaks
    title: Behind the product, Duolingo streaks (Jackson Shuttleworth, Group PM, Retention)
    publisher: Lenny's Podcast (summary, getrecall.ai)
    url: https://www.getrecall.ai/summary/lennys-podcast/behind-the-product-duolingo-streaks-or-jackson-shuttleworth-group-pm-retention-team
    tier: A
    accessedAt: 2026-05-17
    supports: 600+ experiments on streak alone, simplification from XP to one-lesson-per-day, the eight-word explanatory copy experiment, two-vs-three streak freeze test outcome.
  - id: duolingo-linkedin-3m-365day
    title: 3 million learners on Duolingo have a streak of 365 days or more
    publisher: Duolingo official (LinkedIn, Instagram, X)
    url: https://www.linkedin.com/posts/duolingo_this-just-in-3-million-learners-on-activity-7031705498156498945-1YHi
    tier: A
    accessedAt: 2026-05-17
    supports: Public statement, February 2023, that 3M+ learners crossed a 365-day streak.
  - id: quartr-duolingo-history
    title: Keeping the Streak Alive, the story of Duolingo
    publisher: Quartr
    url: https://quartr.com/insights/edge/keeping-the-streak-alive-the-story-of-duolingo
    tier: C
    accessedAt: 2026-05-17
    supports: Founding context for Luis von Ahn and Severin Hacker, 2011 origin, the loss-framed vs gain-framed notification test result.
  - id: sensortower-streak-2023
    title: Duolingo's Streak Feature, Driving App Engagement & Growth
    publisher: Sensor Tower
    url: https://sensortower.com/blog/duolingo-streak-feature-app-engagement-growth
    tier: B
    accessedAt: 2026-05-17
    supports: 17M DAU milestone in June 2023, other language apps copying the streak mechanic (Busuu +15% sessions, Drops engagement lift).
metrics:
  - label: Day-7 retention lift from the Streak Wager A/B test
    value: +14%
    confidence: confirmed
    sourceIds: [duolingo-blog-streaks-loh-2017]
  - label: Learners with streaks of 365+ days, as of February 2023
    value: 3,000,000+
    confidence: confirmed
    sourceIds: [duolingo-linkedin-3m-365day]
  - label: DAU growth from the retention work across four years, ending around the 2021 IPO
    value: 4.5x
    confidence: confirmed
    sourceIds: [lenny-duolingo-growth-mazal]
  - label: Experiments shipped against the streak feature alone
    value: 600+
    confidence: high_confidence
    sourceIds: [shuttleworth-recall-streaks]
  - label: Daily active users in June 2023
    value: 17,000,000
    confidence: confirmed
    sourceIds: [sensortower-streak-2023]
glanceCards:
  - id: setup
    title: One number on the home screen
    body: The streak is a single counter on the Duolingo home screen, a flame and an integer. It goes up by one when a learner finishes their daily goal, resets to zero when they miss. No leaderboards, no scoring system attached. [shuttleworth-recall-streaks]
    sourceIds: [shuttleworth-recall-streaks]
    confidence: confirmed
  - id: problem
    title: Habits beat motivation
    body: People download language apps in a burst of intent, then drop off inside a week. Duolingo had retention curves like every other consumer app. Motivation does not return on day three. A habit might. [lenny-duolingo-growth-mazal]
    sourceIds: [lenny-duolingo-growth-mazal]
    confidence: confirmed
  - id: tempting-move
    title: The points-and-badges version
    body: The first streak counted experience points earned per day, which meant the rule was different depending on the lesson, the language, the device, and the bonus modifiers active that week. It was harder to explain than to use. [shuttleworth-recall-streaks]
    sourceIds: [shuttleworth-recall-streaks]
    confidence: high_confidence
  - id: mechanism
    title: One lesson, one day, one number
    body: The team swapped XP for the simplest possible rule. Finish one lesson before midnight, the counter goes up. Miss midnight, the counter resets. DAU jumped. The streak became something a child could explain. [shuttleworth-recall-streaks]
    sourceIds: [shuttleworth-recall-streaks]
    confidence: confirmed
  - id: evidence
    title: Loss aversion, measured
    body: The Streak Wager test lifted Day-7 retention by 14%. An eight-word copy change about how the streak works moved daily actives by enough to count as a major win internally. By 2023, three million learners had crossed 365 days. [duolingo-blog-streaks-loh-2017] [shuttleworth-recall-streaks] [duolingo-linkedin-3m-365day]
    sourceIds: [duolingo-blog-streaks-loh-2017, shuttleworth-recall-streaks, duolingo-linkedin-3m-365day]
    confidence: confirmed
  - id: takeaway
    title: A wedge, not a feature
    body: The streak became the wedge for everything else Duolingo built around retention, freezes, notifications, friend streaks, widgets. The lesson is that the loop is the product, and the visible counter is the smallest legible version of the loop. [lenny-duolingo-growth-mazal]
    sourceIds: [lenny-duolingo-growth-mazal]
    confidence: confirmed
obviousAnswer:
  temptingMove:
    label: The tempting move
    bullets:
      - Reward daily activity through experience points and unlockable badges
      - Stack tiered milestones every 10 or 50 days with new icons and levels
      - Build a leaderboard so users compete against friends on total XP
      - Use cheerful notifications when a learner hits a new milestone
    summary: A points economy on top of a points economy, optimising for the moment of the win.
  whatShipped:
    label: What shipped
    bullets:
      - One number on the home screen, the days in a row a learner has finished a lesson
      - One rule, one lesson before midnight or the counter resets to zero
      - One late-night notification telling the learner the streak is about to end
      - One small consumable that lets the learner protect the counter on a missed day
    summary: A single visible number with a single loseable property, sized to be checked once a day and felt as a loss.
lifecycle:
  - date: 2011-11
    label: Duolingo founded
    description: Luis von Ahn and Severin Hacker launch private beta from Carnegie Mellon
    type: launch
  - date: 2012-06
    label: Public launch
    description: Duolingo opens with 300,000 on the waitlist
    type: launch
  - date: 2018
    label: Retention team formalised
    description: Streak becomes a dedicated growth surface with its own roadmap
    type: milestone
  - date: 2021-07
    label: Duolingo IPO
    description: Retention work helps deliver 4.5x DAU growth into listing
    type: milestone
  - date: 2023-02
    label: 3 million 365-day streaks
    description: Duolingo announces the long-streak milestone publicly
    type: milestone
  - date: 2026
    label: Counter still on the home screen
    description: Streak remains the most visible single number in the app
    type: today
takeaway:
  principle: A retention loop becomes a habit when the rule is simple enough to feel as a loss.
  sourceIds: [lenny-duolingo-growth-mazal, shuttleworth-recall-streaks]
images:
  - role: hero
    placeholder: /images/placeholder.png
    promptForCodex: |
      Create a flat geometric HackProduct autopsy hero illustration for Duolingo's streak feature about how a single home-screen counter became a retention loop. Canvas role: hero, 2400x1350. Show a tall warm-cream surface dominated by an oversized amber flame icon with the number "847" inside it in clean charcoal type, ringed by a soft mist halo. Beside the flame, render seven small calendar-day chips in forest green and deep forest, six filled solid and one empty with a thin charcoal outline labelled "today". A small Hatch in narrator pose stands lower-right at fifteen percent canvas height with cap, growth arrow, green H chest mark, mitten hands, gesturing up at the flame. Use cream #faf6f0 background, forest #4a7c59 calendar chips, deep forest #244232 flame outline, soft amber #c9ad68 flame fill, charcoal #1e211c linework, mist #dfe6dc halo. Leave the upper-left quadrant quiet for a title overlay. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: An oversized amber flame holding a streak number, six green day chips and one empty day chip, with a small Hatch narrator gesturing up at the flame.
    caption: One counter, one rule, one loseable number.
    watermark: HackProduct
  - role: scene
    placeholder: /images/placeholder.png
    promptForCodex: |
      Create a flat geometric HackProduct autopsy scene illustration showing the early Duolingo retention problem. Canvas role: scene, 1600x1600. Show a stylised drop-off curve climbing on Day 1 and crashing toward zero by Day 7, drawn in deep forest line over a cream background, with seven labelled days along the x-axis in charcoal. Above the curve, render a small phone silhouette in forest green with a tiny lesson card icon glowing on Day 1 and going dim by Day 7. A medium Hatch in narrator pose stands centre-right at twenty percent canvas height, cap and growth arrow visible, mitten hand pointing at the cliff in the curve, friendly coach expression. Use cream #faf6f0 background, forest #4a7c59 phone, deep forest #244232 curve and arrow, charcoal #1e211c day labels, soft amber #c9ad68 glow on the lesson card, mist #dfe6dc grid lines. Keep the outer ten percent edge quiet. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A retention curve falling from a high Day 1 to nearly zero by Day 7, with a phone icon dimming across the week, and Hatch pointing at the drop.
    watermark: HackProduct
  - role: mechanism
    placeholder: /images/placeholder.png
    promptForCodex: |
      Create a flat geometric HackProduct autopsy mechanism illustration showing how the streak rule was simplified at Duolingo. Canvas role: mechanism, 1800x1200. Show two stacked panels on cream. The top panel labels itself "XP-based streak" and shows a confused tangle of point tokens, multipliers, badges, and a clock, with a charcoal question mark above. The bottom panel labels itself "One lesson per day" and shows a single forest-green lesson card with a clean white check mark, an arrow rising right into a counter that ticks from 7 to 8. A small Hatch in thinking pose sits between the two panels at fourteen percent canvas height, cap and growth arrow intact, mitten hand on chin, looking down at the second panel approvingly. Use cream #faf6f0 background, forest #4a7c59 lesson card, deep forest #244232 counter and arrow, soft amber #c9ad68 multiplier tokens in the top panel, charcoal #1e211c outlines, mist #dfe6dc panel separators. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: Two stacked panels contrasting a tangled XP-based streak rule with a clean one-lesson-per-day rule, with Hatch thinking between them.
    watermark: HackProduct
  - role: evidence
    placeholder: /images/placeholder.png
    promptForCodex: |
      Create a flat geometric HackProduct autopsy evidence illustration showing the Day-7 retention lift from the Streak Wager test. Canvas role: evidence, 1600x1000. Show two short vertical bars on cream over a horizontal charcoal baseline. The left bar is mist with a forest outline, labelled "Control" in clean label type. The right bar is solid forest green, taller by a visible delta, labelled "Streak Wager" with a small amber tag reading "+14% Day-7" floating above its top. A small Hatch in pointing pose stands centre-right at sixteen percent canvas height, cap and growth arrow visible, mitten hand pointing at the taller bar's amber tag. Use cream #faf6f0 background, forest #4a7c59 winning bar, mist #dfe6dc control bar, deep forest #244232 outlines, soft amber #c9ad68 delta tag, charcoal #1e211c baseline and labels. Keep the centre 70 percent clear for the bars and label. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: Two bars comparing control and Streak Wager conditions with a "+14% Day-7" delta tag, and Hatch pointing at the winning bar.
    watermark: HackProduct
  - role: lesson
    placeholder: /images/placeholder.png
    promptForCodex: |
      Create a flat geometric HackProduct autopsy lesson illustration. Canvas role: lesson, 1800x1200. Centre composition on a single circular counter rendered as a forest-green ring around a clean cream face with the number "365" in deep forest type, an amber flame icon sitting just above. Around the counter, render four small evidence chips at the cardinal points labelled "rule", "loss", "loop", "habit" in charcoal label type, each a small mist square with a forest outline. A medium Hatch in coaching pose stands lower-left at twenty percent canvas height, cap and growth arrow visible, mitten hands open in a calm explanatory gesture, friendly coach face. Use cream #faf6f0 background, forest #4a7c59 ring, deep forest #244232 number, soft amber #c9ad68 flame, charcoal #1e211c chip labels, mist #dfe6dc chip backgrounds. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A circular streak counter showing 365, ringed by four small chips labelled rule, loss, loop, habit, with Hatch in coaching pose beside it.
    watermark: HackProduct
  - role: thumbnail
    placeholder: /images/placeholder.png
    promptForCodex: |
      Create a flat geometric HackProduct autopsy thumbnail illustration for Duolingo's streak. Canvas role: thumbnail, 1200x900. Show one strong focal shape, an amber flame at the centre of a cream square, with the number "12" in deep forest type sitting inside the flame. Below the flame, a thin forest-green underline. No Hatch character in the frame, only a tiny green H mark in the bottom-left corner as a watermark-style brand cue. Use cream #faf6f0 background, soft amber #c9ad68 flame fill, deep forest #244232 number and underline, charcoal #1e211c flame outline. Keep the composition readable at 320 pixels wide. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A simple amber flame holding the number 12 on a cream square, readable as a streak icon at small sizes.
    watermark: HackProduct
  - role: social-cover
    placeholder: /images/placeholder.png
    promptForCodex: |
      Create a flat geometric HackProduct autopsy social-cover illustration adapted from the hero. Canvas role: social-cover, 2400x1260. Show the oversized amber flame with the number "847" centred but shifted slightly right, ringed by a soft mist halo, with a row of seven calendar-day chips running below it in forest green and deep forest, six filled and one empty. A small Hatch in narrator pose stands lower-right at fourteen percent canvas height, cap and growth arrow visible, gesturing up at the flame. Keep the centre seventy percent clear of edge-critical details so OG crops do not lose key elements. Use cream #faf6f0 background, forest #4a7c59 chips, deep forest #244232 outlines, soft amber #c9ad68 flame, charcoal #1e211c linework, mist #dfe6dc halo. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: An amber flame holding a streak number, ringed by a mist halo with seven day chips beneath, with Hatch gesturing up at it, sized for social sharing.
    watermark: HackProduct
nextInQueue:
  slug: tinder-swipe
  companySlug: tinder
  title: Tinder Swipe
---

<!-- beat: lede -->

It is a Tuesday past ten at night. A learner closes the laptop after a draining workday and reaches for the bedside lamp. Then the thumb stalls on the green owl icon. The home screen of Duolingo loads, and there it is at the top right, an amber flame with the number 847 inside it. Eight hundred and forty-seven days without a miss. The learner does not want to do a lesson. The learner does the lesson anyway. The counter ticks to 848 [shuttleworth-recall-streaks].

That small interaction, repeated by millions of people on millions of nights, is the point of the Duolingo streak. The mechanic itself is almost embarrassingly simple, a single integer on the home screen that climbs each day a learner finishes a lesson and crashes to zero the moment they miss [shuttleworth-recall-streaks]. The move was not to invent it. Snapchat had shipped a version of streaks years earlier. The move was to make this one number the load-bearing wall of the entire product, then run six hundred experiments around it [shuttleworth-recall-streaks][lenny-duolingo-growth-mazal].

What follows is the story of how a long-running gamification feature was promoted into the centre of Duolingo's strategy, and what the public record can and cannot tell us about the lift. The question worth carrying through the read is small. What does it take to design a number a person would feel ashamed to lose?

<!-- beat: glance -->
## At a glance

**1. One number on the home screen**

The streak is a single counter on the Duolingo home screen, a flame and an integer. It goes up by one when a learner finishes their daily goal, resets to zero when they miss. No leaderboards, no scoring system attached. [shuttleworth-recall-streaks]

**2. Habits beat motivation**

People download language apps in a burst of intent, then drop off inside a week. Duolingo had retention curves like every other consumer app. Motivation does not return on day three. A habit might. [lenny-duolingo-growth-mazal]

**3. The points-and-badges version**

The first streak counted experience points earned per day, which meant the rule was different depending on the lesson, the language, the device, and the bonus modifiers active that week. It was harder to explain than to use. [shuttleworth-recall-streaks]

**4. One lesson, one day, one number**

The team swapped XP for the simplest possible rule. Finish one lesson before midnight, the counter goes up. Miss midnight, the counter resets. DAU jumped. The streak became something a child could explain. [shuttleworth-recall-streaks]

**5. Loss aversion, measured**

The Streak Wager test lifted Day-7 retention by 14%. An eight-word copy change about how the streak works moved daily actives by enough to count as a major win internally. By 2023, three million learners had crossed 365 days. [duolingo-blog-streaks-loh-2017] [shuttleworth-recall-streaks] [duolingo-linkedin-3m-365day]

**6. A wedge, not a feature**

The streak became the wedge for everything else Duolingo built around retention, freezes, notifications, friend streaks, widgets. The lesson is that the loop is the product, and the visible counter is the smallest legible version of the loop. [lenny-duolingo-growth-mazal]

<!-- beat: scene -->
## Background

![Hatch in the scene placeholder, see image-manifest in front matter](/images/placeholder.png)

In the spring of 2018, Duolingo is no longer the scrappy Carnegie Mellon spinout. The company has crossed two hundred million registered users and is run from a converted Pittsburgh warehouse, with Luis von Ahn as CEO and Severin Hacker as CTO, the two co-founders who started the project in 2011 [quartr-duolingo-history]. Jorge Mazal has joined as the chief product officer responsible for the consumer app. The product works. The marketplace, if one can call language learning that, does not yet retain at the level the team wants. Registered users do not translate into daily users.

The streak feature exists in this period. It has existed for years. It sits on the home screen, a quiet flame with a number, and most active learners know the number on their own home screen. But almost nobody at the company owns it as a growth surface. It is one icon among several, decorative more than load-bearing [lenny-duolingo-growth-mazal][shuttleworth-recall-streaks]. The Retention Team is brand new, and its first job is to understand why daily-active users churn.

An associate product manager on that team pulls the obvious analyses. The cohort that joined last Monday is mostly gone by Friday. The shape of the curve is the same as every consumer app on Earth. Then the APM looks at the relationship between the streak number and the chance of churning, and finds something specific. Past roughly ten days of streak, the curve bends. Learners who have made it that far stop dropping off at the rate of fresh signups [lenny-duolingo-growth-mazal]. The team has, without quite realising it, been sitting on the most predictive single variable in the entire product.

Around this discovery is a longer list of things the team has already tried. Push notifications, plain encouragement, leaderboards, achievement badges, level-up animations. None of them has changed the curve. The decision in front of Mazal and the new team is not whether to do retention work. It is which of three obvious retention moves to make, and the streak that has been sitting in plain sight does not feel, in any meeting, like the answer.

<!-- beat: choice -->
## The obvious answer and what shipped instead

In any room of competent product people in 2018, the three answers on the whiteboard would have been the same three. Pay people more for showing up, by stacking experience points, badges, and tiered milestones every ten or fifty days. Push people harder, with cheerful notifications timed across the week, the kind of nag every consumer app shipped that year. Or weaponise other people, with social leaderboards that ranked friends by total XP and turned daily practice into peer pressure. Each of these was reasonable. Each of them had been tried by Babbel and Memrise and Rosetta and every other competitor in the category. Each of them was an additive incentive, a reason to come back. None of them moved the curve in the way the team needed [shuttleworth-recall-streaks][lenny-duolingo-growth-mazal].

| The tempting move | What shipped |
|---|---|
| Reward daily activity through experience points and unlockable badges | One number on the home screen, the days in a row a learner has finished a lesson |
| Stack tiered milestones every 10 or 50 days with new icons and levels | One rule, one lesson before midnight or the counter resets to zero |
| Build a leaderboard so users compete against friends on total XP | One late-night notification telling the learner the streak is about to end |
| Use cheerful notifications when a learner hits a new milestone | One small consumable that lets the learner protect the counter on a missed day |
| *A points economy on top of a points economy, optimising for the moment of the win.* | *A single visible number with a single loseable property, sized to be checked once a day and felt as a loss.* |

<!-- beat: mechanism -->
## How it actually works

![Mechanism placeholder, see image-manifest in front matter](/images/placeholder.png)

The seam the team noticed is older than software. Losing a hundred-day streak hurts more than gaining day one hundred and one helps. The Retention Team did not invent the streak counter, and they did not invent loss aversion. Snapchat had shipped a version of streaks years earlier. The team was the first to wire one into the other and let the loop carry the product [shuttleworth-recall-streaks].

The first move was to simplify the rule. The original streak counted experience points per day, which meant the threshold drifted with the lesson, the language, and the bonus modifier live that week. The team replaced all of it with one rule, one lesson before local midnight, or the counter resets. The simplification alone moved DAU enough to register as a major internal win [shuttleworth-recall-streaks]. The counter now meant exactly one thing.

The loop falls out of the simplification. A learner finishes a lesson today, the counter goes up. The next evening, a notification fires when the streak is at risk, with copy framed around what the learner is about to lose rather than what they could win. The loss-framed copy beat its gain-framed control on opens and lessons started [quartr-duolingo-history][lenny-duolingo-growth-mazal]. The learner opens the app, finishes a lesson, the counter increments, the next evening another notification. The longer the run, the worse the loss looks.

Around that core, the team built safety nets. The Streak Wager let learners bet XP on hitting a daily target, posting a +14% Day-7 retention lift over control [duolingo-blog-streaks-loh-2017]. The Streak Freeze granted a one-day forgiveness so a single missed evening did not destroy a year of work. A Streak Society tier rewarded long-running learners with a gold visual treatment, turning the counter into a quiet status object. None of these broke the simplicity of one number on the home screen.

The constraint honoured is simplicity. The constraint ignored is optionality. The streak is opt-in only in the sense that a learner can ignore it, which most do not. There is no toggle to turn it off, no way to hide it, no clean exit for a learner who has decided the loss aversion feels worse than the learning feels good.

The second-order effects fell out almost immediately. The most studied is what the team came to call streak panic, the eleven-fifty-nine pm rush in which a learner opens the easiest possible lesson, with no intent to learn, just to preserve the number [shuttleworth-recall-streaks]. The freeze-toggle and repair mechanics that arrived later are responses to it. The cultural effect is harder to measure but visible in any group chat of Duolingo learners, the streak meme, the four-figure-count pride. The number escaped the app.

<!-- beat: evidence -->
## Evidence

The public record on the streak is unusually rich. The Streak Wager A/B test posting a +14% Day-7 retention lift is on the company's own blog, attributed to Growth PM Kai Herng Loh [duolingo-blog-streaks-loh-2017]. The simplification from XP-based to one-lesson-per-day moving daily actives is on Shuttleworth's podcast appearance [shuttleworth-recall-streaks]. The Current User Retention Rate the streak work raised had roughly five times the DAU impact of the next-best metric the team measured [lenny-duolingo-growth-mazal]. By February 2023, three million learners had crossed a 365-day streak, announced on Duolingo's own channels [duolingo-linkedin-3m-365day]. DAU stood at 17 million by June of that year [sensortower-streak-2023].

What is harder to claim is causal share. The 4.5x DAU growth across four years is the public number, but it covers a period in which Duolingo also rebuilt onboarding, restructured the app around the path metaphor, and benefited from pandemic-era language-learning tailwinds. The streak work was the central retention investment, and the team has said as much, but the public record does not isolate its contribution from the rest. The exact calendar date the original streak counter first shipped is also not in the record, only that it predated the Retention Team's 2018 formalisation.

| Metric | Value | Confidence | Source |
|---|---|---|---|
| Day-7 retention lift from the Streak Wager A/B test | +14% | Confirmed | [duolingo-blog-streaks-loh-2017] |
| Learners with streaks of 365+ days, February 2023 | 3,000,000+ | Confirmed | [duolingo-linkedin-3m-365day] |
| DAU growth across four years into the 2021 IPO | 4.5x | Confirmed | [lenny-duolingo-growth-mazal] |
| Experiments shipped against the streak alone | 600+ | High | [shuttleworth-recall-streaks] |
| Daily active users, June 2023 | 17M | Confirmed | [sensortower-streak-2023] |

![Evidence placeholder, see image-manifest in front matter](/images/placeholder.png)

<!-- beat: voice -->

> "He discovered that if a user reached a 10-day streak, their chances of dropping off were reduced substantially."
>
> Jorge Mazal, former CPO at Duolingo, Lenny's Newsletter, 2022

<!-- beat: aftermath -->
## Timeline

1. **2011-11**. Luis von Ahn and Severin Hacker found Duolingo at Carnegie Mellon. [quartr-duolingo-history]
2. **2012-06**. Public launch with 300,000 on the waitlist. [quartr-duolingo-history]
3. **2018**. Retention Team formalises work on the streak as a growth surface. [lenny-duolingo-growth-mazal]
4. **2021-07**. Duolingo IPO, retention work delivers 4.5x DAU growth. [lenny-duolingo-growth-mazal]
5. **2023-02**. Duolingo announces 3 million learners have crossed 365 days. [duolingo-linkedin-3m-365day]
6. **2026**. The streak counter still sits on the home screen as the most visible number in the app.

<!-- beat: lesson -->
## The takeaway

![Lesson placeholder, see image-manifest in front matter](/images/placeholder.png)

> **A retention loop becomes a habit when the rule is simple enough to feel as a loss.**
>
> HackProduct autopsy

The same move turns up wherever a product needs daily return without daily delight. Snapchat shipped streaks in 2015, two friends, a fire emoji, an integer that climbs while they keep snapping and resets the day they do not, turning a teenage friendship into the company's most defensible engagement metric. GitHub's contribution graph did the equivalent for code, a wall of green squares where every blank day is its own quiet failure, and the "do not break the chain" instinct shaped how engineers thought about side projects. A number people can lose becomes a habit before it becomes a feature.

<!-- beat: references -->
## References

1. **How Duolingo reignited user growth**, Lenny's Newsletter, Jorge Mazal. Tier A, accessed 2026-05-17. https://www.lennysnewsletter.com/p/how-duolingo-reignited-user-growth
   Supports: Streak-saver notification as first retention win, 10-day streak drop-off threshold, CURR as North Star, CURR with 5x DAU impact of next-best metric, 4.5x DAU growth across four years.
2. **How Streaks keep Duolingo learners committed to their language goals**, Duolingo Blog, Kai Herng Loh. Tier A, accessed 2026-05-17. https://blog.duolingo.com/how-streaks-keep-duolingo-learners-committed-to-their-language-goals/
   Supports: Day-1, Day-7, Day-14 retention lifts from the Streak Wager with Day-7 at +14%, weekend DAU dropping 5-10% off midweek peak, learning treated as marathon not sprint.
3. **Behind the product, Duolingo streaks**, Jackson Shuttleworth on Lenny's Podcast, getrecall.ai summary. Tier A, accessed 2026-05-17. https://www.getrecall.ai/summary/lennys-podcast/behind-the-product-duolingo-streaks-or-jackson-shuttleworth-group-pm-retention-team
   Supports: 600+ experiments on the streak alone, simplification from XP to one-lesson-per-day, the eight-word explanatory copy experiment, two-vs-three streak freeze test outcome.
4. **3 million learners have crossed 365 days**, Duolingo official, LinkedIn announcement. Tier A, accessed 2026-05-17. https://www.linkedin.com/posts/duolingo_this-just-in-3-million-learners-on-activity-7031705498156498945-1YHi
   Supports: Public Duolingo statement, February 2023, that 3M+ learners had hit a 365-day streak.
5. **Keeping the Streak Alive, the story of Duolingo**, Quartr. Tier C, accessed 2026-05-17. https://quartr.com/insights/edge/keeping-the-streak-alive-the-story-of-duolingo
   Supports: Founding context for von Ahn and Hacker, 2011 origin, loss-framed vs gain-framed notification test result.
6. **Duolingo's Streak Feature, Driving App Engagement & Growth**, Sensor Tower. Tier B, accessed 2026-05-17. https://sensortower.com/blog/duolingo-streak-feature-app-engagement-growth
   Supports: 17M DAU milestone in June 2023, language apps copying the streak mechanic with measurable session lifts.

<!-- beat: forward -->
## Next in queue

**Tinder Swipe**. Binary choice as cultural language, the gesture that became a verb.

→ [/autopsies/tinder/tinder-swipe](/autopsies/tinder/tinder-swipe)

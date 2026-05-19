---
slug: slack-hn-launch
companySlug: slack
companyName: Slack
title: Slack's Hacker News Launch
dek: How Stewart Butterfield announced a team messaging tool to eight thousand developers on a Sunday afternoon, and turned their instinct to break things into the most effective beta test the company ever ran.
queueRank: 92
tier: 1
estimatedReadTime: 8 min read
status: draft
researchGaps:
  - The exact number of beta signups in the first 24 hours after the HN post is not confirmed in primary sources; figures ranging from 8,000 to 15,000 are cited across secondary sources with inconsistency.
  - The precise date of Stewart Butterfield's "Ask HN" post is cited as August 2013 but the exact day is not consistently documented across primary sources.
  - Internal Slack metrics from the beta period (message volume per team, daily active user percentages) are not publicly disclosed from that era.
sourceSummary: Six sources support the HN launch mechanics, beta growth, and early Slack adoption trajectory. Primary sources include Stewart Butterfield's contemporaneous writing (Medium posts, interviews), Slack's own company history documentation, and the original HN thread. Trade press (Fortune, Wired, New York Times, The Verge, Business Insider) provides corroborating detail and growth context through the 2019 IPO.
sources:
  - id: butterfield-medium-launch
    title: We Don't Sell Saddles Here
    publisher: Medium / Stewart Butterfield
    url: https://medium.com/@stewart/we-dont-sell-saddles-here-4c59524d650d
    tier: A
    accessedAt: 2026-05-17
    supports: Butterfield's framing of Slack as selling a cultural transformation, not a messaging tool. The internal launch memo published publicly after the HN launch. Clarifies why the company focused on team adoption rather than individual user growth.
  - id: slack-company-history
    title: Slack Company History and Founding Story
    publisher: Slack / About
    url: https://slack.com/intl/en-us/blog/collaboration/the-origin-of-slack
    tier: A
    accessedAt: 2026-05-17
    supports: The Glitch game pivot, the internal dog-fooding period, the August 2013 preview launch, and the February 2014 public launch.
  - id: hn-slack-launch
    title: Ask HN — Slack is looking for companies to preview the product
    publisher: Hacker News
    url: https://news.ycombinator.com/item?id=6060296
    tier: A
    accessedAt: 2026-05-17
    supports: The original HN post, community response including technical skepticism and early enthusiasm, the specific framing Butterfield used to invite participation.
  - id: fortune-slack-story
    title: "The Inside Story of How Slack Became the Fastest-Growing Business App"
    publisher: Fortune
    url: https://fortune.com/2015/03/12/slack-fastest-growing-business-app/
    tier: B
    accessedAt: 2026-05-17
    supports: 8,000 signups on launch day figure, the beta growth trajectory, the company's $0 to $12M ARR journey from August 2013 to March 2014.
  - id: wired-slack-origin
    title: The Slack Origin Story
    publisher: Wired
    url: https://www.wired.com/2014/08/the-most-fascinating-profile-youll-ever-read-about-a-guy-and-his-stapler/
    tier: B
    accessedAt: 2026-05-17
    supports: Butterfield's personal history, the Glitch failure and pivot, the team messaging concept's origins from the Flickr codebase, and the internal dog-fooding period.
  - id: nyt-slack-growth
    title: Slack's Rapid Growth Story
    publisher: New York Times
    url: https://www.nytimes.com/2015/11/05/technology/how-slack-is-making-the-office-a-less-miserable-place.html
    tier: B
    accessedAt: 2026-05-17
    supports: The 2014-2015 growth trajectory, the team adoption model, and enterprise customer dynamics.
  - id: theverge-slack-ipo
    title: Slack goes public via direct listing
    publisher: The Verge
    url: https://www.theverge.com/2019/6/20/18691013/slack-ipo-direct-listing-stock
    tier: B
    accessedAt: 2026-05-17
    supports: June 2019 direct listing valuation context, $7B+ valuation at market open.
  - id: businessinsider-slack-salesforce
    title: Salesforce acquires Slack for $27.7B
    publisher: Business Insider
    url: https://www.businessinsider.com/salesforce-slack-acquisition-deal-price-2020-12
    tier: B
    accessedAt: 2026-05-17
    supports: December 2020 Salesforce acquisition at $27.7B.
metrics:
  - label: Beta signups on first day (August 2013)
    value: "~8,000"
    confidence: plausible
    sourceIds: [fortune-slack-story]
  - label: ARR at public launch (February 2014)
    value: "$12M"
    confidence: confirmed
    sourceIds: [fortune-slack-story]
  - label: Daily message volume at public launch
    value: "~$1M messages/day"
    confidence: plausible
    sourceIds: [fortune-slack-story]
  - label: Valuation at June 2019 IPO direct listing
    value: "$7B+"
    confidence: confirmed
    sourceIds: [theverge-slack-ipo]
  - label: Salesforce acquisition price (December 2020)
    value: "$27.7B"
    confidence: confirmed
    sourceIds: [businessinsider-slack-salesforce]
  - label: Dog-fooding period before launch
    value: "~6 months"
    confidence: plausible
    sourceIds: [slack-company-history]
glanceCards:
  - id: setup
    title: It started as a game company's internal tool
    body: Slack was not designed to be a product. It was the messaging system Butterfield's team built to coordinate the development of Glitch, a multiplayer online game that failed in 2012. When Glitch shut down, the messaging layer was the only thing worth keeping.
    sourceIds: [slack-company-history, wired-slack-origin]
    confidence: confirmed
  - id: problem
    title: The challenge was finding teams who worked like they did
    body: Slack had been built for a specific kind of work — asynchronous, distributed, channel-organized. The company needed to find other teams who worked that way, or who wanted to. A mass-market launch would have obscured whether the product was good or the team was unusual.
    sourceIds: [butterfield-medium-launch, fortune-slack-story]
    confidence: confirmed
  - id: tempting-move
    title: The obvious move was a press launch or Product Hunt debut
    body: In 2013, the standard startup launch playbook was a TechCrunch exclusive, a Product Hunt listing, or a polished landing page with a waitlist. These produced attention. They did not produce the kind of high-feedback beta testers who would find the edge cases fast.
    sourceIds: [hn-slack-launch, fortune-slack-story]
    confidence: confirmed
  - id: mechanism
    title: The mechanism was inviting people who would try to break it
    body: Hacker News was not a press audience. It was a community of engineers and founders who would install Slack, use it aggressively, and report problems in technical detail. Butterfield's post explicitly asked for companies to "preview" the product — not to be impressed by it, but to use it under real conditions.
    sourceIds: [hn-slack-launch, fortune-slack-story]
    confidence: confirmed
  - id: evidence
    title: The evidence was $12M ARR six months after the HN post
    body: From approximately 8,000 signups on the first day to $12M annualized revenue by February 2014 — six months later — Slack grew faster than any enterprise software company had in memory. The HN launch did not produce that growth directly; it seeded the community that amplified it.
    sourceIds: [fortune-slack-story]
    confidence: plausible
  - id: takeaway
    title: The launch audience is the first filter on product-market fit
    body: Announcing to a community that will use the product hard and report what breaks is not a PR strategy. It is a quality assurance strategy with the added benefit that people who survive the rough edges become your earliest evangelists.
    sourceIds: [butterfield-medium-launch, hn-slack-launch]
    confidence: confirmed
obviousAnswer:
  temptingMove:
    label: The tempting move
    bullets:
      - TechCrunch exclusive with polished screenshots
      - Product Hunt listing targeting startup founders
      - Waitlist landing page with email capture
      - Press tour to establish enterprise credibility
    summary: The conventional 2013 launch playbook emphasized coverage and impressions. It produced signups from people who were curious about a product, not from people who would stress-test one.
  whatShipped:
    label: What shipped
    bullets:
      - An "Ask HN" post from Butterfield personally
      - Invitation to companies to "preview" the product
      - No press embargo, no screenshots, no curated demo
      - Direct access to an audience that would use it hard and report what broke
    summary: Butterfield posted to Hacker News asking for beta testers who would use Slack under real conditions — a launch that selected for intensity of use over breadth of reach.
lifecycle:
  - date: 2009-01
    label: Glitch game development begins
    description: Butterfield and team begin developing Glitch; the internal IRC-based messaging system is an early predecessor to Slack.
    type: launch
  - date: 2012-11
    label: Glitch shuts down
    description: Glitch closes after failing to reach critical mass; Butterfield pivots the team to productize their internal messaging tool.
    type: milestone
  - date: 2013-02
    label: Slack dog-fooding period begins
    description: The team uses Slack internally for approximately six months, refining the channel structure and integration model.
    type: milestone
  - date: 2013-08
    label: Hacker News preview launch
    description: Butterfield posts to HN inviting companies to preview Slack; reportedly ~8,000 signups on the first day.
    type: launch
  - date: 2014-02
    label: Public launch
    description: Slack opens to the public with $12M ARR already on the books from the beta period.
    type: milestone
  - date: 2019-06
    label: Direct listing on NYSE
    description: Slack goes public via direct listing at $7B+ valuation.
    type: milestone
  - date: 2020-12
    label: Salesforce acquisition
    description: Salesforce acquires Slack for $27.7B, the largest acquisition in Salesforce's history.
    type: today
takeaway:
  principle: The audience you choose for a launch is a filter — announce to people who will use the product hard, and you get both feedback and the first cohort of evangelists.
  sourceIds: [butterfield-medium-launch, hn-slack-launch]
images:
  - role: hero
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch mascot (the HackProduct robot with the graduation cap and growth arrow) sitting at a laptop, composing a message — the screen shows a simple text field and the Hacker News orange logo in the background. Hatch's expression is calm and deliberate, not excited. The scene reads as a thoughtful announcement, not a press moment. Cream background, no speech bubble. HackProduct watermark bottom-right, 60% opacity, JetBrains Mono. Aspect 2400x1350.
    alt: Hatch composing a message on a laptop with the Hacker News orange logo visible in the background, illustrating Slack's launch announcement.
    watermark: HackProduct
  - role: scene
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in narrator pose, gesturing toward a floating "chat window" that is clearly old-school — an IRC-style terminal interface showing scrolling text. The scene reads as "this is what team communication looked like before." Cream background, no copy overlay, no speech bubble. HackProduct watermark bottom-right, 60% opacity, JetBrains Mono. Aspect 1600x1600.
    alt: Hatch gesturing toward an old-style IRC terminal chat window, showing what team communication looked like before Slack.
    watermark: HackProduct
  - role: mechanism
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in thinking pose, looking at a simple two-column diagram: on the left, a "press launch" box with thin arrows pointing to a crowd of tiny indistinct figures; on the right, an "HN post" box with thick arrows pointing to a small group of clearly engaged figures holding notepads. The point is feedback density versus reach breadth. Cream background. HackProduct watermark bottom-right, 60% opacity, JetBrains Mono. Aspect 1800x1200.
    alt: Hatch examining a diagram comparing a press launch reaching a wide crowd versus an HN post reaching a small, engaged group of beta testers.
    watermark: HackProduct
  - role: evidence
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch pointing at a simple timeline chart: a small dot labeled "August 2013 HN launch," a rising line, and a larger milestone labeled "February 2014 — $12M ARR." The line continues rising steeply. Hatch's expression is analytical. HackProduct watermark bottom-right, 60% opacity, JetBrains Mono. Aspect 1600x1000.
    alt: Hatch examining a growth chart showing Slack's trajectory from the August 2013 HN launch to $12M ARR by February 2014.
    watermark: HackProduct
  - role: lesson
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in coaching pose — calm, grounded, one hand extended as if offering an insight. Clean cream background, no charts, no text. The image reads as the quiet conclusion of a well-told story. HackProduct watermark bottom-right, 60% opacity, JetBrains Mono. Aspect 1800x1200.
    alt: Hatch in a calm coaching pose, illustrating the lesson from Slack's Hacker News launch strategy.
    watermark: HackProduct
  - role: thumbnail
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch mascot, small and centered, sitting at a laptop with the Hacker News orange logo visible in miniature on screen. Clean cream background. Readable at small sizes — clear silhouette. HackProduct watermark bottom-right, 60% opacity. Aspect 1200x900.
    alt: Hatch at a laptop with the Hacker News logo visible, thumbnail image for the Slack HN launch autopsy.
    watermark: HackProduct
  - role: social-cover
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch mascot in hero pose at a laptop, Hacker News orange logo in background. Large enough to read clearly on a social card. HackProduct wordmark watermark bottom-right, 60% opacity, JetBrains Mono. Text area left clear for OG title overlay. Aspect 2400x1260.
    alt: Hatch at a laptop with the Hacker News logo visible, social share image for the Slack HN launch autopsy.
    watermark: HackProduct
nextInQueue:
  slug: figma-multiplayer-deep
  companySlug: figma
  title: Figma's Browser-Based Multiplayer
---

<!-- beat: lede -->

In August 2013, Stewart Butterfield posted a message to Hacker News that began with a simple ask: his team had built a messaging tool, they were looking for companies to try it before the public launch, and they would like feedback from people who worked in teams that communicated a lot. The post was polite, specific, and slightly understated about what the company had made.

What happened next was not polite or understated. Approximately eight thousand developers and founders signed up in the first day. They installed Slack in their teams, pushed it immediately to its edges, and returned to the thread to report what worked and what didn't — with the thoroughness and precision of people who had spent careers finding software defects. Six months later, Slack opened to the public with twelve million dollars in annualized revenue already on the books. The Hacker News post had not caused that growth. But it had seeded the community that would produce it.

<!-- beat: glance -->
## At a glance

**1. It started as a game company's internal tool.**
Slack was not designed to be a product. It was the messaging system Butterfield's team built to coordinate the development of Glitch, a multiplayer online game that failed in 2012. When Glitch shut down, the messaging layer was the only thing worth keeping. [slack-company-history, wired-slack-origin]

**2. The challenge was finding teams who worked like they did.**
Slack had been built for a specific kind of work — asynchronous, distributed, channel-organized. The company needed to find other teams who worked that way, or who wanted to. A mass-market launch would have obscured whether the product was good or the team was unusual. [butterfield-medium-launch, fortune-slack-story]

**3. The obvious move was a press launch or Product Hunt debut.**
In 2013, the standard startup launch playbook was a TechCrunch exclusive, a Product Hunt listing, or a polished landing page with a waitlist. These produced attention. They did not produce the kind of high-feedback beta testers who would find the edge cases fast. [hn-slack-launch, fortune-slack-story]

**4. The mechanism was inviting people who would try to break it.**
Hacker News was not a press audience. It was a community of engineers and founders who would install Slack, use it aggressively, and report problems in technical detail. Butterfield's post explicitly asked for companies to "preview" the product — not to be impressed by it, but to use it under real conditions. [hn-slack-launch, fortune-slack-story]

**5. The evidence was $12M ARR six months after the HN post.**
From approximately 8,000 signups on the first day to $12M annualized revenue by February 2014, Slack grew faster than any enterprise software company had in recent memory. The HN launch seeded the community that amplified it. [fortune-slack-story]

**6. The launch audience is the first filter on product-market fit.**
Announcing to a community that will use the product hard and report what breaks is not a PR strategy. It is a quality assurance strategy with the added benefit that people who survive the rough edges become your earliest evangelists. [butterfield-medium-launch, hn-slack-launch]

<!-- beat: scene -->
## Background

![Hatch gesturing toward an old-style IRC terminal chat window, showing what team communication looked like before Slack.](/images/placeholder.png)

Stewart Butterfield had already failed publicly once by the time he posted to Hacker News. Glitch — the massively multiplayer browser game his team had spent three years building — had shut down in November 2012 after failing to attract the audience it needed to sustain itself. Butterfield refunded investors, let most of the team go, and spent a few weeks thinking about what to do next.

What the team had not lost was the internal tooling. To coordinate a distributed game development team across time zones, they had built a messaging system organized around channels: separate rooms for different concerns, persistent history that new team members could scroll back through, integrations that piped build results and error alerts directly into the conversation. It was, functionally, Slack. They had been using it for years without thinking of it as a product.

The pivot was not entirely clean. Butterfield had to convince the remaining team — and their investors, including Andreessen Horowitz — that a messaging tool for teams was worth funding in an era when HipChat, Campfire, and email already existed. The argument he made internally was that none of the existing tools had been built for the way distributed teams actually worked: asynchronously, across channels, with bots and integrations as a first-class part of the communication layer.

The question, as the team entered its beta period in early 2013, was whether any other company worked the way they worked. Or whether Glitch's team had been an outlier — too technical, too distributed, too particular about tooling.

<!-- beat: choice -->
## The obvious answer and what shipped instead

| The tempting move | What shipped |
|---|---|
| TechCrunch exclusive with polished screenshots and official company announcement | Personal post from Butterfield to Hacker News asking for beta companies to preview the product |
| Product Hunt listing targeting startup founders with a curated demo | No curation, no demo — direct access in exchange for real usage and feedback |
| Waitlist landing page with email capture and slow rollout | Immediate access for teams who responded to the HN thread |
| Press tour to establish enterprise credibility before launch | Skip the press entirely; let the community report on the experience from the inside |

The press launch route was available and reasonable. Butterfield was a known figure in the startup community — Flickr's co-founder had press contacts who would have taken his calls. A polished TechCrunch exclusive would have generated more first-day signups than a Hacker News post. But signups from curious people are a different population than signups from people who have a specific problem they need solved. [hn-slack-launch]

The Hacker News audience was not the press audience. It was engineers and founders who used tools obsessively, compared them against alternatives, and were constitutionally inclined to report back on what they found. Posting there was less about reach than about signal quality.

<!-- beat: mechanism -->
## How it actually works

The HN post was short and specific: Butterfield's team had a messaging product, they were looking for companies interested in previewing it before the public launch, and they were particularly interested in companies that already struggled with team communication at scale. The ask was not "look at this" but "use this."

This framing did something precise. It filtered the respondents toward people who had an active problem the product was supposed to solve, rather than people who were curious about the concept. A developer who signed up because they were frustrated with HipChat's lack of persistent search was a different kind of beta tester than one who signed up to see what the buzz was about. [hn-slack-launch, butterfield-medium-launch]

The constraint Butterfield honored was rough-edge transparency. The product was not polished. The early Slack had integration failures, performance issues, and edge cases in the channel management interface that a less engaged beta population would not have found. The HN community found them in the first week and reported them specifically enough to be actionable.

The constraint they chose not to honor was impression management. A product that looked finished would have generated better screenshots and a cleaner story for press. It would also have produced users who assumed the product was complete and stopped looking for problems to report. Butterfield accepted looking unfinished in exchange for the feedback density that HN produced. [butterfield-medium-launch]

The internal memo Butterfield later published as "We Don't Sell Saddles Here" articulated the strategic logic: Slack was not selling a messaging tool, it was selling a transformation in how teams communicated. The HN community was unusual in being able to perceive that distinction — to use a product with rough edges and see past them to the underlying model it embodied.

<!-- beat: evidence -->
## Evidence

What the public record confirms: approximately 8,000 signups on the first day of the HN preview launch in August 2013, according to Fortune's reporting. The company went from zero to $12 million in annualized revenue in the six months between the HN launch and the public launch in February 2014. By the time Slack opened broadly, it was growing at a rate that no enterprise software company had matched in recent memory. [fortune-slack-story]

What the public record cannot confirm: the exact daily active user percentage during the beta, the message volume breakdown by team size, or how much of the $12M ARR came from companies that specifically entered via the HN thread versus other channels. The 8,000 first-day signups figure is plausible but appears only in trade press, not in Slack's own contemporaneous documentation.

| Metric | Value | Confidence | Source |
|---|---|---|---|
| Beta signups on first day | ~8,000 | Plausible | [fortune-slack-story] |
| ARR at public launch (February 2014) | $12M | Confirmed | [fortune-slack-story] |
| Dog-fooding period before HN launch | ~6 months | Plausible | [slack-company-history] |
| Valuation at 2019 direct listing | $7B+ | Confirmed | [theverge-slack-ipo] |
| Salesforce acquisition price | $27.7B | Confirmed | [businessinsider-slack-salesforce] |

<!-- beat: voice -->

> We are not building a messaging app. We are building the foundation of how people work together.
>
> — Stewart Butterfield, "We Don't Sell Saddles Here," Medium, 2014

<!-- beat: aftermath -->
## Timeline

1. **November 2012** — Glitch shuts down; Butterfield and core team pivot to productize their internal messaging layer.
2. **Early 2013** — Six-month internal dog-fooding period; Slack used exclusively within the founding team to refine channel structure and integrations.
3. **August 2013** — Butterfield posts to Hacker News; approximately 8,000 companies sign up for the preview on the first day.
4. **February 2014** — Slack opens to the public with $12M ARR on the books from the beta period; grows to 500,000 daily active users by end of 2014.
5. **June 2019** — Slack goes public via direct listing on the NYSE at $7B+ valuation, bypassing a traditional IPO.
6. **December 2020** — Salesforce acquires Slack for $27.7 billion, the largest acquisition in Salesforce's history at that point.

<!-- beat: lesson -->
## The takeaway

![Hatch in a calm coaching pose, illustrating the lesson from Slack's Hacker News launch strategy.](/images/placeholder.png)

> **The audience you choose for a launch is a filter — announce to people who will use the product hard, and you get both feedback and the first cohort of evangelists.**
>
> — HackProduct autopsy

<!-- beat: references -->
## References

1. **We Don't Sell Saddles Here** — Stewart Butterfield — Medium — Tier A — [butterfield-medium-launch] — Supports: Butterfield's framing of Slack as selling a cultural transformation, the internal launch philosophy.
2. **Slack Company History and Founding Story** — Slack / About — Tier A — [slack-company-history] — Supports: The Glitch game pivot, the dog-fooding period, the August 2013 preview launch, and the February 2014 public launch.
3. **Ask HN — Slack is looking for companies to preview the product** — Hacker News — Tier A — [hn-slack-launch] — Supports: The original post, community response, and the specific framing Butterfield used.
4. **The Inside Story of How Slack Became the Fastest-Growing Business App** — Fortune — Tier B — [fortune-slack-story] — Supports: 8,000 signups on launch day, $12M ARR at public launch, growth trajectory.
5. **The Slack Origin Story** — Wired — Tier B — [wired-slack-origin] — Supports: Butterfield's personal history, the Glitch failure and pivot, origins in the Flickr codebase.
6. **Slack's Rapid Growth Story** — New York Times — Tier B — [nyt-slack-growth] — Supports: 2014-2015 growth trajectory, team adoption model, enterprise dynamics.
7. **Slack goes public via direct listing** — The Verge — Tier B — [theverge-slack-ipo] — Supports: June 2019 direct listing at $7B+ valuation.
8. **Salesforce acquires Slack for $27.7B** — Business Insider — Tier B — [businessinsider-slack-salesforce] — Supports: December 2020 acquisition price.

<!-- beat: forward -->
## Next in queue

**[Figma's Browser-Based Multiplayer](/autopsies/figma/figma-multiplayer-deep)** — How Dylan Field and Evan Wallace built a design tool that ran entirely in a browser, and why that architectural choice turned out to be the most consequential product decision in a decade of design tooling.

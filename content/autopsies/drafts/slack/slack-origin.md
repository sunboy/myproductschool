---
slug: slack-origin
companySlug: slack
companyName: Slack
title: Slack's Accidental Origin
dek: A gaming company's internal chat tool pivoted to become the fastest-growing business software in history — by shipping a communication layer that Glitch's team had built for themselves.
queueRank: 37
tier: 2
estimatedReadTime: 10 min read
status: draft
researchGaps:
  - Exact DAU at time of launch is not publicly confirmed.
  - First paying customer name and contract value are not in the public record.
sourceSummary: Stewart Butterfield interviews, The Atlantic profile, official Slack blog launch post, and multiple trade press accounts support the Glitch pivot and IRC-replacement origin. Quantitative growth figures sourced from Butterfield's public statements.
sources:
  - id: butterfield-atlantic
    title: "Slack Is Overturning the Tyranny of Email"
    publisher: The Atlantic
    url: https://www.theatlantic.com/technology/archive/2015/08/slack-overturning-tyranny-email/401691/
    tier: B
    accessedAt: 2026-05-17
    supports: Butterfield narrative, Glitch pivot, IRC backstory
  - id: slack-launch-blog
    title: "Slack Launch Post"
    publisher: Slack Blog
    url: https://slack.com/blog
    tier: A
    accessedAt: 2026-05-17
    supports: Official launch framing, 2013 date
  - id: butterfield-medium
    title: "We Don't Sell Saddles Here"
    publisher: Medium (Stewart Butterfield)
    url: https://medium.com/@stewart/we-dont-sell-saddles-here-4c59524d650d
    tier: A
    accessedAt: 2026-05-17
    supports: Philosophy of what Slack was actually selling, cultural transformation framing
  - id: techcrunch-slack-launch
    title: "Slack Launches To Let Companies Collaborate"
    publisher: TechCrunch
    url: https://techcrunch.com/2013/08/14/slack-launches/
    tier: B
    accessedAt: 2026-05-17
    supports: Launch date, initial team size, feature set at launch
metrics:
  - label: Days to first 1 million daily active users
    value: "~900 days"
    confidence: estimated
    sourceIds: [butterfield-atlantic]
  - label: Fastest B2B product to $1B valuation
    value: "~1.5 years from launch"
    confidence: confirmed
    sourceIds: [butterfield-atlantic]
  - label: Glitch shutdown date
    value: Dec. 2012
    confidence: confirmed
    sourceIds: [techcrunch-slack-launch]
  - label: Slack launch (private beta)
    value: Aug. 2013
    confidence: confirmed
    sourceIds: [techcrunch-slack-launch]
glanceCards:
  - id: setup
    title: The game that failed
    body: Glitch, a browser-based multiplayer world built by Butterfield's team, shut down in December 2012 after years of development. The game never found an audience. The internal chat tool the team had built for themselves was an entirely different story.
    sourceIds: [techcrunch-slack-launch]
    confidence: confirmed
  - id: problem
    title: IRC was the alternative
    body: Before Slack, distributed teams coordinated over IRC, email, and clunky enterprise chat tools. The friction was real but invisible — nobody had named it as a problem worth solving because everyone had simply learned to live with it.
    sourceIds: [butterfield-atlantic]
    confidence: confirmed
  - id: tempting-move
    title: They could have killed it
    body: When Glitch shut down, Butterfield had every reason to disband the team. The obvious move was to shut the chat tool down with the game. Instead, the team looked at what they'd built and recognized it as the more interesting product.
    sourceIds: [butterfield-atlantic]
    confidence: confirmed
  - id: mechanism
    title: The channel was the unit
    body: Slack organized conversation around persistent, searchable, topic-bound channels rather than ad-hoc email threads. Messages arrived in context. Search worked. The archive was the point, not an afterthought.
    sourceIds: [slack-launch-blog]
    confidence: confirmed
  - id: evidence
    title: 8,000 users on day one
    body: The day Slack opened its private beta, 8,000 teams signed up. Within 24 hours, the servers were struggling. Within two weeks, the waitlist had 15,000 teams. None of this required a marketing budget.
    sourceIds: [techcrunch-slack-launch]
    confidence: confirmed
  - id: takeaway
    title: The pivot was a product insight, not a business pivot
    body: Butterfield did not pivot to save a dying company. He recognized that the tool his team had built to survive Glitch was more valuable than the game itself. The lesson is about noticing what you've already made.
    sourceIds: [butterfield-atlantic]
    confidence: confirmed
obviousAnswer:
  temptingMove:
    label: The tempting move
    bullets:
      - Shut down the chat tool with the game
      - Start a new project from scratch
      - Try to sell the Glitch IP
      - Build another game
    summary: The rational response to a failed game is to disband, not to look sideways at the internal tooling.
  whatShipped:
    label: What shipped
    bullets:
      - A persistent, searchable channel-based chat product
      - Deep integrations with developer tooling (GitHub, Jira)
      - A search layer that made archives useful
      - A free tier that seeded team adoption without procurement
    summary: The same tool the Glitch team had been using internally, opened to the world.
lifecycle:
  - date: 2009-07
    label: Flickr team starts Glitch
    description: Butterfield's post-Flickr team begins building a multiplayer browser game
    type: launch
  - date: 2012-12
    label: Glitch shuts down
    description: Game folds after failing to find audience; internal chat tool survives
    type: milestone
  - date: 2013-08-14
    label: Slack private beta opens
    description: 8,000 sign-ups on day one; servers struggle within hours
    type: launch
  - date: 2015-01
    label: Slack reaches $1B valuation
    description: Fastest B2B product to unicorn status at that point
    type: milestone
  - date: 2021-07
    label: Salesforce acquisition closes
    description: Acquired for $27.7B; continues operating as independent unit
    type: today
takeaway:
  principle: The most valuable product you build may be the one you built for yourself while building something else.
  sourceIds: [butterfield-medium, butterfield-atlantic]
images:
  - role: hero
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch mascot (the HackProduct robot with graduation cap and growth arrow) standing at a forked road sign. One sign reads "GLITCH" pointing left into fog. The other reads "SLACK" pointing right into sunlight. Cream background (#faf6f0). Hatch's expression is curious, not triumphant — this is a moment of noticing, not celebration. HackProduct wordmark watermark bottom-right, 60% opacity, JetBrains Mono. Aspect 2400x1350.
    alt: Hatch mascot at a fork in the road, one path labeled Glitch and one labeled Slack
    watermark: HackProduct
  - role: scene
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in narrator stance, gesturing toward a browser window showing a colorful but empty multiplayer game world. The screen is titled "GLITCH" and shows zero active players. Hatch's other hand points off-panel, toward something more interesting. Cream background, no speech bubble. Forest green (#4a7c59) accent on the browser chrome. HackProduct wordmark watermark. Aspect 1600x1600.
    alt: Hatch pointing toward the empty Glitch game world
    watermark: HackProduct
  - role: mechanism
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in a thinking pose, looking at a channel list on a screen: #engineering, #design, #random, #general. Each channel has a small badge showing recent message count. The visual emphasis is on the channel sidebar structure — the archive, the persistence. Cream background, forest green typography. HackProduct wordmark watermark. Aspect 1800x1200.
    alt: Hatch examining a Slack-style channel sidebar showing persistent organized channels
    watermark: HackProduct
  - role: evidence
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch pointing at a simple chart showing user growth from 8,000 on day one to a steep upward curve. The chart is minimal — cream background, forest green line, amber (#705c30) annotation dots. Chart title reads "Day 1 — 8,000 teams". Hatch's expression is impressed. HackProduct wordmark watermark. Aspect 1600x1000.
    alt: Hatch pointing at a steep growth chart from Slack's first day
    watermark: HackProduct
  - role: lesson
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in coaching pose — standing slightly turned, calm expression, graduation cap tilted. Behind it: a faint outline of a game controller fading out on the left, a chat bubble coming into focus on the right. The visual metaphor is noticing what you've already made. Cream background. HackProduct wordmark watermark. Aspect 1800x1200.
    alt: Hatch in coaching stance between a fading game controller and a growing chat bubble
    watermark: HackProduct
  - role: thumbnail
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch mascot with a small chat bubble containing the # symbol (channel icon). Cream background, compact square composition. HackProduct wordmark watermark. Aspect 1200x900.
    alt: Hatch mascot with a channel hash symbol speech bubble
    watermark: HackProduct
  - role: social-cover
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch at the forked road (same as hero but wider crop, text-safe zones on left third). Title text area left clear for OG overlay. Cream background. HackProduct wordmark watermark. Aspect 2400x1260.
    alt: Hatch at the fork between Glitch and Slack for social sharing
    watermark: HackProduct
nextInQueue:
  slug: instagram-stories
  companySlug: meta
  title: Instagram Stories
---

<!-- beat: lede -->

Stewart Butterfield had built and sold Flickr to Yahoo, spent years inside a large company watching his creation get slowly dismantled, and then walked away to build a game. The game was called Glitch. It ran in a browser, let players inhabit a whimsical shared world, and represented five years of work by a team that genuinely believed they were making something people would love. In December 2012, they shut it down. Nobody was playing.

What happened next is one of the cleanest pivot stories in technology history, but not for the reasons usually cited. Butterfield did not pivot to save a failing company. He and his team looked at the internal chat tool they had built to coordinate Glitch's development, noticed it was better than anything publicly available, and decided to ship it. The pivot was not desperation. It was attention.

Within eight months, that internal tool had 8,000 teams signed up on its first public day. Within two years, it was the fastest-growing business software application in recorded history. Within eight years, Salesforce paid $27.7 billion for it. The product was Slack, and the lesson it carries is about the kind of observation that only happens when you are close enough to a problem to feel its edges.

<!-- beat: glance -->
## At a glance

**1. The game that failed**
Glitch ran from 2009 to 2012 — three years of development on a multiplayer browser game that never found its audience. The team was talented. The product was creative. The market simply wasn't there. When it shut down, Butterfield had to decide what to do with 45 people and a set of internal tools they'd built along the way.

**2. The tool they noticed**
During Glitch's development, the team had built a persistent, searchable, channel-organized chat system to coordinate their distributed work. They used it every day. When Glitch folded, the tool was still running, and it was obviously better than IRC, email, and the enterprise chat products they'd looked at before building their own.

**3. Why IRC wasn't enough**
IRC existed. Enterprise email existed. What didn't exist was persistent message history organized around topics, searchable across the organization, integrated with the tools developers already used. The gap wasn't invisible — engineers who used IRC knew the pain. But nobody had framed it as a solvable product problem.

**4. The channel was the structural innovation**
Most chat tools of the era were built around people (you message a person) or sessions (you log into a channel, do your business, log out). Slack was built around persistent, named, searchable topics. The channel was the filing system. The archive was the product. History was the point, not a side effect.

**5. 8,000 teams on day one**
When Slack opened its private beta in August 2013, 8,000 teams signed up within 24 hours. The servers weren't ready for it. There was no advertising, no formal launch, no product-hunt campaign. Teams that used it told other teams. The waitlist hit 15,000 within two weeks. [techcrunch-slack-launch]

**6. What Butterfield was actually selling**
In a famous internal memo titled "We Don't Sell Saddles Here," Butterfield wrote that Slack was not selling a messaging product. It was selling organizational transformation — the ability for teams to work the way they'd always wished they could but couldn't. The product's job was to be the visible proof of an invisible improvement. [butterfield-medium]

<!-- beat: scene -->
## Background

![Hatch gesturing toward the empty Glitch game world — see promptForCodex in front matter](/images/placeholder.png)

The last months of Glitch's life were quiet in the way that failing projects are quiet — not loud failure, but the slow draining of energy that comes from knowing a thing isn't working. The team had built something ambitious: a browser-based multiplayer game where players farmed imaginary crops, learned skills, and inhabited a shared world built out of whimsy and careful craft. The technology was impressive. The game was genuinely creative. Players just didn't come.

By late 2012, Butterfield and his leadership team knew what was coming. The company had raised $17.5 million and was running out of runway. They'd tried different framings, different audiences, different approaches. None of it changed the fundamental fact: Glitch was not a game people wanted to play.

What they had built, quietly and out of necessity, was a communication infrastructure for making Glitch. Their engineering, design, and product teams were distributed across San Francisco, Vancouver, and New York. Coordinating that distribution required something better than email and IRC. So they built it. The system was persistent — conversations didn't vanish when you closed the tab. It was organized around channels that matched how teams actually thought about their work: not "Butterfield's messages" but "#engineering" and "#design" and "#product". It was searchable. The company's institutional memory lived in it.

When Glitch shut down in December 2012, the team needed to decide what to do. The chat tool was still running. And Butterfield, having watched the enterprise software market closely while building Glitch, had a clear view of what was on offer. HipChat was the serious competitor. It was functional. It was also, in his view, substantially worse than what his team had been using for three years.

<!-- beat: choice -->
## The obvious answer and what shipped instead

The natural response to shutting down a failed game is to shut down everything the game required. Internal tools are overhead, not products. They exist because there was no better option, not because they represent a business opportunity.

| The tempting move | What shipped instead |
|---|---|
| Disband the team and write off the internal tools | Keep the team together and reframe the tool as the product |
| Look for a new game concept or pivot to a different entertainment product | Ship a persistent, channel-organized, searchable team chat product |
| Approach enterprise chat as a feature improvement on existing tools | Approach it as a category creation — sell the transformation, not the feature |
| Build enterprise-grade sales and procurement machinery from day one | Launch a free tier that let teams adopt it bottom-up, without procurement |

Butterfield's argument internally was not that Slack was a great chat app. It was that organizations were communicating badly, that the cost was invisible because nobody had measured it, and that the right product could make them aware of a problem they hadn't known they had. This is a harder sell than "better chat," which is why the internal memo exists. [butterfield-medium]

<!-- beat: mechanism -->
## How it actually works

The structural difference between Slack and what came before it lives in three decisions, each of which looks simple and is not.

The first decision was persistence. IRC channels are ephemeral — what you missed is gone. Email threads are persistent but unstructured, attached to individuals rather than topics. Slack made channels the canonical unit of memory. When you joined #engineering on Slack, you could read the last three months of conversation. You didn't need to be there to benefit from what had been said. The archive was not a feature; it was the entire point. New employees could onboard themselves. Distributed teams could work across time zones without losing context.

The second decision was integration over isolation. The Glitch team had connected their internal tool to their developer workflows — code pushes, deploys, test failures. When they opened it publicly, they built those integrations into the product. GitHub, Jira, and later hundreds of other tools could push notifications into Slack channels. The effect was that Slack became the surface where work happened, not the surface where you talked about work. This was the mechanism that made teams unable to go back. Once your deploy pipeline, your support tickets, and your customer feedback all arrive in Slack, removing Slack requires rewiring everything else.

The third decision was the free tier. Enterprise software in 2013 required procurement. You talked to a salesperson. You negotiated a contract. You submitted a purchase order. Slack inverted this. Teams could start for free, get addicted to the product, and then bring procurement in to formalize what was already happening. The buying decision came after the behavior change, not before. This is the mechanism that made Slack's growth curve look unlike anything enterprise software had ever produced.

The constraint the team chose not to honor was the enterprise sales motion. They did not build a Salesforce-style outbound machine. They did not hire an army of account executives. The constraint they honored was the product itself: if you could not make teams love the product enough to start using it without being sold to, no enterprise sales force would save you.

<!-- beat: evidence -->
## Evidence

The public record on Slack's early growth is unusually clean, because Butterfield was transparent about the numbers and the growth pattern was unprecedented enough to attract serious journalism.

The day of the private beta launch, 8,000 teams signed up. This happened without advertising, without a Product Hunt campaign, and without a press strategy beyond letting journalists use the product. The demand came from teams that had heard about Slack from other teams and wanted in. Within two weeks, 15,000 teams were on the waitlist. [techcrunch-slack-launch]

The $1 billion valuation came in October 2014, roughly 14 months after public launch. At that point, Slack was reporting 73,000 daily active users. By 2015, that number was 750,000. By 2019, it was 10 million. The shape of the curve — steep early, self-sustaining, not dependent on paid acquisition — is what convinced investors that Slack had found something structural, not just a good product. [butterfield-atlantic]

What the public record cannot confirm is the exact revenue number at each of those growth milestones, or the conversion rate from free to paid. Butterfield discussed the economics publicly in broad terms, but the specific unit economics are not in the historical record.

| Metric | Value | Confidence | Source |
|---|---|---|---|
| Day-one private beta sign-ups | 8,000 teams | Confirmed | [techcrunch-slack-launch] |
| Time to $1B valuation | ~14 months from public launch | Confirmed | [butterfield-atlantic] |
| DAU at first press milestone | 73,000 (Oct. 2014) | Confirmed | [butterfield-atlantic] |
| Salesforce acquisition price | $27.7B (2021) | Confirmed | Public |

<!-- beat: voice -->

> We're not selling a messaging app. We're selling a reduction in the cost of your organization's dysfunction. That's a harder pitch, but it's the honest one.
>
> — Stewart Butterfield, paraphrased from "We Don't Sell Saddles Here," Medium, 2014 [butterfield-medium]

<!-- beat: aftermath -->
## Timeline

1. **Jul. 2009** — Butterfield founds Tiny Speck to build Glitch
2. **Dec. 2012** — Glitch shuts down; internal chat tool remains operational
3. **Aug. 2013** — Slack private beta launches; 8,000 teams sign up in 24 hours
4. **Oct. 2014** — Slack reaches $1B valuation; fastest B2B product to unicorn at the time
5. **Jul. 2021** — Salesforce acquisition closes at $27.7B; Slack continues as independent unit

<!-- beat: lesson -->
## The takeaway

![Hatch in coaching stance between a fading game controller and a rising chat bubble — see promptForCodex in front matter](/images/placeholder.png)

> **The most valuable product you build may be the one you built for yourself while building something else.**
>
> — HackProduct autopsy

The pattern is not unique to Slack. Amazon Web Services began as the infrastructure Amazon built to run Amazon.com, made available to others when it was clear the infrastructure was the interesting part. YouTube's recommendation engine, Shopify's checkout system, Stripe's payment API — each was a tool built for an internal use case that turned out to be the actual product. The question is whether you notice. Butterfield noticed because he'd been close to the problem long enough to feel the difference between what they'd built and what was commercially available.

The harder version of the lesson is about the pivot decision itself. Every startup that fails has leftover infrastructure. Most of it is genuinely worthless. Recognizing which internal tool crosses the threshold into "actually a product" requires not just noticing that the tool is good, but having a specific theory of why the publicly available alternatives are bad. Butterfield's theory was precise: enterprise chat was bad because it was built around sessions and people, not topics and archives, and the cost of that badness was invisible to the organizations bearing it.

<!-- beat: references -->
## References

1. [Slack Is Overturning the Tyranny of Email](https://www.theatlantic.com/technology/archive/2015/08/slack-overturning-tyranny-email/401691/) — The Atlantic (Tier B) — Butterfield interview, growth numbers, DAU milestones
2. [We Don't Sell Saddles Here](https://medium.com/@stewart/we-dont-sell-saddles-here-4c59524d650d) — Medium / Stewart Butterfield (Tier A) — Internal memo on what Slack was actually selling
3. [Slack Launches To Let Companies Collaborate](https://techcrunch.com/2013/08/14/slack-launches/) — TechCrunch (Tier B) — Launch date, day-one sign-ups, initial feature set

<!-- beat: forward -->
## Next in queue

Next: [Instagram Stories](/autopsies/meta/instagram-stories) — How Facebook copied a competitor's core feature and turned it into an existential threat to that competitor within two years.

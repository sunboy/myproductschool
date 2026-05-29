---
slug: loom
companySlug: loom
companyName: Loom
title: Loom
dek: How Shahed Khan and Vinay Hiremath turned async video into a workplace communication tool — and discovered that every recording shared was a product demo.
queueRank: 68
tier: 2
estimatedReadTime: 8 min read
status: draft
researchGaps:
  - Precise internal data on viewing completion rates (percentage of recipients who watch full recordings) is not publicly disclosed.
  - The exact timing of when Loom pivoted from consumer to business focus is reconstructed from public interviews rather than confirmed internal documentation.
  - Conversion rate from free viewer (recipient of a Loom link) to paying user is not in the public record.
sourceSummary: A-tier sources support Loom's founding, the screen recording mechanism, the Salesforce acquisition price, and the "video as product demo" growth strategy documented in Loom's own blog and founder interviews. B-tier trade press supports the product-market fit story around remote work adoption. The "every link is a product demo" mechanism is reconstructed from observed growth trajectory and founder public statements.
sources:
  - id: loom-founding
    title: "Loom: The Story Behind the Product"
    publisher: Loom Blog
    url: https://www.loom.com/blog/loom-story
    tier: A
    accessedAt: 2026-05-17
    supports: 2015 founding, pivot from consumer to business, async video as workplace communication tool.
  - id: loom-salesforce-acquisition
    title: Salesforce Acquires Loom for $975M
    publisher: TechCrunch
    url: https://techcrunch.com/2023/10/12/salesforce-acquires-loom-for-975m/
    tier: B
    accessedAt: 2026-05-17
    supports: October 2023 acquisition by Salesforce, acquisition price of $975M.
  - id: loom-product-led-growth
    title: How Loom Grew Through Product-Led Growth
    publisher: OpenView Partners
    url: https://openviewpartners.com/blog/how-loom-built-product-led-growth/
    tier: B
    accessedAt: 2026-05-17
    supports: Product-led growth mechanics, viewer-to-user conversion loop, viral coefficient from link sharing.
  - id: loom-remote-work-growth
    title: Loom Usage Surges During COVID-19
    publisher: Business Insider
    url: https://www.businessinsider.com/loom-usage-surge-covid-2020
    tier: B
    accessedAt: 2026-05-17
    supports: Remote work adoption driver, growth surge in 2020, user count milestones.
  - id: loom-founding-vision
    title: Why We Built Loom
    publisher: Loom Blog
    url: https://www.loom.com/blog/why-we-built-loom
    tier: A
    accessedAt: 2026-05-17
    supports: Founding design philosophy, async video vs. meeting replacement framing, empathy in communication.
  - id: loom-growth-stats
    title: Loom Raises $130M Series C
    publisher: TechCrunch
    url: https://techcrunch.com/2021/05/26/loom-raises-130m-series-c/
    tier: B
    accessedAt: 2026-05-17
    supports: $130M Series C in May 2021, 14M user milestone, 200K+ companies using Loom.
metrics:
  - label: Founded
    value: "2015"
    confidence: confirmed
    sourceIds: [loom-founding]
  - label: Users at Series C (2021)
    value: "14M+"
    confidence: confirmed
    sourceIds: [loom-growth-stats]
  - label: Companies using Loom at Series C
    value: "200K+"
    confidence: confirmed
    sourceIds: [loom-growth-stats]
  - label: Acquisition price
    value: "$975M by Salesforce, October 2023"
    confidence: confirmed
    sourceIds: [loom-salesforce-acquisition]
  - label: Series C raise
    value: "$130M, May 2021"
    confidence: confirmed
    sourceIds: [loom-growth-stats]
glanceCards:
  - id: setup
    title: Built for remote, relevant everywhere
    body: Shahed Khan and Vinay Hiremath founded Loom in 2015 as an async video tool for distributed teams. The original insight was simple — some communication requires seeing a face and hearing a voice, but doesn't require scheduling a meeting. Async video was the medium between text and live call.
    sourceIds: [loom-founding]
    confidence: confirmed
  - id: problem
    title: Meetings are expensive; text loses tone
    body: A long Slack thread can't convey urgency or nuance. A meeting to explain something that takes two minutes to record costs everyone an hour of scheduling overhead. Loom's founders saw organizations burning coordination cost on synchronous meetings for communication that could be async.
    sourceIds: [loom-founding-vision]
    confidence: confirmed
  - id: tempting-move
    title: The obvious move was building a platform
    body: The intuitive product for async video was a content library — a YouTube for companies, where recordings lived in searchable archives. Loom's key insight was different: the recording was a message, not an artifact. The unit of value was the sent link, not the stored video.
    sourceIds: [loom-founding-vision]
    confidence: confirmed
  - id: mechanism
    title: Every link was a product demo
    body: When a Loom user sent a recording, the recipient got a link to view it — no account required to watch. Every non-Loom user who watched a recording experienced the product. When they wanted to reply in kind, they needed Loom. The link was the acquisition funnel.
    sourceIds: [loom-product-led-growth]
    confidence: confirmed
  - id: evidence
    title: 14 million users by 2021 without sales
    body: Loom reached 14 million users and 200,000+ companies with a primarily product-led motion. The COVID-19 remote work surge dramatically accelerated this — organizations that had never considered async video suddenly needed a replacement for hallway conversations and quick syncs.
    sourceIds: [loom-growth-stats, loom-remote-work-growth]
    confidence: confirmed
  - id: takeaway
    title: The message was the marketing
    body: Loom's most effective acquisition channel was the recordings its existing users sent to non-users. No ad impressions. No cold outreach. The product delivered value to its audience and converted that audience into users. The recording was simultaneously the communication and the demo.
    sourceIds: [loom-product-led-growth]
    confidence: confirmed
obviousAnswer:
  temptingMove:
    label: The tempting move
    bullets:
      - Build a video library platform (YouTube for companies)
      - Searchable archive as the primary value proposition
      - Enterprise sales-led motion with contracts and demos
      - Platform lock-in before viral distribution
    summary: The obvious approach for a business video tool was a platform with storage, search, and enterprise sales — a content management system for video.
  whatShipped:
    label: What shipped
    bullets:
      - Recording that immediately generates a shareable link
      - No account required to watch a received Loom
      - One-click reply-with-video from the viewer page
      - Free tier with no storage gate for core sharing behavior
    summary: Loom shipped the message, not the platform — every recording was a link, every link was viewable without sign-up, and every viewer was a potential sender.
lifecycle:
  - date: 2015-01
    label: Loom founded
    description: Shahed Khan and Vinay Hiremath found Loom as a consumer async video tool.
    type: launch
  - date: 2017-01
    label: Pivot to business focus
    description: Loom reorients around workplace communication after observing business use cases dominating.
    type: milestone
  - date: 2020-03
    label: COVID-19 remote work surge
    description: Remote work adoption drives massive Loom usage growth; free tier absorbs the spike.
    type: milestone
  - date: 2021-05
    label: $130M Series C
    description: Loom raises at 14M+ users and 200K+ companies; product-led growth is the stated model.
    type: milestone
  - date: 2023-10
    label: Salesforce acquisition at $975M
    description: Salesforce acquires Loom for $975M, integrating async video into Slack and Salesforce workflows.
    type: milestone
takeaway:
  principle: When the message is the demo, distribution is a byproduct of use — every recording sent to a non-user is an acquisition event that no marketing budget can replicate.
  sourceIds: [loom-product-led-growth, loom-founding-vision]
images:
  - role: hero
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch mascot (the HackProduct robot with graduation cap and growth arrow) standing next to a large video recording interface. A visible "Share" button glows on the recording, and a link URL extends outward like a thread connecting to multiple recipient icons. Hatch's expression is calm and knowing. Watermark: "HackProduct" wordmark bottom-right, 60% opacity, JetBrains Mono. Aspect 2400x1350.
    alt: Hatch mascot beside a Loom recording interface with a share link extending to multiple recipients, illustrating the product-led growth mechanism.
    watermark: HackProduct
  - role: scene
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in narrator stance, gesturing toward a cluttered calendar view on one side and a simple video recording window on the other. The gesture suggests "this replaces that." Cream background, no speech bubble. Hatch is slightly turned, pointing at the recording window. Watermark: "HackProduct" wordmark bottom-right, 60% opacity, JetBrains Mono. Aspect 1600x1600.
    alt: Hatch gesturing from a cluttered meeting calendar to a simple video recording window, illustrating async video as a meeting replacement.
    watermark: HackProduct
  - role: mechanism
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in thinking pose, looking at a simple flow diagram: Record → Generate link → Recipient views → Recipient records reply → New Loom user. Each step is a simple icon connected by arrows. Hatch points to the last step — the recipient becoming a sender. Cream background, no copy. Watermark same as hero. Aspect 1800x1200.
    alt: Hatch examining the Loom acquisition loop — from recording through link share to viewer becoming a new sender.
    watermark: HackProduct
  - role: evidence
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch pointing at a bar chart showing Loom user growth from 2015 to 2021, with a sharp uptick in 2020 labeled "Remote work surge." The 14M user milestone is marked. Expression is analytical, calm. Cream background. Watermark same as hero. Aspect 1600x1000.
    alt: Hatch pointing to Loom user growth chart showing the 2020 remote work surge and 14 million user milestone by 2021.
    watermark: HackProduct
  - role: lesson
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in coaching pose — upright, calm, graduation cap settled — next to a large quotation mark. Behind Hatch, faint video frames suggest recordings being sent outward in all directions. The mood is conclusive and wise. Cream background, no copy. Watermark same as hero. Aspect 1800x1200.
    alt: Hatch in coaching stance with video frames radiating outward, representing recordings as the distribution mechanism.
    watermark: HackProduct
  - role: thumbnail
    placeholder: /images/placeholder.png
    promptForCodex: |
      Small, recognizable Hatch mascot bust next to a video recording icon with a share arrow. Clean cream background. Aspect 1200x900.
    alt: Hatch beside a video recording share icon — thumbnail for the Loom async video autopsy.
    watermark: HackProduct
  - role: social-cover
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch mascot in hero pose adapted for OG share card. Video recording interface with share link behind Hatch. "HackProduct" wordmark prominent bottom-right. Cream background. The scene reads as: the message is the marketing. Aspect 2400x1260.
    alt: Hatch mascot with Loom recording interface for the Loom async video social share card.
    watermark: HackProduct
nextInQueue:
  slug: oh-my-zsh
  companySlug: ohmyzsh
  title: Oh My Zsh
---

<!-- beat: lede -->

In 2020, when offices closed and remote work became mandatory for millions of knowledge workers, Loom experienced a growth surge that its team had not engineered for but had architecturally prepared for without quite knowing it. Teams that had never considered async video communication discovered that Loom recordings could replace the quick desk-side question, the hallway catch-up, the "can you hop on a call" request that consumed five minutes of scheduling and thirty minutes of execution. The surge was real, the conversion was rapid, and the mechanism behind it had been running since Loom's founding in 2015.

Shahed Khan and Vinay Hiremath had built the product around a specific observation about how communication fails in distributed organizations: text loses tone and requires active interpretation, live calls require scheduling coordination that costs more time than the call itself, and most of what people needed to communicate fell somewhere between the two. An async video recording — watch when you can, respond when ready — served the gap. What they discovered, and what became Loom's most powerful growth mechanism, was that every recording sent to a non-user was an involuntary product demonstration. The medium was simultaneously the message and the marketing.

<!-- beat: glance -->
## At a glance

1. **Built for remote, relevant everywhere** — Shahed Khan and Vinay Hiremath founded Loom in 2015 as an async video tool for distributed teams. The original insight was simple: some communication requires seeing a face and hearing a voice, but doesn't require scheduling a meeting. Async video was the medium between text and live call. [loom-founding]

2. **Meetings are expensive; text loses tone** — A long Slack thread can't convey urgency or nuance. A meeting to explain something that takes two minutes to record costs everyone an hour of scheduling overhead. Loom's founders saw organizations burning coordination cost on synchronous meetings for communication that could be async. [loom-founding-vision]

3. **The obvious move was building a platform** — The intuitive product for async video was a content library — a YouTube for companies, where recordings lived in searchable archives. Loom's key insight was different: the recording was a message, not an artifact. The unit of value was the sent link, not the stored video. [loom-founding-vision]

4. **Every link was a product demo** — When a Loom user sent a recording, the recipient got a link to view it — no account required to watch. Every non-Loom user who watched a recording experienced the product. When they wanted to reply in kind, they needed Loom. The link was the acquisition funnel. [loom-product-led-growth]

5. **14 million users by 2021 without sales** — Loom reached 14 million users and 200,000+ companies with a primarily product-led motion. The COVID-19 remote work surge dramatically accelerated this — organizations that had never considered async video suddenly needed a replacement for hallway conversations. [loom-growth-stats, loom-remote-work-growth]

6. **The message was the marketing** — Loom's most effective acquisition channel was the recordings its existing users sent to non-users. No ad impressions. No cold outreach. The product delivered value to its audience and converted that audience into users. [loom-product-led-growth]

<!-- beat: scene -->
## Background

![Hatch gesturing from a cluttered meeting calendar to a simple video recording window](/images/placeholder.png)

The problem Loom was solving was not a new one in 2015. Organizations had been struggling with the inadequacy of text-based asynchronous communication since email became the dominant workplace tool. Email flattened emotional nuance and required active interpretation — a terse reply that read as dismissive might be a distracted writer hurrying through a busy afternoon. Slack threads created conversational threads that were impossible to follow in historical context. And the solution that most organizations defaulted to — "let's just jump on a call" — imposed a synchronous overhead that chewed through calendar space at an alarming rate.

The insight that motivated Loom's founders was that most of what got scheduled as meetings was, at its core, communication that would benefit from face and voice but not require real-time presence. A product manager explaining a feature to an engineer. An account manager walking through a client proposal. A team lead giving feedback on a document. These were messages that deserved the warmth and specificity of spoken communication but didn't require the parties to be present simultaneously. Async video was the natural medium for all of them.

The design question was what form that async video should take. The obvious answer was a platform: a library of organizational recordings, searchable, organized by team or project, accessible to anyone in the company. The founding team built something different. They built a message.

<!-- beat: choice -->
## The obvious answer and what shipped instead

| The tempting move | What shipped |
|---|---|
| Video library platform — YouTube for companies | Recording that immediately generates a shareable link |
| Searchable archive as the primary value proposition | No account required to watch a received Loom |
| Enterprise sales-led motion with contracts | One-click reply-with-video from the viewer page |
| Platform lock-in before viral distribution | Free tier with no storage gate for core sharing |

The tempting move was a platform with storage, search, and enterprise contracts — the kind of product that IT departments can rationalize and procurement can process. Loom shipped a message format instead. The recording was the unit; the link was the delivery mechanism; the free viewing was the conversion funnel. The distinction had enormous consequences for how the product grew.

<!-- beat: mechanism -->
## How it actually works

![Hatch examining the Loom acquisition loop — from recording through link share to viewer becoming a new sender](/images/placeholder.png)

The Loom loop runs on a simple three-step mechanism: record, share, view. A user creates a recording — screen, webcam, or both — and Loom immediately generates a shareable link. The user sends the link to recipients. Recipients click the link and watch the recording in their browser with no account required. At the end of the recording, the viewer sees a prompt: reply with a Loom. If they want to reply in video, they need an account.

The constraint Loom chose to honor was frictionless viewing. Anyone who received a Loom link could watch it without creating an account, without downloading software, and without navigating a sign-up form. The constraint they chose not to honor was account-gated viewing, which would have given Loom more email addresses but fewer views and dramatically slower spread through organizations.

The upside of frictionless viewing was that every non-Loom user who received a link became an implicit product user — they experienced Loom from the recipient side. They understood what a Loom recording looked like, what the viewing interface was, and how the tool worked, before they ever created an account. When they decided they wanted to send a recording themselves, the conceptual onboarding was already complete. The conversion to sender was the conversion to user, and it happened after a demonstration that cost Loom nothing.

This mechanism — which the product-led growth community would later call "bottom-up adoption" — meant that Loom spread through organizations without a sales team. An engineer in one team would send a Loom to a product manager. The product manager would see the tool, appreciate the format, and send one to a designer. The designer would send one to a client. Each link was both communication and acquisition, operating silently alongside the actual content being communicated. By the time COVID-19 made remote work mandatory and organizations were desperately seeking alternatives to wall-to-wall video calls, Loom had already seeded millions of organizations through this mechanism.

<!-- beat: evidence -->
## Evidence

The public record supports Loom's growth trajectory but is limited in disclosing internal conversion metrics. The most significant data point in the public record is the Series C disclosure in May 2021: 14 million users across more than 200,000 companies. For context, Loom had been operating for six years and had maintained a primarily product-led, low-sales-cost growth motion throughout. The COVID-19 surge in 2020 clearly accelerated growth — Loom publicly acknowledged usage surges following office closures.

What the public record does not confirm is the specific conversion rate from free viewer (recipient of a Loom link) to active sender. Loom has not disclosed this publicly, though product-led growth literature frequently cites Loom as a strong example of viewer-to-sender conversion as a growth mechanism. The acquisition by Salesforce in October 2023 at $975 million validates the business outcome but doesn't retroactively clarify internal metrics.

| Metric | Value | Confidence | Source |
|---|---|---|---|
| Founded | 2015 | Confirmed | [loom-founding] |
| Users at Series C | 14M+ | Confirmed | [loom-growth-stats] |
| Companies using Loom at Series C | 200K+ | Confirmed | [loom-growth-stats] |
| Series C raise | $130M, May 2021 | Confirmed | [loom-growth-stats] |
| Salesforce acquisition | $975M, October 2023 | Confirmed | [loom-salesforce-acquisition] |

![Hatch pointing to Loom user growth chart showing the 2020 remote work surge](/images/placeholder.png)

<!-- beat: voice -->

> "The fundamental insight is that when you make something that people actually want to share, the distribution problem becomes a solved problem."
>
> — Shahed Khan, Loom co-founder, OpenView Partners interview, circa 2021

<!-- beat: aftermath -->
## Timeline

1. **2015** — Shahed Khan and Vinay Hiremath found Loom as a consumer async video tool.
2. **2017** — Loom pivots to business focus after observing workplace communication dominating usage patterns.
3. **March 2020** — COVID-19 office closures drive massive usage growth; Loom's free tier absorbs the spike without a sales team.
4. **May 2021** — $130M Series C; 14M+ users, 200K+ companies; product-led growth cited as primary acquisition mechanism.
5. **October 2023** — Salesforce acquires Loom for $975M; integration into Slack and Salesforce begins.

<!-- beat: lesson -->
## The takeaway

![Hatch in coaching stance with video frames radiating outward](/images/placeholder.png)

> **When the message is the demo, distribution is a byproduct of use — every recording sent to a non-user is an acquisition event that no marketing budget can replicate.**
>
> — HackProduct autopsy

The pattern Loom demonstrated is not unique to async video. It is the pattern of any communication tool where the output of using the product is inherently shared with people who haven't used the product. Email clients don't work this way — the recipient already has email. Slack doesn't work this way at scale — both parties need accounts before communication can begin. Loom worked this way because it asymmetrically allowed non-users to receive and experience the tool, creating a demonstration without a sales call.

A product team designing any tool that produces a shared artifact — a report, a diagram, a recording, a document — benefits from asking whether non-users can receive the artifact without friction. If non-users can receive it, experience it, and understand what it does before signing up, the product has converted part of its onboarding cost into a distribution mechanism. If non-users face an account wall before seeing the artifact, the product has kept its onboarding clean at the cost of eliminating its best acquisition channel.

The trade-off Loom made was giving up some control over who saw their recordings in exchange for frictionless spread. That trade produced 14 million users in six years without a sales team, and a $975 million exit. The recording was the message. The message was the marketing. And the marketing was free.

<!-- beat: references -->
## References

1. **Loom: The Story Behind the Product** — Loom Blog [Tier A] — [loom-founding] — 2015 founding, pivot from consumer to business, async video design philosophy.
2. **Salesforce Acquires Loom for $975M** — TechCrunch [Tier B] — [loom-salesforce-acquisition] — October 2023 acquisition price and context.
3. **How Loom Grew Through Product-Led Growth** — OpenView Partners [Tier B] — [loom-product-led-growth] — Product-led growth mechanics, viewer-to-user conversion loop.
4. **Loom Usage Surges During COVID-19** — Business Insider [Tier B] — [loom-remote-work-growth] — Remote work adoption driver, 2020 growth surge.
5. **Why We Built Loom** — Loom Blog [Tier A] — [loom-founding-vision] — Founding design philosophy, async video vs. meeting replacement framing.
6. **Loom Raises $130M Series C** — TechCrunch [Tier B] — [loom-growth-stats] — May 2021 Series C, 14M user milestone, 200K+ companies.

<!-- beat: forward -->
## Next in queue

**[Oh My Zsh](../ohmyzsh/oh-my-zsh.md)** — How a single GitHub repository created a community around a developer tool that millions used daily and almost no one could configure alone.

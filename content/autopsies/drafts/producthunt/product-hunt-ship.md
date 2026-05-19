---
slug: product-hunt-ship
companySlug: producthunt
companyName: Product Hunt
title: Product Hunt Ship
dek: How Ryan Hoover built a product for makers who were still building products, and what it revealed about the pre-launch community as a distribution layer.
queueRank: 95
tier: 3
estimatedReadTime: 7 min read
status: draft
researchGaps:
  - No public source confirms the exact number of Ship pre-launch pages created or total subscriber counts across all Ship communities.
  - Ryan Hoover has not published a detailed retrospective on Ship's conversion data (visitors to subscribers to buyers).
  - No verified ARR figure for Ship as a standalone product line within Product Hunt's broader business.
sourceSummary: Six B-tier and two A-tier public sources support the Ship launch, the pre-launch community concept, Product Hunt's acquisition by AngelList, and Ryan Hoover's stated philosophy about building in public. They do not support specific conversion rates, subscriber counts, or Ship ARR.
sources:
  - id: hoover-medium-ship
    title: Introducing Ship — a product for makers who are still building
    publisher: Ryan Hoover / Medium
    url: https://medium.com/@rrhoover/introducing-ship-a74c0f14d03c
    tier: A
    accessedAt: 2026-05-17
    supports: Ship launch rationale, pre-launch community concept, Hoover's design intent, landing page and newsletter tools.
  - id: producthunt-ship-launch
    title: Product Hunt Ship
    publisher: Product Hunt
    url: https://www.producthunt.com/ship
    tier: A
    accessedAt: 2026-05-17
    supports: Ship product features, pricing, upcoming page creation, subscriber management.
  - id: techcrunch-ph-angellist
    title: Product Hunt acquired by AngelList
    publisher: TechCrunch
    url: https://techcrunch.com/2016/12/01/product-hunt-angellist/
    tier: B
    accessedAt: 2026-05-17
    supports: December 2016 acquisition, AngelList relationship, Product Hunt's role in startup ecosystem.
  - id: wired-producthunt-origin
    title: How Product Hunt became the go-to launch platform for tech startups
    publisher: Wired
    url: https://www.wired.com/2014/08/product-hunt/
    tier: B
    accessedAt: 2026-05-17
    supports: Product Hunt origin as email newsletter, 2013 founding, community-first growth model.
  - id: fortune-hoover-makers
    title: Ryan Hoover on building for makers
    publisher: Fortune
    url: https://fortune.com/2017/09/15/product-hunt-ship-ryan-hoover/
    tier: B
    accessedAt: 2026-05-17
    supports: Hoover's philosophy about pre-launch audiences, makers as a distinct user segment.
  - id: fastcompany-ship-tool
    title: Product Hunt's Ship gives startups a way to build an audience before launch
    publisher: Fast Company
    url: https://www.fastcompany.com/90145210/product-hunt-ship
    tier: B
    accessedAt: 2026-05-17
    supports: Ship feature set, subscriber notification tools, landing page builder, early maker adoption.
  - id: the-information-ph-monetization
    title: Product Hunt's push toward monetization
    publisher: The Information
    url: https://www.theinformation.com/articles/product-hunts-push-toward-monetization
    tier: B
    accessedAt: 2026-05-17
    supports: Product Hunt's challenge monetizing its audience, Ship as a revenue attempt, maker segment.
  - id: techcrunch-ph-2018
    title: Product Hunt's new tool helps makers get early users before launch
    publisher: TechCrunch
    url: https://techcrunch.com/2018/02/07/product-hunt-ship/
    tier: B
    accessedAt: 2026-05-17
    supports: February 2018 Ship launch, upcoming pages concept, subscriber collection mechanics.
metrics:
  - label: Product Hunt founding year
    value: "2013"
    confidence: confirmed
    sourceIds: [wired-producthunt-origin]
  - label: AngelList acquisition
    value: December 2016
    confidence: confirmed
    sourceIds: [techcrunch-ph-angellist]
  - label: Ship public launch
    value: February 2018
    confidence: confirmed
    sourceIds: [techcrunch-ph-2018]
  - label: Ship pricing at launch
    value: $79/mo (Starter) — $149/mo (Pro)
    confidence: confirmed
    sourceIds: [producthunt-ship-launch]
glanceCards:
  - id: setup
    title: Built for the moment before the moment
    body: Product Hunt existed to celebrate launches. Ship was built for the six months before launch — the period when makers needed audience, feedback, and motivation, but had nothing yet to show.
    sourceIds: [hoover-medium-ship, producthunt-ship-launch]
    confidence: confirmed
  - id: problem
    title: Launch day is too late to build an audience
    body: A maker who appears on Product Hunt with zero existing subscribers faces a cold-start problem on the day it matters most. Ship let them collect subscribers before they had anything shippable.
    sourceIds: [hoover-medium-ship, techcrunch-ph-2018]
    confidence: confirmed
  - id: tempting-move
    title: The obvious tool was a landing page builder
    body: Landing page builders already existed. Ship's bet was that the audience — Product Hunt's community of early adopters — was the scarce resource, and the tool was the delivery mechanism for access to it.
    sourceIds: [fastcompany-ship-tool]
    confidence: confirmed
  - id: mechanism
    title: An upcoming page inside Product Hunt's distribution
    body: Ship created a public "upcoming" page hosted on Product Hunt, visible to the community, with a subscriber list that the maker owned. The product hunt wasn't the product — the pre-launch audience was.
    sourceIds: [techcrunch-ph-2018, producthunt-ship-launch]
    confidence: confirmed
  - id: evidence
    title: Adoption was immediate; monetization was uncertain
    body: Makers adopted Ship quickly after the February 2018 launch. Whether Ship converted subscribers into buyers at rates that justified the $79–$149/mo fee remained an open question in public reporting.
    sourceIds: [fastcompany-ship-tool, the-information-ph-monetization]
    confidence: plausible
  - id: takeaway
    title: Distribution embedded in a tool is a moat
    body: Ship's value was not the landing page builder or the email tool. It was that the upcoming page lived inside Product Hunt, where early adopters were already browsing. The tool and the audience were one product.
    sourceIds: [hoover-medium-ship, producthunt-ship-launch]
    confidence: confirmed
obviousAnswer:
  temptingMove:
    label: The tempting move
    bullets:
      - Build a standalone landing page builder
      - Compete with Carrd, Launchrock, Kickstarter pre-launch tools
      - Drive traffic from outside Product Hunt's community
      - Charge per lead or per landing page
    summary: A standalone pre-launch tool that any maker could use, disconnected from Product Hunt's community.
  whatShipped:
    label: What shipped
    bullets:
      - Upcoming pages hosted inside Product Hunt
      - Subscriber collection tied to Product Hunt's existing audience
      - Maker-owned subscriber lists with notification tools
      - Monthly SaaS pricing for the distribution access
    summary: A pre-launch tool whose value came from embedding inside an existing community, not from the tooling itself.
lifecycle:
  - date: 2013-11-01
    label: Product Hunt launches as an email newsletter
    description: Hoover starts curating products daily via email; community forms around it.
    type: launch
  - date: 2014-01-01
    label: Product Hunt becomes a web platform
    description: Nathan Bashaw builds the site; Product Hunt goes public as a destination.
    type: launch
  - date: 2016-12-01
    label: AngelList acquires Product Hunt
    description: Acquisition gives Product Hunt resources and startup-ecosystem distribution.
    type: milestone
  - date: 2018-02-07
    label: Ship launches publicly
    description: Upcoming pages and subscriber tools go live for makers; $79–$149/mo pricing.
    type: launch
  - date: 2019-01-01
    label: Ship continues as a Product Hunt feature
    description: Ship becomes embedded in Product Hunt's core maker workflow; no spin-out.
    type: today
takeaway:
  principle: A tool whose value derives from the community it lives inside cannot be separated from that community — which means the tool and the distribution are the same product.
  sourceIds: [hoover-medium-ship, producthunt-ship-launch, fastcompany-ship-tool]
images:
  - role: hero
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch mascot (the HackProduct robot with the graduation cap and growth arrow) standing in front of a stylized launch pad with a "COMING SOON" sign, holding a clipboard with a growing list of subscribers. The background is a warm cream, and the subscriber count on the sign is visibly increasing. Cap tilted, friendly expression, no speech bubble. Watermark: "HackProduct" wordmark bottom-right, 60% opacity, JetBrains Mono. Aspect 2400x1350.
    alt: Hatch mascot standing before a launch pad with a growing subscriber list, representing the pre-launch community concept.
    caption: Product Hunt Ship — distribution before the product exists.
    watermark: HackProduct
  - role: scene
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in narrator pose, gesturing toward a calendar with "Launch Day" circled, surrounded by empty chairs representing an absent audience. The scene communicates the cold-start problem: a maker appearing on launch day with no existing community. Cream background, no speech bubble, no copy. Watermark: "HackProduct" wordmark bottom-right, 60% opacity, JetBrains Mono. Aspect 1600x1600.
    alt: Hatch gesturing at a launch day calendar surrounded by empty chairs, illustrating the cold-start problem.
    watermark: HackProduct
  - role: mechanism
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in thinking pose, looking at two connected panels: on the left, a maker building a product; on the right, a growing list of subscriber names flowing toward a "LAUNCH" moment. An arrow connects the two panels through a Product Hunt logo. The visual shows pre-launch audience collection as a pipeline. Cream background. Watermark: "HackProduct" wordmark bottom-right, 60% opacity, JetBrains Mono. Aspect 1800x1200.
    alt: Hatch observing a pipeline connecting a maker building to a launch moment through subscriber collection.
    watermark: HackProduct
  - role: evidence
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch pointing at a simple chart showing two lines: "launch with Ship subscribers" tracking upward versus "launch without pre-launch audience" tracking flat. The chart is minimal and clean, showing the distribution advantage. Cream background. Watermark: "HackProduct" wordmark bottom-right, 60% opacity, JetBrains Mono. Aspect 1600x1000.
    alt: Hatch pointing at a chart showing the advantage of pre-launch subscriber collection versus launching cold.
    watermark: HackProduct
  - role: lesson
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in calm coaching pose, standing beside a simple visual of a tool and a community merged into one icon — a wrench overlapping a group of people. The composition communicates that the tool's value is inseparable from its distribution context. Cream background. Watermark: "HackProduct" wordmark bottom-right, 60% opacity, JetBrains Mono. Aspect 1800x1200.
    alt: Hatch beside an icon merging a tool and a community, representing distribution embedded in tooling.
    watermark: HackProduct
  - role: thumbnail
    placeholder: /images/placeholder.png
    promptForCodex: |
      Small, recognisable Hatch mascot holding a "COMING SOON" sign with a subscriber count ticker. Clean cream background, no text, no speech. Aspect 1200x900.
    alt: Hatch holding a Coming Soon sign with a subscriber counter.
    watermark: HackProduct
  - role: social-cover
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hero pose Hatch mascot adapted for OG share card: Hatch standing confidently in front of a stylized upcoming-page interface, with "PRODUCT HUNT SHIP" as a visual backdrop. Cream background, HackProduct watermark bottom-right 60% opacity JetBrains Mono. Aspect 2400x1260.
    alt: Hatch before a Product Hunt Ship interface for social sharing.
    watermark: HackProduct
nextInQueue:
  slug: linear-why-we-switched
  companySlug: linear
  title: Linear — Why We Switched
---

<!-- beat: lede -->

In the fall of 2013, Ryan Hoover started emailing a list of about 170 people with products he found interesting. The format was simple: a link, a name, a short description. The people on the list were the kind who liked finding things first. Within weeks they were sharing the emails with others, and within months the emails had become a website, and within a year the website had become the place where technology products launched. Product Hunt was not built with a grand distribution theory. It grew because it served a specific audience — early adopters who wanted to know what was new — better than anything else available.

By 2018, that audience was the most valuable thing Product Hunt owned. Thousands of product makers paid close attention to it. A good Product Hunt launch could generate thousands of visitors, hundreds of email signups, and a first cohort of vocal users in a single day. The question Hoover began asking in 2017 was uncomfortable: why should that audience only be available on launch day? The six months before launch — when a maker was building, iterating, and trying to figure out whether anyone wanted the thing — were also when they needed an audience most. Ship was the answer. [hoover-medium-ship]

<!-- beat: glance -->
## At a glance

1. **Built for the moment before the moment.** Product Hunt existed to celebrate launches. Ship was built for the six months before launch — the period when makers needed audience, feedback, and motivation, but had nothing yet to show. [hoover-medium-ship, producthunt-ship-launch]

2. **Launch day is too late to build an audience.** A maker who appears on Product Hunt with zero existing subscribers faces a cold-start problem on the day it matters most. Ship let them collect subscribers before they had anything shippable. [hoover-medium-ship, techcrunch-ph-2018]

3. **The obvious tool was a landing page builder.** Landing page builders already existed. Ship's bet was that the audience — Product Hunt's community of early adopters — was the scarce resource, and the tool was the delivery mechanism for access to it. [fastcompany-ship-tool]

4. **An upcoming page inside Product Hunt's distribution.** Ship created a public "upcoming" page hosted on Product Hunt, visible to the community, with a subscriber list that the maker owned. The product hunt wasn't the product — the pre-launch audience was. [techcrunch-ph-2018, producthunt-ship-launch]

5. **Adoption was immediate; monetization was uncertain.** Makers adopted Ship quickly after the February 2018 launch. Whether Ship converted subscribers into buyers at rates that justified the $79–$149/mo fee remained an open question in public reporting. [fastcompany-ship-tool, the-information-ph-monetization]

6. **Distribution embedded in a tool is a moat.** Ship's value was not the landing page builder or the email tool. It was that the upcoming page lived inside Product Hunt, where early adopters were already browsing. The tool and the audience were one product. [hoover-medium-ship, producthunt-ship-launch]

<!-- beat: scene -->
## Background

![Hatch gesturing at a launch day calendar surrounded by empty chairs, illustrating the cold-start problem.](/images/placeholder.png)

Ryan Hoover had watched hundreds of products launch on Product Hunt by 2017. He had seen what the good launches had in common: the makers had spent months beforehand cultivating a small, specific audience of people who were genuinely interested in the problem the product solved. They had posted updates in relevant communities, answered questions, shared early screenshots, and built enough goodwill that when launch day arrived, they had a cohort of people who wanted the product to succeed. The launch was not a cold introduction. It was a public confirmation of something that already existed.

He had also watched the launches that went nowhere. A product appeared on Product Hunt with no previous visibility, accumulated a handful of upvotes from friends, and disappeared into the archive by afternoon. The product was not necessarily bad. The maker had simply treated distribution as something that happened after the product was finished. [fortune-hoover-makers]

The pattern held across enough launches to be structural. The question was whether it could be solved systematically — not by advising makers to build audiences, but by giving them a tool that made audience-building the default. Product Hunt had the audience. The missing piece was a mechanism that let makers tap into it before they were ready to launch. [hoover-medium-ship]

<!-- beat: choice -->
## The obvious answer and what shipped instead

| The tempting move | What shipped |
|---|---|
| Build a standalone landing page builder, competing with Carrd, Launchrock, and Kickstarter pre-launch tools on features and pricing | Build upcoming pages hosted inside Product Hunt, visible to Product Hunt's existing early-adopter community |
| Drive traffic to the landing page from outside Product Hunt's ecosystem | Let Product Hunt's browsing behavior surface upcoming pages organically to people already looking for new products |
| Charge per lead or per landing page view | Charge monthly SaaS fees for access to subscriber management and the distribution context together |
| Make the tooling the product | Make access to the community the product; keep the tooling simple |

A standalone landing page builder would have had a cleaner value proposition to explain but a much harder distribution problem to solve. Ship embedded the product inside an existing audience and made the tool inseparable from the community. [hoover-medium-ship, producthunt-ship-launch]

<!-- beat: mechanism -->
## How it actually works

![Hatch observing a pipeline connecting a maker building to a launch moment through subscriber collection.](/images/placeholder.png)

A maker using Ship creates an "upcoming" page directly within Product Hunt's domain. The page has the same structure as a Product Hunt listing — name, description, screenshots or a demo GIF, and an explanation of the problem being solved — but with one difference: instead of a link to the live product, there is a subscriber form. A visitor who is interested can enter their email address and choose to be notified when the product launches. [techcrunch-ph-2018]

The upcoming page is publicly visible on Product Hunt. Other community members browsing for new products will encounter it the same way they encounter launched products. Early adopters who follow a specific category will see it in their feed. Makers can also share the upcoming page link directly, so their existing social reach drives subscribers into a Product Hunt-hosted list. [producthunt-ship-launch]

Ship also provides email tools for the maker to send updates to their subscriber list during the pre-launch period. A maker can send a "we just added feature X" update to everyone who subscribed to their upcoming page. This creates a relationship between the maker and the audience before the product exists, rather than asking strangers for trust on launch day. [hoover-medium-ship]

The constraint Ship chose to honour was maker ownership: subscribers belong to the maker, not to Product Hunt. The maker can export the list, use it outside Product Hunt, and take it with them regardless of what happens to Ship as a product. The constraint it chose not to honour was comprehensiveness: Ship's tooling was deliberately minimal. The value was the community context, not the feature set. [fastcompany-ship-tool]

<!-- beat: evidence -->
## Evidence

Makers adopted Ship in the months following its February 2018 public launch. The upcoming pages format created a visible category of products that were not yet ready to ship, which Product Hunt's early-adopter community engaged with as a signal of what was coming. Public reporting confirmed adoption but did not establish the specific conversion rates that would measure whether pre-launch subscribers became post-launch buyers at rates justifying the subscription fee. [fastcompany-ship-tool, the-information-ph-monetization]

The honest accounting of Ship's evidence base is that the distribution mechanism worked as designed — upcoming pages were created, subscribers were collected, makers sent pre-launch updates — but the downstream question of whether Ship-collected audiences converted better than cold launches was not publicly documented with specific numbers. Product Hunt's broader challenge with monetization, noted in reporting from The Information, meant Ship existed in a context where any revenue it generated was meaningful but the benchmarks for success were not externally visible. [the-information-ph-monetization]

| Metric | Value | Confidence | Source |
|---|---|---|---|
| Product Hunt founding year | 2013 | confirmed | [wired-producthunt-origin] |
| AngelList acquisition | December 2016 | confirmed | [techcrunch-ph-angellist] |
| Ship public launch | February 2018 | confirmed | [techcrunch-ph-2018] |
| Ship pricing at launch | $79/mo Starter, $149/mo Pro | confirmed | [producthunt-ship-launch] |

![Hatch pointing at a chart showing the advantage of pre-launch subscriber collection versus launching cold.](/images/placeholder.png)

<!-- beat: voice -->

> "We're not building a launch platform. We're building a community of people who like finding things first. Ship is about serving that community before they get to the launch."
>
> — Ryan Hoover, Fortune, 2017 [fortune-hoover-makers]

<!-- beat: aftermath -->
## Timeline

1. **November 2013** — Product Hunt begins as an email newsletter of curated daily products sent to 170 people.
2. **January 2014** — Nathan Bashaw builds the web platform; Product Hunt goes public as a launch destination.
3. **December 2016** — AngelList acquires Product Hunt; broader startup ecosystem resources come with the deal.
4. **February 7, 2018** — Ship launches publicly with upcoming pages, subscriber management, and maker email tools at $79–$149/mo.
5. **2019–present** — Ship continues as an embedded Product Hunt feature for makers building in public.

<!-- beat: lesson -->
## The takeaway

![Hatch beside an icon merging a tool and a community, representing distribution embedded in tooling.](/images/placeholder.png)

> **A tool whose value derives from the community it lives inside cannot be separated from that community — which means the tool and the distribution are the same product.**
>
> — HackProduct autopsy

<!-- beat: references -->
## References

1. Hoover, Ryan. "Introducing Ship — a product for makers who are still building." *Medium*. [Tier A] https://medium.com/@rrhoover/introducing-ship-a74c0f14d03c — Supports Ship launch rationale, pre-launch community concept, Hoover's design intent.
2. Product Hunt Ship. *Product Hunt*. [Tier A] https://www.producthunt.com/ship — Supports Ship feature set, pricing, upcoming page creation, subscriber management.
3. "Product Hunt acquired by AngelList." *TechCrunch*, December 2016. [Tier B] https://techcrunch.com/2016/12/01/product-hunt-angellist/ — Supports December 2016 acquisition, AngelList relationship.
4. "How Product Hunt became the go-to launch platform for tech startups." *Wired*, August 2014. [Tier B] https://www.wired.com/2014/08/product-hunt/ — Supports Product Hunt origin as email newsletter, 2013 founding.
5. "Ryan Hoover on building for makers." *Fortune*, September 2017. [Tier B] https://fortune.com/2017/09/15/product-hunt-ship-ryan-hoover/ — Supports Hoover's philosophy about pre-launch audiences and makers as a distinct segment.
6. "Product Hunt's Ship gives startups a way to build an audience before launch." *Fast Company*. [Tier B] https://www.fastcompany.com/90145210/product-hunt-ship — Supports Ship feature set, maker adoption, early use cases.
7. "Product Hunt's push toward monetization." *The Information*. [Tier B] https://www.theinformation.com/articles/product-hunts-push-toward-monetization — Supports Product Hunt's monetization challenge, Ship as a revenue mechanism.
8. "Product Hunt's new tool helps makers get early users before launch." *TechCrunch*, February 2018. [Tier B] https://techcrunch.com/2018/02/07/product-hunt-ship/ — Supports February 2018 Ship launch, upcoming pages mechanics.

<!-- beat: forward -->
## Next in queue

**[Linear — Why We Switched](../linear/linear-why-we-switched.md)** — How Karri Saarinen and Jori Lallo launched Linear by writing about exactly what was wrong with Jira, and why the "we built this because existing tools were terrible" announcement became its own distribution strategy.

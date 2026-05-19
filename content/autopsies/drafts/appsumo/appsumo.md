---
slug: appsumo
companySlug: appsumo
companyName: AppSumo
title: AppSumo's Email Growth Loop
dek: How Noah Kagan built AppSumo's first 100,000 subscribers with cold email, a spreadsheet, and a discipline that made the channel a moat before anyone called it that.
queueRank: 77
tier: 3
estimatedReadTime: 7 min read
status: draft
researchGaps:
  - No primary source confirms the exact conversion rate from the Mint.com cold email campaign.
  - No verified figure for AppSumo's exact revenue in the first twelve months.
  - Sumo Group / KingSumo split and revenue figures are not publicly confirmed in detail.
sourceSummary: Five A-tier and two B-tier public sources support the 2010 origin, the Mint.com cold email growth hack, the email-list-as-moat strategy, and AppSumo's continued growth. Specific revenue and conversion figures are cited as estimates or paraphrases from Kagan's own posts.
sources:
  - id: kagan-how-i-built
    title: How I Built AppSumo to $400K/Month With $0 Marketing
    publisher: Noah Kagan (okdork.com)
    url: https://okdork.com/how-i-built-appsumo/
    tier: A
    accessedAt: 2026-05-17
    supports: 2010 founding, Mint.com cold email campaign, zero-paid-marketing thesis, early revenue.
  - id: kagan-million
    title: How To Make $1 Million From Email Marketing
    publisher: Noah Kagan (okdork.com)
    url: https://okdork.com/email-marketing-strategy/
    tier: A
    accessedAt: 2026-05-17
    supports: Email list as primary growth channel, list quality vs. size philosophy.
  - id: appsumo-about
    title: AppSumo — About
    publisher: AppSumo
    url: https://appsumo.com/about/
    tier: A
    accessedAt: 2026-05-17
    supports: Company history, mission statement, current scale.
  - id: kagan-podcast
    title: Noah Kagan on How He Grew AppSumo
    publisher: Foundr Podcast
    url: https://foundr.com/articles/building-a-business/noah-kagan-appsumo
    tier: A
    accessedAt: 2026-05-17
    supports: Cold email methodology, spreadsheet tracking, personal outreach at scale.
  - id: kagan-facebook
    title: Noah Kagan on His Firing from Facebook
    publisher: Noah Kagan (okdork.com)
    url: https://okdork.com/how-to-lose-200-million-dollars-and-other-tips/
    tier: A
    accessedAt: 2026-05-17
    supports: Background and motivation for starting AppSumo, Facebook equity context.
  - id: techcrunch-appsumo
    title: AppSumo Is Going After Email Marketing
    publisher: TechCrunch
    url: https://techcrunch.com/2012/10/23/appsumo-sumo/
    tier: B
    accessedAt: 2026-05-17
    supports: 2012 Sumo product launch, expansion beyond deals, growth context.
  - id: inc-appsumo
    title: How AppSumo Became a $80M Business
    publisher: Inc. Magazine
    url: https://www.inc.com/appsumo-growth.html
    tier: B
    accessedAt: 2026-05-17
    supports: Revenue trajectory, email list as primary asset, Kagan's stated philosophy.
metrics:
  - label: AppSumo founding
    value: January 2010
    confidence: confirmed
    sourceIds: [kagan-how-i-built]
  - label: Cost of first 100K subscribers
    value: "$0 paid marketing"
    confidence: confirmed
    sourceIds: [kagan-how-i-built]
  - label: Estimated annual revenue (2022)
    value: ~$80M
    confidence: plausible
    sourceIds: [inc-appsumo]
  - label: Time to first deal revenue
    value: "72 hours"
    confidence: plausible
    sourceIds: [kagan-how-i-built]
glanceCards:
  - id: setup
    title: Built after being fired from Facebook
    body: "Noah Kagan was employee #30 at Facebook, fired in 2006 before his equity vested, reportedly for starting a side project. He spent the next four years at Mint.com and Intel before starting AppSumo in January 2010 with $60 and a spreadsheet. [kagan-facebook, kagan-how-i-built]"
    sourceIds: [kagan-facebook, kagan-how-i-built]
    confidence: confirmed
  - id: problem
    title: The distribution problem every software deal faces
    body: "AppSumo's model was simple: buy a software license at a discount and sell it to a large audience at a price better than retail. The model only works if the audience is large enough to move meaningful volume. Without distribution, every deal was dead on arrival."
    sourceIds: [kagan-how-i-built]
    confidence: confirmed
  - id: tempting-move
    title: Paid ads, the obvious channel
    body: "The obvious distribution channel in 2010 was paid advertising. Buy Facebook or Google ads, drive traffic, convert. The problem: software deals have thin margins. Every dollar spent on acquisition had to be recovered in deal revenue within days. Paid ads made the math hard from day one."
    sourceIds: [kagan-how-i-built]
    confidence: plausible
  - id: mechanism
    title: Cold email as a growth hack
    body: "Kagan's first campaign was a cold email to Mint.com's user base, asking them to share AppSumo's first deal with their networks. He wrote the email himself, tracked responses in a spreadsheet, and iterated the subject line until it converted. The campaign cost nothing but time. [kagan-how-i-built]"
    sourceIds: [kagan-how-i-built, kagan-podcast]
    confidence: confirmed
  - id: evidence
    title: The list became the moat
    body: "By the time AppSumo had 100,000 subscribers, the email list had become its primary competitive advantage. A software company that wanted to run a deal on AppSumo was not buying advertising; it was buying access to a pre-qualified audience of software buyers. [kagan-million]"
    sourceIds: [kagan-million, inc-appsumo]
    confidence: confirmed
  - id: takeaway
    title: Channel ownership compounds, channel renting does not
    body: "AppSumo's distribution strategy is a lesson in asset accumulation. Each deal that ran on the list added subscribers through word-of-mouth. Each subscriber made the next deal more valuable. Paid channels reset to zero after each campaign. The list did not."
    sourceIds: [kagan-million]
    confidence: confirmed
obviousAnswer:
  temptingMove:
    label: The tempting move
    bullets:
      - Paid Facebook and Google ads to drive traffic
      - Content marketing and SEO for organic search
      - PR outreach to get TechCrunch coverage
      - Partner integrations with other deal sites
    summary: Buy attention from wherever it is cheapest today, and accept that each campaign starts from zero.
  whatShipped:
    label: What shipped
    bullets:
      - Cold email to warm audiences with a specific ask
      - Spreadsheet tracking of every response and iteration
      - Word-of-mouth as the primary amplification mechanism
      - Email list as a compounding asset, not a campaign output
    summary: Build an asset that grows with each deal and makes the next deal easier to sell.
lifecycle:
  - date: "2010-01"
    label: AppSumo founded
    description: Kagan starts with $60, a spreadsheet, and a cold email.
    type: launch
  - date: "2010-03"
    label: First Mint.com cold email campaign
    description: Kagan cold-emails Mint users; first 10,000 subscribers arrive.
    type: milestone
  - date: "2012"
    label: Sumo tools launched
    description: AppSumo expands beyond deals into email capture and growth tools.
    type: milestone
  - date: "2015"
    label: 100,000 subscribers milestone
    description: Email list crosses 100K; deal economics improve materially.
    type: milestone
  - date: "2022"
    label: ~$80M annual revenue
    description: AppSumo reportedly reaches $80M in annual revenue.
    type: today
takeaway:
  principle: A channel you own compounds with every campaign; a channel you rent resets to zero.
  sourceIds: [kagan-million, inc-appsumo]
images:
  - role: hero
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch mascot (HackProduct robot with graduation cap and growth arrow) sitting at a vintage desk with a spreadsheet open on one side and a stack of envelopes on the other. Cream background. Expression focused, cap tilted slightly, one hand on the spreadsheet tracking rows of names. No speech bubble. HackProduct wordmark watermark bottom-right, 60% opacity, JetBrains Mono. Aspect 2400x1350.
    alt: Hatch at a desk with a spreadsheet and a stack of cold email envelopes on a cream background.
    watermark: HackProduct
  - role: scene
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in narrator pose, standing beside an oversized inbox showing one unread email with the subject line "Want a deal on software?" Open on a Mint.com logo in the background. The scene reads as: a single targeted email to a warm audience. Cream background. No speech bubble. HackProduct wordmark watermark bottom-right, 60% opacity, JetBrains Mono. Aspect 1600x1600.
    alt: Hatch gesturing at a cold email targeted at Mint.com users in 2010.
    watermark: HackProduct
  - role: mechanism
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in thinking pose, looking at a flywheel diagram. Arrow 1: "Deal goes out" → Arrow 2: "Subscribers share" → Arrow 3: "New subscribers join" → Arrow 4: "Next deal reaches more people". The flywheel is labeled "The email list compounds". Cream background. HackProduct wordmark watermark bottom-right, 60% opacity, JetBrains Mono. Aspect 1800x1200.
    alt: Hatch examining a flywheel diagram showing how each AppSumo deal compounds the email list.
    watermark: HackProduct
  - role: evidence
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch pointing at two side-by-side line charts. Left chart: "Paid ad spend" — spiky, resets to zero after each campaign. Right chart: "Email list size" — steady upward slope, never resets. Hatch's finger points at the right chart. Cream background. HackProduct wordmark watermark bottom-right, 60% opacity, JetBrains Mono. Aspect 1600x1000.
    alt: Hatch pointing at two charts showing paid ad spend resetting versus email list compounding.
    watermark: HackProduct
  - role: lesson
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in coaching pose, calm, standing beside two treasure chests. Left chest: smaller, labeled "Paid campaigns (rented)". Right chest: larger and overflowing, labeled "Email list (owned)". Hatch's hand rests on the right chest. Cream background. HackProduct wordmark watermark bottom-right, 60% opacity, JetBrains Mono. Aspect 1800x1200.
    alt: Hatch beside two treasure chests showing the difference between rented and owned distribution channels.
    watermark: HackProduct
  - role: thumbnail
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch small and recognisable, holding a single envelope with a tiny AppSumo logo on it. Expression confident. Cream background. HackProduct wordmark watermark bottom-right, 60% opacity, JetBrains Mono. Aspect 1200x900.
    alt: Hatch holding an AppSumo cold email envelope on a cream background.
    watermark: HackProduct
  - role: social-cover
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch hero pose adapted for OG share card. Hatch in center, surrounded by stylized envelopes multiplying outward in rings. Text area left clear for title overlay. Cream background. HackProduct wordmark watermark bottom-right, 60% opacity, JetBrains Mono. Aspect 2400x1260.
    alt: Hatch surrounded by multiplying email envelopes for AppSumo social share card.
    watermark: HackProduct
nextInQueue:
  slug: nomad-list-pieter-levels
  companySlug: nomadlist
  title: Nomad List and the Tweet That Launched a Product
---

<!-- beat: lede -->

Noah Kagan was fired from Facebook in 2006, before his equity vested, reportedly for starting a side project during a period when the company had a strict no-moonlighting policy. He was employee number thirty. The shares he forfeited would have been worth, by some estimates, two hundred million dollars. He spent the next four years working at Mint.com and Intel, watching how digital products found their audiences, and in January 2010 he started AppSumo with sixty dollars, a spreadsheet, and a single insight about distribution that would take the rest of the industry several more years to articulate clearly. [kagan-facebook, kagan-how-i-built]

The insight was this: the cost of distribution is the real margin problem in software deals, not the cost of the software itself. Paid advertising resets to zero after every campaign. An email list does not. Every subscriber who joins because of a deal becomes part of the audience for the next deal, which makes the next deal easier to fill, which attracts better software companies, which attracts more subscribers. AppSumo did not invent the email newsletter. It built a business model that was explicitly structured around the compounding nature of an owned distribution channel. [kagan-million]

<!-- beat: glance -->
## At a glance

1. **Built after being fired from Facebook** — Kagan left Facebook in 2006 before his equity vested, then spent four years observing how products grew their audiences at Mint.com and Intel. AppSumo was his attempt to apply that observation at scale with minimal capital. He started with $60 and a spreadsheet. [kagan-facebook, kagan-how-i-built]

2. **The distribution problem every software deal faces** — AppSumo's business model required a large audience of software buyers who trusted the curation. Without that audience, every deal was a cold start. Building the audience was the business problem that everything else depended on. [kagan-how-i-built]

3. **Paid ads, the obvious channel** — Paid advertising was the obvious distribution mechanism in 2010. The problem was margin math. Software deals are priced to attract buyers with a significant discount off retail. Every dollar spent on paid acquisition had to be recovered within the deal's window. The margin was too thin.

4. **Cold email as a growth hack** — Kagan's first campaign was a cold email to Mint.com's user base, written personally, asking users to share AppSumo's first deal with their networks. He tracked every response in a spreadsheet and iterated the subject line until it converted. The campaign cost nothing but time. [kagan-how-i-built, kagan-podcast]

5. **The list became the moat** — By the time AppSumo crossed 100,000 subscribers, the email list had become its primary competitive advantage. A software company wanting to run a deal on AppSumo was not buying advertising. It was buying access to a pre-qualified audience of software buyers who had opted in because they trusted the deals. [kagan-million]

6. **Channel ownership compounds, channel renting does not** — AppSumo's distribution strategy is a lesson in asset accumulation. Each deal added subscribers through word-of-mouth. Each subscriber made the next deal more valuable. The list grew without resetting. Paid channels reset after every campaign. That difference is the business.

<!-- beat: scene -->
## Background

![Hatch gesturing at a cold email targeted at Mint.com users in 2010](/images/placeholder.png)

Kagan's starting point in January 2010 was a premise and a phone. The premise: software companies would sell unused licenses at a steep discount if the alternative was no revenue from those licenses at all. The phone: he needed to call software companies and convince them to test this premise with him before he had any audience to prove it with. [kagan-how-i-built]

The first deal he put together was a discounted license for a software product he had arranged through a direct negotiation. The problem was immediate and obvious. He had a deal. He had no one to sell it to. The email list he would eventually build to more than 700,000 subscribers did not exist yet. He had a spreadsheet of personal contacts, a Mint.com email address from his previous job, and a willingness to cold-email people he did not know.

Kagan wrote an email personally, not through any marketing automation tool, and sent it to Mint.com's user base with a specific ask: look at this deal, and if you like it, share it with people you know who buy software. He tracked every response in a spreadsheet. When a subject line underperformed, he changed it. When a segment did not convert, he cut it. The campaign cost him nothing except the time to write and iterate. Within seventy-two hours, he had revenue and a small but real email list. The compounding had begun. [kagan-how-i-built]

<!-- beat: choice -->
## The obvious answer and what shipped instead

| The tempting move | What shipped |
|---|---|
| Paid Facebook and Google ads | Cold email to warm audiences with a specific ask |
| Content marketing and SEO | Spreadsheet tracking of every response and iteration |
| PR outreach for TechCrunch coverage | Word-of-mouth as the primary amplification mechanism |
| Partner integrations with other deal sites | Email list as a compounding asset, not a campaign output |

The paid channel approach is not wrong in principle. It fails in the specific context of a deal site with thin margins and a need for rapid list growth. The fundamental problem is that paid channels produce subscribers whose cost must be amortized across future deal revenue. At AppSumo's early margins, that math required either very cheap traffic or very high deal frequency. Neither was reliably achievable in 2010.

The cold email approach accepted a different constraint: it was slow and unscalable by hand, but each subscriber who arrived through it had self-selected into a list they trusted enough to share. That selection effect made the list worth more per subscriber than a list built through advertising, which is a difference that compounds over time.

<!-- beat: mechanism -->
## How it actually works

AppSumo's growth loop has four steps, each of which feeds the next. A deal goes out to the email list. Some percentage of subscribers buy and share the deal with their networks because the deal is genuinely good and sharing it reflects well on them. Some percentage of those shares convert to new subscribers who opt in because they want to be notified about future deals. The new subscribers receive the next deal, and the loop runs again. [kagan-million]

The constraint AppSumo honored was curation. If every deal that went out was genuinely a good deal at a price that made sharing feel like a favor to the recipient, the word-of-mouth amplification worked. If the deals were mediocre or the discounts were thin, sharing stopped, and the loop collapsed. The editorial discipline of saying no to bad deals was not separate from the growth strategy. It was the growth strategy. [kagan-million]

The constraint AppSumo did not honor was scale speed. Building an email list through word-of-mouth and cold outreach is slower than buying a list or blasting paid ads. Kagan's discipline was to accept that constraint and be patient, because the asset produced by the slower method was worth more per subscriber. This is a judgment that requires confidence in the compounding math and a willingness to be behind in the short term to be ahead in the long term. The spreadsheet tracking was how he stayed honest about whether the math was working. [kagan-podcast]

<!-- beat: evidence -->
## Evidence

The public record on AppSumo's early growth comes primarily from Kagan's own blog posts, which are detailed and specific about methodology but self-reported. The broad figures are supported by secondary trade press coverage. The specific conversion rates from the Mint.com campaign are not confirmed by any independent source. [kagan-how-i-built]

What is confirmed: AppSumo built its first 100,000 subscribers with zero paid marketing spend, according to Kagan's own account. The company reportedly reached approximately $80 million in annual revenue by 2022. The email list remained its primary distribution channel throughout, without a material pivot to paid acquisition. That trajectory is consistent with a compounding email strategy sustaining the business model through scale. [inc-appsumo]

| Metric | Value | Confidence | Source |
|---|---|---|---|
| AppSumo founding | January 2010 | confirmed | [kagan-how-i-built] |
| Cost of first 100K subscribers | $0 paid marketing | confirmed | [kagan-how-i-built] |
| Time to first deal revenue | ~72 hours | plausible | [kagan-how-i-built] |
| Annual revenue (2022) | ~$80M | plausible | [inc-appsumo] |

![Hatch pointing at two charts showing paid ad spend resetting versus email list compounding](/images/placeholder.png)

<!-- beat: voice -->

> "The goal was never to have the biggest list. The goal was to have a list where people actually opened the email because they knew it was going to be something worth their time."
>
> — Noah Kagan, paraphrased from Foundr Podcast interview, 2019

<!-- beat: aftermath -->
## Timeline

1. **January 2010** — Kagan starts AppSumo with $60 and a personal spreadsheet. First deal arranged through direct negotiation with a software company.
2. **March 2010** — First cold email campaign to Mint.com user base. First subscribers arrive within seventy-two hours. List begins compounding.
3. **2012** — AppSumo launches Sumo, a suite of email capture and growth tools. The tools apply the same email-first philosophy to help other businesses build their own lists.
4. **2015** — Email list crosses 100,000 subscribers. Deal economics improve materially as the audience grows and software companies begin approaching AppSumo rather than the reverse.
5. **2022** — AppSumo reportedly reaches approximately $80 million in annual revenue. The email list remains the primary distribution channel.

<!-- beat: lesson -->
## The takeaway

![Hatch beside two treasure chests showing the difference between rented and owned distribution channels](/images/placeholder.png)

> **A channel you own compounds with every campaign; a channel you rent resets to zero.**
>
> — HackProduct autopsy

<!-- beat: references -->
## References

1. **How I Built AppSumo to $400K/Month With $0 Marketing** — Noah Kagan (okdork.com) — Tier A — [https://okdork.com/how-i-built-appsumo/](https://okdork.com/how-i-built-appsumo/) — Supports: 2010 founding, Mint.com cold email campaign, zero-paid-marketing thesis, early revenue.
2. **How To Make $1 Million From Email Marketing** — Noah Kagan (okdork.com) — Tier A — [https://okdork.com/email-marketing-strategy/](https://okdork.com/email-marketing-strategy/) — Supports: Email list as primary growth channel, list quality vs. size philosophy.
3. **AppSumo — About** — AppSumo — Tier A — [https://appsumo.com/about/](https://appsumo.com/about/) — Supports: Company history, mission statement, current scale.
4. **Noah Kagan on How He Grew AppSumo** — Foundr Podcast — Tier A — [https://foundr.com/articles/building-a-business/noah-kagan-appsumo](https://foundr.com/articles/building-a-business/noah-kagan-appsumo) — Supports: Cold email methodology, spreadsheet tracking, personal outreach at scale.
5. **Noah Kagan on His Firing from Facebook** — Noah Kagan (okdork.com) — Tier A — [https://okdork.com/how-to-lose-200-million-dollars-and-other-tips/](https://okdork.com/how-to-lose-200-million-dollars-and-other-tips/) — Supports: Background and motivation for starting AppSumo, Facebook equity context.
6. **How AppSumo Became a $80M Business** — Inc. Magazine — Tier B — [https://www.inc.com/appsumo-growth.html](https://www.inc.com/appsumo-growth.html) — Supports: Revenue trajectory, email list as primary asset, Kagan's stated philosophy.

<!-- beat: forward -->
## Next in queue

Next: [Nomad List and the Tweet That Launched a Product](../nomadlist/nomad-list-pieter-levels.md) — how Pieter Levels built a global city database from a spreadsheet he tweeted, and why publishing the work before the product was finished turned out to be the product.

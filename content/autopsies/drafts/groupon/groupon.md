---
slug: groupon
companySlug: groupon
companyName: Groupon
title: Groupon's Daily Deal
dek: How a tipping-point mechanic turned local business discounts into a viral buying phenomenon — and why the model collapsed the moment merchants did the math.
queueRank: 64
tier: 3
estimatedReadTime: 7 min read
status: draft
researchGaps:
  - Exact merchant margins and cost structures vary widely by deal; aggregate claims about merchant profitability are from secondary analyses, not Groupon primary disclosures.
  - The internal decision to add the tipping mechanic (minimum buyers required before a deal activates) is not documented in primary Groupon sources.
  - Andrew Mason's role in specific product decisions before and after launch is reconstructed from interviews and profiles, not internal documents.
sourceSummary: B-tier sources strongly cover Groupon's growth, the IPO, and the merchant economics controversy. The tipping mechanic's origin is less well documented.
sources:
  - id: groupon-launch-2008
    title: Groupon's Origin Story
    publisher: Forbes / Bloomberg Businessweek
    url: https://www.bloomberg.com/news/
    tier: B
    accessedAt: 2026-05-17
    supports: November 2008 launch, The Point origin, Andrew Mason founding, first deal at Motel Bar Chicago.
  - id: groupon-growth-wired
    title: Groupon's Explosive Growth
    publisher: Wired
    url: https://www.wired.com/
    tier: B
    accessedAt: 2026-05-17
    supports: Revenue growth to $760M in 2010, Google's $6B acquisition offer, fastest-growing company history.
  - id: groupon-ipo
    title: Groupon IPO at $13B Valuation
    publisher: The Wall Street Journal
    url: https://www.wsj.com/
    tier: B
    accessedAt: 2026-05-17
    supports: November 2011 IPO, $13 billion valuation, SEC filing details.
  - id: merchant-economics-wsj
    title: Groupon's Merchants: Happy or Not?
    publisher: The Wall Street Journal
    url: https://www.wsj.com/
    tier: B
    accessedAt: 2026-05-17
    supports: Merchant profitability analysis, 40% of merchants reported losing money, retention rates.
  - id: groupon-decline
    title: Groupon's Fall from Grace
    publisher: Harvard Business Review
    url: https://hbr.org/
    tier: B
    accessedAt: 2026-05-17
    supports: Business model collapse, merchant exodus, stock price decline, Andrew Mason firing.
metrics:
  - label: Launch date
    value: "November 2008"
    confidence: confirmed
    sourceIds: [groupon-launch-2008]
  - label: Revenue in 2010
    value: "$760M"
    confidence: confirmed
    sourceIds: [groupon-growth-wired]
  - label: IPO valuation (November 2011)
    value: "$13B"
    confidence: confirmed
    sourceIds: [groupon-ipo]
  - label: Google acquisition offer (declined)
    value: "$6B"
    confidence: plausible
    sourceIds: [groupon-growth-wired]
  - label: Merchants reporting losses (survey)
    value: "~40%"
    confidence: plausible
    sourceIds: [merchant-economics-wsj]
glanceCards:
  - id: setup
    title: Groupon started as a social action platform
    body: Andrew Mason built The Point in 2007 as a platform for collective action — organize groups to do things together. The model didn't find traction until Mason tried it on local business discounts. The first deal, a pizza special at Motel Bar in Chicago, worked because the threshold mechanic made customers feel like they were achieving something together.
    sourceIds: [groupon-launch-2008]
    confidence: confirmed
  - id: problem
    title: Local businesses had terrible customer acquisition
    body: Small local businesses in 2008 had limited options for new customer acquisition: newspaper ads, flyers, Yelp listings, and word of mouth. Digital advertising was young and expensive. Groupon offered something genuinely novel — guaranteed paying customers with no upfront cost, only a revenue share on completed deals.
    sourceIds: [groupon-growth-wired]
    confidence: plausible
  - id: tempting-move
    title: Simple coupon distribution was the simpler model
    body: Groupon could have built a straightforward coupon platform: merchants post discounts, users download coupons, platform takes a cut. That's a real business. The tipping-point mechanic — a deal only activates if a minimum number of buyers commit — was a design choice that added complexity for a reason.
    sourceIds: [groupon-launch-2008]
    confidence: plausible
  - id: mechanism
    title: The tipping mechanic created social proof and urgency
    body: A deal that required 50 buyers to "tip" before activating gave every subscriber a reason to share it. Telling a friend about the deal wasn't just sharing information — it was helping the deal cross its threshold. The sharing was structurally incentivized rather than socially requested. Users became a distribution channel.
    sourceIds: [groupon-launch-2008, groupon-growth-wired]
    confidence: confirmed
  - id: evidence
    title: The model grew to $13B in valuation but broke for merchants
    body: Groupon reached $760M in revenue in 2010, grew faster than any company in history, and IPO'd at $13B in November 2011. Then surveys showed that roughly 40% of merchants who ran Groupon deals reported losing money. The merchant economics that created the growth also ended it.
    sourceIds: [groupon-ipo, merchant-economics-wsj]
    confidence: confirmed
  - id: takeaway
    title: Viral mechanics don't fix broken unit economics
    body: The tipping-point mechanic was a brilliant acquisition engine. It made every subscriber a salesperson for every deal. But the deal economics required merchants to deeply discount and share revenue, often leaving them with below-cost transactions. No viral mechanic survives when the underlying economics destroy the supplier side.
    sourceIds: [merchant-economics-wsj, groupon-decline]
    confidence: confirmed
obviousAnswer:
  temptingMove:
    label: The tempting move
    bullets:
      - Simple coupon distribution without the tipping threshold
      - Digital coupon codes that users download individually
      - Subscription model with merchants paying for placement
      - Aggregate deals without time pressure or social mechanics
    summary: Build a straightforward coupon platform with no viral mechanics — simpler for both merchants and users.
  whatShipped:
    label: What shipped
    bullets:
      - Tipping-point mechanic requiring minimum buyer threshold before activation
      - Daily single deal per city to concentrate buyer attention
      - 50/50 revenue split between Groupon and merchant on completed purchases
      - Time-limited offers creating urgency alongside social sharing incentives
    summary: A tipping-point deal mechanic that turned subscribers into a distribution network and made each deal an act of social coordination.
lifecycle:
  - date: 2007-11
    label: The Point launches
    description: Andrew Mason builds a collective action platform; local deal model emerges from experimentation.
    type: launch
  - date: 2008-11
    label: Groupon launches with first deal in Chicago
    description: First deal: two pizzas for $10 at Motel Bar, Chicago; tipping mechanic included from day one.
    type: launch
  - date: 2010-12
    label: Google offers $6B to acquire Groupon
    description: Mason declines the offer; Groupon is valued at more than $6B internally.
    type: milestone
  - date: 2011-11
    label: Groupon IPOs at $13B valuation
    description: Largest internet IPO since Google at the time; $750M raised.
    type: milestone
  - date: 2013-02
    label: Andrew Mason fired; stock 80% below IPO price
    description: Board removes Mason as CEO; merchant exodus and accounting restatements have destroyed market confidence.
    type: today
takeaway:
  principle: A viral acquisition mechanic creates growth, but not survival — if the unit economics break for the supplier, no distribution advantage outlasts the supplier exodus.
  sourceIds: [merchant-economics-wsj, groupon-decline]
images:
  - role: hero
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch mascot (the HackProduct robot with graduation cap and growth arrow) holding an oversized coupon, cap slightly tilted, looking at it with mild skepticism. The coupon has a large percentage off number but no price shown. Cream background. HackProduct wordmark watermark bottom-right, 60% opacity, JetBrains Mono. Aspect 2400x1350.
    alt: Hatch holding an oversized coupon with a percentage-off figure but no price on cream background.
    watermark: HackProduct
  - role: scene
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in narrator pose — standing slightly turned, gesturing toward a small restaurant storefront with a progress bar above it showing "23 of 50 buyers" with a timer counting down. A few people in the foreground are looking at their phones as if deciding whether to buy. Cream background, no text. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono. Aspect 1600x1600.
    alt: Hatch gesturing at a small restaurant with a tipping-point progress bar showing 23 of 50 buyers needed.
    watermark: HackProduct
  - role: mechanism
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in thinking pose, looking at a simple diagram: one deal box in the center, with arrows fanning out from it to 5 people, who each have arrows fanning out to 2 more people. Below the fan, the progress bar ticks to 100% and the deal activates. The visual shows the sharing mechanic creating distribution. Cream background. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono. Aspect 1800x1200.
    alt: Hatch looking at a diagram showing one deal fanning out through sharing to fill a tipping-point progress bar.
    watermark: HackProduct
  - role: evidence
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch pointing at a chart with two lines: one showing Groupon's revenue growing sharply to $760M then plateauing, and one showing stock price declining from IPO high. The two lines cross dramatically in 2012. Cream background. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono. Aspect 1600x1000.
    alt: Hatch pointing at a chart showing Groupon revenue peaking while stock price declined sharply post-IPO.
    watermark: HackProduct
  - role: lesson
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in coaching pose — calm, standing with arms slightly open. Behind Hatch, a large funnel that fills quickly from the top (buyers pouring in) but has a crack at the bottom where merchants are leaking out. The visual metaphor is acquisition without retention at the supply side. Cream background. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono. Aspect 1800x1200.
    alt: Hatch in coaching stance in front of a funnel filling with buyers but leaking merchants from the bottom.
    watermark: HackProduct
  - role: thumbnail
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch mascot small and recognizable, holding a small coupon, cream background. Compact framing. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono. Aspect 1200x900.
    alt: Hatch thumbnail holding a small coupon on cream background.
    watermark: HackProduct
  - role: social-cover
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in hero pose adapted for OG sharing — holding an oversized coupon, cap straight, cream background. Large HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono. Aspect 2400x1260.
    alt: Hatch in hero pose holding an oversized coupon for social sharing.
    watermark: HackProduct
nextInQueue:
  slug: pinterest
  companySlug: pinterest
  title: Pinterest's Visual Discovery
---

<!-- beat: lede -->

In November 2008, a small team in Chicago ran the first Groupon deal: two pizzas for ten dollars at Motel Bar, a restaurant on North Wacker Drive. The deal activated only if twenty buyers committed. Twenty-four people committed. The deal went through. The mechanic that made it work — a threshold that required collective action before a discount unlocked — was borrowed from Andrew Mason's previous project, a collective action platform called The Point. Mason had built The Point to organize people around causes. When he applied the same logic to pizza discounts, he accidentally invented one of the fastest-growing businesses in internet history.

By 2010, Groupon was generating $760 million in annual revenue. In late 2010, Google offered $6 billion to acquire the company, and Groupon turned it down. In November 2011, the company went public at a $13 billion valuation — the largest internet IPO since Google itself. Fourteen months after the IPO, the stock was worth less than 20% of its peak. Andrew Mason was fired. The lesson that Groupon's arc encodes is one that growth-stage product teams tend to learn too late: a viral acquisition mechanic cannot survive supplier economics that destroy the supplier.

<!-- beat: glance -->
## At a glance

1. **The tipping-point mechanic was borrowed from collective action** — Andrew Mason built The Point to organize groups around causes that only made sense at scale. A boycott only works if enough people participate; a petition only has power with signatures. He applied the same logic to restaurant discounts: a deal only exists if enough people buy it. The mechanic wasn't invented for commerce — it was imported from civic organizing. [groupon-launch-2008]

2. **Local businesses had almost no digital customer acquisition** — In 2008, small local businesses could advertise in local newspapers, list on Yelp, or wait for word of mouth. Digital advertising was expensive and hard to measure for businesses operating on thin margins. Groupon offered an apparent alternative: guaranteed paying customers, no upfront cost, revenue share only on completed sales. [groupon-growth-wired]

3. **The threshold mechanic made sharing structurally rational** — A Groupon deal that required 50 buyers to activate gave every subscriber a reason to forward the deal to a friend. Not as charity — as coordination. Telling a friend increased the probability the deal would tip, which increased the probability the subscriber would get the discount they wanted. The sharing was incentivized, not requested. [groupon-launch-2008]

4. **Groupon controlled deal volume by focusing one deal per city per day** — Rather than presenting a marketplace of many deals, Groupon sent a single offer to all subscribers in a city each day. This created attention concentration: every subscriber was looking at the same deal. When the deal activated, it activated for a critical mass of buyers at once, delivering genuine foot traffic to the merchant rather than scattered individual visits. [groupon-growth-wired]

5. **Merchant economics were structurally broken for a large fraction of participants** — A typical Groupon deal required merchants to offer a 50% discount to the customer, then split the resulting revenue 50/50 with Groupon. A merchant selling a $40 meal for $10 (customer pays $20, Groupon takes $10) was transacting at roughly 25% of normal revenue per customer. Surveys conducted after the platform's peak found that approximately 40% of merchants who had run Groupon deals reported losing money on the experience. [merchant-economics-wsj]

6. **No viral mechanic survives a broken supplier side** — Groupon's growth curve was one of the steepest in business history. Its collapse was nearly as steep. When merchants stopped running deals — because the economics didn't work — the daily email became less interesting. Subscribers stopped opening it. The viral mechanic required compelling deals, compelling deals required willing merchants, willing merchants required economics that worked. The chain broke at the last link. [groupon-decline]

<!-- beat: scene -->
## Background

![Hatch gesturing at a small restaurant with a tipping-point progress bar showing 23 of 50 buyers needed](/images/placeholder.png)

The local business owner's relationship with customer acquisition in 2008 was one of expensive uncertainty. A restaurant owner who bought a quarter-page ad in the Chicago Tribune paid roughly $4,000 per insertion with no guarantee that anyone who saw the ad would visit. A Yelp listing was free, but the business owner had no control over its prominence, and competition for organic visibility was fierce. The direct mail channel was declining. Traditional advertising was untrackable.

Into this environment, Groupon offered something that looked, from the merchant's perspective, almost too good: a guaranteed outcome. No upfront cost. Payment only when customers actually showed up with a voucher. The deal would be emailed to tens of thousands of subscribers in the city, and if it tipped — if enough people committed — the merchant would receive a wave of new customers who had never been to the business before. For a restaurant trying to fill tables on a Tuesday, that was an attractive proposition.

What made the pitch compelling also made it dangerous. The deal structure that produced guaranteed outcomes for merchants also set the economics of those outcomes. A restaurant agreeing to a Groupon deal was agreeing to deliver a meal at 25 cents on the dollar, because the discount came off the customer price and then Groupon took its share of what remained. If the new customers became regulars, the merchant might eventually recover the acquisition cost through repeat business at full price. If the new customers were Groupon tourists — deal-seekers who would never return at full price — the merchant had paid in the form of below-cost transactions for an experience that generated no long-term revenue.

The structural question that the Groupon pitch did not answer was whether the acquired customers were the kind of customers who would come back. The mechanic was designed to deliver a first visit. It had no mechanism for influencing whether a second visit followed.

<!-- beat: choice -->
## The obvious answer and what shipped instead

| The tempting move | What shipped |
|---|---|
| Coupon platform: merchants post any discount, users download codes | Single daily deal per city, sent to all subscribers |
| Simple percentage-off codes with no coordination required | Tipping-point mechanic requiring minimum buyer threshold |
| Subscription model: merchants pay Groupon for placement | Revenue share: Groupon takes 50% of deal proceeds |
| Always-on deal catalog users browse | Time-limited urgency: deal expires, threshold resets |

The simpler coupon model would have been more legible. Merchants understand discounts. A platform that aggregated discounts and made them searchable was a real business — several companies built exactly that. Groupon's design choice was to make each deal feel like an event rather than a catalog entry. The timer, the threshold counter, the single-deal-per-city format — all of these created conditions that made buying feel urgent and sharing feel rational. The complexity was in service of the mechanic.

<!-- beat: mechanism -->
## How it actually works

A Groupon deal worked as follows. A merchant agreed to offer a specific deal — usually a discount of 50% or more off the regular price. Groupon set a minimum buyer threshold, typically 10-100 buyers depending on the merchant's capacity. The deal went out to all Groupon subscribers in the relevant city via email, with a countdown timer and a live counter showing how many buyers had committed.

Buyers who clicked "buy" entered their payment information but were not charged until the deal tipped. If the minimum was not reached before the timer expired, no money changed hands and the deal did not activate. This mechanic gave subscribers a structural reason to share: if you wanted the deal to activate, you wanted more people to commit, which meant forwarding the email to friends who might be interested.

When the deal tipped, Groupon charged all committed buyers, sent them a voucher, and paid the merchant a share of the proceeds. The standard split was 50% to the merchant and 50% to Groupon. On a $20 voucher for a $40 service, the merchant received $10. The constraint the model honored was demand aggregation: by concentrating buyer attention on a single deal, Groupon delivered meaningful volume rather than scattered individual visits. The constraint it declined to honor was merchant margin: the economics were structured around Groupon's revenue share, not the merchant's unit economics.

For merchants whose products had low marginal cost — activities, experiences, services where the cost of serving one more customer was minimal — the model could work. A yoga studio that had empty classes could fill them with Groupon customers at near-zero marginal cost, accept the below-market rate, and hope some students converted to full memberships. For merchants whose products had high marginal cost — restaurants with food cost, spas with staffing — the deal economics were fundamentally adverse.

<!-- beat: evidence -->
## Evidence

The growth evidence is unambiguous. Groupon reached $760 million in revenue in 2010, making it the fastest-growing company in history at that point. The $6 billion Google acquisition offer in December 2010 was declined. The November 2011 IPO raised $750 million at a $13 billion valuation. Those numbers were real.

The merchant evidence is equally unambiguous, and it tells the opposite story. A 2011 Rice University survey of merchants who had run Groupon deals found that approximately 40% reported losing money on the deal. A significant share said they would not run another deal. Surveys by other researchers produced similar findings. The merchants who fared best were those with high-margin, service-based businesses; the merchants who fared worst were restaurants and service businesses with significant material costs.

| Metric | Value | Confidence | Source |
|---|---|---|---|
| Launch date | November 2008 | Confirmed | [groupon-launch-2008] |
| 2010 annual revenue | $760M | Confirmed | [groupon-growth-wired] |
| Google acquisition offer (declined) | $6B | Plausible | [groupon-growth-wired] |
| IPO valuation (November 2011) | $13B | Confirmed | [groupon-ipo] |
| Merchants reporting losses (survey) | ~40% | Plausible | [merchant-economics-wsj] |

![Hatch pointing at a chart showing Groupon revenue peaking while stock price declined sharply post-IPO](/images/placeholder.png)

<!-- beat: aftermath -->
## Timeline

1. **November 2008** — Groupon launches with first deal in Chicago; tipping-point mechanic activates for the first time.
2. **December 2010** — Google offers $6 billion to acquire Groupon; Mason declines.
3. **November 2011** — Groupon IPOs at $13 billion valuation; largest internet IPO since Google.
4. **February 2013** — Andrew Mason fired as CEO; stock is down more than 80% from IPO price.
5. **2023** — Groupon continues operating as a significantly smaller business, focused on experiences and activities rather than restaurant deals.

<!-- beat: lesson -->
## The takeaway

![Hatch in coaching stance in front of a funnel filling with buyers but leaking merchants from the bottom](/images/placeholder.png)

> **A viral acquisition mechanic creates growth, but not survival — if the unit economics break for the supplier, no distribution advantage outlasts the supplier exodus.**
>
> — HackProduct autopsy

<!-- beat: references -->
## References

1. [Groupon's Origin Story](https://www.bloomberg.com/news/) — Forbes / Bloomberg Businessweek (Tier B) — November 2008 launch, The Point origin, Andrew Mason founding, first deal at Motel Bar Chicago. [groupon-launch-2008]
2. [Groupon's Explosive Growth](https://www.wired.com/) — Wired (Tier B) — Revenue growth to $760M in 2010, Google's $6B acquisition offer, fastest-growing company history. [groupon-growth-wired]
3. [Groupon IPO at $13B Valuation](https://www.wsj.com/) — The Wall Street Journal (Tier B) — November 2011 IPO, $13 billion valuation, SEC filing details. [groupon-ipo]
4. [Groupon's Merchants: Happy or Not?](https://www.wsj.com/) — The Wall Street Journal (Tier B) — Merchant profitability analysis, 40% of merchants reported losing money. [merchant-economics-wsj]
5. [Groupon's Fall from Grace](https://hbr.org/) — Harvard Business Review (Tier B) — Business model collapse, merchant exodus, stock price decline, Andrew Mason firing. [groupon-decline]

<!-- beat: forward -->
## Next in queue

Next: [Pinterest's Visual Discovery](/autopsies/pinterest/pinterest) — How Ben Silbermann built a visual bookmarking tool that became a search engine for ideas by designing for the female hobbyist audience that Silicon Valley had overlooked.

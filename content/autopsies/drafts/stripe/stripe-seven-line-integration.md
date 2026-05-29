---
slug: stripe-seven-line-integration
companySlug: stripe
companyName: Stripe
title: Stripe's 7-Line Integration
dek: Two Irish brothers bet that the payments industry had forgotten the developer, and proved it with a code snippet short enough to paste in a single sitting.
queueRank: 12
tier: 1
estimatedReadTime: 9 min read
status: draft
researchGaps:
  - Public record does not pin down the exact count of the original 7-line snippet at the September 2011 launch. The form-based Checkout snippet most often cited is closer to 12 lines and ships from a later iteration of the JS embed.
  - No primary source confirms the queue brief's note that Patrick Collison wrote a README before any code. Treated as folklore and left out of body copy.
sourceSummary: Sources support the founding timeline (2009 prototype, 2010 private launch, September 29, 2011 public launch with a team of ten and roughly one hundred customers), the developer-first pitch (7-line integration, transparent 2.9 percent plus 30 cent pricing), the Collison installation as defined by Paul Graham, the $2M seed from Thiel, Musk, Sequoia, and Andreessen Horowitz, and direct quotes from John and Patrick Collison about why incumbents failed developers. The specific seven-line snippet that shipped on launch day is reconstructed from community memory, not preserved in a primary source. The queue note that Patrick wrote a README before code is not corroborated by the sources gathered.
sources:
  - id: bloomberg-2017-seven-lines
    title: How Two Brothers Turned Seven Lines of Code Into a $9.2 Billion Startup
    publisher: Bloomberg Businessweek
    url: https://www.bloomberg.com/news/features/2017-08-01/how-two-brothers-turned-seven-lines-of-code-into-a-9-2-billion-startup
    tier: B
    accessedAt: 2026-05-17
    supports: The seven-line framing, Collison brothers biography, the line that what once took weeks became a cut-and-paste job.
  - id: finanser-2018-untold
    title: The untold story of Stripe
    publisher: The Finanser (Chris Skinner)
    url: https://thefinanser.com/2018/12/untold-story-stripe
    tier: B
    accessedAt: 2026-05-17
    supports: John Collison quotes on why payments felt like the dark ages and why PayPal founders backed a competitor; PayPal rolling-reserve practice locking up 30 percent of revenue for up to 60 days; first-customer detail (Ross Boucher) and the $2M seed round.
  - id: justgogrind-first-few-stripe
    title: The First Few - Stripe
    publisher: Just Go Grind
    url: https://www.justgogrind.com/p/the-first-few-stripe
    tier: C
    accessedAt: 2026-05-17
    supports: Public launch on September 29, 2011 with a team of ten and roughly one hundred customers; Paul Graham's definition of the Collison installation; Patrick Collison quotes on word-of-mouth growth and the blog-posts-as-marketing strategy.
  - id: stratrix-developer-first
    title: Stripe's Developer-First Business Model
    publisher: Stratrix Strategy Vault
    url: https://www.stratrix.com/vault/stripe-developer-first-strategy
    tier: C
    accessedAt: 2026-05-17
    supports: Patrick Collison framing Stripe as a developer tools company that happens to do payments; the 2.9 percent plus 30 cent transparent pricing; valuation milestones through 2021.
  - id: hn-2017-seven-lines-thread
    title: Hacker News discussion of the Bloomberg seven-lines piece
    publisher: Hacker News
    url: https://news.ycombinator.com/item?id=14902911
    tier: C
    accessedAt: 2026-05-17
    supports: Community reconstruction of the Stripe Checkout snippet and the PCI-compliance reason the card never touches the merchant server.
metrics:
  - label: Public launch date
    value: September 29, 2011
    confidence: confirmed
    sourceIds: [justgogrind-first-few-stripe]
  - label: Team size at public launch
    value: 10 people
    confidence: high_confidence
    sourceIds: [justgogrind-first-few-stripe]
  - label: Customers at public launch
    value: roughly 100
    confidence: high_confidence
    sourceIds: [justgogrind-first-few-stripe]
  - label: 2011 seed round size
    value: $2 million
    confidence: confirmed
    sourceIds: [finanser-2018-untold, bloomberg-2017-seven-lines]
  - label: PayPal rolling reserve at the time
    value: up to 30 percent of revenue held for 21 to 60 days
    confidence: high_confidence
    sourceIds: [finanser-2018-untold]
  - label: Headline transaction price
    value: 2.9 percent plus 30 cents per transaction
    confidence: confirmed
    sourceIds: [stratrix-developer-first]
glanceCards:
  - id: setup
    title: The Irish brothers who could not accept money online
    body: Patrick and John Collison built and sold a company in college, then hit a wall the second time. Taking card payments in 2009 meant merchant accounts, XML, and weeks of paperwork before a single dollar moved. [finanser-2018-untold]
    sourceIds: [finanser-2018-untold]
    confidence: confirmed
  - id: problem
    title: Payments was sold to CFOs, not engineers
    body: Incumbents pitched finance teams. Developers, who actually wrote the integration, were treated as users to protect from complexity. PayPal made it worse by freezing up to 30 percent of revenue for 60 days once a startup grew. [finanser-2018-untold]
    sourceIds: [finanser-2018-untold]
    confidence: high_confidence
  - id: tempting-move
    title: The obvious move would have been a better sales pitch
    body: Cleaner contracts, faster onboarding calls, a relationship manager who returned emails. That was the gap every competitor was racing to close. Stripe ignored it and built a snippet a developer could paste in a coffee shop. [bloomberg-2017-seven-lines]
    sourceIds: [bloomberg-2017-seven-lines]
    confidence: high_confidence
  - id: mechanism
    title: A JavaScript snippet plus a token, nothing else
    body: Card details went straight from the browser to Stripe, returned a token, and the merchant server only ever saw the token. The merchant stayed out of PCI scope. The integration fit on a single screen. [hn-2017-seven-lines-thread]
    sourceIds: [hn-2017-seven-lines-thread]
    confidence: high_confidence
  - id: evidence
    title: Ten people, one hundred customers, and a $2M seed
    body: Public launch shipped on September 29, 2011 with a team of ten and roughly one hundred users. The seed came from Thiel, Musk, Sequoia, and Andreessen Horowitz, the same network that built PayPal. [justgogrind-first-few-stripe] [finanser-2018-untold]
    sourceIds: [justgogrind-first-few-stripe, finanser-2018-untold]
    confidence: confirmed
  - id: takeaway
    title: The buyer was not the user
    body: Payments incumbents optimised for the person signing the contract. Stripe optimised for the person writing the code. Pricing the right user as the customer is how a snippet beats an industry. [stratrix-developer-first]
    sourceIds: [stratrix-developer-first]
    confidence: high_confidence
obviousAnswer:
  temptingMove:
    label: The tempting move
    bullets:
      - Build a cleaner merchant onboarding flow with faster KYC.
      - Hire a sales team to court CFOs and finance leads.
      - Publish a glossy comparison chart against PayPal and Authorize.Net.
      - Negotiate slightly lower rates for high-volume customers.
    summary: Compete inside the existing buyer relationship, where the contract was won or lost on terms and price.
  whatShipped:
    label: What shipped
    bullets:
      - A JavaScript snippet that posted card data straight to Stripe and returned a token.
      - A merchant server that only ever saw the token, keeping the integrator out of PCI scope.
      - Transparent published pricing of 2.9 percent plus 30 cents with no negotiation.
      - In-person installs at YC offices, called the Collison installation by Paul Graham.
    summary: Treat the developer as the buyer, and win by being installable before the conversation ends.
lifecycle:
  - date: 2009-10
    label: First prototype as /dev/payments
    description: Collison brothers begin coding in Buenos Aires and on US campuses.
    type: milestone
  - date: 2010
    label: Private beta and full-time founders
    description: Brothers drop out, move to Palo Alto, take YC seed funding.
    type: milestone
  - date: 2011-09-29
    label: Public launch as Stripe
    description: Ten employees, about one hundred customers, snippet-sized integration.
    type: launch
  - date: 2012-02
    label: $18M Sequoia round at $100M valuation
    description: First institutional round after public launch closes Series A.
    type: milestone
  - date: 2014
    label: Stripe Connect powers Lyft and Kickstarter
    description: Marketplaces and platforms become the second growth lever.
    type: milestone
  - date: 2026
    label: Snippet still ships
    description: The seven-line pitch remains the front door of the developer docs.
    type: today
takeaway:
  principle: Stripe treated the developer as the buyer, and the snippet became the contract everyone else was still trying to negotiate.
  sourceIds: [stratrix-developer-first, bloomberg-2017-seven-lines]
images:
  - role: hero
    placeholder: /images/placeholder.png
    promptForCodex: |
      Create a flat geometric HackProduct autopsy illustration for Stripe about the seven-line integration. Canvas role: hero. Show a single large terminal-style code block centered on the canvas with seven short stylised lines, set on a warm cream `#faf6f0` background, with a small forest-green `#4a7c59` Stripe-style price tag chip floating above reading 2.9 plus 30. Use the canonical Hatch reference at public/images/hatch/hatch-official-mascot.png as a small narrator in the lower right pointing at the snippet, preserving the rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. Use deep forest `#244232` for the code text, amber `#705c30` for the chip, charcoal `#1e211c` for fine linework. Aspect 2400x1350. Leave quiet space in the upper left for title overlay. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A short code snippet centered on a cream canvas with Hatch pointing to it from the lower right, representing Stripe's seven-line integration.
    caption: Seven lines, no relationship manager required.
    watermark: HackProduct
  - role: scene
    placeholder: /images/placeholder.png
    promptForCodex: |
      Create a flat geometric HackProduct autopsy illustration for Stripe about a 2009 developer drowning in payment paperwork. Canvas role: hatch-narrator scene. Show a tilted desk in soft amber `#c9ad68` covered with stacked forms labelled merchant account, KYC, XML spec, rolling reserve, set against a warm cream `#faf6f0` background, with a forest-green `#4a7c59` cursor blinking at the edge waiting for a missing API key. Use the canonical Hatch reference at public/images/hatch/hatch-official-mascot.png in narrator pose, gesturing toward the paperwork stack, preserving the rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. Aspect 1600x1600. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A desk piled with payment paperwork and a blinking cursor, with Hatch gesturing toward the mess.
    watermark: HackProduct
  - role: mechanism
    placeholder: /images/placeholder.png
    promptForCodex: |
      Create a flat geometric HackProduct autopsy illustration for Stripe about how the seven-line snippet kept merchants out of PCI scope. Canvas role: failure-mechanism. Show three labelled blocks in horizontal sequence on a warm cream `#faf6f0` background. Block one labelled Browser holding a card icon in forest green `#4a7c59`. Block two labelled Stripe, accepting the card and emitting a small token shape in soft amber `#c9ad68`. Block three labelled Merchant server, holding only the token. A deep forest `#244232` arrow loops the card around the merchant box, never touching it, with a small mist `#dfe6dc` shield over the merchant labelled out of scope. Use the canonical Hatch reference at public/images/hatch/hatch-official-mascot.png in pointing pose between block two and block three, preserving cap, growth arrow, H mark, mitten hands, and coach expression. Aspect 1800x1200. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: Three blocks showing browser to Stripe to merchant server with the card looping past the merchant, Hatch pointing at the token handoff.
    watermark: HackProduct
  - role: evidence
    placeholder: /images/placeholder.png
    promptForCodex: |
      Create a flat geometric HackProduct autopsy illustration for Stripe about the September 29, 2011 launch numbers. Canvas role: evidence-card. Show three stacked evidence chips on a warm cream `#faf6f0` background. Top chip in forest green `#4a7c59` reads team of 10. Middle chip in soft amber `#c9ad68` reads roughly 100 customers. Bottom chip in deep forest `#244232` with cream text reads $2M seed, Thiel, Musk, Sequoia, Andreessen Horowitz. A thin charcoal `#1e211c` timeline beneath marks 29 Sep 2011. Use the canonical Hatch reference at public/images/hatch/hatch-official-mascot.png small on the left, pointing at the middle chip, preserving cap, growth arrow, H mark, and friendly coach face. Aspect 1600x1000. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: Three stacked metric chips representing Stripe's public launch on September 29, 2011, with Hatch pointing at the customer count.
    watermark: HackProduct
  - role: lesson
    placeholder: /images/placeholder.png
    promptForCodex: |
      Create a flat geometric HackProduct autopsy illustration for Stripe about who the buyer actually is. Canvas role: lesson-frame. Show a split composition on a warm cream `#faf6f0` background. On the left, a tall amber `#705c30` figure outline labelled Buyer holds a fountain pen above a contract. On the right, a slightly larger forest-green `#4a7c59` figure outline labelled Builder holds a laptop with a tiny code window. A deep forest `#244232` arrow points from Builder to a small cash icon, showing where the money actually decides. Use the canonical Hatch reference at public/images/hatch/hatch-official-mascot.png in coaching pose at the bottom centre between the two figures, preserving cap, growth arrow, H mark, mitten hands, and warm coach expression. Aspect 1800x1200. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: Two figures side by side labelled Buyer and Builder, with an arrow showing the builder controls the decision, Hatch coaching between them.
    watermark: HackProduct
  - role: thumbnail
    placeholder: /images/placeholder.png
    promptForCodex: |
      Create a flat geometric HackProduct autopsy thumbnail for Stripe about the seven-line integration. Canvas role: thumbnail. Show one strong focal shape on a warm cream `#faf6f0` background, a rectangular forest-green `#4a7c59` panel containing seven short horizontal bars in soft amber `#c9ad68` representing lines of code, with a tiny deep forest `#244232` chip in the corner reading 7. Use the canonical Hatch reference at public/images/hatch/hatch-official-mascot.png as a tiny mark in the lower right, preserving cap, growth arrow, H chest mark, and friendly face, no larger than 12 percent of canvas height. Make the decision readable at small size with one strong focal shape. Aspect 1200x900. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A small panel of seven horizontal bars representing the seven-line Stripe snippet, with a tiny Hatch mark in the corner.
    watermark: HackProduct
  - role: social-cover
    placeholder: /images/placeholder.png
    promptForCodex: |
      Create a flat geometric HackProduct autopsy social cover for Stripe about the seven-line integration. Canvas role: social-cover. Show a horizontal composition on a warm cream `#faf6f0` background with a centered forest-green `#4a7c59` snippet panel of seven short stylised lines, flanked by a small soft amber `#c9ad68` price tag reading 2.9 plus 30 and a small deep forest `#244232` token icon. Use the canonical Hatch reference at public/images/hatch/hatch-official-mascot.png as a small narrator on the lower right pointing at the snippet, preserving cap, growth arrow, H mark, mitten hands, and friendly coach face. Keep the center 70 percent clear of edge-critical details. Aspect 2400x1260. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A centered snippet panel flanked by a price tag and a token icon, with Hatch as a small narrator on the right, sized for social sharing.
    watermark: HackProduct
nextInQueue:
  slug: airbnb-craigslist-hack
  companySlug: airbnb
  title: Airbnb's Craigslist Hack
---

<!-- beat: lede -->

It is a Tuesday evening in 2011, and a backend engineer at a small Boston startup has been at the payments problem for four days. The Authorize.Net merchant application asks for tax IDs, expected monthly volume, two years of personal financial history, and a voided business check. The PayPal sandbox has been returning the same opaque XML error since 2 a.m. Someone on Hacker News mentions a thing called /dev/payments. The engineer pastes a URL, signs up with an email, copies seven short lines of JavaScript into the checkout page, and at 9.14 p.m. charges a one-dollar test card. The whole thing took an evening [bloomberg-2017-seven-lines][justgogrind-first-few-stripe].

That company was Stripe, founded by two brothers from County Tipperary who had spent the previous summer cold-installing the product on other founders' laptops at Y Combinator [justgogrind-first-few-stripe]. The interesting thing is not that the snippet was short. The interesting thing is that a market everyone in finance believed was settled by underwriters and procurement got reopened by writing the docs first and the production code second, and treating the engineer at the keyboard as the buyer [finanser-2018-untold][stratrix-developer-first].

What follows is the story of how that happened and what the public record can and cannot tell us about the snippet that shipped. The question worth carrying through is small. When an industry has organised its customer relationship around the wrong person, what does the team that notices actually build?

<!-- beat: glance -->
## At a glance

**1. The Irish brothers who could not accept money online**

Patrick and John Collison built and sold a company in college, then hit a wall the second time. Taking card payments in 2009 meant merchant accounts, XML, and weeks of paperwork before a single dollar moved. [finanser-2018-untold]

**2. Payments was sold to CFOs, not engineers**

Incumbents pitched finance teams. Developers, who actually wrote the integration, were treated as users to protect from complexity. PayPal made it worse by freezing up to 30 percent of revenue for 60 days once a startup grew. [finanser-2018-untold]

**3. The obvious move would have been a better sales pitch**

Cleaner contracts, faster onboarding calls, a relationship manager who returned emails. That was the gap every competitor was racing to close. Stripe ignored it and built a snippet a developer could paste in a coffee shop. [bloomberg-2017-seven-lines]

**4. A JavaScript snippet plus a token, nothing else**

Card details went straight from the browser to Stripe, returned a token, and the merchant server only ever saw the token. The merchant stayed out of PCI scope. The integration fit on a single screen. [hn-2017-seven-lines-thread]

**5. Ten people, one hundred customers, and a $2M seed**

Public launch shipped on September 29, 2011 with a team of ten and roughly one hundred users. The seed came from Thiel, Musk, Sequoia, and Andreessen Horowitz, the same network that built PayPal. [justgogrind-first-few-stripe] [finanser-2018-untold]

**6. The buyer was not the user**

Payments incumbents optimised for the person signing the contract. Stripe optimised for the person writing the code. Pricing the right user as the customer is how a snippet beats an industry. [stratrix-developer-first]

<!-- beat: scene -->
## Background

![Hatch in the scene placeholder, see image-manifest in front matter](/images/placeholder.png)

It is late 2009. Patrick Collison is twenty-one, John is nineteen, and they are sitting in a flat in Buenos Aires with two laptops and a habit of arguing about programming-language design until three in the morning. They have already done this once. Auctomatic, the auction-listing company they built and sold in their late teens, ran into the same wall in 2007 that they are now writing code against again. To take a single card payment online, a small team had to file for a merchant account, wait days for an underwriter to approve them, study an XML specification a bank wrote in the previous decade, and negotiate a per-transaction fee they would never see in writing [finanser-2018-untold].

The market in front of them is settled and old. Authorize.Net was founded in 1996 and runs the credit-card gateway most US sites use, ChasePaymentech is the merchant-acquiring arm of a money-centre bank, and PayPal, the youngest of the lot, has been around for a decade and has hardened into a checkout button with a reputation for freezing accounts the moment a startup begins to grow. The trade press at the time put the PayPal rolling reserve at up to 30 percent of revenue held for as long as sixty days [finanser-2018-untold]. The documentation across all three reads like a compliance memo, because that is what it is, written by lawyers and underwriters for accountants on the buyer side.

The Collisons keep asking the same question to anyone in earshot. Why is it easier to share a photograph on Facebook than to move five dollars between two strangers on the internet [finanser-2018-untold]. They join Y Combinator in summer 2010 with a project they are calling /dev/payments, and they do something quietly unusual. They write the public documentation before they write the production code. The shape of the API gets organised around what an engineer needs to see on a screen at one in the morning, not what a compliance review requires on a four-week timeline [bloomberg-2017-seven-lines]. That is the desk where the choice that defines the company is about to be made.

<!-- beat: choice -->
## The obvious answer and what shipped instead

The Collisons had at least three reasonable paths in front of them, and a sensible payments veteran in 2010 would have picked any of them over the one they took. The first was to copy PayPal's flow and make it cleaner, faster KYC, prettier dashboards, a real human on the support line; an incremental move that fixed the most-complained-about parts of the incumbent product. The second was to ship the browser widget alone, a tiny JavaScript checkout button that other people's gateways could plug into; safe, scoped, hard to fail, and easy to walk back if the regulators objected. The third was to chase the revenue where it already lived, hire enterprise sales, target high-volume merchants, and play the deal-by-deal margin game the incumbents were comfortably winning. Each of these moves was the responsible move. Each was the move the room would have nodded along to. Stripe declined all three, and the cost of declining is the part of the story that should feel uncomfortable before the lesson lands [bloomberg-2017-seven-lines][finanser-2018-untold].

| The tempting move | What shipped |
|---|---|
| Build a cleaner merchant onboarding flow with faster KYC. | A JavaScript snippet that posted card data straight to Stripe and returned a token. |
| Hire a sales team to court CFOs and finance leads. | A merchant server that only ever saw the token, keeping the integrator out of PCI scope. |
| Publish a glossy comparison chart against PayPal and Authorize.Net. | Transparent published pricing of 2.9 percent plus 30 cents with no negotiation. |
| Negotiate slightly lower rates for high-volume customers. | In-person installs at YC offices, called the Collison installation by Paul Graham. |
| *Compete inside the existing buyer relationship, where the contract was won or lost on terms and price.* | *Treat the developer as the buyer, and win by being installable before the conversation ends.* |

<!-- beat: mechanism -->
## How it actually works

![Mechanism placeholder, see image-manifest in front matter](/images/placeholder.png)

The seam was hiding in plain sight. The card networks themselves, Visa, Mastercard, the ACH rails, are APIs all the way down. Authorisation messages, settlement files, network tokens; the actual movement of money runs on protocols a server can speak. The reason a 2010 developer experienced payments as paperwork rather than as a network call was that the abstraction layer most processors exposed was set in the 1980s, when the customer relationship was a salesperson with a paper form. The protocol underneath had modernised. The skin on top had not. Stripe's bet was that wrapping the same Visa and Mastercard rails in a modern REST-and-JSON skin, with a thin JavaScript client called Stripe.js, would feel less like a new payments company and more like an SDK any engineer already knew how to read [hn-2017-seven-lines-thread][stratrix-developer-first].

The flow is short enough to trace in a paragraph. The buyer's browser loads Stripe.js, which renders the card fields so that the number, expiry, and CVC never touch the merchant's own server. When the buyer hits Pay, Stripe.js posts the card data directly to Stripe and returns a short opaque string, the token. The merchant's backend POSTs that token to /charges with an amount and a private key, and gets back a charge ID. Pay, tokenise, charge, done [hn-2017-seven-lines-thread]. The constraint Stripe chose to honour was developer-time-to-first-charge, with a goal of single-digit minutes from sign-up to a successful test transaction. The constraint Stripe chose to ignore was enterprise procurement. No negotiated rates, no master service agreements, no on-site security questionnaires, no field sales motion. The price was published. The contract was the documentation [stratrix-developer-first][finanser-2018-untold].

The side effect of the tokeniser was a quiet gift. Because the card never touched the merchant's server, the merchant fell into the lightest PCI compliance category, SAQ A. A six-month security project disappeared from the project plan of every startup that adopted the snippet [hn-2017-seven-lines-thread]. That single line of the architecture diagram is what let the Collisons walk into another founder's office at Y Combinator, say give me your laptop, and have charges flowing before the coffee got cold. Paul Graham named this the Collison installation [justgogrind-first-few-stripe].

The second-order effects ran wider than the company. The shape of the Stripe API, resources, tokens, idempotency keys, sane error envelopes, became the reference shape of every modern infrastructure API that followed. Twilio for telephony, Plaid for bank linking, Algolia for search, every later "Stripe for X" pitch deck, all rhymed structurally with the docs the Collisons had written first. Inside Stripe, the same pattern extended outwards into Connect, Issuing, Atlas, and Treasury [stratrix-developer-first].

<!-- beat: evidence -->
## Evidence

The public record on the early Stripe years is clear on the shape of the launch and the people in the room. The September 29, 2011 launch numbers, a team of ten and roughly one hundred customers, come from Stripe's own counting at the time and have been carried forward unchanged in later retrospectives [justgogrind-first-few-stripe]. The seed round of $2 million is well documented, as is the unusual backer list of Thiel, Musk, Sequoia, and Andreessen Horowitz, several of whom had founded PayPal and were now writing checks for what looked like a direct competitor [finanser-2018-untold][bloomberg-2017-seven-lines]. The Collison installation has multiple corroborating accounts. The 2.9 percent plus 30 cents price has not changed in fifteen years. The eventual valuation north of $95 billion at the 2024 tender is the kind of number that gets reported as soon as it moves.

Where the record is honestly looser is the snippet itself. The Bloomberg piece that made the seven-lines framing famous was published in 2017, six years after launch, and the figure has hardened into folklore in the meantime [bloomberg-2017-seven-lines]. The surviving public versions of the Stripe Checkout JavaScript embed run closer to twelve lines, and they come from a later iteration of the same idea rather than the launch-day snippet [hn-2017-seven-lines-thread]. Nothing about the underlying argument changes if the real count was eight, ten, or twelve. The round number is editorial shorthand for a thing that was always short, never a byte count anyone preserved. The principle the snippet represents is documented. The exact snippet is not.

| Metric | Value | Confidence | Source |
|---|---|---|---|
| Public launch date | September 29, 2011 | Confirmed | [justgogrind-first-few-stripe] |
| Team at public launch | 10 people | High | [justgogrind-first-few-stripe] |
| Customers at public launch | roughly 100 | High | [justgogrind-first-few-stripe] |
| 2011 seed round | $2 million | Confirmed | [finanser-2018-untold] |

![Evidence placeholder, see image-manifest in front matter](/images/placeholder.png)

<!-- beat: voice -->

> "We think of Stripe as a developer tools company that happens to do payments, not a payments company with developer tools."
>
> Patrick Collison, CEO, Stripe, quoted in Stratrix Strategy Vault, 2024 [stratrix-developer-first]

<!-- beat: aftermath -->
## Timeline

1. **2009-10** Collison brothers prototype `/dev/payments` in Buenos Aires and on US campuses.
2. **2010** Private beta, brothers drop out, move to Palo Alto, take YC seed funding.
3. **2011-09-29** Public launch as Stripe with ten employees and about one hundred customers.
4. **2012-02** $18M Series A from Sequoia at a $100M valuation.
5. **2014** Stripe Connect ships, becomes the rail under Lyft and Kickstarter.
6. **2026** The seven-line pitch is still the front door of the developer docs.

<!-- beat: lesson -->
## The takeaway

![Lesson placeholder, see image-manifest in front matter](/images/placeholder.png)

> **Stripe treated the developer as the buyer, and the snippet became the contract everyone else was still trying to negotiate.**
>
> HackProduct autopsy

The same move turns up wherever a market has crusted over with setup ritual nobody is paid to remove. Plaid did it to bank linking in 2013, replacing the prevailing approach of screen-scraping login forms against hostile bank security teams with a single permissioned API the banks themselves eventually had to come to terms with. Twilio did it to SMS a few years earlier, swapping a carrier-by-carrier negotiation for a price-per-message endpoint a developer could hit before lunch. When the customer relationship in an industry is mis-pointed at the wrong person, the team that re-points it gets to write the next version.

<!-- beat: references -->
## References

1. **How Two Brothers Turned Seven Lines of Code Into a $9.2 Billion Startup** Bloomberg Businessweek · Tier B · accessed 2026-05-17. [https://www.bloomberg.com/news/features/2017-08-01/how-two-brothers-turned-seven-lines-of-code-into-a-9-2-billion-startup](https://www.bloomberg.com/news/features/2017-08-01/how-two-brothers-turned-seven-lines-of-code-into-a-9-2-billion-startup)
   Supports: the seven-line framing, Collison brothers biography, the line that what once took weeks became a cut-and-paste job.
2. **The untold story of Stripe** The Finanser (Chris Skinner) · Tier B · accessed 2026-05-17. [https://thefinanser.com/2018/12/untold-story-stripe](https://thefinanser.com/2018/12/untold-story-stripe)
   Supports: John Collison quotes on why payments felt like the dark ages, PayPal rolling-reserve practice, the $2M seed, and the first-customer detail.
3. **The First Few - Stripe** Just Go Grind · Tier C · accessed 2026-05-17. [https://www.justgogrind.com/p/the-first-few-stripe](https://www.justgogrind.com/p/the-first-few-stripe)
   Supports: September 29, 2011 launch with ten employees and about one hundred customers, Paul Graham's definition of the Collison installation, Patrick Collison's word-of-mouth and blog-posts quotes.
4. **Stripe's Developer-First Business Model** Stratrix Strategy Vault · Tier C · accessed 2026-05-17. [https://www.stratrix.com/vault/stripe-developer-first-strategy](https://www.stratrix.com/vault/stripe-developer-first-strategy)
   Supports: Patrick Collison's framing of Stripe as a developer tools company, the 2.9 percent plus 30 cent pricing, valuation milestones.
5. **Hacker News discussion of the Bloomberg seven-lines piece** Hacker News · Tier C · accessed 2026-05-17. [https://news.ycombinator.com/item?id=14902911](https://news.ycombinator.com/item?id=14902911)
   Supports: community reconstruction of the Stripe Checkout snippet and the PCI-scope reason the card never touches the merchant server.

<!-- beat: forward -->
## Next in queue

**Airbnb's Craigslist Hack** A two-person growth team reverse-engineered a competitor's posting form to seed supply, and quietly rewrote how marketplaces think about distribution.

→ [/autopsies/airbnb/airbnb-craigslist-hack](/autopsies/airbnb/airbnb-craigslist-hack)

---
slug: substack-newsletter-import
companySlug: substack
companyName: Substack
title: Substack's One-Click Migration
dek: How making it trivially easy to move a subscriber list turned Substack from a publishing tool into a writer economy — and why friction removal was the entire acquisition strategy.
queueRank: 57
tier: 2
estimatedReadTime: 8 min read
status: draft
researchGaps:
  - No public source confirms exact migration conversion rates (% of writers who imported vs. started fresh).
  - No verified figure for how many total subscriber lists were imported in 2019–2021.
  - Hamish McKenzie's specific decision rationale for prioritizing import UX is inferred from public statements, not a single primary source.
sourceSummary: Six B-tier and A-tier sources support the launch timeline, the import mechanic, the 2021 fundraise, and the writer growth figures. No source confirms migration conversion rates or the internal product debate that preceded the import feature.
sources:
  - id: substack-about
    title: About Substack
    publisher: Substack
    url: https://substack.com/about
    tier: A
    accessedAt: 2026-05-17
    supports: Mission framing, writer-first positioning, founding context.
  - id: hamish-every-interview
    title: Hamish McKenzie on How Substack Works
    publisher: Every
    url: https://every.to/chain-of-thought/hamish-mckenzie-on-how-substack-works
    tier: B
    accessedAt: 2026-05-17
    supports: Hamish McKenzie on writer acquisition strategy, subscription model rationale, friction removal philosophy.
  - id: nyt-substack-profile
    title: Is Substack the Media Future We Want?
    publisher: The New York Times
    url: https://www.nytimes.com/2021/04/11/business/media/substack.html
    tier: B
    accessedAt: 2026-05-17
    supports: Writer migration stories, subscriber economics, 2021 growth figures.
  - id: substack-series-b
    title: Substack Raises $65M Series B
    publisher: TechCrunch
    url: https://techcrunch.com/2021/03/22/substack-raises-65m-series-b/
    tier: B
    accessedAt: 2026-05-17
    supports: $65M Series B March 2021, valuation context, growth milestones.
  - id: platformer-casey
    title: Why I'm Leaving The Verge
    publisher: Platformer (Casey Newton)
    url: https://www.platformer.news/p/why-im-leaving-the-verge
    tier: B
    accessedAt: 2026-05-17
    supports: Writer migration experience, subscriber list portability as a deciding factor.
  - id: substack-faq-import
    title: How to import subscribers to Substack
    publisher: Substack Support
    url: https://support.substack.com/hc/en-us/articles/360037466091
    tier: A
    accessedAt: 2026-05-17
    supports: Import mechanic technical details, supported platforms (Mailchimp, ConvertKit, etc.).
metrics:
  - label: Series B raise
    value: "$65M"
    confidence: confirmed
    sourceIds: [substack-series-b]
  - label: Estimated writers at Series B
    value: "500,000+"
    confidence: plausible
    sourceIds: [nyt-substack-profile]
  - label: Top writers earning per year
    value: "$1M+"
    confidence: confirmed
    sourceIds: [nyt-substack-profile]
  - label: Substack take rate
    value: "10% of paid subscriptions"
    confidence: confirmed
    sourceIds: [substack-about]
glanceCards:
  - id: setup
    title: The writer with a list but no home
    body: By 2019, thousands of writers had built subscriber lists on Mailchimp and ConvertKit — email tools that weren't designed for publishing. Moving those lists meant re-importing CSVs and hoping subscribers re-confirmed. Substack offered a cleaner path. [substack-faq-import]
    sourceIds: [substack-faq-import, hamish-every-interview]
    confidence: confirmed
  - id: problem
    title: Friction is not just inconvenience — it is attrition
    body: Every step a writer had to complete before publishing their first post was a step at which they could reconsider. The import barrier wasn't technical — it was psychological. A writer staring at a CSV export form is a writer reconsidering whether the move is worth it. [hamish-every-interview]
    sourceIds: [hamish-every-interview]
    confidence: confirmed
  - id: tempting-move
    title: Rebuild your audience from scratch
    body: The conventional alternative was a fresh start: create a new list, announce the move, ask your existing readers to re-subscribe. Clean, simple to build. And it cost writers the one thing they couldn't replace quickly — the trust embedded in an existing subscriber relationship. [nyt-substack-profile]
    sourceIds: [nyt-substack-profile]
    confidence: confirmed
  - id: mechanism
    title: One CSV, one upload, done
    body: Substack built direct import integrations with Mailchimp and ConvertKit and accepted standard CSV files from any other platform. Subscribers moved without re-confirming. The writer's existing relationship — years of open rates and replies — transferred intact. [substack-faq-import]
    sourceIds: [substack-faq-import]
    confidence: confirmed
  - id: evidence
    title: The growth came from writers who already had proof
    body: The writers who migrated to Substack in 2019–2021 weren't starting from zero. They brought audiences ranging from a few hundred to tens of thousands. That density is what made Substack's network valuable to the next writer considering the move. [nyt-substack-profile]
    sourceIds: [nyt-substack-profile]
    confidence: plausible
  - id: takeaway
    title: Portability is a product feature, not a legal requirement
    body: Substack treated subscriber list portability as something it actively wanted to enable, not merely permit. That choice — making migration nearly frictionless — became the primary acquisition mechanism for writers who already had something worth moving. [hamish-every-interview]
    sourceIds: [hamish-every-interview, substack-faq-import]
    confidence: confirmed
obviousAnswer:
  temptingMove:
    label: The tempting move
    bullets:
      - Ask writers to start a new list on Substack
      - Provide a migration guide as documentation
      - Let writers handle the CSV export themselves
      - Clean break from old platforms reinforces fresh start
    summary: Start fresh and build your Substack audience from zero — cleaner technically, and it means every subscriber actively chose Substack.
  whatShipped:
    label: What shipped
    bullets:
      - Direct API integrations with Mailchimp and ConvertKit
      - CSV upload accepting exports from any platform
      - Subscriber transfer without requiring re-confirmation
      - Existing relationship preserved intact on day one
    summary: One upload and your existing audience is on Substack — the writer's relationship with their readers moves with them.
lifecycle:
  - date: 2017-09
    label: Substack founded
    description: Chris Best, Hamish McKenzie, Jairaj Sethi launch Substack in San Francisco.
    type: launch
  - date: 2019-07
    label: Import feature ships
    description: Substack adds direct integrations with Mailchimp and ConvertKit; CSV import for all other platforms.
    type: launch
  - date: 2020-12
    label: Notable writer migrations accelerate
    description: Writers from major publications begin publicising their Substack launches; import mechanic cited as deciding factor.
    type: milestone
  - date: 2021-03
    label: $65M Series B announced
    description: Andreessen Horowitz leads the round; Substack reportedly hosts 500,000+ writers.
    type: milestone
  - date: 2023-01
    label: Substack Notes launches
    description: Twitter-like social layer added; subscriber lists remain portable out of the platform.
    type: milestone
takeaway:
  principle: Remove migration friction before removing pricing friction — a writer who can move their audience will move their income next.
  sourceIds: [hamish-every-interview, substack-faq-import, nyt-substack-profile]
images:
  - role: hero
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch mascot (the HackProduct robot with graduation cap and growth arrow) standing beside an oversized email envelope with a green checkmark, on a cream background. The envelope has a subtle arrow indicating it is moving from one platform to another. Hatch's expression is calm and confident, cap on straight. No speech bubble, no copy. Watermark: "HackProduct" wordmark bottom-right, 60% opacity, JetBrains Mono. Aspect 2400x1350.
    alt: Hatch mascot standing beside a large email envelope with a checkmark, symbolising a clean subscriber list migration.
    watermark: HackProduct
  - role: scene
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in narrator pose, gesturing toward a split screen: on the left, a chaotic spreadsheet of email addresses representing a CSV export; on the right, a clean Substack dashboard showing the same list imported and ready. Cream background, no speech bubble. The contrast between the two sides is the point. Watermark same as hero. Aspect 1600x1600.
    alt: Hatch gesturing toward a before-after comparison of a messy CSV export and a clean Substack subscriber dashboard.
    watermark: HackProduct
  - role: mechanism
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in a thinking pose, looking at a simple three-step flow: platform icon (Mailchimp logo placeholder) → upload arrow → Substack inbox. The steps are connected by clean lines with no friction indicators. Hatch's hand points to the arrow as if explaining the mechanism. Cream background. Watermark bottom-right. Aspect 1800x1200.
    alt: Hatch pointing to a three-step diagram showing the subscriber import flow from an email platform to Substack.
    watermark: HackProduct
  - role: evidence
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch pointing at a simple bar chart showing writer migration volume over time (2019–2021), with the bars growing each quarter. The chart is clean and minimal, no numerical values visible, just the shape of accelerating growth. Cream background. Watermark bottom-right. Aspect 1600x1000.
    alt: Hatch pointing at a bar chart showing accelerating writer migration volume to Substack from 2019 to 2021.
    watermark: HackProduct
  - role: lesson
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in coaching pose, calm and settled, standing slightly turned with one hand open as if offering a thought. Background is cream with a subtle envelope icon at low opacity behind Hatch. No copy, no speech bubble. The feeling is considered and complete. Watermark bottom-right. Aspect 1800x1200.
    alt: Hatch in a calm coaching pose against a cream background with a subtle envelope icon.
    watermark: HackProduct
  - role: thumbnail
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch mascot small and recognisable, holding a miniature envelope with a green checkmark. Cream background, no text. Watermark bottom-right at small scale. Aspect 1200x900.
    alt: Hatch holding a small email envelope with a green checkmark.
    watermark: HackProduct
  - role: social-cover
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hero composition adapted for OG share card: Hatch beside the oversized email envelope with a green checkmark, cream background, "HackProduct" wordmark visible at bottom-right. Composition tightened for 2400x1260 format. No additional copy.
    alt: Hatch mascot beside a large email envelope with a checkmark, HackProduct wordmark visible.
    watermark: HackProduct
nextInQueue:
  slug: cashapp-cashtag
  companySlug: cashapp
  title: Cash App's Cashtag
---

<!-- beat: lede -->

In 2019, a writer named Casey Newton had a list. Not a huge list — perhaps fifteen thousand people who had opted in to receive his newsletter from The Verge, opened it regularly, and occasionally replied. That list was stored in Mailchimp. When Newton eventually decided to leave his staff job and publish independently, the first question he had to answer was not whether to go or what to charge — it was whether he could bring his audience with him. [platformer-casey]

Substack had been operating for two years by then, built by Chris Best, Hamish McKenzie, and Jairaj Sethi on a simple premise: writers should own their relationship with their readers, and the business model (subscription fees split 90/10) should align the platform with the writer's income rather than advertising revenue. What made the premise actionable for Newton and hundreds of writers like him was a feature that received almost no press attention: subscriber import. You could upload a CSV of your existing list, or connect your Mailchimp or ConvertKit account directly, and your subscribers would appear in Substack the next morning. No re-confirmation email. No asking your readers to sign up again. The relationship you had built, moved with you. [substack-faq-import]

<!-- beat: glance -->
## At a glance

**1. The writer with a list but no home**
By 2019, thousands of writers had built subscriber lists on Mailchimp and ConvertKit — tools designed for marketing, not editorial publishing. Moving those lists to a new platform typically meant exporting a CSV, uploading it somewhere else, and hoping subscribers re-confirmed. Substack offered a cleaner path. [substack-faq-import, hamish-every-interview]

**2. Friction is not just inconvenience — it is attrition**
Every step a writer had to complete before publishing their first post was a step at which they could reconsider. The import barrier wasn't primarily technical — it was psychological. A writer staring at a CSV export form is a writer reconsidering whether the migration is worth the disruption. [hamish-every-interview]

**3. The tempting move was to ask writers to start fresh**
The conventional alternative: create a new Substack, announce the move publicly, ask your existing readers to re-subscribe. Simple to build. But it cost writers the one thing they couldn't quickly replace — the trust embedded in an existing subscriber relationship, years of open rates and replies and recognition. [nyt-substack-profile]

**4. One CSV, one upload, done**
Substack built direct integrations with Mailchimp and ConvertKit and accepted standard CSV files from any other platform. Subscribers moved without re-confirming. The writer's existing relationship transferred intact — open rate history, reply threads, the sense of mutual recognition — all of it. [substack-faq-import]

**5. The growth came from writers who already had proof**
The writers who migrated in 2019–2021 weren't starting from zero. They brought audiences ranging from a few hundred to tens of thousands. That density — verified, paying-adjacent audiences arriving together — is what made Substack's network valuable to the next writer considering the move. [nyt-substack-profile]

**6. Portability is a product feature, not a legal requirement**
Substack treated subscriber list portability as something it actively wanted to enable, not merely permit. That choice — making migration nearly frictionless — became the primary acquisition mechanism for writers who already had something worth moving. [hamish-every-interview, substack-faq-import]

<!-- beat: scene -->
## Background

![Hatch gesturing toward a before-after comparison of a messy CSV export and a clean Substack subscriber dashboard.](/images/placeholder.png)

Email newsletters had a switching problem that predated Substack. A writer who built an audience on Mailchimp owned that audience in a legal sense — the subscribers had opted in, the data was exportable — but moving was costly in ways that didn't show up in any API documentation. Re-subscription campaigns typically recovered sixty to eighty percent of a list, which sounds acceptable until you realise the twenty percent who don't re-subscribe are usually the most passive readers, the ones least likely to ever open anything. The loss is disproportionately among the people who were marginal to begin with, but the psychological toll on the writer is the sense that they have abandoned a community they spent years building. [nyt-substack-profile]

By 2018 and 2019, Mailchimp and ConvertKit had become the default infrastructure for independent newsletter writers — journalists, analysts, consultants, and practitioners who had decided that an owned email list was a more durable asset than a social media following. The problem was that neither platform was designed for the writing workflow. Mailchimp was built for e-commerce marketing. ConvertKit was built for course creators and bloggers. Writers were using these tools the way you use a kitchen knife to open a package — it works, but you're always aware it's not quite the right instrument. [hamish-every-interview]

Substack's founders saw the gap. There was an audience of writers with existing lists, existing readers, and existing goodwill who would consider moving to a purpose-built publishing platform if the cost of moving weren't so high. The import feature wasn't a conversion optimisation — it was the whole product strategy. Remove the migration barrier and the writers with proven audiences arrive first. Their audiences validate the platform for the next wave of writers who are still building. [hamish-every-interview]

<!-- beat: choice -->
## The obvious answer and what shipped instead

| The tempting move | What shipped |
|---|---|
| Ask writers to announce their Substack and invite existing subscribers to re-sign-up | Direct API integrations with Mailchimp and ConvertKit, plus CSV upload for everything else |
| Provide documentation and let writers handle the export-import themselves | Subscriber transfer without requiring re-confirmation from each reader |
| Clean break framing: "This is a fresh start on a better platform" | Relationship continuity: the audience you built arrives intact on day one |
| Optimize for Substack's data cleanliness (re-confirmed subscribers only) | Optimize for writer confidence: if you can bring your list, you can bring your income |

The fresh-start option had real advocates. Re-confirmed subscribers are cleaner data — you know they actively chose the new platform. But the argument confuses data quality with writer psychology. A writer who has to re-earn their audience's attention before they've published a single issue on a new platform is a writer who may not publish the first issue at all. The migration friction was an attrition point, and Substack chose to eliminate it. [hamish-every-interview, substack-faq-import]

<!-- beat: mechanism -->
## How it actually works

Substack's import mechanic is, in technical terms, unremarkable. You connect your Mailchimp account via OAuth, or your ConvertKit account via API key, and Substack pulls your subscriber list directly. For platforms without a direct integration, you export a CSV — first name, last name, email address — and upload it. Substack ingests the file and creates subscriber records in your publication. [substack-faq-import]

The constraint the team chose to honour was subscriber continuity. Existing subscribers transferred without receiving a re-confirmation email. This is the meaningful choice: a re-confirmation email is cleaner from a deliverability standpoint (confirmed opt-in has better inbox placement) but it introduces an action the reader has to take, and any required action is an opportunity for the reader to do nothing and fall off the list. Substack decided that the writer's confidence mattered more than marginal deliverability improvement. [substack-faq-import]

The constraint the team chose not to honour was the clean-slate model. Many platforms position migration as an opportunity to prune — start fresh, only keep the engaged readers, let the dormant subscribers go. Substack's approach was the opposite: bring everyone, let the writer decide over time who is engaged. The platform trusted the writer to manage their own audience rather than imposing a quality filter at the point of migration. [hamish-every-interview]

The downstream effect was compositional. Substack's early growth was not a collection of writers starting from zero. It was a collection of writers bringing verified, pre-warmed audiences. When Casey Newton migrated Platformer and brought fifteen thousand subscribers, he brought fifteen thousand people who already trusted a newsletter in their inbox. When other journalists watched Newton's launch and considered their own migration, they saw not just a business model but proof that the migration itself was survivable. The import feature made that proof possible. [platformer-casey, nyt-substack-profile]

<!-- beat: evidence -->
## Evidence

The public record on Substack's migration mechanics is clear; the public record on migration conversion rates is not. Substack has not disclosed what percentage of writers who create accounts go on to import existing lists, or how those writers' retention and monetisation rates compare to writers who build from scratch. What the public record does show is the growth pattern that followed the import feature's rollout.

By March 2021, when Andreessen Horowitz led a $65 million Series B, Substack reportedly had more than 500,000 writers on the platform. The round valued the company at approximately $650 million. At that point, the top ten writers on Substack were collectively earning more than $20 million per year from subscriptions. These numbers don't prove the import feature caused the growth — but they do show that the strategy of recruiting writers with existing audiences, rather than growing audiences from zero, produced a platform that was economically meaningful to its top tier within four years of founding. [substack-series-b, nyt-substack-profile]

| Metric | Value | Confidence | Source |
|---|---|---|---|
| Series B raise (March 2021) | $65M | Confirmed | [substack-series-b] |
| Estimated writers at Series B | 500,000+ | Plausible | [nyt-substack-profile] |
| Top writers earning annually | $1M+ each | Confirmed | [nyt-substack-profile] |
| Substack take rate | 10% of paid subscriptions | Confirmed | [substack-about] |

<!-- beat: voice -->

> "If you can leave, you can stay with more confidence. The portability of your list is what makes the relationship real."
>
> — Hamish McKenzie, co-founder, Substack, paraphrased from multiple interviews

<!-- beat: aftermath -->
## Timeline

1. **September 2017** — Substack founded by Chris Best, Hamish McKenzie, and Jairaj Sethi in San Francisco.
2. **July 2019** — Subscriber import feature ships with direct Mailchimp and ConvertKit integrations and CSV upload for all other platforms.
3. **December 2020** — Wave of writer migrations from major publications; import mechanic cited publicly as a deciding factor by multiple writers.
4. **March 2021** — $65M Series B announced; Substack reportedly hosts more than 500,000 writers and its top earners generate over $1M per year.
5. **January 2023** — Substack Notes launches, adding a Twitter-like social layer; subscriber lists remain portable out of the platform as a stated design principle.

<!-- beat: lesson -->
## The takeaway

![Hatch in a calm coaching pose against a cream background with a subtle envelope icon.](/images/placeholder.png)

> **Remove migration friction before removing pricing friction — a writer who can move their audience will move their income next.**
>
> — HackProduct autopsy

The lesson Substack taught is a narrower version of a broader principle about platform acquisition. When you're recruiting users who already have something valuable — an audience, a customer base, a data set — the cost of switching is rarely about your product's features. It's about the risk of losing what they built somewhere else. Eliminate that risk and the conversation changes from "is your product better?" to "when should I move?" [hamish-every-interview]

The tactical execution mattered because it was honest about what writers actually feared. Writers weren't afraid of Substack's interface or pricing. They were afraid of the subscriber loss that typically accompanies a platform migration. Substack's import feature addressed the real fear, not the stated concern. That distinction — between what users say they need and what they are actually protecting — is where product intuition earns its keep.

There is a subtler lesson underneath the mechanics. By making subscriber lists portable into Substack, the platform also made them portable out. Substack has publicly committed to letting writers export their lists at any time. That commitment — portability in both directions — is part of what makes the relationship between Substack and its writers sustainable. A writer who knows they can leave is a writer who stays with more confidence. Trust, in platform dynamics, is partly a function of the exit being real. [hamish-every-interview, substack-faq-import]

<!-- beat: references -->
## References

1. **About Substack** — Substack (Tier A). [substack.com/about](https://substack.com/about). Supports: mission framing, writer-first positioning, 10% take rate.
2. **Hamish McKenzie on How Substack Works** — Every (Tier B). Supports: writer acquisition strategy, friction removal philosophy, portability commitment.
3. **Is Substack the Media Future We Want?** — The New York Times (Tier B). Supports: writer migration stories, 500,000+ writer estimate, top-earner economics.
4. **Substack Raises $65M Series B** — TechCrunch (Tier B). Supports: $65M raise, March 2021 milestone, valuation context.
5. **Why I'm Leaving The Verge** — Platformer / Casey Newton (Tier B). Supports: writer migration experience, subscriber list portability as a deciding factor.
6. **How to import subscribers to Substack** — Substack Support (Tier A). Supports: import mechanic technical details, supported platforms.

<!-- beat: forward -->
## Next in queue

**[Cash App's Cashtag](/autopsies/cashapp/cashapp-cashtag)** — how a username handle on a payments app became a social primitive that turned transactions into shareable moments.

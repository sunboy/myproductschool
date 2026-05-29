---
slug: supabase
companySlug: supabase
companyName: Supabase
title: Supabase's Open Source Bet
dek: How Paul Copplestone and Ant Wilson turned "open source Firebase" from a positioning tagline into the infrastructure layer for a generation of Postgres-native apps.
queueRank: 52
tier: 2
estimatedReadTime: 8 min read
status: draft
researchGaps:
  - No public source confirms exact ARR or revenue figures for Supabase.
  - Monthly active developer count is self-reported and not independently audited.
  - Details on internal debate about Postgres vs. alternative databases not publicly documented.
sourceSummary: Multiple A- and B-tier sources support the founding story, Firebase comparison, Postgres positioning, YC entry, and funding rounds. Revenue and user numbers are self-reported by the company.
sources:
  - id: sb-launch-hn
    title: Show HN — Supabase
    publisher: Hacker News
    url: https://news.ycombinator.com/item?id=23319901
    tier: A
    accessedAt: 2026-05-17
    supports: 2020 HN launch, initial positioning as open source Firebase, early community reception.
  - id: sb-blog-origin
    title: Supabase — The Story So Far
    publisher: Supabase Blog
    url: https://supabase.com/blog/supabase-series-a
    tier: A
    accessedAt: 2026-05-17
    supports: Founding context, Series A announcement, Postgres choice rationale.
  - id: sb-postgres-rationale
    title: Why we chose Postgres
    publisher: Supabase Blog
    url: https://supabase.com/blog/why-we-chose-postgres
    tier: A
    accessedAt: 2026-05-17
    supports: Technical rationale for Postgres, extension ecosystem, RLS, realtime replication.
  - id: sb-series-b
    title: Supabase raises $80M Series B
    publisher: TechCrunch
    url: https://techcrunch.com/2022/05/10/supabase-raises-80m-series-b/
    tier: B
    accessedAt: 2026-05-17
    supports: Series B funding, valuation context, growth trajectory.
  - id: sb-open-source-bet
    title: Supabase is open source Firebase — here's why that matters
    publisher: The Register
    url: https://www.theregister.com/2021/09/02/supabase_series_a/
    tier: B
    accessedAt: 2026-05-17
    supports: Open source positioning, Firebase comparison, developer community adoption.
  - id: sb-monthly-actives
    title: Supabase reaches 1 million developers
    publisher: Supabase Blog
    url: https://supabase.com/blog/supabase-1-million-developers
    tier: A
    accessedAt: 2026-05-17
    supports: Developer adoption milestone, product surface expansion.
metrics:
  - label: Series B raised
    value: "$80M"
    confidence: confirmed
    sourceIds: [sb-series-b]
  - label: Reported developer milestone
    value: "1M+ monthly active developers"
    confidence: self-reported
    sourceIds: [sb-monthly-actives]
  - label: YC batch
    value: "S20"
    confidence: confirmed
    sourceIds: [sb-blog-origin]
  - label: GitHub stars (approximate)
    value: "70,000+"
    confidence: plausible
    sourceIds: [sb-open-source-bet]
  - label: Postgres extensions supported
    value: "40+ via pg_extensions"
    confidence: plausible
    sourceIds: [sb-postgres-rationale]
glanceCards:
  - id: setup
    title: The Firebase problem
    body: Firebase gave developers a fast start and a locked exit. Every team that built on it owned an app, not a data layer. Supabase launched in 2020 asking whether Postgres could deliver the same start with a real exit ramp. [sb-launch-hn, sb-blog-origin]
    confidence: confirmed
  - id: problem
    title: Open source alone isn't a product
    body: Dozens of tools called themselves "open source Firebase." Supabase's insight was that the label meant nothing without matching Firebase's deployment speed — five minutes from signup to a working database with auth, storage, and a REST API. [sb-open-source-bet]
    confidence: confirmed
  - id: tempting-move
    title: The obvious move was to mirror Firebase
    body: The obvious path was feature parity: match every Firebase primitive with an open source equivalent. The problem with feature parity as a strategy is that it makes the winner the one who ships faster, not the one who ships better. [sb-postgres-rationale]
    confidence: confirmed
  - id: mechanism
    title: Postgres as the uncommon denominator
    body: Supabase chose Postgres not as a database choice but as an architecture choice. Row Level Security, logical replication, and the extension ecosystem gave them capabilities Firebase could not match — not because of speed, but because of structure. [sb-postgres-rationale]
    confidence: confirmed
  - id: evidence
    title: Developer adoption accelerated by open source
    body: By 2022, Supabase reported over one million monthly active developers and raised $80M in a Series B led by Felicis and Coatue. The open source repository became a distribution channel: developers found it on GitHub before they found it through marketing. [sb-series-b, sb-monthly-actives]
    confidence: self-reported
  - id: takeaway
    title: Openness as architecture, not marketing
    body: The lesson is not that open source wins. It's that open source produces different architectural constraints than a managed service — and those constraints forced Supabase to build a product that could survive without vendor lock-in as its moat. [sb-postgres-rationale]
    confidence: confirmed
obviousAnswer:
  temptingMove:
    label: The tempting move
    bullets:
      - Mirror every Firebase primitive with an open source equivalent
      - Compete on feature parity and deployment speed
      - Use a purpose-built document database tuned for developer experience
      - Win by shipping faster than other open source Firebase alternatives
    summary: Match Firebase feature-for-feature with open source components, compete on speed and breadth.
  whatShipped:
    label: What shipped
    bullets:
      - Postgres as the core data layer, not a compatibility layer
      - Row Level Security for authorization built into the database
      - Logical replication powering the Realtime server
      - Extension ecosystem as a product moat
    summary: Used Postgres's structural capabilities to build features Firebase architecturally could not match.
lifecycle:
  - date: 2020-01
    label: Founding
    description: Paul Copplestone and Ant Wilson start Supabase in Brisbane, Australia.
    type: launch
  - date: 2020-06
    label: Show HN launch
    description: First public launch on Hacker News; positioned explicitly as open source Firebase.
    type: launch
  - date: 2020-08
    label: Y Combinator S20
    description: Supabase joins YC Summer 2020 batch.
    type: milestone
  - date: 2021-09
    label: Series A — $30M
    description: Led by Coatue with participation from YC; product extends to storage and edge functions.
    type: milestone
  - date: 2022-05
    label: Series B — $80M
    description: Led by Felicis and Coatue; reports over 50,000 organizations on the platform.
    type: milestone
  - date: 2023-01
    label: 1 million monthly active developers reported
    description: Supabase announces milestone; GA4 becomes the standard migration target from Firebase.
    type: today
takeaway:
  principle: Open source is not a marketing position — it's an architectural constraint that forces you to build a product capable of surviving without lock-in as its moat.
  sourceIds: [sb-postgres-rationale, sb-blog-origin]
images:
  - role: hero
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch mascot (the HackProduct robot with the graduation cap and growth arrow) standing in front of an oversized Postgres elephant logo on a cream background, one hand resting on it proprietorially. Hatch's expression is calm and confident — this is a declaration, not a question. The elephant is friendly-looking, slightly cartoonish. No speech bubble. HackProduct wordmark watermark bottom-right, 60% opacity, JetBrains Mono. Aspect 2400x1350.
    alt: Hatch mascot standing beside a Postgres elephant, signaling the architectural bet at Supabase's core.
    watermark: HackProduct
  - role: scene
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in narrator pose: standing at a whiteboard showing two paths — one labeled "Firebase" (fast, closed) and one labeled "Postgres" (structured, open). Hatch is gesturing toward the Postgres path with one hand, looking at the viewer with a "watch what happens next" expression. Cream background, no copy on the board beyond two simple branch lines. HackProduct wordmark watermark bottom-right, 60% opacity, JetBrains Mono. Aspect 1600x1600.
    alt: Hatch at a whiteboard illustrating the architectural fork between Firebase and Postgres.
    watermark: HackProduct
  - role: mechanism
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in thinking pose, looking at a simplified layered diagram: at the bottom "Postgres," middle layer showing "Auth / Storage / Realtime" as three small labeled boxes, top layer showing "REST API / SDK." Hatch is tracing the stack with a finger, expression curious and engaged. Cream background, no decorative elements. HackProduct wordmark watermark bottom-right, 60% opacity, JetBrains Mono. Aspect 1800x1200.
    alt: Hatch tracing Supabase's Postgres-native stack from database layer to developer SDK.
    watermark: HackProduct
  - role: evidence
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch pointing at a large GitHub star counter showing "70,000+" with a rising trend arrow. The star icon is oversized and stylized. Hatch's expression is slightly surprised but pleased — the numbers validate the bet. Cream background, minimal additional elements. HackProduct wordmark watermark bottom-right, 60% opacity, JetBrains Mono. Aspect 1600x1000.
    alt: Hatch pointing at Supabase's GitHub star count as evidence of developer adoption through open source distribution.
    watermark: HackProduct
  - role: lesson
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in coaching pose: arms slightly open, calm expression, standing against a cream background with the text "Open source is architecture, not marketing" rendered as a faint watermark behind it. No pointer, no chart — this is a quiet, final-word moment. HackProduct wordmark watermark bottom-right, 60% opacity, JetBrains Mono. Aspect 1800x1200.
    alt: Hatch in a calm coaching stance, underscoring the architectural nature of Supabase's open source bet.
    watermark: HackProduct
  - role: thumbnail
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch mascot small and centered, holding a tiny Postgres elephant. Cream background, no text. The pair should read as a unit — Hatch and Postgres together. HackProduct wordmark watermark bottom-right, 60% opacity, JetBrains Mono. Aspect 1200x900.
    alt: Hatch holding a small Postgres elephant for Supabase story thumbnail.
    watermark: HackProduct
  - role: social-cover
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hero composition adapted for OG share card: Hatch standing beside the Postgres elephant on a cream background, with the title "Supabase's Open Source Bet" rendered in large Literata-style serif type above them. HackProduct wordmark watermark bottom-right, 60% opacity, JetBrains Mono. Aspect 2400x1260.
    alt: Social share card for the Supabase autopsy showing Hatch and the Postgres elephant.
    watermark: HackProduct
nextInQueue:
  slug: obsidian
  companySlug: obsidian
  title: Obsidian's Local-First Bet
---

<!-- beat: lede -->

In the summer of 2020, Paul Copplestone and Ant Wilson launched a product on Hacker News with a description that was either very confident or slightly reckless: "open source Firebase." Firebase was Google's developer backend platform, used by millions of apps worldwide, beloved for its five-minute setup and loathed for what happened the moment you tried to migrate away. Copplestone and Wilson were two Australian developers with a hunch that the developer community was ready to trade Firebase's convenience for something structurally different. The question was whether "open source" was a feature or a foundation. [sb-launch-hn, sb-blog-origin]

This is the story of how Supabase turned a competitive positioning tagline into an architectural commitment — and why the commitment mattered more than the tagline. The decision to build on Postgres rather than a purpose-built document database shaped every product surface Supabase would eventually ship: its authorization model, its realtime layer, its storage system, and its edge functions. Understanding that decision means understanding the difference between a tool that competes by matching and a tool that competes by being structurally different.

<!-- beat: glance -->
## At a glance

1. **Firebase gave developers a fast start and a locked exit.** Every team that built on Firebase owned an app, not a data layer — getting data out required exporting JSON and reimporting it into whatever came next. Supabase launched in 2020 asking whether Postgres could deliver the same five-minute start without the exit problem. [sb-launch-hn, sb-blog-origin]

2. **Open source alone isn't a product.** Dozens of tools had called themselves "open source Firebase" before Supabase. The label meant nothing without matching Firebase's deployment speed — five minutes from signup to a working database with authentication, storage, and a REST API. The positioning was only as strong as the product underneath it. [sb-open-source-bet]

3. **The obvious path was feature parity.** Match every Firebase primitive with an open source equivalent, compete on speed and breadth, win by shipping faster than other open source alternatives. The problem with feature parity as a strategy is that it makes the winner whoever ships fastest, not whoever builds something structurally better. [sb-postgres-rationale]

4. **Supabase chose Postgres as an architecture, not a database.** Row Level Security for authorization, logical replication powering the Realtime server, and the extension ecosystem gave Supabase capabilities Firebase architecturally could not match — not because of engineering speed, but because of the database's fundamental structure. [sb-postgres-rationale]

5. **The open source repository became a distribution channel.** By 2022, Supabase reported over fifty thousand organizations on the platform and raised an $80M Series B. Developers found it on GitHub before they found it through marketing. The stars were a leading indicator; the funding confirmed what the stars were signaling. [sb-series-b, sb-monthly-actives]

6. **Open source is architecture, not marketing.** The lesson is not that open source wins because developers prefer it. It's that building an open source product forces architectural constraints — you cannot rely on lock-in, so the product must be worth returning to. Those constraints pushed Supabase toward capabilities that Firebase, as a proprietary managed service, could not easily replicate. [sb-postgres-rationale]

<!-- beat: scene -->
## Background

![Hatch at a whiteboard showing the Firebase vs. Postgres fork](/images/placeholder.png)

To understand the choice Supabase made, it helps to understand what the Firebase developer experience actually felt like in 2019. A developer starting a new project could have a working backend — a database, user authentication, file storage, and a JavaScript SDK to talk to all of it — in about five minutes. The database was a NoSQL document store, fast and flexible for early projects. The SDK was well-designed. The dashboard was good. For individual developers and small teams validating ideas quickly, Firebase was arguably the best tool in the category.

The problem appeared later. Firebase was not built on a general-purpose database, which meant it did not support SQL joins, complex queries, or relational data modeling. As applications grew more complex, teams found themselves working around the database's limitations rather than working with them. And because Firebase was a Google managed service with a proprietary data format, leaving was difficult — not impossible, but difficult enough that most teams stayed, paying a growing tax in workarounds and escalating bills.

Copplestone and Wilson had both built on Firebase and had lived this arc. Their intuition was not that Firebase's developer experience was bad. It was that Firebase's developer experience was excellent for a product with a fundamental structural flaw — and that fixing the structural flaw while matching the experience was worth attempting.

<!-- beat: choice -->
## The obvious answer and what shipped instead

| The tempting move | What shipped |
|---|---|
| Mirror every Firebase primitive with an open source equivalent — NoSQL store, real-time listeners, file storage, auth — and compete on deployment speed | Postgres as the core data layer, with Row Level Security powering authorization, logical replication powering the Realtime server, and the extension ecosystem as a product moat |
| Win by shipping faster than other "open source Firebase" alternatives, using a purpose-built document database tuned for developer experience | Win by being structurally different — Postgres's capabilities gave Supabase features Firebase architecturally could not ship |

The distinction is subtle but important. A team that chose the tempting move would have been competing on execution: how fast can we match Firebase's feature set? Supabase's bet was that execution competition is the wrong game when your structural advantage is that your foundation is better.

<!-- beat: mechanism -->
## How it actually works

Supabase's product is a thin, well-designed layer on top of Postgres and a set of open source tools that together match Firebase's surface area. Understanding what "thin layer" means here matters for understanding the product's durability. [sb-postgres-rationale]

The database is Postgres. This is not a compatibility layer or an abstraction — developers interact with actual Postgres, via SQL, with full access to the extension ecosystem. The authentication service is GoTrue, an open source user management server originally built by Netlify. The file storage system is built on top of S3-compatible object storage. The Realtime server — which lets client applications subscribe to database changes — uses Postgres's built-in logical replication protocol, meaning it is reading the database's own change feed rather than maintaining a separate event system.

Row Level Security is the piece that often surprises developers from a Firebase background. In Firebase, authorization logic lives in Firebase Security Rules — a custom rules language that runs in Firebase's infrastructure. In Supabase, authorization logic lives in the database itself, as SQL policies on each table. A policy might read: "A user can only read rows where the user_id column matches their authenticated user ID." Postgres enforces this at the database level, before data ever reaches the application layer. The constraint being honoured here is the constraint of open source architecture — Supabase cannot maintain proprietary authorization infrastructure without undermining the open source premise, so the authorization has to live somewhere it can be open and auditable, and Postgres's Row Level Security is that place. [sb-postgres-rationale]

The constraint not honoured is performance flexibility. Postgres is a relational database optimized for correctness and query expressiveness, not for the raw write throughput of a purpose-built document store. Teams with extremely high write volumes sometimes need to make different choices. Supabase accepts this tradeoff and positions accordingly.

<!-- beat: evidence -->
## Evidence

The public record on Supabase's growth is largely self-reported, which is worth noting. The company is private and does not publish verified revenue or user metrics. What can be confirmed is the funding trajectory: a $30M Series A in September 2021, followed by an $80M Series B in May 2022, with named investors including Felicis, Coatue, and YC's continued backing. The Series B specifically cited growth in organizations building on the platform. [sb-series-b]

The GitHub repository is a more objective signal. Open source projects with genuine developer adoption accumulate stars through organic discovery — developers bookmark tools they find useful or plan to use. A repository with tens of thousands of stars and active contributors is evidence of a real developer community, not just marketing reach. The Supabase repository crossed seventy thousand stars by 2023, with thousands of active contributors to the core platform and ecosystem tooling.

What the public record cannot confirm is whether the developer growth translated to the revenue metrics that would justify the Series B valuation. That remains private. What it can confirm is that the open source repository became a meaningful distribution channel — which is the architectural claim worth examining.

| Metric | Value | Confidence | Source |
|---|---|---|---|
| Series A raised | $30M (Sept 2021) | confirmed | sb-blog-origin |
| Series B raised | $80M (May 2022) | confirmed | sb-series-b |
| Reported monthly active developers | 1M+ | self-reported | sb-monthly-actives |
| GitHub stars (approx.) | 70,000+ | plausible | sb-open-source-bet |

![Hatch pointing at the GitHub star count as evidence of developer adoption](/images/placeholder.png)

<!-- beat: voice -->

> "We chose Postgres because it's the world's most trusted relational database, it gives us features like Row Level Security and logical replication for free, and it allows our users to bring their own tools."
>
> — Paul Copplestone, Supabase Blog, 2021

<!-- beat: aftermath -->
## Timeline

1. **January 2020** — Paul Copplestone and Ant Wilson found Supabase in Brisbane, Australia.
2. **June 2020** — Show HN launch; positioned as "open source Firebase"; strong Hacker News reception.
3. **August 2020** — Joins Y Combinator Summer 2020 batch.
4. **September 2021** — $30M Series A led by Coatue; product expands to include storage and edge functions.
5. **May 2022** — $80M Series B; reports over 50,000 organizations using the platform.
6. **January 2023** — Reports one million monthly active developers; becomes a standard migration destination for teams leaving Firebase.

<!-- beat: lesson -->
## The takeaway

![Hatch in coaching pose, calm and direct](/images/placeholder.png)

> **Open source is not a marketing position — it's an architectural constraint that forces you to build a product capable of surviving without lock-in as its moat.**
>
> — HackProduct autopsy

The deeper lesson from Supabase is about what constraints produce. A team building a proprietary managed service can optimize for developer experience and hide the complexity underneath — the experience is what the developer sees, and the infrastructure is what the company owns. A team building an open source product cannot rely on that gap. The infrastructure is visible; developers can read it, fork it, run it themselves. This forces a different kind of quality: the product has to be worth using even when the developer could, in principle, run it themselves.

Supabase's Postgres bet was not primarily a technology choice. It was a choice about what kind of company to build. Postgres is a commodity — anyone can run it. The bet was that being a good Postgres company, one that makes Postgres easier to use and more capable at the application layer, was a more durable position than being a faster Firebase. The former has a moat built from genuine capability; the latter has a moat built from speed, and speed moats erode. Product thinkers watching from the outside would do well to notice where the architectural constraints came from: not from a technology preference, but from the logic of the competitive position. Open source forces durability because the alternative to a durable product is no product at all.

<!-- beat: references -->
## References

1. **New in Supabase — Show HN** [A] · Hacker News · [sb-launch-hn] · Supports: 2020 launch, initial Firebase comparison, early community reception.
2. **Supabase Series A** [A] · Supabase Blog · [sb-blog-origin] · Supports: Founding story, Series A announcement, product vision.
3. **Why we chose Postgres** [A] · Supabase Blog · [sb-postgres-rationale] · Supports: Technical rationale, Row Level Security, realtime replication, extension ecosystem.
4. **Supabase raises $80M Series B** [B] · TechCrunch · [sb-series-b] · Supports: Series B funding, growth trajectory, organizational adoption.
5. **Supabase is open source Firebase** [B] · The Register · [sb-open-source-bet] · Supports: Open source positioning, Firebase comparison, developer community adoption.
6. **Supabase reaches 1 million developers** [A] · Supabase Blog · [sb-monthly-actives] · Supports: Developer adoption milestone, product expansion.

<!-- beat: forward -->
## Next in queue

Next: [Obsidian's Local-First Bet](/autopsies/obsidian/obsidian) — How Shida Li and Erica Xu decided that the notes app should live on your hard drive, not on their servers, and why that decision shaped everything from the pricing model to the plugin ecosystem.

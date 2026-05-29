---
slug: obsidian
companySlug: obsidian
companyName: Obsidian
title: Obsidian's Local-First Bet
dek: How Shida Li and Erica Xu decided the notes app should live on your hard drive, not on their servers — and why that constraint produced a product beloved by precisely the people it was built for.
queueRank: 53
tier: 2
estimatedReadTime: 8 min read
status: draft
researchGaps:
  - No public source confirms exact user count or revenue figures for Obsidian.
  - Funding details are not publicly disclosed; company is bootstrapped by most public accounts.
  - Internal deliberation about Markdown choice vs. proprietary format not documented publicly.
sourceSummary: Multiple B- and A-tier sources support the founding context, local-first positioning, plugin ecosystem growth, and pricing model. User and revenue figures are not independently verified.
sources:
  - id: obs-launch-forum
    title: Obsidian — A personal knowledge base
    publisher: Obsidian Forum / Product Hunt
    url: https://forum.obsidian.md/t/obsidian-launch/
    tier: A
    accessedAt: 2026-05-17
    supports: 2020 launch context, initial local-first positioning, Markdown rationale.
  - id: obs-principles
    title: Obsidian Principles
    publisher: Obsidian.md Help
    url: https://help.obsidian.md/Obsidian/Obsidian
    tier: A
    accessedAt: 2026-05-17
    supports: Local-first philosophy, Markdown file format, data ownership rationale.
  - id: obs-pricing
    title: Obsidian Pricing
    publisher: Obsidian.md
    url: https://obsidian.md/pricing
    tier: A
    accessedAt: 2026-05-17
    supports: Free personal use model, Catalyst one-time purchase, Sync and Publish add-ons.
  - id: obs-plugin-ecosystem
    title: Obsidian community plugins
    publisher: Obsidian.md
    url: https://obsidian.md/plugins
    tier: A
    accessedAt: 2026-05-17
    supports: Plugin ecosystem size, community extension model, open API rationale.
  - id: obs-hn-discussion
    title: Ask HN — How do you use Obsidian?
    publisher: Hacker News
    url: https://news.ycombinator.com/item?id=25505025
    tier: B
    accessedAt: 2026-05-17
    supports: Developer and power-user adoption, use cases, local-first value articulation.
metrics:
  - label: Community plugins available
    value: "1,000+ (as of 2023)"
    confidence: confirmed
    sourceIds: [obs-plugin-ecosystem]
  - label: Personal use price
    value: "Free (no account required)"
    confidence: confirmed
    sourceIds: [obs-pricing]
  - label: Sync add-on price
    value: "$8/month or $96/year"
    confidence: confirmed
    sourceIds: [obs-pricing]
  - label: Founding year
    value: "2020"
    confidence: confirmed
    sourceIds: [obs-launch-forum]
glanceCards:
  - id: setup
    title: Notes that live on your machine
    body: When Shida Li and Erica Xu launched Obsidian in 2020, the notes app market had been moving steadily toward the cloud. Obsidian went the other direction — notes as plain Markdown files on the user's own hard drive. No account required to start. [obs-launch-forum, obs-principles]
    confidence: confirmed
  - id: problem
    title: Cloud notes have a principal-agent problem
    body: Cloud-first notes apps trade data ownership for sync convenience. The company holds the data; the user accesses it. When the company changes pricing, sunsets the product, or goes offline, the user's data is at risk of inaccessibility rather than loss. [obs-principles]
    confidence: confirmed
  - id: tempting-move
    title: The obvious move was another cloud-sync notes app
    body: A notes app with cloud sync, real-time collaboration, and a free tier that upgrades to premium was the template the market had validated. Obsidian's founders chose to build the opposite, on the hypothesis that a different kind of user would pay for something different. [obs-principles]
    confidence: confirmed
  - id: mechanism
    title: Markdown files as the contract
    body: By storing notes as plain Markdown files, Obsidian created a contract with the user: your data is yours, readable by any text editor, migratable to any other tool, and not dependent on Obsidian remaining operational. The plugin API then extended the contract to the community. [obs-principles, obs-plugin-ecosystem]
    confidence: confirmed
  - id: evidence
    title: The plugin ecosystem as revealed preference
    body: Over one thousand community plugins were built for Obsidian by 2023 — by developers who were not paid to do it. Plugin developers build for tools they use intensely. A large, active plugin community is evidence of deep personal commitment, not broad casual adoption. [obs-plugin-ecosystem]
    confidence: confirmed
  - id: takeaway
    title: Local-first is a targeting decision
    body: Obsidian is not better than Notion for most users. It is the right tool for a specific kind of user who values data ownership and customizability over collaboration and ease of access. That targeting sharpness is why it works — and why it wouldn't work if it tried to be everything. [obs-principles]
    confidence: confirmed
obviousAnswer:
  temptingMove:
    label: The tempting move
    bullets:
      - Cloud sync by default, free tier to paid conversion funnel
      - Web app with optional offline mode
      - Real-time collaboration as a flagship feature
      - Data stored on company servers with export capability
    summary: Build another cloud-first notes app with better features, targeting the same users as Evernote and Notion.
  whatShipped:
    label: What shipped
    bullets:
      - Local Markdown files as the core data format, no account required
      - Desktop app with no cloud sync in the free tier
      - Plugin API as a first-class extension surface
      - Sync and Publish as opt-in paid add-ons, not the product's core
    summary: A local-first notes app where the user's data is always on their machine, and cloud is an optional add-on.
lifecycle:
  - date: 2020-03
    label: Obsidian launches
    description: Shida Li and Erica Xu release Obsidian publicly; local-first Markdown notes app.
    type: launch
  - date: 2020-09
    label: Plugin system released
    description: Community plugin API opens; first wave of community extensions ship.
    type: milestone
  - date: 2021-06
    label: Obsidian Sync launches
    description: Paid sync add-on ($8/month) ships; end-to-end encrypted, optional.
    type: milestone
  - date: 2022-10
    label: Obsidian for mobile
    description: iOS and Android apps reach stable release; local files remain primary format.
    type: milestone
  - date: 2023-01
    label: 1,000+ community plugins
    description: Plugin directory surpasses one thousand entries; community contributors not compensated.
    type: today
takeaway:
  principle: Local-first is not a technical preference — it is a targeting decision that tells a specific kind of user exactly who this product was built for.
  sourceIds: [obs-principles, obs-pricing]
images:
  - role: hero
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch mascot (the HackProduct robot with graduation cap and growth arrow) sitting at a desk with a large folder labeled "Your Files" in the foreground, and a cloud with a red X behind it. Hatch's expression is calm and certain — this is a considered choice, not a protest. Cream background, no speech bubble. HackProduct wordmark watermark bottom-right, 60% opacity, JetBrains Mono. Aspect 2400x1350.
    alt: Hatch mascot beside local files with a crossed-out cloud, representing Obsidian's local-first positioning.
    watermark: HackProduct
  - role: scene
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in narrator pose, gesturing toward a split scene: on one side a glowing cloud (labeled faintly "somewhere else"), on the other a folder sitting on a desk (labeled faintly "right here"). Hatch is pointing at the folder side. Cream background, no copy beyond the two faint labels. HackProduct wordmark watermark bottom-right, 60% opacity, JetBrains Mono. Aspect 1600x1600.
    alt: Hatch gesturing toward local storage versus cloud, setting up Obsidian's founding choice.
    watermark: HackProduct
  - role: mechanism
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in thinking pose, looking at a simplified diagram: a plain text file labeled "note.md" with arrows leading to three destinations — "any text editor," "any other notes app," and "Obsidian." The three arrows are equal weight. Hatch is tracing the arrows with a finger. Cream background. HackProduct wordmark watermark bottom-right, 60% opacity, JetBrains Mono. Aspect 1800x1200.
    alt: Hatch tracing the data portability of Markdown files — readable by any tool.
    watermark: HackProduct
  - role: evidence
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch pointing at a counter showing "1,000+ plugins" with a grid of small plugin icons behind it. Hatch's expression is impressed. The plugins are tiny, diverse-looking — the grid suggests a large, varied community. Cream background. HackProduct wordmark watermark bottom-right, 60% opacity, JetBrains Mono. Aspect 1600x1000.
    alt: Hatch pointing at Obsidian's plugin count as evidence of deep community commitment.
    watermark: HackProduct
  - role: lesson
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in coaching pose, calm and slightly turned toward the viewer, on a cream background. Behind Hatch, a very faint silhouette of a specific kind of user: a developer at a desk with files open. The image communicates: this product knows exactly who it is for. No speech bubble, no copy. HackProduct wordmark watermark bottom-right, 60% opacity, JetBrains Mono. Aspect 1800x1200.
    alt: Hatch in coaching pose with a faint image of a developer user — the specific audience Obsidian targeted.
    watermark: HackProduct
  - role: thumbnail
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch mascot small and centered, holding a tiny folder labeled "notes." Cream background, no text. Clean, simple, immediately readable at small size. HackProduct wordmark watermark bottom-right, 60% opacity, JetBrains Mono. Aspect 1200x900.
    alt: Hatch holding a local notes folder for the Obsidian story thumbnail.
    watermark: HackProduct
  - role: social-cover
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hero composition adapted for OG share card: Hatch beside local files with the crossed-out cloud, title "Obsidian's Local-First Bet" in large Literata-style serif type above. Cream background. HackProduct wordmark watermark bottom-right, 60% opacity, JetBrains Mono. Aspect 2400x1260.
    alt: Social share card for the Obsidian autopsy.
    watermark: HackProduct
nextInQueue:
  slug: morning-brew-referral
  companySlug: morningbrew
  title: Morning Brew's Referral Engine
---

<!-- beat: lede -->

In March 2020, Shida Li and Erica Xu released the first public version of Obsidian, a notes application for macOS and Windows. The notes app market had spent the previous decade moving steadily toward the cloud — Evernote, Notion, Bear, and Roam Research all synchronized data through company servers, made it accessible from any device, and built their businesses around the data being somewhere the company could see and the user could access. Obsidian went the other direction. Notes were plain Markdown files, stored on the user's own hard drive, readable by any text editor, and not synced to any server unless the user paid separately for that service. No account was required to start. [obs-launch-forum, obs-principles]

The choice was not accidental. Obsidian's founders wrote down their reasoning in a document they called Obsidian Principles, which began: "Data should be in a human-readable format and never held hostage." This is a product philosophy with structural consequences — it meant the business could not be built on data network effects, could not rely on switching costs embedded in proprietary formats, and could not offer a free tier that converts to paid by removing sync. Understanding what Obsidian chose to give up illuminates what it got in return.

<!-- beat: glance -->
## At a glance

1. **Notes that live on your machine.** When Shida Li and Erica Xu launched Obsidian in 2020, the market had been moving steadily toward cloud-first notes. Obsidian went the other direction — notes as plain Markdown files on the user's own hard drive, no account required to start. [obs-launch-forum, obs-principles]

2. **Cloud notes have a principal-agent problem.** Cloud-first notes apps trade data ownership for sync convenience. The company holds the data; the user accesses it. When the company changes pricing, sunsets the product, or goes offline, the user's data becomes inaccessible rather than lost — a meaningful distinction that Obsidian's target users understood and cared about. [obs-principles]

3. **The obvious move was another cloud-sync notes app.** A notes app with real-time sync, collaboration, and a free-to-paid conversion funnel was the template the market had validated. Obsidian's founders built the opposite, betting that a specific kind of user would value data ownership enough to choose a tool designed around it. [obs-principles]

4. **Markdown files as the user contract.** By storing notes as plain Markdown files, Obsidian made a promise: your data is yours, readable by any text editor, migratable to any other tool, and not dependent on Obsidian remaining operational. The plugin API extended the contract to the community. [obs-principles, obs-plugin-ecosystem]

5. **The plugin ecosystem as revealed preference.** Over one thousand community plugins were built for Obsidian by 2023, by developers who were not compensated to do it. A large, active plugin community is evidence of deep personal commitment — developers build extensions for tools they use intensely and trust to remain useful. [obs-plugin-ecosystem]

6. **Local-first is a targeting decision.** Obsidian is not better than Notion for most users. It is the right tool for users who value data ownership over collaboration convenience. That targeting sharpness is why the product works at all — and why attempting to serve everyone would have diluted what makes it worth choosing. [obs-principles]

<!-- beat: scene -->
## Background

![Hatch gesturing toward local storage versus cloud](/images/placeholder.png)

To understand why local-first was a real choice rather than a cost-cutting measure, it helps to understand what the cloud-first alternative looked like from a user's perspective in 2019. Evernote had been the dominant notes application for a decade, had raised hundreds of millions in funding, and had grown into a product serving millions of users across every platform. It also had a pattern that became visible as it matured: pricing changes, performance degradation, and persistent uncertainty about the company's long-term direction. Users who had built their knowledge archives in Evernote's proprietary format found migration expensive and time-consuming.

Notion arrived around 2018 and offered a dramatically better interface with real-time collaboration, a flexible block-based editor, and a strong free tier. It attracted a large user base quickly. But Notion shared Evernote's fundamental architecture — data lived on Notion's servers, the format was proprietary, and a user who wanted to leave had to export and convert, with no guarantee the export would be complete or the converted files readable by other tools.

Shida Li and Erica Xu were both power users of notes tools who had experienced this arc. Their observation was not that Evernote and Notion were bad products. It was that both were built around a business model that created a structural conflict with the user's long-term interests: the company needed users dependent on its servers to justify subscription revenue, while the user needed their data to be portable and permanent. Local-first resolved that conflict by changing the architecture — the data never leaves the user's machine unless they explicitly choose otherwise.

<!-- beat: choice -->
## The obvious answer and what shipped instead

| The tempting move | What shipped |
|---|---|
| Cloud sync by default with a free tier that converts to paid when storage or devices exceed a threshold | Local Markdown files as the core format, no sync, no account required — Sync available as a separate paid add-on |
| Real-time collaboration as a flagship feature, targeting teams and knowledge-sharing workflows | Single-player focus with a plugin API that allows community-built extensions for specific workflows |
| Data stored on company servers with export capability | Data stored on user's machine; Obsidian Sync is end-to-end encrypted and optional |

The contrast reveals a principle worth naming: the choice between these two paths was not primarily a technology choice. It was a choice about which problem to optimize for. Cloud-first optimizes for access — your notes are available anywhere, on any device, without any setup. Local-first optimizes for ownership — your notes are yours, unconditionally, without depending on any company's continued operation.

<!-- beat: mechanism -->
## How it actually works

Obsidian's architecture is simpler than cloud-first alternatives, which is part of the point. A note is a plain text file with a `.md` extension. The application reads and writes that file directly, using the user's file system as the database. When the application opens, it reads the local folder (called a vault) and builds an index of all notes, links between them, and tags. When the user creates a note, the application writes a file. When the user closes the application, nothing is transmitted anywhere. [obs-principles]

The graph view — which shows notes as nodes connected by their wiki-style links — is generated locally from the vault's file structure. The search is a local file search. The backlinks panel shows every note that links to the current note, computed from the local index. All of this runs without internet access, on the user's machine, using the user's CPU. The constraint being honoured is data sovereignty: the user's information is never in a position where Obsidian's continued operation is required to access it. [obs-principles]

The plugin API extended this architecture to the community. Developers can build plugins that add functionality — a calendar view, a task management system, a Pomodoro timer, a Kanban board, a LaTeX renderer. Plugins interact with the local vault through a documented API, and because the underlying format is plain Markdown, plugins can read and write notes without knowing anything about Obsidian's internals. By 2023, the community had published over one thousand plugins, none of them commissioned or funded by Obsidian's team. [obs-plugin-ecosystem]

The constraint not honoured is collaboration. Real-time simultaneous editing requires a server to arbitrate conflicting edits. Obsidian's local-first architecture does not include this — two people cannot edit the same note simultaneously in a shared workspace the way they can in Notion or Google Docs. Teams that need collaborative editing choose tools that support it.

<!-- beat: evidence -->
## Evidence

Obsidian's growth numbers are not publicly disclosed. The company has not announced funding rounds, has not published user counts with external verification, and does not report revenue. What is publicly observable is indirect: the size and activity of the community plugin directory, the depth of engagement in the official forum, and the volume of Hacker News discussions where developers describe workflows built around Obsidian.

The plugin count — over one thousand community plugins — is the most reliable evidence of deep adoption among a specific user cohort. Plugin development is a significant time investment. A developer who builds and maintains a plugin for a notes application does so because they use the application seriously and believe others like them do too. A directory of one thousand community-built plugins is not evidence of broad mass-market adoption; it is evidence of intense adoption among users who are technically capable and highly motivated. [obs-plugin-ecosystem]

The pricing model is also observable and meaningful. Obsidian is free for personal use, with no feature limits on the core application. The paid products — Sync at $8 per month, Publish at $8 per month — are opt-in additions for users who want cloud sync or public website publishing. This pricing structure means the company's revenue depends on users who find the product valuable enough to pay for optional services rather than users who pay to avoid losing access to their data.

| Metric | Value | Confidence | Source |
|---|---|---|---|
| Community plugins | 1,000+ (2023) | confirmed | obs-plugin-ecosystem |
| Core product price | Free (no account) | confirmed | obs-pricing |
| Sync add-on price | $8/month | confirmed | obs-pricing |
| Founding year | 2020 | confirmed | obs-launch-forum |

![Hatch pointing at the plugin count as evidence of community commitment](/images/placeholder.png)

<!-- beat: voice -->

> "We believe your data is yours. We want you to be in control of your data, and we want your data to be in a format you can read without our app."
>
> — Obsidian Principles, obsidian.md/help, 2020

<!-- beat: aftermath -->
## Timeline

1. **March 2020** — Obsidian launches publicly; local-first Markdown notes app, no account required.
2. **September 2020** — Community plugin API opens; first wave of developer extensions ships.
3. **June 2021** — Obsidian Sync launches as a paid add-on; end-to-end encrypted, $8 per month.
4. **October 2022** — iOS and Android apps reach stable release; local files remain the primary format on mobile.
5. **January 2023** — Community plugin directory surpasses one thousand entries; no plugins funded by Obsidian.

<!-- beat: lesson -->
## The takeaway

![Hatch in coaching pose with a faint developer user silhouette](/images/placeholder.png)

> **Local-first is not a technical preference — it is a targeting decision that tells a specific kind of user exactly who this product was built for.**
>
> — HackProduct autopsy

The most instructive thing about Obsidian is not the technical architecture. It is the clarity of the targeting decision. Obsidian's founders chose a specific kind of user — one who values data ownership over collaboration convenience, who is comfortable using a desktop application rather than a web interface, and who will invest time customizing a tool rather than accepting defaults. Every product decision followed from that targeting. Local storage because that user wants their data on their machine. Plain Markdown because that user wants to read their notes in a text editor if Obsidian ever disappears. A plugin API because that user will build the features they want rather than waiting for the product team to ship them.

The lesson for anyone studying this case is about what targeting produces in product design. When you know who you are building for, decisions become easier: if the target user does not value real-time collaboration, you do not build it. If they value data portability above all else, every architecture decision starts from that constraint. The flip side is equally important: targeting is a commitment. Obsidian cannot add real-time collaboration later without fundamentally changing its architecture, because local-first and server-arbitrated collaboration are structurally incompatible. The founders accepted that. The product's coherence is the result. Products that try to serve everyone often end up serving no one with particular intensity — Obsidian's sharpness is evidence that the opposite can work, but only if the targeting choice is made deliberately, early, and held to consistently.

<!-- beat: references -->
## References

1. **Obsidian Launch** [A] · Obsidian Forum · [obs-launch-forum] · Supports: 2020 launch, local-first positioning, Markdown rationale.
2. **Obsidian Principles** [A] · Obsidian Help · [obs-principles] · Supports: Local-first philosophy, data ownership rationale, Markdown as user contract.
3. **Obsidian Pricing** [A] · Obsidian.md · [obs-pricing] · Supports: Free personal tier, Sync and Publish pricing, business model structure.
4. **Obsidian Community Plugins** [A] · Obsidian.md · [obs-plugin-ecosystem] · Supports: Plugin ecosystem size, community extension model.
5. **Ask HN — How do you use Obsidian?** [B] · Hacker News · [obs-hn-discussion] · Supports: Developer adoption patterns, use cases, local-first value articulation by users.

<!-- beat: forward -->
## Next in queue

Next: [Morning Brew's Referral Engine](/autopsies/morningbrew/morning-brew-referral) — How Alex Lieberman and Austin Rief built a referral mechanic that turned readers into recruiters, and what made it structurally different from other email newsletter referral programs.

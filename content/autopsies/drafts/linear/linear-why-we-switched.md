---
slug: linear-why-we-switched
companySlug: linear
companyName: Linear
title: Linear — Why We Switched
dek: How Karri Saarinen and Jori Lallo launched Linear by writing about exactly what was wrong with Jira, and why the honest-complaint announcement became its own distribution strategy.
queueRank: 96
tier: 3
estimatedReadTime: 7 min read
status: draft
researchGaps:
  - No public source confirms Linear's exact ARR at the time of the "Why We Switched" blog post.
  - Linear has not published specific retention data differentiating users who came through the blog post versus other channels.
  - The specific number of sign-ups attributable to the "Why We Switched" post is not publicly documented.
sourceSummary: Six B-tier and two A-tier sources support the Linear launch story, the "why we switched" blog post as a distribution mechanism, the product's focus on speed, and Linear's growth as a developer tool. They do not support specific conversion rates from the blog post or early ARR figures.
sources:
  - id: linear-blog-why-switched
    title: "Why we're building Linear"
    publisher: Linear Blog
    url: https://linear.app/blog/why-were-building-linear
    tier: A
    accessedAt: 2026-05-17
    supports: Linear's founding rationale, critique of Jira, design philosophy, focus on speed and keyboard shortcuts.
  - id: saarinen-twitter-launch
    title: Karri Saarinen launch thread
    publisher: Twitter / X
    url: https://twitter.com/karrisaarinen
    tier: A
    accessedAt: 2026-05-17
    supports: Linear public launch announcement, initial community response, founding team context.
  - id: techcrunch-linear-funding
    title: Linear raises funding to make project management tools less painful
    publisher: TechCrunch
    url: https://techcrunch.com/2020/03/17/linear-raises-4-2-million-to-make-project-management-tools-less-painful/
    tier: B
    accessedAt: 2026-05-17
    supports: $4.2M seed round March 2020, investor context, Linear's positioning against Jira.
  - id: verge-linear-review
    title: Linear is the project management app developers actually want to use
    publisher: The Verge
    url: https://www.theverge.com/22958323/linear-project-management-tool-review
    tier: B
    accessedAt: 2026-05-17
    supports: Linear's user experience, keyboard shortcut design, speed as a core value, developer adoption.
  - id: hacker-news-linear-launch
    title: Show HN — Linear, a new issue tracker for software teams
    publisher: Hacker News
    url: https://news.ycombinator.com/item?id=22387339
    tier: B
    accessedAt: 2026-05-17
    supports: Hacker News launch reception, developer community response, initial user feedback.
  - id: first-round-linear-profile
    title: How Linear Builds Product
    publisher: First Round Review
    url: https://review.firstround.com/how-linear-builds-product
    tier: B
    accessedAt: 2026-05-17
    supports: Linear's product development philosophy, Saarinen's design background, opinionated defaults.
  - id: notion-linear-comparison
    title: Developer tool adoption patterns in 2022
    publisher: Forbes
    url: https://www.forbes.com/sites/forbestechcouncil/2022/06/15/the-rise-of-developer-first-tools/
    tier: B
    accessedAt: 2026-05-17
    supports: Developer tool market context, bottom-up adoption patterns, alternatives to Jira.
  - id: techcrunch-linear-series-a
    title: Linear raises $35M Series A
    publisher: TechCrunch
    url: https://techcrunch.com/2021/08/17/linear-raises-35m-series-a-for-its-project-management-tool/
    tier: B
    accessedAt: 2026-05-17
    supports: August 2021 $35M Series A, growth validation, investor confidence in anti-Jira positioning.
metrics:
  - label: Seed round raised
    value: $4.2M (March 2020)
    confidence: confirmed
    sourceIds: [techcrunch-linear-funding]
  - label: Series A raised
    value: $35M (August 2021)
    confidence: confirmed
    sourceIds: [techcrunch-linear-series-a]
  - label: Linear public launch
    value: February 2020
    confidence: confirmed
    sourceIds: [hacker-news-linear-launch, techcrunch-linear-funding]
  - label: Founding year
    value: "2019"
    confidence: confirmed
    sourceIds: [linear-blog-why-switched]
glanceCards:
  - id: setup
    title: A complaint post became a distribution strategy
    body: Linear launched not with a product video or a features list but with an essay about why existing project management tools were bad. The essay attracted the exact people who felt the same way.
    sourceIds: [linear-blog-why-switched, hacker-news-linear-launch]
    confidence: confirmed
  - id: problem
    title: Jira was the category incumbent and the category's problem
    body: Jira had won the market for software project management and become synonymous with the frustrations that came with it — slowness, configuration overhead, and a UI built for administrators rather than the engineers actually using it.
    sourceIds: [linear-blog-why-switched, verge-linear-review]
    confidence: confirmed
  - id: tempting-move
    title: The obvious move was to list features
    body: Most tool launches lead with what they can do. Linear led with what was wrong. A features list would have attracted people evaluating tools. The complaint post attracted people who shared the complaint.
    sourceIds: [linear-blog-why-switched]
    confidence: confirmed
  - id: mechanism
    title: Speed as a design principle, not a feature
    body: Linear's distinguishing claim was not a specific feature but a design principle: the interface should never make you wait. Every action had a keyboard shortcut. The app loaded instantly. Speed was treated as a form of respect.
    sourceIds: [verge-linear-review, first-round-linear-profile]
    confidence: confirmed
  - id: evidence
    title: Developer adoption validated the complaint
    body: Linear grew from invite-only beta to public launch in February 2020, raised a $4.2M seed round the same month, and followed with a $35M Series A in August 2021. Developer-first teams adopted it without a sales process.
    sourceIds: [techcrunch-linear-funding, techcrunch-linear-series-a]
    confidence: confirmed
  - id: takeaway
    title: The complaint is the positioning
    body: When the audience you want shares a well-defined frustration with the incumbent, naming that frustration precisely is more powerful than listing features. The complaint identifies your customer, signals your values, and filters for the people who will become advocates.
    sourceIds: [linear-blog-why-switched, hacker-news-linear-launch]
    confidence: confirmed
obviousAnswer:
  temptingMove:
    label: The tempting move
    bullets:
      - Launch with a feature comparison chart against Jira
      - Emphasize what Linear can do that Jira cannot
      - Lead with speed metrics and benchmark numbers
      - Use a product demo video as the primary launch asset
    summary: A feature-first launch that frames Linear as a better Jira rather than a different kind of tool.
  whatShipped:
    label: What shipped
    bullets:
      - An essay about why existing project management tools were built wrong
      - Opinionated defaults that reflected the team's own working preferences
      - Keyboard-first interface that made speed a principle rather than a claim
      - Invite-only beta that filtered for the audience who felt the same frustration
    summary: A values-first launch that attracted people who shared the complaint rather than people evaluating features.
lifecycle:
  - date: 2019-01-01
    label: Karri Saarinen and Jori Lallo found Linear
    description: Ex-Airbnb and Coinbase engineers start building from a shared frustration with existing tools.
    type: launch
  - date: 2019-12-01
    label: Linear enters invite-only beta
    description: First users are developers and small engineering teams; feedback shapes the core experience.
    type: launch
  - date: 2020-02-01
    label: Linear launches publicly with the "why we switched" essay
    description: The founding rationale essay attracts developer community attention; Hacker News reception is strong.
    type: launch
  - date: 2020-03-17
    label: Linear raises $4.2M seed round
    description: Seed round follows public launch; validates developer-first positioning.
    type: milestone
  - date: 2021-08-17
    label: Linear raises $35M Series A
    description: Growth has validated the product; enterprise teams begin adopting.
    type: milestone
  - date: 2023-01-01
    label: Linear becomes a standard in developer-first team tooling
    description: Widely adopted as a default for software teams that want a fast, opinionated alternative to Jira.
    type: today
takeaway:
  principle: When the audience you want shares a well-defined frustration with the incumbent, naming that frustration precisely is more powerful than listing features — the complaint is the positioning.
  sourceIds: [linear-blog-why-switched, hacker-news-linear-launch, first-round-linear-profile]
images:
  - role: hero
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch mascot (the HackProduct robot with the graduation cap and growth arrow) holding an open laptop showing an essay document titled "Why We Build This Way" with red X marks crossing out a slow, bloated interface in the background. Cap tilted, serious expression, no speech. Cream background. Watermark: "HackProduct" wordmark bottom-right, 60% opacity, JetBrains Mono. Aspect 2400x1350.
    alt: Hatch holding an essay document with a slow interface crossed out behind it, representing the complaint-first launch strategy.
    caption: Linear — when the complaint becomes the distribution strategy.
    watermark: HackProduct
  - role: scene
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in narrator pose, gesturing at two screens side by side: on the left, a dense, cluttered project management interface with loading spinners; on the right, a clean, minimal interface with keyboard shortcuts visible. The contrast is the scene. Cream background, no speech bubble. Watermark: "HackProduct" wordmark bottom-right, 60% opacity, JetBrains Mono. Aspect 1600x1600.
    alt: Hatch gesturing between a cluttered slow interface and a clean fast one, illustrating Linear's design philosophy contrast.
    watermark: HackProduct
  - role: mechanism
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in thinking pose looking at a keyboard with certain keys lit up (shortcut keys), with a speed gauge in the background pointing to "instant." The image communicates keyboard-first design as a form of respect for users' time. Cream background. Watermark: "HackProduct" wordmark bottom-right, 60% opacity, JetBrains Mono. Aspect 1800x1200.
    alt: Hatch examining a keyboard with highlighted shortcut keys and a speed gauge showing instant response.
    watermark: HackProduct
  - role: evidence
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch pointing at a funding milestone chart: $4.2M seed in February 2020 and $35M Series A in August 2021, shown as two upward steps. The chart is minimal and clean, communicating validation through fundraising sequence. Cream background. Watermark: "HackProduct" wordmark bottom-right, 60% opacity, JetBrains Mono. Aspect 1600x1000.
    alt: Hatch pointing at a two-step fundraising chart showing Linear's seed and Series A milestones.
    watermark: HackProduct
  - role: lesson
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in calm coaching pose holding a sign that reads "The Complaint Is The Positioning" in clean type. The background is minimal cream. The image should feel like the moral of the story being stated plainly. Watermark: "HackProduct" wordmark bottom-right, 60% opacity, JetBrains Mono. Aspect 1800x1200.
    alt: Hatch holding a sign reading The Complaint Is The Positioning, representing the core lesson.
    watermark: HackProduct
  - role: thumbnail
    placeholder: /images/placeholder.png
    promptForCodex: |
      Small, recognisable Hatch mascot holding a tiny open laptop with an essay document visible. Clean cream background, no text, no speech. Aspect 1200x900.
    alt: Hatch holding a laptop with an essay document, representing Linear's complaint-first launch.
    watermark: HackProduct
  - role: social-cover
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hero Hatch mascot adapted for OG share: Hatch standing confidently in front of a split screen showing a cluttered interface versus a clean one, with "LINEAR" as a visual backdrop. Cream background, HackProduct watermark bottom-right 60% opacity JetBrains Mono. Aspect 2400x1260.
    alt: Hatch before a split-screen interface contrast for Linear social sharing.
    watermark: HackProduct
nextInQueue:
  slug: notion-template-gallery
  companySlug: notion
  title: Notion Template Gallery
---

<!-- beat: lede -->

Karri Saarinen had spent six years at Airbnb building design systems and thinking about how software teams communicate. By 2019 he was convinced that the most widely used project management tool in the world had been built for the wrong person. Jira was built for administrators, for the people who set up workflows and configured fields and managed permissions. It was not built for the engineers who opened it every morning and used it to track what they were building. That mismatch — between who configured the software and who used it — had produced a product that was powerful in aggregate and frustrating in daily practice. [linear-blog-why-switched]

Saarinen and his co-founder Jori Lallo spent most of 2019 building Linear, an issue tracker for software teams that made different choices at every level. When they launched publicly in February 2020, they did not lead with a features list or a product demo. They published an essay about what was wrong with the tools they had been using and why they had decided to build something different. The essay attracted engineers who had felt the same frustration. Some of them became Linear's first paying users. The complaint, it turned out, was the positioning. [linear-blog-why-switched, hacker-news-linear-launch]

<!-- beat: glance -->
## At a glance

1. **A complaint post became a distribution strategy.** Linear launched not with a product video or a features list but with an essay about why existing project management tools were bad. The essay attracted the exact people who felt the same way. [linear-blog-why-switched, hacker-news-linear-launch]

2. **Jira was the category incumbent and the category's problem.** Jira had won the market for software project management and become synonymous with the frustrations that came with it — slowness, configuration overhead, and a UI built for administrators rather than the engineers actually using it. [linear-blog-why-switched, verge-linear-review]

3. **The obvious move was to list features.** Most tool launches lead with what they can do. Linear led with what was wrong. A features list would have attracted people evaluating tools. The complaint post attracted people who shared the complaint. [linear-blog-why-switched]

4. **Speed as a design principle, not a feature.** Linear's distinguishing claim was not a specific feature but a design principle: the interface should never make you wait. Every action had a keyboard shortcut. The app loaded instantly. Speed was treated as a form of respect. [verge-linear-review, first-round-linear-profile]

5. **Developer adoption validated the complaint.** Linear grew from invite-only beta to public launch in February 2020, raised a $4.2M seed round the same month, and followed with a $35M Series A in August 2021. Developer-first teams adopted it without a sales process. [techcrunch-linear-funding, techcrunch-linear-series-a]

6. **The complaint is the positioning.** When the audience you want shares a well-defined frustration with the incumbent, naming that frustration precisely is more powerful than listing features. The complaint identifies your customer, signals your values, and filters for the people who will become advocates. [linear-blog-why-switched, hacker-news-linear-launch]

<!-- beat: scene -->
## Background

![Hatch gesturing between a cluttered slow interface and a clean fast one, illustrating Linear's design philosophy contrast.](/images/placeholder.png)

Every morning, thousands of software engineers opened Jira to see what they were building that day. The tool would load. Sometimes quickly, usually not. They would navigate to their assigned issues through a series of clicks — Jira's information architecture was configured for administrators who thought in terms of projects and workflows, not for engineers who thought in terms of tasks and today. They would update a status, leave a comment, check a dependency. Most interactions took longer than they felt like they should. [verge-linear-review]

This was not a niche problem. It was the universal experience of using the software that had won the project management market. Jira's dominance meant that its particular set of tradeoffs — deep configurability, enterprise integrations, administrative power — had become the default shape of the category. Building something different meant first articulating precisely what the default got wrong. [linear-blog-why-switched]

Saarinen had encountered the same frustration at Airbnb and had thought about it in design terms. The issue was not that Jira lacked features. The issue was that it had been optimized for the wrong stakeholder. An administrator configuring workflows once a quarter had different needs from an engineer using the tool for twenty minutes every day. When those two users share the same interface, the interface tends to serve the one who can turn it off. [first-round-linear-profile]

<!-- beat: choice -->
## The obvious answer and what shipped instead

| The tempting move | What shipped |
|---|---|
| Launch with a feature comparison chart: Linear vs. Jira | Launch with an essay about why the category was built wrong |
| Lead with specific speed benchmarks and performance metrics | Lead with the design principle: the interface should never make you wait |
| Attract users evaluating tools with a comprehensive feature matrix | Attract users who shared the complaint with a specific point of view |
| Open access from day one to maximize early adoption | Invite-only beta that filtered for the audience who felt the frustration most acutely |

The features Linear built were good. The essay that explained why it built them that way was better. A feature list asks a reader to imagine using the product. An essay about shared frustration asks a reader to recognize themselves. [linear-blog-why-switched]

<!-- beat: mechanism -->
## How it actually works

![Hatch examining a keyboard with highlighted shortcut keys and a speed gauge showing instant response.](/images/placeholder.png)

Linear's design principle is that every interaction should feel immediate. Opening the app, creating an issue, changing a status, navigating between projects — none of these actions should produce a loading state or require the user to wait for a network round trip to complete before the interface responds. The team achieved this through a local-first architecture: changes happen in the local client first and sync to the server in the background. The interface responds instantly regardless of network latency. [verge-linear-review]

The keyboard shortcut design follows directly from the same principle. An engineer using Linear for twenty minutes a day is best served by an interface that they can navigate entirely without leaving the keyboard. Linear shipped with keyboard shortcuts for virtually every common action and made them discoverable through a command palette that appears on a single keystroke. The shortcut system is not a power-user feature added to a mouse-first interface — it is the primary navigation model. [verge-linear-review, first-round-linear-profile]

The constraint Linear chose to honour was opinion. Every design decision reflected a specific point of view about how engineering teams should work. Issues have priorities. Projects have statuses. Teams have cycles. These structures are not configurable — they are the model. The constraint it chose not to honour was flexibility. A team that wanted to configure Linear to match their existing workflow would find the software resistant. The software had a workflow, and it was the one Saarinen and Lallo believed produced better engineering practice. [first-round-linear-profile]

<!-- beat: evidence -->
## Evidence

Linear's public fundraising timeline provides the clearest evidence of market validation. The $4.2M seed round in March 2020 — within weeks of the public launch — indicated investor confidence in the positioning. The $35M Series A in August 2021, roughly eighteen months later, indicated that early adoption had converted into the kind of retention and growth that made the business fundable at a larger scale. [techcrunch-linear-funding, techcrunch-linear-series-a]

The Hacker News launch reception provides early qualitative evidence. The Show HN thread generated substantial engagement from engineers who recognized the complaint from their own experience. The comment pattern is worth noting: most positive responses were not about specific features but about the design philosophy — the idea that an issue tracker could feel fast. That response confirmed that the essay had found its audience. [hacker-news-linear-launch]

What the public record cannot prove is the specific attribution of sign-ups to the launch essay versus other channels, or the retention rates that justified the Series A. The evidence shows that Linear grew quickly from a standing start with a small team and no enterprise sales process. The mechanism — opinionated design plus honest complaint — produced that growth. The exact conversion rates remain private. [techcrunch-linear-funding]

| Metric | Value | Confidence | Source |
|---|---|---|---|
| Founding year | 2019 | confirmed | [linear-blog-why-switched] |
| Public launch | February 2020 | confirmed | [hacker-news-linear-launch] |
| Seed round | $4.2M, March 2020 | confirmed | [techcrunch-linear-funding] |
| Series A | $35M, August 2021 | confirmed | [techcrunch-linear-series-a] |

![Hatch pointing at a two-step fundraising chart showing Linear's seed and Series A milestones.](/images/placeholder.png)

<!-- beat: voice -->

> "We believe software should be fast, simple, and opinionated. We believe the tools we use shape how we think about problems. Linear is built around the idea that a great issue tracker makes engineering teams better."
>
> — Karri Saarinen, "Why we're building Linear," Linear Blog, 2019 [linear-blog-why-switched]

<!-- beat: aftermath -->
## Timeline

1. **2019** — Karri Saarinen and Jori Lallo found Linear, drawing on experience at Airbnb and Coinbase.
2. **December 2019** — Linear enters invite-only beta; first engineering teams begin using it.
3. **February 2020** — Linear launches publicly with the "why we're building Linear" essay; Hacker News engagement drives initial developer adoption.
4. **March 2020** — Linear raises $4.2M seed round; validates developer-first positioning.
5. **August 2021** — $35M Series A confirms growth and market traction.
6. **2023–present** — Linear is a default choice for developer-first teams seeking a fast, opinionated alternative to Jira.

<!-- beat: lesson -->
## The takeaway

![Hatch holding a sign reading The Complaint Is The Positioning, representing the core lesson.](/images/placeholder.png)

> **When the audience you want shares a well-defined frustration with the incumbent, naming that frustration precisely is more powerful than listing features — the complaint is the positioning.**
>
> — HackProduct autopsy

<!-- beat: references -->
## References

1. "Why we're building Linear." *Linear Blog*, 2019. [Tier A] https://linear.app/blog/why-were-building-linear — Supports Linear's founding rationale, critique of Jira, design philosophy, focus on speed and keyboard shortcuts.
2. Saarinen, Karri. Launch thread. *Twitter / X*, 2020. [Tier A] https://twitter.com/karrisaarinen — Supports Linear public launch announcement, initial community response.
3. "Linear raises funding to make project management tools less painful." *TechCrunch*, March 2020. [Tier B] https://techcrunch.com/2020/03/17/linear-raises-4-2-million-to-make-project-management-tools-less-painful/ — Supports $4.2M seed round, investor context, Linear's positioning against Jira.
4. "Linear is the project management app developers actually want to use." *The Verge*. [Tier B] https://www.theverge.com/22958323/linear-project-management-tool-review — Supports user experience, keyboard shortcut design, speed as a core value.
5. "Show HN — Linear, a new issue tracker for software teams." *Hacker News*, February 2020. [Tier B] https://news.ycombinator.com/item?id=22387339 — Supports launch reception, developer community response.
6. "How Linear Builds Product." *First Round Review*. [Tier B] https://review.firstround.com/how-linear-builds-product — Supports Linear's product philosophy, Saarinen's design background, opinionated defaults.
7. "The rise of developer-first tools." *Forbes*, June 2022. [Tier B] https://www.forbes.com/sites/forbestechcouncil/2022/06/15/the-rise-of-developer-first-tools/ — Supports developer tool market context and bottom-up adoption patterns.
8. "Linear raises $35M Series A." *TechCrunch*, August 2021. [Tier B] https://techcrunch.com/2021/08/17/linear-raises-35m-series-a-for-its-project-management-tool/ — Supports August 2021 Series A, growth validation.

<!-- beat: forward -->
## Next in queue

**[Notion Template Gallery](../notion/notion-template-gallery.md)** — How Notion's template gallery became an onboarding mechanism, a distribution channel, and an accidental marketplace that made the product's complexity approachable for millions of new users.

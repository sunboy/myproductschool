---
slug: linear
companySlug: linear
companyName: Linear
title: Linear's Opinionated Defaults
dek: Karri Saarinen built an issue tracker that told you how to use it — and found that most professional teams were relieved someone finally did.
queueRank: 50
tier: 2
estimatedReadTime: 8 min read
status: draft
researchGaps:
  - ARR figures not publicly confirmed by Linear; widely cited range is $20M-$35M ARR as of 2023 but sourced from trade press, not Linear directly.
  - Customer count and churn rates not disclosed.
  - Karri Saarinen's specific internal deliberation on workflow opinions not documented beyond interviews.
sourceSummary: A-tier sources from Linear's own blog (particularly the "Why Linear" post) and founder interviews. B-tier trade press for funding and adoption metrics. The core product philosophy (opinionated defaults) is extensively documented by the team themselves.
sources:
  - id: linear-why-blog
    title: Why Linear
    publisher: Linear Blog (linear.app)
    url: https://linear.app/blog/why-linear
    tier: A
    accessedAt: 2026-05-17
    supports: Opinionated workflow design philosophy, keyboard-first design, speed philosophy.
  - id: karri-interview-lenny
    title: Karri Saarinen on Building Linear — Lenny's Podcast
    publisher: Lenny Rachitsky's Newsletter
    url: https://www.lennysnewsletter.com/p/building-linear-karri-saarinen
    tier: A
    accessedAt: 2026-05-17
    supports: Founding story, deliberate choice to not build Jira, "opinions as features" philosophy.
  - id: techcrunch-linear-series-b
    title: Linear raises $35M Series B
    publisher: TechCrunch
    url: https://techcrunch.com/2022/linear-raises-35-million-series-b
    tier: B
    accessedAt: 2026-05-17
    supports: $35M Series B, Accel and Sequoia participation, valuation context.
  - id: linear-changelog
    title: Linear Changelog
    publisher: Linear (linear.app/changelog)
    url: https://linear.app/changelog
    tier: A
    accessedAt: 2026-05-17
    supports: Feature release cadence, keyboard shortcuts as primary interaction model, cycle/project structure.
  - id: the-information-linear-growth
    title: Startup Gives Jira a Run for Its Money
    publisher: The Information
    url: https://www.theinformation.com/linear-jira-competitor
    tier: B
    accessedAt: 2026-05-17
    supports: Customer acquisition pattern, engineers as champions, enterprise deal sizes, Jira displacing.
metrics:
  - label: Founded
    value: 2019
    confidence: confirmed
    sourceIds: [karri-interview-lenny]
  - label: Series B
    value: $35M (2022)
    confidence: confirmed
    sourceIds: [techcrunch-linear-series-b]
  - label: Keyboard shortcut count (approximate)
    value: 70+ keyboard shortcuts as primary interaction model
    confidence: confirmed
    sourceIds: [linear-changelog]
  - label: Issue open speed (design target)
    value: Under 50ms to open an issue
    confidence: confirmed
    sourceIds: [linear-why-blog]
glanceCards:
  - id: setup
    title: Jira made everything configurable
    body: Jira's default answer to every workflow question is "you decide" — custom fields, custom statuses, custom workflows, custom everything. After a decade, most engineering teams had Jira setups nobody fully understood and backlogs that functioned as issue graveyards.
    sourceIds: [linear-why-blog, karri-interview-lenny]
    confidence: confirmed
  - id: problem
    title: Infinite configurability meant infinite overhead
    body: The promise of full configurability was that every team could make the tool work for them. The reality was that most teams spent more time configuring Jira than using it — and the configurations accumulated technical debt as team composition and process changed.
    sourceIds: [linear-why-blog, the-information-linear-growth]
    confidence: confirmed
  - id: tempting-move
    title: The obvious answer was "Jira but faster"
    body: The project management tool market's established move was to compete on features and speed within the existing paradigm — more integrations, better search, faster renders, a cleaner UI. Linear declined to play that game.
    sourceIds: [karri-interview-lenny]
    confidence: confirmed
  - id: mechanism
    title: Opinions are a design surface
    body: Linear ships with predetermined workflow structure: issues have statuses (Backlog, Todo, In Progress, Done, Cancelled), cycles are two-week sprints, projects are roadmap-level groupings. You can change some of these, but the defaults are specific and the tool teaches you toward them. The keyboard is the primary interface.
    sourceIds: [linear-why-blog, linear-changelog]
    confidence: confirmed
  - id: evidence
    title: Engineers champion it upward
    body: Linear's adoption pattern — engineers discover it, love it, convince their manager to pay for the team, manager approves — is the inverse of Jira's top-down enterprise sale. The product earned loyalty at the individual contributor level before it became an organizational decision.
    sourceIds: [the-information-linear-growth, techcrunch-linear-series-b]
    confidence: confirmed
  - id: takeaway
    title: An opinion is a commitment to one kind of user
    body: Linear's opinionated defaults are not limitations; they are a commitment. The tool is designed for engineering teams running roughly Agile-adjacent workflows with enough discipline to use cycles and projects consistently. For that user, the opinions feel like clarity. For everyone else, they can use Jira.
    sourceIds: [linear-why-blog, karri-interview-lenny]
    confidence: confirmed
obviousAnswer:
  temptingMove:
    label: The tempting move
    bullets:
      - Build "Jira but faster" — same workflow model, better performance and UI
      - Offer extensive customization to appeal to the broadest possible market
      - Compete on integrations — more connections to Slack, GitHub, Figma, etc.
      - Let teams define their own statuses, fields, workflows, and structures
      - Enterprise-first sales motion targeting existing Jira customers top-down
    summary: The market's established template was "flexible issue tracker with better UX." Linear deliberately didn't build that.
  whatShipped:
    label: What shipped
    bullets:
      - Fixed workflow model — Backlog, Todo, In Progress, Done, Cancelled are the statuses
      - Keyboard-first interface — 70+ shortcuts; the tool is designed to be operated without the mouse
      - Cycles (two-week sprints) and Projects (roadmap groupings) as first-class, predetermined concepts
      - Performance as a product feature — under 50ms to open an issue is a design target
      - Bottom-up adoption — built for engineers first, with management dashboards as secondary
    summary: An opinionated tool that told engineers how to work — and was relieved to finally hear it.
lifecycle:
  - date: 2019-01
    label: Linear founded
    description: Karri Saarinen, Jori Lallo, and Tuomas Artman leave Airbnb, Coinbase, and Uber to build Linear.
    type: launch
  - date: 2020-03
    label: Public launch
    description: Linear opens to the public with keyboard-first, opinionated issue tracking. Immediate positive response from engineering communities.
    type: launch
  - date: 2021-06
    label: $35M Series B
    description: Accel and Sequoia participate. Linear reports strong net revenue retention and engineering team adoption.
    type: milestone
  - date: 2022-01
    label: Linear Method published
    description: Team publishes "The Linear Method" — a public document explaining the opinions baked into the product's design philosophy.
    type: milestone
  - date: 2024-01
    label: Enterprise tier launched
    description: Linear adds SSO, advanced permissions, and enterprise audit logs while maintaining opinionated core.
    type: today
takeaway:
  principle: An opinion baked into defaults is a commitment to a specific kind of user — and that specificity is the product's value, not its limitation.
  sourceIds: [linear-why-blog, karri-interview-lenny]
images:
  - role: hero
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch mascot (the HackProduct robot with graduation cap and growth arrow) standing at a clean desk with a precisely organized issue board behind it — four columns (Backlog, Todo, In Progress, Done), each with a small stack of cards. The desk has a single keyboard, no mouse visible. Cream background, no speech bubbles. Watermark: "HackProduct" wordmark bottom-right, 60% opacity, JetBrains Mono. Aspect 2400×1350.
    alt: Hatch at an organized issue board with four clear statuses and a keyboard-only workspace.
    watermark: HackProduct
  - role: scene
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in narrator pose looking at an overwhelmingly complex Jira-like settings panel — dozens of dropdown menus, custom field configurators, workflow diagram builder, all crowding a single screen. Hatch looks sympathetically overwhelmed. Cream background. Aspect 1600×1600.
    alt: Hatch looking at the complexity of a fully configurable project management tool setup.
    watermark: HackProduct
  - role: mechanism
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in thinking pose looking at a keyboard with several keys highlighted (representing Linear's keyboard shortcuts). Behind Hatch, a clean issue list with just four status columns — no configuration panel visible. The contrast is "opinions built in" versus "configure everything." Cream background. Aspect 1800×1200.
    alt: Hatch examining Linear's keyboard-first interface with predetermined workflow structure.
    watermark: HackProduct
  - role: evidence
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch pointing at a simple adoption funnel diagram: individual engineer at the bottom (loves it), team at the middle (converted), organization at the top (pays). An upward arrow labeled "bottom-up." Clean presentation pose. Cream background. Aspect 1600×1000.
    alt: Hatch presenting Linear's bottom-up adoption pattern from individual engineers to organizational purchase.
    watermark: HackProduct
  - role: lesson
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in coaching pose holding a small sign that reads "OPINION" — not phrased as an apology but as a product feature. Behind Hatch, a user figure looking relieved. Cream background. Aspect 1800×1200.
    alt: Hatch presenting an opinion as a product feature, with a relieved user behind it.
    watermark: HackProduct
  - role: thumbnail
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch holding a small four-column issue board — Backlog, Todo, In Progress, Done — compact and instantly legible at thumbnail size. Cream background. Aspect 1200×900.
    alt: Hatch holding a compact four-column issue board representing Linear's opinionated workflow.
    watermark: HackProduct
  - role: social-cover
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in hero pose adapted for wide share card: on the left, a chaotic configurable settings panel; on the right, a clean four-column board with a keyboard in front. Hatch stands in the center, pointing right. Title text area at left. Cream background, HackProduct wordmark bottom-right. Aspect 2400×1260.
    alt: Hatch between a complex configurable tool and a clean opinionated one, pointing toward the latter.
    watermark: HackProduct
nextInQueue:
  slug: raycast
  companySlug: raycast
  title: Raycast's Developer-First Launcher
---

<!-- beat: lede -->

In 2019, Karri Saarinen, Jori Lallo, and Tuomas Artman left their jobs at Airbnb, Coinbase, and Uber to build a project management tool. This is not the beginning of a story about a brave startup challenging a sleepy incumbent. Jira, the incumbent they were challenging, had been the dominant engineering project management tool for fifteen years and was deeply embedded in the workflows of most engineering organizations on the planet. It was also, by any honest assessment, a tool that most engineers actively disliked.

The founders of Linear had a specific theory about why. Jira's architecture of infinite configurability — custom fields, custom statuses, custom workflows, custom everything — had seemed like a feature. It turned out to be a problem. When a tool offers to be whatever you want it to be, most teams spend more time deciding what they want than doing the work. Linear's answer was to decide for you. This is the story of why "we have opinions" turned out to be a competitive advantage.

<!-- beat: glance -->
## At a glance

1. **Jira made everything configurable** — Jira's default answer to every workflow question is "you decide." After a decade, most engineering teams had setups nobody fully understood and backlogs that functioned as issue graveyards. [linear-why-blog, karri-interview-lenny]

2. **Infinite configurability meant infinite overhead** — The promise was that every team could make the tool work for them. The reality was that most teams spent more time configuring than using — and the configurations accumulated debt as teams changed. [linear-why-blog, the-information-linear-growth]

3. **The obvious answer was "Jira but faster"** — The established template was to compete on features and speed within the existing paradigm — better UI, faster renders, more integrations. Linear declined. [karri-interview-lenny]

4. **Opinions are a design surface** — Linear ships with predetermined workflow structure: fixed statuses, two-week cycles, roadmap-level projects. The keyboard is the primary interface. You can change some things, but the defaults are specific and the tool teaches you toward them. [linear-why-blog, linear-changelog]

5. **Engineers champion it upward** — Linear's adoption pattern — engineers discover it, love it, convince their manager to pay — is the inverse of Jira's top-down enterprise sale. The product earned loyalty at the individual contributor level before becoming an organizational decision. [the-information-linear-growth, techcrunch-linear-series-b]

6. **An opinion is a commitment to one kind of user** — Linear's opinionated defaults are not limitations; they are a commitment to engineering teams running roughly Agile-adjacent workflows with enough discipline to use cycles and projects consistently. For that user, the opinions feel like clarity. [linear-why-blog, karri-interview-lenny]

<!-- beat: scene -->
## Background

![Hatch looking at the complexity of a fully configurable project management tool setup](/images/placeholder.png)

Every engineering team that had been using Jira for more than two years had the same experience: at some point, the configuration had escaped the people who built it. The person who set up the custom workflow statuses had left. The custom fields that someone added in 2018 to track something specific to a project that no longer existed were still there. The backlog had 3,000 issues, of which maybe 200 were real work and the rest were ideas from three product managers ago, bugs that had been fixed without being closed, and research tickets that had been "in progress" for eleven months.

Jira had built this by design. The pitch was flexibility: any team, any process, any organization could configure Jira to match their workflow exactly. This was technically true and practically disastrous. Most teams don't have the project management discipline to maintain a bespoke workflow. They have software to ship. They use whatever configuration came with the Jira setup they inherited, add fields and statuses as needs arise, and never clean up what they no longer need. The tool becomes an archaeological site.

When Karri Saarinen talked about why he wanted to build Linear, he wasn't describing a technical problem. He was describing a workflow problem disguised as a tooling problem: the issue tracker had become an obstacle to the work it was meant to track. The solution he reached for was not a better configuration UI. It was fewer configurations to make.

<!-- beat: choice -->
## The obvious answer and what shipped instead

| The tempting move | What shipped |
|---|---|
| "Jira but faster" — same workflow model, better performance | Fixed workflow model — predetermined statuses, not configurable |
| Extensive customization to appeal to the widest market | Keyboard-first interface as the primary interaction model |
| Enterprise-first, top-down sales with procurement integration | Bottom-up adoption — built for individual engineers |
| Compete on integrations and ecosystem breadth | Performance as a product feature (under 50ms to open an issue) |
| Let teams define their own workflow terms and structure | Published "The Linear Method" — the opinions are documented and explained |

The tempting move came with a clear business rationale: the broadest possible configurability meant the broadest possible market. If you're flexible enough, every team can use you. Linear's bet was the opposite: if you're specific enough, the right teams will love you with an intensity that broad flexibility never produces. The design target of under 50ms to open an issue is not primarily a performance specification — it's a statement about what the tool thinks matters.

<!-- beat: mechanism -->
## How it actually works

![Hatch examining Linear's keyboard-first interface with predetermined workflow structure](/images/placeholder.png)

Linear's workflow structure is decided, not configured. Issues have six statuses: Backlog, Todo, In Progress, In Review, Done, and Cancelled. Teams can add custom statuses within those categories, but the categories themselves exist and are non-negotiable. Cycles are two-week periods — the tool's version of a sprint — and they're a first-class concept: issues are assigned to cycles, cycles have start and end dates, and the cycle view shows progress against scope. Projects are roadmap-level groupings that cross cycle boundaries [linear-changelog, linear-why-blog].

This sounds limiting. In practice, it functions as a workflow model that the tool actively teaches. When a new engineer joins a team using Linear, they don't have to read documentation to understand how the team thinks about its work. The structure is visible in the interface. Backlog means not yet committed. In Progress means someone is actively working on it. Cycles are time-bounded commitments. Projects are longer-term bets. These distinctions are obvious in linear because the tool makes them obvious.

The keyboard interface reinforces this. Linear has over 70 keyboard shortcuts covering every common action: open an issue, assign it, move it to a cycle, change its status, add a comment, close it. The mouse is available but secondary. Engineers, as a population, tend to prefer keyboard-heavy workflows — and for an individual contributor using Linear for 4-6 hours a day, the keyboard shortcuts become muscle memory in a week [linear-changelog]. The speed philosophy — under 50ms to open an issue — means every interaction feels instant. The combination of enforced structure and keyboard fluency produces a kind of flow state in issue tracking that "configure everything" tools rarely achieve [linear-why-blog].

The constraint Linear chose to honour was workflow specificity for engineering teams. The constraint it chose not to honour was market breadth. A non-technical team using Linear for product roadmapping or a marketing department using it for campaign tracking will find the tool awkward. It is not trying to serve them.

<!-- beat: evidence -->
## Evidence

Linear's $35M Series B in 2022, led by Accel and Sequoia, confirmed commercial traction at a time when both firms were doing extensive diligence on SaaS metrics [techcrunch-linear-series-b]. The reported adoption pattern — The Information described it as engineers discovering Linear, converting their team, and escalating to management for budget — is the inverse of Jira's enterprise procurement motion [the-information-linear-growth]. Bottom-up adoption in B2B software is expensive to acquire but produces high retention because the champion is also the user.

What the public record cannot confirm: Linear's ARR, churn rates, or what fraction of accounts are on paid tiers. Estimates in trade press range from $20M to $35M ARR as of 2023, but these are not confirmed by Linear directly.

| Metric | Value | Confidence | Source |
|---|---|---|---|
| Founded | 2019 | Confirmed | [karri-interview-lenny] |
| Series B | $35M (2022) | Confirmed | [techcrunch-linear-series-b] |
| Keyboard shortcuts | 70+ as primary interface | Confirmed | [linear-changelog] |
| Performance target | Under 50ms to open an issue | Confirmed | [linear-why-blog] |

![Hatch presenting Linear's bottom-up adoption pattern from individual engineers to organizational purchase](/images/placeholder.png)

<!-- beat: voice -->

> "We believe software should feel fast. Every interaction, every keystroke, every render. Speed is not a feature — it is respect for the user's time."
>
> — Linear, "Why Linear" (linear.app/blog), 2021

<!-- beat: aftermath -->
## Timeline

1. **2019** — Linear founded by Karri Saarinen, Jori Lallo, and Tuomas Artman; all previously at Airbnb, Coinbase, and Uber.
2. **March 2020** — Public launch. Keyboard-first, opinionated issue tracking opens to the public; immediate positive response from engineering communities on Hacker News and Twitter.
3. **June 2021** — $35M Series B closes. Accel and Sequoia participate; Linear reports strong net revenue retention.
4. **January 2022** — Linear Method published. Team releases a public document explaining the workflow opinions baked into the product.
5. **January 2024** — Enterprise tier launched. SSO, advanced permissions, and audit logs added while the opinionated core is maintained.

<!-- beat: lesson -->
## The takeaway

![Hatch presenting an opinion as a product feature, with a relieved user behind it](/images/placeholder.png)

> **An opinion baked into defaults is a commitment to a specific kind of user — and that specificity is the product's value, not its limitation.**
>
> — HackProduct autopsy

The received wisdom in enterprise software design is that flexibility is always better than rigidity. More options means more customers. More configurability means more use cases served. The logic is straightforward: if you build a tool that can be anything, everyone can use it. Linear's founders looked at the evidence — a decade of Jira deployments turned into archaeological sites, backlogs that had stopped functioning as actual work queues — and concluded that the received wisdom was wrong.

The hidden cost of infinite configurability is infinite overhead. When a tool offers to be whatever you want, you have to decide what you want. That decision is work. It's recurring work, because what you want changes as your team changes. And it's invisible work, because nobody credits the PM who spent three days rearchitecting the Jira workflow as having done something valuable. The work just disappears into the overhead of maintaining the tool.

Linear's opinionated defaults eliminate most of that work. The team that adopts Linear doesn't have to design a workflow; the workflow comes with the tool. The opinions are documented in The Linear Method, explained in founder interviews, visible in the interface. You can disagree with them. If you do, there's Jira. But for the specific kind of engineering team Linear is designed for — professional, disciplined, running something roughly like Agile cycles — the opinions feel like clarity delivered as software.

The deeper lesson is that opinionation is a targeting decision. When you build with strong opinions, you are simultaneously saying "for this user, the tool will feel extremely clear" and "for other users, the tool will feel constraining." That tradeoff is real. Linear made it explicitly. The willingness to say "this tool is not for everyone" is not a weakness; it's the foundation of a product that is genuinely excellent for someone.

<!-- beat: references -->
## References

1. **Why Linear** — Linear Blog (linear.app) [Tier A] — linear.app/blog/why-linear — Opinionated workflow design, keyboard-first philosophy, speed targets.
2. **Karri Saarinen on Building Linear** — Lenny's Podcast [Tier A] — lennysnewsletter.com — Founding story, "opinions as features" philosophy.
3. **Linear Changelog** — Linear (linear.app/changelog) [Tier A] — linear.app/changelog — Keyboard shortcuts, feature release cadence, cycle/project structure.
4. **Linear raises $35M Series B** — TechCrunch [Tier B] — techcrunch.com — Funding round, investor participation.
5. **Startup Gives Jira a Run for Its Money** — The Information [Tier B] — theinformation.com — Customer acquisition pattern, bottom-up adoption, Jira displacement.

<!-- beat: forward -->
## Next in queue

**[Raycast's Developer-First Launcher](/autopsies/raycast/raycast)** — How Thomas Paul Mann and Petr Nikolaev turned a macOS launcher into a developer platform by treating the extension model as the product.

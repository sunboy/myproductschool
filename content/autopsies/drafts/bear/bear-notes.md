---
slug: bear-notes
companySlug: bear
companyName: Bear
title: Bear Notes
dek: How a small iOS team built a writing app defined by what it chose not to include, and why focus as a design principle turned into the product's most durable competitive advantage.
queueRank: 99
tier: 3
estimatedReadTime: 7 min read
status: draft
researchGaps:
  - Bear (Shiny Frog) has not published revenue, user count, or subscriber figures publicly.
  - No detailed public interview with the founding team about specific product decisions during development.
  - The exact timeline of Bear's development before the 2016 launch is not publicly documented.
sourceSummary: Five B-tier and two A-tier sources support the Bear Notes story, Apple Design Award recognition, the writing-focused philosophy, and comparisons with Notion and other note-taking tools. They do not support user count, revenue, or subscriber figures.
sources:
  - id: apple-design-award-bear
    title: Apple Design Award — Bear
    publisher: Apple
    url: https://developer.apple.com/design/awards/
    tier: A
    accessedAt: 2026-05-17
    supports: Apple Design Award recognition, Apple's endorsement of Bear's design quality.
  - id: bear-app-philosophy
    title: Bear app — about and philosophy
    publisher: Bear (Shiny Frog)
    url: https://bear.app
    tier: A
    accessedAt: 2026-05-17
    supports: Bear's stated design philosophy, writing-first approach, feature set, iOS-first positioning.
  - id: verge-bear-review
    title: Bear review — the best notes app for iPhone and Mac
    publisher: The Verge
    url: https://www.theverge.com/22938425/bear-2-review
    tier: B
    accessedAt: 2026-05-17
    supports: Bear's user experience, design choices, writing focus, markdown support, tag system.
  - id: macrumors-bear-award
    title: Bear wins Apple Design Award
    publisher: MacRumors
    url: https://www.macrumors.com/2017/06/05/apple-design-award-winners-2017/
    tier: B
    accessedAt: 2026-05-17
    supports: 2017 Apple Design Award, WWDC recognition, Apple's assessment of Bear's quality.
  - id: fastcompany-note-taking
    title: The best note-taking apps for 2023
    publisher: Fast Company
    url: https://www.fastcompany.com/best-note-taking-apps
    tier: B
    accessedAt: 2026-05-17
    supports: Bear's positioning in the note-taking market, comparison with Notion and Obsidian.
  - id: appstorm-bear-notion
    title: Bear vs Notion — which note app is right for you?
    publisher: AppStorm
    url: https://appstorm.net/roundups/office-roundups/bear-vs-notion
    tier: B
    accessedAt: 2026-05-17
    supports: Bear's differentiation from Notion, offline access, simplicity as positioning.
  - id: sixcolors-bear
    title: Bear 2 review — a writer's tool
    publisher: Six Colors
    url: https://sixcolors.com/post/2023/09/bear-2-review/
    tier: B
    accessedAt: 2026-05-17
    supports: Bear's writing-first design, aesthetic philosophy, markdown as native language.
metrics:
  - label: Bear public launch
    value: January 2016
    confidence: confirmed
    sourceIds: [bear-app-philosophy]
  - label: Apple Design Award
    value: 2017 (WWDC)
    confidence: confirmed
    sourceIds: [apple-design-award-bear, macrumors-bear-award]
  - label: Bear pricing model
    value: Free with Bear Pro subscription ($1.49/mo or $14.99/yr)
    confidence: confirmed
    sourceIds: [bear-app-philosophy]
  - label: Platform focus
    value: iOS and macOS (Apple ecosystem only)
    confidence: confirmed
    sourceIds: [bear-app-philosophy]
glanceCards:
  - id: setup
    title: Fewer features on purpose
    body: Bear launched in 2016 into a market where Evernote had a decade of features and Notion was expanding in all directions. Bear's designers chose to do less — deliberately, visibly, as a philosophy.
    sourceIds: [bear-app-philosophy, verge-bear-review]
    confidence: confirmed
  - id: problem
    title: Powerful apps had become hard to think in
    body: By 2016, the dominant note-taking apps were organized around information management — tagging systems, notebooks, shared databases, integrations. Bear's designers believed that a writing app's first job was to be a place you could think, without friction.
    sourceIds: [bear-app-philosophy, sixcolors-bear]
    confidence: confirmed
  - id: tempting-move
    title: The obvious move was feature parity
    body: Competing with Evernote meant matching its notebook structure, sharing features, and integrations. Competing with Notion meant supporting databases and templates. Bear chose neither path.
    sourceIds: [appstorm-bear-notion, fastcompany-note-taking]
    confidence: confirmed
  - id: mechanism
    title: Markdown as the native language
    body: Bear treated Markdown not as an export format but as the interface. Headers, bold, and links appeared rendered as the user typed. The document was always in the writing state, never the editing-code state. The aesthetic reinforced that writing was the primary act.
    sourceIds: [verge-bear-review, sixcolors-bear]
    confidence: confirmed
  - id: evidence
    title: Apple's endorsement validated the philosophy
    body: In 2017, Apple gave Bear its Design Award at WWDC. For a small Italian studio, the recognition confirmed that simplicity executed at high quality could stand alongside the largest productivity apps in the App Store.
    sourceIds: [apple-design-award-bear, macrumors-bear-award]
    confidence: confirmed
  - id: takeaway
    title: Focus is a promise, not a limitation
    body: Every feature Bear chose not to build was also a promise to users who cared about the remaining features being excellent. A narrower product, built for a specific act, can earn more trust from fewer users than a broad product built to serve everyone.
    sourceIds: [bear-app-philosophy, verge-bear-review]
    confidence: confirmed
obviousAnswer:
  temptingMove:
    label: The tempting move
    bullets:
      - Match Evernote's notebook hierarchy and sharing model
      - Add Notion-style database support for power users
      - Build cross-platform support to maximize addressable market
      - Add integrations with productivity tools to reduce switching costs
    summary: Feature expansion to compete directly with the market leaders on breadth.
  whatShipped:
    label: What shipped
    bullets:
      - Writing-first design with Markdown rendered inline as the user types
      - Tag-based organization instead of notebook hierarchies
      - Apple ecosystem only (iOS and macOS)
      - Offline-first architecture — notes available without internet
      - A visual aesthetic that made the writing experience feel beautiful
    summary: A focused, narrower app that tried to be the best place to write, not the most powerful place to manage information.
lifecycle:
  - date: 2016-01-01
    label: Bear launches on iOS and macOS
    description: Shiny Frog releases Bear; writing-first design and aesthetic are the immediate differentiators.
    type: launch
  - date: 2017-06-05
    label: Bear wins Apple Design Award at WWDC
    description: Apple recognizes Bear's design quality; significant visibility in the developer and user community.
    type: milestone
  - date: 2021-01-01
    label: Bear Pro grows as Notion attracts power users
    description: Bear and Notion occupy distinct segments; Bear retains users who want simplicity.
    type: milestone
  - date: 2023-09-01
    label: Bear 2 launches with improved editor and themes
    description: Major update to the writing experience; core philosophy unchanged.
    type: launch
  - date: 2024-01-01
    label: Bear remains the preferred writing app for Apple-ecosystem writers
    description: Sustainable niche: users who write daily on Apple devices and value aesthetic design.
    type: today
takeaway:
  principle: Focus is a promise — every feature you choose not to build is also a commitment that the features you kept will be excellent, and that promise is the product's relationship with its users.
  sourceIds: [bear-app-philosophy, verge-bear-review, sixcolors-bear]
images:
  - role: hero
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch mascot (the HackProduct robot with the graduation cap and growth arrow) sitting at a minimal writing desk with a single open notebook, surrounded by shelves of unused tools and features that have been neatly set aside. The composition conveys focus through deliberate omission. Cap tilted, serene expression. Cream background. Watermark: "HackProduct" wordmark bottom-right, 60% opacity, JetBrains Mono. Aspect 2400x1350.
    alt: Hatch sitting at a minimal writing desk, surrounded by unused tools set aside, representing Bear's philosophy of deliberate omission.
    caption: Bear Notes — the design philosophy of doing less, better.
    watermark: HackProduct
  - role: scene
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in narrator pose, gesturing at two contrasting interfaces side by side: on the left, a cluttered app with sidebars, toolbars, integration icons, and notifications; on the right, a clean white writing surface with a single line of text and a blinking cursor. The contrast is the point. Cream background, no speech bubble. Watermark: "HackProduct" wordmark bottom-right, 60% opacity, JetBrains Mono. Aspect 1600x1600.
    alt: Hatch gesturing between a cluttered productivity app and a minimal Bear-style writing surface.
    watermark: HackProduct
  - role: mechanism
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in thinking pose looking at text appearing rendered in real time: a user types "# Header" and it instantly becomes a large heading; "**bold**" becomes bold text. The mechanism of inline Markdown rendering is the visual. Cream background. Watermark: "HackProduct" wordmark bottom-right, 60% opacity, JetBrains Mono. Aspect 1800x1200.
    alt: Hatch watching inline Markdown rendering where typed syntax immediately becomes formatted text.
    watermark: HackProduct
  - role: evidence
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch pointing at an Apple Design Award trophy, with a small calendar showing "WWDC 2017" and a crowd of developer conference attendees in stylized background silhouette. The image communicates Apple's institutional recognition of Bear's design quality. Cream background. Watermark: "HackProduct" wordmark bottom-right, 60% opacity, JetBrains Mono. Aspect 1600x1000.
    alt: Hatch pointing at an Apple Design Award trophy from WWDC 2017.
    watermark: HackProduct
  - role: lesson
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in calm coaching pose standing beside a visual of a single sharp pencil, surrounded by a collection of multi-function Swiss Army knives laid aside. The composition communicates that focus produces a different kind of excellence than breadth. Cream background. Watermark: "HackProduct" wordmark bottom-right, 60% opacity, JetBrains Mono. Aspect 1800x1200.
    alt: Hatch beside a single sharp pencil surrounded by multi-function tools set aside, representing Bear's focus philosophy.
    watermark: HackProduct
  - role: thumbnail
    placeholder: /images/placeholder.png
    promptForCodex: |
      Small, recognisable Hatch mascot holding a single pencil, with a minimalist notebook in the background. Clean cream background, no text, no speech. Aspect 1200x900.
    alt: Hatch holding a single pencil representing Bear's writing-first focus.
    watermark: HackProduct
  - role: social-cover
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hero Hatch adapted for OG share: Hatch at a minimal desk with a single open notebook, "BEAR NOTES" as a visual backdrop. Cream background, HackProduct watermark bottom-right 60% opacity JetBrains Mono. Aspect 2400x1260.
    alt: Hatch at a minimal writing desk for Bear Notes social sharing.
    watermark: HackProduct
nextInQueue:
  slug: wordle-clone-market
  companySlug: nyt
  title: Wordle and the Clone Market
---

<!-- beat: lede -->

Shiny Frog is a small software studio in Como, Italy, founded by Danilo Bonardi and Federico Vitale. When they released Bear in January 2016, the note-taking market was dominated by Evernote, which had spent a decade accumulating features, and was beginning to feel the first pressure from Notion, which was expanding the definition of what a note-taking app could do. Bear did neither. It launched with a focused feature set designed for one specific act: writing. [bear-app-philosophy]

The decision to focus was also a decision about who Bear was not for. A user who needed to share notebooks with a team, manage complex hierarchies, attach files, or integrate with other productivity services would find Bear insufficient. A user who needed to write — quickly, beautifully, without interruption — would find it the best available tool on Apple's platforms. In 2017, Apple gave Bear its Design Award at WWDC, the company's annual recognition of the best-designed applications in its ecosystem. For a two-person studio in northern Italy, the recognition confirmed that doing one thing exceptionally well was a viable strategy in a market where competitors were doing everything adequately. [apple-design-award-bear, macrumors-bear-award]

<!-- beat: glance -->
## At a glance

1. **Fewer features on purpose.** Bear launched in 2016 into a market where Evernote had a decade of features and Notion was expanding in all directions. Bear's designers chose to do less — deliberately, visibly, as a philosophy. [bear-app-philosophy, verge-bear-review]

2. **Powerful apps had become hard to think in.** By 2016, the dominant note-taking apps were organized around information management — tagging systems, notebooks, shared databases, integrations. Bear's designers believed that a writing app's first job was to be a place you could think, without friction. [bear-app-philosophy, sixcolors-bear]

3. **The obvious move was feature parity.** Competing with Evernote meant matching its notebook structure, sharing features, and integrations. Competing with Notion meant supporting databases and templates. Bear chose neither path. [appstorm-bear-notion, fastcompany-note-taking]

4. **Markdown as the native language.** Bear treated Markdown not as an export format but as the interface. Headers, bold, and links appeared rendered as the user typed. The document was always in the writing state, never the editing-code state. The aesthetic reinforced that writing was the primary act. [verge-bear-review, sixcolors-bear]

5. **Apple's endorsement validated the philosophy.** In 2017, Apple gave Bear its Design Award at WWDC. For a small Italian studio, the recognition confirmed that simplicity executed at high quality could stand alongside the largest productivity apps in the App Store. [apple-design-award-bear, macrumors-bear-award]

6. **Focus is a promise, not a limitation.** Every feature Bear chose not to build was also a promise to users who cared about the remaining features being excellent. A narrower product, built for a specific act, can earn more trust from fewer users than a broad product built to serve everyone. [bear-app-philosophy, verge-bear-review]

<!-- beat: scene -->
## Background

![Hatch gesturing between a cluttered productivity app and a minimal Bear-style writing surface.](/images/placeholder.png)

By 2016, Evernote had been the default note-taking application for millions of users for nearly a decade. It had accumulated features across those years in the way that successful software often does: each feature was added to solve a real need someone had, and the aggregate of those additions produced a product that could do a remarkable number of things. It could clip web pages, sync across devices, transcribe business cards, share notebooks, set reminders, search handwritten notes, and integrate with dozens of services. A new user opening Evernote for the first time encountered a product that communicated capability in every direction. [fastcompany-note-taking]

The experience of writing inside Evernote — the core act that a note-taking application exists to support — was not particularly pleasurable. The interface was functional. The text appeared on the screen. The features that surrounded the writing surface did not disappear when you were in the middle of writing; they remained present, available, subtly communicating that you might want to do something with them. Writing is an act that benefits from a quiet environment. Evernote's interface was not quiet. [sixcolors-bear]

Danilo Bonardi and Federico Vitale made a different set of choices. Bear's writing surface was clean. The sidebar showed notes and tags. The rest of the screen was the document. The document's typography was carefully chosen. The color themes were considered. The application felt like it had been made by people who cared deeply about what it felt like to sit with an empty page and fill it with words. [bear-app-philosophy, verge-bear-review]

<!-- beat: choice -->
## The obvious answer and what shipped instead

| The tempting move | What shipped |
|---|---|
| Notebook hierarchy system to match Evernote's organizational model | Tag-based organization only — a note can have multiple tags, no nested folders |
| Cross-platform support (Windows, Android) to maximize market reach | Apple ecosystem only — iOS and macOS, using platform-native capabilities |
| File attachments and integration with third-party services | Writing-focused feature set; files can be attached but integrations are minimal |
| Free with ads or freemium conversion to paid via feature gating | Free base app with Bear Pro subscription ($1.49/mo) for sync and themes |

The tag system instead of notebooks was a consequential choice. It forced a different organizational model on users — notes live in multiple contexts simultaneously rather than in a single hierarchical location — but it also avoided the complexity of managing nested folder structures. A user either adapted to the tag model or chose a different application. [verge-bear-review]

<!-- beat: mechanism -->
## How it actually works

![Hatch watching inline Markdown rendering where typed syntax immediately becomes formatted text.](/images/placeholder.png)

Bear's most distinctive technical implementation is inline Markdown rendering. In most applications that support Markdown, a user writes Markdown syntax and can toggle between a "source" view and a "rendered" view. Bear renders Markdown as the user types. Typing `#` followed by a space produces a large heading immediately. Surrounding a word with `**` makes it bold instantly. Inserting `[link text](url)` creates a clickable link without switching modes. [verge-bear-review, sixcolors-bear]

This creates an experience in which the user is always in the writing state. There is no mode switching, no preview pane, no code-like source view that makes the user feel like a developer rather than a writer. The document looks like what it is — a written piece — at all stages of composition. The rendering happens without delay, which means it feels like the natural output of typing rather than a transformation applied afterward. [sixcolors-bear]

Bear's tag system works through a simple convention: any word preceded by a `#` in the body of a note becomes a tag automatically. A user does not need to apply tags separately through a tagging UI. The act of writing the word `#project-alpha` inside a note tags it for that project. Notes can have any number of tags and appear in any context they have been tagged for. The system is lighter than notebooks and more flexible, because a note can belong to multiple contexts simultaneously. [verge-bear-review]

The constraint Bear chose to honour was aesthetic coherence. Every interface decision — the typefaces, the color themes, the line spacing, the amount of whitespace around a block of text — was chosen to make the writing experience feel considered and calm. The constraint it chose not to honour was universality. Bear was built for Apple's platforms, using Apple's design conventions and platform capabilities. A user who needed to access their notes on Windows or Android would need to choose a different application. [bear-app-philosophy]

<!-- beat: evidence -->
## Evidence

The most concrete evidence for Bear's design philosophy is the 2017 Apple Design Award. Apple's design awards are not popularity contests — they recognize applications that demonstrate mastery of Apple's platforms and design principles. Bear won in 2017, in the year after its launch, competing against established applications from much larger teams. The recognition is difficult to dismiss as an artifact of Apple's promotional interests: the company evaluates applications based on design quality, platform integration, and technical execution. [apple-design-award-bear, macrumors-bear-award]

The market evidence is harder to assess precisely because Bear has not published user or revenue figures. Its continued operation and development — culminating in the Bear 2 release in 2023, a major redesign — suggests that the subscription model produces sustainable revenue for a studio of its size. The absence of competitive pressure to add database features (Notion), collaboration (Evernote), or cross-platform support (both) suggests that the users Bear retains are the users Bear was designed for. [sixcolors-bear]

| Metric | Value | Confidence | Source |
|---|---|---|---|
| Bear public launch | January 2016 | confirmed | [bear-app-philosophy] |
| Apple Design Award | 2017 (WWDC) | confirmed | [apple-design-award-bear] |
| Bear Pro pricing | $1.49/mo or $14.99/yr | confirmed | [bear-app-philosophy] |
| Platform support | iOS and macOS only | confirmed | [bear-app-philosophy] |

![Hatch pointing at an Apple Design Award trophy from WWDC 2017.](/images/placeholder.png)

<!-- beat: aftermath -->
## Timeline

1. **January 2016** — Bear launches on iOS and macOS; writing-first design and aesthetic differentiate it immediately from Evernote and newer entrants.
2. **June 2017** — Apple gives Bear its Design Award at WWDC; significant community recognition for a small studio.
3. **2018–2022** — Bear Pro grows as Notion attracts power users; Bear retains users who want simplicity and offline access.
4. **September 2023** — Bear 2 launches with an improved editor, new themes, and a redesigned writing experience; core philosophy unchanged.
5. **2024** — Bear remains the preferred writing app for Apple-ecosystem users who prioritize aesthetics and simplicity.

<!-- beat: lesson -->
## The takeaway

![Hatch beside a single sharp pencil surrounded by multi-function tools set aside, representing Bear's focus philosophy.](/images/placeholder.png)

> **Focus is a promise — every feature you choose not to build is also a commitment that the features you kept will be excellent, and that promise is the product's relationship with its users.**
>
> — HackProduct autopsy

<!-- beat: references -->
## References

1. Apple Design Awards. *Apple*. [Tier A] https://developer.apple.com/design/awards/ — Supports Apple Design Award recognition, Apple's endorsement of Bear's design quality.
2. Bear app — about and philosophy. *Bear (Shiny Frog)*. [Tier A] https://bear.app — Supports stated design philosophy, writing-first approach, feature set, pricing.
3. "Bear review — the best notes app for iPhone and Mac." *The Verge*. [Tier B] https://www.theverge.com/22938425/bear-2-review — Supports user experience, design choices, writing focus, Markdown support.
4. "Bear wins Apple Design Award." *MacRumors*, June 2017. [Tier B] https://www.macrumors.com/2017/06/05/apple-design-award-winners-2017/ — Supports 2017 Apple Design Award, WWDC recognition.
5. "The best note-taking apps for 2023." *Fast Company*. [Tier B] https://www.fastcompany.com/best-note-taking-apps — Supports Bear's positioning, comparison with Notion and Obsidian.
6. "Bear vs Notion — which note app is right for you?" *AppStorm*. [Tier B] https://appstorm.net/roundups/office-roundups/bear-vs-notion — Supports Bear's differentiation, offline access, simplicity as positioning.
7. "Bear 2 review — a writer's tool." *Six Colors*, September 2023. [Tier B] https://sixcolors.com/post/2023/09/bear-2-review/ — Supports Bear's writing-first design, aesthetic philosophy, Markdown as native language.

<!-- beat: forward -->
## Next in queue

**[Wordle and the Clone Market](../nyt/wordle-clone-market.md)** — How a word game built by a software engineer for his partner became a global daily ritual, and what the New York Times' acquisition and the subsequent clone market reveal about what makes a game spread.

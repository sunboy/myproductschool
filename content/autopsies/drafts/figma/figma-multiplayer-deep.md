---
slug: figma-multiplayer-deep
companySlug: figma
companyName: Figma
title: Figma's Browser-Based Multiplayer
dek: How Dylan Field and Evan Wallace built a design tool that ran entirely in the browser, turned real-time collaboration into its defining feature, and changed what it meant to work on a design with another person in the same moment.
queueRank: 93
tier: 1
estimatedReadTime: 8 min read
status: draft
researchGaps:
  - The exact number of beta users before Figma's public launch in 2016 is not confirmed in primary sources.
  - Technical implementation details of Figma's CRDT-based multiplayer beyond what Figma's own engineering blog has disclosed are not publicly available.
  - Revenue figures before Figma's 2021 fundraise are not publicly disclosed; the "$10M ARR" figure cited in some sources is unverified.
sourceSummary: Eight sources support Figma's technical architecture, the multiplayer design decision, the growth trajectory, and the Adobe acquisition context. Primary sources include Evan Wallace's technical posts on WebGL and browser rendering, Dylan Field's founding interviews, and Figma's engineering blog. Trade press (The Verge, Wired, Bloomberg, TechCrunch, The Information) provides corroborating context on growth and the competitive landscape.
sources:
  - id: evan-wallace-figma-tech
    title: Figma's journey to real-time collaboration
    publisher: Figma Engineering Blog
    url: https://www.figma.com/blog/how-figmas-multiplayer-technology-works/
    tier: A
    accessedAt: 2026-05-17
    supports: CRDT-based multiplayer implementation, the decision to use WebGL for rendering, the architectural tradeoffs of browser-first versus native-first design, and the operational transformation approach used for conflict resolution.
  - id: dylan-field-founding-interview
    title: Dylan Field on founding Figma
    publisher: How I Built This / NPR
    url: https://www.npr.org/2021/11/19/1057154481/figma-dylan-field
    tier: A
    accessedAt: 2026-05-17
    supports: The founding story, the decision to build in the browser despite the performance challenges, the early Greylock pitch, and Field's framing of collaboration as the core product thesis.
  - id: figma-engineering-webgl
    title: Building a fast, online design tool with WebGL
    publisher: Figma Engineering Blog
    url: https://www.figma.com/blog/building-a-professional-design-tool-on-the-web/
    tier: A
    accessedAt: 2026-05-17
    supports: The WebGL rendering choice, why a browser-based tool could match native performance for vector graphics, and the specific technical challenges of making Figma feel fast.
  - id: theverge-figma-launch
    title: Figma wants to be the Google Docs of design
    publisher: The Verge
    url: https://www.theverge.com/2016/9/26/13043702/figma-design-tool-launch
    tier: B
    accessedAt: 2026-05-17
    supports: September 2016 public launch, the "Google Docs for design" framing, early user response, and the competitive positioning against Sketch.
  - id: wired-figma-adobe
    title: Figma's rise and the Adobe acquisition
    publisher: Wired
    url: https://www.wired.com/story/figma-adobe-acquisition/
    tier: B
    accessedAt: 2026-05-17
    supports: The growth trajectory from 2016 to 2022, the competitive dynamic with Adobe and Sketch, and the context around the $20B Adobe acquisition.
  - id: bloomberg-figma-valuation
    title: Figma raises at $10B valuation
    publisher: Bloomberg
    url: https://www.bloomberg.com/news/articles/2021-06-24/figma-design-software-startup-valued-at-10-billion-in-funding
    tier: B
    accessedAt: 2026-05-17
    supports: June 2021 $10B valuation fundraise context, growth metrics cited in the fundraise announcement.
  - id: techcrunch-figma-adobe-deal
    title: Adobe to acquire Figma for $20B
    publisher: TechCrunch
    url: https://techcrunch.com/2022/09/15/adobe-to-acquire-figma/
    tier: B
    accessedAt: 2026-05-17
    supports: September 2022 $20B acquisition announcement, the strategic rationale Adobe cited, and the regulatory context.
  - id: theinformation-figma-growth
    title: Inside Figma's rapid growth
    publisher: The Information
    url: https://www.theinformation.com/articles/inside-figmas-rapid-growth
    tier: B
    accessedAt: 2026-05-17
    supports: ARR growth trajectory, the shift from individual designer adoption to enterprise team contracts, and the competitive displacement of Sketch and Adobe XD.
metrics:
  - label: Figma public launch year
    value: "2016"
    confidence: confirmed
    sourceIds: [theverge-figma-launch]
  - label: Valuation at June 2021 funding round
    value: "$10B"
    confidence: confirmed
    sourceIds: [bloomberg-figma-valuation]
  - label: Adobe acquisition price (announced September 2022)
    value: "$20B"
    confidence: confirmed
    sourceIds: [techcrunch-figma-adobe-deal]
  - label: Time from public launch to $10B valuation
    value: "~5 years"
    confidence: confirmed
    sourceIds: [theverge-figma-launch, bloomberg-figma-valuation]
  - label: CRDT operations per second at peak multiplayer sessions
    value: Not publicly disclosed
    confidence: uncertain
    sourceIds: [evan-wallace-figma-tech]
  - label: Years of development before public launch
    value: "~4 years (2012-2016)"
    confidence: confirmed
    sourceIds: [dylan-field-founding-interview]
glanceCards:
  - id: setup
    title: It took four years to prove the browser could do this
    body: Figma was founded in 2012. The public launch was 2016. Those four years were spent solving a problem nobody had definitively solved before — making a professional vector graphics editor fast enough to use in a web browser, and then layering real-time collaboration on top of it.
    sourceIds: [dylan-field-founding-interview, figma-engineering-webgl]
    confidence: confirmed
  - id: problem
    title: Design tools were built for one person on one machine
    body: Sketch, Illustrator, and every design tool before Figma assumed a single designer working in a single file on a single computer. Collaboration meant emailing files, merging changes by hand, and debating which version was canonical. The workflow had not changed since 1987.
    sourceIds: [theverge-figma-launch, dylan-field-founding-interview]
    confidence: confirmed
  - id: tempting-move
    title: The obvious move was to add sharing to a native app
    body: The simpler path was to build a native Mac application — matching Sketch's performance — and add file sharing as a feature. This would have been faster to ship. It would also have left the collaboration problem structurally unsolved, because a native file on a local disk cannot be edited by two people simultaneously.
    sourceIds: [dylan-field-founding-interview, evan-wallace-figma-tech]
    confidence: confirmed
  - id: mechanism
    title: The mechanism was CRDTs running multiplayer in the browser
    body: Figma's multiplayer was built on conflict-free replicated data types — a mathematical approach to merging concurrent edits without a central locking authority. Each designer's changes were resolved locally and synced continuously. No one waited for a lock to release. No one got an "editing conflict" error.
    sourceIds: [evan-wallace-figma-tech]
    confidence: confirmed
  - id: evidence
    title: The evidence was who adopted it first — and why
    body: Figma's earliest enterprise customers were not design teams. They were product and engineering teams who needed to see the current design file without bothering a designer. The browser-based model meant a PM or engineer could open the design, leave a comment, and close the tab. The adoption path was bottom-up and cross-functional.
    sourceIds: [theinformation-figma-growth, wired-figma-adobe]
    confidence: plausible
  - id: takeaway
    title: The architectural constraint was the product's competitive moat
    body: Building in the browser was slower, harder, and more expensive than building native. It was also irreversible — a native tool cannot add real multiplayer without rebuilding its file model. The architectural choice made competition from incumbents structurally difficult.
    sourceIds: [wired-figma-adobe, dylan-field-founding-interview]
    confidence: confirmed
obviousAnswer:
  temptingMove:
    label: The tempting move
    bullets:
      - Build a native Mac application matching Sketch's performance
      - Add file sharing and version history as features afterward
      - Use a Dropbox-style sync approach for collaboration
      - Ship faster by avoiding the browser's performance ceiling
    summary: The faster path in 2012 was a native app with incremental collaboration features. Sketch had proven the market existed. Matching Sketch's performance was a solvable engineering problem. Adding cloud sync afterward was well-understood.
  whatShipped:
    label: What shipped
    bullets:
      - Browser-first rendering using WebGL for performance
      - CRDT-based multiplayer with no file-locking
      - Real-time cursor presence showing every collaborator's position
      - Persistent URL to a live design file, shareable with anyone
    summary: Figma built a design tool that treated the browser as the primary surface and multiplayer as a first-class architectural requirement — accepting four years of development cost to avoid a structural limitation they couldn't fix later.
lifecycle:
  - date: 2012-01
    label: Figma founded
    description: Dylan Field and Evan Wallace found Figma; Field is a 19-year-old Thiel Fellow at the time.
    type: launch
  - date: 2012-09
    label: Greylock invests in pre-product Figma
    description: Greylock Partners invests based on the browser-based design thesis; product is not yet working.
    type: milestone
  - date: 2016-09
    label: Public launch
    description: Figma opens to the public; early coverage frames it as "Google Docs for design."
    type: launch
  - date: 2019-01
    label: Figma begins significant enterprise adoption
    description: Product teams at large companies begin using Figma as a shared design viewer and review tool, driving enterprise contract growth.
    type: milestone
  - date: 2021-06
    label: Raises at $10B valuation
    description: Figma raises a Series E at a $10B valuation, having grown ARR significantly from the 2016 launch.
    type: milestone
  - date: 2022-09
    label: Adobe announces $20B acquisition
    description: Adobe announces intent to acquire Figma for $20B; deal later blocked by EU regulators in December 2023.
    type: today
takeaway:
  principle: An architectural decision that makes the first version harder to ship can make every subsequent version impossible for competitors to copy.
  sourceIds: [dylan-field-founding-interview, evan-wallace-figma-tech]
images:
  - role: hero
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch mascot (the HackProduct robot with the graduation cap and growth arrow) sitting at a browser window on a laptop, visible on screen is a colorful design canvas with two colored cursor dots overlapping — one labeled "Designer" and one labeled "PM." Hatch is watching both cursors move simultaneously, expression curious and slightly delighted. Cream background. HackProduct watermark bottom-right, 60% opacity, JetBrains Mono. Aspect 2400x1350.
    alt: Hatch watching two colored cursors move simultaneously on a design canvas, illustrating Figma's real-time multiplayer collaboration.
    watermark: HackProduct
  - role: scene
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in narrator pose, gesturing toward a stack of emailed design files — "design_v3_FINAL_revised.sketch" — piled in a messy inbox. The scene reads as the pain before Figma: version chaos, no canonical file, no shared context. Cream background, no speech bubble. HackProduct watermark bottom-right, 60% opacity, JetBrains Mono. Aspect 1600x1600.
    alt: Hatch gesturing toward a pile of confusingly named design file versions in an email inbox, illustrating the problem Figma solved.
    watermark: HackProduct
  - role: mechanism
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in thinking pose, looking at a simple branching diagram that shows two streams of edits merging cleanly — no conflict, no error, just a smooth join. The concept is CRDT conflict resolution. One stream is labeled "Designer A," the other "Designer B." Cream background. HackProduct watermark bottom-right, 60% opacity, JetBrains Mono. Aspect 1800x1200.
    alt: Hatch examining a diagram of two edit streams merging cleanly, illustrating Figma's CRDT-based conflict-free multiplayer.
    watermark: HackProduct
  - role: evidence
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch pointing at a simple timeline: "2012 founded," "2016 public launch," "2021 — $10B valuation." A dotted line continues to "2022 — $20B acquisition attempt." The bars rise steeply. Hatch's expression is analytical. HackProduct watermark bottom-right, 60% opacity, JetBrains Mono. Aspect 1600x1000.
    alt: Hatch examining a timeline chart showing Figma's growth from 2012 founding through the 2022 acquisition announcement.
    watermark: HackProduct
  - role: lesson
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in coaching pose — calm, grounded, one hand open as if offering a considered thought. Clean cream background, no props or charts. The image reads as a reflective conclusion. HackProduct watermark bottom-right, 60% opacity, JetBrains Mono. Aspect 1800x1200.
    alt: Hatch in a calm coaching stance, illustrating the takeaway from Figma's architectural multiplayer decision.
    watermark: HackProduct
  - role: thumbnail
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch mascot, small and centered, watching two colored cursor dots on a miniature design canvas. Clean cream background. Readable at small sizes. HackProduct watermark bottom-right, 60% opacity. Aspect 1200x900.
    alt: Hatch watching two cursors on a design canvas, thumbnail image for the Figma multiplayer autopsy.
    watermark: HackProduct
  - role: social-cover
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch mascot in hero pose watching two colored cursors moving simultaneously on a design canvas in the background. Large enough to read on a social card. HackProduct wordmark watermark bottom-right, 60% opacity, JetBrains Mono. Text area clear for OG title overlay. Aspect 2400x1260.
    alt: Hatch watching two cursors on a design canvas, social share image for the Figma multiplayer autopsy.
    watermark: HackProduct
nextInQueue:
  slug: calm-mvp
  companySlug: calm
  title: Calm's Minimum Viable App
---

<!-- beat: lede -->

In September 2016, Figma published a blog post announcing it was opening its design tool to the public. The accompanying press coverage offered a tidy summary of what made it interesting: it was, as The Verge put it, "the Google Docs of design." The framing was accurate enough to be useful and imprecise enough to miss the point. Google Docs had shown that documents could live in the browser. Figma had shown that professional creative tools — with precise vector rendering, complex layer hierarchies, and the performance requirements of interactive design work — could live there too. [theverge-figma-launch]

The distinction matters because it was not obvious in 2012 that this was achievable at all. When Dylan Field and Evan Wallace founded Figma, the web browser was capable of running text editors and spreadsheets with acceptable performance. It was not considered capable of running a tool that designers would stake their professional work on. The four years between Figma's founding and its public launch were spent proving that claim wrong, and building a multiplayer architecture on top of the proof.

<!-- beat: glance -->
## At a glance

**1. It took four years to prove the browser could do this.**
Figma was founded in 2012. The public launch was 2016. Those four years were spent solving a problem nobody had definitively solved before — making a professional vector graphics editor fast enough to use in a web browser, and then layering real-time collaboration on top of it. [dylan-field-founding-interview, figma-engineering-webgl]

**2. Design tools were built for one person on one machine.**
Sketch, Illustrator, and every design tool before Figma assumed a single designer working in a single file on a single computer. Collaboration meant emailing files, merging changes by hand, and debating which version was canonical. The workflow had not changed since 1987. [theverge-figma-launch, dylan-field-founding-interview]

**3. The obvious move was to add sharing to a native app.**
The simpler path was to build a native Mac application matching Sketch's performance and add file sharing as a feature afterward. This would have been faster to ship. It would also have left the collaboration problem structurally unsolved, because a native file on a local disk cannot be edited by two people simultaneously. [dylan-field-founding-interview, evan-wallace-figma-tech]

**4. The mechanism was CRDTs running multiplayer in the browser.**
Figma's multiplayer was built on conflict-free replicated data types — a mathematical approach to merging concurrent edits without a central locking authority. Each designer's changes were resolved locally and synced continuously. No one waited for a lock to release. [evan-wallace-figma-tech]

**5. The evidence was who adopted it first — and why.**
Figma's earliest enterprise customers were not design teams. They were product and engineering teams who needed to see the current design file without bothering a designer. The browser-based model meant a PM or engineer could open the design, leave a comment, and close the tab. [theinformation-figma-growth, wired-figma-adobe]

**6. The architectural constraint was the product's competitive moat.**
Building in the browser was slower, harder, and more expensive than building native. A native tool cannot add real multiplayer without rebuilding its file model. The architectural choice made competition from incumbents structurally difficult. [wired-figma-adobe, dylan-field-founding-interview]

<!-- beat: scene -->
## Background

![Hatch gesturing toward a pile of confusingly named design file versions in an email inbox, illustrating the problem Figma solved.](/images/placeholder.png)

In 2012, the state of design collaboration was this: a designer finished a screen, exported it as a PNG, and emailed it to the product manager. The PM annotated the PNG in Preview, emailed it back. The designer incorporated the feedback, made new changes, exported a new PNG. The email chain grew. Somewhere in it was a file called "checkout-screen-v4-FINAL-revised-2.sketch" that nobody was certain was the most current version.

For teams that moved quickly, this was a genuine operational problem. Decisions made in product meetings were not reflected in the design file until the designer manually updated it. Engineers built to designs that were three iterations behind what the designer was actually working on. The canonical source of truth for what a product was supposed to look like was, in practice, a designer's local hard drive.

This was not a new problem. It was the same problem that had existed since design tools became digital in the late 1980s. Sketch had not solved it — Sketch was a remarkable improvement over Adobe's tools in speed and usability, but it was still a single-user file on a local machine. Nobody had solved it because the tools were native applications, and native applications with local files have no architectural path to real-time collaborative editing without a fundamental redesign.

Dylan Field, then a 19-year-old Thiel Fellow who had dropped out of Brown University to build Figma, understood this as the central constraint. He had watched how Google Docs had changed the dynamics of collaborative writing — how the visibility of other people's cursors had subtly shifted the rhythm of group editing, making it feel like a shared space rather than a handoff protocol. He believed the same shift was possible for design. [dylan-field-founding-interview]

The question was whether the browser, in 2012, was capable of running the kind of tool a professional designer would actually use.

<!-- beat: choice -->
## The obvious answer and what shipped instead

| The tempting move | What shipped |
|---|---|
| Build a native Mac app matching Sketch's performance | Build in the browser using WebGL, accepting 4 years of development to achieve comparable performance |
| Add file sharing and version history as features afterward | Treat multiplayer as a first-class architectural requirement from day one |
| Use Dropbox-style file sync for "collaboration" | Build CRDT-based real-time sync where every collaborator sees every change instantly |
| Ship faster by meeting users where tools already were | Accept a slower, harder launch to create a structural advantage no incumbent could replicate |

The native-first path would have been faster and more competitive in the near term. Sketch was growing rapidly in 2012. A fast native app with better collaboration features than Sketch had would have been commercially viable. It also would have been incremental — it would not have changed the fundamental dynamics of how design and product teams interacted.

Field's insight — and the reason Greylock Partners invested before the product was working — was that the structural limitation of native tools was not a feature gap. It was an architectural gap that no amount of incremental improvement could close. If you want two people to edit a document simultaneously, the document cannot live on one person's hard drive. [dylan-field-founding-interview]

<!-- beat: mechanism -->
## How it actually works

Figma's performance challenge was real. Professional vector graphics — with bezier curves, complex layer hierarchies, hundreds of components, and pixel-perfect rendering — required a rendering pipeline that the browser's built-in 2D canvas API could not handle with acceptable speed. Evan Wallace, Figma's co-founder and chief architect, solved this by writing a custom WebGL renderer: a graphics pipeline that ran on the computer's GPU rather than its CPU, bypassing the browser's standard rendering path entirely. [evan-wallace-figma-tech, figma-engineering-webgl]

This was not a well-worn path. There were essentially no professional creative tools in 2012 running on WebGL in a browser. Wallace and Field were working from first principles.

The multiplayer layer was the second major engineering challenge. Allowing multiple designers to edit the same file simultaneously requires a conflict resolution system: what happens when two people move the same object at the same time, or one person deletes a layer while another is editing it? Figma's approach was based on conflict-free replicated data types, a mathematical structure that defines operations on shared state in a way that can be merged deterministically, regardless of the order in which they arrive. When Designer A and Designer B both move the same object, neither gets an error. The system applies both operations according to known rules and the state converges. [evan-wallace-figma-tech]

The constraint Figma honored was real-time presence. Every designer in a file sees every other designer's cursor, in real time, with a color-coded label. This was not technically necessary for the multiplayer to work — you could synchronize edits without showing cursors. But the cursor presence changed the social dynamic of the tool: it made a design file feel like a shared workspace rather than a file with a history.

The constraint they chose not to honor in the early years was feature parity with native tools. Early Figma lacked components, auto-layout, and several other capabilities that Sketch had. The team accepted this gap because the multiplayer architecture was the product's core thesis. Feature parity could be added; the architectural choice could not be reversed.

<!-- beat: evidence -->
## Evidence

What the public record confirms: Figma launched publicly in September 2016, raised a Series E at a $10 billion valuation in June 2021, and received a $20 billion acquisition offer from Adobe in September 2022 — approximately five years from public launch to a $20B exit valuation. Adobe's stated rationale for the acquisition was Figma's dominance in collaborative design, not its feature set. [bloomberg-figma-valuation, techcrunch-figma-adobe-deal]

What the public record cannot confirm: specific ARR figures before the 2021 fundraise, the breakdown of revenue by customer segment, or the rate at which Figma displaced Sketch and Adobe XD in enterprise design organizations. The EU's decision to block the Adobe acquisition in December 2023 was based on a finding that Figma was a potential direct competitor to Adobe's core products — a conclusion that implicitly validated Figma's competitive position.

| Metric | Value | Confidence | Source |
|---|---|---|---|
| Public launch year | 2016 | Confirmed | [theverge-figma-launch] |
| Years of development before public launch | ~4 years | Confirmed | [dylan-field-founding-interview] |
| Valuation at June 2021 funding | $10B | Confirmed | [bloomberg-figma-valuation] |
| Adobe acquisition price | $20B | Confirmed | [techcrunch-figma-adobe-deal] |
| Time from launch to $10B valuation | ~5 years | Confirmed | [theverge-figma-launch, bloomberg-figma-valuation] |

<!-- beat: voice -->

> We had this fundamental belief that design tools should be collaborative. Not in the "share a file" sense, but in the "two people editing at the same time" sense. That required building in the browser. Everything else followed from that.
>
> — Dylan Field, How I Built This / NPR, 2021

<!-- beat: aftermath -->
## Timeline

1. **January 2012** — Figma founded by Dylan Field (19-year-old Thiel Fellow) and Evan Wallace; Greylock Partners invests before the product is working.
2. **2012-2016** — Four-year development period; WebGL renderer built from scratch; CRDT-based multiplayer architecture designed and implemented.
3. **September 2016** — Public launch; The Verge and others cover it as "Google Docs for design."
4. **2019-2020** — Enterprise adoption accelerates; product and engineering teams begin using Figma as a design viewer and review surface, driving cross-functional adoption.
5. **June 2021** — Figma raises a Series E at $10B valuation; ARR growing rapidly.
6. **September 2022** — Adobe announces $20B acquisition; deal subsequently blocked by EU regulators in December 2023 on competition grounds.

<!-- beat: lesson -->
## The takeaway

![Hatch in a calm coaching stance, illustrating the takeaway from Figma's architectural multiplayer decision.](/images/placeholder.png)

> **An architectural decision that makes the first version harder to ship can make every subsequent version impossible for competitors to copy.**
>
> — HackProduct autopsy

<!-- beat: references -->
## References

1. **Figma's journey to real-time collaboration** — Figma Engineering Blog — Tier A — [evan-wallace-figma-tech] — Supports: CRDT-based multiplayer implementation, WebGL rendering choice, architectural tradeoffs.
2. **Dylan Field on founding Figma** — How I Built This / NPR — Tier A — [dylan-field-founding-interview] — Supports: Founding story, browser-first thesis, early Greylock pitch, collaboration framing.
3. **Building a fast, online design tool with WebGL** — Figma Engineering Blog — Tier A — [figma-engineering-webgl] — Supports: WebGL rendering choice, performance challenges, browser-first architecture.
4. **Figma wants to be the Google Docs of design** — The Verge, 2016 — Tier B — [theverge-figma-launch] — Supports: September 2016 public launch, "Google Docs for design" framing, early user response.
5. **Figma's rise and the Adobe acquisition** — Wired — Tier B — [wired-figma-adobe] — Supports: Growth trajectory, competitive dynamic with Adobe and Sketch, acquisition context.
6. **Figma raises at $10B valuation** — Bloomberg — Tier B — [bloomberg-figma-valuation] — Supports: June 2021 funding round at $10B valuation.
7. **Adobe to acquire Figma for $20B** — TechCrunch — Tier B — [techcrunch-figma-adobe-deal] — Supports: September 2022 $20B acquisition announcement.
8. **Inside Figma's rapid growth** — The Information — Tier B — [theinformation-figma-growth] — Supports: ARR growth trajectory, enterprise adoption pattern, competitive displacement.

<!-- beat: forward -->
## Next in queue

**[Calm's Minimum Viable App](/autopsies/calm/calm-mvp)** — How Alex Tew and Michael Acton Smith launched a meditation app by first publishing a bare website called "Do Nothing for 2 Minutes," and what that experiment taught them about their real market.

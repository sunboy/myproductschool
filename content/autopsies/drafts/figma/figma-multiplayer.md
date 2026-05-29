---
slug: figma-multiplayer
companySlug: figma
companyName: Figma
title: Figma Multiplayer
dek: A twenty-person startup bet that designers would learn to like an audience the way writers had, and shipped the cursor before anyone asked for it.
queueRank: 18
tier: 2
estimatedReadTime: 10 min read
status: draft
researchGaps:
  - The exact number of engineers Evan Wallace had helping on the multiplayer service in 2015 to 2016 is not stated in public sources.
  - Internal usage metrics from the December 2015 preview that informed the decision to make multiplayer the default have not been published.
  - Sketch's own internal deliberations about not building real-time collaboration in this window are not part of the public record, and the contrast in this article is inferred from product behaviour, not from documented strategy.
sourceSummary: Dylan Field's December 2015 launch post on the Figma blog supplies the original Writely framing, the Brown CS lab origin with Evan Wallace in April 2011, the funding round, and the explicit roadmap promise of simultaneous editing. Evan Wallace's September 2016 post details the abandoned "last writer wins" save model, the rationale for showing every cursor, and the decision to ship multiplayer as default rather than opt-in. Wallace's 2019 technical post documents the deliberate rejection of operational transforms and the custom CRDT-inspired engine that replaced them. TechCrunch's launch-day coverage independently confirms the twenty-person team size, the $18M funding round, and the September 28, 2016 public release. The Fortune profile of Field, the Inc feature, and the Aakash Gupta retrospective provide independent confirmation of dates and the Adobe and IPO outcomes. The public record does not include a Sketch counter-narrative for this period, so this article treats Sketch's absence from real-time collaboration as a fact about what shipped, not as a documented strategic choice.
sources:
  - id: field-launch-2015
    title: Design Meet the Internet
    publisher: Figma Blog
    url: https://www.figma.com/blog/design-meet-the-internet/
    tier: A
    accessedAt: 2026-05-17
    supports: Dylan Field's original launch post. Source for the Writely/Google Docs framing, the WebGL origin in the Brown CS lab in April 2011 with Evan Wallace, the $18M funding, the three years in stealth, and the explicit roadmap promise of simultaneous multiplayer editing.
  - id: wallace-multiplayer-2016
    title: Multiplayer Editing in Figma
    publisher: Figma Blog
    url: https://www.figma.com/blog/multiplayer-editing-in-figma/
    tier: A
    accessedAt: 2026-05-17
    supports: Evan Wallace's launch-day technical post. Source for the failed "download, edit, upload" save model, the people-saving-over-each-other problem, the rationale for showing every active participant's cursor, the rejection of the baton-passing alternative, and the undo principle.
  - id: wallace-tech-2019
    title: How Figma's multiplayer technology works
    publisher: Figma Blog
    url: https://www.figma.com/blog/how-figmas-multiplayer-technology-works/
    tier: A
    accessedAt: 2026-05-17
    supports: Confirms the four-year development window starting around 2015, the deliberate rejection of operational transforms in favour of a custom CRDT-inspired engine, and the design constraints around atomic property writes, reparenting, and client-side ID generation.
  - id: techcrunch-2016
    title: Design tool Figma launches multiplayer collaboration mode for interface designers
    publisher: TechCrunch
    url: https://techcrunch.com/2016/09/28/design-tool-figma-launches-multiplayer-collaboration-mode-for-interface-designers/
    tier: B
    accessedAt: 2026-05-17
    supports: Independent confirmation of the September 28, 2016 public launch date, the twenty-person team size, the $18M raised from Greylock, Index, OATV, and ICONIQ, and the positioning of Figma against Adobe Creative Cloud rather than Sketch by name.
  - id: figma-wiki
    title: Figma
    publisher: Wikipedia
    url: https://en.wikipedia.org/wiki/Figma
    tier: C
    accessedAt: 2026-05-17
    supports: Dates only. Confirms the December 3, 2015 preview release, the September 27, 2016 public launch, the Brown University and Thiel Fellowship backgrounds, the abandoned $20B Adobe acquisition in 2023, and the July 2025 NYSE IPO at a $56.3B closing market value.
  - id: fortune-field-2025
    title: Dylan Field, Figma's 33-year-old cofounder
    publisher: Fortune
    url: https://fortune.com/2025/08/01/figma-ipo-cofounder-dylan-field-former-linkedin-intern-peter-thiel-fellowship/
    tier: B
    accessedAt: 2026-05-17
    supports: Independent recap of the Thiel Fellowship, the August 2012 founding, and the eventual IPO valuation. Used for the today line in the timeline.
metrics:
  - label: Year the Brown CS lab WebGL conversation happened
    value: April 2011
    confidence: confirmed
    sourceIds: [field-launch-2015]
  - label: Time spent in stealth before the December 2015 preview
    value: ~3 years
    confidence: confirmed
    sourceIds: [field-launch-2015, figma-wiki]
  - label: Team size at the September 2016 multiplayer launch
    value: 20 people
    confidence: confirmed
    sourceIds: [techcrunch-2016]
  - label: Funding raised before the public launch
    value: $18 million across Greylock, Index, OATV, ICONIQ
    confidence: confirmed
    sourceIds: [field-launch-2015, techcrunch-2016]
  - label: Closing market value on Figma's first day as a public company
    value: $56.3 billion
    confidence: confirmed
    sourceIds: [figma-wiki, fortune-field-2025]
glanceCards:
  - id: setup
    title: Three years of silence
    body: Field and Wallace incorporated Figma in August 2012 and stayed in stealth for roughly three years, betting that WebGL had finally made the browser fast enough to render vector art at sixty frames per second. The preview opened in December 2015 with no multiplayer. [field-launch-2015][figma-wiki]
    sourceIds: [field-launch-2015, figma-wiki]
    confidence: confirmed
  - id: problem
    title: Designers worked alone
    body: The dominant workflow in 2015 was a single designer in a desktop app, exporting flat PNGs for review. Engineers had moved to GitHub and Google Docs years earlier. Designers had not. The argument against changing that was that careful work needs solitude. [field-launch-2015][techcrunch-2016]
    sourceIds: [field-launch-2015, techcrunch-2016]
    confidence: confirmed
  - id: tempting-move
    title: The polite path
    body: The cautious move was to ship multiplayer as an opt-in mode, behind a baton-passing button that gave one designer the active edit lock while others watched. Reviewers would not feel hovered over. Field's own engineers considered it and rejected it. [wallace-multiplayer-2016]
    sourceIds: [wallace-multiplayer-2016]
    confidence: confirmed
  - id: mechanism
    title: Cursors on by default
    body: Evan Wallace built a custom synchronisation engine that rejected the operational transforms used by Google Docs in favour of a CRDT-inspired model. Every active participant's cursor appeared on the canvas. There was no save button and no merge conflict dialog. [wallace-multiplayer-2016][wallace-tech-2019]
    sourceIds: [wallace-multiplayer-2016, wallace-tech-2019]
    confidence: confirmed
  - id: evidence
    title: A new default
    body: The September 28, 2016 launch landed with a twenty-person team and $18M raised. Reviews split. Some designers loved it, some described it as design by committee. Within five years the design tool category had reorganised itself around the assumption that multiplayer was the default. [techcrunch-2016][wallace-multiplayer-2016]
    sourceIds: [techcrunch-2016, wallace-multiplayer-2016]
    confidence: confirmed
  - id: takeaway
    title: The seam was already there
    body: Figma's document model already lived on the server. Multiplayer was not a new product. It was a property of a system the team had spent three years building for other reasons. The decision was whether to expose it to the user, or to keep it hidden behind a single-player metaphor. [wallace-tech-2019]
    sourceIds: [wallace-tech-2019]
    confidence: confirmed
obviousAnswer:
  temptingMove:
    label: The tempting move
    bullets:
      - Ship Figma as a faster, browser-based Sketch with a clean single-player canvas
      - Add a review mode where one designer drives and stakeholders watch a read-only stream
      - If multiplayer ever shipped, gate it behind a per-file toggle that defaults to off
    summary: Treat real-time collaboration as a feature you might add later, after the core designer audience has settled in.
  whatShipped:
    label: What shipped
    bullets:
      - Multiplayer baked into the file format, with no per-document toggle and no off switch
      - Every active participant's cursor visible on the canvas the moment they opened the file
      - No save button, no commit step, no merge conflict dialog, every keystroke synced
      - A custom CRDT-inspired engine, not operational transforms, optimised for shapes rather than text
    summary: Treat the shared canvas as the product, and design every other surface to honour the assumption that someone else might already be there.
lifecycle:
  - date: 2011-04
    label: WebGL conversation at Brown
    description: Wallace shows Field his WebGL image-processing experiment.
    type: milestone
  - date: 2012-08
    label: Figma incorporated
    description: Field and Wallace co-found the company in San Francisco.
    type: launch
  - date: 2015-12-03
    label: Invite-only preview opens
    description: First external designers get accounts, no multiplayer yet.
    type: milestone
  - date: 2016-09-28
    label: Public launch with multiplayer
    description: Multiplayer ships as the default, not an opt-in.
    type: launch
  - date: 2023-12
    label: Adobe acquisition collapses
    description: The $20B deal is abandoned after regulator pressure.
    type: pivot
  - date: 2025-07-31
    label: Figma goes public
    description: Closes its first NYSE day at a $56.3B market value.
    type: today
takeaway:
  principle: When the shared state already lives on a server, the courage is in exposing it as a shared canvas, not in hiding it behind a single-player metaphor.
  sourceIds: [wallace-multiplayer-2016, wallace-tech-2019]
images:
  - role: hero
    placeholder: /images/placeholder.png
    promptForCodex: |
      Create a flat geometric HackProduct autopsy hero illustration for Figma's September 2016 multiplayer launch. Canvas role: hero, aspect 2400x1350. Compose a single warm cream #faf6f0 canvas in the centre that fills two-thirds of the frame, rendered as a forest-green #4a7c59 rectangular artboard with three small abstract shapes inside, a rounded square, a triangle, and a circle. Over the artboard, draw three distinct arrow-shaped cursors in soft amber #c9ad68, deep forest #244232, and charcoal #1e211c, each one tilted at a different angle, each one trailing a small name label as a mist #dfe6dc pill. Above the artboard, draw a thin mist band labelled SHARED FILE and a small soft amber pulse marker. Use the canonical Hatch reference at public/images/hatch/hatch-official-mascot.png as a small narrator in the upper right, pointing one mitten hand at the three cursors. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. Leave quiet space in the upper left for title overlay. No human faces, no photorealism, no recreated Figma or Sketch screenshots, no dense text. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A cream-and-forest editorial illustration showing a shared design canvas with three differently coloured cursors and name labels, with Hatch in the upper right pointing at the cursors.
    caption: Three cursors, one file, no save button.
    watermark: HackProduct
  - role: scene
    placeholder: /images/placeholder.png
    promptForCodex: |
      Flat geometric scene illustration for the Brown CS lab moment in April 2011, aspect 1600x1600. Show a warm cream #faf6f0 university lab interior with a low forest-green #4a7c59 workbench, a single laptop screen showing an abstract WebGL render as overlapping translucent triangles in soft amber #c9ad68 and deep forest #244232, a small stack of CS textbooks on the bench, and a mist #dfe6dc window suggesting late afternoon. Add a charcoal #1e211c lab clock on the wall reading roughly four. Use the canonical Hatch reference at public/images/hatch/hatch-official-mascot.png as the main narrator, standing beside the workbench in a narrator pose, gesturing toward the laptop screen with one mitten hand. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. No human figures other than Hatch, no photorealism, no real screenshots, no logos, no university crests. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: Hatch standing beside a workbench in a quiet lab, gesturing toward a laptop showing an abstract triangle-based WebGL render.
    watermark: HackProduct
  - role: mechanism
    placeholder: /images/placeholder.png
    promptForCodex: |
      Flat geometric mechanism diagram for Figma's multiplayer sync engine, aspect 1800x1200. On warm cream #faf6f0, lay out three small forest-green #4a7c59 client cubes on the left, each labelled USER A, USER B, USER C, each emitting a thin charcoal #1e211c line carrying a tiny soft amber #c9ad68 property packet. The three lines converge into a single deep forest #244232 server cube in the centre labelled DOCUMENT, with a mist #dfe6dc grid suggesting the tree of objects inside. From the server cube, three matching lines fan back out to three faint mist canvases on the right, each showing the same artboard with the same three abstract shapes but with three different cursor positions in the cursor colours soft amber, deep forest, and charcoal. Label the central server cube quietly with the words LAST WRITER WINS PER PROPERTY. Use the canonical Hatch reference at public/images/hatch/hatch-official-mascot.png in a thinking pose at the lower right, pointing one mitten hand at the central server cube to mark the seam. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. No screenshots, no real UI recreations, no dense text. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A diagram with three client cubes feeding a central server cube and three downstream canvases, with Hatch pointing at the server to mark the central authority.
    watermark: HackProduct
  - role: evidence
    placeholder: /images/placeholder.png
    promptForCodex: |
      Flat geometric evidence card showing the gap between Figma's 2016 launch and its eventual scale, aspect 1600x1000. On warm cream #faf6f0, draw a small forest-green #4a7c59 square on the left labelled 2016 TEAM OF 20, $18M RAISED, with a thin mist #dfe6dc grid inside suggesting twenty tiny seats. On the right, draw a tall deep forest #244232 column labelled 2025 NYSE $56.3B, with a soft amber #c9ad68 candle marker at the top. Connect the two with a single thin charcoal #1e211c line that rises from left to right, with a small soft amber dot marking SEPT 28 2016 MULTIPLAYER SHIPS on the line. Use the canonical Hatch reference at public/images/hatch/hatch-official-mascot.png standing between the two artifacts in a pointing pose, with one mitten hand on the soft amber dot. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. Use one short label per artifact and one visible artifact shape only. No fake screenshots, no dense text. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A small forest square labelled with the 2016 team size and a tall forest column labelled with the 2025 IPO valuation, with Hatch pointing at the multiplayer launch marker on the connecting line.
    watermark: HackProduct
  - role: lesson
    placeholder: /images/placeholder.png
    promptForCodex: |
      Flat geometric lesson illustration for the takeaway that the shared state was already there, aspect 1800x1200. Background is warm cream #faf6f0. Draw a single deep forest #244232 server cylinder in the centre labelled SHARED STATE. Above it, layered like translucent panes, draw three faint mist #dfe6dc rectangles each labelled CLIENT, with subtle charcoal #1e211c outlines, suggesting that the multiple clients are views into the same cylinder. From the cylinder, draw a soft amber #c9ad68 ribbon that exits to the right and forms a small forest-green #4a7c59 cursor shape, suggesting the seam being exposed to the user. Above the panes, draw a thin charcoal label reading EXPOSE OR HIDE in small caps. Use the canonical Hatch reference at public/images/hatch/hatch-official-mascot.png in a calm coaching pose to the left of the cylinder, one mitten hand resting on the cylinder edge, facing the reader. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. No human faces, no photorealism, no recreated screenshots, no dense text. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A central server cylinder labelled shared state with three translucent client panes above it and a soft amber ribbon forming a cursor, with Hatch coaching from the left in a calm stance.
    watermark: HackProduct
  - role: thumbnail
    placeholder: /images/placeholder.png
    promptForCodex: |
      Flat geometric thumbnail composition for Figma multiplayer, aspect 1200x900. On warm cream #faf6f0, render one bold focal scene: a single forest-green #4a7c59 rectangular artboard in the centre with three differently coloured arrow cursors hovering over it, one in soft amber #c9ad68, one in deep forest #244232, one in charcoal #1e211c. Add a small mist #dfe6dc shadow under the artboard for elevation. Use the canonical Hatch reference at public/images/hatch/hatch-official-mascot.png as a tiny watermark-adjacent mark in the bottom-left, no larger than 12 percent of canvas height. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. Keep the decision readable at small size with one strong focal shape. No labels, no screenshots, no dense text. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A single forest-green artboard with three differently coloured cursors hovering above it, with a tiny Hatch mark in the corner.
    watermark: HackProduct
  - role: social-cover
    placeholder: /images/placeholder.png
    promptForCodex: |
      Flat geometric social cover image for the Figma multiplayer story, aspect 2400x1260. On warm cream #faf6f0, place a central composition that occupies the centre 70 percent of the canvas: a forest-green #4a7c59 rectangular artboard with three small abstract shapes inside, a rounded square, a triangle, and a circle, and three arrow cursors in soft amber #c9ad68, deep forest #244232, and charcoal #1e211c hovering over it at different angles. Above the artboard, draw one short charcoal label reading CURSORS ON BY DEFAULT in small caps. Keep the centre 70 percent clear of edge-critical details. Use the canonical Hatch reference at public/images/hatch/hatch-official-mascot.png as a small narrator in the upper right corner, pointing one mitten hand at the artboard. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. No fake screenshots, no human faces, no dense text. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A wide cover image showing a shared artboard with three cursors and a small charcoal label reading cursors on by default, with a small Hatch narrator in the upper right.
    watermark: HackProduct
nextInQueue:
  slug: slack-emoji-reactions
  companySlug: slack
  title: Slack Emoji Reactions
---

<!-- beat: lede -->

On the morning of September 28, 2016, a designer in San Francisco opened a browser tab on a small product called Figma and saw something that did not exist anywhere else. A second cursor moved across her canvas. It belonged to a colleague three desks away. There was no invitation, no review session, no save button. The colleague had simply opened the same URL and started working [wallace-multiplayer-2016]. The cursor had a name on it.

The team that shipped it was twenty people. Dylan Field and Evan Wallace had spent three years in stealth, raising eighteen million dollars from Greylock and Index on the idea of a design tool in the browser [field-launch-2015][techcrunch-2016]. The bet they were making was older than any of the engineering. It was that designers would learn to value an audience the way writers had come to value one in Google Docs, even though no designer was asking for it and several were on record saying they did not want it [wallace-multiplayer-2016].

What follows is the story of how that cursor got on screen, why a cautious team would have hidden it behind a toggle, and what changed when it was not. The question to carry through is small. When shared state already lives on a server, what does a team gain by showing the user that other people are there?

<!-- beat: glance -->
## At a glance

**1. Three years of silence**

Field and Wallace incorporated Figma in August 2012 and stayed in stealth for roughly three years, betting that WebGL had finally made the browser fast enough to render vector art at sixty frames per second. The preview opened in December 2015 with no multiplayer. [field-launch-2015][figma-wiki]

**2. Designers worked alone**

The dominant workflow in 2015 was a single designer in a desktop app, exporting flat PNGs for review. Engineers had moved to GitHub and Google Docs years earlier. Designers had not. The argument against changing that was that careful work needs solitude. [field-launch-2015][techcrunch-2016]

**3. The polite path**

The cautious move was to ship multiplayer as an opt-in mode, behind a baton-passing button that gave one designer the active edit lock while others watched. Reviewers would not feel hovered over. Field's own engineers considered it and rejected it. [wallace-multiplayer-2016]

**4. Cursors on by default**

Evan Wallace built a custom synchronisation engine that rejected the operational transforms used by Google Docs in favour of a CRDT-inspired model. Every active participant's cursor appeared on the canvas. There was no save button and no merge conflict dialog. [wallace-multiplayer-2016][wallace-tech-2019]

**5. A new default**

The September 28, 2016 launch landed with a twenty-person team and eighteen million dollars raised. Reviews split. Some designers loved it, some described it as design by committee. Within five years the design tool category had reorganised itself around the assumption that multiplayer was the default. [techcrunch-2016][wallace-multiplayer-2016]

**6. The seam was already there**

Figma's document model already lived on the server. Multiplayer was not a new product. It was a property of a system the team had spent three years building for other reasons. The decision was whether to expose it to the user, or to keep it hidden behind a single-player metaphor. [wallace-tech-2019]

<!-- beat: scene -->
## Background

![Hatch in the scene placeholder, see image-manifest in front matter](/images/placeholder.png)

The moment that becomes Figma starts in April 2011, in a computer science lab at Brown. Dylan Field, an undergraduate who chairs the CS departmental undergraduate group, watches a classmate named Evan Wallace come back from a weekend hackathon and pull up a browser tab. Wallace has just re-implemented a server-side image processing API in WebGL, in the browser itself. He turns to Field and says, in Field's later retelling, that they could use this thing to build creative tools in the browser [field-launch-2015]. A year of conversations follows. In August 2012 they incorporate Figma in San Francisco, Field on a Thiel Fellowship and Wallace freshly out of school [field-launch-2015][figma-wiki].

The three years that follow are quiet on purpose. The pair spends them solving a single technical question: can a browser, using WebGL, render vector art smoothly enough at sixty frames per second that a designer would not notice she is in a browser at all [field-launch-2015]. The preview release on December 3, 2015 is the answer. It is a browser-based design tool. It saves to the cloud. It has a clean canvas and a vector network pen tool. It has no multiplayer [wallace-multiplayer-2016].

The world the preview lands in is a world of solitary work. Sketch, the dominant tool among interface designers, runs on a single Mac and produces a file that is moved around as an email attachment or a Dropbox object. Adobe's Creative Cloud suite is the incumbent above it [techcrunch-2016]. The implicit assumption built into every one of these tools is that a designer does her best work alone. The reviewer comes in afterward, looks at a flat PNG, and writes comments in another window.

Field had been holding that disagreement longer than the product existed. In his launch post he writes that, ever since Writely became Google Docs ten years earlier, he has believed all software should be online, real-time, and collaborative [field-launch-2015]. The roadmap item at the end of that post is a single line with three exclamation marks: simultaneous, multiplayer editing. The team has nine months to ship it.

<!-- beat: choice -->
## The obvious answer and what shipped instead

The obvious answer in spring 2016 was to ship multiplayer carefully, if at all. The baton-passing pattern was the polite option: one designer holds the active edit lock, everyone else watches a read-only stream. The reasoning behind caution was real. Designers had built careers around solitary craft, and several were on record saying an audience over their shoulder would produce design by committee [wallace-multiplayer-2016]. A more risk-averse team would have hidden the cursor behind a toggle.

| The tempting move | What shipped |
|---|---|
| Ship Figma as a faster, browser-based Sketch with a clean single-player canvas | Multiplayer baked into the file format, with no per-document toggle and no off switch |
| Add a review mode where one designer drives and stakeholders watch a read-only stream | Every active participant's cursor visible on the canvas the moment they opened the file |
| Gate multiplayer behind a per-file toggle that defaults to off | No save button, no commit step, no merge conflict dialog, every keystroke synced |
| *Treat real-time collaboration as a feature you might add later, after the designer audience has settled in.* | *Treat the shared canvas as the product, and design every other surface to honour the assumption that someone else might already be there.* |

<!-- beat: mechanism -->
## How it actually works

![Mechanism placeholder, see image-manifest in front matter](/images/placeholder.png)

The detail almost no one noticed is that Figma's document had always lived on the server. The preview release in December 2015 looked like a single-player tool, but underneath, the file format was an addressable tree of objects keyed by a stable identifier, and every property on every object was a value the server already knew about [wallace-tech-2019]. The first saving model was the naive one: download, edit locally, upload the whole thing back. It worked for a single designer. It broke the moment two designers opened the same file, because the second save silently overwrote the first [wallace-multiplayer-2016]. That bug, more than any external pressure, made multiplayer non-optional.

Wallace spent roughly a year rebuilding the synchronisation layer. The team considered operational transforms, the algorithm that powers Google Docs and that anyone in 2016 would have reached for first. They rejected it. Operational transforms are designed for long strings of characters being edited concurrently; Figma was not a text editor. Its atoms were object properties: the fill colour of a rectangle, the position of a frame, the parent of a layer [wallace-tech-2019]. For atoms of that shape, they built a custom engine inspired by conflict-free replicated data types, with the server acting as the central authority and resolving conflicts on a last-writer-wins basis at the property level [wallace-tech-2019].

The design choice everyone remembers is the cursor. The first thing a user sees when she opens a shared file alongside someone else is a second arrow moving across her screen with a name label. Wallace's launch post is precise: the cursor provides context about who else is here and where they are working [wallace-multiplayer-2016]. The team considered a baton-passing mode that gave one designer the active lock at a time and rejected it as lacking elegance [wallace-multiplayer-2016].

The constraint honoured was zero friction. No save button. No merge dialog. No per-document toggle. If a file is open, the session is live. The constraint ignored was the design-alone identity many designers had built careers around. The launch split exactly along that line: some designers ran collaborative sessions for the pleasure of it, others described the result as a camel designed by committee [wallace-multiplayer-2016].

Two second-order effects fell out. The first: because every cursor had a name, the canvas became a venue for design review, and the practice of exporting flat PNGs into Slack threads quietly began to fade [techcrunch-2016]. The second was harder to anticipate. The shared URL became a single source of truth, meaning a product manager or an engineer could be in the file without owning anything in it. Within a few years that shift had reorganised who counted as a participant in design at all.

<!-- beat: evidence -->
## Evidence

The mechanism is unusually well-documented for a 2016 launch, because Wallace wrote the technical posts himself. The launch-day post lays out the abandoned save model, the cursor decision, and the rejection of baton-passing in the engineer's own words [wallace-multiplayer-2016]. The 2019 follow-up documents the rejection of operational transforms and the CRDT-inspired engine with design constraints written out explicitly [wallace-tech-2019]. Field's December 2015 post supplies the strategic frame and the roadmap promise [field-launch-2015]. TechCrunch's coverage independently confirms the date, the twenty-person team size, and the eighteen-million-dollar round [techcrunch-2016].

Causal share is, as ever, harder to isolate. Figma grew for several reasons in the years after multiplayer shipped. The product was free for students, creating a generational pipeline of users trained on Figma before they entered the industry. The vector network pen tool, contextual commenting, and the constraint-based layout system were all part of the same launch [techcrunch-2016]. The cursor decision is the move historians return to, and it deserves the attention, but no public source breaks out its contribution as a separate line. A careful reader should hold it alongside the rest of the 2016 launch, not treat it as a clean single-variable experiment.

The numbers below describe the team that shipped the decision and the scale it eventually reached.

| Metric | Value | Confidence | Source |
|---|---|---|---|
| WebGL conversation at Brown | April 2011 | Confirmed | [field-launch-2015] |
| Time in stealth before preview | ~3 years | Confirmed | [field-launch-2015][figma-wiki] |
| Team size at September 2016 launch | 20 people | Confirmed | [techcrunch-2016] |
| Funding raised before launch | $18M from Greylock, Index, OATV, ICONIQ | Confirmed | [field-launch-2015][techcrunch-2016] |
| Market value at IPO close, July 31, 2025 | $56.3B | Confirmed | [figma-wiki][fortune-field-2025] |

![Evidence placeholder, see image-manifest in front matter](/images/placeholder.png)

<!-- beat: voice -->

> "Ever since Writely (now called Google Docs) launched ten years ago, I've believed that all software should be online, real-time, and collaborative. Creative tools haven't made the leap because the browser has not been powerful enough. Now, with WebGL, everything has changed."
>
> — Dylan Field, co-founder, Figma, Figma Blog, December 3, 2015

<!-- beat: aftermath -->
## Timeline

1. **2011-04**, Evan Wallace shows Dylan Field a WebGL experiment in the Brown CS lab. [field-launch-2015]
2. **2012-08**, Field and Wallace incorporate Figma in San Francisco. [figma-wiki]
3. **2015-12-03**, The invite-only preview opens with no multiplayer support. [wallace-multiplayer-2016][figma-wiki]
4. **2016-09-28**, Multiplayer ships as the default in the public launch. [techcrunch-2016][wallace-multiplayer-2016]
5. **2023-12**, The Adobe acquisition deal at roughly $20B collapses under regulator pressure. [figma-wiki]
6. **2025-07-31**, Figma closes its first day on the NYSE at a $56.3B market value. [figma-wiki][fortune-field-2025]

<!-- beat: lesson -->
## The takeaway

![Lesson placeholder, see image-manifest in front matter](/images/placeholder.png)

> **When the shared state already lives on a server, the courage is in exposing it as a shared canvas, not in hiding it behind a single-player metaphor.**
>
> — HackProduct autopsy

The same move turns up wherever a product has shared state hiding under a single-player skin. Google Docs replaced the email-the-attachment ritual with a URL any number of writers could open at once. Notion made every page a live object rather than a saved file. Each product had the same choice Figma had: keep the metaphor of a private document, or expose the truth that the file lives on a server and visitors are already there. The companies that exposed it tended to win the category. The ones that hid it tended to discover Sketch's fate a few years later.

<!-- beat: references -->
## References

1. **Design Meet the Internet**, Figma Blog · Tier A · accessed 2026-05-17. https://www.figma.com/blog/design-meet-the-internet/
   Supports: Dylan Field's original launch post. Source for the Writely framing, the Brown CS lab origin in April 2011 with Evan Wallace, the $18M funding, the three years in stealth, and the explicit roadmap promise of simultaneous multiplayer editing.
2. **Multiplayer Editing in Figma**, Figma Blog · Tier A · accessed 2026-05-17. https://www.figma.com/blog/multiplayer-editing-in-figma/
   Supports: Evan Wallace's launch-day technical post. Source for the failed download-edit-upload save model, the people-saving-over-each-other problem, the rationale for showing every active participant's cursor, the rejection of baton-passing, and the undo principle.
3. **How Figma's multiplayer technology works**, Figma Blog · Tier A · accessed 2026-05-17. https://www.figma.com/blog/how-figmas-multiplayer-technology-works/
   Supports: Confirms the four-year development window starting around 2015, the deliberate rejection of operational transforms in favour of a custom CRDT-inspired engine, and the design constraints around atomic property writes and client-side ID generation.
4. **Design tool Figma launches multiplayer collaboration mode for interface designers**, TechCrunch · Tier B · accessed 2026-05-17. https://techcrunch.com/2016/09/28/design-tool-figma-launches-multiplayer-collaboration-mode-for-interface-designers/
   Supports: Independent confirmation of the September 28, 2016 public launch date, the twenty-person team size, the $18M raised from Greylock, Index, OATV, and ICONIQ, and the positioning of Figma against Adobe Creative Cloud.
5. **Figma**, Wikipedia · Tier C · accessed 2026-05-17. https://en.wikipedia.org/wiki/Figma
   Supports: Dates only. Confirms the December 3, 2015 preview release, the September 27, 2016 public launch, the Brown University and Thiel Fellowship backgrounds, the abandoned $20B Adobe acquisition in 2023, and the July 2025 NYSE IPO at a $56.3B closing market value.
6. **Dylan Field, Figma's 33-year-old cofounder**, Fortune · Tier B · accessed 2026-05-17. https://fortune.com/2025/08/01/figma-ipo-cofounder-dylan-field-former-linkedin-intern-peter-thiel-fellowship/
   Supports: Independent recap of the Thiel Fellowship, the August 2012 founding, and the eventual IPO valuation. Used for the today line in the timeline.

<!-- beat: forward -->
## Next in queue

**Slack Emoji Reactions**, A single emoji on a message that quietly replaced a thousand "+1" replies and rewrote how teams agreed without typing.

→ [/autopsies/slack/slack-emoji-reactions](/autopsies/slack/slack-emoji-reactions)

---
slug: gmail-undo-send
companySlug: google
companyName: Google
title: How Gmail Made Send Reversible Without Promising Recall
dek: A short delivery delay turned the most regretted click on the internet into a bounded, recoverable moment.
queueRank: 2
tier: 1
estimatedReadTime: 10 min read
status: draft
researchGaps:
  - Public record does not state adoption percentages, retention impact, or revenue impact for Undo Send during or after the Labs period.
  - Exact Google-internal counts for how often users press Undo are not published.
  - Google's official posts describe the Labs feature as popular but do not share specific usage numbers.
sourceSummary: Public sources confirm the Labs launch on Mar. 19, 2009, designer Michael Leggett as the originator with engineer Yuzo Fujishima, product manager Todd Jackson's framing of the Labs program, the original 5-second delivery delay, the 2015 graduation to a formal Gmail web setting, and the current 5, 10, 20, or 30-second options. They confirm the mechanism is a held send, not a post-delivery recall. They do not support quantified adoption, retention, or revenue claims, and they do not name a public success metric beyond durability and the move out of Labs.
sources:
  - id: gm-labs-undo
    title: New in Labs Undo Send
    publisher: Official Gmail Blog
    url: https://gmail.googleblog.com/2009/03/new-in-labs-undo-send.html
    tier: A
    accessedAt: 2026-05-17
    supports: 2009 Labs origin, Michael Leggett as the post author, the problem framing of immediate post-send regret, and the initial 5-second delivery delay.
  - id: gm-labs-intro
    title: Introducing Gmail Labs
    publisher: Official Gmail Blog
    url: https://gmail.googleblog.com/2008/06/introducing-gmail-labs.html
    tier: A
    accessedAt: 2026-05-17
    supports: Gmail Labs as the opt-in experimental channel that launched in June 2008, including the position that Labs features can break, change, or disappear.
  - id: gm-web-setting
    title: Undo Send for Gmail on the Web
    publisher: Google Workspace Updates
    url: https://workspaceupdates.googleblog.com/2015/06/undo-send-for-gmail-on-web.html
    tier: A
    accessedAt: 2026-05-17
    supports: The Jun. 23, 2015 graduation from Labs to a formal Gmail web setting and the policy that existing Labs users kept the behavior on.
  - id: gm-help-unsend
    title: Send or Unsend Gmail Messages
    publisher: Gmail Help
    url: https://support.google.com/mail/answer/2819488?hl=en-uk
    tier: A
    accessedAt: 2026-05-17
    supports: Current product behavior including the 5, 10, 20, or 30-second cancellation periods and the user flow for Undo on desktop and mobile.
  - id: gm-keyword-2023
    title: How to Unsend an Email in Gmail
    publisher: Google Keyword Blog
    url: https://blog.google/products-and-platforms/products/gmail/how-to-unsend-email-gmail/
    tier: A
    accessedAt: 2026-05-17
    supports: Current default 5-second cancellation window, the configurable maximum of 30 seconds, and parity across web and mobile.
  - id: gm-cnn-2009
    title: Where Undo Send and Other Gmail Ideas Are Born
    publisher: CNN
    url: https://www.cnn.com/2009/TECH/03/25/gmail.labs.email/index.html
    tier: B
    accessedAt: 2026-05-17
    supports: Real verbatim quote from Michael Leggett, the role of 20 percent time in producing Labs features, and product manager Todd Jackson's framing of how Labs avoided a formal screening process.
  - id: gm-pcworld-2015
    title: Google Finally Makes Undo Send an Official Gmail Feature
    publisher: PCWorld
    url: https://www.pcworld.com/article/428203/google-finally-makes-undo-send-an-official-gmail-feature.html
    tier: B
    accessedAt: 2026-05-17
    supports: Trade press confirmation that Undo Send spent roughly six years in Labs before graduating to a formal Gmail web setting in 2015.
metrics:
  - label: Labs launch date
    value: Mar. 19, 2009
    confidence: confirmed
    sourceIds: [gm-labs-undo, gm-cnn-2009]
  - label: Initial cancellation window
    value: 5 seconds
    confidence: confirmed
    sourceIds: [gm-labs-undo]
  - label: Graduation to formal Gmail web setting
    value: Jun. 23, 2015
    confidence: confirmed
    sourceIds: [gm-web-setting, gm-pcworld-2015]
  - label: Current cancellation period options
    value: 5, 10, 20, or 30 seconds
    confidence: confirmed
    sourceIds: [gm-help-unsend, gm-keyword-2023]
  - label: Time spent in Labs before graduation
    value: About six years
    confidence: high_confidence
    sourceIds: [gm-web-setting, gm-pcworld-2015]
glanceCards:
  - id: setup
    title: A designer kept hitting Send too fast
    body: Michael Leggett, a Gmail designer at Google, kept noticing typos, wrong recipients, and missing attachments the instant after he clicked Send. He wanted that feeling of regret to have an exit door [gm-labs-undo, gm-cnn-2009].
    sourceIds: [gm-labs-undo, gm-cnn-2009]
    confidence: confirmed
  - id: problem
    title: Recall promises break across systems
    body: Once an email leaves Gmail, it crosses servers, clients, and forwarding rules that Google does not control. A true recall would be a promise the product could not keep, especially for senders outside the same organization [gm-labs-undo].
    sourceIds: [gm-labs-undo]
    confidence: high_confidence
  - id: tempting-move
    title: The tempting fix was a corporate recall feature
    body: The version a less careful team ships looks heroic, a recall button that claws messages back after delivery. It sounds powerful and demos well, but it relies on cooperation from inboxes that Gmail has no authority over [gm-labs-undo, gm-help-unsend].
    sourceIds: [gm-labs-undo, gm-help-unsend]
    confidence: high_confidence
  - id: mechanism
    title: Gmail held the message instead of chasing it
    body: The shipped behavior is a short delivery delay. When a user clicks Send, Gmail waits for a configurable window before actually releasing the message. If Undo is clicked during that window, the draft returns to compose, untouched [gm-labs-undo, gm-help-unsend].
    sourceIds: [gm-labs-undo, gm-help-unsend]
    confidence: confirmed
  - id: evidence
    title: Six quiet years in Labs, then a default
    body: Undo Send sat in Gmail Labs from Mar. 19, 2009 until Jun. 23, 2015, when Google promoted it to a formal Gmail web setting. Existing Labs users kept it on, and the default window is now 5 seconds [gm-web-setting, gm-keyword-2023].
    sourceIds: [gm-web-setting, gm-keyword-2023]
    confidence: confirmed
  - id: takeaway
    title: A safety feature is a contract on the action, not the world
    body: Gmail did not change what email is. It changed the moment of commitment. The lesson generalises beyond email. When the world cannot be controlled, give the user a small window where the action has not yet escaped them [gm-labs-undo, gm-help-unsend].
    sourceIds: [gm-labs-undo, gm-help-unsend]
    confidence: high_confidence
obviousAnswer:
  temptingMove:
    label: The tempting move
    bullets:
      - Add a Recall Message button that promises to pull a sent email back from any inbox.
      - Send a follow-up cancellation request to recipient mail servers.
      - Build a corporate-only feature that works inside one company and breaks everywhere else.
    summary: A recall feature sounds heroic, but it is a promise email infrastructure cannot honour once a message has left the building.
  whatShipped:
    label: What shipped
    bullets:
      - Hold the outgoing message for a configurable window of 5 to 30 seconds before actually delivering it.
      - Show a one-click Undo affordance during that window that returns the draft to compose.
      - Keep Send as the primary action so the experience still feels immediate.
    summary: A small held-send buffer turns the moment of regret into a bounded, recoverable click without making any promise about the outside world.
lifecycle:
  - date: 2008-06
    label: Gmail Labs opens
    description: Google introduces an opt-in channel for experimental Gmail features.
    type: milestone
  - date: 2009-03-19
    label: Undo Send launches in Labs
    description: Michael Leggett publishes the Gmail blog post announcing the feature.
    type: launch
  - date: 2009-03-25
    label: CNN profiles the Labs program
    description: Coverage names Leggett as the designer and credits 20 percent time.
    type: milestone
  - date: 2015-06-23
    label: Graduation to a formal Gmail setting
    description: Undo Send moves from Labs to a permanent web setting.
    type: milestone
  - date: 2026
    label: Default 5 seconds, configurable to 30
    description: Available on Gmail web and mobile with four cancellation windows.
    type: today
takeaway:
  principle: Safety features are contracts on the moment of the action, not promises about the world the action enters.
  sourceIds: [gm-labs-undo, gm-help-unsend, gm-keyword-2023]
images:
  - role: hero
    placeholder: /images/placeholder.png
    promptForCodex: |
      A flat geometric HackProduct autopsy illustration for Gmail Undo Send. Canvas role hero, aspect 2400x1350. The scene shows a single cream message envelope hovering in the centre of a warm cream `#faf6f0` field, paused mid-flight inside a soft amber `#c9ad68` countdown ring marked with thin charcoal `#1e211c` tick marks at 5, 10, 20, and 30. A forest `#4a7c59` arrow leads from the envelope back toward a small return-to-compose tray rendered as a notched deep forest `#244232` slot. Hatch the HackProduct mascot stands in the lower left at about 14 percent of canvas height, in narrator pose, mitten hand pointing up at the ring, graduation cap and growth arrow intact, green `H` chest mark visible. Leave the upper left quiet for the article title overlay. No Gmail logo, no Google logo, no real screenshot. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A paused message envelope suspended inside a countdown ring with Hatch pointing at the return path, the image of a held send.
    caption: Send becomes a countdown, not a commitment.
    watermark: HackProduct
  - role: scene
    placeholder: /images/placeholder.png
    promptForCodex: |
      A flat geometric HackProduct autopsy illustration for Gmail Undo Send. Canvas role scene, aspect 1600x1600 square. The scene depicts a quiet 2009 designer desk rendered in clean shapes, no photoreal detail: a beige notebook, a small monitor showing only a generic message thread block in mist `#dfe6dc` and cream `#faf6f0`, and one half-filled coffee mug. The monitor displays a single sent-message card with a tiny red dot indicating regret, plus a fading speech-bubble carrying the words wrong Larry. Hatch stands at the right of the desk in narrator pose, about 18 percent of canvas height, mitten hand gesturing toward the regret dot, friendly coach expression, graduation cap and growth arrow intact, green `H` chest mark, all official mascot traits preserved. Palette: cream background, forest `#4a7c59` desk edge, amber `#705c30` mug, charcoal `#1e211c` linework. No human faces, no real product logos, no real screenshots. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: Hatch at a stylised 2009 designer desk pointing at a single regret marker on a screen, conveying the origin moment of the feature.
    watermark: HackProduct
  - role: mechanism
    placeholder: /images/placeholder.png
    promptForCodex: |
      A flat geometric HackProduct autopsy illustration for Gmail Undo Send. Canvas role mechanism, aspect 1800x1200. The composition is a left-to-right horizontal timeline rendered on cream `#faf6f0`. From left, three message cards labelled draft, sent, delivered, in mist `#dfe6dc` outlined in charcoal `#1e211c`. Between sent and delivered, a forest `#4a7c59` holding zone shaped like a soft rectangle is labelled with four small chips reading 5s, 10s, 20s, 30s in soft amber `#c9ad68`. A loop arrow curves from the holding zone back toward the draft card, marked with the word Undo in deep forest `#244232`. Hatch sits at the lower right at about 15 percent of canvas height in thinking pose, mitten finger raised toward the holding zone, graduation cap and growth arrow intact, green `H` chest mark visible, friendly coach expression, all official mascot traits preserved. No real Gmail UI, no logos. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A three-stage message timeline with a labelled holding zone and a return loop, showing how a delivery delay creates a recoverable window.
    watermark: HackProduct
  - role: evidence
    placeholder: /images/placeholder.png
    promptForCodex: |
      A flat geometric HackProduct autopsy illustration for Gmail Undo Send. Canvas role evidence, aspect 1600x1000. The image is a clean six-year ledger band on cream `#faf6f0`. Two vertical markers anchor the band: one on the left labelled 2009 in deep forest `#244232`, one on the right labelled 2015. Between them, a horizontal mist `#dfe6dc` track holds a small flask icon at the start representing Labs and a small badge icon at the end representing the formal Gmail setting. A forest `#4a7c59` arrow flows from flask to badge, with a single soft amber `#c9ad68` chip on the arrow reading six years. Hatch stands at the right in pointing pose, about 16 percent of canvas height, mitten hand directed at the badge end of the ledger, graduation cap and growth arrow intact, green `H` chest mark visible. No charts beyond the ledger, no fake screenshots. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A six-year ledger band marking the journey from Labs experiment to formal Gmail setting, with Hatch pointing at the graduation badge.
    watermark: HackProduct
  - role: lesson
    placeholder: /images/placeholder.png
    promptForCodex: |
      A flat geometric HackProduct autopsy illustration for Gmail Undo Send. Canvas role lesson, aspect 1800x1200. The composition centres on a clean cream `#faf6f0` field with one strong visual metaphor: an open hand-shaped mitten outline rendered in forest `#4a7c59`, holding a single cream envelope just before release. Above the hand, a soft amber `#c9ad68` arc traces a small window of time. Below the hand, a charcoal `#1e211c` horizon line separates the controlled space inside the product from a faintly drawn mist `#dfe6dc` field labelled the world. Hatch stands beside the hand in coaching pose, calm posture, about 18 percent of canvas height, mitten arm extended in a teaching gesture, graduation cap and growth arrow intact, green `H` chest mark visible, friendly coach expression, all official mascot traits preserved. No corporate marks. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A mitten hand holding an envelope under a short time arc with Hatch coaching beside it, showing the contract on the moment of the action.
    watermark: HackProduct
  - role: thumbnail
    placeholder: /images/placeholder.png
    promptForCodex: |
      A flat geometric HackProduct autopsy illustration for Gmail Undo Send. Canvas role thumbnail, aspect 1200x900. One strong focal shape: a single cream `#faf6f0` envelope at the centre, suspended inside a soft amber `#c9ad68` ring that reads 30 in deep forest `#244232` at the top. A small forest `#4a7c59` curved back-arrow wraps the bottom of the ring. Background is warm cream with a single mist `#dfe6dc` ground band. Hatch appears only as a tiny mark in the lower right corner, about 7 percent of canvas height, simple pointing pose, graduation cap and growth arrow intact, green `H` chest mark visible, official mascot traits preserved. The composition must remain legible at 320 pixels wide and survive a 4:3 listing crop. No text inside the envelope, no logos. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A single envelope held inside a 30-second ring with a back-arrow, readable at small thumbnail sizes.
    watermark: HackProduct
  - role: social-cover
    placeholder: /images/placeholder.png
    promptForCodex: |
      A flat geometric HackProduct autopsy illustration for Gmail Undo Send. Canvas role social cover, aspect 2400x1260. The composition keeps the centre 70 percent clear of edge-critical details so it survives 1.91:1 share crops. A single cream `#faf6f0` envelope floats in the centre, suspended above a forest `#4a7c59` curved timeline arc that bends back on itself. Soft amber `#c9ad68` tick marks at four positions along the arc represent the 5, 10, 20, and 30-second windows. Background is warm cream with one deep forest `#244232` horizontal band along the lower edge to anchor the watermark. Hatch sits at the lower right corner in small narrator pose, about 12 percent of canvas height, mitten hand pointing toward the envelope, graduation cap and growth arrow intact, green `H` chest mark visible, friendly coach expression. No logos, no real screenshots. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A centred envelope above a forest-green return arc with four amber time markers, designed for social share previews.
    watermark: HackProduct
nextInQueue:
  slug: facebook-like-button
  companySlug: meta
  title: Facebook Like Button
---

<!-- beat: lede -->

A person presses Send on a long email and a second later sees the word attachment in the sentence they just sent, with no attachment beneath it. The cursor blinks on an empty thread. There is no file. There is no way to take the message back. The recipient is a manager who reads quickly. The next thirty seconds belong to a particular kind of dread, the kind people have felt since the day email was invented, and the kind almost every email product has shrugged at.

Undo Send is the small affordance in Gmail that gives that person five seconds, or thirty if they prefer, to make the dread go away. It launched as a Gmail Labs experiment on March 19, 2009, written up by designer Michael Leggett and built with engineer Yuzo Fujishima [gm-labs-undo, gm-cnn-2009]. Six years later, in June 2015, it graduated into a formal Gmail web setting [gm-web-setting, gm-pcworld-2015].

What follows is the story of why the team did not build the feature anyone in 2009 expected, the corporate-style recall button. It is also a study in what it earns to refuse to make a promise your product cannot keep. The question worth carrying through is small. When users beg for a feature that would require lying to them about how the world works, what does the team that respects them actually ship?

<!-- beat: glance -->
## At a glance

**1. A designer kept hitting Send too fast**

Michael Leggett, a Gmail designer at Google, kept noticing typos, wrong recipients, and missing attachments the instant after he clicked Send. He wanted that feeling of regret to have an exit door [gm-labs-undo, gm-cnn-2009].

**2. Recall promises break across systems**

Once an email leaves Gmail, it crosses servers, clients, and forwarding rules that Google does not control. A true recall would be a promise the product could not keep, especially for senders outside the same organization [gm-labs-undo].

**3. The tempting fix was a corporate recall feature**

The version a less careful team ships looks heroic, a recall button that claws messages back after delivery. It sounds powerful and demos well, but it relies on cooperation from inboxes that Gmail has no authority over [gm-labs-undo, gm-help-unsend].

**4. Gmail held the message instead of chasing it**

The shipped behavior is a short delivery delay. When a user clicks Send, Gmail waits for a configurable window before actually releasing the message. If Undo is clicked during that window, the draft returns to compose, untouched [gm-labs-undo, gm-help-unsend].

**5. Six quiet years in Labs, then a default**

Undo Send sat in Gmail Labs from Mar. 19, 2009 until Jun. 23, 2015, when Google promoted it to a formal Gmail web setting. Existing Labs users kept it on, and the default window is now 5 seconds [gm-web-setting, gm-keyword-2023].

**6. A safety feature is a contract on the action, not the world**

Gmail did not change what email is. It changed the moment of commitment. The lesson generalises beyond email. When the world cannot be controlled, give the user a small window where the action has not yet escaped them [gm-labs-undo, gm-help-unsend].

<!-- beat: scene -->
## Background

![Hatch in the scene placeholder, see image-manifest in front matter](/images/placeholder.png)

Gmail Labs opens in June 2008 as an opt-in tab in Gmail settings where engineers and designers can ship a feature without going through formal product review, gather real usage, and either polish it into the main product or let it quietly disappear when nobody opens it [gm-labs-intro]. The detail almost no one outside the team notices is how thoroughly Labs flips the cost of being wrong. A formal Gmail feature has to be defended. A Labs feature only has to be turned off.

Michael Leggett is one of those designers. In 2006, before Labs exists, he sends a message to the wrong Larry inside Google [gm-cnn-2009]. The detail is small and exact in a way that explains the rest of the story. He cannot unsend it. He sits at his desk and watches a half-finished thought leave his outbox knowing it has crossed into a colleague's inbox, and the feeling does not pass. Two years later he is still thinking about that moment. He files it under a category every Gmail engineer recognises by then. Things email got wrong that nobody seems willing to fix.

Labs gives him a route. He pairs with engineer Yuzo Fujishima, and they build a working prototype that lives in the Labs tab through late 2008 and early 2009 [gm-labs-undo, gm-cnn-2009]. The product manager for the area, Todd Jackson, frames the program publicly in March 2009 as a deliberate end-run around the heavyweight review process. Labs lets a Gmail feature reach real users without first surviving the meetings that normally precede a launch [gm-cnn-2009].

By early March 2009, the prototype is ready to ship under that lighter contract. The team is standing at a small but interesting fork. The feature can promise to take an email back from the world, or it can promise something narrower and truer. The choice they make in the next few days is the one this story is about.

<!-- beat: choice -->
## The obvious answer and what shipped instead

The obvious answer in 2009 had a name people already knew. Microsoft Outlook had shipped Recall This Message in the late 1990s, and inside a single Exchange organization the feature genuinely worked. Recall became the default mental model for what an email product should offer. A Gmail team that wanted credit for solving regret was expected to ship Gmail's version of that button. It would have demoed beautifully. It would have failed silently the moment the recipient sat on a different mail server.

| The tempting move | What shipped |
|---|---|
| Add a Recall Message button that promises to pull a sent email back from any inbox. | Hold the outgoing message for a configurable window of 5 to 30 seconds before actually delivering it. |
| Send a follow-up cancellation request to recipient mail servers. | Show a one-click Undo affordance during that window that returns the draft to compose. |
| Build a corporate-only feature that works inside one company and breaks everywhere else. | Keep Send as the primary action so the experience still feels immediate. |
| *A recall feature sounds heroic, but it is a promise email infrastructure cannot honour once a message has left the building.* | *A small held-send buffer turns the moment of regret into a bounded, recoverable click without making any promise about the outside world.* |

<!-- beat: mechanism -->
## How it actually works

![Mechanism placeholder, see image-manifest in front matter](/images/placeholder.png)

The seam the team noticed is one most users have never thought about, because the product is built to hide it. Inside Gmail, Send is not a single act. The button labelled Send is the visible end of a short pipeline, and at the back of that pipeline is a queue. When a user clicks Send, the composed message lands first in Gmail's own outbound queue, and only some milliseconds later is it handed to SMTP and routed toward the recipient's mail server [gm-labs-undo]. The original delay between click and dispatch is small enough to feel instantaneous, but it is not zero. Leggett and Fujishima did not have to invent a new system. They had to stretch one that already existed.

The mechanism then is almost embarrassingly simple. When a Labs user with Undo Send turned on clicks Send, Gmail waits five seconds before releasing the message to outbound delivery [gm-labs-undo]. A thin yellow banner appears in the inbox with a single Undo link. Click it during those five seconds and the draft returns to compose, formatting, recipients, attachments, and cursor position intact. Do nothing and the window closes and the message goes out as a normal email. The current product behaviour is the same shape, with the window selectable as 5, 10, 20, or 30 seconds [gm-help-unsend, gm-keyword-2023].

The constraint the team chose to honour was the meaning of the Send button. Send still looks like Send. There is no second confirmation step, no checkbox to enable Are You Sure mode, no friction layered on top of the most common action in the product. A user who never clicks Undo never sees the feature at all [gm-help-unsend]. The constraint the team chose to ignore was the strict mental model that pressing Send equals message leaving instantly. A five-second delay broke that model, gently. Most senders never noticed. The few who did, noticed because they needed to.

Two second-order effects fell out of the design. The first arrived from enterprise customers. A 5-second window protected against attachment mistakes and recipient slips, but executives wanted longer cushions, and Google eventually exposed 10, 20, and 30-second options to satisfy that demand [gm-help-unsend]. The second arrived in 2015, when Google decided the feature had earned a permanent home in the main Gmail settings page and graduated it out of Labs, keeping existing Labs users opted in by default [gm-web-setting, gm-pcworld-2015]. There was a third effect the team almost certainly did not anticipate in 2009. Held-send became an idiom. Every modern email client today, from Apple Mail to Superhuman, ships a version of the same buffer, defaulting to a few seconds, exposing a small Undo affordance, and never once promising to recall a message that has actually left.

<!-- beat: evidence -->
## Evidence

The public record is unusually clean on dates and mechanism, and unusually quiet on impact. Google's own posts confirm the Labs origin in March 2009, the original 5-second window, the 2015 graduation, and the current four-position cancellation control [gm-labs-undo, gm-web-setting, gm-keyword-2023]. CNN's March 2009 coverage names Leggett as the designer and Todd Jackson as the program's product manager [gm-cnn-2009]. PCWorld's 2015 piece corroborates the six-year Labs tenure [gm-pcworld-2015]. On what shipped and when, the file is closed.

On what it earned, the file is open. None of the sources cited above publishes adoption percentages, retention impact, or any quantified link between Undo Send and the broader growth of Gmail. Google has described the Labs feature as popular without saying how popular. The honest confound is that Gmail itself grew through the same window for many independent reasons, the Labs program produced dozens of features over the same six years, and the rise of mobile email pushed every client to revisit its safety affordances. Undo Send sits inside that swirl, not above it. The strongest defensible claim is the one that matters most for a case study. The feature was durable enough to survive six years of optional life and then become default behaviour for one of the largest email products in the world.

| Metric | Value | Confidence | Source |
|---|---|---|---|
| Labs launch date | Mar. 19, 2009 | Confirmed | [gm-labs-undo] |
| Initial cancellation window | 5 seconds | Confirmed | [gm-labs-undo] |
| Graduation to formal setting | Jun. 23, 2015 | Confirmed | [gm-web-setting] |
| Current cancellation period options | 5, 10, 20, or 30 seconds | Confirmed | [gm-help-unsend] |

![Evidence placeholder, see image-manifest in front matter](/images/placeholder.png)

<!-- beat: voice -->

> "Sometimes I send a message and then immediately notice a mistake. I forget to attach a file, or e-mail the birthday girl that I can't make her surprise party."
>
> Michael Leggett, Gmail designer, Official Gmail Blog, March 2009 [gm-labs-undo, gm-cnn-2009]

<!-- beat: aftermath -->
## Timeline

1. **2008-06**, Gmail Labs opens as an opt-in channel for experimental features. [gm-labs-intro]
2. **2009-03-19**, Undo Send launches in Labs, written up by Michael Leggett with engineer Yuzo Fujishima. [gm-labs-undo]
3. **2009-03-25**, CNN profiles the Labs program and names Leggett as the designer behind the feature. [gm-cnn-2009]
4. **2015-06-23**, Google graduates Undo Send from Labs to a formal Gmail web setting. [gm-web-setting]
5. **2026**, Available on Gmail web and mobile with cancellation windows of 5, 10, 20, or 30 seconds. [gm-help-unsend]

<!-- beat: lesson -->
## The takeaway

![Lesson placeholder, see image-manifest in front matter](/images/placeholder.png)

> **Safety features are contracts on the moment of the action, not promises about the world the action enters.**
>
> HackProduct autopsy

The same swap turns up elsewhere once the eye is trained for it. Slack lets a user edit a posted message inside a window and then locks it, refusing to fake any change to what other clients have cached. Twitter, by contrast, spent more than a decade refusing to ship an edit button at all, on the grounds that an edit would be a promise about other people's timelines it could not keep. The product gets to define the window in which an action is recoverable. It does not get to redefine the world the action enters once that window closes.

<!-- beat: references -->
## References

1. **New in Labs Undo Send**, Official Gmail Blog · Tier A · accessed 2026-05-17. https://gmail.googleblog.com/2009/03/new-in-labs-undo-send.html
   Supports: 2009 Labs origin, Michael Leggett as author, initial 5-second delay, problem framing.
2. **Introducing Gmail Labs**, Official Gmail Blog · Tier A · accessed 2026-05-17. https://gmail.googleblog.com/2008/06/introducing-gmail-labs.html
   Supports: Gmail Labs as the opt-in experimental channel that launched in June 2008.
3. **Undo Send for Gmail on the Web**, Google Workspace Updates · Tier A · accessed 2026-05-17. https://workspaceupdates.googleblog.com/2015/06/undo-send-for-gmail-on-web.html
   Supports: Jun. 23, 2015 graduation from Labs to formal Gmail web setting.
4. **Send or Unsend Gmail Messages**, Gmail Help · Tier A · accessed 2026-05-17. https://support.google.com/mail/answer/2819488?hl=en-uk
   Supports: Current cancellation period options and user flow.
5. **How to Unsend an Email in Gmail**, Google Keyword Blog · Tier A · accessed 2026-05-17. https://blog.google/products-and-platforms/products/gmail/how-to-unsend-email-gmail/
   Supports: Default 5-second window and parity across web and mobile.
6. **Where Undo Send and Other Gmail Ideas Are Born**, CNN · Tier B · accessed 2026-05-17. https://www.cnn.com/2009/TECH/03/25/gmail.labs.email/index.html
   Supports: Real Leggett quote, the wrong-Larry anecdote, the role of 20 percent time, and Todd Jackson's framing of Labs.
7. **Google Finally Makes Undo Send an Official Gmail Feature**, PCWorld · Tier B · accessed 2026-05-17. https://www.pcworld.com/article/428203/google-finally-makes-undo-send-an-official-gmail-feature.html
   Supports: Trade press confirmation of the six-year Labs period and graduation.

<!-- beat: forward -->
## Next in queue

**Facebook Like Button**, A tiny reaction primitive became portable feedback infrastructure for the open web.

→ [/autopsies/meta/facebook-like-button](/autopsies/meta/facebook-like-button)

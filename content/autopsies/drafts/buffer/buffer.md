---
slug: buffer
companySlug: buffer
companyName: Buffer
title: Buffer
dek: Joel Gascoigne spent zero dollars and seven weeks testing whether anyone wanted a scheduling tool before writing a single line of it.
queueRank: 30
tier: 2
estimatedReadTime: 10 min read
status: draft
researchGaps:
  - The exact wording on the original two-page landing page (the "not quite ready" message) is not preserved in the public record verbatim; all reconstructions draw from Joel's own 2011 blog post paraphrase.
  - No first-person account from Leo Wildrich (co-founder) about the validation period has been identified.
  - The precise number of people who clicked a paid plan during the pricing-page test (versus clicked free) is not stated in any source.
sourceSummary: >-
  Joel Gascoigne's own Buffer blog post from February 2011 ("Idea to Paying Customers in 7 Weeks") is the primary source and provides the three-stage landing page structure, the 120 signup figure, the timeline, and several direct quotes. His later Medium post on landing page MVPs elaborates on the philosophy. The Launcher newsletter and Startup Founder Stories provide corroborating detail on the pricing tiers ($0, $5, $20) and the first paying customer timeline. The Buffer 10-year retrospective and the Mark MacLeod interview supply the longer arc: AngelPad, the $3.3M investor buyout, and the calm-company transition. The public record does not capture the internal conversation at the moment Joel decided to stop coding and test the page; that moment is reconstructed from his blog account.
sources:
  - id: buffer-7weeks
    title: Idea to Paying Customers in 7 Weeks: How We Did It
    publisher: Buffer Blog
    url: https://buffer.com/resources/idea-to-paying-customers-in-7-weeks-how-we-did-it/
    tier: A
    accessedAt: 2026-05-17
    supports: Primary first-person account of the three-stage landing page, the 120 signups, the 7-week build, the November 2010 launch, and the first paying customer within 4 days.
  - id: gascoigne-medium
    title: How to successfully validate your idea with a Landing Page MVP
    publisher: Medium (Joel Gascoigne)
    url: https://medium.com/@joelgascoigne/how-to-successfully-validate-your-idea-with-a-landing-page-mvp-ef3c2d02dc51
    tier: A
    accessedAt: 2026-05-17
    supports: Joel's retrospective philosophy on validated learning, the funnel logic, and the quote about not optimising for signup volume.
  - id: launcher-twopages
    title: "From $0 to Paying Customers: The Two-Page Strategy That Launched Buffer"
    publisher: The Launcher (Substack)
    url: https://thelauncher.substack.com/p/from-0-to-paying-customers-the-two
    tier: B
    accessedAt: 2026-05-17
    supports: Pricing tier breakdown ($0, $5, $20), the first paying customer's $5 payment described as "jumping-around-the-room" exciting, and end-of-month-1 figures (100 signups, 3 paying customers).
  - id: buffer-10years
    title: Reflecting on 10 Years of Building Buffer
    publisher: Buffer Blog
    url: https://buffer.com/resources/10-years/
    tier: A
    accessedAt: 2026-05-17
    supports: Milestones including AngelPad 2011, the 2016 layoffs, the $3.3M investor buyout in 2018, the 4-day workweek pilot, and the 18 consecutive profitable quarters figure.
  - id: macleod-interview
    title: "Buffer's Founder Joel Gascoigne on Radical Transparency, Getting Off the VC Track, and Long-Term Thinking"
    publisher: Mark MacLeod (markmacleod.me)
    url: https://markmacleod.me/buffers-founder-joel-gascoigne-on-radical-transparency-getting-off-the-vc-track-and-long-term-thinking/
    tier: B
    accessedAt: 2026-05-17
    supports: Joel's account of raising $4M total, buying out investors, the calm-company philosophy, and Buffer's $22.3M ARR figure.
  - id: hustle-buffer
    title: "Buffer: From Revenue on Day 4 to $3.5 Million a Year"
    publisher: The Hustle
    url: https://thehustle.co/from-revenue-on-day-4-to-3-5-million-a-year-how-buffer-started
    tier: B
    accessedAt: 2026-05-17
    supports: Early growth trajectory, the November 30 2010 launch date, the 4% conversion rate to paid plans, and Joel's Eric Ries influence.
metrics:
  - label: Signups from the landing page test
    value: 120 over 7 weeks
    confidence: confirmed
    sourceIds: [buffer-7weeks, gascoigne-medium]
  - label: Users who converted at product launch
    value: 50 of 120 signed up for the real product on day one
    confidence: confirmed
    sourceIds: [buffer-7weeks]
  - label: Days to first paying customer after launch
    value: 3-4 days
    confidence: confirmed
    sourceIds: [launcher-twopages, buffer-7weeks]
  - label: Buffer ARR as of 2024
    value: $22.3M ARR
    confidence: confirmed
    sourceIds: [macleod-interview]
  - label: Total VC raised (lifetime)
    value: $4M total (including $3.3M spent buying investors out in 2018)
    confidence: confirmed
    sourceIds: [buffer-10years, macleod-interview]
glanceCards:
  - id: setup
    title: The problem was personal
    body: In late 2010 Joel Gascoigne wanted to share links and quotes on Twitter throughout the day without scheduling each tweet individually. Existing tools required picking exact times. He wanted a queue that auto-spaced tweets. No such tool existed. [buffer-7weeks]
    sourceIds: [buffer-7weeks]
    confidence: confirmed
  - id: problem
    title: The cold start every founder fears
    body: Every tool builder faces the same question before writing code: is this a real problem for other people, or only for me? Joel had built a previous product without asking. It failed. He was not going to do that again. [buffer-7weeks, gascoigne-medium]
    sourceIds: [buffer-7weeks, gascoigne-medium]
    confidence: confirmed
  - id: tempting-move
    title: The obvious thing
    body: Build the product. Even a minimal version takes weeks of evenings. Joel initially started coding Buffer before catching himself. The sunk cost of early engineering was the trap he had already walked into once before. [buffer-7weeks]
    sourceIds: [buffer-7weeks]
    confidence: confirmed
  - id: mechanism
    title: Three pages, no product
    body: Page one described the tool. Page two collected email addresses from people who clicked "Plans and Pricing." A later third page inserted pricing tiers ($0, $5, $20) to test willingness to pay before a single line of scheduling code existed. [launcher-twopages, buffer-7weeks]
    sourceIds: [launcher-twopages, buffer-7weeks]
    confidence: confirmed
  - id: evidence
    title: 120 signups and one $5 payment
    body: In seven weeks, 120 people gave their email. Joel personally emailed most of them. Fifty used the product when it launched. The first $5 payment arrived within four days of going live, not from a stranger but from a person Joel had already spoken with. [buffer-7weeks, launcher-twopages]
    sourceIds: [buffer-7weeks, launcher-twopages]
    confidence: confirmed
  - id: takeaway
    title: The pattern that spread
    body: The Buffer landing page test became one of the most cited examples of the fake-door technique in startup methodology. Joel later wrote a nuanced correction, warning that landing pages often fail to produce real validated learning when founders optimise for signups instead of conversations. [gascoigne-medium]
    sourceIds: [gascoigne-medium]
    confidence: confirmed
obviousAnswer:
  temptingMove:
    label: The tempting move
    bullets:
      - Begin coding the scheduling feature and refine it until it felt ready to show people
      - Post on Twitter asking friends if they'd use a tool like this (social-proof validation, not demand validation)
      - Build a full free beta and observe whether users stick around
    summary: Treat product development as the validation, and ship the real thing before learning whether anyone wanted it.
  whatShipped:
    label: What shipped
    bullets:
      - A two-page site that described the product and collected emails from people who clicked "Plans and Pricing"
      - A third intermediate page added later showing three pricing tiers before the email capture
      - Personal email conversations with almost every person who signed up, to test whether the problem was real
    summary: Treat the landing page as a product, and let paying intent prove demand before writing a scheduling algorithm.
lifecycle:
  - date: 2010-10
    label: Landing page launched
    description: Two-page MVP goes live; Joel tweets it to 1,700 followers.
    type: launch
  - date: 2010-11-30
    label: Buffer v1 ships
    description: Joel launches the working product on Hacker News, November Startup Sprint deadline.
    type: launch
  - date: 2010-12-03
    label: First paying customer
    description: First $5 payment arrives three to four days after launch.
    type: milestone
  - date: 2011
    label: AngelPad and seed round
    description: Buffer joins AngelPad; raises $450K seed funding.
    type: milestone
  - date: 2013
    label: Open salaries go public
    description: Buffer publishes every employee salary with transparent formula; applications double.
    type: milestone
  - date: 2018
    label: Investor buyout
    description: Buffer spends $3.3M buying back VC stakes to operate independently.
    type: pivot
  - date: 2024
    label: Calm company at scale
    description: Joel Gascoigne describes Buffer as operating at $22.3M ARR at the time of the Mark MacLeod interview.
    type: today
takeaway:
  principle: A landing page is a product, and a conversation is faster than a codebase at finding out whether anyone wants the thing.
  sourceIds: [buffer-7weeks, gascoigne-medium]
images:
  - role: hero
    placeholder: /images/placeholder.png
    promptForCodex: |
      Create a flat geometric HackProduct autopsy hero illustration for Buffer's 2010 landing page validation story. Canvas role: hero, aspect 2400x1350. On a warm cream #faf6f0 background, compose three sequential page-shaped rectangles arranged left to right with a thin forest-green #4a7c59 connector arrow between each. The left rectangle is a simple product description page with two small charcoal #1e211c text-block shapes and a forest-green button labelled PLANS AND PRICING. The middle rectangle shows three pricing rows: $0, $5, and $20, rendered as soft amber #c9ad68 chips. The right rectangle is an email-capture field with a deep forest #244232 submit button. Above the three pages draw a thin mist #dfe6dc banner labelled NO CODE YET in charcoal. Place Hatch from public/images/hatch/hatch-official-mascot.png in the upper right as a small narrator pointing at the pricing page. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. Leave quiet space in the upper left for a title overlay. No photorealism, no real screenshots, no dense text. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: Three sequential page rectangles showing a product description, a pricing tier selector, and an email capture, with Hatch narrating from the upper right.
    caption: Three pages. No code. One question answered.
    watermark: HackProduct
  - role: scene
    placeholder: /images/placeholder.png
    promptForCodex: |
      Flat geometric scene illustration for Joel Gascoigne working on a laptop in Birmingham, UK, late 2010, aspect 1600x1600. On warm cream #faf6f0, show a small home desk with a forest-green #4a7c59 lamp casting soft amber #c9ad68 light on an open laptop. The laptop screen shows two small window outlines side by side: one a half-finished code editor (deep forest #244232 lines) and one a clean white page wireframe. Beside the laptop, a small open notepad shows three rows: TWEET QUEUE, EMAILS, USERS written in charcoal #1e211c. Use Hatch from public/images/hatch/hatch-official-mascot.png as the main narrator, standing beside the desk in a quiet observational pose, one mitten hand resting on the desk edge. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. No human figures, no photorealism, no real logos, no dense text. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: Hatch standing beside a small home desk lit by a warm lamp, with a laptop showing a code editor beside a clean page wireframe and a notepad with three rows of notes.
    watermark: HackProduct
  - role: mechanism
    placeholder: /images/placeholder.png
    promptForCodex: |
      Flat geometric mechanism diagram for Buffer's three-stage landing page test, aspect 1800x1200. On cream #faf6f0, draw four horizontal stages connected by thin charcoal #1e211c arrows. Stage one: a deep forest #244232 rectangle labelled TWEET (a small bird-shape outline above it). Stage two: a forest-green #4a7c59 page rectangle labelled PAGE 1: DESCRIBE with a green button at the bottom. Stage three: a soft amber #c9ad68 pricing card with three rows labelled FREE, $5, $20. Stage four: a mist #dfe6dc email-field rectangle with a submit button. Below stage three, draw a small branching arrow with a forest-green dot labelled EMAIL JOEL and a loop back to the stage, showing the personal conversation step. Place Hatch from public/images/hatch/hatch-official-mascot.png in a thinking pose at the lower right, one mitten hand pointing at the pricing stage to mark the constraint swap. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. No screenshots, no dense text. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A four-stage pipeline from tweet to pricing selector to email capture, with Hatch pointing at the pricing stage and a personal-conversation loop below it.
    watermark: HackProduct
  - role: evidence
    placeholder: /images/placeholder.png
    promptForCodex: |
      Flat geometric evidence illustration for Buffer's validation metrics, aspect 1600x1000. On warm cream #faf6f0, draw three stacked bars from left to right. The first bar is mist #dfe6dc and tall, labelled 120 SIGNUPS in charcoal #1e211c. The second bar is forest-green #4a7c59, roughly half the height, labelled 50 ACTIVE AT LAUNCH. The third bar is deep forest #244232 and short but distinct, labelled FIRST $5 PAYMENT with a small soft amber #c9ad68 star above it and the annotation 4 DAYS. Below the bars, draw a thin horizontal timeline in charcoal from OCT 2010 to DEC 2010 with three dots marking the validation period, launch, and first payment. Place Hatch from public/images/hatch/hatch-official-mascot.png between the second and third bars in a pointing pose, one mitten hand indicating the third bar. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. No fake screenshots, no dense text. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: Three stacked bars labelled 120 signups, 50 active at launch, and first $5 payment, with Hatch pointing at the payment bar and a timeline below.
    watermark: HackProduct
  - role: lesson
    placeholder: /images/placeholder.png
    promptForCodex: |
      Flat geometric lesson illustration for the takeaway that a landing page is a product and a conversation replaces a codebase, aspect 1800x1200. On cream #faf6f0, draw a large central split: the left half shows a deep forest #244232 code-editor shape with rows of abstract lines, a red X above it in amber #705c30. The right half shows a simple forest-green #4a7c59 page rectangle with a pricing chip and email field, a soft amber #c9ad68 checkmark above it. Between the two halves, draw a thin mist #dfe6dc vertical divider with the word BEFORE on the left in charcoal and INSTEAD on the right. Place Hatch from public/images/hatch/hatch-official-mascot.png in a calm coaching pose at the lower left, facing the centre split, one mitten hand raised. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. No photorealism, no dense text. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A split illustration with a code editor and a red X on the left, and a landing page with a checkmark on the right, with Hatch coaching from the lower left.
    watermark: HackProduct
  - role: thumbnail
    placeholder: /images/placeholder.png
    promptForCodex: |
      Flat geometric thumbnail for Buffer's landing page validation story, aspect 1200x900. On warm cream #faf6f0, place one bold focal object in the centre: a simple forest-green #4a7c59 page rectangle with three visible rows inside: a short text block, a soft amber #c9ad68 pricing chip row, and a deep forest #244232 submit button. Above the page, a thin charcoal #1e211c label reads NO CODE. Place Hatch from public/images/hatch/hatch-official-mascot.png as a tiny mark in the bottom-left corner, no larger than 10 percent of canvas height. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. Keep the design readable at small size. No dense text, no screenshots. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A simple page rectangle with a pricing chip and submit button, labelled NO CODE, with a tiny Hatch mark in the bottom-left corner.
    watermark: HackProduct
  - role: social-cover
    placeholder: /images/placeholder.png
    promptForCodex: |
      Flat geometric social cover image for Buffer's landing page validation story, aspect 2400x1260. On warm cream #faf6f0, place a central composition occupying the middle 70 percent of the canvas: three sequential page shapes connected by forest-green #4a7c59 arrows, progressing from a product description page on the left, to a soft amber #c9ad68 pricing card in the centre, to a mist #dfe6dc email-capture field on the right. Above the sequence, a single thin charcoal #1e211c label reads VALIDATION WITHOUT CODE. Place Hatch from public/images/hatch/hatch-official-mascot.png as a small narrator in the upper right corner, pointing one mitten hand at the pricing card. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. No human faces, no photorealism, no dense text, no recreated screenshots. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: Three sequential page shapes connected by arrows, labelled VALIDATION WITHOUT CODE, with small Hatch narrator in the upper right pointing at the centre pricing card.
    watermark: HackProduct
nextInQueue:
  slug: hotmail-ps-i-love-you
  companySlug: microsoft
  title: "Hotmail 'PS: I Love You'"
---

<!-- beat: lede -->

In October 2010, Joel Gascoigne was in Birmingham with a clear picture of the product he wanted to build and a clear memory of the product he had already built and abandoned [buffer-7weeks]. The idea for the new one was simple: a tool that let you drop tweets into a queue and have them go out automatically, spaced through the day, without picking exact times. The prior product had taught him something expensive. He had written its code, shipped it, and discovered afterward that the problem it solved was mostly his own [gascoigne-medium].

Before touching a text editor this time, Gascoigne built two web pages. The first described what the product would do. The second appeared when visitors clicked "Plans and Pricing" and asked for their email, noting the product was not ready yet. He tweeted the link to his 1,700 followers and emailed every person who signed up, asking whether the problem was real [buffer-7weeks]. Later, he inserted a third page between the first two, showing pricing tiers of $0, $5, and $20, so the click through the gate tested willingness to pay before a scheduling algorithm existed.

The product that launched on November 30, 2010 was, by Gascoigne's own account, something he was embarrassed about. It had its first paying customer within four days [launcher-twopages]. What follows is the story of what he built before he built that, and why the sequence matters. The question worth keeping in mind: when can a page do the work of a product?

<!-- beat: glance -->
## At a glance

**1. The problem was personal**

In late 2010 Joel Gascoigne wanted to share links and quotes on Twitter throughout the day without scheduling each tweet individually. Existing tools required picking exact times. He wanted a queue that auto-spaced tweets. No such tool existed. [buffer-7weeks]

**2. The cold start every founder fears**

Every tool builder faces the same question before writing code: is this a real problem for other people, or only for me? Joel had built a previous product without asking. It failed. He was not going to do that again. [buffer-7weeks][gascoigne-medium]

**3. The obvious thing**

Build the product. Even a minimal version takes weeks of evenings. Joel initially started coding Buffer before catching himself. The sunk cost of early engineering was the trap he had already walked into once before. [buffer-7weeks]

**4. Three pages, no product**

Page one described the tool. Page two collected email addresses from people who clicked "Plans and Pricing." A later third page inserted pricing tiers ($0, $5, $20) to test willingness to pay before a single line of scheduling code existed. [launcher-twopages][buffer-7weeks]

**5. 120 signups and one $5 payment**

In seven weeks, 120 people gave their email. Joel personally emailed most of them. Fifty used the product when it launched. The first $5 payment arrived within four days of going live, from a person Joel had already spoken with. [buffer-7weeks][launcher-twopages]

**6. The pattern that spread**

The Buffer landing page test became one of the most cited examples of the fake-door technique in startup methodology. Joel later wrote a nuanced correction: landing pages often fail to produce validated learning when founders optimise for signups instead of conversations. [gascoigne-medium]

<!-- beat: scene -->
## Background

![Hatch in the scene placeholder, see image-manifest in front matter](/images/placeholder.png)

The year is 2010, and Gascoigne is working evenings and weekends on ideas while doing contract work during the day [buffer-7weeks]. He is not in a startup hub. He is in Birmingham, UK, without a co-founder yet, watching Twitter become a serious professional communication layer and noticing that the tooling around it has not caught up with how people actually want to use it. The scheduling tools that exist require the user to choose exact publication times for each tweet. Gascoigne finds this friction annoying enough that he keeps a separate notepad to track when things should go out. The product idea he forms is narrow: one feature, done well, that removes that friction.

The relevant background is what happened before this moment. His previous product failed after he spent weeks building it without establishing that anyone else shared the problem [gascoigne-medium]. He has read Eric Ries on the minimum viable product. Ries's injunction, quoted back in almost every account of the Buffer origin story, is direct: the MVP is "probably much more minimum than you think" [hustle-buffer]. Gascoigne's own retrospective is candid. He writes that he started coding Buffer before he caught himself, remembered the prior failure, and stopped.

The constraint he sets for himself is strict. No scheduling code, no database schema, no user accounts. He will spend his engineering effort on the question, not on the answer. What he needs to know before writing anything else is whether the problem that bothers him every morning bothers other people enough to hand over an email address for it, and then, once the first signal is there, whether it bothers them enough to hand over money. The two-page site he builds to answer those questions takes a morning to put together. It is not a product. It is a question with a submit button.

<!-- beat: choice -->
## The obvious answer and what shipped instead

The natural move for a developer with an idea and free evenings is to start building. The product is clear in Gascoigne's head. The core logic, a queue that spaces tweets evenly through the day, is not architecturally complex. Starting to code would feel like progress. It would produce something tangible to show people. And it would recreate, nearly exactly, the situation that had already produced one failure: weeks of work before the first evidence that the work was worth doing. A careful, experienced team would have started building for all the right reasons. It is a small, tractable feature. The market is visible. Every day spent not building is a day a competitor could ship it first. These are the reasons that produce products nobody wanted before the founder found out.

| The tempting move | What shipped |
|---|---|
| Begin coding the scheduling algorithm during free evenings | A two-page site describing the product and collecting emails from people who clicked "Plans and Pricing" |
| Post on Twitter asking friends if they'd use a tool like this | Personal email conversations with nearly every person who signed up, to test whether the problem was real |
| Build a full free beta and observe whether users stick around | A third page inserted between the first two, showing pricing tiers of $0, $5, and $20 before the email capture |
| *Treat product development as the validation and ship before learning whether anyone wanted it.* | *Treat the landing page as the product, and let paying intent prove demand before writing a scheduling algorithm.* |

<!-- beat: mechanism -->
## How it actually works

![Mechanism placeholder, see image-manifest in front matter](/images/placeholder.png)

The detail to notice is that Gascoigne did not simply build a waiting list page. The shape of what he built was diagnostic, not cosmetic. Each page in the sequence was answering a different question, and the questions were ordered by cost [buffer-7weeks][gascoigne-medium].

The first page described what Buffer would do, in plain terms, without screenshots or demos, because none existed. It ended with a single call to action: "Plans and Pricing." The phrasing was intentional. It implied that plans and pricing were a decision the visitor was about to make, not a holding area for the curious. Visitors who clicked through were signalling something stronger than passing interest. They had made at least a small mental move toward being a customer.

Page two, the email capture, was the original stopping point. The message acknowledged that the product was not ready and offered to notify the visitor when it launched. This alone produced emails and Twitter replies. Gascoigne treated those as the first signal: people who shared the problem enough to leave a trace [buffer-7weeks].

The pricing page came later and it changed the nature of the experiment. Inserted between pages one and two, it showed three tiers: free, $5 per month, and $20 per month. The mechanism was doing two things at once [launcher-twopages]. First, it was filtering. Anyone who clicked through a pricing page before reaching an email field had cleared an extra hurdle, which meant the email addresses that followed were more committed than the ones the two-page version produced. Second, it was measuring. Which tier people clicked showed Gascoigne whether the $5 price felt defensible before he had written any code that justified charging it.

The constraint Gascoigne honoured was his own rule against building until paying intent was demonstrated. The constraint he was willing to set aside was the pride of having a real product on day one. What he shipped to these early visitors was a fiction in the narrowest sense: a description of something that did not yet exist, dressed as a product that nearly did.

The personal email was the mechanism inside the mechanism. When a visitor submitted their address, Gascoigne replied the same day. He asked whether the problem was real. He asked how they currently handled it. He kept the conversations going [gascoigne-medium]. Of the 120 people who signed up in seven weeks, a large proportion heard from him directly. The result was not a dataset. It was a set of relationships with people who already expected the product to exist.

<!-- beat: evidence -->
## Evidence

The numbers here are modest, and that is the point. Gascoigne was not optimising for signup volume, and he says so explicitly: "I wasn't optimizing for the number of signups I could get with this landing page, I was instead trying to learn as much as I possibly could" [gascoigne-medium]. The public record on the landing page period comes almost entirely from his own post-launch writing, which is first-person and consistent across multiple tellings. The account is credible but not independently verified.

What the validation phase produced is clear. What it caused is harder to separate. Buffer grew through the early months for several reasons: Gascoigne's early investment in customer conversations, the tight focus of the product on a single well-defined frustration, and the November Startup Sprint deadline that forced him to ship a version he found embarrassing rather than wait for one he liked [buffer-7weeks]. The landing page is the most cited part of the story, but it is the conversations that landed inside that landing page that Gascoigne returns to as the real work.

The post-launch numbers are a separate story. Buffer went from its first $5 payment to $100K ARR in under nine months. It raised $450K, then $3.5M, then bought its investors back out for $3.3M in 2018 and has operated independently since [buffer-10years].

| Metric | Value | Confidence | Source |
|---|---|---|---|
| Signups from landing page over 7-week test | 120 | Confirmed | [buffer-7weeks] |
| Users active at launch from landing page signups | 50 of 120 | Confirmed | [buffer-7weeks] |
| Days to first paying customer after launch | 3-4 days | Confirmed | [launcher-twopages][buffer-7weeks] |
| Buffer ARR in 2024 | $22.3M | Confirmed | [macleod-interview] |

![Evidence placeholder, see image-manifest in front matter](/images/placeholder.png)

<!-- beat: voice -->

> "I wasn't optimizing for the number of signups I could get with this landing page, I was instead trying to learn as much as I possibly could."
>
> - Joel Gascoigne, Buffer Blog, 2011

<!-- beat: aftermath -->
## Timeline

1. **2010-10**, Landing page launched; Joel tweets it to 1,700 followers. [buffer-7weeks]
2. **2010-11-30**, Buffer v1 ships on Hacker News, November Startup Sprint deadline. [buffer-7weeks]
3. **2010-12**, First $5 payment arrives within four days; 100 signups and 3 paying customers by end of month. [launcher-twopages]
4. **2011**, Buffer joins AngelPad, raises $450K seed; Gascoigne goes full-time. [buffer-10years]
5. **2013**, Open salaries go public; applications double in 30 days. [macleod-interview]
6. **2018**, Buffer spends $3.3M buying out its VC investors; operates independently at $22.3M ARR in 2024. [buffer-10years][macleod-interview]

<!-- beat: lesson -->
## The takeaway

![Lesson placeholder, see image-manifest in front matter](/images/placeholder.png)

> **A landing page is a product, and a conversation is faster than a codebase at finding out whether anyone wants the thing.**
>
> - HackProduct autopsy

The same logic turns up across the product canon. Dropbox in 2007 built a demo video before writing a sync client and watched waitlist signups go from 5,000 to 75,000 overnight. Zappos in 1999 posted photos of shoes from nearby stores, bought them when orders arrived, and shipped by hand before building any inventory infrastructure. In both cases, the artifact that proved demand was the cheapest thing that contained the question, not the answer. Gascoigne himself later pointed out the irony: most founders who heard the Buffer story drew the wrong lesson. They built landing pages to collect signups. He had built his to start conversations. The difference is whether the page is a funnel or a telephone.

<!-- beat: references -->
## References

1. **Idea to Paying Customers in 7 Weeks: How We Did It**, Buffer Blog · Tier A · accessed 2026-05-17. https://buffer.com/resources/idea-to-paying-customers-in-7-weeks-how-we-did-it/
   Supports: Three-stage landing page structure, 120 signups, 50 active at launch, November 30 2010 launch date, and first paying customer within 4 days.
2. **How to successfully validate your idea with a Landing Page MVP**, Medium (Joel Gascoigne) · Tier A · accessed 2026-05-17. https://medium.com/@joelgascoigne/how-to-successfully-validate-your-idea-with-a-landing-page-mvp-ef3c2d02dc51
   Supports: Joel's retrospective on validated learning, the funnel logic, and the direct quote about not optimising for signup volume.
3. **From $0 to Paying Customers: The Two-Page Strategy That Launched Buffer**, The Launcher · Tier B · accessed 2026-05-17. https://thelauncher.substack.com/p/from-0-to-paying-customers-the-two
   Supports: Pricing tier breakdown ($0, $5, $20), "jumping-around-the-room" description of the first payment, and end-of-month-1 figures.
4. **Reflecting on 10 Years of Building Buffer**, Buffer Blog · Tier A · accessed 2026-05-17. https://buffer.com/resources/10-years/
   Supports: AngelPad, the 2016 layoffs, the $3.3M investor buyout, the 4-day workweek, and 18 consecutive profitable quarters.
5. **Buffer's Founder Joel Gascoigne on Radical Transparency, Getting Off the VC Track, and Long-Term Thinking**, markmacleod.me · Tier B · accessed 2026-05-17. https://markmacleod.me/buffers-founder-joel-gascoigne-on-radical-transparency-getting-off-the-vc-track-and-long-term-thinking/
   Supports: $4M total funding raised, the investor buyout rationale, calm-company philosophy, and $22.3M ARR figure.
6. **Buffer: From Revenue on Day 4 to $3.5 Million a Year**, The Hustle · Tier B · accessed 2026-05-17. https://thehustle.co/from-revenue-on-day-4-to-3-5-million-a-year-how-buffer-started
   Supports: Early growth trajectory, the November 30 2010 launch date, 4% paid conversion rate, and Eric Ries influence.

<!-- beat: forward -->
## Next in queue

**Hotmail 'PS: I Love You'**, The six-word footer that turned every outgoing email into a distribution mechanism and brought Hotmail to 12 million users in 18 months.

→ [/autopsies/microsoft/hotmail-ps-i-love-you](/autopsies/microsoft/hotmail-ps-i-love-you)

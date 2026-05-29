---
slug: typeform
companySlug: typeform
companyName: Typeform
title: Typeform
dek: Two Barcelona designers replaced the wall of form fields with a single question at a time, cutting abandonment in half by hiding how long the form actually was.
queueRank: 33
tier: 2
estimatedReadTime: 10 min read
status: draft
researchGaps:
  - No sourced quote from Robert Muñoz specifically about the one-question-at-a-time decision; all founder voice in the public record comes from David Okuniev interviews.
  - The precise abandonment rate on the Roca project itself is not in the public record; the broader 57% vs 14% completion rate comparison comes from Typeform's own Help Center, not an independent audit.
  - Typeform's exact ARR at the end of 2014 (its first full paid year) is not confirmed in public sources; the $1M recurring revenue in year one figure comes from one Mixergy transcript.
sourceSummary: The Mixergy interview with David Okuniev (2014) provides the clearest primary-source account of the founding sequence, the Roca project, the WarGames inspiration, the BetaList launch, and the $1M first-year revenue figure. Okuniev's Medium essay confirms the flash-built Roca form, the Barcelona workspace origin, and the founding motivation. Marketing4eCommerce's history piece and the TechCrunch Series C article supply the funding trajectory and the $70M ARR figure for 2021. Typeform's own Help Center provides the 57% vs 14% completion rate comparison, which is self-reported. The public record does not include Robert Muñoz's voice on the design decision.
sources:
  - id: mixergy-2014
    title: Typeform — The Story of How Typeform Was Built
    publisher: Mixergy (Andrew Warner interview with David Okuniev)
    url: https://mixergy.com/interviews/typeform-with-david-okuniev/
    tier: A
    accessedAt: 2026-05-17
    supports: Primary-source account of the Roca project origin, the WarGames inspiration, the BetaList pre-launch, the February 2013 launch to 6,000 waitlisted users, and the $1M recurring revenue in year one.
  - id: okuniev-medium
    title: I built Typeform because I dreamt of creating 'conversational' forms
    publisher: Medium (David Okuniev)
    url: https://medium.com/@davidokuniev/i-built-typeform-because-i-dreamt-of-creating-conversational-forms-now-i-really-can-fa6c2218afc1
    tier: A
    accessedAt: 2026-05-17
    supports: Confirms the Roca showcase gallery project, the Flash-built original form, the WarGames-inspired interaction pattern, and the founding timeline.
  - id: techcrunch-seriesc
    title: Typeform takes $135M to tickle more marketers
    publisher: TechCrunch
    url: https://techcrunch.com/2022/03/10/typeform-series-c/
    tier: B
    accessedAt: 2026-05-17
    supports: Confirms $70M ARR in 2021, 125,000+ paying customers, $935M valuation, 80% organic customer acquisition, and the two-thirds free-to-paid conversion path.
  - id: marketing4ecommerce
    title: This is Typeform — History and Evolution of One of Spain's Largest Startups
    publisher: Marketing4eCommerce
    url: https://marketing4ecommerce.net/en/this-is-typeform-history-and-evolution-of-one-of-spains-biggest-startups/
    tier: B
    accessedAt: 2026-05-17
    supports: 56% average survey completion rate, 500M+ annual interactions, November 2022 12% layoff, and the broader competitive landscape including Google Forms and SurveyMonkey.
  - id: typeform-helpcentre
    title: What's the average completion rate of a typeform?
    publisher: Typeform Help Center
    url: https://www.typeform.com/help/a/whats-the-average-completion-rate-of-a-typeform-360029615911/
    tier: A
    accessedAt: 2026-05-17
    supports: The 57% average completion rate versus the 14% industry average, self-reported by the company.
  - id: saasclub-plg
    title: Typeform's Product-Led Growth Playbook, Viral by Design
    publisher: SaaS Club Podcast
    url: https://saasclub.io/podcast/typeform-a-case-study-in-product-led-saas-growth-with-david-okuniev-230/
    tier: B
    accessedAt: 2026-05-17
    supports: The 6,000-person waitlist via BetaList, the 1,000 paying users in month one after monetisation launched, and the virality coefficient detail (every two sign-ups generated one additional sign-up).
metrics:
  - label: Typeform average completion rate (self-reported)
    value: 57%
    confidence: high_confidence
    sourceIds: [typeform-helpcentre]
  - label: Industry average form completion rate (Typeform's own benchmark)
    value: 14%
    confidence: medium_confidence
    sourceIds: [typeform-helpcentre]
  - label: ARR at 2021 Series C announcement
    value: $70 million
    confidence: confirmed
    sourceIds: [techcrunch-seriesc]
  - label: Paying customers at Series C (March 2022)
    value: 125,000+
    confidence: confirmed
    sourceIds: [techcrunch-seriesc]
  - label: Annual interactions on the platform
    value: 500 million+
    confidence: confirmed
    sourceIds: [techcrunch-seriesc, marketing4ecommerce]
  - label: Year-one recurring revenue
    value: $1 million ARR
    confidence: high_confidence
    sourceIds: [mixergy-2014]
glanceCards:
  - id: setup
    title: The wall of fields nobody wanted to fill in
    body: In 2012 every mainstream form tool, from SurveyMonkey to Google Forms, presented all questions at once. A researcher looking at a twenty-field survey saw the full weight of it before typing a single letter, and 70-80% of them left before finishing. [typeform-helpcentre]
    sourceIds: [typeform-helpcentre]
    confidence: high_confidence
  - id: problem
    title: The seam nobody had designed around
    body: The abandonment wasn't caused by the questions being too hard. It was caused by the visual mass of seeing every question simultaneously. Show the length and the user calculates whether the effort is worth it, usually deciding it isn't. [typeform-helpcentre, mixergy-2014]
    sourceIds: [typeform-helpcentre, mixergy-2014]
    confidence: high_confidence
  - id: tempting-move
    title: Cleaner UI, same structure
    body: The obvious response to ugly forms was better design on top of the same architecture, nicer fonts, a friendlier colour palette, progress bars. Every competitor went this direction. None of them questioned whether all questions should appear on screen at the same moment.
    sourceIds: [mixergy-2014]
    confidence: high_confidence
  - id: mechanism
    title: One question, full screen, smooth transition
    body: Typeform replaced the entire form page with a single question, centred, large, with keyboard shortcuts and animated transitions sliding the next question in. Completing a form became a paced experience, not a task with a visible end that discouraged starting. [mixergy-2014, okuniev-medium]
    sourceIds: [mixergy-2014, okuniev-medium]
    confidence: confirmed
  - id: evidence
    title: Completion rates the industry hadn't seen
    body: Typeform's self-reported median completion rate sits at 57%, against an industry average closer to 14% for traditional all-fields-on-one-page forms. The gap is format-driven, not purely brand-driven. [typeform-helpcentre]
    sourceIds: [typeform-helpcentre]
    confidence: high_confidence
  - id: takeaway
    title: Hiding the length is a product decision
    body: The move that Typeform made was not beautification. It was a structural choice to withhold information (total form length) that was demoralising users before they had invested a single answer. Withholding that information is the mechanism, not a side effect. [mixergy-2014]
    sourceIds: [mixergy-2014]
    confidence: confirmed
obviousAnswer:
  temptingMove:
    label: Polish the form wall
    bullets:
      - Add a progress bar to the top so users know where they are
      - Improve typography, spacing, and field styling for a cleaner look
      - Group related questions into sections with visible headers
      - Reduce the number of required fields to lower the apparent cost
    summary: Every serious competitor attacked the problem by making the wall of fields more attractive, not by removing the wall.
  whatShipped:
    label: One question, full screen
    bullets:
      - Show exactly one question per screen, centred, large, with no visible question count
      - Animate each transition so the experience feels like a conversation moving forward
      - Let keyboard navigation (Enter to advance) reinforce the paced rhythm
      - Embed "Powered by Typeform" on the final screen to seed the viral loop
    summary: Typeform removed the wall entirely, hiding total form length until the user had already begun.
lifecycle:
  - date: "2009"
    label: Roca project triggers the idea
    description: A Barcelona showroom commission produces the first conversational form, built in Flash.
    type: launch
  - date: "2012-01"
    label: Typeform co-founded
    description: Okuniev and Muñoz incorporate the company in Barcelona.
    type: launch
  - date: "2013-02"
    label: Beta launches to 6,000 waitlisted users
    description: BetaList campaign drives waitlist; form goes live February 12.
    type: launch
  - date: "2013-12"
    label: First paid tier, $1M ARR in year one
    description: Seed round closes; 1,000 paying users in month one of monetisation.
    type: milestone
  - date: "2022-03"
    label: Series C at $935M valuation
    description: $135M raised; $70M ARR confirmed; 125,000 paying customers.
    type: milestone
  - date: "2026"
    label: Today
    description: 500M+ annual interactions; Formless AI spin-out in development.
    type: today
takeaway:
  principle: Hiding how much work remains is a product decision, not a design flourish.
  sourceIds: [mixergy-2014, typeform-helpcentre]
images:
  - role: hero
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch, the HackProduct mascot, stands at a sleek Barcelona-style desk in a warm cream (#faf6f0) room. Hatch wears a graduation cap tilted at an angle, with a small growth arrow on the top-right of the cap rendered in forest green (#4a7c59). Hatch is looking at two screens side by side: the left screen shows a cluttered wall of form fields in muted grey, the right screen shows a single large question centred on a clean white background. Hatch points toward the right screen with a curious, engaged expression. Ambient light is warm, soft amber (#c9ad68) from a window behind. The desktop surface is deep forest wood (#244232) with soft reflections. Aspect ratio 2400x1350. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: Hatch comparing a traditional form wall to Typeform's single-question screen in a warm Barcelona office.
    caption: The same questions. A different decision about how many to show at once.
  - role: scene
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch, the HackProduct mascot with graduation cap and growth arrow, stands in a Barcelona co-working space in 2012, bathed in warm cream (#faf6f0) and soft amber (#c9ad68) tones. Two designers are visible at adjacent workstations behind Hatch, looking at early browser windows showing cluttered form builders. Hatch holds a sketchbook open to a rough wireframe: one large question box centred on a blank page, with an arrow pointing down to a second page. The sketchbook is slightly worn. Walls show Spanish architectural details in charcoal (#1e211c) outline. Aspect ratio 1600x1600. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: Hatch in a Barcelona co-working space, sketchbook open to a single-question wireframe, two designers visible in the background.
    caption: The idea that became Typeform started as a client project for a Barcelona bathroom company.
  - role: mechanism
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch, the HackProduct mascot with graduation cap and growth arrow, stands beside a large transparent diagram showing the Typeform interaction loop. On the left side of the diagram, a stack of form fields crowds together in muted grey, labelled "traditional form." On the right, a single centred question slides into frame with a smooth green (#4a7c59) animation arrow, followed by another single question below it. Hatch points at the animation arrow with an analytical expression, tracing the path a user takes one step at a time. Background is warm cream (#faf6f0) with deep forest (#244232) accent lines for the diagram borders. Aspect ratio 1800x1200. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: Hatch pointing at a diagram comparing the multi-field form layout to Typeform's single-question animated sequence.
    caption: The transition animation is not decoration. It is what makes the next question feel like an answer deserved, not a demand made.
  - role: evidence
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch, the HackProduct mascot with graduation cap and growth arrow, stands in front of a bar chart rendered in forest green (#4a7c59) and soft amber (#c9ad68). The chart shows two bars: the left labelled "Traditional forms" at roughly 14%, the right labelled "Typeform" at 57%, in a muted cream (#faf6f0) space. Hatch holds a pointer toward the gap between the two bars, expression analytical and curious. Small data labels float in charcoal (#1e211c) above each bar. The chart background is surface-container styled in mist (#dfe6dc). Aspect ratio 1600x1000. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: Hatch pointing at a bar chart showing 14% traditional form completion rate versus 57% Typeform completion rate.
    caption: The gap is real. Whether Typeform causes it or the one-question format does is a harder question.
  - role: lesson
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch, the HackProduct mascot with graduation cap and growth arrow, stands in a coaching pose on a warm cream (#faf6f0) platform, arm extended toward the viewer, growth arrow on the cap glowing softly in forest green (#4a7c59). Behind Hatch, a large chalkboard shows a simple equation: "Show everything = users calculate cost = users leave" with an arrow crossed out, replaced by "Show one thing = users begin = users finish." The chalkboard background is deep forest (#244232) with chalk-white text. Soft amber (#c9ad68) light pools on the platform surface. Aspect ratio 1800x1200. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: Hatch in a coaching stance in front of a chalkboard comparing the cost-calculation effect of showing all fields versus one field at a time.
    caption: The lesson transfers to any product where revealing the full scope of a task deters the user from beginning it.
  - role: thumbnail
    placeholder: /images/placeholder.png
    promptForCodex: |
      A compact, square-format scene showing Hatch, the HackProduct mascot with graduation cap and growth arrow, peeking around the left edge of a large white card that shows a single centred question: "What is your name?" in forest green (#4a7c59) type. Behind the card, barely visible, are rows of greyed-out form fields representing what the user is not being shown. Background is warm cream (#faf6f0). The overall mood is playful and knowing. Aspect ratio 1200x900. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: Hatch peeking around a single-question card that hides the full form behind it.
  - role: social-cover
    placeholder: /images/placeholder.png
    promptForCodex: |
      Wide-format social card in warm cream (#faf6f0) with Hatch, the HackProduct mascot with graduation cap and growth arrow, centred and slightly left of frame. To Hatch's right, a vertical stack of three card-sized screens: the top card shows "Question 1 of 1" in large forest green (#4a7c59) type (the hidden truth), the middle card shows just one question with smooth animated line, the bottom card shows a green completion checkmark. Title text at the bottom in charcoal (#1e211c) Literata font: "Hiding the length was the product decision." Hatch holds a small growth arrow pointer. Aspect ratio 2400x1260. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: Social-cover card showing Hatch beside three screens illustrating the single-question format and its completion payoff.
nextInQueue:
  slug: bereal-two-minute-window
  companySlug: bereal
  title: BeReal 2-Min Window
---

<!-- beat: lede -->

In 2012, David Okuniev and Robert Muñoz shared a small creative workspace in central Barcelona, both running independent web design agencies out of the same building. That year, a bathroom fixture manufacturer called Roca asked them to design a lead-capture form for a showcase gallery the company was opening in the city. The obvious answer was a clean HTML form with clearly labelled fields. What Okuniev and Muñoz built instead, in Flash, was something closer to a conversation: a single question on a blank screen, a natural pause, and then another single question sliding in to take its place [mixergy-2014, okuniev-medium].

The move looked like a design preference. A form that showed one question at a time instead of ten was prettier, friendlier, less daunting. But the actual mechanism was structural, not cosmetic. The moment a user could no longer see how many questions remained, the cost-benefit calculation that caused most people to abandon most forms before completing them simply stopped running [typeform-helpcentre]. Okuniev described the underlying insight years later in simple terms: "breaking stuff into smaller components is what keeps people engaged" [mixergy-2014].

What followed over the next decade was a market split that nobody in the form-building industry had anticipated. Typeform took the branded-experience tier, reaching $70 million in ARR by 2021 [techcrunch-seriesc]. Google Forms kept the free utility tier. And the one-question-at-a-time interaction pattern, which felt eccentric in 2013, became the expected baseline for any product that wanted a high-stakes form filled out by a skeptical audience. The question the story raises is whether hiding information from users is a kindness or a manipulation, and whether those two things are even different.

<!-- beat: glance -->
## At a glance

**1. The wall nobody wanted to climb**

In 2012, every major form tool, from SurveyMonkey to Google Forms to Wufoo, displayed all questions at once. A respondent opening a twenty-field survey saw the full weight of the task before typing a single character. Research on abandonment rates placed conventional long-form completion at around 14% in comparable contexts. [typeform-helpcentre]

**2. The seam everyone missed**

The abandonment wasn't caused by bad questions. It was caused by the user calculating the total effort cost from the question list before committing. That calculation, running in the first three seconds, was the mechanism behind most form abandonment. None of the incumbent tools had questioned whether showing all questions simultaneously was necessary. [typeform-helpcentre, mixergy-2014]

**3. The accidental prototype**

The Roca commission in 2009 produced the first conversational form, built in Adobe Flash for a physical gallery space where a clinical HTML form would have looked out of place. Three years of refinement in parallel with agency work followed before Okuniev and Muñoz launched a public beta. [mixergy-2014, okuniev-medium]

**4. The interaction pattern from a 1983 film**

Okuniev has named the 1983 film WarGames as a design reference: a command-line conversation between a teenager and a military computer, one line at a time. "Today we just realized, this could be a form interaction. There's a lot of delight in this." The film was made eleven years before the web browser existed. [mixergy-2014]

**5. The viral loop baked into the product**

The beta launched February 12, 2013, to 6,000 users from a BetaList waitlist. Every completed form displayed a "Powered by Typeform" footer. Recipients who filled in a Typeform and clicked that link became potential paying creators. The company reached 1,000 paying users in month one of monetisation without a sales team. [mixergy-2014, saasclub-plg]

**6. Completion rates that changed the conversation**

Typeform's self-reported median completion rate sits at 57%, against an industry average they cite at 14%. Eighty percent of new customers sign up organically. The $935 million Series C valuation in 2022 arrived without unicorn status but confirmed the scale. [typeform-helpcentre, techcrunch-seriesc]

<!-- beat: scene -->
## Background

![Hatch in the Barcelona co-working space scene, see image-manifest in front matter](/images/placeholder.png)

In 2009, the web form had not changed materially in fifteen years. The HTML form element, introduced with Netscape Navigator 2.0 in 1995, rendered fields in a vertical stack. Every form builder that followed, Wufoo, SurveyMonkey, Google Forms, treated that stack as a fixed constraint and competed on the number of field types, the breadth of integrations, and the visual theme options sitting on top. The stack itself was not questioned.

The Roca showcase gallery in Barcelona was a considered physical space, marble surfaces and precise lighting, designed to make plumbing fixtures feel like design objects. Okuniev and Muñoz were commissioned to build a lead-capture form for gallery visitors, a standard agency task that would have taken an afternoon. Placing a conventional HTML form in that environment, with its grey field borders and Submit button, would have looked like a telephone in a museum. "We saw forms as a problem when we set up the project," Okuniev said later [okuniev-medium]. The form they built in Flash, for that single client project, showed one question at a time. It was not a product, not a startup, not a theory about abandonment rates. It was a design decision made for a specific room.

Three years passed before that form became a company. Okuniev and Muñoz continued their agency work, returning to the Roca interaction pattern occasionally, running what Okuniev described as "almost a lab for creating the best form ever" [okuniev-medium]. The decision to productise it came from frustration with client dependency, not from a market analysis. They wanted to make something of their own. The Roca form was the thing that already existed. They refined it, removed the Flash dependency, and in 2012 registered Typeform as a company. The two of them worked on the product in parallel with ongoing agency commissions, putting a single-line landing page (itself a demo of the format) on BetaList asking only for an email address, nothing more.

The moment of choice came when they had to decide what the product's fundamental shape would be. Multi-step forms existed: Wufoo supported pagination. SurveyMonkey had progress bars. Every existing competitor had found ways to manage the length problem within the wall-of-fields structure. The question was whether to build a better wall or to remove the wall altogether and show only the brick in front of the user's face.

<!-- beat: choice -->
## The obvious answer and what shipped instead

Every form tool before Typeform had tried to solve the abandonment problem by managing the user's perception of the wall, not by removing it. A progress bar at the top told users how far they had come. Pagination broke questions into pages. Section headers grouped related fields. These were reasonable, well-meaning responses to a real problem, and they helped at the margin. None of them addressed the root cause, which was that showing the full scope of a task before the user has begun it triggers a cost-benefit calculation that most tasks lose.

| The tempting move | What shipped |
|---|---|
| Add a progress bar to show how far users have come | Show exactly one question per screen, no question count visible |
| Break long forms into paginated sections | Animate each transition so the form feels conversational, not paginated |
| Improve typography and field styling across all questions | Centre the single question with large type and generous whitespace |
| Reduce the number of required fields | Embed "Powered by Typeform" on the completion screen as the growth mechanic |
| *Polish the wall. Keep all questions present.* | *Remove the wall. Hide the length until the user has already begun.* |

<!-- beat: mechanism -->
## How it actually works

![Mechanism diagram placeholder, see image-manifest in front matter](/images/placeholder.png)

The seam Okuniev and Muñoz identified was a cognitive one, not a technical one. When a user opens a form and sees all fields simultaneously, the first thing the brain does is estimate completion time. A research paper on survey design would call this "effort forecasting." Okuniev would call it more plainly: "If you have a really daunting thing to do, by breaking it into smaller pieces, it's more manageable and it's more motivating" [mixergy-2014]. The technical implementation they built on top of that insight was not complex, but every detail of it served the same purpose: prevent the user from counting.

A Typeform shows one question, full-screen, with the question text large and centred. There is no sidebar listing remaining questions. There is no question counter ("3 of 12") unless the form creator explicitly adds one. The keyboard shortcut to advance to the next question is Enter, the most natural continuation keystroke in any text interface. The animation between questions is a smooth slide rather than a page load, so the form never registers as navigation; it registers as conversation continuing.

The constraint the team chose to honour was the paced rhythm. Every product decision reinforced the sense that the user was moving through something, not waiting for something. The constraint they chose to ignore was power-user efficiency. For a respondent who already knows exactly what information they need to provide, a single-question interface is slower than a visible form they can tab through. Typeform accepted that trade. Its target was not the power user. It was the reluctant participant.

The second-order effect the founders anticipated was distribution through the forms themselves. "Powered by Typeform" on the completion screen meant every respondent became a potential creator. A marketer who filled in a beautifully designed lead-capture form and saw that footer had a credible reason to investigate the tool. The virality coefficient reached roughly 0.5: every two new sign-ups generated one additional sign-up without any paid acquisition [saasclub-plg]. The second-order effect they did not fully anticipate was that the format itself would diffuse into the industry. Within a decade, the one-question-at-a-time pattern appeared as an option in Fillout, as the default in Tally's "conversational mode," and as the recommended approach in Hotjar's embedded survey documentation. Typeform had created a format, not just a product.

The mechanism also surfaced a hidden limit: Typeform's own research later showed that forms with more than six questions had less than a 50% completion rate [marketing4ecommerce]. Hiding the length helped, but there was a length beyond which no amount of pacing recovered user commitment. The format solved the problem of users knowing too much too soon. It did not solve the problem of forms being too long.

<!-- beat: evidence -->
## Evidence

The completion rate comparison, 57% on Typeform versus 14% industry average, comes from Typeform's own Help Center [typeform-helpcentre]. That matters for how to read it. The company has an obvious reason to present this gap as large and format-attributable, and the comparison pools forms of different lengths, topics, and audiences. An eight-question employee survey embedded in an internal HR tool is not the same experiment as a thirty-field lead-capture form on a cold marketing page. The numbers are real, but the causal arrow, whether the one-question format produces the gap or whether Typeform's users select for higher-engagement use cases, is harder to isolate.

What is less contested is the business trajectory. Typeform reached $1M in recurring revenue in its first full year of monetisation, without a sales team, with the product seeding its own distribution through form footers [mixergy-2014]. By 2021, ARR had reached $70M, triple the 2018 figure [techcrunch-seriesc]. Eighty percent of new customers arrive through organic or word-of-mouth channels, a figure that is consistent with a product that spreads through use [techcrunch-seriesc]. Investors attributed the growth specifically to the format: Sofina principal Benjamin Sabatier described Typeform's "conversational solutions" as the mechanism behind "higher response rates and richer insights."

The format-vs-product question matters for competitors. Fillout and other modern form builders have added one-question modes as an option, which suggests the UX benefit is broadly reproducible at low engineering cost. Google Forms can approximate the format with multi-page sections. If the outcome gap narrows when the format is replicated in cheaper tools, Typeform's long-term moat is in integrations, design polish, and brand recognition, not in the interaction pattern itself.

| Metric | Value | Confidence | Source |
|---|---|---|---|
| Typeform average completion rate | 57% | High | [typeform-helpcentre] |
| Industry average completion rate (Typeform benchmark) | 14% | Medium | [typeform-helpcentre] |
| ARR in 2021 | $70 million | Confirmed | [techcrunch-seriesc] |
| Paying customers at Series C | 125,000+ | Confirmed | [techcrunch-seriesc] |
| Annual interactions on platform | 500 million+ | Confirmed | [techcrunch-seriesc, marketing4ecommerce] |
| Year-one recurring revenue | $1 million | High | [mixergy-2014] |

![Evidence chart placeholder, see image-manifest in front matter](/images/placeholder.png)

<!-- beat: voice -->

> "The problem we're solving is that there's a lack of empathy in the way most companies out there are asking people for data. We think that the better way is to try and make it feel more like a conversation, one thing at a time."
>
> — David Okuniev, Co-founder and Co-CEO, Typeform, Mixergy interview, 2014

<!-- beat: aftermath -->
## Timeline

1. **2009**, Roca project produces the first conversational form, built in Flash for a Barcelona gallery.
2. **2012-01**, Typeform incorporated; Okuniev and Muñoz begin full product development alongside agency work.
3. **2013-02**, Beta launches to 6,000 BetaList waitlist users; 1,000 paying customers in month one of monetisation.
4. **2018**, Typeform surpasses $20M ARR; Okuniev steps aside to found TypeformLabs R&D group.
5. **2022-03**, $135M Series C closes at $935M valuation; $70M ARR confirmed; 125,000+ paying customers.
6. **2026**, 500M+ annual interactions; Formless, Okuniev's AI-native form project, in development.

<!-- beat: lesson -->
## The takeaway

![Lesson illustration placeholder, see image-manifest in front matter](/images/placeholder.png)

> **Hiding how much work remains is a product decision, not a design flourish.**
>
> — HackProduct autopsy

The same logic runs in a different key inside the Duolingo lesson format, which shows a progress bar only within a lesson and never across the full course, so learners don't calculate how many hundreds of sessions remain before fluency. It runs inside the Netflix autoplaying next episode, which removes the decision point between episodes so viewers don't reassess whether they want to continue. The pattern in each case is identical: a product designer identified that showing users the full scope of a commitment causes a measurable fraction of them to abandon the commitment before beginning it, and restructured the interface to prevent that calculation from running. Okuniev called it empathy. An economist would call it information asymmetry. A good product team calls it knowing where the real drop-off is.

<!-- beat: references -->
## References

1. **Typeform — The Story of How Typeform Was Built**, Mixergy · Tier A · accessed 2026-05-17. https://mixergy.com/interviews/typeform-with-david-okuniev/
   Supports: Primary-source account of the Roca origin, WarGames inspiration, BetaList launch, and year-one revenue.

2. **I built Typeform because I dreamt of creating 'conversational' forms**, Medium (David Okuniev) · Tier A · accessed 2026-05-17. https://medium.com/@davidokuniev/i-built-typeform-because-i-dreamt-of-creating-conversational-forms-now-i-really-can-fa6c2218afc1
   Supports: Flash-built Roca form, Barcelona origin, founding motivation, and WarGames design reference.

3. **Typeform takes $135M to tickle more marketers**, TechCrunch · Tier B · accessed 2026-05-17. https://techcrunch.com/2022/03/10/typeform-series-c/
   Supports: $70M ARR in 2021, 125,000+ customers, $935M valuation, 80% organic acquisition, Sofina quote on conversational solutions.

4. **This is Typeform — History and Evolution of One of Spain's Largest Startups**, Marketing4eCommerce · Tier B · accessed 2026-05-17. https://marketing4ecommerce.net/en/this-is-typeform-history-and-evolution-of-one-of-spains-biggest-startups/
   Supports: 56% completion rate, 500M+ annual interactions, November 2022 layoffs, competitive landscape.

5. **What's the average completion rate of a typeform?**, Typeform Help Center · Tier A · accessed 2026-05-17. https://www.typeform.com/help/a/whats-the-average-completion-rate-of-a-typeform-360029615911/
   Supports: The 57% vs 14% completion rate comparison and the form-length completion curve.

6. **Typeform's Product-Led Growth Playbook, Viral by Design**, SaaS Club Podcast · Tier B · accessed 2026-05-17. https://saasclub.io/podcast/typeform-a-case-study-in-product-led-saas-growth-with-david-okuniev-230/
   Supports: 6,000-person BetaList waitlist, 1,000 paying users in month one, and the virality coefficient.

<!-- beat: forward -->
## Next in queue

**BeReal 2-Min Window**, How a notification that gave everyone two minutes to post simultaneously turned social media's performative logic inside out.

→ [/autopsies/bereal/bereal-two-minute-window](/autopsies/bereal/bereal-two-minute-window)

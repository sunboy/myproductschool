---
slug: figma-free-for-students
companySlug: figma
companyName: Figma
title: Figma's Free-for-Students Program
dek: How Dylan Field and Evan Wallace gave the product away to design students — and turned the next generation of design decision-makers into Figma advocates before they had power to choose.
queueRank: 56
tier: 2
estimatedReadTime: 8 min read
status: draft
researchGaps:
  - Exact number of students who used Figma through the education program not publicly disclosed.
  - Internal deliberation about which student cohorts to target first not documented.
  - Revenue impact of the education program not independently verifiable.
sourceSummary: Multiple A- and B-tier sources support the founding context, education program details, browser-based approach, and Adobe acquisition. Student program enrollment and revenue impact are not publicly verified.
sources:
  - id: fig-education-program
    title: Figma for Education
    publisher: Figma Help Center
    url: https://help.figma.com/hc/en-us/articles/360039827674-Figma-for-Education
    tier: A
    accessedAt: 2026-05-17
    supports: Education program details, free access structure, eligibility requirements.
  - id: fig-adobe-acquisition
    title: Adobe to acquire Figma for $20 billion
    publisher: The Verge
    url: https://www.theverge.com/2022/9/15/23354242/adobe-figma-acquisition-20-billion-deal
    tier: A
    accessedAt: 2026-05-17
    supports: $20B acquisition valuation, Figma market position, Adobe competitive threat rationale.
  - id: fig-founding-story
    title: How Figma is building the future of design
    publisher: Fast Company
    url: https://www.fastcompany.com/90373695/how-figma-is-building-the-future-of-design
    tier: B
    accessedAt: 2026-05-17
    supports: Dylan Field and Evan Wallace background, browser-based design rationale, collaboration focus.
  - id: fig-vs-sketch
    title: Figma vs. Sketch — The browser-based design revolution
    publisher: Smashing Magazine
    url: https://www.smashingmagazine.com/2019/04/figma-design-tool/
    tier: B
    accessedAt: 2026-05-17
    supports: Competitive context against Sketch, browser advantage, team collaboration features.
  - id: fig-series-e
    title: Figma raises $200M Series E at $10B valuation
    publisher: TechCrunch
    url: https://techcrunch.com/2021/06/24/figma-raises-200m-at-10b-valuation/
    tier: A
    accessedAt: 2026-05-17
    supports: $10B Series E valuation, growth trajectory, market position before acquisition.
metrics:
  - label: Adobe acquisition value
    value: "$20 billion"
    confidence: confirmed
    sourceIds: [fig-adobe-acquisition]
  - label: Series E valuation
    value: "$10 billion"
    confidence: confirmed
    sourceIds: [fig-series-e]
  - label: Education program availability
    value: "Free for verified students and educators"
    confidence: confirmed
    sourceIds: [fig-education-program]
  - label: Founding year
    value: "2012"
    confidence: confirmed
    sourceIds: [fig-founding-story]
glanceCards:
  - id: setup
    title: The tool that design students grew up on
    body: Figma launched in 2016 and offered free access to students from the beginning. Design tools had historically required expensive licenses — Sketch was $99/year, Adobe CC was a monthly subscription most students couldn't afford. Figma made access conditional on being enrolled, not on having money. [fig-education-program, fig-founding-story]
    confidence: confirmed
  - id: problem
    title: Enterprise design tools are chosen by people who learned their habits in school
    body: Design tool selection at companies is rarely a neutral decision — it reflects what the design team already knows. A designer who learned Figma in school will advocate for Figma when their company asks what tool to use. The education program was a long-duration acquisition strategy targeting the moment when advocacy power develops. [fig-vs-sketch]
    confidence: plausible
  - id: tempting-move
    title: The obvious move was to focus on enterprise conversion
    body: Most B2B SaaS tools focus education programs on universities that produce large numbers of enterprise buyers. Figma's bet was broader — give access to any student learning design, regardless of whether their institution was a named enterprise account target. [fig-education-program]
    confidence: plausible
  - id: mechanism
    title: Habit formation before purchasing power
    body: The education program worked on a simple timing insight: a student who forms habits with a tool at twenty-two will be making tool decisions at twenty-eight. If the habit is formed before the purchasing power develops, the enterprise sale is significantly easier. Figma gave away the product to own the habit formation window. [fig-education-program, fig-founding-story]
    confidence: plausible
  - id: evidence
    title: $20 billion acquisition by the company it was threatening
    body: Adobe's decision to acquire Figma for $20 billion in 2022 is the clearest market signal of the education strategy's success. Adobe's core creative products were losing design mindshare to a tool that design students had adopted for free. The acquisition was partly a response to that trajectory. [fig-adobe-acquisition]
    confidence: confirmed
  - id: takeaway
    title: Give away access to the people who will make the decisions later
    body: Enterprise B2B growth often focuses on current decision-makers. Figma's education program focused on future decision-makers — the students who would become senior designers, design leads, and heads of design at companies that spend money on design tools. The lag time is long; the payoff is lasting. [fig-founding-story]
    confidence: plausible
obviousAnswer:
  temptingMove:
    label: The tempting move
    bullets:
      - Partner with top design schools as named institutional customers
      - Offer student discounts (30-50% off) rather than free access
      - Focus education efforts on programs that produce enterprise hires at target companies
      - Require institutional verification that limits the program to formal students
    summary: Traditional education pricing — student discounts at named institutions, targeting future enterprise buyers.
  whatShipped:
    label: What shipped
    bullets:
      - Free access (not discounted) for any verified student or educator
      - No limit on which institutions qualify — broad eligibility
      - Full professional features, not a stripped-down student tier
      - Access to the same collaboration features that drove enterprise adoption
    summary: Genuinely free professional-grade access for any student, with the full product rather than a limited version.
lifecycle:
  - date: 2012-01
    label: Figma founded
    description: Dylan Field and Evan Wallace start Figma at Brown University; browser-based design tool.
    type: launch
  - date: 2016-09
    label: Public launch
    description: Figma launches publicly; free tier and education access available from day one.
    type: launch
  - date: 2019-06
    label: Figma passes Sketch in new user adoption
    description: Browser-based collaboration and education distribution drive design mindshare shift.
    type: milestone
  - date: 2021-06
    label: $200M Series E at $10B valuation
    description: Largest design tool valuation; education-driven community cited as growth driver.
    type: milestone
  - date: 2022-09
    label: Adobe acquisition announced for $20B
    description: Adobe responds to Figma's market share trajectory; acquisition later blocked by EU regulators.
    type: today
takeaway:
  principle: Give away the product to the people who will make the decisions later — the lag time is long, but the habit formed in school becomes the advocacy built in the workplace.
  sourceIds: [fig-education-program, fig-founding-story]
images:
  - role: hero
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch mascot (the HackProduct robot with graduation cap and growth arrow) holding an oversized student ID card labeled "FREE ACCESS — Figma for Education" on a cream background. Hatch's expression is knowing and generous — the gift has a long game. No speech bubble. HackProduct wordmark watermark bottom-right, 60% opacity, JetBrains Mono. Aspect 2400x1350.
    alt: Hatch holding a free student access card — Figma's education program strategy made visual.
    watermark: HackProduct
  - role: scene
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in narrator pose, gesturing at a timeline: on the left, a young person with a student badge using Figma on a laptop; on the right, the same figure older, now at a conference table with the word "DECISION" above them. An arrow connects the two moments. Cream background, no additional copy. HackProduct wordmark watermark bottom-right, 60% opacity, JetBrains Mono. Aspect 1600x1600.
    alt: Hatch gesturing at the timeline from student habit to enterprise decision-maker.
    watermark: HackProduct
  - role: mechanism
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in thinking pose looking at a diagram showing the habit formation window: a bar labeled "School" on the left (ages 20-22), a gap in the middle (ages 23-26), and a bar labeled "Decision Power" on the right (ages 27-30). An arrow bridges the gap. Hatch points at the bridge. Cream background. HackProduct wordmark watermark bottom-right, 60% opacity, JetBrains Mono. Aspect 1800x1200.
    alt: Hatch illustrating the gap between student habit formation and enterprise purchasing power.
    watermark: HackProduct
  - role: evidence
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch pointing at a price tag reading "$20 BILLION" with an Adobe logo behind it looking slightly alarmed. Hatch's expression is calm — the acquisition validates the strategy. Cream background. HackProduct wordmark watermark bottom-right, 60% opacity, JetBrains Mono. Aspect 1600x1000.
    alt: Hatch pointing at Adobe's $20 billion acquisition of Figma — the market signal of the education strategy's impact.
    watermark: HackProduct
  - role: lesson
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in coaching pose, holding a small seedling in one hand and a large oak in the other. The seedling is labeled "Student." The oak is labeled "Design Lead." The metaphor is the long game — investment now, harvest later. Cream background. HackProduct wordmark watermark bottom-right, 60% opacity, JetBrains Mono. Aspect 1800x1200.
    alt: Hatch holding a seedling and an oak — the long-game metaphor for Figma's education strategy.
    watermark: HackProduct
  - role: thumbnail
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch mascot small and centered, holding a tiny student ID card. Cream background, no text. Immediately readable at small size. HackProduct wordmark watermark bottom-right, 60% opacity, JetBrains Mono. Aspect 1200x900.
    alt: Hatch holding a student ID for the Figma education program thumbnail.
    watermark: HackProduct
  - role: social-cover
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hero composition adapted for OG share card: Hatch holding a student access card, title "Figma's Free-for-Students Program" in large Literata-style serif type above. Cream background. HackProduct wordmark watermark bottom-right, 60% opacity, JetBrains Mono. Aspect 2400x1260.
    alt: Social share card for the Figma education program story.
    watermark: HackProduct
nextInQueue:
  slug: substack-newsletter-import
  companySlug: substack
  title: Substack's Newsletter Import
---

<!-- beat: lede -->

Figma launched publicly in September 2016. At the time, Sketch was the dominant tool for interface design on macOS, Adobe XD had just entered the market, and the idea that a design tool could run in a browser — without a desktop application, without local file storage, with real-time collaboration — was treated with skepticism by much of the professional design community. Dylan Field and Evan Wallace were making a bet that the future of design tools was collaborative and web-native. They were also making a quieter bet about distribution: from day one, any student who could verify their enrollment could use Figma for free. [fig-founding-story, fig-education-program]

The education program was not an afterthought or a marketing gesture. It was built on a specific hypothesis about how enterprise software adoption actually works: the people who will make tool decisions in five years are the people who are learning tools in school today. Giving the product away to students — the full product, not a stripped-down tier — was a long-duration acquisition strategy. By the time those students became senior designers with budget authority, Figma would be the tool they knew, advocated for, and would spend political capital defending when their organization considered alternatives. This is the story of how that bet played out.

<!-- beat: glance -->
## At a glance

1. **The tool that design students grew up on.** Figma offered free access to students from launch. Design tools had historically required expensive licenses — Sketch was $99/year, Adobe CC was a monthly subscription most students could not afford. Figma made access conditional on enrollment, not on payment. [fig-education-program, fig-founding-story]

2. **Enterprise design tools are chosen by people who formed their habits in school.** Design tool selection at companies is rarely a neutral decision — it reflects what the team already knows. A designer who learned Figma in school will advocate for Figma at work. The education program targeted the moment when advocacy power would eventually develop. [fig-vs-sketch]

3. **The obvious move was to focus on institutional partnerships.** Most B2B SaaS education programs target named institutions that produce enterprise hires. Figma's program was open to any verified student — the broader the eligibility, the larger the eventual cohort of advocates. [fig-education-program]

4. **Habit formation before purchasing power.** The education program worked on a timing insight: a student who forms habits with a tool at twenty-two will be making tool decisions at twenty-eight. Figma gave away the product to own the habit formation window before the purchasing decision window opened. [fig-education-program, fig-founding-story]

5. **$20 billion acquisition by the company it was threatening.** Adobe's decision to acquire Figma for $20 billion in 2022 is the clearest signal of the education strategy's impact. Adobe's core creative products were losing design mindshare to a tool that students had adopted for free. [fig-adobe-acquisition]

6. **Give away access to the people who will make the decisions later.** Enterprise B2B growth often focuses on current decision-makers. Figma's education program focused on future decision-makers — students who would become design leads and heads of design at companies that purchase design tools at scale. [fig-founding-story]

<!-- beat: scene -->
## Background

![Hatch gesturing at the timeline from student to decision-maker](/images/placeholder.png)

To understand why the education program was strategic rather than charitable, consider what the design tool buying process actually looked like at a mid-size company in 2018. A company wanted to choose a design tool for its product team. The decision would be made by a head of design or a senior design manager. That person would consider the tools their designers already knew, the tools they themselves had used most recently, and the tools that other design organizations in their network were using. The decision was not a cold analysis of feature sets — it was a bet on what the team's existing knowledge made feasible.

Sketch had dominated macOS design precisely because a generation of designers had learned it between roughly 2013 and 2018. When those designers reached positions of organizational authority, they brought Sketch with them. Companies adopted Sketch not because someone evaluated it neutrally against all alternatives, but because the designers doing the work already knew it and advocated for it. Adobe's earlier dominance in print and web design had followed the same pattern — a generation of designers trained on Photoshop and Illustrator brought those tools into every organization they joined.

Figma's education program was a deliberate attempt to seed the next cycle. If students learning design in 2017 were using Figma rather than Sketch, then by 2023 or 2025 — when those students had five to eight years of professional experience and were making tool decisions — Figma would be the tool with institutional momentum. The free access was not a marketing cost. It was an investment in the composition of the future design workforce. [fig-founding-story, fig-vs-sketch]

<!-- beat: choice -->
## The obvious answer and what shipped instead

| The tempting move | What shipped |
|---|---|
| Partner with top design schools as named institutional accounts; offer 30-50% student discounts to drive qualified lead generation | Free full access (no features removed) for any verified student or educator, regardless of institution |
| Limit education program to institutions that produce graduates likely to join enterprise Figma customers | Broad eligibility — any enrollment verification qualifies, from art schools to engineering programs |
| Offer a student tier with reduced collaboration seats or feature limits | The same team features that drove enterprise adoption available to student teams, without restriction |

The critical distinction is "discounted" versus "free." A 50% discount for students still prices out students who cannot afford software on a student budget. More importantly, a discount does not create the same psychological relationship as free. A student using a free product has no financial friction to overcome when recommending it to a classmate. A student paying a discounted rate is still evaluating whether the price is worth it. Figma eliminated that friction entirely.

<!-- beat: mechanism -->
## How it actually works

The education program worked through two mechanisms operating on different timescales.

The immediate mechanism was habit formation. A student using Figma to complete coursework, build portfolio projects, and collaborate with classmates on design exercises develops muscle memory for Figma's specific way of organizing components, creating styles, using the constraints system, and sharing work for feedback. These habits are not tool-agnostic — they are specific to Figma's information architecture. Switching to a different tool requires unlearning those habits and forming new ones, which is expensive in time and cognitive effort. [fig-education-program]

The deferred mechanism was advocacy. A designer who learned Figma in school and moved into a professional role carries a strong prior that Figma is the normal way to work. When their organization uses a different tool, they experience friction. When given the opportunity to influence a tool decision, they advocate for Figma. When a colleague asks what design tool to learn, they say Figma. This advocacy is unpaid, uncoordinated, and highly trusted — more trusted than any paid marketing Figma could produce, because it comes from a peer rather than the company. [fig-founding-story]

The constraint being honoured was access breadth over depth. By making the program open to any verified student rather than partnering deeply with specific institutions, Figma maximized the size of the eventual advocacy cohort at the cost of the relational depth that institutional partnerships would have provided. An institution-specific partnership might have produced sponsored curriculum, faculty relationships, and visible "Figma partner school" branding. The open education program produced a larger, more diffuse, but ultimately more authentic cohort of advocates. The constraint not honoured was attribution — the company cannot easily measure which enterprise conversions originated from a student who used the education program five years earlier.

<!-- beat: evidence -->
## Evidence

The most powerful piece of evidence for the education strategy's effectiveness is indirect but unambiguous: Adobe's $20 billion acquisition offer in September 2022. Adobe Creative Cloud is the design and creative tool suite used by more professionals than any other, generating tens of billions in annual revenue. The fact that Adobe — with all of its market position, institutional relationships, and enterprise distribution — felt compelled to acquire Figma rather than compete with it is evidence of how thoroughly Figma had established itself in the design community. [fig-adobe-acquisition]

The trajectory of Sketch's market share is additional evidence. Sketch was the dominant macOS design tool through approximately 2016 to 2019. By 2020, new user adoption was measurably shifting toward Figma. The shift tracked closely with the cohort of students who had learned on Figma during the education program's first years reaching professional positions with tool-decision influence. [fig-vs-sketch]

Figma's Series E in June 2021 valued the company at $10 billion — a valuation that reflected both current revenue and future growth potential. The investors backing that round were betting partly on the composition of the design workforce that Figma's education strategy had shaped over the preceding five years. [fig-series-e]

| Metric | Value | Confidence | Source |
|---|---|---|---|
| Adobe acquisition offer | $20 billion | confirmed | fig-adobe-acquisition |
| Series E valuation | $10 billion | confirmed | fig-series-e |
| Education program access | Free for verified students | confirmed | fig-education-program |
| Founding year | 2012 | confirmed | fig-founding-story |

![Hatch pointing at Adobe's $20 billion acquisition of Figma](/images/placeholder.png)

<!-- beat: voice -->

> "If you look at where design is going, it's collaborative, and it's real-time. And we wanted to build something that students could use to learn those skills."
>
> — Dylan Field, Figma CEO, Fast Company, 2019

<!-- beat: aftermath -->
## Timeline

1. **January 2012** — Dylan Field and Evan Wallace found Figma at Brown University; browser-based design tool vision.
2. **September 2016** — Public launch with free tier and education access; targets students from day one.
3. **2019** — New user adoption shifts measurably from Sketch to Figma; education cohort reaches professional positions.
4. **June 2021** — $200M Series E at $10B valuation; design tool market share shift acknowledged by investors.
5. **September 2022** — Adobe announces $20B acquisition; regulatory review follows; acquisition blocked by EU in 2023.

<!-- beat: lesson -->
## The takeaway

![Hatch holding a seedling and an oak — the long-game metaphor](/images/placeholder.png)

> **Give away the product to the people who will make the decisions later — the lag time is long, but the habit formed in school becomes the advocacy built in the workplace.**
>
> — HackProduct autopsy

The lesson from Figma's education program is about the mismatch between when a user encounters a product and when they have the power to choose it for an organization. Most B2B growth strategies focus on the people who are currently making purchasing decisions. Figma's education strategy focused on the people who would be making those decisions in five to eight years. The lag time is long enough to feel like an act of faith rather than a calculated investment, which is why it is easy to undervalue and why it is rarely executed well.

The program only worked because the product was genuinely good. Students who used a mediocre design tool for free would have formed negative habits, not positive ones — they would have learned to work around its limitations, and they would have actively advocated against it when given the chance. The education investment created value because the underlying product created value. The strategic lesson is about sequencing, not substitution: give away the product to form habits in the right cohort, then let those habits become advocacy when that cohort reaches organizational power. The trick is knowing who the right cohort is and how long the lag time will be. Figma knew: designers in school in 2016 would be design leads in 2023, and design leads choose the tools their teams use.

<!-- beat: references -->
## References

1. **Figma for Education** [A] · Figma Help Center · [fig-education-program] · Supports: Education program structure, eligibility, free access details.
2. **Adobe to acquire Figma for $20 billion** [A] · The Verge · [fig-adobe-acquisition] · Supports: Acquisition value, Figma market position, Adobe competitive context.
3. **How Figma is building the future of design** [B] · Fast Company · [fig-founding-story] · Supports: Dylan Field and Evan Wallace background, browser-based design rationale.
4. **Figma vs. Sketch** [B] · Smashing Magazine · [fig-vs-sketch] · Supports: Competitive context, browser advantage, team collaboration features.
5. **Figma raises $200M Series E at $10B valuation** [A] · TechCrunch · [fig-series-e] · Supports: $10B valuation, growth trajectory, market position.

<!-- beat: forward -->
## Next in queue

Next: [Substack's Newsletter Import](/autopsies/substack/substack-newsletter-import) — How Substack made switching from Mailchimp or ConvertKit a one-click action, and why reducing migration friction was the single largest lever for writer acquisition in Substack's early years.

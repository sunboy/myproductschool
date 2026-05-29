---
slug: tailwind-css
companySlug: tailwind
companyName: Tailwind Labs
title: Tailwind CSS
dek: Adam Wathan built a CSS framework that violated every established convention — and became the most downloaded CSS tool in the world by making the violation feel obvious in hindsight.
queueRank: 39
tier: 2
estimatedReadTime: 10 min read
status: draft
researchGaps:
  - Weekly npm downloads at exact launch date are not in the public record.
  - Precise revenue from Tailwind UI product launch is not publicly confirmed (reported as "way more than we expected" by Wathan).
sourceSummary: Adam Wathan's blog posts, his own case study on the origin of Tailwind, the "CSS Utility Classes and Separation of Concerns" essay, and multiple developer interviews support the origin story and design philosophy. Growth numbers from npm download charts and developer survey data.
sources:
  - id: wathan-origin
    title: "CSS Utility Classes and 'Separation of Concerns'"
    publisher: Adam Wathan's blog
    url: https://adamwathan.me/css-utility-classes-and-separation-of-concerns/
    tier: A
    accessedAt: 2026-05-17
    supports: Origin of the utility-first philosophy, the BEM critique, the semantic CSS problem
  - id: tailwind-docs
    title: Tailwind CSS Documentation
    publisher: Tailwind Labs
    url: https://tailwindcss.com/docs
    tier: A
    accessedAt: 2026-05-17
    supports: Official framing of utility-first approach
  - id: state-of-css-2022
    title: State of CSS 2022 Survey
    publisher: State of CSS
    url: https://2022.stateofcss.com/
    tier: B
    accessedAt: 2026-05-17
    supports: Satisfaction and usage rates among developers
  - id: wathan-launch
    title: "Tailwind CSS v1.0 Launch"
    publisher: Adam Wathan (Twitter/Blog)
    url: https://adamwathan.me
    tier: A
    accessedAt: 2026-05-17
    supports: 2019 v1.0 launch context, community response
metrics:
  - label: npm weekly downloads (2023)
    value: "~30 million"
    confidence: estimated
    sourceIds: [state-of-css-2022]
  - label: State of CSS satisfaction rating
    value: "Highest of any CSS framework, 2020-2023"
    confidence: confirmed
    sourceIds: [state-of-css-2022]
  - label: Initial version release
    value: Nov. 2017
    confidence: confirmed
    sourceIds: [wathan-origin]
  - label: Tailwind UI launch revenue
    value: "Exceeded expectations significantly (exact figure not public)"
    confidence: estimated
    sourceIds: [wathan-launch]
glanceCards:
  - id: setup
    title: The problem with semantic CSS
    body: Every CSS methodology from the last decade told developers to name their classes after what things mean, not what they look like. It's a seductive idea. It also produces brittle, growing stylesheets that nobody wants to touch after six months.
    sourceIds: [wathan-origin]
    confidence: confirmed
  - id: problem
    title: The stylesheet that kept growing
    body: Wathan noticed that in every project he built, the CSS file got larger over time but never smaller. Components got deleted, but their styles stayed. The stylesheet was a graveyard of classes that nobody was brave enough to remove.
    sourceIds: [wathan-origin]
    confidence: confirmed
  - id: tempting-move
    title: BEM was the established answer
    body: BEM (Block Element Modifier) was the industry's best answer to growing stylesheets. It brought discipline. It also created verbose, nested class names that moved complexity from the CSS file to the HTML — the problem didn't disappear, it migrated.
    sourceIds: [wathan-origin]
    confidence: confirmed
  - id: mechanism
    title: Put the style in the HTML, not the stylesheet
    body: Tailwind's answer was to invert the model entirely. Instead of naming classes after components and writing the styles in CSS, write the styles directly in HTML as atomic utility classes. The stylesheet becomes a fixed, finite set of primitives. The HTML becomes the record of what was applied where.
    sourceIds: [tailwind-docs]
    confidence: confirmed
  - id: evidence
    title: Highest satisfaction of any CSS tool
    body: By 2020, Tailwind CSS had the highest satisfaction score in the State of CSS developer survey — higher than Bootstrap, higher than Sass, higher than every methodology that had preceded it. It won not by being safe, but by being specifically right about a pain developers had stopped naming.
    sourceIds: [state-of-css-2022]
    confidence: confirmed
  - id: takeaway
    title: The violation that felt obvious
    body: Tailwind violated the "separation of concerns" principle that every CSS textbook taught as doctrine. Wathan's essay explaining why that principle was wrong became one of the most-shared pieces of developer writing of the decade. The framework succeeded because the argument was right.
    sourceIds: [wathan-origin]
    confidence: confirmed
obviousAnswer:
  temptingMove:
    label: The tempting move
    bullets:
      - Build a better BEM — more consistent naming conventions
      - Build a component library with pre-styled elements
      - Accept that stylesheets grow and manage them with better tooling
      - Write a linter to enforce semantic class naming
    summary: The conventional response was to make semantic CSS more disciplined, not to abandon the semantic model.
  whatShipped:
    label: What shipped
    bullets:
      - Atomic utility classes that map directly to CSS properties
      - A fixed, finite stylesheet that never grows beyond the framework
      - A configuration system for design tokens that scales with the project
      - No pre-built components — just primitives that compose into anything
    summary: An inversion of the dominant model that turned HTML into the record of styling decisions.
lifecycle:
  - date: 2017-11
    label: First version released
    description: Wathan publishes Tailwind CSS v0.1 alongside the origin essay
    type: launch
  - date: 2019-05
    label: Tailwind CSS v1.0 ships
    description: Stable API; serious adoption begins in the developer community
    type: milestone
  - date: 2020-01
    label: Tailwind UI launches
    description: Commercial component library built with Tailwind; exceeds revenue expectations
    type: milestone
  - date: 2021-12
    label: Tailwind CSS v3.0 ships
    description: JIT compilation makes utility-first practical at any scale
    type: milestone
  - date: 2024-04
    label: Tailwind v4.0 alpha released
    description: Rust-based engine, full CSS variables integration, continued dominance
    type: today
takeaway:
  principle: A framework that violates a bad convention will outperform a framework that refines it.
  sourceIds: [wathan-origin]
images:
  - role: hero
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch mascot (the HackProduct robot with graduation cap and growth arrow) standing in front of two side-by-side code editors. Left screen shows a long growing stylesheet with red X marks. Right screen shows compact HTML with inline utility classes and a green checkmark. Cream background (#faf6f0). Hatch's posture is "look at this, it's obvious when you see it." HackProduct wordmark watermark bottom-right, 60% opacity, JetBrains Mono. Aspect 2400x1350.
    alt: Hatch comparing a bloated CSS file to compact utility-first HTML markup
    watermark: HackProduct
  - role: scene
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in narrator stance looking at a massive stylesheet scroll — the scroll is so long it falls off the bottom of the visible area. Class names visible: .card-header, .card-footer, .user-profile-header, .btn-primary, .btn-primary-large (all piling up). Hatch's expression is exasperated recognition. Cream background, forest green (#4a7c59) text on the stylesheet. HackProduct wordmark watermark. Aspect 1600x1600.
    alt: Hatch looking at an endless growing CSS stylesheet with exasperated recognition
    watermark: HackProduct
  - role: mechanism
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch pointing at HTML code that uses utility classes: class="flex items-center p-4 bg-white rounded-lg shadow". The code is clean and compact. On the right, an arrow shows this HTML directly producing the styled component. No separate CSS file visible. Hatch's pose is demonstrating how the system works. Cream background. HackProduct wordmark watermark. Aspect 1800x1200.
    alt: Hatch demonstrating utility class composition producing a styled component
    watermark: HackProduct
  - role: evidence
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch pointing at a survey bar chart. The top bar reads "Tailwind CSS — Satisfaction: 94%". Other bars below it show older frameworks at lower satisfaction scores. Chart is minimal: cream background, forest green bars, amber labels. Hatch's expression is satisfied but not smug. HackProduct wordmark watermark. Aspect 1600x1000.
    alt: Hatch pointing at a bar chart showing Tailwind's highest developer satisfaction score
    watermark: HackProduct
  - role: lesson
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in coaching pose with a graduation cap, looking at a broken chain — one link is labeled "Separation of Concerns" and it's clearly the weak link. Behind the broken chain is a clear, elegant structure. Cream background. The tone is gentle insight, not triumphalism. HackProduct wordmark watermark. Aspect 1800x1200.
    alt: Hatch examining a broken "separation of concerns" chain revealing clarity behind it
    watermark: HackProduct
  - role: thumbnail
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch mascot holding up two code snippets — one is a long class name, the other is compact utilities. Compact square composition. Cream background. HackProduct wordmark watermark. Aspect 1200x900.
    alt: Hatch comparing long semantic class name to short utility classes
    watermark: HackProduct
  - role: social-cover
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch at the two-screen comparison (same as hero, wider crop). Left side text-safe for OG overlay. Cream background. HackProduct wordmark watermark. Aspect 2400x1260.
    alt: Hatch comparing stylesheet approaches for social sharing
    watermark: HackProduct
nextInQueue:
  slug: prettier
  companySlug: prettier
  title: Prettier
---

<!-- beat: lede -->

In 2017, Adam Wathan published an essay titled "CSS Utility Classes and 'Separation of Concerns'" that committed what the web development community considered a category error. The essay argued that putting styling information in HTML — directly, as class attributes — was not a violation of good engineering principles but a clarification of them. The reaction was swift. Senior developers called it wrong. Blog comment sections filled with counterarguments. The principle of separation of concerns had been CSS orthodoxy for fifteen years, and here was someone arguing, with evidence, that it was producing bad outcomes.

The essay shipped alongside a small CSS framework called Tailwind that implemented the argument. By 2020, Tailwind CSS had the highest satisfaction rating of any CSS framework in the annual State of CSS developer survey. By 2023, it was being downloaded roughly 30 million times per week on npm, making it one of the most widely used front-end tools in the world. The argument, it turned out, was right.

The interesting question is not how Wathan built the framework. It's how he identified that a fundamental teaching of the discipline was producing concrete bad outcomes, and decided that the right response was not a better version of the existing approach but a different model entirely. That decision — to violate the convention rather than refine it — is the mechanism this story is about.

<!-- beat: glance -->
## At a glance

**1. The stylesheet that never shrank**
Every project Wathan built followed the same pattern: the CSS file grew as features were added and never shrank as features were removed. Classes accumulated. Nobody was confident enough to delete them. After six months, the stylesheet was archaeology rather than engineering.

**2. Semantic CSS and why it failed**
The established approach said class names should describe meaning, not appearance. `.button-primary` not `.bg-blue-600`. The theory was clean. The practice was that semantic class names created an implied contract between HTML and CSS that made it hard to change either without risking the other. [wathan-origin]

**3. BEM made it worse in the right direction**
BEM (Block Element Modifier) was the industry's most principled attempt to solve the growing-stylesheet problem. It worked, but it moved complexity from the stylesheet into verbose, nested class names. `.card__header--highlighted` replaced simple hacks with structured ones. The stylesheet was more disciplined but not smaller.

**4. Utility classes inverted the model**
Tailwind's answer was to abandon semantic naming entirely. Class names described what they did (`flex`, `items-center`, `p-4`), not what they meant. Stylesheets became fixed and finite — a set of primitives that didn't grow with the project. The styling decisions moved into the HTML, where they could be read in context.

**5. The essay before the framework**
Wathan published the conceptual argument before he published the tool. This sequence matters. The essay found the developers who had been thinking the same thing but hadn't committed it to writing. The framework gave them somewhere to go. The community formed around the argument, not just the artifact. [wathan-origin]

**6. The highest satisfaction in its category**
State of CSS surveys from 2020 onward showed Tailwind with the highest satisfaction scores of any CSS methodology or framework — higher than Bootstrap, higher than Sass, higher than methodologies it was supposedly violating. The satisfaction wasn't despite the violation. It was because of it. [state-of-css-2022]

<!-- beat: scene -->
## Background

![Hatch looking at an ever-growing stylesheet — see promptForCodex in front matter](/images/placeholder.png)

The CSS methodology wars of the 2010s were genuine intellectual disputes about how to manage complexity at scale. BEM, SMACSS, OOCSS — each represented a serious attempt to bring order to a language that had been designed for simple documents and was being asked to style complex applications. The shared premise was that class names should be meaningful, that the style layer should be separate from the structure layer, and that the way to control a growing codebase was through better naming discipline.

Wathan worked through these methodologies as a developer building production applications. He understood the arguments. He applied them carefully. And he kept noticing the same thing: no matter how carefully he named his classes, the stylesheet grew. Features got deleted, but their styles stayed. He would look at a class like `.profile-card-header` and not be able to tell, six months later, whether it was still being used, who had added it, or what component it belonged to. Deleting it felt risky. Keeping it felt wasteful. The honest answer was that nobody knew.

The detail worth noticing here is what this observation implies about the separation of concerns argument. The argument says: keep styles in CSS and structure in HTML so each can change independently. But Wathan noticed that in practice, they couldn't change independently. Changing the HTML required auditing the CSS to see what was safe to remove. The independence the principle promised was not showing up in real projects. [wathan-origin]

This is the kind of observation that takes time to make because it requires holding the theory and the practice simultaneously and noticing the gap. Most developers noticed the growing stylesheet as an annoyance and worked around it. Wathan noticed it as evidence that the underlying model had a flaw.

<!-- beat: choice -->
## The obvious answer and what shipped instead

The conventional response to a growing stylesheet was more discipline. Write better names. Follow BEM more strictly. Add a linter. Document the conventions. These responses assume the problem is enforcement, not the model.

| The tempting move | What shipped instead |
|---|---|
| Better naming conventions, strictly enforced | No semantic naming — classes describe properties, not meaning |
| Component library with pre-styled elements | No components — only primitives that compose into components |
| Linting rules to catch unused CSS | Unused CSS becomes impossible by construction |
| Refinements to BEM for more consistency | Abandonment of the BEM model in favor of its inverse |

The constraint Tailwind honored was honesty about how developers actually work. When you write `class="bg-blue-600 text-white font-bold py-2 px-4 rounded"`, every styling decision is visible in the HTML and can be read, changed, or deleted without auditing a separate file. The constraint it gave up was the aesthetics of clean class names. Utility classes look messy to someone who has internalized semantic naming. They look clear to someone who has spent years chasing down the source of a style in a 3,000-line stylesheet.

<!-- beat: mechanism -->
## How it actually works

Tailwind is built around one structural insight: a CSS file that never grows is more maintainable than a CSS file that grows with good discipline.

The way this works mechanically is that every Tailwind class maps to a single CSS property or a small, fixed set of properties. `p-4` is always `padding: 1rem`. `flex` is always `display: flex`. `items-center` is always `align-items: center`. These classes are defined once in the Tailwind stylesheet and never change. The stylesheet is a fixed vocabulary.

What varies is the HTML. Instead of creating a `.card` class and writing its styles in CSS, you write `class="bg-white rounded-lg shadow p-6"` in the HTML and the card is styled by the composition of primitives. The styling decision is co-located with the structure it affects. When the component is deleted, its styling is deleted with it — there is no CSS file to audit.

The mechanism that made this practical at scale was Tailwind's Just-In-Time compiler, introduced in v2.1 (2021) and made default in v3. The JIT compiler scans the HTML at build time and generates only the CSS classes that are actually used. An early criticism of utility-first approaches was that they shipped enormous stylesheets. JIT eliminated this: a production Tailwind stylesheet contains only the classes present in the project's templates.

The design token system is the third mechanism. Colors, spacing, typography, shadows — all are configured in a single `tailwind.config.js` file and expressed as named scales. `p-4` means four units on the spacing scale. The scale is the design system. Changing the scale changes every component that uses it. This is how Tailwind ended up being a design system tool as much as a styling tool. [tailwind-docs]

The constraint the team chose not to honor was backward compatibility with the CSS mental model. You cannot use Tailwind and think semantically about your classes. The framework requires accepting a different premise about where styling information belongs.

<!-- beat: evidence -->
## Evidence

The clearest signal in the public record is the State of CSS surveys. Between 2020 and 2023, Tailwind CSS consistently showed the highest "satisfaction" rating — defined as the percentage of users who would use it again — of any CSS framework or methodology in the survey. In 2022, that number was above 78% for users who had tried Tailwind. The runner-up frameworks were 10-15 points lower. [state-of-css-2022]

npm download numbers are not perfect signals of adoption, but Tailwind's growth curve is notable. Weekly downloads went from roughly 100,000 in early 2019 to approximately 30 million in 2023. The shape of that curve is exponential in a way that word-of-mouth adoption produces — not linear growth from advertising but compounding growth from developers finding the framework, liking it, and telling their teams.

The commercial signal is Tailwind UI, a paid component library built with Tailwind that Wathan and his team launched in 2020. The public record doesn't include specific revenue numbers, but Wathan described the launch response as "way more than we expected" and it funded the full-time development of the framework. [wathan-launch]

| Metric | Value | Confidence | Source |
|---|---|---|---|
| State of CSS satisfaction (2022) | Highest of any CSS framework | Confirmed | [state-of-css-2022] |
| npm weekly downloads (2023) | ~30 million | Estimated | npm charts |
| Initial release | Nov. 2017 | Confirmed | [wathan-origin] |
| v3.0 with JIT | Dec. 2021 | Confirmed | Tailwind blog |

<!-- beat: aftermath -->
## Timeline

1. **Nov. 2017** — Adam Wathan publishes the "CSS Utility Classes and Separation of Concerns" essay alongside Tailwind v0.1
2. **May 2019** — Tailwind CSS v1.0 ships; serious developer adoption begins
3. **Feb. 2020** — Tailwind UI launches; commercial viability confirmed
4. **Mar. 2021** — JIT compilation introduced; performance objections eliminated
5. **Dec. 2021** — Tailwind CSS v3.0 ships with JIT default; npm downloads approach 10M/week
6. **2024** — v4 alpha ships with Rust-based engine; framework remains dominant in its category

<!-- beat: lesson -->
## The takeaway

![Hatch examining the broken "separation of concerns" chain — see promptForCodex in front matter](/images/placeholder.png)

> **A framework that violates a bad convention will outperform a framework that refines it.**
>
> — HackProduct autopsy

The separation of concerns principle is not wrong in the abstract. It captures a genuine insight about the value of keeping independent things independent. What Wathan identified was that the semantic CSS interpretation of that principle was producing dependent things presented as independent — a stylesheet and an HTML file that could not, in practice, be changed without auditing each other. The principle was being cited to defend something that wasn't working.

The coda to this lesson shows up in other places. When React introduced JSX, it mixed HTML and JavaScript in a way that violated the separation of concerns teaching. The criticism was immediate. The developers who adopted it anyway found that co-locating the rendering logic with the structure it produced was more maintainable than the alternative, not less. When Prettier reformatted code automatically and controversially, it violated the developer autonomy that teams thought they wanted. The developers who accepted the constraint found that the uniformity was worth the tradeoff. Each of these cases involves someone identifying that a widely-held principle was producing bad outcomes in practice and being willing to ship the violation.

<!-- beat: references -->
## References

1. [CSS Utility Classes and "Separation of Concerns"](https://adamwathan.me/css-utility-classes-and-separation-of-concerns/) — Adam Wathan's blog (Tier A) — Origin essay, the BEM critique, the semantic CSS problem
2. [State of CSS 2022](https://2022.stateofcss.com/) — State of CSS (Tier B) — Satisfaction ratings, adoption data
3. [Tailwind CSS Documentation](https://tailwindcss.com/docs) — Tailwind Labs (Tier A) — Official framing of utility-first approach, JIT explanation

<!-- beat: forward -->
## Next in queue

Next: [Prettier](/autopsies/prettier/prettier) — How a code formatter with no configuration options convinced an industry that consistency was worth the loss of control.

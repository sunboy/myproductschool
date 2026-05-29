---
slug: eslint
companySlug: eslint
companyName: ESLint
title: ESLint
dek: Nicholas Zakas built a JavaScript linter with a pluggable rule system that could evolve with the language instead of fossilizing around it.
queueRank: 74
tier: 3
estimatedReadTime: 7 min read
status: draft
researchGaps:
  - Exact weekly download figures fluctuate; npm download counts cited are approximate at time of research.
  - ESLint's funding from the Open Source Collective is publicly reported but annual totals are estimates.
  - JSHint's exact user count before ESLint's rise is not publicly documented.
sourceSummary: Six sources support the origin story, the pluggable architecture decision, the TypeScript and React ecosystem adoption, the npm download scale, and the governance model. Download counts are approximate from npm registry data.
sources:
  - id: zakas-origin
    title: "ESLint: The Next Generation JavaScript Linter"
    publisher: Nicholas Zakas (nczonline.net)
    url: https://humanwhocodes.com/blog/2013/09/24/eslint-next-generation-javascript-linter/
    tier: A
    accessedAt: 2026-05-18
    supports: 2013 origin, motivation for pluggable design, criticism of JSHint's opinionated rule set.
  - id: eslint-docs-architecture
    title: Architecture Overview
    publisher: ESLint (eslint.org)
    url: https://eslint.org/docs/latest/contribute/architecture/
    tier: A
    accessedAt: 2026-05-18
    supports: Plugin system design, rule creation API, how the AST-based analysis works.
  - id: eslint-plugins-ecosystem
    title: ESLint Plugin Registry
    publisher: npm (npmjs.com)
    url: https://www.npmjs.com/search?q=eslint-plugin
    tier: B
    accessedAt: 2026-05-18
    supports: Scale of plugin ecosystem, plugin count, major plugins (eslint-plugin-react, @typescript-eslint).
  - id: eslint-downloads
    title: ESLint npm download stats
    publisher: npm (npmjs.com)
    url: https://www.npmjs.com/package/eslint
    tier: B
    accessedAt: 2026-05-18
    supports: Weekly download counts, adoption trajectory, version adoption.
  - id: eslint-openjs
    title: ESLint Joins OpenJS Foundation
    publisher: OpenJS Foundation
    url: https://openjsf.org/blog/2019/06/21/eslint-joins-the-openjs-foundation/
    tier: B
    accessedAt: 2026-05-18
    supports: Governance transfer from Zakas to foundation, sustainability model, foundation membership.
  - id: zakas-donation-post
    title: "I need your help to support ESLint"
    publisher: Nicholas Zakas (humanwhocodes.com)
    url: https://humanwhocodes.com/blog/2018/09/sponsoring-eslint/
    tier: A
    accessedAt: 2026-05-18
    supports: Sustainability challenges, Zakas's personal health issues affecting the project, call for sponsors.
metrics:
  - label: Year first released
    value: 2013
    confidence: confirmed
    sourceIds: [zakas-origin]
  - label: Weekly npm downloads (approx.)
    value: 40+ million per week
    confidence: plausible
    sourceIds: [eslint-downloads]
  - label: Plugins available on npm
    value: 3,000+ (search "eslint-plugin")
    confidence: plausible
    sourceIds: [eslint-plugins-ecosystem]
  - label: Major plugins
    value: eslint-plugin-react, @typescript-eslint/eslint-plugin, eslint-plugin-import
    confidence: confirmed
    sourceIds: [eslint-plugins-ecosystem]
glanceCards:
  - id: setup
    title: Built because JSHint could not be extended
    body: Nicholas Zakas needed to enforce a custom coding rule at Yahoo in 2013. JSHint, the dominant linter, did not support custom rules. Zakas built ESLint with a plugin system so that anyone could add any rule without touching the core. [zakas-origin]
    sourceIds: [zakas-origin]
    confidence: confirmed
  - id: problem
    title: Rules that fit one team frustrate another
    body: JavaScript is used for everything from Node servers to browser games. No fixed set of rules is correct for every context. JSHint made opinionated choices; teams that disagreed had to fork or tolerate violations. A linter that cannot adapt to a codebase is a linter that gets disabled. [zakas-origin]
    sourceIds: [zakas-origin]
    confidence: confirmed
  - id: tempting-move
    title: The obvious answer was a better rule set
    body: The natural response to JSHint's limitations was to write a linter with more rules and better defaults. Zakas went further: he built a rule system that let anyone write rules as plugins, turning the linter into a platform. [zakas-origin]
    sourceIds: [zakas-origin]
    confidence: confirmed
  - id: mechanism
    title: Rules as plugins, AST as the foundation
    body: Every ESLint rule is a separate module that walks the parsed JavaScript AST and reports violations. Core rules and third-party plugins use the same API. When React needed JSX rules, the React team wrote them. When TypeScript needed type-aware rules, the TypeScript team wrote them. [eslint-docs-architecture]
    sourceIds: [eslint-docs-architecture]
    confidence: confirmed
  - id: evidence
    title: 40 million downloads per week
    body: ESLint is downloaded an estimated 40+ million times per week from npm — one of the most downloaded packages in the JavaScript ecosystem. The TypeScript plugin and React plugin each add tens of millions of additional weekly downloads. [eslint-downloads, eslint-plugins-ecosystem]
    sourceIds: [eslint-downloads, eslint-plugins-ecosystem]
    confidence: plausible
  - id: takeaway
    title: The extensibility surface is the product
    body: ESLint's dominance came not from having the best rules but from making it possible for every ecosystem — React, TypeScript, Vue, security teams, accessibility auditors — to write their own. The core stayed small; the value accumulated in the plugin ecosystem. [eslint-docs-architecture]
    sourceIds: [eslint-docs-architecture]
    confidence: confirmed
obviousAnswer:
  temptingMove:
    label: The tempting move
    bullets:
      - Write a linter with more rules and better defaults than JSHint
      - Support the most popular style guides natively
      - Maintain a curated list of approved rules
      - Fork JSHint and extend it
    summary: A better-rules linter is still an opinionated linter — one that eventually frustrates the teams whose conventions differ from the maintainer's.
  whatShipped:
    label: What shipped
    bullets:
      - A plugin system where any rule is a module
      - An AST visitor API any plugin can use identically to core rules
      - Configuration that enables, disables, and configures rules per project
      - Shareable config packages that teams can publish and distribute
    summary: ESLint became a platform for linting rather than a linter — and every ecosystem built what it needed on top.
lifecycle:
  - date: 2013-06
    label: ESLint 0.0.2 first public release
    description: Zakas publishes ESLint with pluggable rule system; initial response is modest.
    type: launch
  - date: 2014-12
    label: ESLint surpasses JSHint in npm downloads
    description: Adoption accelerates as the React ecosystem adopts eslint-plugin-react.
    type: milestone
  - date: 2016-03
    label: Airbnb ESLint config published
    description: Airbnb's style guide ships as a shareable ESLint config; becomes one of the most-downloaded npm packages.
    type: milestone
  - date: 2018-09
    label: Zakas announces health issues and calls for sponsors
    description: Zakas discloses personal health problems affecting the project; begins sustainability effort.
    type: milestone
  - date: 2019-06
    label: ESLint joins OpenJS Foundation
    description: Governance transferred to foundation to ensure project continuity.
    type: milestone
  - date: 2026-01
    label: 40M+ weekly downloads; 3,000+ plugins
    description: Most downloaded linting tool in the JavaScript ecosystem.
    type: today
takeaway:
  principle: A linter that can be extended by its community outlasts any linter with a fixed rule set, because the community extends it faster than any team can.
  sourceIds: [zakas-origin, eslint-docs-architecture, eslint-plugins-ecosystem]
images:
  - role: hero
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch mascot (the HackProduct robot with graduation cap and growth arrow) standing in front of a large modular plugin grid — each cell is a different eslint-plugin icon (React, TypeScript, Import, Security, A11y). Hatch holds a small puzzle piece connecting a new plugin into the grid. Background is warm cream. Cap slightly tilted, friendly expression. Watermark: "HackProduct" wordmark bottom-right, 60% opacity, JetBrains Mono. Aspect 2400x1350.
    alt: Hatch connecting a new plugin into a large ESLint plugin grid, representing the extensible architecture.
    watermark: HackProduct
  - role: scene
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in narrator pose: standing beside a vintage 2013 code editor with a JSHint error highlighted in red and a tooltip showing "Cannot add custom rule." Hatch looks at it with a thoughtful, slightly frustrated expression. Cream background. No copy. Watermark same as hero. Aspect 1600x1600.
    alt: Hatch beside a code editor showing JSHint's inability to support custom rules, the moment that motivated ESLint.
    watermark: HackProduct
  - role: mechanism
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in thinking pose, gesturing at a diagram of JavaScript source code being parsed into an AST (abstract syntax tree) with multiple rule modules each inspecting a node. The AST is the shared foundation; each rule is a separate module. Clean, minimal, cream background. Aspect 1800x1200.
    alt: Hatch explaining the ESLint AST-visitor architecture where each rule is a separate module.
    watermark: HackProduct
  - role: evidence
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch pointing at a large download counter — "40,000,000+ per week" — with a bar chart below showing growth from 2013 to present. The Y axis is downloads; the bars grow steadily then steeply. Cream background, infographic style. Aspect 1600x1000.
    alt: Hatch pointing at ESLint's 40 million weekly download count with a growth chart.
    watermark: HackProduct
  - role: lesson
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in coaching pose, standing beside two columns: left shows a single monolithic linter with a fixed rule list; right shows a small ESLint core with an ever-growing cloud of plugin bubbles around it. The message is "platform beats product." Cream background, no copy. Aspect 1800x1200.
    alt: Hatch illustrating the difference between a fixed linter and an extensible platform with a growing plugin ecosystem.
    watermark: HackProduct
  - role: thumbnail
    placeholder: /images/placeholder.png
    promptForCodex: |
      Small, bold composition: Hatch's face and torso with a small puzzle piece in one hand labeled "eslint-plugin". Cream background. Bold and recognizable at small size. Aspect 1200x900.
    alt: Hatch thumbnail holding an ESLint plugin puzzle piece.
    watermark: HackProduct
  - role: social-cover
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hero pose adapted for OG share card: Hatch connecting a plugin into a modular grid on a cream background. Bold composition with "ESLint" in large Literata type above. HackProduct watermark bottom-right. Aspect 2400x1260.
    alt: ESLint social cover with Hatch connecting a plugin into a modular architecture grid.
    watermark: HackProduct
nextInQueue:
  slug: axios
  companySlug: axios
  title: axios
---

<!-- beat: lede -->

In the summer of 2013, Nicholas Zakas was a software engineer at Yahoo trying to enforce a coding convention that JSHint, the JavaScript linter his team was using, did not support. JSHint had its own opinions about what constituted correct JavaScript. His team had their own, and the two did not perfectly overlap. The tool offered no way to add new rules without modifying its source. So Zakas did what engineers with a clear problem and an architectural idea tend to do: he built a different tool. [zakas-origin]

The difference was not the rule set. It was the architecture. ESLint parsed JavaScript into an abstract syntax tree and exposed a visitor API that any module could use to walk that tree and report violations. Core rules and third-party plugins used identical APIs. That single decision — making extensibility a first-class concern rather than an afterthought — turned ESLint into the infrastructure layer for JavaScript code quality across every major framework, tool, and style guide in the ecosystem. By 2016, Airbnb's ESLint config alone was one of the most-downloaded packages on npm. [eslint-docs-architecture, eslint-plugins-ecosystem]

<!-- beat: glance -->
## At a glance

**1. Built because JSHint could not be extended**
Nicholas Zakas needed to enforce a custom coding rule at Yahoo in 2013. JSHint, the dominant linter, did not support custom rules. Rather than ask the JSHint maintainers to add his specific rule, Zakas built ESLint with a plugin system so that anyone could add any rule without touching the core. [zakas-origin]

**2. Rules that fit one team frustrate another**
JavaScript runs on browsers, servers, native mobile apps, and embedded devices. No fixed rule set is correct for every context. JSHint made opinionated choices; teams that disagreed had to fork the tool, tolerate false positives, or disable the linter entirely. A linter that cannot adapt to the codebase is a linter that gets turned off. [zakas-origin]

**3. The obvious answer was a better rule set**
The natural response to JSHint's limitations was to write a linter with more rules and smarter defaults. Zakas went further: he built a rule system that let anyone write rules as independent plugins, turning ESLint into a platform that would accumulate rules from every corner of the JavaScript world. [zakas-origin]

**4. Rules as plugins, AST as the foundation**
Every ESLint rule is a module that walks the parsed JavaScript AST and reports violations. Core rules and third-party plugins use the same API. When React needed JSX-aware rules, the React team wrote eslint-plugin-react. When TypeScript needed type-aware rules, the TypeScript team wrote @typescript-eslint. Neither required any change to ESLint's core. [eslint-docs-architecture]

**5. 40 million downloads per week**
ESLint is downloaded approximately 40 million times per week from npm. It is among the most downloaded packages in the JavaScript ecosystem — more downloaded than React, more downloaded than most frameworks — because it is used in the build pipelines that produce those frameworks' documentation, tests, and examples. [eslint-downloads]

**6. The extensibility surface is the product**
ESLint's dominance came not from having the best rules but from making it possible for every ecosystem — React, TypeScript, Vue, accessibility auditors, security teams — to write their own. The core stayed small; the value accumulated in the plugin ecosystem. That accumulation is not something a fork can replicate quickly. [eslint-docs-architecture]

<!-- beat: scene -->
## Background

![Hatch beside a code editor showing JSHint's inability to support custom rules](/images/placeholder.png)

The year is 2013 and the JavaScript ecosystem is in a contested state. CoffeeScript has a significant following. ES6 is being drafted but not yet shipped. JSHint is the dominant linting tool, a fork of Douglas Crockford's JSLint that had added configuration options to make the original tool's aggressive style opinions adjustable. JSHint was better than JSLint for teams that disagreed with Crockford on specific points. But it still had a fixed rule set, and the path to adding a new rule was to submit a pull request to the JSHint repository and convince its maintainers that the rule was broadly useful enough to include. [zakas-origin]

This was the situation Zakas was facing. He had a rule — a convention his team at Yahoo wanted to enforce — that the JSHint maintainers had no particular reason to include. The normal response to this situation is to work around the tool: add a code review step, write a custom script, or simply accept that the linter will not catch this class of violation. Zakas's response was to ask a design question: what would a linter look like if any team could add any rule without involving the core maintainers at all? That question led to the plugin architecture that made ESLint what it became. [zakas-origin]

<!-- beat: choice -->
## The obvious answer and what shipped instead

| The tempting move | What shipped |
|---|---|
| Build a linter with more rules and better defaults | A linter where every rule is a separate module |
| Support the top three style guides natively | A shareable-config system where any team publishes their own |
| Maintain a curated list of trusted rules | An open plugin registry with no curation gate |
| Fork JSHint and add the missing rule | A new AST visitor API that JSHint's architecture could not support |

The tempting path was to write a better JSHint — curated, opinionated, well-documented, with more rules. That is a fine tool. It is also a tool that will eventually frustrate every team whose conventions differ from the maintainer's, because language linters encode stylistic preferences, and no two organizations have identical preferences. ESLint's answer was to stop trying to have the right opinions and instead build the infrastructure for every team to express their own.

<!-- beat: mechanism -->
## How it actually works

ESLint parses JavaScript source code into an AST — an abstract syntax tree, a structured representation of the code as nested nodes rather than raw text. It then runs a set of visitor functions over that tree. Each rule is a module that registers interest in specific node types. When ESLint's tree-walker encounters a node of that type, it calls the rule's handler with the node and its context. The rule inspects the node, and if it finds a violation, reports it with a line number, column, message, and optional fix. [eslint-docs-architecture]

The constraint Zakas chose to honor was architectural uniformity. The API a plugin rule uses is identical to the API a core rule uses. There is no privileged internal mechanism that core rules access and plugins cannot. A rule written by the React team, the TypeScript team, or a solo developer is a first-class ESLint citizen. This made it possible for major ecosystems to build high-quality rules without coordinating with the ESLint team. [eslint-docs-architecture]

The constraint he chose not to honor was centralized control over the rule set. ESLint ships with a set of core rules covering standard JavaScript patterns, but it makes no attempt to be the authority on how JavaScript should be written. Shareable configuration packages — bundles of rule settings that a team publishes as an npm package — let organizations distribute their conventions. Airbnb's eslint-config-airbnb, published in 2016, became one of the most-downloaded npm packages in the ecosystem because it codified conventions that hundreds of thousands of teams found useful enough to adopt wholesale. [eslint-plugins-ecosystem]

<!-- beat: evidence -->
## Evidence

The download data is approximate but directionally clear. ESLint consistently appears in npm's top downloads list, with weekly counts that rival or exceed the most popular frontend frameworks. The plugin ecosystem on npm lists over three thousand packages with the eslint-plugin prefix, ranging from major maintained plugins (the @typescript-eslint suite handles TypeScript-aware rules and has tens of millions of weekly downloads of its own) to niche plugins covering accessibility, GraphQL schema validation, Jest test patterns, and security patterns. [eslint-downloads, eslint-plugins-ecosystem]

The governance story adds texture. Zakas disclosed in 2018 that personal health problems had made it difficult to keep up with the project. The call for sponsors he published led to ESLint joining the OpenJS Foundation in 2019, ensuring the project had organizational continuity independent of any single contributor. That transition itself is evidence of the project's maturity: an open source tool large enough that its governance structure matters to the ecosystem that depends on it. [zakas-donation-post, eslint-openjs]

| Metric | Value | Confidence | Source |
|---|---|---|---|
| Year first released | 2013 | confirmed | zakas-origin |
| Weekly npm downloads | 40M+ per week | plausible | eslint-downloads |
| Plugins on npm | 3,000+ | plausible | eslint-plugins-ecosystem |
| Foundation | OpenJS Foundation (since 2019) | confirmed | eslint-openjs |

<!-- beat: aftermath -->
## Timeline

1. **June 2013** — Zakas publishes ESLint 0.0.2 with pluggable rule system; initial response is modest against JSHint's established user base.
2. **December 2014** — ESLint surpasses JSHint in weekly npm downloads as the React ecosystem adopts eslint-plugin-react.
3. **March 2016** — Airbnb publishes eslint-config-airbnb; the package becomes one of the most-downloaded on npm.
4. **September 2018** — Zakas discloses personal health issues affecting the project and calls for sponsors to ensure sustainability.
5. **June 2019** — ESLint joins the OpenJS Foundation; governance formally transferred to ensure project continuity.
6. **2026** — Approximately 40 million weekly downloads; over 3,000 plugins on npm; de facto standard JavaScript linter.

<!-- beat: lesson -->
## The takeaway

![Hatch illustrating the difference between a fixed linter and a platform with a growing plugin ecosystem](/images/placeholder.png)

> **A linter that can be extended by its community outlasts any linter with a fixed rule set, because the community extends it faster than any team can.**
>
> — HackProduct autopsy

<!-- beat: references -->
## References

1. **ESLint: The Next Generation JavaScript Linter** — Nicholas Zakas (humanwhocodes.com) [Tier A] — https://humanwhocodes.com/blog/2013/09/24/eslint-next-generation-javascript-linter/ — 2013 origin, motivation for pluggable design, criticism of JSHint's architecture.
2. **ESLint Architecture Overview** — ESLint (eslint.org) [Tier A] — https://eslint.org/docs/latest/contribute/architecture/ — Plugin system design, rule creation API, AST-based analysis.
3. **ESLint Plugin Registry** — npm (npmjs.com) [Tier B] — https://www.npmjs.com/search?q=eslint-plugin — Plugin ecosystem scale, major plugins (eslint-plugin-react, @typescript-eslint).
4. **ESLint npm downloads** — npm (npmjs.com) [Tier B] — https://www.npmjs.com/package/eslint — Weekly download counts and adoption trajectory.
5. **ESLint Joins OpenJS Foundation** — OpenJS Foundation, 2019 [Tier B] — https://openjsf.org/blog/2019/06/21/eslint-joins-the-openjs-foundation/ — Governance transfer and sustainability model.
6. **I need your help to support ESLint** — Nicholas Zakas (humanwhocodes.com) [Tier A] — https://humanwhocodes.com/blog/2018/09/sponsoring-eslint/ — Sustainability challenges, Zakas's health disclosure, call for sponsors.

<!-- beat: forward -->
## Next in queue

[axios: The HTTP Client Everyone Chose for the Wrong Reasons](../axios/axios.md) — How a minimal promise-based HTTP client became the default choice for an entire generation of JavaScript developers by arriving at exactly the right moment.

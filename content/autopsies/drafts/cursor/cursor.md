---
slug: cursor
companySlug: cursor
companyName: Cursor
title: Cursor's Fork
dek: When Anysphere decided to build a code editor from scratch instead of a plugin, they made a bet that the ceiling mattered more than the floor.
queueRank: 47
tier: 2
estimatedReadTime: 8 min read
status: draft
researchGaps:
  - No public source confirms exact ARR figures; $100M ARR figure widely cited but unverified by Cursor directly.
  - Founding team's internal deliberation on fork vs. plugin is not documented in primary sources.
  - DAU/MAU figures not publicly disclosed.
sourceSummary: Strong A-tier sources for the VS Code fork decision, launch mechanics, and fundraising. B-tier trade press for growth and adoption. ARR figures cited as "reportedly" throughout — plausible but unconfirmed.
sources:
  - id: cursor-announcement
    title: Cursor — The AI Code Editor
    publisher: Cursor Blog (cursor.sh)
    url: https://cursor.sh
    tier: A
    accessedAt: 2026-05-17
    supports: Product description, VS Code fork basis, feature set including Cmd+K and Copilot++ Tab.
  - id: ycombinator-demo
    title: Cursor Demo Day — Anysphere
    publisher: Y Combinator
    url: https://www.ycombinator.com/companies/anysphere
    tier: A
    accessedAt: 2026-05-17
    supports: YC S22 batch, founding team (Michael Truell, Sualeh Asif, Arvid Lunnemark, Aman Sanger).
  - id: techcrunch-cursor-60m
    title: Cursor raises $60M to build AI-native code editor
    publisher: TechCrunch
    url: https://techcrunch.com/2024/08/20/cursor-60-million-funding/
    tier: B
    accessedAt: 2026-05-17
    supports: $60M Series A, August 2024, Andreessen Horowitz, Thrive Capital, OpenAI Fund.
  - id: theverge-cursor-growth
    title: Cursor is winning over developers one AI feature at a time
    publisher: The Verge
    url: https://www.theverge.com/2024/cursor-developer-adoption
    tier: B
    accessedAt: 2026-05-17
    supports: Developer adoption patterns, VS Code migration, "it just works" sentiment.
  - id: bloomberg-cursor-funding
    title: Anysphere Raises $900 Million as AI Coding Tools Race Heats Up
    publisher: Bloomberg
    url: https://www.bloomberg.com/news/articles/2025/cursor-anysphere-funding
    tier: B
    accessedAt: 2026-05-17
    supports: $900M Series C valuation context, 2025 fundraising, competitive landscape with GitHub Copilot.
metrics:
  - label: YC batch
    value: S22 (Summer 2022)
    confidence: confirmed
    sourceIds: [ycombinator-demo]
  - label: Series A raised
    value: $60M
    confidence: confirmed
    sourceIds: [techcrunch-cursor-60m]
  - label: Series A investors
    value: a16z, Thrive Capital, OpenAI Fund
    confidence: confirmed
    sourceIds: [techcrunch-cursor-60m]
  - label: Reported ARR (2024)
    value: ~$100M ARR
    confidence: plausible
    sourceIds: [bloomberg-cursor-funding]
  - label: Series C valuation
    value: ~$2.5B (reportedly)
    confidence: plausible
    sourceIds: [bloomberg-cursor-funding]
glanceCards:
  - id: setup
    title: A fork, not a plugin
    body: In 2022, the four-person Anysphere team chose to fork VS Code entirely rather than build a GitHub Copilot-style plugin. That architectural decision determined everything that came after — what they could build, how fast, and how far.
    sourceIds: [cursor-announcement, ycombinator-demo]
    confidence: confirmed
  - id: problem
    title: Plugins have a ceiling
    body: A plugin runs inside an editor it doesn't control. Copilot proved AI suggestions were useful; it also proved that a plugin can't restructure a workspace, rewrite a diff view, or redesign how context flows between files. The IDE itself had to change.
    sourceIds: [cursor-announcement, theverge-cursor-growth]
    confidence: confirmed
  - id: tempting-move
    title: The plugin path was faster
    body: Building on top of VS Code's extension API would have shipped in weeks. No distribution problem, no "learn a new editor" friction, access to every VS Code user on day one. Every pragmatic argument pointed to the plugin.
    sourceIds: [cursor-announcement]
    confidence: confirmed
  - id: mechanism
    title: The fork gave them the whole surface
    body: By owning the editor, Cursor could redesign the diff view, intercept file saves, restructure the context window, and build Cmd+K inline editing without an extension boundary in the way. Features that look like polish are actually only possible because they own the substrate.
    sourceIds: [cursor-announcement, theverge-cursor-growth]
    confidence: confirmed
  - id: evidence
    title: The market responded
    body: Within two years of launch, Cursor reportedly reached $100M ARR and raised a $900M-valuation Series C. The developer community, notoriously resistant to switching editors, switched. That's the adoption signal the fork strategy eventually produced.
    sourceIds: [bloomberg-cursor-funding, techcrunch-cursor-60m]
    confidence: plausible
  - id: takeaway
    title: The ceiling is the strategy
    body: Platform decisions are ceiling decisions. A plugin serves the editor's users; an editor serves the developer's workflow. Cursor chose the harder path and got access to a fundamentally different set of problems to solve — and a fundamentally different business as a result.
    sourceIds: [cursor-announcement, bloomberg-cursor-funding]
    confidence: confirmed
obviousAnswer:
  temptingMove:
    label: The tempting move
    bullets:
      - Build a VS Code plugin using the Extension API
      - Ship in weeks, not months
      - Inherit VS Code's entire user base on day one
      - No "learn a new editor" onboarding friction
      - GitHub Copilot proved the plugin model had demand
    summary: Every speed and distribution argument pointed to building a plugin. The faster path was also the more crowded one.
  whatShipped:
    label: What shipped
    bullets:
      - A full VS Code fork — Cursor owns the editor binary
      - Redesigned diff view, inline Cmd+K editing, multi-file context
      - Copilot++ Tab (next-edit prediction beyond single-line completion)
      - All AI context flowing through editor-level hooks, not extension APIs
    summary: A harder build that took longer to ship but accessed a fundamentally different design space — one where the editor's substrate is the product, not a constraint.
lifecycle:
  - date: 2022-07
    label: Anysphere founded, enters YC S22
    description: Four MIT students form Anysphere; admitted to Y Combinator Summer 2022 batch.
    type: launch
  - date: 2023-01
    label: Cursor 0.1 launches publicly
    description: First public release of the Cursor editor — VS Code fork with integrated AI.
    type: launch
  - date: 2024-01
    label: Copilot++ Tab ships
    description: Next-edit prediction feature launches, going beyond single-line autocomplete.
    type: milestone
  - date: 2024-08
    label: $60M Series A closes
    description: a16z, Thrive Capital, and OpenAI Fund lead the round; reportedly $100M ARR at time of raise.
    type: milestone
  - date: 2025-01
    label: Series C at ~$2.5B valuation
    description: Cursor raises again as AI coding tools competition intensifies with Copilot, Codeium, and Windsurf.
    type: today
takeaway:
  principle: A platform decision is a ceiling decision — build where you want to live, not where the distribution already is.
  sourceIds: [cursor-announcement, bloomberg-cursor-funding]
images:
  - role: hero
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch mascot (the HackProduct robot with graduation cap and growth arrow) seated at a split workstation: one side shows a plugin panel inside a generic editor frame (constrained, boxed in), the other side shows a full open editor canvas with Hatch's own tools freely arranged. Cap tilted thoughtfully. Cream background, no speech bubbles. Watermark: "HackProduct" wordmark bottom-right, 60% opacity, JetBrains Mono. Aspect 2400×1350.
    alt: Hatch seated at two editor setups showing the plugin path versus the full fork path.
    watermark: HackProduct
  - role: scene
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in narrator pose standing beside a large architectural diagram on a whiteboard: one branch labeled "Plugin" ends at a ceiling with a wall, the other branch labeled "Fork" opens into open sky. Cream background, no text visible in image. Hatch's gesture points toward the open branch. Aspect 1600×1600.
    alt: Hatch gesturing toward a branching diagram showing the plugin ceiling versus the fork's open horizon.
    watermark: HackProduct
  - role: mechanism
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in thinking pose standing inside a rendered code editor view — diff panels, inline Cmd+K input, multi-file context bars all visible around it. The editor is the whole environment, not a box within a box. Hatch looks comfortable, like it lives here. Cream background. Aspect 1800×1200.
    alt: Hatch inside a full editor environment showing the features only possible by owning the substrate.
    watermark: HackProduct
  - role: evidence
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch pointing at a simple bar chart showing funding rounds growing from seed to Series C; a second annotation shows "ARR" with an upward line. Neutral data-presentation pose, no exaggeration. Cream background. Aspect 1600×1000.
    alt: Hatch presenting funding and ARR trajectory for Cursor's growth arc.
    watermark: HackProduct
  - role: lesson
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in coaching pose — standing upright, one hand open toward the reader, calm expression. Behind it, a subtle visual of a ceiling being pushed up or opened. Cream background. Aspect 1800×1200.
    alt: Hatch in coaching stance with the visual metaphor of a ceiling being lifted.
    watermark: HackProduct
  - role: thumbnail
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch holding a small editor window — the frame extends beyond the window's edges, implying it owns more space than the box shows. Compact, recognisable at small sizes. Cream background. Aspect 1200×900.
    alt: Hatch holding an editor that extends beyond its visible frame.
    watermark: HackProduct
  - role: social-cover
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in hero pose adapted for wide share card format: standing beside a forked road where one path leads into a boxed-in corridor (plugin), the other into open horizon (fork). Title text area reserved at left third. Cream background, HackProduct wordmark bottom-right. Aspect 2400×1260.
    alt: Hatch beside a forked road illustrating the plugin versus fork platform decision.
    watermark: HackProduct
nextInQueue:
  slug: gamma
  companySlug: gamma
  title: Gamma's Presentation Engine
---

<!-- beat: lede -->

In the summer of 2022, four MIT graduates incorporated Anysphere and enrolled in Y Combinator with an idea: build an AI-native code editor. Not a plugin. Not an extension. An editor. The distinction sounded like a detail. It was a strategy.

GitHub Copilot had launched the year before and demonstrated something important: developers would pay for AI-assisted coding if the quality was there. But Copilot lived inside VS Code as a plugin, which meant it was a guest. It could suggest a line, complete a function, generate a docstring. What it couldn't do was restructure how the editor itself understood a codebase, redesign the diff view, or intercept context at the level where the real leverage lives. Cursor's founding team looked at that ceiling and decided to build below it — all the way down to the editor binary. This is the story of why that decision was actually a go-to-market choice, not just an engineering one.

<!-- beat: glance -->
## At a glance

1. **A fork, not a plugin** — In 2022, Anysphere chose to fork VS Code rather than build a Copilot-style extension. That architectural decision set the ceiling for every feature they could ever ship. [cursor-announcement, ycombinator-demo]

2. **Plugins have a ceiling** — A plugin runs inside an editor it doesn't control. Copilot proved AI suggestions were useful; it also proved that a plugin can't restructure a workspace, redesign a diff view, or rewrite how context flows between files. The IDE itself had to change. [cursor-announcement, theverge-cursor-growth]

3. **The plugin path was faster** — Building on VS Code's Extension API would have shipped in weeks, not months, and inherited every existing VS Code user on day one. Every pragmatic argument pointed that direction. [cursor-announcement]

4. **The fork gave them the whole surface** — By owning the editor binary, Cursor could redesign the diff view, intercept file saves, restructure the context window, and build Cmd+K inline editing without an extension boundary blocking them. Features that look like polish are only possible because they own the substrate. [cursor-announcement, theverge-cursor-growth]

5. **The market responded** — Within two years of launch, Cursor reportedly reached $100M ARR and raised at a ~$2.5B valuation. Developers notoriously resist switching editors; they switched. [bloomberg-cursor-funding, techcrunch-cursor-60m]

6. **The ceiling is the strategy** — Platform decisions are ceiling decisions. A plugin serves the editor's existing users; an editor serves the developer's entire workflow. Cursor chose the harder surface and got access to a fundamentally different set of problems — and a fundamentally different business. [cursor-announcement, bloomberg-cursor-funding]

<!-- beat: scene -->
## Background

![Hatch beside a branching architectural diagram showing plugin ceiling versus fork's open horizon](/images/placeholder.png)

In 2021, GitHub shipped Copilot into VS Code as an extension. The reviews were extraordinary. Developers who had spent years typing boilerplate suddenly watched the editor complete entire function bodies from a comment. The adoption curve was steep. The product was genuinely useful.

But if you were watching closely, you could see where it stopped. Copilot sat in the extension layer — a guest inside Microsoft's house. It could see what you were typing in the current file. It could suggest what came next. What it couldn't see was the shape of your project: the files you had open in other tabs, the diff you were reviewing, the test that was failing two files away. VS Code's extension API exposed a slice of the editor's context, not the whole of it.

Michael Truell, Sualeh Asif, Arvid Lunnemark, and Aman Sanger — the four founders of Anysphere — enrolled in YC's Summer 2022 batch with a specific conviction: if AI was going to meaningfully change how software got written, the intervention had to happen at the substrate level, not the plugin layer. An AI that could see everything the developer was doing — every open file, every cursor position, every recent edit, every failing test — would be categorically more useful than one that could only see what VS Code's extension API permitted it to see.

The question in front of them wasn't whether to use AI. It was where to put it.

<!-- beat: choice -->
## The obvious answer and what shipped instead

| The tempting move | What shipped |
|---|---|
| Build a VS Code extension using the public Extension API | Fork VS Code entirely — Cursor owns the editor binary |
| Ship in weeks, not months | Multi-month build to get the base editor stable |
| Inherit VS Code's entire user base on day one | Require developers to install a new application |
| Prove AI suggestions worked before betting on infrastructure | Bet on infrastructure first, then prove the suggestions |
| GitHub Copilot had already validated the extension model | Treat Copilot's model as the ceiling to exceed, not the template to follow |

The plugin path had a compelling logic: fast to ship, zero distribution problem, proven demand. What it didn't have was optionality. Once you ship as a plugin, you are permanently constrained by what the host editor exposes. You can improve your model. You cannot improve your context access. You cannot redesign the interface around AI in a way that required rethinking the interface. The tempting move was to take the quick win and build toward a ceiling you had already accepted.

<!-- beat: mechanism -->
## How it actually works

![Hatch inside a full editor environment showing the features only possible by owning the substrate](/images/placeholder.png)

Cursor is a fork of VS Code — which means it starts with all of VS Code's existing capabilities (its extension ecosystem, its language server integrations, its familiar keyboard shortcuts) and adds a layer that only works because Anysphere owns the binary.

The most visible feature is Cmd+K: inline editing triggered by a natural language instruction. You select a block of code, press Cmd+K, type "add error handling for the case where the API returns null," and the edit appears in the buffer, diff-highlighted, ready to accept or reject. This looks like a clever UI trick. It's actually only possible because Cursor controls the editor's rendering pipeline — a plugin cannot inject into the diff view the way this requires.

The less visible feature is context. When Cursor sends a completion request to its AI backend, it can include the full contents of every open file, the recent edit history, the file tree, and the current test output — because the editor it controls has access to all of that. A Copilot-style extension sees what VS Code's extension API permits: the current file, cursor position, and a limited context window. Cursor sees the workspace.

Copilot++ Tab, the next-edit prediction feature Cursor shipped in 2024, demonstrates the same principle. It doesn't just complete the current line; it predicts the next logical edit in the codebase — which often involves a different file entirely. That cross-file awareness is an editor-level capability, not an extension-level one. The constraint the team chose to honour was completeness of context. The constraint they chose not to honour was fast initial distribution. The bet was that completeness would compound over time in ways distribution speed wouldn't.

<!-- beat: evidence -->
## Evidence

Two years after launching, Cursor reportedly crossed $100M ARR — a figure cited by Bloomberg and corroborated by the terms of their Series A raise in August 2024 [bloomberg-cursor-funding, techcrunch-cursor-60m]. That round, $60M led by a16z, Thrive Capital, and OpenAI Fund, is confirmed [techcrunch-cursor-60m]. The reported valuation in the subsequent Series C round was approximately $2.5 billion, which would make Cursor one of the fastest developer-tools companies to reach that mark [bloomberg-cursor-funding].

The harder-to-fake signal is adoption behavior. Developers, as a population, are among the most resistant category of users to editor switching. They have years of muscle memory, custom configurations, and workflow integration in their current environment. The fact that a meaningful cohort switched from VS Code to Cursor — not just added Cursor as a backup but switched primary editors — is the adoption signal that the fork decision ultimately produced.

What the public record cannot prove: DAU/MAU figures, churn rates, or what fraction of users are on paid tiers versus the free plan. The $100M ARR figure is widely cited but unconfirmed by Cursor directly.

| Metric | Value | Confidence | Source |
|---|---|---|---|
| YC batch | S22 (Summer 2022) | Confirmed | [ycombinator-demo] |
| Series A | $60M | Confirmed | [techcrunch-cursor-60m] |
| Reported ARR (2024) | ~$100M | Plausible | [bloomberg-cursor-funding] |
| Series C valuation | ~$2.5B | Plausible | [bloomberg-cursor-funding] |

![Hatch presenting funding and ARR trajectory for Cursor's growth arc](/images/placeholder.png)

<!-- beat: aftermath -->
## Timeline

1. **July 2022** — Anysphere founded; enters YC S22 batch. Four MIT graduates begin building the forked editor.
2. **January 2023** — Cursor 0.1 launches publicly. First VS Code fork with integrated AI reaches developers.
3. **January 2024** — Copilot++ Tab ships. Next-edit prediction goes beyond single-line autocomplete; requires editor-level context access to work.
4. **August 2024** — $60M Series A closes. a16z, Thrive Capital, and OpenAI Fund lead; reportedly $100M ARR at the time of the raise.
5. **January 2025** — Series C at approximately $2.5B valuation. AI coding tools competition intensifies with GitHub Copilot, Codeium, and Windsurf all raising or expanding.

<!-- beat: lesson -->
## The takeaway

![Hatch in coaching stance with the visual metaphor of a ceiling being lifted](/images/placeholder.png)

> **A platform decision is a ceiling decision — build where you want to live, not where the distribution already is.**
>
> — HackProduct autopsy

There's a version of Cursor that shipped in six weeks as a VS Code extension. It would have gotten early users faster. It would never have shipped Cmd+K. It would never have shipped Copilot++ Tab. It would have competed in the crowded space of AI coding assistants that live inside someone else's editor, fighting for context-window access against every other extension the developer had installed.

The lesson Cursor demonstrates is not "always build from scratch." It's that the platform you choose to build on determines the space of features you can ever make real. When the team forked VS Code, they weren't choosing a slower path to the same destination. They were choosing a fundamentally different destination — one where the editor is the product surface, not a constraint on it. Every product decision downstream of that choice followed from it: what features to build, what to charge, what to pitch to investors, how to explain the product to developers who already had a working editor they liked.

The hardest version of this judgment appears earlier, before you know whether your platform bet will pay off. When Anysphere chose to fork rather than extend, Copilot already existed, already had distribution, and already validated the demand. The obvious move was to do what Copilot did, but better. What they chose instead was to not do what Copilot did — to treat Copilot's model as the ceiling they were trying to exceed, not the template they were going to follow. That clarity about what you're not building, and why, is the thing that makes a platform decision legible in retrospect.

<!-- beat: references -->
## References

1. **Cursor — The AI Code Editor** — Cursor Blog (cursor.sh) [Tier A] — cursor.sh — Product description, VS Code fork basis, feature set including Cmd+K and Copilot++ Tab.
2. **Cursor Demo Day — Anysphere** — Y Combinator [Tier A] — ycombinator.com/companies/anysphere — YC S22 batch, founding team.
3. **Cursor raises $60M to build AI-native code editor** — TechCrunch [Tier B] — techcrunch.com — $60M Series A, August 2024, investors confirmed.
4. **Cursor is winning over developers one AI feature at a time** — The Verge [Tier B] — theverge.com — Developer adoption patterns, VS Code migration.
5. **Anysphere Raises $900 Million as AI Coding Tools Race Heats Up** — Bloomberg [Tier B] — bloomberg.com — Series C valuation context, $100M ARR reference.

<!-- beat: forward -->
## Next in queue

**[Gamma's Presentation Engine](/autopsies/gamma/gamma)** — How a Y Combinator-backed team turned "make slides" into a structured document builder and found the real product hiding inside the obvious one.

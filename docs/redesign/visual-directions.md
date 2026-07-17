# Visual Directions — Four Systems, One Palette

**Companion to:** [`content-organization-audit.md`](./content-organization-audit.md) · **Compare page:** [`previews/index.html`](./previews/index.html) (open locally in a browser)

Every direction preserves the Terra palette (forest green `#4a7c59`, warm cream `#faf6f0`, amber `#c9933a`, taupe secondary) and the Literata + Nunito Sans pairing, and renders the SAME restructured IA (≤8-module dashboard with one Continue CTA, Library with anchor tabs, FLOW as quiet chips). What varies is the system: typography emphasis, density, layout, surfaces, data-viz, and one signature motif each.

These were developed in a brainstorm with Codex (GPT); its critiques are included verbatim where they sharpened a direction. Notably, Codex flagged my original fourth candidate ("Studio Grid") as too close to Editorial Academy and proposed the replacement that became **Systems Lab**.

---

## A — Precision Instrument

**Thesis:** a calm technical cockpit for deliberate product-thinking practice.

| Aspect | Spec |
|---|---|
| Nav | Compact left sidebar (icon + label); top bar only search / streak / avatar |
| Type | Nunito Sans dominant; Literata only for the page title; JetBrains Mono for every numeral |
| Surfaces | 6px radius panels, white/cream cards on cream, 1px taupe borders, no shadows |
| Data-viz | GitHub-style activity heatmap, progress rings, segmented bars, FLOW radar |
| FLOW chips | Tiny uppercase outlined-taupe chips in challenge rows; active = forest green |
| Signature | **Instrumentation rails** — 3px left-edge status bars on cards and table rows |

**Why it works for engineers:** signals utility, rigor, and repeat practice; matches the LeetCode/Educative mental model without copying it. **Vibecoded risk (Codex):** "Tailwind admin template with cream paint" — avoided by the rails motif, mono numerals, and purpose-built data surfaces.

Preview: [`previews/a/`](./previews/a/dashboard.html) · Concept image: `images/direction-a-precision-instrument.png`

## B — Editorial Academy

**Thesis:** product judgment taught through rigorous case studies, not generic lessons.

| Aspect | Spec |
|---|---|
| Nav | Top editorial nav (marketing); top nav + slim secondary rail (app) |
| Type | Literata does the heavy lifting — 48–72px display on marketing, 28–36px in app; Nunito Sans metadata |
| Surfaces | Dark hero-forest panels + cream reading surfaces; 12px radius; hairline rules over borders |
| Data-viz | Editorial infographics — thin line charts, numbered lists, understated completion bars |
| FLOW chips | Small taxonomy labels in article metadata rows |
| Signature | **Case file covers** — autopsies as premium magazine covers with byline · reading time · company tag |

**Why it works:** competitors have problems and videos; HackProduct has teardown *stories*. This makes autopsies feel proprietary and worth paying for. **Risk:** drifting into "premium course landing page" — app surfaces must stay functional.

Preview: [`previews/b/`](./previews/b/dashboard.html) · Concept image: `images/direction-b-editorial-academy.png`

## C — Crafted Field Guide

**Thesis:** a warm, guided practice environment for building product instincts step by step — Brilliant for adults.

| Aspect | Spec |
|---|---|
| Nav | Left sidebar as a curriculum map (Today / Paths / Reference) |
| Type | Literata instructional headings; slightly larger Nunito Sans body (15–16px) |
| Surfaces | Paper-like cream with ~3% grain, thin taupe rules, ≤8px radius, completion stamps |
| Data-viz | Trail markers / stepped plan maps, compact timelines, restrained amber/green tags |
| FLOW chips | Tiny stamped labels, like field annotations |
| Signature | **Margin notes** — slim annotated callouts beside content |

**Why it works:** humanizes hard practice; warmer than LeetCode while still serious; strongest for onboarding and study plans. **Risk (Codex, emphatic):** this is the easiest direction to make vibecoded — mascot + grain + chunky forms tips into children's-workbook. Discipline: exactly one small Hatch presence, no stickers.

Preview: [`previews/c/`](./previews/c/dashboard.html) · Concept image: `images/direction-c-crafted-field-guide.png`

## D — Systems Lab

**Thesis:** HackProduct as an engineering-grade practice lab where interviews, analytics, code, and product judgment converge. The direction that leans hardest into the Claude Code Analytics differentiator.

| Aspect | Spec |
|---|---|
| Nav | Slim top bar + workspace tabs (Briefs / Attempts / Review / Metrics), ⌘K command palette |
| Type | Nunito Sans UI; Literata module titles only; heavy JetBrains Mono — timers, logs, rubrics, micro-labels |
| Surfaces | Split-pane: task surface + right inspector; flat 4px panels, visible dividers; dark forest terminal/log surfaces |
| Data-viz | Event-stream timelines, attempt diffs (+/− rows), rubric delta blocks, mono-labeled sparklines |
| FLOW chips | Small rubric labels embedded in spec/critique rows |
| Signature | **Inspector panel** — every learning object carries a right-side evidence/rubric inspector |

**Why it works:** the most differentiated — no competitor looks like this, and it represents what HackProduct uniquely is (live AI interviews + code + analytics + judgment). **Risk:** density without discipline reads as clutter; the pane system must be strict.

Preview: [`previews/d/`](./previews/d/dashboard.html) · Concept image: `images/direction-d-systems-lab.png`

---

## Recommendation

**Don't pick one global look — pick a system with two modes.** Codex's verdict, which I endorse after building all four: **A (Precision Instrument) is the strongest direction for the logged-in gym**, and **B (Editorial Academy) is the strongest for marketing and autopsy browsing**. They share every token, so a unified Terra design system can carry an A-mode for app surfaces (dashboard, practice, progress, workspaces) and a B-mode for public pages and autopsy reading — one system, two registers, and it finally kills the current app-vs-marketing design-system split by design rather than by accident.

C is worth keeping in the drawer for onboarding/study-plan moments (margin notes and trail markers are genuinely good ideas inside an A-mode app). D's inspector panel should be stolen for the challenge workspace and CC Analytics surfaces regardless of the winner.

**Decision needed:** which direction (or the A+B hybrid) goes to implementation. Implementation will follow the sequencing in the audit doc: nav + redirects → Library → dashboard hero merge, with the design-system consolidation (one token source, one Card primitive, one type ramp) as the first PR.

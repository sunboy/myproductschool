# Redesign Direction Specs — shared brief for preview builders

Source of truth for the 4 visual-direction HTML previews. Every preview uses the SAME Terra tokens and the SAME IA blueprint; directions differ ONLY in typography emphasis, density, layout system, surface treatment, nav pattern, data-viz style, and motion.

## Terra tokens (from `src/app/globals.css` — copy verbatim into each preview's `:root`)

```css
:root {
  --color-primary: #4a7c59;
  --color-on-primary: #ffffff;
  --color-primary-container: #78a886;
  --color-on-primary-container: #d8f0de;
  --color-primary-fixed: #c8e8d0;
  --color-primary-fixed-dim: #8ecf9e;
  --color-secondary: #6b6358;
  --color-secondary-container: #f0e8db;
  --color-on-secondary-container: #5e5548;
  --color-tertiary: #705c30;
  --color-tertiary-container: #c4a66a;
  --color-background: #faf6f0;
  --color-on-background: #2e3230;
  --color-surface: #faf6f0;
  --color-surface-taupe: #e8e2d8;
  --color-surface-dim: #dbd7cf;
  --color-surface-container-lowest: #ffffff;
  --color-surface-container-low: #f5f1ea;
  --color-surface-container: #f0ece4;
  --color-surface-container-high: #eae6de;
  --color-surface-container-highest: #e4e0d8;
  --color-on-surface: #2e3230;
  --color-on-surface-variant: #4a4e4a;
  --color-outline: #74796e;
  --color-outline-variant: #c4c8bc;
  --color-error: #b83230;
  --color-amber: #c9933a;
  --color-amber-soft: #f3e2b9;
  --color-success: #2f7a4a;
  --color-hero-forest: #1e3528;
  --color-hero-forest-deep: #14241c;
  --color-hero-forest-deepest: #0e1a14;
}
```

Fonts (Google Fonts CDN, fine for locally-opened files):
`Literata` (serif, headlines) + `Nunito Sans` (body/UI) + `JetBrains Mono` (numerals/labels where a direction calls for mono).

HARD RULES for every preview:
- No hues outside this token set. No blue, no purple, no neon, no off-palette gradients.
- No lorem ipsum — use the real content below.
- No emoji as icons. Use inline SVG or text glyphs.
- FLOW appears ONLY as tiny uppercase chips `FRAME` `LIST` `OPTIMIZE` `WIN` — outlined taupe (`--color-outline-variant` border, `--color-on-surface-variant` text), active/filled state uses `--color-primary`. Never a hero card, never a gradient, never a logo.
- Self-contained single HTML file per page (inline CSS/JS; only external requests = Google Fonts).
- Desktop-first 1440px design that degrades gracefully to 768 and 375 (flex/grid + media queries).

## IA blueprint (same content skeleton in all four directions)

### `dashboard.html` — "where am I"
1. Nav (pattern varies by direction) with 5 items: Home · Practice · Interviews · Library · Progress (+ avatar with "Review" hint)
2. Hero: greeting ("Good evening, Sandeep"), streak strip (Mon–Sun week dots, "12-day streak"), weakest-move focus line ("This week: sharpen Frame"), ONE primary CTA: **Continue: Reconstruct Delivery Routes from Checkpoint Logs · Coding · Hard**
3. Aside/secondary: FLOW levels compact module (4 rows: Frame Lv3 62%, List Lv4 78%, Optimize Lv2 41%, Win Lv2 38% — rendering style varies by direction), Quick Take card ("2-minute warm-up: Should Figma charge for multiplayer viewers?"), Analytics Lab card ("Claude Code Analytics · Resume session"), merged Interviews card (one row: "Resume loop · Product sense round 2 of 3")
4. Activity module: weekly/monthly activity visualization (style varies: heatmap / editorial infographic / trail map / event stream)
5. NOTHING ELSE. Max 8 modules. Max 8 CTAs.

### `library.html` — "what's next" (Explore renamed Library)
1. Same nav, Library active
2. Compact hero: "Library" + one CTA ("Continue: Product Sense Sprint · Week 2") + sticky anchor tabs: Plans · Guides · Autopsies · Domains · Companies
3. Study Plans (marquee first section): Product-75 pinned as "Program", then "Frame Like a PM", "Optimize Under Pressure", "The List Move" (+ See all)
4. Guides: "The FLOW Framework", "Product Sense Fundamentals", "Metrics & Trade-offs", "The Agentic PM" (+ See all)
5. Autopsies (4 of 102): Figma Multiplayer, Duolingo Streak, Dropbox Referral, Arc Browser Invite (+ See all) — card treatment varies most by direction
6. Domains: Marketplaces, Developer Tools, Consumer Social, Fintech, AI Products, Health (compact rows/chips)
7. Companies chip row: Amazon · Facebook · Google · Stripe · Netflix → filtered practice
8. Quiet bottom tag row: FLOW move chips + skill tags, ending with muted link "New to these tags? How FLOW works →"

### `marketing.html` — homepage hero + one content band
1. Public nav: logo "HackProduct", links (Practice, Autopsies, Pricing), Log in / Get started
2. Hero: headline (voice: direct, confident, Shreyas-in-a-tweet-thread; NO "delve/unlock/master the skills"; something like "Product judgment, trained like a muscle." — builders may sharpen but keep the register), subline mentioning 500+ challenges · 100+ company autopsies · live AI interviews, ONE primary CTA
3. One credibility band: stat trio (500+ challenges, 102 company autopsies, live AI interview loops) + one content showcase row (autopsy covers or challenge spec cards per direction)
4. Footer strip (minimal)

### Real content names (use these; do not invent)
Challenges: "Reconstruct Delivery Routes from Checkpoint Logs" (Hard), "Rebuild Playlist from Shuffle Logs" (Medium), "Warehouse Inventory Reconciliation" (Easy), "Amazon: Top 3 Products per Category" (Advanced), "Design a Real-Time Leaderboard System" (System Design), "Design a Social Graph & Content Feed Schema" (Data Modeling), "Facebook: Advertiser ROI" (SQL), "Optimize Meeting Schedule" (Medium)
Autopsies: Figma Multiplayer, Duolingo Streak, Dropbox Referral, Arc Browser Invite, Airbnb Craigslist Hack, Amazon One-Click, BeReal Two-Minute Window, Calendly Scheduling Link
Study plans: Product-75 (program), Frame Like a PM, Optimize Under Pressure, The List Move, Win the Room

## The 4 directions

### A — Precision Instrument (`previews/a/`)
Thesis: calm technical cockpit for deliberate practice. Mindrift + LeetCode energy.
- Nav: compact LEFT SIDEBAR (icon + label), top bar only search/streak/avatar
- Type: Nunito Sans dominant; Literata ONLY page title; JetBrains Mono for every numeral (scores, streaks, timers)
- Surfaces: 6px radius panels, `--color-surface-container-lowest`/`-low` cards on cream, 1px `--color-outline-variant` borders, NO shadows (or one 1px inset max)
- Data-viz: GitHub-style activity heatmap (5 greens from primary-fixed → hero-forest), progress rings, slim segmented bars, small radar chart for FLOW levels
- Signature motif: "instrumentation rails" — 3px left-edge status bars on cards/rows (green=done, amber=active, taupe=idle)
- Density: high but aligned; 13–14px body, generous line-height

### B — Editorial Academy (`previews/b/`)
Thesis: product judgment taught through rigorous case studies. SkillStream energy.
- Nav: top editorial nav (marketing) / top nav + slim secondary rail (app)
- Type: Literata does the heavy lifting — large display headlines (48–72px marketing, 28–36px app), italic accents; Nunito Sans for metadata/UI
- Surfaces: dark `--color-hero-forest` hero panels + cream reading surfaces; 12px radius; hairline rules instead of borders
- Data-viz: editorial infographics — thin line charts, numbered lists, understated completion bars; no BI-widget look
- Signature motif: "case file covers" — autopsies as premium magazine covers (dark forest or secondary-container fields, big serif title, byline row: author · reading time · company tag)
- Density: generous whitespace, strong hierarchy

### C — Crafted Field Guide (`previews/c/`)
Thesis: warm guided practice environment; Brilliant-for-adults. DISCIPLINED — no stickers, no cute.
- Nav: left sidebar styled as a curriculum map (grouped: Today / Paths / Reference)
- Type: Literata for instructional headings, Nunito Sans body slightly larger (15–16px)
- Surfaces: paper-like cream, subtle grain (CSS noise via SVG feTurbulence at ~3% opacity), thin taupe rules, 8px max radius, completion "stamps" (circled checks)
- Data-viz: trail markers / stepped path for plans, compact timelines, restrained amber/green tags
- Signature motif: "margin notes" — slim annotated callouts in the left/right margin (like a field guide annotation) tied to content
- One small Hatch presence allowed: a single 24–32px simple line-style owl-bot glyph in the hero greeting, nothing else

### D — Systems Lab (`previews/d/`)
Thesis: engineering-grade practice lab; interviews, analytics, code and judgment converge. The CC-Analytics differentiator direction.
- Nav: slim top bar + workspace TABS (Briefs / Attempts / Review / Metrics feel); command-palette search affordance (⌘K)
- Type: Nunito Sans UI; Literata only module titles; HEAVY JetBrains Mono — timers, logs, rubric scores, event labels, uppercase micro-labels
- Surfaces: split-pane layout — main task surface + RIGHT INSPECTOR panel (evidence/rubric/history); flat panels, 4px radius, visible pane dividers (`--color-outline-variant`), dark hero-forest used for terminal/log surfaces
- Data-viz: event-stream timeline, attempt diffs (+/− rows in success/error colors), rubric delta blocks, sparklines with mono axis labels
- Signature motif: "inspector panel" — every learning object shows a right-side inspector with rubric + evidence rows
- Density: highest of the four; engineered, not decorative

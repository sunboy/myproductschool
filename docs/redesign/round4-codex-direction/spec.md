# Round-4 Design Spec — extracted from the 11 approved Codex reference screens

Colors below were pixel-sampled from the refs (`refs/*.png`). Builders: the ref image is the source of truth — match it visually; use these values as the starting palette.

## Palette

### Deep forest (structural — heroes, CTAs, active states)
| Token | Hex | Sampled from |
|---|---|---|
| `forest-950` | `#052316` | CTA buttons (Continue Session), score hero base |
| `forest-900` | `#0b2d1c` | hero bands |
| `forest-850` | `#103020` | hero mid / catalog hero |
| `forest-800` | `#123b20` | sidebar active pill, buttons |
| `forest-700` | `#1d432b` | hero gradient highlight |
| `forest-600` | `#266235` | icon green, success fg |
| `forest-500` | `#1c5a34` | editor syntax green, check icons |
| `mint-glow` | `#a3ebb1` | interview-room glow, waveforms on dark |

Hero bands are subtle diagonal gradients: `#052316 → #123b20` with a faint lighter sweep (`#1e472d`) upper-right; serif headline text `#f9faf5`.

### Page + cards (light screens)
| Token | Hex |
|---|---|
| page field | `#faf8f4` |
| card | `#fffdfa` (near-white; catalog cards `#fcfcfc`) |
| sidebar bg | `#ffffff` (with hairline right border) |
| hairline border | `#ece7dd` (≈ rgba(30,27,20,0.08)) |
| body ink | `#20291f` / secondary `#5b685e` / muted `#a6a9a4` |

### Amber / gold (streak, XP, Pro, warnings)
| Token | Hex |
|---|---|
| flame orange | `#fe9817` (streak flame, Live badge fg) |
| gold | `#fdb41f` (XP bolt, rings, MOST POPULAR) |
| amber-soft | `#fef3e2` (badge/tile bg), `#fce2c2` deeper |

### Discipline accents (tile bg + icon/fg pairs)
| Discipline | soft bg | fg |
|---|---|---|
| System Design | `#e8f4de` | `#266235` |
| Product Sense | `#ebeef8` | `#2778f2` (mid `#738fd7`) |
| Data Modeling | `#f4e9f6` | `#9d61c8` |
| SQL | `#feefdc` | `#fe9817` |
| AI / ML | `#e0f2ec` | `#1c8a5f` (derive; match ref by eye) |
| Behavioral / Interview prep | `#f4e9f6` | `#9671c9` |

### Dark room (interview room only)
room bg `#0c0f13`, panels `#13191c` with `#1f2937`-ish hairlines, center stage vignette to `#020906`, live-green accents `#315234`/`#609958`, danger (End Interview) deep red `#3d1512` bg with `#ffa498` fg.

## Typography
- **Display / headlines: Literata** (Google Fonts). Hero headlines are serif, large (~34–44px), weight 600–700, tight leading. Section titles ~20–24px serif semibold. Feedback page title is serif italic-free.
- **UI / body: Nunito Sans.** Labels 12–13px semibold; body 14–15px; eyebrows uppercase 11px tracked +0.08em.
- Numbers in stat strips: Literata serif bold ~26–30px (84%, 9,860, 428).

## Shape, elevation, spacing
- Cards: radius **14–16px**, hairline border, very soft diffuse shadow (`0 1px 2px rgba(30,27,20,.04), 0 12px 32px -24px rgba(30,27,20,.18)`).
- **Buttons are rounded rectangles (10–12px), NOT pills.** Primary = `forest-950` bg, white text, subtle inner light. Secondary = white bg + hairline.
- Chips/filters/badges ARE pill-shaped (rounded-full), soft tinted bgs.
- Hero bands: radius 16–18px, generous padding (~28–36px).
- Grid gutter ~16–20px; page max-width ~1400px with 24px page padding.

## Shell anatomy (light app screens)
- **Left sidebar ~232px, white:** logo wordmark (serif "HackProduct" + tiny sparkle) + one-line tagline; nav items (icon + 14px label, 10px radius active pill in `forest-800` with white text): Home, Practice, Interviews (+`Live` pill in amber-soft/flame), Study Plans, Progress, Community, Analytics. Lower: **Hatch coach card** (3D head thumb, name + role, waveform strip in mint), **Go Pro card** (crown, blurb, `forest-950` button), Help & Support row at bottom.
- **Top utility bar:** search input pill with ⌘K hint (flex-1, max ~480px); right cluster: 🔥 `24 Day Streak` (flame + bold number + 11px label), ⚡ `9,860 XP · Level 12` (gold bolt), bell, avatar + name + chevron. Hairline bottom border.
- **Workspace screens drop the sidebar**: slim top bar (logo, breadcrumb, streak/XP cluster, avatar), then 3-column work surface.
- **Pro-tip strip:** full-width footer band, cream `#fef3e2`-tinted or plain card, ✨ + "Pro tip" bold + one sentence + right-aligned CTA.

## Signature components
1. **HatchSays bubble** — small dark or light card with 3D Hatch head, "Hatch says 👋" label, 1–2 sentence message, optional CTA button.
2. **Stat strip** — row of 5 equal stat cells: small tinted icon square, label 12px, serif number 26px, delta line (`↑ 12% this week` in green).
3. **Progress ring** — conic ring (gold or green) with center label (3/5, 84%, 68%).
4. **FLOW method card / stepper** — 4 rows or 4 nodes: Frame (green tile), List (blue), Optimize (purple), Win (orange); stepper shows ✓ done in forest, current numbered in forest-800, upcoming grey.
5. **Recommendation card** — discipline tile top-left, category eyebrow in discipline fg, serif-ish 15px title, meta line (difficulty · minutes), match/progress bar, optional `Start now` forest button.
6. **Shelf card** — section title + "View all →"; rows with small logo/mark square, title 13px semibold, meta 11px muted, right-aligned chip or count.
7. **Discipline tabs** — underline tabs with icons (All, System Design, Product Sense, SQL, Data Modeling, AI/ML, Behavioral, More ▾), active = forest underline + semibold.

## Hatch assets (use real files, relative from `docs/redesign/previews/round4/`)
`../../../../public/hatch/avatar.png` (head), `pose-thinking.png`, `pose-reading.png`, `pose-writing.png`, `pose-chart.png`. Use avatar.png for sidebar coach card + HatchSays; pose-* for hero right-sides. Do not draw a robot in SVG; do not use emoji as the mascot.

## Voice
Direct, confident. No em dashes, no AI slop, no "you are a PM" role framing. UI copy from the refs is fine to reuse verbatim where it fits our real content.

---

# Revision 1 corrections (founder feedback on the first 12 previews — BINDING for all future work)

## 1. Heroes: dense or dead
The first previews had oversized dark heroes with empty regions. The Codex dashboard ref works because its hero is PACKED: welcome line, serif headline, Daily Focus block (label, title, description, chips, two CTAs), weekly-goal ring, HatchSays, mascot — all in one band. Rules:
- A dark hero band must be a dense 3-column information surface, not a billboard. Every region carries content; no empty gradient acreage. Max height ≈ 300px at 1440.
- Headline max 2 lines, ~30-34px. Vertical padding 24-28px.
- Dark heroes are allowed on: dashboard, practice catalog, progress, interviews hub, AND the three library hubs (study plans, autopsies, guides) — the final approved previews added compact (≤220px) dense dark heroes with a HatchSays card + mascot to the hubs, and the previews win where this list disagrees (Stage B ruling, 2026-07-11). Detail pages and readers (plan detail, autopsy reader, chapter reader) keep the compact LIGHT page header: serif H1 (~28px) + one-line sub + inline meta chips + optional small CTA, ~90-120px tall, no dark band, no mascot pose in the header.
- "Continue" bands merge INTO the page header row where possible instead of stacking another full-width card below a hero.

## 2. Icon treatment: kill the tinted-square slop
The "icon in a rounded tinted box" pattern, repeated everywhere, reads as generic AI design. Rules:
- DEFAULT: no box. Use a bare stroke icon (16-18px, 1.6-1.8 stroke) in the discipline/fg color next to the text, or a 6-8px colored dot, or nothing — let type hierarchy do the work.
- Stat strips: label + serif number + delta ONLY, hairline separators between cells. No icon tiles.
- Recommendation/featured cards: colored category eyebrow text (+ optional bare 16px icon inline with the eyebrow). No large tile block.
- FLOW method/steppers: small colored dot or bare icon + text. No tile column.
- List rows (plan days, activity, checklists): thin 22px ring/check markers, not heavy filled circles in boxes.
- ALLOWED exceptions: (a) company/brand marks (28px max, muted initial squares — they represent logos), (b) the Hatch mascot images, (c) a single icon tile on a primary page-level object IF the ref screen shows it (match ref size, never larger).
- Icon quantity budget: if a section has more than 3 boxed icons visible, it is wrong.

## 3. User-state rules (pro / non-pro × first-time / returning)

Every screen exists in four states. The previews' default is RETURNING FREE. Rules for the others:

**Pro (returning or new):**
- ALL upsell chrome disappears: no sidebar "Go Pro" card, no top-bar Upgrade pill, no "Unlock Full Potential" pro-tip CTAs (pro-tip strips keep the tip, swap the CTA to a product action).
- A single quiet gold "Pro" chip next to the avatar name is the only plan marker.
- The freed sidebar slot: nothing (whitespace), or the Hatch coach card grows one line. Never a filler card.
- Usage meters hidden until ≥70% of the pro allowance is consumed (12 interviews / 80 challenges per month).

**First-time (day 0, no attempts) — activation is the only job:**
- NEVER render zeros (0-day streak, 0 XP, empty charts) and NEVER blur/lock cards. Absent data = the element is absent or replaced by its invitation state.
- Top bar: hide streak/XP cluster entirely until the first XP event.
- Dashboard hero = FIRST REP: curated challenge (real scenario opener readable in the hero), "Start your first rep" CTA, "about 5 minutes, no setup" subline. No Continue Session, no weekly-goal ring (no week exists yet).
- Stat strip → replaced by a 3-step "first week" row (Do one rep → Meet Hatch's feedback → Pick a plan), first step active.
- Leaderboard/peers/activity modules → one-line quiet invitations ("Your cohort appears after your first rep"), never empty tables.
- Recommended row: easy curated only; no match %, reason line = "picked for your role".
- Progress page day-0: a single centered invitation card (start first rep) + the FLOW method explainer; no empty charts.

**Returning free (default preview state):**
- Upsell = sidebar Go Pro card + top-bar pill only. No inline nags.
- Usage meters are CONTEXTUAL: hidden until ≥70% of a monthly allowance is used (free real numbers: 20 challenges, 5 interviews, 30 AI gradings / rolling 30d), then a quiet hairline meter appears near the relevant CTA ("4 of 5 free interviews used this month · resets in 12 days"). At 100%: the inline cap panel (never an eject, per shipped funnel behavior).
- Pro-only affordances (e.g. Full Loop mode) render enabled-looking with a small gold "Pro" chip; clicking opens the upgrade modal. Never disabled-grey, never blurred.

## 4. Craft rules (anti-slop pass — BINDING; fuses the design-skill principles with docs/notes/writing-style-guide.md)

### Copy is design material (the biggest lever)
Register: Shreyas Doshi / opinionated staff engineer. Direct, specific, calm. The full guide is docs/notes/writing-style-guide.md; these are the UI-copy consequences:
- BANNED: motivational filler ("Great work!", "Keep this momentum going!", "You're building momentum.", "Stay consistent!", "I'm here to guide your practice journey", "Let's do this"), ALL emoji in UI copy (👋 ✨ 🔥 💪 🎉), em dashes, AI-slop words (unlock, ensure, seamlessly, leverage...), streak-guilt or countdown-pressure framing.
- Headlines carry information, not affirmation. Bad: "Ready to build better products through better thinking." Good: "You paused mid-Frame on Tuesday. Twelve minutes finishes the rep."
- Every HatchSays names a SPECIFIC observation from real state and points at one action. Bad: "I'm here to guide you!" Good: "Your List step named three stakeholders and skipped the payer. Fix that before Optimize."
- Buttons say the exact action ("Resume Frame step", "Read the Acquisition stage", "Start Day 2"), toasts confirm it. Section titles are plain nouns ("This week", "Picked for you", "Recent work").
- Kill generic "Pro tip" strips. Either a contextual fact tied to page state ("Your free grading allowance resets July 22") or nothing.
- Numbers are honest and specific ("4 of 5 free interviews used, resets in 12 days").

### Icons: scarce, one voice
- ONE icon set: 18px, 1.7 stroke, consistent corner geometry. Icons appear ONLY as: sidebar nav, state markers (check/ring/dot), and at most 2-3 semantic spots per page. NO decorative icons beside section titles, stat labels, benefit rows, or form fields.
- Ban the glyph clichés: sparkles, rocket, trophy, lightning-in-a-circle, target/bullseye. Streak/XP in the top bar: small quiet marks, text does the work ("12-day streak", "9,860 XP").
- Waveform decorations: only in the live interview room where audio is real. Remove from sidebar Hatch card and all HatchSays.

### Boxes: fewer, in a hierarchy
- Radius hierarchy, applied strictly: page containers 16px, cards 12px, inner elements/controls 8px. Nothing else.
- De-card list content: shelf rows, plan-day rows, activity rows, TOC entries are hairline-separated ROWS inside one container, not nested boxes. If a box sits inside a box inside a box, delete one.
- No accent bars/rails on card edges. No card-in-card where whitespace or a hairline does the job.
- One dark surface per page maximum (the hero on allowed pages, or a single content object like the featured autopsy or War Room).

### Numbers and structure
- tabular-nums on every stat, count, timer. Align digit columns.
- No invented metrics: "NN% match" is replaced by a one-line reason ("Picked because Frame is your weakest move"). Percentiles/badges without backing data do not render.
- Numbered markers only for true sequences (FLOW steps, plan days). Eyebrows only where they encode taxonomy (discipline, content type), never decoration.
- "View all" appears at most once per shelf, phrased identically everywhere.

## 5. Warmth levers (playful AND credible — distilled from refero refs: Duolingo, replit, Say Briefly)

The founder pointed at styles.refero.design "playful design". What transfers to a serious learning gym on Terra, without slop:

1. **The highlighter moment (from Say Briefly: "highlighter yellow as a background wash behind individual words in headlines, not as a button fill").** Exactly ONE serif-headline word per page gets an amber marker wash: `background: linear-gradient(104deg, transparent 2%, #fdb41f38 8%, #fdb41f45 92%, transparent 98%)`, slight negative rotation on the wash box, padding 0 .12em. Pick the word that carries the meaning ("finishes the **rep**", "**Frame** is the gap"). Zero or one per page, never in body text.
2. **The mascot does things (from Duolingo: illustrations "sit right-aligned beside text blocks on white, no containers", never in UI chrome).** Hatch poses overlap an edge (peeking over the hero, leaning on a card corner), sized 120-160px, no container box, no glow. One pose per page maximum. HatchSays keeps only the small avatar head.
3. **Chunky done-states (Duolingo's "sticker pressed onto the page").** Playfulness lives in STATE, not decoration: completed checks are filled forest circles with a thick 2.2px white check; the current-day/current-step marker is visibly chunkier than siblings; streak day-dots are 12px filled rounds, satisfying at a glance. Everything not-yet-done stays quiet hairline.
4. **One pen mark per page (Say Briefly's "gestural marks that feel like a designer's notebook", ~30% opacity).** Optional: a single hand-drawn SVG underline squiggle or circle around ONE number that deserves emphasis (the 84%, the 2/7), forest ink at 25-30% opacity, 1.8px stroke, imperfect path. Zero or one per page. Never on headings that already carry the highlighter.
5. **Color discipline (replit: "color is used sparingly as functional emphasis").** Forest owns actions. Amber owns achievement and the highlighter. Discipline hues exist only as taxonomy dots/eyebrow text. Body text recedes to `#5b685e`. No new hues.
6. **Flat and border-driven (all three refs).** Hairlines carry structure; shadows near-zero on light surfaces (keep at most the dark hero's soft depth). No gradients on light UI, no glass.
7. **Motion (Stage B note, previews stay static):** check-pop on completion (footnote: scale 0.9→1.05→1, 180ms), 1px hover lift on rows, ring fills animate once on load. Respect prefers-reduced-motion. No ambient/looping motion.

## 6. Density + font roles (founder correction on plan-detail/feedback — BINDING)

### Moderately dense, tight
The previews breathe too much. Target register: LeetCode/Linear density with Terra warmth. Concrete scale (replaces earlier spacing where larger):
- Card padding: 16-20px (was 24-32). Hero band padding: 20-24px vertical.
- Section gaps (between stacked blocks): 20-24px (was 32-48). Grid gutters: 12-16px.
- List rows: 10-12px vertical padding, 40-48px total height. Hairline-separated rows sit flush (no gap between rows).
- Page top padding: 20-24px. Page bottom: 48px max.
- Right rails: panels 16px padding, 12px between panels.
- Headlines: hero serif 28-32px (was 34-40); section titles 17-18px; the reading columns (autopsy/chapter reader) KEEP their generous rhythm — reading pages are exempt from row-density rules but not from font-role rules.
- Nothing may feel cramped: minimum 8px between interactive targets; line-height stays ≥1.4 for body.

### Font roles = the app's real pattern (families were never wrong; roles were)
- **Literata (serif) ONLY for:** page/hero H1 display lines, the one-per-page section-opening serif moment if the ref shows it, and large stat numerals (26px+). Reading-page BODY prose (autopsy/chapter readers) stays Literata — reading is its role.
- **Nunito Sans for EVERYTHING else:** card titles, row titles (plan days, shelf items, challenge names), section headings 18px and below, buttons, chips, labels, rail panel titles. Weights: 700-800 for titles, 600 for meta.
- If a component-level title is currently serif, switch it to Nunito Sans 700. This matches the shipped app (font-headline = page titles only).

## 7. Say Briefly mode — color play + liveliness (founder-directed amplification of §5)

Reference: styles.refero.design Say Briefly ("creative agency sketchbook"). Their rules, translated to Terra. The page stays ~90% cream + forest; the other 10% now plays with confident COLOR FILLS instead of white boxes.

### Sticky-note surfaces (the color play)
Replace white-card chrome with flat tinted FILLS + 1px ink-toned borders (never shadows) for the "aside" content class: HatchSays/coach notes, callouts, tips, "why" cards, evidence quotes, the current-day/current-step card, and one rail panel per page. Palette (Terra-tuned sticky notes):
- Mint note `#dff3d0` (border `#b9d9a6`) — coach/positive asides
- Amber note `#fdf0c2` (border `#ecd48a`) — tips, warnings, the highlighter's family
- Teal note `#d9efec` (border `#a9d4cf`) — info/meta asides
- Blush note `#f6e3f3` (border `#dcbcd6`) — growth areas / review asides
Rules: max 2-3 tinted surfaces per page, different tints only when they encode different content classes (mint=coach, amber=tip, teal=info, blush=review). ONE tinted surface per page may rotate -0.6deg to -1deg (display:inline-block/transform) for the pinned-note feel. No tape, no pins, no skeuomorphic props.

### Highlighter, vivid
Upgrade §5.1: the wash is a confident solid `#ffe95c` (true highlighter yellow) behind the word, full opacity, slight rotation, padding 0 .14em — not a timid tint. Still exactly ONE word per page, serif display lines only.

### Ink is alive (loosened from §5.4)
1-3 hand-drawn forest-ink gestures per page at 25-30% opacity, stroke 1.8: circle around one number, underline squiggle under one stat, a small arrow pointing INTO the primary CTA from adjacent whitespace, corner doodle in genuinely empty rail space. Marks must point at meaning (the number that matters, the action to take), never scattered as texture. Reading columns stay clean (marks allowed in their rails only).

### Sticker chunk
Chips/badges upgrade to 1.5px borders in their fg color ("sticker pressed on the page"). Primary CTA may take a 1px ink border on top of forest fill. Layer separation everywhere = fills + 1px borders, not shadows (kill remaining card shadows on light surfaces; the dark hero may keep one soft depth shadow).

### What does NOT change
Fonts (§6 roles), density (§6 scale), copy (§4), honesty rules, one-dark-surface-per-page, Terra forest/cream base, no emoji. Liveliness comes from fills, marks, and one rotation — not from new hues beyond the sticky palette above, not from motion.

## 8. Letter-marks are banned; editorial brand treatment (founder callout on autopsies-hub)

The "initial of the thing in a colored square" pattern is classic placeholder slop. The §4 exception for company marks is REVOKED. Nothing anywhere renders a letter-in-a-box as an icon.

**ALSO BANNED (founder): left/edge color borders ("spines") on any box, card, or row — anywhere, ever.** The accent-bar-on-card pattern is the same slop family as letter-marks. This supersedes anything above that suggested spines.

Replacement, in order of preference:
1. **Brand-colored text label**: the company name set small (11-12px, 700) in its REAL brand accent (autopsy_companies.accent: Netflix #e50914, Airbnb #ff5a5f, Amazon #ff9900, Dropbox #0061ff; unset → default ink) as the row's leading label. Color lives in TYPE, never in borders or bars.
2. **Nothing**: strong title typography + quiet muted meta. An editorial article list needs no mark at all.

Avatar circles for PEOPLE (leaderboard initials) remain acceptable — that is a standard avatar convention, not placeholder iconography.

### Weight discipline (the "font weight" slop)
Per section: max TWO weights (700 titles, 400-600 everything else). Tracked-uppercase eyebrows are rationed like the highlighter: only where they encode taxonomy, never as a default row dressing. Meta lines are 400/500, muted, sentence case.

## 9. Icon quality + placement (founder directive, ref image 12 = the practice-catalog Codex ref)

The problem was never tiles vs no tiles — it was crude, hand-invented glyphs and icons stacked on their own line. The ref's icon language is the contract:

1. **Canonical set only.** Every icon comes verbatim from `icons.html` (Lucide, stroke 1.8, viewBox 24). Hand-drawn substitute paths are banned. The kit maps every role: nav, top bar, disciplines, actions, state.
2. **Inline, always.** Icon sits on the SAME line as its text, inline-left (flex, align-items:center, gap 6-8px), sized 16-18px against 13-14px text. Never stacked above text, never floating alone as decoration.
3. **Discipline tiles are BACK — done like the ref, exactly one place.** Featured/recommendation cards get the 44px rounded-square tile (10px radius, discipline tint bg, 1px tint-border, 22px fg glyph) top-left, per the approved Codex ref. Tiles appear NOWHERE else (shelf rows, rails, stats stay tile-free per §4/§8).
4. **Tabs and nav** get their small inline glyph left of the label like the ref (All / System Design / Product Sense / SQL / Data Modeling / AI-ML / Behavioral; sidebar items).
5. Stat chips in dark heroes: small gold inline glyph + text, one line, like the ref's Weekly Goal / XP This Week / Focus chips.
6. §5.2 exception list (Hatch images, avatar circles for people) unchanged. Flame/zap in the top bar render from the kit in their gold colors.

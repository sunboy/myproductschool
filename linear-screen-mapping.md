# Linear Issues → Stitch Screen Mapping
## MyProductSchool — Material 3 + Terra Design Language

---

## Screen Inventory Summary

| File | Description | Mode |
|---|---|---|
| `material-review-mode.html` | Two-pane review: left case context, right Luma analysis with numbered accordion steps | Light |
| `13-post-submission-review-a.html` | Dark-mode post-submission: left case pane, right docked Luma side panel, score + step accordion | Dark |
| `14-post-submission-review-b.html` | Same layout as 13-a, light mode version with proper Terra tokens | Light |
| `15-review-modal-overlay.html` | Blurred background review + immersive full-screen modal with challenge context sidebar | Light |
| `16-review-side-drawer.html` | Left sticky drawer (case context), right wide review column, Bento score card, step-by-step list | Light |
| `17-review-data-rich.html` | Same as 16 plus Luma's Take annotation card, inline critique pins on scenario text, trend sparklines, and growth toggle | Light |
| `10-challenge-discussions-b.html` | Admin-style data table (Comment Analysis Grid): sortable columns, pin/expert-pick rows, full-screen compose overlay | Light |
| `11-challenge-discussions-c.html` | Conversation stream: threaded chat bubbles, sticky compose bar, right-panel Community Insights drawer | Light |
| `12-challenge-discussions-d.html` | Dashboard screen: Luma right side-panel, ProductIQ radar chart, domain cards, streak, today's focus tasks | Dark nav / Light body |

---

## AI ENGINE (Luma)

---

### SUN-49 · AI-01 — Luma core system prompt + scoring rubric

**Primary screens:** `material-review-mode.html`, `13-post-submission-review-a.html`, `14-post-submission-review-b.html`

**Relevant sections/components:**
- "Luma's Analysis" score card (material-review-mode): overall numeric score (88/100), metric progress bars (Structural Viability 92%, Ecological Impact 85%, Cost Efficiency 76%)
- "Score Summary" card (screens 13-a, 14-b): composite score (84/100) with dimension labels — Structure (Great), User Focus (Good), Prioritization (Needs Work), Product Vision (Exceptional)
- Tertiary-tinted "REQUIRES REVIEW" accordion state (material-review-mode step 03) communicates rubric failure states

**M3 + Terra components:**
- `Surface Container` card with top `border-t-4 border-primary` accent for score container
- M3 Linear Progress Indicators (h-1.5/h-2 filled bars) in `primary` and `tertiary` for pass/caution states
- `Chip` (pill badges) for dimension labels with semantic color mapping: `primary` = pass, `tertiary` = caution, `error` = fail

**Design notes / gaps:**
- The rubric dimensions shown (Structure, User Focus, Prioritization, Product Vision) are placeholders; the real scoring rubric dimensions from the system prompt must be wired to these bars
- No screen yet shows the rubric in editable or versioned form — admin screens (SUN-75) will need a rubric editor
- Luma is currently labeled with `smart_toy` icon; update to Luma's abstract geometric identity per CLAUDE.md

---

### SUN-50 · AI-02 — Context injection (scaffold, hints, prior performance, calibration)

**Primary screens:** `17-review-data-rich.html`, `16-review-side-drawer.html`, `12-challenge-discussions-d.html`

**Relevant sections/components:**
- Left sticky `#side-drawer` (screens 16, 17): "Scenario Text" section with scenario prose, "Framework Parameters" progress bars, "Core Metrics" (Complexity, Priority) — these surface the injected challenge context
- Inline critique pins on scenario text (screen 17): numbered `critique-pin` badges (`01`, `02`, `03`) overlaid on key phrases — visual representation of how prior performance data annotates the scenario
- "Luma's Take" annotation card (screen 17): `bg-primary/5` callout quoting Luma's context-aware evaluation preamble
- ProductIQ radar chart (screen 12): `Execution`, `Product Sense`, `Strategy`, `Leadership`, `Analytical` axes — the prior-performance calibration surface
- "Faster than 68% of peers" benchmark stat (screens 13-a, 14-b): peer calibration output

**M3 + Terra components:**
- M3 Navigation Drawer (left, `w-[30%]`, sticky, collapsible via `chevron_left` button) for context scaffold
- `Surface Container Low` background for drawer interior
- Filled `psychology` / `auto_awesome` Material Symbols for Luma callout card
- SVG polygon radar chart with `stroke-outline-variant/40` grid and `fill-primary/20 stroke-primary` data shape

**Design notes / gaps:**
- The "Original Case / Expert Benchmark" toggle in screen 17 implies a comparison mode — this is a key UX for calibration but has no backend spec yet; should be part of AI-02 scope
- Hints panel is referenced in the Luma side nav (screens 13-a, 14-b) but no hints-expanded state is designed — a screen for the hints flow is missing from the Stitch set

---

### SUN-51 · AI-03 — Feedback generation pipeline

**Primary screens:** `13-post-submission-review-a.html`, `14-post-submission-review-b.html`, `material-review-mode.html`

**Relevant sections/components:**
- "Step-by-Step Breakdown" accordion section (right pane, screens 13-a and 14-b): per-step structure showing "Your Draft" blockquote, "What Worked" (primary-tinted chip + bullet list), "Missing Pieces" (error-tinted chip + bullet list), and "Redo this step" secondary action button
- Accordion items with numbered circle badges (01–03: Clarify & Goal, Identify Users, Pain Points) — these map directly to the feedback pipeline's framework steps
- Luma suggestion callout in material-review-mode (tertiary `lightbulb` block inside step 03): inline suggestion text from Luma
- "Expert Notes" count badge and expandable step items in screens 16 & 17

**M3 + Terra components:**
- M3 Expansion Panel / Accordion: active state uses `ring-1 ring-primary/30` + `bg-surface-container-low` header; inactive uses `opacity-70`
- Positive block: `bg-primary/5 border border-primary/20` with filled `check_circle`
- Negative block: `bg-error/5 border border-error/20` with filled `error` icon
- `Tonal Button` (outlined, full-width) for "Redo this step" CTA

**Design notes / gaps:**
- The per-step feedback items (What Worked / Missing Pieces) are the primary rendered output of the feedback pipeline — their data shape (array of positives + array of gaps per framework step) must match the API response schema
- The "Redo this step" action implies a partial re-submission flow — no screen for this exists yet; gap to be addressed in a future screen or modal
- Luma attribution is shown as a text label only; consider adding the Luma geometric identity mark

---

### SUN-52 · AI-04 — Progress summary generation + clarifying question handler

**Primary screens:** `12-challenge-discussions-d.html`, `16-review-side-drawer.html`, `17-review-data-rich.html`

**Relevant sections/components:**
- "Next Learning Milestones" CTA card (screens 16 & 17): dark `bg-emerald-900` card with `psychology` icon watermark, AI-generated recommendation text, and "Unlock Advanced Module" action — this is the progress summary output surface
- ProductIQ score + Luma quote (screen 12): `"Your Execution score improved by 12% this week. Focus on Strategy to unlock Executive roles."` — the progress summary narrative
- Contextual morning greeting (screen 12): `"Luma suggests focusing on User Centricity today to hit your weekly goal."` — daily progress-driven nudge
- "Confidence Score" stat tile (screens 13-a, 14-b): self-reported confidence capture during drafting is input data for clarifying question calibration

**M3 + Terra components:**
- `Surface Container Highest` card for ProductIQ section
- Dark promotional card pattern (`bg-emerald-900`, `rounded-[2rem]`, watermark icon at `opacity-20`) for milestone CTA
- `tertiary` quote block (`bg-tertiary/10 border border-tertiary/20`) for Luma narrative quotes
- M3 Chip / badge for skill tags (`px-3 py-1 bg-primary/10 rounded-full`)

**Design notes / gaps:**
- The clarifying question handler has no dedicated screen — it likely surfaces inline in the challenge workspace before submission (a pre-existing screen not in this batch)
- Progress summary generation output should populate the "Next Learning Milestones" card dynamically; ensure API payload aligns with card's text + CTA URL format

---

### SUN-53 · AI-05 — Interview simulation engine

**Primary screens:** No screen — this mode is referenced in the Luma side-nav ("Interview Prep" nav link appears across all screens) but no simulation UI is in this Stitch batch

**Design notes / gaps:**
- The top nav across all screens has an "Interview Prep" link marked active in some variants; a dedicated interview simulation screen is a gap in the current Stitch set
- The side drawer pattern from screens 16/17 (sticky left context, scrollable right response area) is the closest layout candidate for an interview mode — left pane = question/scenario, right pane = user's live response with Luma commentary
- Consider a "turn-by-turn" chat variant using the conversation stream pattern from `11-challenge-discussions-c.html` as a layout reference for the simulation turns

---

### SUN-87 · AI-06 — Luma mode-aware evaluation preambles

**Primary screens:** `17-review-data-rich.html`, `13-post-submission-review-a.html`

**Relevant sections/components:**
- "Luma's Take" card (screen 17, left drawer): `bg-primary/5 border border-primary/20` card with `psychology` icon, small "LUMA'S TAKE" eyebrow label, and italic first-person quote — this is the rendered preamble surface
- "Post-Submission Review" mode badge (screens 13-a, 14-b): `bg-tertiary/10 text-tertiary` pill with `history_edu` icon identifies the evaluation mode context
- "AI-Assisted Evaluation" subtitle under "Luma's Analysis" (material-review-mode): mode label for the review context

**M3 + Terra components:**
- Eyebrow label pattern: `text-[10px] font-bold uppercase tracking-widest text-primary block mb-1`
- Filled `psychology` or `auto_awesome` icon in `w-10 h-10 rounded-full bg-primary` container for Luma presence indicator
- Mode pills: `inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tertiary/10 text-tertiary text-xs font-bold uppercase`

**Design notes / gaps:**
- Each evaluation mode (Practice / Interview Prep / Workshop) should produce a distinct preamble variant — only the "Post-Submission Review" mode is visually designed; Workshop and Interview modes need analogous preamble cards
- The `history_edu` icon works for review mode; use `psychology` for interview simulation and `school` or `groups` for workshop mode

---

### SUN-88 · AI-07 — Workshop nudge endpoint + Live conversation turn endpoint

**Primary screens:** `11-challenge-discussions-c.html`, `12-challenge-discussions-d.html`

**Relevant sections/components:**
- Sticky bottom compose bar (screen 11): `bg-white rounded-2xl shadow-xl border border-primary/20` with inline text input, send button, and media attachment icons — the live conversation input surface
- Luma right sidebar in screen 12: "Ask Luma" primary button (`bg-primary text-on-primary`) initiates a live conversation turn
- Contextual morning nudge (screen 12 header): `"Luma suggests focusing on User Centricity today"` — the rendered workshop nudge output
- Community Insights right drawer (screen 11): surfaced via `analytics` icon toggle — a pull model for async nudges

**M3 + Terra components:**
- M3 FAB (screen 10): `w-14 h-14 bg-primary text-on-primary rounded-full` — large compose action trigger
- Bottom sheet compose input: `rounded-2xl` card floating above scroll content with gradient fade (`bg-gradient-to-t from-[#faf6f0]`)
- M3 Navigation Drawer (right-docked, `w-80`, `translate-x-full` default, slides in on toggle) for the Luma conversation panel

**Design notes / gaps:**
- The live conversation turn endpoint (real-time streaming response) needs a loading/typing indicator state — no such state exists in the current screens; add a `typing_indicator` bubble pattern inside the conversation stream (screen 11 pattern)
- Workshop nudge is shown as static text in screen 12; for push delivery it would surface as an M3 Snackbar or Banner at the top of the challenge page — no snackbar component is designed in this batch

---

## PAYMENTS & ENTITLEMENTS

---

### SUN-69 · PAY-01 — Stripe setup

**Primary screens:** No screen — backend/infra only

**Design notes:** No UI component. Stripe publishable key config, webhook secret config, and price ID management are backend concerns. Nearest UI surface is the upgrade prompt (SUN-72).

---

### SUN-70 · PAY-02 — Checkout flow, success page, customer portal

**Primary screens:** No dedicated screen in this batch

**Design notes / gaps:**
- The "Unlock Advanced Module" CTA button in the "Next Learning Milestones" card (screens 16, 17) is the entry point to checkout — it should navigate to a Stripe Checkout session
- The `workspace_premium` icon in side nav items across multiple screens signals the paid/pro tier
- A dedicated checkout/success page screen is a gap; use the modal overlay pattern from `15-review-modal-overlay.html` (blurred background + centered modal) as the layout reference for the success confirmation state
- M3 component: `Filled Button` (`bg-primary text-on-primary`) for primary checkout CTA; M3 Dialog for success confirmation

---

### SUN-71 · PAY-03 — Stripe webhook handler

**Primary screens:** No screen — backend/infra only

**Design notes:** No UI. Webhook events (checkout.session.completed, invoice.payment_failed) update the entitlement state stored in Supabase, which the frontend reads to gate features.

---

### SUN-72 · PAY-04 — Entitlement enforcement, upgrade prompts, refund flow

**Primary screens:** `12-challenge-discussions-d.html` (domain cards), `16-review-side-drawer.html` / `17-review-data-rich.html` (milestone CTA)

**Relevant sections/components:**
- "Unlock Advanced Module" button (screens 16, 17): `bg-background text-emerald-900 rounded-full` — the gated content unlock CTA pattern; behind a paywall this should switch to an upgrade prompt
- Domain cards (screen 12, "Recently Unlocked"): cards with `workspace_premium` icon in sidenav suggest a locked/unlocked state distinction; locked domain cards should render with a `lock` overlay and an upgrade chip
- `+12` peer count badge on domain cards uses the `primary-fixed` container — locked state could use `surface-container-highest` + `lock` icon instead

**M3 + Terra components:**
- `pro-gold` color token (defined in project CLAUDE.md as `--pro-gold`: Amber) for pro/paid feature indicators — not yet used in Stitch screens; should be applied to locked state badges and the upgrade CTA
- `Tonal Button` in `tertiary` for upgrade prompt to distinguish from primary actions
- M3 Banner component (top of page) for expired subscription notice — not in current screens, needs design

**Design notes / gaps:**
- No locked-state variant of domain cards or challenge cards is designed — a locked card pattern with `pro-gold` badge and `lock` icon is needed
- No upgrade modal or paywall screen exists in this batch; design gap

---

### SUN-73 · PAY-05 — Email automation sequences

**Primary screens:** No screen — backend/infra only

**Design notes:** Email sequences (welcome, trial expiry, re-engagement) are triggered by Supabase + Stripe webhook events. No in-app UI is required beyond the notification bell (`notifications` icon in TopAppBar) that could surface in-app echoes of these emails.

---

## ADMIN FRONTEND

---

### SUN-74 · ADM-01 — Admin auth, route protection, KPI dashboard

**Primary screens:** No dedicated admin screen in this batch

**Relevant sections/components:**
- The Comment Analysis Grid in `10-challenge-discussions-b.html` (table with columns: User, Role, Preview, Votes, Posted; sortable headers; export CSV button) is the closest design language reference for the admin KPI dashboard table layout
- "Live Insights" sidebar widget (screen 10): Total Comments 1,248 / Active Users 43 / Expert Picks 04 — a direct analog for KPI summary cards

**M3 + Terra components:**
- M3 Data Table pattern: `thead` with `surface-container-highest` background, `sticky top-0`, `text-[10px] font-black uppercase tracking-widest` column headers
- Summary stat chips in sidebar using `surface-container rounded-xl border border-outline-variant/30`
- `Filled Button` for "Export CSV" (admin data export pattern)

**Design notes / gaps:**
- An admin-specific layout (different nav, role badge, protected route indicator) is not designed — the admin frontend will need a distinct shell from the learner-facing app; use the same M3 top app bar pattern but with an "Admin" role chip
- KPI dashboard metrics (MAU, submission rate, Luma queue depth, revenue) need a dedicated admin screen design

---

### SUN-75 · ADM-02 — Content management: challenge CRUD

**Primary screens:** `15-review-modal-overlay.html` (challenge context sidebar layout), `10-challenge-discussions-b.html` (table layout)

**Relevant sections/components:**
- Challenge context sidebar in screen 15: left `bg-primary` panel with challenge metadata (Domain, Difficulty, scenario description, data table) — this is the richest display of a challenge's structured content and maps to the challenge edit form's field set
- Data table in screen 10: challenge list in admin context should follow the same sortable table pattern with Edit/Delete row actions

**M3 + Terra components:**
- M3 Modal / Dialog for challenge create/edit form (blurred backdrop from screen 15: `bg-stone-900/60 backdrop-blur-md`)
- Two-column modal layout: `w-1/3 bg-primary` sidebar (visual/metadata), `flex-1 bg-surface-container-low` form area
- `Filled Button` for save; `Outlined Button` for cancel; `Text Button` with `error` color for delete

**Design notes / gaps:**
- No challenge edit form screen exists — fields visible in the modal sidebar (domain tag, difficulty chip, scenario text, data table) define the required form fields
- Rich text editor for scenario content is implied but not designed; the full-screen compose overlay in screen 10 (`#full-screen-editor`) with its formatting toolbar (bold, italic, link, list, code) is a usable reference pattern

---

### SUN-76 · ADM-03 — User management

**Primary screens:** `10-challenge-discussions-b.html` (table pattern)

**Relevant sections/components:**
- Comment Analysis Grid table: User column (avatar + name), Role column (role badge), sortable Votes and Posted columns — directly reusable as a User Management table (substitute: email, plan tier, join date, submission count)
- Role badge pattern: `text-[10px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded` for "Senior PM @ Google" — adapt for plan tier display (Free / Pro)
- Pin/star column (leftmost) maps to an "Admin flag" or "Suspend" toggle column

**M3 + Terra components:**
- M3 Data Table with sticky header
- M3 Badge / Chip for plan tier with `pro-gold` token for Pro tier
- Row hover state: `hover:bg-surface-container-low`

**Design notes / gaps:**
- No user detail panel or edit drawer is designed; the right-docked side drawer pattern (screen 16/17 left drawer concept, applied on the right) would work for a user detail panel
- No bulk action pattern (select all, suspend batch) is designed

---

### SUN-77 · ADM-04 — Luma quality review queue + waitlist management

**Primary screens:** `material-review-mode.html` (review workflow with approve/reject), `10-challenge-discussions-b.html` (table)

**Relevant sections/components:**
- "Approve Submission" / "Request Revision" dual CTA buttons (material-review-mode, bottom of right pane): `bg-primary` filled + `bg-surface-container border-outline` outlined — this is the exact pattern for the Luma quality review queue action row; an admin reviewer sees a Luma-generated feedback draft and either approves it or requests regen
- Numbered accordion steps with PASSED / REQUIRES REVIEW status labels (material-review-mode): the quality review queue shows Luma's output per step and flags items needing human review
- Expert "verified" pin in screen 10 table (`material-symbols-outlined text-tertiary verified` icon) — maps to the "Approved" state in the queue

**M3 + Terra components:**
- Dual-pane layout (5/7 col split, material-review-mode) for review queue: left = Luma's draft output, right = admin actions
- Status chips: `text-xs text-primary font-bold` for PASSED, `text-xs text-tertiary font-bold` for REQUIRES REVIEW
- `Filled Button` (Approve) + `Outlined Button` (Request Revision) action row

**Design notes / gaps:**
- The "Approve Submission" / "Request Revision" buttons in material-review-mode are currently user-facing; for the admin queue, these should be re-labeled "Approve Feedback" / "Regenerate" and placed in an admin-only view
- Waitlist management table is a gap; use the same data table pattern from screen 10 with columns: Email, Join Date, Referral Source, Status (Invited / Pending)

---

### SUN-78 · ADM-05 — Revenue dashboard

**Primary screens:** No dedicated screen — references `10-challenge-discussions-b.html` sidebar stats pattern

**Relevant sections/components:**
- "Live Insights" sidebar widget (screen 10): stat rows with `text-sm font-black text-primary` values — the same pattern scaled up for MRR, ARR, active subscriptions, churn rate

**M3 + Terra components:**
- Bento grid stat cards (2-col grid, `bg-surface-container rounded-xl border border-outline-variant/30`) for revenue KPI tiles
- Time-series sparkline bars (screen 17, trend sparklines in step items: `flex items-end gap-0.5 h-4` bar chart) — reuse for MRR trend

**Design notes / gaps:**
- Revenue dashboard is a full design gap; no screen exists; recommend designing a 4-KPI bento header (MRR, ARR, Active Subs, Churn) + monthly chart + subscription plan breakdown table

---

## POLISH, PERFORMANCE & LAUNCH

---

### SUN-79 · POL-01 — Design system (typography, colors, spacing, dark mode, Luma visual identity)

**Primary screens:** All 9 screens (the Tailwind config in every file IS the design system)

**Relevant sections/components:**
- Tailwind `extend.colors` block (identical across all screens): full M3 Terra token set — `primary #4a7c59`, `secondary #6b6358`, `tertiary #705c30`, full surface scale, semantic colors
- `fontFamily`: `headline: [Literata]` (serif display), `body/label: [Nunito Sans]` (sans-serif body)
- `borderRadius`: `DEFAULT 0.5rem`, `lg 1rem`, `xl 1.5rem`, `full 9999px`
- Dark mode: `darkMode: "class"` — screens 13-a and 12 demonstrate dark variants; 14-b demonstrates light equivalent
- Luma visual identity: currently `smart_toy` Material Symbol; CLAUDE.md specifies abstract geometric glow symbol (diamond + concentric rings) — this is a design gap in every screen

**M3 + Terra components:**
- All M3 color roles present and mapped to Terra palette
- Typography scale: `text-4xl md:text-5xl font-bold` for h1, `text-2xl font-bold` for h2, `text-lg font-bold` for h3, `text-sm` body
- `material-symbols-outlined` with `font-variation-settings: 'FILL' 0, 'wght' 400` as base; filled variant via inline `'FILL' 1` for selected/active states

**Design notes / gaps:**
- The `--pro-gold` amber token defined in CLAUDE.md is absent from all Stitch screens; it needs to be added to the Tailwind config as `pro-gold` for paid feature indicators
- Luma visual identity (geometric glow symbol) is not in any Stitch screen; a Luma SVG asset needs to be created and substituted for `smart_toy` in all Luma presence surfaces
- Dark mode token overrides for `surface`, `background`, `on-surface` etc. are not consistently applied — screens 13-a (dark) uses raw `stone-900/stone-950` instead of M3 dark role tokens; this should be unified

---

### SUN-80 · POL-02 — Micro-interactions and animations

**Primary screens:** `16-review-side-drawer.html`, `17-review-data-rich.html`, `11-challenge-discussions-c.html`

**Relevant sections/components:**
- Drawer collapse: `transition-all duration-300` on `#side-drawer` `aside` elements (screens 16, 17)
- Hover states on step items: `hover:border-primary/30 transition-all group` + `group-hover:bg-primary-container/20` on step number badge (screens 16, 17)
- Send button: `hover:scale-105 transition-transform` (screen 11 compose bar)
- "Read Full Insight" button: `group-hover:translate-x-1 transition-transform` (screen 11 pinned comment)
- FAB: `hover:scale-110 active:scale-95 transition-all` (screen 10)
- Accordion expand: `expand_more` / `expand_less` icon swap (all review screens)
- Active button press: `active:scale-[0.99]` / `active:scale-95` pattern throughout

**M3 + Terra components:**
- M3 state layer system: hover (`bg-primary/5` to `bg-primary/10`), pressed (`active:scale-[0.98]`), focused (ring)
- CLAUDE.md defines `animate-fade-in-up` and `animate-luma-glow` — these should be applied to: feedback accordion items on first render (fade-in-up stagger), Luma's Take card (luma-glow pulse), score number on mount (count-up)

**Design notes / gaps:**
- Progress bar fill animations (score bars animating to their percentage on mount) are not specified but are standard for review screens; add `transition-all duration-700 ease-out` to bar fills with a slight stagger
- Critique pins (screen 17) have `transition: all 0.2s` but no hover tooltip animation — a tooltip reveal on hover is implied and should be designed
- `prefers-reduced-motion` respecting wrappers are required per CLAUDE.md for all custom animations

---

### SUN-81 · POL-03 — Accessibility (WCAG 2.1 AA)

**Primary screens:** All 9 screens

**Relevant sections/components:**
- Sortable table headers (screen 10): `cursor-pointer hover:bg-stone-200` but no `scope="col"` or `aria-sort` attributes — gap
- Accordion items: `cursor-pointer` divs without `role="button"`, `aria-expanded`, or `aria-controls` — gap across all review screens
- Right drawer (screen 11 `#stats-panel`): controlled by a hidden `<input type="checkbox">` + `<label>` hack — this pattern has poor screen reader support; needs to be replaced with a proper `<dialog>` or `role="complementary"` with `aria-hidden` toggle
- Compose textarea (screen 11): has `placeholder` but no associated `<label>` — gap
- Score numeric values (84/100, 88/100): conveyed visually and as text — OK
- Color-only status communication: "Needs Work" is shown only in `text-tertiary` with no icon — needs an accompanying icon or text label for color-blind users (partially addressed by some screens using icons alongside color)

**M3 + Terra components:**
- M3 specifies `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax` for progress indicators — must be applied to all score bars
- Focus-visible ring: `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2` required on all interactive elements
- Dialog/Modal (screen 15): needs `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, focus trap on open

**Design notes / gaps:**
- `min-contrast` check: `text-on-surface-variant #4a4e4a` on `bg-surface-container #f0ece4` passes AA (5.1:1) — OK; verify all body text combinations in implementation
- Mobile bottom nav (material-review-mode) needs `aria-current="page"` on active item

---

### SUN-82 · POL-04 — Performance (Lighthouse ≥ 90)

**Primary screens:** No screen — implementation concern

**Design notes:**
- All screens load fonts via Google Fonts CDN with `display=swap` — correct, but production should use `next/font` with `font-display: swap`
- Stitch screens use `https://cdn.tailwindcss.com` play CDN — must be replaced with Tailwind CSS v4 build pipeline in production
- Images: all screens use Google `lh3.googleusercontent.com` hosted images — production must use `next/image` with explicit `width`/`height` and appropriate `sizes`
- The `material-symbols-outlined` font is loaded twice in several screens (duplicate `<link>` tags) — remove duplicate in production
- The right-docked Luma side panel (screens 13-a, 14-b) uses `fixed` positioning with `w-80` — ensure it does not cause layout shift (CLS) by reserving space in the initial layout

---

### SUN-83 · POL-05 — Analytics PostHog event taxonomy

**Primary screens:** No screen — implementation concern

**Design notes / gaps:**
- Key interaction points visible in screens that need PostHog events:
  - `review_step_expanded` (accordion open, screens 13–14, material-review-mode)
  - `redo_step_clicked` (screens 13-a, 14-b)
  - `luma_ask_clicked` (Ask Luma button, screens 13-a, 14-b, 12)
  - `score_summary_viewed` (score card impression, all review screens)
  - `discussion_compose_opened` (FAB in screen 10, compose bar focus in screen 11)
  - `discussion_posted` (Post to Challenge in screen 10)
  - `upgrade_cta_clicked` (Unlock Advanced Module, screens 16, 17)
  - `critique_pin_hovered` (screen 17)
  - `comparison_toggle_switched` (Original Case / Expert Benchmark, screen 17)

---

### SUN-84 · POL-06 — Security audit

**Primary screens:** No screen — implementation concern

**Design notes:**
- The full-screen compose editor (screen 10) accepts free-text markdown — XSS sanitization required on the rendered output
- Luma quote text is displayed with `italic` styling directly in HTML — Luma output must be sanitized before rendering if it interpolates user content
- The critique pins overlay raw scenario text with user-indexed numbers — no injection risk if pins are hardcoded, but if dynamic, sanitize scenario text

---

### SUN-85 · POL-07 — Pre-launch checklist

**Primary screens:** No screen — operational concern

**Design notes:**
- Visually verify all 9 screens render correctly in both light and dark modes before launch
- Confirm `smart_toy` icon is replaced by Luma geometric identity asset (SUN-79 dependency)
- Confirm `pro-gold` token is applied to all paywalled UI elements (SUN-72, SUN-79 dependency)

---

### SUN-86 · POL-08 — Launch day runbook

**Primary screens:** No screen — operational concern

**Design notes:**
- The "Faster than 68% of peers" comparative stat (screens 13-a, 14-b) requires sufficient submission volume to be meaningful — on launch day with low data, display "Top performers complete in under 45 min" as a fallback copy variant
- Monitor PostHog for `redo_step_clicked` rate as a proxy for feedback quality (high redo rate = feedback too harsh or unclear)

---

## Quick Reference: Screen-to-Issue Matrix

| Screen | Primary issues |
|---|---|
| `material-review-mode.html` | AI-01, AI-03, AI-06, ADM-04, POL-01, POL-02, POL-03 |
| `13-post-submission-review-a.html` | AI-01, AI-03, AI-06, POL-01, POL-02, POL-03 |
| `14-post-submission-review-b.html` | AI-01, AI-03, AI-06, POL-01, POL-02, POL-03 |
| `15-review-modal-overlay.html` | PAY-02, ADM-02, POL-03 |
| `16-review-side-drawer.html` | AI-02, AI-04, PAY-04, POL-01, POL-02, POL-03 |
| `17-review-data-rich.html` | AI-02, AI-06, AI-04, POL-02, POL-03, POL-05 |
| `10-challenge-discussions-b.html` | AI-07, ADM-01, ADM-03, ADM-04, POL-03, POL-05 |
| `11-challenge-discussions-c.html` | AI-07, POL-02, POL-03, POL-05 |
| `12-challenge-discussions-d.html` | AI-04, AI-07, AI-02, PAY-04, POL-01, POL-05 |
| No screen | AI-05 (simulation), PAY-01, PAY-03, PAY-05, ADM-05 (partial), POL-04, POL-06, POL-07, POL-08 |

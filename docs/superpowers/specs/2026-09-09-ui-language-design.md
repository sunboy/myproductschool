# UI language: design system for the density UI

Date: 2026-09-09. Branch: `feat/ui-density-v1`. Reference mockups: `.superpowers/brainstorm/68183-1788796857/content/round4-final.html` (agreed) and `round4.html` (exploration).

## Why

The density pass shipped thirteen redesigned routes, and the founder's review found eleven defects that all trace to the same cause: components hand-roll their own sizes, buttons, cards and navigation. There were 92 arbitrary `text-[Npx]` classes and 51 inline `style={{}}` blocks in `src/components/density` and `src/components/shell-v2`, sixteen hand-built pill buttons, three back-link implementations, fixed pixel card heights, and CSS descendant selectors repainting Tailwind buttons. The shadcn primitives in `src/components/ui` were never imported by that code.

Decision: define the UI language once and make every density and shell-v2 component consume it. Consistency becomes structural; the eleven fixes fall out of the migration.

## Layer 1: tokens (`src/app/globals.css`)

Added to `@theme inline` (nothing removed):

| Group | Tokens |
|---|---|
| Type size | `--text-caption` 11px/1.35, `--text-meta` 12px/1.4, `--text-ui` 13px/1.4, `--text-body` 14.5px/1.6, `--text-lede` 16px/1.55, `--text-h4` 18px/1.25, `--text-h3` 22px/1.2, `--text-h2` 28px/1.15, `--text-h1` 34px/1.12, `--text-display` 44px/1.05 |
| Weight | `--font-weight-body` 450, `--font-weight-ui` 550, `--font-weight-strong` 650, `--font-weight-headline` 700 |
| Control | `--spacing-control-sm` 28px, `--spacing-control-md` 32px, `--spacing-control-lg` 40px, `--spacing-hit` 40px |
| Radius | `--radius-control` 999px, `--radius-tile` 10px, `--radius-card` 14px, `--radius-panel` 18px |
| Layout | `--shell-nav-w` 200px, `--shell-rail-w` 56px, `--shell-top-h` 48px (exist), `--spacing-gutter` 16px, `--spacing-card-gap` 12px, `--container-content` 1180px, `--container-reader` 720px |

Body rule: `font-weight: var(--font-weight-body)`; `-webkit-font-smoothing: auto`. Colour roles for text: `ink-strong` headings and labels, `ink` body, `ink-secondary` meta, `ink-muted` placeholders and disabled only.

Tailwind v4 generates utilities from these names: `text-ui`, `text-meta`, `font-ui`, `font-strong`, `h-control-md`, `rounded-card`, `max-w-content`, etc.

## Layer 2: primitives (`src/design/`)

| Primitive | Variants | Replaces |
|---|---|---|
| `Button` | `variant: primary \| tonal \| ghost \| outline \| danger`; `size: sm \| md \| lg \| icon-sm \| icon-md`; `hint` (rendered as tooltip); `asChild` for links | `WORKSPACE_BTN_*`, EditorialCard CTA, HatchPickCard CTA, Start/Resume links, interview Start buttons |
| `IconButton` | `variant: outline \| ghost`; `label` required (aria-label + tooltip); 32px visual, 40px hit via `::after` | top bar icons, rail items, fullscreen, dismiss |
| `Chip` | `variant: filter \| suggestion \| tag`; `selected`; `icon` | practice filters, Hatch suggestions, band chips |
| `Badge` | `tone: type \| difficulty \| status \| pro \| neutral`; `value` for type/difficulty colouring | type/difficulty/status pills |
| `Card` | `tone: bright \| surface \| tinted \| forest`; `padding: none \| sm \| md`; always `container-type: inline-size`, never a fixed height; `Card.Art` uses `aspect-ratio` | EditorialCard, CoverCard, shelf tiles, HatchThoughtCard, PathsRow, panels |
| `Row` | slots `leading`, `title`, `meta`, `action`; min-height control-lg | practice list rows, recent sessions |
| `SegmentedTabs` | `items`, `value`, `onChange` | workspace brief tabs, Test cases / Run results |
| `BackLink` | `href`, `label` | every back affordance; rendered only by the top bar via `ReaderChromeContext` |
| `Brand.Wordmark` / `Brand.Mark` | `tone: default \| inverse` | `HackProductWordmark` uses in shell-v2, the literal "H" |
| `Toc` | `groups[{label, items[{id,label,done}]}]`, `activeId`, `onSelect` | RightToc |
| `Text` | `variant` = type step, `tone` = ink role | ad-hoc `text-[Npx]` |
| `PageGrid` | helpers `cols`, `shelf`, `split` | inline grid styles |

All primitives are `cva` based, accept `className` for layout only (margins, grid placement), and forbid overriding size or colour through `className` by convention (lint scans for `text-[`, `h-[`, `bg-[#`).

## Layer 3: rules (`docs/design/ui-language.md`) and enforcement

Rules: no arbitrary font sizes, no pixel heights on cards, no inline layout styles, no bare `<button>`/`<Link>` styled as buttons, no CSS descendant selectors targeting primitives, Lucide icons at 16/18/20, one back link per page (top bar), hit area ≥ 40px, readable text ≥ 12px, `ink-muted` only for placeholder/disabled.

Enforcement: ESLint `no-restricted-syntax` on JSX string literals matching `text-\[\d`, `h-\[\d+px\]`, `w-\[\d+px\]` (except SVG/art), `style={{ display:` in `src/design`, `src/components/density`, `src/components/shell-v2`, `src/components/onboarding/welcome`; plus `tests/design/ui-language.test.ts` which scans the same trees. Legacy trees exempt until deleted.

## Surface migrations (the eleven items)

| Item | Surface | Resolution |
|---|---|---|
| 1 Logo | `AppSidebarV2` | `Brand.Wordmark` (tight asset, natural aspect, 13px cap height) expanded; `Brand.Mark` (cropped monogram `public/images/logo-mark.png`) in the rail |
| 2 Weight | `globals.css` | body 450, `ink-secondary` for meta; TOC/nav/meta use `text-ui`/`text-meta` with `font-ui` |
| 3 Cards | `EditorialCard`, `CoverCard`, `EditorialShelf`, `LibraryV2` | `Card` contract; title `clamp(18px, 5.2cqw, 28px)` two-line clamp; CTA in flow; meta in the text column; art column hides under 520cqw; shelf `auto-fit minmax(200px,1fr)` with featured spanning 2 |
| 4 Hatch | `HatchThoughtCard` | "Ask Hatch" + `HatchImage state="speaking"`, message, `AskHatchField` (opens chat with focus via `open-ask-hatch`), `Chip suggestion` with icon; new-user variant with "Pick my first challenge" and "Show me around" (`start-intro-tour`) |
| 5 Interviews | nav + `/live-interviews` | `MAIN_NAV_ENTRIES` adds `interviews` (`Mic`, `/live-interviews`) between Practice and Library; `NavKey`, `activeNavKey`, BottomTabs, tour anchor `nav-interviews`. Setup becomes `InterviewWizard`: split layout, steps `company-round` → `prompt` → `mode`, state in URL query, Hatch suggestion card in the left panel, "Repeat last setup" from `localStorage hp:last-interview-setup`, Recent sessions below on step 1 (server-rendered, cap 8, "All →" to history) |
| 6 Practice rows | `ChallengeCardV3`, `LockedChallengeGrid` | `Row` variant: badge, title, `difficulty · minutes`, one action (Start/Resume/Review); completed shows check; list mode routes to V3 under density |
| 7 TOC | `useActiveHeading`, `RightToc` | rAF-throttled scroll listener + observer; clamp to last heading near the bottom; `Toc` primitive typography; visible from `lg` |
| 8 Rail | `AppSidebarV2`, `AppTooltip`, `UiShellContext` | rail items are `IconButton`-sized 40×40 links centred in the 56px track; tooltip wrapper `flex w-full`; toggle always enabled; on forced routes expand opens an overlay drawer (closes on route change/outside click/Escape); `setNavCollapsed` uses functional state for persistence |
| 9 Top bar | `AppTopBarV2` | remove tour button; `SpendIndicator` replaced by a `Badge neutral` "N reps left" pill for free users; icons via `IconButton` |
| 10 Back link | `(workspace)/layout.tsx`, `FlowWorkspace`, `BackButton` pages | top bar owns `BackLink`; FlowWorkspace editing header drops its button under density; legacy `BackButton` pages under shell-v2 move to `useReaderChrome({ left })` when density is on |
| 11 Workspace | `FlowWorkspace`, `workspace-design.css` | header row: title + badges, stepper (pips + current label ≥1280), autosave, Run (`tonal`), Submit (`primary`), fullscreen (`IconButton ghost`); `kbd` hints as tooltips; delete the `> button` and `min-height` overrides; brief tabs use `SegmentedTabs` |

## No orphaned controls

| Control | Handler | Backend / event |
|---|---|---|
| Rail/nav item | `Link` | route |
| Nav toggle | `setNavCollapsed` | `PATCH /api/profile { ui_prefs.nav_collapsed }` |
| Overlay expand (forced routes) | local state only | none (not persisted) |
| Sound | `toggleMuted` | localStorage via `useHatchSonics` |
| Bell | `router.push('/settings/notifications')` | route |
| Reps-left pill | `Link /pricing` | reads `usePlanLimits` |
| Ask Hatch field / chips | `open-ask-hatch { prompt, focus: true }` | FloatingHatch listener |
| Show me around | `start-intro-tour` | IntroTourController |
| Featured card CTA / tiles | `Link` | reader route |
| Practice row action | `Link` to workspace (`returnTo`) | existing |
| View toggle | `setPracticeView` | `PATCH /api/profile { ui_prefs.practice_view }` |
| TOC item | scroll + `history.replaceState` hash | reading progress PUT unchanged |
| Wizard chips/cards | URL query update (`router.replace`) | none until Start |
| Use this setup / Repeat last setup | jump to step 3 with params | `localStorage hp:last-interview-setup` |
| Start interview | existing `StartInterviewButton` → `POST /api/live-interview/start` | existing |
| Recent session Debrief/Resume | `Link` | existing routes |
| Run / Submit / fullscreen | existing handlers | existing |
| Back link | `Link` (`workspaceExitHref` in workspace) | route |

## Verification

`npx tsc --noEmit`; `npm run lint` (new rules); `npm test` + vitest incl. `tests/design/ui-language.test.ts`; prod build + `e2e/density/*.spec.ts` serially with new assertions (rail hit boxes ≥ 40px and navigation; expand inside a reader; featured CTA/meta inside card bounds at 1440/1280/375; TOC active id changes at three anchors; `/live-interviews` highlights Interviews; wizard steps via URL; one back link in workspace DOM; Submit computed background forest; no tour button; list rows contain no description). Visual pass by a validation subagent at three viewports; screenshots to `shots-after/`.

# UI Density Pass Implementation Plan: Master Index

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Execute the sub-plans in the order below; each sub-plan is self-contained but depends on the plans listed under "Depends on".

**Goal:** Recover the 36% to 92% of viewport lost to oversized heroes, nav and Hatch strips across 13 routes, unify the shell, rebuild the readers, and move onboarding to a full page, exactly as approved in `docs/superpowers/specs/2026-09-07-ui-density-pass-design.md` and the mockups in `.superpowers/brainstorm/68183-1788796857/content/final.html`.

**Architecture:** Everything ships behind the `ui_density_v1` app flag. A new `src/components/shell-v2/` shell (200/56px nav, 48px top bar, route-scoped search) wraps every signed-in route including the workspace and interview room. A new `src/components/density/` primitive kit (HeaderBand, HatchPickCard, CoverCard, GeoArt, EditorialCard, ReaderFrame, RightToc) is shared by all hubs and readers. Two additive data changes: `profiles.ui_prefs` (jsonb) and a `reading_progress` table with a small API. Onboarding becomes the `/welcome` route reusing the existing calibration APIs. Old components stay mounted behind the flag until sign-off.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind v4 (`@theme` tokens in `src/app/globals.css`), Supabase (SSR client `@/lib/supabase/server`, admin client `@/lib/supabase/admin`), zod 4, vitest (`npx vitest run <file>`), node test runner for lib tests, Playwright (`npx playwright test e2e/<file>.spec.ts`, config `playwright.config.ts`, `PLAYWRIGHT_BASE_URL` default `http://localhost:3002`, dev server assumed running).

---

## Sub-plans (execute in order)

| # | File | Scope | Depends on |
|---|---|---|---|
| 01 | `2026-09-07-ui-density-pass-01-foundation.md` | Flag, `profiles.ui_prefs`, `reading_progress` table + API, shell-v2 (sidebar, top bar, route kinds, context), workspace and interview-room shell unification, density primitives, E2E harness | none |
| 02 | `2026-09-07-ui-density-pass-02-dashboard.md` | Dashboard returning-user v4 and new-user variant | 01 |
| 03 | `2026-09-07-ui-density-pass-03-onboarding.md` | `/welcome` full-page onboarding, simplified FLOW scenario copy, dashboard/redo wiring | 01, 02 |
| 04 | `2026-09-07-ui-density-pass-04-library-practice.md` | Library (`/explore`) and Practice (`/challenges`) | 01 |
| 05 | `2026-09-07-ui-density-pass-05-readers.md` | Module chapter reader and autopsy story reader | 01 |
| 06 | `2026-09-07-ui-density-pass-06-progress-settings-landing.md` | Progress band, Settings title row, landing hero | 01 |
| 07 | `2026-09-07-ui-density-pass-07-interviews.md` | Interview setup band/panel/sessions column, interview room three-column layout | 01 |
| 08 | `2026-09-07-ui-density-pass-08-verification.md` | Cross-route Playwright suite at 1440/1280/375, orphan-control audit, flag flip runbook | all |

## Worktree and branch

All work happens in a dedicated worktree, never the primary checkout:

```bash
cd /Users/sandeep/Projects/myproductschool
git worktree add .worktrees/ui-density -b feat/ui-density-v1 feat/platform-rebuild-20260905
cd .worktrees/ui-density
npm ci
cp ../../.env.local .env.local
```

Dev server for E2E: `PORT=3002 npm run dev` inside the worktree (Playwright's default base URL is `http://localhost:3002`). Never run two `next build`s at once in the shared tree.

## Conventions every task follows

- **Tokens, not hex.** In `className` use Terra tokens (`bg-surface-container`, `bg-primary-fixed`, `text-on-surface-variant`, `border-outline-variant`, `bg-primary`, `text-tertiary`) and the redesign tokens already in `globals.css` (`bg-forest-800`, `border-hairline`, `bg-card-bright`, `text-ink-secondary`, `bg-page-field`, `text-gold`, `text-flame`). Raw hex only inside `style={{}}` for SVG/gradient art.
- **Fonts.** `font-headline` (Literata) for titles, `font-body`/`font-label` (Nunito Sans) elsewhere.
- **Icons.** Lucide (`lucide-react`) in shell-v2 and density primitives, matching `AppSidebar.tsx`; Material Symbols only where the surrounding file already uses them (workspace, interview room, BottomTabs).
- **Hatch.** `HatchImage` from `@/components/redesign/HatchImage` for raster poses, `HatchGlyph` from `@/components/shell/HatchGlyph` for inline SVG. Never emoji. Hatch is "it".
- **Copy.** No em dashes. No "you are a…" role framing. Subtitles ≤ 60 chars.
- **Flag gating.** Read `ui_density_v1` server-side with `getAppFlag('ui_density_v1', false)` and pass down as a prop; client code reads it from `UiShellContext` (`useUiShell().density`). Every new surface renders only when `density === true`; the legacy surface renders otherwise. Do not delete legacy components in this pass.
- **No orphaned controls.** Every button, chip, link, toggle and card added by these plans must do one of: navigate (real `href`), call an existing API route, dispatch an existing window event, or write a persisted preference. Each task lists its controls and their actions in a "Wiring table"; the verification plan asserts them.
- **Tests.** Unit tests with vitest for pure helpers (`tests/lib/**`, `tests/components/**`), Playwright for pages. Run `npx tsc --noEmit` after every task; pre-existing errors in `supabase/functions/` are acceptable, new errors are not.
- **Commits.** One commit per task, message in the form `feat(density): <what>`; never include a co-author trailer.

## Shared reference: window events and API routes already in the codebase

| Name | Kind | Effect |
|---|---|---|
| `open-ask-hatch` (`detail.prompt`) | window event | Opens the floating Hatch chat, primes the prompt (`FloatingHatch.tsx` L151-160) |
| `start-intro-tour` | window event | Starts the Shepherd main tour (`IntroTourController.tsx` L65-75) |
| `start-interview-tour` | window event | Starts the interview tour |
| `open-upgrade-modal` | window event | Opens the paywall/upgrade modal |
| `open-onboarding-modal` | window event | Opens the legacy onboarding modal (`OnboardingModalContext.tsx` L108-112) |
| `profile-stats-updated` | window event | Makes `SessionContext` refetch `/api/profile` |
| `challenge-completed` | window event | Same, after a challenge completes |
| `open-hatch-workspace` | window event | Opens the workspace Hatch panel (`FlowWorkspace.tsx` L1610) |
| `GET /api/profile` / `PATCH /api/profile` | API | Profile read/update (`src/app/api/profile/route.ts`) |
| `GET /api/config/flags` | API | Client-readable app flags |
| `GET /api/challenges/next` | API | Hatch's pick `{challenge, reason, tip, targets_move, recommendation_type, is_calibrated, hatch_insight}` |
| `GET /api/challenges/count?discipline=&groupBy=` | API | Counts |
| `GET /api/challenges?discipline&q&difficulty&role&company&technique&topic&real_interview=1&resume=1&page&limit` | API | Challenge list |
| `POST /api/challenges/quick-take/submit` `{challenge_id, response_text}` / `GET /api/challenges/quick-take/next?exclude=&move=` | API | Quick Take |
| `GET /api/learn` / `GET /api/learn/[slug]` / `GET /api/learn/[slug]/[chapter]` / `POST /api/learn/[slug]/[chapter]/complete` | API | Modules |
| `toggleBookmark(companySlug, storySlug)` (server action, `src/lib/showcase/bookmarks.ts`) | action | Save/unsave autopsy story |
| `GET /api/live-interview/history` | API | Past sessions |
| `POST /api/live-interview/start` `{companyId, roleId, challengeId, discipline}` | API | Create session |
| `POST /api/live-interview/[id]/chat`, `/voice-turn`, `/end`, `/pause`, `EventSource /status` | API | Room |
| `GET /api/interview-loops` | API | Multi-round summary |
| `POST /api/onboarding/calibration/submit` `{answers, role, primary_goal, prep_timeline, role_context, target_company}` | API | Calibration scoring |
| `POST /api/onboarding/profile` `{role, role_context, primary_goal, prep_timeline, target_company, interview_date}` | API | Onboarding profile fields |
| `POST /api/onboarding/complete` | API | Marks `onboarding_completed_at` |
| `POST /api/onboarding/quick-start` `{role}` | API | Value-first path |
| `GET/PUT/DELETE /api/onboarding/state` (`src/lib/onboarding/state-client.ts`) | API | Resumable onboarding state |
| `POST /api/stripe/portal` | API | Billing portal |

## Code maps

Detailed, line-referenced code maps used to write these plans (read them when a task references a file you have not opened):
- `docs/superpowers/plans/_map-shell-dashboard-library.RO.md`
- `docs/superpowers/plans/_map-practice-readers-progress-settings.RO.md`
- `docs/superpowers/plans/_map-workspace-interviews-onboarding-landing.RO.md`
- `docs/superpowers/plans/_map-partial-notes.md`

Line numbers were captured on 2026-09-08 at commit `e34bcdd4` on `feat/platform-rebuild-20260905`; re-grep if a file has moved.

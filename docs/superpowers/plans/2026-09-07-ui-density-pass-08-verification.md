# UI Density Pass 08: Cross-route verification, orphan audit, flag flip

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Requires plans 01 to 07 merged into the worktree branch. Read `2026-09-07-ui-density-pass-00-master.md` for conventions.

**Goal:** Prove the whole pass at 1440×900, 1280×720 and 375×812 on every route, prove no control is orphaned, prove the legacy path still works with the flag off, produce a visual snapshot set for founder review, and document the flag flip.

**Architecture:** One Playwright matrix spec drives the 13 routes through three viewports and stores screenshots under `e2e/density/__snapshots__/`. An orphan audit spec walks every clickable element inside the new density surfaces and asserts it has an `href`, triggers a network request, dispatches a known event, or changes persisted state. A flag-off regression spec re-runs the smoke assertions on the legacy shell.

---

## File structure

Create:
- `e2e/density/matrix.spec.ts`
- `e2e/density/orphans.spec.ts`
- `e2e/density/flag-off.spec.ts`
- `docs/runbooks/ui-density-flag.md`

---

### Task 1: Route × viewport matrix with content-start assertions

**Files:**
- Create: `e2e/density/matrix.spec.ts`

- [ ] **Step 1: Spec**

```ts
import { test, expect } from '@playwright/test'
import { VIEWPORTS, loginViaApi, gotoReady, topOf, expectNoConsoleErrors, type ViewportName } from './helpers'

interface RouteCase { name: string; path: string; firstContent: string; maxTop: Partial<Record<ViewportName, number>>; reader?: boolean; needsNewUser?: boolean; skipMobileTop?: boolean }
const ROUTES: RouteCase[] = [
  { name: 'dashboard', path: '/dashboard', firstContent: '[data-testid=practice-areas]', maxTop: { desktop: 340, laptop: 320 } },
  { name: 'library', path: '/explore', firstContent: '[data-testid^=shelf-]', maxTop: { desktop: 340, laptop: 330 } },
  { name: 'practice', path: '/challenges', firstContent: '[data-testid=challenge-card], [data-testid=practice-filters] ~ * a[href*="/workspace/challenges/"]', maxTop: { desktop: 270, laptop: 260 } },
  { name: 'module', path: '/explore/modules/context-engineering', firstContent: 'article h1', maxTop: { desktop: 130, laptop: 120 }, reader: true },
  { name: 'autopsy', path: '/explore/autopsies/buffer/stories/buffer-fake-landing-page-mvp', firstContent: 'article h1', maxTop: { desktop: 130, laptop: 120 }, reader: true },
  { name: 'progress', path: '/progress', firstContent: '[data-testid=streak-heatmap]', maxTop: { desktop: 520, laptop: 480 } },
  { name: 'settings', path: '/settings', firstContent: '#settings-account', maxTop: { desktop: 140, laptop: 130 } },
  { name: 'workspace', path: '/workspace/challenges/answering-range-sum-queries-over-fixed-sensor-readings', firstContent: '[data-testid=monaco-editor-container]', maxTop: { desktop: 140, laptop: 130 }, reader: true, skipMobileTop: true },
  { name: 'interview-setup', path: '/live-interviews', firstContent: '[data-testid=setup-panel]', maxTop: { desktop: 170, laptop: 160 } },
]

for (const vp of Object.keys(VIEWPORTS) as ViewportName[]) {
  test.describe(`matrix @${vp}`, () => {
    test.beforeEach(async ({ page }) => { await loginViaApi(page); await page.setViewportSize(VIEWPORTS[vp]) })
    for (const r of ROUTES) {
      test(`${r.name}`, async ({ page }) => {
        await expectNoConsoleErrors(page, async () => { await gotoReady(page, r.path) })
        if (vp !== 'mobile') {
          const side = page.getByTestId('shell-sidebar'); await expect(side).toBeVisible()
          await expect(side).toHaveAttribute('data-collapsed', r.reader ? 'true' : 'false')
          expect((await page.getByTestId('shell-topbar').boundingBox())!.height).toBe(48)
          const max = r.maxTop[vp]; if (max) expect(await topOf(page, r.firstContent), `${r.name} first content top @${vp}`).toBeLessThanOrEqual(max)
        } else if (!r.skipMobileTop) {
          await expect(page.locator(r.firstContent).first()).toBeVisible()
        }
        await page.screenshot({ path: `e2e/density/__snapshots__/${r.name}-${vp}.png`, fullPage: false })
      })
    }
  })
}

test('landing @desktop fits one viewport', async ({ page }) => {
  await page.setViewportSize(VIEWPORTS.desktop); await page.goto('/', { waitUntil: 'networkidle' })
  const proof = await page.getByTestId('landing-proof').boundingBox(); expect(proof!.y + proof!.height).toBeLessThanOrEqual(900)
  await page.screenshot({ path: 'e2e/density/__snapshots__/landing-desktop.png' })
})
```

- [ ] **Step 2: Run** `npx playwright test e2e/density/matrix.spec.ts` → 28 passed. Attach the snapshot folder to the review (copy to `.superpowers/brainstorm/68183-1788796857/content/shots-after/`). Commit:

```bash
git add e2e/density/matrix.spec.ts e2e/density/__snapshots__
git commit -m "test(density): route x viewport matrix with content-start assertions"
```

---

### Task 2: Orphan-control audit

**Files:**
- Create: `e2e/density/orphans.spec.ts`

Every clickable inside a density surface must be one of: an `<a href>` to a same-origin path; a `<button>` whose click causes a network request, a URL change, a `hp:*`/`hp-*` localStorage write, a known window event (`open-ask-hatch`, `start-intro-tour`, `open-upgrade-modal`, `start-interview-tour`, `open-hatch-workspace`), or a visible DOM state change (`aria-pressed`/`aria-expanded`/`aria-current` toggling, or an element appearing/disappearing).

- [ ] **Step 1: Spec**

```ts
import { test, expect, type Page } from '@playwright/test'
import { VIEWPORTS, loginViaApi, gotoReady } from './helpers'

const SURFACES: Array<{ path: string; root: string }> = [
  { path: '/dashboard', root: '[data-testid=dashboard-hero], [data-testid=practice-areas], [data-testid=editorial-shelf], [data-testid=paths-row]' },
  { path: '/explore', root: 'main' },
  { path: '/challenges', root: '[data-testid=header-band], [role=group][aria-label=View]' },
  { path: '/progress', root: '[data-testid=header-band]' },
  { path: '/settings', root: '[data-testid=settings-title]' },
  { path: '/live-interviews', root: '[data-testid=header-band], [data-testid=recent-sessions]' },
  { path: '/explore/modules/context-engineering', root: '[data-testid=shell-topbar], [data-testid=right-toc]' },
]
const KNOWN_EVENTS = ['open-ask-hatch', 'start-intro-tour', 'open-upgrade-modal', 'start-interview-tour', 'open-hatch-workspace', 'open-onboarding-modal', 'profile-stats-updated']

async function armProbes(page: Page) {
  await page.addInitScript((events: string[]) => {
    (window as any).__hp = { events: [] as string[], ls: [] as string[] }
    for (const e of events) window.addEventListener(e, () => (window as any).__hp.events.push(e))
    const set = localStorage.setItem.bind(localStorage)
    localStorage.setItem = (k: string, v: string) => { (window as any).__hp.ls.push(k); return set(k, v) }
  }, KNOWN_EVENTS)
}

test.describe('orphan audit', () => {
  for (const s of SURFACES) {
    test(`no orphaned controls on ${s.path}`, async ({ page }) => {
      await armProbes(page); await loginViaApi(page); await page.setViewportSize(VIEWPORTS.desktop); await gotoReady(page, s.path)
      const controls = page.locator(`${s.root.split(',').map(r => `${r.trim()} a, ${r.trim()} button`).join(', ')}`)
      const n = await controls.count(); expect(n, 'controls found').toBeGreaterThan(0)
      const orphans: string[] = []
      for (let i = 0; i < n; i++) {
        const el = controls.nth(i); if (!(await el.isVisible()) || !(await el.isEnabled())) continue
        const tag = await el.evaluate(e => e.tagName.toLowerCase()); const label = (await el.innerText().catch(() => '')).trim().slice(0, 40) || (await el.getAttribute('aria-label')) || `${tag}#${i}`
        if (tag === 'a') { const href = await el.getAttribute('href'); if (!href || href === '#' ) orphans.push(`a "${label}" href=${href}`); continue }
        // button: click and observe
        const before = await page.evaluate(() => ({ url: location.href, ev: (window as any).__hp.events.length, ls: (window as any).__hp.ls.length, html: document.body.innerHTML.length }))
        let requests = 0; const onReq = (r: any) => { if (r.url().includes('/api/')) requests++ }; page.on('request', onReq)
        const aria = await el.evaluate(e => ({ p: e.getAttribute('aria-pressed'), x: e.getAttribute('aria-expanded') }))
        await el.click({ timeout: 3000 }).catch(() => {}); await page.waitForTimeout(700); page.off('request', onReq)
        const after = await page.evaluate(() => ({ url: location.href, ev: (window as any).__hp.events.length, ls: (window as any).__hp.ls.length, html: document.body.innerHTML.length }))
        const ariaAfter = await el.evaluate(e => ({ p: e.getAttribute('aria-pressed'), x: e.getAttribute('aria-expanded') })).catch(() => aria)
        const acted = after.url !== before.url || after.ev > before.ev || after.ls > before.ls || requests > 0 || Math.abs(after.html - before.html) > 50 || aria.p !== ariaAfter.p || aria.x !== ariaAfter.x
        if (!acted) orphans.push(`button "${label}"`)
        if (after.url !== before.url) { await gotoReady(page, s.path) }
        await page.keyboard.press('Escape').catch(() => {})
      }
      expect(orphans, `orphaned controls on ${s.path}`).toEqual([])
    })
  }
})
```

- [ ] **Step 2: Run** `npx playwright test e2e/density/orphans.spec.ts` → 7 passed. Any failure lists the exact control; fix it in the owning plan's component (add the href, handler or event) and re-run. Commit:

```bash
git add e2e/density/orphans.spec.ts
git commit -m "test(density): orphaned-control audit across density surfaces"
```

---

### Task 3: Flag-off regression

**Files:**
- Create: `e2e/density/flag-off.spec.ts`

- [ ] **Step 1: Spec**

```ts
import { test, expect } from '@playwright/test'
import { VIEWPORTS, loginViaApi, setDensityFlag } from './helpers'

test.describe('legacy shell with ui_density_v1 off', () => {
  test.beforeAll(async () => { await setDensityFlag(false); await new Promise(r => setTimeout(r, 61_000)) })
  test.afterAll(async () => { await setDensityFlag(true) })
  test('legacy dashboard, practice, workspace and modal onboarding still render', async ({ page }) => {
    await loginViaApi(page); await page.setViewportSize(VIEWPORTS.desktop)
    await page.goto('/dashboard'); await expect(page.locator('[data-shell="v2"]')).toHaveCount(0); await expect(page.locator('.learning-home-stage')).toBeVisible()
    await page.goto('/challenges'); await expect(page.locator('[data-tour-target=practice-hero]')).toBeVisible()
    await page.goto('/workspace/challenges/answering-range-sum-queries-over-fixed-sensor-readings'); await expect(page.locator('nav.rounded-full')).toBeVisible(); await expect(page.getByTestId('run-button')).toBeVisible()
    await page.goto('/welcome'); await expect(page).toHaveURL(/\/dashboard/)
  })
})
```

- [ ] **Step 2: Run** `npx playwright test e2e/density/flag-off.spec.ts` → 1 passed (takes ~70s for the cache window). Commit:

```bash
git add e2e/density/flag-off.spec.ts
git commit -m "test(density): legacy path regression with the flag off"
```

---

### Task 4: Full suite, unit tests, typecheck, lint, build

- [ ] **Step 1: Run everything**

```bash
npx tsc --noEmit 2>&1 | grep -v supabase/functions | tee /tmp/tsc.txt | tail -3   # expect no lines
npm run lint 2>&1 | tail -5
npm run test:unit 2>&1 | tail -15
PLAYWRIGHT_BASE_URL=http://localhost:3002 npx playwright test e2e/density 2>&1 | tail -20
npm run build 2>&1 | tail -15
```

Expected: tsc clean, lint clean or only pre-existing warnings, unit suites green including the new tests (`tests/lib/shell`, `tests/lib/reading`, `tests/lib/dashboard`, `tests/lib/library`, `tests/lib/calibration`, `tests/lib/onboarding`, `tests/lib/live-interview/flow-phase`, `tests/components/geo-art`, `tests/components/density-primitives`), all `e2e/density` specs green, build succeeds. Record the outputs in the PR description verbatim.

- [ ] **Step 2: Run the existing E2E specs that touch changed surfaces** to catch regressions: `npx playwright test e2e/coding-challenge.spec.ts e2e/auth.spec.ts e2e/adaptive-ui-shots.spec.ts` (with the flag on). Fix any failure whose cause is the new shell (usually a selector like `nav.rounded-full` or a top bar height).

---

### Task 5: Runbook and hand-off

**Files:**
- Create: `docs/runbooks/ui-density-flag.md`

- [ ] **Step 1: Runbook**

```markdown
# ui_density_v1 flag

What it gates: the shell-v2 sidebar/top bar, the density dashboard, Library, Practice, readers, Progress band, Settings title row, interview setup/room layouts, the /welcome onboarding page and the landing hero. Legacy components remain mounted when the flag is off.

Flip (takes effect within 60s, no deploy):
  update app_flags set value = 'true'::jsonb, updated_at = now() where key = 'ui_density_v1';
Revert:
  update app_flags set value = 'false'::jsonb, updated_at = now() where key = 'ui_density_v1';

Dev and prod share the DB: the flag is global. Flip it only after the founder signs off on the preview deployment.

Preferences written by the new UI: profiles.ui_prefs (nav_collapsed, practice_view); reading_progress rows. Both are harmless with the flag off.

Removal (follow-up after sign-off): delete AppSidebar/AppTopShell/TopNav usages, DashboardHero/HatchSuggestionCard/PracticeAreaGrid/ContinueLearning/ProgressSnapshot legacy branch, LibraryCatalog, the OnboardingModal path (keep Settings redo → /welcome?redo=1), and the flag reads.
```

- [ ] **Step 2: Open the PR** from `feat/ui-density-v1` to `feat/platform-rebuild-20260905` with: the spec link, the eight plan links, the test outputs from Task 4, and the `e2e/density/__snapshots__` images inline. No co-author trailer.

```bash
git add docs/runbooks/ui-density-flag.md
git commit -m "docs(density): ui_density_v1 runbook"
git push -u origin feat/ui-density-v1
gh pr create --base feat/platform-rebuild-20260905 --title "UI density pass v1 (behind ui_density_v1)" --body-file docs/superpowers/plans/_pr-body.md
```

(Write `_pr-body.md` from the outputs above before running the command.)

## Self-review
- Spec §7 verification: Tasks 1-4. §8 rollout: Task 5. Orphan rule from the master plan: Task 2 enforces it mechanically.

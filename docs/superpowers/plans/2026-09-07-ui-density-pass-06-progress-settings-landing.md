# UI Density Pass 06: Progress, Settings, Landing

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Requires plan 01. Read `2026-09-07-ui-density-pass-00-master.md` for conventions.

**Goal:** Progress: replace the `LearningPageHeading` hero and the separate "Your next focus" strip with an 88px `HeaderBand` (chips Overview / Skill ladder / History; Hatch card "Your next focus" → `/challenges?move=<weakest>`), keeping stats and cards. Settings: plain title row with section chips that scroll to sections, no hero. Landing: hero within one 1440×900 viewport with a 6-word headline, one-line sub, proof row above the fold; logged-out nav Practice / Library / Pricing / Log in / Start practicing.

**Architecture:** Progress and Settings are client pages; both get a density branch at their header only. Landing is `src/components/landing-v5/V5Hero.tsx` + `v5-landing.css`; the change is copy + CSS heights + nav items, gated by the same flag read server-side in `src/app/page.tsx`.

---

## File structure

Create:
- `src/components/density/progress/ProgressBand.tsx`
- `src/components/density/settings/SettingsTitleRow.tsx`
- `e2e/density/progress-settings-landing.spec.ts`

Modify:
- `src/app/(app)/progress/page.tsx:813-832` (hero + next focus)
- `src/app/(app)/settings/page.tsx:528-531` (hero) and section ids
- `src/app/page.tsx`, `src/components/landing-v5/V5LandingPage.tsx`, `V5Hero.tsx`, `V5Header.tsx`, `src/app/(marketing)/v5-landing/v5-landing.css`

---

### Task 1: Progress band

**Files:**
- Create: `src/components/density/progress/ProgressBand.tsx`
- Modify: `src/app/(app)/progress/page.tsx:813-816`

- [ ] **Step 1: Component**

```tsx
// src/components/density/progress/ProgressBand.tsx
'use client'
import { usePathname } from 'next/navigation'
import { HeaderBand } from '@/components/density/HeaderBand'
import { HatchPickCard } from '@/components/density/HatchPickCard'

export function ProgressBand({ weakest }: { weakest: { move: string; pct: number } | null }) {
  const p = usePathname() ?? '/progress'
  const label = weakest ? weakest.move.charAt(0).toUpperCase() + weakest.move.slice(1) : null
  return (
    <HeaderBand
      title="Progress"
      chips={[
        { label: 'Overview', href: '/progress', active: p === '/progress', testId: 'chip-overview' },
        { label: 'Skill ladder', href: '/progress/skill-ladder', active: p.startsWith('/progress/skill-ladder'), testId: 'chip-ladder' },
        { label: 'History', href: '/history', active: p.startsWith('/history'), testId: 'chip-history' },
      ]}
      right={label ? <HatchPickCard eyebrow="Your next focus" title={`Build confidence in ${label}`} reason={`${Math.round(weakest!.pct)}% on the ${label} move. One targeted rep moves it most.`} href={`/challenges?move=${weakest!.move}`} ctaLabel="Find a challenge" testId="progress-next-focus" /> : null}
    />
  )
}
```

The "Submissions" chip in the mockup maps to the existing `/history` route (there is no `/progress/submissions`; code map §4).

- [ ] **Step 2: Page branch**

In `src/app/(app)/progress/page.tsx` at L813-816: when `useUiShell().density` is true render `<ProgressBand weakest={weakest ? { move: weakest.move, pct: weakest.progress_pct } : null} />` instead of `<LearningPageHeading …>` and the "Your next focus" block (`weakest` is computed at L688-691 from `useMoveLevels`). Leave `StatStrip` and the cards untouched. `ChallengeListFilters` (`src/lib/data/challenges.ts` L32-43) has no `move` field today. Add `move?: string` to the interface, map `searchParams.move` into `filters` in `FreePracticeContent.tsx` L77-87, and in `applyChallengeFilters` (L144-222) add `if (filters.move) q = q.contains('move_tags', [filters.move])`. Add a unit test in `tests/lib/challenges/move-filter.test.ts` that builds the filter object and asserts `move` survives normalisation.

- [ ] **Step 3: Verify**: `/progress` flag on: band ≤ 96px, `StatStrip` top ≤ 160, next-focus CTA href `/challenges?move=optimize` (or the account's weakest). Commit:

```bash
git add src/components/density/progress/ProgressBand.tsx src/app/(app)/progress/page.tsx src/lib/data/challenges.ts
git commit -m "feat(density): Progress band with next-focus pick"
```

---

### Task 2: Settings title row

**Files:**
- Create: `src/components/density/settings/SettingsTitleRow.tsx`
- Modify: `src/app/(app)/settings/page.tsx:528-531`

- [ ] **Step 1: Component**

```tsx
// src/components/density/settings/SettingsTitleRow.tsx
'use client'
export function SettingsTitleRow({ isPro }: { isPro: boolean }) {
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const chip = 'rounded-full border border-hairline bg-card-bright px-2.5 py-0.5 text-[11px] font-semibold hover:bg-surface-container'
  return (
    <div data-testid="settings-title" className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
      <h1 className="font-headline text-[26px] font-bold leading-none">Settings{isPro && <span className="ml-2 rounded-full bg-amber-soft px-2 py-0.5 align-middle text-[10px] font-bold text-tertiary">Pro</span>}</h1>
      <div className="flex gap-1.5">
        <button type="button" data-testid="chip-account" onClick={() => go('settings-account')} className={chip}>Account</button>
        <a href="/settings/notifications" data-testid="chip-notifications" className={chip}>Notifications</a>
        <button type="button" data-testid="chip-membership" onClick={() => go('settings-membership')} className={chip}>Membership</button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Page**: when `density` is true, replace the `LearningPageHeading` at L528 with `<SettingsTitleRow isPro={isPro} />`; add `id="settings-account"` to the left profile/security card container (L532) and `id="settings-membership"` to the billing card (L751); add `scroll-mt-16` to both. Everything else unchanged.

- [ ] **Step 3: Verify**: `/settings` flag on: first form card top ≤ 130; chips scroll; Notifications navigates. Commit:

```bash
git add src/components/density/settings/SettingsTitleRow.tsx src/app/(app)/settings/page.tsx
git commit -m "feat(density): Settings title row, no hero"
```

---

### Task 3: Landing hero and nav

**Files:**
- Modify: `src/app/page.tsx`, `src/components/landing-v5/V5LandingPage.tsx`, `V5Hero.tsx:69-115`, `V5Header.tsx:104-118`, `src/app/(marketing)/v5-landing/v5-landing.css`

- [ ] **Step 1: Flag into the landing**

`src/app/page.tsx` is a server component: `const dense = await getAppFlag('ui_density_v1', false)`; render `<V5LandingPage dense={dense} />`. Thread `dense` to `V5Hero` and `V5Header`.

- [ ] **Step 2: Hero copy and structure** (`V5Hero.tsx`, inside `dense` branch, else unchanged)

- Headline (L74-79) → `Interview practice that tests <em>more than code.</em>` (6 words, two lines at 54px).
- Lede (L81-88) → `Coding, SQL, system design and product judgment, graded by Hatch.` (one line, no `<br>`s).
- Role chips (L90-105) unchanged (they drive `hp-role-focus`).
- CTAs unchanged (primary → `open-auth-modal` signup; secondary → `#grading`).
- Right column unchanged except sizes via CSS.
- Add `data-testid="landing-hero"` on the section and `data-testid="landing-proof"` on the `.hero-reference-dimensions` aside.

- [ ] **Step 3: CSS**: in `v5-landing.css` add a `.hero-reference.is-dense` block:

```css
.hero-reference.is-dense{min-height:auto;padding-top:24px;padding-bottom:0}
.hero-reference.is-dense .hero-reference-title{font-size:54px;line-height:1.05;max-width:640px}
.hero-reference.is-dense .hero-reference-lede{font-size:18px;max-width:520px;margin-top:12px}
.hero-reference.is-dense .hero-reference-hatch img{width:420px;height:auto}
.hero-reference.is-dense .hero-reference-review{transform:scale(.9);transform-origin:top left}
.hero-reference.is-dense .hero-reference-dimensions{margin-top:24px}
@media (max-width:1024px){.hero-reference.is-dense .hero-reference-title{font-size:40px}}
```

Apply `className={`hero-reference${dense ? ' is-dense' : ''}`}`. Tune the numbers until, at 1440×900 logged out, `[data-testid=landing-proof]` bottom ≤ 900 and at 1280×720 the headline, sub and both CTAs are within 720.

- [ ] **Step 4: Nav** (`V5Header.tsx` L104-109, dense branch): items `Practice` (dropdown, unchanged), `Library` (dropdown, unchanged), `Pricing` → `/pricing`; remove `Home` and `Progress`. Actions unchanged (`Log in` → `open-auth-modal` login, `Start practicing` → signup). Mobile menu mirrors: Practice, Library, Pricing, Start practicing.

- [ ] **Step 5: Verify + commit**

Logged out, flag on: `curl -s http://localhost:3000/ | grep -c 'more than code'` → 1. Playwright (Task 4) asserts the fold.

```bash
git add src/app/page.tsx src/components/landing-v5 src/app/(marketing)/v5-landing/v5-landing.css
git commit -m "feat(density): landing hero within one viewport, trimmed nav"
```

---

### Task 4: E2E

**Files:**
- Create: `e2e/density/progress-settings-landing.spec.ts`

- [ ] **Step 1: Spec**

```ts
import { test, expect } from '@playwright/test'
import { VIEWPORTS, loginViaApi, gotoReady, topOf } from './helpers'

test.describe('progress, settings, landing', () => {
  test('progress band and next focus', async ({ page }) => {
    await loginViaApi(page); await page.setViewportSize(VIEWPORTS.desktop); await gotoReady(page, '/progress')
    expect((await page.getByTestId('header-band').boundingBox())!.height).toBeLessThanOrEqual(100)
    await expect(page.getByTestId('chip-ladder')).toHaveAttribute('href', '/progress/skill-ladder')
    const nf = page.getByTestId('progress-next-focus'); if (await nf.count()) expect(await nf.locator('a').last().getAttribute('href')).toMatch(/\/challenges\?move=(frame|list|optimize|win)/)
    expect(await topOf(page, '[data-testid=streak-heatmap]')).toBeLessThanOrEqual(520)
  })

  test('settings title row', async ({ page }) => {
    await loginViaApi(page); await page.setViewportSize(VIEWPORTS.desktop); await gotoReady(page, '/settings')
    expect(await topOf(page, '#settings-account')).toBeLessThanOrEqual(140)
    await page.getByTestId('chip-membership').click(); await page.waitForTimeout(500); expect(await topOf(page, '#settings-membership')).toBeLessThanOrEqual(120)
    await expect(page.getByTestId('chip-notifications')).toHaveAttribute('href', '/settings/notifications')
  })

  test('landing fits one viewport', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop); await page.goto('/', { waitUntil: 'networkidle' })
    await expect(page.getByTestId('landing-hero')).toContainText('more than code')
    const proof = await page.getByTestId('landing-proof').boundingBox(); expect(proof!.y + proof!.height).toBeLessThanOrEqual(900)
    await expect(page.locator('nav.reference-nav')).not.toContainText('Home'); await expect(page.locator('nav.reference-nav')).toContainText('Pricing')
    await page.setViewportSize(VIEWPORTS.laptop); await page.reload(); const cta = await page.locator('.hero-reference-primary').boundingBox(); expect(cta!.y + cta!.height).toBeLessThanOrEqual(720)
    await page.setViewportSize(VIEWPORTS.mobile); await page.reload(); await expect(page.getByTestId('landing-hero')).toBeVisible()
  })
})
```

- [ ] **Step 2: Run** → 3 passed. Commit: `git add e2e/density/progress-settings-landing.spec.ts && git commit -m "test(density): progress, settings, landing E2E"`.

## Self-review
- Spec §4.8 (Progress), §4.9 (Settings), §4.13 (Landing) covered. All chips and CTAs are links or scroll actions; the landing CTAs keep their auth-modal events.

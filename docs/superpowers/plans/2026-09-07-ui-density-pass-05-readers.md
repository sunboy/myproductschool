# UI Density Pass 05: Readers (module chapter, autopsy story)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Requires plan 01. Read `2026-09-07-ui-density-pass-00-master.md` for conventions.

**Goal:** Both readers become a single 700px column inside the forced-rail shell: back link and Save in the 48px top bar, eyebrow + 34px title + Literata lede + a 700×180 hero image slot, then body; a quiet right TOC (chapter list with ✓ and a progress bar, then on-page headings for modules; beats with a progress bar for autopsies); reading progress saved to `reading_progress` and localStorage; left indexes removed.

**Architecture:** Module: `src/app/(app)/explore/modules/[slug]/page.tsx` keeps its data hooks (`useLearnModule`, `useLearnChapter`) and `?chapter=` navigation; when density is on it renders `ModuleReaderV2` instead of `TocRail` + `ReadingColumn`. Autopsy: `CinematicReader.tsx` gets a density branch that renders `AutopsyReaderV2` (same sections, no left outline, no dock) and reports progress. Top-bar slots come from `ShellV2`'s `topLeft`/`topRight` via a small `ReaderChrome` portal context.

**Tech Stack:** as master plan.

---

## File structure

Create:
- `src/components/shell-v2/ReaderChromeContext.tsx` (lets a page set the top bar's left/right slots)
- `src/components/density/reader/ModuleReaderV2.tsx`
- `src/components/density/reader/AutopsyReaderV2.tsx`
- `src/components/density/reader/ReaderHeader.tsx`
- `src/components/density/reader/HeroImageSlot.tsx`
- `src/components/density/reader/useReadingProgressReporter.ts`
- `src/lib/reading/headings.ts` (+ `tests/lib/reading/headings.test.ts`)
- `e2e/density/readers.spec.ts`

Modify:
- `src/components/shell-v2/ShellV2.tsx` (consume `ReaderChromeContext`)
- `src/app/(app)/explore/modules/[slug]/page.tsx`
- `src/components/showcase/reader/CinematicReader.tsx`
- `supabase/migrations/20260908091000_learn_chapter_hero.sql` (`learn_chapters.hero_image_url`)

---

### Task 1: `learn_chapters.hero_image_url` and heading extraction

**Files:**
- Create: `supabase/migrations/20260908091000_learn_chapter_hero.sql`, `src/lib/reading/headings.ts`
- Test: `tests/lib/reading/headings.test.ts`

- [ ] **Step 1: Migration**

```sql
ALTER TABLE learn_chapters ADD COLUMN IF NOT EXISTS hero_image_url TEXT;
COMMENT ON COLUMN learn_chapters.hero_image_url IS 'Optional 700x180 hero for the chapter reader; GeoArt placeholder when null.';
```

Apply as in plan 01 Task 1.

- [ ] **Step 2: Failing test**

```ts
// tests/lib/reading/headings.test.ts
import { describe, it, expect } from 'vitest'
import { extractHeadings, slugifyHeading } from '@/lib/reading/headings'
describe('headings', () => {
  it('slugifies', () => { expect(slugifyHeading('The Model Trusts Everything You Hand It')).toBe('the-model-trusts-everything-you-hand-it') })
  it('extracts h2/h3 from markdown, ignoring fenced code', () => {
    const md = '# Title\n\n## The model trusts everything\ntext\n```\n## not a heading\n```\n### Where poison enters\n## What to do on Monday'
    expect(extractHeadings(md)).toEqual([{ id: 'the-model-trusts-everything', label: 'The model trusts everything', level: 2 }, { id: 'where-poison-enters', label: 'Where poison enters', level: 3 }, { id: 'what-to-do-on-monday', label: 'What to do on Monday', level: 2 }])
  })
})
```

- [ ] **Step 3: Implement**

```ts
// src/lib/reading/headings.ts
export interface Heading { id: string; label: string; level: 2 | 3 }
export const slugifyHeading = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-')
export function extractHeadings(markdown: string): Heading[] {
  const out: Heading[] = []; let fenced = false
  for (const line of markdown.split('\n')) {
    if (/^\s*```/.test(line)) { fenced = !fenced; continue }
    if (fenced) continue
    const m = line.match(/^(##|###)\s+(.+?)\s*#*\s*$/)
    if (m) out.push({ id: slugifyHeading(m[2]), label: m[2].trim(), level: m[1].length as 2 | 3 })
  }
  return out
}
```

The `Md`/`ChapterBody` renderer must emit matching `id`s on `h2`/`h3`. Check `src/components/ui/md-shared.tsx` `getMdComponents`: if headings already get ids (rehype-slug), confirm the slug rule matches `slugifyHeading`; otherwise add an `h2`/`h3` component override that sets `id={slugifyHeading(String(children))}` in the reader's markdown components (pass via `components` prop or a `variant="reader"`).

- [ ] **Step 4: Run test → PASS. Commit**

```bash
git add supabase/migrations/20260908091000_learn_chapter_hero.sql src/lib/reading/headings.ts tests/lib/reading/headings.test.ts
git commit -m "feat(density): chapter hero column and markdown heading extraction"
```

---

### Task 2: Reader chrome context and shared header

**Files:**
- Create: `src/components/shell-v2/ReaderChromeContext.tsx`, `src/components/density/reader/ReaderHeader.tsx`, `HeroImageSlot.tsx`, `useReadingProgressReporter.ts`
- Modify: `src/components/shell-v2/ShellV2.tsx`

- [ ] **Step 1: Context**

```tsx
// src/components/shell-v2/ReaderChromeContext.tsx
'use client'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
interface Slots { left?: ReactNode; right?: ReactNode }
const Ctx = createContext<{ slots: Slots; setSlots: (s: Slots) => void }>({ slots: {}, setSlots: () => {} })
export function ReaderChromeProvider({ children }: { children: ReactNode }) { const [slots, setSlots] = useState<Slots>({}); return <Ctx.Provider value={{ slots, setSlots }}>{children}</Ctx.Provider> }
export function useReaderChromeSlots() { return useContext(Ctx).slots }
/** Pages call this to put a back link (left) and actions (right) in the 48px top bar while mounted. */
export function useReaderChrome(slots: Slots) { const { setSlots } = useContext(Ctx); useEffect(() => { setSlots(slots); return () => setSlots({}) }, [slots.left, slots.right]) } // eslint-disable-line react-hooks/exhaustive-deps
```

In `ShellV2.tsx`: wrap the tree in `<ReaderChromeProvider>` and pass `leftSlot={topLeft ?? slots.left}` / `rightSlot={topRight ?? slots.right}` (read `useReaderChromeSlots()` inside a small inner component so the provider is above it).

- [ ] **Step 2: `ReaderHeader` and `HeroImageSlot`**

```tsx
// src/components/density/reader/ReaderHeader.tsx
export function ReaderHeader({ eyebrow, title, lede }: { eyebrow: string; title: string; lede?: string }) {
  return (<header className="mb-4"><div className="mb-2 text-[11px] font-bold uppercase tracking-[.08em] text-primary">{eyebrow}</div><h1 className="font-headline text-[34px] font-bold leading-[1.15]">{title}</h1>{lede && <p className="mt-2.5 font-headline text-[18px] leading-[1.4] text-on-surface-variant">{lede}</p>}</header>)
}
```

```tsx
// src/components/density/reader/HeroImageSlot.tsx
import { GeoArt } from '@/components/density/GeoArt'
export function HeroImageSlot({ src, alt, seed, height = 180 }: { src?: string | null; alt?: string; seed: string; height?: number }) {
  return src
    ? <img src={src} alt={alt ?? ''} width={700} height={height} className="mb-5 w-full rounded-2xl object-cover" style={{ height }} data-testid="reader-hero" />
    : <GeoArt seed={seed} height={height} className="mb-5 rounded-2xl" data-testid="reader-hero"><i className="absolute block rounded-xl" style={{ left: 60, top: 30, width: 280, height: 100, background: '#9db8a0', transform: 'rotate(-12deg)' }} /><i className="absolute block rounded-xl" style={{ left: 30, top: 80, width: 220, height: 80, background: '#eae3cf', transform: 'rotate(-12deg)' }} /></GeoArt>
}
```

(`GeoArt` forwards unknown props? It does not; add `...rest` spreading onto the outer div in `GeoArt.tsx` so `data-testid` passes through.)

- [ ] **Step 3: Progress reporter hook**

```ts
// src/components/density/reader/useReadingProgressReporter.ts
'use client'
import { useEffect, useMemo } from 'react'
import { createProgressReporter, type ReadingContentType } from '@/lib/reading/progress-client'
/** Reports scroll progress (0..1 over the article) and the active heading id, debounced, to /api/reading-progress + localStorage. */
export function useReadingProgressReporter(opts: { contentType: ReadingContentType; parentId: string; contentId: string; activeId: string | null; articleRef: React.RefObject<HTMLElement | null> }) {
  const report = useMemo(() => createProgressReporter({ contentType: opts.contentType, parentId: opts.parentId, contentId: opts.contentId }), [opts.contentType, opts.parentId, opts.contentId])
  useEffect(() => {
    const onScroll = () => {
      const el = opts.articleRef.current; if (!el) return
      const rect = el.getBoundingClientRect(); const total = rect.height - window.innerHeight
      const pct = total <= 0 ? 1 : Math.min(1, Math.max(0, -rect.top / total))
      report(pct, opts.activeId)
    }
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true }); return () => window.removeEventListener('scroll', onScroll)
  }, [report, opts.activeId, opts.articleRef])
}
```

- [ ] **Step 4: Typecheck, commit**

```bash
git add src/components/shell-v2/ReaderChromeContext.tsx src/components/shell-v2/ShellV2.tsx src/components/density/reader src/components/density/GeoArt.tsx
git commit -m "feat(density): reader chrome slots, header, hero slot, progress reporter"
```

---

### Task 3: `ModuleReaderV2`

**Files:**
- Create: `src/components/density/reader/ModuleReaderV2.tsx`
- Modify: `src/app/(app)/explore/modules/[slug]/page.tsx`

- [ ] **Step 1: Component**

Props mirror what `ReadingColumn` receives today (`module`, `chapters` with `is_completed`/`is_unlocked`, `data` = active chapter with `body_mdx`, `figures`, `hook_text`, `sort_order`, `title`, `subtitle`, `slug`, `hero_image_url`), plus `onSelectChapter(slug)` and `markComplete()` from `useLearnChapter`.

```tsx
// src/components/density/reader/ModuleReaderV2.tsx
'use client'
import Link from 'next/link'
import { useMemo, useRef } from 'react'
import { Bookmark } from 'lucide-react'
import { ChapterBody } from '@/components/learning/ChapterBody'
import { ReaderFrame } from '@/components/density/ReaderFrame'
import { RightToc } from '@/components/density/RightToc'
import { useActiveHeading } from '@/components/density/useActiveHeading'
import { useReaderChrome } from '@/components/shell-v2/ReaderChromeContext'
import { extractHeadings } from '@/lib/reading/headings'
import { ReaderHeader } from './ReaderHeader'
import { HeroImageSlot } from './HeroImageSlot'
import { useReadingProgressReporter } from './useReadingProgressReporter'

export function ModuleReaderV2({ module, chapters, data, onSelectChapter, markComplete, completing }: { module: any; chapters: any[]; data: any; onSelectChapter: (slug: string) => void; markComplete: () => Promise<void> | void; completing?: boolean }) {
  const articleRef = useRef<HTMLElement>(null)
  const headings = useMemo(() => extractHeadings(data.body_mdx ?? ''), [data.body_mdx])
  const activeId = useActiveHeading(headings.map(h => h.id))
  const completed = chapters.filter(c => c.is_completed).length
  const idx = chapters.findIndex(c => c.slug === data.slug)
  const next = chapters[idx + 1]
  useReaderChrome({
    left: <Link href="/explore/modules" data-testid="reader-back" className="rounded-full border border-hairline bg-card-bright px-3 py-1 text-[12px] font-semibold">← All guides</Link>,
    right: <button type="button" data-testid="reader-complete" disabled={data.is_completed || completing} onClick={() => markComplete()} className="flex items-center gap-1.5 rounded-full border border-hairline bg-card-bright px-3 py-1 text-[12px] font-semibold disabled:opacity-60"><Bookmark size={13} aria-hidden />{data.is_completed ? 'Completed' : completing ? 'Saving…' : 'Mark complete'}</button>,
  })
  useReadingProgressReporter({ contentType: 'module_chapter', parentId: module.slug, contentId: data.slug, activeId, articleRef })
  return (
    <ReaderFrame toc={<RightToc progressPct={module.chapter_count ? (completed / module.chapter_count) * 100 : 0} activeId={activeId} onSelect={() => {}} groups={[
      { label: `Chapter ${data.sort_order} of ${module.chapter_count}`, items: chapters.map(c => ({ id: `ch-${c.slug}`, label: c.title, done: c.is_completed, href: c.is_unlocked || c.is_completed ? `/explore/modules/${module.slug}?chapter=${c.slug}` : undefined })) },
      { label: 'On this page', items: headings.map(h => ({ id: h.id, label: h.label })) },
    ]} />}>
      <div ref={articleRef as React.RefObject<HTMLDivElement>} data-hatch-page-type="learning_module" data-hatch-entity-id={module.slug} data-hatch-active-chapter={data.slug}>
        <ReaderHeader eyebrow={`${module.name} · Chapter ${data.sort_order} of ${module.chapter_count}`} title={data.title} lede={data.hook_text || data.subtitle} />
        <HeroImageSlot src={data.hero_image_url} seed={`${module.slug}/${data.slug}`} />
        <ChapterBody body_mdx={data.body_mdx} figures={data.figures ?? []} hatchContextLabel="Active chapter body" />
        <footer className="mt-8 flex items-center justify-between border-t border-hairline pt-4">
          <Link href="/explore/modules" className="text-[13px] font-semibold text-ink-secondary">All guides</Link>
          {next && (next.is_unlocked || next.is_completed || data.is_completed) ? <button type="button" data-testid="reader-next" onClick={() => onSelectChapter(next.slug)} className="rounded-full bg-forest-800 px-4 py-2 text-[13px] font-bold text-white">Next: {next.title} →</button> : !data.is_completed ? <button type="button" onClick={() => markComplete()} className="rounded-full bg-forest-800 px-4 py-2 text-[13px] font-bold text-white">Mark chapter complete</button> : null}
        </footer>
      </div>
    </ReaderFrame>
  )
}
```

Chapter items in the TOC use `href` (real navigation via `?chapter=`), so `RightToc` renders anchors for them; on-page headings use scroll buttons. The `RightToc` active state for chapters: pass `activeId` as the heading id; chapter rows show ✓ from `done`. If you want the current chapter highlighted too, compare `c.slug === data.slug` and set `label` with a leading "▸".

- [ ] **Step 2: Page branch**

In `src/app/(app)/explore/modules/[slug]/page.tsx` (L280-349, the render): import `useUiShell` and `ModuleReaderV2`; when `density` is true return `<ModuleReaderV2 module={module} chapters={chapters} data={data} onSelectChapter={handleSelectChapter} markComplete={markComplete} completing={completing} />` instead of the `TocRail` + `ReadingColumn` block, keeping the mobile `<select id="guide-chapter">` chapter picker above it below `xl`. `handleSelectChapter` (L248-253) already does `router.replace(?chapter=)` + scroll + `EVENT_CHAPTER_OPENED`. Ensure the chapter API (`GET /api/learn/[slug]/[chapter]`, `select('*')`) now returns `hero_image_url` (it does, since `select('*')`).

- [ ] **Step 3: Verify**: `/explore/modules/context-engineering` flag on: rail collapsed, back link and "Mark complete" in the top bar, h1 top ≤ 120, hero slot visible, right TOC with 7 chapter rows + page headings, clicking a heading scrolls, `GET /api/reading-progress` returns a `module_chapter` row after scrolling. Commit:

```bash
git add src/components/density/reader/ModuleReaderV2.tsx src/app/(app)/explore/modules/[slug]/page.tsx
git commit -m "feat(density): ModuleReaderV2"
```

**Wiring table:** back → `/explore/modules`; Mark complete → `POST /api/learn/[slug]/[chapter]/complete` (existing `markComplete`); chapter rows → `?chapter=`; headings → scroll; Next → `handleSelectChapter`; scroll → `PUT /api/reading-progress`.

---

### Task 4: `AutopsyReaderV2`

**Files:**
- Create: `src/components/density/reader/AutopsyReaderV2.tsx`
- Modify: `src/components/showcase/reader/CinematicReader.tsx`

- [ ] **Step 1: Component** (reuses the section renderers and `BookmarkToggle`)

```tsx
// src/components/density/reader/AutopsyReaderV2.tsx
'use client'
import Link from 'next/link'
import { useRef } from 'react'
import { ReaderFrame } from '@/components/density/ReaderFrame'
import { RightToc } from '@/components/density/RightToc'
import { useActiveHeading } from '@/components/density/useActiveHeading'
import { useReaderChrome } from '@/components/shell-v2/ReaderChromeContext'
import { BookmarkToggle } from '@/components/showcase/reader/BookmarkToggle'
import { ReaderHeader } from './ReaderHeader'
import { HeroImageSlot } from './HeroImageSlot'
import { useReadingProgressReporter } from './useReadingProgressReporter'

export function AutopsyReaderV2({ story, companyName, initialBookmarked, sectionIds, tocItems, coverUrl, children }: { story: { companySlug: string; slug: string; title: string; dek: string; estimatedReadTime: string; tags?: string[] }; companyName: string; initialBookmarked: boolean; sectionIds: string[]; tocItems: Array<{ id: string; label: string }>; coverUrl?: string | null; children: React.ReactNode }) {
  const articleRef = useRef<HTMLElement>(null)
  const activeId = useActiveHeading(sectionIds)
  const idx = Math.max(0, sectionIds.indexOf(activeId ?? ''))
  useReaderChrome({
    left: <Link href={`/explore/autopsies/${story.companySlug}`} data-testid="reader-back" className="rounded-full border border-hairline bg-card-bright px-3 py-1 text-[12px] font-semibold">← {companyName}</Link>,
    right: <BookmarkToggle companySlug={story.companySlug} storySlug={story.slug} initialBookmarked={initialBookmarked} />,
  })
  useReadingProgressReporter({ contentType: 'autopsy_story', parentId: story.companySlug, contentId: story.slug, activeId, articleRef })
  return (
    <ReaderFrame toc={<RightToc progressPct={sectionIds.length ? (idx / (sectionIds.length - 1)) * 100 : 0} activeId={activeId} groups={[{ label: 'In this autopsy', items: tocItems.map((t, i) => ({ id: t.id, label: `${String(i + 1).padStart(2, '0')} ${t.label}` })) }]} />}>
      <div ref={articleRef as React.RefObject<HTMLDivElement>}>
        <ReaderHeader eyebrow={`Product autopsy · ${(story.tags ?? [])[0] ?? companyName} · ${story.estimatedReadTime}`} title={story.title} lede={story.dek} />
        <HeroImageSlot src={coverUrl} seed={`${story.companySlug}/${story.slug}`} height={150} />
        {children}
      </div>
    </ReaderFrame>
  )
}
```

Check `BookmarkToggle`'s props in `src/components/showcase/reader/BookmarkToggle.tsx` (48 lines) and match them.

- [ ] **Step 2: Branch in `CinematicReader`**

In `CinematicReader.tsx` (174 lines): compute `sectionIds` and `tocItems` as today (L42-61). When `useUiShell().density` is true, return `<AutopsyReaderV2 story={story} companyName={companyName} initialBookmarked={initialBookmarked} sectionIds={sectionIds} tocItems={tocItems} coverUrl={story.images?.find(i => i.role === 'social-cover')?.publicUrl ?? null}>{/* the same section list as L154-167: FlowSectionDark, QuickReadDark, … PrevNextChips */}</AutopsyReaderV2>`; skip the `reader-article-header`, the left `reader-outline` aside, the mobile `<details>`, and `ReaderDock`. Keep `useReaderResume` and the analytics events. Verify the image role name in `src/lib/autopsies/types.ts` (`AutopsyImageRole` includes `'social-cover'`) and the field name for the URL (`publicUrl` vs `public_url`).

- [ ] **Step 3: Verify**: `/explore/autopsies/buffer/stories/buffer-fake-landing-page-mvp` flag on: no left outline, back "← Buffer" and Save in the top bar, h1 top ≤ 120, Beat 01 heading top ≤ 360 at 1440×900, right TOC with numbered beats, Save toggles (server action) and reload keeps the state, `GET /api/reading-progress` returns an `autopsy_story` row. Commit:

```bash
git add src/components/density/reader/AutopsyReaderV2.tsx src/components/showcase/reader/CinematicReader.tsx
git commit -m "feat(density): AutopsyReaderV2"
```

---

### Task 5: Readers E2E

**Files:**
- Create: `e2e/density/readers.spec.ts`

- [ ] **Step 1: Spec**

```ts
import { test, expect } from '@playwright/test'
import { VIEWPORTS, loginViaApi, gotoReady, topOf, expectNoConsoleErrors } from './helpers'

test.describe('readers', () => {
  test.beforeEach(async ({ page }) => { await loginViaApi(page); await page.setViewportSize(VIEWPORTS.desktop) })

  test('module reader', async ({ page }) => {
    await expectNoConsoleErrors(page, async () => { await gotoReady(page, '/explore/modules/context-engineering') })
    await expect(page.getByTestId('shell-sidebar')).toHaveAttribute('data-collapsed', 'true')
    await expect(page.getByTestId('reader-back')).toHaveAttribute('href', '/explore/modules')
    expect(await topOf(page, 'article h1')).toBeLessThanOrEqual(130)
    await expect(page.getByTestId('reader-hero')).toBeVisible()
    const toc = page.getByTestId('right-toc'); await expect(toc).toBeVisible(); expect(await toc.locator('a').count()).toBeGreaterThanOrEqual(5)
    const headingBtn = toc.locator('button').first(); if (await headingBtn.count()) { await headingBtn.click(); await page.waitForTimeout(600); expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(50) }
    await page.mouse.wheel(0, 1500); await page.waitForTimeout(2000)
    const rows = await page.request.get('/api/reading-progress?limit=5').then(r => r.json()); expect(rows.rows.some((r: any) => r.content_type === 'module_chapter' && r.parent_id === 'context-engineering')).toBe(true)
    await toc.locator('a').nth(1).click(); await expect(page).toHaveURL(/\?chapter=/)
  })

  test('autopsy reader', async ({ page }) => {
    await gotoReady(page, '/explore/autopsies/buffer/stories/buffer-fake-landing-page-mvp')
    await expect(page.locator('.reader-outline')).toHaveCount(0)
    await expect(page.getByTestId('reader-back')).toHaveAttribute('href', '/explore/autopsies/buffer')
    expect(await topOf(page, 'article h1')).toBeLessThanOrEqual(130)
    await expect(page.getByTestId('right-toc')).toBeVisible()
    const save = page.getByRole('button', { name: /save|saved/i }).first(); const before = await save.textContent(); await save.click(); await page.waitForTimeout(800); await page.reload(); await gotoReady(page, '/explore/autopsies/buffer/stories/buffer-fake-landing-page-mvp'); expect(await page.getByRole('button', { name: /save|saved/i }).first().textContent()).not.toBe(before)
    await page.getByRole('button', { name: /save|saved/i }).first().click() // restore
  })

  test('mobile: no toc column, chrome present', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile); await gotoReady(page, '/explore/modules/context-engineering')
    await expect(page.getByTestId('right-toc')).toBeHidden(); await expect(page.locator('#guide-chapter')).toBeVisible()
  })
})
```

- [ ] **Step 2: Run** → 3 passed. Commit: `git add e2e/density/readers.spec.ts && git commit -m "test(density): readers E2E"`.

## Self-review
- Spec §3.5 and §4.6/4.7 covered: rail forced (plan 01), top bar back/Save (Task 2 context), header + hero slot (Task 2/3/4), right TOC with progress (Tasks 3/4), reading progress persisted (Task 2/3/4), left indexes removed (Task 3/4), mobile TOC = existing chapter `<select>` for modules and the story's existing `useReaderResume`; a TOC sheet for autopsies on mobile is out of scope for this pass since `RightToc` hides below `xl` and the beats remain scrollable.

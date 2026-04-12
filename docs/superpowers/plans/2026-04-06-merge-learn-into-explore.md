# Merge Learn into Explore — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the redundant "Learn" section by merging its unique content (modules, domains, FLOW framework, personalised study plans) into the "Explore" section, reducing top-level nav from 6 to 5 items.

**Architecture:** Move Learn page files into Explore's route tree. Merge Learn hub's unique sections (FLOW hero, modules, domains) into Explore hub page. Add `/learn/*` → `/explore/*` redirects in next.config.ts. Update all internal links.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4

---

### Task 1: Update NavRail — Remove "Learn" nav item

**Files:**
- Modify: `src/components/shell/NavRail.tsx:6-12`

- [ ] **Step 1: Remove "Learn" from navItems array**

```tsx
const navItems = [
  { href: '/dashboard',   icon: 'home',           label: 'Home'     },
  { href: '/explore',     icon: 'explore',        label: 'Explore'  },
  { href: '/challenges',  icon: 'fitness_center', label: 'Practice' },
  { href: '/progress',    icon: 'bar_chart',      label: 'Progress' },
]
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No new errors related to NavRail

- [ ] **Step 3: Commit**

```bash
git add src/components/shell/NavRail.tsx
git commit -m "refactor: remove Learn from NavRail, merge into Explore"
```

---

### Task 2: Update BottomTabs — Remove "Learn" tab

**Files:**
- Modify: `src/components/shell/BottomTabs.tsx:5-11`

- [ ] **Step 1: Remove "Learn" from tabs array**

```tsx
const tabs = [
  { href: '/dashboard',  icon: 'home',           label: 'Home'     },
  { href: '/explore',    icon: 'explore',        label: 'Explore'  },
  { href: '/challenges', icon: 'fitness_center', label: 'Practice' },
  { href: '/progress',   icon: 'bar_chart',      label: 'Progress' },
]
```

- [ ] **Step 2: Commit**

```bash
git add src/components/shell/BottomTabs.tsx
git commit -m "refactor: remove Learn from BottomTabs"
```

---

### Task 3: Move Learn sub-pages into Explore route tree

**Files:**
- Move: `src/app/(app)/learn/flow/page.tsx` → `src/app/(app)/explore/flow/page.tsx`
- Move: `src/app/(app)/learn/modules/page.tsx` → `src/app/(app)/explore/modules/page.tsx`
- Move: `src/app/(app)/learn/[slug]/page.tsx` → `src/app/(app)/explore/modules/[slug]/page.tsx`
- Move: `src/app/(app)/learn/[slug]/[chapter]/page.tsx` → `src/app/(app)/explore/modules/[slug]/[chapter]/page.tsx`
- Move: `src/app/(app)/learn/domains/page.tsx` → `src/app/(app)/explore/domains/page.tsx`
- Delete: `src/app/(app)/learn/plans/page.tsx` (redundant — `/explore/plans` already exists)
- Delete: `src/app/(app)/learn/plans/[slug]/page.tsx` (redundant — `/explore/plans/[slug]` already exists)
- Delete: `src/app/(app)/learn/page.tsx` (hub merged into Explore hub)

- [ ] **Step 1: Create new directories**

```bash
mkdir -p src/app/\(app\)/explore/flow
mkdir -p src/app/\(app\)/explore/modules/\[slug\]/\[chapter\]
mkdir -p src/app/\(app\)/explore/domains
```

- [ ] **Step 2: Move FLOW page**

```bash
cp src/app/\(app\)/learn/flow/page.tsx src/app/\(app\)/explore/flow/page.tsx
```

- [ ] **Step 3: Move modules gallery page**

```bash
cp src/app/\(app\)/learn/modules/page.tsx src/app/\(app\)/explore/modules/page.tsx
```

- [ ] **Step 4: Move module detail page**

```bash
cp src/app/\(app\)/learn/\[slug\]/page.tsx src/app/\(app\)/explore/modules/\[slug\]/page.tsx
```

- [ ] **Step 5: Move chapter redirect page**

```bash
cp src/app/\(app\)/learn/\[slug\]/\[chapter\]/page.tsx src/app/\(app\)/explore/modules/\[slug\]/\[chapter\]/page.tsx
```

- [ ] **Step 6: Move domains gallery page**

```bash
cp src/app/\(app\)/learn/domains/page.tsx src/app/\(app\)/explore/domains/page.tsx
```

- [ ] **Step 7: Delete entire learn directory**

```bash
rm -rf src/app/\(app\)/learn
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor: move learn sub-pages into explore route tree"
```

---

### Task 4: Update internal links in moved files

All moved files contain breadcrumb and navigation links pointing to `/learn/*`. Update them to point to `/explore/*`.

**Files:**
- Modify: `src/app/(app)/explore/flow/page.tsx:605` — change `href="/learn"` → `href="/explore"`
- Modify: `src/app/(app)/explore/modules/page.tsx:19` — change `href="/learn/${module.slug}"` → `href="/explore/modules/${module.slug}"`
- Modify: `src/app/(app)/explore/modules/page.tsx:50` — change `href="/learn"` → `href="/explore"`
- Modify: `src/app/(app)/explore/modules/[slug]/page.tsx:265` — change `href="/learn/${nm.slug}"` → `href="/explore/modules/${nm.slug}"`
- Modify: `src/app/(app)/explore/modules/[slug]/page.tsx:304` — change `router.replace("/learn/${slug}?chapter=${chSlug}")` → `router.replace("/explore/modules/${slug}?chapter=${chSlug}")`
- Modify: `src/app/(app)/explore/modules/[slug]/page.tsx:333` — change `href="/learn"` → `href="/explore"` and text "← Back to Learn" → "← Back to Explore"
- Modify: `src/app/(app)/explore/modules/[slug]/page.tsx:346` — change `href="/learn"` → `href="/explore"` and text "All modules"
- Modify: `src/app/(app)/explore/modules/[slug]/[chapter]/page.tsx:15` — change `router.replace("/learn/${slug}?chapter=${chapter}")` → `router.replace("/explore/modules/${slug}?chapter=${chapter}")`
- Modify: `src/app/(app)/explore/domains/page.tsx:10` — change `href="/learn"` → `href="/explore"`

- [ ] **Step 1: Update explore/flow/page.tsx**

Find the back link to `/learn` and change to `/explore`:
```tsx
// Old:
<Link href="/learn" className="flex items-center gap-1 ...
// New:
<Link href="/explore" className="flex items-center gap-1 ...
```

- [ ] **Step 2: Update explore/modules/page.tsx**

Change module card link pattern and breadcrumb:
```tsx
// Old (line ~19, ModuleCard):
<Link href={`/learn/${module.slug}`} ...
// New:
<Link href={`/explore/modules/${module.slug}`} ...

// Old (line ~50, breadcrumb):
<Link href="/learn" ...>Learn</Link>
// New:
<Link href="/explore" ...>Explore</Link>
```

- [ ] **Step 3: Update explore/modules/[slug]/page.tsx**

Change all /learn references:
```tsx
// AfterThisModule component — module links:
// Old:
href={`/learn/${nm.slug}`}
// New:
href={`/explore/modules/${nm.slug}`}

// handleSelectChapter — router.replace:
// Old:
router.replace(`/learn/${slug}?chapter=${chSlug}`, { scroll: false })
// New:
router.replace(`/explore/modules/${slug}?chapter=${chSlug}`, { scroll: false })

// Error state back link:
// Old:
<Link href="/learn" className="text-primary text-sm mt-2 inline-block">← Back to Learn</Link>
// New:
<Link href="/explore" className="text-primary text-sm mt-2 inline-block">← Back to Explore</Link>

// Breadcrumb "All modules" link:
// Old:
href="/learn"
// New:
href="/explore"
```

- [ ] **Step 4: Update explore/modules/[slug]/[chapter]/page.tsx**

```tsx
// Old:
router.replace(`/learn/${slug}?chapter=${chapter}`)
// New:
router.replace(`/explore/modules/${slug}?chapter=${chapter}`)
```

- [ ] **Step 5: Update explore/domains/page.tsx**

```tsx
// Old breadcrumb:
<Link href="/learn" ...>Learn</Link>
// New:
<Link href="/explore" ...>Explore</Link>
```

- [ ] **Step 6: Verify no TypeScript errors**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No new errors

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor: update internal links in moved learn pages to /explore"
```

---

### Task 5: Merge Learn hub content into Explore hub page

The Learn hub had 4 unique sections not in Explore: FLOW Framework hero, Course Modules scroll, Domains scroll, and a Luma nudge. Add these to the Explore hub between the Paradigms section and the Product Autopsies section.

**Files:**
- Modify: `src/app/(app)/explore/page.tsx`

- [ ] **Step 1: Add server-side data fetching for modules and domains**

At the top of the file, add imports and fetch functions for modules and domains. The modules use `/api/learn` and domains use `/api/domains`.

Add to imports section:
```tsx
import type { StudyPlan, AutopsyProduct, DomainWithProgress } from '@/lib/types'
```

Add two fetcher functions after `fetchStudyPlans()`:
```tsx
interface ModuleSummary {
  id: string
  slug: string
  name: string
  tagline: string
  cover_color: string | null
  chapter_count: number
  est_minutes: number
}

async function fetchModules(): Promise<ModuleSummary[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/learn?limit=8`, { next: { revalidate: 300 } })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : (data.modules ?? [])
  } catch {
    return []
  }
}

async function fetchDomains(): Promise<DomainWithProgress[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/domains`, { next: { revalidate: 300 } })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : (data.domains ?? [])
  } catch {
    return []
  }
}
```

- [ ] **Step 2: Fetch modules and domains in the page component**

Update the `Promise.all` in `ExplorePage`:
```tsx
const [studyPlans, showcaseProducts, modules, domains] = await Promise.all([
  fetchStudyPlans().catch(() => [] as Awaited<ReturnType<typeof fetchStudyPlans>>),
  getShowcaseProducts().catch(() => [] as AutopsyProduct[]),
  fetchModules().catch(() => [] as ModuleSummary[]),
  fetchDomains().catch(() => [] as DomainWithProgress[]),
])
```

- [ ] **Step 3: Add FLOW Framework hero section**

Insert after the Paradigms grid (`</div>` closing the paradigms grid) and before the Product Autopsies section:

```tsx
{/* ── FLOW Framework ── */}
<Link
  href="/explore/flow"
  className="flex flex-col gap-3 bg-primary-fixed rounded-2xl p-5 hover:brightness-95 transition-all group"
>
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <LumaGlyph size={28} state="speaking" className="text-primary shrink-0" />
      <div>
        <div className="font-headline font-bold text-base text-on-surface">The FLOW Framework</div>
        <div className="font-label text-xs text-on-surface-variant">How HackProduct challenges are structured</div>
      </div>
    </div>
    <span className="material-symbols-outlined text-base text-primary opacity-0 group-hover:opacity-100 transition-opacity" style={{ fontVariationSettings: "'FILL' 0" }}>arrow_forward</span>
  </div>
  <div className="flex gap-2 flex-wrap">
    {[
      { symbol: '◇', label: 'Frame', color: '#2e7d32', bg: '#e8f5e9' },
      { symbol: '◈', label: 'List', color: '#1565c0', bg: '#e3f2fd' },
      { symbol: '◆', label: 'Optimize', color: '#ad1457', bg: '#fce4ec' },
      { symbol: '◎', label: 'Win', color: '#f57f17', bg: '#fff8e1' },
    ].map(m => (
      <span key={m.label} className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-label font-bold" style={{ background: m.bg, color: m.color }}>
        {m.symbol} {m.label}
      </span>
    ))}
  </div>
  <p className="font-label text-xs font-bold text-primary">Learn how FLOW works →</p>
</Link>
```

- [ ] **Step 4: Add Course Modules horizontal scroll section**

Insert after the FLOW Framework hero:

```tsx
{/* ── Course Modules ── */}
{modules.length > 0 && (
  <section>
    <div className="flex items-center justify-between mb-3">
      <h2 className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant">Course Modules</h2>
      <Link href="/explore/modules" className="font-label text-xs font-bold text-primary hover:underline">View all →</Link>
    </div>
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {modules.map(m => (
        <Link key={m.id} href={`/explore/modules/${m.slug}`} className="flex flex-col gap-2 bg-surface-container rounded-xl p-4 shrink-0 w-44 hover:bg-surface-container-high transition-colors">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: (m.cover_color ?? '#4a7c59') + '33' }}>
            <span className="material-symbols-outlined text-base" style={{ color: m.cover_color ?? '#4a7c59', fontVariationSettings: "'FILL' 0" }}>auto_stories</span>
          </div>
          <div className="font-label text-sm font-bold text-on-surface leading-snug line-clamp-2">{m.name}</div>
          <div className="font-body text-xs text-on-surface-variant line-clamp-1">{m.tagline}</div>
          <div className="font-label text-[10px] text-on-surface-variant mt-auto">~{m.est_minutes} min</div>
        </Link>
      ))}
    </div>
  </section>
)}
```

- [ ] **Step 5: Add Domains horizontal scroll section**

Insert after the Course Modules section:

```tsx
{/* ── Domains ── */}
{domains.length > 0 && (
  <section>
    <div className="flex items-center justify-between mb-3">
      <h2 className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant">Domains</h2>
      <Link href="/explore/domains" className="font-label text-xs font-bold text-primary hover:underline">View all →</Link>
    </div>
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {domains.slice(0, 10).map(d => (
        <Link key={d.id} href={`/domains/${d.slug}`} className="flex flex-col items-center gap-1.5 shrink-0 w-20 py-3 px-2 rounded-xl hover:bg-surface-container transition-colors text-center">
          <div className="w-11 h-11 rounded-2xl bg-primary-fixed flex items-center justify-center">
            <span className="material-symbols-outlined text-xl text-primary" style={{ fontVariationSettings: "'FILL' 0" }}>{d.icon ?? 'category'}</span>
          </div>
          <span className="font-label text-xs font-bold text-on-surface leading-tight">{d.title}</span>
          <span className="font-label text-[10px] text-on-surface-variant">{d.challenge_count} challenges</span>
        </Link>
      ))}
    </div>
  </section>
)}
```

- [ ] **Step 6: Verify no TypeScript errors**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No new errors

- [ ] **Step 7: Commit**

```bash
git add src/app/\(app\)/explore/page.tsx
git commit -m "feat: merge learn hub content (FLOW, modules, domains) into explore hub"
```

---

### Task 6: Update external references to /learn

Several files outside the learn directory link to `/learn/*`. Update them all.

**Files:**
- Modify: `src/app/(app)/dashboard/CalibrationHero.tsx:67` — `/learn/flow` → `/explore/flow`
- Modify: `src/app/(marketing)/flow/page.tsx:444,459` — `/learn/flow` → `/explore/flow`
- Modify: `src/app/(app)/prep/study-plans/page.tsx` — redirect target `/learn/plans` → `/explore/plans`
- Modify: `src/middleware.ts:155` — add `/explore` recognition (already present), remove `/learn`

- [ ] **Step 1: Update CalibrationHero.tsx**

```tsx
// Old:
<Link href="/learn/flow" className="text-primary text-xs font-label font-bold hover:underline underline-offset-2">
// New:
<Link href="/explore/flow" className="text-primary text-xs font-label font-bold hover:underline underline-offset-2">
```

- [ ] **Step 2: Update marketing flow page**

In `src/app/(marketing)/flow/page.tsx`, change both occurrences:
```tsx
// Old (line ~444):
router.push('/learn/flow')
// New:
router.push('/explore/flow')

// Old (line ~459):
router.push('/learn/flow')
// New:
router.push('/explore/flow')
```

- [ ] **Step 3: Update prep study-plans redirect**

In `src/app/(app)/prep/study-plans/page.tsx`:
```tsx
// Old:
import { redirect } from 'next/navigation'
export default function Page() { redirect('/learn/plans') }
// New:
import { redirect } from 'next/navigation'
export default function Page() { redirect('/explore/plans') }
```

- [ ] **Step 4: Update middleware — remove /learn from app route check**

In `src/middleware.ts:152-155`, `/explore` is already listed. Remove `|| pathname.startsWith('/learn')`:
```tsx
// Old:
const isAppRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/explore')
  || pathname.startsWith('/challenges') || pathname.startsWith('/progress')
  || pathname.startsWith('/cohort') || pathname.startsWith('/prep')
  || pathname.startsWith('/settings') || pathname.startsWith('/learn')
// New:
const isAppRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/explore')
  || pathname.startsWith('/challenges') || pathname.startsWith('/progress')
  || pathname.startsWith('/cohort') || pathname.startsWith('/prep')
  || pathname.startsWith('/settings')
```

- [ ] **Step 5: Verify no TypeScript errors**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No new errors

- [ ] **Step 6: Commit**

```bash
git add src/app/\(app\)/dashboard/CalibrationHero.tsx src/app/\(marketing\)/flow/page.tsx src/app/\(app\)/prep/study-plans/page.tsx src/middleware.ts
git commit -m "refactor: update all external /learn links to /explore"
```

---

### Task 7: Add /learn/* → /explore/* redirects in next.config.ts

So that any old bookmarks or external links still work.

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Add learn → explore redirects**

Add these redirects to the existing `redirects()` array in `next.config.ts`:

```ts
// Learn → Explore redirects (merged sections)
{ source: '/learn', destination: '/explore', permanent: true },
{ source: '/learn/flow', destination: '/explore/flow', permanent: true },
{ source: '/learn/modules', destination: '/explore/modules', permanent: true },
{ source: '/learn/modules/:slug', destination: '/explore/modules/:slug', permanent: true },
{ source: '/learn/domains', destination: '/explore/domains', permanent: true },
{ source: '/learn/plans', destination: '/explore/plans', permanent: true },
{ source: '/learn/plans/:slug', destination: '/explore/plans/:slug', permanent: true },
{ source: '/learn/:slug', destination: '/explore/modules/:slug', permanent: true },
{ source: '/learn/:slug/:chapter', destination: '/explore/modules/:slug/:chapter', permanent: true },
```

Note: Order matters — more specific routes (`/learn/flow`, `/learn/modules`, `/learn/domains`, `/learn/plans`) must come before the catch-all `/learn/:slug` to prevent them from matching as module slugs.

- [ ] **Step 2: Also update the existing prep redirect**

The existing redirect `{ source: '/prep/study-plans', ... }` may need attention — but since we already updated the page component in Task 6, this is fine. No change needed here.

- [ ] **Step 3: Verify no TypeScript errors**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No new errors

- [ ] **Step 4: Commit**

```bash
git add next.config.ts
git commit -m "refactor: add /learn → /explore permanent redirects"
```

---

### Task 8: Update the existing /explore/plans study plan card links

The `StudyPlanCard` in `/learn/plans/page.tsx` (now deleted) linked to `/learn/plans/[slug]`. The existing `/explore/plans` page uses a `StudyPlanCard` component. Verify it links to `/explore/plans/[slug]` and not `/learn/plans/[slug]`.

**Files:**
- Check: `src/components/explore/StudyPlanCard.tsx`

- [ ] **Step 1: Read and verify StudyPlanCard links**

Read `src/components/explore/StudyPlanCard.tsx` and confirm it links to `/explore/plans/${slug}`. If it links elsewhere, update it.

- [ ] **Step 2: Commit if changes were needed**

```bash
git add src/components/explore/StudyPlanCard.tsx
git commit -m "fix: ensure StudyPlanCard links to /explore/plans"
```

---

### Task 9: Final verification

- [ ] **Step 1: Run TypeScript check**

Run: `npx tsc --noEmit 2>&1 | head -40`
Expected: Clean or only pre-existing errors in `supabase/functions/`

- [ ] **Step 2: Verify no remaining /learn references in app code**

Run: `grep -r '"/learn' src/ --include='*.tsx' --include='*.ts' | grep -v node_modules | grep -v '.next'`
Expected: No results (all references should now point to /explore)

- [ ] **Step 3: Verify the learn directory is fully removed**

Run: `ls src/app/\(app\)/learn 2>&1`
Expected: "No such file or directory"

- [ ] **Step 4: Test dev server starts cleanly**

Run: `npm run dev` — verify no startup errors, then kill the process.

- [ ] **Step 5: Commit any final fixes**

If any issues were found and fixed:
```bash
git add -A
git commit -m "fix: resolve remaining /learn references after merge"
```

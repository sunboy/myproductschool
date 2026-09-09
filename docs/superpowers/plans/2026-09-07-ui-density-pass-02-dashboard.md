# UI Density Pass 02: Dashboard (returning v4 and new user)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Requires plan 01 merged. Read `2026-09-07-ui-density-pass-00-master.md` for conventions.

**Goal:** Replace the 570px dashboard hero with the approved 240px four-cell hero (greeting, Continue · challenge, Continue · reading, A thought from Hatch), add cover-card shelves (practice areas with counts and rings, "Worth reading this week", study paths, Quick Take, week), and a new-user variant whose Continue slot is the calibration card and whose Hatch card carries the first-run actions.

**Architecture:** `src/app/(app)/dashboard/page.tsx` keeps `loadDashboard()` and adds `loadDensityExtras()` (practice-area counts, recent reading, editorial picks, three curated first reps). When `ui_density_v1` is on it renders `<DashboardV4 …/>` from `src/components/density/dashboard/`; otherwise the existing tree. All cards are presentational; data and hrefs are computed on the server.

**Tech Stack:** Next.js server components, Supabase admin client, density primitives from plan 01.

---

## File structure

Create:
- `src/lib/data/dashboard-density.ts` (+ `tests/lib/dashboard/dashboard-density.test.ts`)
- `src/components/density/dashboard/DashboardV4.tsx`
- `src/components/density/dashboard/HeroGrid.tsx`
- `src/components/density/dashboard/ContinueChallengeCard.tsx`
- `src/components/density/dashboard/ContinueReadingCard.tsx`
- `src/components/density/dashboard/CalibrationCard.tsx`
- `src/components/density/dashboard/HatchThoughtCard.tsx`
- `src/components/density/dashboard/PracticeAreaShelf.tsx`
- `src/components/density/dashboard/EditorialShelf.tsx`
- `src/components/density/dashboard/PathsRow.tsx`
- `src/components/density/dashboard/FirstRepsShelf.tsx`
- `e2e/density/dashboard.spec.ts`

Modify:
- `src/app/(app)/dashboard/page.tsx` (flag branch)
- `src/lib/onboarding/curated-first-rep.ts` (add `getCuratedFirstRepSlugs(role)` returning three)
- `src/components/redesign/dashboard/QuickTakePanel.tsx` (accept `compact` prop)

---

### Task 1: Data helpers for the density dashboard

**Files:**
- Create: `src/lib/data/dashboard-density.ts`
- Test: `tests/lib/dashboard/dashboard-density.test.ts`
- Modify: `src/lib/onboarding/curated-first-rep.ts`

- [ ] **Step 1: Failing tests for the pure parts**

```ts
// tests/lib/dashboard/dashboard-density.test.ts
import { describe, it, expect } from 'vitest'
import { pickEditorial, areaPct, PRACTICE_AREAS } from '@/lib/data/dashboard-density'
import { getCuratedFirstRepSlugs } from '@/lib/onboarding/curated-first-rep'

describe('dashboard-density', () => {
  it('lists six practice areas mapped to count disciplines', () => {
    expect(PRACTICE_AREAS.map(a => a.discipline)).toEqual(['algorithm','sql','system_design','data_modeling','analytics','product_sense'])
  })
  it('computes area completion percent', () => {
    expect(areaPct(12, 100)).toBe(12); expect(areaPct(0, 0)).toBe(0); expect(areaPct(3, 7)).toBe(43)
  })
  it('orders editorial picks: in progress, then saved, then newest', () => {
    const items = pickEditorial({
      inProgress: [{ kind: 'autopsy', id: 'a', title: 'A', href: '/a', readMins: 5, eyebrow: 'Autopsy · X' }],
      saved: [{ kind: 'autopsy', id: 'b', title: 'B', href: '/b', readMins: 6, eyebrow: 'Autopsy · Y' }],
      newest: [{ kind: 'module', id: 'c', title: 'C', href: '/c', readMins: 9, eyebrow: 'Module · Ch. 1' }, { kind: 'autopsy', id: 'a', title: 'A', href: '/a', readMins: 5, eyebrow: 'Autopsy · X' }, { kind: 'autopsy', id: 'd', title: 'D', href: '/d', readMins: 7, eyebrow: 'Autopsy · Z' }],
    }, 3)
    expect(items.map(i => i.id)).toEqual(['a','b','c'])
  })
  it('returns three distinct curated first reps per role', () => {
    const s = getCuratedFirstRepSlugs('swe')
    expect(s).toHaveLength(3); expect(new Set(s).size).toBe(3)
    expect(getCuratedFirstRepSlugs('unknown-role')).toHaveLength(3)
  })
})
```

- [ ] **Step 2: Run** (`npx vitest run tests/lib/dashboard`) → FAIL.

- [ ] **Step 3: Extend the curated-first-rep helper**

In `src/lib/onboarding/curated-first-rep.ts` add, after `getCuratedFirstRepSlug`:

```ts
/** Three curated first reps: the role's product-sense pick, one coding, one system design. */
export const FIRST_REP_CODING_SLUG = 'counting-distinct-senders-behind-support-ticket-aliases'
export const FIRST_REP_DESIGN_SLUG = 'url-shortener-at-10k-writes-per-second'

export function getCuratedFirstRepSlugs(role: string | null | undefined): [string, string, string] {
  return [getCuratedFirstRepSlug(role), FIRST_REP_CODING_SLUG, FIRST_REP_DESIGN_SLUG]
}
```

Verify the two slugs exist and are published: `select slug, challenge_type from challenges where slug in ('counting-distinct-senders-behind-support-ticket-aliases','url-shortener-at-10k-writes-per-second') and is_published;` If the design slug differs, pick any published `system_design` challenge with difficulty `medium` and use its slug; record the choice in the commit message.

- [ ] **Step 4: Implement the data module**

```ts
// src/lib/data/dashboard-density.ts
import { createAdminClient } from '@/lib/supabase/admin'
import { getChallengeCounts, type CountDiscipline } from '@/lib/data/challenges'
import { getLearnModuleSummaries } from '@/lib/data/learn-modules'
import { getPublishedAutopsyStories, getAutopsyCompanies } from '@/lib/autopsies/queries'
import { getUserBookmarks } from '@/lib/showcase/bookmarks'

export interface PracticeArea { discipline: Exclude<CountDiscipline, 'all'>; label: string; href: string; seed: string; artIndex: number }
export const PRACTICE_AREAS: PracticeArea[] = [
  { discipline: 'algorithm',     label: 'Coding / DSA',  href: '/challenges?discipline=algorithm',     seed: 'area-coding',  artIndex: 7 },
  { discipline: 'sql',           label: 'SQL & Data',    href: '/challenges?discipline=sql',           seed: 'area-sql',     artIndex: 3 },
  { discipline: 'system_design', label: 'System Design', href: '/challenges?discipline=system_design', seed: 'area-sd',      artIndex: 0 },
  { discipline: 'data_modeling', label: 'Data Modeling', href: '/challenges?discipline=data_modeling', seed: 'area-dm',      artIndex: 6 },
  { discipline: 'analytics',     label: 'AI Analytics',  href: '/challenges?discipline=analytics',     seed: 'area-ai',      artIndex: 5 },
  { discipline: 'product_sense', label: 'Product Sense', href: '/challenges?discipline=product_sense', seed: 'area-ps',      artIndex: 2 },
]

export function areaPct(completed: number, total: number) { return total > 0 ? Math.round((completed / total) * 100) : 0 }

export interface EditorialItem { kind: 'autopsy' | 'module'; id: string; title: string; href: string; readMins: number; eyebrow: string; sub?: string }

export function pickEditorial(src: { inProgress: EditorialItem[]; saved: EditorialItem[]; newest: EditorialItem[] }, n: number): EditorialItem[] {
  const out: EditorialItem[] = []; const seen = new Set<string>()
  for (const list of [src.inProgress, src.saved, src.newest]) for (const it of list) { if (out.length >= n) break; if (!seen.has(it.id)) { seen.add(it.id); out.push(it) } }
  return out
}

export interface AreaStat { discipline: PracticeArea['discipline']; total: number; completed: number }

/** Counts per discipline plus the user's completed count per discipline (challenge_attempts.status='completed'). */
export async function getAreaStats(userId: string): Promise<AreaStat[]> {
  const admin = createAdminClient()
  const [counts, { data: done }] = await Promise.all([
    getChallengeCounts({}),
    admin.from('challenge_attempts').select('challenge_id, challenges!inner(challenge_type)').eq('user_id', userId).eq('status', 'completed'),
  ])
  const typeToDiscipline = (t: string): PracticeArea['discipline'] | null =>
    t === 'algorithm' ? 'algorithm' : t === 'sql' ? 'sql' : t === 'system_design' ? 'system_design' : t === 'data_modeling' ? 'data_modeling' : ['flow','freeform','quick_take'].includes(t) ? 'product_sense' : t?.startsWith('cc') || t === 'analytics' ? 'analytics' : null
  const completedBy = new Map<string, Set<string>>()
  for (const row of (done ?? []) as Array<{ challenge_id: string; challenges: { challenge_type: string } | null }>) {
    const d = typeToDiscipline(row.challenges?.challenge_type ?? ''); if (!d) continue
    if (!completedBy.has(d)) completedBy.set(d, new Set()); completedBy.get(d)!.add(row.challenge_id)
  }
  return PRACTICE_AREAS.map(a => ({ discipline: a.discipline, total: (counts as Record<string, number>)[a.discipline] ?? 0, completed: completedBy.get(a.discipline)?.size ?? 0 }))
}

/** Recent reading rows joined to titles. */
export async function getContinueReading(userId: string): Promise<{ kind: 'module' | 'autopsy'; title: string; sub: string; href: string; progress: number } | null> {
  const admin = createAdminClient()
  const { data } = await admin.from('reading_progress').select('content_type, parent_id, content_id, progress').eq('user_id', userId).gt('progress', 0).lt('progress', 0.98).order('updated_at', { ascending: false }).limit(1).maybeSingle()
  if (!data) return null
  if (data.content_type === 'module_chapter') {
    const { data: mod } = await admin.from('learn_modules').select('id, name, chapter_count').eq('slug', data.parent_id).maybeSingle()
    if (!mod) return null
    const { data: ch } = await admin.from('learn_chapters').select('title, sort_order, est_minutes').eq('module_id', mod.id).eq('slug', data.content_id).maybeSingle()
    if (!ch) return null
    const left = Math.max(1, Math.round(((ch as { est_minutes?: number }).est_minutes ?? 8) * (1 - Number(data.progress))))
    return { kind: 'module', title: ch.title, sub: `${mod.name} · chapter ${ch.sort_order} of ${mod.chapter_count} · ${left} min left`, href: `/explore/modules/${data.parent_id}?chapter=${data.content_id}`, progress: Number(data.progress) }
  }
  const stories = await getPublishedAutopsyStories()
  const story = stories.find(s => s.companySlug === data.parent_id && s.slug === data.content_id)
  if (!story) return null
  return { kind: 'autopsy', title: story.title, sub: `Autopsy · ${story.estimatedReadTime}`, href: `/explore/autopsies/${data.parent_id}/stories/${data.content_id}`, progress: Number(data.progress) }
}

export async function getEditorialShelf(userId: string): Promise<{ featured: EditorialItem | null; items: EditorialItem[] }> {
  const admin = createAdminClient()
  const [stories, companies, bookmarks, modules, { data: recent }] = await Promise.all([
    getPublishedAutopsyStories(), getAutopsyCompanies(), getUserBookmarks(false).catch(() => []), getLearnModuleSummaries().catch(() => []),
    admin.from('reading_progress').select('content_type, parent_id, content_id, progress').eq('user_id', userId).gt('progress', 0).lt('progress', 0.98).order('updated_at', { ascending: false }).limit(6),
  ])
  const companyName = (slug: string) => companies.find(c => c.slug === slug)?.name ?? slug
  const mins = (s: string | undefined) => Number((s ?? '').match(/\d+/)?.[0] ?? 6)
  const toAutopsy = (s: typeof stories[number]): EditorialItem => ({ kind: 'autopsy', id: `a:${s.companySlug}/${s.slug}`, title: s.title, href: `/explore/autopsies/${s.companySlug}/stories/${s.slug}`, readMins: mins(s.estimatedReadTime), eyebrow: `Autopsy · ${companyName(s.companySlug)}`, sub: s.dek })
  const savedSet = new Set(bookmarks.map(b => `${b.companySlug}/${b.storySlug}`))
  const inProgress: EditorialItem[] = []
  for (const r of recent ?? []) {
    if (r.content_type === 'autopsy_story') { const s = stories.find(x => x.companySlug === r.parent_id && x.slug === r.content_id); if (s) inProgress.push(toAutopsy(s)) }
    else { const m = modules.find(x => x.slug === r.parent_id); if (m) inProgress.push({ kind: 'module', id: `m:${m.slug}/${r.content_id}`, title: m.name, href: `/explore/modules/${m.slug}?chapter=${r.content_id}`, readMins: 9, eyebrow: `Module · in progress` }) }
  }
  const saved = stories.filter(s => savedSet.has(`${s.companySlug}/${s.slug}`)).map(toAutopsy)
  const newest = [...stories.slice(0, 6).map(toAutopsy), ...modules.slice(0, 3).map(m => ({ kind: 'module' as const, id: `m:${m.slug}`, title: m.name, href: `/explore/modules/${m.slug}`, readMins: m.est_minutes ?? 30, eyebrow: `Module · ${m.chapter_count} chapters`, sub: m.tagline }))]
  const featured = saved[0] ?? newest.find(i => i.kind === 'autopsy') ?? null
  const items = pickEditorial({ inProgress, saved: saved.filter(s => s.id !== featured?.id), newest: newest.filter(s => s.id !== featured?.id) }, 3)
  return { featured, items }
}
```

Check the actual field names on `getPublishedAutopsyStories()` items (`companySlug`, `slug`, `title`, `dek`, `estimatedReadTime` per the code map §3) and on `getLearnModuleSummaries()` rows (`slug, name, tagline, chapter_count, est_minutes`); adjust property access if the types differ.

- [ ] **Step 5: Run tests** → PASS. Typecheck. Commit:

```bash
git add src/lib/data/dashboard-density.ts src/lib/onboarding/curated-first-rep.ts tests/lib/dashboard
git commit -m "feat(density): dashboard data helpers (areas, reading, editorial, first reps)"
```

---

### Task 2: Hero cells

**Files:**
- Create: `HeroGrid.tsx`, `ContinueChallengeCard.tsx`, `ContinueReadingCard.tsx`, `CalibrationCard.tsx`, `HatchThoughtCard.tsx` under `src/components/density/dashboard/`

- [ ] **Step 1: `HeroGrid`**

```tsx
// src/components/density/dashboard/HeroGrid.tsx
import type { ReactNode } from 'react'
export function HeroGrid({ greeting, cells }: { greeting: ReactNode; cells: ReactNode[] }) {
  const cols = cells.length === 3 ? '260px 1fr 1fr 300px' : '260px 1fr 300px'
  return (
    <section data-testid="dashboard-hero" className="relative mb-4 grid gap-3 overflow-hidden rounded-[18px] bg-surface-container p-4 lg:min-h-[240px]" style={{ gridTemplateColumns: undefined }}>
      <style>{`@media (min-width:1024px){[data-testid=dashboard-hero]{grid-template-columns:${cols}}}`}</style>
      <div className="pointer-events-none absolute inset-0 opacity-70" aria-hidden>
        <i className="absolute block rounded-[60px] bg-primary-fixed" style={{ left: 120, top: -80, width: 420, height: 420, transform: 'rotate(45deg)', opacity: .5 }} />
      </div>
      <div className="relative flex flex-col justify-center">{greeting}</div>
      {cells.map((c, i) => <div key={i} className="relative min-w-0">{c}</div>)}
    </section>
  )
}
```

- [ ] **Step 2: `ContinueChallengeCard`**

```tsx
// src/components/density/dashboard/ContinueChallengeCard.tsx
import Link from 'next/link'
export function ContinueChallengeCard({ title, meta, href }: { title: string; meta: string; href: string }) {
  return (
    <div data-testid="continue-challenge" className="relative flex h-full flex-col justify-center overflow-hidden rounded-[14px] bg-forest-800 px-4 py-3.5 text-white">
      <i className="absolute block rounded-full" style={{ right: -30, top: -40, width: 140, height: 140, background: '#d9a441', opacity: .9 }} aria-hidden />
      <i className="absolute block rounded-[10px]" style={{ right: 20, top: 50, width: 100, height: 66, background: '#9db8a0', transform: 'rotate(-15deg)' }} aria-hidden />
      <div className="relative text-[10px] font-bold uppercase tracking-[.08em] text-gold">Continue · challenge</div>
      <Link href={href} className="relative mt-1.5 line-clamp-2 max-w-[78%] font-headline text-[17px] font-bold leading-[1.15] hover:underline">{title}</Link>
      <div className="relative mt-1 text-[11px] opacity-85">{meta}</div>
      <div className="relative mt-2"><Link href={href} data-hatch-target="dashboard-session" className="inline-block rounded-full bg-card-bright px-3 py-1.5 text-[11px] font-bold text-ink-strong">▷ Resume</Link></div>
    </div>
  )
}
```

- [ ] **Step 3: `ContinueReadingCard`**

```tsx
// src/components/density/dashboard/ContinueReadingCard.tsx
import Link from 'next/link'
export function ContinueReadingCard({ title, sub, href }: { title: string; sub: string; href: string }) {
  return (
    <div data-testid="continue-reading" className="relative flex h-full flex-col justify-center overflow-hidden rounded-[14px] bg-forest-900 px-4 py-3.5 text-white">
      <i className="absolute block" style={{ right: -20, top: 20, width: 120, height: 120, background: '#c4a66a', clipPath: 'polygon(50% 0,100% 50%,50% 100%,0 50%)', opacity: .9 }} aria-hidden />
      <i className="absolute block rounded-full" style={{ right: 60, bottom: -30, width: 90, height: 90, border: '16px solid #2f5f3f' }} aria-hidden />
      <div className="relative text-[10px] font-bold uppercase tracking-[.08em] text-gold">Continue · reading</div>
      <Link href={href} className="relative mt-1.5 line-clamp-2 max-w-[70%] font-headline text-[17px] font-bold leading-[1.15] hover:underline">{title}</Link>
      <div className="relative mt-1 text-[11px] opacity-85">{sub}</div>
      <div className="relative mt-2"><Link href={href} className="inline-block rounded-full bg-card-bright px-3 py-1.5 text-[11px] font-bold text-ink-strong">Keep reading</Link></div>
    </div>
  )
}
```

- [ ] **Step 4: `CalibrationCard`** (new-user Continue slot)

```tsx
// src/components/density/dashboard/CalibrationCard.tsx
import Link from 'next/link'
const MOVES = ['Frame the problem', 'List the options', 'Optimize the trade-off', 'Win the room']
export function CalibrationCard({ startHref, skipHref }: { startHref: string; skipHref: string }) {
  return (
    <div data-testid="calibration-card" className="relative grid h-full overflow-hidden rounded-[14px] bg-forest-800 px-4 py-3.5 text-white lg:grid-cols-[1fr_200px] lg:gap-3">
      <i className="absolute block rounded-full" style={{ right: -30, top: -40, width: 160, height: 160, background: '#d9a441', opacity: .9 }} aria-hidden />
      <i className="absolute block rounded-[10px]" style={{ right: 30, top: 50, width: 110, height: 70, background: '#9db8a0', transform: 'rotate(-15deg)' }} aria-hidden />
      <div className="relative flex flex-col justify-center">
        <div className="text-[10px] font-bold uppercase tracking-[.08em] text-gold">Set your baseline · 5 min</div>
        <h2 className="mt-1.5 font-headline text-[19px] font-bold leading-[1.15]">Let Hatch figure out where you are.</h2>
        <p className="mt-1 text-[11px] opacity-85">Four scenarios, one per FLOW move. No wrong answers, just honest ones.</p>
        <div className="mt-2 flex items-center gap-2">
          <Link href={startHref} data-testid="calibration-start" data-hatch-target="dashboard-session" className="inline-block rounded-full bg-card-bright px-3 py-1.5 text-[11px] font-bold text-ink-strong">Start calibration →</Link>
          <Link href={skipHref} data-testid="calibration-skip" className="text-[10px] opacity-75 hover:underline">or skip and pick a challenge</Link>
        </div>
      </div>
      <div className="relative hidden flex-col justify-center gap-1 lg:flex">
        <div className="text-[9px] font-bold tracking-[.08em] text-gold">FLOW · 4 MOVES</div>
        {MOVES.map(m => <div key={m} className="flex items-center gap-1.5 text-[10px]"><i className="block size-3.5 rounded-full border-[1.5px] border-primary-fixed-dim" aria-hidden />{m}</div>)}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: `HatchThoughtCard`**

```tsx
// src/components/density/dashboard/HatchThoughtCard.tsx
'use client'
import { ArrowUpRight } from 'lucide-react'
import { HatchImage } from '@/components/redesign/HatchImage'

export interface HatchPrompt { label: string; prompt?: string; event?: 'start-intro-tour' }

export function HatchThoughtCard({ message, prompts }: { message: string; prompts: HatchPrompt[] }) {
  const run = (p: HatchPrompt) => {
    if (p.event) { window.dispatchEvent(new Event(p.event)); return }
    window.dispatchEvent(new CustomEvent('open-ask-hatch', { detail: { prompt: p.prompt ?? p.label } }))
  }
  return (
    <div data-testid="hatch-thought" data-hatch-target="dashboard-hatch" className="flex h-full flex-col rounded-[14px] border border-hairline bg-card-bright px-3.5 py-3">
      <div className="flex items-center gap-2"><HatchImage state="thinking" size={28} /><div className="font-headline text-[15px] font-bold">A thought from Hatch.</div></div>
      <p className="mt-2 text-[11px] leading-[1.4] text-ink-secondary">{message}</p>
      <div className="mt-auto flex flex-col gap-1.5 border-t border-hairline pt-2">
        {prompts.map(p => (
          <button key={p.label} type="button" onClick={() => run(p)} data-testid="hatch-prompt" className="flex items-center justify-between text-left text-[11px] font-semibold text-ink-strong hover:text-primary">
            <span>{p.label}</span><ArrowUpRight size={14} aria-hidden />
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Typecheck, commit**

```bash
git add src/components/density/dashboard
git commit -m "feat(density): dashboard hero cells"
```

**Wiring table:** Continue challenge title/Resume → `canonicalResumeHref(challenge)` (`${challengePath}?resume=1`); Continue reading → module `?chapter=` or story URL; Calibration start → `/welcome` (plan 03; until plan 03 lands use `href="#"` with `onClick` dispatching `open-onboarding-modal`: implement as the `startHref` prop, so no change is needed later); skip → `/challenges`; Hatch prompts → `open-ask-hatch` with the prompt text, or `start-intro-tour`.

---

### Task 3: Shelves

**Files:**
- Create: `PracticeAreaShelf.tsx`, `EditorialShelf.tsx`, `PathsRow.tsx`, `FirstRepsShelf.tsx` under `src/components/density/dashboard/`
- Modify: `src/components/redesign/dashboard/QuickTakePanel.tsx` (add optional `compact?: boolean` prop that reduces padding to `p-3` and the textarea to 2 rows; no behaviour change)

- [ ] **Step 1: `PracticeAreaShelf`**

```tsx
// src/components/density/dashboard/PracticeAreaShelf.tsx
import Link from 'next/link'
import { CoverCard } from '@/components/density/CoverCard'
import { PRACTICE_AREAS, areaPct, type AreaStat } from '@/lib/data/dashboard-density'

export function PracticeAreaShelf({ stats }: { stats: AreaStat[] }) {
  const by = new Map(stats.map(s => [s.discipline, s]))
  return (
    <section data-testid="practice-areas" data-hatch-target="dashboard-practice-areas" className="mb-3">
      <div className="mb-2 flex items-baseline justify-between"><h2 className="font-headline text-[16px] font-bold">Practice areas</h2><Link href="/challenges" className="text-[12px] font-bold text-primary">View all →</Link></div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {PRACTICE_AREAS.map(a => { const s = by.get(a.discipline); const total = s?.total ?? 0; return (
          <CoverCard key={a.discipline} href={a.href} seed={a.seed} artIndex={a.artIndex} title={a.label} artHeight={56} pct={areaPct(s?.completed ?? 0, total)} meta={[{ value: total, label: a.discipline === 'analytics' ? 'labs' : 'problems' }]} testId={`area-${a.discipline}`} />
        )})}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: `EditorialShelf`**

```tsx
// src/components/density/dashboard/EditorialShelf.tsx
import Link from 'next/link'
import { EditorialCard } from '@/components/density/EditorialCard'
import { GeoArt } from '@/components/density/GeoArt'
import type { EditorialItem } from '@/lib/data/dashboard-density'

export function EditorialShelf({ featured, items }: { featured: EditorialItem | null; items: EditorialItem[] }) {
  if (!featured && items.length === 0) return null
  return (
    <section data-testid="editorial-shelf" className="mb-3">
      <div className="mb-2 flex items-baseline justify-between"><h2 className="font-headline text-[16px] font-bold">Worth reading this week</h2><Link href="/explore" className="text-[12px] font-bold text-primary">Library →</Link></div>
      <div className="grid gap-2.5 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        {featured && <EditorialCard href={featured.href} eyebrow={`Saved for you · ${featured.kind}`} title={featured.title} sub={featured.sub} meta={`${featured.eyebrow.split(' · ')[1] ?? ''} · ${featured.readMins} min`} height={150} testId="editorial-featured" />}
        {items.map(it => (
          <Link key={it.id} href={it.href} data-testid="editorial-item" className="flex flex-col overflow-hidden rounded-2xl border border-hairline bg-card-bright">
            <GeoArt seed={it.id} height={74} className="px-3 py-2.5 text-white"><div className="relative text-[9px] font-bold uppercase tracking-[.08em] opacity-85">{it.eyebrow}</div><div className="relative mt-0.5 line-clamp-2 font-headline text-[14px] font-bold leading-[1.15]">{it.title}</div></GeoArt>
            <div className="px-3 py-2 text-[11px] leading-[1.4] text-ink-secondary"><div className="line-clamp-2">{it.sub ?? ''}</div><div className="mt-1.5 flex justify-between text-[10px]"><span>{it.readMins} min</span><span className="font-bold text-primary">Read →</span></div></div>
          </Link>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 3: `PathsRow`** (study paths + Quick Take + week)

```tsx
// src/components/density/dashboard/PathsRow.tsx
import Link from 'next/link'
import { CoverCard } from '@/components/density/CoverCard'
import { QuickTakePanel } from '@/components/redesign/dashboard/QuickTakePanel'

export interface PathCard { slug: string; name: string; eyebrow: string; done: number; total: number; unit: 'chapters' | 'reps' }
export interface WeekDay { label: string; completed: boolean; today: boolean }

export function PathsRow({ paths, quickTake, week, streakDays, focusMove }: { paths: PathCard[]; quickTake: { prompt: string; challengeId: string; move?: string } | null; week: WeekDay[]; streakDays: number; focusMove: string | null }) {
  return (
    <section data-testid="paths-row" className="grid gap-2.5 lg:grid-cols-[1fr_1fr_1fr_300px]">
      {paths.slice(0, 2).map(p => <CoverCard key={p.slug} href={`/explore/plans/${p.slug}`} seed={`plan-${p.slug}`} eyebrow={p.eyebrow} title={p.name} artHeight={56} pct={p.total ? Math.round((p.done / p.total) * 100) : 0} meta={[{ value: p.total, label: p.unit }, { value: p.done, label: 'done' }]} testId={`path-${p.slug}`} />)}
      {paths.length < 2 && <Link href="/explore/plans" data-testid="paths-browse" className="flex items-center justify-center rounded-2xl border border-dashed border-hairline text-[12px] font-bold text-primary">Browse study paths →</Link>}
      {quickTake ? <QuickTakePanel compact prompt={quickTake.prompt} challengeId={quickTake.challengeId} move={quickTake.move} /> : <div />}
      <Link href="/progress" data-testid="week-card" className="rounded-2xl border border-hairline bg-card-bright p-3">
        <div className="text-[10px] font-bold uppercase tracking-[.08em] text-tertiary">Your week</div>
        <div className="my-1.5 flex gap-1.5">{week.map(d => <i key={d.label + String(d.today)} title={d.label} className={`block size-5 rounded-md ${d.completed ? 'bg-gold' : 'border border-hairline'} ${d.today ? 'ring-2 ring-primary-fixed' : ''}`} />)}</div>
        <div className="flex justify-between rounded-lg bg-primary-fixed px-2 py-1 text-[11px]"><b>{focusMove ? `Focus: ${focusMove}` : `Streak: ${streakDays} day${streakDays === 1 ? '' : 's'}`}</b><span>{streakDays} day streak</span></div>
      </Link>
    </section>
  )
}
```

- [ ] **Step 4: `FirstRepsShelf`** (new user)

```tsx
// src/components/density/dashboard/FirstRepsShelf.tsx
import Link from 'next/link'
export interface FirstRep { href: string; title: string; summary: string; typeLabel: string; difficulty: string; minutes: number; chip: string }
export function FirstRepsShelf({ reps }: { reps: FirstRep[] }) {
  return (
    <section data-testid="first-reps" className="mb-3">
      <div className="mb-2 flex items-baseline justify-between"><h2 className="font-headline text-[16px] font-bold">A good place to begin</h2><Link href="/challenges" className="text-[12px] font-bold text-primary">All practice →</Link></div>
      <div className="grid gap-2.5 md:grid-cols-3">
        {reps.map(r => (
          <div key={r.href} className="rounded-2xl border border-hairline bg-card-bright p-3">
            <div className="flex gap-1.5"><span className="rounded-full bg-primary-fixed px-2 py-0.5 text-[10px] font-bold text-forest-800">{r.typeLabel}</span><span className="rounded-full bg-amber-soft px-2 py-0.5 text-[10px] font-bold text-tertiary">{r.difficulty} · {r.minutes} min</span></div>
            <h3 className="mt-2 font-headline text-[15px] font-bold leading-tight">{r.title}</h3>
            <p className="mt-1 line-clamp-2 text-[12px] text-ink-secondary">{r.summary}</p>
            <div className="mt-2.5 flex items-center justify-between"><span className="rounded-full border border-hairline px-2 py-0.5 text-[10px]">{r.chip}</span><Link href={r.href} data-testid="first-rep-start" className="rounded-full bg-forest-800 px-3 py-1.5 text-[12px] font-bold text-white">Start</Link></div>
          </div>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Typecheck, commit**

```bash
git add src/components/density/dashboard src/components/redesign/dashboard/QuickTakePanel.tsx
git commit -m "feat(density): dashboard shelves"
```

---

### Task 4: `DashboardV4` and the page branch

**Files:**
- Create: `src/components/density/dashboard/DashboardV4.tsx`
- Modify: `src/app/(app)/dashboard/page.tsx`

- [ ] **Step 1: `DashboardV4`** (server component; receives everything computed)

```tsx
// src/components/density/dashboard/DashboardV4.tsx
import { HeroGrid } from './HeroGrid'
import { ContinueChallengeCard } from './ContinueChallengeCard'
import { ContinueReadingCard } from './ContinueReadingCard'
import { CalibrationCard } from './CalibrationCard'
import { HatchThoughtCard, type HatchPrompt } from './HatchThoughtCard'
import { PracticeAreaShelf } from './PracticeAreaShelf'
import { EditorialShelf } from './EditorialShelf'
import { PathsRow, type PathCard, type WeekDay } from './PathsRow'
import { FirstRepsShelf, type FirstRep } from './FirstRepsShelf'
import { HatchPickCard } from '@/components/density/HatchPickCard'
import type { AreaStat, EditorialItem } from '@/lib/data/dashboard-density'

export interface DashboardV4Props {
  displayName: string
  isNewUser: boolean
  streakDays: number
  resume: { title: string; meta: string; href: string } | null
  reading: { title: string; sub: string; href: string } | null
  hatchPick: { title: string; reason: string; href: string } | null
  hatchMessage: string
  hatchPrompts: HatchPrompt[]
  areaStats: AreaStat[]
  editorial: { featured: EditorialItem | null; items: EditorialItem[] }
  paths: PathCard[]
  quickTake: { prompt: string; challengeId: string; move?: string } | null
  week: WeekDay[]
  focusMove: string | null
  firstReps: FirstRep[]
  calibrationHref: string
}

export function DashboardV4(p: DashboardV4Props) {
  const greeting = p.isNewUser ? (
    <><div className="text-[10px] font-bold uppercase tracking-[.08em] text-forest-800">Welcome, {p.displayName}</div><h1 className="mt-1.5 font-headline text-[28px] font-bold leading-[1.05]">Find your <em className="font-medium not-italic text-tertiary">next possibility.</em></h1><p className="mt-2 text-[12px] text-ink-secondary">Two ways in: calibrate in five minutes, or just start a rep.</p></>
  ) : (
    <><div className="text-[10px] font-bold uppercase tracking-[.08em] text-forest-800">Welcome back, {p.displayName}</div><h1 className="mt-1.5 font-headline text-[28px] font-bold leading-[1.05]">Keep your <em className="font-medium not-italic text-tertiary">curiosity going.</em></h1><p className="mt-2 text-[12px] text-ink-secondary">{p.streakDays > 0 ? `Day ${p.streakDays} of your streak. One rep keeps it alive.` : 'One rep today starts a streak.'}</p></>
  )
  const cells = p.isNewUser
    ? [<CalibrationCard key="cal" startHref={p.calibrationHref} skipHref="/challenges" />, <HatchThoughtCard key="h" message={p.hatchMessage} prompts={p.hatchPrompts} />]
    : [
        p.resume ? <ContinueChallengeCard key="c" {...p.resume} /> : p.hatchPick ? <HatchPickCard key="pick" eyebrow="Hatch's pick today" title={p.hatchPick.title} reason={p.hatchPick.reason} href={p.hatchPick.href} ctaLabel="Start" dismissScope="dashboard" /> : null,
        p.reading ? <ContinueReadingCard key="r" {...p.reading} /> : p.hatchPick && p.resume ? <HatchPickCard key="pick2" eyebrow="Hatch's pick today" title={p.hatchPick.title} reason={p.hatchPick.reason} href={p.hatchPick.href} ctaLabel="Start" dismissScope="dashboard" /> : null,
        <HatchThoughtCard key="h" message={p.hatchMessage} prompts={p.hatchPrompts} />,
      ].filter(Boolean) as JSX.Element[]
  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-4 sm:px-6">
      <HeroGrid greeting={greeting} cells={cells} />
      {p.isNewUser && <FirstRepsShelf reps={p.firstReps} />}
      <PracticeAreaShelf stats={p.areaStats} />
      {!p.isNewUser && <EditorialShelf featured={p.editorial.featured} items={p.editorial.items} />}
      {!p.isNewUser && <PathsRow paths={p.paths} quickTake={p.quickTake} week={p.week} streakDays={p.streakDays} focusMove={p.focusMove} />}
    </div>
  )
}
```

- [ ] **Step 2: Branch in `page.tsx`**

In `src/app/(app)/dashboard/page.tsx`:
1. Imports: `getAppFlag`, `DashboardV4`, `getAreaStats`, `getContinueReading`, `getEditorialShelf`, `getCuratedFirstRepSlugs`, `canonicalResumeHref` (from `@/components/redesign/dashboard/action`), `challengePath`.
2. In `DashboardContent` (L280), before rendering the legacy tree: `const density = await getAppFlag('ui_density_v1', false)`. If true, compute and return `<DashboardV4 …/>` using values already produced by `loadDashboard()` (names per the code map §3: `profile.display_name`, `hasAnyAttempts`, `resume` row from query #5 with `challenges` join and `current_step`, `weakest`/`focusMove` from `move_levels`, `week` from `buildWeek`, `quickTake` from query #6, `continuePlan` from `getEnrolledPlans`, `hatchMessage`/`hatchPrompt` from §3.2):

```tsx
if (density) {
  const isNewUser = !profile.onboarding_completed_at_from_session /* see note */ && !hasAnyAttempts
  const [areaStats, reading, editorial] = await Promise.all([getAreaStats(user.id), isNewUser ? null : getContinueReading(user.id), isNewUser ? { featured: null, items: [] } : getEditorialShelf(user.id)])
  const firstReps = isNewUser ? await loadFirstReps(profile.preferred_role) : []
  const pick = !resume && !isNewUser ? await fetchHatchPick(user.id) : null
  return <DashboardV4
    displayName={profile.display_name ?? 'there'} isNewUser={isNewUser} streakDays={profile.streak_days ?? 0}
    resume={resume ? { title: resume.challenges.title, meta: `Step ${flowStepNumber(resume.current_step)} of 4`, href: canonicalResumeHref(resume.challenges) } : null}
    reading={reading} hatchPick={pick} hatchMessage={hatchMessage}
    hatchPrompts={isNewUser ? [{ label: 'Pick my first challenge', prompt: 'Pick my first challenge based on my role.' }, { label: 'Show me around', event: 'start-intro-tour' }] : [{ label: hatchPrompt, prompt: hatchPrompt }, { label: 'Help me choose what to learn next', prompt: 'Help me choose what to learn next based on my recent work and goals.' }]}
    areaStats={areaStats} editorial={editorial}
    paths={[...(continuePlan ? [{ slug: continuePlan.slug, name: continuePlan.title, eyebrow: 'Study plan', done: continuePlan.completed_count ?? 0, total: continuePlan.item_count ?? 0, unit: 'reps' as const }] : []), ...(weakestMove ? [{ slug: WEAKEST_PLAN[weakestMove], name: WEAKEST_PLAN_NAME[weakestMove], eyebrow: 'Weakest move', done: 0, total: 8, unit: 'reps' as const }] : [])]}
    quickTake={quickTake?.prompt_text ? { prompt: quickTake.prompt_text, challengeId: quickTake.id, move: quickTake.move_tags?.[0] } : null}
    week={week} focusMove={focusMove?.move ?? null} firstReps={firstReps} calibrationHref="/welcome" />
}
```

Define in the same file:

```ts
const WEAKEST_PLAN: Record<string, string> = { frame: 'frame-like-a-pm', list: 'the-list-move', optimize: 'optimize-under-pressure', win: 'win-the-room' }
const WEAKEST_PLAN_NAME: Record<string, string> = { frame: 'Frame like a PM', list: 'The List move', optimize: 'Optimize under pressure', win: 'Win the room' }

async function loadFirstReps(role: string | null) {
  const admin = createAdminClient()
  const slugs = getCuratedFirstRepSlugs(role)
  const { data } = await admin.from('challenges').select('id, slug, title, difficulty, challenge_type, estimated_minutes, scenario_context, prompt_text, technique_tags, move_tags').in('slug', slugs).eq('is_published', true)
  const label: Record<string, string> = { flow: 'Product', freeform: 'Product', algorithm: 'Coding', sql: 'SQL', system_design: 'Design', data_modeling: 'Modeling' }
  return slugs.map(s => (data ?? []).find(c => c.slug === s)).filter(Boolean).map(c => ({
    href: challengePath(c!), title: c!.title, summary: (c!.scenario_context ?? c!.prompt_text ?? '').slice(0, 140), typeLabel: label[c!.challenge_type] ?? c!.challenge_type,
    difficulty: String(c!.difficulty ?? 'easy').replace(/^./, m => m.toUpperCase()), minutes: c!.estimated_minutes ?? 10, chip: c!.technique_tags?.[0] ?? c!.move_tags?.[0] ?? 'Start here',
  }))
}

async function fetchHatchPick(userId: string) {
  // Reuse the same logic as GET /api/challenges/next without an HTTP hop: call the route handler's exported helper if present, else fetch.
  const { computeNextChallenge } = await import('@/app/api/challenges/next/logic').catch(() => ({ computeNextChallenge: null as null }))
  if (computeNextChallenge) { const r = await computeNextChallenge(userId); return r?.challenge ? { title: r.challenge.title, reason: r.reason, href: `/workspace/challenges/${r.challenge.slug ?? r.challenge.id}` } : null }
  return null
}
```

Extract the body of `GET` in `src/app/api/challenges/next/route.ts` (from the `profiles.preferred_role` read at L93 to the response object) into `src/app/api/challenges/next/logic.ts` as `export async function computeNextChallenge(userId: string)` returning the same object the route serialises, and make the route call it. `isNewUser`: use `!hasAnyAttempts && !(await sessionProfileOnboardingCompleted)`; `onboarding_completed_at` is already in the (app) layout's profile select, so add it to the dashboard's profile select (query #1) instead of the placeholder above.

- [ ] **Step 3: Verify manually**

Flag on, Pro user: `/dashboard` shows the hero with Continue · challenge (there is an in-progress attempt on the Pro account) and the shelves; hero height ≤ 250; `[data-testid=practice-areas]` top ≤ 340. New user (`hackproduct.onboarding.review@gmail.com` / `Review#Onboard89`, created during ideation): calibration card, first reps shelf, 0% rings.

- [ ] **Step 4: Commit**

```bash
git add src/app/(app)/dashboard/page.tsx src/components/density/dashboard/DashboardV4.tsx src/app/api/challenges/next
git commit -m "feat(density): DashboardV4 behind ui_density_v1"
```

---

### Task 5: Dashboard E2E

**Files:**
- Create: `e2e/density/dashboard.spec.ts`

- [ ] **Step 1: Spec**

```ts
import { test, expect } from '@playwright/test'
import { VIEWPORTS, loginViaApi, gotoReady, topOf, expectNoConsoleErrors } from './helpers'

test.describe('dashboard v4', () => {
  test('returning user: hero, shelves, every control acts', async ({ page }) => {
    await loginViaApi(page); await page.setViewportSize(VIEWPORTS.desktop)
    await expectNoConsoleErrors(page, async () => { await gotoReady(page, '/dashboard') })
    const hero = page.getByTestId('dashboard-hero'); expect((await hero.boundingBox())!.height).toBeLessThanOrEqual(260)
    expect(await topOf(page, '[data-testid=practice-areas]')).toBeLessThanOrEqual(340)
    await expect(page.getByTestId('hatch-thought')).toBeVisible()
    // Continue challenge or Hatch pick resolves to a workspace URL
    const cont = page.getByTestId('continue-challenge').or(page.getByTestId('hatch-pick'))
    await expect(cont).toBeVisible()
    const href = await cont.locator('a').first().getAttribute('href'); expect(href).toMatch(/\/workspace\/challenges\//)
    // Practice area card navigates with the discipline param
    await page.getByTestId('area-sql').click(); await expect(page).toHaveURL(/\/challenges\?discipline=sql/); await page.goBack(); await gotoReady(page, '/dashboard')
    // Hatch prompt opens the chat
    await page.getByTestId('hatch-prompt').first().click(); await expect(page.getByTestId('hatch-fab')).toBeVisible(); await expect(page.locator('[data-testid=hatch-fab] ~ *, [data-testid=hatch-fab]').first()).toBeVisible()
    // Editorial + week
    await expect(page.getByTestId('editorial-shelf')).toBeVisible()
    await expect(page.getByTestId('week-card')).toHaveAttribute('href', '/progress')
  })

  test('laptop and mobile layouts', async ({ page }) => {
    await loginViaApi(page)
    await page.setViewportSize(VIEWPORTS.laptop); await gotoReady(page, '/dashboard')
    expect(await topOf(page, '[data-testid=practice-areas]')).toBeLessThanOrEqual(320)
    await page.setViewportSize(VIEWPORTS.mobile); await gotoReady(page, '/dashboard')
    await expect(page.getByTestId('dashboard-hero')).toBeVisible(); await expect(page.getByTestId('hatch-thought')).toBeVisible()
  })

  test('new user: calibration card and first reps', async ({ page }) => {
    await loginViaApi(page, { email: 'hackproduct.onboarding.review@gmail.com', password: 'Review#Onboard89' })
    await page.setViewportSize(VIEWPORTS.desktop); await gotoReady(page, '/dashboard')
    await expect(page.getByTestId('calibration-card')).toBeVisible()
    await expect(page.getByTestId('calibration-start')).toHaveAttribute('href', '/welcome')
    await expect(page.getByTestId('calibration-skip')).toHaveAttribute('href', '/challenges')
    await expect(page.getByTestId('first-rep-start')).toHaveCount(3)
    await expect(page.getByTestId('editorial-shelf')).toHaveCount(0)
  })
})
```

- [ ] **Step 2: Run** `npx playwright test e2e/density/dashboard.spec.ts` → 3 passed. Commit:

```bash
git add e2e/density/dashboard.spec.ts
git commit -m "test(density): dashboard v4 E2E"
```

## Self-review

- Spec §3.3 hero: Task 2/4. §4.1 shelves: Task 3/4. §4.2 new user: Tasks 2-4. Orphans: every card lists its href/event in the wiring tables; `HatchPickCard` on the dashboard is dismissible and links to the workspace. `/welcome` is created in plan 03; until then the link 404s on the new-user branch only, so run plan 03 before flipping the flag for real users.

# UI Density Pass 04: Library (`/explore`) and Practice (`/challenges`)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Requires plan 01. Read `2026-09-07-ui-density-pass-00-master.md` for conventions.

**Goal:** Library: title row + chips, the 160px featured "Saved for you" card, then shelves (Your learning, Study plans, Modules, Autopsies) of cover cards with eight rotating geometric thumbnails; content at y≈330. Practice: 88px band with a functional Hatch's pick, discipline chips, filter row with a persisted list/card toggle, card mode with geometric thumbnails and no redundant "In progress" tag; first result at y≤260.

**Architecture:** Library: `src/app/(app)/explore/page.tsx` already gathers guides, autopsies, plans, bookmarks and learn progress; add reading progress and render `LibraryV2` (server) + `LibraryChips` (client, URL-param driven) when the flag is on. Practice: keep `FreePracticeContent`/`FilteredChallengesView` data flow; replace the header with `HeaderBand` + `HatchPickCard`, move the view toggle to `ui_prefs.practice_view`, add `ChallengeCardV3` for card mode, and drop the page-level `ChallengeSearch` (top bar search is scoped).

**Tech Stack:** as master plan.

---

## File structure

Create:
- `src/components/density/library/LibraryV2.tsx`, `LibraryChips.tsx`, `LibraryShelf.tsx`
- `src/lib/data/library-density.ts` (+ `tests/lib/library/library-density.test.ts`)
- `src/components/density/practice/PracticeBand.tsx`, `ChallengeCardV3.tsx`, `ViewToggle.tsx`
- `e2e/density/library-practice.spec.ts`

Modify:
- `src/app/(app)/explore/page.tsx`
- `src/app/(app)/challenges/FreePracticeContent.tsx:124-153`
- `src/app/(app)/challenges/FilteredChallengesView.tsx:220, 276-282` (view state source)
- `src/components/challenges/FilterDropdownBar.tsx` (view toggle slot)
- `src/app/(app)/challenges/HatchPick.tsx` (density variant)
- `src/app/api/challenges/next/route.ts` (no change; used as is)

---

### Task 1: Library data shaping

**Files:**
- Create: `src/lib/data/library-density.ts`
- Test: `tests/lib/library/library-density.test.ts`

- [ ] **Step 1: Failing test**

```ts
// tests/lib/library/library-density.test.ts
import { describe, it, expect } from 'vitest'
import { buildLibraryShelves, filterByType, readMins } from '@/lib/data/library-density'

const guide = { kind: 'guide' as const, id: 'g1', slug: 'context-engineering', title: 'Context engineering', href: '/explore/modules/context-engineering', chapters: 7, completed: 3, minutes: 60, tagline: 'x' }
const plan = { kind: 'plan' as const, id: 'p1', slug: 'frame-like-a-pm', title: 'Frame like a PM', href: '/explore/plans/frame-like-a-pm', reps: 7, done: 0, move: 'frame', enrolled: false }
const story = { kind: 'autopsy' as const, id: 'a1', companySlug: 'google', storySlug: 'gmail-undo-send', title: 'Gmail Undo Send', dek: 'A delay made a destructive action feel reversible.', href: '/explore/autopsies/google/stories/gmail-undo-send', readTime: '8 min read', company: 'Google', saved: true, progress: 0 }

describe('library-density', () => {
  it('parses read minutes', () => { expect(readMins('8 min read')).toBe(8); expect(readMins(undefined)).toBe(6) })
  it('builds shelves with a saved featured story and in-progress first', () => {
    const s = buildLibraryShelves({ guides: [guide], plans: [plan], stories: [story, { ...story, id: 'a2', storySlug: 'wordle', title: 'Wordle', saved: false, progress: 0.4 }], readingProgress: [] })
    expect(s.featured?.title).toBe('Gmail Undo Send')
    expect(s.yourLearning.map(i => i.title)).toEqual(['Context engineering', 'Wordle'])
    expect(s.studyPlans).toHaveLength(1); expect(s.modules).toHaveLength(1); expect(s.autopsies.map(a => a.title)).toEqual(['Wordle'])
  })
  it('filters by chip type', () => {
    expect(filterByType('autopsies', { guides: [guide], plans: [plan], stories: [story] }).guides).toEqual([])
    expect(filterByType('saved', { guides: [guide], plans: [plan], stories: [story] }).stories).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Implement**

```ts
// src/lib/data/library-density.ts
export type LibraryType = 'all' | 'guides' | 'autopsies' | 'plans' | 'saved'
export interface GuideItem { kind: 'guide'; id: string; slug: string; title: string; href: string; chapters: number; completed: number; minutes: number; tagline: string }
export interface PlanItem { kind: 'plan'; id: string; slug: string; title: string; href: string; reps: number; done: number; move: string | null; enrolled: boolean }
export interface StoryItem { kind: 'autopsy'; id: string; companySlug: string; storySlug: string; title: string; dek: string; href: string; readTime: string; company: string; saved: boolean; progress: number }
export interface LibraryInput { guides: GuideItem[]; plans: PlanItem[]; stories: StoryItem[]; readingProgress: Array<{ content_type: string; parent_id: string; content_id: string; progress: number }> }

export const readMins = (s?: string) => Number((s ?? '').match(/\d+/)?.[0] ?? 6)

export function filterByType(type: LibraryType, i: Pick<LibraryInput, 'guides' | 'plans' | 'stories'>) {
  return {
    guides: type === 'all' || type === 'guides' ? i.guides : [],
    plans: type === 'all' || type === 'plans' ? i.plans : [],
    stories: type === 'all' || type === 'autopsies' ? i.stories : type === 'saved' ? i.stories.filter(s => s.saved) : [],
  }
}

export function buildLibraryShelves(i: LibraryInput) {
  const storyProgress = new Map(i.readingProgress.filter(r => r.content_type === 'autopsy_story').map(r => [`${r.parent_id}/${r.content_id}`, Number(r.progress)]))
  const stories = i.stories.map(s => ({ ...s, progress: Math.max(s.progress, storyProgress.get(`${s.companySlug}/${s.storySlug}`) ?? 0) }))
  const featured = stories.find(s => s.saved) ?? stories[0] ?? null
  const inProgressGuides = i.guides.filter(g => g.completed > 0 && g.completed < g.chapters)
  const inProgressStories = stories.filter(s => s.progress > 0 && s.progress < 0.98 && s.id !== featured?.id)
  const enrolledPlans = i.plans.filter(p => p.enrolled && p.done < p.reps)
  const yourLearning = [...inProgressGuides, ...inProgressStories, ...enrolledPlans].slice(0, 4)
  return {
    featured,
    yourLearning,
    studyPlans: [...i.plans].sort((a, b) => Number(b.enrolled) - Number(a.enrolled)).slice(0, 4),
    modules: i.guides.slice(0, 4),
    autopsies: stories.filter(s => s.id !== featured?.id).slice(0, 4),
    counts: { all: i.guides.length + i.plans.length + i.stories.length, guides: i.guides.length, autopsies: i.stories.length, plans: i.plans.length, saved: i.stories.filter(s => s.saved).length },
  }
}
```

- [ ] **Step 3: Run** → PASS. Commit:

```bash
git add src/lib/data/library-density.ts tests/lib/library
git commit -m "feat(density): library shelf shaping"
```

---

### Task 2: Library components and page branch

**Files:**
- Create: `src/components/density/library/LibraryChips.tsx`, `LibraryShelf.tsx`, `LibraryV2.tsx`
- Modify: `src/app/(app)/explore/page.tsx`

- [ ] **Step 1: `LibraryChips`** (client; writes `?type=`)

```tsx
// src/components/density/library/LibraryChips.tsx
'use client'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import type { LibraryType } from '@/lib/data/library-density'
export function LibraryChips({ counts }: { counts: Record<LibraryType, number> }) {
  const sp = useSearchParams(); const active = (sp.get('type') as LibraryType) || 'all'; const q = sp.get('q')
  const chips: Array<[LibraryType, string]> = [['all', `All ${counts.all}`], ['guides', `Guides ${counts.guides}`], ['autopsies', `Autopsies ${counts.autopsies}`], ['plans', `Study plans ${counts.plans}`], ['saved', 'Saved stories']]
  return (
    <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Library filter">
      {chips.map(([t, label]) => <Link key={t} role="tab" aria-selected={active === t} data-testid={`lib-chip-${t}`} href={t === 'all' ? (q ? `/explore?q=${encodeURIComponent(q)}` : '/explore') : `/explore?type=${t}${q ? `&q=${encodeURIComponent(q)}` : ''}`} className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${active === t ? 'border-forest-800 bg-forest-800 text-white' : 'border-hairline bg-card-bright'}`}>{label}</Link>)}
    </div>
  )
}
```

- [ ] **Step 2: `LibraryShelf`**

```tsx
// src/components/density/library/LibraryShelf.tsx
import Link from 'next/link'
import { CoverCard } from '@/components/density/CoverCard'
import { readMins, type GuideItem, type PlanItem, type StoryItem } from '@/lib/data/library-density'

type Item = GuideItem | PlanItem | StoryItem
export function LibraryShelf({ title, moreHref, moreLabel, items, testId }: { title: string; moreHref: string; moreLabel: string; items: Item[]; testId: string }) {
  if (!items.length) return null
  return (
    <section data-testid={testId} className="mb-3">
      <div className="mb-2 flex items-baseline justify-between"><h2 className="font-headline text-[16px] font-bold">{title}</h2><Link href={moreHref} className="text-[12px] font-bold text-primary">{moreLabel}</Link></div>
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {items.map((it, i) => it.kind === 'guide'
          ? <CoverCard key={it.id} href={it.href} seed={it.slug} artIndex={i % 8} eyebrow={`Module · ${it.chapters} chapters`} title={it.title} pct={it.chapters ? Math.round((it.completed / it.chapters) * 100) : 0} meta={[{ value: it.chapters, label: 'chapters' }]} footer={<span className="text-[10px]">{it.completed > 0 ? `Chapter ${it.completed + 1} of ${it.chapters}` : `${it.minutes} min`}</span>} testId="lib-card" />
          : it.kind === 'plan'
          ? <CoverCard key={it.id} href={it.href} seed={it.slug} artIndex={(i + 1) % 8} eyebrow={`Study plan · ${it.reps} reps`} title={it.title} pct={it.reps ? Math.round((it.done / it.reps) * 100) : 0} meta={[{ value: it.reps, label: 'reps' }]} footer={<span className="text-[10px]">{it.move ? `Move: ${it.move.charAt(0).toUpperCase() + it.move.slice(1)}` : it.enrolled ? 'Enrolled' : ''}</span>} testId="lib-card" />
          : <CoverCard key={it.id} href={it.href} seed={`${it.companySlug}/${it.storySlug}`} artIndex={(i + 2) % 8} eyebrow={`Autopsy · ${it.company}`} title={it.title} pct={it.progress > 0 ? Math.round(it.progress * 100) : 0} meta={[{ value: readMins(it.readTime), label: 'min' }]} footer={it.saved ? <span className="rounded-full bg-primary-fixed px-1.5 text-[9px] font-bold text-forest-800">Saved</span> : undefined} testId="lib-card" />
        )}
      </div>
    </section>
  )
}
```

- [ ] **Step 3: `LibraryV2`**

```tsx
// src/components/density/library/LibraryV2.tsx
import { Suspense } from 'react'
import { EditorialCard } from '@/components/density/EditorialCard'
import { LibraryChips } from './LibraryChips'
import { LibraryShelf } from './LibraryShelf'
import { buildLibraryShelves, filterByType, readMins, type LibraryInput, type LibraryType } from '@/lib/data/library-density'

export function LibraryV2({ input, type, q }: { input: LibraryInput; type: LibraryType; q: string | null }) {
  const filtered = filterByType(type, input)
  const query = (q ?? '').trim().toLowerCase()
  const match = (t: string) => !query || t.toLowerCase().includes(query)
  const shelves = buildLibraryShelves({ ...input, guides: filtered.guides.filter(g => match(`${g.title} ${g.tagline}`)), plans: filtered.plans.filter(p => match(p.title)), stories: filtered.stories.filter(s => match(`${s.title} ${s.dek} ${s.company}`)) })
  const showFeatured = type === 'all' && !query && shelves.featured
  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-4 sm:px-6">
      <div className="mb-2.5 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="font-headline text-[26px] font-bold leading-none">Library{query ? <span className="ml-2 text-[14px] font-normal text-ink-secondary">results for “{q}”</span> : null}</h1>
        <Suspense><LibraryChips counts={shelves.counts} /></Suspense>
      </div>
      {showFeatured && <EditorialCard href={shelves.featured!.href} eyebrow={`Saved for you · Autopsies`} title={shelves.featured!.title} sub={shelves.featured!.dek} meta={`${shelves.featured!.company} · ${readMins(shelves.featured!.readTime)} min read`} height={160} className="mb-3" testId="lib-featured" />}
      <LibraryShelf testId="shelf-learning" title="Your learning" moreHref="/explore/modules" moreLabel="Continue where you left off →" items={shelves.yourLearning} />
      <LibraryShelf testId="shelf-plans" title="Study plans" moreHref="/explore/plans" moreLabel={`All ${shelves.counts.plans} →`} items={shelves.studyPlans} />
      <LibraryShelf testId="shelf-modules" title="Modules" moreHref="/explore/modules" moreLabel="All guides →" items={shelves.modules} />
      <LibraryShelf testId="shelf-autopsies" title="Autopsies" moreHref="/explore/autopsies" moreLabel={`All ${shelves.counts.autopsies} →`} items={shelves.autopsies} />
      {shelves.counts.all === 0 && <p className="py-10 text-center text-[13px] text-ink-secondary">Nothing matches. Try another word or clear the filter.</p>}
    </div>
  )
}
```

- [ ] **Step 4: Page branch**

In `src/app/(app)/explore/page.tsx`: accept `searchParams: Promise<{ type?: string; q?: string }>`; read `getAppFlag('ui_density_v1')`; when true, map the already-fetched data (L64-105) to `LibraryInput` (guides from `getLearnModuleSummaries` + `completedByModule`; plans from `getStudyPlans(user.id)` with `enrolled`, `progress_percentage`, and `move_tag`; stories from `getPublishedAutopsyStories` + `getAutopsyCompanies` + `savedStories`), fetch `reading_progress` rows for the user with the admin client (`select content_type,parent_id,content_id,progress` where `user_id`, `progress>0`, limit 20), and `return <LibraryV2 input={…} type={(type as LibraryType) ?? 'all'} q={q ?? null} />`. Legacy path unchanged.

- [ ] **Step 5: Verify**: with the flag on, `/explore` shows the title row, chips, featured card (height 160), then shelves; `[data-testid=shelf-learning]` or `[data-testid=shelf-plans]` top ≤ 340 at 1440×900. `/explore?type=saved` shows only saved stories. `/explore?q=gmail` filters. Commit:

```bash
git add src/components/density/library src/app/(app)/explore/page.tsx
git commit -m "feat(density): LibraryV2 shelves behind ui_density_v1"
```

**Wiring table:** chips → `/explore?type=`; featured → story href; every cover card → item href; "more" links → list pages; top-bar search → `/explore?q=` (plan 01).

---

### Task 3: Practice band with functional Hatch's pick

**Files:**
- Create: `src/components/density/practice/PracticeBand.tsx`
- Modify: `src/app/(app)/challenges/HatchPick.tsx`

- [ ] **Step 1: `PracticeBand`** (client; consumes `useNextChallenge()` like `HatchPick.tsx` does)

```tsx
// src/components/density/practice/PracticeBand.tsx
'use client'
import { useSearchParams } from 'next/navigation'
import { HeaderBand } from '@/components/density/HeaderBand'
import { HatchPickCard } from '@/components/density/HatchPickCard'
import { useNextChallenge } from '@/components/redesign/practice/useNextChallenge'
import { challengePath } from '@/lib/challenges/challengeNumber'

export function PracticeBand() {
  const sp = useSearchParams(); const resume = sp.get('resume') === '1'
  const { data, loading } = useNextChallenge()
  const c = data?.challenge
  return (
    <HeaderBand
      title="Practice"
      chips={[{ label: 'Practice interviews →', href: '/live-interviews', testId: 'chip-interviews' }, { label: 'Resume only', href: resume ? '/challenges' : '/challenges?resume=1', active: resume, testId: 'chip-resume' }]}
      right={c ? <HatchPickCard eyebrow="Hatch's pick" title={c.title} reason={data.tip ?? data.reason} href={`/workspace/challenges/${c.slug ?? c.id}?returnTo=%2Fchallenges`} ctaLabel="Try now" dismissScope="practice" testId="practice-hatch-pick" /> : loading ? <div className="h-[56px] animate-pulse rounded-xl bg-surface-container-high" /> : null}
    />
  )
}
```

Check `useNextChallenge()`'s return shape in `src/components/redesign/practice/useNextChallenge.ts` (it caches `GET /api/challenges/next`); use its actual field names. `challengePath` import is only needed if the hook returns a challenge without `slug`; otherwise remove it.

- [ ] **Step 2: Refresh after completion**: in `useNextChallenge.ts`, invalidate the module-level `cached` promise on the `challenge-completed` window event (add once at module scope: `if (typeof window !== 'undefined') window.addEventListener('challenge-completed', () => { cached = null })`) so the pick refreshes after the recommended challenge is completed. If `cached` is `const`, change it to `let`.

- [ ] **Step 3: Commit**

```bash
git add src/components/density/practice/PracticeBand.tsx src/components/redesign/practice/useNextChallenge.ts
git commit -m "feat(density): Practice band with dismissible, refreshing Hatch's pick"
```

**Wiring table:** title → none (h1); "Practice interviews →" → `/live-interviews`; "Resume only" → toggles `?resume=1`; pick title/CTA → workspace URL with `returnTo`; ✕ → 24h localStorage dismiss; `challenge-completed` → re-fetch.

---

### Task 4: View toggle, card mode, page assembly

**Files:**
- Create: `src/components/density/practice/ViewToggle.tsx`, `src/components/density/practice/ChallengeCardV3.tsx`
- Modify: `src/app/(app)/challenges/FilteredChallengesView.tsx:220` (view source), `src/components/challenges/FilterDropdownBar.tsx` (render `ViewToggle` in the density branch), `src/app/(app)/challenges/FreePracticeContent.tsx:124-153`

- [ ] **Step 1: `ViewToggle`** (persists to `ui_prefs.practice_view`)

```tsx
// src/components/density/practice/ViewToggle.tsx
'use client'
import { LayoutGrid, List } from 'lucide-react'
import { useUiShell } from '@/components/shell-v2/UiShellContext'
export function ViewToggle() {
  const { practiceView, setPracticeView } = useUiShell()
  const b = (on: boolean) => `grid size-7 place-items-center ${on ? 'bg-forest-800 text-white' : 'bg-card-bright text-ink-secondary'}`
  return (
    <div role="group" aria-label="View" className="inline-flex overflow-hidden rounded-lg border border-hairline">
      <button type="button" data-testid="view-cards" aria-pressed={practiceView === 'cards'} onClick={() => setPracticeView('cards')} className={b(practiceView === 'cards')}><LayoutGrid size={14} aria-hidden /></button>
      <button type="button" data-testid="view-list" aria-pressed={practiceView === 'list'} onClick={() => setPracticeView('list')} className={b(practiceView === 'list')}><List size={14} aria-hidden /></button>
    </div>
  )
}
```

- [ ] **Step 2: `ChallengeCardV3`**

Reuse the props `ChallengeCard.tsx` receives (`challenge` row with `is_in_progress`, `is_completed`, `difficulty`, `challenge_type`, `technique_tags`, `topic_tags`, plus `summary`, `returnHref`, `locked`). Read `ChallengeCard.tsx` L17-63 for the `disciplines` map and the href rule and mirror it.

```tsx
// src/components/density/practice/ChallengeCardV3.tsx
import Link from 'next/link'
import { GeoArt } from '@/components/density/GeoArt'
import { appendReturnTo } from '@/lib/navigation/return-to'
import { challengePath } from '@/lib/challenges/challengeNumber'
import { DIFFICULTY_LABELS, coerceDifficulty } from '@/lib/practice/difficulty'

const TYPE_LABEL: Record<string, string> = { algorithm: 'Coding', sql: 'SQL', system_design: 'Design', data_modeling: 'Modeling', flow: 'Product', freeform: 'Product', analytics: 'Analytics' }
const DIFF_CLS: Record<string, string> = { easy: 'bg-amber-soft text-tertiary', medium: 'bg-surface-container-highest text-on-surface-variant', hard: 'bg-[#f5d5d3] text-error' }

export function ChallengeCardV3({ challenge, summary, returnHref, locked, hatchPick }: { challenge: any; summary?: string; returnHref: string; locked?: boolean; hatchPick?: boolean }) {
  const destination = challengePath(challenge)
  const href = appendReturnTo(challenge.is_in_progress ? `${destination}?resume=1` : destination, returnHref)
  const diff = coerceDifficulty(challenge.difficulty)
  const cta = locked ? 'View' : challenge.is_completed ? 'Review' : challenge.is_in_progress ? 'Resume' : 'Start'
  return (
    <div data-testid="challenge-card" className={`flex flex-col rounded-2xl border bg-card-bright p-3 ${hatchPick ? 'border-primary-fixed' : 'border-hairline'}`}>
      <GeoArt seed={challenge.slug ?? challenge.id} height={44} className="mb-2 rounded-lg" />
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1.5"><span className="rounded-full bg-primary-fixed px-2 py-0.5 text-[10px] font-bold text-forest-800">{TYPE_LABEL[challenge.challenge_type] ?? challenge.challenge_type}</span><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${DIFF_CLS[diff] ?? DIFF_CLS.medium}`}>{DIFFICULTY_LABELS[diff] ?? diff}</span></div>
        {hatchPick && <span className="text-[11px] font-bold text-primary">Hatch's pick</span>}
      </div>
      <Link href={href} className="mt-2 line-clamp-2 font-headline text-[15px] font-bold leading-tight hover:underline">{challenge.title}</Link>
      {summary && <p className="mt-1 line-clamp-2 text-[12px] text-ink-secondary">{summary}</p>}
      <div className="mt-auto flex items-center justify-between pt-2.5">
        <span className="rounded-full border border-hairline px-2 py-0.5 text-[10px]">{challenge.technique_tags?.[0] ?? challenge.topic_tags?.[0] ?? TYPE_LABEL[challenge.challenge_type] ?? ''}</span>
        <Link href={href} data-testid="challenge-cta" className={`rounded-full px-3 py-1.5 text-[12px] font-bold ${cta === 'Start' ? 'bg-forest-800 text-white' : 'border border-hairline bg-card-bright text-ink-strong'}`}>{cta}</Link>
      </div>
    </div>
  )
}
```

No "In progress" text anywhere; state is carried by the `Resume` label only.

- [ ] **Step 3: View source of truth**

In `FilteredChallengesView.tsx`: replace `const listView = parsedParams.get('view') !== 'grid'` (L220) with:

```ts
const { density, practiceView } = useUiShell()
const listView = density ? practiceView !== 'cards' : parsedParams.get('view') !== 'grid'
```

and in the toggle handler (L276-282) when `density` is true call `setPracticeView(listView ? 'cards' : 'list')` instead of `history.replaceState`. Where cards render in grid mode (the `ChallengeCard` usages inside `AllPracticeSection`/`FlatDisciplineList`), render `ChallengeCardV3` when `density` is true, passing `hatchPick={challenge.id === nextPickId}` where `nextPickId` comes from `useNextChallenge().data?.challenge?.id`. In `FilterDropdownBar.tsx`, when `density` is true render `<ViewToggle />` in the toolbar's right slot for every discipline (not only `all`) and hide the legacy toggle.

- [ ] **Step 4: Page assembly**

In `FreePracticeContent.tsx` L124-142: when `getAppFlag('ui_density_v1')` is true render:

```tsx
<PracticeBand />
{/* no page-level ChallengeSearch; top bar search is scoped to /challenges */}
<BillingUsageFromProfile className="lg:hidden …" />
<FilteredChallengesView … />
```

instead of the `LearningGeometry` header, `HatchPick` and `ChallengeSearch`. Keep `main`'s `data-tour-target="practice-hero"` on the wrapper so the intro tour still anchors. The `q` param remains read by the server (`filters.q`) so the top-bar search works.

- [ ] **Step 5: Verify**: `/challenges` flag on: band ≤ 96px tall, first `[data-testid=challenge-card]` or first list row top ≤ 260; toggle switches modes and persists across reload; `?q=sum` from the top bar filters; the pick ✕ hides the card and reload keeps it hidden for the session day. Commit:

```bash
git add src/components/density/practice src/app/(app)/challenges src/components/challenges/FilterDropdownBar.tsx
git commit -m "feat(density): Practice band, persisted view toggle, card mode"
```

---

### Task 5: E2E

**Files:**
- Create: `e2e/density/library-practice.spec.ts`

- [ ] **Step 1: Spec**

```ts
import { test, expect } from '@playwright/test'
import { VIEWPORTS, loginViaApi, gotoReady, topOf, expectNoConsoleErrors } from './helpers'

test.describe('library + practice', () => {
  test.beforeEach(async ({ page }) => { await loginViaApi(page); await page.setViewportSize(VIEWPORTS.desktop) })

  test('library shelves, chips and featured', async ({ page }) => {
    await expectNoConsoleErrors(page, async () => { await gotoReady(page, '/explore') })
    const featured = page.getByTestId('lib-featured'); await expect(featured).toBeVisible(); expect((await featured.boundingBox())!.height).toBeLessThanOrEqual(170)
    const firstShelf = page.locator('[data-testid^=shelf-]').first(); expect(Math.round((await firstShelf.boundingBox())!.y)).toBeLessThanOrEqual(340)
    const arts = await page.locator('[data-testid=lib-card] [data-geo]').evaluateAll(els => els.slice(0, 8).map(e => e.getAttribute('data-geo')))
    expect(new Set(arts).size).toBeGreaterThanOrEqual(4)
    await page.getByTestId('lib-chip-saved').click(); await expect(page).toHaveURL(/type=saved/); await expect(page.getByTestId('lib-featured')).toHaveCount(0)
    await page.getByTestId('lib-chip-all').click(); const card = page.getByTestId('lib-card').first(); const href = await card.getAttribute('href'); await card.click(); await expect(page).toHaveURL(new RegExp(href!.replace(/[?]/g, '\\?')))
  })

  test('practice band, toggle persistence, card mode, pick dismiss', async ({ page }) => {
    await gotoReady(page, '/challenges')
    expect((await page.getByTestId('header-band').boundingBox())!.height).toBeLessThanOrEqual(100)
    await expect(page.getByTestId('chip-interviews')).toHaveAttribute('href', '/live-interviews')
    await page.getByTestId('view-cards').click(); await expect(page.getByTestId('challenge-card').first()).toBeVisible()
    expect(await topOf(page, '[data-testid=challenge-card]')).toBeLessThanOrEqual(270)
    await expect(page.getByText('In progress', { exact: true })).toHaveCount(0)
    await page.reload(); await gotoReady(page, '/challenges'); await expect(page.getByTestId('view-cards')).toHaveAttribute('aria-pressed', 'true')
    const pick = page.getByTestId('practice-hatch-pick'); if (await pick.count()) { const h = await pick.locator('a').first().getAttribute('href'); expect(h).toMatch(/\/workspace\/challenges\//); await page.getByTestId('practice-hatch-pick-dismiss').click(); await expect(pick).toHaveCount(0); await page.reload(); await gotoReady(page, '/challenges'); await expect(page.getByTestId('practice-hatch-pick')).toHaveCount(0) }
    await page.getByTestId('view-list').click(); await expect(page.getByTestId('challenge-card')).toHaveCount(0)
    const cta = page.getByTestId('challenge-cta').or(page.locator('a:has-text("Resume"), a:has-text("Start")')).first(); const href = await cta.getAttribute('href'); expect(href).toMatch(/\/workspace\/challenges\/.+returnTo=/)
  })

  test('mobile', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile); await gotoReady(page, '/challenges'); await expect(page.getByTestId('header-band')).toBeVisible(); await gotoReady(page, '/explore'); await expect(page.getByTestId('lib-featured')).toBeVisible()
  })
})
```

- [ ] **Step 2: Run** → 3 passed. Commit: `git add e2e/density/library-practice.spec.ts && git commit -m "test(density): library and practice E2E"`.

## Self-review
- Spec §4.4 (Library): Tasks 1-2. §4.5 (Practice): Tasks 3-4. §3.4 cover cards with eight compositions: `artIndex` rotates by position and `GeoArt` seeds by id. Orphans: none; chips, cards, toggle, pick, dismiss all wired.

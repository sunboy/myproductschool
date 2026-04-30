# Attempted Indicator on Challenge Cards — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a status icon (check_circle / incomplete_circle / circle) on every challenge card surface so users can see at a glance which challenges they have already attempted or completed.

**Architecture:** Fix is purely in the server data layer. Add a `buildStatsMap` helper to `src/lib/data/challenges.ts` that takes challenge IDs + attempt rows and returns a per-challenge stats map. Wire it into `getChallenges()` and `getFeaturedChallenges()`. Add a post-Promise.all batch fetch in the explore page for the three inline snippet sections. Add the status icon to the Practice Hub grid/list card. The explore snippet cards render inline JSX (not a shared component), so the indicator is added there directly.

**Tech Stack:** Next.js 16 App Router, Supabase (server client), TypeScript, Tailwind CSS v4, Material Symbols Outlined icons.

---

## File Map

| File | Change |
|---|---|
| `src/lib/data/challenges.ts` | Export `buildStatsMap` helper; use it in `getChallenges()` and `getFeaturedChallenges()` |
| `src/app/(app)/challenges/ChallengeCard.tsx` | Add status icon to grid card top row and list row |
| `src/app/(app)/explore/page.tsx` | Batch attempt stats fetch after Promise.all; spread into inline snippet card JSX |

---

## Task 1: Add `buildStatsMap` helper and wire it into `getChallenges()`

**Files:**
- Modify: `src/lib/data/challenges.ts`

The `getChallenges()` function currently hardcodes `attempt_count: 0, best_score: null, is_completed: false`. We need to query `challenge_attempts` for the current user and merge the results. We extract `buildStatsMap` as a named export so the explore page can reuse it.

- [ ] **Step 1: Read the current file to understand the full shape**

```bash
# Already read in planning — confirm it still looks like lines 1–48 shown in the spec
```

- [ ] **Step 2: Replace the contents of `src/lib/data/challenges.ts` with the updated version**

Replace the entire file with:

```typescript
import { Challenge, ChallengeWithDomain, ChallengeAttemptV2 } from '@/lib/types'
import { MOCK_CHALLENGES, MOCK_DOMAINS } from '@/lib/mock-data'
import { IS_MOCK } from '@/lib/mock'

type AttemptRow = Pick<ChallengeAttemptV2, 'challenge_id' | 'total_score' | 'status'>

interface ChallengeStats {
  attempt_count: number
  best_score: number | null
  is_completed: boolean
}

export function buildStatsMap(
  challengeIds: string[],
  attempts: AttemptRow[],
): Map<string, ChallengeStats> {
  const map = new Map<string, ChallengeStats>()
  for (const id of challengeIds) {
    map.set(id, { attempt_count: 0, best_score: null, is_completed: false })
  }
  for (const attempt of attempts) {
    const existing = map.get(attempt.challenge_id)
    if (!existing) continue
    existing.attempt_count += 1
    if (attempt.status === 'completed') {
      existing.is_completed = true
      if (attempt.total_score !== null) {
        existing.best_score =
          existing.best_score === null
            ? attempt.total_score
            : Math.max(existing.best_score, attempt.total_score)
      }
    }
  }
  return map
}

export async function getChallenges(filters?: {
  domainId?: string
  difficulty?: string
  paradigm?: string
  role?: string
  company?: string
  q?: string
  type?: string
}): Promise<ChallengeWithDomain[]> {
  if (IS_MOCK) {
    let challenges = MOCK_CHALLENGES
    if (filters?.domainId) challenges = challenges.filter(c => c.domain_id === filters.domainId)
    if (filters?.difficulty) challenges = challenges.filter(c => c.difficulty === filters.difficulty)

    return challenges.map(challenge => {
      const domain = MOCK_DOMAINS.find(d => d.id === challenge.domain_id)
      return {
        ...challenge,
        domain: { slug: domain?.slug ?? '', title: domain?.title ?? '', icon: domain?.icon ?? null },
        attempt_count: 0,
        best_score: null,
        is_completed: false,
      }
    })
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from('challenges')
    .select('*, domains(slug, title, icon)')
    .eq('is_published', true)
    .neq('challenge_type', 'quick_take')

  if (filters?.domainId) query = query.eq('domain_id', filters.domainId)
  if (filters?.difficulty) query = query.eq('difficulty', filters.difficulty)
  if (filters?.paradigm && filters.paradigm !== 'all') query = query.eq('paradigm', filters.paradigm)
  if (filters?.role && filters.role !== 'all') query = query.contains('relevant_roles', [filters.role])
  if (filters?.company) query = query.contains('company_tags', [filters.company])
  if (filters?.q) query = query.ilike('title', `%${filters.q}%`)
  if (filters?.type && filters.type !== 'all') query = query.eq('challenge_type', filters.type)
  const { data } = await query.order('created_at', { ascending: false })

  const challengeIds = (data ?? []).map(c => c.id)

  const { data: attempts } =
    user && challengeIds.length > 0
      ? await supabase
          .from('challenge_attempts')
          .select('challenge_id, total_score, status')
          .eq('user_id', user.id)
          .in('challenge_id', challengeIds)
      : { data: null }

  const statsMap = buildStatsMap(challengeIds, (attempts ?? []) as AttemptRow[])

  return (data ?? []).map(c => ({
    ...c,
    slug: c.slug ?? c.id.replace(/^c\d+-/, ''),
    domain: { slug: '', title: '', icon: null },
    ...(statsMap.get(c.id) ?? { attempt_count: 0, best_score: null, is_completed: false }),
  }))
}

export async function getFeaturedChallenges(): Promise<ChallengeWithDomain[]> {
  if (IS_MOCK) return []

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data } = await supabase
    .from('challenges')
    .select('*, domains(slug, title, icon)')
    .eq('is_published', true)
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(6)

  const challengeIds = (data ?? []).map(c => c.id)

  const { data: attempts } =
    user && challengeIds.length > 0
      ? await supabase
          .from('challenge_attempts')
          .select('challenge_id, total_score, status')
          .eq('user_id', user.id)
          .in('challenge_id', challengeIds)
      : { data: null }

  const statsMap = buildStatsMap(challengeIds, (attempts ?? []) as AttemptRow[])

  return (data ?? []).map(c => ({
    ...c,
    slug: c.slug ?? c.id.replace(/^c\d+-/, ''),
    domain: { slug: '', title: '', icon: null },
    ...(statsMap.get(c.id) ?? { attempt_count: 0, best_score: null, is_completed: false }),
  }))
}

export async function getChallengeById(id: string): Promise<Challenge | null> {
  if (IS_MOCK) {
    return (MOCK_CHALLENGES.find(c => c.id === id) ?? null) as unknown as Challenge | null
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data } = await supabase.from('challenges').select('*').eq('id', id).single()
  return data
}
```

- [ ] **Step 3: Type-check**

```bash
cd /Users/sandeep/Projects/myproductschool && npx tsc --noEmit 2>&1 | head -30
```

Expected: no new errors (pre-existing `supabase/functions/` Deno errors are acceptable).

- [ ] **Step 4: Commit**

```bash
git add src/lib/data/challenges.ts
git commit -m "feat(data): fetch user attempt stats in getChallenges and getFeaturedChallenges"
```

---

## Task 2: Add status icon to the Practice Hub `ChallengeCard`

**Files:**
- Modify: `src/app/(app)/challenges/ChallengeCard.tsx`

This card is used in the Practice Hub grid and list views. It already reads `attempt_count` but shows only a number — no icon. We add a computed `statusIcon` variable and render the icon in both the grid and list layouts.

- [ ] **Step 1: Read the current file**

Read `src/app/(app)/challenges/ChallengeCard.tsx` lines 173–341 to confirm the current structure before editing.

- [ ] **Step 2: Add `statusIcon` computed variable and render in the grid card**

In the `ChallengeCard` function body (after line 186, `const attempts = ...`), add:

```tsx
const statusIcon = challenge.is_completed
  ? { icon: 'check_circle', fill: 1, color: 'var(--color-primary)' }
  : attempts > 0
    ? { icon: 'incomplete_circle', fill: 0, color: 'var(--color-tertiary)' }
    : null
```

In the **grid card** top row `<div className="flex items-center justify-between gap-1.5">` (around line 274), after the difficulty `<span>`, add the status icon inside the existing `justify-between` wrapper on the right side:

The current right-side element is:
```tsx
<span className="flex items-center gap-1.5 text-[11px] font-medium font-label shrink-0" style={{ color: `${style.fg}bb` }}>
  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: diff.dot }} />
  {diff.label}
</span>
```

Replace the top-row `<div>` contents so that both the difficulty AND the status icon appear on the right:

```tsx
<div className="flex items-center justify-between gap-1.5">
  <div className="flex items-center gap-1.5 flex-wrap">
    <span
      className="text-[11px] font-bold px-2.5 py-0.5 rounded-full font-label"
      style={{ backgroundColor: 'rgba(255,255,255,0.7)', color: style.fg }}
    >
      {paradigm}
    </span>
    {(challenge.challenge_type === 'system_design' || challenge.challenge_type === 'data_modeling') && (
      <span className="bg-secondary-container text-on-secondary-container rounded-full text-xs px-2 py-0.5 font-label">
        {challenge.challenge_type === 'system_design' ? 'System Design' : 'Data Modeling'}
      </span>
    )}
  </div>
  <div className="flex items-center gap-1.5 shrink-0">
    {statusIcon && (
      <span
        className="material-symbols-outlined text-[16px]"
        style={{
          fontVariationSettings: `'FILL' ${statusIcon.fill}`,
          color: statusIcon.color,
        }}
      >
        {statusIcon.icon}
      </span>
    )}
    <span className="flex items-center gap-1.5 text-[11px] font-medium font-label" style={{ color: `${style.fg}bb` }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: diff.dot }} />
      {diff.label}
    </span>
  </div>
</div>
```

- [ ] **Step 3: Update the list row attempt count span**

In the **list view** section (around line 232–235), find the current attempt count span:

```tsx
{/* Attempts */}
<span className="hidden sm:flex text-[11px] text-on-surface-variant font-label items-center gap-1 shrink-0 w-16 justify-end">
  <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 0", color: style.accent }}>group</span>
  {attempts > 0 ? `${attempts}` : '—'}
</span>
```

Replace it with:

```tsx
{/* Status + attempts */}
<span className="hidden sm:flex items-center gap-1 shrink-0 w-16 justify-end">
  <span
    className="material-symbols-outlined text-[13px]"
    style={{
      fontVariationSettings: `'FILL' ${challenge.is_completed ? 1 : 0}`,
      color: challenge.is_completed
        ? 'var(--color-primary)'
        : attempts > 0
          ? 'var(--color-tertiary)'
          : `color-mix(in srgb, var(--color-on-surface) 40%, transparent)`,
    }}
  >
    {challenge.is_completed
      ? 'check_circle'
      : attempts > 0
        ? 'incomplete_circle'
        : 'circle'}
  </span>
  <span className="text-[11px] text-on-surface-variant font-label">
    {attempts > 0 ? attempts : '—'}
  </span>
</span>
```

- [ ] **Step 4: Type-check**

```bash
cd /Users/sandeep/Projects/myproductschool && npx tsc --noEmit 2>&1 | head -30
```

Expected: clean (pre-existing Deno errors acceptable).

- [ ] **Step 5: Commit**

```bash
git add src/app/(app)/challenges/ChallengeCard.tsx
git commit -m "feat(ui): add status icon to Practice Hub challenge card grid and list views"
```

---

## Task 3: Wire attempt stats into the Explore page snippet cards

**Files:**
- Modify: `src/app/(app)/explore/page.tsx`

The explore page has three inline snippet sections (Coding, System Design, Data Modeling) that each render bespoke `<a>` cards. The challenge data for these sections is fetched inside `Promise.all` without attempt data. We need to:
1. Add a post-Promise.all batch attempt fetch using the already-available `user` variable
2. Add a status icon to each of the three inline card renderers

- [ ] **Step 1: Add `buildStatsMap` import**

At the top of `src/app/(app)/explore/page.tsx`, find the existing imports and add:

```typescript
import { buildStatsMap } from '@/lib/data/challenges'
```

- [ ] **Step 2: Add the batch attempt fetch after `Promise.all`**

After the `Promise.all` block resolves (after line 222 approximately — the closing `])` of the Promise.all), add:

```typescript
  // Batch fetch attempt stats for inline snippet cards
  const allSnippetIds = [
    ...codingChallenges.map(c => c.id),
    ...systemDesignChallenges.map(c => c.id),
    ...dataModelingChallenges.map(c => c.id),
  ]

  const { data: snippetAttempts } =
    user && allSnippetIds.length > 0
      ? await supabase
          .from('challenge_attempts')
          .select('challenge_id, total_score, status')
          .eq('user_id', user.id)
          .in('challenge_id', allSnippetIds)
      : { data: null }

  const snippetStatsMap = buildStatsMap(
    allSnippetIds,
    (snippetAttempts ?? []) as { challenge_id: string; total_score: number | null; status: string }[],
  )
```

- [ ] **Step 3: Add status icon to the Coding snippet cards**

In the coding section (around line 714), inside the `.map((c) => { ... })`, find the top badges `<div>`:

```tsx
<div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
  <span className="bg-surface-container-high text-on-surface rounded-full text-xs px-2 py-0.5 font-label font-semibold border border-outline-variant/40">
    {c.challenge_type === 'sql' ? 'SQL' : 'Algorithms'}
  </span>
  ...
</div>
```

Add a status icon lookup before the `return` in the map callback, and render it after the title:

Before the `return (`:
```typescript
const snippetStats = snippetStatsMap.get(c.id)
const snippetIcon = snippetStats?.is_completed
  ? { icon: 'check_circle', fill: 1, color: '#4a7c59' }
  : (snippetStats?.attempt_count ?? 0) > 0
    ? { icon: 'incomplete_circle', fill: 0, color: '#705c30' }
    : null
```

After the title `<div>` (the one with `fontFamily: 'var(--font-headline)'`), add:
```tsx
{snippetIcon && (
  <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
    <span
      className="material-symbols-outlined"
      style={{
        fontSize: 14,
        fontVariationSettings: `'FILL' ${snippetIcon.fill}`,
        color: snippetIcon.color,
      }}
    >
      {snippetIcon.icon}
    </span>
    <span style={{ fontSize: 11, color: snippetIcon.color, fontWeight: 600 }}>
      {snippetStats?.is_completed
        ? 'Completed'
        : `${snippetStats?.attempt_count} attempt${(snippetStats?.attempt_count ?? 0) !== 1 ? 's' : ''}`}
    </span>
  </div>
)}
```

- [ ] **Step 4: Add status icon to the System Design snippet cards**

In the system design section (around line 789), inside the `.map((c) => { ... })`, before the `return (`:

```typescript
const sdStats = snippetStatsMap.get(c.id)
const sdIcon = sdStats?.is_completed
  ? { icon: 'check_circle', fill: 1, color: '#2d7aa8' }
  : (sdStats?.attempt_count ?? 0) > 0
    ? { icon: 'incomplete_circle', fill: 0, color: '#5a5a80' }
    : null
```

After the title `<div style={{ fontFamily: 'var(--font-headline)', ... }}>` in the system design cards, add:
```tsx
{sdIcon && (
  <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
    <span
      className="material-symbols-outlined"
      style={{
        fontSize: 14,
        fontVariationSettings: `'FILL' ${sdIcon.fill}`,
        color: sdIcon.color,
      }}
    >
      {sdIcon.icon}
    </span>
    <span style={{ fontSize: 11, color: sdIcon.color, fontWeight: 600 }}>
      {sdStats?.is_completed
        ? 'Completed'
        : `${sdStats?.attempt_count} attempt${(sdStats?.attempt_count ?? 0) !== 1 ? 's' : ''}`}
    </span>
  </div>
)}
```

- [ ] **Step 5: Add status icon to the Data Modeling snippet cards**

Read lines 836–880 of `src/app/(app)/explore/page.tsx` to find the data modeling map callback, then apply the same pattern:

Before the `return (` in the data modeling map:
```typescript
const dmStats = snippetStatsMap.get(c.id)
const dmIcon = dmStats?.is_completed
  ? { icon: 'check_circle', fill: 1, color: '#8a3c80' }
  : (dmStats?.attempt_count ?? 0) > 0
    ? { icon: 'incomplete_circle', fill: 0, color: '#8a3c80' }
    : null
```

After the title `<div>` in the data modeling card, add:
```tsx
{dmIcon && (
  <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
    <span
      className="material-symbols-outlined"
      style={{
        fontSize: 14,
        fontVariationSettings: `'FILL' ${dmIcon.fill}`,
        color: dmIcon.color,
      }}
    >
      {dmIcon.icon}
    </span>
    <span style={{ fontSize: 11, color: dmIcon.color, fontWeight: 600 }}>
      {dmStats?.is_completed
        ? 'Completed'
        : `${dmStats?.attempt_count} attempt${(dmStats?.attempt_count ?? 0) !== 1 ? 's' : ''}`}
    </span>
  </div>
)}
```

- [ ] **Step 6: Type-check**

```bash
cd /Users/sandeep/Projects/myproductschool && npx tsc --noEmit 2>&1 | head -30
```

Expected: clean (pre-existing Deno errors acceptable).

- [ ] **Step 7: Commit**

```bash
git add src/app/(app)/explore/page.tsx
git commit -m "feat(explore): show attempted/completed status on coding, system design, and data modeling snippet cards"
```

---

## Task 4: Playwright smoke test

**Files:**
- No source changes — verification only

- [ ] **Step 1: Start the dev server**

```bash
cd /Users/sandeep/Projects/myproductschool && npm run dev &
```

Wait ~5 seconds for it to be ready.

- [ ] **Step 2: Run a Playwright snapshot to verify the Practice Hub**

Use the browser MCP tool or a Haiku sub-agent to:
1. Navigate to `http://localhost:3000/challenges`
2. Take a screenshot
3. Confirm: challenge cards render without errors; if any attempts exist for the logged-in user, the `check_circle` or `incomplete_circle` icon is visible

- [ ] **Step 3: Run a Playwright snapshot to verify the Explore page**

1. Navigate to `http://localhost:3000/explore`
2. Take a screenshot
3. Confirm: Coding, System Design, and Data Modeling snippet cards render without JS errors; status icons appear for attempted challenges

- [ ] **Step 4: Verify unauthenticated state**

Log out (or open an incognito tab), navigate to `/challenges` — all cards should render normally with no status icon (not started state), no JS errors.

---

## Verification Checklist (manual)

1. Authenticated user with completed challenges → `/challenges` grid shows filled `check_circle` in primary green
2. Authenticated user with in-progress challenges → `/challenges` grid shows `incomplete_circle` in tertiary amber
3. `/challenges` list view → same icons inline in the row
4. `/explore` coding snippet cards → correct icon for attempted/completed challenges
5. `/explore` system design and data modeling snippet cards → correct icon
6. Unauthenticated / no attempts → all cards show no icon (or empty circle in list view), no errors

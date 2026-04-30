# SQL vs Algorithm Challenge Separation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single `challenge_type='coding'` with first-class `'sql'` and `'algorithm'` types, backfill existing DB rows safely, and add a SQL/Algorithms sub-tab strip to the Practice hub's Coding discipline view.

**Architecture:** A DB migration backfills existing rows using `metadata->>'sql_schema' IS NOT NULL` to identify SQL challenges. TypeScript types are updated to remove `'coding'` and add `'sql' | 'algorithm'`. The Practice hub gains a `CodingSubTabStrip` component rendered when the Coding discipline tab is active, routing via `?discipline=coding&sub=sql|algorithm`. The Explore page's DisciplineGrid keeps one "Coding" card counting both sub-types.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase (Postgres), Tailwind CSS v4, shadcn/ui

---

## File Map

| Action | File | What changes |
|--------|------|-------------|
| Create | `supabase/migrations/072_sql_algorithm_challenge_types.sql` | Backfill migration |
| Modify | `src/lib/types.ts:550` | Replace `'coding'` with `'sql' \| 'algorithm'` in `ChallengeType` |
| Modify | `src/components/v2/FlowWorkspace.tsx:475,609` | Update `isCodingChallenge`, language detection |
| Create | `src/components/challenges/CodingSubTabStrip.tsx` | New sub-tab component |
| Modify | `src/app/(app)/challenges/FilteredChallengesView.tsx` | Sub-tab state + filter logic |
| Modify | `src/app/(app)/challenges/page.tsx` | Pass `sub` searchParam |
| Modify | `src/app/(app)/explore/page.tsx:186-221,224-253` | Queries + count aggregation |
| Modify | `src/components/explore/DisciplineGrid.tsx:40` | Card link |
| Modify | `scripts/commit-interview-seeds.ts:157` | Map `is_sql` → correct type |

---

## Task 1: DB Migration — backfill `'sql'` and `'algorithm'`

**Files:**
- Create: `supabase/migrations/072_sql_algorithm_challenge_types.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- 072_sql_algorithm_challenge_types.sql
-- Replace challenge_type='coding' with first-class 'sql' and 'algorithm' types.
-- SQL challenges are identified by metadata->>'sql_schema' IS NOT NULL.

-- 1. Widen CHECK to allow new types alongside 'coding' (still present for safety during transition)
ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_challenge_type_check;
ALTER TABLE challenges ADD CONSTRAINT challenges_challenge_type_check
  CHECK (challenge_type IN (
    'flow', 'freeform', 'quick_take',
    'system_design', 'data_modeling',
    'sql', 'algorithm', 'coding'
  ));

-- 2. Backfill SQL challenges — identified by presence of sql_schema in metadata
UPDATE challenges
SET challenge_type = 'sql'
WHERE challenge_type = 'coding'
  AND metadata->>'sql_schema' IS NOT NULL;

-- 3. Backfill remaining coding rows → algorithm
UPDATE challenges
SET challenge_type = 'algorithm'
WHERE challenge_type = 'coding';

-- 4. Drop 'coding' from CHECK — no rows should have it now
ALTER TABLE challenges DROP CONSTRAINT challenges_challenge_type_check;
ALTER TABLE challenges ADD CONSTRAINT challenges_challenge_type_check
  CHECK (challenge_type IN (
    'flow', 'freeform', 'quick_take',
    'system_design', 'data_modeling',
    'sql', 'algorithm'
  ));

-- 5. Mirror change in interview_grades CHECK
ALTER TABLE interview_grades DROP CONSTRAINT IF EXISTS interview_grades_challenge_type_check;
ALTER TABLE interview_grades ADD CONSTRAINT interview_grades_challenge_type_check
  CHECK (challenge_type IN ('system_design', 'data_modeling', 'sql', 'algorithm'));
```

- [ ] **Step 2: Apply migration to local Supabase**

```bash
npx supabase db push
```

Expected: migration runs without error.

- [ ] **Step 3: Verify backfill**

```bash
npx supabase db diff --local
```

Then in Supabase Studio or via psql, run:
```sql
SELECT challenge_type, count(*) FROM challenges GROUP BY challenge_type;
```

Expected: rows with `challenge_type = 'sql'` (those that had `sql_schema`), rows with `challenge_type = 'algorithm'` (the rest). Zero rows with `challenge_type = 'coding'`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/072_sql_algorithm_challenge_types.sql
git commit -m "feat(db): replace coding challenge_type with sql and algorithm"
```

---

## Task 2: Update TypeScript types

**Files:**
- Modify: `src/lib/types.ts:550`

- [ ] **Step 1: Update `ChallengeType`**

In `src/lib/types.ts` line 550, replace:
```typescript
export type ChallengeType = 'flow' | 'freeform' | 'quick_take' | 'system_design' | 'data_modeling' | 'coding'
```
with:
```typescript
export type ChallengeType = 'flow' | 'freeform' | 'quick_take' | 'system_design' | 'data_modeling' | 'sql' | 'algorithm'
```

- [ ] **Step 2: Check TypeScript immediately**

```bash
npx tsc --noEmit 2>&1 | head -40
```

Expected: errors referencing `'coding'` — these are the callsites to fix in subsequent tasks. Note them all before continuing.

- [ ] **Step 3: Commit the type change only**

```bash
git add src/lib/types.ts
git commit -m "feat(types): replace ChallengeType 'coding' with 'sql' | 'algorithm'"
```

---

## Task 3: Update `FlowWorkspace.tsx`

**Files:**
- Modify: `src/components/v2/FlowWorkspace.tsx:475,609`

- [ ] **Step 1: Fix `isCodingChallenge` detection (line 475)**

Find (lines 473-478):
```typescript
  const apiChallengeType = isApiMode ? detail?.challenge?.challenge_type : undefined
  const isCanvasChallenge = apiChallengeType === 'system_design' || apiChallengeType === 'data_modeling'
  const isCodingChallenge = apiChallengeType === 'coding'
  // Either canvas or coding — both are full-panel interview modes (no MCQ FLOW steps)
  const isInterviewChallenge = isCanvasChallenge || isCodingChallenge
```

Replace with:
```typescript
  const apiChallengeType = isApiMode ? detail?.challenge?.challenge_type : undefined
  const isCanvasChallenge = apiChallengeType === 'system_design' || apiChallengeType === 'data_modeling'
  const isCodingChallenge = apiChallengeType === 'sql' || apiChallengeType === 'algorithm'
  // Either canvas or coding — both are full-panel interview modes (no MCQ FLOW steps)
  const isInterviewChallenge = isCanvasChallenge || isCodingChallenge
```

- [ ] **Step 2: Fix language detection (around line 609)**

Find (lines 606-610):
```typescript
    if (meta.sql_schema) {
      setCurrentLanguage('sql')
      return
    }
```

Replace with:
```typescript
    if (apiChallengeType === 'sql' || meta.sql_schema) {
      setCurrentLanguage('sql')
      return
    }
```

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep FlowWorkspace
```

Expected: no errors in `FlowWorkspace.tsx`.

- [ ] **Step 4: Commit**

```bash
git add src/components/v2/FlowWorkspace.tsx
git commit -m "feat(workspace): update coding type detection for sql|algorithm"
```

---

## Task 4: Create `CodingSubTabStrip` component

**Files:**
- Create: `src/components/challenges/CodingSubTabStrip.tsx`

- [ ] **Step 1: Create the component**

```typescript
'use client'

export type CodingSubDiscipline = 'sql' | 'algorithm'

interface Props {
  active: CodingSubDiscipline
  onChange: (sub: CodingSubDiscipline) => void
}

const TABS: { key: CodingSubDiscipline; label: string }[] = [
  { key: 'sql', label: 'SQL' },
  { key: 'algorithm', label: 'Algorithms' },
]

export function CodingSubTabStrip({ active, onChange }: Props) {
  return (
    <div className="flex gap-2 px-4 py-2 bg-surface border-b border-outline-variant">
      {TABS.map((tab) => {
        const isActive = active === tab.key
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={[
              'px-3 py-1 rounded-full font-label text-xs font-semibold transition-colors',
              isActive
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high',
            ].join(' ')}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep CodingSubTabStrip
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/challenges/CodingSubTabStrip.tsx
git commit -m "feat(components): add CodingSubTabStrip for sql/algorithm sub-tabs"
```

---

## Task 5: Update `FilteredChallengesView.tsx`

**Files:**
- Modify: `src/app/(app)/challenges/FilteredChallengesView.tsx`

- [ ] **Step 1: Add imports and sub-tab state**

At the top of `FilteredChallengesView.tsx`, add to imports:
```typescript
import { useRouter, useSearchParams } from 'next/navigation'
import { CodingSubTabStrip, type CodingSubDiscipline } from '@/components/challenges/CodingSubTabStrip'
```

Inside the component function, after the existing `useState` declarations, add:
```typescript
  const router = useRouter()
  const searchParams = useSearchParams()
  const [codingSub, setCodingSub] = useState<CodingSubDiscipline>(
    (searchParams.get('sub') as CodingSubDiscipline) ?? 'sql'
  )
```

- [ ] **Step 2: Update discipline filter logic**

In the `filteredChallenges` useMemo, find:
```typescript
      if (discipline === 'coding' && c.challenge_type !== 'coding') return false
```

Replace with:
```typescript
      if (discipline === 'coding') {
        if (codingSub === 'sql' && c.challenge_type !== 'sql') return false
        if (codingSub === 'algorithm' && c.challenge_type !== 'algorithm') return false
      }
```

Also add `codingSub` to the `useMemo` dependency array:
```typescript
  }, [challenges, discipline, filters, codingSub])
```

Also update the "all" view section — find where `disc === 'coding'` is filtered (look for the `['product_sense', 'system_design', 'data_modeling']` array in the JSX that renders grouped sections when `discipline === 'all'`). Add `'sql'` and `'algorithm'` handling:

In the `.map()` over disciplines in the "all" view (around line 130), the array and its labels/colors are:
```typescript
          {(['product_sense', 'system_design', 'data_modeling'] as const).map((disc) => {
            const labels: Record<string, string> = {
              product_sense: 'Product Sense',
              system_design: 'System Design',
              data_modeling: 'Data Modeling',
            }
```

Replace that entire section with:
```typescript
          {(['product_sense', 'system_design', 'data_modeling', 'sql', 'algorithm'] as const).map((disc) => {
            const labels: Record<string, string> = {
              product_sense: 'Product Sense',
              system_design: 'System Design',
              data_modeling: 'Data Modeling',
              sql: 'SQL',
              algorithm: 'Algorithms',
            }
            const colors: Record<string, string> = {
              product_sense: 'text-primary',
              system_design: 'text-tertiary',
              data_modeling: 'text-secondary',
              sql: 'text-[#3a5a7c]',
              algorithm: 'text-[#3a5a7c]',
            }
            const discChallenges = filteredChallenges.filter((c) => {
              if (disc === 'product_sense') return ['flow', 'freeform', 'quick_take'].includes(c.challenge_type ?? '')
              return c.challenge_type === disc
            })
```

Also update the `setDiscipline` call for SQL/Algorithm "see all" links — since `'sql'` and `'algorithm'` are not valid `Discipline` values in `DisciplineTabStrip`, clicking "see all" for them should set discipline to `'coding'` and `codingSub` appropriately:

In the `see all` button onClick inside that map:
```typescript
                    <button
                      onClick={() => {
                        if (disc === 'sql' || disc === 'algorithm') {
                          setDiscipline('coding')
                          setCodingSub(disc)
                        } else {
                          setDiscipline(disc as Discipline)
                        }
                      }}
                      className="font-label text-xs text-on-surface-variant font-normal hover:underline"
                    >
                      see all {discChallenges.length} →
                    </button>
```

- [ ] **Step 3: Add sub-tab handler and render**

Add a handler after the existing handlers:
```typescript
  function handleCodingSubChange(sub: CodingSubDiscipline) {
    setCodingSub(sub)
    const params = new URLSearchParams(searchParams.toString())
    params.set('sub', sub)
    router.push(`?${params.toString()}`)
  }
```

In the JSX, after `<DisciplineTabStrip active={discipline} onChange={setDiscipline} />`, add:
```tsx
      {/* Coding sub-tab strip — only visible when Coding discipline is active */}
      {discipline === 'coding' && (
        <CodingSubTabStrip active={codingSub} onChange={handleCodingSubChange} />
      )}
```

- [ ] **Step 4: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep FilteredChallengesView
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/(app)/challenges/FilteredChallengesView.tsx
git commit -m "feat(practice): add SQL/Algorithms sub-tabs to Coding discipline"
```

---

## Task 6: Fix `FreePracticeContent` to include `'sql'` and `'algorithm'` in the fetch

**Files:**
- Modify: `src/app/(app)/challenges/FreePracticeContent.tsx`
- Modify: `src/app/(app)/challenges/page.tsx` (if needed)

- [ ] **Step 1: Read FreePracticeContent**

```bash
cat src/app/\(app\)/challenges/FreePracticeContent.tsx
```

Look for the `getChallenges()` call and what `type` filter it passes. If it filters by `challenge_type = 'coding'` or passes a `type` param from searchParams that resolves to `'coding'`, all SQL and algorithm challenges will be excluded from the results.

- [ ] **Step 2: Ensure the fetch includes `'sql'` and `'algorithm'` challenges**

In `src/lib/data/challenges.ts`, find the `getChallenges()` function. If it accepts a `type` filter that maps discipline to challenge_type, update the mapping so `discipline='coding'` fetches both:

```typescript
// In getChallenges() or wherever discipline → challenge_type mapping happens:
if (filters.discipline === 'coding') {
  query = query.in('challenge_type', ['sql', 'algorithm'])
} else if (filters.type) {
  query = query.eq('challenge_type', filters.type)
}
```

If `FreePracticeContent` passes `type: searchParams.type` directly and that value is `'coding'`, update it to pass no type filter when discipline is coding (let `FilteredChallengesView` handle the sub-filtering client-side).

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep -E "FreePracticeContent|getChallenges"
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(app\)/challenges/FreePracticeContent.tsx src/lib/data/challenges.ts
git commit -m "feat(practice): fetch sql and algorithm challenges when discipline=coding"
```

---

## Task 7: Update Explore page queries and count aggregation

**Files:**
- Modify: `src/app/(app)/explore/page.tsx`

- [ ] **Step 1: Replace the single `codingChallenges` query with two parallel queries**

In `src/app/(app)/explore/page.tsx`, find the `codingChallenges` fetch (lines 186-196):
```typescript
    (async () => {
      try {
        const { data } = await supabase
          .from('challenges')
          .select('id, title, slug, difficulty, paradigm, challenge_type, prompt_text, company_tags, metadata')
          .eq('is_published', true)
          .eq('challenge_type', 'coding')
          .order('created_at', { ascending: false })
          .limit(4)
        return data ?? []
      } catch { return [] }
    })(),
```

Replace with two separate fetches — one for SQL and one for algorithm. In the `Promise.all` destructuring, replace `codingChallenges` with `sqlChallenges, algorithmChallenges`:

```typescript
// In Promise.all array, replace the one coding fetch with:
    (async () => {
      try {
        const { data } = await supabase
          .from('challenges')
          .select('id, title, slug, difficulty, paradigm, challenge_type, prompt_text, company_tags, metadata')
          .eq('is_published', true)
          .eq('challenge_type', 'sql')
          .order('created_at', { ascending: false })
          .limit(4)
        return data ?? []
      } catch { return [] }
    })(),
    (async () => {
      try {
        const { data } = await supabase
          .from('challenges')
          .select('id, title, slug, difficulty, paradigm, challenge_type, prompt_text, company_tags, metadata')
          .eq('is_published', true)
          .eq('challenge_type', 'algorithm')
          .order('created_at', { ascending: false })
          .limit(4)
        return data ?? []
      } catch { return [] }
    })(),
```

Update the destructuring at the top of `Promise.all`:
```typescript
// Before:
const [..., codingChallenges, systemDesignChallenges, dataModelingChallenges] = await Promise.all([...])

// After:
const [..., sqlChallenges, algorithmChallenges, systemDesignChallenges, dataModelingChallenges] = await Promise.all([...])
```

- [ ] **Step 2: Update discipline count aggregation**

Find (lines 224-253):
```typescript
  const counts: Record<string, number> = {
    product_sense: 0,
    system_design: 0,
    data_modeling: 0,
    coding: 0,
  }
  for (const row of disciplineCountRows) {
    ...
    } else if (row.challenge_type === 'coding') {
      counts.coding = (counts.coding ?? 0) + 1
    }
  }
```

Replace the `.in()` filter and aggregation:
```typescript
  // In the disciplineCountRows fetch, update .in() to use new types:
  .in('challenge_type', ['flow', 'freeform', 'quick_take', 'system_design', 'data_modeling', 'sql', 'algorithm'])

  // In the count loop:
  const counts: Record<string, number> = {
    product_sense: 0,
    system_design: 0,
    data_modeling: 0,
    coding: 0,
  }
  for (const row of disciplineCountRows) {
    if (['flow', 'freeform', 'quick_take'].includes(row.challenge_type)) {
      counts.product_sense = (counts.product_sense ?? 0) + 1
    } else if (row.challenge_type === 'system_design') {
      counts.system_design = (counts.system_design ?? 0) + 1
    } else if (row.challenge_type === 'data_modeling') {
      counts.data_modeling = (counts.data_modeling ?? 0) + 1
    } else if (row.challenge_type === 'sql' || row.challenge_type === 'algorithm') {
      counts.coding = (counts.coding ?? 0) + 1
    }
  }
```

- [ ] **Step 3: Update the coding section render to use `sqlChallenges` and `algorithmChallenges`**

Find the `{/* ── CODING INTERVIEW CHALLENGES ──────────────────────── */}` section (lines 705-779). The render currently uses `codingChallenges`. Replace:
```typescript
      {/* ── CODING INTERVIEW CHALLENGES ──────────────────────── */}
      <div data-testid="section-coding">
        {(sqlChallenges.length > 0 || algorithmChallenges.length > 0) ? (
          <>
            <SectionHeading eyebrow="Interview prep" title="Coding Interviews." href="/challenges?discipline=coding&sub=sql" linkLabel="View all →" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-12">
              {[...sqlChallenges, ...algorithmChallenges].slice(0, 4).map((c) => {
                const diff = DIFFICULTY_CONFIG[c.difficulty as string] ?? { label: c.difficulty, dot: '#74796e' }
                const isSql = c.challenge_type === 'sql'
                const langLabel = isSql ? 'SQL' : 'Algorithm'
                return (
                  <a
                    key={c.id}
                    href={`/workspace/challenges/${c.slug ?? c.id}`}
                    style={{
                      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                      background: '#e8f0e8', borderRadius: 20, padding: '18px 18px 16px',
                      minHeight: 140, textDecoration: 'none',
                      border: '1px solid rgba(0,0,0,0.05)',
                      position: 'relative', overflow: 'hidden',
                    }}
                  >
                    <div style={{ position: 'relative' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                        <span className="bg-surface-container-high text-on-surface rounded-full text-xs px-2 py-0.5 font-label font-semibold border border-outline-variant/40">
                          Coding
                        </span>
                        <span className="bg-secondary-container text-on-secondary-container rounded-full text-xs px-2 py-0.5 font-label font-semibold">
                          {langLabel}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#2e4a30' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: diff.dot, display: 'inline-block' }} />
                          {diff.label}
                        </span>
                      </div>
                      <div style={{ fontFamily: 'var(--font-headline)', fontSize: 16, fontWeight: 700, color: '#1a3020', letterSpacing: '-0.01em', lineHeight: 1.3 }}>
                        {c.title}
                      </div>
                    </div>
                    <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        background: '#4a7c59', color: '#fff',
                        padding: '6px 12px', borderRadius: 999,
                        fontWeight: 700, fontSize: 12,
                      }}>
                        Start
                        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>arrow_forward</span>
                      </span>
                    </div>
                  </a>
                )
              })}
            </div>
          </>
        ) : (
          <>
            <SectionHeading eyebrow="Interview prep" title="Coding Interviews." href="/challenges?discipline=coding&sub=sql" linkLabel="View all →" />
            <div className="mb-12 rounded-2xl border border-outline-variant/30 bg-surface-container-low p-8 text-center">
              <span className="material-symbols-outlined text-3xl text-on-surface-variant/40 block mb-2">code</span>
              <p className="text-sm text-on-surface-variant font-body">No coding challenges yet — check back soon.</p>
            </div>
          </>
        )}
      </div>
```

- [ ] **Step 4: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep "explore/page"
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(app\)/explore/page.tsx
git commit -m "feat(explore): update coding section to use sql|algorithm types"
```

---

## Task 8: Update `DisciplineGrid.tsx` card link

**Files:**
- Modify: `src/components/explore/DisciplineGrid.tsx:40`

- [ ] **Step 1: Update the Coding card `href`**

Find (line 40):
```typescript
    href: '/challenges?discipline=coding',
```

Replace with:
```typescript
    href: '/challenges?discipline=coding&sub=sql',
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep DisciplineGrid
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/explore/DisciplineGrid.tsx
git commit -m "feat(explore): coding discipline card links to SQL sub-tab by default"
```

---

## Task 9: Update seed commit script

**Files:**
- Modify: `scripts/commit-interview-seeds.ts:157`

- [ ] **Step 1: Map `is_sql` to correct `challenge_type` on insert**

Find (line 157):
```typescript
      challenge_type: c.challenge_type,
```

The staged JSON has `challenge_type: 'coding'` and a separate `is_sql` boolean. Replace with:
```typescript
      challenge_type: (c as unknown as { is_sql?: boolean }).is_sql ? 'sql' : 'algorithm',
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep "commit-interview-seeds"
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add scripts/commit-interview-seeds.ts
git commit -m "feat(seeds): map is_sql flag to sql|algorithm challenge_type on commit"
```

---

## Task 10: Full TypeScript clean + `'coding'` string sweep

**Files:**
- Modify: any remaining files that reference `challenge_type === 'coding'` or `'coding'` as a type value

- [ ] **Step 1: Full tsc pass**

```bash
npx tsc --noEmit 2>&1
```

Fix every remaining error. Common remaining spots: API route handlers in `src/app/api/` that check `challenge_type === 'coding'`, admin UI that renders type labels.

- [ ] **Step 2: Grep for remaining `'coding'` references**

```bash
grep -rn "'coding'" src/ --include="*.ts" --include="*.tsx" | grep -v "node_modules"
```

For each hit: if it's a `challenge_type` comparison, update to `=== 'sql' || === 'algorithm'`. If it's a display label like `"Coding"`, leave it — that's UI copy, not a type value.

- [ ] **Step 3: Final tsc pass**

```bash
npx tsc --noEmit 2>&1
```

Expected: clean (zero errors, ignoring any pre-existing errors in `supabase/functions/`).

- [ ] **Step 4: Commit**

```bash
git add -p  # stage only the changed files
git commit -m "fix: remove remaining challenge_type=coding references"
```

---

## Task 11: End-to-end verification

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verify Practice hub sub-tabs**

Navigate to `http://localhost:3000/challenges?discipline=coding`.

Expected:
- Main discipline tabs visible with "Coding" active
- Sub-tab strip visible below: "SQL" (active) | "Algorithms"
- SQL challenge cards render

- [ ] **Step 3: Switch to Algorithms sub-tab**

Click "Algorithms".

Expected:
- URL updates to `?discipline=coding&sub=algorithm`
- Algorithm challenge cards render
- SQL cards gone

- [ ] **Step 4: Verify Explore page**

Navigate to `http://localhost:3000/explore`.

Expected:
- DisciplineGrid "Coding" card count = total sql + algorithm challenges
- Clicking Coding card navigates to `/challenges?discipline=coding&sub=sql`

- [ ] **Step 5: Verify "All" view on Practice hub**

Navigate to `http://localhost:3000/challenges` (no discipline filter).

Expected:
- SQL and Algorithms appear as separate sections in the "All" view
- "see all N →" for SQL sets discipline=coding + sub=sql
- "see all N →" for Algorithms sets discipline=coding + sub=algorithm

- [ ] **Step 6: Final commit if no issues**

If all checks pass, tag the feature complete:
```bash
git log --oneline -10
```

Confirm all 10 task commits are present and clean.

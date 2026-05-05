# SQL vs Algorithm Challenge Separation

**Date:** 2026-04-29  
**Status:** Approved  

## Context

Coding challenges come in two structurally distinct forms — SQL queries and algorithmic code. They share `challenge_type = 'coding'` in the DB today, with SQL challenges only detectable via `metadata.sql_schema` presence. Users browsing the Explore and Practice hubs see a single undifferentiated "Coding" section. The goal is to give SQL and Algorithm challenges first-class type identities in the DB and separate filtered views in the Practice hub.

## Approach

- `'sql'` and `'algorithm'` replace `'coding'` as first-class `challenge_type` values
- The Explore page DisciplineGrid keeps one "Coding" card (counts both sub-types, links to Practice hub)
- The Practice hub shows a `SQL | Algorithms` sub-tab strip below the main discipline tabs when Coding is active
- URL pattern: `?discipline=coding&sub=sql` (default) or `&sub=algorithm`

## Data Model

### Migration: `supabase/migrations/072_sql_algorithm_challenge_types.sql`

Four steps, safe to run on existing data:

1. Widen CHECK constraint to allow `'sql'`, `'algorithm'` alongside existing `'coding'`
2. `UPDATE challenges SET challenge_type = 'sql' WHERE challenge_type = 'coding' AND metadata->>'sql_schema' IS NOT NULL`
3. `UPDATE challenges SET challenge_type = 'algorithm' WHERE challenge_type = 'coding'` (remaining rows)
4. Re-drop CHECK constraint removing `'coding'`

Backfill is idempotent. SQL challenges are reliably identified by `metadata.sql_schema` presence — this is how `FlowWorkspace.tsx` already detects them.

### TypeScript: `src/lib/types.ts`

```ts
// Before
type ChallengeType = 'flow' | 'freeform' | 'quick_take' | 'system_design' | 'data_modeling' | 'coding'

// After
type ChallengeType = 'flow' | 'freeform' | 'quick_take' | 'system_design' | 'data_modeling' | 'sql' | 'algorithm'
```

`Discipline` type in `DisciplineTabStrip.tsx` keeps `'coding'` — it is a display grouping concept, not a DB type.

## UI Changes

### Explore Page (`src/app/(app)/explore/page.tsx`, `src/components/explore/DisciplineGrid.tsx`)

- Fetch: two parallel queries for `challenge_type = 'sql'` and `challenge_type = 'algorithm'` (replaces single `challenge_type = 'coding'` query)
- Discipline count aggregation: map both `'sql'` and `'algorithm'` → `'coding'` bucket for the DisciplineGrid count
- DisciplineGrid "Coding" card: count = sql + algorithm; link → `/challenges?discipline=coding&sub=sql`
- No layout or card count change (still 4 discipline cards)

### Practice Hub (`src/app/(app)/challenges/FilteredChallengesView.tsx`)

- When `discipline === 'coding'`: read `searchParams.sub` (`'sql'` | `'algorithm'`, default `'sql'`)
- Render `CodingSubTabStrip` below `DisciplineTabStrip` only when Coding is active
- Filter challenges by the active sub-type's `challenge_type` value

### New Component: `src/components/challenges/CodingSubTabStrip.tsx`

```ts
interface Props {
  active: 'sql' | 'algorithm'
  onChange: (sub: 'sql' | 'algorithm') => void
}
```

- Two tabs: "SQL" and "Algorithms"
- Smaller, secondary visual level relative to `DisciplineTabStrip`
- On tab change: `router.push('?discipline=coding&sub=...')`

## Seed Pipeline

### `scripts/commit-interview-seeds.ts`

Map `is_sql` flag to the correct type on insert:

```ts
challenge_type: c.is_sql ? 'sql' : 'algorithm'
// Previously: challenge_type: 'coding' (hardcoded)
```

## Minor Updates

### `src/components/v2/FlowWorkspace.tsx`

Any `challenge_type === 'coding'` checks must be updated to `=== 'sql' || === 'algorithm'` (or a helper `isCodingType(t)`). Language detection: check `challenge.challenge_type === 'sql'` in addition to `metadata.sql_schema` presence. No behaviour change — makes the detection explicit now that the type is authoritative.

### Other files with `'coding'` string references

Search codebase for `challenge_type.*coding` and `=== 'coding'` — update every match. Key areas: grading routes (`src/app/api/`), workspace canvas, and any admin UI that renders challenge type labels.

## What Does Not Change

- `DisciplineTabStrip` — `'coding'` tab stays as the top-level grouping; no new top-level tabs
- Explore page layout — DisciplineGrid keeps 4 cards
- Challenge workspace routing — `/workspace/challenges/[id]` unchanged
- Grading, feedback, progress, analytics pages — none filter by discipline

## Verification

1. Run migration on local Supabase: confirm all existing SQL challenges have `challenge_type = 'sql'`, algorithm challenges have `challenge_type = 'algorithm'`, no rows remain as `'coding'`
2. Navigate to `/challenges?discipline=coding` — SQL sub-tab active by default, SQL challenge cards render
3. Click Algorithms sub-tab — URL updates to `&sub=algorithm`, algorithm cards render
4. Navigate to `/explore` — Coding card count = sql count + algorithm count
5. Click Coding card on Explore — lands on Practice hub with SQL sub-tab active
6. Commit a seed via `commit-interview-seeds.ts` with `is_sql: true` — inserts as `challenge_type = 'sql'`
7. TypeScript: `npx tsc --noEmit` — clean

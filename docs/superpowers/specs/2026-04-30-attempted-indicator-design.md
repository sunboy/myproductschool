# Spec: Attempted Indicator on Challenge Cards

## Context

Users have no visual signal on challenge cards showing whether they have already attempted a challenge. The data exists in `challenge_attempts` but the server fetches that populate card data hardcode `attempt_count: 0`, `best_score: null`, and `is_completed: false`. The UI components are already wired to render status indicators from these fields — the gap is purely in the data layer, with one small UI addition needed on the Practice Hub card.

## Scope

All challenge card surfaces:
- Practice Hub (`/challenges`) — grid and list views via `ChallengeCard` in `src/app/(app)/challenges/ChallengeCard.tsx`
- Explore page (`/explore`) — featured coding, system design, and data modeling snippet strips via `ChallengeCard` in `src/components/challenge/ChallengeCard.tsx`
- `ChallengeCardV2` already renders indicators correctly; no changes needed there.

## Indicator Visual

Follows the pattern already implemented in `src/components/challenge/ChallengeCard.tsx` (lines 43–48):

| State | Icon | Style |
|---|---|---|
| Completed | `check_circle` (FILL 1) | `text-primary` |
| Attempted, not completed | `incomplete_circle` | `text-tertiary` |
| Not started | `circle` | `text-on-surface-variant/40` |

Placement:
- **Grid card**: top-right corner of the card, replacing or alongside the difficulty chip row
- **List row**: inline before the CTA button, replacing the plain attempt count span

## Approach: Fix the server data fetches (Option A)

No new components, no client-side fetches, no migrations. Three targeted changes.

---

## Changes

### 1. `src/lib/data/challenges.ts`

Both `getChallenges()` and `getFeaturedChallenges()` need user attempt stats merged in.

Pattern (same as `/api/challenges/route.ts` lines 49–73):

```typescript
const { data: { user } } = await supabase.auth.getUser()

// after fetching challenges into `data`:
const challengeIds = (data ?? []).map(c => c.id)
const { data: attempts } = user
  ? await supabase
      .from('challenge_attempts')
      .select('challenge_id, total_score, status')
      .eq('user_id', user.id)
      .in('challenge_id', challengeIds)
  : { data: null }

const statsMap = buildStatsMap(challengeIds, attempts ?? [])

return (data ?? []).map(c => ({
  ...c,
  slug: c.slug ?? c.id.replace(/^c\d+-/, ''),
  domain: { slug: '', title: '', icon: null },
  ...statsMap.get(c.id) ?? { attempt_count: 0, best_score: null, is_completed: false },
}))
```

Extract `buildStatsMap` as a shared helper at the top of the file to avoid duplication between the two functions.

If no user is authenticated, all stats stay at defaults (same as today).

### 2. `src/app/(app)/explore/page.tsx`

Three inline queries (`codingChallenges`, `systemDesignChallenges`, `dataModelingChallenges`) fetch challenges without attempt data. After they resolve, batch-fetch attempt stats in one query:

```typescript
// After Promise.all resolves:
const allExploreChallengeIds = [
  ...codingChallenges.map(c => c.id),
  ...systemDesignChallenges.map(c => c.id),
  ...dataModelingChallenges.map(c => c.id),
]

const { data: exploreAttempts } = user && allExploreChallengeIds.length > 0
  ? await supabase
      .from('challenge_attempts')
      .select('challenge_id, total_score, status')
      .eq('user_id', user.id)
      .in('challenge_id', allExploreChallengeIds)
  : { data: null }

const exploreStatsMap = buildStatsMap(allExploreChallengeIds, exploreAttempts ?? [])
```

Then spread stats onto each challenge array before passing to card components. The `user` variable is already available from `supabase.auth.getUser()` at the top of the page.

The `buildStatsMap` helper should be importable from `src/lib/data/challenges.ts` (or a shared util) to avoid duplicating logic.

### 3. `src/app/(app)/challenges/ChallengeCard.tsx`

Add status icon to the grid card's top-right area and the list row, mirroring `src/components/challenge/ChallengeCard.tsx` lines 43–48.

**Grid card** — inside the top row `<div>`, add status icon to the right of the difficulty chip:
```tsx
const statusIcon = challenge.is_completed
  ? { icon: 'check_circle', fill: 1 }
  : challenge.attempt_count > 0
    ? { icon: 'incomplete_circle', fill: 0 }
    : null

{statusIcon && (
  <span
    className="material-symbols-outlined text-[16px]"
    style={{
      fontVariationSettings: `'FILL' ${statusIcon.fill}`,
      color: challenge.is_completed ? 'var(--color-primary)' : 'var(--color-tertiary)',
    }}
  >
    {statusIcon.icon}
  </span>
)}
```

**List row** — replace the plain attempt count `<span>` (line 232–235) with the status icon + count:
```tsx
<span className="hidden sm:flex items-center gap-1 shrink-0 w-16 justify-end">
  <span
    className="material-symbols-outlined text-[13px]"
    style={{
      fontVariationSettings: `'FILL' ${challenge.is_completed ? 1 : 0}`,
      color: challenge.is_completed
        ? 'var(--color-primary)'
        : challenge.attempt_count > 0
          ? 'var(--color-tertiary)'
          : 'color-mix(in srgb, var(--color-on-surface) 40%, transparent)',
    }}
  >
    {challenge.is_completed
      ? 'check_circle'
      : challenge.attempt_count > 0
        ? 'incomplete_circle'
        : 'circle'}
  </span>
  <span className="text-[11px] text-on-surface-variant font-label">
    {challenge.attempt_count > 0 ? challenge.attempt_count : '—'}
  </span>
</span>
```

---

## Files Modified

| File | What changes |
|---|---|
| `src/lib/data/challenges.ts` | Add `buildStatsMap` helper, wire attempt stats into `getChallenges()` and `getFeaturedChallenges()` |
| `src/app/(app)/explore/page.tsx` | Batch attempt stats fetch after the explore challenge queries resolve |
| `src/app/(app)/challenges/ChallengeCard.tsx` | Add status icon to grid card top row and list row |

## Files Unchanged

| File | Reason |
|---|---|
| `src/components/challenge/ChallengeCard.tsx` | Already has status icon logic (lines 43–48); just needs real data |
| `src/components/v2/ChallengeCardV2.tsx` | Already renders "Done" badge and attempt count correctly |
| `src/app/api/challenges/route.ts` | Already fetches and returns attempt stats correctly |
| DB schema / migrations | No changes needed |

## Verification

1. Log in as a user who has completed at least one challenge
2. Go to `/challenges` — completed challenges should show a filled `check_circle` in primary green; in-progress ones show `incomplete_circle` in tertiary amber
3. Switch to list view — same icons appear inline before the CTA
4. Go to `/explore` — the coding, system design, and data modeling snippet cards should show the same status icons
5. Log out or use an account with no attempts — all cards show `circle` (no indicator), same as before

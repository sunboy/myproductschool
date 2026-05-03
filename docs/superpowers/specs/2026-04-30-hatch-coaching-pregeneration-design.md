# Hatch Coaching Pre-generation & Nudge Warmup

**Date:** 2026-04-30  
**Status:** Approved for implementation

## Context

After each MCQ answer in a FLOW challenge (Frame / List / Optimize / Win), the coaching endpoint generates role-specific feedback: `role_context` (2–3 sentences) and `career_signal` (1 sentence). This fires as an async Claude Sonnet call that takes 2–5 seconds. The UI shows skeleton loaders during that wait.

The coaching content for a pure MCQ selection is **challenge-static**: it depends only on the question text, scenario, selected option, and role — none of which change after publish. Yet the current system generates it lazily per-user and caches it under a user-specific key, meaning every new user on a given option pays the full AI latency.

Nudges (`/api/hatch/nudge`, `/api/hatch/canvas/nudge`) suffer a similar cold-start penalty — the first nudge call after challenge load hits Anthropic with a cold prompt cache, adding ~1s.

## Goal

- Reduce per-step coaching latency from 2–5s to ~50ms for all pure MCQ selections
- Reduce first-nudge latency after challenge load from ~1s to ~300ms

## What Changes

### 1. Global coaching cache at publish time

**New file: `src/lib/content/coaching-warmer.ts`**

Exports `preGenerateCoaching(challengeId: string): Promise<void>`.

Logic:
1. Fetch all `flow_steps`, `step_questions`, and `flow_options` for the challenge (service-role client)
2. Fetch all `role_lenses` (id, label, and step nudge fields)
3. For each `(step, question_id, option_id, role_id)` tuple:
   - Construct the same system + user prompt as the coaching route option-based path
   - Call `createCachedMessage` (claude-sonnet-4-6, max_tokens: 800, adaptive thinking)
   - Parse `role_context` and `career_signal` from the response
   - Upsert to `coaching_cache` with key: `global:{challengeId}:{step}:{question_id}:{option_id}:{role_id}`
4. Runs concurrently with a concurrency cap (e.g. p-limit at 5) to avoid rate limiting
5. Errors are logged but do not throw — publish never fails due to warming

**Scale per challenge:** 4 steps × ~3 questions × 4 options × 10 roles = ~480 calls  
**Cost:** ~$1.44 per challenge (one-time, amortized across all future users)

**Modified: `src/lib/content/publisher.ts`**

After `flow_options` insert at line 112, add:
```typescript
// Fire-and-forget — publish response does not wait
preGenerateCoaching(challengeId).catch(err =>
  console.error('[coaching-warmer] pre-generation failed', err)
)
```

### 2. Global cache lookup in coaching route

**Modified: `src/app/api/challenges/[id]/coaching/route.ts`**

In the option-based path, before constructing the user-specific cache key (line 144), add a global cache lookup:

```typescript
const globalKey = `global:${challengeId}:${step}:${question_id}:${option_id}:${roleId}`
const { data: globalHit } = await admin.from('coaching_cache').select('role_context, career_signal').eq('cache_key', globalKey).single()
if (globalHit) {
  // Also upsert under user-specific key for hit_count tracking if desired
  return NextResponse.json({ role_context: globalHit.role_context, career_signal: globalHit.career_signal })
}
```

Falls through to current behavior (AI call → user-specific cache) if global key is missing (e.g. challenge published before this feature shipped, or freeform path).

**Freeform / elaboration path: no change.** User-provided `user_text` is genuinely dynamic — always goes to AI.

### 3. Nudge prompt cache warming

**New route: `src/app/api/hatch/nudge-warmup/route.ts`**

Accepts `POST { challengeId, step }`. Constructs the nudge system prompt (same as `/api/hatch/nudge`) and calls `createCachedMessage` with `max_tokens: 1` (effectively free). This seeds Anthropic's 5-minute prompt cache so the first real nudge call in that window is a cache hit.

**Modified: `src/components/v2/FlowWorkspace.tsx`**

On step mount (when user enters a new FLOW step), fire the warmup call in the background:
```typescript
useEffect(() => {
  fetch('/api/hatch/nudge-warmup', { method: 'POST', body: JSON.stringify({ challengeId, step: currentStep }) })
}, [currentStep])
```

## What Does NOT Change

- Freeform grading and elaboration grading paths — still AI-generated per user
- User-specific `coaching_cache` entries — still written for hit_count tracking
- `hatchContext` personalization — the global pre-generated coaching does not use `hatchContext` (user competency history), which is acceptable because the core coaching insight is option-driven, not history-driven
- Canvas nudges — these depend on the live canvas state; too dynamic to pre-generate

## Files Modified

| File | Change |
|------|--------|
| `src/lib/content/publisher.ts` | Call `preGenerateCoaching()` fire-and-forget after flow_options insert (line 112) |
| `src/lib/content/coaching-warmer.ts` | **New** — `preGenerateCoaching()` function |
| `src/app/api/challenges/[id]/coaching/route.ts` | Add global cache key lookup before user-specific lookup in option-based path |
| `src/app/api/hatch/nudge-warmup/route.ts` | **New** — prompt cache warming endpoint |
| `src/components/v2/FlowWorkspace.tsx` | Fire nudge-warmup on each step entry |

## Verification

1. Publish a new challenge via `/admin/content` — observe logs for `[coaching-warmer]` entries completing without error
2. In DB: `SELECT count(*) FROM coaching_cache WHERE cache_key LIKE 'global:{challengeId}%'` — should be ~480 rows
3. Answer an MCQ in that challenge as a user — coaching should appear in <200ms (no skeleton delay)
4. Open browser network tab: confirm `/api/challenges/[id]/coaching` returns immediately (no 2–5s wait)
5. Trigger a nudge — first nudge after entering a step should be faster (warm prompt cache)
6. Answer with free-text elaboration — confirm fallback to AI path still works (coaching loads with skeleton, then populates)

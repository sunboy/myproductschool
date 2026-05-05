# Paywall System Design
**Date:** 2026-04-16  
**Status:** Approved

---

## Overview

A functionality-gate paywall system using the "smarter frame" pattern: gate right before the really cool thing, when the user has intent not just curiosity. No time-based trials. Free users get 10 challenges and 5 interview sessions per rolling 30-day window, configurable via a DB-driven admin panel without deploys.

---

## Decisions

| Decision | Choice | Reason |
|---|---|---|
| Gate style | Functionality gate | Intent > curiosity; users see what they're missing |
| Challenge gate moment | On "Start" click — workspace visible but grayed out | Maximises intent before the gate fires |
| Interview gate moment | Pre-session (402 on start) + mid-session modal | Mid-session: graceful pause, not hard cutoff |
| Reset window | Rolling 30 days from first use | Fairer than calendar month; no month-end rush |
| Limit config | `plan_limits` Supabase table | Live changes, no deploy needed |
| Enforcement | Server-side only (API layer) | Unforgeable; clean separation |
| UI pre-fetch | `/api/usage/me` once per page load | Lock badges on cards before user clicks |
| Animations | GSAP: scale+opacity+y entrance, backdrop fade | Premium feel, not punitive |

---

## Database Schema

### `plan_limits` table
Backend-configurable limits per plan/feature. No rows for `pro` = unlimited.

```sql
CREATE TABLE plan_limits (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan        TEXT NOT NULL CHECK (plan IN ('free', 'pro')),
  feature     TEXT NOT NULL CHECK (feature IN ('challenges', 'interviews')),
  limit_value INTEGER NOT NULL,
  window_days INTEGER NOT NULL DEFAULT 30,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(plan, feature)
);

INSERT INTO plan_limits (plan, feature, limit_value, window_days) VALUES
  ('free', 'challenges', 10, 30),
  ('free', 'interviews', 5, 30);
```

### `usage_events` table
Append-only log. Rolling window enforced at query time — no cron needed.

```sql
CREATE TABLE usage_events (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature    TEXT NOT NULL CHECK (feature IN ('challenges', 'interviews')),
  event_type TEXT NOT NULL DEFAULT 'start',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX usage_events_user_feature_created
  ON usage_events(user_id, feature, created_at DESC);
```

RLS: users can read only their own rows. Service role writes on `start` events.

---

## Server-Side Enforcement

### `src/lib/usage/check-limit.ts`

```typescript
type UsageLimitResult =
  | { allowed: true }
  | { allowed: false; used: number; limit: number; feature: string; windowDays: number }

export async function checkUsageLimit(
  userId: string,
  feature: 'challenges' | 'interviews'
): Promise<UsageLimitResult>
```

**Logic:**
1. Fetch user plan from `profiles`. If `pro` → return `{ allowed: true }` immediately (zero usage DB reads).
2. Load `plan_limits` row for `(plan='free', feature)` — in-process cache, 60s TTL.
3. Count `usage_events` where `user_id = userId AND feature = feature AND created_at > NOW() - (window_days || ' days')::interval`.
4. If `count >= limit_value` → return `{ allowed: false, used: count, limit: limit_value, windowDays }`.
5. Otherwise → return `{ allowed: true }`.

### Enforcement points

| Endpoint | Change |
|---|---|
| `POST /api/challenges/[id]/start` | Call `checkUsageLimit(userId, 'challenges')`. If blocked → `402 { error: 'limit_reached', used, limit, feature, windowDays }`. If allowed → insert `usage_events` row, proceed. |
| `POST /api/live-interview/start` | Same for `'interviews'`. |

### `GET /api/usage/me`
New endpoint. Called once per page load on list pages. Returns current usage for both features.

```typescript
// Response shape
{
  challenges: { used: number; limit: number; windowDays: number },
  interviews:  { used: number; limit: number; windowDays: number }
}
```

Result stored in React context — all cards on the page share it. No per-card fetches, no polling.

---

## UI Components

### Challenge Gate — `<ChallengePaywallGate>`

Triggered when `POST /api/challenges/[id]/start` returns 402. Reuses `ProPaywallGate` layout pattern: blurred workspace behind frosted card.

**Changes from existing `ProPaywallGate`:**
- Header copy: "You've used {used} of {limit} free challenges this month"
- Progress bar: `used/limit` fill in primary green
- GSAP entrance: card `{ scale: 0.92, opacity: 0, y: 30 }` → `{ scale: 1, opacity: 1, y: 0, ease: 'power3.out', duration: 0.5 }`. Backdrop fades in at 0.3s delay behind the card so workspace "disappears" as card "arrives."

**Lock badge on challenge cards:**  
When `/api/usage/me` returns `challenges.used >= challenges.limit`, the Start button renders a `lock` Material Symbol and is non-navigable. Clicking it triggers the same GSAP-animated paywall card inline (no navigation).

### Interview Pre-Session Gate — `<InterviewPaywallGate>`

Triggered when `POST /api/live-interview/start` returns 402. Modal overlay on the interview setup screen. Same GSAP animation pattern as challenge gate.

Copy: "You've used {used} of {limit} free interview sessions this month"

CTAs:
- **Upgrade to Pro** → existing Stripe embedded checkout
- **Maybe later** → dismisses modal, returns to interview list

### Interview Mid-Session Modal — `<InterviewLimitModal>`

Triggered client-side when session minutes reach the plan limit (tracked via a per-second counter). Session pauses: mic muted, AI responses halted.

GSAP entrance: same `scale+opacity+y` pattern. Backdrop at 0.3s delay.

Copy: "You've reached your {limit} free interview sessions this month"  
Progress arc showing `used/limit`.

CTAs:
- **Upgrade to Pro** → Stripe embedded checkout (transcript preserved; new session available after upgrade)
- **End session** → graceful end, transcript saved, navigates to debrief

Transcript up to the pause point is always preserved — debrief remains available regardless of upgrade decision.

**Lock badge on interview cards:**  
Same pattern as challenges — `/api/usage/me` pre-fetch, lock icon on Start when at limit.

---

## Admin Configuration

### New tab: `/admin/paywall-config`

Simple table editor in the existing admin panel. One row per `(plan, feature)` pair. Admin edits `limit_value` and `window_days` inline, hits Save.

**API:** `PUT /api/admin/plan-limits` — protected by `profiles.role = 'admin'`. Writes to `plan_limits` table. In-process cache TTL means changes propagate within 60 seconds.

**Table view:**

| Plan | Feature | Limit | Window | Last Updated |
|---|---|---|---|---|
| free | challenges | 10 | 30 days | Apr 16 |
| free | interviews | 5 | 30 days | Apr 16 |

**Usage aggregate (read-only):**  
Same page shows total free users, median usage this month per feature — so limits can be tuned based on real behavior before users hit the wall.

---

## State Flow

```
User clicks "Start Challenge"
  → POST /api/challenges/[id]/start
    → checkUsageLimit(userId, 'challenges')
      → pro? → skip, allow immediately
      → free? → count usage_events in rolling 30d window
        → under limit? → insert usage_event row, return session
        → at limit?   → 402 { error: 'limit_reached', used, limit }
  → 402 received client-side
    → GSAP-animate ChallengePaywallGate over blurred workspace
    → "Upgrade to Pro" → Stripe embedded checkout
    → Webhook fires → profiles.plan = 'pro'
    → User returns → pro, all gates gone

User starts interview session (free, at limit)
  → POST /api/live-interview/start → 402
    → GSAP-animate InterviewPaywallGate over setup screen
    → Upgrade or dismiss

User mid-session hits minute limit
  → Client counter reaches 0
    → Mic muted, AI halted
    → GSAP-animate InterviewLimitModal over active session
    → Upgrade (session may resume) or End (debrief saved)
```

---

## Files to Create / Modify

### New files
| File | Purpose |
|---|---|
| `supabase/migrations/046_paywall_usage.sql` | `plan_limits` + `usage_events` tables + indexes + RLS |
| `src/lib/usage/check-limit.ts` | Core enforcement utility with in-process cache |
| `src/app/api/usage/me/route.ts` | GET endpoint for page-load pre-fetch |
| `src/app/api/admin/plan-limits/route.ts` | PUT endpoint for admin config edits |
| `src/components/paywalls/ChallengePaywallGate.tsx` | Challenge-specific gate (extends ProPaywallGate pattern) |
| `src/components/paywalls/InterviewPaywallGate.tsx` | Interview pre-session gate modal |
| `src/components/paywalls/InterviewLimitModal.tsx` | Mid-session limit modal |
| `src/app/(admin)/admin/paywall-config/page.tsx` | Admin config UI |
| `src/context/UsageContext.tsx` | React context for `/api/usage/me` result |

### Modified files
| File | Change |
|---|---|
| `src/app/api/challenges/[id]/start/route.ts` | Add `checkUsageLimit` call + `usage_events` insert |
| `src/app/api/live-interview/start/route.ts` | Add `checkUsageLimit` call + `usage_events` insert |
| `src/app/(app)/challenges/page.tsx` | Wrap with `UsageContext`, lock badges on cards |
| `src/app/(app)/live-interviews/page.tsx` | Wrap with `UsageContext`, lock badges on cards |
| `src/app/(app)/live-interviews/[id]/page.tsx` | Add mid-session minute counter + `InterviewLimitModal` |
| `src/app/(admin)/admin/layout.tsx` or nav | Add "Paywall Config" tab link |

---

## Out of Scope

- Per-challenge difficulty weighting (all challenge starts count equally)
- Interview minute tracking at the server level (client-side counter is sufficient; no mid-session server calls)
- Grandfathering existing usage on launch (rolling window is zero on day one for all users)
- Team/cohort shared limits

# Paywall System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a functionality-gate paywall — free users get 10 challenges and 5 interview sessions per rolling 30-day window, configurable via a DB admin panel, with GSAP-animated gate UIs at the moment of intent.

**Architecture:** Server-side enforcement via `checkUsageLimit()` called at the two `start` API endpoints; a `/api/usage/me` pre-fetch endpoint populates a React context that drives lock badges on list pages; three new paywall UI components animate in with GSAP when limits are hit.

**Tech Stack:** Next.js 16 App Router, Supabase (service role for writes), TypeScript, GSAP (new install), Tailwind CSS v4, shadcn/ui patterns, Stripe (existing).

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `supabase/migrations/046_paywall_usage.sql` | Create | `plan_limits` + `usage_events` tables, indexes, RLS |
| `src/lib/usage/check-limit.ts` | Create | Core enforcement util with 60s in-process cache |
| `src/app/api/usage/me/route.ts` | Create | GET — page-load pre-fetch, both features |
| `src/app/api/admin/plan-limits/route.ts` | Create | GET + PUT — admin reads/writes plan_limits |
| `src/context/UsageContext.tsx` | Create | React context wrapping `/api/usage/me` result |
| `src/components/paywalls/ChallengePaywallGate.tsx` | Create | Challenge gate — blurred workspace + GSAP card |
| `src/components/paywalls/InterviewPaywallGate.tsx` | Create | Interview pre-session gate modal |
| `src/components/paywalls/InterviewLimitModal.tsx` | Create | Mid-session pause modal |
| `src/app/(admin)/admin/paywall-config/page.tsx` | Create | Admin table editor for plan_limits |
| `src/app/api/challenges/[id]/start/route.ts` | Modify | Add `checkUsageLimit` + `usage_events` insert, replace old daily-limit logic |
| `src/app/api/live-interview/start/route.ts` | Modify | Add `checkUsageLimit` + `usage_events` insert |
| `src/app/(app)/challenges/page.tsx` | Modify | Wrap with `UsageProvider` |
| `src/app/(app)/challenges/FreePracticeContent.tsx` | Modify | Read usage context, show lock on cards at limit |
| `src/app/(app)/live-interviews/page.tsx` | Modify | Wrap with `UsageProvider`, pass usage to grid |
| `src/app/(app)/live-interviews/StartInterviewButton.tsx` | Modify | Handle 402 → show `InterviewPaywallGate` |
| `src/app/(app)/live-interviews/[id]/page.tsx` | Modify | Add session counter + show `InterviewLimitModal` |
| `src/app/(admin)/admin/page.tsx` | Modify | Add Paywall Config link |

---

## Task 1: Install GSAP

**Files:**
- Modify: `package.json` (via npm install)

- [ ] **Step 1: Install gsap**

```bash
cd /Users/sandeep/Projects/myproductschool && npm install gsap
```

Expected output: `added 1 package` (or similar), no errors.

- [ ] **Step 2: Verify types are available**

```bash
npx tsc --noEmit 2>&1 | grep gsap
```

Expected: no output (no gsap errors).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install gsap for paywall animations"
```

---

## Task 2: Database Migration

**Files:**
- Create: `supabase/migrations/046_paywall_usage.sql`

- [ ] **Step 1: Create migration file**

Create `supabase/migrations/046_paywall_usage.sql` with this exact content:

```sql
-- Migration 046: Paywall usage tracking
-- plan_limits: backend-configurable limits per plan/feature
-- usage_events: append-only log for rolling window enforcement

CREATE TABLE IF NOT EXISTS plan_limits (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan        TEXT NOT NULL CHECK (plan IN ('free', 'pro')),
  feature     TEXT NOT NULL CHECK (feature IN ('challenges', 'interviews')),
  limit_value INTEGER NOT NULL,
  window_days INTEGER NOT NULL DEFAULT 30,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(plan, feature)
);

-- Seed defaults (idempotent)
INSERT INTO plan_limits (plan, feature, limit_value, window_days) VALUES
  ('free', 'challenges', 10, 30),
  ('free', 'interviews', 5,  30)
ON CONFLICT (plan, feature) DO NOTHING;

CREATE TABLE IF NOT EXISTS usage_events (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature    TEXT NOT NULL CHECK (feature IN ('challenges', 'interviews')),
  event_type TEXT NOT NULL DEFAULT 'start',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Efficient rolling-window count queries
CREATE INDEX IF NOT EXISTS usage_events_user_feature_created
  ON usage_events(user_id, feature, created_at DESC);

-- RLS
ALTER TABLE plan_limits  ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;

-- plan_limits: anyone authenticated can read (needed by /api/usage/me client path)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'plan_limits' AND policyname = 'Authenticated users can read plan_limits'
  ) THEN
    CREATE POLICY "Authenticated users can read plan_limits"
      ON plan_limits FOR SELECT
      USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- usage_events: users read only their own rows; service role writes
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'usage_events' AND policyname = 'Users can view own usage_events'
  ) THEN
    CREATE POLICY "Users can view own usage_events"
      ON usage_events FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

COMMENT ON TABLE plan_limits  IS 'Backend-configurable per-feature limits per plan. No pro rows = unlimited.';
COMMENT ON TABLE usage_events IS 'Append-only log for rolling-window usage enforcement.';
COMMENT ON COLUMN plan_limits.window_days IS 'Rolling window in days (default 30).';
```

- [ ] **Step 2: Apply migration to Supabase**

```bash
cd /Users/sandeep/Projects/myproductschool && npx supabase db push
```

Expected: `Applying migration 046_paywall_usage.sql` then success. If you get auth errors, the migration will be applied when deployed — continue.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/046_paywall_usage.sql
git commit -m "feat: add plan_limits and usage_events tables for paywall"
```

---

## Task 3: Core Enforcement Utility

**Files:**
- Create: `src/lib/usage/check-limit.ts`

- [ ] **Step 1: Create the utility**

Create `src/lib/usage/check-limit.ts`:

```typescript
import { createAdminClient } from '@/lib/supabase/admin'

export type UsageFeature = 'challenges' | 'interviews'

export type UsageLimitResult =
  | { allowed: true }
  | { allowed: false; used: number; limit: number; feature: UsageFeature; windowDays: number }

// In-process cache: { feature → { limitValue, windowDays, fetchedAt } }
type CacheEntry = { limitValue: number; windowDays: number; fetchedAt: number }
const limitCache = new Map<UsageFeature, CacheEntry>()
const CACHE_TTL_MS = 60_000

async function getPlanLimit(
  feature: UsageFeature
): Promise<{ limitValue: number; windowDays: number }> {
  const cached = limitCache.get(feature)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return { limitValue: cached.limitValue, windowDays: cached.windowDays }
  }

  const admin = createAdminClient()
  const { data } = await admin
    .from('plan_limits')
    .select('limit_value, window_days')
    .eq('plan', 'free')
    .eq('feature', feature)
    .single()

  const entry: CacheEntry = {
    limitValue: data?.limit_value ?? 10,
    windowDays: data?.window_days ?? 30,
    fetchedAt: Date.now(),
  }
  limitCache.set(feature, entry)
  return { limitValue: entry.limitValue, windowDays: entry.windowDays }
}

export async function checkUsageLimit(
  userId: string,
  feature: UsageFeature,
  userPlan: string
): Promise<UsageLimitResult> {
  // Pro users bypass all limits
  if (userPlan === 'pro') return { allowed: true }

  const { limitValue, windowDays } = await getPlanLimit(feature)

  const admin = createAdminClient()
  const windowStart = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString()

  const { count } = await admin
    .from('usage_events')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('feature', feature)
    .gte('created_at', windowStart)

  const used = count ?? 0

  if (used >= limitValue) {
    return { allowed: false, used, limit: limitValue, feature, windowDays }
  }

  return { allowed: true }
}

export async function recordUsageEvent(
  userId: string,
  feature: UsageFeature
): Promise<void> {
  const admin = createAdminClient()
  await admin.from('usage_events').insert({ user_id: userId, feature })
}

export async function getUsageForUser(
  userId: string,
  userPlan: string
): Promise<{
  challenges: { used: number; limit: number; windowDays: number }
  interviews: { used: number; limit: number; windowDays: number }
}> {
  if (userPlan === 'pro') {
    return {
      challenges: { used: 0, limit: Infinity, windowDays: 30 },
      interviews:  { used: 0, limit: Infinity, windowDays: 30 },
    }
  }

  const admin = createAdminClient()
  const [challengeLimits, interviewLimits] = await Promise.all([
    getPlanLimit('challenges'),
    getPlanLimit('interviews'),
  ])

  const challengeWindow = new Date(Date.now() - challengeLimits.windowDays * 24 * 60 * 60 * 1000).toISOString()
  const interviewWindow  = new Date(Date.now() - interviewLimits.windowDays  * 24 * 60 * 60 * 1000).toISOString()

  const [{ count: challengeCount }, { count: interviewCount }] = await Promise.all([
    admin
      .from('usage_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('feature', 'challenges')
      .gte('created_at', challengeWindow),
    admin
      .from('usage_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('feature', 'interviews')
      .gte('created_at', interviewWindow),
  ])

  return {
    challenges: { used: challengeCount ?? 0, limit: challengeLimits.limitValue, windowDays: challengeLimits.windowDays },
    interviews:  { used: interviewCount  ?? 0, limit: interviewLimits.limitValue,  windowDays: interviewLimits.windowDays  },
  }
}
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/sandeep/Projects/myproductschool && npx tsc --noEmit 2>&1 | grep "check-limit" | head -10
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/lib/usage/check-limit.ts
git commit -m "feat: add checkUsageLimit and recordUsageEvent utilities"
```

---

## Task 4: `/api/usage/me` Endpoint

**Files:**
- Create: `src/app/api/usage/me/route.ts`

- [ ] **Step 1: Create the endpoint**

Create `src/app/api/usage/me/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUsageForUser } from '@/lib/usage/check-limit'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  const userPlan = profile?.plan ?? 'free'
  const usage = await getUsageForUser(user.id, userPlan)

  return NextResponse.json(usage)
}
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/sandeep/Projects/myproductschool && npx tsc --noEmit 2>&1 | grep "usage/me" | head -10
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/usage/me/route.ts
git commit -m "feat: add /api/usage/me endpoint for pre-fetch usage data"
```

---

## Task 5: Usage React Context

**Files:**
- Create: `src/context/UsageContext.tsx`

- [ ] **Step 1: Create the context**

Create `src/context/UsageContext.tsx`:

```typescript
'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export interface FeatureUsage {
  used: number
  limit: number
  windowDays: number
}

export interface UsageData {
  challenges: FeatureUsage
  interviews: FeatureUsage
}

const DEFAULT_USAGE: UsageData = {
  challenges: { used: 0, limit: 10, windowDays: 30 },
  interviews:  { used: 0, limit: 5,  windowDays: 30 },
}

const UsageContext = createContext<UsageData>(DEFAULT_USAGE)

export function UsageProvider({ children }: { children: ReactNode }) {
  const [usage, setUsage] = useState<UsageData>(DEFAULT_USAGE)

  useEffect(() => {
    fetch('/api/usage/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setUsage(data) })
      .catch(() => {/* silent — defaults are safe */})
  }, [])

  return <UsageContext.Provider value={usage}>{children}</UsageContext.Provider>
}

export function useUsage(): UsageData {
  return useContext(UsageContext)
}

export function useIsAtLimit(feature: keyof UsageData): boolean {
  const usage = useUsage()
  return usage[feature].used >= usage[feature].limit
}
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/sandeep/Projects/myproductschool && npx tsc --noEmit 2>&1 | grep "UsageContext" | head -10
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/context/UsageContext.tsx
git commit -m "feat: add UsageContext for page-load usage pre-fetch"
```

---

## Task 6: Enforce Limit in Challenges Start API

**Files:**
- Modify: `src/app/api/challenges/[id]/start/route.ts`

- [ ] **Step 1: Read current file**

Read `src/app/api/challenges/[id]/start/route.ts` to verify current content before editing.

- [ ] **Step 2: Replace the existing limit-check block**

The current file has a block starting with `// Daily limit — skip for admins`. Replace everything from that comment through the closing `}` of the daily limit check (lines ~63–80) with the new rolling-window check. The new full file content for `src/app/api/challenges/[id]/start/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { IS_MOCK } from '@/lib/mock'
import { checkUsageLimit, recordUsageEvent } from '@/lib/usage/check-limit'
import type { UserRoleV2 } from '@/lib/types'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isMock = IS_MOCK

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user && !isMock) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = user?.id ?? 'mock-user-00000000-0000-0000-0000-000000000000'

  const { id: challenge_id } = await params
  const body = await req.json().catch(() => ({})) as { role_id?: UserRoleV2 }
  const role_id: UserRoleV2 = body.role_id ?? 'swe'

  // In mock mode return a synthetic attempt — no DB write
  if (isMock) {
    return NextResponse.json({
      attempt: {
        id: 'mock-attempt-00000000-0000-0000-0000-000000000000',
        challenge_id,
        role_id,
        current_step: 'frame',
        current_question_sequence: 1,
        status: 'in_progress',
      },
      is_resume: false,
    })
  }

  const adminClient = createAdminClient()

  // Check for existing in-progress attempt — return it (resume)
  const { data: existing } = await adminClient
    .from('challenge_attempts')
    .select('id, challenge_id, role_id, current_step, current_question_sequence, status')
    .eq('user_id', userId)
    .eq('challenge_id', challenge_id)
    .eq('status', 'in_progress')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({
      attempt: {
        id: existing.id,
        challenge_id: existing.challenge_id,
        role_id: existing.role_id,
        current_step: existing.current_step,
        current_question_sequence: existing.current_question_sequence,
        status: existing.status,
      },
      is_resume: true,
    })
  }

  // Fetch profile to check plan + admin status
  const { data: profile } = await adminClient
    .from('profiles')
    .select('plan, role')
    .eq('id', userId)
    .single()

  const isAdmin = profile?.role === 'admin'
  const userPlan = profile?.plan ?? 'free'

  // Rolling-window usage limit (skip for admins)
  if (!isAdmin) {
    const limitResult = await checkUsageLimit(userId, 'challenges', userPlan)
    if (!limitResult.allowed) {
      return NextResponse.json(
        {
          error: 'limit_reached',
          used: limitResult.used,
          limit: limitResult.limit,
          feature: 'challenges',
          windowDays: limitResult.windowDays,
        },
        { status: 402 }
      )
    }
  }

  // Create new attempt
  const { data: attempt, error } = await adminClient
    .from('challenge_attempts')
    .insert({
      user_id: userId,
      challenge_id,
      role_id,
      status: 'in_progress',
      current_step: 'frame',
      current_question_sequence: 1,
    })
    .select('id, challenge_id, role_id, current_step, current_question_sequence')
    .single()

  if (error || !attempt) {
    return NextResponse.json({ error: 'Failed to create attempt' }, { status: 500 })
  }

  // Record usage event (after successful attempt creation)
  if (!isAdmin) {
    await recordUsageEvent(userId, 'challenges')
  }

  return NextResponse.json({
    attempt: {
      id: attempt.id,
      challenge_id: attempt.challenge_id,
      role_id: attempt.role_id,
      current_step: attempt.current_step,
      current_question_sequence: attempt.current_question_sequence,
      status: 'in_progress',
    },
    is_resume: false,
  })
}
```

- [ ] **Step 3: Type-check**

```bash
cd /Users/sandeep/Projects/myproductschool && npx tsc --noEmit 2>&1 | grep "challenges/\[id\]/start" | head -10
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/challenges/\[id\]/start/route.ts
git commit -m "feat: enforce rolling-window usage limit in challenges start API"
```

---

## Task 7: Enforce Limit in Live Interview Start API

**Files:**
- Modify: `src/app/api/live-interview/start/route.ts`

- [ ] **Step 1: Read current file**

Read `src/app/api/live-interview/start/route.ts` to understand current imports and structure.

- [ ] **Step 2: Add limit check after user auth**

Add the following imports at the top of the file (after existing imports):

```typescript
import { checkUsageLimit, recordUsageEvent } from '@/lib/usage/check-limit'
```

Then, after the block that fetches `profileResult` (which already fetches the profile), add this limit check before the company/challenge lookups. Insert after `if (!user) return new Response('Unauthorized', { status: 401 })`:

```typescript
  // Fetch profile for plan + admin status
  const { data: profileForLimit } = await adminClient
    .from('profiles')
    .select('plan, role')
    .eq('id', user.id)
    .single()

  const isAdminUser = profileForLimit?.role === 'admin'
  const userPlanForLimit = profileForLimit?.plan ?? 'free'

  if (!isAdminUser) {
    const limitResult = await checkUsageLimit(user.id, 'interviews', userPlanForLimit)
    if (!limitResult.allowed) {
      return Response.json(
        {
          error: 'limit_reached',
          used: limitResult.used,
          limit: limitResult.limit,
          feature: 'interviews',
          windowDays: limitResult.windowDays,
        },
        { status: 402 }
      )
    }
  }
```

And before the final `return Response.json({ sessionId, ... })` at the end of the route, add:

```typescript
  // Record usage event
  if (!isAdminUser) {
    await recordUsageEvent(user.id, 'interviews')
  }
```

- [ ] **Step 3: Type-check**

```bash
cd /Users/sandeep/Projects/myproductschool && npx tsc --noEmit 2>&1 | grep "live-interview/start" | head -10
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/live-interview/start/route.ts
git commit -m "feat: enforce rolling-window usage limit in live interview start API"
```

---

## Task 8: ChallengePaywallGate Component

**Files:**
- Create: `src/components/paywalls/ChallengePaywallGate.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/paywalls/ChallengePaywallGate.tsx`:

```typescript
'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

const FEATURES = [
  { icon: 'all_inclusive',  text: 'Unlimited challenge attempts' },
  { icon: 'psychology',     text: 'Full Luma coaching on every step' },
  { icon: 'analytics',      text: 'Learner DNA — competency radar' },
  { icon: 'school',         text: 'All study plans, unlocked' },
  { icon: 'mic',            text: 'Live AI interview sessions' },
]

interface ChallengePaywallGateProps {
  used: number
  limit: number
  challengeTitle?: string
  onUpgrade?: () => void
}

export function ChallengePaywallGate({
  used,
  limit,
  challengeTitle = 'this challenge',
  onUpgrade,
}: ChallengePaywallGateProps) {
  const backdropRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Backdrop fades in first
      gsap.fromTo(
        backdropRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: 'power2.out' }
      )
      // Card animates in slightly after
      gsap.fromTo(
        cardRef.current,
        { scale: 0.92, opacity: 0, y: 30 },
        { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', delay: 0.1 }
      )
    })
    return () => ctx.revert()
  }, [])

  const progressPct = Math.min((used / limit) * 100, 100)

  return (
    <div className="fixed inset-0 z-50">
      {/* Frosted backdrop */}
      <div
        ref={backdropRef}
        className="fixed inset-0"
        style={{
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          background: 'rgba(250,246,240,0.65)',
        }}
      />

      {/* Paywall card */}
      <div className="fixed inset-0 z-10 flex items-center justify-center p-4">
        <div
          ref={cardRef}
          className="w-full max-w-[440px] rounded-2xl overflow-hidden"
          style={{
            background: '#ffffff',
            boxShadow: '0 32px 80px rgba(46,50,48,0.20), 0 0 0 1px rgba(196,200,188,0.3)',
          }}
        >
          {/* Green header */}
          <div
            className="px-7 pt-7 pb-6"
            style={{ background: 'linear-gradient(145deg, #2d5a3d 0%, #4a7c59 60%, #3a6b4a 100%)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <LumaGlyph size={40} state="idle" className="text-white shrink-0" />
              <div>
                <p className="font-label text-[11px] uppercase tracking-[0.18em] font-bold text-white/60">
                  HackProduct Pro
                </p>
                <p className="font-headline font-bold text-white text-lg leading-tight" style={{ letterSpacing: '-0.02em' }}>
                  You&apos;ve used {used} of {limit} free challenges.
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-white transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="font-body text-xs text-white/60 mt-2">
              {limit - used === 0 ? 'Monthly limit reached' : `${limit - used} remaining this month`}
            </p>
          </div>

          <div className="px-7 pt-5 pb-7 space-y-5">
            <ul className="space-y-2.5">
              {FEATURES.map(({ icon, text }) => (
                <li key={text} className="flex items-center gap-3">
                  <span
                    className="material-symbols-outlined text-primary text-[17px] shrink-0"
                    style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}
                  >
                    {icon}
                  </span>
                  <span className="font-body text-sm text-on-surface">{text}</span>
                </li>
              ))}
            </ul>

            {/* Price summary */}
            <div
              className="rounded-xl px-4 py-3.5 flex items-center justify-between"
              style={{ background: '#f0ece4', border: '1px solid rgba(196,200,188,0.4)' }}
            >
              <div>
                <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold mb-0.5">
                  Annual plan
                </p>
                <p className="font-headline font-bold text-on-surface text-lg" style={{ letterSpacing: '-0.02em' }}>
                  $199 <span className="text-sm font-body font-normal text-on-surface-variant">/ year</span>
                </p>
                <p className="font-label text-[10px] text-primary font-semibold">~$16.58/mo — save 43%</p>
              </div>
              <div className="text-right">
                <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold mb-0.5">Monthly</p>
                <p className="font-body text-sm text-on-surface-variant">$29 / mo</p>
              </div>
            </div>

            <button
              onClick={onUpgrade}
              className="w-full flex items-center justify-center gap-2 rounded-full py-3.5 font-label font-bold text-sm text-on-primary transition-all duration-200 active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #4a7c59 0%, #3a6b4a 100%)',
                boxShadow: '0 4px 16px rgba(74,124,89,0.30)',
              }}
            >
              <span
                className="material-symbols-outlined text-[16px]"
                style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}
              >
                workspace_premium
              </span>
              Unlock Pro
            </button>

            <p className="text-center font-body text-[11px] text-on-surface-variant">
              Secure checkout via Stripe. Cancel any time.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/sandeep/Projects/myproductschool && npx tsc --noEmit 2>&1 | grep "ChallengePaywallGate" | head -10
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/components/paywalls/ChallengePaywallGate.tsx
git commit -m "feat: add ChallengePaywallGate component with GSAP animation"
```

---

## Task 9: InterviewPaywallGate Component

**Files:**
- Create: `src/components/paywalls/InterviewPaywallGate.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/paywalls/InterviewPaywallGate.tsx`:

```typescript
'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

interface InterviewPaywallGateProps {
  used: number
  limit: number
  onUpgrade: () => void
  onDismiss: () => void
}

export function InterviewPaywallGate({
  used,
  limit,
  onUpgrade,
  onDismiss,
}: InterviewPaywallGateProps) {
  const backdropRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        backdropRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: 'power2.out' }
      )
      gsap.fromTo(
        cardRef.current,
        { scale: 0.92, opacity: 0, y: 30 },
        { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', delay: 0.1 }
      )
    })
    return () => ctx.revert()
  }, [])

  const progressPct = Math.min((used / limit) * 100, 100)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        ref={backdropRef}
        className="fixed inset-0"
        style={{
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          background: 'rgba(250,246,240,0.70)',
        }}
        onClick={onDismiss}
      />

      <div
        ref={cardRef}
        className="relative w-full max-w-[420px] rounded-2xl overflow-hidden z-10"
        style={{
          background: '#ffffff',
          boxShadow: '0 32px 80px rgba(46,50,48,0.20), 0 0 0 1px rgba(196,200,188,0.3)',
        }}
      >
        {/* Header */}
        <div
          className="px-7 pt-7 pb-6"
          style={{ background: 'linear-gradient(145deg, #2d5a3d 0%, #4a7c59 60%, #3a6b4a 100%)' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <LumaGlyph size={40} state="idle" className="text-white shrink-0" />
            <div>
              <p className="font-label text-[11px] uppercase tracking-[0.18em] font-bold text-white/60">
                Interview Sessions
              </p>
              <p className="font-headline font-bold text-white text-lg leading-tight" style={{ letterSpacing: '-0.02em' }}>
                You&apos;ve used {used} of {limit} free sessions.
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full rounded-full bg-white"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="font-body text-xs text-white/60 mt-2">Monthly limit reached — upgrade to keep practicing</p>
        </div>

        <div className="px-7 pt-5 pb-7 space-y-4">
          <p className="font-body text-sm text-on-surface-variant leading-relaxed">
            Pro gives you unlimited live interview sessions with Luma, full post-session analysis, and access to all company personas.
          </p>

          {/* Price summary */}
          <div
            className="rounded-xl px-4 py-3.5 flex items-center justify-between"
            style={{ background: '#f0ece4', border: '1px solid rgba(196,200,188,0.4)' }}
          >
            <div>
              <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold mb-0.5">Annual plan</p>
              <p className="font-headline font-bold text-on-surface text-lg" style={{ letterSpacing: '-0.02em' }}>
                $199 <span className="text-sm font-body font-normal text-on-surface-variant">/ year</span>
              </p>
              <p className="font-label text-[10px] text-primary font-semibold">~$16.58/mo — save 43%</p>
            </div>
            <div className="text-right">
              <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold mb-0.5">Monthly</p>
              <p className="font-body text-sm text-on-surface-variant">$29 / mo</p>
            </div>
          </div>

          <button
            onClick={onUpgrade}
            className="w-full flex items-center justify-center gap-2 rounded-full py-3.5 font-label font-bold text-sm text-on-primary transition-all duration-200 active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #4a7c59 0%, #3a6b4a 100%)',
              boxShadow: '0 4px 16px rgba(74,124,89,0.30)',
            }}
          >
            <span
              className="material-symbols-outlined text-[16px]"
              style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}
            >
              workspace_premium
            </span>
            Unlock Pro
          </button>

          <button
            onClick={onDismiss}
            className="w-full text-center font-body text-sm text-on-surface-variant hover:text-on-surface transition-colors py-1"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/sandeep/Projects/myproductschool && npx tsc --noEmit 2>&1 | grep "InterviewPaywallGate" | head -10
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/components/paywalls/InterviewPaywallGate.tsx
git commit -m "feat: add InterviewPaywallGate component with GSAP animation"
```

---

## Task 10: InterviewLimitModal Component

**Files:**
- Create: `src/components/paywalls/InterviewLimitModal.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/paywalls/InterviewLimitModal.tsx`:

```typescript
'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

interface InterviewLimitModalProps {
  used: number
  limit: number
  onUpgrade: () => void
  onEndSession: () => void
}

export function InterviewLimitModal({
  used,
  limit,
  onUpgrade,
  onEndSession,
}: InterviewLimitModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        backdropRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: 'power2.out' }
      )
      gsap.fromTo(
        cardRef.current,
        { scale: 0.92, opacity: 0, y: 30 },
        { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', delay: 0.1 }
      )
    })
    return () => ctx.revert()
  }, [])

  // SVG arc progress (0-circumference = empty-full)
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const progressOffset = circumference - (used / limit) * circumference

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        ref={backdropRef}
        className="fixed inset-0"
        style={{
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          background: 'rgba(46,50,48,0.50)',
        }}
      />

      <div
        ref={cardRef}
        className="relative w-full max-w-[380px] rounded-2xl overflow-hidden z-10"
        style={{
          background: '#ffffff',
          boxShadow: '0 32px 80px rgba(46,50,48,0.30), 0 0 0 1px rgba(196,200,188,0.3)',
        }}
      >
        <div className="px-7 pt-7 pb-6 flex flex-col items-center text-center">
          {/* Progress arc */}
          <div className="relative mb-4">
            <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90">
              <circle
                cx="44" cy="44" r={radius}
                fill="none" stroke="#e4e0d8" strokeWidth="6"
              />
              <circle
                cx="44" cy="44" r={radius}
                fill="none" stroke="#4a7c59" strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={progressOffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <LumaGlyph size={32} state="idle" className="text-primary" />
            </div>
          </div>

          <p className="font-label text-[11px] uppercase tracking-[0.18em] font-bold text-on-surface-variant mb-1">
            Session limit reached
          </p>
          <h2 className="font-headline font-bold text-on-surface text-xl leading-tight mb-2" style={{ letterSpacing: '-0.02em' }}>
            You&apos;ve used {used} of {limit} free sessions
          </h2>
          <p className="font-body text-sm text-on-surface-variant leading-relaxed mb-6">
            Your transcript is saved. Upgrade to Pro for unlimited sessions, or end here and review your debrief.
          </p>

          <button
            onClick={onUpgrade}
            className="w-full flex items-center justify-center gap-2 rounded-full py-3.5 font-label font-bold text-sm text-on-primary mb-3 transition-all duration-200 active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #4a7c59 0%, #3a6b4a 100%)',
              boxShadow: '0 4px 16px rgba(74,124,89,0.30)',
            }}
          >
            <span
              className="material-symbols-outlined text-[16px]"
              style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}
            >
              workspace_premium
            </span>
            Upgrade to Pro
          </button>

          <button
            onClick={onEndSession}
            className="w-full text-center font-body text-sm text-on-surface-variant hover:text-on-surface transition-colors py-1"
          >
            End session &amp; view debrief
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/sandeep/Projects/myproductschool && npx tsc --noEmit 2>&1 | grep "InterviewLimitModal" | head -10
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/components/paywalls/InterviewLimitModal.tsx
git commit -m "feat: add InterviewLimitModal component with GSAP + SVG progress arc"
```

---

## Task 11: Wire ChallengePaywallGate into Challenges Workspace

The challenges workspace page at `src/app/(workspace)/workspace/challenges/[id]/page.tsx` handles the `start` API call. We need to catch the 402 and show the gate.

**Files:**
- Modify: `src/app/(workspace)/workspace/challenges/[id]/page.tsx`

- [ ] **Step 1: Read the workspace page**

Read `src/app/(workspace)/workspace/challenges/[id]/page.tsx` in full to understand where it calls the start API and what state it uses.

- [ ] **Step 2: Add paywall state and gate rendering**

Find where the page calls `/api/challenges/[id]/start` (look for `fetch('/api/challenges/` or similar). Add:

1. At the top with other state declarations:
```typescript
const [paywallData, setPaywallData] = useState<{ used: number; limit: number } | null>(null)
```

2. After the fetch call that returns 402, add handling:
```typescript
if (res.status === 402) {
  const data = await res.json()
  setPaywallData({ used: data.used, limit: data.limit })
  return
}
```

3. Import the gate component at the top:
```typescript
import { ChallengePaywallGate } from '@/components/paywalls/ChallengePaywallGate'
```

4. In the JSX, before the main return, add (or inside the return, near the top):
```typescript
{paywallData && (
  <ChallengePaywallGate
    used={paywallData.used}
    limit={paywallData.limit}
    challengeTitle={challengeTitle}
    onUpgrade={() => router.push('/settings/billing')}
  />
)}
```

Note: `challengeTitle` should reference whatever state/prop holds the challenge title in this file. If no such variable exists, use `'this challenge'` as a fallback.

- [ ] **Step 3: Type-check**

```bash
cd /Users/sandeep/Projects/myproductschool && npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors from workspace challenge page.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(workspace\)/workspace/challenges/\[id\]/page.tsx
git commit -m "feat: show ChallengePaywallGate on 402 from challenge start API"
```

---

## Task 12: Lock Badges on Challenge Cards

**Files:**
- Modify: `src/app/(app)/challenges/page.tsx`
- Modify: `src/app/(app)/challenges/FreePracticeContent.tsx`

- [ ] **Step 1: Wrap challenges page with UsageProvider**

Read `src/app/(app)/challenges/page.tsx`. It currently just renders `<FreePracticeContent>` inside a `<Suspense>`. Wrap the outer `<main>` with `UsageProvider`:

```typescript
import { UsageProvider } from '@/context/UsageContext'
// ... existing imports ...

export default async function ChallengesPage({ searchParams }: { ... }) {
  return (
    <UsageProvider>
      <main className="p-6 max-w-7xl w-full mx-auto">
        <Suspense fallback={<div className="animate-pulse h-64 bg-surface-container rounded-xl" />}>
          <FreePracticeContent searchParams={searchParams} />
        </Suspense>
      </main>
    </UsageProvider>
  )
}
```

- [ ] **Step 2: Add lock badge to ChallengeCard**

Read `src/app/(app)/challenges/ChallengeCard.tsx` in full.

The card renders a `Link` to `/workspace/challenges/${challenge.id}`. Add a `locked` prop:

```typescript
export function ChallengeCard({
  challenge,
  paradigm,
  listView = false,
  locked = false,        // ← add this
}: {
  challenge: ChallengeWithDomain
  paradigm: string
  listView?: boolean
  locked?: boolean       // ← add this
}) {
```

Find the "Start" or action button/link inside ChallengeCard. If it's a `<Link href="/workspace/challenges/...">`, conditionally disable it when `locked`:

```typescript
{locked ? (
  <span
    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-label font-semibold bg-surface-container-high text-on-surface-variant cursor-not-allowed select-none"
  >
    <span className="material-symbols-outlined text-[14px]">lock</span>
    Upgrade
  </span>
) : (
  <Link href={`/workspace/challenges/${challenge.id}`} className="...existing classes...">
    Start →
  </Link>
)}
```

- [ ] **Step 3: Pass locked prop from FreePracticeContent**

Read `src/app/(app)/challenges/FreePracticeContent.tsx`. Add at the top:

```typescript
'use client'  // This file may already be client - check first

import { useIsAtLimit } from '@/context/UsageContext'
```

Inside the component body, add:
```typescript
const isAtChallengeLimit = useIsAtLimit('challenges')
```

Then wherever `<ChallengeCard>` is rendered, pass:
```typescript
<ChallengeCard
  challenge={challenge}
  paradigm={paradigm}
  locked={isAtChallengeLimit}
  // ...other existing props
/>
```

Note: `FreePracticeContent` is currently a `async` server component. Since `useIsAtLimit` is a hook, convert it to a client component by adding `'use client'` at the top, and remove `async` from the function signature. Move any `await` calls (like `getChallenges`, `await searchParams`) to be handled in the parent server component or a separate data-fetching component.

Actually, the cleanest approach: create a thin `ChallengesGrid` client component that wraps just the grid and card rendering, imports `useIsAtLimit`, and receives `challenges` as a prop from the existing server component. Add to `FreePracticeContent.tsx`:

```typescript
// At bottom of FreePracticeContent.tsx — add this client component
'use client'  // NOTE: add a separate file instead — see below
```

Create `src/app/(app)/challenges/LockedChallengeGrid.tsx` as a new client component:

```typescript
'use client'

import { useIsAtLimit } from '@/context/UsageContext'
import { ChallengeCard } from './ChallengeCard'
import type { ChallengeWithDomain } from '@/lib/types'

interface LockedChallengeGridProps {
  challenges: ChallengeWithDomain[]
  paradigms: Record<string, string>
  listView: boolean
}

export function LockedChallengeGrid({ challenges, paradigms, listView }: LockedChallengeGridProps) {
  const isAtLimit = useIsAtLimit('challenges')

  return (
    <>
      {challenges.map(challenge => (
        <ChallengeCard
          key={challenge.id}
          challenge={challenge}
          paradigm={paradigms[challenge.id] ?? 'Traditional'}
          listView={listView}
          locked={isAtLimit}
        />
      ))}
    </>
  )
}
```

Then in `FreePracticeContent.tsx`, replace the inline challenge card map with `<LockedChallengeGrid>` passing challenges and paradigm mapping.

- [ ] **Step 4: Type-check**

```bash
cd /Users/sandeep/Projects/myproductschool && npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(app\)/challenges/page.tsx src/app/\(app\)/challenges/FreePracticeContent.tsx src/app/\(app\)/challenges/ChallengeCard.tsx src/app/\(app\)/challenges/LockedChallengeGrid.tsx
git commit -m "feat: lock challenge cards at usage limit with UsageContext"
```

---

## Task 13: Wire InterviewPaywallGate + Lock Badges on Interview List

**Files:**
- Modify: `src/app/(app)/live-interviews/page.tsx`
- Modify: `src/app/(app)/live-interviews/StartInterviewButton.tsx`

- [ ] **Step 1: Wrap interviews page with UsageProvider**

Read `src/app/(app)/live-interviews/page.tsx`. Wrap the page content with `<UsageProvider>`:

```typescript
import { UsageProvider } from '@/context/UsageContext'

// In the return:
return (
  <UsageProvider>
    {/* existing page content */}
  </UsageProvider>
)
```

- [ ] **Step 2: Update StartInterviewButton to handle 402**

Read `src/app/(app)/live-interviews/StartInterviewButton.tsx` in full.

Replace the current component with this version that handles 402 and shows the paywall gate:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { InterviewPaywallGate } from '@/components/paywalls/InterviewPaywallGate'
import { useIsAtLimit, useUsage } from '@/context/UsageContext'

interface StartInterviewButtonProps {
  companyId: string
  roleId: string
  challengeId?: string
}

export default function StartInterviewButton({ companyId, roleId, challengeId }: StartInterviewButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  const [paywallData, setPaywallData] = useState<{ used: number; limit: number } | null>(null)
  const isAtLimit = useIsAtLimit('interviews')
  const usage = useUsage()

  async function handleStart() {
    if (isAtLimit) {
      setPaywallData({ used: usage.interviews.used, limit: usage.interviews.limit })
      setShowPaywall(true)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/live-interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, roleId, challengeId }),
      })

      if (res.status === 402) {
        const data = await res.json()
        setPaywallData({ used: data.used, limit: data.limit })
        setShowPaywall(true)
        setLoading(false)
        return
      }

      if (!res.ok) throw new Error('Failed to start interview')
      const { sessionId } = await res.json()
      router.push(`/live-interviews/${sessionId}`)
    } catch {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={handleStart}
        disabled={loading}
        className={cn(
          'inline-flex items-center gap-1 bg-primary text-on-primary rounded-full px-3 py-1 text-xs font-label font-semibold transition-opacity',
          loading && 'opacity-60 cursor-not-allowed',
          isAtLimit && 'bg-surface-container-high text-on-surface-variant'
        )}
      >
        {isAtLimit ? (
          <>
            <span className="material-symbols-outlined text-[14px]">lock</span>
            Upgrade
          </>
        ) : loading ? 'Starting…' : 'Start Interview →'}
      </button>

      {showPaywall && paywallData && (
        <InterviewPaywallGate
          used={paywallData.used}
          limit={paywallData.limit}
          onUpgrade={() => router.push('/settings/billing')}
          onDismiss={() => setShowPaywall(false)}
        />
      )}
    </>
  )
}
```

- [ ] **Step 3: Type-check**

```bash
cd /Users/sandeep/Projects/myproductschool && npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(app\)/live-interviews/page.tsx src/app/\(app\)/live-interviews/StartInterviewButton.tsx
git commit -m "feat: interview lock badges and paywall gate on 402"
```

---

## Task 14: Mid-Session InterviewLimitModal

**Files:**
- Modify: `src/app/(app)/live-interviews/[id]/page.tsx`
- Modify: `src/hooks/useInterviewTimer.ts`

- [ ] **Step 1: Update useInterviewTimer to support custom max duration**

Read `src/hooks/useInterviewTimer.ts`. Update it to accept an optional `maxMinutes` parameter and return `isLimitReached`:

```typescript
import { useEffect, useState } from 'react'

export function useInterviewTimer(
  startedAt: number | null,
  isActive: boolean,
  maxMinutes?: number
) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!startedAt || !isActive) return

    setElapsed(Math.floor((Date.now() - startedAt) / 1000))

    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [startedAt, isActive])

  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  const isWarning = elapsed >= 25 * 60
  const isLimitReached = maxMinutes != null && elapsed >= maxMinutes * 60

  return { elapsed, formatted, isWarning, isLimitReached }
}
```

- [ ] **Step 2: Add InterviewLimitModal to session page**

Read `src/app/(app)/live-interviews/[id]/page.tsx` lines 1–50 and 80–170.

Add these imports near the top:
```typescript
import { InterviewLimitModal } from '@/components/paywalls/InterviewLimitModal'
```

Add state near other state declarations:
```typescript
const [showLimitModal, setShowLimitModal] = useState(false)
const [interviewUsageData, setInterviewUsageData] = useState<{ used: number; limit: number }>({ used: 1, limit: 5 })
```

Add a useEffect to fetch actual usage on mount (add after the existing `useEffect` for starting the session):
```typescript
useEffect(() => {
  if (IS_MOCK) return
  fetch('/api/usage/me')
    .then(r => r.ok ? r.json() : null)
    .then(d => { if (d) setInterviewUsageData({ used: d.interviews.used, limit: d.interviews.limit }) })
    .catch(() => {})
}, [])
```

Update the `useInterviewTimer` call to pass `maxMinutes` (30 min default for free sessions — the visual warning, not enforcement):
```typescript
const { formatted: timerDisplay, isWarning, isLimitReached } = useInterviewTimer(
  interviewStartedAt,
  interviewPhase === 'active',
  30  // 30 min session limit for free users
)
```

Add an effect to show the modal when limit is reached:
```typescript
useEffect(() => {
  if (isLimitReached && interviewPhase === 'active' && !showLimitModal) {
    setShowLimitModal(true)
    setIsMuted(true)  // mute mic
  }
}, [isLimitReached, interviewPhase, showLimitModal])
```

Add the modal to the JSX (inside the component return, at the top level alongside other overlays):
```typescript
{showLimitModal && (
  <InterviewLimitModal
    used={interviewUsageData.used}
    limit={interviewUsageData.limit}
    onUpgrade={() => router.push('/settings/billing')}
    onEndSession={() => {
      setShowLimitModal(false)
      handleEndInterview()
    }}
  />
)}
```

- [ ] **Step 3: Type-check**

```bash
cd /Users/sandeep/Projects/myproductschool && npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(app\)/live-interviews/\[id\]/page.tsx src/hooks/useInterviewTimer.ts
git commit -m "feat: show InterviewLimitModal when free session reaches time limit"
```

---

## Task 15: Admin `/api/admin/plan-limits` Endpoint

**Files:**
- Create: `src/app/api/admin/plan-limits/route.ts`

- [ ] **Step 1: Create the endpoint**

Create `src/app/api/admin/plan-limits/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return profile?.role === 'admin' ? user : null
}

export async function GET() {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('plan_limits')
    .select('*')
    .order('plan')
    .order('feature')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ limits: data })
}

export async function PUT(req: NextRequest) {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({})) as {
    plan?: string
    feature?: string
    limit_value?: number
    window_days?: number
  }

  if (!body.plan || !body.feature || body.limit_value == null) {
    return NextResponse.json({ error: 'plan, feature, limit_value required' }, { status: 400 })
  }

  if (!['free', 'pro'].includes(body.plan)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  if (!['challenges', 'interviews'].includes(body.feature)) {
    return NextResponse.json({ error: 'Invalid feature' }, { status: 400 })
  }

  if (body.limit_value < 0 || !Number.isInteger(body.limit_value)) {
    return NextResponse.json({ error: 'limit_value must be a non-negative integer' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('plan_limits')
    .upsert({
      plan: body.plan,
      feature: body.feature,
      limit_value: body.limit_value,
      window_days: body.window_days ?? 30,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'plan,feature' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ limit: data })
}
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/sandeep/Projects/myproductschool && npx tsc --noEmit 2>&1 | grep "admin/plan-limits" | head -10
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/plan-limits/route.ts
git commit -m "feat: add GET/PUT /api/admin/plan-limits endpoint"
```

---

## Task 16: Admin Paywall Config UI

**Files:**
- Create: `src/app/(admin)/admin/paywall-config/page.tsx`
- Modify: `src/app/(admin)/admin/page.tsx`

- [ ] **Step 1: Create admin paywall config page**

Create `src/app/(admin)/admin/paywall-config/page.tsx`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface PlanLimit {
  id: string
  plan: string
  feature: string
  limit_value: number
  window_days: number
  updated_at: string
}

export default function PaywallConfigPage() {
  const [limits, setLimits] = useState<PlanLimit[]>([])
  const [editing, setEditing] = useState<Record<string, { limit_value: number; window_days: number }>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/plan-limits')
      .then(r => r.json())
      .then(d => setLimits(d.limits ?? []))
  }, [])

  function startEdit(limit: PlanLimit) {
    setEditing(prev => ({
      ...prev,
      [`${limit.plan}:${limit.feature}`]: {
        limit_value: limit.limit_value,
        window_days: limit.window_days,
      },
    }))
  }

  async function save(limit: PlanLimit) {
    const key = `${limit.plan}:${limit.feature}`
    const edit = editing[key]
    if (!edit) return

    setSaving(key)
    setError(null)

    const res = await fetch('/api/admin/plan-limits', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: limit.plan, feature: limit.feature, ...edit }),
    })

    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Save failed')
    } else {
      const d = await res.json()
      setLimits(prev => prev.map(l =>
        l.plan === limit.plan && l.feature === limit.feature ? d.limit : l
      ))
      setEditing(prev => { const n = { ...prev }; delete n[key]; return n })
    }
    setSaving(null)
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-on-surface-variant hover:text-on-surface transition-colors">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </Link>
        <h1 className="font-headline text-2xl font-bold text-on-surface">Paywall Config</h1>
      </div>

      <p className="font-body text-sm text-on-surface-variant mb-6">
        Changes apply within 60 seconds — no deploy needed.
      </p>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-error/10 text-error text-sm font-body">{error}</div>
      )}

      <div className="bg-surface-container rounded-2xl border border-outline-variant/30 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-outline-variant/30">
              <th className="px-5 py-3 text-left font-label text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Plan</th>
              <th className="px-5 py-3 text-left font-label text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Feature</th>
              <th className="px-5 py-3 text-left font-label text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Limit</th>
              <th className="px-5 py-3 text-left font-label text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Window (days)</th>
              <th className="px-5 py-3 text-left font-label text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Last Updated</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {limits.map(limit => {
              const key = `${limit.plan}:${limit.feature}`
              const edit = editing[key]
              const isSaving = saving === key

              return (
                <tr key={key} className="border-b border-outline-variant/20 last:border-0">
                  <td className="px-5 py-3.5">
                    <span className="font-label text-sm font-semibold text-on-surface capitalize">{limit.plan}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-label text-sm text-on-surface capitalize">{limit.feature}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    {edit ? (
                      <input
                        type="number"
                        min={0}
                        value={edit.limit_value}
                        onChange={e => setEditing(prev => ({ ...prev, [key]: { ...edit, limit_value: parseInt(e.target.value) || 0 } }))}
                        className="w-20 px-2 py-1 rounded-lg border border-outline-variant bg-surface text-on-surface text-sm font-body focus:outline-none focus:border-primary"
                      />
                    ) : (
                      <span className="font-body text-sm text-on-surface">{limit.limit_value}</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    {edit ? (
                      <input
                        type="number"
                        min={1}
                        value={edit.window_days}
                        onChange={e => setEditing(prev => ({ ...prev, [key]: { ...edit, window_days: parseInt(e.target.value) || 30 } }))}
                        className="w-20 px-2 py-1 rounded-lg border border-outline-variant bg-surface text-on-surface text-sm font-body focus:outline-none focus:border-primary"
                      />
                    ) : (
                      <span className="font-body text-sm text-on-surface">{limit.window_days}</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-body text-xs text-on-surface-variant">
                      {new Date(limit.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {edit ? (
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => save(limit)}
                          disabled={isSaving}
                          className="px-3 py-1 rounded-full bg-primary text-on-primary text-xs font-label font-semibold transition-opacity disabled:opacity-60"
                        >
                          {isSaving ? 'Saving…' : 'Save'}
                        </button>
                        <button
                          onClick={() => setEditing(prev => { const n = { ...prev }; delete n[key]; return n })}
                          className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface text-xs font-label font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(limit)}
                        className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface text-xs font-label font-semibold hover:bg-surface-container-highest transition-colors"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add Paywall Config link to admin dashboard**

Read `src/app/(admin)/admin/page.tsx`. Find the section with the other quick-link buttons (users, luma-queue, content). Add alongside them:

```typescript
<Link href="/admin/paywall-config" className="flex items-center gap-2 px-4 py-2.5 bg-surface-container border border-outline-variant text-on-surface rounded-xl text-sm hover:bg-surface-container-high transition-colors">
  <span className="material-symbols-outlined text-[18px]">lock</span>
  Paywall Config
</Link>
```

- [ ] **Step 3: Type-check**

```bash
cd /Users/sandeep/Projects/myproductschool && npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(admin\)/admin/paywall-config/page.tsx src/app/\(admin\)/admin/page.tsx
git commit -m "feat: add admin paywall config UI and dashboard link"
```

---

## Task 17: Final Type-Check and Build Verification

**Files:** None (verification only)

- [ ] **Step 1: Full type-check**

```bash
cd /Users/sandeep/Projects/myproductschool && npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -30
```

Expected: no errors (pre-existing Deno errors in `supabase/functions/` are acceptable).

- [ ] **Step 2: Lint check**

```bash
cd /Users/sandeep/Projects/myproductschool && npm run lint 2>&1 | tail -20
```

Expected: no new errors.

- [ ] **Step 3: Verify dev server starts**

```bash
cd /Users/sandeep/Projects/myproductschool && npm run build 2>&1 | tail -30
```

Expected: `✓ Compiled successfully` or similar. No new build errors.

- [ ] **Step 4: Commit if any fixes needed**

If lint or tsc caught anything, fix and commit:

```bash
git add -p
git commit -m "fix: resolve lint/type errors in paywall system"
```

---

## Summary

| Task | Produces |
|---|---|
| 1 | GSAP installed |
| 2 | DB tables: `plan_limits`, `usage_events` |
| 3 | `checkUsageLimit`, `recordUsageEvent`, `getUsageForUser` |
| 4 | `GET /api/usage/me` |
| 5 | `UsageContext`, `useUsage`, `useIsAtLimit` |
| 6 | Challenge start API enforces rolling limit |
| 7 | Interview start API enforces rolling limit |
| 8 | `ChallengePaywallGate` with GSAP |
| 9 | `InterviewPaywallGate` with GSAP |
| 10 | `InterviewLimitModal` with GSAP + SVG arc |
| 11 | Challenge workspace shows gate on 402 |
| 12 | Challenge list shows lock badges + `LockedChallengeGrid` |
| 13 | Interview list shows lock badges, StartInterviewButton handles 402 |
| 14 | Mid-session `InterviewLimitModal` wired via updated `useInterviewTimer` |
| 15 | `GET/PUT /api/admin/plan-limits` |
| 16 | Admin paywall config page |
| 17 | Clean build verification |

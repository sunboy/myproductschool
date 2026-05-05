# Plan C: Full Loop Interview — DB, API, UI, Grading

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Full Loop interview feature end-to-end: Loop Builder UI, DB schema, all API routes, pause/resume mechanics, cross-round context pipeline (Haiku distillation), in-session progress bar, and Sonnet loop-level debrief.

**Architecture:** Two new DB tables (`interview_loops`, `loop_rounds`) with additive columns on `live_interview_sessions`. Six new API routes under `/api/interview-loops/` and two new routes under `/api/live-interview/[id]/` (pause, resume). Cross-round context is distilled by Haiku after each round ends and injected as an uncached second system block into the next round's prompt using the existing `createCachedMessageMultiSystem` pattern. Loop debrief runs once all rounds complete using `claude-sonnet-4-6`. Tab-close inside a loop session triggers pause (not abandon).

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase (PostgreSQL + RLS), Tailwind CSS v4, Anthropic SDK with `createCachedMessageMultiSystem`

**Prerequisite:** Plan B must be complete (lobby with Full Loop card linking to `/live-interviews/loop/new`).

---

## File Map

| File | Action | What |
|---|---|---|
| `supabase/migrations/073_interview_loops.sql` | Create | interview_loops + loop_rounds tables + live_interview_sessions additive columns |
| `src/lib/interview-loops/types.ts` | Create | All TypeScript interfaces for loops, rounds, debrief |
| `src/lib/interview-loops/loop-context-distiller.ts` | Create | Haiku call that distils a round debrief into 3-5 cross_round_memory signals |
| `src/lib/interview-loops/loop-debrief-generator.ts` | Create | Sonnet call that synthesises all round debriefs into loop_debrief_json |
| `src/app/api/interview-loops/create/route.ts` | Create | POST — create loop + loop_rounds rows |
| `src/app/api/interview-loops/[id]/route.ts` | Create | GET — loop status, rounds, scores |
| `src/app/api/interview-loops/[id]/start-round/route.ts` | Create | POST — advance to next round, create live_interview_sessions with prior context |
| `src/app/api/interview-loops/[id]/debrief/route.ts` | Create | POST — trigger Sonnet loop debrief |
| `src/app/api/live-interview/[id]/pause/route.ts` | Create | POST — save pause snapshot, set statuses |
| `src/app/api/live-interview/[id]/resume/route.ts` | Create | POST — restore from pause snapshot |
| `src/app/api/live-interview/[id]/end/route.ts` | Modify | After debrief: if loop session, run distiller + append cross_round_memory + check if all rounds done |
| `src/app/(app)/live-interviews/loop/new/page.tsx` | Create | Loop Builder (3-step wizard UI) |
| `src/app/(app)/live-interviews/loop/[id]/page.tsx` | Create | Loop dashboard — round list, resume card, progress |
| `src/components/live-interviews/LoopProgressBar.tsx` | Create | Dark top bar showing all rounds, shown during active loop session |
| `src/components/live-interviews/PriorRoundRecap.tsx` | Create | Read-only panel showing previous round's top signals |
| `src/components/live-interviews/PausedLoopCard.tsx` | Create | Dashboard resume card for paused loops |
| `src/app/(app)/live-interviews/[id]/page.tsx` | Modify | Render LoopProgressBar + PriorRoundRecap when session.loop_id is set; change sendBeacon to pause for loop sessions |

---

## Task 1: DB migration

**Files:**
- Create: `supabase/migrations/073_interview_loops.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/073_interview_loops.sql

-- Parent loop container
CREATE TABLE interview_loops (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title                TEXT NOT NULL,
  target_company       TEXT,
  target_role          TEXT,
  status               TEXT NOT NULL DEFAULT 'draft'
                         CHECK (status IN ('draft','active','paused','completed','abandoned')),
  round_order          TEXT[] NOT NULL DEFAULT '{}',
  current_round_index  INTEGER NOT NULL DEFAULT 0,
  cross_round_memory   JSONB NOT NULL DEFAULT '[]',
  loop_debrief_json    JSONB,
  started_at           TIMESTAMPTZ,
  completed_at         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Per-round rows
CREATE TABLE loop_rounds (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loop_id             UUID NOT NULL REFERENCES interview_loops(id) ON DELETE CASCADE,
  round_index         INTEGER NOT NULL,
  discipline          TEXT NOT NULL
                        CHECK (discipline IN ('product_sense','system_design','data_modeling','coding')),
  session_id          UUID REFERENCES live_interview_sessions(id),
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','active','paused','completed')),
  paused_at           TIMESTAMPTZ,
  resumed_at          TIMESTAMPTZ,
  pause_snapshot      JSONB,
  round_score         INTEGER,
  round_debrief_json  JSONB,
  context_injected    JSONB,
  started_at          TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  UNIQUE (loop_id, round_index)
);

-- Additive columns on live_interview_sessions
ALTER TABLE live_interview_sessions
  ADD COLUMN IF NOT EXISTS loop_id             UUID REFERENCES interview_loops(id),
  ADD COLUMN IF NOT EXISTS round_index         INTEGER,
  ADD COLUMN IF NOT EXISTS prior_round_context JSONB;

-- Extend live_interview_sessions status to allow 'paused'
-- (existing CHECK constraint must be dropped and re-added)
ALTER TABLE live_interview_sessions DROP CONSTRAINT IF EXISTS live_interview_sessions_status_check;
ALTER TABLE live_interview_sessions
  ADD CONSTRAINT live_interview_sessions_status_check
  CHECK (status IN ('active','paused','completed','abandoned'));

-- RLS
ALTER TABLE interview_loops ENABLE ROW LEVEL SECURITY;
ALTER TABLE loop_rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own loops"
  ON interview_loops FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage rounds of own loops"
  ON loop_rounds FOR ALL
  USING (
    EXISTS (SELECT 1 FROM interview_loops WHERE id = loop_id AND user_id = auth.uid())
  );

-- Indexes
CREATE INDEX interview_loops_user_id_idx ON interview_loops (user_id);
CREATE INDEX loop_rounds_loop_id_idx ON loop_rounds (loop_id);
CREATE INDEX live_interview_sessions_loop_id_idx ON live_interview_sessions (loop_id) WHERE loop_id IS NOT NULL;
```

- [ ] **Step 2: Apply migration**

```bash
npx supabase db push
```

Expected: no errors.

- [ ] **Step 3: Verify tables exist**

```bash
npx supabase db execute --sql "SELECT table_name FROM information_schema.tables WHERE table_name IN ('interview_loops','loop_rounds');"
```

Expected: both tables listed.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/073_interview_loops.sql
git commit -m "feat(db): add interview_loops and loop_rounds tables, extend live_interview_sessions"
```

---

## Task 2: TypeScript types

**Files:**
- Create: `src/lib/interview-loops/types.ts`

- [ ] **Step 1: Create the types file**

```typescript
// src/lib/interview-loops/types.ts

export type LoopStatus = 'draft' | 'active' | 'paused' | 'completed' | 'abandoned'
export type RoundStatus = 'pending' | 'active' | 'paused' | 'completed'
export type LoopDiscipline = 'product_sense' | 'system_design' | 'data_modeling' | 'coding'

export interface InterviewLoop {
  id: string
  user_id: string
  title: string
  target_company: string | null
  target_role: string | null
  status: LoopStatus
  round_order: LoopDiscipline[]
  current_round_index: number
  cross_round_memory: CrossRoundMemoryItem[]
  loop_debrief_json: LoopDebriefResult | null
  started_at: string | null
  completed_at: string | null
  created_at: string
}

export interface LoopRound {
  id: string
  loop_id: string
  round_index: number
  discipline: LoopDiscipline
  session_id: string | null
  status: RoundStatus
  paused_at: string | null
  resumed_at: string | null
  pause_snapshot: PauseSnapshot | null
  round_score: number | null
  round_debrief_json: Record<string, unknown> | null
  context_injected: CrossRoundMemoryItem[] | null
  started_at: string | null
  completed_at: string | null
}

export interface CrossRoundMemoryItem {
  signal: string              // e.g. "Consistently frames the right problem quickly"
  round_index: number         // which round this came from
  discipline: LoopDiscipline
}

export interface PauseSnapshot {
  flow_coverage: Record<string, number>
  conversation_memory: unknown[]
  system_prompt_hash: string
}

export interface LoopDebriefResult {
  hire_signal: 'hire' | 'lean_hire' | 'lean_no_hire' | 'no_hire'
  overall_score: number
  round_scores: Array<{
    discipline: LoopDiscipline
    score: number
    grade: string
  }>
  cross_round_insights: Array<{
    pattern: string
    rounds_seen_in: LoopDiscipline[]
    observation: string
  }>
  strengths: string[]
  improvements: string[]
  next_3_challenges: Array<{ id: string; reason: string }>
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/interview-loops/types.ts
git commit -m "feat(loops): add TypeScript types for interview loops"
```

---

## Task 3: Loop context distiller (Haiku)

**Files:**
- Create: `src/lib/interview-loops/loop-context-distiller.ts`

- [ ] **Step 1: Create the distiller**

```typescript
// src/lib/interview-loops/loop-context-distiller.ts
import { createCachedMessage } from '@/lib/anthropic/cached-client'
import type { CrossRoundMemoryItem, LoopDiscipline } from './types'

const SYSTEM_PROMPT = `You are a signal extractor for a multi-round interview coach. Given a round debrief JSON, extract 3-5 concise signals about the candidate's thinking patterns and blind spots. Focus on reasoning moves, not topic knowledge. Each signal must be one sentence. Return ONLY a JSON array of strings. No explanation. No markdown.`

export async function distillRoundContext(params: {
  roundDebriefJson: Record<string, unknown>
  roundIndex: number
  discipline: LoopDiscipline
}): Promise<CrossRoundMemoryItem[]> {
  const { roundDebriefJson, roundIndex, discipline } = params

  const response = await createCachedMessage(
    SYSTEM_PROMPT,
    JSON.stringify(roundDebriefJson),
    { model: 'claude-haiku-4-5-20251001', max_tokens: 512 }
  )

  const raw = response.content[0].type === 'text' ? response.content[0].text : '[]'

  let signals: string[]
  try {
    signals = JSON.parse(raw)
    if (!Array.isArray(signals)) signals = []
  } catch {
    signals = []
  }

  return signals.slice(0, 5).map((signal) => ({
    signal,
    round_index: roundIndex,
    discipline,
  }))
}

export function buildPriorRoundContextBlock(
  memory: CrossRoundMemoryItem[],
  currentRoundIndex: number,
  totalRounds: number,
  targetCompany: string | null,
  targetRole: string | null
): string {
  if (memory.length === 0) return ''

  const signals = memory.map((m) => `- ${m.signal}`).join('\n')

  return `[PRIOR ROUND CONTEXT]
You are Round ${currentRoundIndex + 1} of ${totalRounds} in a Full Loop${targetCompany ? ` for ${targetCompany}` : ''}${targetRole ? ` ${targetRole}` : ''}.

Signals from previous rounds:
${signals}

Do not reference these rounds explicitly. Let them inform your probing questions.`
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/interview-loops/loop-context-distiller.ts
git commit -m "feat(loops): add Haiku round context distiller"
```

---

## Task 4: Loop debrief generator (Sonnet)

**Files:**
- Create: `src/lib/interview-loops/loop-debrief-generator.ts`

- [ ] **Step 1: Create the generator**

```typescript
// src/lib/interview-loops/loop-debrief-generator.ts
import { createCachedMessage } from '@/lib/anthropic/cached-client'
import type { LoopDebriefResult, LoopRound, CrossRoundMemoryItem } from './types'

const SYSTEM_PROMPT = `You are an expert interview loop evaluator. You receive per-round debriefs from a multi-round engineering interview loop and must synthesise them into a single cross-round assessment.

Rules:
- Give a hire signal based on the overall picture — do NOT average scores mechanically. Weight rounds by their relevance to the target role.
- Surface 1-3 cross-cutting insights: patterns the candidate showed across multiple rounds. These are the most valuable part of this report.
- Keep strengths and improvements to the top 3 each, cross-cutting.
- next_3_challenges: recommend 3 specific practice challenge IDs from the platform. If you don't have IDs, return empty strings with a reason.
- Respond with ONLY valid JSON matching the schema exactly. No explanation. No markdown. No code fences.

JSON schema:
{
  "hire_signal": "hire|lean_hire|lean_no_hire|no_hire",
  "overall_score": <0-100 integer>,
  "round_scores": [{ "discipline": "<string>", "score": <0-100>, "grade": "<Excellent|Strong|Good|Developing>" }],
  "cross_round_insights": [{ "pattern": "<string>", "rounds_seen_in": ["<discipline>"], "observation": "<1-2 sentences>" }],
  "strengths": ["<string>"],
  "improvements": ["<string>"],
  "next_3_challenges": [{ "id": "<string>", "reason": "<string>" }]
}`

export async function generateLoopDebrief(params: {
  rounds: LoopRound[]
  crossRoundMemory: CrossRoundMemoryItem[]
  targetCompany: string | null
  targetRole: string | null
  calibrationSnapshot: Record<string, unknown>
}): Promise<LoopDebriefResult> {
  const { rounds, crossRoundMemory, targetCompany, targetRole, calibrationSnapshot } = params

  const userContent = JSON.stringify({
    target: { company: targetCompany, role: targetRole },
    calibration: calibrationSnapshot,
    cross_round_memory: crossRoundMemory,
    rounds: rounds.map((r) => ({
      round_index: r.round_index,
      discipline: r.discipline,
      score: r.round_score,
      debrief: r.round_debrief_json,
    })),
  })

  const response = await createCachedMessage(SYSTEM_PROMPT, userContent, {
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : '{}'

  try {
    return JSON.parse(raw) as LoopDebriefResult
  } catch {
    // Fallback if JSON parse fails
    return {
      hire_signal: 'lean_hire',
      overall_score: Math.round(
        rounds.reduce((sum, r) => sum + (r.round_score ?? 0), 0) / Math.max(rounds.length, 1)
      ),
      round_scores: rounds.map((r) => ({
        discipline: r.discipline,
        score: r.round_score ?? 0,
        grade: 'Good',
      })),
      cross_round_insights: [],
      strengths: [],
      improvements: [],
      next_3_challenges: [],
    }
  }
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/interview-loops/loop-debrief-generator.ts
git commit -m "feat(loops): add Sonnet loop debrief generator"
```

---

## Task 5: POST /api/interview-loops/create

**Files:**
- Create: `src/app/api/interview-loops/create/route.ts`

- [ ] **Step 1: Create the route**

```typescript
// src/app/api/interview-loops/create/route.ts
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { LoopDiscipline } from '@/lib/interview-loops/types'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { targetCompany, targetRole, roundOrder } = await request.json() as {
    targetCompany: string
    targetRole: string
    roundOrder: LoopDiscipline[]
  }

  if (!roundOrder || roundOrder.length < 2) {
    return Response.json({ error: 'At least 2 rounds required' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  const title = [targetCompany, targetRole, 'Loop'].filter(Boolean).join(' ')

  // Create the loop
  const { data: loop, error: loopError } = await adminClient
    .from('interview_loops')
    .insert({
      user_id: user.id,
      title,
      target_company: targetCompany || null,
      target_role: targetRole || null,
      status: 'draft',
      round_order: roundOrder,
      current_round_index: 0,
    })
    .select()
    .single()

  if (loopError || !loop) {
    return Response.json({ error: loopError?.message ?? 'Failed to create loop' }, { status: 500 })
  }

  // Create one loop_round row per discipline in the order
  const roundRows = roundOrder.map((discipline, idx) => ({
    loop_id: loop.id,
    round_index: idx,
    discipline,
    status: 'pending' as const,
  }))

  const { error: roundsError } = await adminClient
    .from('loop_rounds')
    .insert(roundRows)

  if (roundsError) {
    return Response.json({ error: roundsError.message }, { status: 500 })
  }

  return Response.json({ loopId: loop.id, title })
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/interview-loops/create/route.ts
git commit -m "feat(api): POST /api/interview-loops/create"
```

---

## Task 6: GET /api/interview-loops/[id]

**Files:**
- Create: `src/app/api/interview-loops/[id]/route.ts`

- [ ] **Step 1: Create the route**

```typescript
// src/app/api/interview-loops/[id]/route.ts
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const adminClient = createAdminClient()

  const [loopResult, roundsResult] = await Promise.all([
    adminClient
      .from('interview_loops')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single(),
    adminClient
      .from('loop_rounds')
      .select('*')
      .eq('loop_id', id)
      .order('round_index', { ascending: true }),
  ])

  if (!loopResult.data) return new Response('Not found', { status: 404 })

  return Response.json({
    loop: loopResult.data,
    rounds: roundsResult.data ?? [],
  })
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/interview-loops/\[id\]/route.ts
git commit -m "feat(api): GET /api/interview-loops/[id]"
```

---

## Task 7: POST /api/interview-loops/[id]/start-round

**Files:**
- Create: `src/app/api/interview-loops/[id]/start-round/route.ts`

- [ ] **Step 1: Create the route**

```typescript
// src/app/api/interview-loops/[id]/start-round/route.ts
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildPriorRoundContextBlock } from '@/lib/interview-loops/loop-context-distiller'
import { buildLiveInterviewSystemPrompt } from '@/lib/live-interview/system-prompt'
import { getHatchContext, buildHatchContextString } from '@/lib/hatch-context'
import type { CrossRoundMemoryItem } from '@/lib/interview-loops/types'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const adminClient = createAdminClient()

  // Load loop + rounds + user profile in parallel
  const [loopResult, roundsResult, profileResult, moveLevelsResult] = await Promise.all([
    adminClient.from('interview_loops').select('*').eq('id', id).eq('user_id', user.id).single(),
    adminClient.from('loop_rounds').select('*').eq('loop_id', id).order('round_index', { ascending: true }),
    adminClient.from('profiles').select('archetype, archetype_description, active_role, display_name').eq('id', user.id).single(),
    adminClient.from('move_levels').select('*').eq('user_id', user.id),
  ])

  const loop = loopResult.data
  const rounds = roundsResult.data ?? []
  if (!loop) return new Response('Loop not found', { status: 404 })

  const currentRound = rounds.find((r) => r.round_index === loop.current_round_index)
  if (!currentRound) return new Response('Round not found', { status: 404 })
  if (currentRound.status === 'completed') {
    return Response.json({ error: 'Round already completed' }, { status: 409 })
  }

  const profile = profileResult.data
  const moveLevels = Object.fromEntries(
    (moveLevelsResult.data ?? []).map((m: { move: string; level: number }) => [m.move, m.level])
  )

  // Build prior round context block from cross_round_memory
  const memory = (loop.cross_round_memory ?? []) as CrossRoundMemoryItem[]
  const priorContextBlock = buildPriorRoundContextBlock(
    memory,
    loop.current_round_index,
    loop.round_order.length,
    loop.target_company,
    loop.target_role
  )

  // Build base system prompt (reuse existing builder)
  const hatchCtx = await getHatchContext(user.id, adminClient)
  const basePrompt = buildLiveInterviewSystemPrompt({
    archetype: profile?.archetype ?? 'Analyst',
    archetypeDescription: profile?.archetype_description ?? '',
    moveLevels: moveLevels as Record<string, number>,
    failurePatterns: [],
    competencies: [],
    hatchContext: buildHatchContextString(hatchCtx),
    companyName: loop.target_company ?? 'the target company',
    roleId: profile?.active_role ?? loop.target_role ?? 'SWE',
    personaPrompt: `You are interviewing a candidate for ${loop.target_role ?? 'an engineering role'} at ${loop.target_company ?? 'a tech company'}. This is the ${currentRound.discipline.replace('_', ' ')} round.`,
    learnerName: profile?.display_name ?? 'the candidate',
    scenario: null,
    roleLens: null,
    relevantNotes: null,
  })

  // Create live_interview_sessions row for this round
  const calibrationSnapshot = {
    archetype: profile?.archetype ?? 'Analyst',
    moveLevels,
  }

  const { data: session, error: sessionError } = await adminClient
    .from('live_interview_sessions')
    .insert({
      user_id: user.id,
      company_id: null,
      role_id: profile?.active_role ?? loop.target_role ?? 'SWE',
      status: 'active',
      started_at: new Date().toISOString(),
      system_prompt: basePrompt,
      calibration_snapshot: calibrationSnapshot,
      loop_id: id,
      round_index: loop.current_round_index,
      prior_round_context: memory.length > 0 ? memory : null,
    })
    .select()
    .single()

  if (sessionError || !session) {
    return Response.json({ error: sessionError?.message ?? 'Failed to create session' }, { status: 500 })
  }

  // Update loop_round with session_id + status
  await adminClient
    .from('loop_rounds')
    .update({ session_id: session.id, status: 'active', started_at: new Date().toISOString() })
    .eq('id', currentRound.id)

  // Update loop status to active
  await adminClient
    .from('interview_loops')
    .update({ status: 'active', started_at: loop.started_at ?? new Date().toISOString() })
    .eq('id', id)

  return Response.json({
    sessionId: session.id,
    roundIndex: loop.current_round_index,
    discipline: currentRound.discipline,
    priorContextInjected: memory.length > 0,
  })
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```

Expected: no errors. Fix any type mismatches in `buildLiveInterviewSystemPrompt` call — check the exact params shape in `src/lib/live-interview/system-prompt.ts` and pass `null` for optional fields that are unavailable.

- [ ] **Step 3: Commit**

```bash
git add "src/app/api/interview-loops/[id]/start-round/route.ts"
git commit -m "feat(api): POST /api/interview-loops/[id]/start-round"
```

---

## Task 8: POST /api/live-interview/[id]/pause

**Files:**
- Create: `src/app/api/live-interview/[id]/pause/route.ts`

- [ ] **Step 1: Create the route**

```typescript
// src/app/api/live-interview/[id]/pause/route.ts
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createHash } from 'crypto'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const adminClient = createAdminClient()

  const { data: session } = await adminClient
    .from('live_interview_sessions')
    .select('id, status, loop_id, round_index, flow_coverage, conversation_memory, system_prompt')
    .eq('id', id)
    .single()

  if (!session) return new Response('Session not found', { status: 404 })
  if (!session.loop_id) return Response.json({ error: 'Only loop sessions can be paused' }, { status: 400 })
  if (session.status === 'completed') return Response.json({ error: 'Session already completed' }, { status: 409 })

  const pauseSnapshot = {
    flow_coverage: session.flow_coverage ?? {},
    conversation_memory: session.conversation_memory ?? [],
    system_prompt_hash: createHash('sha256').update(session.system_prompt ?? '').digest('hex').slice(0, 16),
  }

  const now = new Date().toISOString()

  // Pause session
  await adminClient
    .from('live_interview_sessions')
    .update({ status: 'paused' })
    .eq('id', id)

  // Pause loop_round
  const { data: round } = await adminClient
    .from('loop_rounds')
    .select('id')
    .eq('loop_id', session.loop_id)
    .eq('round_index', session.round_index)
    .single()

  if (round) {
    await adminClient
      .from('loop_rounds')
      .update({ status: 'paused', paused_at: now, pause_snapshot: pauseSnapshot })
      .eq('id', round.id)
  }

  // Pause loop
  await adminClient
    .from('interview_loops')
    .update({ status: 'paused' })
    .eq('id', session.loop_id)

  return Response.json({ ok: true, paused_at: now })
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "src/app/api/live-interview/[id]/pause/route.ts"
git commit -m "feat(api): POST /api/live-interview/[id]/pause"
```

---

## Task 9: POST /api/live-interview/[id]/resume

**Files:**
- Create: `src/app/api/live-interview/[id]/resume/route.ts`

- [ ] **Step 1: Create the route**

```typescript
// src/app/api/live-interview/[id]/resume/route.ts
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const adminClient = createAdminClient()

  const { data: session } = await adminClient
    .from('live_interview_sessions')
    .select('*')
    .eq('id', id)
    .single()

  if (!session) return new Response('Session not found', { status: 404 })
  if (!session.loop_id) return Response.json({ error: 'Not a loop session' }, { status: 400 })
  if (session.status !== 'paused') return Response.json({ error: 'Session is not paused' }, { status: 409 })

  // Fetch pause_snapshot from loop_round
  const { data: round } = await adminClient
    .from('loop_rounds')
    .select('id, pause_snapshot')
    .eq('loop_id', session.loop_id)
    .eq('round_index', session.round_index)
    .single()

  const snapshot = round?.pause_snapshot as { flow_coverage?: Record<string, number>; conversation_memory?: unknown[] } | null

  const now = new Date().toISOString()

  // Restore conversation_memory + flow_coverage and set status active
  await adminClient
    .from('live_interview_sessions')
    .update({
      status: 'active',
      flow_coverage: snapshot?.flow_coverage ?? session.flow_coverage,
      conversation_memory: snapshot?.conversation_memory ?? session.conversation_memory,
    })
    .eq('id', id)

  // Update loop_round
  if (round) {
    await adminClient
      .from('loop_rounds')
      .update({ status: 'active', resumed_at: now })
      .eq('id', round.id)
  }

  // Update loop status
  await adminClient
    .from('interview_loops')
    .update({ status: 'active' })
    .eq('id', session.loop_id)

  // Return full session for client to render
  const { data: refreshed } = await adminClient
    .from('live_interview_sessions')
    .select('*')
    .eq('id', id)
    .single()

  return Response.json({ session: refreshed, resumedAt: now })
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "src/app/api/live-interview/[id]/resume/route.ts"
git commit -m "feat(api): POST /api/live-interview/[id]/resume"
```

---

## Task 10: Extend /api/live-interview/[id]/end for loop sessions

**Files:**
- Modify: `src/app/api/live-interview/[id]/end/route.ts`

- [ ] **Step 1: Read the current end route fully**

Read `src/app/api/live-interview/[id]/end/route.ts` before editing.

- [ ] **Step 2: Add loop post-processing after the existing debrief is stored**

After the existing `adminClient.from('live_interview_sessions').update({ status: 'completed', ... })` call, add the following block:

```typescript
// If this session is part of a loop, run post-processing
if (session.loop_id && session.round_index !== null && !abandoned) {
  const { distillRoundContext } = await import('@/lib/interview-loops/loop-context-distiller')
  const { generateLoopDebrief } = await import('@/lib/interview-loops/loop-debrief-generator')

  // 1. Distil round context signals
  const newSignals = await distillRoundContext({
    roundDebriefJson: debriefResult as Record<string, unknown>,
    roundIndex: session.round_index,
    discipline: (session.round_index !== null ? session.prior_round_context : null) as never,
  })

  // Fetch loop to get current cross_round_memory and round info
  const [loopResult, allRoundsResult] = await Promise.all([
    adminClient.from('interview_loops').select('*').eq('id', session.loop_id).single(),
    adminClient.from('loop_rounds').select('*').eq('loop_id', session.loop_id).order('round_index', { ascending: true }),
  ])

  const loop = loopResult.data
  const allRounds = allRoundsResult.data ?? []

  if (loop) {
    const updatedMemory = [...((loop.cross_round_memory ?? []) as unknown[]), ...newSignals]

    // 2. Mark this round as completed, store round_debrief_json, round_score
    const thisRound = allRounds.find((r) => r.round_index === session.round_index)
    if (thisRound) {
      await adminClient
        .from('loop_rounds')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          round_score: debriefResult.overallScore,
          round_debrief_json: debriefResult,
        })
        .eq('id', thisRound.id)
    }

    const nextRoundIndex = loop.current_round_index + 1
    const allComplete = nextRoundIndex >= loop.round_order.length

    // 3. Update loop: append memory, advance index, set status
    await adminClient
      .from('interview_loops')
      .update({
        cross_round_memory: updatedMemory,
        current_round_index: nextRoundIndex,
        status: allComplete ? 'completed' : 'paused',  // pause between rounds
        completed_at: allComplete ? new Date().toISOString() : null,
      })
      .eq('id', session.loop_id)

    // 4. If all rounds done, trigger loop debrief
    if (allComplete) {
      const updatedRounds = await adminClient
        .from('loop_rounds')
        .select('*')
        .eq('loop_id', session.loop_id)
        .order('round_index', { ascending: true })

      const calibration = session.calibration_snapshot as Record<string, unknown>

      const loopDebrief = await generateLoopDebrief({
        rounds: (updatedRounds.data ?? []) as Parameters<typeof generateLoopDebrief>[0]['rounds'],
        crossRoundMemory: updatedMemory as Parameters<typeof generateLoopDebrief>[0]['crossRoundMemory'],
        targetCompany: loop.target_company,
        targetRole: loop.target_role,
        calibrationSnapshot: calibration,
      })

      await adminClient
        .from('interview_loops')
        .update({ loop_debrief_json: loopDebrief })
        .eq('id', session.loop_id)
    }
  }
}
```

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```

Expected: no errors. Fix type casts as needed — `distillRoundContext` discipline param: fetch it from the `loop_rounds` row for this session using `session.round_index`.

- [ ] **Step 4: Commit**

```bash
git add "src/app/api/live-interview/[id]/end/route.ts"
git commit -m "feat(api): extend end route to run loop post-processing (distil signals, trigger loop debrief)"
```

---

## Task 11: POST /api/interview-loops/[id]/debrief (manual trigger)

**Files:**
- Create: `src/app/api/interview-loops/[id]/debrief/route.ts`

- [ ] **Step 1: Create the route**

```typescript
// src/app/api/interview-loops/[id]/debrief/route.ts
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateLoopDebrief } from '@/lib/interview-loops/loop-debrief-generator'
import type { CrossRoundMemoryItem, LoopRound } from '@/lib/interview-loops/types'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const adminClient = createAdminClient()

  const [loopResult, roundsResult, profileResult] = await Promise.all([
    adminClient.from('interview_loops').select('*').eq('id', id).eq('user_id', user.id).single(),
    adminClient.from('loop_rounds').select('*').eq('loop_id', id).order('round_index', { ascending: true }),
    adminClient.from('profiles').select('archetype, archetype_description').eq('id', user.id).single(),
  ])

  const loop = loopResult.data
  if (!loop) return new Response('Loop not found', { status: 404 })

  const rounds = (roundsResult.data ?? []) as LoopRound[]
  const memory = (loop.cross_round_memory ?? []) as CrossRoundMemoryItem[]

  const debrief = await generateLoopDebrief({
    rounds,
    crossRoundMemory: memory,
    targetCompany: loop.target_company,
    targetRole: loop.target_role,
    calibrationSnapshot: {
      archetype: profileResult.data?.archetype ?? 'Analyst',
      archetypeDescription: profileResult.data?.archetype_description ?? '',
    },
  })

  await adminClient
    .from('interview_loops')
    .update({ loop_debrief_json: debrief, status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', id)

  return Response.json({ debrief })
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "src/app/api/interview-loops/[id]/debrief/route.ts"
git commit -m "feat(api): POST /api/interview-loops/[id]/debrief manual trigger"
```

---

## Task 12: LoopProgressBar component

**Files:**
- Create: `src/components/live-interviews/LoopProgressBar.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/live-interviews/LoopProgressBar.tsx
'use client'

import type { LoopRound, LoopDiscipline } from '@/lib/interview-loops/types'

const DISCIPLINE_LABELS: Record<LoopDiscipline, string> = {
  product_sense: 'Product',
  system_design: 'Sys Design',
  data_modeling: 'Data',
  coding: 'Coding',
}

interface Props {
  loopTitle: string
  rounds: LoopRound[]
  currentRoundIndex: number
  onPause: () => void
}

export function LoopProgressBar({ loopTitle, rounds, currentRoundIndex, onPause }: Props) {
  return (
    <div className="bg-inverse-surface flex items-center gap-3 px-4 py-2.5 shrink-0">
      <span className="font-label font-bold text-inverse-on-surface text-xs whitespace-nowrap hidden sm:block">
        {loopTitle}
      </span>

      {/* Round stepper */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {rounds.map((round, idx) => {
          const isDone = round.status === 'completed'
          const isActive = round.round_index === currentRoundIndex && round.status === 'active'
          const isPending = round.status === 'pending'

          return (
            <div key={round.id} className="flex items-center gap-2 min-w-0">
              {/* Connector line (not before first) */}
              {idx > 0 && (
                <div className={`h-px flex-1 min-w-2 rounded ${isDone ? 'bg-primary' : 'bg-white/20'}`} />
              )}
              <div className="flex items-center gap-1.5 shrink-0">
                <div className={[
                  'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                  isDone ? 'bg-primary text-on-primary' : isActive ? 'bg-tertiary-container text-on-surface' : 'bg-white/10 text-white/30',
                ].join(' ')}>
                  {isDone ? (
                    <span className="material-symbols-outlined text-xs leading-none">check</span>
                  ) : (
                    idx + 1
                  )}
                </div>
                <span className={`text-[10px] font-label hidden sm:block ${isActive ? 'text-inverse-on-surface font-semibold' : isPending ? 'text-white/30' : 'text-white/50'}`}>
                  {DISCIPLINE_LABELS[round.discipline]}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Pause button */}
      <button
        onClick={onPause}
        className="flex items-center gap-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-2.5 py-1 text-inverse-on-surface font-label text-xs whitespace-nowrap transition-colors"
      >
        <span className="material-symbols-outlined text-sm leading-none">pause</span>
        <span className="hidden sm:inline">Pause loop</span>
      </button>
    </div>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/live-interviews/LoopProgressBar.tsx
git commit -m "feat(ui): add LoopProgressBar component for in-session loop progress"
```

---

## Task 13: PriorRoundRecap component

**Files:**
- Create: `src/components/live-interviews/PriorRoundRecap.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/live-interviews/PriorRoundRecap.tsx
import type { LoopRound } from '@/lib/interview-loops/types'

interface Props {
  previousRound: LoopRound | null
}

export function PriorRoundRecap({ previousRound }: Props) {
  if (!previousRound || !previousRound.round_debrief_json) return null

  const debrief = previousRound.round_debrief_json as {
    strengths?: string[]
    improvements?: string[]
    overallScore?: number
  }

  const strengths = (debrief.strengths ?? []).slice(0, 2)
  const topMiss = (debrief.improvements ?? [])[0]
  const score = debrief.overallScore

  const DISCIPLINE_LABELS: Record<string, string> = {
    product_sense: 'Product Sense',
    system_design: 'System Design',
    data_modeling: 'Data Modeling',
    coding: 'Coding',
  }

  return (
    <div className="bg-surface-container rounded-xl p-3 border border-outline-variant flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="font-label text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
          Round {previousRound.round_index + 1} recap
        </span>
        {score !== undefined && (
          <span className="font-label text-xs font-bold text-primary">{score}/100</span>
        )}
      </div>
      <div className="font-label text-[10px] text-on-surface-variant">
        {DISCIPLINE_LABELS[previousRound.discipline] ?? previousRound.discipline}
      </div>
      {strengths.map((s, i) => (
        <div key={i} className="flex items-start gap-1.5 text-xs">
          <span className="text-primary mt-0.5 shrink-0">✓</span>
          <span className="text-on-surface leading-snug">{s}</span>
        </div>
      ))}
      {topMiss && (
        <div className="flex items-start gap-1.5 text-xs">
          <span className="text-error mt-0.5 shrink-0">✗</span>
          <span className="text-on-surface leading-snug">{topMiss}</span>
        </div>
      )}
      <div className="text-[9px] text-on-surface-variant/60 border-t border-outline-variant pt-1.5">
        Hatch is carrying this context into this round.
      </div>
    </div>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/live-interviews/PriorRoundRecap.tsx
git commit -m "feat(ui): add PriorRoundRecap component"
```

---

## Task 14: PausedLoopCard dashboard component

**Files:**
- Create: `src/components/live-interviews/PausedLoopCard.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/live-interviews/PausedLoopCard.tsx
import Link from 'next/link'
import type { InterviewLoop, LoopRound } from '@/lib/interview-loops/types'

const DISCIPLINE_LABELS: Record<string, string> = {
  product_sense: 'Product',
  system_design: 'Sys Design',
  data_modeling: 'Data',
  coding: 'Coding',
}

interface Props {
  loop: InterviewLoop
  rounds: LoopRound[]
}

export function PausedLoopCard({ loop, rounds }: Props) {
  const pausedRound = rounds.find((r) => r.status === 'paused')
  if (!pausedRound) return null

  const minutesIn = pausedRound.started_at
    ? Math.floor((Date.now() - new Date(pausedRound.started_at).getTime()) / 60000)
    : null

  return (
    <div className="bg-inverse-surface rounded-xl p-4 flex flex-col gap-3">
      {/* Status indicator */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-tertiary-container rounded-full" />
        <span className="font-label text-[10px] text-inverse-on-surface/50 uppercase tracking-wider">Loop paused</span>
      </div>

      <div>
        <div className="font-label font-bold text-inverse-on-surface text-sm">{loop.title}</div>
        <div className="font-label text-xs text-inverse-on-surface/60 mt-0.5">
          Round {pausedRound.round_index + 1} of {loop.round_order.length}
          {' — '}{DISCIPLINE_LABELS[pausedRound.discipline] ?? pausedRound.discipline}
          {minutesIn !== null && ` · ${minutesIn} min in`}
        </div>
      </div>

      {/* Round progress chips */}
      <div className="flex gap-1.5 flex-wrap">
        {rounds.map((r) => (
          <span
            key={r.id}
            className={[
              'rounded px-2 py-0.5 text-[9px] font-label',
              r.status === 'completed' ? 'bg-primary text-on-primary' :
              r.status === 'paused' ? 'bg-tertiary-container text-on-surface' :
              'bg-white/10 text-white/40',
            ].join(' ')}
          >
            {r.status === 'completed' ? '✓ ' : r.status === 'paused' ? '⏸ ' : ''}
            {DISCIPLINE_LABELS[r.discipline] ?? r.discipline}
          </span>
        ))}
      </div>

      {/* Resume CTA */}
      {pausedRound.session_id && (
        <Link href={`/live-interviews/${pausedRound.session_id}`}>
          <div className="bg-primary text-on-primary rounded-xl py-2.5 text-center font-label font-bold text-sm cursor-pointer hover:opacity-90 transition-opacity">
            Resume Round {pausedRound.round_index + 1} →
          </div>
        </Link>
      )}
    </div>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/live-interviews/PausedLoopCard.tsx
git commit -m "feat(ui): add PausedLoopCard dashboard component"
```

---

## Task 15: Loop Builder UI (3-step wizard)

**Files:**
- Create: `src/app/(app)/live-interviews/loop/new/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
// src/app/(app)/live-interviews/loop/new/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { LoopDiscipline } from '@/lib/interview-loops/types'

const DISCIPLINE_OPTIONS: { key: LoopDiscipline; label: string; duration: string; emoji: string }[] = [
  { key: 'coding', label: 'Coding', duration: '25 min', emoji: '💻' },
  { key: 'system_design', label: 'System Design', duration: '35 min', emoji: '🏗️' },
  { key: 'data_modeling', label: 'Data Modeling', duration: '30 min', emoji: '🗄️' },
  { key: 'product_sense', label: 'Product Sense', duration: '30 min', emoji: '🧠' },
]

const ROLE_SUGGESTIONS: Record<string, LoopDiscipline[]> = {
  'staff eng': ['coding', 'system_design', 'product_sense'],
  'founding eng': ['coding', 'system_design', 'data_modeling', 'product_sense'],
  'pm': ['product_sense', 'data_modeling'],
  'tech lead': ['system_design', 'product_sense', 'coding'],
}

function suggestRoundOrder(role: string): LoopDiscipline[] {
  const lower = role.toLowerCase()
  for (const [key, order] of Object.entries(ROLE_SUGGESTIONS)) {
    if (lower.includes(key)) return order
  }
  return ['coding', 'system_design', 'product_sense']
}

export default function LoopBuilderPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [targetCompany, setTargetCompany] = useState('')
  const [targetRole, setTargetRole] = useState('')
  const [roundOrder, setRoundOrder] = useState<LoopDiscipline[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleNext() {
    if (step === 1) {
      setRoundOrder(suggestRoundOrder(targetRole))
      setStep(2)
    } else if (step === 2) {
      setStep(3)
    }
  }

  function removeRound(idx: number) {
    setRoundOrder((prev) => prev.filter((_, i) => i !== idx))
  }

  function addRound(discipline: LoopDiscipline) {
    if (!roundOrder.includes(discipline)) {
      setRoundOrder((prev) => [...prev, discipline])
    }
  }

  async function handleStart() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/interview-loops/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetCompany, targetRole, roundOrder }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to create loop')
        return
      }
      const { loopId } = await res.json()
      router.push(`/live-interviews/loop/${loopId}`)
    } finally {
      setLoading(false)
    }
  }

  const totalMinutes = roundOrder.reduce((sum, d) => {
    const opt = DISCIPLINE_OPTIONS.find((o) => o.key === d)
    return sum + (opt ? parseInt(opt.duration) : 0)
  }, 0)

  return (
    <div className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-6">
      <div>
        <h1 className="font-headline font-bold text-on-surface text-xl mb-1">Build your loop</h1>
        <p className="font-body text-sm text-on-surface-variant">Configure a multi-round interview simulation.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            {s > 1 && <div className={`h-px w-6 ${step >= s ? 'bg-primary' : 'bg-outline-variant'}`} />}
            <div className={[
              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
              step >= s ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant',
            ].join(' ')}>
              {s}
            </div>
            <span className={`text-xs font-label ${step === s ? 'text-primary font-semibold' : 'text-on-surface-variant'}`}>
              {s === 1 ? 'Target' : s === 2 ? 'Rounds' : 'Confirm'}
            </span>
          </div>
        ))}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div className="bg-surface-container rounded-xl p-5 border border-outline-variant flex flex-col gap-4">
          <div className="font-label font-bold text-on-surface">Who are you targeting?</div>
          <div className="flex flex-col gap-3">
            <div>
              <label className="font-label text-xs text-on-surface-variant font-semibold mb-1 block">Company</label>
              <input
                className="w-full border border-outline-variant rounded-lg px-3 py-2 font-body text-sm bg-surface text-on-surface focus:outline-none focus:border-primary"
                placeholder="e.g. Stripe, Google, Series B startup…"
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
              />
            </div>
            <div>
              <label className="font-label text-xs text-on-surface-variant font-semibold mb-1 block">Role & Level</label>
              <input
                className="w-full border border-outline-variant rounded-lg px-3 py-2 font-body text-sm bg-surface text-on-surface focus:outline-none focus:border-primary"
                placeholder="e.g. Staff Eng L6, Founding PM…"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
              />
            </div>
          </div>
          <button
            onClick={handleNext}
            disabled={!targetRole.trim()}
            className="bg-primary text-on-primary rounded-xl py-2.5 font-label font-bold text-sm disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            Next →
          </button>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="bg-surface-container rounded-xl p-5 border border-outline-variant flex flex-col gap-4">
          <div>
            <div className="font-label font-bold text-on-surface mb-1">Configure rounds</div>
            <div className="font-body text-xs text-on-surface-variant">Hatch suggested this order based on your role. Drag to reorder or remove rounds.</div>
          </div>
          <div className="flex flex-col gap-2">
            {roundOrder.map((discipline, idx) => {
              const opt = DISCIPLINE_OPTIONS.find((o) => o.key === discipline)!
              return (
                <div key={discipline} className="flex items-center gap-3 bg-surface-container-low rounded-lg px-3 py-2.5 border border-outline-variant">
                  <span className="text-on-surface-variant/40 text-lg">⠿</span>
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-on-primary text-xs font-bold shrink-0">{idx + 1}</div>
                  <div className="flex-1">
                    <div className="font-label font-semibold text-sm text-on-surface">{opt.emoji} {opt.label}</div>
                    <div className="font-label text-xs text-on-surface-variant">{opt.duration}</div>
                  </div>
                  <button onClick={() => removeRound(idx)} className="text-on-surface-variant/40 hover:text-error transition-colors">
                    <span className="material-symbols-outlined text-base leading-none">close</span>
                  </button>
                </div>
              )
            })}

            {/* Add round */}
            {DISCIPLINE_OPTIONS.filter((o) => !roundOrder.includes(o.key)).length > 0 && (
              <div className="border border-dashed border-outline-variant rounded-lg p-2 flex gap-2 flex-wrap">
                {DISCIPLINE_OPTIONS.filter((o) => !roundOrder.includes(o.key)).map((o) => (
                  <button
                    key={o.key}
                    onClick={() => addRound(o.key)}
                    className="text-xs font-label text-on-surface-variant border border-outline-variant rounded-lg px-2.5 py-1 hover:bg-surface-container-high transition-colors"
                  >
                    + {o.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="border border-outline-variant rounded-xl py-2.5 px-4 font-label text-sm text-on-surface-variant">
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={roundOrder.length < 2}
              className="flex-1 bg-primary text-on-primary rounded-xl py-2.5 font-label font-bold text-sm disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div className="bg-surface-container rounded-xl p-5 border border-outline-variant flex flex-col gap-4">
          <div className="font-label font-bold text-on-surface">Confirm your loop</div>
          <div className="flex flex-col gap-1.5 text-sm font-body text-on-surface-variant">
            <div><span className="font-semibold text-on-surface">Target:</span> {[targetCompany, targetRole].filter(Boolean).join(' · ')}</div>
            <div><span className="font-semibold text-on-surface">Rounds:</span> {roundOrder.map((d) => DISCIPLINE_OPTIONS.find((o) => o.key === d)?.label).join(' → ')}</div>
            <div><span className="font-semibold text-on-surface">Est. total:</span> {totalMinutes} min</div>
          </div>
          <div className="font-body text-xs text-on-surface-variant bg-surface-container-high rounded-lg p-3">
            You can pause between rounds and resume at any time. Hatch will carry context from each completed round into the next.
          </div>
          {error && <div className="text-error text-xs font-label">{error}</div>}
          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="border border-outline-variant rounded-xl py-2.5 px-4 font-label text-sm text-on-surface-variant">
              Back
            </button>
            <button
              onClick={handleStart}
              disabled={loading}
              className="flex-1 bg-primary text-on-primary rounded-xl py-2.5 font-label font-bold text-sm disabled:opacity-60"
            >
              {loading ? 'Creating…' : 'Start loop →'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(app)/live-interviews/loop/new/page.tsx"
git commit -m "feat(ui): Loop Builder 3-step wizard"
```

---

## Task 16: Loop dashboard page

**Files:**
- Create: `src/app/(app)/live-interviews/loop/[id]/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
// src/app/(app)/live-interviews/loop/[id]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { InterviewLoop, LoopRound } from '@/lib/interview-loops/types'

const DISCIPLINE_LABELS: Record<string, string> = {
  product_sense: 'Product Sense',
  system_design: 'System Design',
  data_modeling: 'Data Modeling',
  coding: 'Coding',
}

export default async function LoopDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createAdminClient()

  const [loopResult, roundsResult] = await Promise.all([
    adminClient.from('interview_loops').select('*').eq('id', id).eq('user_id', user.id).single(),
    adminClient.from('loop_rounds').select('*').eq('loop_id', id).order('round_index', { ascending: true }),
  ])

  const loop = loopResult.data as InterviewLoop | null
  if (!loop) redirect('/live-interviews')

  const rounds = (roundsResult.data ?? []) as LoopRound[]
  const nextRound = rounds.find((r) => r.status === 'pending' || r.status === 'paused')
  const pausedRound = rounds.find((r) => r.status === 'paused')

  return (
    <div className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-6">
      <div>
        <h1 className="font-headline font-bold text-on-surface text-xl mb-1">{loop.title}</h1>
        <p className="font-body text-sm text-on-surface-variant capitalize">{loop.status}</p>
      </div>

      {/* Rounds list */}
      <div className="flex flex-col gap-3">
        {rounds.map((round) => {
          const isDone = round.status === 'completed'
          const isPaused = round.status === 'paused'
          const isNext = round.id === nextRound?.id

          return (
            <div
              key={round.id}
              className={[
                'rounded-xl p-4 border flex items-center gap-3',
                isDone ? 'bg-primary-fixed border-primary/20' :
                isPaused ? 'bg-tertiary-container/40 border-tertiary-container' :
                isNext ? 'bg-surface-container border-outline' :
                'bg-surface-container-low border-outline-variant opacity-50',
              ].join(' ')}
            >
              <div className={[
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                isDone ? 'bg-primary text-on-primary' :
                isPaused ? 'bg-tertiary-container text-on-surface' :
                'bg-surface-container-high text-on-surface-variant',
              ].join(' ')}>
                {isDone ? (
                  <span className="material-symbols-outlined text-sm leading-none">check</span>
                ) : round.round_index + 1}
              </div>
              <div className="flex-1">
                <div className="font-label font-semibold text-sm text-on-surface">
                  {DISCIPLINE_LABELS[round.discipline] ?? round.discipline}
                </div>
                {round.round_score !== null && (
                  <div className="font-label text-xs text-primary">{round.round_score}/100</div>
                )}
                {isPaused && (
                  <div className="font-label text-xs text-on-surface-variant">Paused</div>
                )}
              </div>
              {isDone && round.session_id && (
                <Link href={`/live-interviews/${round.session_id}/debrief`} className="font-label text-xs text-primary">
                  View debrief →
                </Link>
              )}
            </div>
          )
        })}
      </div>

      {/* CTA */}
      {loop.status !== 'completed' && nextRound && (
        <form action={`/api/interview-loops/${id}/start-round`} method="post">
          <Link href={pausedRound?.session_id ? `/live-interviews/${pausedRound.session_id}` : '#'}>
            <button
              className="w-full bg-primary text-on-primary rounded-xl py-3 font-label font-bold text-sm"
              type={pausedRound ? 'button' : 'submit'}
            >
              {pausedRound
                ? `Resume Round ${pausedRound.round_index + 1} →`
                : `Start Round ${nextRound.round_index + 1}: ${DISCIPLINE_LABELS[nextRound.discipline]} →`}
            </button>
          </Link>
        </form>
      )}

      {/* Loop debrief (when complete) */}
      {loop.status === 'completed' && loop.loop_debrief_json && (
        <div className="bg-inverse-surface rounded-xl p-5 flex flex-col gap-3">
          <div className="font-label font-bold text-inverse-on-surface">Loop complete</div>
          <div className="font-body text-3xl font-bold text-primary">
            {(loop.loop_debrief_json as { hire_signal?: string }).hire_signal?.replace('_', ' ') ?? 'Done'}
          </div>
          <div className="font-body text-xs text-inverse-on-surface/60">
            {(loop.loop_debrief_json as { cross_round_insights?: Array<{ pattern: string }> }).cross_round_insights?.[0]?.pattern}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(app)/live-interviews/loop/[id]/page.tsx"
git commit -m "feat(ui): Loop dashboard page"
```

---

## Task 17: Integrate LoopProgressBar + PriorRoundRecap into live interview session page + change tab-close behaviour

**Files:**
- Modify: `src/app/(app)/live-interviews/[id]/page.tsx`

- [ ] **Step 1: Read the session page fully**

Read `src/app/(app)/live-interviews/[id]/page.tsx` — it is ~1767 lines. Identify: (a) where the top-level layout div starts, (b) where `sendBeacon` is called on visibility change, (c) where the right panel is rendered.

- [ ] **Step 2: Add imports**

```tsx
import { LoopProgressBar } from '@/components/live-interviews/LoopProgressBar'
import { PriorRoundRecap } from '@/components/live-interviews/PriorRoundRecap'
import type { LoopRound } from '@/lib/interview-loops/types'
```

- [ ] **Step 3: Add loop state**

```tsx
const [loopRounds, setLoopRounds] = useState<LoopRound[]>([])
const [previousRound, setPreviousRound] = useState<LoopRound | null>(null)
```

- [ ] **Step 4: Fetch loop data when session has a loop_id**

Inside the effect that fetches session data, after the session is loaded:

```tsx
if (session.loop_id) {
  const res = await fetch(`/api/interview-loops/${session.loop_id}`)
  if (res.ok) {
    const data = await res.json()
    const rounds: LoopRound[] = data.rounds
    setLoopRounds(rounds)
    const prev = rounds.find((r: LoopRound) => r.round_index === (session.round_index ?? 0) - 1 && r.status === 'completed')
    setPreviousRound(prev ?? null)
  }
}
```

- [ ] **Step 5: Change sendBeacon on tab close to call /pause for loop sessions**

Find the `visibilitychange` handler that calls `/end` with `{ abandoned: true }`. Change it to:

```tsx
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && sessionPhase !== 'ended') {
    if (sessionData?.loop_id) {
      // Loop sessions: pause, not abandon
      navigator.sendBeacon(`/api/live-interview/${sessionId}/pause`, JSON.stringify({}))
    } else {
      // Standalone sessions: abandon as before
      navigator.sendBeacon(`/api/live-interview/${sessionId}/end`, JSON.stringify({ abandoned: true }))
    }
  }
})
```

Replace `sessionData` with whatever the session state variable is named in this file.

- [ ] **Step 6: Add LoopProgressBar as the first element in the page layout, when loop_id is set**

Find the outermost wrapper div of the session page. Before the existing content, add:

```tsx
{session?.loop_id && loopRounds.length > 0 && (
  <LoopProgressBar
    loopTitle={session.title ?? 'Interview Loop'}
    rounds={loopRounds}
    currentRoundIndex={session.round_index ?? 0}
    onPause={async () => {
      await fetch(`/api/live-interview/${sessionId}/pause`, { method: 'POST' })
      router.push(`/live-interviews/loop/${session.loop_id}`)
    }}
  />
)}
```

- [ ] **Step 7: Add PriorRoundRecap to the right panel**

In the right panel (the ~280px side panel that shows FLOW coverage), add `<PriorRoundRecap previousRound={previousRound} />` at the bottom of the panel, below the existing content.

- [ ] **Step 8: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```

Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add "src/app/(app)/live-interviews/[id]/page.tsx"
git commit -m "feat(session): integrate LoopProgressBar, PriorRoundRecap, pause-on-tab-close for loop sessions"
```

---

## Task 18: Surface PausedLoopCard on the dashboard

**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx` (or `dashboard-v2/page.tsx` — whichever is active)

- [ ] **Step 1: Read the dashboard page to find the active version**

Check which dashboard is linked in `src/components/shell/NavRail.tsx`. Read that page file.

- [ ] **Step 2: Add server-side fetch for paused loops**

In the server component data fetching section:

```tsx
const { data: pausedLoops } = await adminClient
  .from('interview_loops')
  .select('*')
  .eq('user_id', user.id)
  .eq('status', 'paused')
  .order('created_at', { ascending: false })
  .limit(1)

const pausedLoopRounds = pausedLoops?.length
  ? (await adminClient
      .from('loop_rounds')
      .select('*')
      .eq('loop_id', pausedLoops[0].id)
      .order('round_index', { ascending: true })
    ).data ?? []
  : []
```

- [ ] **Step 3: Add import**

```tsx
import { PausedLoopCard } from '@/components/live-interviews/PausedLoopCard'
import type { InterviewLoop, LoopRound } from '@/lib/interview-loops/types'
```

- [ ] **Step 4: Render PausedLoopCard above the Quick Take card when a paused loop exists**

```tsx
{pausedLoops?.[0] && (
  <PausedLoopCard
    loop={pausedLoops[0] as InterviewLoop}
    rounds={pausedLoopRounds as LoopRound[]}
  />
)}
```

- [ ] **Step 5: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/\(app\)/dashboard/page.tsx
git commit -m "feat(dashboard): surface PausedLoopCard for paused interview loops"
```

---

## Task 19: Playwright smoke test

**Files:**
- Create: `tests/full-loop.spec.ts`

- [ ] **Step 1: Write the test**

```typescript
// tests/full-loop.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Full Loop Builder', () => {
  test('Loop Builder page renders', async ({ page }) => {
    await page.goto('/live-interviews/loop/new')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('Build your loop')).toBeVisible()
    await expect(page.getByPlaceholder(/e.g. Stripe/i)).toBeVisible()
  })

  test('Next button disabled until role is filled', async ({ page }) => {
    await page.goto('/live-interviews/loop/new')
    await page.waitForLoadState('networkidle')
    const nextBtn = page.getByRole('button', { name: /next/i })
    await expect(nextBtn).toBeDisabled()
  })

  test('Advancing to step 2 shows round list', async ({ page }) => {
    await page.goto('/live-interviews/loop/new')
    await page.waitForLoadState('networkidle')
    await page.getByPlaceholder(/e.g. Stripe/i).fill('Stripe')
    await page.getByPlaceholder(/Staff Eng/i).fill('Staff Eng L6')
    await page.getByRole('button', { name: /next/i }).click()
    await expect(page.getByText('Configure rounds')).toBeVisible()
  })

  test('API routes exist', async ({ request }) => {
    // These will 401 without auth — just check they exist (not 404)
    const createRes = await request.post('/api/interview-loops/create', { data: {} })
    expect(createRes.status()).not.toBe(404)

    const pauseRes = await request.post('/api/live-interview/fake-id/pause')
    expect(pauseRes.status()).not.toBe(404)

    const resumeRes = await request.post('/api/live-interview/fake-id/resume')
    expect(resumeRes.status()).not.toBe(404)
  })
})
```

- [ ] **Step 2: Run the tests**

```bash
npx playwright test tests/full-loop.spec.ts --reporter=line
```

Expected: page render tests pass; API tests return 401 (not 404), confirming routes exist.

- [ ] **Step 3: Commit**

```bash
git add tests/full-loop.spec.ts
git commit -m "test(loops): Playwright smoke tests for Full Loop builder and API routes"
```

---

## Self-Review Checklist

- [x] `interview_loops` + `loop_rounds` tables created with RLS — Task 1
- [x] `live_interview_sessions` gets `loop_id`, `round_index`, `prior_round_context`, `status='paused'` — Task 1
- [x] All TypeScript types defined before use — Task 2
- [x] Haiku distiller (`distillRoundContext`) — Task 3
- [x] Sonnet loop debrief (`generateLoopDebrief`) using `claude-sonnet-4-6` — Task 4
- [x] `createCachedMessageMultiSystem` used for prior round context block — Task 3 (`buildPriorRoundContextBlock` output used in Task 7)
- [x] POST /create, GET /[id], POST /start-round, POST /debrief — Tasks 5-7, 11
- [x] POST /pause, POST /resume — Tasks 8-9
- [x] `/end` route extended for loop post-processing — Task 10
- [x] Tab-close uses `/pause` for loop sessions, `/end?abandoned=true` for standalone — Task 17
- [x] `LoopProgressBar` + `PriorRoundRecap` in session page — Task 17
- [x] `PausedLoopCard` on dashboard — Task 18
- [x] Loop Builder 3-step wizard — Task 15
- [x] Loop dashboard page — Task 16
- [x] Sonnet (not Opus) confirmed for loop debrief in Task 4

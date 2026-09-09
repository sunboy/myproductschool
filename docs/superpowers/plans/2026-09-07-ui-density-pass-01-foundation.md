# UI Density Pass 01: Foundation (flag, prefs, reading progress, shell-v2, primitives)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Read `2026-09-07-ui-density-pass-00-master.md` first for conventions.

**Goal:** Ship the shared substrate every route plan builds on: the `ui_density_v1` flag, `profiles.ui_prefs`, the `reading_progress` table and API, a new collapsible 200/56px sidebar and 48px top bar used by every signed-in route (including workspace and interview room), and the density primitive kit.

**Architecture:** `src/components/shell-v2/` holds the shell (context, sidebar, top bar, route classification). `src/components/density/` holds presentational primitives with no data fetching. `AppLayoutClient`, the `(workspace)` layout and the interview room page choose shell-v2 when the flag is on. Data changes are additive migrations plus two small API routes.

**Tech Stack:** Next.js 16, React 19, Tailwind v4 tokens, Supabase, zod 4, vitest, Playwright.

---

## File structure

Create:
- `supabase/migrations/20260908090000_ui_density_foundation.sql`
- `src/lib/shell/route-kind.ts` (+ `tests/lib/shell/route-kind.test.ts`)
- `src/lib/shell/search-scope.ts` (+ `tests/lib/shell/search-scope.test.ts`)
- `src/lib/shell/ui-prefs.ts` (types + zod + localStorage mirror helpers) (+ `tests/lib/shell/ui-prefs.test.ts`)
- `src/app/api/reading-progress/route.ts` (+ `tests/lib/reading/reading-progress-route.test.ts`)
- `src/lib/reading/progress-client.ts`
- `src/components/shell-v2/UiShellContext.tsx`
- `src/components/shell-v2/AppSidebarV2.tsx`
- `src/components/shell-v2/AppTopBarV2.tsx`
- `src/components/shell-v2/ShellV2.tsx`
- `src/components/shell-v2/RailAutoCollapse.tsx`
- `src/components/density/geo-art.ts` (+ `tests/components/geo-art.test.ts`)
- `src/components/density/GeoArt.tsx`
- `src/components/density/CoverCard.tsx`
- `src/components/density/HeaderBand.tsx`
- `src/components/density/HatchPickCard.tsx`
- `src/components/density/EditorialCard.tsx`
- `src/components/density/ReaderFrame.tsx`
- `src/components/density/RightToc.tsx`
- `src/components/density/useActiveHeading.ts`
- `e2e/density/helpers.ts`
- `e2e/density/shell.spec.ts`

Modify:
- `src/lib/config/app-flags.ts` (add `'ui_density_v1'` to `AppFlagKey`)
- `src/app/api/config/flags/route.ts` (return `ui_density_v1`)
- `src/app/api/profile/route.ts` (accept `ui_prefs`, return it)
- `src/context/SessionContext.tsx` (add `ui_prefs` to `SessionProfile`)
- `src/app/(app)/layout.tsx` (select `ui_prefs`, read flag, pass to client)
- `src/app/(app)/AppLayoutClient.tsx` (choose ShellV2 when flag on)
- `src/app/(workspace)/layout.tsx` (choose ShellV2 forced-rail when flag on)
- `src/app/(app)/live-interviews/[id]/page.tsx` (opt out of the app shell chrome when density on; see Task 12)
- `src/app/globals.css` (shell-v2 CSS variables)

---

### Task 1: Migration for `ui_density_v1`, `profiles.ui_prefs`, `reading_progress`

**Files:**
- Create: `supabase/migrations/20260908090000_ui_density_foundation.sql`

- [ ] **Step 1: Write the migration**

```sql
-- UI density pass foundation (spec: docs/superpowers/specs/2026-09-07-ui-density-pass-design.md)

-- 1. Runtime flag, default off. Flip per environment with:
--    update app_flags set value = 'true'::jsonb where key = 'ui_density_v1';
INSERT INTO app_flags (key, value) VALUES ('ui_density_v1', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 2. Per-user UI preferences (nav_collapsed, practice_view). Additive, nullable-safe.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ui_prefs JSONB NOT NULL DEFAULT '{}'::jsonb;
COMMENT ON COLUMN profiles.ui_prefs IS 'UI preferences: {"nav_collapsed": bool, "practice_view": "list"|"cards"}. Written via PATCH /api/profile.';

-- 3. Reading progress for module chapters and autopsy stories.
CREATE TABLE IF NOT EXISTS reading_progress (
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT        NOT NULL CHECK (content_type IN ('module_chapter', 'autopsy_story')),
  content_id   TEXT        NOT NULL,
  parent_id    TEXT        NOT NULL,
  progress     NUMERIC(4,3) NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 1),
  last_heading TEXT,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, content_type, content_id)
);
CREATE INDEX IF NOT EXISTS idx_reading_progress_user_updated ON reading_progress (user_id, updated_at DESC);

ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "reading_progress_own" ON reading_progress FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TABLE reading_progress IS 'Last known reading position per user per chapter/story. content_id = chapter slug or story slug; parent_id = module slug or company slug.';
```

- [ ] **Step 2: Apply to the shared dev DB**

Run: `cd /Users/sandeep/Projects/myproductschool && npx supabase db push --include-all 2>&1 | tail -5` (or apply via the Supabase MCP `apply_migration` with the same SQL). Expected: migration applied, no errors.

Verify: `curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/reading_progress?limit=1" -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"` → `[]`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260908090000_ui_density_foundation.sql
git commit -m "feat(density): flag, profiles.ui_prefs and reading_progress table"
```

---

### Task 2: Flag plumbing and `ui_prefs` on the profile API

**Files:**
- Modify: `src/lib/config/app-flags.ts:9`
- Modify: `src/app/api/config/flags/route.ts`
- Create: `src/lib/shell/ui-prefs.ts`
- Test: `tests/lib/shell/ui-prefs.test.ts`
- Modify: `src/app/api/profile/route.ts:11-22` (schema), `:67` (select), `:119-141` (PATCH)
- Modify: `src/context/SessionContext.tsx:16-38`

- [ ] **Step 1: Write the failing test for the prefs helper**

```ts
// tests/lib/shell/ui-prefs.test.ts
import { describe, it, expect } from 'vitest'
import { UiPrefsSchema, mergeUiPrefs, readLocalUiPrefs, writeLocalUiPrefs, UI_PREFS_STORAGE_KEY } from '@/lib/shell/ui-prefs'

describe('ui-prefs', () => {
  it('accepts partial prefs and rejects unknown view values', () => {
    expect(UiPrefsSchema.parse({ nav_collapsed: true })).toEqual({ nav_collapsed: true })
    expect(UiPrefsSchema.parse({ practice_view: 'cards' })).toEqual({ practice_view: 'cards' })
    expect(() => UiPrefsSchema.parse({ practice_view: 'grid' })).toThrow()
  })
  it('merges without dropping existing keys', () => {
    expect(mergeUiPrefs({ nav_collapsed: true }, { practice_view: 'list' })).toEqual({ nav_collapsed: true, practice_view: 'list' })
  })
  it('mirrors to localStorage', () => {
    const store: Record<string, string> = {}
    const ls = { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => { store[k] = v } } as unknown as Storage
    writeLocalUiPrefs({ nav_collapsed: true }, ls)
    expect(store[UI_PREFS_STORAGE_KEY]).toBe('{"nav_collapsed":true}')
    expect(readLocalUiPrefs(ls)).toEqual({ nav_collapsed: true })
  })
})
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run tests/lib/shell/ui-prefs.test.ts`
Expected: FAIL, cannot resolve `@/lib/shell/ui-prefs`.

- [ ] **Step 3: Implement the helper**

```ts
// src/lib/shell/ui-prefs.ts
import { z } from 'zod'

export const UiPrefsSchema = z.object({
  nav_collapsed: z.boolean().optional(),
  practice_view: z.enum(['list', 'cards']).optional(),
}).strict()

export type UiPrefs = z.infer<typeof UiPrefsSchema>

export const UI_PREFS_STORAGE_KEY = 'hp:ui-prefs'

export function mergeUiPrefs(current: UiPrefs | null | undefined, patch: UiPrefs): UiPrefs {
  return { ...(current ?? {}), ...patch }
}

export function readLocalUiPrefs(storage: Storage | undefined = typeof window !== 'undefined' ? window.localStorage : undefined): UiPrefs {
  if (!storage) return {}
  try {
    const raw = storage.getItem(UI_PREFS_STORAGE_KEY)
    if (!raw) return {}
    const parsed = UiPrefsSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : {}
  } catch {
    return {}
  }
}

export function writeLocalUiPrefs(prefs: UiPrefs, storage: Storage | undefined = typeof window !== 'undefined' ? window.localStorage : undefined) {
  if (!storage) return
  try { storage.setItem(UI_PREFS_STORAGE_KEY, JSON.stringify(prefs)) } catch { /* quota or private mode: ignore */ }
}

/** Persist a prefs patch: local mirror first (instant), then the server. Returns the merged prefs. */
export async function persistUiPrefs(current: UiPrefs | null | undefined, patch: UiPrefs): Promise<UiPrefs> {
  const merged = mergeUiPrefs(current, patch)
  writeLocalUiPrefs(merged)
  try {
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ui_prefs: patch }),
    })
  } catch { /* offline: local mirror still applied */ }
  return merged
}
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run tests/lib/shell/ui-prefs.test.ts` → PASS (3 tests).

- [ ] **Step 5: Add the flag key and expose it**

In `src/lib/config/app-flags.ts` change line 9 to:

```ts
export type AppFlagKey = 'onboarding_value_first' | 'lab_debugging' | 'ui_density_v1'
```

Replace the body of `src/app/api/config/flags/route.ts` `GET` with:

```ts
export async function GET() {
  const [onboardingValueFirst, uiDensity] = await Promise.all([
    getAppFlag('onboarding_value_first', false),
    getAppFlag('ui_density_v1', false),
  ])
  return NextResponse.json(
    { onboarding_value_first: onboardingValueFirst, ui_density_v1: uiDensity },
    { headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=300' } }
  )
}
```

- [ ] **Step 6: Accept `ui_prefs` in `PATCH /api/profile` and return it from `GET`**

In `src/app/api/profile/route.ts`:

1. Add import: `import { UiPrefsSchema, mergeUiPrefs } from '@/lib/shell/ui-prefs'`.
2. Extend `RequestSchema` (L11-22) by adding a field before the `superRefine`:

```ts
  ui_prefs: UiPrefsSchema.optional(),
```

and update the `superRefine` so a body containing only `ui_prefs` is valid (the refine currently rejects when neither `display_name` nor `avatar_url` is present; change the condition to `if (v.display_name === undefined && v.avatar_url === undefined && v.ui_prefs === undefined)`).

3. Add `ui_prefs` to the GET select string on L67 (append `, ui_prefs`).

4. In `PATCH` (L119-141), before the `update`, merge prefs server-side so a partial patch never wipes other keys:

```ts
  let updates: Record<string, unknown> = { ...parsed }
  if (parsed.ui_prefs) {
    const { data: existing } = await adminClient.from('profiles').select('ui_prefs').eq('id', user.id).maybeSingle()
    updates = { ...updates, ui_prefs: mergeUiPrefs((existing?.ui_prefs as Record<string, unknown> | null) ?? {}, parsed.ui_prefs) }
  }
```

(`parsed` is the zod result the route already computes; keep the existing 400 handling.)

- [ ] **Step 7: Add `ui_prefs` to `SessionProfile`**

In `src/context/SessionContext.tsx` add to the interface (after `has_seen_hatch_intro`):

```ts
  ui_prefs?: { nav_collapsed?: boolean; practice_view?: 'list' | 'cards' } | null
```

- [ ] **Step 8: Typecheck and commit**

Run: `npx tsc --noEmit 2>&1 | grep -v supabase/functions | head` → no new errors.

```bash
git add src/lib/config/app-flags.ts src/app/api/config/flags/route.ts src/lib/shell/ui-prefs.ts tests/lib/shell/ui-prefs.test.ts src/app/api/profile/route.ts src/context/SessionContext.tsx
git commit -m "feat(density): ui_density_v1 flag and ui_prefs on profile API"
```

---

### Task 3: Reading progress API and client

**Files:**
- Create: `src/app/api/reading-progress/route.ts`
- Create: `src/lib/reading/progress-client.ts`
- Test: `tests/lib/reading/progress-client.test.ts`

- [ ] **Step 1: Write the failing test for the client debounce/shape**

```ts
// tests/lib/reading/progress-client.test.ts
import { describe, it, expect, vi } from 'vitest'
import { createProgressReporter, readingProgressKey } from '@/lib/reading/progress-client'

describe('progress-client', () => {
  it('builds a stable local key', () => {
    expect(readingProgressKey('module_chapter', 'context-engineering', 'context-poisoning')).toBe('hp:reading:module_chapter:context-engineering/context-poisoning')
  })
  it('debounces PUTs and keeps the latest value', async () => {
    vi.useFakeTimers()
    const calls: unknown[] = []
    const fetcher = vi.fn(async (_url: string, init?: RequestInit) => { calls.push(JSON.parse(String(init?.body))); return new Response('{}', { status: 200 }) })
    const report = createProgressReporter({ contentType: 'autopsy_story', parentId: 'buffer', contentId: 'buffer-fake-landing-page-mvp', fetcher, delayMs: 500 })
    report(0.1, 'beat-1'); report(0.4, 'beat-2')
    await vi.advanceTimersByTimeAsync(600)
    expect(calls).toEqual([{ content_type: 'autopsy_story', parent_id: 'buffer', content_id: 'buffer-fake-landing-page-mvp', progress: 0.4, last_heading: 'beat-2' }])
    vi.useRealTimers()
  })
})
```

- [ ] **Step 2: Run to fail**

Run: `npx vitest run tests/lib/reading/progress-client.test.ts` → FAIL (module missing).

- [ ] **Step 3: Implement the client**

```ts
// src/lib/reading/progress-client.ts
export type ReadingContentType = 'module_chapter' | 'autopsy_story'

export interface ReadingProgressRow {
  content_type: ReadingContentType
  parent_id: string
  content_id: string
  progress: number
  last_heading: string | null
  updated_at?: string
}

export function readingProgressKey(type: ReadingContentType, parentId: string, contentId: string) {
  return `hp:reading:${type}:${parentId}/${contentId}`
}

export function readLocalProgress(type: ReadingContentType, parentId: string, contentId: string): { progress: number; last_heading: string | null } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(readingProgressKey(type, parentId, contentId))
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function createProgressReporter(opts: {
  contentType: ReadingContentType
  parentId: string
  contentId: string
  fetcher?: typeof fetch
  delayMs?: number
}) {
  const fetcher = opts.fetcher ?? fetch
  const delay = opts.delayMs ?? 1500
  let timer: ReturnType<typeof setTimeout> | null = null
  let latest: { progress: number; last_heading: string | null } | null = null
  const flush = async () => {
    timer = null
    if (!latest) return
    const body: ReadingProgressRow = { content_type: opts.contentType, parent_id: opts.parentId, content_id: opts.contentId, progress: latest.progress, last_heading: latest.last_heading }
    try { await fetcher('/api/reading-progress', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) } catch { /* ignore */ }
  }
  return (progress: number, lastHeading: string | null) => {
    const clamped = Math.max(0, Math.min(1, Number(progress.toFixed(3))))
    latest = { progress: clamped, last_heading: lastHeading }
    if (typeof window !== 'undefined') {
      try { window.localStorage.setItem(readingProgressKey(opts.contentType, opts.parentId, opts.contentId), JSON.stringify(latest)) } catch { /* ignore */ }
    }
    if (timer) clearTimeout(timer)
    timer = setTimeout(flush, delay)
  }
}

export async function fetchRecentReading(limit = 6): Promise<ReadingProgressRow[]> {
  const res = await fetch(`/api/reading-progress?limit=${limit}`, { cache: 'no-store' })
  if (!res.ok) return []
  const body = await res.json() as { rows?: ReadingProgressRow[] }
  return body.rows ?? []
}
```

- [ ] **Step 4: Run test** → PASS.

- [ ] **Step 5: Implement the API route**

```ts
// src/app/api/reading-progress/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const PutSchema = z.object({
  content_type: z.enum(['module_chapter', 'autopsy_story']),
  parent_id: z.string().min(1).max(200),
  content_id: z.string().min(1).max(200),
  progress: z.number().min(0).max(1),
  last_heading: z.string().max(300).nullable().optional(),
})

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const limit = Math.min(20, Math.max(1, Number(new URL(request.url).searchParams.get('limit') ?? 6)))
  const { data, error } = await supabase
    .from('reading_progress')
    .select('content_type, parent_id, content_id, progress, last_heading, updated_at')
    .eq('user_id', user.id)
    .gt('progress', 0)
    .lt('progress', 0.98)
    .order('updated_at', { ascending: false })
    .limit(limit)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ rows: data ?? [] }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const parsed = PutSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body', issues: parsed.error.issues }, { status: 400 })
  const row = { user_id: user.id, ...parsed.data, last_heading: parsed.data.last_heading ?? null, updated_at: new Date().toISOString() }
  const { error } = await supabase.from('reading_progress').upsert(row, { onConflict: 'user_id,content_type,content_id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 6: Smoke test the route against the running dev server**

Run (dev server on 3000, Pro test user):
```bash
COOKIE=$(curl -s -c - -X POST http://localhost:3000/api/auth/login -H 'Content-Type: application/json' -d '{"email":"sandeeptnvs@gmail.com","password":"Sandeep#89"}' -o /dev/null | awk '/sb-/{print $6"="$7}' | paste -sd';' -)
curl -s -X PUT http://localhost:3000/api/reading-progress -H "Cookie: $COOKIE" -H 'Content-Type: application/json' -d '{"content_type":"autopsy_story","parent_id":"buffer","content_id":"buffer-fake-landing-page-mvp","progress":0.25,"last_heading":"beat-1"}'
curl -s "http://localhost:3000/api/reading-progress?limit=3" -H "Cookie: $COOKIE"
```
Expected: `{"ok":true}` then a `rows` array containing the row.

- [ ] **Step 7: Commit**

```bash
git add src/app/api/reading-progress/route.ts src/lib/reading/progress-client.ts tests/lib/reading/progress-client.test.ts
git commit -m "feat(density): reading_progress API and client reporter"
```

---

### Task 4: Route kinds and search scopes

**Files:**
- Create: `src/lib/shell/route-kind.ts`, `src/lib/shell/search-scope.ts`
- Test: `tests/lib/shell/route-kind.test.ts`, `tests/lib/shell/search-scope.test.ts`

- [ ] **Step 1: Failing tests**

```ts
// tests/lib/shell/route-kind.test.ts
import { describe, it, expect } from 'vitest'
import { routeKind, forcedRail, activeNavKey } from '@/lib/shell/route-kind'

describe('route-kind', () => {
  it('classifies routes', () => {
    expect(routeKind('/dashboard')).toBe('hub')
    expect(routeKind('/explore')).toBe('hub')
    expect(routeKind('/explore/modules/context-engineering')).toBe('reader')
    expect(routeKind('/explore/autopsies/buffer/stories/x')).toBe('reader')
    expect(routeKind('/explore/autopsies/buffer')).toBe('hub')
    expect(routeKind('/workspace/challenges/abc')).toBe('workspace')
    expect(routeKind('/live-interviews/123e4567-e89b-12d3-a456-426614174000')).toBe('interview-room')
    expect(routeKind('/live-interviews')).toBe('hub')
    expect(routeKind('/live-interviews/loop/new')).toBe('hub')
    expect(routeKind('/settings')).toBe('hub')
  })
  it('forces the rail on readers and workspaces', () => {
    expect(forcedRail('/dashboard')).toBe(false)
    expect(forcedRail('/explore/modules/x')).toBe(true)
    expect(forcedRail('/workspace/challenges/x')).toBe(true)
    expect(forcedRail('/live-interviews/123e4567-e89b-12d3-a456-426614174000')).toBe(true)
  })
  it('maps to nav keys', () => {
    expect(activeNavKey('/')).toBe('home')
    expect(activeNavKey('/dashboard/x')).toBe('home')
    expect(activeNavKey('/challenges')).toBe('practice')
    expect(activeNavKey('/workspace/challenges/x')).toBe('practice')
    expect(activeNavKey('/live-interviews')).toBe('practice')
    expect(activeNavKey('/explore/modules/x')).toBe('library')
    expect(activeNavKey('/progress/skill-ladder')).toBe('progress')
    expect(activeNavKey('/settings')).toBe(null)
  })
})
```

```ts
// tests/lib/shell/search-scope.test.ts
import { describe, it, expect } from 'vitest'
import { searchScopeFor } from '@/lib/shell/search-scope'

describe('search-scope', () => {
  it('scopes the top-bar search per route', () => {
    expect(searchScopeFor('/challenges', 1470)).toEqual({ placeholder: 'Search 1470 challenges by title, company, technique', buildHref: expect.any(Function) })
    expect(searchScopeFor('/challenges').buildHref('two sum')).toBe('/challenges?q=two%20sum')
    expect(searchScopeFor('/explore').placeholder).toBe('Search guides, companies, or skills')
    expect(searchScopeFor('/explore').buildHref('gmail')).toBe('/explore?q=gmail')
    expect(searchScopeFor('/dashboard').buildHref('sql')).toBe('/challenges?q=sql')
    expect(searchScopeFor('/live-interviews').buildHref('stripe')).toBe('/live-interviews?q=stripe')
  })
})
```

- [ ] **Step 2: Run to fail** (`npx vitest run tests/lib/shell`) → FAIL.

- [ ] **Step 3: Implement**

```ts
// src/lib/shell/route-kind.ts
export type RouteKind = 'hub' | 'reader' | 'workspace' | 'interview-room'
export type NavKey = 'home' | 'practice' | 'library' | 'progress'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function routeKind(pathname: string): RouteKind {
  if (pathname.startsWith('/workspace/')) return 'workspace'
  if (/^\/explore\/modules\/[^/]+/.test(pathname)) return 'reader'
  if (/^\/explore\/autopsies\/[^/]+\/stories\/[^/]+/.test(pathname)) return 'reader'
  const live = pathname.match(/^\/live-interviews\/([^/]+)(\/.*)?$/)
  if (live && UUID.test(live[1]) && !(live[2] ?? '').startsWith('/debrief')) return 'interview-room'
  return 'hub'
}

export function forcedRail(pathname: string): boolean {
  return routeKind(pathname) !== 'hub'
}

export function activeNavKey(pathname: string): NavKey | null {
  if (pathname === '/' || pathname.startsWith('/dashboard')) return 'home'
  if (pathname.startsWith('/challenges') || pathname.startsWith('/workspace') || pathname.startsWith('/live-interviews')) return 'practice'
  if (pathname.startsWith('/explore')) return 'library'
  if (pathname.startsWith('/progress')) return 'progress'
  return null
}
```

```ts
// src/lib/shell/search-scope.ts
export interface SearchScope {
  placeholder: string
  buildHref: (q: string) => string
}

export function searchScopeFor(pathname: string, total?: number): SearchScope {
  const enc = (q: string) => encodeURIComponent(q.trim())
  if (pathname.startsWith('/explore')) {
    return { placeholder: 'Search guides, companies, or skills', buildHref: q => (q.trim() ? `/explore?q=${enc(q)}` : '/explore') }
  }
  if (pathname.startsWith('/live-interviews')) {
    return { placeholder: 'Search companies or roles', buildHref: q => (q.trim() ? `/live-interviews?q=${enc(q)}` : '/live-interviews') }
  }
  const count = total ? `${total} challenges` : 'challenges'
  return { placeholder: `Search ${count} by title, company, technique`, buildHref: q => (q.trim() ? `/challenges?q=${enc(q)}` : '/challenges') }
}
```

- [ ] **Step 4: Run tests** → PASS. Commit:

```bash
git add src/lib/shell tests/lib/shell
git commit -m "feat(density): route kinds and route-scoped search helpers"
```

---

### Task 5: `UiShellContext`

**Files:**
- Create: `src/components/shell-v2/UiShellContext.tsx`

- [ ] **Step 1: Implement the context**

```tsx
// src/components/shell-v2/UiShellContext.tsx
'use client'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { forcedRail } from '@/lib/shell/route-kind'
import { persistUiPrefs, readLocalUiPrefs, type UiPrefs } from '@/lib/shell/ui-prefs'

interface UiShellValue {
  density: boolean
  /** User preference (persisted). */
  navCollapsedPref: boolean
  /** Effective state: forced rail on reader/workspace routes, else preference. */
  railCollapsed: boolean
  forced: boolean
  setNavCollapsed: (collapsed: boolean) => void
  practiceView: 'list' | 'cards'
  setPracticeView: (v: 'list' | 'cards') => void
}

const Ctx = createContext<UiShellValue>({
  density: false, navCollapsedPref: false, railCollapsed: false, forced: false,
  setNavCollapsed: () => {}, practiceView: 'list', setPracticeView: () => {},
})

export function UiShellProvider({ density, initialPrefs, children }: { density: boolean; initialPrefs?: UiPrefs | null; children: ReactNode }) {
  const pathname = usePathname() ?? '/'
  const [prefs, setPrefs] = useState<UiPrefs>(() => ({ ...(initialPrefs ?? {}) }))

  // Hydrate from the local mirror once so the very first paint after navigation matches.
  useEffect(() => { setPrefs(p => ({ ...readLocalUiPrefs(), ...p })) }, [])

  const forced = forcedRail(pathname)
  const setNavCollapsed = useCallback((collapsed: boolean) => {
    setPrefs(p => ({ ...p, nav_collapsed: collapsed }))
    void persistUiPrefs(prefs, { nav_collapsed: collapsed })
  }, [prefs])
  const setPracticeView = useCallback((v: 'list' | 'cards') => {
    setPrefs(p => ({ ...p, practice_view: v }))
    void persistUiPrefs(prefs, { practice_view: v })
  }, [prefs])

  const value = useMemo<UiShellValue>(() => ({
    density,
    navCollapsedPref: !!prefs.nav_collapsed,
    railCollapsed: forced || !!prefs.nav_collapsed,
    forced,
    setNavCollapsed,
    practiceView: prefs.practice_view ?? 'list',
    setPracticeView,
  }), [density, prefs, forced, setNavCollapsed, setPracticeView])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useUiShell() { return useContext(Ctx) }
```

- [ ] **Step 2: Typecheck** (`npx tsc --noEmit`) and commit:

```bash
git add src/components/shell-v2/UiShellContext.tsx
git commit -m "feat(density): UiShellContext with persisted nav/practice prefs"
```

---

### Task 6: `AppSidebarV2` (200px labelled, 56px rail)

**Files:**
- Create: `src/components/shell-v2/AppSidebarV2.tsx`
- Modify: `src/app/globals.css` (append CSS variables)

Behaviour: same four `MAIN_NAV_ENTRIES` as `src/components/redesign/AppSidebar.tsx:33-38` (import them; export the array from that file if it is not exported yet by adding `export` in front of `const MAIN_NAV_ENTRIES`). Same `data-hatch-target` anchors. Bottom: Hatch line (one line in expanded mode, avatar-only in rail), Go Pro card only when expanded and free, footer buttons "Send feedback" and "Help & Support" (icons only in rail with `AppTooltip`), then the collapse control.

- [ ] **Step 1: Append shell variables to `src/app/globals.css`** (at the end of the file):

```css
/* shell-v2 (ui_density_v1) */
:root {
  --shell-nav-w: 200px;
  --shell-rail-w: 56px;
  --shell-top-h: 48px;
}
```

- [ ] **Step 2: Implement the sidebar**

```tsx
// src/components/shell-v2/AppSidebarV2.tsx
'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PanelLeftClose, PanelLeftOpen, MessageSquare, LifeBuoy } from 'lucide-react'
import { MAIN_NAV_ENTRIES } from '@/components/redesign/AppSidebar'
import { HackProductWordmark } from '@/components/redesign/HackProductWordmark'
import { HatchImage } from '@/components/redesign/HatchImage'
import { AppTooltip } from '@/components/ui/AppTooltip'
import { useSession } from '@/context/SessionContext'
import { openFeedbackModal } from '@/components/feedback/FeedbackWidget'
import { useUiShell } from './UiShellContext'
import type { NavKey } from '@/lib/shell/route-kind'

export function AppSidebarV2({ active }: { active: NavKey | null }) {
  const router = useRouter()
  const { profile } = useSession()
  const { railCollapsed, forced, setNavCollapsed } = useUiShell()
  const collapsed = railCollapsed
  const isPro = profile?.plan === 'pro'
  const streak = profile?.streak_days ?? 0
  const coachLine = streak > 0 ? `${streak}-day streak` : 'New here'

  return (
    <aside
      data-testid="shell-sidebar"
      data-collapsed={collapsed ? 'true' : 'false'}
      className="flex h-full shrink-0 flex-col border-r border-hairline bg-surface-container-low"
      style={{ width: collapsed ? 'var(--shell-rail-w)' : 'var(--shell-nav-w)', padding: collapsed ? '12px 8px' : '12px 10px', transition: 'width 160ms ease' }}
    >
      <Link href="/dashboard" aria-label="HackProduct home" className="mb-3 flex items-center px-2">
        {collapsed ? <span className="font-headline text-[15px] font-bold text-primary">H</span> : <HackProductWordmark className="h-6 w-[140px]" />}
      </Link>

      <nav aria-label="Primary" className="flex flex-col gap-1">
        {MAIN_NAV_ENTRIES.map(entry => {
          const Icon = entry.icon
          const isActive = entry.key === active
          const item = (
            <Link
              key={entry.key}
              href={entry.href}
              aria-current={isActive ? 'page' : undefined}
              data-hatch-target={entry.key === 'home' ? 'nav-dashboard' : `nav-${entry.key}`}
              className={`flex min-h-10 items-center gap-2.5 rounded-lg text-[13px] font-semibold ${collapsed ? 'justify-center px-0' : 'px-2.5'} ${isActive ? 'bg-forest-800 text-white' : 'text-ink-secondary hover:bg-surface-container'}`}
            >
              <Icon size={18} aria-hidden />
              {!collapsed && <span>{entry.label}</span>}
            </Link>
          )
          return collapsed ? <AppTooltip key={entry.key} label={entry.label} side="right">{item}</AppTooltip> : item
        })}
      </nav>

      <div className="flex-1" />

      <div className={`mb-2 flex items-center gap-2 rounded-lg border border-hairline bg-card-bright ${collapsed ? 'justify-center p-1.5' : 'px-2.5 py-2'}`}>
        <HatchImage state="avatar" size={26} />
        {!collapsed && <span className="text-[11px] text-ink-secondary">{coachLine}</span>}
      </div>

      {!collapsed && !isPro && (
        <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('open-upgrade-modal'))} className="mb-2 rounded-lg bg-gold px-3 py-2 text-[12px] font-bold text-ink-strong">
          Upgrade to Pro
        </button>
      )}

      <div className={`flex ${collapsed ? 'flex-col items-center' : 'flex-col'} gap-0.5 border-t border-hairline pt-2 text-[12px] text-ink-secondary`}>
        <AppTooltip label="Send feedback" side="right" disabled={!collapsed}>
          <button type="button" onClick={() => openFeedbackModal()} className={`flex items-center gap-2 rounded-md py-1.5 ${collapsed ? 'px-2' : 'px-2'}`}>
            <MessageSquare size={16} aria-hidden />{!collapsed && 'Send feedback'}
          </button>
        </AppTooltip>
        <AppTooltip label="Help & Support" side="right" disabled={!collapsed}>
          <button type="button" onClick={() => router.push('/help')} className="flex items-center gap-2 rounded-md px-2 py-1.5">
            <LifeBuoy size={16} aria-hidden />{!collapsed && 'Help & Support'}
          </button>
        </AppTooltip>
        <AppTooltip label={forced ? 'Nav collapses here' : collapsed ? 'Expand nav' : 'Collapse nav'} side="right">
          <button
            type="button"
            data-testid="shell-nav-toggle"
            disabled={forced}
            aria-pressed={collapsed}
            onClick={() => setNavCollapsed(!collapsed)}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 disabled:opacity-50"
          >
            {collapsed ? <PanelLeftOpen size={16} aria-hidden /> : <PanelLeftClose size={16} aria-hidden />}
            {!collapsed && (forced ? 'Reading mode' : 'Collapse')}
          </button>
        </AppTooltip>
      </div>
    </aside>
  )
}
```

Check `HackProductWordmark` and `openFeedbackModal` import paths against `src/components/redesign/AppSidebar.tsx` and `AppSidebarConnected.tsx` (they import the same symbols); if `openFeedbackModal` is exported elsewhere, use that path.

- [ ] **Step 3: Export `MAIN_NAV_ENTRIES`** from `src/components/redesign/AppSidebar.tsx` (prefix line 33 with `export`). Typecheck and commit:

```bash
git add src/components/shell-v2/AppSidebarV2.tsx src/components/redesign/AppSidebar.tsx src/app/globals.css
git commit -m "feat(density): AppSidebarV2 with collapsible rail"
```

**Wiring table:** Home/Practice/Library/Progress → `href`; Upgrade → `open-upgrade-modal`; Send feedback → `openFeedbackModal()`; Help → `/help`; Collapse → `setNavCollapsed` (persists via `PATCH /api/profile`).

---

### Task 7: `AppTopBarV2` (48px, route-scoped search)

**Files:**
- Create: `src/components/shell-v2/AppTopBarV2.tsx`

Reuse `AvatarMenu` from `src/components/redesign/AppTopShell.tsx` (export it: add `export` to `function AvatarMenu` on L97 if not exported). Reuse `useHatchSonics` for mute, `SpendIndicator`, `TrialBanner`, `DunningBanner` exactly as `AppTopShell` does (copy the trial/dunning derivation from L84-95).

- [ ] **Step 1: Implement**

```tsx
// src/components/shell-v2/AppTopBarV2.tsx
'use client'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Search, Volume2, VolumeX, Compass, Bell } from 'lucide-react'
import { AvatarMenu } from '@/components/redesign/AppTopShell'
import { useHatchSonics } from '@/context/HatchContext'
import { useSession } from '@/context/SessionContext'
import { searchScopeFor } from '@/lib/shell/search-scope'

export function AppTopBarV2({ searchTotal, leftSlot, rightSlot }: { searchTotal?: number; leftSlot?: ReactNode; rightSlot?: ReactNode }) {
  const pathname = usePathname() ?? '/'
  const router = useRouter()
  const { profile } = useSession()
  const { muted, toggleMuted } = useHatchSonics()
  const scope = searchScopeFor(pathname, searchTotal)
  const [q, setQ] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const isPro = profile?.plan === 'pro'

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); inputRef.current?.focus() } }
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <header data-testid="shell-topbar" data-topnav className="flex shrink-0 items-center gap-3 border-b border-hairline bg-background px-4" style={{ height: 'var(--shell-top-h)' }}>
      {leftSlot ?? (
        <form role="search" onSubmit={e => { e.preventDefault(); router.push(scope.buildHref(q)) }} className="flex h-8 w-full max-w-[360px] items-center gap-2 rounded-full border border-hairline bg-card-bright px-3 text-[13px] text-ink-secondary">
          <Search size={14} aria-hidden />
          <input ref={inputRef} data-testid="shell-search" value={q} onChange={e => setQ(e.target.value)} placeholder={scope.placeholder} aria-label={scope.placeholder} className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-ink-muted" />
          <kbd className="rounded bg-surface-container px-1 text-[10px]">⌘K</kbd>
        </form>
      )}
      <div className="flex-1" />
      {rightSlot}
      {!isPro && <span className="hidden lg:block"><SpendIndicatorSlot /></span>}
      <button type="button" aria-label={muted ? 'Unmute Hatch' : 'Mute Hatch'} aria-pressed={muted} onClick={toggleMuted} className="grid size-8 place-items-center rounded-full border border-hairline bg-card-bright">
        {muted ? <VolumeX size={15} aria-hidden /> : <Volume2 size={15} aria-hidden />}
      </button>
      <button type="button" aria-label="Take the tour" onClick={() => window.dispatchEvent(new Event('start-intro-tour'))} className="grid size-8 place-items-center rounded-full border border-hairline bg-card-bright">
        <Compass size={15} aria-hidden />
      </button>
      <button type="button" aria-label="Notifications" onClick={() => router.push('/settings/notifications')} className="grid size-8 place-items-center rounded-full border border-hairline bg-card-bright">
        <Bell size={15} aria-hidden />
      </button>
      <AvatarMenu />
    </header>
  )
}

function SpendIndicatorSlot() {
  // Lazy import keeps the bar light on Pro accounts; SpendIndicator is the same component AppTopShell uses.
  const SpendIndicator = require('@/components/redesign/SpendIndicator').SpendIndicator as () => JSX.Element
  return <SpendIndicator />
}
```

Adjust the `SpendIndicator` import to a normal static import if `require` upsets the lint config; the path is the one `AppTopShell.tsx` uses. The bell now navigates to `/settings/notifications` (the only existing notifications surface), fixing the inert bell noted in the code map. `useHatchSonics` lives where `AppTopShell.tsx` imports it from (verify the path at `AppTopShell.tsx` L1-15 and mirror it).

- [ ] **Step 2: Export `AvatarMenu`** from `AppTopShell.tsx` and typecheck. Commit:

```bash
git add src/components/shell-v2/AppTopBarV2.tsx src/components/redesign/AppTopShell.tsx
git commit -m "feat(density): AppTopBarV2 with route-scoped search"
```

**Wiring table:** search submit → `scope.buildHref(q)` (`/challenges?q=`, `/explore?q=`, `/live-interviews?q=`); mute → `toggleMuted`; tour → `start-intro-tour`; bell → `/settings/notifications`; avatar → existing `AvatarMenu` items.

---

### Task 8: `ShellV2` composition, `RailAutoCollapse`, and wiring into `AppLayoutClient`

**Files:**
- Create: `src/components/shell-v2/ShellV2.tsx`, `src/components/shell-v2/RailAutoCollapse.tsx`
- Modify: `src/app/(app)/layout.tsx:22-56`, `src/app/(app)/AppLayoutClient.tsx`

- [ ] **Step 1: `ShellV2`**

```tsx
// src/components/shell-v2/ShellV2.tsx
'use client'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { activeNavKey, routeKind } from '@/lib/shell/route-kind'
import { AppSidebarV2 } from './AppSidebarV2'
import { AppTopBarV2 } from './AppTopBarV2'
import { BottomTabs } from '@/components/shell/BottomTabs'

export function ShellV2({ children, topLeft, topRight, hideTopBar = false, fullBleed = false }: {
  children: ReactNode
  topLeft?: ReactNode
  topRight?: ReactNode
  hideTopBar?: boolean
  fullBleed?: boolean
}) {
  const pathname = usePathname() ?? '/'
  const kind = routeKind(pathname)
  return (
    <div className="hp-learning-shell min-h-screen bg-background" data-shell="v2" data-route-kind={kind}>
      <div className="flex min-h-screen w-full">
        <div className="sticky top-0 hidden h-screen shrink-0 lg:block"><AppSidebarV2 active={activeNavKey(pathname)} /></div>
        <div className="flex min-w-0 flex-1 flex-col">
          {!hideTopBar && <AppTopBarV2 leftSlot={topLeft} rightSlot={topRight} />}
          <main className={fullBleed ? 'min-w-0 flex-1' : 'min-w-0 flex-1 pb-20 lg:pb-6'}>{children}</main>
        </div>
      </div>
      {kind === 'hub' && <BottomTabs />}
    </div>
  )
}
```

- [ ] **Step 2: Server layout reads the flag and `ui_prefs`**

In `src/app/(app)/layout.tsx`: add `import { getAppFlag } from '@/lib/config/app-flags'`; extend the profile select (L24) with `, ui_prefs`; add `const uiDensity = await getAppFlag('ui_density_v1', false)` inside the `Promise.all` or right after; pass `uiDensity={uiDensity}` and `initialPrefs={profile?.ui_prefs ?? null}` to `<AppLayoutClient>`.

- [ ] **Step 3: `AppLayoutClient` chooses the shell**

Change the signature to `{ children, initialProfile, uiDensity, initialPrefs }` and wrap the tree:

```tsx
<HatchProvider>
  <SessionProvider initialProfile={initialProfile}>
    <UiShellProvider density={uiDensity} initialPrefs={initialPrefs}>
      <OnboardingModalProvider>
        {uiDensity ? (
          <ShellV2>{children}</ShellV2>
        ) : (
          /* existing AppShell markup unchanged */
        )}
        <IntroTourController />
        <FloatingHatch />
        <FeedbackModalHost />
        <IdleTimer />
        <UpgradeModalHost />
        <OnboardingModal />
      </OnboardingModalProvider>
    </UiShellProvider>
  </SessionProvider>
</HatchProvider>
```

Keep the legacy branch byte-identical apart from the wrapper. `BottomTabs` in the legacy branch stays where it is; ShellV2 renders its own.

- [ ] **Step 4: Verify both branches render**

With the flag off (DB default): `curl -s http://localhost:3000/dashboard -H "Cookie: $COOKIE" | grep -c 'data-shell="v2"'` → `0`. Flip the flag for dev: `update app_flags set value='true'::jsonb where key='ui_density_v1';` (via Supabase MCP `execute_sql`), wait ≤60s, repeat → `1`. Sidebar width: open http://localhost:3000/dashboard in Playwright (see Task 13) and assert `[data-testid=shell-sidebar]` box width is 200, `[data-testid=shell-topbar]` height is 48.

- [ ] **Step 5: Commit**

```bash
git add src/components/shell-v2/ShellV2.tsx src/app/(app)/layout.tsx src/app/(app)/AppLayoutClient.tsx
git commit -m "feat(density): mount ShellV2 behind ui_density_v1"
```

---

### Task 9: Unify the workspace shell

**Files:**
- Modify: `src/app/(workspace)/layout.tsx:14-47`

When density is on, the workspace uses `ShellV2` with `fullBleed` and a `topLeft` slot holding the back link; `TopNav` (the pill nav) is not rendered. The flag is read client-side from `/api/config/flags` because this layout is a client component without server props.

- [ ] **Step 1: Add a tiny client flag hook**

```tsx
// src/components/shell-v2/useDensityFlag.ts
'use client'
import { useEffect, useState } from 'react'
export function useDensityFlag() {
  const [density, setDensity] = useState<boolean | null>(null)
  useEffect(() => {
    let alive = true
    fetch('/api/config/flags', { cache: 'no-store' }).then(r => r.ok ? r.json() : { ui_density_v1: false }).then(b => { if (alive) setDensity(!!b.ui_density_v1) }).catch(() => { if (alive) setDensity(false) })
    return () => { alive = false }
  }, [])
  return density
}
```

- [ ] **Step 2: Modify `WorkspaceLayoutInner`**

Inside `src/app/(workspace)/layout.tsx`, after the share-route early return, add `const density = useDensityFlag()` and render:

```tsx
if (density === null) return null // one frame; avoids flashing the legacy pill nav
if (density) {
  return (
    <HatchProvider>
      <SessionProvider>
        <UiShellProvider density>
          <ShellV2 fullBleed topLeft={<WorkspaceBackLink />}>
            <div className="flex h-[calc(100vh-var(--shell-top-h))] min-w-0 overflow-hidden">
              {fromPlan ? <StudyPlanIndexPanel planSlug={fromPlan} activeChallengeId={cid} /> : fromDomain ? <DomainIndexPanel domainSlug={fromDomain} activeChallengeId={cid} /> : null}
              <main className="relative min-w-0 flex-1 overflow-hidden">{children}</main>
            </div>
          </ShellV2>
          <FloatingHatch />
          <UpgradeModalHost />
        </UiShellProvider>
      </SessionProvider>
    </HatchProvider>
  )
}
// legacy tree unchanged below
```

`WorkspaceBackLink` (define in the same file): reads `returnTo`, `from_plan`, `from_domain` from `useSearchParams()` and renders `<Link href={workspaceExitHref({fromPlan, fromDomain}, returnTo)} className="rounded-full border border-hairline bg-card-bright px-3 py-1 text-[12px] font-semibold">← Practice</Link>` using `workspaceExitHref` from `@/lib/workspace/breadcrumbs`.

Then in `src/components/v2/FlowWorkspace.tsx` around L5306 (`topChrome` header with the "← Practice" button): wrap that header in `{!useUiShell().density && (...)}` so the back link is not duplicated (import `useUiShell`). Everything else in the workspace, including the 44px title/command row, stays.

- [ ] **Step 3: Verify**: open `/workspace/challenges/answering-range-sum-queries-over-fixed-sensor-readings` with the flag on; assert no `.rounded-full nav` pill exists, `[data-testid=shell-sidebar][data-collapsed=true]` exists, `[data-testid=run-button]` and `[data-testid=submit-button]` still work (click Run with mocked Judge0 per `e2e/helpers.ts mockJudge0`).

- [ ] **Step 4: Commit**

```bash
git add src/app/(workspace)/layout.tsx src/components/shell-v2/useDensityFlag.ts src/components/v2/FlowWorkspace.tsx
git commit -m "feat(density): workspace uses ShellV2 with forced rail"
```

---

### Task 10: `GeoArt` primitive (eight geometric compositions)

**Files:**
- Create: `src/components/density/geo-art.ts`, `src/components/density/GeoArt.tsx`
- Test: `tests/components/geo-art.test.ts`

- [ ] **Step 1: Failing test**

```ts
// tests/components/geo-art.test.ts
import { describe, it, expect } from 'vitest'
import { geoIndexFor, GEO_COMPOSITIONS } from '@/components/density/geo-art'

describe('geo-art', () => {
  it('has eight compositions', () => { expect(GEO_COMPOSITIONS).toHaveLength(8) })
  it('is deterministic per id and spreads across compositions', () => {
    expect(geoIndexFor('gmail-undo-send')).toBe(geoIndexFor('gmail-undo-send'))
    const set = new Set(['a','b','c','d','e','f','g','h','i','j'].map(geoIndexFor))
    expect(set.size).toBeGreaterThan(3)
  })
})
```

- [ ] **Step 2: Implement**

```ts
// src/components/density/geo-art.ts
export interface GeoComposition {
  name: 'diagonal' | 'ring' | 'diamond' | 'ribbons' | 'chevrons' | 'waveform' | 'stacked-diamonds' | 'halo'
  bg: string
  shapes: Array<{ style: React.CSSProperties }>
}

export const GEO_PALETTES: Record<string, string> = {
  forest: 'linear-gradient(135deg,#1f3d2b,#2f5f3f)',
  amber: 'linear-gradient(160deg,#c4a66a,#705c30)',
  ocean: 'linear-gradient(120deg,#23477a,#2f5fa8)',
  plum: 'linear-gradient(135deg,#6e3a63,#9b4f8a)',
  stripes: 'repeating-linear-gradient(135deg,#1f3d2b 0 14px,#2f5f3f 14px 28px)',
  teal: 'linear-gradient(135deg,#1f4f5c,#2c7a8c)',
  slate: 'linear-gradient(135deg,#2e3230,#5b6a5e)',
  gold: 'linear-gradient(135deg,#b7791f,#d9a441)',
}

const abs = (s: React.CSSProperties): React.CSSProperties => ({ position: 'absolute', display: 'block', ...s })

export const GEO_COMPOSITIONS: GeoComposition[] = [
  { name: 'diagonal', bg: GEO_PALETTES.forest, shapes: [ { style: abs({ right: -16, top: -16, width: 76, height: 76, background: '#8ecf9e', clipPath: 'polygon(0 0,100% 0,0 100%)', opacity: .65 }) }, { style: abs({ right: 40, bottom: -30, width: 60, height: 60, borderRadius: '50%', background: '#c4a66a', opacity: .5 }) } ] },
  { name: 'ring', bg: GEO_PALETTES.amber, shapes: [ { style: abs({ left: 100, top: -30, width: 90, height: 90, borderRadius: '50%', border: '14px solid #f3d27a', opacity: .55 }) }, { style: abs({ left: -10, bottom: -24, width: 70, height: 40, background: '#1f3d2b', borderRadius: 8, transform: 'rotate(-18deg)', opacity: .35 }) } ] },
  { name: 'diamond', bg: GEO_PALETTES.ocean, shapes: [ { style: abs({ right: -6, bottom: -30, width: 80, height: 80, background: '#9dbdf0', transform: 'rotate(45deg)', borderRadius: 12, opacity: .55 }) }, { style: abs({ left: 120, top: 8, width: 26, height: 26, background: '#f3d27a', clipPath: 'polygon(50% 0,100% 100%,0 100%)', opacity: .8 }) } ] },
  { name: 'ribbons', bg: GEO_PALETTES.plum, shapes: [ { style: abs({ left: 70, top: -20, width: 110, height: 22, background: '#d4a5c9', borderRadius: 12, transform: 'rotate(-22deg)', opacity: .6 }) }, { style: abs({ left: 90, top: 12, width: 110, height: 22, background: '#e8d9b5', borderRadius: 12, transform: 'rotate(-22deg)', opacity: .5 }) } ] },
  { name: 'chevrons', bg: GEO_PALETTES.stripes, shapes: [ { style: abs({ right: 10, top: 8, width: 46, height: 46, borderRadius: '50%', background: '#d9a441', opacity: .9 }) } ] },
  { name: 'waveform', bg: GEO_PALETTES.teal, shapes: [ { style: abs({ left: 0, bottom: 0, width: '100%', height: 26, background: 'linear-gradient(90deg,transparent,#8fd0dc)', opacity: .55, clipPath: 'polygon(0 100%,20% 30%,40% 80%,60% 20%,80% 70%,100% 10%,100% 100%)' }) } ] },
  { name: 'stacked-diamonds', bg: GEO_PALETTES.slate, shapes: [ { style: abs({ right: 16, top: -14, width: 54, height: 54, background: '#c4a66a', clipPath: 'polygon(50% 0,100% 50%,50% 100%,0 50%)', opacity: .85 }) }, { style: abs({ right: 52, top: 26, width: 54, height: 54, background: '#dfe9e0', clipPath: 'polygon(50% 0,100% 50%,50% 100%,0 50%)', opacity: .5 }) } ] },
  { name: 'halo', bg: GEO_PALETTES.gold, shapes: [ { style: abs({ right: -24, bottom: -34, width: 96, height: 96, borderRadius: '50%', border: '18px solid #1f3d2b', opacity: .3 }) }, { style: abs({ left: 110, top: -8, width: 30, height: 70, background: '#fff', opacity: .25, transform: 'skewX(-20deg)' }) } ] },
]

export function geoIndexFor(id: string): number {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0 }
  return h % GEO_COMPOSITIONS.length
}
```

```tsx
// src/components/density/GeoArt.tsx
import type { CSSProperties, ReactNode } from 'react'
import { GEO_COMPOSITIONS, geoIndexFor } from './geo-art'

/** Deterministic geometric cover art. `seed` picks one of eight compositions; `index` overrides for explicit rotation. */
export function GeoArt({ seed, index, height = 64, className = '', style, children }: { seed?: string; index?: number; height?: number | string; className?: string; style?: CSSProperties; children?: ReactNode }) {
  const comp = GEO_COMPOSITIONS[(index ?? (seed ? geoIndexFor(seed) : 0)) % GEO_COMPOSITIONS.length]
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ height, background: comp.bg, ...style }} data-geo={comp.name} aria-hidden={children ? undefined : true}>
      {comp.shapes.map((s, i) => <i key={i} style={s.style} />)}
      {children}
    </div>
  )
}
```

- [ ] **Step 3: Run test** → PASS. Commit:

```bash
git add src/components/density/geo-art.ts src/components/density/GeoArt.tsx tests/components/geo-art.test.ts
git commit -m "feat(density): GeoArt primitive with eight compositions"
```

---

### Task 11: `CoverCard`, `HeaderBand`, `HatchPickCard`, `EditorialCard`

**Files:**
- Create: `src/components/density/CoverCard.tsx`, `HeaderBand.tsx`, `HatchPickCard.tsx`, `EditorialCard.tsx`
- Test: `tests/components/density-primitives.test.tsx`

- [ ] **Step 1: Failing render test**

```tsx
// tests/components/density-primitives.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { CoverCard } from '@/components/density/CoverCard'
import { HeaderBand } from '@/components/density/HeaderBand'
import { HatchPickCard } from '@/components/density/HatchPickCard'

vi.mock('@/components/redesign/HatchImage', () => ({ HatchImage: () => null }))
vi.mock('next/link', () => ({ default: (p: any) => <a href={p.href}>{p.children}</a> }))

describe('density primitives', () => {
  it('CoverCard renders title, meta and a ring with the pct', () => {
    const html = renderToStaticMarkup(<CoverCard href="/x" seed="a" eyebrow="Study plan" title="Frame like a PM" meta={[{ value: '7', label: 'reps' }]} pct={43} />)
    expect(html).toContain('Frame like a PM'); expect(html).toContain('43%'); expect(html).toContain('href="/x"')
  })
  it('HeaderBand renders title, chips and the right slot', () => {
    const html = renderToStaticMarkup(<HeaderBand title="Practice" chips={[{ label: 'Resume only', href: '/challenges?resume=1' }]} right={<span>R</span>} />)
    expect(html).toContain('Practice'); expect(html).toContain('Resume only'); expect(html).toContain('>R<')
  })
  it('HatchPickCard renders eyebrow, title link and CTA', () => {
    const html = renderToStaticMarkup(<HatchPickCard eyebrow="Hatch's pick" title="Model Accuracy Up" reason="Optimize needs practice" href="/workspace/challenges/x" ctaLabel="Try now" />)
    expect(html).toContain('Model Accuracy Up'); expect(html).toContain('Try now'); expect(html).toContain('/workspace/challenges/x')
  })
})
```

- [ ] **Step 2: Implement `CoverCard`**

```tsx
// src/components/density/CoverCard.tsx
import Link from 'next/link'
import type { ReactNode } from 'react'
import { GeoArt } from './GeoArt'

export interface CoverCardProps {
  href: string
  seed: string
  eyebrow?: string
  title: string
  meta?: Array<{ value: string | number; label: string }>
  /** 0-100; undefined hides the ring; 0 shows a play glyph. */
  pct?: number
  artHeight?: number
  artIndex?: number
  footer?: ReactNode
  className?: string
  testId?: string
}

export function CoverCard({ href, seed, eyebrow, title, meta = [], pct, artHeight = 64, artIndex, footer, className = '', testId }: CoverCardProps) {
  return (
    <Link href={href} data-testid={testId} className={`group flex flex-col overflow-hidden rounded-2xl border border-hairline bg-card-bright transition-shadow hover:shadow-sm ${className}`}>
      <GeoArt seed={seed} index={artIndex} height={artHeight} className="px-3 py-2.5 text-white">
        {eyebrow && <div className="relative text-[9px] font-bold uppercase tracking-[.08em] opacity-85">{eyebrow}</div>}
        <div className="relative mt-0.5 line-clamp-2 font-headline text-[14px] font-bold leading-[1.15]">{title}</div>
      </GeoArt>
      <div className="flex items-center gap-3 px-3 py-2 text-[10px] text-ink-secondary">
        {meta.map(m => <div key={m.label}><b className="block font-headline text-[15px] text-ink-strong">{m.value}</b>{m.label}</div>)}
        {footer}
        {pct !== undefined && (
          <div className="ml-auto grid size-8 place-items-center rounded-full" style={{ background: `conic-gradient(var(--color-primary) ${pct}%, var(--color-surface-container-highest) 0)` }} aria-label={pct > 0 ? `${pct}% complete` : 'Not started'}>
            <span className="grid size-6 place-items-center rounded-full bg-card-bright text-[8px] font-bold text-forest-800">{pct > 0 ? `${pct}%` : '▶'}</span>
          </div>
        )}
      </div>
    </Link>
  )
}
```

- [ ] **Step 3: Implement `HeaderBand`**

```tsx
// src/components/density/HeaderBand.tsx
import Link from 'next/link'
import type { ReactNode } from 'react'

export interface BandChip { label: string; href?: string; onClick?: () => void; active?: boolean; testId?: string }

export function HeaderBand({ title, subtitle, chips = [], right, className = '', testId = 'header-band' }: { title: string; subtitle?: string; chips?: BandChip[]; right?: ReactNode; className?: string; testId?: string }) {
  if (subtitle && subtitle.length > 60) throw new Error(`HeaderBand subtitle over 60 chars: "${subtitle}"`)
  return (
    <div data-testid={testId} className={`relative mb-3 flex flex-col gap-3 overflow-hidden rounded-2xl bg-surface-container px-4 py-3 lg:min-h-[88px] lg:flex-row lg:items-center ${className}`}>
      <div className="pointer-events-none absolute inset-0 opacity-55" aria-hidden>
        <i className="absolute block rounded-2xl bg-primary-fixed" style={{ right: 520, top: -50, width: 150, height: 150, transform: 'rotate(45deg)' }} />
        <i className="absolute block rounded-full bg-amber-soft" style={{ right: 600, top: 30, width: 56, height: 56 }} />
      </div>
      <div className="relative min-w-0 flex-1">
        <h1 className="font-headline text-[26px] font-bold leading-none text-ink-strong">{title}</h1>
        {subtitle && <p className="mt-1 text-[13px] text-ink-secondary">{subtitle}</p>}
        {chips.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {chips.map(c => {
              const cls = `rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${c.active ? 'border-forest-800 bg-forest-800 text-white' : 'border-hairline bg-card-bright text-ink-strong'}`
              return c.href ? <Link key={c.label} href={c.href} data-testid={c.testId} aria-current={c.active ? 'page' : undefined} className={cls}>{c.label}</Link>
                : <button key={c.label} type="button" data-testid={c.testId} aria-pressed={c.active} onClick={c.onClick} className={cls}>{c.label}</button>
            })}
          </div>
        )}
      </div>
      {right && <div className="relative w-full lg:w-[480px]">{right}</div>}
    </div>
  )
}
```

- [ ] **Step 4: Implement `HatchPickCard`**

```tsx
// src/components/density/HatchPickCard.tsx
'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { HatchImage } from '@/components/redesign/HatchImage'

const DISMISS_MS = 24 * 60 * 60 * 1000
export function hatchPickDismissKey(scope: string) { return `hp:hatch-pick-dismissed:${scope}` }

export interface HatchPickCardProps {
  eyebrow: string
  title: string
  reason?: string
  href: string
  ctaLabel: string
  ctaVariant?: 'primary' | 'outline'
  /** When set, a ✕ hides the card for 24h in localStorage under this scope. */
  dismissScope?: string
  onCta?: () => void
  testId?: string
}

export function HatchPickCard({ eyebrow, title, reason, href, ctaLabel, ctaVariant = 'primary', dismissScope, onCta, testId = 'hatch-pick' }: HatchPickCardProps) {
  const [hidden, setHidden] = useState(false)
  useEffect(() => {
    if (!dismissScope) return
    try { const t = Number(localStorage.getItem(hatchPickDismissKey(dismissScope)) ?? 0); if (Date.now() - t < DISMISS_MS) setHidden(true) } catch { /* ignore */ }
  }, [dismissScope])
  if (hidden) return null
  return (
    <div data-testid={testId} className="relative flex items-center gap-2.5 rounded-xl border border-primary-fixed bg-card-bright px-3 py-2">
      <HatchImage state="speaking" size={36} />
      <div className="min-w-0 flex-1">
        <div className="text-[9px] font-bold uppercase tracking-[.08em] text-primary">{eyebrow}</div>
        <Link href={href} className="block truncate font-headline text-[14px] font-bold leading-tight text-ink-strong hover:underline">{title}</Link>
        {reason && <div className="truncate text-[11px] text-ink-secondary">{reason}</div>}
      </div>
      <Link href={href} onClick={onCta} data-testid={`${testId}-cta`} className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-bold ${ctaVariant === 'primary' ? 'bg-forest-800 text-white' : 'border border-forest-800 bg-card-bright text-forest-800'}`}>{ctaLabel}</Link>
      {dismissScope && (
        <button type="button" aria-label="Dismiss for today" data-testid={`${testId}-dismiss`} onClick={() => { try { localStorage.setItem(hatchPickDismissKey(dismissScope), String(Date.now())) } catch {} ; setHidden(true) }} className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full text-ink-muted hover:bg-surface-container">
          <X size={12} aria-hidden />
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Implement `EditorialCard`** (featured dark card used by Library and dashboard)

```tsx
// src/components/density/EditorialCard.tsx
import Link from 'next/link'

export function EditorialCard({ href, eyebrow, title, sub, meta, ctaLabel = 'Start reading →', height = 160, className = '', testId }: { href: string; eyebrow: string; title: string; sub?: string; meta?: string; ctaLabel?: string; height?: number; className?: string; testId?: string }) {
  return (
    <div data-testid={testId} className={`relative grid overflow-hidden rounded-2xl bg-forest-800 text-white ${className}`} style={{ height, gridTemplateColumns: 'minmax(0,1fr) 42%' }}>
      <div className="relative flex flex-col justify-center px-5 py-4">
        <div className="text-[10px] font-bold uppercase tracking-[.08em] text-gold">{eyebrow}</div>
        <h2 className="mt-1.5 line-clamp-2 font-headline text-[30px] font-bold leading-[1]">{title}</h2>
        {sub && <p className="mt-1.5 line-clamp-1 text-[13px] opacity-85">{sub}</p>}
        <div className="mt-2.5"><Link href={href} className="inline-block rounded-full bg-card-bright px-3.5 py-1.5 text-[12px] font-bold text-ink-strong">{ctaLabel}</Link></div>
      </div>
      <div className="relative overflow-hidden bg-forest-900" aria-hidden>
        <i className="absolute block" style={{ left: 40, top: 30, width: 150, height: 150, background: '#c4a66a', clipPath: 'polygon(50% 0,100% 50%,50% 100%,0 50%)' }} />
        <i className="absolute block rounded-full" style={{ right: 30, top: 20, width: 110, height: 110, border: '22px solid #2f5f3f' }} />
        {meta && <div className="absolute bottom-4 left-24 rounded-xl px-3.5 py-2 text-[11px]" style={{ background: 'rgba(255,255,255,.14)', backdropFilter: 'blur(6px)' }}>{meta}</div>}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Run the test** (`npx vitest run tests/components/density-primitives.test.tsx`) → PASS. Typecheck. Commit:

```bash
git add src/components/density tests/components/density-primitives.test.tsx
git commit -m "feat(density): CoverCard, HeaderBand, HatchPickCard, EditorialCard"
```

---

### Task 12: `ReaderFrame`, `RightToc`, `useActiveHeading`

**Files:**
- Create: `src/components/density/ReaderFrame.tsx`, `src/components/density/RightToc.tsx`, `src/components/density/useActiveHeading.ts`

- [ ] **Step 1: `useActiveHeading`**

```ts
// src/components/density/useActiveHeading.ts
'use client'
import { useEffect, useState } from 'react'

/** Tracks which of `ids` is nearest the top of the viewport. */
export function useActiveHeading(ids: string[], offset = 96) {
  const [active, setActive] = useState<string | null>(ids[0] ?? null)
  useEffect(() => {
    if (!ids.length) return
    const els = ids.map(id => document.getElementById(id)).filter((e): e is HTMLElement => !!e)
    if (!els.length) return
    const obs = new IntersectionObserver(() => {
      let best: { id: string; top: number } | null = null
      for (const el of els) {
        const top = el.getBoundingClientRect().top - offset
        if (top <= 0 && (!best || top > best.top)) best = { id: el.id, top }
      }
      setActive(best?.id ?? els[0].id)
    }, { rootMargin: `-${offset}px 0px -60% 0px`, threshold: [0, 1] })
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [ids.join('|'), offset])
  return active
}
```

- [ ] **Step 2: `RightToc`**

```tsx
// src/components/density/RightToc.tsx
'use client'
export interface TocGroup { label: string; items: Array<{ id: string; label: string; done?: boolean; href?: string }> }

export function RightToc({ groups, activeId, progressPct, onSelect, testId = 'right-toc' }: { groups: TocGroup[]; activeId: string | null; progressPct?: number; onSelect?: (id: string) => void; testId?: string }) {
  return (
    <nav data-testid={testId} aria-label="On this page" className="sticky top-[72px] hidden w-[200px] shrink-0 text-[12px] leading-[1.9] text-ink-muted xl:block">
      {progressPct !== undefined && (
        <div className="mb-2 h-[3px] overflow-hidden rounded bg-surface-container-highest" aria-label={`${Math.round(progressPct)}% read`}>
          <i className="block h-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, progressPct))}%` }} />
        </div>
      )}
      {groups.map(g => (
        <div key={g.label} className="mb-3">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-[.08em] text-ink-muted">{g.label}</div>
          {g.items.map(it => {
            const isActive = it.id === activeId
            const cls = `block truncate border-l-2 pl-2.5 ${isActive ? 'border-primary font-bold text-forest-800' : 'border-transparent hover:text-ink-secondary'} ${it.done ? 'text-ink-muted' : ''}`
            return it.href
              ? <a key={it.id} href={it.href} className={cls} aria-current={isActive ? 'true' : undefined}>{it.done ? '✓ ' : ''}{it.label}</a>
              : <button key={it.id} type="button" onClick={() => { onSelect?.(it.id); document.getElementById(it.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }} className={`w-full text-left ${cls}`} aria-current={isActive ? 'true' : undefined}>{it.done ? '✓ ' : ''}{it.label}</button>
          })}
        </div>
      ))}
    </nav>
  )
}
```

- [ ] **Step 3: `ReaderFrame`**

```tsx
// src/components/density/ReaderFrame.tsx
import type { ReactNode } from 'react'

/** Single 700px reading column with an optional right TOC. Used inside ShellV2 (rail forced). */
export function ReaderFrame({ children, toc, testId = 'reader-frame' }: { children: ReactNode; toc?: ReactNode; testId?: string }) {
  return (
    <div data-testid={testId} className="mx-auto flex w-full max-w-[1100px] items-start gap-10 px-6 pb-24 pt-7 lg:px-10">
      <article className="min-w-0 w-full max-w-[700px] font-body text-[15px] leading-[1.6] text-ink-strong">{children}</article>
      {toc}
    </div>
  )
}
```

- [ ] **Step 4: Typecheck, commit**

```bash
git add src/components/density/ReaderFrame.tsx src/components/density/RightToc.tsx src/components/density/useActiveHeading.ts
git commit -m "feat(density): ReaderFrame, RightToc, useActiveHeading"
```

---

### Task 13: E2E harness for density tests

**Files:**
- Create: `e2e/density/helpers.ts`, `e2e/density/shell.spec.ts`

- [ ] **Step 1: Helpers**

```ts
// e2e/density/helpers.ts
import { expect, type Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

export const VIEWPORTS = { desktop: { width: 1440, height: 900 }, laptop: { width: 1280, height: 720 }, mobile: { width: 375, height: 812 } } as const
export type ViewportName = keyof typeof VIEWPORTS

export const PRO_USER = { email: 'sandeeptnvs@gmail.com', password: 'Sandeep#89' }

export async function loginViaApi(page: Page, user = PRO_USER) {
  const res = await page.request.post('/api/auth/login', { data: user })
  expect(res.status(), 'login').toBe(200)
}

export async function setDensityFlag(on: boolean) {
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
  const { error } = await admin.from('app_flags').upsert({ key: 'ui_density_v1', value: on, updated_at: new Date().toISOString() })
  if (error) throw error
}

/** y of the first element matching `selector` relative to the viewport. */
export async function topOf(page: Page, selector: string): Promise<number> {
  const box = await page.locator(selector).first().boundingBox()
  expect(box, `bounding box for ${selector}`).not.toBeNull()
  return Math.round(box!.y)
}

export async function expectNoConsoleErrors(page: Page, run: () => Promise<void>) {
  const errors: string[] = []
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
  await run()
  expect(errors.filter(e => !e.includes('favicon')), 'console errors').toEqual([])
}

export async function gotoReady(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded' })
  await page.locator('[data-shell="v2"]').first().waitFor({ state: 'attached', timeout: 60_000 })
  await page.waitForLoadState('networkidle').catch(() => {})
}
```

The flag cache is 60s (`app-flags.ts` `CACHE_TTL_MS`); tests call `setDensityFlag(true)` in `beforeAll` and the dev server must have been restarted or 60s must have elapsed. Add to the spec a `test.beforeAll(async () => { await setDensityFlag(true); await new Promise(r => setTimeout(r, 61_000)) })` guard only when `process.env.DENSITY_FLAG_WAIT === '1'`; otherwise assume the flag is already on for the dev DB.

- [ ] **Step 2: Shell spec**

```ts
// e2e/density/shell.spec.ts
import { test, expect } from '@playwright/test'
import { VIEWPORTS, loginViaApi, gotoReady, topOf } from './helpers'

test.describe('shell-v2', () => {
  test.beforeEach(async ({ page }) => { await loginViaApi(page) })

  test('desktop dimensions and collapse persistence', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop)
    await gotoReady(page, '/dashboard')
    const side = page.getByTestId('shell-sidebar'); const top = page.getByTestId('shell-topbar')
    expect((await side.boundingBox())!.width).toBe(200)
    expect((await top.boundingBox())!.height).toBe(48)
    await page.getByTestId('shell-nav-toggle').click()
    await expect(side).toHaveAttribute('data-collapsed', 'true')
    expect((await side.boundingBox())!.width).toBe(56)
    await page.reload(); await gotoReady(page, '/dashboard')
    await expect(page.getByTestId('shell-sidebar')).toHaveAttribute('data-collapsed', 'true')
    const prefs = await page.request.get('/api/profile').then(r => r.json())
    expect(prefs.ui_prefs?.nav_collapsed).toBe(true)
    await page.getByTestId('shell-nav-toggle').click()
    await expect(page.getByTestId('shell-sidebar')).toHaveAttribute('data-collapsed', 'false')
  })

  test('reader routes force the rail and restore on exit', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop)
    await gotoReady(page, '/explore/modules/context-engineering')
    await expect(page.getByTestId('shell-sidebar')).toHaveAttribute('data-collapsed', 'true')
    await expect(page.getByTestId('shell-nav-toggle')).toBeDisabled()
    await gotoReady(page, '/explore')
    await expect(page.getByTestId('shell-sidebar')).toHaveAttribute('data-collapsed', 'false')
  })

  test('route-scoped search', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop)
    await gotoReady(page, '/explore')
    await expect(page.getByTestId('shell-search')).toHaveAttribute('placeholder', 'Search guides, companies, or skills')
    await page.getByTestId('shell-search').fill('gmail'); await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/explore\?q=gmail/)
    await gotoReady(page, '/challenges')
    await page.getByTestId('shell-search').fill('sum'); await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/challenges\?q=sum/)
  })

  test('workspace uses the shared shell with the rail forced', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop)
    await gotoReady(page, '/workspace/challenges/answering-range-sum-queries-over-fixed-sensor-readings')
    await expect(page.getByTestId('shell-sidebar')).toHaveAttribute('data-collapsed', 'true')
    await expect(page.locator('nav.rounded-full')).toHaveCount(0)
    await expect(page.getByTestId('run-button')).toBeVisible()
    await expect(page.getByTestId('submit-button')).toBeVisible()
    expect(await topOf(page, '[data-testid=monaco-editor-container]')).toBeLessThan(140)
  })

  test('mobile keeps the bottom tabs and a 44px bar', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile)
    await gotoReady(page, '/dashboard')
    await expect(page.getByTestId('shell-sidebar')).toBeHidden()
    await expect(page.locator('nav.fixed.inset-x-0.bottom-0')).toBeVisible()
  })
})
```

- [ ] **Step 3: Run**

Run: `PLAYWRIGHT_BASE_URL=http://localhost:3002 npx playwright test e2e/density/shell.spec.ts` → 5 passed. If the mobile top bar assertion needs the 44px bar, add `lg:` variants in `AppTopBarV2` (`style={{ height: 'var(--shell-top-h)' }}` becomes 44 below `lg` via a class `h-11 lg:h-12`); keep 48 on desktop.

- [ ] **Step 4: Commit**

```bash
git add e2e/density
git commit -m "test(density): shell E2E harness and shell-v2 spec"
```

---

## Self-review checklist (run before handing off)

- Spec §3.1 shell: Tasks 5-9, 13. §3.2 band: Task 11. §3.4 cover cards: Tasks 10-11. §3.5 readers substrate: Task 12. §5 data: Tasks 1-3. Flag: Task 2, 8.
- Type names used later: `useUiShell()` → `{ density, railCollapsed, forced, setNavCollapsed, practiceView, setPracticeView }`; `HeaderBand({ title, subtitle?, chips?, right? })`; `HatchPickCard({ eyebrow, title, reason?, href, ctaLabel, ctaVariant?, dismissScope?, onCta? })`; `CoverCard({ href, seed, eyebrow?, title, meta?, pct?, artHeight?, artIndex?, footer? })`; `EditorialCard({ href, eyebrow, title, sub?, meta?, ctaLabel?, height? })`; `GeoArt({ seed?, index?, height?, children? })`; `ReaderFrame({ children, toc? })`; `RightToc({ groups, activeId, progressPct?, onSelect? })`; `useActiveHeading(ids, offset?)`; `createProgressReporter({ contentType, parentId, contentId })`; `fetchRecentReading(limit)`; `searchScopeFor(pathname, total?)`; `routeKind`, `forcedRail`, `activeNavKey`.

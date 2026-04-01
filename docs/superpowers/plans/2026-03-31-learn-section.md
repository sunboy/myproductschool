# Learn Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `/learn` section — a 9-module reading library with abstract geometric cover cards, sequential chapter unlock, hook card + article format, and full nav integration.

**Architecture:** Three new Next.js routes (`/learn`, `/learn/[slug]`, `/learn/[slug]/[chapter]`) backed by three Supabase tables (`learn_modules`, `learn_chapters`, `user_learn_progress`). Data fetched via API routes (`/api/learn`, `/api/learn/[slug]`, `/api/learn/[slug]/[chapter]`). Client hooks wrap the API calls. Nav integration adds `auto_stories` icon to NavRail and BottomTabs between Explore and Practice.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Supabase (server + admin clients), shadcn/ui card pattern, Material Symbols Outlined icons, Literata + Nunito Sans fonts.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/lib/types.ts` | Add `LearnModule`, `LearnChapter`, `UserLearnProgress`, `LearnModuleWithProgress`, `LearnChapterWithProgress` |
| Create | `supabase/migrations/20260331_learn_tables.sql` | `learn_modules`, `learn_chapters`, `user_learn_progress` DDL |
| Create | `src/lib/learn-seed.ts` | 9 module seed objects with SVG art strings |
| Create | `src/app/api/learn/route.ts` | GET all published modules with user progress |
| Create | `src/app/api/learn/[slug]/route.ts` | GET one module + all chapters with progress |
| Create | `src/app/api/learn/[slug]/[chapter]/route.ts` | GET one chapter body |
| Create | `src/app/api/learn/[slug]/[chapter]/complete/route.ts` | POST mark chapter complete |
| Create | `src/hooks/useLearnModules.ts` | Fetch all modules hook |
| Create | `src/hooks/useLearnModule.ts` | Fetch one module + chapters hook |
| Create | `src/hooks/useLearnChapter.ts` | Fetch one chapter hook |
| Create | `src/app/(app)/learn/page.tsx` | Module grid (`/learn`) |
| Create | `src/app/(app)/learn/[slug]/page.tsx` | Module detail + chapter accordion (`/learn/[slug]`) |
| Create | `src/app/(app)/learn/[slug]/[chapter]/page.tsx` | Chapter reading view (`/learn/[slug]/[chapter]`) |
| Modify | `src/components/shell/NavRail.tsx` | Insert Learn between Explore and Practice |
| Modify | `src/components/shell/BottomTabs.tsx` | Insert Learn between Explore and Practice |

---

## Task 1: TypeScript Types

**Files:**
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Read the current types file**

Run: `cat src/lib/types.ts | tail -20` — already done (ends at line 427).

- [ ] **Step 2: Append Learn types to `src/lib/types.ts`**

Add at the end of `src/lib/types.ts`:

```typescript
// ── Learn Section ─────────────────────────────────────────────

export type LearnDifficulty = 'foundation' | 'beginner' | 'intermediate' | 'advanced' | 'new-era' | 'entry-point'

export interface LearnModule {
  id: string
  slug: string
  name: string
  tagline: string
  difficulty: LearnDifficulty
  chapter_count: number
  est_minutes: number
  cover_color: string    // dark hex e.g. '#1a3a2a'
  accent_color: string   // primary accent hex e.g. '#4a7c59'
  sort_order: number
  created_at: string
}

export interface LearnChapter {
  id: string
  module_id: string
  slug: string
  title: string
  subtitle: string
  sort_order: number
  hook_text: string
  body_mdx: string
  created_at: string
}

export interface UserLearnProgress {
  id: string
  user_id: string
  module_id: string
  chapter_id: string
  completed_at: string
}

// Enriched for UI
export interface LearnModuleWithProgress extends LearnModule {
  completed_chapters: number
  progress_percentage: number
}

export interface LearnChapterWithProgress extends LearnChapter {
  is_completed: boolean
  is_unlocked: boolean  // true if previous chapter is done or sort_order === 1
}
```

- [ ] **Step 3: Verify TypeScript**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat(learn): add TypeScript types for learn section"
```

---

## Task 2: Supabase Migration

**Files:**
- Create: `supabase/migrations/20260331_learn_tables.sql`

- [ ] **Step 1: Check migrations directory exists**

Run: `ls supabase/migrations/ | tail -5`

- [ ] **Step 2: Write the migration**

```sql
-- Learn section tables

create table if not exists public.learn_modules (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  tagline     text not null,
  difficulty  text not null check (difficulty in ('foundation','beginner','intermediate','advanced','new-era','entry-point')),
  chapter_count int not null default 0,
  est_minutes int not null default 0,
  cover_color text not null,
  accent_color text not null,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.learn_chapters (
  id          uuid primary key default gen_random_uuid(),
  module_id   uuid not null references public.learn_modules(id) on delete cascade,
  slug        text not null,
  title       text not null,
  subtitle    text not null default '',
  sort_order  int not null default 0,
  hook_text   text not null default '',
  body_mdx    text not null default '',
  created_at  timestamptz not null default now(),
  unique (module_id, slug)
);

create table if not exists public.user_learn_progress (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  module_id   uuid not null references public.learn_modules(id) on delete cascade,
  chapter_id  uuid not null references public.learn_chapters(id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (user_id, chapter_id)
);

-- RLS
alter table public.learn_modules enable row level security;
alter table public.learn_chapters enable row level security;
alter table public.user_learn_progress enable row level security;

create policy "learn_modules_public_read" on public.learn_modules
  for select using (true);

create policy "learn_chapters_public_read" on public.learn_chapters
  for select using (true);

create policy "user_learn_progress_own" on public.user_learn_progress
  for all using (auth.uid() = user_id);
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260331_learn_tables.sql
git commit -m "feat(learn): add learn_modules, learn_chapters, user_learn_progress migration"
```

---

## Task 3: Seed Data (`learn-seed.ts`)

**Files:**
- Create: `src/lib/learn-seed.ts`

This file exports the 9 module definitions including inline SVG art strings. It is consumed by the mock API fallback and can also be used for a seed script.

- [ ] **Step 1: Create `src/lib/learn-seed.ts`**

```typescript
import type { LearnModule, LearnChapter } from './types'

// SVG art for each module cover. Inline strings, rendered via dangerouslySetInnerHTML
// inside a sized div. Each SVG is 100% width/height of its container.

export const MODULE_SVG_ART: Record<string, string> = {
  flow: `<svg viewBox="0 0 240 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="40" cy="50" r="22" fill="none" stroke="#4a7c59" stroke-width="2.5"/>
    <text x="40" y="55" text-anchor="middle" fill="#8ecf9e" font-size="12" font-family="sans-serif" font-weight="700">F</text>
    <circle cx="120" cy="50" r="22" fill="none" stroke="#4a7c59" stroke-width="2.5"/>
    <text x="120" y="55" text-anchor="middle" fill="#8ecf9e" font-size="12" font-family="sans-serif" font-weight="700">L·O</text>
    <circle cx="200" cy="50" r="22" fill="none" stroke="#4a7c59" stroke-width="2.5"/>
    <text x="200" y="55" text-anchor="middle" fill="#8ecf9e" font-size="12" font-family="sans-serif" font-weight="700">W</text>
    <line x1="62" y1="50" x2="98" y2="50" stroke="#4a7c59" stroke-width="1.5" marker-end="url(#arr)"/>
    <line x1="142" y1="50" x2="178" y2="50" stroke="#4a7c59" stroke-width="1.5" marker-end="url(#arr)"/>
    <defs><marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#4a7c59"/></marker></defs>
  </svg>`,

  'user-models': `<svg viewBox="0 0 240 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="120" cy="50" r="18" fill="#3b5bdb" opacity="0.7"/>
    <circle cx="50" cy="50" r="10" fill="none" stroke="#5c7cfa" stroke-width="1.5"/>
    <circle cx="190" cy="50" r="10" fill="none" stroke="#5c7cfa" stroke-width="1.5"/>
    <circle cx="120" cy="15" r="10" fill="none" stroke="#5c7cfa" stroke-width="1.5"/>
    <circle cx="120" cy="85" r="10" fill="none" stroke="#5c7cfa" stroke-width="1.5"/>
    <line x1="60" y1="50" x2="102" y2="50" stroke="#5c7cfa" stroke-width="1.5" opacity="0.6"/>
    <line x1="138" y1="50" x2="180" y2="50" stroke="#5c7cfa" stroke-width="1.5" opacity="0.6"/>
    <line x1="120" y1="25" x2="120" y2="32" stroke="#5c7cfa" stroke-width="1.5" opacity="0.6"/>
    <line x1="120" y1="68" x2="120" y2="75" stroke="#5c7cfa" stroke-width="1.5" opacity="0.6"/>
  </svg>`,

  'root-cause': `<svg viewBox="0 0 240 100" xmlns="http://www.w3.org/2000/svg">
    <rect x="95" y="8" width="50" height="20" rx="4" fill="none" stroke="#fca5a5" stroke-width="1.5"/>
    <text x="120" y="22" text-anchor="middle" fill="#fca5a5" font-size="8" font-family="sans-serif">Symptom</text>
    <line x1="120" y1="28" x2="80" y2="50" stroke="#ef4444" stroke-width="1.5" opacity="0.7"/>
    <line x1="120" y1="28" x2="160" y2="50" stroke="#ef4444" stroke-width="1.5" opacity="0.7"/>
    <rect x="55" y="50" width="50" height="18" rx="4" fill="none" stroke="#ef4444" stroke-width="1.5"/>
    <rect x="135" y="50" width="50" height="18" rx="4" fill="none" stroke="#ef4444" stroke-width="1.5"/>
    <line x1="80" y1="68" x2="60" y2="82" stroke="#ef4444" stroke-width="1.5" opacity="0.5"/>
    <line x1="80" y1="68" x2="100" y2="82" stroke="#ef4444" stroke-width="1.5" opacity="0.5"/>
    <circle cx="60" cy="85" r="5" fill="#ef4444" opacity="0.5"/>
    <circle cx="100" cy="85" r="5" fill="#ef4444" opacity="0.5"/>
    <circle cx="165" cy="82" r="8" fill="#ef4444" opacity="0.8"/>
    <text x="165" y="86" text-anchor="middle" fill="#fff" font-size="7" font-family="sans-serif">Root</text>
  </svg>`,

  'product-debug': `<svg viewBox="0 0 240 100" xmlns="http://www.w3.org/2000/svg">
    <rect x="20" y="30" width="20" height="55" rx="2" fill="#3b82f6" opacity="0.8"/>
    <rect x="50" y="20" width="20" height="65" rx="2" fill="#3b82f6" opacity="0.8"/>
    <rect x="80" y="35" width="20" height="50" rx="2" fill="#3b82f6" opacity="0.8"/>
    <rect x="110" y="15" width="20" height="70" rx="2" fill="#3b82f6" opacity="0.8"/>
    <rect x="140" y="45" width="20" height="40" rx="2" fill="#ef4444" opacity="0.9"/>
    <rect x="170" y="55" width="20" height="30" rx="2" fill="#ef4444" opacity="0.7"/>
    <rect x="200" y="60" width="20" height="25" rx="2" fill="#ef4444" opacity="0.6"/>
    <polyline points="20,25 50,15 80,28 120,10 150,40 180,50 210,55" fill="none" stroke="#fbbf24" stroke-width="2" stroke-dasharray="4,2"/>
  </svg>`,

  'north-star': `<svg viewBox="0 0 240 100" xmlns="http://www.w3.org/2000/svg">
    <polygon points="120,10 128,38 158,38 134,56 142,84 120,68 98,84 106,56 82,38 112,38" fill="none" stroke="#fbbf24" stroke-width="2"/>
    <polygon points="120,20 126,38 146,38 130,50 136,70 120,58 104,70 110,50 94,38 114,38" fill="#fbbf24" opacity="0.2"/>
    <circle cx="120" cy="50" r="30" fill="none" stroke="#fbbf24" stroke-width="0.5" opacity="0.4"/>
    <circle cx="120" cy="50" r="42" fill="none" stroke="#fbbf24" stroke-width="0.5" opacity="0.2"/>
  </svg>`,

  'trade-offs': `<svg viewBox="0 0 240 100" xmlns="http://www.w3.org/2000/svg">
    <line x1="120" y1="45" x2="120" y2="90" stroke="#f59e0b" stroke-width="2"/>
    <line x1="70" y1="48" x2="170" y2="42" stroke="#f59e0b" stroke-width="2.5"/>
    <rect x="35" y="44" width="38" height="24" rx="3" fill="none" stroke="#f59e0b" stroke-width="1.5"/>
    <rect x="168" y="38" width="38" height="24" rx="3" fill="none" stroke="#f59e0b" stroke-width="1.5" opacity="0.6"/>
    <text x="54" y="60" text-anchor="middle" fill="#f59e0b" font-size="7" font-family="sans-serif">Speed</text>
    <text x="187" y="54" text-anchor="middle" fill="#f59e0b" font-size="7" font-family="sans-serif" opacity="0.7">Quality</text>
    <circle cx="120" cy="90" r="5" fill="#f59e0b"/>
  </svg>`,

  'growth-loops': `<svg viewBox="0 0 240 100" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="120" cy="50" rx="80" ry="35" fill="none" stroke="#10b981" stroke-width="2"/>
    <circle cx="40" cy="50" r="10" fill="#10b981" opacity="0.8"/>
    <circle cx="120" cy="15" r="10" fill="#10b981" opacity="0.8"/>
    <circle cx="200" cy="50" r="10" fill="#10b981" opacity="0.8"/>
    <circle cx="120" cy="85" r="10" fill="#10b981" opacity="0.8"/>
    <polygon points="195,42 205,50 195,58" fill="#34d399"/>
  </svg>`,

  'ai-products': `<svg viewBox="0 0 240 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="25" r="8" fill="none" stroke="#a855f7" stroke-width="1.5"/>
    <circle cx="20" cy="50" r="8" fill="none" stroke="#a855f7" stroke-width="1.5"/>
    <circle cx="20" cy="75" r="8" fill="none" stroke="#a855f7" stroke-width="1.5"/>
    <circle cx="100" cy="20" r="8" fill="none" stroke="#7c3aed" stroke-width="1.5"/>
    <circle cx="100" cy="40" r="8" fill="none" stroke="#7c3aed" stroke-width="1.5"/>
    <circle cx="100" cy="60" r="8" fill="none" stroke="#7c3aed" stroke-width="1.5"/>
    <circle cx="100" cy="80" r="8" fill="none" stroke="#7c3aed" stroke-width="1.5"/>
    <circle cx="180" cy="35" r="8" fill="none" stroke="#a855f7" stroke-width="1.5"/>
    <circle cx="180" cy="65" r="8" fill="none" stroke="#a855f7" stroke-width="1.5"/>
    <circle cx="230" cy="50" r="12" fill="#a855f7" opacity="0.8"/>
    <line x1="28" y1="25" x2="92" y2="20" stroke="#a855f7" stroke-width="0.8" opacity="0.5"/>
    <line x1="28" y1="25" x2="92" y2="40" stroke="#a855f7" stroke-width="0.8" opacity="0.5"/>
    <line x1="28" y1="50" x2="92" y2="40" stroke="#a855f7" stroke-width="0.8" opacity="0.5"/>
    <line x1="28" y1="50" x2="92" y2="60" stroke="#a855f7" stroke-width="0.8" opacity="0.5"/>
    <line x1="28" y1="75" x2="92" y2="60" stroke="#a855f7" stroke-width="0.8" opacity="0.5"/>
    <line x1="28" y1="75" x2="92" y2="80" stroke="#a855f7" stroke-width="0.8" opacity="0.5"/>
    <line x1="108" y1="20" x2="172" y2="35" stroke="#7c3aed" stroke-width="0.8" opacity="0.5"/>
    <line x1="108" y1="40" x2="172" y2="35" stroke="#7c3aed" stroke-width="0.8" opacity="0.5"/>
    <line x1="108" y1="60" x2="172" y2="65" stroke="#7c3aed" stroke-width="0.8" opacity="0.5"/>
    <line x1="108" y1="80" x2="172" y2="65" stroke="#7c3aed" stroke-width="0.8" opacity="0.5"/>
    <line x1="188" y1="35" x2="218" y2="50" stroke="#a855f7" stroke-width="1" opacity="0.7"/>
    <line x1="188" y1="65" x2="218" y2="50" stroke="#a855f7" stroke-width="1" opacity="0.7"/>
  </svg>`,

  'product-sense': `<svg viewBox="0 0 240 100" xmlns="http://www.w3.org/2000/svg">
    <polygon points="120,15 148,32 148,68 120,85 92,68 92,32" fill="none" stroke="#4a7c59" stroke-width="2"/>
    <polygon points="120,30 138,40 138,60 120,70 102,60 102,40" fill="#4a7c59" opacity="0.25"/>
    <polygon points="120,45 128,50 128,60 120,65 112,60 112,50" fill="#8ecf9e" opacity="0.7"/>
    <line x1="120" y1="15" x2="120" y2="45" stroke="#4a7c59" stroke-width="0.8" opacity="0.5"/>
    <line x1="148" y1="32" x2="128" y2="50" stroke="#4a7c59" stroke-width="0.8" opacity="0.5"/>
    <line x1="148" y1="68" x2="128" y2="60" stroke="#4a7c59" stroke-width="0.8" opacity="0.5"/>
    <line x1="120" y1="85" x2="120" y2="65" stroke="#4a7c59" stroke-width="0.8" opacity="0.5"/>
    <line x1="92" y1="68" x2="112" y2="60" stroke="#4a7c59" stroke-width="0.8" opacity="0.5"/>
    <line x1="92" y1="32" x2="112" y2="50" stroke="#4a7c59" stroke-width="0.8" opacity="0.5"/>
  </svg>`,
}

export const LEARN_MODULES_SEED: Omit<LearnModule, 'id' | 'created_at'>[] = [
  {
    slug: 'flow',
    name: 'FLOW',
    tagline: 'The 4-step framework behind every challenge on this platform',
    difficulty: 'foundation',
    chapter_count: 7,
    est_minutes: 45,
    cover_color: '#1a3a2a',
    accent_color: '#4a7c59',
    sort_order: 1,
  },
  {
    slug: 'user-models',
    name: 'User Models',
    tagline: 'Represent users the way you represent data structures',
    difficulty: 'beginner',
    chapter_count: 7,
    est_minutes: 40,
    cover_color: '#1a2a3a',
    accent_color: '#3b5bdb',
    sort_order: 2,
  },
  {
    slug: 'root-cause',
    name: 'Root Cause',
    tagline: 'Engineers already debug systems. Now apply it to products.',
    difficulty: 'intermediate',
    chapter_count: 7,
    est_minutes: 40,
    cover_color: '#2a1a1a',
    accent_color: '#ef4444',
    sort_order: 3,
  },
  {
    slug: 'product-debug',
    name: 'Product Debug',
    tagline: 'DAU dropped 15%. Walk me through your diagnosis.',
    difficulty: 'intermediate',
    chapter_count: 7,
    est_minutes: 45,
    cover_color: '#0f1a2e',
    accent_color: '#3b82f6',
    sort_order: 4,
  },
  {
    slug: 'north-star',
    name: 'North Star',
    tagline: 'One metric that captures the value you actually deliver',
    difficulty: 'intermediate',
    chapter_count: 7,
    est_minutes: 45,
    cover_color: '#1a1a2e',
    accent_color: '#fbbf24',
    sort_order: 5,
  },
  {
    slug: 'trade-offs',
    name: 'Trade-offs',
    tagline: '"It depends" is not an answer. Name what you\'re optimizing for.',
    difficulty: 'advanced',
    chapter_count: 7,
    est_minutes: 50,
    cover_color: '#1e1a0e',
    accent_color: '#f59e0b',
    sort_order: 6,
  },
  {
    slug: 'growth-loops',
    name: 'Growth Loops',
    tagline: 'Systems that compound. Engineers already think this way.',
    difficulty: 'intermediate',
    chapter_count: 7,
    est_minutes: 45,
    cover_color: '#0e1a12',
    accent_color: '#10b981',
    sort_order: 7,
  },
  {
    slug: 'ai-products',
    name: 'AI Products',
    tagline: 'When execution is cheap, judgment is the differentiator',
    difficulty: 'new-era',
    chapter_count: 8,
    est_minutes: 55,
    cover_color: '#1a0e2a',
    accent_color: '#a855f7',
    sort_order: 8,
  },
  {
    slug: 'product-sense',
    name: 'Product Sense',
    tagline: 'The thing they say you need. Now defined, demystified, learnable.',
    difficulty: 'entry-point',
    chapter_count: 7,
    est_minutes: 40,
    cover_color: '#1a2e1a',
    accent_color: '#4a7c59',
    sort_order: 9,
  },
]

// Chapter titles per module — used for mock data
export const LEARN_CHAPTERS_SEED: Record<string, { title: string; subtitle: string; hook_text: string }[]> = {
  flow: [
    { title: 'Why engineers think backwards', subtitle: 'How before why — the default engineer trap', hook_text: 'The best engineers jump to solutions instantly. In interviews, that kills you.' },
    { title: 'F — Frame', subtitle: 'Define before you solve', hook_text: 'A precise problem statement is worth more than ten solutions.' },
    { title: 'L — List', subtitle: 'Map the full solution space', hook_text: 'The first idea is never the best idea. List before you commit.' },
    { title: 'O — Optimize', subtitle: 'Weigh, don\'t guess', hook_text: 'Every trade-off has a right answer — if you name the criteria first.' },
    { title: 'W — Win', subtitle: 'Make a specific, defensible call', hook_text: 'Interviewers don\'t remember hedgers. They remember people who committed and showed their reasoning.' },
    { title: 'Anti-patterns', subtitle: 'What FLOW corrects', hook_text: 'Knowing the framework isn\'t enough. Know what it\'s saving you from.' },
    { title: 'FLOW in a real interview', subtitle: 'Full walkthrough', hook_text: 'Watch the framework close a real PM question from "I don\'t know where to start" to a confident answer.' },
  ],
  'user-models': [
    { title: 'Why engineers design for themselves', subtitle: 'And why it fails', hook_text: 'You are not the user. You\'re the worst possible proxy for the user.' },
    { title: 'Segment by behavior, not demographics', subtitle: 'The age-23-female fallacy', hook_text: 'Demographics describe people. Behavior predicts decisions.' },
    { title: 'Jobs to Be Done', subtitle: 'Functional, emotional, social', hook_text: 'Nobody buys a drill. They buy a hole. Nobody uses Instagram. They buy belonging.' },
    { title: 'Multi-sided markets', subtitle: 'The chicken-and-egg problem', hook_text: 'Your product has multiple users. Solving for one often breaks the other.' },
    { title: 'The Reach × Underservedness matrix', subtitle: 'Where to focus', hook_text: 'A segment that\'s large and ignored is a product waiting to be built.' },
    { title: 'Accessibility as product signal', subtitle: 'Not a checkbox', hook_text: 'Accessibility constraints surface the assumptions baked into your design.' },
    { title: 'Case: Spotify Wrapped', subtitle: 'The social job nobody spec\'d', hook_text: 'Spotify didn\'t plan Wrapped as a viral feature. They planned a summary. Users turned it into an identity signal.' },
  ],
  'root-cause': [
    { title: 'The engineer\'s superpower', subtitle: 'You already know how to debug', hook_text: 'The skill that makes you great at debugging systems is the same skill PM interviewers are testing. You just haven\'t applied it to products yet.' },
    { title: 'Symptoms vs. root causes', subtitle: '5 Whys, applied to products', hook_text: '"Users are churning" is not a problem. It\'s a symptom. The problem is three levels deeper.' },
    { title: 'Frequency × Severity × Underservedness', subtitle: 'The triage matrix', hook_text: 'Not all user problems are worth solving. Here\'s how to rank them.' },
    { title: 'Connecting problems to mission fit', subtitle: 'The filter interviewers use', hook_text: 'A real problem the company doesn\'t care about is still the wrong answer.' },
    { title: 'The problems users stop complaining about', subtitle: 'The Gmail story', hook_text: 'The most dangerous user problems are the ones they\'ve given up on.' },
    { title: 'Writing a crisp problem statement', subtitle: 'One sentence, no hedging', hook_text: 'If you can\'t write the problem in one sentence, you haven\'t understood it yet.' },
    { title: 'Case: When the bug you fixed wasn\'t the real problem', subtitle: 'Engineering gone wrong', hook_text: 'The team shipped a fix in 48 hours. Six weeks later, the metric hadn\'t moved. Here\'s why.' },
  ],
  'product-debug': [
    { title: 'DAU dropped 15%. Now what?', subtitle: 'The diagnostic loop', hook_text: 'Your first instinct will be wrong. The discipline is in the process, not the guess.' },
    { title: 'External vs. internal causes', subtitle: 'Seasonality, bugs, competitors', hook_text: 'Before you blame the product, check whether the world changed.' },
    { title: 'Funnel decomposition', subtitle: 'Where did users drop off?', hook_text: 'A metric drop has a location. Find it before you theorize about causes.' },
    { title: 'Cohort analysis', subtitle: 'New users or existing users?', hook_text: 'Same drop, two completely different root causes depending on which cohort is affected.' },
    { title: 'Instrumentation gaps', subtitle: 'The metric you can\'t see', hook_text: 'The worst kind of problem is one you can\'t measure. How to diagnose what\'s invisible.' },
    { title: 'Communicating findings', subtitle: 'Without overclaiming', hook_text: 'Data tells you what happened. It rarely tells you why. Know the difference before you present.' },
    { title: 'Case: Instagram feed change', subtitle: 'That tanked creator reach', hook_text: 'Instagram\'s algorithm shift looked like a bug from the outside. Inside, it was a deliberate call. Here\'s the diagnosis both sides missed.' },
  ],
  'north-star': [
    { title: 'Output metrics vs. outcome metrics', subtitle: 'Latency ≠ user value', hook_text: 'You can ship fast and still build the wrong thing. Output metrics make this invisible.' },
    { title: 'The North Star Metric framework', subtitle: 'One number that captures value', hook_text: 'A team that optimizes for the right number can make bad individual decisions and still win.' },
    { title: 'AARRR: Pirate metrics', subtitle: 'For the real world', hook_text: 'Acquisition. Activation. Retention. Referral. Revenue. The framework every PM knows — and most misapply.' },
    { title: 'Guardrail metrics', subtitle: 'Preventing dark patterns', hook_text: 'Every optimization has a dark side. Guardrails are the safeguards against winning the battle and losing the war.' },
    { title: 'When metrics lie', subtitle: 'Goodhart\'s Law', hook_text: 'When a measure becomes a target, it ceases to be a good measure.' },
    { title: 'Case: Netflix', subtitle: '$1B saved with one metric change', hook_text: 'Netflix stopped counting titles in the catalog. What they started measuring instead is a masterclass in North Star thinking.' },
    { title: 'Picking metrics in a PM interview', subtitle: 'What they\'re actually scoring', hook_text: 'Interviewers aren\'t checking if you know AARRR. They\'re checking whether your metric actually captures user value.' },
  ],
  'trade-offs': [
    { title: '"It depends" is not an answer', subtitle: 'Name what you\'re optimizing for', hook_text: 'Every experienced PM says "it depends." The best ones immediately say what it depends on.' },
    { title: 'RICE scoring', subtitle: 'Reach × Impact × Confidence ÷ Effort', hook_text: 'Prioritization frameworks don\'t make decisions for you. They force you to make your assumptions explicit.' },
    { title: 'The 2×2 impact-effort matrix', subtitle: 'A tool, not an answer', hook_text: 'Impact-effort is the most used framework in product. It\'s also the most abused.' },
    { title: 'The Naming Move', subtitle: '"We get X, we sacrifice Y, because Z"', hook_text: 'The most senior PMs don\'t hedge. They name the trade-off explicitly and own it.' },
    { title: 'Tech debt as a product decision', subtitle: 'Not just an engineering one', hook_text: 'Every time you defer a refactor, you\'re making a product bet. Most PMs don\'t know they\'re making it.' },
    { title: 'Brand, trust, and regulatory constraints', subtitle: 'What engineers miss', hook_text: 'The best idea technically is often the wrong idea commercially. Here\'s the checklist PMs carry.' },
    { title: 'Case: Spotify Wrapped', subtitle: 'Zero revenue, 100M shares, right call', hook_text: 'Spotify built a feature with no direct monetization path. The trade-off was obvious in hindsight. Here\'s how to see it in the moment.' },
  ],
  'growth-loops': [
    { title: 'Funnels vs. loops', subtitle: 'Why engineers get this intuitively', hook_text: 'A funnel is a pipeline. A loop is a recursive call. You already think in loops.' },
    { title: 'Acquisition, engagement, monetization loops', subtitle: 'The three archetypes', hook_text: 'Not every loop is a growth loop. Some just spin in place. Here\'s how to tell the difference.' },
    { title: 'Viral coefficient', subtitle: 'What makes a loop compound', hook_text: 'A viral coefficient > 1 means every user makes more than one user. That\'s exponential. Most products never get there — here\'s why.' },
    { title: 'Retention curves', subtitle: 'The "smile" vs. the flatline', hook_text: 'A flatline retention curve means you have a real product. A declining curve means you\'re buying users you can\'t keep.' },
    { title: 'Network effects as compounding loops', subtitle: 'When value grows with users', hook_text: 'Network effects are the hardest moat to build and the easiest to handwave. Here\'s how to distinguish real ones from fake.' },
    { title: 'When growth hacks kill the product', subtitle: 'Dark patterns in disguise', hook_text: 'Every dark pattern started as a growth experiment that worked. The question is what it cost.' },
    { title: 'Case: TikTok\'s algorithm as a growth loop', subtitle: 'The loop nobody designed', hook_text: 'TikTok\'s For You page isn\'t just a recommendation system. It\'s a perpetual retention loop. Here\'s the engineering.' },
  ],
  'ai-products': [
    { title: 'The spectrum: AI-assisted → AI-native', subtitle: 'Where your product sits', hook_text: 'AI-assisted is a feature. AI-native is a different product category entirely. Most builders are confused about which they\'re building.' },
    { title: 'When execution is cheap, judgment is expensive', subtitle: 'Shreyas Doshi\'s frame', hook_text: 'If AI can generate 100 options in seconds, the bottleneck is no longer execution. It\'s knowing which option is right.' },
    { title: 'Designing for agents', subtitle: 'New UX primitives', hook_text: 'Agents don\'t fill out forms. They don\'t wait for confirmation dialogs. UI built for humans breaks for agents.' },
    { title: 'Trust, safety, and the agentic loop', subtitle: 'The new product constraint', hook_text: 'Every agentic feature has a trust budget. Once spent, it\'s very hard to recover.' },
    { title: 'Accuracy vs. latency', subtitle: 'The MLE trade-off as product decision', hook_text: 'Is a 50ms response with 70% accuracy better than a 500ms response with 95% accuracy? The right answer depends entirely on the use case.' },
    { title: 'What makes an AI feature defensible?', subtitle: 'The moat question', hook_text: 'AI commoditizes execution. Data, feedback loops, and trust are the new moats.' },
    { title: 'Shadow mode, A/B, and eval design for AI features', subtitle: 'How to ship AI responsibly', hook_text: 'You can\'t A/B test your way to good AI. Evals are different from experiments. Here\'s the mental model.' },
    { title: 'Case: When agentic went wrong', subtitle: 'A product autopsy', hook_text: 'The feature worked exactly as designed. The problem was the design assumed a level of user trust that didn\'t exist.' },
  ],
  'product-sense': [
    { title: 'Engineers don\'t lack intuition', subtitle: 'They lack vocabulary', hook_text: 'You\'ve been making product decisions your entire career. You just didn\'t have the words for it.' },
    { title: 'The "how" vs. "why" mindset shift', subtitle: 'The single biggest unlock', hook_text: 'Engineers default to how. Product thinking starts with why. The shift is smaller than it sounds.' },
    { title: 'The 9 traits of a product-minded engineer', subtitle: 'Gergely Orosz\'s framework', hook_text: 'There\'s a name for engineers who think this way. Here\'s the map.' },
    { title: 'Why-First Check', subtitle: 'User impact, business viability, engineering sense', hook_text: 'Three filters. Every feature decision runs through all three. Most engineers only run one.' },
    { title: 'The 4 common failure modes', subtitle: 'In PM interviews', hook_text: 'Interviewers see the same four mistakes in every loop. Knowing them is the easiest edge you can get.' },
    { title: 'Framework recitation vs. actual thinking', subtitle: 'The trap the internet set', hook_text: 'Saying "I\'d use the RICE framework" is not an answer. It\'s the beginning of an answer that most people never finish.' },
    { title: 'How to build product reps', subtitle: 'Without switching roles', hook_text: 'You don\'t need a PM job to develop product sense. You need a deliberate practice habit.' },
  ],
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/learn-seed.ts
git commit -m "feat(learn): add module seed data with SVG cover art"
```

---

## Task 4: API Route — GET all modules (`/api/learn`)

**Files:**
- Create: `src/app/api/learn/route.ts`

- [ ] **Step 1: Create the directory**

Run: `mkdir -p src/app/api/learn`

- [ ] **Step 2: Write `src/app/api/learn/route.ts`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { LearnModule } from '@/lib/types'
import { LEARN_MODULES_SEED } from '@/lib/learn-seed'

const MOCK_MODULES: LearnModule[] = LEARN_MODULES_SEED.map((m, i) => ({
  ...m,
  id: `mock-module-${i + 1}`,
  created_at: new Date().toISOString(),
}))

export async function GET() {
  if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
    return NextResponse.json({ modules: MOCK_MODULES })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()
  const { data: modules, error } = await adminClient
    .from('learn_modules')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Attach progress counts
  const { data: progress } = await adminClient
    .from('user_learn_progress')
    .select('module_id')
    .eq('user_id', user.id)

  const completedByModule: Record<string, number> = {}
  for (const p of progress ?? []) {
    completedByModule[p.module_id] = (completedByModule[p.module_id] ?? 0) + 1
  }

  const modulesWithProgress = (modules ?? []).map((m: LearnModule) => ({
    ...m,
    completed_chapters: completedByModule[m.id] ?? 0,
    progress_percentage: m.chapter_count > 0
      ? Math.round(((completedByModule[m.id] ?? 0) / m.chapter_count) * 100)
      : 0,
  }))

  return NextResponse.json({ modules: modulesWithProgress })
}
```

- [ ] **Step 3: Verify TypeScript**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/learn/route.ts
git commit -m "feat(learn): add GET /api/learn route"
```

---

## Task 5: API Route — GET module detail (`/api/learn/[slug]`)

**Files:**
- Create: `src/app/api/learn/[slug]/route.ts`

- [ ] **Step 1: Create directory**

Run: `mkdir -p src/app/api/learn/\[slug\]`

- [ ] **Step 2: Write `src/app/api/learn/[slug]/route.ts`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { LearnModule, LearnChapter } from '@/lib/types'
import { LEARN_MODULES_SEED, LEARN_CHAPTERS_SEED } from '@/lib/learn-seed'

function buildMockModule(slug: string): { module: LearnModule; chapters: LearnChapter[] } | null {
  const seedModule = LEARN_MODULES_SEED.find(m => m.slug === slug)
  if (!seedModule) return null
  const module: LearnModule = { ...seedModule, id: `mock-${slug}`, created_at: new Date().toISOString() }
  const chapterDefs = LEARN_CHAPTERS_SEED[slug] ?? []
  const chapters: LearnChapter[] = chapterDefs.map((c, i) => ({
    id: `mock-${slug}-ch-${i + 1}`,
    module_id: module.id,
    slug: `chapter-${i + 1}`,
    title: c.title,
    subtitle: c.subtitle,
    sort_order: i + 1,
    hook_text: c.hook_text,
    body_mdx: `# ${c.title}\n\n${c.subtitle}\n\n*Full content coming soon.*`,
    created_at: new Date().toISOString(),
  }))
  return { module, chapters }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
    const mock = buildMockModule(slug)
    if (!mock) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(mock)
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()
  const { data: module, error: modError } = await adminClient
    .from('learn_modules')
    .select('*')
    .eq('slug', slug)
    .single()

  if (modError || !module) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: chapters, error: chapError } = await adminClient
    .from('learn_chapters')
    .select('*')
    .eq('module_id', module.id)
    .order('sort_order', { ascending: true })

  if (chapError) return NextResponse.json({ error: chapError.message }, { status: 500 })

  const { data: progress } = await adminClient
    .from('user_learn_progress')
    .select('chapter_id')
    .eq('user_id', user.id)
    .eq('module_id', module.id)

  const completedIds = new Set((progress ?? []).map((p: { chapter_id: string }) => p.chapter_id))

  const chaptersWithProgress = (chapters ?? []).map((ch: LearnChapter, i: number) => ({
    ...ch,
    is_completed: completedIds.has(ch.id),
    is_unlocked: i === 0 || completedIds.has((chapters ?? [])[i - 1]?.id),
  }))

  return NextResponse.json({ module, chapters: chaptersWithProgress })
}
```

- [ ] **Step 3: Verify TypeScript**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "src/app/api/learn/[slug]/route.ts"
git commit -m "feat(learn): add GET /api/learn/[slug] route"
```

---

## Task 6: API Routes — Chapter body + mark complete

**Files:**
- Create: `src/app/api/learn/[slug]/[chapter]/route.ts`
- Create: `src/app/api/learn/[slug]/[chapter]/complete/route.ts`

- [ ] **Step 1: Create directories**

Run: `mkdir -p "src/app/api/learn/[slug]/[chapter]/complete"`

- [ ] **Step 2: Write `src/app/api/learn/[slug]/[chapter]/route.ts`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { LEARN_MODULES_SEED, LEARN_CHAPTERS_SEED } from '@/lib/learn-seed'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string; chapter: string }> }
) {
  const { slug, chapter } = await params

  if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
    const seedModule = LEARN_MODULES_SEED.find(m => m.slug === slug)
    if (!seedModule) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const chapterDefs = LEARN_CHAPTERS_SEED[slug] ?? []
    const chapterIndex = parseInt(chapter.replace('chapter-', ''), 10) - 1
    const def = chapterDefs[chapterIndex]
    if (!def) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({
      id: `mock-${slug}-ch-${chapterIndex + 1}`,
      module_id: `mock-${slug}`,
      slug: chapter,
      title: def.title,
      subtitle: def.subtitle,
      sort_order: chapterIndex + 1,
      hook_text: def.hook_text,
      body_mdx: `# ${def.title}\n\n*${def.subtitle}*\n\n${def.hook_text}\n\n---\n\n*Full chapter content coming soon. This will be a long-form article with section anchors, inline illustrations, and real product case examples.*`,
      created_at: new Date().toISOString(),
    })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()
  const { data: mod } = await adminClient.from('learn_modules').select('id').eq('slug', slug).single()
  if (!mod) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: ch, error } = await adminClient
    .from('learn_chapters')
    .select('*')
    .eq('module_id', mod.id)
    .eq('slug', chapter)
    .single()

  if (error || !ch) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(ch)
}
```

- [ ] **Step 3: Write `src/app/api/learn/[slug]/[chapter]/complete/route.ts`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string; chapter: string }> }
) {
  const { slug, chapter } = await params

  if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
    return NextResponse.json({ ok: true })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()
  const { data: mod } = await adminClient.from('learn_modules').select('id').eq('slug', slug).single()
  if (!mod) return NextResponse.json({ error: 'Module not found' }, { status: 404 })

  const { data: ch } = await adminClient
    .from('learn_chapters')
    .select('id')
    .eq('module_id', mod.id)
    .eq('slug', chapter)
    .single()
  if (!ch) return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })

  const { error } = await adminClient
    .from('user_learn_progress')
    .upsert({
      user_id: user.id,
      module_id: mod.id,
      chapter_id: ch.id,
    }, { onConflict: 'user_id,chapter_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 4: Verify TypeScript**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add "src/app/api/learn/[slug]/[chapter]/route.ts" "src/app/api/learn/[slug]/[chapter]/complete/route.ts"
git commit -m "feat(learn): add chapter GET and mark-complete POST routes"
```

---

## Task 7: Client Hooks

**Files:**
- Create: `src/hooks/useLearnModules.ts`
- Create: `src/hooks/useLearnModule.ts`
- Create: `src/hooks/useLearnChapter.ts`

- [ ] **Step 1: Write `src/hooks/useLearnModules.ts`**

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import type { LearnModuleWithProgress } from '@/lib/types'

export function useLearnModules() {
  const [modules, setModules] = useState<LearnModuleWithProgress[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchModules = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/learn')
      if (!res.ok) throw new Error('Failed to fetch learn modules')
      const data = await res.json()
      setModules(data.modules ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchModules() }, [fetchModules])

  return { modules, isLoading, error }
}
```

- [ ] **Step 2: Write `src/hooks/useLearnModule.ts`**

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import type { LearnModule, LearnChapterWithProgress } from '@/lib/types'

interface LearnModuleData {
  module: LearnModule
  chapters: LearnChapterWithProgress[]
}

export function useLearnModule(slug: string) {
  const [data, setData] = useState<LearnModuleData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchModule = useCallback(async () => {
    if (!slug) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/learn/${slug}`)
      if (!res.ok) throw new Error('Module not found')
      const json = await res.json()
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [slug])

  useEffect(() => { fetchModule() }, [fetchModule])

  return { data, isLoading, error, refetch: fetchModule }
}
```

- [ ] **Step 3: Write `src/hooks/useLearnChapter.ts`**

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import type { LearnChapter } from '@/lib/types'

export function useLearnChapter(slug: string, chapter: string) {
  const [data, setData] = useState<LearnChapter | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMarkingComplete, setIsMarkingComplete] = useState(false)

  const fetchChapter = useCallback(async () => {
    if (!slug || !chapter) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/learn/${slug}/${chapter}`)
      if (!res.ok) throw new Error('Chapter not found')
      const json = await res.json()
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [slug, chapter])

  useEffect(() => { fetchChapter() }, [fetchChapter])

  const markComplete = useCallback(async () => {
    setIsMarkingComplete(true)
    try {
      await fetch(`/api/learn/${slug}/${chapter}/complete`, { method: 'POST' })
    } finally {
      setIsMarkingComplete(false)
    }
  }, [slug, chapter])

  return { data, isLoading, error, markComplete, isMarkingComplete }
}
```

- [ ] **Step 4: Verify TypeScript**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useLearnModules.ts src/hooks/useLearnModule.ts src/hooks/useLearnChapter.ts
git commit -m "feat(learn): add useLearnModules, useLearnModule, useLearnChapter hooks"
```

---

## Task 8: `/learn` Page — Module Grid

**Files:**
- Create: `src/app/(app)/learn/page.tsx`

The page renders a 3-column grid of module cards. Each card has:
- Cover band (~100px): dark `cover_color` background + inline SVG art + module name in white Literata
- Body: difficulty chip, chapter count chip, tagline, progress bar (if progress > 0), stats row (N/M done · ~X min)
- CTA: "Start →" or "Continue →"

- [ ] **Step 1: Create directory**

Run: `mkdir -p src/app/\(app\)/learn`

- [ ] **Step 2: Write `src/app/(app)/learn/page.tsx`**

```tsx
'use client'

import Link from 'next/link'
import { useLearnModules } from '@/hooks/useLearnModules'
import { MODULE_SVG_ART } from '@/lib/learn-seed'
import type { LearnModuleWithProgress, LearnDifficulty } from '@/lib/types'

const DIFFICULTY_LABELS: Record<LearnDifficulty, string> = {
  foundation: 'Foundation',
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  'new-era': 'New Era',
  'entry-point': 'Entry Point',
}

const DIFFICULTY_COLORS: Record<LearnDifficulty, string> = {
  foundation: 'bg-primary-container text-on-primary-container',
  beginner: 'bg-secondary-container text-on-secondary-container',
  intermediate: 'bg-tertiary-container text-on-tertiary-container',
  advanced: 'bg-error/10 text-error',
  'new-era': 'bg-[#a855f7]/10 text-[#7c3aed]',
  'entry-point': 'bg-primary-fixed text-on-surface',
}

function ModuleCard({ module }: { module: LearnModuleWithProgress }) {
  const svgArt = MODULE_SVG_ART[module.slug] ?? ''
  const hasSomeProgress = module.completed_chapters > 0
  const isComplete = module.completed_chapters >= module.chapter_count

  return (
    <Link href={`/learn/${module.slug}`} className="group block">
      <div className="bg-surface-container rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
        {/* Cover band */}
        <div
          className="relative h-[100px] overflow-hidden"
          style={{ backgroundColor: module.cover_color }}
        >
          {svgArt && (
            <div
              className="absolute inset-0 opacity-60"
              dangerouslySetInnerHTML={{ __html: svgArt }}
            />
          )}
          <div className="absolute inset-0 flex items-end p-4">
            <h3 className="font-headline text-xl font-bold text-white leading-tight">
              {module.name}
            </h3>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          {/* Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold font-label rounded-full px-2.5 py-0.5 ${DIFFICULTY_COLORS[module.difficulty]}`}>
              {DIFFICULTY_LABELS[module.difficulty]}
            </span>
            <span className="text-xs font-semibold font-label bg-surface-container-highest text-on-surface-variant rounded-full px-2.5 py-0.5">
              {module.chapter_count} chapters
            </span>
          </div>

          {/* Tagline */}
          <p className="text-sm text-on-surface-variant leading-snug line-clamp-2">
            {module.tagline}
          </p>

          {/* Progress bar */}
          {hasSomeProgress && (
            <div className="h-1.5 w-full rounded-full bg-surface-container-highest overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${module.progress_percentage}%`,
                  backgroundColor: module.accent_color,
                }}
              />
            </div>
          )}

          {/* Stats row + CTA */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-on-surface-variant font-label">
              {hasSomeProgress
                ? `${module.completed_chapters}/${module.chapter_count} done · ~${module.est_minutes} min`
                : `~${module.est_minutes} min`}
            </span>
            <span
              className="text-xs font-semibold font-label group-hover:underline"
              style={{ color: module.accent_color }}
            >
              {isComplete ? 'Review →' : hasSomeProgress ? 'Continue →' : 'Start →'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function LearnPage() {
  const { modules, isLoading, error } = useLearnModules()

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-headline text-3xl font-bold text-on-surface">Learn</h1>
        <p className="text-on-surface-variant mt-1">
          Build your mental models. Then apply them in Practice.
        </p>
      </div>

      {/* Module grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="bg-surface-container rounded-xl h-60 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-error text-sm">{error}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map(m => (
            <ModuleCard key={m.id} module={m} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(app)/learn/page.tsx"
git commit -m "feat(learn): add /learn module grid page"
```

---

## Task 9: `/learn/[slug]` Page — Module Detail

**Files:**
- Create: `src/app/(app)/learn/[slug]/page.tsx`

Layout: geometric hero banner (same SVG art, bigger, ~120px) + chapter accordion with sequential unlock + sidebar (progress ring + skills + next modules).

- [ ] **Step 1: Create directory**

Run: `mkdir -p "src/app/(app)/learn/[slug]"`

- [ ] **Step 2: Write `src/app/(app)/learn/[slug]/page.tsx`**

```tsx
'use client'

import { use } from 'react'
import Link from 'next/link'
import { useLearnModule } from '@/hooks/useLearnModule'
import { MODULE_SVG_ART, LEARN_MODULES_SEED } from '@/lib/learn-seed'
import type { LearnChapterWithProgress, LearnDifficulty } from '@/lib/types'

const DIFFICULTY_LABELS: Record<LearnDifficulty, string> = {
  foundation: 'Foundation',
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  'new-era': 'New Era',
  'entry-point': 'Entry Point',
}

function ChapterRow({
  chapter,
  moduleSlug,
  index,
}: {
  chapter: LearnChapterWithProgress
  moduleSlug: string
  index: number
}) {
  const locked = !chapter.is_unlocked && !chapter.is_completed

  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-xl transition-all ${
        locked
          ? 'opacity-50'
          : chapter.is_completed
          ? 'bg-primary-fixed/30'
          : 'bg-surface-container-high hover:bg-surface-container-highest'
      }`}
    >
      {/* Number circle */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-label ${
          chapter.is_completed
            ? 'bg-primary text-on-primary'
            : 'bg-surface-container-highest text-on-surface-variant'
        }`}
      >
        {chapter.is_completed ? (
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>check</span>
        ) : (
          index + 1
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className={`font-semibold font-label text-sm ${locked ? 'text-on-surface-variant' : 'text-on-surface'}`}>
              {chapter.title}
            </p>
            {chapter.subtitle && (
              <p className="text-xs text-on-surface-variant mt-0.5">{chapter.subtitle}</p>
            )}
          </div>
          {locked ? (
            <span className="material-symbols-outlined text-on-surface-variant text-lg flex-shrink-0">lock</span>
          ) : (
            <Link
              href={`/learn/${moduleSlug}/${chapter.slug}`}
              className="flex-shrink-0 text-xs font-semibold font-label text-primary bg-primary-container rounded-full px-3 py-1 hover:opacity-80 transition-opacity"
            >
              {chapter.is_completed ? 'Review' : 'Read'}
            </Link>
          )}
        </div>
        {/* Hook text preview — shown on unlocked chapters */}
        {!locked && chapter.hook_text && (
          <p className="text-xs text-on-surface-variant mt-2 italic leading-relaxed line-clamp-2">
            "{chapter.hook_text}"
          </p>
        )}
      </div>
    </div>
  )
}

export default function LearnModulePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const { data, isLoading, error } = useLearnModule(slug)

  const svgArt = MODULE_SVG_ART[slug] ?? ''
  const nextModules = LEARN_MODULES_SEED
    .filter(m => m.slug !== slug)
    .slice(0, 2)

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        <div className="h-32 rounded-2xl bg-surface-container animate-pulse" />
        <div className="h-64 rounded-xl bg-surface-container animate-pulse" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-error text-sm">{error ?? 'Module not found'}</p>
      </div>
    )
  }

  const { module, chapters } = data
  const completedCount = chapters.filter(c => c.is_completed).length
  const progressPct = module.chapter_count > 0
    ? Math.round((completedCount / module.chapter_count) * 100)
    : 0

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Back link */}
      <Link href="/learn" className="inline-flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface transition-colors">
        <span className="material-symbols-outlined text-base">arrow_back</span>
        All modules
      </Link>

      {/* Hero banner */}
      <div
        className="relative h-[130px] rounded-2xl overflow-hidden"
        style={{ backgroundColor: module.cover_color }}
      >
        {svgArt && (
          <div
            className="absolute inset-0 opacity-50"
            dangerouslySetInnerHTML={{ __html: svgArt }}
          />
        )}
        {/* Right-side gradient for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/30" />
        <div className="absolute inset-0 flex flex-col justify-end p-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white/70 text-xs font-label uppercase tracking-wider">
              {DIFFICULTY_LABELS[module.difficulty]}
            </span>
            <span className="text-white/50 text-xs">·</span>
            <span className="text-white/70 text-xs font-label">
              {module.chapter_count} chapters
            </span>
          </div>
          <h1 className="font-headline text-3xl font-bold text-white">{module.name}</h1>
          <p className="text-white/80 text-sm mt-1">{module.tagline}</p>
        </div>
      </div>

      {/* Main content + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">
        {/* Chapter list */}
        <div className="space-y-2">
          <h2 className="font-headline text-lg font-bold text-on-surface mb-4">Chapters</h2>
          {chapters.map((chapter, i) => (
            <ChapterRow
              key={chapter.id}
              chapter={chapter}
              moduleSlug={slug}
              index={i}
            />
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Progress ring card */}
          <div className="bg-surface-container rounded-xl p-4 space-y-3">
            <h3 className="font-label font-semibold text-sm text-on-surface">Your Progress</h3>
            <div className="flex items-center gap-4">
              {/* SVG progress ring */}
              <svg width="56" height="56" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="22" fill="none" stroke="#e4e0d8" strokeWidth="4" />
                <circle
                  cx="28" cy="28" r="22"
                  fill="none"
                  stroke={module.accent_color}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 22}`}
                  strokeDashoffset={`${2 * Math.PI * 22 * (1 - progressPct / 100)}`}
                  transform="rotate(-90 28 28)"
                />
                <text x="28" y="33" textAnchor="middle" fill="#2e3230" fontSize="13" fontWeight="700" fontFamily="sans-serif">
                  {progressPct}%
                </text>
              </svg>
              <div>
                <p className="font-label font-semibold text-on-surface text-sm">
                  {completedCount} / {module.chapter_count}
                </p>
                <p className="text-xs text-on-surface-variant">chapters done</p>
              </div>
            </div>
          </div>

          {/* After this module */}
          <div className="bg-surface-container rounded-xl p-4 space-y-3">
            <h3 className="font-label font-semibold text-sm text-on-surface">After this module</h3>
            <div className="space-y-2">
              {nextModules.map(nm => (
                <Link
                  key={nm.slug}
                  href={`/learn/${nm.slug}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-container-high transition-colors"
                >
                  <div
                    className="w-6 h-6 rounded-md flex-shrink-0"
                    style={{ backgroundColor: nm.cover_color }}
                  />
                  <span className="text-sm font-label font-medium text-on-surface truncate">{nm.name}</span>
                  <span className="material-symbols-outlined text-on-surface-variant text-sm ml-auto">arrow_forward</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(app)/learn/[slug]/page.tsx"
git commit -m "feat(learn): add /learn/[slug] module detail page"
```

---

## Task 10: `/learn/[slug]/[chapter]` Page — Chapter Reading View

**Files:**
- Create: `src/app/(app)/learn/[slug]/[chapter]/page.tsx`

Layout: hook card (provocative opener in large Literata type, dark background) → scrollable article body (MDX rendered as HTML).

- [ ] **Step 1: Create directory**

Run: `mkdir -p "src/app/(app)/learn/[slug]/[chapter]"`

- [ ] **Step 2: Write `src/app/(app)/learn/[slug]/[chapter]/page.tsx`**

```tsx
'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { useLearnChapter } from '@/hooks/useLearnChapter'
import { useLearnModule } from '@/hooks/useLearnModule'

function renderMdx(mdx: string): string {
  // Minimal markdown → HTML conversion for body_mdx field.
  // Headings, bold, italic, horizontal rule, paragraphs.
  return mdx
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^---$/gm, '<hr/>')
    .split('\n\n')
    .map(block => {
      if (block.startsWith('<h') || block.startsWith('<hr')) return block
      return `<p>${block.trim()}</p>`
    })
    .join('\n')
}

export default function LearnChapterPage({
  params,
}: {
  params: Promise<{ slug: string; chapter: string }>
}) {
  const { slug, chapter } = use(params)
  const { data, isLoading, error, markComplete, isMarkingComplete } = useLearnChapter(slug, chapter)
  const { data: moduleData } = useLearnModule(slug)
  const [markedDone, setMarkedDone] = useState(false)

  const handleMarkComplete = async () => {
    await markComplete()
    setMarkedDone(true)
  }

  // Find next chapter
  const chapters = moduleData?.chapters ?? []
  const currentIndex = chapters.findIndex(c => c.slug === chapter)
  const nextChapter = chapters[currentIndex + 1]

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        <div className="h-40 rounded-2xl bg-surface-container animate-pulse" />
        <div className="h-96 rounded-xl bg-surface-container animate-pulse" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <p className="text-error text-sm">{error ?? 'Chapter not found'}</p>
      </div>
    )
  }

  const moduleAccentColor = moduleData?.module.accent_color ?? '#4a7c59'
  const moduleCoverColor = moduleData?.module.cover_color ?? '#1a3a2a'

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      {/* Back link */}
      <Link
        href={`/learn/${slug}`}
        className="inline-flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        {moduleData?.module.name ?? 'Back'}
      </Link>

      {/* Hook card */}
      <div
        className="rounded-2xl p-8 space-y-3"
        style={{ backgroundColor: moduleCoverColor }}
      >
        <p className="text-white/60 text-xs font-label uppercase tracking-widest">
          Chapter {data.sort_order} · {data.subtitle}
        </p>
        <h1 className="font-headline text-2xl font-bold text-white leading-snug">
          {data.title}
        </h1>
        {data.hook_text && (
          <p
            className="text-lg leading-relaxed font-headline mt-4"
            style={{ color: moduleAccentColor === '#4a7c59' ? '#8ecf9e' : 'rgba(255,255,255,0.85)' }}
          >
            {data.hook_text}
          </p>
        )}
      </div>

      {/* Article body */}
      <div
        className="prose prose-sm max-w-none text-on-surface
          [&_h1]:font-headline [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-on-surface [&_h1]:mt-8 [&_h1]:mb-3
          [&_h2]:font-headline [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-on-surface [&_h2]:mt-6 [&_h2]:mb-2
          [&_h3]:font-label [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-on-surface [&_h3]:mt-5 [&_h3]:mb-1
          [&_p]:text-on-surface-variant [&_p]:leading-relaxed [&_p]:mb-4
          [&_strong]:text-on-surface [&_strong]:font-semibold
          [&_em]:italic
          [&_hr]:border-outline-variant [&_hr]:my-6"
        dangerouslySetInnerHTML={{ __html: renderMdx(data.body_mdx) }}
      />

      {/* Bottom actions */}
      <div className="flex items-center justify-between pt-4 border-t border-outline-variant">
        {!markedDone ? (
          <button
            onClick={handleMarkComplete}
            disabled={isMarkingComplete}
            className="inline-flex items-center gap-2 bg-primary text-on-primary rounded-full px-5 py-2.5 text-sm font-semibold font-label hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>check_circle</span>
            {isMarkingComplete ? 'Saving...' : 'Mark complete'}
          </button>
        ) : (
          <div className="inline-flex items-center gap-2 text-primary text-sm font-semibold font-label">
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>check_circle</span>
            Done!
          </div>
        )}

        {nextChapter && nextChapter.is_unlocked && (
          <Link
            href={`/learn/${slug}/${nextChapter.slug}`}
            className="inline-flex items-center gap-2 text-sm font-semibold font-label rounded-full px-5 py-2.5 bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors"
          >
            Next chapter
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </Link>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(app)/learn/[slug]/[chapter]/page.tsx"
git commit -m "feat(learn): add /learn/[slug]/[chapter] reading view"
```

---

## Task 11: Nav Integration — NavRail + BottomTabs

**Files:**
- Modify: `src/components/shell/NavRail.tsx` — insert Learn between Explore and Practice
- Modify: `src/components/shell/BottomTabs.tsx` — insert Learn between Explore and Practice

- [ ] **Step 1: Edit `src/components/shell/NavRail.tsx`**

Replace the navItems array (lines 6–12):

```typescript
const navItems = [
  { href: '/dashboard', icon: 'home', label: 'Home' },
  { href: '/explore', icon: 'explore', label: 'Explore' },
  { href: '/learn', icon: 'auto_stories', label: 'Learn' },
  { href: '/challenges', icon: 'fitness_center', label: 'Practice' },
  { href: '/prep', icon: 'workspace_premium', label: 'Prep' },
  { href: '/progress', icon: 'bar_chart', label: 'Progress' },
]
```

- [ ] **Step 2: Edit `src/components/shell/BottomTabs.tsx`**

Replace the tabs array (lines 5–11). Note: BottomTabs has 5 slots (Home, Explore, Practice, Prep, Profile). Drop Prep to add Learn — it's accessible via the Prep tab hierarchy; Learn is more primary.

```typescript
const tabs = [
  { href: '/dashboard', icon: 'home', label: 'Home' },
  { href: '/explore', icon: 'explore', label: 'Explore' },
  { href: '/learn', icon: 'auto_stories', label: 'Learn' },
  { href: '/challenges', icon: 'fitness_center', label: 'Practice' },
  { href: '/profile', icon: 'person', label: 'Profile' },
]
```

- [ ] **Step 3: Verify TypeScript**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: no errors.

- [ ] **Step 4: Run the dev server and manually verify**

Run: `npm run dev` (background)

Navigate to `http://localhost:3000` and confirm:
- "Learn" appears in the left nav between Explore and Practice with the `auto_stories` icon
- "Learn" appears in the bottom tabs on mobile viewport
- Active state (filled icon + `bg-primary-container`) triggers when on `/learn/*` routes

- [ ] **Step 5: Commit**

```bash
git add src/components/shell/NavRail.tsx src/components/shell/BottomTabs.tsx
git commit -m "feat(learn): add Learn to NavRail and BottomTabs"
```

---

## Task 12: Build Validation

**Files:** None created — validation only.

- [ ] **Step 1: Full TypeScript check**

Run: `npx tsc --noEmit 2>&1`
Expected: No errors. Pre-existing Deno errors in `supabase/functions/` are acceptable.

- [ ] **Step 2: ESLint**

Run: `npm run lint 2>&1 | head -40`
Expected: No new errors (pre-existing warnings acceptable).

- [ ] **Step 3: Production build**

Run: `npm run build 2>&1 | tail -30`
Expected: Build completes successfully with no errors.

- [ ] **Step 4: Smoke test routes**

With `NEXT_PUBLIC_MOCK_MODE=true npm run dev` running:
- `http://localhost:3000/learn` — renders 9 module cards
- `http://localhost:3000/learn/flow` — renders FLOW detail page with 7 chapters, first chapter unlocked
- `http://localhost:3000/learn/flow/chapter-1` — renders hook card + article body + "Mark complete" button
- Nav: Learn appears between Explore and Practice

- [ ] **Step 5: Final commit**

```bash
git commit --allow-empty -m "feat(learn): learn section complete — modules, chapters, nav integration"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task that covers it |
|---|---|
| 9 modules with name, tagline, difficulty, chapters, est_minutes, colors | Task 3 (seed data) |
| Geometric SVG cover art per module | Task 3 (MODULE_SVG_ART) |
| `learn_modules`, `learn_chapters`, `user_learn_progress` tables | Task 2 (migration) |
| TypeScript types for all 3 tables | Task 1 |
| API: GET all modules with progress | Task 4 |
| API: GET module + chapters with unlock state | Task 5 |
| API: GET chapter body | Task 6 |
| API: POST mark chapter complete | Task 6 |
| Client hooks: useLearnModules, useLearnModule, useLearnChapter | Task 7 |
| `/learn` module grid with cover band + chips + progress bar | Task 8 |
| `/learn/[slug]` hero + chapter accordion + sidebar | Task 9 |
| `/learn/[slug]/[chapter]` hook card + article + mark complete | Task 10 |
| Sequential chapter unlock (N unlocks after N-1) | Tasks 5, 9, 10 |
| Nav: `auto_stories` icon between Explore and Practice | Task 11 |
| Mock fallback (no DB required for dev) | Tasks 4, 5, 6 |

No gaps found.

**Placeholder scan:** No TBD or TODO in any code block. All functions defined before use.

**Type consistency:** `LearnChapterWithProgress` (defined in Task 1) used in Tasks 5, 7, 9. `LearnModuleWithProgress` (Task 1) used in Tasks 4, 7, 8. `MODULE_SVG_ART` (Task 3) used in Tasks 8, 9. All consistent.

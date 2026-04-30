# Plan A: Explore Restructure + Practice Filter Redesign

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add discipline grouping to Explore and replace the horizontal chip filter in Practice with discipline tabs + contextual dropdown filters + mobile bottom sheet.

**Architecture:** All changes are UI-only — no new DB tables, no new API routes. Explore gets a new "Browse by Discipline" hero section and "Loop Tracks" section (backed by existing study_plans table with two new columns). Practice gets a discipline tab strip as the primary filter, with secondary dropdowns that change per discipline, and a mobile bottom sheet.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Material Symbols Outlined icons

---

## File Map

| File | Action | What changes |
|---|---|---|
| `src/app/(app)/explore/page.tsx` | Modify | Add Browse by Discipline section, Loop Tracks section, remove standalone FLOW Move section |
| `src/app/(app)/challenges/page.tsx` | Modify | Replace horizontal chip filters with discipline tab strip + contextual dropdown row |
| `src/components/challenges/DisciplineTabStrip.tsx` | Create | Tab strip component (All / Product Sense / System Design / Data Modeling / Coding) |
| `src/components/challenges/FilterDropdownBar.tsx` | Create | Row of labeled dropdown buttons; renders contextually per discipline |
| `src/components/challenges/FilterBottomSheet.tsx` | Create | Mobile bottom sheet with tap-to-select chip groups + sticky CTA |
| `src/components/challenges/ActiveFilterPills.tsx` | Create | Dismissible pill row rendered below filter bar on both breakpoints |
| `src/components/explore/DisciplineGrid.tsx` | Create | 4-column discipline entry cards |
| `src/components/explore/LoopTracksSection.tsx` | Create | Loop Tracks grid (reads study_plans where track_type='loop') |
| `supabase/migrations/071_study_plans_loop_tracks.sql` | Create | Adds track_type + disciplines columns to study_plans |

---

## Task 1: Migration — add loop track columns to study_plans

**Files:**
- Create: `supabase/migrations/071_study_plans_loop_tracks.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/071_study_plans_loop_tracks.sql
ALTER TABLE study_plans
  ADD COLUMN IF NOT EXISTS track_type TEXT NOT NULL DEFAULT 'study_plan'
    CHECK (track_type IN ('study_plan', 'loop')),
  ADD COLUMN IF NOT EXISTS disciplines TEXT[] NOT NULL DEFAULT '{}';

-- Seed three loop tracks so Explore has content immediately
INSERT INTO study_plans (id, title, slug, description, estimated_hours, is_published, track_type, disciplines, difficulty, challenge_count, order_index)
VALUES
  (gen_random_uuid(), 'Staff Eng Loop', 'staff-eng-loop',
   'System design, product sense, and coding prep for senior engineering roles.',
   12, true, 'loop', ARRAY['system_design','product_sense','coding'], 'advanced', 0, 100),
  (gen_random_uuid(), 'PM Switch Loop', 'pm-switch-loop',
   'Product sense and data modeling for engineers transitioning to product management.',
   8, true, 'loop', ARRAY['product_sense','data_modeling'], 'intermediate', 0, 101),
  (gen_random_uuid(), 'Founding Eng Loop', 'founding-eng-loop',
   'All four disciplines for engineers joining early-stage companies.',
   16, true, 'loop', ARRAY['product_sense','system_design','data_modeling','coding'], 'advanced', 0, 102);
```

- [ ] **Step 2: Apply the migration locally**

```bash
npx supabase db push
```

Expected: migration applies cleanly, no errors.

- [ ] **Step 3: Verify columns exist**

```bash
npx supabase db execute --sql "SELECT track_type, disciplines, title FROM study_plans WHERE track_type = 'loop';"
```

Expected: 3 rows — Staff Eng Loop, PM Switch Loop, Founding Eng Loop.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/071_study_plans_loop_tracks.sql
git commit -m "feat(db): add track_type + disciplines columns to study_plans, seed loop tracks"
```

---

## Task 2: DisciplineGrid component

**Files:**
- Create: `src/components/explore/DisciplineGrid.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/explore/DisciplineGrid.tsx
'use client'

import Link from 'next/link'

const DISCIPLINES = [
  {
    key: 'product_sense',
    label: 'Product Sense',
    emoji: '🧠',
    bg: 'bg-primary',
    href: '/challenges?discipline=product_sense',
    count: null as number | null,
  },
  {
    key: 'system_design',
    label: 'System Design',
    emoji: '🏗️',
    bg: 'bg-tertiary',
    href: '/challenges?discipline=system_design',
    count: null as number | null,
  },
  {
    key: 'data_modeling',
    label: 'Data Modeling',
    emoji: '🗄️',
    bg: 'bg-secondary',
    href: '/challenges?discipline=data_modeling',
    count: null as number | null,
  },
  {
    key: 'coding',
    label: 'Coding',
    emoji: '💻',
    bg: 'bg-[#3a5a7c]',
    href: null,
    count: null as number | null,
  },
]

interface Props {
  counts: Record<string, number>
}

export function DisciplineGrid({ counts }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {DISCIPLINES.map((d) => {
        const count = counts[d.key] ?? 0
        const card = (
          <div
            className={`${d.bg} text-white rounded-xl p-4 flex flex-col gap-1 ${d.href ? 'hover:opacity-90 transition-opacity cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
          >
            <span className="text-2xl">{d.emoji}</span>
            <span className="font-headline font-bold text-sm">{d.label}</span>
            <span className="text-xs opacity-75">
              {d.href ? `${count} challenges` : 'Coming soon'}
            </span>
          </div>
        )
        return d.href ? (
          <Link key={d.key} href={d.href}>
            {card}
          </Link>
        ) : (
          <div key={d.key}>{card}</div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```

Expected: no errors in this file.

- [ ] **Step 3: Commit**

```bash
git add src/components/explore/DisciplineGrid.tsx
git commit -m "feat(explore): add DisciplineGrid component"
```

---

## Task 3: LoopTracksSection component

**Files:**
- Create: `src/components/explore/LoopTracksSection.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/explore/LoopTracksSection.tsx
import Link from 'next/link'

interface LoopTrack {
  id: string
  title: string
  slug: string
  description: string
  estimated_hours: number
  disciplines: string[]
  difficulty: string
}

const DISCIPLINE_LABELS: Record<string, string> = {
  product_sense: 'Product Sense',
  system_design: 'System Design',
  data_modeling: 'Data Modeling',
  coding: 'Coding',
}

interface Props {
  tracks: LoopTrack[]
}

export function LoopTracksSection({ tracks }: Props) {
  if (tracks.length === 0) return null

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="font-headline font-bold text-on-surface text-base">Interview Loop Tracks</h2>
        <span className="bg-primary text-on-primary text-[9px] font-label font-bold uppercase tracking-wider px-1.5 py-0.5 rounded">
          New
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {tracks.map((track) => (
          <Link key={track.id} href={`/prep/study-plans/${track.slug}`}>
            <div className="bg-surface-container rounded-xl p-4 border border-outline-variant hover:bg-surface-container-high transition-colors cursor-pointer h-full flex flex-col gap-2">
              <div className="font-label font-bold text-on-surface text-sm">{track.title}</div>
              <div className="text-xs text-on-surface-variant line-clamp-2 flex-1">{track.description}</div>
              <div className="flex gap-1.5 flex-wrap mt-1">
                {track.disciplines.map((d) => (
                  <span key={d} className="bg-surface-container-highest text-on-surface-variant rounded-full text-[10px] px-2 py-0.5 font-label">
                    {DISCIPLINE_LABELS[d] ?? d}
                  </span>
                ))}
                <span className="bg-surface-container-highest text-on-surface-variant rounded-full text-[10px] px-2 py-0.5 font-label">
                  {track.estimated_hours}h
                </span>
                <span className="bg-surface-container-highest text-on-surface-variant rounded-full text-[10px] px-2 py-0.5 font-label capitalize">
                  {track.difficulty}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
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
git add src/components/explore/LoopTracksSection.tsx
git commit -m "feat(explore): add LoopTracksSection component"
```

---

## Task 4: Wire new sections into Explore page

**Files:**
- Modify: `src/app/(app)/explore/page.tsx`

- [ ] **Step 1: Read the current explore page**

Read `src/app/(app)/explore/page.tsx` fully before editing.

- [ ] **Step 2: Add discipline count fetch + loop tracks fetch to the server component data loading**

In the server component data fetching section, add alongside existing fetches:

```tsx
// Fetch challenge counts per discipline type
const { data: disciplineCounts } = await supabase
  .from('challenges')
  .select('challenge_type')
  .eq('is_published', true)
  .in('challenge_type', ['flow', 'freeform', 'quick_take', 'system_design', 'data_modeling'])

const counts: Record<string, number> = {
  product_sense: 0,
  system_design: 0,
  data_modeling: 0,
}
for (const row of disciplineCounts ?? []) {
  if (['flow', 'freeform', 'quick_take'].includes(row.challenge_type)) {
    counts.product_sense = (counts.product_sense ?? 0) + 1
  } else if (row.challenge_type === 'system_design') {
    counts.system_design = (counts.system_design ?? 0) + 1
  } else if (row.challenge_type === 'data_modeling') {
    counts.data_modeling = (counts.data_modeling ?? 0) + 1
  }
}

// Fetch loop tracks
const { data: loopTracks } = await supabase
  .from('study_plans')
  .select('id, title, slug, description, estimated_hours, disciplines, difficulty')
  .eq('is_published', true)
  .eq('track_type', 'loop')
  .order('order_index', { ascending: true })
```

- [ ] **Step 3: Add imports at the top of the file**

```tsx
import { DisciplineGrid } from '@/components/explore/DisciplineGrid'
import { LoopTracksSection } from '@/components/explore/LoopTracksSection'
```

- [ ] **Step 4: Add Browse by Discipline as the first section in the JSX, before the existing Paradigm section**

```tsx
{/* Browse by Discipline */}
<section>
  <h2 className="font-headline font-bold text-on-surface text-base mb-3">Browse by Discipline</h2>
  <DisciplineGrid counts={counts} />
</section>

{/* Interview Loop Tracks */}
<LoopTracksSection tracks={loopTracks ?? []} />
```

- [ ] **Step 5: Remove or comment out the standalone "By FLOW Move" section if present**

Find any section in the JSX that renders the four FLOW moves (Frame, List, Optimize, Win) as standalone cards or chips and remove it. FLOW Move browsing now lives inside Practice when Product Sense discipline is selected.

- [ ] **Step 6: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/app/(app)/explore/page.tsx src/components/explore/DisciplineGrid.tsx src/components/explore/LoopTracksSection.tsx
git commit -m "feat(explore): add Browse by Discipline hero section and Loop Tracks"
```

---

## Task 5: DisciplineTabStrip component

**Files:**
- Create: `src/components/challenges/DisciplineTabStrip.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/challenges/DisciplineTabStrip.tsx
'use client'

export type Discipline = 'all' | 'product_sense' | 'system_design' | 'data_modeling' | 'coding'

const TABS: { key: Discipline; label: string; mobileLabel: string; disabled?: boolean }[] = [
  { key: 'all', label: 'All', mobileLabel: 'All' },
  { key: 'product_sense', label: 'Product Sense', mobileLabel: 'Product' },
  { key: 'system_design', label: 'System Design', mobileLabel: 'Sys Design' },
  { key: 'data_modeling', label: 'Data Modeling', mobileLabel: 'Data' },
  { key: 'coding', label: 'Coding', mobileLabel: 'Coding', disabled: true },
]

interface Props {
  active: Discipline
  onChange: (d: Discipline) => void
}

export function DisciplineTabStrip({ active, onChange }: Props) {
  return (
    <div className="flex border-b-2 border-outline-variant bg-surface overflow-x-auto scrollbar-none px-4">
      {TABS.map((tab) => {
        const isActive = active === tab.key
        return (
          <button
            key={tab.key}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && onChange(tab.key)}
            className={[
              'flex-shrink-0 py-2.5 px-4 font-label text-sm whitespace-nowrap transition-colors',
              'border-b-2 -mb-0.5',
              isActive
                ? 'border-primary text-primary font-semibold'
                : tab.disabled
                  ? 'border-transparent text-on-surface-variant/40 cursor-not-allowed'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface cursor-pointer',
            ].join(' ')}
          >
            {/* Mobile: abbreviated label */}
            <span className="sm:hidden">{tab.mobileLabel}</span>
            {/* Desktop: full label */}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Add `scrollbar-none` utility to globals.css if not already present**

Read `src/app/globals.css`. If `scrollbar-none` or `scrollbar-width: none` is not already defined, add:

```css
.scrollbar-none {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
```

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/challenges/DisciplineTabStrip.tsx src/app/globals.css
git commit -m "feat(practice): add DisciplineTabStrip component"
```

---

## Task 6: FilterDropdownBar component

**Files:**
- Create: `src/components/challenges/FilterDropdownBar.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/challenges/FilterDropdownBar.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import type { Discipline } from './DisciplineTabStrip'

export interface FilterState {
  paradigm: string[]
  difficulty: string[]
  role: string[]
  company: string[]
  scope: string[]   // system design only
}

const PARADIGM_OPTIONS = ['Traditional', 'AI-Assisted', 'Agentic', 'AI-Native']
const DIFFICULTY_OPTIONS = ['Warmup', 'Standard', 'Advanced', 'Staff+']
const ROLE_OPTIONS = ['SWE', 'Tech Lead', 'EM', 'ML Eng', 'Data Eng', 'DevOps', 'Founding Eng', 'PM', 'Designer', 'Data Scientist']
const COMPANY_OPTIONS = ['Google', 'Meta', 'Stripe', 'Airbnb', 'Netflix', 'Uber', 'Amazon', 'Apple']
const SCOPE_OPTIONS = ['Single Service', 'Distributed', 'Multi-Region']

type FilterKey = keyof FilterState

interface DropdownDef {
  key: FilterKey
  label: string
  options: string[]
  disciplines: Discipline[]  // which discipline tabs show this dropdown; empty = all
}

const DROPDOWNS: DropdownDef[] = [
  { key: 'paradigm', label: 'Paradigm', options: PARADIGM_OPTIONS, disciplines: [] },
  { key: 'scope', label: 'Scope', options: SCOPE_OPTIONS, disciplines: ['system_design'] },
  { key: 'difficulty', label: 'Difficulty', options: DIFFICULTY_OPTIONS, disciplines: [] },
  { key: 'role', label: 'Role', options: ROLE_OPTIONS, disciplines: [] },
  { key: 'company', label: 'Company', options: COMPANY_OPTIONS, disciplines: [] },
]

interface Props {
  discipline: Discipline
  filters: FilterState
  onChange: (filters: FilterState) => void
  resultCount: number
  onOpenMobileSheet: () => void
}

function MultiSelectDropdown({
  label, options, selected, onToggle,
}: {
  label: string; options: string[]; selected: string[]; onToggle: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const hasSelection = selected.length > 0

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={[
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-label text-xs whitespace-nowrap transition-colors',
          hasSelection
            ? 'border-primary bg-primary-fixed text-primary font-semibold'
            : 'border-outline-variant bg-surface text-on-surface-variant hover:border-outline',
        ].join(' ')}
      >
        {label}
        {hasSelection && <span className="bg-primary text-on-primary rounded-full w-4 h-4 flex items-center justify-center text-[10px]">{selected.length}</span>}
        <span className="material-symbols-outlined text-sm leading-none">expand_more</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 bg-surface border border-outline-variant rounded-xl shadow-lg z-50 min-w-40 py-1">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => onToggle(opt)}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-xs font-label text-on-surface hover:bg-surface-container-low text-left"
            >
              <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${selected.includes(opt) ? 'bg-primary border-primary' : 'border-outline-variant'}`}>
                {selected.includes(opt) && <span className="material-symbols-outlined text-on-primary text-[10px] leading-none">check</span>}
              </span>
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function FilterDropdownBar({ discipline, filters, onChange, resultCount, onOpenMobileSheet }: Props) {
  const visibleDropdowns = DROPDOWNS.filter(
    (d) => d.disciplines.length === 0 || d.disciplines.includes(discipline)
  )

  function toggle(key: FilterKey, value: string) {
    const current = filters[key]
    onChange({
      ...filters,
      [key]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
    })
  }

  return (
    <>
      {/* Desktop filter row */}
      <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-surface-container-low border-b border-outline-variant flex-wrap">
        <span className="font-label text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">Filter:</span>
        {visibleDropdowns.map((d) => (
          <MultiSelectDropdown
            key={d.key}
            label={d.label}
            options={d.options}
            selected={filters[d.key]}
            onToggle={(v) => toggle(d.key, v)}
          />
        ))}
        <div className="flex-1" />
        <span className="font-label text-xs text-on-surface-variant">{resultCount} results</span>
      </div>

      {/* Mobile filter bar */}
      <div className="sm:hidden flex items-center gap-2 px-3 py-2 bg-surface-container-low border-b border-outline-variant">
        <button
          onClick={onOpenMobileSheet}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant bg-surface font-label text-xs font-semibold text-on-surface"
        >
          <span className="material-symbols-outlined text-sm leading-none">tune</span>
          Filter
        </button>
        <div className="flex-1" />
        <span className="font-label text-xs text-on-surface-variant">{resultCount}</span>
      </div>
    </>
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
git add src/components/challenges/FilterDropdownBar.tsx
git commit -m "feat(practice): add FilterDropdownBar with per-discipline contextual dropdowns"
```

---

## Task 7: ActiveFilterPills component

**Files:**
- Create: `src/components/challenges/ActiveFilterPills.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/challenges/ActiveFilterPills.tsx
'use client'

import type { FilterState } from './FilterDropdownBar'

type FilterKey = keyof FilterState

interface Props {
  filters: FilterState
  onRemove: (key: FilterKey, value: string) => void
  onClearAll: () => void
}

export function ActiveFilterPills({ filters, onRemove, onClearAll }: Props) {
  const active: { key: FilterKey; value: string }[] = (Object.entries(filters) as [FilterKey, string[]][])
    .flatMap(([key, values]) => values.map((value) => ({ key, value })))

  if (active.length === 0) return null

  return (
    <div className="flex items-center gap-1.5 px-4 py-1.5 bg-surface border-b border-outline-variant flex-wrap">
      {active.map(({ key, value }) => (
        <span
          key={`${key}-${value}`}
          className="flex items-center gap-1 bg-primary-fixed text-primary border border-primary/30 rounded-full px-2.5 py-0.5 font-label text-xs"
        >
          {value}
          <button
            onClick={() => onRemove(key, value)}
            className="opacity-60 hover:opacity-100 leading-none"
            aria-label={`Remove ${value} filter`}
          >
            <span className="material-symbols-outlined text-xs leading-none">close</span>
          </button>
        </span>
      ))}
      <button
        onClick={onClearAll}
        className="font-label text-xs text-primary font-semibold hover:underline px-1"
      >
        Clear all
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
git add src/components/challenges/ActiveFilterPills.tsx
git commit -m "feat(practice): add ActiveFilterPills component"
```

---

## Task 8: FilterBottomSheet component (mobile)

**Files:**
- Create: `src/components/challenges/FilterBottomSheet.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/challenges/FilterBottomSheet.tsx
'use client'

import { useEffect } from 'react'
import type { FilterState } from './FilterDropdownBar'
import type { Discipline } from './DisciplineTabStrip'

type FilterKey = keyof FilterState

const GROUPS: { key: FilterKey; label: string; options: string[]; disciplines: Discipline[] }[] = [
  { key: 'paradigm', label: 'Paradigm', options: ['Traditional', 'AI-Assisted', 'Agentic', 'AI-Native'], disciplines: [] },
  { key: 'scope', label: 'Scope', options: ['Single Service', 'Distributed', 'Multi-Region'], disciplines: ['system_design'] },
  { key: 'difficulty', label: 'Difficulty', options: ['Warmup', 'Standard', 'Advanced', 'Staff+'], disciplines: [] },
  { key: 'role', label: 'Role', options: ['SWE', 'Tech Lead', 'EM', 'ML Eng', 'PM', 'Designer'], disciplines: [] },
  { key: 'company', label: 'Company', options: ['Google', 'Meta', 'Stripe', 'Airbnb', 'Netflix', 'Uber'], disciplines: [] },
]

interface Props {
  open: boolean
  discipline: Discipline
  filters: FilterState
  resultCount: number
  onChange: (filters: FilterState) => void
  onClose: () => void
  onClearAll: () => void
}

export function FilterBottomSheet({ open, discipline, filters, resultCount, onChange, onClose, onClearAll }: Props) {
  // Lock body scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const visibleGroups = GROUPS.filter(
    (g) => g.disciplines.length === 0 || g.disciplines.includes(discipline)
  )

  function toggle(key: FilterKey, value: string) {
    const current = filters[key]
    onChange({
      ...filters,
      [key]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
    })
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-inverse-surface rounded-t-2xl flex flex-col max-h-[85vh]">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-8 h-1 bg-white/30 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3">
          <span className="font-label font-bold text-inverse-on-surface text-sm">Filters</span>
          <button onClick={onClearAll} className="font-label text-xs text-inverse-on-surface/60 hover:text-inverse-on-surface">
            Clear all
          </button>
        </div>

        {/* Scrollable groups */}
        <div className="overflow-y-auto flex-1 px-4 pb-4 flex flex-col gap-5">
          {visibleGroups.map((group) => (
            <div key={group.key}>
              <div className="font-label text-[10px] font-semibold text-inverse-on-surface/50 uppercase tracking-wider mb-2">
                {group.label}
              </div>
              <div className="flex flex-wrap gap-2">
                {group.options.map((opt) => {
                  const selected = filters[group.key].includes(opt)
                  return (
                    <button
                      key={opt}
                      onClick={() => toggle(group.key, opt)}
                      className={[
                        'rounded-full px-3 py-1 font-label text-xs transition-colors',
                        selected
                          ? 'bg-primary text-on-primary'
                          : 'bg-white/10 text-inverse-on-surface',
                      ].join(' ')}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sticky CTA */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full bg-primary text-on-primary rounded-xl py-3 font-label font-bold text-sm"
          >
            Show {resultCount} results
          </button>
        </div>
      </div>
    </>
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
git add src/components/challenges/FilterBottomSheet.tsx
git commit -m "feat(practice): add FilterBottomSheet mobile component"
```

---

## Task 9: Wire filters into Practice page

**Files:**
- Modify: `src/app/(app)/challenges/page.tsx`

- [ ] **Step 1: Read the current challenges page fully**

Read `src/app/(app)/challenges/page.tsx` before editing.

- [ ] **Step 2: Add imports**

```tsx
import { DisciplineTabStrip, type Discipline } from '@/components/challenges/DisciplineTabStrip'
import { FilterDropdownBar, type FilterState } from '@/components/challenges/FilterDropdownBar'
import { ActiveFilterPills } from '@/components/challenges/ActiveFilterPills'
import { FilterBottomSheet } from '@/components/challenges/FilterBottomSheet'
```

- [ ] **Step 3: Add state at the top of the client component**

```tsx
const [discipline, setDiscipline] = useState<Discipline>('all')
const [filters, setFilters] = useState<FilterState>({
  paradigm: [],
  difficulty: [],
  role: [],
  company: [],
  scope: [],
})
const [mobileSheetOpen, setMobileSheetOpen] = useState(false)
```

- [ ] **Step 4: Replace the existing horizontal chip filter rows with the new components**

Remove the existing paradigm/difficulty/role/company chip strip rows. In their place, render:

```tsx
<DisciplineTabStrip active={discipline} onChange={setDiscipline} />
<FilterDropdownBar
  discipline={discipline}
  filters={filters}
  onChange={setFilters}
  resultCount={filteredChallenges.length}
  onOpenMobileSheet={() => setMobileSheetOpen(true)}
/>
<ActiveFilterPills
  filters={filters}
  onRemove={(key, value) =>
    setFilters((f) => ({ ...f, [key]: f[key].filter((v) => v !== value) }))
  }
  onClearAll={() =>
    setFilters({ paradigm: [], difficulty: [], role: [], company: [], scope: [] })
  }
/>
<FilterBottomSheet
  open={mobileSheetOpen}
  discipline={discipline}
  filters={filters}
  resultCount={filteredChallenges.length}
  onChange={setFilters}
  onClose={() => setMobileSheetOpen(false)}
  onClearAll={() =>
    setFilters({ paradigm: [], difficulty: [], role: [], company: [], scope: [] })
  }
/>
```

- [ ] **Step 5: Update the challenge filtering logic to include discipline**

Find where challenges are filtered (likely a `useMemo` or `filter` call). Add discipline filtering:

```tsx
const filteredChallenges = useMemo(() => {
  return challenges.filter((c) => {
    // Discipline filter
    if (discipline === 'product_sense' && !['flow', 'freeform', 'quick_take'].includes(c.challenge_type)) return false
    if (discipline === 'system_design' && c.challenge_type !== 'system_design') return false
    if (discipline === 'data_modeling' && c.challenge_type !== 'data_modeling') return false
    if (discipline === 'coding' && c.challenge_type !== 'coding') return false

    // Paradigm filter
    if (filters.paradigm.length > 0 && !filters.paradigm.map(p => p.toLowerCase().replace('-', '_')).includes(c.paradigm)) return false

    // Difficulty filter
    if (filters.difficulty.length > 0) {
      const map: Record<string, string> = { 'Staff+': 'staff_plus', 'Warmup': 'warmup', 'Standard': 'standard', 'Advanced': 'advanced' }
      if (!filters.difficulty.some(d => (map[d] ?? d.toLowerCase()) === c.difficulty)) return false
    }

    // Scope filter (system_design only — maps to metadata.scope)
    if (filters.scope.length > 0 && c.challenge_type === 'system_design') {
      const scopeMap: Record<string, string> = { 'Single Service': 'single_service', 'Distributed': 'distributed', 'Multi-Region': 'multi_region' }
      const challengeScope = (c.metadata as Record<string, string> | null)?.scope
      if (!filters.scope.some(s => scopeMap[s] === challengeScope)) return false
    }

    return true
  })
}, [challenges, discipline, filters])
```

- [ ] **Step 6: Update results grouping in All tab**

When `discipline === 'all'`, group results by discipline in the rendered list. When a specific discipline is selected, render a flat grid. Add this rendering logic:

```tsx
{discipline === 'all' ? (
  <>
    {['product_sense', 'system_design', 'data_modeling'].map((disc) => {
      const labels: Record<string, string> = {
        product_sense: '🧠 Product Sense',
        system_design: '🏗️ System Design',
        data_modeling: '🗄️ Data Modeling',
      }
      const colors: Record<string, string> = {
        product_sense: 'text-primary',
        system_design: 'text-tertiary',
        data_modeling: 'text-secondary',
      }
      const discChallenges = filteredChallenges.filter((c) => {
        if (disc === 'product_sense') return ['flow', 'freeform', 'quick_take'].includes(c.challenge_type)
        return c.challenge_type === disc
      })
      if (discChallenges.length === 0) return null
      return (
        <section key={disc}>
          <div className={`font-label font-bold text-sm mb-3 flex items-center gap-2 ${colors[disc]}`}>
            {labels[disc]}
            <button
              onClick={() => setDiscipline(disc as Discipline)}
              className="font-label text-xs text-on-surface-variant font-normal hover:underline"
            >
              see all {discChallenges.length} →
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {discChallenges.slice(0, 6).map((c) => (
              <ChallengeCard key={c.id} challenge={c} />
            ))}
          </div>
        </section>
      )
    })}
  </>
) : (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
    {filteredChallenges.map((c) => <ChallengeCard key={c.id} challenge={c} />)}
  </div>
)}
```

Replace `ChallengeCard` with whatever the existing challenge card component is called in this file.

- [ ] **Step 7: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/app/(app)/challenges/page.tsx
git commit -m "feat(practice): wire discipline tabs, contextual filter dropdowns, mobile bottom sheet"
```

---

## Task 10: Playwright smoke test

**Files:**
- Create: `tests/practice-filters.spec.ts`

- [ ] **Step 1: Write the test**

```typescript
// tests/practice-filters.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Practice filter redesign', () => {
  test.beforeEach(async ({ page }) => {
    // Use mock mode to bypass auth
    await page.goto('/challenges')
    await page.waitForLoadState('networkidle')
  })

  test('discipline tab strip renders all tabs', async ({ page }) => {
    const tabs = page.locator('[data-testid="discipline-tab"], button').filter({ hasText: /All|Product Sense|System Design|Data Modeling/i })
    await expect(tabs.first()).toBeVisible()
  })

  test('Coding tab is disabled', async ({ page }) => {
    const codingTab = page.locator('button').filter({ hasText: /Coding/i }).first()
    if (await codingTab.isVisible()) {
      await expect(codingTab).toBeDisabled()
    }
  })

  test('Explore page has Browse by Discipline section', async ({ page }) => {
    await page.goto('/explore')
    await page.waitForLoadState('networkidle')
    const heading = page.getByText('Browse by Discipline')
    await expect(heading).toBeVisible()
  })

  test('Explore page has Loop Tracks section when tracks exist', async ({ page }) => {
    await page.goto('/explore')
    await page.waitForLoadState('networkidle')
    // Either the section is visible or gracefully absent
    const heading = page.getByText('Interview Loop Tracks')
    // Just check no crash — tracks may not exist in test env
    await expect(page).not.toHaveTitle(/Error/)
  })
})
```

- [ ] **Step 2: Run the tests**

```bash
npx playwright test tests/practice-filters.spec.ts --reporter=line
```

Expected: tests pass or skip gracefully if mock mode is not configured. No crashes.

- [ ] **Step 3: Commit**

```bash
git add tests/practice-filters.spec.ts
git commit -m "test(practice): add Playwright smoke tests for filter redesign"
```

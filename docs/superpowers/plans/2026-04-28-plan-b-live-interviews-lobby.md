# Plan B: Live Interviews Lobby + Single Round Discipline Expansion

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the Live Interviews lobby to support all disciplines (not just product sense) with two entry modes (Single Round / Full Loop CTA) and a discipline filter on the company persona grid.

**Architecture:** UI-only changes + one migration to add a `disciplines` column to `company_profiles`. No new API routes. Full Loop card links to the builder (implemented in Plan C). The discipline filter is client-side state filtering the persona grid already loaded on the page.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Material Symbols Outlined icons

---

## File Map

| File | Action | What changes |
|---|---|---|
| `supabase/migrations/072_company_profiles_disciplines.sql` | Create | Adds `disciplines TEXT[]` to company_profiles; seeds discipline tags for existing companies |
| `src/app/(app)/live-interviews/page.tsx` | Modify | Add two entry mode cards at top; add discipline filter chip strip above persona grid |
| `src/app/(app)/live-interviews/FilteredPersonaGrid.tsx` | Modify | Accept `disciplineFilter` prop; filter personas by selected discipline |
| `src/components/live-interviews/EntryModeCards.tsx` | Create | Single Round + Full Loop side-by-side hero cards |
| `src/components/live-interviews/DisciplineFilterStrip.tsx` | Create | Discipline chip filter above persona grid |

---

## Task 1: Migration — add disciplines to company_profiles

**Files:**
- Create: `supabase/migrations/072_company_profiles_disciplines.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/072_company_profiles_disciplines.sql
ALTER TABLE company_profiles
  ADD COLUMN IF NOT EXISTS disciplines TEXT[] NOT NULL DEFAULT ARRAY['product_sense'];

-- Seed discipline tags for companies that support canvas-based interviews
UPDATE company_profiles SET disciplines = ARRAY['product_sense', 'system_design'] WHERE slug IN ('google', 'meta', 'stripe', 'amazon', 'microsoft', 'apple');
UPDATE company_profiles SET disciplines = ARRAY['product_sense', 'system_design', 'data_modeling'] WHERE slug IN ('netflix', 'uber', 'airbnb', 'linkedin');
-- All others keep the default ARRAY['product_sense']
```

- [ ] **Step 2: Apply migration locally**

```bash
npx supabase db push
```

Expected: no errors.

- [ ] **Step 3: Verify**

```bash
npx supabase db execute --sql "SELECT slug, disciplines FROM company_profiles LIMIT 5;"
```

Expected: rows with disciplines arrays populated.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/072_company_profiles_disciplines.sql
git commit -m "feat(db): add disciplines column to company_profiles"
```

---

## Task 2: EntryModeCards component

**Files:**
- Create: `src/components/live-interviews/EntryModeCards.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/live-interviews/EntryModeCards.tsx
import Link from 'next/link'

export function EntryModeCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {/* Single Round */}
      <div className="bg-surface-container rounded-xl p-5 border border-outline-variant flex flex-col gap-3">
        <div>
          <h2 className="font-headline font-bold text-on-surface text-base mb-1">Single Round</h2>
          <p className="font-body text-sm text-on-surface-variant leading-relaxed">
            Practice one interview type with a company persona. 25–35 min.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { label: '🧠 Product Sense', cls: 'bg-primary-fixed text-primary' },
            { label: '🏗️ System Design', cls: 'bg-tertiary-container text-on-secondary-container' },
            { label: '🗄️ Data Modeling', cls: 'bg-secondary-container text-on-secondary-container' },
            { label: '💻 Coding', cls: 'bg-surface-container-highest text-on-surface-variant' },
          ].map(({ label, cls }) => (
            <span key={label} className={`${cls} rounded-full text-xs font-label px-2.5 py-0.5`}>{label}</span>
          ))}
        </div>
        <p className="font-body text-xs text-on-surface-variant">Choose a company persona below to start.</p>
      </div>

      {/* Full Loop */}
      <div className="bg-inverse-surface rounded-xl p-5 border-2 border-primary flex flex-col gap-3 relative overflow-hidden">
        <div className="absolute top-3 right-3 bg-primary text-on-primary text-[9px] font-label font-bold uppercase tracking-wider px-1.5 py-0.5 rounded">
          New
        </div>
        <div>
          <h2 className="font-headline font-bold text-inverse-on-surface text-base mb-1">Full Loop</h2>
          <p className="font-body text-sm text-inverse-on-surface/60 leading-relaxed">
            Sequential rounds simulating a real interview loop. Pause and resume across sessions. Hatch grades across all rounds.
          </p>
        </div>
        <div className="flex items-center gap-2 text-inverse-on-surface/60 text-xs font-label flex-wrap">
          <span className="bg-white/10 rounded px-2 py-0.5">Round 1: Coding</span>
          <span>→</span>
          <span className="bg-white/10 rounded px-2 py-0.5">Round 2: Sys Design</span>
          <span>→</span>
          <span className="bg-white/10 rounded px-2 py-0.5">Round 3: Product</span>
        </div>
        <Link href="/live-interviews/loop/new">
          <div className="bg-primary text-on-primary rounded-xl py-2.5 text-center font-label font-bold text-sm cursor-pointer hover:opacity-90 transition-opacity">
            Build your loop →
          </div>
        </Link>
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
git add src/components/live-interviews/EntryModeCards.tsx
git commit -m "feat(interviews): add EntryModeCards hero component"
```

---

## Task 3: DisciplineFilterStrip component

**Files:**
- Create: `src/components/live-interviews/DisciplineFilterStrip.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/live-interviews/DisciplineFilterStrip.tsx
'use client'

export type InterviewDiscipline = 'all' | 'product_sense' | 'system_design' | 'data_modeling' | 'coding'

const CHIPS: { key: InterviewDiscipline; label: string; disabled?: boolean }[] = [
  { key: 'all', label: 'All' },
  { key: 'product_sense', label: '🧠 Product Sense' },
  { key: 'system_design', label: '🏗️ System Design' },
  { key: 'data_modeling', label: '🗄️ Data Modeling' },
  { key: 'coding', label: '💻 Coding', disabled: true },
]

interface Props {
  active: InterviewDiscipline
  onChange: (d: InterviewDiscipline) => void
}

export function DisciplineFilterStrip({ active, onChange }: Props) {
  return (
    <div className="flex gap-2 flex-wrap">
      {CHIPS.map((chip) => {
        const isActive = active === chip.key
        return (
          <button
            key={chip.key}
            disabled={chip.disabled}
            onClick={() => !chip.disabled && onChange(chip.key)}
            className={[
              'rounded-full px-3 py-1.5 font-label text-xs transition-colors whitespace-nowrap',
              isActive
                ? 'bg-primary text-on-primary font-semibold'
                : chip.disabled
                  ? 'bg-surface-container text-on-surface-variant/40 cursor-not-allowed'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high cursor-pointer border border-outline-variant',
            ].join(' ')}
          >
            {chip.label}
            {chip.disabled && <span className="ml-1 text-[9px] opacity-60">(soon)</span>}
          </button>
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

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/live-interviews/DisciplineFilterStrip.tsx
git commit -m "feat(interviews): add DisciplineFilterStrip component"
```

---

## Task 4: Update FilteredPersonaGrid to accept discipline filter

**Files:**
- Modify: `src/app/(app)/live-interviews/FilteredPersonaGrid.tsx`

- [ ] **Step 1: Read the current FilteredPersonaGrid component fully**

Read `src/app/(app)/live-interviews/FilteredPersonaGrid.tsx` before editing.

- [ ] **Step 2: Add disciplineFilter prop and filtering logic**

Add `disciplineFilter: InterviewDiscipline` to the component's props interface. Add filtering of personas before rendering:

```tsx
import type { InterviewDiscipline } from '@/components/live-interviews/DisciplineFilterStrip'

// Inside the component, before rendering personas:
const visiblePersonas = disciplineFilter === 'all'
  ? personas
  : personas.filter((p) =>
      (p.disciplines ?? ['product_sense']).includes(disciplineFilter)
    )
```

Use `visiblePersonas` instead of `personas` in the grid render.

Also add discipline badge chips to each persona card showing which disciplines it supports:

```tsx
// Inside persona card JSX, below the role/company info:
<div className="flex flex-wrap gap-1 mt-1.5">
  {(persona.disciplines ?? ['product_sense']).map((d: string) => {
    const labels: Record<string, string> = {
      product_sense: 'Product',
      system_design: 'Sys Design',
      data_modeling: 'Data',
      coding: 'Coding',
    }
    return (
      <span key={d} className="bg-surface-container-highest text-on-surface-variant rounded text-[9px] px-1.5 py-0.5 font-label">
        {labels[d] ?? d}
      </span>
    )
  })}
</div>
```

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/(app)/live-interviews/FilteredPersonaGrid.tsx
git commit -m "feat(interviews): add discipline filter prop to FilteredPersonaGrid, show discipline badges on persona cards"
```

---

## Task 5: Wire everything into the Live Interviews lobby page

**Files:**
- Modify: `src/app/(app)/live-interviews/page.tsx`

- [ ] **Step 1: Read the current lobby page fully**

Read `src/app/(app)/live-interviews/page.tsx` before editing.

- [ ] **Step 2: Make the page a client component (or extract a client shell)**

The lobby page needs `useState` for the discipline filter. If it is currently a server component, either convert it to `'use client'` or extract an inner client shell component that wraps the filter + grid. Follow whichever pattern the existing `FilteredPersonaGrid` already uses.

- [ ] **Step 3: Add imports**

```tsx
import { EntryModeCards } from '@/components/live-interviews/EntryModeCards'
import { DisciplineFilterStrip, type InterviewDiscipline } from '@/components/live-interviews/DisciplineFilterStrip'
```

- [ ] **Step 4: Add state**

```tsx
const [disciplineFilter, setDisciplineFilter] = useState<InterviewDiscipline>('all')
```

- [ ] **Step 5: Add EntryModeCards as the first section, above the persona grid**

```tsx
<section className="flex flex-col gap-6">
  <EntryModeCards />

  <div>
    <h2 className="font-headline font-bold text-on-surface text-sm mb-3">Or pick a persona directly</h2>
    <DisciplineFilterStrip active={disciplineFilter} onChange={setDisciplineFilter} />
  </div>

  <FilteredPersonaGrid
    personas={personas}
    disciplineFilter={disciplineFilter}
    {/* ...existing props */}
  />
</section>
```

- [ ] **Step 6: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/app/(app)/live-interviews/page.tsx
git commit -m "feat(interviews): add EntryModeCards and discipline filter to lobby"
```

---

## Task 6: Playwright smoke test

**Files:**
- Create: `tests/live-interviews-lobby.spec.ts`

- [ ] **Step 1: Write the test**

```typescript
// tests/live-interviews-lobby.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Live Interviews lobby', () => {
  test('renders two entry mode cards', async ({ page }) => {
    await page.goto('/live-interviews')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText('Single Round')).toBeVisible()
    await expect(page.getByText('Full Loop')).toBeVisible()
  })

  test('discipline filter strip is present', async ({ page }) => {
    await page.goto('/live-interviews')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText('Product Sense')).toBeVisible()
    await expect(page.getByText('System Design')).toBeVisible()
  })

  test('Full Loop card links to loop builder', async ({ page }) => {
    await page.goto('/live-interviews')
    await page.waitForLoadState('networkidle')

    const loopCTA = page.getByRole('link', { name: /Build your loop/i })
    await expect(loopCTA).toHaveAttribute('href', '/live-interviews/loop/new')
  })

  test('no crash on page load', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/live-interviews')
    await page.waitForLoadState('networkidle')
    expect(errors).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run the tests**

```bash
npx playwright test tests/live-interviews-lobby.spec.ts --reporter=line
```

Expected: passes or skips if auth blocks the page in test env.

- [ ] **Step 3: Commit**

```bash
git add tests/live-interviews-lobby.spec.ts
git commit -m "test(interviews): Playwright smoke tests for lobby redesign"
```

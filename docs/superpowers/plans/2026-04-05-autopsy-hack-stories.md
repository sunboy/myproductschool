# Product Autopsy — Hack Stories Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an immersive scroll-driven Hack Story reader to the Product Autopsy feature, with a data-driven section layout system and feature-flagged illustration components (animated SVG or CSS-only static).

**Architecture:** Stories are product-level JSON content stored in a new `autopsy_stories` Supabase table. Each story is a sequence of typed `StorySection` objects rendered by layout-specific React components. The story reader lives at `/explore/showcase/[slug]/stories/[storySlug]` inside the existing `(app)` shell (NavRail + TopBar). Illustrations are dispatched by a single `Illustration` component that reads `NEXT_PUBLIC_ILLUSTRATION_MODE` to choose between animated SVG (`IllustrationAnimated`) and CSS-only (`IllustrationStatic`) renderers.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Supabase (Postgres + RLS), CSS keyframes + IntersectionObserver (no framer-motion)

---

## File Map

### New files
```
src/lib/autopsy/types.ts                                         # barrel re-export + type guards
src/components/autopsy/illustrations/illustrations.types.ts      # per-variant data shapes
src/components/autopsy/illustrations/IllustrationStatic.tsx      # CSS-only illustration renderer
src/components/autopsy/illustrations/IllustrationAnimated.tsx    # SVG-native animated renderer
src/components/autopsy/Illustration.tsx                          # dispatcher (reads env flag)
src/components/autopsy/layouts/FullbleedCoverSection.tsx
src/components/autopsy/layouts/SplitPanelSection.tsx
src/components/autopsy/layouts/FullbleedStatSection.tsx
src/components/autopsy/layouts/BeforeAfterSection.tsx
src/components/autopsy/layouts/FullbleedPrincipleSection.tsx
src/components/autopsy/layouts/FullbleedCTASection.tsx
src/components/autopsy/layouts/QuoteSection.tsx
src/components/autopsy/layouts/TimelineSection.tsx
src/components/autopsy/StorySection.tsx                          # layout dispatcher
src/components/autopsy/StoryReader.tsx                           # scroll container + dots + progress
src/components/autopsy/StoryCard.tsx                             # card shown in product detail sidebar
src/app/(app)/explore/showcase/[slug]/stories/[storySlug]/page.tsx
supabase/migrations/035_autopsy_stories.sql
```

### Modified files
```
src/lib/types.ts                                    # add AutopsyStory, StorySection, IllustrationConfig, story_count
src/lib/data/showcase.ts                            # fetch stories in getShowcaseProduct + getShowcaseProducts
src/components/showcase/ShowcaseDetailClient.tsx    # add Hack Stories section above challenge list
src/components/showcase/ShowcaseProductCard.tsx     # show story count badge
src/app/globals.css                                 # add bounce-gentle + section-hidden/visible classes
TODO.md                                             # add Go Deeper deferred note
.env.local                                          # add NEXT_PUBLIC_ILLUSTRATION_MODE=animated
```

---

## Task 1: Extend TypeScript types

**Files:**
- Modify: `src/lib/types.ts` (after line 751, replace line 742–744)
- Create: `src/lib/autopsy/types.ts`

- [ ] **Step 1: Add story types to `src/lib/types.ts`**

Add `story_count?: number` to `AutopsyProduct` after the `sort_order` field:

```typescript
// In AutopsyProduct interface, after `sort_order: number`:
story_count?: number
```

Replace the existing `AutopsyProductDetail` interface (lines 742–744) with:

```typescript
export interface AutopsyProductDetail extends AutopsyProduct {
  decisions: Array<AutopsyDecision & { challenge: AutopsyChallenge }>
  stories: AutopsyStory[]
}
```

Append after line 751 (end of `ShowcaseAttempt`):

```typescript
// ── Autopsy Stories ─────────────────────────────────────────────────────────

export type IllustrationVariant =
  | 'comparison_bars' | 'flywheel' | 'tool_stack' | 'block_anatomy'
  | 'pricing_tiers' | 'lock_gate' | 'funnel' | 'competitive_matrix'
  | 'network_effect' | 'metrics_dashboard' | 'stacked_layers'
  | 'timeline_diagram' | 'placeholder'

export interface IllustrationConfig {
  type: IllustrationVariant
  data: Record<string, unknown>
  animationTrigger: 'onVisible' | 'loop'
}

export type StorySection =
  | { id: string; layout: 'fullbleed_cover'; content: { label: string; headline: string; subline: string; meta: string } }
  | { id: string; layout: 'split_panel'; content: { label: string; title: string; paragraphs: string[]; textSide: 'left' | 'right' }; illustration: IllustrationConfig }
  | { id: string; layout: 'fullbleed_stat'; content: { stat: string; context: string; source?: string } }
  | { id: string; layout: 'before_after'; content: { title: string; before: { label: string; items: string[]; summary?: string }; after: { label: string; items: string[]; summary?: string } } }
  | { id: string; layout: 'fullbleed_principle'; content: { principle: string; attribution: string } }
  | { id: string; layout: 'fullbleed_cta'; content: { headline: string; subline: string; buttonText: string; targetPath: string } }
  | { id: string; layout: 'quote'; content: { quote: string; attribution: string; context?: string } }
  | { id: string; layout: 'timeline'; content: { title: string; events: Array<{ date: string; label: string; description: string; type: string }> } }

export interface AutopsyStory {
  id: string
  product_id: string
  slug: string
  title: string
  read_time: string
  sections: StorySection[]
  related_challenge_ids: string[]
  sort_order: number
  created_at: string
}
```

- [ ] **Step 2: Create `src/lib/autopsy/types.ts`**

```typescript
export type {
  AutopsyStory,
  AutopsyProductDetail,
  StorySection,
  IllustrationConfig,
  IllustrationVariant,
  AutopsyProduct,
  AutopsyDecision,
  AutopsyChallenge,
} from '@/lib/types'

export function isSplitPanel(
  s: import('@/lib/types').StorySection
): s is Extract<import('@/lib/types').StorySection, { layout: 'split_panel' }> {
  return s.layout === 'split_panel'
}
```

- [ ] **Step 3: Type-check**

```bash
cd /Users/sandeep/Projects/myproductschool/.worktrees/autopsy
npx tsc --noEmit 2>&1 | head -30
```

Expected: any existing errors stay the same count; no new errors from the new types.

- [ ] **Step 4: Commit**

```bash
git add src/lib/types.ts src/lib/autopsy/types.ts
git commit -m "feat(autopsy): add StorySection, AutopsyStory, IllustrationConfig types"
```

---

## Task 2: Database migration + seed content

**Files:**
- Create: `supabase/migrations/035_autopsy_stories.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- 035_autopsy_stories.sql

-- ── Table ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS autopsy_stories (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id            UUID        NOT NULL REFERENCES autopsy_products(id) ON DELETE CASCADE,
  slug                  TEXT        NOT NULL,
  title                 TEXT        NOT NULL,
  read_time             TEXT        NOT NULL DEFAULT '5 min read',
  sections              JSONB       NOT NULL DEFAULT '[]',
  related_challenge_ids TEXT[]      NOT NULL DEFAULT '{}',
  sort_order            INTEGER     NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_autopsy_stories_product
  ON autopsy_stories(product_id, sort_order);

ALTER TABLE autopsy_stories ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "autopsy_stories_read" ON autopsy_stories
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Notion seed story ────────────────────────────────────────────────────────
INSERT INTO autopsy_stories (product_id, slug, title, read_time, sections, related_challenge_ids, sort_order)
SELECT
  p.id,
  'notion-block-architecture',
  'How Notion Bet Everything on Blocks',
  '7 min read',
  '[
    {
      "id": "cover",
      "layout": "fullbleed_cover",
      "content": {
        "label": "Product Architecture",
        "headline": "How Notion Bet Everything on Blocks",
        "subline": "The decision that turned a note-taking app into a $10B platform",
        "meta": "7 min · Strategy & Architecture"
      }
    },
    {
      "id": "founding-bet",
      "layout": "split_panel",
      "content": {
        "label": "THE FOUNDING BET",
        "title": "One Building Block, Infinite Surfaces",
        "paragraphs": [
          "In 2018, Notion scrapped two years of work and rewrote everything. The bet: make every piece of content — a paragraph, a heading, an image, a database row — a discrete, composable block.",
          "This was not a UI decision. It was an infrastructure decision. Blocks meant that a page could embed another page. A database could filter blocks. The same atom of content could appear in a kanban view, a calendar, and a table — without duplication.",
          "At the time, it looked like over-engineering. Their competitors were shipping features. Notion was building a grammar."
        ],
        "textSide": "left"
      },
      "illustration": {
        "type": "block_anatomy",
        "data": {
          "blocks": [
            { "type": "heading", "label": "H1", "color": "primary" },
            { "type": "paragraph", "label": "Text", "color": "secondary" },
            { "type": "database", "label": "DB", "color": "tertiary" },
            { "type": "page", "label": "Page", "color": "primary" },
            { "type": "image", "label": "Image", "color": "secondary" }
          ]
        },
        "animationTrigger": "onVisible"
      }
    },
    {
      "id": "stat",
      "layout": "fullbleed_stat",
      "content": {
        "stat": "$0 → $10B",
        "context": "Notion valuation growth driven by a single architectural decision made in 2018",
        "source": "The Information, 2021"
      }
    },
    {
      "id": "displacement",
      "layout": "split_panel",
      "content": {
        "label": "THE DISPLACEMENT PLAY",
        "title": "12 Tools, One Workspace",
        "paragraphs": [
          "By the time Notion had blocks, they could do something no competitor could: collapse five different tools into one surface without losing fidelity.",
          "Evernote for notes. Trello for tasks. Airtable for data. Confluence for docs. Google Sheets for spreadsheets. Each one replaced — not by building a better version of each, but by making the underlying primitive flexible enough to become all of them.",
          "The integration tax — the friction of switching between tools — disappeared. Not because Notion built integrations. Because they made integrations unnecessary."
        ],
        "textSide": "right"
      },
      "illustration": {
        "type": "tool_stack",
        "data": {
          "replaced": [
            { "name": "Evernote" },
            { "name": "Trello" },
            { "name": "Confluence" },
            { "name": "Airtable" },
            { "name": "Google Sheets" }
          ],
          "replacement": "Notion"
        },
        "animationTrigger": "onVisible"
      }
    },
    {
      "id": "before-after",
      "layout": "before_after",
      "content": {
        "title": "The Editor Paradigm Shift",
        "before": {
          "label": "Rich-Text World",
          "items": [
            "Content is locked inside document structure",
            "Copy-paste breaks formatting across tools",
            "No way to link or embed between docs natively",
            "Every view requires a different tool",
            "Data lives in silos — notes here, tasks there"
          ],
          "summary": "Five tools. Five contexts. Five monthly bills."
        },
        "after": {
          "label": "Block World",
          "items": [
            "Every element is a draggable, reusable primitive",
            "Pages embed inside pages — no context switch",
            "Databases and docs share the same block layer",
            "Switch between table, kanban, and calendar views instantly",
            "One workspace. One source of truth."
          ],
          "summary": "One tool. Zero integration tax."
        }
      }
    },
    {
      "id": "principle",
      "layout": "fullbleed_principle",
      "content": {
        "principle": "Structure is the product. Not features — the underlying grammar of how information connects.",
        "attribution": "Observed from Notion''s block architecture decision, 2018"
      }
    },
    {
      "id": "cta",
      "layout": "fullbleed_cta",
      "content": {
        "headline": "Now put it into practice",
        "subline": "You have read the strategy — test if you saw it coming",
        "buttonText": "Take the Block Architecture Challenge",
        "targetPath": "/explore/showcase/notion"
      }
    }
  ]'::jsonb,
  ARRAY[]::TEXT[],
  1
FROM autopsy_products p
WHERE p.slug = 'notion'
ON CONFLICT (product_id, slug) DO NOTHING;
```

- [ ] **Step 2: Apply migration in Supabase**

Run this SQL in the Supabase dashboard SQL editor (or `supabase db push` if CLI is configured). Verify `autopsy_stories` table exists with 1 row for Notion.

- [ ] **Step 3: Commit the migration file**

```bash
git add supabase/migrations/035_autopsy_stories.sql
git commit -m "feat(autopsy): add autopsy_stories table + Notion block architecture seed story"
```

---

## Task 3: Update data layer

**Files:**
- Modify: `src/lib/data/showcase.ts`

- [ ] **Step 1: Add `AutopsyStory` import**

At the top of `showcase.ts`, update the import line:

```typescript
import { AutopsyProduct, AutopsyChallenge, AutopsyProductDetail, AutopsyStory } from '@/lib/types'
```

- [ ] **Step 2: Update mock data**

In `MOCK_PRODUCTS`, add `story_count: 1` to Notion (index 0) and `story_count: 0` to Linear (index 1). Add the fields directly after `sort_order`:

```typescript
// Notion mock product — add after sort_order: 1,
story_count: 1,
```

```typescript
// Linear mock product — add after sort_order: 2,
story_count: 0,
```

In `MOCK_NOTION_DETAIL`, add `stories: []` after the `decisions` array (mock has no story content — story reader requires real Supabase data):

```typescript
// After the closing ] of decisions array:
stories: [],
```

- [ ] **Step 3: Update `getShowcaseProducts` to include story counts**

Replace the current return statement in the Supabase branch:

```typescript
export async function getShowcaseProducts(): Promise<AutopsyProduct[]> {
  if (IS_MOCK) {
    return MOCK_PRODUCTS
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('autopsy_products')
    .select('*')
    .eq('is_published', true)
    .order('sort_order', { ascending: true })

  if (error) throw error

  // Compute story count per product
  const { data: storyCounts } = await supabase
    .from('autopsy_stories')
    .select('product_id')
    .in('product_id', (data ?? []).map((p: { id: string }) => p.id))

  const countMap: Record<string, number> = {}
  for (const row of (storyCounts ?? []) as { product_id: string }[]) {
    countMap[row.product_id] = (countMap[row.product_id] ?? 0) + 1
  }

  return (data ?? []).map((p: AutopsyProduct) => ({
    ...p,
    story_count: countMap[p.id] ?? 0,
  })) as AutopsyProduct[]
}
```

- [ ] **Step 4: Update `getShowcaseProduct` to fetch stories**

Replace the final `return` statement in the Supabase branch of `getShowcaseProduct`:

```typescript
  // Fetch stories for this product
  const { data: stories } = await supabase
    .from('autopsy_stories')
    .select('*')
    .eq('product_id', product.id)
    .order('sort_order', { ascending: true })

  return {
    ...product,
    decisions: decisions.map((d: { id: string }) => ({
      ...d,
      challenge: challengeMap[d.id],
    })),
    stories: (stories ?? []) as AutopsyStory[],
  } as AutopsyProductDetail
```

Also update the early-return for empty decisions (around line 267):

```typescript
  if (!decisions || decisions.length === 0) {
    return { ...product, decisions: [], stories: [] } as AutopsyProductDetail
  }
```

- [ ] **Step 5: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: clean (or same errors as before — no new ones).

- [ ] **Step 6: Commit**

```bash
git add src/lib/data/showcase.ts
git commit -m "feat(autopsy): fetch stories in data layer, add story_count to products"
```

---

## Task 4: Illustration type definitions

**Files:**
- Create: `src/components/autopsy/illustrations/illustrations.types.ts`

- [ ] **Step 1: Create the types file**

```typescript
// Per-variant data shapes — narrowed from IllustrationConfig.data

export interface ComparisonBarsData {
  bars: Array<{
    label: string
    value: number          // 0–100
    color?: 'primary' | 'secondary' | 'tertiary'
  }>
  insightText?: string
}

export interface FlywheelData {
  steps: Array<{ label: string; icon?: string }>
  centerLabel?: string
}

export interface ToolStackData {
  replaced: Array<{ name: string; icon?: string }>
  replacement: string
}

export interface BlockAnatomyData {
  blocks: Array<{
    type: string
    label: string
    color?: 'primary' | 'secondary' | 'tertiary'
  }>
}

export interface PricingTiersData {
  tiers: Array<{
    name: string
    price: string
    features: string[]
    highlighted?: boolean
  }>
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/autopsy/illustrations/illustrations.types.ts
git commit -m "feat(autopsy): add illustration data shape types"
```

---

## Task 5: Static illustration renderer

**Files:**
- Create: `src/components/autopsy/illustrations/IllustrationStatic.tsx`

- [ ] **Step 1: Create `IllustrationStatic.tsx`**

```typescript
'use client'

import type { IllustrationConfig } from '@/lib/types'
import type {
  ComparisonBarsData,
  FlywheelData,
  ToolStackData,
  BlockAnatomyData,
  PricingTiersData,
} from './illustrations.types'

interface Props {
  config: IllustrationConfig
  isVisible: boolean
  className?: string
}

export function IllustrationStatic({ config, isVisible, className = '' }: Props) {
  const base = `w-full h-full flex items-center justify-center ${className}`

  switch (config.type) {
    case 'comparison_bars': {
      const data = config.data as unknown as ComparisonBarsData
      const colorMap: Record<string, string> = {
        primary: 'bg-primary',
        secondary: 'bg-secondary',
        tertiary: 'bg-tertiary',
      }
      return (
        <div className={`${base} flex-col gap-3 p-6`}>
          {data.bars.map((bar, i) => (
            <div key={i} className="w-full">
              <div className="flex justify-between mb-1">
                <span className="text-xs font-label text-on-surface-variant">{bar.label}</span>
                <span className="text-xs font-label font-bold text-on-surface">{bar.value}%</span>
              </div>
              <div className="h-3 bg-surface-container-highest rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${colorMap[bar.color ?? 'primary'] ?? 'bg-primary'} transition-all duration-700 ease-out`}
                  style={{ width: isVisible ? `${bar.value}%` : '0%' }}
                />
              </div>
            </div>
          ))}
          {data.insightText && (
            <p
              className="text-xs text-on-surface-variant italic text-center mt-2 transition-opacity duration-500"
              style={{ opacity: isVisible ? 1 : 0 }}
            >
              {data.insightText}
            </p>
          )}
        </div>
      )
    }

    case 'flywheel': {
      const data = config.data as unknown as FlywheelData
      const count = data.steps.length
      return (
        <div className={`${base} flex-col gap-2 p-6`}>
          <div
            className="relative w-48 h-48 mx-auto"
            style={{
              animation: config.animationTrigger === 'loop' ? 'spin 60s linear infinite' : undefined,
            }}
          >
            {data.centerLabel && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-label font-bold text-primary text-center max-w-[60px]">
                  {data.centerLabel}
                </span>
              </div>
            )}
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-outline-variant" />
            {data.steps.map((step, i) => {
              const angle = (i / count) * 360 - 90
              const rad = (angle * Math.PI) / 180
              const r = 72 // px from center
              const x = 96 + r * Math.cos(rad)
              const y = 96 + r * Math.sin(rad)
              return (
                <div
                  key={i}
                  className="absolute flex flex-col items-center gap-0.5 transition-opacity duration-500"
                  style={{
                    left: x,
                    top: y,
                    transform: 'translate(-50%, -50%)',
                    opacity: isVisible ? 1 : 0,
                    transitionDelay: `${i * 0.15}s`,
                  }}
                >
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-on-primary text-[10px] font-label font-bold">{i + 1}</span>
                  </div>
                  <span className="text-[9px] font-label text-on-surface-variant text-center max-w-[56px] leading-tight">
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    case 'tool_stack': {
      const data = config.data as unknown as ToolStackData
      return (
        <div className={`${base} flex-col gap-2 p-6`}>
          <div className="w-full space-y-1.5">
            {data.replaced.map((tool, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-container-highest transition-all duration-500"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transitionDelay: `${i * 0.1}s`,
                }}
              >
                <span
                  className="material-symbols-outlined text-sm text-error"
                  style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
                >
                  close
                </span>
                <span className="text-sm font-body text-on-surface-variant line-through">{tool.name}</span>
              </div>
            ))}
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-fixed ring-2 ring-primary transition-all duration-500 mt-3"
              style={{
                opacity: isVisible ? 1 : 0,
                transitionDelay: `${data.replaced.length * 0.1 + 0.1}s`,
              }}
            >
              <span
                className="material-symbols-outlined text-sm text-primary"
                style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
              >
                check_circle
              </span>
              <span className="text-sm font-body font-bold text-on-primary-container">{data.replacement}</span>
            </div>
          </div>
        </div>
      )
    }

    case 'block_anatomy': {
      const data = config.data as unknown as BlockAnatomyData
      const colorMap: Record<string, string> = {
        primary: 'bg-primary text-on-primary',
        secondary: 'bg-secondary text-on-primary',
        tertiary: 'bg-tertiary text-on-primary',
      }
      return (
        <div className={`${base} flex-col gap-1.5 p-6`}>
          {/* Fake editor chrome */}
          <div className="w-full rounded-xl overflow-hidden border border-outline-variant shadow-sm">
            <div className="bg-surface-container-high px-3 py-2 flex items-center gap-1.5 border-b border-outline-variant">
              <div className="w-2.5 h-2.5 rounded-full bg-error/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-tertiary/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-primary/60" />
              <span className="ml-2 text-[10px] text-on-surface-variant font-label">notion.so/my-page</span>
            </div>
            <div className="bg-surface p-3 space-y-1.5">
              {data.blocks.map((block, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 transition-all duration-400"
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateY(0)' : 'translateY(8px)',
                    transitionDelay: `${i * 0.08}s`,
                  }}
                >
                  <span
                    className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-label font-bold shrink-0 ${colorMap[block.color ?? 'primary'] ?? colorMap.primary}`}
                  >
                    {block.label}
                  </span>
                  <div className="h-3 rounded bg-surface-container-highest flex-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    }

    case 'pricing_tiers': {
      const data = config.data as unknown as PricingTiersData
      return (
        <div className={`${base} gap-2 p-4`}>
          {data.tiers.map((tier, i) => (
            <div
              key={i}
              className={`flex-1 rounded-xl p-3 border transition-all duration-500 ${
                tier.highlighted
                  ? 'bg-primary-fixed border-primary ring-2 ring-primary scale-[1.02]'
                  : 'bg-surface-container border-outline-variant'
              }`}
              style={{ opacity: isVisible ? 1 : 0, transitionDelay: `${i * 0.12}s` }}
            >
              <p className="text-xs font-label font-bold text-on-surface">{tier.name}</p>
              <p className="text-lg font-label font-bold text-primary mt-0.5">{tier.price}</p>
              <ul className="mt-2 space-y-1">
                {tier.features.slice(0, 3).map((f, j) => (
                  <li key={j} className="text-[10px] text-on-surface-variant flex gap-1">
                    <span className="material-symbols-outlined text-[12px] text-primary"
                      style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>
                      check
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )
    }

    default: {
      // placeholder for unimplemented types
      return (
        <div className={`${base} flex-col gap-2`}>
          <div className="w-full h-full min-h-[200px] bg-surface-container rounded-xl flex flex-col items-center justify-center gap-2">
            <span
              className="material-symbols-outlined text-4xl text-on-surface-variant/40"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 48" }}
            >
              image
            </span>
            <span className="text-xs font-label text-on-surface-variant/40 uppercase tracking-widest">
              {config.type}
            </span>
          </div>
        </div>
      )
    }
  }
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/components/autopsy/illustrations/IllustrationStatic.tsx
git commit -m "feat(autopsy): add CSS-only static illustration renderer"
```

---

## Task 6: Animated illustration renderer

**Files:**
- Create: `src/components/autopsy/illustrations/IllustrationAnimated.tsx`

- [ ] **Step 1: Create `IllustrationAnimated.tsx`**

```typescript
'use client'

import { useEffect, useRef } from 'react'
import type { IllustrationConfig } from '@/lib/types'
import type {
  ComparisonBarsData,
  FlywheelData,
  ToolStackData,
  BlockAnatomyData,
  PricingTiersData,
} from './illustrations.types'

interface Props {
  config: IllustrationConfig
  isVisible: boolean
  className?: string
}

// Reusable count-up hook: counts from 0 to target when isVisible becomes true
function useCountUp(target: number, isVisible: boolean, duration = 900): number {
  const frameRef = useRef<number | null>(null)
  const countRef = useRef<number>(0)
  const startTimeRef = useRef<number | null>(null)
  // We'll render with a ref-driven approach — return target directly for simplicity
  // (actual rendering uses CSS strokeDashoffset animations instead of JS for SVG)
  return isVisible ? target : 0
}

export function IllustrationAnimated({ config, isVisible, className = '' }: Props) {
  const base = `w-full h-full flex items-center justify-center ${className}`

  switch (config.type) {
    case 'comparison_bars': {
      const data = config.data as unknown as ComparisonBarsData
      const maxVal = Math.max(...data.bars.map(b => b.value), 1)
      const svgWidth = 280
      const barHeight = 16
      const gap = 36
      const labelWidth = 80
      const svgHeight = data.bars.length * gap + 16

      return (
        <div className={`${base} p-6`}>
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            width="100%"
            className="overflow-visible"
          >
            {data.bars.map((bar, i) => {
              const y = i * gap + 8
              const maxBarWidth = svgWidth - labelWidth - 8
              const targetWidth = (bar.value / maxVal) * maxBarWidth
              const colorMap: Record<string, string> = {
                primary: 'var(--color-primary)',
                secondary: 'var(--color-secondary)',
                tertiary: 'var(--color-tertiary)',
              }
              const fill = colorMap[bar.color ?? 'primary'] ?? colorMap.primary

              return (
                <g key={i}>
                  {/* Label */}
                  <text
                    x={0}
                    y={y + barHeight / 2 + 4}
                    fontSize={10}
                    fill="var(--color-on-surface-variant)"
                    fontFamily="var(--font-label, sans-serif)"
                  >
                    {bar.label.length > 10 ? bar.label.slice(0, 10) + '…' : bar.label}
                  </text>
                  {/* Track */}
                  <rect
                    x={labelWidth}
                    y={y}
                    width={maxBarWidth}
                    height={barHeight}
                    rx={barHeight / 2}
                    fill="var(--color-surface-container-highest)"
                  />
                  {/* Animated fill */}
                  <rect
                    x={labelWidth}
                    y={y}
                    width={isVisible ? targetWidth : 0}
                    height={barHeight}
                    rx={barHeight / 2}
                    fill={fill}
                    style={{
                      transition: `width ${0.7 + i * 0.1}s cubic-bezier(0.16,1,0.3,1)`,
                      transitionDelay: `${i * 0.12}s`,
                    }}
                  />
                  {/* Value label */}
                  <text
                    x={labelWidth + maxBarWidth + 4}
                    y={y + barHeight / 2 + 4}
                    fontSize={10}
                    fontWeight={700}
                    fill="var(--color-on-surface)"
                    fontFamily="var(--font-label, sans-serif)"
                    style={{ opacity: isVisible ? 1 : 0, transition: 'opacity 0.5s', transitionDelay: `${0.7 + i * 0.12}s` }}
                  >
                    {bar.value}%
                  </text>
                </g>
              )
            })}
          </svg>
          {data.insightText && (
            <p
              className="text-xs text-on-surface-variant italic text-center mt-3 transition-opacity duration-700"
              style={{ opacity: isVisible ? 1 : 0, transitionDelay: `${data.bars.length * 0.2}s` }}
            >
              {data.insightText}
            </p>
          )}
        </div>
      )
    }

    case 'flywheel': {
      const data = config.data as unknown as FlywheelData
      const count = data.steps.length
      const cx = 120
      const cy = 120
      const r = 80
      const nodeR = 14

      // Compute circumference for the dashed ring
      const circumference = 2 * Math.PI * r

      return (
        <div className={`${base} p-4`}>
          <svg viewBox="0 0 240 240" width="100%" className="overflow-visible">
            {/* Rotating ring — CSS animation */}
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="var(--color-outline-variant)"
              strokeWidth={1.5}
              strokeDasharray="6 4"
              style={{
                transformOrigin: `${cx}px ${cy}px`,
                animation: config.animationTrigger === 'loop'
                  ? 'spin 40s linear infinite'
                  : undefined,
              }}
            />
            {/* Connecting arcs — draw in */}
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth={2}
              strokeDasharray={circumference}
              strokeDashoffset={isVisible ? 0 : circumference}
              style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.16,1,0.3,1)', transformOrigin: `${cx}px ${cy}px`, transform: 'rotate(-90deg)' }}
              opacity={0.3}
            />
            {/* Center label */}
            {data.centerLabel && (
              <text
                x={cx}
                y={cy + 4}
                textAnchor="middle"
                fontSize={10}
                fontWeight={700}
                fill="var(--color-primary)"
                fontFamily="var(--font-label, sans-serif)"
              >
                {data.centerLabel}
              </text>
            )}
            {/* Nodes */}
            {data.steps.map((step, i) => {
              const angle = (i / count) * 360 - 90
              const rad = (angle * Math.PI) / 180
              const nx = cx + r * Math.cos(rad)
              const ny = cy + r * Math.sin(rad)
              return (
                <g
                  key={i}
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transition: 'opacity 0.4s',
                    transitionDelay: `${0.3 + i * 0.15}s`,
                  }}
                >
                  <circle cx={nx} cy={ny} r={nodeR} fill="var(--color-primary)" />
                  <text
                    x={nx}
                    y={ny + 4}
                    textAnchor="middle"
                    fontSize={9}
                    fontWeight={700}
                    fill="var(--color-on-primary)"
                    fontFamily="var(--font-label, sans-serif)"
                  >
                    {i + 1}
                  </text>
                  {/* Step label outside node */}
                  <text
                    x={nx + (nx > cx ? 18 : -18)}
                    y={ny + 4}
                    textAnchor={nx > cx ? 'start' : 'end'}
                    fontSize={9}
                    fill="var(--color-on-surface-variant)"
                    fontFamily="var(--font-label, sans-serif)"
                  >
                    {step.label.length > 12 ? step.label.slice(0, 12) + '…' : step.label}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      )
    }

    case 'tool_stack': {
      const data = config.data as unknown as ToolStackData
      const svgH = (data.replaced.length + 1) * 36 + 16
      return (
        <div className={`${base} p-6`}>
          <svg viewBox={`0 0 240 ${svgH}`} width="100%">
            {data.replaced.map((tool, i) => {
              const y = i * 36 + 8
              // Strike-through line length
              const lineLen = 160
              return (
                <g
                  key={i}
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transition: 'opacity 0.4s',
                    transitionDelay: `${i * 0.1}s`,
                  }}
                >
                  {/* Pill bg */}
                  <rect x={0} y={y} width={200} height={28} rx={6} fill="var(--color-surface-container-highest)" />
                  {/* × icon */}
                  <text x={10} y={y + 18} fontSize={12} fill="var(--color-error)" fontFamily="sans-serif">✕</text>
                  {/* Tool name */}
                  <text x={28} y={y + 18} fontSize={12} fill="var(--color-on-surface-variant)" fontFamily="var(--font-body, sans-serif)">
                    {tool.name}
                  </text>
                  {/* Animated strike-through */}
                  <line
                    x1={28} y1={y + 14}
                    x2={28 + lineLen} y2={y + 14}
                    stroke="var(--color-error)"
                    strokeWidth={1.5}
                    strokeDasharray={lineLen}
                    strokeDashoffset={isVisible ? 0 : lineLen}
                    style={{ transition: `stroke-dashoffset 0.5s ease`, transitionDelay: `${i * 0.1 + 0.3}s` }}
                  />
                </g>
              )
            })}
            {/* Replacement */}
            <g
              style={{
                opacity: isVisible ? 1 : 0,
                transition: 'opacity 0.5s',
                transitionDelay: `${data.replaced.length * 0.1 + 0.1}s`,
              }}
            >
              <rect
                x={0}
                y={data.replaced.length * 36 + 16}
                width={200}
                height={32}
                rx={8}
                fill="var(--color-primary-fixed)"
                stroke="var(--color-primary)"
                strokeWidth={2}
              />
              <text
                x={28}
                y={data.replaced.length * 36 + 36}
                fontSize={13}
                fontWeight={700}
                fill="var(--color-primary)"
                fontFamily="var(--font-body, sans-serif)"
              >
                {data.replacement}
              </text>
            </g>
          </svg>
        </div>
      )
    }

    case 'block_anatomy': {
      const data = config.data as unknown as BlockAnatomyData
      const colorSvgMap: Record<string, string> = {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        tertiary: 'var(--color-tertiary)',
      }
      const svgH = data.blocks.length * 44 + 48
      return (
        <div className={`${base} p-4`}>
          <svg viewBox={`0 0 260 ${svgH}`} width="100%">
            {/* Editor chrome */}
            <rect x={0} y={0} width={260} height={32} rx={6} fill="var(--color-surface-container-high)" />
            {[8, 22, 36].map((x, i) => (
              <circle key={i} cx={x} cy={16} r={5} fill={i === 0 ? 'var(--color-error)' : i === 1 ? 'var(--color-tertiary)' : 'var(--color-primary)'} opacity={0.5} />
            ))}
            <line x1={0} y1={32} x2={260} y2={32} stroke="var(--color-outline-variant)" strokeWidth={1} />

            {data.blocks.map((block, i) => {
              const y = 48 + i * 44
              const fill = colorSvgMap[block.color ?? 'primary'] ?? colorSvgMap.primary
              const connY = y + 20
              return (
                <g
                  key={i}
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transition: 'opacity 0.5s',
                    transitionDelay: `${i * 0.1}s`,
                  }}
                >
                  {/* Connecting line from previous */}
                  {i > 0 && (
                    <line
                      x1={16} y1={y - 20}
                      x2={16} y2={y}
                      stroke="var(--color-outline-variant)"
                      strokeWidth={1.5}
                      strokeDasharray={20}
                      strokeDashoffset={isVisible ? 0 : 20}
                      style={{ transition: 'stroke-dashoffset 0.4s ease', transitionDelay: `${i * 0.1 - 0.05}s` }}
                    />
                  )}
                  {/* Block badge */}
                  <rect x={4} y={y} width={24} height={24} rx={4} fill={fill} />
                  <text x={16} y={y + 15} textAnchor="middle" fontSize={9} fontWeight={700} fill="white" fontFamily="var(--font-label, sans-serif)">
                    {block.label}
                  </text>
                  {/* Content placeholder */}
                  <rect x={36} y={y + 4} width={180} height={8} rx={4} fill="var(--color-surface-container-highest)" />
                  <rect x={36} y={y + 16} width={100} height={6} rx={3} fill="var(--color-surface-container-high)" />
                </g>
              )
            })}
          </svg>
        </div>
      )
    }

    default: {
      // Delegate to placeholder
      return (
        <div className={`${base}`}>
          <div className="w-full h-full min-h-[200px] bg-surface-container rounded-xl flex flex-col items-center justify-center gap-2">
            <span
              className="material-symbols-outlined text-4xl text-on-surface-variant/40"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 48" }}
            >
              image
            </span>
            <span className="text-xs font-label text-on-surface-variant/40 uppercase tracking-widest">
              {config.type}
            </span>
          </div>
        </div>
      )
    }
  }
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/components/autopsy/illustrations/IllustrationAnimated.tsx
git commit -m "feat(autopsy): add SVG-native animated illustration renderer"
```

---

## Task 7: Illustration dispatcher

**Files:**
- Create: `src/components/autopsy/Illustration.tsx`

- [ ] **Step 1: Create the dispatcher**

```typescript
'use client'

import type { IllustrationConfig } from '@/lib/types'
import { IllustrationStatic } from './illustrations/IllustrationStatic'
import { IllustrationAnimated } from './illustrations/IllustrationAnimated'

interface IllustrationProps {
  config: IllustrationConfig
  isVisible?: boolean
  className?: string
}

export function Illustration({ config, isVisible = false, className }: IllustrationProps) {
  const mode = process.env.NEXT_PUBLIC_ILLUSTRATION_MODE ?? 'static'
  if (mode === 'animated') {
    return <IllustrationAnimated config={config} isVisible={isVisible} className={className} />
  }
  return <IllustrationStatic config={config} isVisible={isVisible} className={className} />
}
```

- [ ] **Step 2: Add env var to `.env.local`**

Open `.env.local` and add (alongside existing Supabase vars):

```
NEXT_PUBLIC_ILLUSTRATION_MODE=animated
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add src/components/autopsy/Illustration.tsx .env.local
git commit -m "feat(autopsy): add illustration dispatcher with NEXT_PUBLIC_ILLUSTRATION_MODE flag"
```

---

## Task 8: CSS additions

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add story reader CSS to `globals.css`**

Append before the final `}` or at the end of the file:

```css
/* ── Story Reader ─────────────────────────────────────────────────────────── */

@keyframes bounce-gentle {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50%       { transform: translateX(-50%) translateY(6px); }
}
.animate-bounce-gentle {
  animation: bounce-gentle 2s ease-in-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  .animate-bounce-gentle { animation: none; }
}

/* Toggled by JS IntersectionObserver — animate once on first entry */
.section-hidden {
  opacity: 0;
  transform: translateY(24px);
}
.section-visible {
  animation: fade-in-up 0.6s ease both;
}
```

Note: `fade-in-up` keyframe already exists in `globals.css` — do not re-add it.

- [ ] **Step 2: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(autopsy): add bounce-gentle and section entrance CSS for story reader"
```

---

## Task 9: Section layout components

**Files:**
- Create: `src/components/autopsy/layouts/FullbleedCoverSection.tsx`
- Create: `src/components/autopsy/layouts/SplitPanelSection.tsx`
- Create: `src/components/autopsy/layouts/FullbleedStatSection.tsx`
- Create: `src/components/autopsy/layouts/BeforeAfterSection.tsx`
- Create: `src/components/autopsy/layouts/FullbleedPrincipleSection.tsx`
- Create: `src/components/autopsy/layouts/FullbleedCTASection.tsx`
- Create: `src/components/autopsy/layouts/QuoteSection.tsx`
- Create: `src/components/autopsy/layouts/TimelineSection.tsx`

Each component takes:
```typescript
interface SectionProps<T extends StorySection> {
  section: T
  isVisible: boolean
  hasBeenVisible: boolean
}
```

The `hasBeenVisible` boolean prevents re-triggering animations on scroll-back. The `isVisible` prop drives the current state.

- [ ] **Step 1: Create `FullbleedCoverSection.tsx`**

```typescript
'use client'

import { LumaGlyph } from '@/components/shell/LumaGlyph'
import type { StorySection } from '@/lib/types'

type CoverSection = Extract<StorySection, { layout: 'fullbleed_cover' }>

interface Props {
  section: CoverSection
  isVisible: boolean
  hasBeenVisible: boolean
}

export function FullbleedCoverSection({ section, isVisible, hasBeenVisible }: Props) {
  const { content } = section
  const entered = isVisible || hasBeenVisible

  return (
    <div
      className="relative flex flex-col items-center justify-center text-center px-6 bg-primary overflow-hidden"
      style={{ minHeight: 'calc(100dvh - 52px)' }}
    >
      {/* Ambient orb */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute w-96 h-96 rounded-full bg-primary-container/20 blur-3xl"
          style={{ top: '-10%', right: '-10%' }}
        />
        <div
          className="absolute w-64 h-64 rounded-full bg-tertiary-container/10 blur-3xl"
          style={{ bottom: '10%', left: '-5%' }}
        />
      </div>

      {/* Label */}
      <p
        className="font-label text-xs uppercase tracking-widest text-on-primary/60 mb-4 transition-all duration-700"
        style={{ opacity: entered ? 1 : 0, transform: entered ? 'translateY(0)' : 'translateY(12px)' }}
      >
        {content.label}
      </p>

      {/* Headline */}
      <h1
        className="font-headline italic text-on-primary font-normal leading-tight mb-4 transition-all duration-700 delay-100"
        style={{
          fontSize: 'clamp(32px, 4vw, 56px)',
          opacity: entered ? 1 : 0,
          transform: entered ? 'translateY(0)' : 'translateY(16px)',
        }}
      >
        {content.headline}
      </h1>

      {/* Subline */}
      <p
        className="font-body text-on-primary/80 text-base max-w-xl mb-6 transition-all duration-700 delay-200"
        style={{ opacity: entered ? 1 : 0, transform: entered ? 'translateY(0)' : 'translateY(12px)' }}
      >
        {content.subline}
      </p>

      {/* Meta */}
      <p
        className="font-label text-xs text-on-primary/50 uppercase tracking-wider transition-all duration-700 delay-300"
        style={{ opacity: entered ? 1 : 0 }}
      >
        {content.meta}
      </p>

      {/* Luma in corner */}
      <div className="absolute bottom-6 right-6 opacity-60">
        <LumaGlyph size={32} state="idle" />
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-8 animate-bounce-gentle text-on-primary/50 flex flex-col items-center gap-1"
        style={{ opacity: entered ? 1 : 0, transition: 'opacity 1s', transitionDelay: '0.8s' }}
      >
        <span className="font-label text-[10px] uppercase tracking-widest">Scroll</span>
        <span
          className="material-symbols-outlined text-base"
          style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20" }}
        >
          keyboard_arrow_down
        </span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `SplitPanelSection.tsx`**

```typescript
'use client'

import { Illustration } from '@/components/autopsy/Illustration'
import type { StorySection } from '@/lib/types'

type SplitSection = Extract<StorySection, { layout: 'split_panel' }>

interface Props {
  section: SplitSection
  isVisible: boolean
  hasBeenVisible: boolean
}

export function SplitPanelSection({ section, isVisible, hasBeenVisible }: Props) {
  const { content, illustration } = section
  const entered = isVisible || hasBeenVisible
  const textLeft = content.textSide === 'left'

  const textPanel = (
    <div
      className="flex flex-col justify-center px-8 md:px-12 py-10 transition-all duration-700"
      style={{
        opacity: entered ? 1 : 0,
        transform: entered ? 'translateX(0)' : `translateX(${textLeft ? '-24px' : '24px'})`,
      }}
    >
      <p className="font-label text-primary text-xs uppercase tracking-widest mb-2">
        {content.label}
      </p>
      <h2
        className="font-headline italic text-on-surface font-normal mb-4 leading-tight"
        style={{ fontSize: 'clamp(22px, 3vw, 36px)' }}
      >
        {content.title}
      </h2>
      <div className="space-y-3">
        {content.paragraphs.map((p, i) => (
          <p key={i} className="font-body text-on-surface-variant leading-relaxed text-sm md:text-base">
            {p}
          </p>
        ))}
      </div>
    </div>
  )

  const illustrationPanel = (
    <div
      className="flex items-center justify-center bg-surface-container-low p-6 md:p-8 min-h-[280px] transition-all duration-700 delay-100"
      style={{
        opacity: entered ? 1 : 0,
        transform: entered ? 'translateX(0)' : `translateX(${textLeft ? '24px' : '-24px'})`,
      }}
    >
      <div className="w-full max-w-sm">
        <Illustration config={illustration} isVisible={isVisible || hasBeenVisible} />
      </div>
    </div>
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-2" style={{ minHeight: '80vh' }}>
      {textLeft ? (
        <>
          <div className="order-2 md:order-1">{textPanel}</div>
          <div className="order-1 md:order-2">{illustrationPanel}</div>
        </>
      ) : (
        <>
          <div className="order-1">{illustrationPanel}</div>
          <div className="order-2">{textPanel}</div>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create `FullbleedStatSection.tsx`**

```typescript
'use client'

import { useEffect, useRef, useState } from 'react'
import type { StorySection } from '@/lib/types'

type StatSection = Extract<StorySection, { layout: 'fullbleed_stat' }>

interface Props {
  section: StatSection
  isVisible: boolean
  hasBeenVisible: boolean
}

export function FullbleedStatSection({ section, isVisible, hasBeenVisible }: Props) {
  const { content } = section
  const entered = isVisible || hasBeenVisible
  const [displayStat, setDisplayStat] = useState(content.stat)
  const countedRef = useRef(false)

  // Try to extract a number from the stat string for count-up; fall back to full string reveal
  useEffect(() => {
    if (!isVisible || countedRef.current) return
    const numMatch = content.stat.match(/^(\d+)(%?)$/)
    if (!numMatch) {
      // Non-numeric stat like "$0 → $10B" — just show it
      countedRef.current = true
      return
    }
    countedRef.current = true
    const target = parseInt(numMatch[1], 10)
    const suffix = numMatch[2]
    const duration = 1200
    const start = performance.now()
    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out-cubic
      setDisplayStat(Math.round(eased * target) + suffix)
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [isVisible, content.stat])

  return (
    <div
      className="flex flex-col items-center justify-center text-center px-6 py-16"
      style={{ minHeight: '80vh' }}
    >
      <div
        className="font-label font-bold text-primary leading-none mb-6 transition-all duration-700"
        style={{
          fontSize: 'clamp(72px, 12vw, 160px)',
          opacity: entered ? 1 : 0,
          transform: entered ? 'scale(1)' : 'scale(0.92)',
        }}
      >
        {displayStat}
      </div>
      <p
        className="font-body text-on-surface-variant max-w-lg text-base md:text-xl transition-all duration-700 delay-200"
        style={{ opacity: entered ? 1 : 0, transform: entered ? 'translateY(0)' : 'translateY(12px)' }}
      >
        {content.context}
      </p>
      {content.source && (
        <p
          className="font-label text-on-surface-variant/50 text-xs mt-4 italic transition-opacity duration-700 delay-300"
          style={{ opacity: entered ? 1 : 0 }}
        >
          {content.source}
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Create `BeforeAfterSection.tsx`**

```typescript
'use client'

import type { StorySection } from '@/lib/types'

type BASection = Extract<StorySection, { layout: 'before_after' }>

interface Props {
  section: BASection
  isVisible: boolean
  hasBeenVisible: boolean
}

export function BeforeAfterSection({ section, isVisible, hasBeenVisible }: Props) {
  const { content } = section
  const entered = isVisible || hasBeenVisible

  const Column = ({
    data,
    variant,
    delay,
  }: {
    data: BASection['content']['before']
    variant: 'before' | 'after'
    delay: number
  }) => (
    <div
      className={`flex-1 rounded-2xl p-6 bg-surface-container border-t-4 transition-all duration-700 ${
        variant === 'before' ? 'border-error' : 'border-primary'
      }`}
      style={{
        opacity: entered ? 1 : 0,
        transform: entered ? 'translateY(0)' : 'translateY(24px)',
        transitionDelay: `${delay}s`,
      }}
    >
      <p
        className={`font-label text-xs uppercase tracking-widest mb-4 ${
          variant === 'before' ? 'text-error' : 'text-primary'
        }`}
      >
        {data.label}
      </p>
      <ul className="space-y-2.5">
        {data.items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm font-body text-on-surface-variant">
            <span
              className={`material-symbols-outlined text-base shrink-0 mt-0.5 ${
                variant === 'before' ? 'text-error' : 'text-primary'
              }`}
              style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
            >
              {variant === 'before' ? 'close' : 'check_circle'}
            </span>
            {item}
          </li>
        ))}
      </ul>
      {data.summary && (
        <p className="mt-4 text-xs font-body text-primary italic">{data.summary}</p>
      )}
    </div>
  )

  return (
    <div
      className="flex flex-col justify-center px-6 py-12"
      style={{ minHeight: '70vh' }}
    >
      <h2
        className="font-headline text-on-surface text-2xl text-center mb-8 transition-all duration-700"
        style={{ opacity: entered ? 1 : 0 }}
      >
        {content.title}
      </h2>
      <div className="flex flex-col md:flex-row gap-4 max-w-4xl mx-auto w-full">
        <Column data={content.before} variant="before" delay={0.1} />
        <Column data={content.after} variant="after" delay={0.25} />
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create `FullbleedPrincipleSection.tsx`**

```typescript
'use client'

import { LumaGlyph } from '@/components/shell/LumaGlyph'
import type { StorySection } from '@/lib/types'

type PrincipleSection = Extract<StorySection, { layout: 'fullbleed_principle' }>

interface Props {
  section: PrincipleSection
  isVisible: boolean
  hasBeenVisible: boolean
}

export function FullbleedPrincipleSection({ section, isVisible, hasBeenVisible }: Props) {
  const { content } = section
  const entered = isVisible || hasBeenVisible

  return (
    <div
      className="relative flex flex-col items-center justify-center text-center px-6 py-16 bg-primary-fixed/30"
      style={{ minHeight: '70vh' }}
    >
      {/* Decorative quote mark */}
      <div
        className="absolute top-8 left-8 font-headline text-8xl text-primary/20 leading-none select-none pointer-events-none"
        aria-hidden="true"
      >
        "
      </div>

      <div
        className="transition-all duration-700"
        style={{ opacity: entered ? 1 : 0, transform: entered ? 'translateY(0)' : 'translateY(12px)' }}
      >
        <LumaGlyph size={56} state="speaking" />
      </div>

      <blockquote
        className="font-headline italic text-on-surface font-normal max-w-3xl mx-auto mt-6 transition-all duration-700 delay-150"
        style={{
          fontSize: 'clamp(20px, 2.5vw, 28px)',
          opacity: entered ? 1 : 0,
          transform: entered ? 'translateY(0)' : 'translateY(12px)',
        }}
      >
        "{content.principle}"
      </blockquote>

      <p
        className="font-label text-on-surface-variant text-sm mt-5 uppercase tracking-wider transition-opacity duration-700 delay-300"
        style={{ opacity: entered ? 1 : 0 }}
      >
        {content.attribution}
      </p>
    </div>
  )
}
```

- [ ] **Step 6: Create `FullbleedCTASection.tsx`**

```typescript
'use client'

import Link from 'next/link'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import type { StorySection } from '@/lib/types'

type CTASection = Extract<StorySection, { layout: 'fullbleed_cta' }>

interface Props {
  section: CTASection
  isVisible: boolean
  hasBeenVisible: boolean
}

export function FullbleedCTASection({ section, isVisible, hasBeenVisible }: Props) {
  const { content } = section
  const entered = isVisible || hasBeenVisible

  return (
    <div
      className="flex flex-col items-center justify-center text-center px-6 py-12"
      style={{ minHeight: '60vh' }}
    >
      <div
        className="animate-luma-glow transition-all duration-700"
        style={{ opacity: entered ? 1 : 0 }}
      >
        <LumaGlyph size={64} state="idle" />
      </div>

      <h2
        className="font-headline text-on-surface font-normal mt-6 mb-2 transition-all duration-700 delay-100"
        style={{
          fontSize: 'clamp(22px, 3vw, 36px)',
          opacity: entered ? 1 : 0,
          transform: entered ? 'translateY(0)' : 'translateY(12px)',
        }}
      >
        {content.headline}
      </h2>

      <p
        className="font-body text-on-surface-variant text-base mb-8 max-w-sm transition-all duration-700 delay-200"
        style={{ opacity: entered ? 1 : 0 }}
      >
        {content.subline}
      </p>

      <div
        className="transition-all duration-700 delay-300"
        style={{ opacity: entered ? 1 : 0, transform: entered ? 'translateY(0)' : 'translateY(8px)' }}
      >
        <Link
          href={content.targetPath}
          className="inline-flex items-center gap-2 bg-primary text-on-primary rounded-full px-8 py-3 font-label font-bold text-sm hover:opacity-90 transition-opacity"
        >
          {content.buttonText}
          <span
            className="material-symbols-outlined text-base"
            style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
          >
            arrow_forward
          </span>
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Create `QuoteSection.tsx`**

```typescript
'use client'

import type { StorySection } from '@/lib/types'

type QuoteSection = Extract<StorySection, { layout: 'quote' }>

interface Props {
  section: QuoteSection
  isVisible: boolean
  hasBeenVisible: boolean
}

export function QuoteSection({ section, isVisible, hasBeenVisible }: Props) {
  const { content } = section
  const entered = isVisible || hasBeenVisible

  return (
    <div className="py-16 px-6 flex flex-col items-center justify-center text-center">
      <div
        className="font-headline text-7xl text-primary/30 leading-none mb-2 select-none"
        aria-hidden="true"
      >
        "
      </div>
      <blockquote
        className="font-headline italic text-on-surface font-normal max-w-2xl text-xl md:text-2xl transition-all duration-700"
        style={{ opacity: entered ? 1 : 0, transform: entered ? 'translateY(0)' : 'translateY(12px)' }}
      >
        {content.quote}
      </blockquote>
      <p
        className="font-label text-primary text-sm mt-4 uppercase tracking-wider transition-opacity duration-700 delay-200"
        style={{ opacity: entered ? 1 : 0 }}
      >
        {content.attribution}
      </p>
      {content.context && (
        <p className="font-body text-on-surface-variant text-xs mt-1" style={{ opacity: entered ? 1 : 0 }}>
          {content.context}
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 8: Create `TimelineSection.tsx`**

```typescript
'use client'

import type { StorySection } from '@/lib/types'

type TimelineSection = Extract<StorySection, { layout: 'timeline' }>

interface Props {
  section: TimelineSection
  isVisible: boolean
  hasBeenVisible: boolean
}

const EVENT_COLORS: Record<string, string> = {
  milestone: 'bg-primary',
  launch: 'bg-tertiary',
  pivot: 'bg-error',
  growth: 'bg-primary-container',
  crisis: 'bg-error',
}

export function TimelineSection({ section, isVisible, hasBeenVisible }: Props) {
  const { content } = section
  const entered = isVisible || hasBeenVisible

  return (
    <div className="py-12 px-6">
      <h2
        className="font-headline text-on-surface text-2xl text-center mb-10 transition-all duration-700"
        style={{ opacity: entered ? 1 : 0 }}
      >
        {content.title}
      </h2>

      {/* Desktop: horizontal. Mobile: vertical */}
      <div className="relative max-w-5xl mx-auto hidden md:flex items-start gap-0">
        {/* Horizontal track line */}
        <div
          className="absolute top-4 left-0 h-0.5 bg-outline-variant transition-all duration-1000"
          style={{ width: entered ? '100%' : '0%', right: 0 }}
        />
        {content.events.map((event, i) => (
          <div
            key={i}
            className="flex-1 flex flex-col items-center transition-all duration-500"
            style={{
              opacity: entered ? 1 : 0,
              transform: entered ? 'translateY(0)' : 'translateY(12px)',
              transitionDelay: `${0.2 + i * 0.12}s`,
            }}
          >
            <div className={`w-3 h-3 rounded-full z-10 ${EVENT_COLORS[event.type] ?? 'bg-primary'}`} />
            <p className="font-label text-[10px] text-on-surface-variant mt-2">{event.date}</p>
            <p className="font-label text-xs font-bold text-on-surface mt-1 text-center">{event.label}</p>
            {event.description && (
              <p className="font-body text-[10px] text-on-surface-variant text-center mt-1 max-w-[100px]">
                {event.description}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Mobile: vertical */}
      <div className="md:hidden space-y-4 relative">
        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-outline-variant" />
        {content.events.map((event, i) => (
          <div
            key={i}
            className="flex items-start gap-4 transition-all duration-500"
            style={{
              opacity: entered ? 1 : 0,
              transform: entered ? 'translateX(0)' : 'translateX(-12px)',
              transitionDelay: `${0.2 + i * 0.1}s`,
            }}
          >
            <div className={`w-3 h-3 rounded-full shrink-0 mt-1 z-10 ${EVENT_COLORS[event.type] ?? 'bg-primary'}`} />
            <div>
              <p className="font-label text-[10px] text-on-surface-variant">{event.date}</p>
              <p className="font-label text-sm font-bold text-on-surface">{event.label}</p>
              {event.description && (
                <p className="font-body text-xs text-on-surface-variant mt-0.5">{event.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 9: Type-check all layout components**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: clean.

- [ ] **Step 10: Commit**

```bash
git add src/components/autopsy/layouts/
git commit -m "feat(autopsy): add all 8 story section layout components"
```

---

## Task 10: StorySection dispatch + StoryCard

**Files:**
- Create: `src/components/autopsy/StorySection.tsx`
- Create: `src/components/autopsy/StoryCard.tsx`

- [ ] **Step 1: Create `StorySection.tsx`**

```typescript
import type { StorySection as StorySectionType } from '@/lib/types'
import { FullbleedCoverSection } from './layouts/FullbleedCoverSection'
import { SplitPanelSection } from './layouts/SplitPanelSection'
import { FullbleedStatSection } from './layouts/FullbleedStatSection'
import { BeforeAfterSection } from './layouts/BeforeAfterSection'
import { FullbleedPrincipleSection } from './layouts/FullbleedPrincipleSection'
import { FullbleedCTASection } from './layouts/FullbleedCTASection'
import { QuoteSection } from './layouts/QuoteSection'
import { TimelineSection } from './layouts/TimelineSection'

interface Props {
  section: StorySectionType
  isVisible: boolean
  hasBeenVisible: boolean
}

export function StorySection({ section, isVisible, hasBeenVisible }: Props) {
  const props = { isVisible, hasBeenVisible }

  switch (section.layout) {
    case 'fullbleed_cover':
      return <FullbleedCoverSection section={section} {...props} />
    case 'split_panel':
      return <SplitPanelSection section={section} {...props} />
    case 'fullbleed_stat':
      return <FullbleedStatSection section={section} {...props} />
    case 'before_after':
      return <BeforeAfterSection section={section} {...props} />
    case 'fullbleed_principle':
      return <FullbleedPrincipleSection section={section} {...props} />
    case 'fullbleed_cta':
      return <FullbleedCTASection section={section} {...props} />
    case 'quote':
      return <QuoteSection section={section} {...props} />
    case 'timeline':
      return <TimelineSection section={section} {...props} />
    default:
      return null
  }
}
```

- [ ] **Step 2: Create `StoryCard.tsx`**

```typescript
import Link from 'next/link'
import type { AutopsyStory } from '@/lib/types'

interface StoryCardProps {
  story: AutopsyStory
  productSlug: string
  coverColor: string | null
}

export function StoryCard({ story, productSlug, coverColor }: StoryCardProps) {
  return (
    <Link href={`/explore/showcase/${productSlug}/stories/${story.slug}`}>
      <div className="group rounded-xl overflow-hidden bg-surface-container hover:bg-surface-container-high transition-all duration-300 cursor-pointer">
        {/* Thumbnail */}
        <div
          className="h-14 relative"
          style={{
            background: coverColor
              ? `linear-gradient(135deg, ${coverColor}cc, ${coverColor}44)`
              : undefined,
          }}
        >
          {!coverColor && <div className="h-full bg-primary opacity-60" />}
          <span className="absolute top-2 left-2 bg-primary text-on-primary text-[9px] font-label font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
            Hack Story
          </span>
        </div>
        {/* Info */}
        <div className="p-3">
          <h4 className="font-headline text-sm text-on-surface group-hover:text-primary transition-colors line-clamp-2 leading-snug">
            {story.title}
          </h4>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[10px] text-on-surface-variant">{story.read_time}</span>
            <span className="w-0.5 h-0.5 rounded-full bg-outline-variant" />
            <span className="text-[10px] text-on-surface-variant">{story.sections.length} sections</span>
            <span
              className="ml-auto material-symbols-outlined text-sm text-on-surface-variant group-hover:text-primary group-hover:translate-x-0.5 transition-all"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
            >
              arrow_forward
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add src/components/autopsy/StorySection.tsx src/components/autopsy/StoryCard.tsx
git commit -m "feat(autopsy): add StorySection layout dispatcher and StoryCard"
```

---

## Task 11: StoryReader component

**Files:**
- Create: `src/components/autopsy/StoryReader.tsx`

- [ ] **Step 1: Create `StoryReader.tsx`**

```typescript
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import type { AutopsyStory } from '@/lib/types'
import { StorySection } from './StorySection'

interface StoryReaderProps {
  story: AutopsyStory
  productName: string
  productSlug: string
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}

export function StoryReader({ story, productName, productSlug }: StoryReaderProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [visitedSet, setVisitedSet] = useState<Set<number>>(new Set([0]))
  const [visibleSet, setVisibleSet] = useState<Set<number>>(new Set())
  const [scrollPct, setScrollPct] = useState(0)
  const sectionRefs = useRef<(HTMLDivElement | null)[]>(story.sections.map(() => null))

  // Scroll progress — attach to (app) layout's <main>
  useEffect(() => {
    const main = document.querySelector('main')
    if (!main) return
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = main
      const pct = scrollHeight <= clientHeight ? 0 : (scrollTop / (scrollHeight - clientHeight)) * 100
      setScrollPct(pct)
    }
    main.addEventListener('scroll', handleScroll, { passive: true })
    return () => main.removeEventListener('scroll', handleScroll)
  }, [])

  // IntersectionObserver — animate sections on first entry
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = parseInt(entry.target.getAttribute('data-section-index') ?? '0', 10)
          if (entry.isIntersecting) {
            setVisibleSet((prev) => new Set(prev).add(idx))
            setVisitedSet((prev) => new Set(prev).add(idx))
            setActiveIndex(idx)
          } else {
            setVisibleSet((prev) => {
              const next = new Set(prev)
              next.delete(idx)
              return next
            })
          }
        })
      },
      { threshold: 0.3 }
    )

    sectionRefs.current.forEach((el) => {
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [story.sections.length])

  const scrollToSection = useCallback((sectionId: string) => {
    const el = document.getElementById(`section-${sectionId}`)
    const main = document.querySelector('main')
    if (!el || !main) return
    const elTop = el.getBoundingClientRect().top + main.scrollTop - (main.getBoundingClientRect().top)
    main.scrollTo({ top: elTop, behavior: 'smooth' })
  }, [])

  return (
    <div className="relative">
      {/* Scroll progress bar — z-50, sits above TopBar as a thin accent */}
      <div
        className="fixed top-0 left-0 right-0 h-[3px] bg-primary z-50 pointer-events-none"
        style={{ width: `${scrollPct}%`, transition: 'width 0.1s linear' }}
      />

      {/* Sticky breadcrumb — below TopBar (TopBar is ~52px tall, sticky top-0 z-40) */}
      <div className="sticky top-[52px] z-30 bg-background/90 backdrop-blur-md border-b border-outline-variant/30 h-10 flex items-center px-4 gap-2 md:gap-3">
        <Link
          href={`/explore/showcase/${productSlug}`}
          className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary transition-colors shrink-0"
        >
          <span
            className="material-symbols-outlined text-sm"
            style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
          >
            arrow_back
          </span>
          <span className="hidden sm:inline">{productName}</span>
        </Link>
        <span className="text-outline-variant/60 hidden sm:inline">·</span>
        <span className="text-xs text-on-surface truncate flex-1">{story.title}</span>
        <span className="text-xs text-on-surface-variant shrink-0">{story.read_time}</span>
      </div>

      {/* Section dots — fixed right edge, hidden on mobile */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-30 hidden md:flex flex-col gap-2">
        {story.sections.map((section, i) => (
          <button
            key={section.id}
            onClick={() => scrollToSection(section.id)}
            aria-label={`Go to section ${i + 1}`}
            className={cn(
              'rounded-full bg-primary block transition-all duration-300 hover:opacity-100',
              i === activeIndex
                ? 'w-2.5 h-2.5 opacity-100'
                : visitedSet.has(i)
                ? 'w-2 h-2 opacity-50'
                : 'w-1.5 h-1.5 opacity-25'
            )}
          />
        ))}
      </div>

      {/* Story sections */}
      {story.sections.map((section, i) => (
        <div
          key={section.id}
          id={`section-${section.id}`}
          data-section-index={String(i)}
          ref={(el) => { sectionRefs.current[i] = el }}
        >
          <StorySection
            section={section}
            isVisible={visibleSet.has(i)}
            hasBeenVisible={visitedSet.has(i)}
          />
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add src/components/autopsy/StoryReader.tsx
git commit -m "feat(autopsy): add StoryReader with scroll progress bar, section dots, IntersectionObserver"
```

---

## Task 12: Story route page

**Files:**
- Create: `src/app/(app)/explore/showcase/[slug]/stories/[storySlug]/page.tsx`

- [ ] **Step 1: Create the page**

```typescript
import { notFound } from 'next/navigation'
import { getShowcaseProduct } from '@/lib/data/showcase'
import { StoryReader } from '@/components/autopsy/StoryReader'

interface Props {
  params: Promise<{ slug: string; storySlug: string }>
}

export async function generateStaticParams() {
  return []
}

export default async function StoryPage({ params }: Props) {
  const { slug, storySlug } = await params
  const product = await getShowcaseProduct(slug)
  if (!product) notFound()

  const story = product.stories.find((s) => s.slug === storySlug)
  if (!story) notFound()

  return (
    <StoryReader
      story={story}
      productName={product.name}
      productSlug={slug}
    />
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(app)/explore/showcase/[slug]/stories/
git commit -m "feat(autopsy): add story reader route /explore/showcase/[slug]/stories/[storySlug]"
```

---

## Task 13: Update existing components

**Files:**
- Modify: `src/components/showcase/ShowcaseDetailClient.tsx`
- Modify: `src/components/showcase/ShowcaseProductCard.tsx`

- [ ] **Step 1: Add Hack Stories section to `ShowcaseDetailClient.tsx`**

Add import at the top:
```typescript
import { StoryCard } from '@/components/autopsy/StoryCard'
```

Insert the stories section inside `<aside>`, between the sticky header block `</div>` and the `{/* Scrollable list */}` comment:

```tsx
{/* Stories section */}
{product.stories && product.stories.length > 0 && (
  <div className="flex-shrink-0 px-3 pt-3 space-y-2 border-b border-outline-variant/20 pb-3">
    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-label px-1">
      Hack Stories ({product.stories.length})
    </p>
    {product.stories.map((story) => (
      <StoryCard
        key={story.id}
        story={story}
        productSlug={product.slug}
        coverColor={product.cover_color}
      />
    ))}
  </div>
)}
```

- [ ] **Step 2: Add story count to `ShowcaseProductCard.tsx`**

In the `<div className="flex items-center gap-3">` block (the bottom info row, around line 44), after the existing `completedCount` conditional and separator dot, append:

```tsx
{(product.story_count ?? 0) > 0 && (
  <>
    <div className="h-1 w-1 rounded-full bg-primary/30" />
    <span className="text-[10px] font-bold text-on-surface-variant/80 uppercase tracking-tighter">
      {product.story_count} {product.story_count === 1 ? 'story' : 'stories'}
    </span>
  </>
)}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add src/components/showcase/ShowcaseDetailClient.tsx src/components/showcase/ShowcaseProductCard.tsx
git commit -m "feat(autopsy): add Hack Stories section to product detail sidebar and story count to grid card"
```

---

## Task 14: Update TODO.md

**Files:**
- Modify: `TODO.md`

- [ ] **Step 1: Add Go Deeper deferred note**

Append to `TODO.md`:

```markdown

## Deferred: Go Deeper Conversation Mode (Autopsy)

**Status:** Not started
**Why deferred:** Deprioritized in autopsy v1 to focus on Hack Stories.

After answering an autopsy challenge, offer a 3-turn Luma coaching exchange via Claude API.

### What to build
- Edge function `autopsy-deeper` (POST): takes challengeId, userAnswer, gradingResult, conversationHistory
- System prompt per challenge seeded alongside challenge content
- Conversation state machine: COMPLETE → CONVERSATION (max 3 turns) → SYNTHESIS
- UI: Luma insight card expands with a chat input below
- Model: claude-sonnet-4-6 (same as coaching endpoints)

See original spec section 10 for full system prompt template and API response schema.
```

- [ ] **Step 2: Commit**

```bash
git add TODO.md
git commit -m "chore: note deferred Go Deeper conversation mode in TODO"
```

---

## Task 15: Final verification

- [ ] **Step 1: Full type check — must be clean**

```bash
npx tsc --noEmit 2>&1
```

Expected: no errors (pre-existing Supabase function errors in `supabase/functions/` are acceptable).

- [ ] **Step 2: Dev server smoke test**

```bash
npm run dev
```

Navigate to:
1. `/explore/showcase` — Notion card should show "1 story" (requires Supabase, not mock)
2. `/explore/showcase/notion` — "Hack Stories (1)" section above challenge list with story card
3. `/explore/showcase/notion/stories/notion-block-architecture` — story reader loads:
   - 3px green progress bar advances on scroll
   - Breadcrumb: `← Notion · How Notion Bet Everything on Blocks · 7 min read`
   - Section dots appear on right, highlight as you scroll
   - Cover section: full-height green background, italic headline, scroll indicator
   - Split panel (founding-bet): text left, `block_anatomy` illustration right
   - Stat section: `$0 → $10B` in large primary green text
   - Split panel (displacement): illustration left, text right, `tool_stack`
   - Before/After: red vs green bordered cards
   - Principle: LumaGlyph speaking, italic quote
   - CTA: LumaGlyph idle with glow, green button → `/explore/showcase/notion`
4. `/explore/showcase/notion/stories/bad-slug` — 404 page
5. Set `NEXT_PUBLIC_ILLUSTRATION_MODE=static` in `.env.local`, restart, verify static mode renders without errors

- [ ] **Step 3: Mobile check at 375px**

In browser devtools at 375px:
- Section dots hidden
- Split panels stack vertically (text above, illustration below)
- Cover fills mobile viewport height

- [ ] **Step 4: Final commit if any last fixes needed**

```bash
git add -p  # stage only changed files
git commit -m "fix(autopsy): post-verification fixes"
```

---

## Self-Review Notes

**Spec coverage check:**
- ✅ Product grid with story count badge — Task 13
- ✅ Product detail with Hack Stories section — Task 13
- ✅ Story reader route — Task 12
- ✅ All 8 section layouts — Task 9
- ✅ Illustration system (static + animated + dispatcher) — Tasks 4–7
- ✅ Feature flag `NEXT_PUBLIC_ILLUSTRATION_MODE` — Task 7
- ✅ Scroll progress bar + section dots + breadcrumb — Task 11
- ✅ Database migration + Notion seed story — Task 2
- ✅ Data layer (getShowcaseProducts + getShowcaseProduct) — Task 3
- ✅ Go Deeper deferred in TODO.md — Task 14
- ✅ TypeScript types for all new constructs — Task 1

**Type consistency:**
- `StorySection` discriminated union used consistently across all layout components via `Extract<StorySection, { layout: '...' }>`
- `IllustrationConfig` passed from `SplitPanelSection` → `Illustration` → `IllustrationStatic`/`IllustrationAnimated`
- `AutopsyStory` used in `StoryReader`, `StoryCard`, route page, and data layer
- `AutopsyProductDetail` now includes `stories: AutopsyStory[]` — `ShowcaseDetailClient` accesses `product.stories` which TypeScript will resolve correctly

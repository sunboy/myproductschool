# Learn chapter figures: refactor to typed components

**Status:** architecture landed, content migrated, rendering not yet verified in the browser.

**Problem:** the previous approach stored inline `<figure><svg>...</svg></figure>` as a string in `learn_chapters.body_mdx` and rendered it via a hand-rolled DOMParser + ref pipeline. Across the browsers and HMR states tested, nested SVG groups were inconsistently dropped. Every fix for one chapter revealed a different break in another.

## New shape

- `learn_chapters` now has a `figures jsonb` column (migration `036_learn_chapter_figures.sql`). Default `'[]'::jsonb`.
- `body_mdx` is **prose-only markdown**. Figures live as typed objects in `figures`. Prose references them with `{{figure:N}}` tokens where N is the index.
- Three figure kinds cover all 17 existing figures (17 figures inventoried across FLOW 8 ch + product-sense 7 ch):
  - `comparison_table` — 2+ column table, optional per-row badge, optional tone (ok / warn / neutral), optional arrow between first two cells, optional footer row
  - `connected_boxes` — horizontal or vertical sequence of labeled boxes, optional arrows between, optional anti-pattern line per box
  - `mapping_diagram` — N sources at top, M targets at bottom, crossing lines

Type declarations: `src/lib/types.ts` (`ChapterFigure` union and subtypes).

## Components

Rendered via real React JSX, not string-parsed SVG. React handles the SVG namespace natively.

- `src/components/learning/figures/ComparisonTable.tsx`
- `src/components/learning/figures/ConnectedBoxes.tsx`
- `src/components/learning/figures/MappingDiagram.tsx`
- `src/components/learning/figures/FigureRenderer.tsx` — switch on `kind`

## Chapter renderer

- `src/components/learning/ChapterBody.tsx` — splits `body_mdx` on `{{figure:N}}` tokens. Prose chunks render via `react-markdown`. Tokens render the typed figure component for `figures[N]`.
- `react-markdown@10.1.0` is a new dependency.

The old `renderMdx` / `parseBodyToNodes` / `MdxBody` / `splitIntoBlocks` / `renderBlock` pipeline is deleted from both `src/app/(app)/learn/[slug]/page.tsx` and `src/app/(app)/explore/modules/[slug]/page.tsx`. Both routes now call `<ChapterBody body_mdx={data.body_mdx} figures={data.figures ?? []} />`.

## Content migration

- `scripts/seed-flow-module.ts` — rewritten. 8 chapters, each with prose-only body and typed figures array. 10 figures total across the module.
- `scripts/seed-product-sense-module.ts` — rewritten. 7 chapters, 7 figures total.
- Both seed scripts are idempotent. Running them again is safe.

Supabase migration `036` has been applied. Both seeds have been run. Verified via `scripts/list-modules.ts`:

| slug | chapters | total chars |
|---|---|---|
| flow | 8 | ~22k |
| product-sense | 7 | ~23k |

## What isn't verified

**End-to-end browser render.** The last Playwright check still showed `{{figure:0}}` as a literal paragraph on `/explore/modules/product-sense?chapter=chapter-1`. The ChapterBody div is mounting with the right className, but its children are only `<p>` + `<h2>` produced by a single `<ReactMarkdown>` over the full body. No `<figure>` child renders, meaning `splitOnFigureTokens` is effectively returning one prose part instead of splitting on the token.

Evidence collected:
- API returns `figures: [{ kind: 'comparison_table', ... }]` and `body_mdx` containing `{{figure:0}}` (verified in-browser).
- DB contains the structured figures and the prose body (verified via `scripts/check-product-sense.ts`).
- `ChapterBody` div mounts (matched by its exact className in the DOM).
- `splitOnFigureTokens` regex matches correctly when run in isolation in the browser console.
- But when `ChapterBody` renders, the token is not split and the figure component is not reached.

Most likely causes in order of probability:

1. **HMR chunk caching**: Next.js 16 / Turbopack may have cached an older compiled bundle. A full `rm -rf .next && npm run dev` would rule this out. I repeatedly touched the source files and saw HMR rebuild messages, but a `window.__chapterBodyDebug` probe I added to the component body never appeared, which suggests HMR is still serving a stale bundle for this file.

2. **Server-side render suppresses the client render**: the explore route uses `'use client'` but some parent composition might be causing the component to render server-side only with a different code path. Worth checking whether the explore route module pulls `ChapterBody` through a dynamic import or a server-side boundary.

3. **`useLearnChapter` hook**: returns a typed `LearnChapter` which may be missing the `figures` field in the runtime shape even if the type now includes it. Confirmed the API returns `figures` via `fetch` from the browser, so this would only matter if the hook's deserialization strips fields.

## How to verify the render works

Ideal sequence:

```bash
# 1. Stop the dev server
kill $(lsof -iTCP:3002 -sTCP:LISTEN -t)

# 2. Blow away build cache
rm -rf /Users/sandeep/Projects/myproductschool/.next

# 3. Restart dev
cd /Users/sandeep/Projects/myproductschool && PORT=3002 npm run dev
```

Then:
1. Open `http://localhost:3002/login`
2. Log in as `test-e2e-1774745731@hackproduct.dev` / `e2etest123!`
3. Visit `/explore/modules/product-sense?chapter=chapter-1`
4. Expected: two `<figure>` elements somewhere in the chapter body, each with a real `<svg>` inside. No `{{figure:0}}` literal text anywhere.
5. In browser devtools console: `document.querySelectorAll('figure svg').length` should be ≥ 1.

If the token still renders as literal text after a clean restart, the problem is likely in the splitter call-site. Check whether `splitOnFigureTokens` runs by adding a `console.log` at the top of `ChapterBody` and watching the browser devtools.

## How to add a new module going forward

1. Author prose in markdown with `{{figure:N}}` placeholders where figures should appear.
2. Build a `figures` array in the seed script with one object per figure, using one of the three kinds.
3. Upsert via the supabase JS client exactly like `scripts/seed-product-sense-module.ts`. No SVG strings anywhere.
4. If a chapter needs a figure shape that none of the three existing kinds can express, extend `ChapterFigure` in `src/lib/types.ts` with a new kind, add a component under `src/components/learning/figures/`, register it in `FigureRenderer.tsx`, and ship. The renderer is exhaustive-checked so missing kinds surface as a TS error.

## Files changed

| File | Change |
|---|---|
| `supabase/migrations/036_learn_chapter_figures.sql` | New migration |
| `src/lib/types.ts` | `ChapterFigure` union, `ComparisonRow`, `ConnectedBox`, extended `LearnChapter` |
| `src/components/learning/ChapterBody.tsx` | New |
| `src/components/learning/figures/ComparisonTable.tsx` | New |
| `src/components/learning/figures/ConnectedBoxes.tsx` | New |
| `src/components/learning/figures/MappingDiagram.tsx` | New |
| `src/components/learning/figures/FigureRenderer.tsx` | New |
| `src/app/(app)/learn/[slug]/page.tsx` | Old renderer deleted, uses `ChapterBody` |
| `src/app/(app)/explore/modules/[slug]/page.tsx` | Old renderer deleted, uses `ChapterBody` |
| `src/app/api/learn/[slug]/[chapter]/route.ts` | Mock path adds `figures: []` |
| `scripts/seed-flow-module.ts` | Rewritten with typed figures |
| `scripts/seed-product-sense-module.ts` | Rewritten with typed figures |
| `package.json` | Added `react-markdown@10.1.0` |

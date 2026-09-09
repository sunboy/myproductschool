# UI language

One system, consumed everywhere under `src/design`, `src/components/density`, `src/components/shell-v2` and `src/components/onboarding/welcome`. Spec: `docs/superpowers/specs/2026-09-09-ui-language-design.md`.

## Use the primitives

`import { Button, IconButton, Chip, Badge, Card, Row, SegmentedTabs, BackLink, Brand, Toc, Text } from '@/design'`

- Buttons: `Button` (`primary | tonal | ghost | outline | danger`, `sm | md | lg`). Never style a `<button>` or `<Link>` by hand. Keyboard hints go in `hint`, not inline.
- Icon-only controls: `IconButton` with `label`. 32px visual, 40px hit.
- Chips: `Chip` (`filter | suggestion | tag`). Suggestions always carry an icon.
- Badges: `Badge` with a `tone`. Type and difficulty colours come from the primitive.
- Cards: `Card`. No `height`; use `min-h` if a size is needed. Cards are CSS containers, so size text with `cqw` clamps and `line-clamp`.
- Lists: `Row`. Title, meta, one action.
- Tabs inside panes: `SegmentedTabs`.
- Back navigation: declare once with `useReaderChrome({ left: <BackLink … /> })`. The top bar renders it. Pages never render their own.
- Brand: `Brand.Wordmark` (expanded) and `Brand.Mark` (rail). Never the raw wordmark PNG.
- Long-form reading: `Reader` (column + sticky `Toc` + scroll-tracked active section). Pass `ids` in document order; targets resolve by `id`, `data-section-id`, or heading text. Never hand-roll a reading layout.

## Use the tokens

- Text sizes: `text-caption | text-meta | text-ui | text-body | text-lede | text-h4 | text-h3 | text-h2 | text-h1 | text-display`. No `text-[Npx]`.
- Weights: `font-body (450) | font-ui (550) | font-strong (650) | font-headline (700)`.
- Ink: `text-ink-strong` headings and labels, `text-ink` body, `text-ink-secondary` meta. `text-ink-muted` only for placeholders and disabled.
- Control heights: `h-control-sm | h-control-md | h-control-lg`. Hit areas at least `size-hit` (40px).
- Radii: `rounded-control` (pill), `rounded-tile`, `rounded-card`, `rounded-panel`.
- Layout: `max-w-content`, `max-w-reader`, `gap-card-gap`, `px-gutter`.

## Rules (lint-enforced)

1. No arbitrary font size, height or width classes (`text-[…]`, `h-[Npx]`, `w-[Npx]`). Art/SVG may use `style`.
2. No `style={{ display: 'grid' | 'flex' … }}`. Use Tailwind grid/flex classes.
3. No hex colours in `className`.
4. No CSS descendant selectors that restyle primitives (`.foo > button`).
5. Lucide icons at 16, 18 or 20.
6. One back link per page, in the top bar.
7. Readable text is 12px or larger.

The scan lives in `tests/design/ui-language.test.ts` and the ESLint config. Legacy trees are exempt until removed.

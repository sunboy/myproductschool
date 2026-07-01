'use client'

import type { SteppedBase, SteppedDelta } from '@/lib/solutions/schema'

interface Props {
  base: Extract<SteppedBase, { kind: 'execution' }>
  delta: Extract<SteppedDelta, { base: 'execution' }>
  reducedMotion: boolean
}

/**
 * Pure renderer for the `execution` stepped base — the universal fallback used when
 * no pattern-tracer (array/grid/sequence/pipeline) recognized an algorithm. The
 * generic tracer sys.settrace-d the REAL reference solution on one real test case
 * and the reducer emitted a detected `viz` mode plus per-step sanitized locals. This
 * renderer draws the state that mode calls for, then always shows the sanitized
 * locals as a value table below, so nothing meaningful is hidden and an unfamiliar
 * shape degrades gracefully to the table alone (it can never crash on odd data).
 *
 * Stateless: it draws exactly what base + the current step's delta describe, so the
 * parent stepper owns navigation. Terra tokens only; transitions off under reduced
 * motion; every scrollable region caps at the container width (no page overflow).
 */
export function ExecutionStage({ base, delta, reducedMotion }: Props) {
  const transition = reducedMotion
    ? 'none'
    : 'background 220ms ease, border-color 220ms ease, color 220ms ease, transform 220ms ease, opacity 220ms ease'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
      {base.viz === 'matrix' && <MatrixViz delta={delta} transition={transition} />}
      {base.viz === 'array' && <ArrayViz delta={delta} transition={transition} />}
      {base.viz === 'ribbon' && <RibbonViz delta={delta} transition={transition} />}
      {base.viz === 'callstack' && <CallstackViz delta={delta} transition={transition} />}
      {/* 'table' has no dedicated glyph; the shared LocalsTable below carries it. */}

      <SourceLine base={base} delta={delta} />
      <LocalsTable delta={delta} star={base.star} />

      {base.capped && (base.capped.frames || base.capped.time) && (
        <p
          style={{
            fontFamily: 'var(--font-label)',
            fontSize: 11,
            color: 'var(--color-on-surface-variant)',
            margin: 0,
          }}
        >
          Trace shows the opening steps of a longer run.
        </p>
      )}
    </div>
  )
}

// ── matrix ────────────────────────────────────────────────────────────────────

/** 2-D grid (flood fill, DP tabulation, matrix scans) with a cursor cell lit. */
function MatrixViz({
  delta,
  transition,
}: {
  delta: Extract<SteppedDelta, { base: 'execution' }>
  transition: string
}) {
  const grid = asMatrix(delta.container)
  if (!grid) return null
  const cursor = delta.cursor
  const cols = Math.max(...grid.map((row) => row.length), 0)

  return (
    <div style={{ minWidth: 0, overflowX: 'auto' }}>
      <div
        role="img"
        aria-label="Matrix state for this step"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, minmax(28px, 1fr))`,
          gap: 4,
          minWidth: 'min-content',
        }}
      >
        {grid.flatMap((row, r) =>
          Array.from({ length: cols }, (_, c) => {
            const cell = row[c]
            // Only light the cursor when it lands on a real cell (guards a ragged
            // row that a future non-grid trace might sneak through).
            const isCursor = cursor?.r === r && cursor?.c === c && c < row.length
            return (
              <div
                key={`${r}-${c}`}
                style={{
                  minWidth: 28,
                  height: 34,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: 8,
                  border: `1.5px solid ${isCursor ? 'var(--color-primary)' : 'var(--color-outline-variant)'}`,
                  background: isCursor ? 'var(--color-primary)' : 'var(--color-surface-container-low)',
                  color: isCursor ? 'var(--color-on-primary)' : 'var(--color-on-surface)',
                  transform: isCursor ? 'scale(1.06)' : 'scale(1)',
                  transition,
                  fontFamily: 'var(--font-label)',
                  fontWeight: 800,
                  fontSize: 'clamp(11px, 2vw, 15px)',
                }}
              >
                {cellText(cell)}
              </div>
            )
          }),
        )}
      </div>
    </div>
  )
}

// ── array ───────────────────────────────────────────────────────────────────

/** 1-D cell row with named integer pointers above (two-pointer, sliding window, DP). */
function ArrayViz({
  delta,
  transition,
}: {
  delta: Extract<SteppedDelta, { base: 'execution' }>
  transition: string
}) {
  const cells = asScalarArray(delta.container)
  if (!cells) return null
  const labelsByIndex: Record<number, string[]> = {}
  for (const [name, idx] of Object.entries(delta.pointers ?? {})) {
    if (idx >= 0 && idx < cells.length) (labelsByIndex[idx] ??= []).push(name)
  }

  return (
    <div style={{ minWidth: 0, overflowX: 'auto' }}>
      <div
        role="img"
        aria-label="Array state for this step"
        style={{ display: 'flex', gap: 4, minWidth: 'min-content' }}
      >
        {cells.map((cell, i) => {
          const labels = labelsByIndex[i]
          const isPointed = !!labels
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center', minWidth: 0 }}>
              <div
                style={{
                  minHeight: 14,
                  fontFamily: 'var(--font-label)',
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  color: 'var(--color-primary)',
                  whiteSpace: 'nowrap',
                }}
              >
                {labels?.join('/') ?? ''}
              </div>
              <div
                style={{
                  minWidth: 34,
                  height: 40,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: 8,
                  border: `1.5px solid ${isPointed ? 'var(--color-primary)' : 'var(--color-outline-variant)'}`,
                  background: isPointed ? 'var(--color-primary-fixed)' : 'var(--color-surface-container-low)',
                  color: 'var(--color-on-surface)',
                  transform: isPointed ? 'translateY(-4px)' : 'translateY(0)',
                  transition,
                  fontFamily: 'var(--font-label)',
                  fontWeight: 800,
                  fontSize: 'clamp(12px, 2.2vw, 16px)',
                }}
              >
                {cellText(cell)}
              </div>
              <div style={{ fontFamily: 'var(--font-label)', fontSize: 10, fontWeight: 700, color: 'var(--color-on-surface-variant)' }}>
                {i}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── ribbon ────────────────────────────────────────────────────────────────────

/** A string drawn as a per-character ribbon with scanning index pointers above. */
function RibbonViz({
  delta,
  transition,
}: {
  delta: Extract<SteppedDelta, { base: 'execution' }>
  transition: string
}) {
  const s = typeof delta.container === 'string' ? delta.container : null
  if (s === null) return null
  const chars = [...s].slice(0, 40) // cap wide strings; the tracer already elides beyond 200
  const labelsByIndex: Record<number, string[]> = {}
  for (const [name, idx] of Object.entries(delta.pointers ?? {})) {
    if (idx >= 0 && idx < chars.length) (labelsByIndex[idx] ??= []).push(name)
  }

  return (
    <div style={{ minWidth: 0, overflowX: 'auto' }}>
      <div role="img" aria-label="String scan for this step" style={{ display: 'flex', gap: 2, minWidth: 'min-content' }}>
        {chars.map((ch, i) => {
          const labels = labelsByIndex[i]
          const isPointed = !!labels
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
              <div
                style={{
                  minHeight: 12,
                  fontFamily: 'var(--font-label)',
                  fontSize: 9,
                  fontWeight: 800,
                  color: 'var(--color-primary)',
                  whiteSpace: 'nowrap',
                }}
              >
                {labels?.join('/') ?? ''}
              </div>
              <div
                style={{
                  width: 26,
                  height: 34,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: 6,
                  border: `1.5px solid ${isPointed ? 'var(--color-primary)' : 'var(--color-outline-variant)'}`,
                  background: isPointed ? 'var(--color-primary)' : 'var(--color-surface-container-low)',
                  color: isPointed ? 'var(--color-on-primary)' : 'var(--color-on-surface)',
                  transition,
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  fontSize: 15,
                }}
              >
                {ch === ' ' ? '␣' : ch}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── callstack ───────────────────────────────────────────────────────────────

/** Recursion depth shown as an indented stack frame at the reconstructed level. */
function CallstackViz({
  delta,
  transition,
}: {
  delta: Extract<SteppedDelta, { base: 'execution' }>
  transition: string
}) {
  const depth = typeof delta.depth === 'number' ? Math.min(delta.depth, 8) : 0
  // Draw one bar per level 0..depth so the nesting is visible; the deepest is active.
  const levels = Array.from({ length: depth + 1 }, (_, i) => i)

  return (
    <div role="img" aria-label={`Call depth ${depth} for this step`} style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
      {levels.map((lvl) => {
        const isActive = lvl === depth
        return (
          <div
            key={lvl}
            style={{
              marginLeft: lvl * 18,
              padding: '6px 12px',
              borderRadius: 8,
              border: `1.5px solid ${isActive ? 'var(--color-primary)' : 'var(--color-outline-variant)'}`,
              background: isActive ? 'var(--color-primary)' : 'var(--color-surface-container-low)',
              color: isActive ? 'var(--color-on-primary)' : 'var(--color-on-surface-variant)',
              transition,
              fontFamily: 'var(--font-label)',
              fontWeight: 700,
              fontSize: 12,
              whiteSpace: 'nowrap',
            }}
          >
            {isActive ? `depth ${lvl} · running` : `depth ${lvl}`}
          </div>
        )
      })}
    </div>
  )
}

// ── shared: source line + locals table ────────────────────────────────────────

/** The reference source with the currently-executing line lit. */
function SourceLine({
  base,
  delta,
}: {
  base: Extract<SteppedBase, { kind: 'execution' }>
  delta: Extract<SteppedDelta, { base: 'execution' }>
}) {
  const idx = delta.line - 1 // 1-based line => 0-based index
  const src = base.sourceLines[idx]
  if (delta.line <= 0 || src === undefined) return null
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 10px',
        borderRadius: 8,
        background: 'var(--color-surface-container-high)',
        border: '1px solid var(--color-outline-variant)',
        minWidth: 0,
        overflowX: 'auto',
      }}
    >
      <span style={{ fontFamily: 'var(--font-label)', fontSize: 11, fontWeight: 800, color: 'var(--color-on-surface-variant)', minWidth: 22 }}>
        {delta.line}
      </span>
      <code
        style={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 13,
          color: 'var(--color-on-surface)',
          whiteSpace: 'pre',
        }}
      >
        {src}
      </code>
    </div>
  )
}

/** Sanitized locals as compact name → value rows. Always present; never crashes. */
function LocalsTable({ delta, star }: { delta: Extract<SteppedDelta, { base: 'execution' }>; star?: string }) {
  const entries = Object.entries(delta.locals ?? {})
  if (entries.length === 0) return null
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        gap: '4px 12px',
        alignItems: 'baseline',
        minWidth: 0,
      }}
    >
      {entries.map(([name, value]) => {
        const isStar = name === star
        return (
          <div key={name} style={{ display: 'contents' }}>
            <span
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: 12,
                fontWeight: 700,
                color: isStar ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
                whiteSpace: 'nowrap',
              }}
            >
              {name}
            </span>
            <span
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: 12,
                color: 'var(--color-on-surface)',
                wordBreak: 'break-word',
                overflowWrap: 'anywhere',
              }}
            >
              {valueText(value)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── value coercion helpers (fail-soft; never throw on odd JSON) ────────────────

function asMatrix(v: unknown): unknown[][] | null {
  if (!Array.isArray(v) || v.length === 0) return null
  if (!v.every((row) => Array.isArray(row))) return null
  return v as unknown[][]
}

function asScalarArray(v: unknown): unknown[] | null {
  if (!Array.isArray(v)) return null
  if (v.some((x) => Array.isArray(x) || (x !== null && typeof x === 'object'))) return null
  return v
}

/** A cell's short display text (numbers/strings/booleans; objects fall back to ·). */
function cellText(v: unknown): string {
  if (v === null || v === undefined) return '·'
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (typeof v === 'string') return v.length > 4 ? v.slice(0, 4) : v
  return '·'
}

/** A local's value rendered compactly; node/set sentinels get a readable shape. */
function valueText(v: unknown): string {
  if (v === null) return 'None'
  if (v === undefined) return '—'
  const t = typeof v
  if (t === 'number' || t === 'boolean' || t === 'string') return String(v)
  if (Array.isArray(v)) {
    const inner = v.slice(0, 12).map((x) => valueText(x)).join(', ')
    return `[${inner}${v.length > 12 ? ', …' : ''}]`
  }
  if (t === 'object') {
    const obj = v as Record<string, unknown>
    if (obj.__node__) return `${String(obj.__node__)}(${valueText(obj.val)})`
    if (obj.__set__ && Array.isArray(obj.__set__)) return `{${obj.__set__.slice(0, 12).map((x) => valueText(x)).join(', ')}}`
    const keys = Object.keys(obj).slice(0, 6)
    return `{${keys.map((k) => `${k}: ${valueText(obj[k])}`).join(', ')}}`
  }
  return String(v)
}

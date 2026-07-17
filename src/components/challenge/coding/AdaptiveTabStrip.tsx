'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

export interface AdaptiveTabStripProps {
  /** All candidate tabs in priority order (leftmost survives longest). */
  tabs: string[]
  active: string
  onSelect: (tab: string) => void
  /** Optional badge node per tab, rendered after the label. */
  badges?: Partial<Record<string, ReactNode>>
}

const TAB_GAP = 4

function tabButtonStyle(active: boolean): CSSProperties {
  return {
    flexShrink: 0,
    whiteSpace: 'nowrap',
    padding: '8px 8px',
    fontSize: 12.5,
    fontWeight: active ? 800 : 650,
    color: active ? 'var(--color-forest-800)' : 'var(--color-ink-secondary)',
    background: 'transparent',
    border: 'none',
    // Round-4 underline tabs: active = forest underline + semibold, no pill fill.
    boxShadow: active ? 'inset 0 -2px 0 var(--color-forest-600)' : 'none',
    borderRadius: 0,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'box-shadow 140ms ease, color 140ms ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
  }
}

/**
 * Workspace doc-tab strip that shows as many tabs inline as the panel width
 * allows. Overflowed tabs move behind a trailing three-dots menu; the trigger
 * only renders when at least one tab is hidden. Widths are measured from a
 * hidden mirror row (same styles), recomputed on container resize, so the
 * split adapts as the user drags the panel separator.
 */
export function AdaptiveTabStrip({ tabs, active, onSelect, badges }: AdaptiveTabStripProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [visibleCount, setVisibleCount] = useState(tabs.length)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null)

  const recompute = useCallback(() => {
    const container = containerRef.current
    const measure = measureRef.current
    if (!container || !measure) return
    const available = container.clientWidth
    const children = Array.from(measure.children) as HTMLElement[]
    // Last measured child is the three-dots trigger mirror; the rest map to tabs.
    const triggerWidth = children.length > tabs.length ? children[tabs.length].offsetWidth : 36
    const widths = children.slice(0, tabs.length).map(el => el.offsetWidth)

    const total = widths.reduce((sum, w, i) => sum + w + (i > 0 ? TAB_GAP : 0), 0)
    if (total <= available) {
      setVisibleCount(tabs.length)
      return
    }
    let used = triggerWidth + TAB_GAP
    let count = 0
    for (const w of widths) {
      const next = used + w + (count > 0 ? TAB_GAP : 0)
      if (next > available) break
      used = next
      count += 1
    }
    setVisibleCount(Math.max(1, count))
  }, [tabs.length])

  // Measure on mount/updates and whenever the strip's box resizes (panel drag,
  // window resize, collapse/expand).
  useLayoutEffect(() => { recompute() })
  useEffect(() => {
    const container = containerRef.current
    if (!container || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => recompute())
    ro.observe(container)
    return () => ro.disconnect()
  }, [recompute])

  // Close the menu on outside click / Escape.
  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (triggerRef.current?.contains(t)) return
      if (document.getElementById('adaptive-tab-menu')?.contains(t)) return
      setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const visibleTabs = tabs.slice(0, visibleCount)
  const hiddenTabs = tabs.slice(visibleCount)
  const activeHidden = hiddenTabs.includes(active)

  const openMenu = () => {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (rect) {
      setMenuPos({
        top: rect.bottom + 4,
        left: Math.max(8, Math.min(rect.left, window.innerWidth - 168)),
      })
    }
    setMenuOpen(v => !v)
  }

  const renderTab = (t: string, interactive: boolean) => {
    const isActive = interactive && active === t
    return (
      <button
        key={t}
        onClick={interactive ? () => { onSelect(t); setMenuOpen(false) } : undefined}
        tabIndex={interactive ? undefined : -1}
        aria-hidden={interactive ? undefined : true}
        style={tabButtonStyle(isActive)}
      >
        <span>{t}</span>
        {badges?.[t]}
      </button>
    )
  }

  return (
    <div
      ref={containerRef}
      style={{ display: 'flex', alignItems: 'center', gap: TAB_GAP, minWidth: 0, flex: 1, overflow: 'hidden', position: 'relative' }}
    >
      {/* Hidden mirror row: measures every tab's natural width + the trigger. */}
      <div
        ref={measureRef}
        aria-hidden="true"
        style={{ position: 'absolute', top: 0, left: 0, display: 'flex', gap: TAB_GAP, visibility: 'hidden', pointerEvents: 'none', whiteSpace: 'nowrap' }}
      >
        {tabs.map(t => renderTab(t, false))}
        <button tabIndex={-1} style={{ ...tabButtonStyle(false), gap: 3 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>more_horiz</span>
        </button>
      </div>

      {visibleTabs.map(t => renderTab(t, true))}

      {/* Overflow trigger: only when at least one tab is hidden. */}
      {hiddenTabs.length > 0 && (
        <button
          ref={triggerRef}
          onClick={openMenu}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label="More tabs"
          title={activeHidden ? active : 'More'}
          data-testid="coding-more-tabs"
          style={{ ...tabButtonStyle(activeHidden), gap: 3 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            {menuOpen ? 'expand_less' : 'more_horiz'}
          </span>
        </button>
      )}

      {/* Fixed-position menu: escapes the top bar's overflow:hidden clipping. */}
      {menuOpen && menuPos && hiddenTabs.length > 0 && (
        <div
          id="adaptive-tab-menu"
          role="menu"
          style={{
            position: 'fixed',
            top: menuPos.top,
            left: menuPos.left,
            zIndex: 60,
            minWidth: 156,
            background: 'var(--color-card-bright)',
            border: '1px solid var(--color-hairline)',
            borderRadius: 10,
            boxShadow: '0 8px 24px -8px rgba(30,27,20,0.25)',
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {hiddenTabs.map(t => {
            const isActive = active === t
            return (
              <button
                key={t}
                role="menuitem"
                onClick={() => { onSelect(t); setMenuOpen(false) }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  padding: '7px 10px',
                  fontSize: 12.5,
                  fontWeight: isActive ? 800 : 650,
                  color: isActive ? 'var(--color-forest-800)' : 'var(--color-ink-secondary)',
                  background: isActive ? 'var(--color-page-field)' : 'transparent',
                  border: 'none',
                  borderRadius: 7,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                }}
              >
                <span>{t}</span>
                {badges?.[t]}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

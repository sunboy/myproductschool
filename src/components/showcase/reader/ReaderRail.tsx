'use client';

import Link from 'next/link';

export interface ReaderRailItem {
  id: string;
  label: string;
  sub?: string;
}

interface ReaderRailProps {
  items: ReaderRailItem[];
  activeId: string | null;
  /** ids the reader has scrolled past at least once — drives the dim "read" state */
  visitedIds?: Set<string>;
  /** 0–100, drives the header progress bar */
  scrollPct: number;
  /** primary line of the rail header, e.g. the company / product name */
  title: string;
  /** small uppercase label above the title, e.g. "Product Autopsy" */
  kicker?: string;
  /** accent color (companyAccent / product cover) used for the active dot + fill */
  accent?: string;
  backHref: string;
  backLabel?: string;
  onNavigate: (id: string) => void;
  /** skin only — structure is identical across variants */
  variant?: 'cinematic' | 'aarrr';
}

/**
 * Persistent left index shared by the cinematic (autopsy) and AARRR (teardown)
 * readers. Purely presentational — it owns no scroll logic. Each reader feeds it
 * `activeId` / `scrollPct` from its own tracking (IntersectionObserver or GSAP).
 *
 * Hidden below `lg`; on small screens the readers fall back to the bottom dock.
 */
export function ReaderRail({
  items,
  activeId,
  visitedIds,
  scrollPct,
  title,
  kicker,
  accent = '#4a7c59',
  backHref,
  backLabel = 'Back',
  onNavigate,
  variant = 'cinematic',
}: ReaderRailProps) {
  const dark = variant === 'cinematic';
  const activeIndex = items.findIndex(it => it.id === activeId);

  // Tonal palette per skin. Dark = glass on the cinematic canvas; light = the
  // guides ChapterList look.
  const c = dark
    ? {
        bg: 'rgba(20,22,20,0.72)',
        border: 'rgba(255,255,255,0.08)',
        kicker: 'rgba(255,255,255,0.55)',
        title: 'rgba(255,255,255,0.92)',
        track: 'rgba(255,255,255,0.12)',
        connector: 'rgba(255,255,255,0.14)',
        dotIdle: 'rgba(255,255,255,0.22)',
        labelIdle: 'rgba(255,255,255,0.55)',
        labelVisited: 'rgba(255,255,255,0.78)',
        sub: 'rgba(255,255,255,0.45)',
        hover: 'rgba(255,255,255,0.05)',
      }
    : {
        bg: '#f0ece4',
        border: '#e0d8c8',
        kicker: '#9c9589',
        title: '#2e3230',
        track: '#e0d8c8',
        connector: '#e0d8c8',
        dotIdle: '#d6cdbb',
        labelIdle: '#78715f',
        labelVisited: '#4a7c59',
        sub: '#9c9589',
        hover: 'rgba(0,0,0,0.03)',
      };

  return (
    <aside
      className="hidden lg:flex"
      style={{
        width: 248,
        flexShrink: 0,
        // Matches the real TopNav height (~67px). The old 56px offset let the
        // rail slide under the nav and clipped its header.
        position: 'sticky',
        top: 67,
        height: 'calc(100vh - 67px)',
        overflowY: 'auto',
        background: c.bg,
        backdropFilter: dark ? 'blur(20px) saturate(140%)' : undefined,
        WebkitBackdropFilter: dark ? 'blur(20px) saturate(140%)' : undefined,
        borderRight: `1px solid ${c.border}`,
        flexDirection: 'column',
      }}
      aria-label="Reading sections"
    >
      {/* Header: back link + kicker + title + progress. The back link lives
          here (top-left, where readers look for it) since the reader has no
          separate back bar. */}
      <div style={{ padding: '16px 20px 14px', borderBottom: `1px solid ${c.border}` }}>
        <Link
          href={backHref}
          aria-label={`Back to ${backLabel}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontFamily: 'var(--font-label)',
            fontSize: 11.5,
            fontWeight: 700,
            color: c.labelVisited,
            textDecoration: 'none',
            marginBottom: 12,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }} aria-hidden="true">
            arrow_back
          </span>
          {backLabel}
        </Link>
        {kicker && (
          <div
            style={{
              fontFamily: 'var(--font-label)',
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: c.kicker,
              marginBottom: 6,
            }}
          >
            {kicker}
          </div>
        )}
        <div
          style={{
            fontFamily: 'var(--font-headline)',
            fontSize: 15,
            fontWeight: 700,
            lineHeight: 1.2,
            color: c.title,
            marginBottom: 12,
          }}
        >
          {title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              flex: 1,
              height: 4,
              borderRadius: 999,
              background: c.track,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${Math.max(0, Math.min(100, scrollPct))}%`,
                background: accent,
                borderRadius: 999,
                transition: 'width 220ms ease',
              }}
            />
          </div>
          <span
            style={{
              fontFamily: 'var(--font-label)',
              fontSize: 10,
              fontWeight: 700,
              color: c.kicker,
              minWidth: '3ch',
              textAlign: 'right',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {Math.round(scrollPct)}%
          </span>
        </div>
      </div>

      {/* Section list */}
      <nav style={{ padding: '12px 0', flex: 1 }}>
        {items.map((item, idx) => {
          const isActive = item.id === activeId;
          const isDone =
            (visitedIds?.has(item.id) ?? false) || (activeIndex >= 0 && idx < activeIndex);
          const labelColor = isActive
            ? accent
            : isDone
              ? c.labelVisited
              : c.labelIdle;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="reader-rail-item"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                width: '100%',
                textAlign: 'left',
                padding: '6px 16px 6px 20px',
                cursor: 'pointer',
                position: 'relative',
                background: 'transparent',
                border: 'none',
                transition: 'background 200ms',
              }}
              aria-current={isActive ? 'true' : undefined}
            >
              {/* connector to the next dot */}
              {idx < items.length - 1 && (
                <div
                  style={{
                    position: 'absolute',
                    left: 27,
                    top: 22,
                    width: 2,
                    height: 'calc(100% - 16px)',
                    background: isDone ? accent : c.connector,
                    transition: 'background 400ms',
                    borderRadius: 1,
                  }}
                  aria-hidden="true"
                />
              )}

              {/* dot */}
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  flexShrink: 0,
                  marginTop: 2,
                  zIndex: 1,
                  background: isActive ? accent : isDone ? accent : c.dotIdle,
                  opacity: isDone && !isActive ? 0.55 : 1,
                  border: isActive ? `3px solid ${accent}33` : '2px solid transparent',
                  boxShadow: isActive ? `0 0 0 3px ${accent}22` : 'none',
                  transform: isActive ? 'scale(1.04)' : 'scale(1)',
                  transition:
                    'background 300ms, box-shadow 300ms, border 300ms, transform 300ms, opacity 300ms',
                }}
                aria-hidden="true"
              />

              <div style={{ paddingBottom: 14, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: 'var(--font-label)',
                    fontSize: 11.5,
                    fontWeight: isActive ? 800 : 600,
                    color: labelColor,
                    lineHeight: 1.25,
                    transition: 'color 300ms, font-weight 300ms',
                  }}
                >
                  {item.label}
                </div>
                {item.sub && isActive && (
                  <div
                    style={{
                      fontFamily: 'var(--font-label)',
                      fontSize: 9,
                      color: c.sub,
                      marginTop: 2,
                    }}
                  >
                    {item.sub}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Footer: back link */}
      <div style={{ padding: '14px 20px', borderTop: `1px solid ${c.border}` }}>
        <Link
          href={backHref}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'var(--font-label)',
            fontSize: 11,
            fontWeight: 700,
            color: c.labelIdle,
            textDecoration: 'none',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden="true">
            arrow_back
          </span>
          {backLabel}
        </Link>
      </div>

      <style jsx>{`
        .reader-rail-item:hover {
          background: ${c.hover} !important;
        }
        @media (prefers-reduced-motion: reduce) {
          .reader-rail-item * {
            transition: none !important;
          }
        }
      `}</style>
    </aside>
  );
}

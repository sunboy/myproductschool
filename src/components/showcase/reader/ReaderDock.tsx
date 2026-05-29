'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ProgressRing } from './ProgressRing';
import { TocOverlay } from './TocOverlay';

interface TocItem {
  id: string;
  label: string;
}

interface ReaderDockProps {
  scrollPct: number;
  activeSection: string | null;
  tocItems: TocItem[];
  backHref: string;
  companyName: string;
  storyTitle: string;
}

/**
 * Fixed bottom dock for the cinematic reader.
 * Uses backdrop-filter because it is position:fixed.
 */
export function ReaderDock({
  scrollPct,
  activeSection,
  tocItems,
  backHref,
  companyName,
  storyTitle,
}: ReaderDockProps) {
  const [tocOpen, setTocOpen] = useState(false);

  const handleNavigate = (id: string) => {
    const el = document.querySelector(`[data-section-id="${id}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      <TocOverlay
        items={tocItems}
        activeSection={activeSection}
        open={tocOpen}
        onClose={() => setTocOpen(false)}
        onNavigate={handleNavigate}
      />

      <div
        className="sc-dock"
        role="toolbar"
        aria-label="Reader controls"
      >
        {/* Back */}
        <Link
          href={backHref}
          className="sc-dock-btn"
          aria-label={`Back to ${companyName}`}
        >
          <span
            className="material-symbols-outlined text-xl"
            style={{ color: 'var(--color-on-surface-variant)', fontSize: '20px' }}
            aria-hidden="true"
          >
            arrow_back
          </span>
        </Link>

        {/* Divider */}
        <div
          className="sc-dock-divider"
          aria-hidden="true"
        />

        {/* Progress ring + pct */}
        <div className="flex items-center gap-2">
          <ProgressRing pct={scrollPct} size={32} strokeWidth={2.5} />
          <span
            className="min-w-[3ch] text-center text-xs font-medium tabular-nums"
            style={{ color: 'var(--color-on-surface-variant)' }}
            aria-label={`${scrollPct}% read`}
          >
            {scrollPct}%
          </span>
        </div>

        {/* Divider */}
        <div
          className="sc-dock-divider"
          aria-hidden="true"
        />

        {/* TOC toggle */}
        {tocItems.length > 0 && (
          <button
            onClick={() => setTocOpen(prev => !prev)}
            className={`sc-dock-btn ${tocOpen ? 'is-on' : ''}`}
            aria-label="Table of contents"
            aria-expanded={tocOpen}
          >
            <span
              className="material-symbols-outlined text-xl"
              style={{ color: 'var(--color-on-surface-variant)', fontSize: '20px' }}
              aria-hidden="true"
            >
              format_list_bulleted
            </span>
          </button>
        )}

        {/* Story title (truncated) */}
        <span
          className="sc-dock-path hidden max-w-[180px] truncate sm:inline-flex"
          style={{ color: 'var(--color-on-surface-muted)' }}
          title={storyTitle}
        >
          {storyTitle}
        </span>
      </div>
    </>
  );
}

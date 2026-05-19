'use client';

import Link from 'next/link';
import type { PrevNextResult } from '@/lib/showcase/prev-next';

interface PrevNextChipsProps {
  prevNext: PrevNextResult;
}

/**
 * Phase 1: chips show the story title only (no thumbnail images).
 * Thumbnails ship in Phase 2.
 */
export function PrevNextChips({ prevNext }: PrevNextChipsProps) {
  const { prev, next, currentPath } = prevNext;

  if (!prev && !next) return null;

  return (
    <nav
      aria-label="Reading path navigation"
      className="flex flex-col gap-4 sm:flex-row sm:justify-between"
    >
      {/* Path context */}
      {currentPath && (
        <p
          className="mb-2 w-full text-center text-xs"
          style={{ color: 'var(--color-on-surface-muted)' }}
        >
          Story {currentPath.position} of {currentPath.total} in{' '}
          <span style={{ color: 'var(--color-on-surface-variant)' }}>{currentPath.title}</span>
        </p>
      )}

      {/* Prev */}
      <div className="flex-1">
        {prev && (
          <Link
            href={`/explore/showcase/${prev.companySlug}/stories/${prev.storySlug}`}
            className="glass-tile group flex items-center gap-3 rounded-xl p-4 transition-all duration-200"
          >
            <span
              className="material-symbols-outlined text-lg shrink-0 transition-transform group-hover:-translate-x-0.5"
              style={{ color: 'var(--color-primary)', fontSize: '20px' }}
              aria-hidden="true"
            >
              arrow_back
            </span>
            <div className="min-w-0">
              <p
                className="text-xs"
                style={{ color: 'var(--color-on-surface-muted)' }}
              >
                Previous
              </p>
              <p
                className="truncate text-sm font-semibold"
                style={{ color: 'var(--color-on-surface)', fontFamily: 'var(--font-display)' }}
              >
                {prev.storySlug.replace(/-/g, ' ')}
              </p>
            </div>
          </Link>
        )}
      </div>

      {/* Next */}
      <div className="flex-1">
        {next && (
          <Link
            href={`/explore/showcase/${next.companySlug}/stories/${next.storySlug}`}
            className="glass-tile group flex items-center justify-end gap-3 rounded-xl p-4 text-right transition-all duration-200"
          >
            <div className="min-w-0">
              <p
                className="text-xs"
                style={{ color: 'var(--color-on-surface-muted)' }}
              >
                Next
              </p>
              <p
                className="truncate text-sm font-semibold"
                style={{ color: 'var(--color-on-surface)', fontFamily: 'var(--font-display)' }}
              >
                {next.storySlug.replace(/-/g, ' ')}
              </p>
            </div>
            <span
              className="material-symbols-outlined text-lg shrink-0 transition-transform group-hover:translate-x-0.5"
              style={{ color: 'var(--color-primary)', fontSize: '20px' }}
              aria-hidden="true"
            >
              arrow_forward
            </span>
          </Link>
        )}
      </div>
    </nav>
  );
}

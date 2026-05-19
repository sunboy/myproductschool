'use client';

import { useOptimistic, useTransition } from 'react';
import { toggleBookmark } from '@/lib/showcase/bookmarks';

interface BookmarkToggleProps {
  companySlug: string;
  storySlug: string;
  initialBookmarked: boolean;
}

export function BookmarkToggle({ companySlug, storySlug, initialBookmarked }: BookmarkToggleProps) {
  const [, startTransition] = useTransition();
  const [optimisticBookmarked, setOptimisticBookmarked] = useOptimistic(initialBookmarked);

  const handleToggle = () => {
    startTransition(async () => {
      setOptimisticBookmarked(!optimisticBookmarked);
      await toggleBookmark(companySlug, storySlug);
    });
  };

  return (
    <button
      onClick={handleToggle}
      aria-label={optimisticBookmarked ? 'Remove bookmark' : 'Bookmark this story'}
      aria-pressed={optimisticBookmarked}
      className={`sc-dock-btn ${optimisticBookmarked ? 'is-on' : ''}`}
    >
      <span
        className="material-symbols-outlined text-xl transition-colors"
        style={{
          color: optimisticBookmarked ? 'var(--color-tertiary)' : 'var(--color-on-surface-variant)',
          fontVariationSettings: optimisticBookmarked ? "'FILL' 1" : "'FILL' 0",
          fontSize: '20px',
        }}
      >
        bookmark
      </span>
    </button>
  );
}

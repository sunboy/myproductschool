'use client';

import { useState, useTransition } from 'react';
import { Bookmark } from 'lucide-react';
import { toggleBookmark } from '@/lib/showcase/bookmarks';

interface BookmarkToggleProps {
  companySlug: string;
  storySlug: string;
  initialBookmarked: boolean;
}

export function BookmarkToggle({ companySlug, storySlug, initialBookmarked }: BookmarkToggleProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState(initialBookmarked);

  const handleToggle = () => {
    setError(null);
    const previous = bookmarked;
    setBookmarked(!previous);
    startTransition(async () => {
      try {
        const result = await toggleBookmark(companySlug, storySlug);
        setBookmarked(result.bookmarked);
      } catch {
        setBookmarked(previous);
        setError('Could not save your change. Please try again.');
      }
    });
  };

  return (
    <div className="flex max-w-full flex-col items-end gap-1">
    <button
      onClick={handleToggle}
      disabled={pending}
      aria-label={bookmarked ? 'Remove bookmark' : 'Save this story'}
      aria-pressed={bookmarked}
      className={`reader-bookmark ${bookmarked ? 'is-on' : ''}`}
    >
      <Bookmark aria-hidden size={17} fill={bookmarked ? 'currentColor' : 'none'} />
      <span>{bookmarked ? 'Saved' : 'Save'}</span>
    </button>
    {error && <span role="alert" className="max-w-56 text-right text-sm text-error">{error}</span>}
    </div>
  );
}

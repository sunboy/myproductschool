'use client';

import { useState } from 'react';
import { Bookmark } from 'lucide-react';
import { toggleBookmark } from '@/lib/showcase/bookmarks';

interface BookmarkToggleProps {
  companySlug: string;
  storySlug: string;
  initialBookmarked: boolean;
}

export function BookmarkToggle({ companySlug, storySlug, initialBookmarked }: BookmarkToggleProps) {
  // Plain state, not useTransition: this action calls revalidatePath, and the
  // router refresh that triggers can overlap with useTransition's own pending
  // flag and leave it stuck true (button permanently disabled) even after the
  // action has resolved. A manual pending flag around the awaited call avoids
  // that interaction entirely.
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState(initialBookmarked);

  const handleToggle = async () => {
    setError(null);
    const previous = bookmarked;
    setBookmarked(!previous);
    setPending(true);
    try {
      const result = await toggleBookmark(companySlug, storySlug);
      setBookmarked(result.bookmarked);
    } catch {
      setBookmarked(previous);
      setError('Could not save your change. Please try again.');
    } finally {
      setPending(false);
    }
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

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface StoredResume {
  sectionId: string;
  scrollPct: number;
  at: number;
  /** the user dismissed the resume banner for this saved position */
  bannerDismissed?: boolean;
}

interface UseReaderResumeOptions {
  /** stable per-story key, e.g. `${companySlug}/${storySlug}` */
  storyKey: string;
  /** ordered section ids in the story */
  sectionIds: string[];
  /** live active section from the reader */
  activeId: string | null;
  /** live scroll percentage 0–100 */
  scrollPct: number;
  /**
   * Gate for persisting the live position. The reader sets this false until it
   * has finished restoring a saved position, so the auto-scroll restore can't be
   * overwritten by an IntersectionObserver firing mid-scroll. Defaults to true.
   */
  canPersist?: boolean;
}

interface UseReaderResumeResult {
  /** last saved section, used for the banner label — null if none / at the very start */
  resumeSection: string | null;
  /**
   * Saved scroll percentage (0–100) to restore to, or null. This is the source of
   * truth for the restore position because it is monotonic and reliable, unlike
   * the active sectionId which an IntersectionObserver can mis-report on pages
   * with a very tall first section.
   */
  resumeScrollPct: number | null;
  /** whether to show the resume banner (suppressed once the user dismissed it) */
  showResumeBanner: boolean;
  /** dismiss the banner without forgetting the reading position */
  dismissBanner: () => void;
  /** drop the saved position entirely (e.g. on back-to-top) */
  clearResume: () => void;
  /** true once the initial read has run */
  restored: boolean;
}

const WRITE_THROTTLE_MS = 500;
/** below this percent we treat the story as "at the start" and don't prompt to resume */
const MIN_RESUME_PCT = 4;

function keyFor(storyKey: string): string {
  // localStorage is already per-device/per-browser-profile, so the key depends
  // only on the story. Namespacing by an async-loaded app userId would create a
  // second key during the window before the profile resolves, which would leave
  // an orphaned entry that clearResume() can't reach.
  return `hp_reader_${storyKey}`;
}

/**
 * localStorage-only reading resume. Reads the last position once on mount and
 * exposes it as `resumeSection`; writes the live position (throttled) as the
 * user scrolls. All storage access is wrapped so private mode / quota errors
 * never break the reader.
 */
export function useReaderResume({
  storyKey,
  sectionIds,
  activeId,
  scrollPct,
  canPersist = true,
}: UseReaderResumeOptions): UseReaderResumeResult {
  const [resumeSection, setResumeSection] = useState<string | null>(null);
  const [resumeScrollPct, setResumeScrollPct] = useState<number | null>(null);
  const [showResumeBanner, setShowResumeBanner] = useState(false);
  const [restored, setRestored] = useState(false);
  // Mirrors the persisted "banner dismissed" flag so the live writer can preserve
  // it on every scroll write (otherwise scrolling would clobber the dismissal and
  // the banner would reappear on the next load).
  const dismissedRef = useRef(false);
  const storageKey = keyFor(storyKey);

  // Read once on mount.
  useEffect(() => {
    let saved: StoredResume | null = null;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) saved = JSON.parse(raw) as StoredResume;
    } catch {
      saved = null;
    }

    if (saved) {
      const knownSection = sectionIds.includes(saved.sectionId);
      const isFirst = sectionIds[0] === saved.sectionId;
      const atStart = (isFirst || !knownSection) && saved.scrollPct < MIN_RESUME_PCT;
      if (!atStart && saved.scrollPct >= MIN_RESUME_PCT) {
        // scrollPct is the source of truth for the restore position.
        setResumeScrollPct(saved.scrollPct);
        // sectionId is only the banner label; fall back to null if unknown.
        setResumeSection(knownSection ? saved.sectionId : null);
        dismissedRef.current = Boolean(saved.bannerDismissed);
        // Only show the banner if it wasn't previously dismissed.
        setShowResumeBanner(!saved.bannerDismissed);
      }
    }
    setRestored(true);
    // Only run on mount for this story. sectionIds is stable for a given story.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Trailing-debounced write as the user reads. Held off until the reader has
  // settled any resume restore (canPersist). Using a trailing timer (not a
  // leading-edge throttle) guarantees the FINAL position is captured — a plain
  // throttle drops the last update, which left a stale sectionId saved at the
  // bottom of short pages. Preserves the dismissed flag.
  useEffect(() => {
    if (!restored || !canPersist || !activeId) return;
    const t = setTimeout(() => {
      try {
        const payload: StoredResume = {
          sectionId: activeId,
          scrollPct: Math.round(scrollPct),
          at: Date.now(),
          bannerDismissed: dismissedRef.current,
        };
        localStorage.setItem(storageKey, JSON.stringify(payload));
      } catch {
        // ignore — storage unavailable
      }
    }, WRITE_THROTTLE_MS);
    return () => clearTimeout(t);
  }, [activeId, scrollPct, restored, canPersist, storageKey]);

  // Dismiss the banner but keep the reading position. Persists a flag so the
  // banner stays dismissed across reloads, while resume auto-scroll still works.
  const dismissBanner = useCallback(() => {
    setShowResumeBanner(false);
    dismissedRef.current = true;
    try {
      const raw = localStorage.getItem(storageKey);
      const saved = raw ? (JSON.parse(raw) as StoredResume) : null;
      if (saved) {
        localStorage.setItem(
          storageKey,
          JSON.stringify({ ...saved, bannerDismissed: true }),
        );
      }
    } catch {
      // ignore
    }
  }, [storageKey]);

  const clearResume = useCallback(() => {
    setResumeSection(null);
    setResumeScrollPct(null);
    setShowResumeBanner(false);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  }, [storageKey]);

  return {
    resumeSection,
    resumeScrollPct,
    showResumeBanner,
    dismissBanner,
    clearResume,
    restored,
  };
}

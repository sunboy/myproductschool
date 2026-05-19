'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface SectionEntry {
  id: string;
  el: Element;
}

export interface ReaderScrollState {
  /** 0–100 — percentage of the article scrolled past */
  scrollPct: number;
  /** The section id currently in the viewport (or last seen) */
  activeSection: string | null;
  /** All section ids that have been intersected at least once */
  visitedSections: Set<string>;
}

/**
 * Tracks reading progress and the active section for the cinematic reader.
 *
 * @param sectionIds - ordered list of section ids to observe
 * @param contentRef - ref to the scrollable article container
 */
export function useReaderScroll(
  sectionIds: string[],
  contentRef: React.RefObject<HTMLElement | null>,
): ReaderScrollState {
  const [scrollPct, setScrollPct] = useState(0);
  const [activeSection, setActiveSection] = useState<string | null>(
    sectionIds[0] ?? null,
  );
  const [visitedSections, setVisitedSections] = useState<Set<string>>(
    () => new Set(sectionIds[0] ? [sectionIds[0]] : []),
  );

  // Scroll percentage — uses the window scroll position relative to content height
  const onScroll = useCallback(() => {
    const el = contentRef.current;
    if (!el) {
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      if (docH <= 0) return;
      setScrollPct(Math.round((window.scrollY / docH) * 100));
      return;
    }
    const rect = el.getBoundingClientRect();
    const totalH = el.scrollHeight - window.innerHeight;
    if (totalH <= 0) return;
    const scrolled = Math.max(0, -rect.top);
    setScrollPct(Math.min(100, Math.round((scrolled / totalH) * 100)));
  }, [contentRef]);

  useEffect(() => {
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [onScroll]);

  // IntersectionObserver for section activation
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    observerRef.current?.disconnect();

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the entry closest to the top of the viewport (most visible)
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          const id = visible[0].target.getAttribute('data-section-id') ?? null;
          if (id) {
            setActiveSection(id);
            setVisitedSections(prev => {
              if (prev.has(id)) return prev;
              const next = new Set(prev);
              next.add(id);
              return next;
            });
          }
        }
      },
      {
        rootMargin: '-10% 0px -60% 0px',
        threshold: 0,
      },
    );

    observerRef.current = observer;

    // Observe all section elements
    sectionIds.forEach(id => {
      const el = document.querySelector(`[data-section-id="${id}"]`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sectionIds]);

  return { scrollPct, activeSection, visitedSections };
}

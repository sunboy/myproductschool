'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useReaderScroll } from '@/hooks/useReaderScroll';
import { useReaderResume } from '@/hooks/useReaderResume';
import { ParallaxHero } from './ParallaxHero';
import { ReaderDock } from './ReaderDock';
import { ReaderRail } from './ReaderRail';
import { ResumeBanner } from './ResumeBanner';
import { BookmarkToggle } from './BookmarkToggle';
import { PrevNextChips } from './PrevNextChips';
import { QuickReadDark } from './sections/QuickReadDark';
import { EvidenceLedgerDark } from './sections/EvidenceLedgerDark';
import { TimelineDark } from './sections/TimelineDark';
import { QuoteDark } from './sections/QuoteDark';
import { PrincipleDark } from './sections/PrincipleDark';
import { SourcePackDark } from './sections/SourcePackDark';
import { FlowSectionDark } from './sections/FlowSectionDark';
import { BackCrumb } from '@/components/navigation/BackButton';
import type { AutopsyImageRole, FeatureAutopsy } from '@/lib/autopsies/types';
import type { PrevNextResult } from '@/lib/showcase/prev-next';

interface CinematicReaderProps {
  story: FeatureAutopsy;
  companyName: string;
  companyAccent?: string;
  initialBookmarked: boolean;
  prevNext: PrevNextResult;
}

const INLINE_IMAGE_ROLES: AutopsyImageRole[] = [
  'hatch-narrator',
  'failure-mechanism',
  'evidence-card',
  'lesson-frame',
];

export function CinematicReader({
  story,
  companyName,
  companyAccent,
  initialBookmarked,
  prevNext,
}: CinematicReaderProps) {
  const contentRef = useRef<HTMLElement>(null);
  const lede = story.flow[0];
  const bodySections = story.flow.slice(1);

  const sectionIds = useMemo(() => [
    lede ? 'lede' : null,
    story.quickRead.length > 0 ? 'quick-read' : null,
    ...bodySections.map((_, i) => `flow-${i + 1}`),
    story.metrics.length > 0 ? 'evidence' : null,
    story.timeline?.length ? 'timeline' : null,
    story.quote ? 'quote' : null,
    story.principle ? 'principle' : null,
    story.sources.length > 0 ? 'sources' : null,
  ].filter(Boolean) as string[], [bodySections, lede, story]);

  const tocItems = [
    ...(lede ? [{ id: 'lede', label: lede.title }] : []),
    ...(story.quickRead.length > 0 ? [{ id: 'quick-read', label: 'At a glance' }] : []),
    ...bodySections.map((section, i) => ({ id: `flow-${i + 1}`, label: section.title })),
    ...(story.metrics.length > 0 ? [{ id: 'evidence', label: 'Evidence' }] : []),
    ...(story.timeline?.length ? [{ id: 'timeline', label: 'Timeline' }] : []),
    ...(story.quote ? [{ id: 'quote', label: 'The quote' }] : []),
    ...(story.principle ? [{ id: 'principle', label: 'The principle' }] : []),
    ...(story.sources.length > 0 ? [{ id: 'sources', label: 'Sources' }] : []),
  ];

  const { scrollPct, activeSection, visitedSections } = useReaderScroll(sectionIds, contentRef);
  const backHref = `/explore/autopsies/${story.companySlug}`;

  const activeLabel = tocItems.find(t => t.id === activeSection)?.label ?? null;

  // Hold off persisting until any resume restore has settled (see effect below),
  // so the restore scroll can't overwrite the saved position with the top section.
  const [persistReady, setPersistReady] = useState(false);

  const { resumeSection, resumeScrollPct, showResumeBanner, dismissBanner, clearResume, restored } =
    useReaderResume({
      storyKey: `${story.companySlug}/${story.slug}`,
      sectionIds,
      activeId: activeSection,
      scrollPct,
      canPersist: persistReady,
    });

  const scrollToSection = (id: string) => {
    const el = document.querySelector(`[data-section-id="${id}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // On return, restore the saved scroll position once. We restore by scroll
  // PERCENTAGE (monotonic, reliable) rather than by sectionId, which an
  // IntersectionObserver can mis-report on tall sections. After the restore
  // settles (or if there's nothing to restore), allow persistence. The banner's
  // visibility is owned by the hook (showResumeBanner).
  const didRestoreRef = useRef(false);
  useEffect(() => {
    if (didRestoreRef.current) return;
    // Wait for the hook's mount-read to finish before deciding.
    if (!restored) return;
    if (resumeScrollPct == null) {
      // Read finished, nothing to restore — start persisting on the next tick.
      const t = setTimeout(() => setPersistReady(true), 0);
      return () => clearTimeout(t);
    }
    didRestoreRef.current = true;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (maxScroll > 0) {
      window.scrollTo({ top: Math.round((resumeScrollPct / 100) * maxScroll), behavior: 'auto' });
    }
    // Let the programmatic scroll + IntersectionObserver settle before writing.
    const t = setTimeout(() => setPersistReady(true), 600);
    return () => clearTimeout(t);
  }, [resumeScrollPct, restored]);

  const resumeLabel =
    tocItems.find(t => t.id === resumeSection)?.label ?? 'where you left off';

  return (
    <div className="relative min-h-screen pb-32 lg:flex lg:items-start">
      {/* Below lg the rail is hidden, so give small screens an in-flow back
          link above the hero. Desktop back lives in the rail and dock; no
          fixed bar — the old fixed top-[52px] band sat under the ~67px TopNav
          and cropped the top of the rail and the article. */}
      <div className="flex items-center px-4 py-2 bg-surface-container-low border-b border-outline-variant/40 lg:hidden">
        <BackCrumb href={backHref} label={companyName} />
      </div>
      <ReaderRail
        variant="cinematic"
        items={tocItems}
        activeId={activeSection}
        visitedIds={visitedSections}
        scrollPct={scrollPct}
        title={companyName}
        kicker="Product Autopsy"
        accent={companyAccent ?? '#4a7c59'}
        backHref={backHref}
        backLabel={companyName}
        onNavigate={scrollToSection}
      />

      <div className="relative min-w-0 flex-1">
      <div className="fixed right-4 top-4 z-30">
        <BookmarkToggle
          companySlug={story.companySlug}
          storySlug={story.slug}
          initialBookmarked={initialBookmarked}
        />
      </div>

      <article
        ref={contentRef}
        data-hatch-context-root
        data-hatch-context={activeLabel ? `Reading "${story.title}" — section: ${activeLabel}` : `Reading "${story.title}"`}
      >
        <ParallaxHero story={story} companyName={companyName} companyAccent={companyAccent} />

        <div className="sc-page-narrow sc-reader-body">
          {showResumeBanner && resumeLabel && (
            <ResumeBanner
              variant="cinematic"
              label={resumeLabel}
              onBackToTop={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                clearResume();
              }}
              onDismiss={dismissBanner}
            />
          )}
          {lede && (
            <FlowSectionDark
              section={lede}
              sectionId="lede"
              index={0}
              variant="prose"
              story={story}
              imageRole={INLINE_IMAGE_ROLES[0]}
              imageSide="right"
            />
          )}

          {story.quickRead.length > 0 && (
            <QuickReadDark cards={story.quickRead} sectionId="quick-read" />
          )}

          {bodySections.map((section, i) => (
            <FlowSectionDark
              key={`${section.title}-${i}`}
              section={section}
              sectionId={`flow-${i + 1}`}
              index={i + 1}
              variant="prose"
              story={story}
              imageRole={INLINE_IMAGE_ROLES[i + 1]}
              imageSide={(i + 1) % 2 === 0 ? 'right' : 'left'}
            />
          ))}

          {story.metrics.length > 0 && (
            <EvidenceLedgerDark metrics={story.metrics} sectionId="evidence" />
          )}

          {story.timeline && story.timeline.length > 0 && (
            <TimelineDark events={story.timeline} sectionId="timeline" />
          )}

          {story.quote && (
            <QuoteDark quote={story.quote} sectionId="quote" />
          )}

          {story.principle && (
            <PrincipleDark principle={story.principle} sectionId="principle" />
          )}

          {story.sources.length > 0 && (
            <SourcePackDark
              sources={story.sources}
              summary={story.sourcePackSummary}
              sectionId="sources"
            />
          )}

          <div className="px-0 pb-8">
            <PrevNextChips prevNext={prevNext} />
          </div>
        </div>
      </article>

      <ReaderDock
        scrollPct={scrollPct}
        activeSection={activeSection}
        tocItems={tocItems}
        backHref={backHref}
        companyName={companyName}
        storyTitle={story.title}
      />
      </div>
    </div>
  );
}

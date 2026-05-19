'use client';

import { useMemo, useRef } from 'react';
import { useReaderScroll } from '@/hooks/useReaderScroll';
import { ParallaxHero } from './ParallaxHero';
import { ReaderDock } from './ReaderDock';
import { BookmarkToggle } from './BookmarkToggle';
import { PrevNextChips } from './PrevNextChips';
import { QuickReadDark } from './sections/QuickReadDark';
import { EvidenceLedgerDark } from './sections/EvidenceLedgerDark';
import { TimelineDark } from './sections/TimelineDark';
import { QuoteDark } from './sections/QuoteDark';
import { PrincipleDark } from './sections/PrincipleDark';
import { SourcePackDark } from './sections/SourcePackDark';
import { FlowSectionDark } from './sections/FlowSectionDark';
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

  const { scrollPct, activeSection } = useReaderScroll(sectionIds, contentRef);
  const backHref = `/explore/showcase/${story.companySlug}`;

  return (
    <div className="relative min-h-screen pb-32">
      <div className="fixed right-4 top-4 z-30">
        <BookmarkToggle
          companySlug={story.companySlug}
          storySlug={story.slug}
          initialBookmarked={initialBookmarked}
        />
      </div>

      <article ref={contentRef}>
        <ParallaxHero story={story} companyName={companyName} companyAccent={companyAccent} />

        <div className="sc-page-narrow sc-reader-body">
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
  );
}

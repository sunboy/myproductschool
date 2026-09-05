'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, ChevronRight, Sparkles } from 'lucide-react';
import { trackEvent } from '@/lib/posthog/client';
import { EVENT_AUTOPSY_OPENED, EVENT_AUTOPSY_SECTION_VIEWED, EVENT_AUTOPSY_FINISHED } from '@/lib/posthog/events';
import { useReaderScroll } from '@/hooks/useReaderScroll';
import { useReaderResume } from '@/hooks/useReaderResume';
import { ReaderDock } from './ReaderDock';
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
import type { AutopsyImageRole, FeatureAutopsy } from '@/lib/autopsies/types';
import type { PrevNextResult } from '@/lib/showcase/prev-next';

interface CinematicReaderProps {
  story: FeatureAutopsy;
  companyName: string;
  companyAccent?: string;
  initialBookmarked: boolean;
  prevNext: PrevNextResult;
}

const INLINE_IMAGE_ROLES: AutopsyImageRole[] = ['hatch-narrator', 'failure-mechanism', 'evidence-card', 'lesson-frame'];

export function CinematicReader({ story, companyName, companyAccent, initialBookmarked, prevNext }: CinematicReaderProps) {
  const contentRef = useRef<HTMLElement>(null);
  const lede = story.flow[0];
  const bodySections = useMemo(() => story.flow.slice(1), [story.flow]);
  const sectionIds = useMemo(() => [
    lede ? 'lede' : null,
    story.quickRead.length ? 'quick-read' : null,
    ...bodySections.map((_, i) => `flow-${i + 1}`),
    story.metrics.length ? 'evidence' : null,
    story.timeline?.length ? 'timeline' : null,
    story.quote ? 'quote' : null,
    story.principle ? 'principle' : null,
    story.sources.length ? 'sources' : null,
  ].filter(Boolean) as string[], [bodySections, lede, story]);
  const tocItems = useMemo(() => [
    ...(lede ? [{ id: 'lede', label: lede.title }] : []),
    ...(story.quickRead.length ? [{ id: 'quick-read', label: 'At a glance' }] : []),
    ...bodySections.map((section, i) => ({ id: `flow-${i + 1}`, label: section.title })),
    ...(story.metrics.length ? [{ id: 'evidence', label: 'Evidence' }] : []),
    ...(story.timeline?.length ? [{ id: 'timeline', label: 'Timeline' }] : []),
    ...(story.quote ? [{ id: 'quote', label: 'The quote' }] : []),
    ...(story.principle ? [{ id: 'principle', label: 'The principle' }] : []),
    ...(story.sources.length ? [{ id: 'sources', label: 'Sources' }] : []),
  ], [bodySections, lede, story]);

  const { scrollPct, activeSection, visitedSections } = useReaderScroll(sectionIds, contentRef);
  const backHref = `/explore/autopsies/${story.companySlug}`;
  const [persistReady, setPersistReady] = useState(false);
  const { resumeSection, resumeScrollPct, showResumeBanner, dismissBanner, clearResume, restored } = useReaderResume({
    storyKey: `${story.companySlug}/${story.slug}`,
    sectionIds,
    activeId: activeSection,
    scrollPct,
    canPersist: persistReady,
  });

  useEffect(() => { trackEvent(EVENT_AUTOPSY_OPENED, { slug: story.companySlug }); }, [story.companySlug]);
  const scrollPctRef = useRef(scrollPct);
  useEffect(() => { scrollPctRef.current = scrollPct; }, [scrollPct]);
  const trackedSectionsRef = useRef<Set<string>>(new Set());
  const finishedTrackedRef = useRef(false);
  useEffect(() => {
    if (!activeSection) return;
    const index = sectionIds.indexOf(activeSection);
    if (index < 0) return;
    if (!trackedSectionsRef.current.has(activeSection)) {
      trackedSectionsRef.current.add(activeSection);
      trackEvent(EVENT_AUTOPSY_SECTION_VIEWED, { slug: story.companySlug, section_index: index, pct: Math.round(scrollPctRef.current) });
    }
    if (index === sectionIds.length - 1 && !finishedTrackedRef.current) {
      finishedTrackedRef.current = true;
      trackEvent(EVENT_AUTOPSY_FINISHED, { slug: story.companySlug });
    }
  }, [activeSection, sectionIds, story.companySlug]);

  const scrollToSection = (id: string) => document.querySelector(`[data-section-id="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const didRestoreRef = useRef(false);
  useEffect(() => {
    if (didRestoreRef.current || !restored) return;
    if (resumeScrollPct == null) {
      const timer = setTimeout(() => setPersistReady(true), 0);
      return () => clearTimeout(timer);
    }
    didRestoreRef.current = true;
    const article = contentRef.current;
    const articleTop = article ? window.scrollY + article.getBoundingClientRect().top : 0;
    const maxScroll = Math.max(0, (article?.scrollHeight ?? document.documentElement.scrollHeight) - window.innerHeight);
    window.scrollTo({ top: Math.round(articleTop + (resumeScrollPct / 100) * maxScroll), behavior: 'auto' });
    const timer = setTimeout(() => setPersistReady(true), 600);
    return () => clearTimeout(timer);
  }, [resumeScrollPct, restored]);

  const activeLabel = tocItems.find(item => item.id === activeSection)?.label;
  const resumeLabel = tocItems.find(item => item.id === resumeSection)?.label ?? 'where you left off';
  const accent = companyAccent ?? '#2f6b4f';

  return (
    <article
      ref={contentRef}
      className="reader-article"
      style={{ '--reader-accent': accent } as CSSProperties}
      data-hatch-context-root
      data-hatch-context={activeLabel ? `Reading "${story.title}" — section: ${activeLabel}` : `Reading "${story.title}"`}
    >
      <div className="reader-top-progress" aria-hidden><span style={{ width: `${scrollPct}%` }} /></div>
      <header className="reader-article-header">
        <div className="reader-header-actions">
          <Link href={backHref} className="reader-back"><ArrowLeft aria-hidden size={17} /> {companyName}</Link>
          <BookmarkToggle companySlug={story.companySlug} storySlug={story.slug} initialBookmarked={initialBookmarked} />
        </div>
        <div className="reader-kicker">Product autopsy · {story.estimatedReadTime}</div>
        <h1>{story.title}</h1>
        <p className="reader-dek">{story.dek}</p>
        <div className="reader-tags">{story.tags.slice(0, 4).map(tag => <span key={tag}>{tag}</span>)}</div>
      </header>

      <div className="reader-layout">
        <aside className="reader-outline" aria-label="Article outline">
          <div className="reader-outline-progress"><span>{Math.round(scrollPct)}%</span><div><i style={{ width: `${scrollPct}%` }} /></div></div>
          <p>In this autopsy</p>
          <nav>{tocItems.map((item, index) => {
            const active = item.id === activeSection;
            const visited = visitedSections.has(item.id);
            return <button key={item.id} type="button" onClick={() => scrollToSection(item.id)} aria-current={active ? 'location' : undefined} className={active ? 'is-active' : ''}>
              <span>{visited ? <Check aria-hidden size={13} /> : String(index + 1).padStart(2, '0')}</span>{item.label}<ChevronRight aria-hidden size={14} />
            </button>;
          })}</nav>
          <div className="reader-hatch-note"><Sparkles aria-hidden size={17} /><p><strong>Hatch note</strong>Look for the constraint that made the unusual choice rational.</p></div>
        </aside>

        <div className="reader-content">
          {showResumeBanner && <ResumeBanner variant="aarrr" label={resumeLabel} onBackToTop={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); clearResume(); }} onDismiss={dismissBanner} />}
          {lede && <FlowSectionDark section={lede} sectionId="lede" index={0} variant="prose" story={story} imageRole={INLINE_IMAGE_ROLES[0]} imageSide="right" />}
          {story.quickRead.length > 0 && <QuickReadDark cards={story.quickRead} sectionId="quick-read" />}
          {bodySections.map((section, i) => <FlowSectionDark key={`${section.title}-${i}`} section={section} sectionId={`flow-${i + 1}`} index={i + 1} variant="prose" story={story} imageRole={INLINE_IMAGE_ROLES[i + 1]} imageSide={(i + 1) % 2 ? 'left' : 'right'} />)}
          {story.metrics.length > 0 && <EvidenceLedgerDark metrics={story.metrics} sectionId="evidence" />}
          {story.timeline?.length ? <TimelineDark events={story.timeline} sectionId="timeline" /> : null}
          {story.quote && <QuoteDark quote={story.quote} sectionId="quote" />}
          {story.principle && <PrincipleDark principle={story.principle} sectionId="principle" />}
          {story.sources.length > 0 && <SourcePackDark sources={story.sources} summary={story.sourcePackSummary} sectionId="sources" />}
          <div className="reader-next"><PrevNextChips prevNext={prevNext} /></div>
        </div>
      </div>

      <ReaderDock scrollPct={scrollPct} activeSection={activeSection} tocItems={tocItems} backHref={backHref} companyName={companyName} storyTitle={story.title} />
    </article>
  );
}

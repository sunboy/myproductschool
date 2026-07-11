'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Search, X } from 'lucide-react';
import { BackButton } from '@/components/navigation/BackButton';
import { HatchSays } from '@/components/redesign/HatchSays';
import { InkMark } from '@/components/redesign/InkMark';
import { ProTipStrip } from '@/components/redesign/ProTipStrip';
import type { AutopsyCompanyWithStories, FeatureAutopsy } from '@/lib/autopsies/types';
import { getFeaturedAppStory } from '@/lib/autopsies/app-library';

interface ShowcaseIndexExperienceProps {
  companies: AutopsyCompanyWithStories[];
  stories: FeatureAutopsy[];
}

/** Rows shown in the All Stories list before the user expands it. */
const INITIAL_STORY_COUNT = 12;

function bySlug<T extends { slug: string }>(items: T[]) {
  return new Map(items.map(item => [item.slug, item]));
}

function routeForStory(story: FeatureAutopsy) {
  return `/explore/autopsies/${story.companySlug}/stories/${story.slug}`;
}

function routeForCompany(company: AutopsyCompanyWithStories) {
  return `/explore/autopsies/${company.slug}`;
}

/**
 * `estimatedReadTime` is a free-form DB string — some rows carry "20 min
 * read", others just "20". Normalize bare numbers so every row reads
 * "20 min read".
 */
function formatReadTime(raw: string) {
  const trimmed = raw.trim();
  if (/^\d+$/.test(trimmed)) return `${trimmed} min read`;
  if (/^\d+\s*min$/i.test(trimmed)) return `${trimmed} read`;
  return trimmed;
}

/**
 * Editorial autopsies hub: light page header, dark featured-story card built
 * from real loader data (metrics only render when the story actually
 * carries them), an editorial article list (brand-colored text label, no
 * marks, no spines per spec §8), and a quiet companies text strip. Search
 * and the full company list stay real and wired, restyled to the same
 * tokens.
 */
export function ShowcaseIndexExperience({
  companies,
  stories,
}: ShowcaseIndexExperienceProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const featured = useMemo(() => getFeaturedAppStory(stories), [stories]);

  const companyMap = useMemo(() => bySlug(companies), [companies]);
  const featuredCompany = featured ? companyMap.get(featured.companySlug) : undefined;

  const restStories = useMemo(
    () => (featured ? stories.filter(story => story.slug !== featured.slug) : stories),
    [featured, stories]
  );

  const totalStages = featured?.flow?.length;

  return (
    <div className="mx-auto max-w-[1180px] px-4 pb-12 pt-5 lg:px-0">
      <BackButton href="/explore" label="Back to Explore" className="mb-3" />

      <PageHeader
        storyCount={stories.length}
        companyCount={companies.length}
        onOpenSearch={() => setSearchOpen(true)}
      />

      {featured && (
        <div
          data-tour-target="autopsies-hero"
          className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]"
        >
          <FeaturedStoryCard story={featured} company={featuredCompany} totalStages={totalStages} />
          <WhyAutopsiesCard />
        </div>
      )}

      <SectionHead
        title="All stories"
        subtitle="Each story follows one user through the full funnel"
      />
      <StoryList stories={restStories} companyMap={companyMap} />

      {companies.length > 0 && (
        <>
          <SectionHead
            title="Browse by company"
            subtitle="More stories coming from these companies"
          />
          <CompaniesStrip companies={companies} />
        </>
      )}

      <ProTipStrip
        lead="Predict before you read."
        tip="Before each stage, write down the call you would make. The gap between your call and the company's is the lesson."
        ctaLabel="Run a linked rep"
        ctaHref="/challenges"
      />

      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        stories={stories}
        companies={companies}
      />
    </div>
  );
}

function PageHeader({
  storyCount,
  companyCount,
  onOpenSearch,
}: {
  storyCount: number;
  companyCount: number;
  onOpenSearch: () => void;
}) {
  return (
    <header className="flex flex-col gap-3 border-b border-hairline pb-4 pt-1.5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-headline text-[28px] font-semibold leading-[1.2] text-ink-strong">
          Product autopsies
        </h1>
        <p className="mt-1 max-w-[62ch] text-[13.5px] leading-[1.45] text-ink-secondary">
          Teardowns of how real companies grew, monetized, and retained. Each story ends in practice reps you can run.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="whitespace-nowrap text-xs font-medium tabular-nums text-ink-secondary">
          {storyCount} {storyCount === 1 ? 'story' : 'stories'}
          <span className="mx-2 text-ink-muted">·</span>
          {companyCount} {companyCount === 1 ? 'company' : 'companies'}
        </span>
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex items-center gap-2 rounded-full border border-hairline bg-card-bright px-3.5 py-2 text-xs font-semibold text-ink-secondary transition-colors hover:text-ink-strong"
        >
          <Search size={15} strokeWidth={1.8} />
          Search
        </button>
      </div>
    </header>
  );
}

function FeaturedStoryCard({
  story,
  company,
  totalStages,
}: {
  story: FeatureAutopsy;
  company?: AutopsyCompanyWithStories;
  totalStages?: number;
}) {
  const stats = story.metrics.slice(0, 3);

  return (
    <Link
      href={routeForStory(story)}
      className="relative flex min-h-[220px] flex-col justify-between overflow-hidden rounded-2xl px-5 py-5 text-white no-underline"
      style={{
        background: 'linear-gradient(120deg, var(--color-forest-900) 0%, var(--color-forest-850) 70%, var(--color-forest-800) 100%)',
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-20 h-[380px] w-[380px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(163,235,177,0.14) 0%, transparent 70%)' }}
      />
      <div className="relative z-[1]">
        {company?.name && (
          <div className="mb-2 text-xs font-bold" style={{ color: company.accent }}>
            {company.name}
          </div>
        )}
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-mint-glow">
          {story.storyType === 'company_teardown' ? 'Company teardown' : 'Feature autopsy'}
          {typeof totalStages === 'number' && totalStages > 0 && (
            <>
              {' · '}
              <span className="relative inline-block">
                {totalStages} {totalStages === 1 ? 'stage' : 'stages'}
                <InkMark
                  variant="underline"
                  color="#a3ebb1"
                  opacity={0.55}
                  className="absolute -bottom-[7px] left-0 h-2 w-full"
                />
              </span>
            </>
          )}
          {' · '}
          {formatReadTime(story.estimatedReadTime)}
        </div>
        <h2 className="mb-3 max-w-[26ch] font-headline text-[28px] font-semibold leading-[1.16] text-[#f9faf5]">
          {story.title}
        </h2>
        <p className="mb-5 max-w-[52ch] text-sm leading-[1.55] text-white/78">{story.dek}</p>
      </div>

      {stats.length > 0 && (
        <div className="relative z-[1] mb-5 flex flex-wrap gap-6">
          {stats.map(stat => (
            <div key={stat.label} className="leading-tight">
              <div className="font-headline text-xl font-bold tabular-nums text-white">{stat.value}</div>
              <div className="mt-1 text-[11px] font-bold text-white/60">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      <span className="relative z-[1] inline-flex w-fit items-center gap-2 self-start rounded-lg bg-white px-[18px] py-2.5 text-[13.5px] font-bold text-forest-900">
        Read the autopsy
        <ArrowRight size={14} strokeWidth={2.2} />
      </span>
    </Link>
  );
}

function WhyAutopsiesCard() {
  return (
    <div className="flex min-h-[220px] -rotate-[0.8deg] flex-col rounded-xl border border-note-amber-border bg-note-amber p-5">
      <h3 className="mb-2.5 text-[17px] font-bold text-ink-strong">Why autopsies</h3>
      <p className="mb-4 text-[13px] leading-[1.6] text-ink-secondary">
        A case study tells you what happened. An autopsy shows each decision as it looked before the outcome was known: the constraint, the tradeoff, the call someone had to ship. Then you make the same call yourself in a linked rep.
      </p>
      <div className="mt-auto">
        <HatchSays
          tint="amber"
          message="Autopsies pair with practice reps. Read a stage, then run the linked challenge to make the same call yourself."
        />
      </div>
    </div>
  );
}

function SectionHead({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-1 mt-6 flex items-baseline justify-between gap-4">
      <div>
        <div className="text-lg font-bold text-ink-strong">{title}</div>
        <div className="mt-0.5 text-[12.5px] text-ink-muted">{subtitle}</div>
      </div>
    </div>
  );
}

function StoryList({
  stories,
  companyMap,
}: {
  stories: FeatureAutopsy[];
  companyMap: Map<string, AutopsyCompanyWithStories>;
}) {
  const [showAll, setShowAll] = useState(false);

  if (stories.length === 0) {
    return <p className="border-t border-hairline py-6 text-sm text-ink-muted">More stories are on the way.</p>;
  }

  const visible = showAll ? stories : stories.slice(0, INITIAL_STORY_COUNT);
  const hiddenCount = stories.length - visible.length;

  return (
    <div className="mt-2">
      {visible.map(story => {
        const company = companyMap.get(story.companySlug);
        const stageCount = story.flow?.length;
        return (
          <Link
            key={story.slug}
            href={routeForStory(story)}
            className="flex items-center gap-4 border-t border-hairline py-4 no-underline last:border-b"
          >
            <div className="min-w-0 flex-1">
              <div className="text-[11.5px] font-bold" style={{ color: company?.accent ?? 'var(--color-ink-secondary)' }}>
                {company?.name ?? story.companySlug}
              </div>
              <div className="mt-1 text-base font-bold leading-[1.32] text-ink-strong">{story.title}</div>
              <div className="mt-1 text-xs tabular-nums text-ink-muted">
                {formatReadTime(story.estimatedReadTime)}
                {typeof stageCount === 'number' && stageCount > 0 && (
                  <>
                    <span className="mx-1.5 opacity-55">·</span>
                    {stageCount} {stageCount === 1 ? 'stage' : 'stages'}
                  </>
                )}
              </div>
            </div>
            <span className="flex shrink-0 items-center gap-1 whitespace-nowrap text-xs font-bold text-forest-700">
              Read
              <ArrowRight size={13} strokeWidth={2.2} />
            </span>
          </Link>
        );
      })}
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="flex w-full items-center justify-center gap-1.5 border-t border-hairline py-3.5 text-xs font-bold text-forest-700 transition-colors hover:text-ink-strong"
        >
          Show all {stories.length} stories
          <ArrowRight size={13} strokeWidth={2.2} className="rotate-90" />
        </button>
      )}
    </div>
  );
}

function CompaniesStrip({ companies }: { companies: AutopsyCompanyWithStories[] }) {
  return (
    <div className="mt-2 flex flex-wrap border-y border-hairline">
      {companies.map(company => (
        <Link
          key={company.slug}
          href={routeForCompany(company)}
          className="border-r border-hairline px-4 py-3 text-xs font-bold no-underline last:border-r-0"
          style={{ color: company.accent }}
        >
          {company.name}
        </Link>
      ))}
    </div>
  );
}

function SearchOverlay({
  open,
  onClose,
  stories,
  companies,
}: {
  open: boolean;
  onClose: () => void;
  stories: FeatureAutopsy[];
  companies: AutopsyCompanyWithStories[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const companyMap = useMemo(() => bySlug(companies), [companies]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 80);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose, open]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        onClose();
      }
    };
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, open]);

  if (!open) return null;

  const normalized = query.trim().toLowerCase();
  const matches = normalized
    ? stories.filter(story => {
      const company = companyMap.get(story.companySlug)?.name ?? '';
      return story.title.toLowerCase().includes(normalized)
        || story.dek.toLowerCase().includes(normalized)
        || company.toLowerCase().includes(normalized);
    }).slice(0, 8)
    : stories.slice(0, 6);
  const companyMatches = normalized
    ? companies.filter(company => company.name.toLowerCase().includes(normalized)).slice(0, 6)
    : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/45 px-4 pt-[10vh]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[560px] rounded-2xl border border-hairline bg-card-bright"
        onClick={event => event.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 border-b border-hairline px-4 py-3.5">
          <Search size={17} strokeWidth={1.8} className="shrink-0 text-ink-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search autopsies, companies, patterns"
            className="min-w-0 flex-1 bg-transparent text-sm text-ink-strong placeholder:text-ink-muted focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="flex shrink-0 items-center justify-center rounded-md p-1 text-ink-muted hover:text-ink-strong"
          >
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto px-2 py-2">
          {matches.length > 0 && (
            <SearchSection label={normalized ? `${matches.length} stories` : 'Popular this week'}>
              {matches.map(story => {
                const company = companyMap.get(story.companySlug);
                return (
                  <Link
                    key={story.slug}
                    href={routeForStory(story)}
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-lg px-2.5 py-2 no-underline hover:bg-page-field"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink-strong">{story.title}</span>
                      <small className="text-xs text-ink-muted">
                        {company?.name ?? story.companySlug} · {formatReadTime(story.estimatedReadTime)}
                      </small>
                    </span>
                    <ArrowRight size={14} strokeWidth={2} className="shrink-0 text-ink-muted" />
                  </Link>
                );
              })}
            </SearchSection>
          )}
          {companyMatches.length > 0 && (
            <SearchSection label="Companies">
              {companyMatches.map(company => (
                <Link
                  key={company.slug}
                  href={routeForCompany(company)}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-lg px-2.5 py-2 no-underline hover:bg-page-field"
                >
                  <span className="text-sm font-bold" style={{ color: company.accent }}>
                    {company.name}
                  </span>
                  <span className="text-xs text-ink-muted">{company.stories.length} stories</span>
                </Link>
              ))}
            </SearchSection>
          )}
          {normalized && matches.length === 0 && companyMatches.length === 0 && (
            <div className="px-2.5 py-6 text-center">
              <div className="text-xs font-bold uppercase tracking-[0.06em] text-ink-muted">No matches</div>
              <p className="mt-1.5 text-sm text-ink-secondary">Try a company name, a feature, or a pattern like cold start or pricing.</p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-hairline px-4 py-2.5 text-[11px] text-ink-muted">
          <span>Esc to close</span>
          <span>{stories.length} stories · {companies.length} companies</span>
        </div>
      </div>
    </div>
  );
}

function SearchSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-1.5">
      <div className="px-2.5 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.06em] text-ink-muted">{label}</div>
      <div>{children}</div>
    </div>
  );
}

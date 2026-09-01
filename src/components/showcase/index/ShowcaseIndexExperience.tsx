'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Search, X } from 'lucide-react';
import type { AutopsyCompanyWithStories, FeatureAutopsy } from '@/lib/autopsies/types';
import { StoryVisual } from '@/components/showcase/StoryVisual';
import { getProminentStoryImage } from '@/lib/autopsies/images';

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
 * Editorial autopsies hub: light page header, a uniform story grid (brand-
 * colored text label, no marks, no spines per spec §8), and a quiet
 * companies text strip. Search and the full company list stay real and
 * wired, restyled to the same tokens.
 */
export function ShowcaseIndexExperience({
  companies,
  stories,
}: ShowcaseIndexExperienceProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const companyMap = useMemo(() => bySlug(companies), [companies]);

  return (
    <div className="mx-auto max-w-[1180px] px-4 pb-12 pt-4 lg:px-0">
      <HubHero
        stories={stories}
        companyCount={companies.length}
        onOpenSearch={() => setSearchOpen(true)}
      />

      {/* Uniform story grid — no featured tile. The dark 2x-wide featured card
          broke the grid's rhythm and just duplicated a story already in the
          list below it; every card now gets the same plain treatment. */}
      <StoryList stories={stories} companyMap={companyMap} />

      {companies.length > 0 && (
        <>
          <SectionHead title="Browse by company" />
          <CompaniesStrip companies={companies} />
        </>
      )}

      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        stories={stories}
        companies={companies}
      />
    </div>
  );
}

/**
 * Parses "20 min read" / "20 min" / "20" DB strings to minutes. Returns null
 * for anything non-numeric so the avg-read chip can honestly omit itself.
 */
function parseReadMinutes(raw: string): number | null {
  const match = raw.trim().match(/^(\d+)/);
  if (!match) return null;
  const minutes = Number(match[1]);
  return Number.isFinite(minutes) && minutes > 0 ? minutes : null;
}

/**
 * Quiet dark hero: heading + subhead carry the page, one plain inline stat
 * line replaces the old three boxed chips, and Search sits alone on the
 * right instead of crowding in next to them. Stats only render with real
 * backing data; avg read time derives from the stories' estimatedReadTime
 * strings and omits itself when none parse.
 */
function HubHero({
  stories,
  companyCount,
  onOpenSearch,
}: {
  stories: FeatureAutopsy[];
  companyCount: number;
  onOpenSearch: () => void;
}) {
  const readMinutes = stories
    .map(story => parseReadMinutes(story.estimatedReadTime))
    .filter((minutes): minutes is number => minutes !== null);
  const avgRead = readMinutes.length > 0
    ? Math.round(readMinutes.reduce((sum, minutes) => sum + minutes, 0) / readMinutes.length)
    : null;

  const statParts = [
    stories.length > 0 ? `${stories.length} ${stories.length === 1 ? 'story' : 'stories'}` : null,
    companyCount > 0 ? `${companyCount} ${companyCount === 1 ? 'company' : 'companies'}` : null,
    avgRead !== null ? `${avgRead} min avg read` : null,
  ].filter(Boolean);

  return (
    <div
      data-tour-target="autopsies-hero"
      className="relative overflow-hidden rounded-2xl px-[26px] py-5 text-white"
      style={{
        background:
          'linear-gradient(120deg, var(--color-forest-950) 0%, var(--color-forest-900) 45%, var(--color-forest-850) 75%, var(--color-forest-700) 130%)',
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-16 h-[420px] w-[420px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(30,71,45,.55) 0%, rgba(30,71,45,0) 70%)' }}
      />
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
        <div className="min-w-0">
          <span className="mb-1.5 block font-label text-[10.5px] font-extrabold uppercase tracking-[0.09em] text-mint-glow">
            Product autopsies
          </span>
          <h1 className="font-headline text-[24px] font-semibold leading-[1.15] text-on-hero-strong">
            Learn from real product wins and misses.
          </h1>
          <p className="mt-1 max-w-[62ch] text-[13px] leading-[1.5] text-white/72">
            Stage-by-stage breakdowns of real growth, monetization, and retention calls. Read one, then make the same call yourself in a linked rep.
          </p>
          {statParts.length > 0 && (
            <p className="mt-2.5 text-[12px] font-semibold tabular-nums text-white/55">
              {statParts.join('  ·  ')}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex shrink-0 items-center gap-2 rounded-lg border border-white/20 bg-transparent px-3 py-1.5 text-[12px] font-bold text-white/85 transition-colors hover:bg-white/10"
        >
          <Search size={15} strokeWidth={1.8} className="shrink-0" />
          Search
        </button>
      </div>
    </div>
  );
}

function SectionHead({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-1 mt-6 flex items-baseline justify-between gap-4">
      <div>
        <div className="text-lg font-bold text-ink-strong">{title}</div>
        {subtitle && <div className="mt-0.5 text-[12.5px] text-ink-muted">{subtitle}</div>}
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
    <div className="mt-4">
      {/* Card grid per autopsies-hub-1440.png: brand-accent company text
          label leads each card (letter avatars are banned, spec §8). Every
          card is a single full-card link, so the border/shadow hover state
          is the click affordance — no separate "Read" label needed. */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visible.map(story => {
          const company = companyMap.get(story.companySlug);
          const stageCount = story.flow?.length;
          const hasArt = Boolean(getProminentStoryImage(story));
          return (
            <Link
              key={story.slug}
              href={routeForStory(story)}
              className="group flex flex-col overflow-hidden rounded-xl border border-hairline bg-card-bright no-underline transition-shadow hover:shadow-[0_1px_2px_rgba(30,27,20,.04),0_16px_36px_-24px_rgba(30,27,20,.3)]"
            >
              {/* Art band only when the story carries a REAL hero image — the
                  generated placeholder art read as junk, so imageless stories
                  get the clean text card instead. */}
              {hasArt && (
                <div className="relative h-[118px] shrink-0 overflow-hidden bg-page-field [&_figure]:m-0 [&_figure]:h-full [&_figure]:w-full [&_img]:h-full [&_img]:w-full [&_img]:object-cover [&_img]:transition-transform [&_img]:duration-300 group-hover:[&_img]:scale-[1.03]">
                  <StoryVisual
                    story={story}
                    company={company ? { name: company.name, slug: company.slug, accent: company.accent } : undefined}
                    variant="tile"
                  />
                </div>
              )}
              <div className="flex flex-1 flex-col p-4">
                <div className="text-[11.5px] font-bold" style={{ color: company?.accent ?? 'var(--color-ink-secondary)' }}>
                  {company?.name ?? story.companySlug}
                </div>
                <div className="mt-1.5 flex-1 text-[15px] font-bold leading-[1.32] text-ink-strong">{story.title}</div>
                <div className="mt-2 text-xs tabular-nums text-ink-muted">
                  {formatReadTime(story.estimatedReadTime)}
                  {typeof stageCount === 'number' && stageCount > 0 && (
                    <>
                      <span className="mx-1.5 opacity-55">·</span>
                      {stageCount} {stageCount === 1 ? 'stage' : 'stages'}
                    </>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mt-3 flex w-full items-center justify-center gap-1.5 border-t border-hairline py-3.5 text-xs font-bold text-forest-700 transition-colors hover:text-ink-strong"
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

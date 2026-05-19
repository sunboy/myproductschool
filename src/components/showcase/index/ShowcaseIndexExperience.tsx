'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StoryTile, StoryRow } from './StoryTile';
import { StoryVisual } from '@/components/showcase/StoryVisual';
import { CompanyArt } from '@/components/showcase/CompanyArt';
import type { ReadingPath } from '@/lib/showcase/reading-paths';
import type { AutopsyCompanyWithStories, FeatureAutopsy } from '@/lib/autopsies/types';

interface ShowcaseIndexExperienceProps {
  companies: AutopsyCompanyWithStories[];
  stories: FeatureAutopsy[];
  readingPaths: ReadingPath[];
}

type StoryFilter = 'all' | 'company_teardown' | 'feature_autopsy';
type StorySort = 'recent' | 'reading' | 'company';

function bySlug<T extends { slug: string }>(items: T[]) {
  return new Map(items.map(item => [item.slug, item]));
}

function featuredStory(stories: FeatureAutopsy[]) {
  return stories.find(story => story.slug === 'buffer-fake-landing-page-mvp')
    ?? stories.find(story => story.slug === 'gmail-undo-send')
    ?? stories.find(story => story.featured)
    ?? stories[0];
}

function storyKindLabel(story: FeatureAutopsy) {
  return story.storyType === 'company_teardown' ? 'Company teardown' : 'Feature autopsy';
}

function routeForStory(story: FeatureAutopsy) {
  return `/explore/showcase/${story.companySlug}/stories/${story.slug}`;
}

export function ShowcaseIndexExperience({
  companies,
  stories,
  readingPaths,
}: ShowcaseIndexExperienceProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filter, setFilter] = useState<StoryFilter>('all');
  const [sort, setSort] = useState<StorySort>('recent');
  const featured = featuredStory(stories);

  const companyMap = useMemo(() => bySlug(companies), [companies]);
  const companyStories = useMemo(() => {
    const map = new Map<string, FeatureAutopsy[]>();
    stories.forEach(story => {
      const next = map.get(story.companySlug) ?? [];
      next.push(story);
      map.set(story.companySlug, next);
    });
    return map;
  }, [stories]);

  const editorStories = stories.filter(story => story.featured || ['buffer-fake-landing-page-mvp', 'gmail-undo-send', 'airbnb-decoded'].includes(story.slug));
  const teardownStories = stories.filter(story => story.storyType === 'company_teardown');
  const featureStories = stories.filter(story => story.storyType === 'feature_autopsy');

  const visibleStories = useMemo(() => {
    let list = filter === 'all'
      ? [...stories]
      : stories.filter(story => story.storyType === filter);

    if (sort === 'reading') {
      list = list.sort((a, b) => Number.parseInt(a.estimatedReadTime, 10) - Number.parseInt(b.estimatedReadTime, 10));
    } else if (sort === 'company') {
      list = list.sort((a, b) => {
        const aCompany = companyMap.get(a.companySlug)?.name ?? a.companySlug;
        const bCompany = companyMap.get(b.companySlug)?.name ?? b.companySlug;
        return aCompany.localeCompare(bCompany) || a.title.localeCompare(b.title);
      });
    }

    return list;
  }, [companyMap, filter, sort, stories]);

  return (
    <div className="sc-page">
      <HeroHybrid
        featured={featured}
        company={featured ? companyMap.get(featured.companySlug) : undefined}
        onOpenSearch={() => setSearchOpen(true)}
      />

      <div className="sc-index-shelves">
        {editorStories.length > 0 && (
          <StoryShelf
            eyebrow="Curated"
            title="Editor's pick"
            subtitle="Stories the team keeps coming back to."
            density="compact"
          >
            {editorStories.slice(0, 6).map(story => {
              const company = companyMap.get(story.companySlug);
              return (
                <StoryTile
                  key={story.slug}
                  story={story}
                  companyName={company?.name ?? story.companySlug}
                  companyAccent={company?.accent}
                  size="compact"
                />
              );
            })}
          </StoryShelf>
        )}

        {readingPaths.length > 0 && (
          <ReadingPathShelf readingPaths={readingPaths} stories={stories} companyMap={companyMap} />
        )}

        {featureStories.length > 0 && (
          <StoryShelf
            eyebrow="One specific feature"
            title="Feature autopsies"
            subtitle="Decisions, mechanisms, evidence, one feature deep."
          >
            {featureStories.slice(0, 8).map(story => {
              const company = companyMap.get(story.companySlug);
              return (
                <StoryTile
                  key={story.slug}
                  story={story}
                  companyName={company?.name ?? story.companySlug}
                  companyAccent={company?.accent}
                />
              );
            })}
          </StoryShelf>
        )}
      </div>

      <CompanyBrowseStrip
        companies={companies}
        companyStories={companyStories}
        onOpenDrawer={() => setDrawerOpen(true)}
      />

      {teardownStories.length > 0 && (
        <CompanyTeardownStrip stories={teardownStories} companyMap={companyMap} />
      )}

      <section className="sc-firehose">
        <div className="sc-section-heading">
          <div>
            <div className="sc-eyebrow">The library</div>
            <h2 className="sc-h2">All {stories.length} autopsies</h2>
          </div>
          <div className="sc-firehose-controls">
            <SegmentedFilter value={filter} onChange={setFilter} />
            <label className="sr-only" htmlFor="showcase-sort">Sort stories</label>
            <select
              id="showcase-sort"
              value={sort}
              onChange={event => setSort(event.target.value as StorySort)}
              className="sc-select"
            >
              <option value="recent">Sort: Recent</option>
              <option value="company">Sort: Company</option>
              <option value="reading">Sort: Shortest first</option>
            </select>
          </div>
        </div>

        <div className="sc-firehose-grid">
          {visibleStories.map(story => {
            const company = companyMap.get(story.companySlug);
            return (
              <StoryRow
                key={story.slug}
                story={story}
                companyName={company?.name ?? story.companySlug}
                companyAccent={company?.accent}
              />
            );
          })}
        </div>
      </section>

      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        stories={stories}
        companies={companies}
      />
      <LibraryCompanyDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        companies={companies}
        companyStories={companyStories}
      />
    </div>
  );
}

function HeroHybrid({
  featured,
  company,
  onOpenSearch,
}: {
  featured?: FeatureAutopsy;
  company?: AutopsyCompanyWithStories;
  onOpenSearch: () => void;
}) {
  if (!featured) return null;

  return (
    <div className="sc-hero-hybrid">
      <section className="sc-hero-ink">
        <div className="sc-hero-ink-dotgrid" />
        <div className="sc-hero-ink-glow-green" />
        <div className="sc-hero-ink-glow-amber" />
        <div className="sc-hero-copy">
          <div className="sc-eyebrow sc-eyebrow--ink">The Showcase · long-form product autopsies</div>
          <h1 className="sc-h1 sc-hero-title">
            How <em>actually</em> shipped products got
            <br />
            <span>shipped.</span>
          </h1>
          <p className="sc-hero-dek">
            Mechanisms, decisions, evidence. Search a company, a pattern, or the move you are trying to make.
          </p>
          <button className="sc-hero-search" type="button" onClick={onOpenSearch}>
            <span className="material-symbols-outlined" aria-hidden="true">search</span>
            <span className="sc-hero-search-input">How Spotify built Wrapped...</span>
            <span className="sc-hero-search-kbd">⌘ K</span>
          </button>
          <div className="sc-hero-chips">
            {['Onboarding teardowns', 'Pricing pivots', 'Cold-start tricks', 'Retention masterclass'].map(label => (
              <button key={label} type="button" className="sc-hero-chip" onClick={onOpenSearch}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <Link href={routeForStory(featured)} className="sc-featured-card">
        <div className="sc-tile-art sc-featured-card__art">
          <StoryVisual
            story={featured}
            company={company ? { name: company.name, slug: company.slug, accent: company.accent } : undefined}
            variant="hero"
            priority
          />
          <div className="sc-tile-art-fade" />
          <span className="sc-tile-corner">
            <span
              className="sc-dot"
              style={{ background: company?.accent ?? 'var(--sc-accent)' }}
              aria-hidden="true"
            />
            Editor&apos;s pick
          </span>
        </div>
        <div className="sc-tile-body sc-featured-card__body">
          <div className="sc-tile-meta">
            <span style={{ color: company?.accent ?? 'var(--sc-accent)' }}>
              {company?.name ?? featured.companySlug}
            </span>
            <span className="dot" />
            <span>{featured.estimatedReadTime}</span>
            <span className="dot" />
            <span>{storyKindLabel(featured)}</span>
          </div>
          <div className="sc-tile-title sc-featured-card__title">{featured.title}</div>
          <div className="sc-tile-dek sc-featured-card__dek">{featured.dek}</div>
        </div>
      </Link>
    </div>
  );
}

function StoryShelf({
  eyebrow,
  title,
  subtitle,
  density = 'regular',
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  density?: 'regular' | 'compact';
  children: ReactNode;
}) {
  const railRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: -1 | 1) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: dir * rail.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <section className="sc-shelf">
      <div className="sc-section-heading">
        <div>
          <div className="sc-eyebrow">{eyebrow}</div>
          <h2 className="sc-h2">{title}</h2>
          <div className="sc-section-subtitle">{subtitle}</div>
        </div>
        <div className="sc-shelf-actions">
          <button className="sc-icon-btn" type="button" onClick={() => scroll(-1)} aria-label={`Scroll ${title} left`}>
            <span className="material-symbols-outlined msi-sm" aria-hidden="true">chevron_left</span>
          </button>
          <button className="sc-icon-btn" type="button" onClick={() => scroll(1)} aria-label={`Scroll ${title} right`}>
            <span className="material-symbols-outlined msi-sm" aria-hidden="true">chevron_right</span>
          </button>
        </div>
      </div>
      <div
        className={`sc-shelf-rail ${density === 'compact' ? 'sc-shelf-rail--compact' : ''}`}
        ref={railRef}
      >
        {children}
      </div>
    </section>
  );
}

function ReadingPathShelf({
  readingPaths,
  stories,
  companyMap,
}: {
  readingPaths: ReadingPath[];
  stories: FeatureAutopsy[];
  companyMap: Map<string, AutopsyCompanyWithStories>;
}) {
  const storyMap = bySlug(stories);

  return (
    <section className="sc-reading-paths">
      <div className="sc-section-heading">
        <div>
          <div className="sc-eyebrow">Reading paths</div>
          <h2 className="sc-h2">Follow a thread.</h2>
          <div className="sc-section-subtitle">Structured sequences for repeated product moves.</div>
        </div>
      </div>
      <div className="sc-reading-path-grid">
        {readingPaths.slice(0, 4).map(path => {
          const firstItem = path.items[0];
          const firstStory = firstItem ? storyMap.get(firstItem.storySlug) : undefined;
          const company = firstStory ? companyMap.get(firstStory.companySlug) : undefined;
          return (
            <Link key={path.slug} href="/explore/showcase" className="sc-reading-path-card">
              <div className="sc-reading-path-art">
                {firstStory ? (
                  <StoryVisual story={firstStory} company={company} variant="rail" />
                ) : (
                  <CompanyArt name={path.title} slug={path.slug} variant="mini" />
                )}
              </div>
              <div>
                <div className="sc-eyebrow">{path.coverEmoji} Path</div>
                <h3 className="sc-h3">{path.title}</h3>
                <p>{path.dek}</p>
                <span>{path.items.length} stories</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function CompanyBrowseStrip({
  companies,
  companyStories,
  onOpenDrawer,
}: {
  companies: AutopsyCompanyWithStories[];
  companyStories: Map<string, FeatureAutopsy[]>;
  onOpenDrawer: () => void;
}) {
  return (
    <section className="sc-company-strip">
      <div className="sc-section-heading">
        <div>
          <div className="sc-eyebrow">Secondary axis</div>
          <h2 className="sc-h2">Browse by company</h2>
        </div>
        <button className="sc-section-link" type="button" onClick={onOpenDrawer}>
          All {companies.length} companies
          <span className="material-symbols-outlined msi-sm" aria-hidden="true">arrow_forward</span>
        </button>
      </div>
      <div className="sc-company-grid">
        {companies.slice(0, 12).map(company => {
          const count = companyStories.get(company.slug)?.length ?? 0;
          return (
            <Link key={company.slug} href={`/explore/showcase/${company.slug}`} className="sc-company-card">
              <span className="sc-company-card__name">
                <span className="sc-dot" style={{ background: company.accent }} aria-hidden="true" />
                {company.name}
              </span>
              <span className="sc-company-card__meta">{count} {count === 1 ? 'story' : 'stories'}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function CompanyTeardownStrip({
  stories,
  companyMap,
}: {
  stories: FeatureAutopsy[];
  companyMap: Map<string, AutopsyCompanyWithStories>;
}) {
  return (
    <StoryShelf
      eyebrow="Full product"
      title="Company teardowns"
      subtitle="The whole product, one read."
    >
      {stories.map(story => {
        const company = companyMap.get(story.companySlug);
        return (
          <StoryTile
            key={story.slug}
            story={story}
            companyName={company?.name ?? story.companySlug}
            companyAccent={company?.accent}
            size="regular"
          />
        );
      })}
    </StoryShelf>
  );
}

function SegmentedFilter({
  value,
  onChange,
}: {
  value: StoryFilter;
  onChange: (value: StoryFilter) => void;
}) {
  const options: Array<{ value: StoryFilter; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'company_teardown', label: 'Teardowns' },
    { value: 'feature_autopsy', label: 'Feature autopsies' },
  ];

  return (
    <div className="sc-segmented" role="group" aria-label="Filter autopsies">
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={value === option.value ? 'active' : ''}
        >
          {option.label}
        </button>
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
    <div className="sc-search-overlay" onClick={onClose}>
      <div className="sc-search-panel" onClick={event => event.stopPropagation()}>
        <div className="sc-search-input-row">
          <span className="material-symbols-outlined" aria-hidden="true">search</span>
          <input
            ref={inputRef}
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search autopsies, companies, patterns"
          />
          <kbd>ESC</kbd>
        </div>
        <div className="sc-search-results">
          {!normalized && (
            <SearchSection label="Try these">
              <div className="sc-search-chips">
                {['How Spotify built Wrapped', 'Why Gmail added Undo Send', 'Buffer fake landing page', 'Cold-start tricks'].map(label => (
                  <button key={label} type="button" className="sc-chip sc-chip--ghost" onClick={() => setQuery(label)}>
                    {label}
                  </button>
                ))}
              </div>
            </SearchSection>
          )}
          {matches.length > 0 && (
            <SearchSection label={normalized ? `${matches.length} stories` : 'Popular this week'}>
              {matches.map(story => {
                const company = companyMap.get(story.companySlug);
                return (
                  <Link key={story.slug} href={routeForStory(story)} className="sc-search-row" onClick={onClose}>
                    <span className="sc-search-thumb">
                      <StoryVisual story={story} company={company} variant="rail" />
                    </span>
                    <span className="sc-search-row__body">
                      <span>{story.title}</span>
                      <small>{company?.name ?? story.companySlug} · {story.estimatedReadTime}</small>
                    </span>
                    <span className="material-symbols-outlined msi-sm" aria-hidden="true">arrow_forward</span>
                  </Link>
                );
              })}
            </SearchSection>
          )}
          {companyMatches.length > 0 && (
            <SearchSection label="Companies">
              {companyMatches.map(company => (
                <Link key={company.slug} href={`/explore/showcase/${company.slug}`} className="sc-search-row" onClick={onClose}>
                  <span className="sc-search-company-dot" style={{ background: company.accent }} />
                  <span className="sc-search-row__body">
                    <span>{company.name}</span>
                    <small>{company.stories.length} stories</small>
                  </span>
                </Link>
              ))}
            </SearchSection>
          )}
          {normalized && matches.length === 0 && companyMatches.length === 0 && (
            <div className="sc-search-empty">
              <div className="sc-eyebrow">No matches</div>
              <p>Try a company name, a feature, or a pattern like cold start or pricing.</p>
            </div>
          )}
        </div>
        <div className="sc-search-footer">
          <span>↑↓ Navigate · ↵ Open · ⌘K Toggle</span>
          <span>{stories.length} stories · {companies.length} companies</span>
        </div>
      </div>
    </div>
  );
}

function SearchSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="sc-search-section">
      <div className="sc-search-section__label">{label}</div>
      <div>{children}</div>
    </div>
  );
}

function LibraryCompanyDrawer({
  open,
  onClose,
  companies,
  companyStories,
}: {
  open: boolean;
  onClose: () => void;
  companies: AutopsyCompanyWithStories[];
  companyStories: Map<string, FeatureAutopsy[]>;
}) {
  if (!open) return null;

  return (
    <div className="sc-company-drawer-shell">
      <div className="sc-company-drawer-scrim" onClick={onClose} aria-hidden="true" />
      <aside className="sc-company-drawer" aria-label="Browse companies">
        <header>
          <div>
            <div className="sc-eyebrow">Browse by company</div>
            <h2>All {companies.length} companies</h2>
          </div>
          <button className="sc-icon-btn" type="button" onClick={onClose} aria-label="Close company drawer">
            <span className="material-symbols-outlined msi-sm" aria-hidden="true">close</span>
          </button>
        </header>
        <div className="sc-company-drawer-list">
          {companies.map(company => {
            const count = companyStories.get(company.slug)?.length ?? 0;
            return (
              <Link key={company.slug} href={`/explore/showcase/${company.slug}`} className="sc-company-drawer-row" onClick={onClose}>
                <span className="sc-company-drawer-art">
                  <CompanyArt name={company.name} slug={company.slug} accent={company.accent} variant="mini" />
                </span>
                <span>
                  <strong>
                    <span className="sc-dot" style={{ background: company.accent }} aria-hidden="true" />
                    {company.name}
                  </strong>
                  <small>{company.thesis || company.dek}</small>
                </span>
                <em>{count}</em>
              </Link>
            );
          })}
        </div>
      </aside>
    </div>
  );
}

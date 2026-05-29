import Link from 'next/link';
import type { CSSProperties } from 'react';
import type { CompanyHub } from '@/lib/autopsies/types';

interface CompanyHubHeaderProps {
  company: CompanyHub;
  storyCount: number;
}

// Placeholder copy that leaked from the draft-generation pipeline. When the
// thesis/dek match these, fall back to a clean neutral line instead of showing
// internal boilerplate to users.
const PLACEHOLDER_PATTERNS = [
  /reusable decisions worth studying/i,
  /from the HackProduct draft library/i,
];

function isPlaceholder(text: string | undefined | null): boolean {
  if (!text) return true;
  return PLACEHOLDER_PATTERNS.some((re) => re.test(text));
}

export function CompanyHubHeader({ company, storyCount }: CompanyHubHeaderProps) {
  const headline = !isPlaceholder(company.thesis)
    ? company.thesis
    : !isPlaceholder(company.dek)
      ? company.dek
      : `Product decisions worth studying, taken apart one story at a time.`;

  return (
    <header className="sc-company-header" style={{ '--company-accent': company.accent } as CSSProperties}>
      <div className="sc-hero-ink-dotgrid" />
      <div className="sc-company-header__glow" />
      <div className="sc-company-header__inner">
        <Link href="/explore/autopsies" className="sc-company-header__back">
          <span className="material-symbols-outlined msi-sm" aria-hidden="true">arrow_back</span>
          All stories
        </Link>
        <div className="sc-eyebrow sc-company-header__eyebrow">
          <span className="sc-dot" style={{ background: company.accent }} aria-hidden="true" />
          Showcase · Company · {storyCount} {storyCount === 1 ? 'story' : 'stories'}
        </div>
        <h1>{company.name}.</h1>
        <p>{headline}</p>
        <div className="sc-company-timeline">
          <span className="sc-company-timeline__item">
            <span className="sc-chip sc-chip--ink sc-company-timeline__count">
              {storyCount} {storyCount === 1 ? 'autopsy' : 'autopsies'}
            </span>
          </span>
        </div>
      </div>
    </header>
  );
}

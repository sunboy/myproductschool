import Link from 'next/link';
import type { CSSProperties } from 'react';
import type { CompanyHub } from '@/lib/autopsies/types';

interface CompanyHubHeaderProps {
  company: CompanyHub;
  storyCount: number;
}

export function CompanyHubHeader({ company, storyCount }: CompanyHubHeaderProps) {
  return (
    <header className="sc-company-header" style={{ '--company-accent': company.accent } as CSSProperties}>
      <div className="sc-hero-ink-dotgrid" />
      <div className="sc-company-header__glow" />
      <div className="sc-company-header__inner">
        <Link href="/explore/showcase" className="sc-company-header__back">
          <span className="material-symbols-outlined msi-sm" aria-hidden="true">arrow_back</span>
          All stories
        </Link>
        <div className="sc-eyebrow sc-company-header__eyebrow">
          <span className="sc-dot" style={{ background: company.accent }} aria-hidden="true" />
          Showcase · Company · {storyCount} {storyCount === 1 ? 'story' : 'stories'}
        </div>
        <h1>{company.name}.</h1>
        <p>{company.thesis || company.dek}</p>
        <div className="sc-company-timeline">
          {company.timeline.slice(0, 6).map((event, index) => (
            <span key={`${event.date}-${event.label}`} className="sc-company-timeline__item">
              {index > 0 && <i aria-hidden="true" />}
              <span className="sc-chip sc-chip--ink">{event.date} · {event.label}</span>
            </span>
          ))}
          <span className="sc-company-timeline__item">
            <i aria-hidden="true" />
            <span className="sc-chip sc-chip--ink sc-company-timeline__count">
              {storyCount} autopsies
            </span>
          </span>
        </div>
      </div>
    </header>
  );
}

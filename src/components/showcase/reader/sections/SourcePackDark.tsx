'use client';

import { SectionEnter } from '@/components/showcase/reader/SectionEnter';
import type { AutopsySource } from '@/lib/autopsies/types';

interface SourcePackDarkProps {
  sources: AutopsySource[];
  summary?: string;
  sectionId: string;
}

export function SourcePackDark({ sources, summary, sectionId }: SourcePackDarkProps) {
  if (sources.length === 0 && !summary) return null;

  return (
    <SectionEnter sectionId={sectionId} className="sc-sources">
      <div className="sc-reader-section__header sc-reader-section__header--center">
        <span className="sc-reader-section__icon">
          <span className="material-symbols-outlined" aria-hidden="true">library_books</span>
        </span>
        <span className="sc-reader-section__heading-copy">
          <span className="sc-eyebrow">Reference links</span>
          <h2 className="sc-reader-section__title">Sources</h2>
        </span>
      </div>
      {summary && <p className="sc-sources-summary">{summary}</p>}
      <div className="sc-sources-list">
        {sources.map(source => (
          <a
            key={source.id}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="sc-source-row"
          >
            <span>
              <strong>{source.title}</strong>
              <small>{source.publisher} · {source.accessedAt}</small>
            </span>
            <span className="material-symbols-outlined msi-sm" aria-hidden="true">open_in_new</span>
          </a>
        ))}
      </div>
    </SectionEnter>
  );
}

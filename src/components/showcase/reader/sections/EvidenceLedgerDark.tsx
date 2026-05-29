'use client';

import { SectionEnter } from '@/components/showcase/reader/SectionEnter';
import type { AutopsyMetric } from '@/lib/autopsies/types';

interface EvidenceLedgerDarkProps {
  metrics: AutopsyMetric[];
  sectionId: string;
}

export function EvidenceLedgerDark({ metrics, sectionId }: EvidenceLedgerDarkProps) {
  if (metrics.length === 0) return null;

  return (
    <SectionEnter sectionId={sectionId} className="sc-evidence">
      <div className="sc-reader-section__header sc-reader-section__header--center">
        <span className="sc-reader-section__icon">
          <span className="material-symbols-outlined" aria-hidden="true">fact_check</span>
        </span>
        <span className="sc-reader-section__heading-copy">
          <span className="sc-eyebrow">Evidence</span>
          <h2 className="sc-reader-section__title">What we can verify</h2>
        </span>
      </div>
      <p className="sc-evidence-note">
        A compact check on the public facts this story leans on.
      </p>
      <div className="sc-evidence-strip">
        {metrics.map((metric, i) => (
          <SectionEnter key={`${metric.label}-${i}`} delay={i * 0.05}>
            <article className="sc-evidence-card" data-confidence={metric.confidence}>
              <span className="sc-evidence-card__marker" aria-hidden="true" />
              <div>
                <div className="sc-evidence-label">{metric.label}</div>
                <div className="sc-evidence-value">{metric.value}</div>
                <div className="sc-evidence-source">
                  {metric.sourceIds.length === 1
                    ? '1 cited source'
                    : `${metric.sourceIds.length} cited sources`}
                </div>
              </div>
            </article>
          </SectionEnter>
        ))}
      </div>
    </SectionEnter>
  );
}

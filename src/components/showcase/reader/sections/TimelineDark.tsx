'use client';

import { SectionEnter } from '@/components/showcase/reader/SectionEnter';
import type { AutopsyTimelineEvent } from '@/lib/autopsies/types';

interface TimelineDarkProps {
  events: AutopsyTimelineEvent[];
  sectionId: string;
}

export function TimelineDark({ events, sectionId }: TimelineDarkProps) {
  if (events.length === 0) return null;

  return (
    <SectionEnter sectionId={sectionId} className="sc-timeline">
      <div className="sc-reader-section__header sc-reader-section__header--center">
        <span className="sc-reader-section__icon">
          <span className="material-symbols-outlined" aria-hidden="true">timeline</span>
        </span>
        <span className="sc-reader-section__heading-copy">
          <span className="sc-eyebrow">Story arc</span>
          <h2 className="sc-reader-section__title">Timeline</h2>
        </span>
      </div>
      <div className="sc-timeline-track">
        {events.map((event, i) => (
          <SectionEnter key={`${event.date}-${i}`} delay={i * 0.05} className="sc-timeline-item">
            <div className="sc-timeline-dot" />
            <div>
              <div className="sc-timeline-meta">
                <span>{event.date}</span>
                <em>{event.type}</em>
              </div>
              <h3>{event.label}</h3>
              {event.description && <p>{event.description}</p>}
            </div>
          </SectionEnter>
        ))}
      </div>
    </SectionEnter>
  );
}

'use client';

import { SectionEnter } from '@/components/showcase/reader/SectionEnter';
import type { QuickReadCard } from '@/lib/autopsies/types';

const CARD_ICONS: Record<QuickReadCard['id'], string> = {
  setup: 'map',
  decision: 'bolt',
  'wrong-obvious-answer': 'close_small',
  mechanism: 'settings',
  evidence: 'analytics',
  lesson: 'school',
};

interface QuickReadDarkProps {
  cards: QuickReadCard[];
  sectionId: string;
}

export function QuickReadDark({ cards, sectionId }: QuickReadDarkProps) {
  return (
    <SectionEnter sectionId={sectionId} className="sc-quick-read">
      <div className="sc-reader-section__header sc-reader-section__header--center">
        <span className="sc-reader-section__icon">
          <span className="material-symbols-outlined" aria-hidden="true">list_alt</span>
        </span>
        <span className="sc-reader-section__heading-copy">
          <span className="sc-eyebrow">Quick read</span>
          <h2 className="sc-reader-section__title">At a glance</h2>
        </span>
      </div>
      <div className="sc-quick-read-grid">
        {cards.map((card, i) => (
          <SectionEnter key={card.id} delay={i * 0.05}>
            <article className="sc-quick-card">
              <div className="sc-quick-card__topline">
                <span>{String(i + 1).padStart(2, '0')}</span>
                <span className="material-symbols-outlined" aria-hidden="true">
                  {CARD_ICONS[card.id] ?? 'info'}
                </span>
              </div>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </article>
          </SectionEnter>
        ))}
      </div>
    </SectionEnter>
  );
}

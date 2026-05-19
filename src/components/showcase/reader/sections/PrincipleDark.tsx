'use client';

import { SectionEnter } from '@/components/showcase/reader/SectionEnter';
import type { AutopsyPrinciple } from '@/lib/autopsies/types';

interface PrincipleDarkProps {
  principle: AutopsyPrinciple;
  sectionId: string;
}

export function PrincipleDark({ principle, sectionId }: PrincipleDarkProps) {
  return (
    <SectionEnter sectionId={sectionId} className="sc-principle">
      <div className="sc-hero-ink-dotgrid" />
      <div className="sc-principle__inner">
        <div className="sc-eyebrow">The principle</div>
        <h2>{principle.principle}</h2>
        {principle.attribution && <p>{principle.attribution}</p>}
      </div>
    </SectionEnter>
  );
}

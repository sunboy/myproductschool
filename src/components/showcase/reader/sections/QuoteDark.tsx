'use client';

import { SectionEnter } from '@/components/showcase/reader/SectionEnter';
import type { AutopsyQuote } from '@/lib/autopsies/types';

interface QuoteDarkProps {
  quote: AutopsyQuote;
  sectionId: string;
}

export function QuoteDark({ quote, sectionId }: QuoteDarkProps) {
  return (
    <SectionEnter sectionId={sectionId} className="sc-pullquote">
      <span className="material-symbols-outlined" aria-hidden="true">format_quote</span>
      <blockquote>{quote.quote}</blockquote>
      <figcaption>
        {quote.attribution}
        {quote.context && <small>{quote.context}</small>}
      </figcaption>
    </SectionEnter>
  );
}

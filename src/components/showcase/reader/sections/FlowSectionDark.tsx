'use client';

import { useState } from 'react';
import { SectionEnter } from '@/components/showcase/reader/SectionEnter';
import { getAutopsyImage } from '@/lib/autopsies/images';
import type { AutopsyImageRole, FeatureAutopsy, FlowSection } from '@/lib/autopsies/types';
import type { ReactNode } from 'react';

const CHAPTER_ICONS = ['play_arrow', 'settings', 'swap_horiz', 'highlight'];
const MARKDOWN_IMAGE_RE = /^!\[[\s\S]*?\]\([^)]+\)\s*$/;
const TABLE_SEPARATOR_RE = /^:?-{3,}:?$/;

interface FlowSectionDarkProps {
  section: FlowSection;
  sectionId: string;
  index: number;
  variant?: 'prose';
  story?: FeatureAutopsy;
  imageRole?: AutopsyImageRole;
  imageSide?: 'left' | 'right';
}

interface ParsedTable {
  headers: string[];
  rows: string[][];
  variant: 'comparison' | 'metrics' | 'default';
}

function parsePipeTable(block: string): ParsedTable | null {
  const trimmed = block.trim();
  if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) return null;

  const cells = trimmed
    .split('|')
    .map(cell => cell.trim())
    .filter(Boolean);
  const separatorIndex = cells.findIndex(cell => TABLE_SEPARATOR_RE.test(cell));
  if (separatorIndex < 2) return null;

  const headers = cells.slice(0, separatorIndex);
  const columnCount = headers.length;
  const separators = cells.slice(separatorIndex, separatorIndex + columnCount);
  if (separators.length !== columnCount || !separators.every(cell => TABLE_SEPARATOR_RE.test(cell))) {
    return null;
  }

  const bodyCells = cells.slice(separatorIndex + columnCount);
  const rows: string[][] = [];
  for (let i = 0; i < bodyCells.length; i += columnCount) {
    const row = bodyCells.slice(i, i + columnCount);
    if (row.length === columnCount) rows.push(row);
  }

  if (rows.length === 0) return null;

  const normalizedHeaders = headers.map(header => header.toLowerCase());
  const variant = normalizedHeaders.includes('the tempting move') && normalizedHeaders.includes('what shipped')
    ? 'comparison'
    : normalizedHeaders.includes('metric')
      ? 'metrics'
      : 'default';

  return { headers, rows, variant };
}

function renderInlineText(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const parts = text.split(/(`[^`]+`|\*[^*]+\*)/g).filter(Boolean);

  parts.forEach((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      nodes.push(<code key={`${part}-${index}`}>{part.slice(1, -1)}</code>);
    } else if (part.startsWith('*') && part.endsWith('*')) {
      nodes.push(<em key={`${part}-${index}`}>{part.slice(1, -1)}</em>);
    } else {
      nodes.push(part);
    }
  });

  return nodes;
}

function StoryMarkdownTable({ table }: { table: ParsedTable }) {
  return (
    <div className={`sc-story-table-wrap sc-story-table-wrap--${table.variant}`}>
      <table className={`sc-story-table sc-story-table--${table.variant}`}>
        <thead>
          <tr>
            {table.headers.map(header => (
              <th key={header}>{renderInlineText(header)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, rowIndex) => (
            <tr key={`${row[0]}-${rowIndex}`}>
              {row.map((cell, cellIndex) => (
                <td key={`${cell}-${cellIndex}`}>{renderInlineText(cell)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FlowBody({ body }: { body: string[] }) {
  return (
    <>
      {body.map((paragraph, paragraphIndex) => {
        if (MARKDOWN_IMAGE_RE.test(paragraph.trim())) return null;

        const table = parsePipeTable(paragraph);
        if (table) {
          return <StoryMarkdownTable key={`table-${paragraphIndex}`} table={table} />;
        }

        return <p key={paragraphIndex}>{renderInlineText(paragraph)}</p>;
      })}
    </>
  );
}

export function FlowSectionDark({
  section,
  sectionId,
  index,
  story,
  imageRole,
  imageSide = 'right',
}: FlowSectionDarkProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const image = story && imageRole ? getAutopsyImage(story, imageRole) : null;
  const shouldRenderImage = Boolean(image && !imageFailed);

  return (
    <SectionEnter
      sectionId={sectionId}
      className={`sc-reader-section ${shouldRenderImage ? `sc-reader-section--media sc-reader-section--media-${imageSide}` : ''}`}
    >
      <div className="sc-reader-section__header">
        <span className="sc-reader-section__icon">
          <span className="material-symbols-outlined" aria-hidden="true">
            {CHAPTER_ICONS[index] ?? 'article'}
          </span>
        </span>
        <span className="sc-reader-section__heading-copy">
          <span className="sc-eyebrow">Beat {String(index + 1).padStart(2, '0')}</span>
          <h2 className="sc-reader-section__title">{section.title}</h2>
        </span>
      </div>
      {shouldRenderImage ? (
        <div className="sc-reader-media-block">
          <div className="sc-reader-media-block__copy sc-prose">
            <FlowBody body={section.body} />
          </div>
          <figure className="sc-reader-media-block__figure">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image?.src}
              alt={image?.alt ?? ''}
              loading="lazy"
              decoding="async"
              onError={() => setImageFailed(true)}
            />
            {image?.caption && <figcaption>{image.caption}</figcaption>}
          </figure>
        </div>
      ) : (
        <div className="sc-prose">
          <FlowBody body={section.body} />
        </div>
      )}
    </SectionEnter>
  );
}

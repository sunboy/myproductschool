'use client'

import type { ChapterFigure } from '@/lib/types'
import { FigureRenderer } from './figures/FigureRenderer'

// ChapterBody splits body_mdx on figure tokens, renders prose chunks as a
// minimal markdown-subset, and renders figures as typed React components.
// No external markdown library, no DOMParser, no refs. JSX throughout so
// React handles SVG namespace natively.

export function ChapterBody({ body_mdx, figures }: { body_mdx: string; figures: ChapterFigure[] }) {
  const parts = splitOnFigureTokens(body_mdx)

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5 prose prose-sm max-w-none
      [&_h1]:font-headline [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-on-surface [&_h1]:mt-6 [&_h1]:mb-2
      [&_h2]:font-headline [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-on-surface [&_h2]:mt-5 [&_h2]:mb-2
      [&_h3]:font-label [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-on-surface [&_h3]:mt-4 [&_h3]:mb-1
      [&_p]:text-on-surface-variant [&_p]:leading-relaxed [&_p]:mb-3 [&_p]:text-sm
      [&_strong]:text-on-surface [&_strong]:font-semibold
      [&_em]:italic
      [&_hr]:border-outline-variant [&_hr]:my-4
      [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ul]:space-y-1 [&_ul]:text-sm [&_ul]:text-on-surface-variant
      [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_ol]:space-y-1 [&_ol]:text-sm [&_ol]:text-on-surface-variant
      [&_li]:leading-relaxed
      [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:no-underline
      [&_code]:bg-surface-container-high [&_code]:text-on-surface [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[0.85em] [&_code]:font-mono">
      {parts.map((part, i) => {
        if (part.kind === 'prose') {
          return <div key={i} dangerouslySetInnerHTML={{ __html: renderMiniMarkdown(part.text) }} />
        }
        const figure = figures[part.index]
        if (!figure) return null
        return <FigureRenderer key={i} figure={figure} />
      })}
    </div>
  )
}

type BodyPart = { kind: 'prose'; text: string } | { kind: 'figure'; index: number }

function splitOnFigureTokens(mdx: string): BodyPart[] {
  const parts: BodyPart[] = []
  const re = /\{\{figure:(\d+)\}\}|<!--\s*figure:(\d+)\s*-->/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(mdx)) !== null) {
    if (m.index > last) parts.push({ kind: 'prose', text: mdx.slice(last, m.index) })
    parts.push({ kind: 'figure', index: Number(m[1] ?? m[2]) })
    last = m.index + m[0].length
  }
  if (last < mdx.length) parts.push({ kind: 'prose', text: mdx.slice(last) })
  return parts
}

function renderMiniMarkdown(mdx: string): string {
  const blocks = mdx.split(/\n\n+/)
  return blocks.map(renderBlock).filter(Boolean).join('\n')
}

function renderBlock(block: string): string {
  const trimmed = block.trim()
  if (!trimmed) return ''
  if (/^-{3,}$/.test(trimmed)) return '<hr/>'
  const h3 = trimmed.match(/^### (.+)$/)
  if (h3) return `<h3>${renderInline(h3[1])}</h3>`
  const h2 = trimmed.match(/^## (.+)$/)
  if (h2) return `<h2>${renderInline(h2[1])}</h2>`
  const h1 = trimmed.match(/^# (.+)$/)
  if (h1) return `<h1>${renderInline(h1[1])}</h1>`
  const lines = trimmed.split('\n')
  if (lines.every(l => /^-\s+/.test(l))) {
    return `<ul>${lines.map(l => `<li>${renderInline(l.replace(/^-\s+/, ''))}</li>`).join('')}</ul>`
  }
  if (lines.every(l => /^\d+\.\s+/.test(l))) {
    return `<ol>${lines.map(l => `<li>${renderInline(l.replace(/^\d+\.\s+/, ''))}</li>`).join('')}</ol>`
  }
  return `<p>${renderInline(trimmed.replace(/\n/g, ' '))}</p>`
}

function renderInline(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
}

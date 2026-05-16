'use client'

import { forwardRef, useCallback, useRef, type ForwardedRef } from 'react'
import type { ChapterFigure } from '@/lib/types'
import { FigureRenderer } from './figures/FigureRenderer'

// ChapterBody splits body_mdx on figure tokens, renders prose chunks as a
// minimal markdown-subset, and renders figures as typed React components.
// No external markdown library, no DOMParser, no refs. JSX throughout so
// React handles SVG namespace natively.

interface ChapterBodyProps {
  body_mdx: string
  figures: ChapterFigure[]
  hatchContextLabel?: string
}

export const ChapterBody = forwardRef<HTMLDivElement, ChapterBodyProps>(function ChapterBody(
  { body_mdx, figures, hatchContextLabel },
  ref,
) {
  const parts = splitOnFigureTokens(body_mdx)
  const bodyRef = useRef<HTMLDivElement | null>(null)
  const setRefs = useCallback((node: HTMLDivElement | null) => {
    bodyRef.current = node
    assignRef(ref, node)
  }, [ref])

  return (
    <div
      ref={setRefs}
      data-hatch-context={hatchContextLabel}
      className="flex-1 overflow-y-auto px-6 py-5 prose prose-sm max-w-none
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
      [&_code]:bg-surface-container-high [&_code]:text-on-surface [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[0.85em] [&_code]:font-mono"
    >
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
})

function assignRef<T>(ref: ForwardedRef<T>, value: T | null) {
  if (typeof ref === 'function') {
    ref(value)
    return
  }
  if (ref) {
    ref.current = value
  }
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
  // Extract fenced code blocks first so their content isn't touched by block/inline logic
  const segments: Array<{ kind: 'code'; lang: string; content: string } | { kind: 'text'; content: string }> = []
  const fenceRe = /```(\w*)\n([\s\S]*?)```/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = fenceRe.exec(mdx)) !== null) {
    if (m.index > last) segments.push({ kind: 'text', content: mdx.slice(last, m.index) })
    segments.push({ kind: 'code', lang: m[1] ?? '', content: m[2] })
    last = m.index + m[0].length
  }
  if (last < mdx.length) segments.push({ kind: 'text', content: mdx.slice(last) })

  return segments.map(seg => {
    if (seg.kind === 'code') {
      if (seg.lang === 'mermaid') {
        // Render mermaid as a styled pre block (could wire up mermaid.js later)
        const escaped = seg.content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        return `<pre class="mermaid bg-surface-container rounded-lg p-4 overflow-x-auto text-xs font-mono text-on-surface-variant my-4 whitespace-pre">${escaped}</pre>`
      }
      const escaped = seg.content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      const langClass = seg.lang ? ` data-lang="${seg.lang}"` : ''
      return `<pre class="bg-inverse-surface rounded-lg p-4 overflow-x-auto text-sm font-mono text-inverse-on-surface my-4 whitespace-pre"${langClass}><code>${escaped}</code></pre>`
    }
    const blocks = seg.content.split(/\n\n+/)
    return blocks.map(renderBlock).filter(Boolean).join('\n')
  }).join('\n')
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
  // Standalone image line
  const imgLine = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
  if (imgLine) return `<img src="${imgLine[2]}" alt="${imgLine[1]}" class="rounded-lg my-4 w-full object-contain" />`
  const lines = trimmed.split('\n')
  // Markdown table: lines with | separators, second line is a separator row
  if (lines.length >= 2 && lines.every(l => l.trim().startsWith('|'))) {
    const rows = lines.filter(l => !/^\|[\s-|]+\|$/.test(l.trim()))
    const [header, ...body] = rows
    const parseCells = (row: string) => row.split('|').slice(1, -1).map(c => c.trim())
    const headerCells = parseCells(header)
    const headerHtml = `<thead><tr>${headerCells.map(c => `<th class="px-3 py-2 text-left font-semibold text-on-surface border-b border-outline-variant">${renderInline(c)}</th>`).join('')}</tr></thead>`
    const bodyHtml = `<tbody>${body.map(row => `<tr class="border-b border-outline-variant/50">${parseCells(row).map(c => `<td class="px-3 py-2 text-on-surface-variant">${renderInline(c)}</td>`).join('')}</tr>`).join('')}</tbody>`
    return `<div class="overflow-x-auto my-4"><table class="w-full text-sm border-collapse bg-surface-container rounded-lg overflow-hidden">${headerHtml}${bodyHtml}</table></div>`
  }
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
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="inline rounded my-1 max-h-64" />')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
}

'use client'

import { forwardRef, useCallback, useEffect, useRef, useState, type ForwardedRef } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import type { ChapterFigure } from '@/lib/types'
import { FigureRenderer } from './figures/FigureRenderer'
import { highlightCodeHtml } from './shiki-highlight'

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
  const parts = splitBody(body_mdx)
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
      [&_code]:bg-surface-container-high [&_code]:text-on-surface [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[0.85em] [&_code]:font-mono
      [&_pre_code]:bg-transparent [&_pre_code]:text-inherit [&_pre_code]:px-0 [&_pre_code]:py-0 [&_pre_code]:rounded-none"
    >
      {parts.map((part, i) => {
        if (part.kind === 'prose') {
          return <div key={i} dangerouslySetInnerHTML={{ __html: renderMiniMarkdown(part.text) }} />
        }
        if (part.kind === 'code') {
          return <CodeBlock key={i} code={part.content} lang={part.lang} />
        }
        const figure = figures[part.index]
        if (!figure) return null
        return <FigureRenderer key={i} figure={figure} />
      })}
    </div>
  )
})

/**
 * Fenced code block: server-shaped Shiki HTML swapped in once ready (falls
 * back to the plain <pre><code> the pane always showed, so there's no
 * layout-shift risk from an empty state), a language label, and a copy
 * button. Highlighting is async (Shiki's WASM engine) but each block only
 * fetches its own language once — the singleton highlighter caches grammars
 * across every code block in the app.
 */
function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [html, setHtml] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (lang === 'mermaid') return
    void highlightCodeHtml(code, lang).then((result) => {
      if (!cancelled) setHtml(result)
    })
    return () => { cancelled = true }
  }, [code, lang])

  if (lang === 'mermaid') {
    // Rendered as a styled pre block (could wire up mermaid.js later), not
    // syntax-highlighted code.
    return (
      <pre className="mermaid bg-surface-container rounded-lg p-4 overflow-x-auto text-xs font-mono text-on-surface-variant my-4 whitespace-pre">
        {code}
      </pre>
    )
  }

  const handleCopy = () => {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    }).catch(() => {})
  }

  return (
    <div className="relative my-4 group">
      {lang && (
        <div className="absolute left-4 top-2.5 z-10 font-mono text-[10.5px] font-semibold uppercase tracking-[0.05em] text-inverse-on-surface/50">
          {lang}
        </div>
      )}
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? 'Copied' : 'Copy code'}
        title={copied ? 'Copied' : 'Copy'}
        className="absolute right-2.5 top-2.5 z-10 inline-flex size-7 items-center justify-center rounded-md border border-white/10 bg-white/5 text-inverse-on-surface/70 opacity-0 transition-opacity group-hover:opacity-100 hover:text-inverse-on-surface"
      >
        <span className="material-symbols-outlined text-[15px]">{copied ? 'check' : 'content_copy'}</span>
      </button>
      {html ? (
        <div
          className="shiki-block rounded-lg overflow-x-auto text-sm [&_pre]:!bg-inverse-surface [&_pre]:m-0 [&_pre]:p-4 [&_pre]:pt-8 [&_pre]:whitespace-pre [&_pre]:font-mono"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="bg-inverse-surface rounded-lg p-4 pt-8 overflow-x-auto text-sm font-mono text-inverse-on-surface whitespace-pre">
          <code>{code}</code>
        </pre>
      )}
    </div>
  )
}

function assignRef<T>(ref: ForwardedRef<T>, value: T | null) {
  if (typeof ref === 'function') {
    ref(value)
    return
  }
  if (ref) {
    ref.current = value
  }
}

type BodyPart =
  | { kind: 'prose'; text: string }
  | { kind: 'figure'; index: number }
  | { kind: 'code'; lang: string; content: string }

// Splits on figure tokens AND fenced code blocks in one pass so code fences
// become real React components (CodeBlock, below) instead of raw HTML
// strings — needed for async Shiki highlighting and a working copy button,
// neither of which fit through dangerouslySetInnerHTML.
function splitBody(mdx: string): BodyPart[] {
  const parts: BodyPart[] = []
  const re = /\{\{figure:(\d+)\}\}|<!--\s*figure:(\d+)\s*-->|```(\w*)\n([\s\S]*?)```/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(mdx)) !== null) {
    if (m.index > last) parts.push({ kind: 'prose', text: mdx.slice(last, m.index) })
    if (m[4] !== undefined) {
      parts.push({ kind: 'code', lang: m[3] ?? '', content: m[4] })
    } else {
      parts.push({ kind: 'figure', index: Number(m[1] ?? m[2]) })
    }
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
  // Block math: a lone $$...$$ (own paragraph). Rendered directly — KaTeX's
  // own output is the trusted HTML here, not passed through renderInline's
  // escaping (which would mangle LaTeX's own backslashes/braces).
  const blockMath = trimmed.match(/^\$\$([\s\S]+?)\$\$$/)
  if (blockMath) return renderMath(blockMath[1], true)
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
  // Pull inline math ($...$) out before escaping — KaTeX's own output is
  // trusted HTML and would be corrupted by the &/</> escaping below (LaTeX
  // routinely contains \{, <, > in its own syntax). Spliced back in by index
  // after the rest of the inline pipeline runs on the (now math-free) text.
  // Require the $-pair to hug its contents (no leading/trailing whitespace)
  // so prose like "$50 vs $200" isn't mistaken for a LaTeX span.
  const mathSpans: string[] = []
  const withPlaceholders = text.replace(/\$(\S(?:[^$\n]*\S)?)\$/g, (_, tex: string) => {
    mathSpans.push(renderMath(tex, false))
    return ` MATH${mathSpans.length - 1} `
  })

  const rendered = withPlaceholders
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="inline rounded my-1 max-h-64" />')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')

  return rendered.replace(/ MATH(\d+) /g, (_, idx: string) => mathSpans[Number(idx)] ?? '')
}

/** KaTeX renderToString is synchronous, so math (unlike code, which needs
    Shiki's async WASM engine) stays in the existing string-based pipeline.
    Falls back to the raw source (escaped) on a malformed expression rather
    than throwing and blanking the whole chapter body. */
function renderMath(tex: string, display: boolean): string {
  try {
    return katex.renderToString(tex, { throwOnError: false, displayMode: display })
  } catch {
    const escaped = tex.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    return display ? `<pre>${escaped}</pre>` : `<code>${escaped}</code>`
  }
}

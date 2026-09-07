'use client'

import { forwardRef, useCallback, useRef, type ForwardedRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { getMdComponents, mdRehypePlugins, mdRemarkPlugins, safeMarkdownUrl } from '@/components/ui/md-shared'
import type { ChapterFigure } from '@/lib/types'
import { FigureRenderer } from './figures/FigureRenderer'

// Keep typed figures in their original order; all prose uses the shared safe
// Markdown pipeline, including GFM tables, fenced code, and mathematical notation.

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
      className="chapter-content flex-1 min-w-0"
    >
      {parts.map((part, i) => {
        if (part.kind === 'prose') {
          return <div key={i}><ReactMarkdown components={getMdComponents()} remarkPlugins={mdRemarkPlugins} rehypePlugins={mdRehypePlugins} skipHtml urlTransform={safeMarkdownUrl}>{part.text}</ReactMarkdown></div>
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

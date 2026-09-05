'use client'

import { isValidElement, useState } from 'react'

// Shared ReactMarkdown component maps for workspace content (problem
// statements, coding prompts, solution documents). Extracted from
// FlowWorkspace so the Solutions tab renders with identical typography.

export function extractNodeText(node: React.ReactNode): string {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(extractNodeText).join('')
  if (isValidElement(node)) {
    return extractNodeText((node.props as { children?: React.ReactNode }).children)
  }
  return ''
}

// Fenced code block with a hover copy button (LeetCode-style example blocks)
export function CopyablePre({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    const text = extractNodeText(children).replace(/\n$/, '')
    if (!text) return
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    }).catch(() => {})
  }
  return (
    <div style={{ position: 'relative', margin: '0 0 14px' }}>
      <pre {...props} className={`md-code-block ${props.className ?? ''}`} tabIndex={0} aria-label="Code block" style={{
        fontFamily: 'var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)',
        fontSize: 12.5,
        lineHeight: 1.55,
        background: 'var(--color-surface-container-high)',
        color: 'var(--color-on-surface)',
        padding: '12px 40px 12px 14px',
        borderRadius: 10,
        border: '1px solid var(--color-outline-variant)',
        overflow: 'auto',
        margin: 0,
        whiteSpace: 'pre',
      }}>
        {children}
      </pre>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? 'Copied' : 'Copy code'}
        title={copied ? 'Copied' : 'Copy'}
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 26,
          height: 26,
          borderRadius: 7,
          border: '1px solid var(--color-outline-variant)',
          background: 'var(--color-surface-container-low)',
          color: copied ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
          {copied ? 'check' : 'content_copy'}
        </span>
      </button>
    </div>
  )
}

export const codingMarkdownComponents = {
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 {...props} style={{ fontFamily: 'var(--font-headline)', fontSize: 16, fontWeight: 700, color: 'var(--color-on-surface)', margin: '18px 0 8px', lineHeight: 1.25 }} />
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h4 {...props} style={{ fontFamily: 'var(--font-headline)', fontSize: 15, fontWeight: 700, color: 'var(--color-on-surface)', margin: '16px 0 6px', lineHeight: 1.3 }} />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h5 {...props} style={{ fontFamily: 'var(--font-headline)', fontSize: 14, fontWeight: 700, color: 'var(--color-on-surface)', margin: '14px 0 6px', lineHeight: 1.3 }} />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p {...props} style={{ fontFamily: 'var(--font-body)', fontSize: 14.5, lineHeight: 1.72, fontWeight: 500, color: 'var(--color-on-surface)', margin: '0 0 12px' }} />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul {...props} style={{ fontFamily: 'var(--font-body)', fontSize: 14.5, lineHeight: 1.72, fontWeight: 500, color: 'var(--color-on-surface)', margin: '0 0 12px', paddingLeft: 22 }} />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol {...props} style={{ fontFamily: 'var(--font-body)', fontSize: 14.5, lineHeight: 1.72, fontWeight: 500, color: 'var(--color-on-surface)', margin: '0 0 12px', paddingLeft: 22 }} />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => (
    <li {...props} style={{ marginBottom: 4 }} />
  ),
  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <strong {...props} style={{ fontWeight: 700, color: 'var(--color-on-surface)' }} />
  ),
  em: (props: React.HTMLAttributes<HTMLElement>) => (
    <em {...props} style={{ fontStyle: 'italic' }} />
  ),
  // react-markdown v10 removed the `inline` prop, so detect a fenced block by
  // its `language-*` class (or a multi-line body) instead. Block code renders
  // plain — the surrounding CopyablePre <pre> already provides the box — while
  // inline code keeps the chip. Using `inline === false` here (the old API)
  // sent every block through the inline-chip branch, nesting a bordered chip
  // inside the <pre> and breaking code-block formatting.
  code: ({ className, children, ...props }: React.HTMLAttributes<HTMLElement> & { className?: string }) => {
    const text = typeof children === 'string'
      ? children
      : Array.isArray(children) ? children.filter((c) => typeof c === 'string').join('') : ''
    const isBlock = (typeof className === 'string' && className.includes('language-')) || text.includes('\n')
    return isBlock ? (
      <code {...props} className={className} style={{ fontFamily: 'var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)', fontSize: 12.5, background: 'transparent', color: 'inherit', padding: 0, border: 'none' }}>{children}</code>
    ) : (
      <code {...props} className={className} style={{
        fontFamily: 'var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)',
        fontSize: 12.5,
        background: 'var(--color-surface-container-high)',
        color: 'var(--color-on-surface)',
        padding: '1px 6px',
        borderRadius: 4,
        border: '1px solid var(--color-outline-variant)',
      }}>{children}</code>
    )
  },
  pre: (props: React.HTMLAttributes<HTMLPreElement>) => <CopyablePre {...props} />,
  blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote {...props} style={{
      borderLeft: '3px solid var(--color-outline-variant)',
      padding: '4px 0 4px 12px',
      margin: '0 0 12px',
      color: 'var(--color-on-surface-variant)',
      fontStyle: 'italic',
    }} />
  ),
}

// Solutions add GFM tables on top of the coding map (solution bodies use
// tables for tradeoff/complexity summaries).
export const solutionMarkdownComponents = {
  ...codingMarkdownComponents,
  table: (props: React.TableHTMLAttributes<HTMLTableElement>) => (
    <div style={{ overflowX: 'auto', margin: '0 0 14px' }}>
      <table {...props} style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13, fontFamily: 'var(--font-body)' }} />
    </div>
  ),
  th: (props: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th {...props} style={{
      textAlign: 'left',
      padding: '7px 10px',
      fontFamily: 'var(--font-label)',
      fontSize: 11.5,
      fontWeight: 800,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      color: 'var(--color-on-surface-variant)',
      borderBottom: '1.5px solid var(--color-outline-variant)',
      background: 'var(--color-surface-container-low)',
    }} />
  ),
  td: (props: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td {...props} style={{
      padding: '7px 10px',
      verticalAlign: 'top',
      lineHeight: 1.55,
      color: 'var(--color-on-surface)',
      borderBottom: '1px solid var(--color-outline-variant)',
    }} />
  ),
}

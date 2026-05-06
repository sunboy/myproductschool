'use client'

import dynamic from 'next/dynamic'
import { clsx, type ClassValue } from 'clsx'
import type { Components } from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import type { Options as RehypeSanitizeOptions } from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import { twMerge } from 'tailwind-merge'
import type { PluggableList } from 'unified'

const ReactMarkdown = dynamic(() => import('react-markdown'), { ssr: false })

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type MdVariant = 'default' | 'compact' | 'chat'
export type MdTone = 'default' | 'inherit'

const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'code',
  'pre',
  'ul',
  'ol',
  'li',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'blockquote',
  'a',
  'hr',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'del',
]

export const mdSanitizeSchema: RehypeSanitizeOptions = {
  tagNames: ALLOWED_TAGS,
  attributes: {
    a: ['href', 'title'],
    th: ['align'],
    td: ['align'],
  },
  protocols: {
    href: ['https', 'mailto'],
  },
  strip: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
}

export const mdRemarkPlugins: PluggableList = [remarkGfm]
export const mdRehypePlugins: PluggableList = [[rehypeSanitize, mdSanitizeSchema]]

const variantClass = {
  default: {
    p: 'font-body text-sm leading-relaxed text-on-surface mb-3 last:mb-0',
    h1: 'font-headline text-2xl font-bold leading-tight text-on-surface mt-4 mb-2 first:mt-0',
    h2: 'font-headline text-xl font-bold leading-tight text-on-surface mt-4 mb-2 first:mt-0',
    h3: 'font-headline text-lg font-bold leading-tight text-on-surface mt-3 mb-2 first:mt-0',
    list: 'ml-5 space-y-1 mb-3 last:mb-0',
    code: 'bg-surface-container-high px-1 rounded text-sm font-mono text-on-surface',
    pre: 'bg-surface-container-highest p-3 rounded-lg overflow-x-auto text-sm font-mono text-on-surface my-3',
    blockquote: 'border-l-4 border-outline-variant pl-3 text-on-surface-variant my-3',
    table: 'my-3 w-full border-collapse text-sm',
    cell: 'border border-outline-variant px-2 py-1 text-left align-top',
  },
  compact: {
    p: 'font-body text-sm leading-relaxed text-on-surface mb-0',
    h1: 'font-headline text-lg font-bold leading-tight text-on-surface mt-2 mb-1 first:mt-0',
    h2: 'font-headline text-base font-bold leading-tight text-on-surface mt-2 mb-1 first:mt-0',
    h3: 'font-headline text-sm font-bold leading-tight text-on-surface mt-2 mb-1 first:mt-0',
    list: 'ml-5 space-y-1 mb-1 last:mb-0',
    code: 'bg-surface-container-high px-1 rounded text-sm font-mono text-on-surface',
    pre: 'bg-surface-container-highest p-3 rounded-lg overflow-x-auto text-sm font-mono text-on-surface my-2',
    blockquote: 'border-l-4 border-outline-variant pl-3 text-on-surface-variant my-2',
    table: 'my-2 w-full border-collapse text-sm',
    cell: 'border border-outline-variant px-2 py-1 text-left align-top',
  },
  chat: {
    p: 'font-body text-xs leading-relaxed text-inherit mb-1.5 last:mb-0',
    h1: 'font-headline text-sm font-bold leading-tight text-inherit mt-2 mb-1 first:mt-0',
    h2: 'font-headline text-sm font-bold leading-tight text-inherit mt-2 mb-1 first:mt-0',
    h3: 'font-headline text-xs font-bold leading-tight text-inherit mt-1.5 mb-0.5 first:mt-0',
    list: 'ml-4 space-y-0.5 mb-1.5 last:mb-0',
    code: 'bg-surface-container-high px-1 rounded text-[11px] font-mono text-inherit',
    pre: 'bg-surface-container-highest p-2 rounded-lg overflow-x-auto text-[11px] font-mono text-on-surface my-1.5',
    blockquote: 'border-l-4 border-outline-variant pl-2 text-inherit opacity-80 my-1.5',
    table: 'my-1.5 w-full border-collapse text-[11px]',
    cell: 'border border-outline-variant px-1.5 py-1 text-left align-top',
  },
}

export function safeMarkdownUrl(value: string) {
  const trimmed = value.trim()
  if (trimmed.startsWith('/')) return trimmed

  try {
    const url = new URL(trimmed)
    if (url.protocol === 'https:' || url.protocol === 'mailto:') return trimmed
  } catch {
    return ''
  }

  return ''
}

function withoutNode<T extends { node?: unknown }>(props: T) {
  const { node, ...rest } = props
  void node
  return rest
}

export function getMdComponents(variant: MdVariant = 'default', tone: MdTone = 'default'): Components {
  const classes = variantClass[variant]
  const inheritedText = tone === 'inherit' ? 'text-inherit' : undefined

  return {
    p: ({ children, className, ...props }) => <p className={cn(classes.p, inheritedText, className)} {...withoutNode(props)}>{children}</p>,
    strong: ({ children, className, ...props }) => <strong className={cn('font-semibold', className)} {...withoutNode(props)}>{children}</strong>,
    em: ({ children, className, ...props }) => <em className={cn('italic', className)} {...withoutNode(props)}>{children}</em>,
    del: ({ children, className, ...props }) => <del className={cn('line-through', className)} {...withoutNode(props)}>{children}</del>,
    ul: ({ children, className, ...props }) => <ul className={cn('list-disc list-outside', classes.list, className)} {...withoutNode(props)}>{children}</ul>,
    ol: ({ children, className, ...props }) => <ol className={cn('list-decimal list-outside', classes.list, className)} {...withoutNode(props)}>{children}</ol>,
    li: ({ children, className, ...props }) => <li className={cn('pl-0.5', className)} {...withoutNode(props)}>{children}</li>,
    a: ({ children, href, className, ...props }) => {
      const rest = withoutNode(props)
      if (!href) return <span className={className}>{children}</span>
      const external = href.startsWith('https://')
      return (
        <a
          className={cn('text-primary underline hover:text-primary/80', className)}
          href={href}
          target={external ? '_blank' : undefined}
          rel={external ? 'noopener noreferrer' : undefined}
          {...rest}
        >
          {children}
        </a>
      )
    },
    h1: ({ children, className, ...props }) => <h1 className={cn(classes.h1, inheritedText, className)} {...withoutNode(props)}>{children}</h1>,
    h2: ({ children, className, ...props }) => <h2 className={cn(classes.h2, inheritedText, className)} {...withoutNode(props)}>{children}</h2>,
    h3: ({ children, className, ...props }) => <h3 className={cn(classes.h3, inheritedText, className)} {...withoutNode(props)}>{children}</h3>,
    h4: ({ children, className, ...props }) => <h4 className={cn(classes.h3, inheritedText, className)} {...withoutNode(props)}>{children}</h4>,
    h5: ({ children, className, ...props }) => <h5 className={cn(classes.h3, inheritedText, className)} {...withoutNode(props)}>{children}</h5>,
    h6: ({ children, className, ...props }) => <h6 className={cn(classes.h3, inheritedText, className)} {...withoutNode(props)}>{children}</h6>,
    code: ({ children, className, ...props }) => <code className={cn(classes.code, className)} {...withoutNode(props)}>{children}</code>,
    pre: ({ children, className, ...props }) => <pre className={cn(classes.pre, className)} {...withoutNode(props)}>{children}</pre>,
    blockquote: ({ children, className, ...props }) => <blockquote className={cn(classes.blockquote, className)} {...withoutNode(props)}>{children}</blockquote>,
    hr: ({ className, ...props }) => <hr className={cn('my-3 border-outline-variant', className)} {...withoutNode(props)} />,
    table: ({ children, className, ...props }) => <table className={cn(classes.table, className)} {...withoutNode(props)}>{children}</table>,
    th: ({ children, className, ...props }) => <th className={cn(classes.cell, 'font-bold bg-surface-container-high', className)} {...withoutNode(props)}>{children}</th>,
    td: ({ children, className, ...props }) => <td className={cn(classes.cell, className)} {...withoutNode(props)}>{children}</td>,
  }
}

interface MdProps {
  children: string
  className?: string
  tone?: MdTone
  variant?: MdVariant
}

export function Md({ children, className, tone = 'default', variant = 'default' }: MdProps) {
  if (!children) return null
  return (
    <span className={cn('contents', className)}>
      <ReactMarkdown
        components={getMdComponents(variant, tone)}
        rehypePlugins={mdRehypePlugins}
        remarkPlugins={mdRemarkPlugins}
        skipHtml
        urlTransform={safeMarkdownUrl}
      >
        {children}
      </ReactMarkdown>
    </span>
  )
}

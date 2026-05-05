'use client'

import dynamic from 'next/dynamic'
import type { Components } from 'react-markdown'

const ReactMarkdown = dynamic(() => import('react-markdown'), { ssr: false })

const components: Components = {
  p: ({ children, ...props }) => <p className="mb-1 last:mb-0" {...props}>{children}</p>,
  strong: ({ children, ...props }) => <strong className="font-semibold" {...props}>{children}</strong>,
  em: ({ children, ...props }) => <em className="italic" {...props}>{children}</em>,
  ul: ({ children, ...props }) => <ul className="list-disc list-outside pl-4 space-y-0.5 mb-1" {...props}>{children}</ul>,
  ol: ({ children, ...props }) => <ol className="list-decimal list-outside pl-4 space-y-0.5 mb-1" {...props}>{children}</ol>,
  li: ({ children, ...props }) => <li {...props}>{children}</li>,
  a: ({ children, ...props }) => <a className="underline underline-offset-2 hover:opacity-70" target="_blank" rel="noopener noreferrer" {...props}>{children}</a>,
  h1: ({ children, ...props }) => <h3 className="font-headline font-semibold text-base mt-2 mb-1" {...props}>{children}</h3>,
  h2: ({ children, ...props }) => <h4 className="font-headline font-semibold text-sm mt-2 mb-1" {...props}>{children}</h4>,
  h3: ({ children, ...props }) => <h5 className="font-semibold text-sm mt-1.5 mb-0.5" {...props}>{children}</h5>,
  code: ({ children, ...props }) => <code className="font-mono text-xs bg-black/10 rounded px-1" {...props}>{children}</code>,
  pre: ({ children, ...props }) => <pre className="font-mono text-xs bg-black/10 rounded p-2 overflow-x-auto my-1" {...props}>{children}</pre>,
}

export function Md({ children, className }: { children: string; className?: string }) {
  if (!children) return null
  return (
    <span className={`contents ${className ?? ''}`}>
      <ReactMarkdown components={components}>{children}</ReactMarkdown>
    </span>
  )
}

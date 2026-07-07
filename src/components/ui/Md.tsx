'use client'

import dynamic from 'next/dynamic'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import {
  getMdComponents,
  mdRehypePlugins,
  mdRemarkPlugins,
  safeMarkdownUrl,
  type MdTone,
  type MdVariant,
} from '@/components/ui/md-shared'

// Re-export the shared building blocks so existing client-side imports from
// '@/components/ui/Md' keep working. Server components must import from
// '@/components/ui/md-shared' directly (importing from this file marks the
// functions as client references).
export * from '@/components/ui/md-shared'

const ReactMarkdown = dynamic(() => import('react-markdown'), { ssr: false })

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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

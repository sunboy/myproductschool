import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import type { Options as RehypeSanitizeOptions } from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import type { PluggableList } from 'unified'
import { getMdComponents, mdSanitizeSchema, safeMarkdownUrl } from '@/components/ui/md-shared'

// Server-rendered markdown body for long-form blog posts. Md.tsx is
// client-only ('use client', dynamic-imports react-markdown) and its
// sanitize schema strips images — both wrong for editorial content, which
// needs to render at build/ISR time and needs hero/inline images. This
// component statically imports the same markdown stack so it renders on
// the server with no client JS shipped for the body itself, and extends
// the shared sanitize schema with the tags a blog post actually needs.

const BLOG_ALLOWED_TAGS = [...(mdSanitizeSchema.tagNames ?? []), 'img', 'figure', 'figcaption']

const blogSanitizeSchema: RehypeSanitizeOptions = {
  ...mdSanitizeSchema,
  tagNames: BLOG_ALLOWED_TAGS,
  attributes: {
    ...mdSanitizeSchema.attributes,
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
  },
}

const blogRemarkPlugins: PluggableList = [remarkGfm]
const blogRehypePlugins: PluggableList = [[rehypeSanitize, blogSanitizeSchema]]

interface BlogBodyProps {
  markdown: string
  className?: string
}

export function BlogBody({ markdown, className }: BlogBodyProps) {
  if (!markdown) return null

  const baseComponents = getMdComponents('default')

  return (
    <div className={className ?? 'max-w-2xl'}>
      <ReactMarkdown
        components={{
          ...baseComponents,
          img: ({ src, alt, title, width, height }) => {
            if (typeof src !== 'string') return null
            const safeSrc = safeMarkdownUrl(src)
            if (!safeSrc) return null
            return (
              // eslint-disable-next-line @next/next/no-img-element -- post-authored
              // image URLs are not known ahead of time, so next/image's
              // remotePatterns allowlist can't cover them. A plain <img> keeps
              // arbitrary https sources working without widening the app's
              // image proxy allowlist.
              <img
                src={safeSrc}
                alt={alt ?? ''}
                title={title}
                width={width}
                height={height}
                loading="lazy"
                className="my-6 w-full rounded-lg border border-outline-variant"
              />
            )
          },
          figure: ({ children }) => (
            <figure className="my-6">{children}</figure>
          ),
          figcaption: ({ children }) => (
            <figcaption className="mt-2 text-center font-label text-sm text-on-surface-variant">
              {children}
            </figcaption>
          ),
          pre: ({ children }) => (
            <pre className="my-4 overflow-x-auto rounded-lg bg-surface-container-highest p-4 font-mono text-sm leading-relaxed text-on-surface">
              {children}
            </pre>
          ),
          code: ({ children, className: codeClassName }) => {
            // Fenced code blocks carry a `language-*` className from remark;
            // inline `code` spans do not. Style them differently so a fenced
            // block reads as a block and an inline span reads as a pill.
            const isFenced = typeof codeClassName === 'string' && codeClassName.startsWith('language-')
            if (isFenced) {
              return <code className={codeClassName}>{children}</code>
            }
            return (
              <code className="rounded bg-surface-container-high px-1.5 py-0.5 font-mono text-sm text-on-surface">
                {children}
              </code>
            )
          },
        }}
        rehypePlugins={blogRehypePlugins}
        remarkPlugins={blogRemarkPlugins}
        skipHtml
        urlTransform={safeMarkdownUrl}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  )
}

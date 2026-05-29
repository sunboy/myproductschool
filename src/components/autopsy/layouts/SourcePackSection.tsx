'use client'

import React from 'react'
import Link from 'next/link'
import type { StorySection } from '@/lib/types'

interface Props {
  section: Extract<StorySection, { layout: 'source_pack' }>
  isVisible: boolean
  hasBeenVisible: boolean
}

export function SourcePackSection({ section, hasBeenVisible }: Props) {
  const { label, title, summary, sources, correctionSubject } = section.content
  const [entered, setEntered] = React.useState(hasBeenVisible)

  React.useEffect(() => {
    if (hasBeenVisible) {
      const t = setTimeout(() => setEntered(true), 60)
      return () => clearTimeout(t)
    }
  }, [hasBeenVisible])

  return (
    <div className="relative overflow-hidden bg-background px-6 py-12 md:px-16 md:py-16">
      <div className="mb-6 max-w-4xl">
        <span className="font-label text-xs font-bold uppercase tracking-[0.24em] text-primary">
          {label}
        </span>
        <h2
          className="mt-3 font-headline font-extrabold leading-tight text-on-surface"
          style={{ fontSize: 'clamp(30px, 4vw, 58px)' }}
        >
          {title}
        </h2>
        <p className="mt-4 max-w-3xl font-body text-sm leading-7 text-on-surface-variant md:text-base">
          {summary}
        </p>
      </div>

      <details className="rounded-[22px] border border-outline-variant/50 bg-surface-container-low p-4 md:p-6">
        <summary className="cursor-pointer font-label text-sm font-bold text-primary">
          Source drawer
        </summary>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {sources.map((source, index) => (
            <article
              key={source.id}
              className="rounded-[18px] border border-outline-variant/35 bg-background p-4"
              style={{
                opacity: entered ? 1 : 0,
                transform: entered ? 'none' : 'translateY(10px)',
                transition: 'opacity 0.5s ease, transform 0.5s ease',
                transitionDelay: `${index * 45}ms`,
              }}
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="font-label text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                  {source.id}
                </span>
                <span className="rounded-full bg-primary-fixed px-2 py-0.5 text-[10px] font-label font-bold text-primary">
                  Tier {source.tier}
                </span>
              </div>
              <h3 className="font-headline text-base font-bold leading-tight text-on-surface">
                {source.title}
              </h3>
              <p className="mt-1 font-label text-xs text-on-surface-variant">
                {source.publisher}
              </p>
              <p className="mt-3 font-body text-sm leading-6 text-on-surface-variant">
                {source.supports}
              </p>
              <Link href={source.url} className="mt-4 inline-flex text-xs font-label font-bold text-primary">
                Open source
              </Link>
            </article>
          ))}
        </div>
      </details>

      <Link
        href={`mailto:corrections@hackproduct.dev?subject=${encodeURIComponent(correctionSubject)}`}
        className="mt-5 inline-flex items-center gap-2 rounded-full border border-outline-variant px-4 py-2 text-xs font-label font-bold text-primary no-underline hover:bg-primary-fixed"
      >
        Send a correction
        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
      </Link>
    </div>
  )
}

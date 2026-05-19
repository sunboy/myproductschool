'use client'

import React from 'react'
import type { StorySection } from '@/lib/types'

interface Props {
  section: Extract<StorySection, { layout: 'evidence_ledger' }>
  isVisible: boolean
  hasBeenVisible: boolean
}

export function EvidenceLedgerSection({ section, hasBeenVisible }: Props) {
  const { label, title, summary, rows } = section.content
  const [entered, setEntered] = React.useState(hasBeenVisible)

  React.useEffect(() => {
    if (hasBeenVisible) {
      const t = setTimeout(() => setEntered(true), 60)
      return () => clearTimeout(t)
    }
  }, [hasBeenVisible])

  return (
    <div className="relative overflow-hidden bg-primary px-6 py-16 text-on-primary md:px-16 md:py-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(255,255,255,0.14),transparent_45%)]" aria-hidden />
      <div className="relative z-10">
        <span className="font-label text-xs font-bold uppercase tracking-[0.24em] text-white/70">
          {label}
        </span>
        <h2
          className="mt-3 max-w-4xl font-headline font-extrabold leading-tight text-white"
          style={{ fontSize: 'clamp(30px, 4vw, 58px)' }}
        >
          {title}
        </h2>
        <p className="mt-4 max-w-3xl font-body text-sm leading-7 text-white/72 md:text-base">
          {summary}
        </p>
        <div className="mt-8 grid gap-3 md:grid-cols-2">
          {rows.map((row, index) => (
            <div
              key={row.label}
              className="rounded-[18px] border border-white/14 bg-white/8 p-4"
              style={{
                opacity: entered ? 1 : 0,
                transform: entered ? 'none' : 'translateY(12px)',
                transition: 'opacity 0.55s ease, transform 0.55s ease',
                transitionDelay: `${index * 70}ms`,
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-label text-[10px] font-bold uppercase tracking-[0.16em] text-white/62">
                    {row.label}
                  </p>
                  <p className="mt-1 font-headline text-2xl font-extrabold text-white">
                    {row.value}
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-[10px] font-label font-bold uppercase tracking-[0.08em] text-primary">
                  {row.confidence}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {row.sourceIds.map(sourceId => (
                  <span key={sourceId} className="rounded-full border border-white/18 px-2 py-1 text-[10px] font-label font-bold text-white/68">
                    {sourceId}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

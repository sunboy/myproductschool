'use client'
import React from 'react'
import type { StorySection } from '@/lib/types'

interface Props {
  section: Extract<StorySection, { layout: 'timeline' }>
  isVisible: boolean
  hasBeenVisible: boolean
}

const EVENT_COLORS: Record<string, string> = {
  milestone: '#4a7c59',
  launch: '#78a886',
  pivot: '#b83230',
}

const EVENT_BG: Record<string, string> = {
  milestone: 'rgba(74,124,89,0.08)',
  launch: 'rgba(120,168,134,0.10)',
  pivot: 'rgba(184,50,48,0.08)',
}

export function TimelineSection({ section, hasBeenVisible }: Props) {
  const { title, events } = section.content
  const [entered, setEntered] = React.useState(hasBeenVisible)

  React.useEffect(() => {
    if (hasBeenVisible) {
      const t = setTimeout(() => setEntered(true), 60)
      return () => clearTimeout(t)
    }
  }, [hasBeenVisible])

  return (
    <div className="relative overflow-hidden bg-[#faf6f0] px-6 py-12 md:px-16 md:py-16">
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            'linear-gradient(90deg, rgba(74,124,89,0.08) 1px, transparent 1px), linear-gradient(rgba(74,124,89,0.07) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
        aria-hidden
      />
      <div className="relative z-10 mx-auto max-w-7xl">
        <div
          className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
          style={{
            opacity: entered ? 1 : 0,
            transform: entered ? 'none' : 'translateY(16px)',
            transition: 'opacity 0.6s ease, transform 0.6s ease',
          }}
        >
          <div>
            <span
              className="mb-3 block font-label text-xs font-bold uppercase tracking-[0.25em]"
              style={{ color: 'rgba(74,124,89,0.7)' }}
            >
              Timeline
            </span>
            <h2
              className="max-w-3xl font-headline font-extrabold leading-tight"
              style={{ fontSize: 'clamp(28px, 4vw, 54px)', letterSpacing: '-0.02em', color: '#2e3230' } as React.CSSProperties}
            >
              {title}
            </h2>
          </div>
          <span className="w-fit rounded-full border border-[#4a7c59]/25 bg-white/70 px-3 py-1 text-[10px] font-label font-black uppercase tracking-[0.16em] text-[#4a7c59]">
            {events.length} public beats
          </span>
        </div>

        <div className="relative">
          <div
            className="pointer-events-none absolute left-0 right-0 top-[38px] hidden h-px md:block"
            style={{
              background:
                'linear-gradient(90deg, rgba(74,124,89,0.10), rgba(74,124,89,0.45), rgba(74,124,89,0.10))',
              opacity: entered ? 1 : 0,
              transition: 'opacity 0.8s ease',
              transitionDelay: '200ms',
            }}
            aria-hidden
          />

          <div className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 md:mx-0 md:px-0">
            {events.map((event, i) => {
              const color = EVENT_COLORS[event.type] ?? '#4a7c59'
              const bg = EVENT_BG[event.type] ?? 'rgba(74,124,89,0.06)'

              return (
                <article
                  key={i}
                  className="relative min-w-[280px] snap-center rounded-lg border bg-white/86 p-5 shadow-[0_14px_35px_rgba(42,48,39,0.08)] md:min-w-[260px] md:flex-1"
                  style={{
                    borderColor: `${color}33`,
                    opacity: entered ? 1 : 0,
                    transform: entered ? 'none' : 'translateY(14px)',
                    transition: 'opacity 0.55s ease, transform 0.55s ease',
                    transitionDelay: `${220 + i * 90}ms`,
                  }}
                >
                  <div
                    className="absolute left-5 top-[-7px] h-3.5 w-3.5 rounded-full border-2 border-[#faf6f0]"
                    style={{
                      backgroundColor: color,
                      boxShadow: `0 0 0 7px ${bg}`,
                    }}
                    aria-hidden
                  />
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <span
                      className="font-headline text-4xl font-extrabold leading-none"
                      style={{ color }}
                    >
                      {event.date}
                    </span>
                    <span
                      className="rounded-full px-2.5 py-1 text-[10px] font-label font-black uppercase tracking-[0.14em]"
                      style={{
                        backgroundColor: bg,
                        color,
                        border: `1px solid ${color}30`,
                      }}
                    >
                      {event.type}
                    </span>
                  </div>
                  <p
                    className="mb-2 font-headline text-xl font-extrabold leading-tight"
                    style={{ color: '#2e3230' } as React.CSSProperties}
                  >
                    {event.label}
                  </p>
                  <p className="font-body text-sm leading-6 text-[#4a4e4a]">
                    {event.description}
                  </p>
                </article>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

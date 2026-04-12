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
  const [entered, setEntered] = React.useState(false)

  React.useEffect(() => {
    if (hasBeenVisible) {
      const t = setTimeout(() => setEntered(true), 60)
      return () => clearTimeout(t)
    }
  }, [hasBeenVisible])

  return (
    <div
      className="relative overflow-hidden"
      style={{ background: '#faf6f0', minHeight: 'min(90vh, 800px)' }}
    >
      <div className="relative z-10 px-10 py-16 md:px-16 md:py-24">
        {/* Section header */}
        <div
          className="mb-16"
          style={{
            opacity: entered ? 1 : 0,
            transform: entered ? 'none' : 'translateY(16px)',
            transition: 'opacity 0.6s ease, transform 0.6s ease',
          }}
        >
          <span
            className="font-label text-xs font-bold uppercase tracking-[0.25em] block mb-3"
            style={{ color: 'rgba(74,124,89,0.7)' }}
          >
            Timeline
          </span>
          <h2
            className="font-headline font-extrabold"
            style={{ fontSize: 'clamp(26px, 3.5vw, 48px)', letterSpacing: '-0.02em', color: '#2e3230' } as React.CSSProperties}
          >
            {title}
          </h2>
        </div>

        {/* Vertical timeline */}
        <div className="relative">
          {/* Track line */}
          <div
            className="absolute pointer-events-none"
            style={{
              left: 0,
              top: 12,
              bottom: 12,
              width: 1,
              background: 'linear-gradient(to bottom, transparent, rgba(74,124,89,0.25) 10%, rgba(74,124,89,0.25) 90%, transparent)',
              opacity: entered ? 1 : 0,
              transition: 'opacity 0.8s ease',
              transitionDelay: '200ms',
            }}
            aria-hidden
          />

          <div className="flex flex-col gap-0 pl-8">
            {events.map((event, i) => {
              const color = EVENT_COLORS[event.type] ?? '#4a7c59'
              const bg = EVENT_BG[event.type] ?? 'rgba(74,124,89,0.06)'
              const isLast = i === events.length - 1

              return (
                <div
                  key={i}
                  className="relative"
                  style={{ paddingBottom: isLast ? 0 : 40 }}
                >
                  {/* Timeline dot */}
                  <div
                    className="absolute"
                    style={{
                      left: -8 - 8,
                      top: 4,
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      backgroundColor: color,
                      boxShadow: `0 0 8px 2px ${bg}`,
                      opacity: entered ? 1 : 0,
                      transform: entered ? 'none' : 'scale(0.5)',
                      transition: 'opacity 0.4s ease, transform 0.4s ease',
                      transitionDelay: `${300 + i * 100}ms`,
                      border: '2px solid rgba(255,255,255,0.6)',
                    }}
                  />

                  {/* Event content */}
                  <div
                    style={{
                      opacity: entered ? 1 : 0,
                      transform: entered ? 'none' : 'translateX(-12px)',
                      transition: 'opacity 0.6s ease, transform 0.6s ease',
                      transitionDelay: `${350 + i * 100}ms`,
                    }}
                  >
                    <div className="flex items-center gap-3 mb-1.5">
                      <span
                        className="font-label text-[11px] font-bold uppercase tracking-[0.15em]"
                        style={{ color }}
                      >
                        {event.date}
                      </span>
                      <span
                        className="font-label text-[10px] uppercase tracking-wider px-2 py-0.5 rounded"
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
                      className="font-headline font-bold mb-2"
                      style={{ fontSize: 'clamp(16px, 1.4vw, 22px)', letterSpacing: '-0.01em', color: '#2e3230' } as React.CSSProperties}
                    >
                      {event.label}
                    </p>
                    <p
                      className="font-body leading-relaxed"
                      style={{ fontSize: 14, color: '#4a4e4a', maxWidth: '52ch' }}
                    >
                      {event.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

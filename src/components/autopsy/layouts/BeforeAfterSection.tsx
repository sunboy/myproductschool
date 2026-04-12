'use client'
import React from 'react'
import type { StorySection } from '@/lib/types'

interface Props {
  section: Extract<StorySection, { layout: 'before_after' }>
  isVisible: boolean
  hasBeenVisible: boolean
}

export function BeforeAfterSection({ section, hasBeenVisible }: Props) {
  const { title, before, after } = section.content
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
      style={{ minHeight: 'min(80vh, 700px)', background: '#faf6f0' }}
    >
      <div className="relative z-10 flex flex-col justify-center h-full px-8 py-16 md:px-16 md:py-24 gap-12">
        {/* Title */}
        <div
          style={{
            opacity: entered ? 1 : 0,
            transform: entered ? 'none' : 'translateY(16px)',
            transition: 'opacity 0.7s ease, transform 0.7s ease',
          }}
        >
          <h2
            className="font-headline font-extrabold"
            style={{ fontSize: 'clamp(26px, 3.5vw, 48px)', letterSpacing: '-0.02em', maxWidth: '20ch', color: '#2e3230' } as React.CSSProperties}
          >
            {title}
          </h2>
        </div>

        {/* Two panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Before */}
          <div
            className="relative overflow-hidden"
            style={{
              opacity: entered ? 1 : 0,
              transform: entered ? 'none' : 'translateX(-20px)',
              transition: 'opacity 0.7s ease, transform 0.7s ease',
              transitionDelay: '120ms',
            }}
          >
            {/* Top accent line — error red */}
            <div className="h-px w-full mb-6" style={{ backgroundColor: 'rgba(184,50,48,0.4)' }} />

            <div className="pr-8 md:pr-12">
              <p
                className="font-label text-xs font-bold uppercase tracking-[0.25em] mb-6"
                style={{ color: 'rgba(184,50,48,0.75)' }}
              >
                {before.label}
              </p>
              <ul className="space-y-4">
                {before.items.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3"
                    style={{
                      opacity: entered ? 1 : 0,
                      transform: entered ? 'none' : 'translateX(-8px)',
                      transition: 'opacity 0.5s ease, transform 0.5s ease',
                      transitionDelay: `${200 + i * 60}ms`,
                    }}
                  >
                    <span
                      className="shrink-0"
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        backgroundColor: 'rgba(184,50,48,0.5)',
                        marginTop: 8,
                      }}
                    />
                    <span className="font-body text-sm leading-relaxed" style={{ color: 'rgba(74,78,74,0.7)' }}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
              {before.summary && (
                <p
                  className="mt-6 font-body text-xs italic leading-relaxed"
                  style={{ color: 'rgba(74,78,74,0.5)' }}
                >
                  {before.summary}
                </p>
              )}
            </div>
          </div>

          {/* Divider (desktop: vertical line) */}
          <div
            className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, transparent, rgba(74,124,89,0.15) 20%, rgba(74,124,89,0.15) 80%, transparent)' }}
            aria-hidden
          />

          {/* After */}
          <div
            className="relative overflow-hidden mt-10 md:mt-0"
            style={{
              opacity: entered ? 1 : 0,
              transform: entered ? 'none' : 'translateX(20px)',
              transition: 'opacity 0.7s ease, transform 0.7s ease',
              transitionDelay: '180ms',
            }}
          >
            {/* Top accent line — green */}
            <div className="h-px w-full mb-6" style={{ backgroundColor: 'rgba(74,124,89,0.5)' }} />

            <div className="md:pl-12">
              <p
                className="font-label text-xs font-bold uppercase tracking-[0.25em] mb-6"
                style={{ color: '#4a7c59' }}
              >
                {after.label}
              </p>
              <ul className="space-y-4">
                {after.items.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3"
                    style={{
                      opacity: entered ? 1 : 0,
                      transform: entered ? 'none' : 'translateX(8px)',
                      transition: 'opacity 0.5s ease, transform 0.5s ease',
                      transitionDelay: `${260 + i * 60}ms`,
                    }}
                  >
                    <span
                      className="shrink-0"
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        backgroundColor: 'rgba(74,124,89,0.7)',
                        marginTop: 8,
                      }}
                    />
                    <span className="font-body text-sm leading-relaxed" style={{ color: '#4a4e4a' }}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
              {after.summary && (
                <p
                  className="mt-6 font-body text-xs italic leading-relaxed"
                  style={{ color: 'rgba(74,78,74,0.5)' }}
                >
                  {after.summary}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

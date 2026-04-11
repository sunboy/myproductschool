'use client'
import React from 'react'
import type { StorySection } from '@/lib/types'

interface Props {
  section: Extract<StorySection, { layout: 'quote' }>
  isVisible: boolean
  hasBeenVisible: boolean
}

export function QuoteSection({ section, hasBeenVisible }: Props) {
  const { quote, attribution, context } = section.content
  const [entered, setEntered] = React.useState(false)

  React.useEffect(() => {
    if (hasBeenVisible) {
      const t = setTimeout(() => setEntered(true), 60)
      return () => clearTimeout(t)
    }
  }, [hasBeenVisible])

  return (
    <div
      className="relative flex flex-col justify-center overflow-hidden"
      style={{ minHeight: 'min(70vh, 560px)', background: '#0c1810' }}
    >
      {/* Grain */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
          mixBlendMode: 'overlay',
        }}
        aria-hidden
      />

      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-px pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, rgba(74,124,89,0.6) 30%, rgba(74,124,89,0.6) 70%, transparent)' }}
        aria-hidden
      />

      {/* Content */}
      <div className="relative z-10 px-12 py-20 md:px-24 max-w-4xl">
        {/* Opening mark */}
        <div
          style={{
            opacity: entered ? 1 : 0,
            transform: entered ? 'none' : 'translateX(-8px)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
          }}
        >
          <span
            className="font-headline font-extrabold leading-none select-none block mb-4"
            style={{ fontSize: 'clamp(60px, 8vw, 120px)', color: 'rgba(74,124,89,0.25)', lineHeight: 0.8 }}
          >
            &ldquo;
          </span>
        </div>

        {/* Quote text */}
        <blockquote
          className="font-headline text-white leading-[1.2]"
          style={{
            fontSize: 'clamp(22px, 3vw, 42px)',
            letterSpacing: '-0.01em',
            opacity: entered ? 1 : 0,
            transform: entered ? 'none' : 'translateY(20px)',
            transition: 'opacity 0.8s ease, transform 0.8s ease',
            transitionDelay: '100ms',
          } as React.CSSProperties}
        >
          {quote}
        </blockquote>

        {/* Attribution */}
        <div
          className="mt-8 flex items-center gap-4"
          style={{
            opacity: entered ? 1 : 0,
            transform: entered ? 'none' : 'translateY(10px)',
            transition: 'opacity 0.6s ease, transform 0.6s ease',
            transitionDelay: '250ms',
          }}
        >
          <div className="h-px w-8" style={{ backgroundColor: 'rgba(74,124,89,0.5)' }} />
          <div>
            <p className="font-label font-bold text-sm" style={{ color: '#8ecf9e' }}>
              {attribution}
            </p>
            {context && (
              <p className="font-label text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {context}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

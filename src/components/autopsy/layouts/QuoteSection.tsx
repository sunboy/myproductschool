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
      style={{ minHeight: 'min(70vh, 560px)', background: '#f5f1ea' }}
    >
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, rgba(74,124,89,0.5) 30%, rgba(74,124,89,0.5) 70%, transparent)' }}
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
            style={{ fontSize: 'clamp(60px, 8vw, 120px)', color: 'rgba(74,124,89,0.2)', lineHeight: 0.8 }}
          >
            &ldquo;
          </span>
        </div>

        {/* Quote text */}
        <blockquote
          className="font-headline leading-[1.2]"
          style={{
            fontSize: 'clamp(22px, 3vw, 42px)',
            letterSpacing: '-0.01em',
            color: '#2e3230',
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
          <div className="h-px w-8" style={{ backgroundColor: 'rgba(74,124,89,0.4)' }} />
          <div>
            <p className="font-label font-bold text-sm" style={{ color: '#4a7c59' }}>
              {attribution}
            </p>
            {context && (
              <p className="font-label text-xs mt-0.5" style={{ color: 'rgba(74,78,74,0.5)' }}>
                {context}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

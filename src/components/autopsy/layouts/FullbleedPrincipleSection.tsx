'use client'
import React from 'react'
import type { StorySection } from '@/lib/types'

interface Props {
  section: Extract<StorySection, { layout: 'fullbleed_principle' }>
  isVisible: boolean
  hasBeenVisible: boolean
}

export function FullbleedPrincipleSection({ section, hasBeenVisible }: Props) {
  const { principle, attribution } = section.content
  const [entered, setEntered] = React.useState(false)

  const words = principle.split(' ')

  React.useEffect(() => {
    if (hasBeenVisible) {
      const t = setTimeout(() => setEntered(true), 60)
      return () => clearTimeout(t)
    }
  }, [hasBeenVisible])

  return (
    <div
      className="relative flex flex-col justify-center overflow-hidden"
      style={{
        minHeight: 'min(85vh, 700px)',
        background: '#f0ece4',
      }}
    >
      {/* Ambient bottom glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: '-10%',
          left: '10%',
          right: '10%',
          height: '50%',
          background: 'radial-gradient(ellipse, rgba(74,124,89,0.06) 0%, transparent 70%)',
        }}
        aria-hidden
      />

      {/* Large decorative "P" backdrop */}
      <div
        className="absolute inset-0 flex items-center justify-end pr-8 pointer-events-none select-none overflow-hidden"
        aria-hidden
      >
        <span
          className="font-headline font-extrabold"
          style={{ fontSize: 'clamp(200px, 35vw, 400px)', lineHeight: 1, color: 'rgba(46,50,48,0.04)' }}
        >
          P
        </span>
      </div>

      <div className="relative z-10 px-10 py-20 md:px-20 md:py-28 max-w-5xl">
        {/* Label */}
        <div
          style={{
            opacity: entered ? 1 : 0,
            transition: 'opacity 0.5s ease',
          }}
        >
          <span
            className="font-label text-xs font-bold uppercase tracking-[0.3em]"
            style={{ color: 'rgba(74,124,89,0.7)' }}
          >
            Design principle
          </span>
        </div>

        {/* Principle — word stagger */}
        <div className="mt-6 mb-8">
          <p
            className="font-headline font-extrabold leading-[1.1]"
            style={{ fontSize: 'clamp(28px, 4vw, 60px)', letterSpacing: '-0.02em', color: '#2e3230' } as React.CSSProperties}
          >
            {words.map((word, i) => (
              <span
                key={i}
                className="inline-block mr-[0.2em]"
                style={{
                  opacity: entered ? 1 : 0,
                  transform: entered ? 'none' : 'translateY(20px)',
                  transition: 'opacity 0.6s ease, transform 0.6s ease',
                  transitionDelay: `${80 + i * 35}ms`,
                }}
              >
                {word}
              </span>
            ))}
          </p>
        </div>

        {/* Attribution */}
        <div
          className="flex items-center gap-4"
          style={{
            opacity: entered ? 1 : 0,
            transform: entered ? 'none' : 'translateY(8px)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
            transitionDelay: `${80 + words.length * 35 + 100}ms`,
          }}
        >
          <div className="h-px w-8" style={{ backgroundColor: 'rgba(74,124,89,0.4)' }} />
          <span
            className="font-label text-xs uppercase tracking-[0.2em]"
            style={{ color: 'rgba(74,78,74,0.5)' }}
          >
            {attribution}
          </span>
        </div>
      </div>
    </div>
  )
}

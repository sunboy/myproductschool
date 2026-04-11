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

  // Split into words for stagger
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
        background: 'linear-gradient(160deg, #0a1510 0%, #0f1a14 40%, #091210 100%)',
      }}
    >
      {/* Grain */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
          mixBlendMode: 'overlay',
        }}
        aria-hidden
      />

      {/* Ambient bottom glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: '-10%',
          left: '10%',
          right: '10%',
          height: '50%',
          background: 'radial-gradient(ellipse, rgba(74,124,89,0.12) 0%, transparent 70%)',
        }}
        aria-hidden
      />

      {/* Large decorative "P" backdrop */}
      <div
        className="absolute inset-0 flex items-center justify-end pr-8 pointer-events-none select-none overflow-hidden"
        aria-hidden
      >
        <span
          className="font-headline font-extrabold text-white/[0.025]"
          style={{ fontSize: 'clamp(200px, 35vw, 400px)', lineHeight: 1 }}
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
            style={{ color: 'rgba(142,207,158,0.6)' }}
          >
            Design principle
          </span>
        </div>

        {/* Principle — word stagger */}
        <div className="mt-6 mb-8">
          <p
            className="font-headline font-extrabold text-white leading-[1.1]"
            style={{ fontSize: 'clamp(28px, 4vw, 60px)', letterSpacing: '-0.02em' } as React.CSSProperties}
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
          <div className="h-px w-8" style={{ backgroundColor: 'rgba(74,124,89,0.5)' }} />
          <span
            className="font-label text-xs uppercase tracking-[0.2em]"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            {attribution}
          </span>
        </div>
      </div>
    </div>
  )
}

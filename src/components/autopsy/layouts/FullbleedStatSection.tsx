'use client'
import React from 'react'
import type { StorySection } from '@/lib/types'

interface Props {
  section: Extract<StorySection, { layout: 'fullbleed_stat' }>
  isVisible: boolean
  hasBeenVisible: boolean
}

export function FullbleedStatSection({ section, hasBeenVisible }: Props) {
  const { stat, context, source } = section.content
  const [entered, setEntered] = React.useState(false)

  React.useEffect(() => {
    if (hasBeenVisible) {
      const t = setTimeout(() => setEntered(true), 60)
      return () => clearTimeout(t)
    }
  }, [hasBeenVisible])

  return (
    <div
      className="relative flex flex-col items-center justify-center text-center overflow-hidden"
      style={{ minHeight: 'min(90vh, 700px)', background: '#080f0b' }}
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

      {/* Radial glow behind the number */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '80vw',
          height: '80vw',
          background: 'radial-gradient(circle, rgba(74,124,89,0.15) 0%, transparent 60%)',
          borderRadius: '50%',
        }}
        aria-hidden
      />

      {/* Ghost large number backdrop */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        aria-hidden
      >
        <span
          className="font-headline font-extrabold text-white/[0.025]"
          style={{ fontSize: 'clamp(200px, 40vw, 480px)', lineHeight: 1 }}
        >
          {stat}
        </span>
      </div>

      {/* Content */}
      <div className="relative z-10 px-8 flex flex-col items-center gap-8">
        {/* The stat number */}
        <div
          style={{
            opacity: entered ? 1 : 0,
            transform: entered ? 'none' : 'translateY(30px) scale(0.92)',
            transition: 'opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.9s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          <span
            className="font-headline font-extrabold text-white block"
            style={{ fontSize: 'clamp(72px, 16vw, 200px)', lineHeight: 0.9, letterSpacing: '-0.03em' }}
          >
            {stat}
          </span>
        </div>

        {/* Context */}
        <div
          style={{
            opacity: entered ? 1 : 0,
            transform: entered ? 'none' : 'translateY(12px)',
            transition: 'opacity 0.7s ease, transform 0.7s ease',
            transitionDelay: '200ms',
          }}
        >
          <p
            className="font-body text-white/55 leading-relaxed"
            style={{ fontSize: 'clamp(16px, 1.5vw, 22px)', maxWidth: '50ch' }}
          >
            {context}
          </p>
        </div>

        {/* Source */}
        {source && (
          <div
            style={{
              opacity: entered ? 1 : 0,
              transition: 'opacity 0.5s ease',
              transitionDelay: '400ms',
            }}
          >
            <span
              className="font-label text-xs uppercase tracking-[0.2em]"
              style={{ color: 'rgba(142,207,158,0.4)' }}
            >
              {source}
            </span>
          </div>
        )}
      </div>

      {/* Thin accent line at bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(74,124,89,0.4), transparent)' }}
        aria-hidden
      />
    </div>
  )
}

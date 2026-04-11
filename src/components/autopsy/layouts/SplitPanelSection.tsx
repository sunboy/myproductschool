'use client'
import React from 'react'
import { Illustration } from '@/components/autopsy/Illustration'
import type { StorySection } from '@/lib/types'

interface Props {
  section: Extract<StorySection, { layout: 'split_panel' }>
  isVisible: boolean
  hasBeenVisible: boolean
}

export function SplitPanelSection({ section, isVisible, hasBeenVisible }: Props) {
  const { label, title, paragraphs, textSide } = section.content
  const [entered, setEntered] = React.useState(false)

  React.useEffect(() => {
    if (hasBeenVisible) {
      const t = setTimeout(() => setEntered(true), 60)
      return () => clearTimeout(t)
    }
  }, [hasBeenVisible])

  const textCol = (
    <div
      className="flex flex-col justify-center gap-6 px-10 py-16 md:px-16 md:py-24"
      style={{ background: '#0f1a14' }}
    >
      {/* Label */}
      <div
        style={{
          opacity: entered ? 1 : 0,
          transform: entered ? 'none' : 'translateY(10px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
          transitionDelay: '0ms',
        }}
      >
        <span
          className="font-label text-xs font-bold uppercase tracking-[0.25em]"
          style={{ color: '#8ecf9e' }}
        >
          {label}
        </span>
      </div>

      {/* Title */}
      <h2
        className="font-headline font-extrabold text-white leading-[1.05]"
        style={{
          fontSize: 'clamp(28px, 3.5vw, 52px)',
          letterSpacing: '-0.02em',
          opacity: entered ? 1 : 0,
          transform: entered ? 'none' : 'translateY(16px)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
          transitionDelay: '80ms',
        } as React.CSSProperties}
      >
        {title}
      </h2>

      {/* Divider */}
      <div
        style={{
          opacity: entered ? 1 : 0,
          transition: 'opacity 0.5s ease',
          transitionDelay: '160ms',
        }}
      >
        <div className="h-px w-10" style={{ backgroundColor: 'rgba(74,124,89,0.4)' }} />
      </div>

      {/* Paragraphs */}
      <div className="flex flex-col gap-4">
        {paragraphs.map((p, i) => (
          <p
            key={i}
            className="font-body text-white/60 leading-relaxed"
            style={{
              fontSize: 'clamp(15px, 1.2vw, 18px)',
              maxWidth: '52ch',
              opacity: entered ? 1 : 0,
              transform: entered ? 'none' : 'translateY(8px)',
              transition: 'opacity 0.6s ease, transform 0.6s ease',
              transitionDelay: `${200 + i * 80}ms`,
            }}
          >
            {p}
          </p>
        ))}
      </div>
    </div>
  )

  const illustrationCol = (
    <div
      className="relative flex items-center justify-center overflow-hidden"
      style={{
        minHeight: '50vh',
        background: 'linear-gradient(135deg, #0a1410 0%, #162318 50%, #0d1c14 100%)',
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
      {/* Radial glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          inset: '-20%',
          background: 'radial-gradient(circle at 50% 50%, rgba(74,124,89,0.12) 0%, transparent 65%)',
        }}
        aria-hidden
      />
      <div
        className="relative z-10 w-full max-w-md p-10"
        style={{
          opacity: entered ? 1 : 0,
          transform: entered ? 'none' : 'scale(0.95)',
          transition: 'opacity 0.8s ease, transform 0.8s ease',
          transitionDelay: '120ms',
        }}
      >
        <Illustration config={section.illustration} isVisible={isVisible} className="w-full" />
      </div>
    </div>
  )

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2"
      style={{ minHeight: 'min(80vh, 640px)' }}
    >
      {textSide === 'left'
        ? <>{textCol}{illustrationCol}</>
        : <>{illustrationCol}{textCol}</>
      }
    </div>
  )
}

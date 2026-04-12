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
      style={{ background: '#faf6f0' }}
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
          style={{ color: '#4a7c59' }}
        >
          {label}
        </span>
      </div>

      {/* Title */}
      <h2
        className="font-headline font-extrabold leading-[1.05]"
        style={{
          fontSize: 'clamp(28px, 3.5vw, 52px)',
          letterSpacing: '-0.02em',
          color: '#2e3230',
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
        <div className="h-px w-10" style={{ backgroundColor: 'rgba(74,124,89,0.35)' }} />
      </div>

      {/* Paragraphs */}
      <div className="flex flex-col gap-4">
        {paragraphs.map((p, i) => (
          <p
            key={i}
            className="font-body leading-relaxed"
            style={{
              fontSize: 'clamp(15px, 1.2vw, 18px)',
              maxWidth: '52ch',
              color: '#4a4e4a',
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
        background: '#f0ece4',
      }}
    >
      {/* Subtle radial glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          inset: '-20%',
          background: 'radial-gradient(circle at 50% 50%, rgba(74,124,89,0.07) 0%, transparent 65%)',
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

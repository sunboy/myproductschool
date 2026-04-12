'use client'
import React from 'react'
import Link from 'next/link'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import type { StorySection } from '@/lib/types'

interface Props {
  section: Extract<StorySection, { layout: 'fullbleed_cta' }>
  isVisible: boolean
  hasBeenVisible: boolean
}

export function FullbleedCTASection({ section, hasBeenVisible }: Props) {
  const { headline, subline, buttonText, targetPath } = section.content
  const [entered, setEntered] = React.useState(false)
  const words = headline.split(' ')

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
        background: '#f5f1ea',
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(74,124,89,0.35) 30%, rgba(74,124,89,0.35) 70%, transparent)' }}
        aria-hidden
      />

      {/* Center glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '60vw',
          height: '60vw',
          background: 'radial-gradient(circle, rgba(74,124,89,0.06) 0%, transparent 65%)',
          borderRadius: '50%',
        }}
        aria-hidden
      />

      <div className="relative z-10 px-10 py-20 md:px-20 md:py-28">
        {/* Luma avatar */}
        <div
          style={{
            opacity: entered ? 1 : 0,
            transform: entered ? 'none' : 'scale(0.8) translateY(12px)',
            transition: 'opacity 0.6s ease, transform 0.6s ease',
            marginBottom: 32,
          }}
        >
          <LumaGlyph size={52} state="idle" className="text-primary" />
        </div>

        {/* Label */}
        <div
          style={{
            opacity: entered ? 1 : 0,
            transition: 'opacity 0.5s ease',
            transitionDelay: '80ms',
            marginBottom: 16,
          }}
        >
          <span
            className="font-label text-xs font-bold uppercase tracking-[0.25em]"
            style={{ color: 'rgba(74,124,89,0.7)' }}
          >
            Ready to practice?
          </span>
        </div>

        {/* Headline — word stagger */}
        <div style={{ marginBottom: 20 }}>
          <h2
            className="font-headline font-extrabold leading-[1.05]"
            style={{ fontSize: 'clamp(28px, 4.5vw, 64px)', letterSpacing: '-0.025em', maxWidth: '14ch', color: '#2e3230' } as React.CSSProperties}
          >
            {words.map((word, i) => (
              <span
                key={i}
                className="inline-block mr-[0.2em]"
                style={{
                  opacity: entered ? 1 : 0,
                  transform: entered ? 'none' : 'translateY(20px)',
                  transition: 'opacity 0.6s ease, transform 0.6s ease',
                  transitionDelay: `${120 + i * 40}ms`,
                }}
              >
                {word}
              </span>
            ))}
          </h2>
        </div>

        {/* Divider */}
        <div
          style={{
            opacity: entered ? 1 : 0,
            transition: 'opacity 0.5s ease',
            transitionDelay: `${120 + words.length * 40 + 60}ms`,
            marginBottom: 20,
          }}
        >
          <div className="h-px w-10" style={{ backgroundColor: 'rgba(74,124,89,0.35)' }} />
        </div>

        {/* Subline */}
        {subline && (
          <p
            className="font-body leading-relaxed"
            style={{
              fontSize: 'clamp(15px, 1.3vw, 20px)',
              maxWidth: '48ch',
              marginBottom: 40,
              color: '#4a4e4a',
              opacity: entered ? 1 : 0,
              transform: entered ? 'none' : 'translateY(10px)',
              transition: 'opacity 0.6s ease, transform 0.6s ease',
              transitionDelay: `${120 + words.length * 40 + 120}ms`,
            }}
          >
            {subline}
          </p>
        )}

        {/* CTA Button */}
        <div
          style={{
            opacity: entered ? 1 : 0,
            transform: entered ? 'none' : 'translateY(12px)',
            transition: 'opacity 0.6s ease, transform 0.6s ease',
            transitionDelay: `${120 + words.length * 40 + 200}ms`,
          }}
        >
          <Link
            href={targetPath}
            className="inline-flex items-center gap-2 font-label font-bold text-sm px-7 py-3.5 rounded-full transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
            style={{
              backgroundColor: '#4a7c59',
              color: '#ffffff',
              letterSpacing: '0.01em',
              boxShadow: '0 2px 12px rgba(74,124,89,0.25)',
            }}
          >
            {buttonText}
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 16, fontVariationSettings: "'FILL' 0, 'wght' 400" }}
            >
              arrow_forward
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}

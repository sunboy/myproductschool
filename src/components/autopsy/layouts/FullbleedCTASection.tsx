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
        background: 'linear-gradient(180deg, #0b1610 0%, #0f1a14 60%, #080f0b 100%)',
      }}
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

      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(74,124,89,0.4) 30%, rgba(74,124,89,0.4) 70%, transparent)' }}
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
          background: 'radial-gradient(circle, rgba(74,124,89,0.1) 0%, transparent 65%)',
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
            style={{ color: 'rgba(142,207,158,0.6)' }}
          >
            Ready to practice?
          </span>
        </div>

        {/* Headline — word stagger */}
        <div style={{ marginBottom: 20 }}>
          <h2
            className="font-headline font-extrabold text-white leading-[1.05]"
            style={{ fontSize: 'clamp(28px, 4.5vw, 64px)', letterSpacing: '-0.025em', maxWidth: '14ch' } as React.CSSProperties}
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
          <div className="h-px w-10" style={{ backgroundColor: 'rgba(74,124,89,0.4)' }} />
        </div>

        {/* Subline */}
        {subline && (
          <p
            className="font-body text-white/55 leading-relaxed"
            style={{
              fontSize: 'clamp(15px, 1.3vw, 20px)',
              maxWidth: '48ch',
              marginBottom: 40,
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

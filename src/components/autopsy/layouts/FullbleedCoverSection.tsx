'use client'
import React from 'react'
import type { StorySection } from '@/lib/types'

interface Props {
  section: Extract<StorySection, { layout: 'fullbleed_cover' }>
  isVisible: boolean
  hasBeenVisible: boolean
}

export function FullbleedCoverSection({ section, hasBeenVisible }: Props) {
  const { label, headline, subline, meta } = section.content
  const [entered, setEntered] = React.useState(false)

  React.useEffect(() => {
    const t = setTimeout(() => setEntered(true), 80)
    return () => clearTimeout(t)
  }, [])

  // Split headline into words for staggered animation
  const words = headline.split(' ')

  return (
    <div
      className="relative flex flex-col justify-end overflow-hidden"
      style={{ minHeight: 'calc(100dvh - 52px)', background: '#0f1a14' }}
    >
      {/* Grain overlay */}
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

      {/* Ambient radial glow — top left */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-20%',
          left: '-10%',
          width: '60vw',
          height: '60vw',
          background: 'radial-gradient(circle, rgba(74,124,89,0.18) 0%, transparent 70%)',
          borderRadius: '50%',
        }}
        aria-hidden
      />

      {/* Large background word */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
        aria-hidden
      >
        <span
          className="font-headline font-extrabold uppercase tracking-tighter text-white/[0.03]"
          style={{ fontSize: 'clamp(120px, 20vw, 280px)', lineHeight: 1, whiteSpace: 'nowrap' }}
        >
          BLOCKS
        </span>
      </div>

      {/* Content — bottom aligned */}
      <div className="relative z-10 px-8 md:px-16 pb-20 pt-32 max-w-5xl">
        {/* Label */}
        <div
          className="mb-8 transition-all duration-700"
          style={{
            opacity: entered ? 1 : 0,
            transform: entered ? 'none' : 'translateY(12px)',
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

        {/* Headline — word by word stagger */}
        <h1
          className="font-headline font-extrabold text-white leading-[1.05] mb-8"
          style={{
            fontSize: 'clamp(36px, 5.5vw, 80px)',
            letterSpacing: '-0.02em',
            textWrap: 'balance',
          } as React.CSSProperties}
        >
          {words.map((word, i) => (
            <span
              key={i}
              className="inline-block mr-[0.25em] transition-all duration-700"
              style={{
                opacity: entered ? 1 : 0,
                transform: entered ? 'none' : 'translateY(20px)',
                transitionDelay: `${80 + i * 40}ms`,
              }}
            >
              {word}
            </span>
          ))}
        </h1>

        {/* Divider */}
        <div
          className="mb-8 transition-all duration-700"
          style={{
            opacity: entered ? 1 : 0,
            transform: entered ? 'none' : 'translateY(8px)',
            transitionDelay: `${80 + words.length * 40 + 80}ms`,
          }}
        >
          <div className="h-px w-16" style={{ backgroundColor: 'rgba(74,124,89,0.5)' }} />
        </div>

        {/* Subline */}
        <p
          className="font-body text-white/60 leading-relaxed mb-6 transition-all duration-700"
          style={{
            fontSize: 'clamp(16px, 1.5vw, 20px)',
            maxWidth: '56ch',
            opacity: entered ? 1 : 0,
            transform: entered ? 'none' : 'translateY(8px)',
            transitionDelay: `${80 + words.length * 40 + 160}ms`,
          }}
        >
          {subline}
        </p>

        {/* Meta row */}
        <div
          className="flex items-center gap-4 transition-all duration-700"
          style={{
            opacity: entered ? 1 : 0,
            transform: entered ? 'none' : 'translateY(8px)',
            transitionDelay: `${80 + words.length * 40 + 240}ms`,
          }}
        >
          <span className="font-label text-xs text-white/40">{meta}</span>
          <span className="text-white/20">·</span>
          <span className="font-label text-xs text-white/40">Scroll to read</span>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-8 right-8 flex flex-col items-center gap-2 transition-all duration-700"
        style={{
          opacity: hasBeenVisible ? 1 : 0,
          transitionDelay: '1200ms',
        }}
      >
        <span className="font-label text-[10px] text-white/30 uppercase tracking-widest" style={{ writingMode: 'vertical-rl' }}>
          scroll
        </span>
        <div className="w-px h-12 overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
          <div
            className="w-full"
            style={{
              height: '50%',
              backgroundColor: 'rgba(142,207,158,0.6)',
              animation: 'scrollDrop 1.8s ease-in-out infinite',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes scrollDrop {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(200%); }
        }
      `}</style>
    </div>
  )
}

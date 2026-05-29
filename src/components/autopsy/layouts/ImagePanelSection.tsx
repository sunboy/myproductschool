'use client'

import React from 'react'
import Image from 'next/image'
import type { StorySection } from '@/lib/types'

interface Props {
  section: Extract<StorySection, { layout: 'image_panel' }>
  isVisible: boolean
  hasBeenVisible: boolean
}

export function ImagePanelSection({ section, hasBeenVisible }: Props) {
  const { label, title, paragraphs, textSide, image } = section.content
  const [entered, setEntered] = React.useState(hasBeenVisible)

  React.useEffect(() => {
    if (hasBeenVisible) {
      const t = setTimeout(() => setEntered(true), 60)
      return () => clearTimeout(t)
    }
  }, [hasBeenVisible])

  const textCol = (
    <div className="flex flex-col justify-center gap-5 bg-background px-8 py-12 md:px-16 md:py-20">
      <span
        className="font-label text-xs font-bold uppercase tracking-[0.24em] text-primary"
        style={{
          opacity: entered ? 1 : 0,
          transform: entered ? 'none' : 'translateY(10px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}
      >
        {label}
      </span>
      <h2
        className="font-headline font-extrabold leading-[1.05] text-on-surface"
        style={{
          fontSize: 'clamp(28px, 3.5vw, 52px)',
          opacity: entered ? 1 : 0,
          transform: entered ? 'none' : 'translateY(16px)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
          transitionDelay: '80ms',
        }}
      >
        {title}
      </h2>
      <div className="h-px w-10 bg-primary/35" />
      <div className="flex flex-col gap-4">
        {paragraphs.map((paragraph, index) => (
          <p
            key={paragraph}
            className="max-w-[58ch] font-body text-[15px] leading-7 text-on-surface-variant md:text-base"
            style={{
              opacity: entered ? 1 : 0,
              transform: entered ? 'none' : 'translateY(8px)',
              transition: 'opacity 0.6s ease, transform 0.6s ease',
              transitionDelay: `${170 + index * 70}ms`,
            }}
          >
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  )

  const imageCol = (
    <div className="relative flex items-center justify-center overflow-hidden bg-surface-container-low px-6 py-10 md:px-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(74,124,89,0.08),transparent_62%)]" aria-hidden />
      <figure
        className="relative z-10 w-full max-w-xl overflow-hidden rounded-[22px] border border-outline-variant/45 bg-background shadow-sm"
        style={{
          opacity: entered ? 1 : 0,
          transform: entered ? 'none' : 'scale(0.97) translateY(12px)',
          transition: 'opacity 0.75s ease, transform 0.75s ease',
          transitionDelay: '140ms',
        }}
      >
        <Image
          src={image.src}
          alt={image.alt}
          width={image.width ?? 1080}
          height={image.height ?? 607}
          className="h-auto w-full object-contain"
        />
        {image.caption && (
          <figcaption className="border-t border-outline-variant/40 bg-background px-4 py-3 text-[11px] font-label leading-5 text-on-surface-variant">
            {image.caption}
          </figcaption>
        )}
      </figure>
    </div>
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-2" style={{ minHeight: 'min(68vh, 620px)' }}>
      {textSide === 'left' ? <>{textCol}{imageCol}</> : <>{imageCol}{textCol}</>}
    </div>
  )
}

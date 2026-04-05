'use client'
import { cn } from '@/lib/utils'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import type { StorySection } from '@/lib/types'

interface Props {
  section: Extract<StorySection, { layout: 'fullbleed_cover' }>
  isVisible: boolean
  hasBeenVisible: boolean
}

export function FullbleedCoverSection({ section, isVisible: _isVisible, hasBeenVisible }: Props) {
  const { label, headline, subline, meta } = section.content
  return (
    <div className="relative min-h-[calc(100dvh-52px)] bg-primary flex flex-col items-center justify-center px-6 text-center overflow-hidden">
      {/* Entrance */}
      <div className={cn('flex flex-col items-center gap-4 max-w-2xl', hasBeenVisible ? 'section-visible' : 'section-hidden')}>
        <p className="font-label text-on-primary/70 uppercase tracking-[0.2em] text-xs">{label}</p>
        <h1
          className="font-headline italic text-on-primary leading-tight"
          style={{ fontSize: 'clamp(32px, 4vw, 56px)' }}
        >
          {headline}
        </h1>
        <p className="font-body text-on-primary/80 text-lg max-w-xl">{subline}</p>
        <p className="font-label text-on-primary/60 text-xs">{meta}</p>
      </div>

      {/* Luma bottom-right */}
      <div className="absolute bottom-8 right-8">
        <LumaGlyph size={32} state="idle" />
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-8 left-1/2 animate-bounce-gentle"
        style={{ transform: 'translateX(-50%)' }}
      >
        <span className="material-symbols-outlined text-on-primary/50" style={{ fontSize: 20 }}>
          keyboard_arrow_down
        </span>
      </div>
    </div>
  )
}

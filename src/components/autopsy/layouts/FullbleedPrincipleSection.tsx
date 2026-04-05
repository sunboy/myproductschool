'use client'
import { cn } from '@/lib/utils'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import type { StorySection } from '@/lib/types'

interface Props {
  section: Extract<StorySection, { layout: 'fullbleed_principle' }>
  isVisible: boolean
  hasBeenVisible: boolean
}

export function FullbleedPrincipleSection({ section, isVisible, hasBeenVisible }: Props) {
  const { principle, attribution } = section.content
  return (
    <div className={cn(
      'min-h-[70vh] flex flex-col items-center justify-center text-center px-8 py-12 gap-6 bg-primary-fixed/30',
      hasBeenVisible ? 'section-visible' : 'section-hidden'
    )}>
      <LumaGlyph size={56} state="speaking" />
      <blockquote className="font-headline italic text-on-surface text-xl md:text-2xl max-w-2xl leading-relaxed">
        &ldquo;{principle}&rdquo;
      </blockquote>
      <p className="font-label text-xs text-on-surface-variant uppercase tracking-widest">{attribution}</p>
    </div>
  )
}

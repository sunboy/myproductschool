'use client'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import type { StorySection } from '@/lib/types'

interface Props {
  section: Extract<StorySection, { layout: 'fullbleed_cta' }>
  isVisible: boolean
  hasBeenVisible: boolean
}

export function FullbleedCTASection({ section, isVisible: _isVisible, hasBeenVisible }: Props) {
  const { headline, subline, buttonText, targetPath } = section.content
  return (
    <div className={cn(
      'min-h-[60vh] flex flex-col items-center justify-center text-center px-8 py-12 gap-6',
      hasBeenVisible ? 'section-visible' : 'section-hidden'
    )}>
      <LumaGlyph size={64} state="idle" className="animate-luma-glow" />
      <h2 className="font-headline italic text-on-surface text-2xl md:text-3xl max-w-xl">{headline}</h2>
      {subline && <p className="font-body text-on-surface-variant text-base max-w-lg">{subline}</p>}
      <Link
        href={targetPath}
        className="bg-primary text-on-primary rounded-full px-8 py-3 font-label font-semibold text-sm hover:bg-primary/90 transition-colors mt-2"
      >
        {buttonText}
      </Link>
    </div>
  )
}

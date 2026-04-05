'use client'
import { cn } from '@/lib/utils'
import type { StorySection } from '@/lib/types'

interface Props {
  section: Extract<StorySection, { layout: 'fullbleed_stat' }>
  isVisible: boolean
  hasBeenVisible: boolean
}

export function FullbleedStatSection({ section, isVisible: _isVisible, hasBeenVisible }: Props) {
  const { stat, context, source } = section.content
  return (
    <div className={cn(
      'min-h-[80vh] flex flex-col items-center justify-center text-center px-6 bg-surface-container-low gap-4',
      hasBeenVisible ? 'section-visible' : 'section-hidden'
    )}>
      <p
        className="font-label font-bold text-primary leading-none"
        style={{ fontSize: 'clamp(72px, 12vw, 160px)' }}
      >
        {stat}
      </p>
      <p className="font-body text-on-surface-variant text-lg max-w-xl">{context}</p>
      {source && <p className="font-label text-xs text-on-surface-variant/60">{source}</p>}
    </div>
  )
}

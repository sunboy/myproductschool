'use client'
import { cn } from '@/lib/utils'
import type { StorySection } from '@/lib/types'

interface Props {
  section: Extract<StorySection, { layout: 'quote' }>
  isVisible: boolean
  hasBeenVisible: boolean
}

export function QuoteSection({ section, isVisible, hasBeenVisible }: Props) {
  const { quote, attribution, context } = section.content
  return (
    <div className={cn(
      'py-16 px-8 flex flex-col items-center gap-4 max-w-3xl mx-auto',
      hasBeenVisible ? 'section-visible' : 'section-hidden'
    )}>
      <span className="font-headline text-8xl text-primary/30 leading-none select-none">&ldquo;</span>
      <blockquote className="font-headline italic text-on-surface text-2xl max-w-2xl text-center leading-relaxed -mt-8">
        {quote}
      </blockquote>
      <div className="flex flex-col items-center gap-1 mt-2">
        <p className="font-label font-bold text-on-surface text-sm">{attribution}</p>
        {context && <p className="font-label text-xs text-on-surface-variant">{context}</p>}
      </div>
    </div>
  )
}

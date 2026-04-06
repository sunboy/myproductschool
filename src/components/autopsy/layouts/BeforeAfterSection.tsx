'use client'
import { cn } from '@/lib/utils'
import type { StorySection } from '@/lib/types'

interface Props {
  section: Extract<StorySection, { layout: 'before_after' }>
  isVisible: boolean
  hasBeenVisible: boolean
}

export function BeforeAfterSection({ section, isVisible: _isVisible, hasBeenVisible }: Props) {
  const { title, before, after } = section.content
  return (
    <div className={cn(
      'min-h-[70vh] flex flex-col items-center justify-center px-6 py-12 gap-8',
      hasBeenVisible ? 'section-visible' : 'section-hidden'
    )}>
      <h2 className="font-headline italic text-on-surface text-2xl md:text-3xl text-center">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
        {/* Before */}
        <div className="bg-surface-container rounded-2xl p-6 border-t-4 border-error">
          <p className="font-label font-bold text-error uppercase tracking-wide text-xs mb-4">{before.label}</p>
          <ul className="space-y-2">
            {before.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-on-surface-variant text-sm">
                <span className="material-symbols-outlined text-error shrink-0" style={{ fontSize: 16, marginTop: 1 }}>close</span>
                {item}
              </li>
            ))}
          </ul>
          {before.summary && <p className="mt-4 text-xs text-on-surface-variant/70 italic">{before.summary}</p>}
        </div>
        {/* After */}
        <div className="bg-surface-container rounded-2xl p-6 border-t-4 border-primary">
          <p className="font-label font-bold text-primary uppercase tracking-wide text-xs mb-4">{after.label}</p>
          <ul className="space-y-2">
            {after.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-on-surface-variant text-sm">
                <span className="material-symbols-outlined text-primary shrink-0" style={{ fontSize: 16, marginTop: 1 }}>check_circle</span>
                {item}
              </li>
            ))}
          </ul>
          {after.summary && <p className="mt-4 text-xs text-on-surface-variant/70 italic">{after.summary}</p>}
        </div>
      </div>
    </div>
  )
}

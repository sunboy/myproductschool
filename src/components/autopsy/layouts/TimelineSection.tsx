'use client'
import { cn } from '@/lib/utils'
import type { StorySection } from '@/lib/types'

interface Props {
  section: Extract<StorySection, { layout: 'timeline' }>
  isVisible: boolean
  hasBeenVisible: boolean
}

const eventDotClass: Record<string, string> = {
  milestone: 'bg-primary',
  launch: 'bg-tertiary',
  pivot: 'bg-error',
}

export function TimelineSection({ section, isVisible, hasBeenVisible }: Props) {
  const { title, events } = section.content
  return (
    <div className={cn(
      'py-12 px-6 max-w-4xl mx-auto',
      hasBeenVisible ? 'section-visible' : 'section-hidden'
    )}>
      <h2 className="font-headline italic text-on-surface text-2xl mb-10 text-center">{title}</h2>
      {/* Vertical timeline on mobile, horizontal on desktop */}
      <div className="relative flex flex-col md:flex-row gap-0 md:gap-0">
        {/* Track line */}
        <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-outline-variant md:hidden" />
        <div className="hidden md:block absolute left-0 right-0 top-[11px] h-0.5 bg-outline-variant" />

        {events.map((event, i) => (
          <div
            key={i}
            className="relative flex flex-row md:flex-col items-start md:items-center gap-4 md:gap-2 pl-8 md:pl-0 md:flex-1 pb-8 md:pb-0"
            style={{
              transition: `opacity 0.4s ease ${i * 0.1}s, transform 0.4s ease ${i * 0.1}s`,
              opacity: hasBeenVisible ? 1 : 0,
              transform: hasBeenVisible ? 'none' : 'translateY(12px)',
            }}
          >
            {/* Dot */}
            <div className={cn(
              'absolute left-0 md:static shrink-0 w-[22px] h-[22px] rounded-full border-2 border-background',
              eventDotClass[event.type] ?? 'bg-on-surface-variant'
            )} />
            <div className="md:text-center pt-0 md:pt-3">
              <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-wide">{event.date}</p>
              <p className="font-label font-bold text-on-surface text-sm mt-0.5">{event.label}</p>
              <p className="font-body text-xs text-on-surface-variant mt-1 leading-relaxed md:max-w-[120px]">{event.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

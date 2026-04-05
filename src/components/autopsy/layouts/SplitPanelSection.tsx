'use client'
import { cn } from '@/lib/utils'
import { Illustration } from '@/components/autopsy/Illustration'
import type { StorySection } from '@/lib/types'

interface Props {
  section: Extract<StorySection, { layout: 'split_panel' }>
  isVisible: boolean
  hasBeenVisible: boolean
}

export function SplitPanelSection({ section, isVisible, hasBeenVisible }: Props) {
  const { label, title, paragraphs, textSide } = section.content
  const textCol = (
    <div className="flex flex-col justify-center gap-4 px-6 py-8 md:px-10">
      <p className="font-label text-primary uppercase tracking-widest text-xs font-bold">{label}</p>
      <h2 className="font-headline italic text-on-surface text-2xl md:text-3xl leading-tight">{title}</h2>
      {paragraphs.map((p, i) => (
        <p key={i} className="font-body text-on-surface-variant text-base leading-relaxed">{p}</p>
      ))}
    </div>
  )
  const illustrationCol = (
    <div className="flex items-center justify-center p-6 bg-surface-container-low min-h-[300px]">
      <Illustration config={section.illustration} isVisible={isVisible} className="w-full max-w-sm" />
    </div>
  )
  return (
    <div className={cn(
      'min-h-[80vh] grid grid-cols-1 md:grid-cols-2',
      hasBeenVisible ? 'section-visible' : 'section-hidden'
    )}>
      {textSide === 'left' ? <>{textCol}{illustrationCol}</> : <>{illustrationCol}{textCol}</>}
    </div>
  )
}

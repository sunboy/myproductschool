import Link from 'next/link'
import type { AutopsyStory } from '@/lib/types'

interface Props {
  story: AutopsyStory
  productSlug: string
  coverColor?: string | null
}

export function StoryCard({ story, productSlug, coverColor }: Props) {
  return (
    <Link
      href={`/explore/showcase/${productSlug}/stories/${story.slug}`}
      className="group block rounded-xl overflow-hidden bg-surface-container hover:bg-surface-container-high transition-colors"
    >
      {/* Thumbnail */}
      <div
        className="h-16 flex items-center justify-center"
        style={{
          background: coverColor
            ? `linear-gradient(135deg, ${coverColor}cc, ${coverColor}66)`
            : undefined,
        }}
      >
        {!coverColor && (
          <div className="h-16 w-full bg-primary-container/30" />
        )}
        <span className="bg-primary text-on-primary text-[9px] font-label font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
          HACK STORY
        </span>
      </div>

      {/* Body */}
      <div className="p-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-headline text-sm text-on-surface group-hover:text-primary transition-colors truncate">
            {story.title}
          </p>
          <p className="text-[10px] text-on-surface-variant mt-0.5">
            {story.read_time} · {story.sections.length} sections
          </p>
        </div>
        <span
          className="material-symbols-outlined text-on-surface-variant group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0"
          style={{ fontSize: 16 }}
        >
          arrow_forward
        </span>
      </div>
    </Link>
  )
}

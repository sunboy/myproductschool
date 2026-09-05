'use client'
import Image from 'next/image'
import { LearningGeometry } from '@/components/redesign/LearningGeometry'
import type { StorySection } from '@/lib/types'

interface Props {
  section: Extract<StorySection, { layout: 'fullbleed_cover' }>
  isVisible: boolean
  hasBeenVisible: boolean
}

export function FullbleedCoverSection({ section }: Props) {
  const { label, headline, subline, meta, image } = section.content
  return (
    <header className={`learning-story-cover${image ? ' has-image' : ''}`}>
      <LearningGeometry quiet />
      <div className="learning-story-cover-copy">
        <p className="learning-story-cover-label">{label}</p>
        <h1>{headline}</h1>
        <p>{subline}</p>
        {meta && <p className="learning-story-cover-meta">{meta}</p>}
      </div>
      {image && <figure>
        <Image src={image.src} alt={image.alt} width={image.width ?? 1080} height={image.height ?? 607} priority className="h-auto w-full object-contain" />
        {image.caption && <figcaption>{image.caption}</figcaption>}
      </figure>}
    </header>
  )
}

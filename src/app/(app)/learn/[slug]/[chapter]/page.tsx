'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { useLearnChapter } from '@/hooks/useLearnChapter'
import { useLearnModule } from '@/hooks/useLearnModule'

function renderMdx(mdx: string): string {
  // Minimal markdown → HTML conversion for body_mdx field.
  // Headings, bold, italic, horizontal rule, paragraphs.
  return mdx
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^---$/gm, '<hr/>')
    .split('\n\n')
    .map(block => {
      if (block.startsWith('<h') || block.startsWith('<hr')) return block
      return `<p>${block.trim()}</p>`
    })
    .join('\n')
}

export default function LearnChapterPage({
  params,
}: {
  params: Promise<{ slug: string; chapter: string }>
}) {
  const { slug, chapter } = use(params)
  const { data, isLoading, error, markComplete, isMarkingComplete } = useLearnChapter(slug, chapter)
  const { data: moduleData } = useLearnModule(slug)
  const [markedDone, setMarkedDone] = useState(false)

  const handleMarkComplete = async () => {
    await markComplete()
    setMarkedDone(true)
  }

  // Find next chapter
  const chapters = moduleData?.chapters ?? []
  const currentIndex = chapters.findIndex(c => c.slug === chapter)
  const nextChapter = chapters[currentIndex + 1]

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        <div className="h-40 rounded-2xl bg-surface-container animate-pulse" />
        <div className="h-96 rounded-xl bg-surface-container animate-pulse" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <p className="text-error text-sm">{error ?? 'Chapter not found'}</p>
      </div>
    )
  }

  const moduleAccentColor = moduleData?.module.accent_color ?? '#4a7c59'
  const moduleCoverColor = moduleData?.module.cover_color ?? '#1a3a2a'

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      {/* Back link */}
      <Link
        href={`/learn/${slug}`}
        className="inline-flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        {moduleData?.module.name ?? 'Back'}
      </Link>

      {/* Hook card */}
      <div
        className="rounded-2xl p-8 space-y-3"
        style={{ backgroundColor: moduleCoverColor }}
      >
        <p className="text-white/60 text-xs font-label uppercase tracking-widest">
          Chapter {data.sort_order} · {data.subtitle}
        </p>
        <h1 className="font-headline text-2xl font-bold text-white leading-snug">
          {data.title}
        </h1>
        {data.hook_text && (
          <p
            className="text-lg leading-relaxed font-headline mt-4"
            style={{ color: moduleAccentColor === '#4a7c59' ? '#8ecf9e' : 'rgba(255,255,255,0.85)' }}
          >
            {data.hook_text}
          </p>
        )}
      </div>

      {/* Article body */}
      <div
        className="prose prose-sm max-w-none text-on-surface
          [&_h1]:font-headline [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-on-surface [&_h1]:mt-8 [&_h1]:mb-3
          [&_h2]:font-headline [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-on-surface [&_h2]:mt-6 [&_h2]:mb-2
          [&_h3]:font-label [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-on-surface [&_h3]:mt-5 [&_h3]:mb-1
          [&_p]:text-on-surface-variant [&_p]:leading-relaxed [&_p]:mb-4
          [&_strong]:text-on-surface [&_strong]:font-semibold
          [&_em]:italic
          [&_hr]:border-outline-variant [&_hr]:my-6"
        dangerouslySetInnerHTML={{ __html: renderMdx(data.body_mdx) }}
      />

      {/* Bottom actions */}
      <div className="flex items-center justify-between pt-4 border-t border-outline-variant">
        {!markedDone ? (
          <button
            onClick={handleMarkComplete}
            disabled={isMarkingComplete}
            className="inline-flex items-center gap-2 bg-primary text-on-primary rounded-full px-5 py-2.5 text-sm font-semibold font-label hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>check_circle</span>
            {isMarkingComplete ? 'Saving...' : 'Mark complete'}
          </button>
        ) : (
          <div className="inline-flex items-center gap-2 text-primary text-sm font-semibold font-label">
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>check_circle</span>
            Done!
          </div>
        )}

        {nextChapter && nextChapter.is_unlocked && (
          <Link
            href={`/learn/${slug}/${nextChapter.slug}`}
            className="inline-flex items-center gap-2 text-sm font-semibold font-label rounded-full px-5 py-2.5 bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors"
          >
            Next chapter
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </Link>
        )}
      </div>
    </div>
  )
}

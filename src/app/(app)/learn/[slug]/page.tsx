'use client'

import { use } from 'react'
import Link from 'next/link'
import { useLearnModule } from '@/hooks/useLearnModule'
import { MODULE_SVG_ART, LEARN_MODULES_SEED } from '@/lib/learn-seed'
import type { LearnChapterWithProgress, LearnDifficulty } from '@/lib/types'

const DIFFICULTY_LABELS: Record<LearnDifficulty, string> = {
  foundation: 'Foundation',
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  'new-era': 'New Era',
  'entry-point': 'Entry Point',
}

function ChapterRow({
  chapter,
  moduleSlug,
  index,
}: {
  chapter: LearnChapterWithProgress
  moduleSlug: string
  index: number
}) {
  const locked = !chapter.is_unlocked && !chapter.is_completed

  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-xl transition-all ${
        locked
          ? 'opacity-50'
          : chapter.is_completed
          ? 'bg-primary-fixed/30'
          : 'bg-surface-container-high hover:bg-surface-container-highest'
      }`}
    >
      {/* Number circle */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-label ${
          chapter.is_completed
            ? 'bg-primary text-on-primary'
            : 'bg-surface-container-highest text-on-surface-variant'
        }`}
      >
        {chapter.is_completed ? (
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>check</span>
        ) : (
          index + 1
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className={`font-semibold font-label text-sm ${locked ? 'text-on-surface-variant' : 'text-on-surface'}`}>
              {chapter.title}
            </p>
            {chapter.subtitle && (
              <p className="text-xs text-on-surface-variant mt-0.5">{chapter.subtitle}</p>
            )}
          </div>
          {locked ? (
            <span className="material-symbols-outlined text-on-surface-variant text-lg flex-shrink-0">lock</span>
          ) : (
            <Link
              href={`/learn/${moduleSlug}/${chapter.slug}`}
              className="flex-shrink-0 text-xs font-semibold font-label text-primary bg-primary-container rounded-full px-3 py-1 hover:opacity-80 transition-opacity"
            >
              {chapter.is_completed ? 'Review' : 'Read'}
            </Link>
          )}
        </div>
        {/* Hook text preview — shown on unlocked chapters */}
        {!locked && chapter.hook_text && (
          <p className="text-xs text-on-surface-variant mt-2 italic leading-relaxed line-clamp-2">
            "{chapter.hook_text}"
          </p>
        )}
      </div>
    </div>
  )
}

export default function LearnModulePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const { data, isLoading, error } = useLearnModule(slug)

  const svgArt = MODULE_SVG_ART[slug] ?? ''
  const nextModules = LEARN_MODULES_SEED
    .filter(m => m.slug !== slug)
    .slice(0, 2)

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        <div className="h-32 rounded-2xl bg-surface-container animate-pulse" />
        <div className="h-64 rounded-xl bg-surface-container animate-pulse" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-error text-sm">{error ?? 'Module not found'}</p>
      </div>
    )
  }

  const { module, chapters } = data
  const completedCount = chapters.filter(c => c.is_completed).length
  const progressPct = module.chapter_count > 0
    ? Math.round((completedCount / module.chapter_count) * 100)
    : 0

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Back link */}
      <Link href="/learn" className="inline-flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface transition-colors">
        <span className="material-symbols-outlined text-base">arrow_back</span>
        All modules
      </Link>

      {/* Hero banner */}
      <div
        className="relative h-[130px] rounded-2xl overflow-hidden"
        style={{ backgroundColor: module.cover_color }}
      >
        {svgArt && (
          <div
            className="absolute inset-0 opacity-50"
            dangerouslySetInnerHTML={{ __html: svgArt }}
          />
        )}
        {/* Right-side gradient for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/30" />
        <div className="absolute inset-0 flex flex-col justify-end p-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white/70 text-xs font-label uppercase tracking-wider">
              {DIFFICULTY_LABELS[module.difficulty]}
            </span>
            <span className="text-white/50 text-xs">·</span>
            <span className="text-white/70 text-xs font-label">
              {module.chapter_count} chapters
            </span>
          </div>
          <h1 className="font-headline text-3xl font-bold text-white">{module.name}</h1>
          <p className="text-white/80 text-sm mt-1">{module.tagline}</p>
        </div>
      </div>

      {/* Main content + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">
        {/* Chapter list */}
        <div className="space-y-2">
          <h2 className="font-headline text-lg font-bold text-on-surface mb-4">Chapters</h2>
          {chapters.map((chapter, i) => (
            <ChapterRow
              key={chapter.id}
              chapter={chapter}
              moduleSlug={slug}
              index={i}
            />
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Progress ring card */}
          <div className="bg-surface-container rounded-xl p-4 space-y-3">
            <h3 className="font-label font-semibold text-sm text-on-surface">Your Progress</h3>
            <div className="flex items-center gap-4">
              {/* SVG progress ring */}
              <svg width="56" height="56" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="22" fill="none" stroke="#e4e0d8" strokeWidth="4" />
                <circle
                  cx="28" cy="28" r="22"
                  fill="none"
                  stroke={module.accent_color}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 22}`}
                  strokeDashoffset={`${2 * Math.PI * 22 * (1 - progressPct / 100)}`}
                  transform="rotate(-90 28 28)"
                />
                <text x="28" y="33" textAnchor="middle" fill="#2e3230" fontSize="13" fontWeight="700" fontFamily="sans-serif">
                  {progressPct}%
                </text>
              </svg>
              <div>
                <p className="font-label font-semibold text-on-surface text-sm">
                  {completedCount} / {module.chapter_count}
                </p>
                <p className="text-xs text-on-surface-variant">chapters done</p>
              </div>
            </div>
          </div>

          {/* After this module */}
          <div className="bg-surface-container rounded-xl p-4 space-y-3">
            <h3 className="font-label font-semibold text-sm text-on-surface">After this module</h3>
            <div className="space-y-2">
              {nextModules.map(nm => (
                <Link
                  key={nm.slug}
                  href={`/learn/${nm.slug}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-container-high transition-colors"
                >
                  <div
                    className="w-6 h-6 rounded-md flex-shrink-0"
                    style={{ backgroundColor: nm.cover_color }}
                  />
                  <span className="text-sm font-label font-medium text-on-surface truncate">{nm.name}</span>
                  <span className="material-symbols-outlined text-on-surface-variant text-sm ml-auto">arrow_forward</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { use, useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLearnModule } from '@/hooks/useLearnModule'
import { useLearnChapter } from '@/hooks/useLearnChapter'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import type { LearnModule, LearnChapterWithProgress, LearnDifficulty } from '@/lib/types'

// ─── Types ──────────────────────────────────────────────────────────────────

type ModuleData = { module: LearnModule; chapters: LearnChapterWithProgress[] }

// ─── Constants ───────────────────────────────────────────────────────────────

const DIFFICULTY_LABELS: Record<LearnDifficulty, string> = {
  foundation: 'Foundation',
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  'new-era': 'New Era',
  'entry-point': 'Entry Point',
}

// ─── renderMdx (minimal markdown → HTML) ─────────────────────────────────────

function renderMdx(mdx: string): string {
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

// ─── Sub-components ──────────────────────────────────────────────────────────

function ModuleMiniHeader({ module }: { module: LearnModule }) {
  return (
    <div className="p-3 pb-2.5 border-b border-outline-variant flex-shrink-0">
      <div className="h-1.5 rounded-full mb-2.5" style={{ background: module.cover_color }} />
      <div className="font-headline text-sm font-bold text-on-surface leading-tight mb-1.5">{module.name}</div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="bg-primary-fixed text-primary font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wide">
          {DIFFICULTY_LABELS[module.difficulty]}
        </span>
        <span className="text-[10px] text-on-surface-variant">{module.chapter_count} chapters · ~{module.est_minutes} min</span>
      </div>
    </div>
  )
}

function ChapterList({
  chapters,
  activeSlug,
  onSelect,
}: {
  chapters: LearnChapterWithProgress[]
  activeSlug: string | null
  onSelect: (slug: string) => void
}) {
  return (
    <div className="flex-1 overflow-y-auto py-1.5 px-2 space-y-0.5">
      {chapters.map((ch, i) => {
        const locked = !ch.is_unlocked && !ch.is_completed
        const isActive = ch.slug === activeSlug
        return (
          <button
            key={ch.id}
            disabled={locked}
            onClick={() => !locked && onSelect(ch.slug)}
            className={[
              'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors',
              isActive ? 'bg-primary-fixed' : locked ? 'opacity-40 cursor-not-allowed' : 'hover:bg-surface-container',
            ].join(' ')}
          >
            <div
              className={[
                'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0',
                ch.is_completed ? 'bg-primary-fixed text-primary' : 'bg-surface-container-highest text-on-surface-variant',
              ].join(' ')}
            >
              {ch.is_completed ? (
                <span className="material-symbols-outlined text-[11px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
              ) : (
                i + 1
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className={[
                'text-xs font-bold truncate',
                isActive ? 'text-primary' : locked ? 'text-on-surface-variant' : 'text-on-surface',
              ].join(' ')}>
                {ch.title}
              </div>
              <div className="text-[10px] text-on-surface-variant truncate">{ch.subtitle}</div>
            </div>
            {ch.is_completed && !isActive && (
              <span className="material-symbols-outlined text-primary text-sm flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
            )}
            {locked && (
              <span className="material-symbols-outlined text-on-surface-variant text-sm flex-shrink-0 opacity-50">lock</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

function ChapterEmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8">
      <span className="material-symbols-outlined text-on-surface-variant opacity-20" style={{ fontSize: 48 }}>auto_stories</span>
      <p className="font-label text-sm font-bold text-on-surface opacity-40">Select a chapter to start reading</p>
      <p className="text-xs text-on-surface-variant opacity-50">Click any chapter from the list on the left</p>
    </div>
  )
}

function ChapterPane({
  moduleSlug,
  chapterSlug,
  moduleData,
  onNext,
  onComplete,
}: {
  moduleSlug: string
  chapterSlug: string
  moduleData: ModuleData | null
  onNext: (slug: string) => void
  onComplete: () => void
}) {
  const { data, isLoading, markComplete, isMarkingComplete } = useLearnChapter(moduleSlug, chapterSlug)
  const [markedDone, setMarkedDone] = useState(false)

  const chapters = moduleData?.chapters ?? []
  const currentIdx = chapters.findIndex(c => c.slug === chapterSlug)
  const nextChapter = chapters[currentIdx + 1]

  useEffect(() => { setMarkedDone(false) }, [chapterSlug])

  if (isLoading) {
    return (
      <div className="flex-1 p-6 space-y-4 animate-pulse">
        <div className="h-28 rounded-xl bg-surface-container" />
        <div className="h-4 rounded bg-surface-container w-3/4" />
        <div className="h-4 rounded bg-surface-container w-full" />
        <div className="h-4 rounded bg-surface-container w-5/6" />
      </div>
    )
  }

  if (!data) return null

  const coverColor = moduleData?.module.cover_color ?? '#1a3a2a'

  return (
    <div className="flex flex-col h-[calc(100vh-52px)] overflow-hidden">
      {/* Hook card */}
      <div className="px-6 py-5 flex-shrink-0" style={{ background: coverColor }}>
        <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1.5">
          Chapter {data.sort_order} · {data.subtitle}
        </p>
        <h1 className="font-headline text-xl font-bold text-white leading-snug mb-2">{data.title}</h1>
        {data.hook_text && (
          <p className="text-sm leading-relaxed italic text-white/75">{data.hook_text}</p>
        )}
      </div>

      {/* Body — scrollable */}
      <div
        className="flex-1 overflow-y-auto px-6 py-5 prose prose-sm max-w-none
          [&_h1]:font-headline [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-on-surface [&_h1]:mt-6 [&_h1]:mb-2
          [&_h2]:font-headline [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-on-surface [&_h2]:mt-5 [&_h2]:mb-2
          [&_h3]:font-label [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-on-surface [&_h3]:mt-4 [&_h3]:mb-1
          [&_p]:text-on-surface-variant [&_p]:leading-relaxed [&_p]:mb-3 [&_p]:text-sm
          [&_strong]:text-on-surface [&_strong]:font-semibold
          [&_em]:italic
          [&_hr]:border-outline-variant [&_hr]:my-4"
        dangerouslySetInnerHTML={{ __html: renderMdx(data.body_mdx) }}
      />

      {/* Footer */}
      <div className="px-5 py-3 border-t border-outline-variant bg-surface-container-low flex items-center justify-between flex-shrink-0">
        {!markedDone ? (
          <button
            onClick={async () => { await markComplete(); setMarkedDone(true); onComplete() }}
            disabled={isMarkingComplete}
            className="inline-flex items-center gap-1.5 bg-primary text-on-primary rounded-full px-4 py-2 text-xs font-bold font-label disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            {isMarkingComplete ? 'Saving…' : 'Mark complete'}
          </button>
        ) : (
          <div className="inline-flex items-center gap-1.5 text-primary text-xs font-bold font-label">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            Done!
          </div>
        )}
        {nextChapter && (nextChapter.is_unlocked || nextChapter.is_completed) && (
          <button
            onClick={() => onNext(nextChapter.slug)}
            className="inline-flex items-center gap-1.5 bg-surface-container-high text-on-surface rounded-full px-4 py-2 text-xs font-bold font-label hover:bg-surface-container-highest transition-colors"
          >
            Next chapter
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        )}
      </div>
    </div>
  )
}

function ProgressCard({ module, completedCount }: { module: LearnModule; completedCount: number }) {
  const pct = module.chapter_count > 0 ? Math.round((completedCount / module.chapter_count) * 100) : 0
  const r = 18
  const circumference = 2 * Math.PI * r
  return (
    <div className="bg-surface-container rounded-xl p-3 space-y-2">
      <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Your Progress</div>
      <div className="flex items-center gap-3">
        <svg width="48" height="48" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r={r} fill="none" stroke="#e4e0d8" strokeWidth="3.5" />
          <circle
            cx="24" cy="24" r={r}
            fill="none"
            stroke={module.accent_color}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - pct / 100)}
            transform="rotate(-90 24 24)"
          />
          <text x="24" y="28" textAnchor="middle" fill="#2e3230" fontSize="11" fontWeight="700" fontFamily="sans-serif">{pct}%</text>
        </svg>
        <div>
          <div className="font-label text-sm font-bold text-on-surface">{completedCount} / {module.chapter_count}</div>
          <div className="text-[10px] text-on-surface-variant">chapters done</div>
        </div>
      </div>
    </div>
  )
}

function AfterThisModule({ currentSlug }: { currentSlug: string }) {
  const [modules, setModules] = useState<LearnModule[]>([])

  useEffect(() => {
    fetch('/api/learn')
      .then(r => r.ok ? r.json() : [])
      .then((data: { modules: LearnModule[] }) => setModules((data.modules ?? []).filter(m => m.slug !== currentSlug).slice(0, 2)))
      .catch(() => {})
  }, [currentSlug])

  if (modules.length === 0) return null

  return (
    <div className="bg-surface-container rounded-xl p-3 space-y-2">
      <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">After this module</div>
      {modules.map(nm => (
        <Link
          key={nm.slug}
          href={`/explore/modules/${nm.slug}`}
          className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-surface-container-high transition-colors"
        >
          <div className="w-6 h-6 rounded-md flex-shrink-0" style={{ background: nm.cover_color ?? '#4a7c59' }} />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-on-surface truncate">{nm.name}</div>
            <div className="text-[10px] text-on-surface-variant">{nm.chapter_count} chapters</div>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant text-sm">arrow_forward</span>
        </Link>
      ))}
    </div>
  )
}

// ─── Inner page (needs searchParams, wrapped in Suspense) ─────────────────────

function ModulePageInner({ slug }: { slug: string }) {
  const router = useRouter()

  const searchParams = useSearchParams()
  const { data, isLoading, error, refetch } = useLearnModule(slug)
  const [activeChapterSlug, setActiveChapterSlug] = useState<string | null>(null)

  // Sync active chapter from URL param or auto-select on data load
  useEffect(() => {
    if (!data) return
    const paramChapter = searchParams.get('chapter')
    if (paramChapter) {
      const exists = data.chapters.find(c => c.slug === paramChapter)
      if (exists) { setActiveChapterSlug(paramChapter); return }
    }
    // Auto-select first unlocked+incomplete chapter, or first chapter
    const next = data.chapters.find(c => (c.is_unlocked || c.sort_order === 1) && !c.is_completed)
      ?? data.chapters[0]
    if (next) setActiveChapterSlug(next.slug)
  }, [data]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectChapter = (chSlug: string) => {
    setActiveChapterSlug(chSlug)
    router.replace(`/explore/modules/${slug}?chapter=${chSlug}`, { scroll: false })
  }

  const handleNext = (chSlug: string) => {
    handleSelectChapter(chSlug)
  }

  if (isLoading) {
    return (
      <div className="flex h-full animate-pulse">
        <div className="w-[220px] border-r border-outline-variant p-3 space-y-2">
          <div className="h-5 rounded bg-surface-container w-3/4" />
          <div className="h-3 rounded bg-surface-container w-1/2" />
          {Array(7).fill(0).map((_, i) => <div key={i} className="h-9 rounded-lg bg-surface-container" />)}
        </div>
        <div className="flex-1 p-6 space-y-4">
          <div className="h-28 rounded-xl bg-surface-container" />
          <div className="h-4 rounded bg-surface-container w-3/4" />
          <div className="h-4 rounded bg-surface-container w-full" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <p className="text-error text-sm">{error ?? 'Module not found'}</p>
        <Link href="/explore" className="text-primary text-sm mt-2 inline-block">← Back to Explore</Link>
      </div>
    )
  }

  const { module, chapters } = data
  const completedCount = chapters.filter(c => c.is_completed).length

  return (
    <div className="flex flex-col h-[calc(100vh-52px)] overflow-hidden">
      {/* Top breadcrumb bar */}
      <div className="h-11 flex items-center gap-2 px-4 border-b border-outline-variant flex-shrink-0 bg-background">
        <Link
          href="/explore/modules"
          className="inline-flex items-center gap-1 text-xs font-bold font-label text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          All modules
        </Link>
        <span className="text-on-surface-variant text-xs opacity-40">/</span>
        <span className="text-xs font-bold text-on-surface truncate">{module.name}</span>
      </div>

      {/* Three-column body */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT: Chapter list */}
        <div className="w-[220px] flex-shrink-0 border-r border-outline-variant flex flex-col overflow-hidden">
          <ModuleMiniHeader module={module} />
          <ChapterList chapters={chapters} activeSlug={activeChapterSlug} onSelect={handleSelectChapter} />
        </div>

        {/* MIDDLE: Chapter content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeChapterSlug ? (
            <ChapterPane
              moduleSlug={slug}
              chapterSlug={activeChapterSlug}
              moduleData={data}
              onNext={handleNext}
              onComplete={refetch}
            />
          ) : (
            <ChapterEmptyState />
          )}
        </div>

        {/* RIGHT: Sidebar */}
        <div className="w-[240px] flex-shrink-0 border-l border-outline-variant overflow-y-auto p-3 space-y-3">
          {/* Luma tip */}
          <div className="flex items-start gap-2.5 bg-primary-fixed rounded-xl p-3">
            <LumaGlyph size={28} state="speaking" className="text-primary flex-shrink-0" />
            <p className="text-[11px] text-on-surface leading-relaxed">
              <span className="font-bold">Luma tip:</span> Complete chapters in order — each builds on the last.
            </p>
          </div>

          <ProgressCard module={module} completedCount={completedCount} />
          <AfterThisModule currentSlug={slug} />
        </div>
      </div>
    </div>
  )
}

// ─── Page export ─────────────────────────────────────────────────────────────

export default function LearnModulePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  return (
    <Suspense fallback={<div className="flex h-full animate-pulse bg-surface-container" />}>
      <ModulePageInner slug={slug} />
    </Suspense>
  )
}

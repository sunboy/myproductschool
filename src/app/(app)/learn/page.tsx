'use client'

import Link from 'next/link'
import { useLearnModules } from '@/hooks/useLearnModules'
import { MODULE_SVG_ART } from '@/lib/learn-seed'
import type { LearnModuleWithProgress, LearnDifficulty } from '@/lib/types'

const DIFFICULTY_LABELS: Record<LearnDifficulty, string> = {
  foundation: 'Foundation',
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  'new-era': 'New Era',
  'entry-point': 'Entry Point',
}

const DIFFICULTY_COLORS: Record<LearnDifficulty, string> = {
  foundation: 'bg-primary-container text-on-primary-container',
  beginner: 'bg-secondary-container text-on-secondary-container',
  intermediate: 'bg-tertiary-container text-on-tertiary-container',
  advanced: 'bg-error/10 text-error',
  'new-era': 'bg-[#a855f7]/10 text-[#7c3aed]',
  'entry-point': 'bg-primary-fixed text-on-surface',
}

function ModuleCard({ module }: { module: LearnModuleWithProgress }) {
  const svgArt = MODULE_SVG_ART[module.slug] ?? ''
  const hasSomeProgress = module.completed_chapters > 0
  const isComplete = module.completed_chapters >= module.chapter_count

  return (
    <Link href={`/learn/${module.slug}`} className="group block">
      <div className="bg-surface-container rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
        {/* Cover band */}
        <div
          className="relative h-[100px] overflow-hidden"
          style={{ backgroundColor: module.cover_color }}
        >
          {svgArt && (
            <div
              className="absolute inset-0 opacity-60"
              dangerouslySetInnerHTML={{ __html: svgArt }}
            />
          )}
          <div className="absolute inset-0 flex items-end p-4">
            <h3 className="font-headline text-xl font-bold text-white leading-tight">
              {module.name}
            </h3>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          {/* Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold font-label rounded-full px-2.5 py-0.5 ${DIFFICULTY_COLORS[module.difficulty]}`}>
              {DIFFICULTY_LABELS[module.difficulty]}
            </span>
            <span className="text-xs font-semibold font-label bg-surface-container-highest text-on-surface-variant rounded-full px-2.5 py-0.5">
              {module.chapter_count} chapters
            </span>
          </div>

          {/* Tagline */}
          <p className="text-sm text-on-surface-variant leading-snug line-clamp-2">
            {module.tagline}
          </p>

          {/* Progress bar */}
          {hasSomeProgress && (
            <div className="h-1.5 w-full rounded-full bg-surface-container-highest overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${module.progress_percentage}%`,
                  backgroundColor: module.accent_color,
                }}
              />
            </div>
          )}

          {/* Stats row + CTA */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-on-surface-variant font-label">
              {hasSomeProgress
                ? `${module.completed_chapters}/${module.chapter_count} done · ~${module.est_minutes} min`
                : `~${module.est_minutes} min`}
            </span>
            <span
              className="text-xs font-semibold font-label group-hover:underline"
              style={{ color: module.accent_color }}
            >
              {isComplete ? 'Review →' : hasSomeProgress ? 'Continue →' : 'Start →'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function LearnPage() {
  const { modules, isLoading, error } = useLearnModules()

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-headline text-3xl font-bold text-on-surface">Learn</h1>
        <p className="text-on-surface-variant mt-1">
          Build your mental models. Then apply them in Practice.
        </p>
      </div>

      {/* Module grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="bg-surface-container rounded-xl h-60 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-error text-sm">{error}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map(m => (
            <ModuleCard key={m.id} module={m} />
          ))}
        </div>
      )}
    </div>
  )
}

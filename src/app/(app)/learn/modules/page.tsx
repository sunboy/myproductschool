'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useLearnModules } from '@/hooks/useLearnModules'
import type { LearnDifficulty, LearnModuleWithProgress } from '@/lib/types'

const DIFFICULTIES: Array<{ id: LearnDifficulty | 'all'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'foundation', label: 'Foundation' },
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
  { id: 'new-era', label: 'New Era' },
]

function ModuleCard({ module }: { module: LearnModuleWithProgress }) {
  return (
    <Link href={`/learn/${module.slug}`} className="flex flex-col gap-3 bg-surface-container rounded-xl p-5 hover:bg-surface-container-high transition-colors">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: (module.cover_color ?? '#4a7c59') + '33' }}>
        <span className="material-symbols-outlined text-xl" style={{ color: module.cover_color ?? '#4a7c59', fontVariationSettings: "'FILL' 0" }}>auto_stories</span>
      </div>
      <div>
        <div className="font-label text-sm font-bold text-on-surface mb-1">{module.name}</div>
        <div className="font-body text-xs text-on-surface-variant line-clamp-2">{module.tagline}</div>
      </div>
      {module.completed_chapters > 0 && (
        <div className="h-1 bg-surface-container-highest rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full" style={{ width: `${module.progress_percentage}%` }} />
        </div>
      )}
      <div className="flex items-center justify-between">
        <span className="font-label text-[10px] text-on-surface-variant capitalize">{module.difficulty}</span>
        <span className="font-label text-[10px] text-on-surface-variant">
          {module.completed_chapters > 0 ? `${module.completed_chapters}/${module.chapter_count} done` : `~${module.est_minutes} min`}
        </span>
      </div>
    </Link>
  )
}

export default function ModulesPage() {
  const { modules, isLoading } = useLearnModules()
  const [filter, setFilter] = useState<LearnDifficulty | 'all'>('all')
  const filtered = filter === 'all' ? modules : modules.filter(m => m.difficulty === filter)

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      <div className="flex items-center gap-2 mb-5 font-label text-xs text-on-surface-variant">
        <Link href="/learn" className="hover:text-primary transition-colors">Learn</Link>
        <span>/</span>
        <span className="text-on-surface font-bold">Modules</span>
      </div>
      <h1 className="font-headline text-2xl font-bold text-on-surface mb-1">Course Modules</h1>
      <p className="font-body text-sm text-on-surface-variant mb-6">Self-paced theory, from foundations to the new era of AI</p>

      <div className="flex gap-2 flex-wrap mb-6">
        {DIFFICULTIES.map(d => (
          <button key={d.id} onClick={() => setFilter(d.id)}
            className={`font-label text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${filter === d.id ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container text-on-surface-variant border-outline-variant hover:border-primary hover:text-primary'}`}>
            {d.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {isLoading
          ? Array(6).fill(0).map((_, i) => <div key={i} className="h-44 bg-surface-container rounded-xl animate-pulse" />)
          : filtered.map(m => <ModuleCard key={m.id} module={m} />)
        }
      </div>
    </div>
  )
}

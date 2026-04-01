'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useStudyPlans } from '@/hooks/useStudyPlans'
import type { StudyPlan } from '@/lib/types'

const FLOW_FILTERS = [
  { id: 'all',      label: 'All' },
  { id: 'frame',    label: '◇ Frame' },
  { id: 'list',     label: '◈ List' },
  { id: 'optimize', label: '◆ Optimize' },
  { id: 'win',      label: '◎ Win' },
]

const MOVE_COLORS: Record<string, string> = {
  frame: '#3b5bdb', list: '#4a7c59', optimize: '#705c30', win: '#6b21a8',
}

function StudyPlanCard({ plan }: { plan: StudyPlan }) {
  const moveColor = plan.move_tag ? MOVE_COLORS[plan.move_tag] ?? '#4a7c59' : '#4a7c59'
  return (
    <Link href={`/learn/plans/${plan.slug}`}
      className="flex flex-col gap-3 bg-surface-container rounded-xl p-5 hover:bg-surface-container-high transition-colors"
      style={{ borderTop: `3px solid ${moveColor}` }}>
      <div className="flex gap-1.5 flex-wrap">
        {plan.move_tag && <span className="font-label text-[10px] font-bold px-2 py-0.5 rounded-full capitalize" style={{ background: moveColor + '20', color: moveColor }}>{plan.move_tag}</span>}
        {plan.role_tags?.slice(0, 2).map(r => <span key={r} className="font-label text-[10px] px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container">{r}</span>)}
      </div>
      <div className="font-label text-sm font-bold text-on-surface leading-snug">{plan.title}</div>
      <div className="font-body text-xs text-on-surface-variant line-clamp-2">{plan.description ?? ''}</div>
      <div className="h-1 bg-surface-container-highest rounded-full overflow-hidden mt-auto">
        <div className="h-full bg-primary rounded-full" style={{ width: '0%' }} />
      </div>
      <div className="font-label text-[10px] text-on-surface-variant">{plan.challenge_count ?? 0} challenges · ~{plan.estimated_hours} hrs</div>
    </Link>
  )
}

export default function PlansPage() {
  const { plans, isLoading } = useStudyPlans()
  const [filter, setFilter] = useState('all')
  const filtered = filter === 'all' ? plans : plans.filter(p => p.move_tag?.toLowerCase() === filter)

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      <div className="flex items-center gap-2 mb-5 font-label text-xs text-on-surface-variant">
        <Link href="/learn" className="hover:text-primary transition-colors">Learn</Link>
        <span>/</span>
        <span className="text-on-surface font-bold">Study Plans</span>
      </div>
      <h1 className="font-headline text-2xl font-bold text-on-surface mb-1">Study Plans</h1>
      <p className="font-body text-sm text-on-surface-variant mb-6">Curated challenge paths — by FLOW move, role, or level</p>

      <div className="flex gap-2 flex-wrap mb-6">
        {FLOW_FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`font-label text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${filter === f.id ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container text-on-surface-variant border-outline-variant hover:border-primary hover:text-primary'}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading
          ? Array(6).fill(0).map((_, i) => <div key={i} className="h-44 bg-surface-container rounded-xl animate-pulse" />)
          : filtered.map(p => <StudyPlanCard key={p.id} plan={p} />)
        }
      </div>
    </div>
  )
}

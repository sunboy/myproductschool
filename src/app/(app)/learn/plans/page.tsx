'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useStudyPlans } from '@/hooks/useStudyPlans'
import { useMoveLevels } from '@/hooks/useMoveLevels'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import type { StudyPlan, FlowMove } from '@/lib/types'

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

interface PersonalisedPlan {
  id: string
  title: string
  luma_rationale: string
  status: string
  move_sequence: Array<{ week: number; focus_move: string; theme: string; challenge_ids: string[] }>
}

function PersonalisedPlanCard() {
  const [plan, setPlan] = useState<PersonalisedPlan | null | undefined>(undefined) // undefined = loading
  const [generating, setGenerating] = useState(false)
  const [rebuilding, setRebuilding] = useState(false)

  useEffect(() => {
    fetch('/api/study-plans/personalised')
      .then(r => r.json())
      .then(data => setPlan(data.plan ?? null))
      .catch(() => setPlan(null))
  }, [])

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/study-plans/personalised/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      setPlan(data)
    } finally {
      setGenerating(false)
    }
  }

  const handleRebuild = async () => {
    setRebuilding(true)
    try {
      const res = await fetch('/api/study-plans/personalised/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true }),
      })
      const data = await res.json()
      setPlan(data)
    } finally {
      setRebuilding(false)
    }
  }

  // Loading state
  if (plan === undefined) {
    return <div className="h-32 bg-surface-container rounded-xl animate-pulse mb-6" />
  }

  // No plan — show CTA
  if (plan === null) {
    return (
      <div className="bg-surface-container rounded-xl p-6 mb-6 border border-outline-variant flex items-center gap-4">
        <LumaGlyph size={40} state={generating ? 'reviewing' : 'idle'} className="text-primary shrink-0" />
        <div className="flex-1">
          <p className="font-headline text-base text-on-surface font-semibold mb-1">Build your personalised study plan</p>
          <p className="font-body text-sm text-on-surface-variant mb-3">Luma will create a custom 4-week plan based on your calibration results and current skill level.</p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="bg-primary text-on-primary rounded-full px-5 py-2 font-label text-sm font-semibold disabled:opacity-60"
          >
            {generating ? 'Building...' : 'Build my plan'}
          </button>
        </div>
      </div>
    )
  }

  // Plan exists — show hero card
  return (
    <div className="bg-primary-container rounded-xl p-6 mb-6 border border-outline-variant">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <LumaGlyph size={40} state={rebuilding ? 'reviewing' : 'speaking'} className="text-primary shrink-0" />
        <div className="flex-1">
          <p className="font-label text-xs text-primary font-semibold uppercase tracking-wide mb-0.5">Your Plan — by Luma</p>
          <h2 className="font-headline text-lg text-on-surface font-semibold">{plan.title}</h2>
          <p className="font-body text-sm text-on-surface-variant mt-1">{plan.luma_rationale}</p>
        </div>
      </div>

      {/* Week breakdown */}
      <div className="space-y-2 mb-4">
        {plan.move_sequence?.map((week: { week: number; focus_move: string; theme: string; challenge_ids: string[] }) => (
          <div key={week.week} className="bg-surface rounded-lg px-4 py-2.5 flex items-center justify-between">
            <div>
              <span className="font-label text-xs text-on-surface-variant">Week {week.week} — {week.theme}</span>
              <p className="font-body text-sm text-on-surface">{week.challenge_ids.length} challenge{week.challenge_ids.length !== 1 ? 's' : ''} · {week.focus_move} move</p>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant text-xl">arrow_forward</span>
          </div>
        ))}
      </div>

      {/* Rebuild button */}
      <button
        onClick={handleRebuild}
        disabled={rebuilding}
        className="font-label text-xs text-primary hover:underline flex items-center gap-1 disabled:opacity-60"
      >
        {rebuilding ? <LumaGlyph size={16} state="reviewing" className="text-primary" /> : null}
        {rebuilding ? 'Rebuilding...' : 'Rebuild plan'}
      </button>
    </div>
  )
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

function getLumaPickReason(move: FlowMove): string {
  switch (move) {
    case 'frame':
      return 'Framing problems clearly is your growth edge — this plan targets it directly.'
    case 'list':
      return 'Generating strong solution lists is your next unlock — this plan is built for it.'
    case 'weigh':
      return 'Your weigh move is your growth area — this plan builds trade-off thinking directly.'
    case 'sell':
      return 'Communicating decisions is your next unlock — this plan sharpens your sell move.'
    default:
      return 'This plan matches your current skill level.'
  }
}

export default function PlansPage() {
  const { plans, isLoading } = useStudyPlans()
  const { moves, isLoading: movesLoading } = useMoveLevels()
  const [filter, setFilter] = useState('all')
  const filtered = filter === 'all' ? plans : plans.filter(p => p.move_tag?.toLowerCase() === filter)

  // Derive weakest FLOW move — lowest level, then lowest xp as tiebreaker
  const weakestMove = useMemo<FlowMove | null>(() => {
    if (!moves.length) return null
    const sorted = [...moves].sort((a, b) => a.level !== b.level ? a.level - b.level : a.xp - b.xp)
    return sorted[0].move
  }, [moves])

  // Pick the first published plan that matches the weakest move
  const lumaPick = useMemo<StudyPlan | null>(() => {
    if (!weakestMove || !plans.length) return null
    return plans.find(p => p.move_tag?.toLowerCase() === weakestMove) ?? null
  }, [weakestMove, plans])

  const lumaPickReason = weakestMove ? getLumaPickReason(weakestMove) : 'This plan matches your current skill level.'

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      <div className="flex items-center gap-2 mb-5 font-label text-xs text-on-surface-variant">
        <Link href="/learn" className="hover:text-primary transition-colors">Learn</Link>
        <span>/</span>
        <span className="text-on-surface font-bold">Study Plans</span>
      </div>
      <h1 className="font-headline text-2xl font-bold text-on-surface mb-1">Study Plans</h1>
      <p className="font-body text-sm text-on-surface-variant mb-6">Curated challenge paths — by FLOW move, role, or level</p>

      <PersonalisedPlanCard />

      {!movesLoading && lumaPick && (
        <div className="bg-primary-fixed rounded-xl p-5 flex gap-4 items-start mb-6 border border-outline-variant">
          <LumaGlyph size={36} state="speaking" className="text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-label text-xs text-primary font-semibold uppercase tracking-wide mb-1">Luma&apos;s Pick</p>
            <p className="font-headline text-base text-on-surface font-semibold">{lumaPick.title}</p>
            <p className="font-body text-sm text-on-surface-variant mt-1">{lumaPickReason}</p>
          </div>
        </div>
      )}

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

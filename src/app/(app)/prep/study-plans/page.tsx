'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import { useStudyPlans } from '@/hooks/useStudyPlans'

/* ---------- mock data (fallback) ---------- */
const PLANS_MOCK = [
  {
    slug: 'pm-interview-bootcamp',
    name: 'PM Interview Bootcamp',
    moveTag: 'Multi-move', moveTagBg: 'bg-[#f3e8ff]', moveTagText: 'text-[#6b21a8]',
    roleTag: 'PM', borderColor: '#8b5cf6',
    level: 'INTERMEDIATE',
    description: 'Comprehensive roadmap covering design, metrics, and strategy for top-tier roles.',
    challenges: 10, time: '~5 hrs',
    progress: { done: 3, total: 10, pct: 30 },
    progressColor: 'bg-gradient-to-r from-primary to-purple-500',
    cta: 'Continue',
  },
  {
    slug: 'engineers-product-intuition',
    name: "Engineer's Product Intuition",
    moveTag: 'Frame+List', moveTagBg: 'bg-[#e8f0ff]', moveTagText: 'text-[#3b5bdb]',
    roleTag: 'Engineer', borderColor: '#3b5bdb',
    level: 'BEGINNER',
    description: 'Bridge the gap between technical execution and user-centric product thinking.',
    challenges: 6, time: '~2.5 hrs',
    cta: 'View Plan',
  },
  {
    slug: 'metrics-mastery',
    name: 'Metrics Mastery',
    moveTag: 'List', moveTagBg: 'bg-[#c8e8d0]', moveTagText: 'text-primary',
    roleTag: 'PM+Engineer', borderColor: '#4a7c59',
    level: 'COMPLETE', levelColor: 'text-green-600',
    description: 'Define, track, and optimize the numbers that actually move the needle for your team.',
    challenges: 6, time: '~3 hrs',
    progress: { done: 6, total: 6, pct: 100 },
    progressColor: 'bg-primary',
    progressTrack: 'bg-green-100',
    cta: 'View Plan',
  },
  {
    slug: 'tradeoff-thinking',
    name: 'Tradeoff Thinking',
    moveTag: 'Optimize', moveTagBg: 'bg-[#fef3c7]', moveTagText: 'text-tertiary',
    roleTag: 'Engineer', borderColor: '#705c30',
    level: 'ADVANCED',
    description: 'Master the art of architectural and product decision making under constraints.',
    challenges: 8, time: '~4 hrs',
    cta: 'View Plan',
  },
  {
    slug: 'storytelling-for-engineers',
    name: 'Storytelling for Engineers',
    moveTag: 'Win', moveTagBg: 'bg-[#f3e8ff]', moveTagText: 'text-[#6b21a8]',
    roleTag: 'Engineer', borderColor: '#a855f7',
    level: 'INTERMEDIATE',
    description: 'Pitch technical ideas effectively and gain buy-in from non-technical stakeholders.',
    challenges: 7, time: '~2 hrs',
    progress: { done: 1, total: 7, pct: 14 },
    progressColor: 'bg-purple-500',
    cta: 'Continue',
  },
  {
    slug: 'discovery-deep-dive',
    name: 'Discovery Deep Dive',
    moveTag: 'Frame', moveTagBg: 'bg-[#e8f0ff]', moveTagText: 'text-[#3b5bdb]',
    roleTag: 'Designer+PM', borderColor: '#60a5fa',
    level: 'BEGINNER',
    description: 'Learn to run user interviews and synthesize insights into actionable frameworks.',
    challenges: 5, time: '~3 hrs',
    cta: 'View Plan',
  },
  {
    slug: 'system-design-as-pm',
    name: 'System Design as a PM',
    moveTag: 'Optimize+List', moveTagBg: 'bg-[#fef3c7]', moveTagText: 'text-tertiary',
    roleTag: 'PM', borderColor: '#c4a66a',
    level: 'ADVANCED',
    description: 'Understand technical architecture to make better product tradeoffs and estimates.',
    challenges: 9, time: '~6 hrs',
    cta: 'View Plan',
  },
  {
    slug: 'growth-loops-retention',
    name: 'Growth Loops & Retention',
    moveTag: 'List+Win', moveTagBg: 'bg-[#c8e8d0]', moveTagText: 'text-primary',
    roleTag: 'PM', borderColor: '#78a886',
    level: 'INTERMEDIATE',
    description: 'Analyze viral mechanics and sustainable product growth through loops.',
    challenges: 12, time: '~4.5 hrs',
    cta: 'View Plan',
  },
  {
    slug: '30-day-faang-prep',
    name: '30-Day FAANG Prep',
    moveTag: 'Multi-move', moveTagBg: 'bg-secondary-container', moveTagText: 'text-on-surface',
    roleTag: 'PM+Engineer', borderColor: '#fb923c',
    level: 'EXPERT',
    description: 'Intensive daily curriculum focused on the most common Big Tech product questions.',
    challenges: 30, time: '~15 hrs',
    rainbowBar: true,
    cta: 'View Plan',
  },
]

const FLOW_FILTERS = [
  { label: 'All', active: true },
  { label: 'Frame', symbol: '◇', color: 'text-[#3b5bdb]' },
  { label: 'List', symbol: '◈', color: 'text-primary' },
  { label: 'Optimize', symbol: '◆', color: 'text-tertiary' },
  { label: 'Win', symbol: '◎', color: 'text-[#6b21a8]' },
]

const MOVE_COLORS: Record<string, string> = {
  frame: '#3b5bdb', list: '#4a7c59', optimize: '#705c30', win: '#6b21a8',
}

export default function StudyPlansPage() {
  const { plans: apiPlans, isLoading } = useStudyPlans()
  const [insightDismissed, setInsightDismissed] = useState(false)

  // Map API plans to display format, fall back to mock if empty
  const plans: typeof PLANS_MOCK = apiPlans.length > 0
    ? apiPlans.map(p => ({
        slug: p.slug,
        name: p.title,
        moveTag: p.move_tag ? p.move_tag.charAt(0).toUpperCase() + p.move_tag.slice(1) : 'Multi-move',
        moveTagBg: p.move_tag ? 'bg-secondary-container' : 'bg-secondary-container',
        moveTagText: p.move_tag ? 'text-on-surface' : 'text-on-surface',
        roleTag: p.role_tags.join('+') || 'PM',
        borderColor: p.move_tag ? (MOVE_COLORS[p.move_tag] ?? '#4a7c59') : '#4a7c59',
        level: 'INTERMEDIATE' as const,
        description: p.description ?? '',
        challenges: p.challenge_count,
        time: `~${p.estimated_hours} hrs`,
        cta: 'View Plan' as const,
      }))
    : PLANS_MOCK

  return (
    <div className="max-w-7xl mx-auto px-4 pt-4 pb-12 space-y-6 animate-fade-in-up">

      {/* ── Personalized Path CTA ── */}
      <div className="bg-primary text-white rounded-xl p-5 mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="font-headline font-bold text-lg mb-1">Building toward something specific?</h2>
          <p className="text-sm text-white/80">Tell us your target role and interview date — we&apos;ll recommend the right plan and pace.</p>
        </div>
        <Link
          href="/prep"
          className="bg-white text-primary px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap hover:bg-white/90 transition-colors shrink-0"
        >
          Set my goal →
        </Link>
      </div>

      {/* ── Header ── */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black text-on-surface font-headline">Study Plans</h1>
            <LumaGlyph size={40} state="idle" className="text-primary" />
          </div>
          <p className="text-sm text-on-surface-variant font-body">Structured paths to sharpen your FLOW skills</p>
        </div>
        <div className="flex gap-2">
          {FLOW_FILTERS.map((f) => (
            <button
              key={f.label}
              className={`rounded-full px-4 py-1.5 text-xs font-bold flex items-center gap-1.5 ${
                f.active ? 'bg-primary text-white' : 'bg-surface-container hover:bg-surface-container-high'
              }`}
            >
              {f.symbol && <span className={f.color}>{f.symbol}</span>}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Plans Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {plans.map((plan) => (
          <Link
            key={plan.slug}
            href={`/prep/study-plans/${plan.slug}`}
            className="group bg-surface-container rounded-xl p-5 hover:bg-surface-container-high transition-all cursor-pointer relative flex flex-col h-full"
            style={{ borderTop: `4px solid ${plan.borderColor}` }}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex flex-wrap gap-1.5">
                <span className={`${plan.moveTagBg} ${plan.moveTagText} text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider`}>
                  {plan.moveTag}
                </span>
                <span className="bg-secondary-container text-on-surface text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                  {plan.roleTag}
                </span>
              </div>
              {plan.level === 'COMPLETE' ? (
                <span className="text-[10px] text-green-600 font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> COMPLETE
                </span>
              ) : (
                <span className="text-[10px] text-on-surface-variant font-bold">{plan.level}</span>
              )}
            </div>

            <h3 className="text-lg font-bold mb-2 leading-tight">{plan.name}</h3>
            <p className="text-xs text-on-surface-variant mb-4 flex-grow">{plan.description}</p>

            {/* Progress or empty bar */}
            {plan.progress ? (
              <div className="mb-4">
                <div className={`flex justify-between text-[10px] font-bold mb-1 ${plan.level === 'COMPLETE' ? 'text-green-600' : 'text-primary'}`}>
                  <span>Progress: {plan.progress.done}/{plan.progress.total} complete{plan.level === 'COMPLETE' ? ' ✓' : ''}</span>
                  <span>{plan.progress.pct}%</span>
                </div>
                <div className={`w-full h-1 rounded-full overflow-hidden ${plan.progressTrack || 'bg-outline-variant'}`}>
                  <div className={`h-full ${plan.progressColor}`} style={{ width: `${plan.progress.pct}%` }} />
                </div>
              </div>
            ) : plan.rainbowBar ? (
              <div className="h-1 bg-gradient-to-r from-red-400 via-yellow-400 to-blue-400 rounded-full w-full mb-4" />
            ) : (
              <div className="h-1 bg-outline-variant rounded-full w-full mb-4" />
            )}

            <div className="flex items-center justify-between mt-auto">
              <div className="flex items-center gap-3 text-[10px] text-on-surface-variant font-semibold">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">menu_book</span> {plan.challenges} challenges
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">schedule</span> {plan.time}
                </span>
              </div>
              <span className="text-primary text-xs font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                {plan.cta} <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Luma Insight ── */}
      {!insightDismissed && (
        <div className="bg-primary-fixed rounded-xl p-4 flex items-center gap-5 border border-outline-variant">
          <LumaGlyph size={48} state="speaking" className="text-primary shrink-0" />
          <div className="flex-1">
            <h4 className="font-headline font-bold text-primary text-sm mb-0.5">Luma&apos;s Insight</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              &ldquo;Consistent practice is key! Completion rates are 45% higher for users who finish at least one challenge in a Study Plan every 48 hours.&rdquo;
            </p>
          </div>
          <button
            onClick={() => setInsightDismissed(true)}
            className="text-xs font-bold bg-white text-primary px-4 py-1.5 rounded-full border border-primary hover:bg-primary hover:text-white transition-colors"
          >
            Got it!
          </button>
        </div>
      )}
    </div>
  )
}

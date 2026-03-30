import Link from 'next/link'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import type { StudyPlan } from '@/lib/types'

const ROLES = ['All', 'SWE', 'Data Eng', 'ML Eng', 'DevOps', 'EM', 'Founding Eng'] as const

const PARADIGMS = [
  {
    name: 'Traditional',
    description: 'Metrics, trade-offs, and prioritization — the core toolkit every PM needs cold.',
    challengeCount: '~150 challenges',
    icon: 'architecture',
    borderClass: 'border-lens',
    bgClass: 'bg-lens-tint',
    iconClass: 'text-lens',
  },
  {
    name: 'AI-Assisted',
    description: 'Know when to trust AI output — prompting, validation, and keeping human judgment sharp.',
    challengeCount: '~50 challenges',
    icon: 'smart_toy',
    borderClass: 'border-frame',
    bgClass: 'bg-frame-tint',
    iconClass: 'text-frame',
  },
  {
    name: 'Agentic',
    description: 'Design multi-step AI systems — agents, evals, failure modes, and trust boundaries.',
    challengeCount: '~70 challenges',
    icon: 'hub',
    borderClass: 'border-win',
    bgClass: 'bg-win-tint',
    iconClass: 'text-win',
  },
  {
    name: 'AI-Native',
    description: "Products that couldn't exist without AI — new interaction models, new risks.",
    challengeCount: '~70 challenges',
    icon: 'neurology',
    borderClass: 'border-optimize',
    bgClass: 'bg-optimize-tint',
    iconClass: 'text-optimize',
  },
] as const

const STUDY_PLANS_MOCK = [
  {
    title: 'Staff Engineer Path',
    roles: ['SWE'],
    duration: '6 weeks',
    description: 'Strategic technical leadership and high-stakes decision making.',
    slug: 'staff-engineer-path',
    participantCount: '+12',
  },
  {
    title: '7-Day Prep',
    roles: ['SWE', 'Data', 'ML'],
    duration: '7 days',
    description: 'Intensive crash course for top-tier system design rounds.',
    slug: '7-day-prep',
    participantCount: '+82',
  },
  {
    title: 'AI Product Fluency',
    roles: ['SWE', 'ML', 'Founding'],
    duration: '4 weeks',
    description: 'Bridge the gap between engineering and AI product strategy.',
    slug: 'ai-product-fluency',
    participantCount: '+45',
  },
]

interface ExplorePageProps {
  searchParams: Promise<{ role?: string; paradigm?: string }>
}

async function fetchStudyPlans(): Promise<typeof STUDY_PLANS_MOCK> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/study-plans?limit=3`, { next: { revalidate: 300 } })
    if (!res.ok) return STUDY_PLANS_MOCK
    const data: StudyPlan[] = await res.json()
    if (!data?.length) return STUDY_PLANS_MOCK
    return data.map(p => ({
      title: p.title,
      roles: p.role_tags,
      duration: `${p.estimated_hours} hrs`,
      description: p.description ?? '',
      slug: p.slug,
      participantCount: '+0',
    }))
  } catch {
    return STUDY_PLANS_MOCK
  }
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const { role, paradigm } = await searchParams
  const activeRole = role || 'All'
  const activeParadigm = paradigm || null

  const studyPlans = await fetchStudyPlans()

  const buildHref = (r: string) => {
    const params = new URLSearchParams()
    if (r !== 'All') params.set('role', r)
    if (activeParadigm) params.set('paradigm', activeParadigm)
    const qs = params.toString()
    return qs ? `/explore?${qs}` : '/explore'
  }

  const buildParadigmHref = (name: string) => {
    const params = new URLSearchParams()
    if (activeRole !== 'All') params.set('role', activeRole)
    if (activeParadigm === name) {
      // Deselect — remove paradigm param
      const qs = params.toString()
      return qs ? `/explore?${qs}` : '/explore'
    }
    params.set('paradigm', name)
    return `/explore?${params.toString()}`
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 animate-fade-in-up">
      {/* Header Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-headline text-2xl font-extrabold text-on-surface leading-tight">Explore Hub</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Browse by paradigm, plan your path, or dive into concepts</p>
        </div>
      </section>

      {/* Role Filter Row */}
      <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
        {ROLES.map(r => (
          <Link
            key={r}
            href={buildHref(r)}
            className={`px-5 py-1.5 rounded-full text-xs font-bold shadow-sm transition-all ${
              activeRole === r
                ? 'bg-primary text-on-primary'
                : 'bg-surface-variant text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {r}
          </Link>
        ))}
      </div>

      {/* Luma Recommendation Banner */}
      <section className="bg-primary-container/40 border border-primary-container rounded-xl p-4 flex items-center gap-4">
        <LumaGlyph size={40} state="speaking" className="text-primary shrink-0" />
        <div className="relative bg-white/60 px-4 py-2 rounded-2xl rounded-tl-none border border-white/40">
          <p className="text-sm text-on-primary-container font-medium leading-relaxed">
            Based on your scores, I recommend starting with{' '}
            <span className="font-bold underline decoration-primary/30">Traditional → Failure Analysis</span>.
          </p>
        </div>
      </section>

      {/* Paradigms — compact 4-column strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {PARADIGMS.map(p => {
          const isActive = activeParadigm === p.name
          return (
            <Link
              key={p.name}
              href={buildParadigmHref(p.name)}
              className={`rounded-xl p-4 border-l-4 ${p.borderClass} hover:bg-surface-container transition-colors relative ${
                isActive
                  ? 'bg-surface-container ring-2 ring-primary/30'
                  : 'bg-surface-container-low'
              }`}
            >
              {isActive && (
                <span className="absolute top-2 right-2 material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
              )}
              {/* Icon + name on same row */}
              <div className="flex items-center gap-2 mb-2">
                <div className={`inline-flex p-1.5 ${p.bgClass} rounded-lg ${p.iconClass} shrink-0`}>
                  <span className="material-symbols-outlined text-[16px]">{p.icon}</span>
                </div>
                <h3 className="font-headline text-sm font-bold leading-tight">{p.name}</h3>
              </div>
              <p className="text-[11px] text-on-surface-variant leading-snug mb-1.5">{p.description}</p>
              <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">{p.challengeCount}</p>
            </Link>
          )
        })}
      </div>


      {/* Study Plans Section */}
      <section className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="font-headline text-lg font-bold text-on-surface">Study Plans</h2>
          <Link href="/prep/study-plans" className="text-xs font-bold text-primary hover:underline">
            View All
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {studyPlans.map(plan => (
            <Link
              key={plan.slug}
              href={`/prep/study-plans/${plan.slug}`}
              className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/30 flex flex-col justify-between hover:shadow-sm transition-shadow"
            >
              <div>
                <div className="flex justify-between mb-3">
                  <div className="flex gap-1 flex-wrap">
                    {plan.roles.map(r => (
                      <span
                        key={r}
                        className="bg-secondary-container text-secondary text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                  <span className="text-[10px] text-on-surface-variant font-medium">{plan.duration}</span>
                </div>
                <h4 className="font-headline text-base font-bold mb-1">{plan.title}</h4>
                <p className="text-xs text-on-surface-variant leading-snug">{plan.description}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-outline-variant/20 flex items-center justify-between">
                {/* Wes Kao: larger social proof avatars, more visible participant count */}
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    <div className="w-7 h-7 rounded-full bg-primary-fixed ring-2 ring-surface-container-low flex items-center justify-center text-[9px] font-bold text-primary">A</div>
                    <div className="w-7 h-7 rounded-full bg-tertiary-container ring-2 ring-surface-container-low flex items-center justify-center text-[9px] font-bold text-tertiary">B</div>
                    <div className="w-7 h-7 rounded-full bg-secondary-container ring-2 ring-surface-container-low flex items-center justify-center text-[9px] font-bold text-secondary">C</div>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-on-surface">{plan.participantCount} engineers</span>
                    <span className="text-[10px] text-on-surface-variant block">enrolled</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-primary px-3 py-1.5 rounded-full border border-primary/20 hover:bg-primary/5">
                  Start
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

import Link from 'next/link'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import type { StudyPlan, AutopsyProduct, DomainWithProgress } from '@/lib/types'
import { getShowcaseProducts } from '@/lib/data/showcase'

const ROLES = ['All', 'SWE', 'Data Eng', 'ML Eng', 'DevOps', 'EM', 'Founding Eng'] as const

const PARADIGMS = [
  {
    name: 'Traditional',
    description: 'Metrics, trade-offs, and prioritization — the core toolkit for senior and Staff roles.',
    exampleChallenge: 'DAU/MAU looks great but revenue is flat. What\'s going on?',
    challengeCount: 'Core collection',
    icon: 'architecture',
    borderClass: 'border-lens',
    bgClass: 'bg-lens-tint',
    iconClass: 'text-lens',
  },
  {
    name: 'AI-Assisted',
    description: 'When to trust AI output, how to validate, and keeping human judgment sharp.',
    exampleChallenge: 'Your Copilot code passes tests but introduces a subtle security flaw.',
    challengeCount: 'Growing library',
    icon: 'smart_toy',
    borderClass: 'border-frame',
    bgClass: 'bg-frame-tint',
    iconClass: 'text-frame',
  },
  {
    name: 'Agentic',
    description: 'Design multi-step AI systems — agents, evals, failure modes, and trust boundaries.',
    exampleChallenge: 'Your agent auto-approved 40 refunds overnight. 3 were fraudulent.',
    challengeCount: 'Growing library',
    icon: 'hub',
    borderClass: 'border-win',
    bgClass: 'bg-win-tint',
    iconClass: 'text-win',
  },
  {
    name: 'AI-Native',
    description: "Products that couldn't exist without AI — entirely new interaction models and risks.",
    exampleChallenge: 'Your AI tutor is great at math but hallucinates history. Ship or hold?',
    challengeCount: 'Growing library',
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
    participantCount: '',
  },
  {
    title: '7-Day Prep',
    roles: ['SWE', 'Data', 'ML'],
    duration: '7 days',
    description: 'Intensive crash course for top-tier system design rounds.',
    slug: '7-day-prep',
    participantCount: '',
  },
  {
    title: 'AI Product Fluency',
    roles: ['SWE', 'ML', 'Founding'],
    duration: '4 weeks',
    description: 'Bridge the gap between engineering and AI product strategy.',
    slug: 'ai-product-fluency',
    participantCount: '',
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
      roles: p.role_tags ?? [],
      duration: `${p.estimated_hours} hrs`,
      description: p.description ?? '',
      slug: p.slug,
      participantCount: (p as unknown as { participant_count?: number }).participant_count
        ? `+${(p as unknown as { participant_count: number }).participant_count}`
        : '',
    }))
  } catch {
    return STUDY_PLANS_MOCK
  }
}

interface ModuleSummary {
  id: string
  slug: string
  name: string
  tagline: string
  cover_color: string | null
  chapter_count: number
  est_minutes: number
}

async function fetchModules(): Promise<ModuleSummary[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/learn?limit=8`, { next: { revalidate: 300 } })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : (data.modules ?? [])
  } catch {
    return []
  }
}

async function fetchDomains(): Promise<DomainWithProgress[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/domains`, { next: { revalidate: 300 } })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : (data.domains ?? [])
  } catch {
    return []
  }
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const { role, paradigm } = await searchParams
  const activeRole = role || 'All'
  const activeParadigm = paradigm || null

  const [studyPlans, showcaseProducts, modules, domains] = await Promise.all([
    fetchStudyPlans().catch(() => [] as Awaited<ReturnType<typeof fetchStudyPlans>>),
    getShowcaseProducts().catch(() => [] as AutopsyProduct[]),
    fetchModules().catch(() => [] as ModuleSummary[]),
    fetchDomains().catch(() => [] as DomainWithProgress[]),
  ])

  const buildHref = (r: string) => {
    const params = new URLSearchParams()
    if (r !== 'All') params.set('role', r)
    if (activeParadigm) params.set('paradigm', activeParadigm)
    const qs = params.toString()
    return qs ? `/explore?${qs}` : '/explore'
  }

  const buildParadigmHref = (name: string) => {
    // Navigate to Practice Hub filtered by this paradigm
    const params = new URLSearchParams()
    params.set('paradigm', name.toLowerCase().replace(' ', '-'))
    if (activeRole !== 'All') params.set('role', activeRole)
    return `/challenges?${params.toString()}`
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 animate-fade-in-up">
      {/* Header Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-headline text-2xl font-extrabold text-on-surface leading-tight">Explore Hub</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Real scenarios from real companies. Pick a paradigm or follow a structured plan.</p>
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
        <div className="relative bg-white/60 px-4 py-2 rounded-2xl rounded-tl-none border border-white/40 flex-1">
          <p className="text-sm text-on-primary-container font-medium leading-relaxed">
            New here? Start with a <strong>Traditional</strong> challenge to baseline your thinking, then explore AI paradigms once you have your skill radar.
          </p>
        </div>
      </section>

      {/* Paradigms — compact 4-column strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {PARADIGMS.map(p => {
          return (
            <Link
              key={p.name}
              href={buildParadigmHref(p.name)}
              className={`rounded-xl p-4 border-l-4 ${p.borderClass} bg-surface-container-low hover:bg-surface-container hover:shadow-sm transition-all group relative`}
            >
              {/* Icon + name on same row */}
              <div className="flex items-center gap-2 mb-2">
                <div className={`inline-flex p-1.5 ${p.bgClass} rounded-lg ${p.iconClass} shrink-0`}>
                  <span className="material-symbols-outlined text-[16px]">{p.icon}</span>
                </div>
                <h3 className="font-headline text-sm font-bold leading-tight">{p.name}</h3>
                <span className="material-symbols-outlined text-on-surface-variant text-sm ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">arrow_forward</span>
              </div>
              <p className="text-[11px] text-on-surface-variant leading-snug mb-2">{p.description}</p>
              <div className="bg-white/50 rounded-lg px-2.5 py-1.5 border border-outline-variant/20 mb-1.5">
                <p className="text-[10px] text-on-surface-variant italic leading-snug">&ldquo;{p.exampleChallenge}&rdquo;</p>
              </div>
              <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">{p.challengeCount}</p>
            </Link>
          )
        })}
      </div>

      {/* ── FLOW Framework ── */}
      <Link
        href="/explore/flow"
        className="flex flex-col gap-3 bg-primary-fixed rounded-2xl p-5 hover:brightness-95 transition-all group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LumaGlyph size={28} state="speaking" className="text-primary shrink-0" />
            <div>
              <div className="font-headline font-bold text-base text-on-surface">The FLOW Framework</div>
              <div className="font-label text-xs text-on-surface-variant">How HackProduct challenges are structured</div>
            </div>
          </div>
          <span className="material-symbols-outlined text-base text-primary opacity-0 group-hover:opacity-100 transition-opacity" style={{ fontVariationSettings: "'FILL' 0" }}>arrow_forward</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { symbol: '◇', label: 'Frame', color: '#2e7d32', bg: '#e8f5e9' },
            { symbol: '◈', label: 'List', color: '#1565c0', bg: '#e3f2fd' },
            { symbol: '◆', label: 'Optimize', color: '#ad1457', bg: '#fce4ec' },
            { symbol: '◎', label: 'Win', color: '#f57f17', bg: '#fff8e1' },
          ].map(m => (
            <span key={m.label} className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-label font-bold" style={{ background: m.bg, color: m.color }}>
              {m.symbol} {m.label}
            </span>
          ))}
        </div>
        <p className="font-label text-xs font-bold text-primary">Learn how FLOW works →</p>
      </Link>

      {/* ── Course Modules ── */}
      {modules.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant">Course Modules</h2>
            <Link href="/explore/modules" className="font-label text-xs font-bold text-primary hover:underline">View all →</Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {modules.map(m => (
              <Link key={m.id} href={`/explore/modules/${m.slug}`} className="flex flex-col gap-2 bg-surface-container rounded-xl p-4 shrink-0 w-44 hover:bg-surface-container-high transition-colors">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: (m.cover_color ?? '#4a7c59') + '33' }}>
                  <span className="material-symbols-outlined text-base" style={{ color: m.cover_color ?? '#4a7c59', fontVariationSettings: "'FILL' 0" }}>auto_stories</span>
                </div>
                <div className="font-label text-sm font-bold text-on-surface leading-snug line-clamp-2">{m.name}</div>
                <div className="font-body text-xs text-on-surface-variant line-clamp-1">{m.tagline}</div>
                <div className="font-label text-[10px] text-on-surface-variant mt-auto">~{m.est_minutes} min</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Domains ── */}
      {domains.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant">Domains</h2>
            <Link href="/explore/domains" className="font-label text-xs font-bold text-primary hover:underline">View all →</Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {domains.slice(0, 10).map(d => (
              <Link key={d.id} href={`/domains/${d.slug}`} className="flex flex-col items-center gap-1.5 shrink-0 w-20 py-3 px-2 rounded-xl hover:bg-surface-container transition-colors text-center">
                <div className="w-11 h-11 rounded-2xl bg-primary-fixed flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl text-primary" style={{ fontVariationSettings: "'FILL' 0" }}>{d.icon ?? 'category'}</span>
                </div>
                <span className="font-label text-xs font-bold text-on-surface leading-tight">{d.title}</span>
                <span className="font-label text-[10px] text-on-surface-variant">{d.challenge_count} challenges</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Product Autopsies teaser ── */}
      {showcaseProducts.length > 0 && (
        <section className="mt-8">
          {/* Header row */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-headline text-xl text-on-surface">Product Autopsies</h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Trace the real decisions behind products you use every day.
              </p>
            </div>
            <Link
              href="/explore/showcase"
              className="text-xs text-primary font-label font-semibold flex items-center gap-1 hover:underline"
            >
              View all
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>
                arrow_forward
              </span>
            </Link>
          </div>

          {/* Mini product cards — horizontal scroll on mobile, 3-col on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {showcaseProducts.slice(0, 3).map(product => (
              <Link
                key={product.id}
                href={`/explore/showcase/${product.slug}`}
                className="flex items-center gap-3 bg-surface-container rounded-xl p-3 border-l-4 hover:bg-surface-container-high transition-colors"
                style={{ borderLeftColor: product.cover_color ?? '#4a7c59' }}
              >
                <span className="text-2xl shrink-0">{product.logo_emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-label text-sm font-bold text-on-surface truncate">{product.name}</p>
                  <p className="text-xs text-on-surface-variant truncate">{product.tagline}</p>
                </div>
                <span className="shrink-0 bg-secondary-container text-on-secondary-container rounded-full px-2 py-0.5 text-[10px] font-bold">
                  {product.decision_count} decisions
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

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
                {plan.participantCount ? (
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
                ) : (
                  <span className="text-xs text-on-surface-variant">Structured learning path</span>
                )}
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

import Link from 'next/link'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import type { StudyPlan, AutopsyProduct, DomainWithProgress, LearnModule } from '@/lib/types'
import { getShowcaseProducts } from '@/lib/data/showcase'
import { getStudyPlanSummaries } from '@/lib/data/study-plans'
import { getLearnModuleSummaries } from '@/lib/data/learn-modules'
import { getDomainsWithProgress } from '@/lib/data/domains'

const PARADIGMS = [
  {
    name: 'Traditional',
    description: 'Metrics, trade-offs, and prioritization — the core toolkit for senior and Staff roles.',
    exampleChallenge: 'DAU/MAU looks great but revenue is flat. What\'s going on?',
    challengeCount: 'Core collection',
    icon: 'architecture',
    borderClass: 'border-t-4 border-lens',
    bgClass: 'bg-lens-tint/40',
    iconClass: 'text-lens',
    quoteClass: 'border-l-2 border-lens pl-2',
  },
  {
    name: 'AI-Assisted',
    description: 'When to trust AI output, how to validate, and keeping human judgment sharp.',
    exampleChallenge: 'Your Copilot code passes tests but introduces a subtle security flaw.',
    challengeCount: 'Growing',
    icon: 'smart_toy',
    borderClass: 'border-t-4 border-frame',
    bgClass: 'bg-frame-tint/40',
    iconClass: 'text-frame',
    quoteClass: 'border-l-2 border-frame pl-2',
  },
  {
    name: 'Agentic',
    description: 'Design multi-step AI systems — agents, evals, failure modes, and trust boundaries.',
    exampleChallenge: 'Your agent auto-approved 40 refunds overnight. 3 were fraudulent.',
    challengeCount: 'Growing',
    icon: 'hub',
    borderClass: 'border-t-4 border-win',
    bgClass: 'bg-win-tint/40',
    iconClass: 'text-win',
    quoteClass: 'border-l-2 border-win pl-2',
  },
  {
    name: 'AI-Native',
    description: "Products that couldn't exist without AI — entirely new interaction models and risks.",
    exampleChallenge: 'Your AI tutor is great at math but hallucinates history. Ship or hold?',
    challengeCount: 'Growing',
    icon: 'neurology',
    borderClass: 'border-t-4 border-optimize',
    bgClass: 'bg-optimize-tint/40',
    iconClass: 'text-optimize',
    quoteClass: 'border-l-2 border-optimize pl-2',
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

export default async function ExplorePage() {
  const [studyPlansRaw, showcaseProducts, modules, domains] = await Promise.all([
    getStudyPlanSummaries(3).catch(() => [] as StudyPlan[]),
    getShowcaseProducts().catch(() => [] as AutopsyProduct[]),
    getLearnModuleSummaries(8).catch(() => [] as LearnModule[]),
    getDomainsWithProgress().catch(() => [] as DomainWithProgress[]),
  ])

  const studyPlans = studyPlansRaw.length > 0
    ? studyPlansRaw.map(p => ({
        title: p.title,
        roles: p.role_tags ?? [],
        duration: `${p.estimated_hours} hrs`,
        description: p.description ?? '',
        slug: p.slug,
        participantCount: (p as unknown as { participant_count?: number }).participant_count
          ? `+${(p as unknown as { participant_count: number }).participant_count}`
          : '',
      }))
    : STUDY_PLANS_MOCK

  const buildParadigmHref = (name: string) => {
    const params = new URLSearchParams()
    params.set('paradigm', name.toLowerCase().replace(' ', '-'))
    return `/challenges?${params.toString()}`
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 animate-fade-in-up">

      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-headline text-2xl font-extrabold text-on-surface leading-tight">Explore</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Real scenarios from real companies. Pick a paradigm or follow a structured plan.</p>
        </div>
      </section>

      {/* Luma Recommendation Banner */}
      <section className="bg-primary-fixed/60 rounded-2xl p-4 flex items-center gap-4 border-l-4 border-primary/40">
        <LumaGlyph size={36} state="speaking" className="text-primary shrink-0" />
        <p className="text-sm text-on-surface leading-relaxed">
          New here? Start with a <strong>Traditional</strong> challenge to baseline your thinking, then explore AI paradigms once you have your skill radar.
        </p>
      </section>

      {/* Paradigms — 4-column strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {PARADIGMS.map(p => (
          <Link
            key={p.name}
            href={buildParadigmHref(p.name)}
            className={`rounded-xl ${p.borderClass} ${p.bgClass} bg-surface-container-low hover:bg-surface-container hover:shadow-sm active:scale-[0.98] transition-all duration-150 group relative flex flex-col gap-2.5 p-4 overflow-hidden`}
          >
            <div className="flex items-center gap-2">
              <span className={`material-symbols-outlined text-[18px] ${p.iconClass}`}
                style={{ fontVariationSettings: "'FILL' 0" }}>
                {p.icon}
              </span>
              <h3 className="font-headline text-sm font-bold leading-tight flex-1">{p.name}</h3>
              <span className="material-symbols-outlined text-on-surface-variant text-sm opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">arrow_forward</span>
            </div>
            <p className="text-xs text-on-surface-variant leading-snug">{p.description}</p>
            <p className={`text-[11px] text-on-surface-variant/80 italic leading-snug ${p.quoteClass}`}>
              &ldquo;{p.exampleChallenge}&rdquo;
            </p>
            <div className="flex justify-end mt-auto">
              <span className="text-[11px] font-bold text-on-surface-variant/60 bg-surface-container-highest/60 px-2 py-0.5 rounded-full">
                {p.challengeCount}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* FLOW Framework */}
      <Link
        href="/explore/flow"
        className="flex flex-col gap-3 bg-primary-fixed rounded-2xl p-5 border border-primary-fixed-dim/40 editorial-shadow hover:brightness-95 active:scale-[0.99] transition-all group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LumaGlyph size={28} state="speaking" className="text-primary shrink-0" />
            <div>
              <div className="font-headline font-bold text-base text-on-surface">The FLOW Framework</div>
              <div className="font-label text-xs text-on-surface-variant">How HackProduct challenges are structured</div>
            </div>
          </div>
          <span className="material-symbols-outlined text-base text-primary opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { symbol: '◇', label: 'Frame', color: '#2e7d32', bg: '#e8f5e9' },
            { symbol: '◈', label: 'List', color: '#1565c0', bg: '#e3f2fd' },
            { symbol: '◆', label: 'Optimize', color: '#ad1457', bg: '#fce4ec' },
            { symbol: '◎', label: 'Win', color: '#f57f17', bg: '#fff8e1' },
          ].map(m => (
            <span
              key={m.label}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-label font-bold"
              style={{ background: m.bg, color: m.color }}
            >
              {m.symbol} {m.label}
            </span>
          ))}
        </div>
        <p className="font-label text-xs font-bold text-primary">Learn how FLOW works →</p>
      </Link>

      {/* Course Modules */}
      {modules.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant">Course Modules</h2>
            <Link href="/explore/modules" className="font-label text-xs font-bold text-primary hover:underline">View all →</Link>
          </div>
          <div
            className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ maskImage: 'linear-gradient(to right, transparent, black 4%, black 94%, transparent)' }}
          >
            {modules.map(m => (
              <Link
                key={m.id}
                href={`/explore/modules/${m.slug}`}
                className="flex flex-col gap-2 bg-surface-container rounded-xl p-4 shrink-0 w-48 hover:bg-surface-container-high card-interactive transition-colors"
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: (m.cover_color ?? '#4a7c59') + '25' }}>
                  <span className="material-symbols-outlined text-base" style={{ color: m.cover_color ?? '#4a7c59', fontVariationSettings: "'FILL' 0" }}>auto_stories</span>
                </div>
                <div className="font-label text-sm font-bold text-on-surface leading-snug line-clamp-2">{m.name}</div>
                <div className="font-body text-xs text-on-surface-variant line-clamp-1">{m.tagline}</div>
                <div className="font-label text-[11px] text-on-surface-variant mt-auto">~{m.est_minutes} min</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Domains */}
      {domains.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant">Domains</h2>
            <Link href="/explore/domains" className="font-label text-xs font-bold text-primary hover:underline">View all →</Link>
          </div>
          <div
            className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ maskImage: 'linear-gradient(to right, transparent, black 4%, black 94%, transparent)' }}
          >
            {domains.slice(0, 10).map(d => (
              <Link
                key={d.id}
                href={`/explore/domains/${d.slug}`}
                className="flex flex-col items-center gap-1.5 shrink-0 w-24 py-3 px-2 rounded-xl hover:bg-surface-container transition-colors text-center group"
              >
                <div className="relative w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl text-primary" style={{ fontVariationSettings: "'FILL' 0" }}>{d.icon ?? 'category'}</span>
                  {(d.progress_percentage ?? 0) > 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-primary border-2 border-background" />
                  )}
                </div>
                <span className="font-label text-xs font-bold text-on-surface leading-tight line-clamp-2">{d.title}</span>
                <span className="font-label text-[11px] text-on-surface-variant">{d.challenge_count} challenges</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Product Autopsies */}
      {showcaseProducts.length > 0 && (
        <section>
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
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {showcaseProducts.slice(0, 3).map(product => (
              <Link
                key={product.id}
                href={`/explore/showcase/${product.slug}`}
                className="flex items-center gap-3 bg-surface-container rounded-xl p-3 border-l-4 card-interactive hover:bg-surface-container-high transition-colors"
                style={{ borderLeftColor: product.cover_color ?? '#4a7c59' }}
              >
                {/* Letter avatar — no emoji */}
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold text-white"
                  style={{ backgroundColor: product.cover_color ?? '#4a7c59' }}
                >
                  {product.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-label text-sm font-bold text-on-surface truncate">{product.name}</p>
                  <p className="text-xs text-on-surface-variant truncate">{product.tagline}</p>
                </div>
                <span className="shrink-0 bg-secondary-container text-on-secondary-container rounded-full px-2 py-0.5 text-[11px] font-bold">
                  {product.decision_count}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Study Plans */}
      <section className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="font-headline text-lg font-bold text-on-surface">Study Plans</h2>
          <Link href="/explore/plans" className="text-xs font-bold text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
          {studyPlans.map(plan => (
            <Link
              key={plan.slug}
              href={`/explore/plans/${plan.slug}`}
              className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/30 flex flex-col justify-between card-interactive hover:shadow-sm transition-shadow"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex gap-1 flex-wrap">
                    {plan.roles.map(r => (
                      <span
                        key={r}
                        className="bg-secondary-container text-secondary text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-on-surface-variant font-medium tabular-nums">{plan.duration}</span>
                </div>
                <h4 className="font-headline text-base font-bold mb-1.5">{plan.title}</h4>
                <p className="text-xs text-on-surface-variant leading-snug">{plan.description}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-outline-variant/20 flex items-center justify-between">
                {plan.participantCount ? (
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      <span className="w-2 h-2 rounded-full bg-tertiary" />
                      <span className="w-2 h-2 rounded-full bg-secondary" />
                    </div>
                    <span className="text-xs font-bold text-on-surface">{plan.participantCount} enrolled</span>
                  </div>
                ) : (
                  <span className="text-xs text-on-surface-variant">Structured learning path</span>
                )}
                <span className="text-xs font-bold text-on-primary bg-primary px-3 py-1.5 rounded-full">
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

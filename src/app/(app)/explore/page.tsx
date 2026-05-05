import Link from 'next/link'
import type { StudyPlan, AutopsyProduct, LearnModule, DomainWithProgress } from '@/lib/types'
import { getStudyPlanSummaries } from '@/lib/data/study-plans'
import { getShowcaseProducts } from '@/lib/data/showcase'
import { getLearnModuleSummaries } from '@/lib/data/learn-modules'
import { getDomainsWithProgress } from '@/lib/data/domains'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AppBreadcrumbs } from '@/components/navigation/AppBreadcrumbs'
import { AppTooltip } from '@/components/ui/AppTooltip'
import { StudyPlanGrid } from './StudyPlanGrid'
import { getCompanyLabel } from '@/lib/data/taxonomy'

interface PersonalisedPlan {
  slug: string
  title: string
  description: string | null
  move_tag: string | null
}

interface CuratedChallenge {
  id: string
  title: string
  slug: string | null
  difficulty: string
  challenge_type: string
  company_tags: string[] | null
  topic_tags: string[] | null
  technique_tags: string[] | null
}

interface CompanyChallengeGroup {
  company: string
  challenges: CuratedChallenge[]
}

interface PlanItem {
  title: string
  sub: string
  diff: string
  color: string
  bg: string
  enrolled: number
  icon: string
  slug: string
}

const PLANS_STATIC: PlanItem[] = [
  { title: 'Staff Engineer Path', sub: '6 weeks', diff: 'Intermediate', color: '#4a7c59', bg: '#dfe7e1', enrolled: 1243, icon: 'route', slug: 'staff-engineer-path' },
  { title: 'AI Product Foundations', sub: '3 weeks', diff: 'Beginner', color: '#3b6ed4', bg: '#e1ecff', enrolled: 892, icon: 'smart_toy', slug: 'ai-product-foundations' },
  { title: 'Decision-Making Under Pressure', sub: '4 weeks', diff: 'Advanced', color: '#7a5c2e', bg: '#f3e2b9', enrolled: 441, icon: 'bolt', slug: 'decision-making-under-pressure' },
  { title: 'From Engineer to PM', sub: '8 weeks', diff: 'Beginner', color: '#5b6f4d', bg: '#cfe3d3', enrolled: 2104, icon: 'trending_up', slug: 'from-engineer-to-pm' },
]

const MODULES_STATIC = [
  { slug: 'flow-framework', name: 'The FLOW Framework', tagline: 'How product decisions get made.', cover_color: '#1e3528', accent_color: '#7ee099', chapter_count: 8, est_minutes: 90, difficulty: 'beginner' },
  { slug: 'product-sense', name: 'Product Sense', tagline: 'Developing taste and judgment.', cover_color: '#172240', accent_color: '#7aa7ff', chapter_count: 7, est_minutes: 75, difficulty: 'intermediate' },
  { slug: 'agentic-pm', name: 'Agentic PM', tagline: 'Managing AI systems end-to-end.', cover_color: '#25143a', accent_color: '#c89df5', chapter_count: 6, est_minutes: 80, difficulty: 'advanced' },
  { slug: 'metrics-tradeoffs', name: 'Metrics & Trade-offs', tagline: 'The numbers that drive real decisions.', cover_color: '#301a0a', accent_color: '#f5a76c', chapter_count: 5, est_minutes: 60, difficulty: 'intermediate' },
] as const

const PRIMARY_PATHS = [
  {
    title: 'Practice',
    body: 'Filter challenges by discipline, role, company, difficulty, and format.',
    href: '/challenges',
    icon: 'target',
    accent: '#4a7c59',
    bg: 'linear-gradient(135deg, #dfe7e1 0%, #f5f1ea 100%)',
    art: 'practice',
    tooltip: 'Use this when you know the exact rep you want: SQL, coding, product sense, systems, data, company, or role.',
  },
  {
    title: 'Interview loops',
    body: 'Run a Hatch-led mock interview across product, systems, data, SQL, and coding.',
    href: '/live-interviews',
    icon: 'graphic_eq',
    accent: '#6d4cc2',
    bg: 'linear-gradient(135deg, #ecdeff 0%, #f4efe7 100%)',
    art: 'interview',
    tooltip: 'Simulate live pressure with Hatch asking follow-ups and scoring your interview moves.',
  },
  {
    title: 'Study plans',
    body: 'Follow a sequenced plan instead of browsing from scratch.',
    href: '/explore/plans',
    icon: 'route',
    accent: '#c9933a',
    bg: 'linear-gradient(135deg, #f3e2b9 0%, #f8f0dc 100%)',
    art: 'plans',
    tooltip: 'Let Hatch sequence a path across disciplines based on your role and current FLOW profile.',
  },
] as const

const DOMAIN_THEMES = [
  { bg: 'linear-gradient(135deg, #dfe7e1 0%, #f7efe2 100%)', accent: '#4a7c59', soft: 'rgba(74,124,89,0.14)' },
  { bg: 'linear-gradient(135deg, #e1ecff 0%, #f7efe2 100%)', accent: '#3b6ed4', soft: 'rgba(59,110,212,0.13)' },
  { bg: 'linear-gradient(135deg, #f3e2b9 0%, #fbf3df 100%)', accent: '#c9933a', soft: 'rgba(201,147,58,0.15)' },
  { bg: 'linear-gradient(135deg, #ecdeff 0%, #f7efe2 100%)', accent: '#7c5fd8', soft: 'rgba(124,95,216,0.13)' },
  { bg: 'linear-gradient(135deg, #d9efe6 0%, #f7efe2 100%)', accent: '#2f8b74', soft: 'rgba(47,139,116,0.13)' },
  { bg: 'linear-gradient(135deg, #ffe1d2 0%, #f7efe2 100%)', accent: '#c66a3b', soft: 'rgba(198,106,59,0.13)' },
] as const

export default async function ExplorePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [studyPlansRaw, showcaseProducts, modulesRaw, domains, personalisedPlan, topCompanyChallenges] = await Promise.all([
    getStudyPlanSummaries(4).catch(() => [] as StudyPlan[]),
    getShowcaseProducts().catch(() => [] as AutopsyProduct[]),
    getLearnModuleSummaries(4).catch(() => [] as LearnModule[]),
    getDomainsWithProgress().catch(() => [] as DomainWithProgress[]),
    (async (): Promise<PersonalisedPlan | null> => {
      if (!user) return null
      try {
        const admin = createAdminClient()
        const { data } = await admin
          .from('user_study_plan_enrollments')
          .select('plan_id, study_plans(id, slug, title, description, move_tag)')
          .eq('user_id', user.id)
          .order('enrolled_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        return (data as unknown as { study_plans: PersonalisedPlan | null } | null)?.study_plans ?? null
      } catch {
        return null
      }
    })(),
    // Curated group: Top companies by real interview challenge count, each with a compact question list.
    (async (): Promise<CompanyChallengeGroup[]> => {
      try {
        const admin = createAdminClient()
        const { data } = await admin
          .from('challenges')
          .select('id, title, slug, difficulty, challenge_type, company_tags, topic_tags, technique_tags')
          .eq('is_published', true)
          .eq('is_real_interview', true)
          .not('company_tags', 'eq', '{}')
        const rows = (data ?? []) as CuratedChallenge[]
        // Count per company
        const counts = new Map<string, CuratedChallenge[]>()
        for (const c of rows) {
          for (const company of (c.company_tags ?? [])) {
            if (!counts.has(company)) counts.set(company, [])
            counts.get(company)!.push(c)
          }
        }
        // Top 4 companies by challenge count
        const sorted = [...counts.entries()]
          .sort((a, b) => b[1].length - a[1].length)
          .slice(0, 4)
        return sorted.map(([company, challenges]) => ({
          company,
          challenges: challenges.slice(0, 5),
        }))
      } catch { return [] }
    })(),
  ])

  const plans: PlanItem[] = studyPlansRaw.length > 0
    ? studyPlansRaw.map((plan, index) => ({
        title: plan.title,
        sub: `${plan.estimated_hours} hrs`,
        diff: (plan as unknown as { difficulty?: string }).difficulty ?? 'Intermediate',
        color: PLANS_STATIC[index % PLANS_STATIC.length].color,
        bg: PLANS_STATIC[index % PLANS_STATIC.length].bg,
        enrolled: (plan as unknown as { participant_count?: number }).participant_count ?? 0,
        icon: PLANS_STATIC[index % PLANS_STATIC.length].icon,
        slug: plan.slug,
      }))
    : PLANS_STATIC

  const modules = modulesRaw.length > 0 ? modulesRaw.slice(0, 4) : MODULES_STATIC
  const autopsies = showcaseProducts.slice(0, 4)
  const topDomains = domains.slice(0, 6)

  return (
    <main className="animate-fade-in-up mx-auto max-w-[1180px] px-4 py-7 pb-24 sm:px-6 lg:px-8">
      <AppBreadcrumbs
        className="mb-5"
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Explore' },
        ]}
      />

      <header className="mb-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
        <div>
          <h1 className="font-headline text-[34px] font-bold leading-tight text-on-surface sm:text-[40px]">
            Explore
          </h1>
          <div className="mt-4 flex flex-wrap gap-2">
            <MetaChip icon="menu_book" label={`${modules.length} guides`} />
            {autopsies.length > 0 && <MetaChip icon="troubleshoot" label={`${autopsies.length} autopsies`} />}
            {topDomains.length > 0 && <MetaChip icon="category" label={`${topDomains.length} domains`} />}
          </div>
        </div>

        <AppTooltip
          label={personalisedPlan ? 'Hatch keeps your current plan ready so you can continue without re-browsing.' : 'Start with practice if Hatch has not generated a plan yet.'}
          side="bottom"
          className="flex"
        >
          <Link
            href={personalisedPlan ? `/explore/plans/${personalisedPlan.slug}` : '/challenges'}
            data-hatch-sound="open"
            className="group relative flex w-full items-center justify-between gap-4 overflow-hidden rounded-xl border border-primary/20 bg-[#1e3528] p-4 no-underline shadow-[0_18px_44px_-30px_rgba(30,53,40,0.7)] transition-transform hover:-translate-y-0.5"
          >
            <PathMiniArt kind="plans" accent="#7ee099" className="absolute -right-4 -bottom-6 h-24 w-32 opacity-35" />
            <div className="relative min-w-0">
              <div className="font-label text-[11px] font-bold uppercase tracking-[0.10em] text-[#9ee0b8]">
                {personalisedPlan ? 'Your plan, built by Hatch' : 'Start here'}
              </div>
              <div className="mt-1 truncate font-headline text-base font-bold text-[#f3ede0]">
                {personalisedPlan?.title ?? 'Find a practice rep'}
              </div>
              <div className="mt-1 text-[11px] font-semibold text-[#f3ede0]/55">
                {personalisedPlan ? 'Role-aware across all disciplines' : 'Hatch will adapt as you practice'}
              </div>
            </div>
            <span className="material-symbols-outlined relative shrink-0 text-[20px] text-[#7ee099] transition-transform group-hover:translate-x-0.5">
              arrow_forward
            </span>
          </Link>
        </AppTooltip>
      </header>

      <section className="mb-9 grid grid-cols-1 gap-3 md:grid-cols-3">
        {PRIMARY_PATHS.map((path) => (
          <CompactPathCard key={path.title} {...path} />
        ))}
      </section>

      <SectionHeading title="Guides" href="/explore/modules" linkLabel="All guides" />
      <section className="mb-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {modules.map((module) => (
          <ModuleCard key={module.slug} module={module} />
        ))}
      </section>

      {autopsies.length > 0 && (
        <>
          <SectionHeading title="Autopsies" href="/explore/showcase" linkLabel="View all" />
          <section className="mb-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {autopsies.map((product) => (
              <AutopsyCard key={product.slug} product={product} />
            ))}
          </section>
        </>
      )}

      {topDomains.length > 0 && (
        <>
          <SectionHeading title="Domains" href="/domains" linkLabel="All domains" />
          <section className="mb-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {topDomains.map((domain, index) => (
              <DomainRow key={domain.slug} domain={domain} index={index} />
            ))}
          </section>
        </>
      )}

      {/* Curated group: real interview questions */}
      {topCompanyChallenges.length > 0 && (
        <RealInterviewSpotlight companyGroups={topCompanyChallenges} />
      )}

      <SectionHeading title="Study Plans" href="/explore/plans" linkLabel="All plans" />
      <StudyPlanGrid plans={plans} personalisedPlan={personalisedPlan} />
    </main>
  )
}

function MetaChip({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-container-low px-2.5 py-1 text-xs font-label font-bold text-on-surface-variant">
      <span className="material-symbols-outlined text-[14px]">{icon}</span>
      {label}
    </span>
  )
}

function PathMiniArt({ kind, accent, className = '' }: {
  kind: string
  accent: string
  className?: string
}) {
  if (kind === 'interview') {
    return (
      <svg viewBox="0 0 160 120" className={className} fill="none" aria-hidden="true">
        <path d="M28 78 C42 52, 62 44, 80 56 C98 68, 112 34, 134 28" stroke={accent} strokeWidth="8" strokeLinecap="round" />
        <circle cx="34" cy="82" r="12" fill={accent} opacity="0.24" />
        <circle cx="80" cy="56" r="16" fill={accent} opacity="0.18" />
        <rect x="106" y="20" width="34" height="46" rx="17" stroke={accent} strokeWidth="7" opacity="0.48" />
        <path d="M123 66 V88 M108 88 H138" stroke={accent} strokeWidth="7" strokeLinecap="round" opacity="0.55" />
      </svg>
    )
  }

  if (kind === 'plans') {
    return (
      <svg viewBox="0 0 160 120" className={className} fill="none" aria-hidden="true">
        <path d="M34 88 C50 42, 86 88, 126 36" stroke={accent} strokeWidth="8" strokeLinecap="round" />
        <circle cx="34" cy="88" r="11" fill={accent} opacity="0.28" />
        <circle cx="82" cy="70" r="11" fill={accent} opacity="0.20" />
        <circle cx="126" cy="36" r="13" fill={accent} opacity="0.32" />
        <path d="M114 36 H126 V24" stroke={accent} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" opacity="0.65" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 160 120" className={className} fill="none" aria-hidden="true">
      <rect x="28" y="28" width="42" height="42" rx="10" fill={accent} opacity="0.22" />
      <rect x="88" y="42" width="44" height="44" rx="10" fill={accent} opacity="0.16" />
      <path d="M48 78 H104 M104 78 L92 66 M104 78 L92 90" stroke={accent} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" opacity="0.62" />
      <circle cx="48" cy="48" r="8" fill={accent} opacity="0.75" />
      <circle cx="110" cy="64" r="8" fill={accent} opacity="0.75" />
    </svg>
  )
}

function CompactPathCard({ title, body, href, icon, accent, bg, art, tooltip }: {
  title: string
  body: string
  href: string
  icon: string
  accent: string
  bg: string
  art: string
  tooltip: string
}) {
  return (
    <AppTooltip label={tooltip} side="bottom" className="flex">
      <Link
        href={href}
        data-hatch-sound="open"
        className="group relative flex min-h-[142px] w-full flex-col justify-between overflow-hidden rounded-xl border border-outline-variant/45 p-4 no-underline transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-26px_rgba(46,50,48,0.55)]"
        style={{ background: bg }}
      >
        <PathMiniArt kind={art} accent={accent} className="absolute -right-5 -bottom-7 h-28 w-36" />
        <span className="relative flex items-start justify-between gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white" style={{ background: accent }}>
            <span className="material-symbols-outlined text-[21px]" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
          </span>
          <span className="material-symbols-outlined text-[16px] text-on-surface-variant transition-transform group-hover:translate-x-0.5">
            arrow_forward
          </span>
        </span>
        <span className="relative pr-8">
          <span className="block font-headline text-[17px] font-bold text-on-surface">{title}</span>
          <span className="mt-1 block text-[12.5px] font-semibold leading-snug text-on-surface-variant">{body}</span>
        </span>
      </Link>
    </AppTooltip>
  )
}

function ModuleCard({ module }: { module: Pick<LearnModule, 'slug' | 'name' | 'tagline' | 'cover_color' | 'accent_color' | 'chapter_count' | 'est_minutes' | 'difficulty'> }) {
  return (
    <Link
      href={`/explore/modules/${module.slug}`}
      data-hatch-sound="open"
      className="group flex min-h-[150px] flex-col justify-between overflow-hidden rounded-xl p-4 no-underline transition-transform duration-200 hover:-translate-y-0.5"
      style={{ background: module.cover_color, border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <span>
        <span
          className="inline-flex rounded-md px-2 py-0.5 text-[10px] font-label font-bold uppercase tracking-[0.08em]"
          style={{ background: 'rgba(255,255,255,0.10)', color: module.accent_color }}
        >
          {module.difficulty}
        </span>
        <span className="mt-3 block font-headline text-[18px] font-bold leading-tight text-[#f3ede0]">
          {module.name}
        </span>
        <span className="mt-1 line-clamp-2 block text-[12.5px] font-semibold leading-snug text-[#f3ede0]/65">
          {module.tagline}
        </span>
      </span>
      <span className="mt-4 flex items-center justify-between text-[12px] font-label font-semibold text-[#f3ede0]/55">
        <span>{module.chapter_count} chapters · {module.est_minutes} min</span>
        <span className="material-symbols-outlined text-[15px] transition-transform group-hover:translate-x-0.5" style={{ color: module.accent_color }}>
          arrow_forward
        </span>
      </span>
    </Link>
  )
}

function AutopsyCard({ product }: { product: AutopsyProduct }) {
  const bg = product.cover_color ?? '#1e1b14'

  return (
    <Link
      href={`/explore/showcase/${product.slug}`}
      data-hatch-sound="open"
      className="group flex min-h-[136px] flex-col justify-between overflow-hidden rounded-xl p-4 no-underline transition-transform duration-200 hover:-translate-y-0.5"
      style={{ background: bg, border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <span>
        <span className="flex items-center gap-2">
          {product.logo_emoji && <span className="text-[22px] leading-none">{product.logo_emoji}</span>}
          {product.industry && (
            <span className="font-label text-[10px] font-bold uppercase tracking-[0.08em] text-white/65">
              {product.industry}
            </span>
          )}
        </span>
        <span className="mt-3 block font-headline text-[18px] font-bold leading-tight text-white">
          {product.name}
        </span>
        {product.tagline && (
          <span className="mt-1 line-clamp-2 block text-[12.5px] font-semibold leading-snug text-white/72">
            {product.tagline}
          </span>
        )}
      </span>
      <span className="mt-4 flex items-center justify-between text-[12px] font-label font-semibold text-white/62">
        <span>{product.decision_count} decisions</span>
        <span className="material-symbols-outlined text-[15px] transition-transform group-hover:translate-x-0.5">
          arrow_forward
        </span>
      </span>
    </Link>
  )
}

function DomainRow({ domain, index }: { domain: DomainWithProgress; index: number }) {
  const theme = DOMAIN_THEMES[index % DOMAIN_THEMES.length]

  return (
    <Link
      href={`/domains/${domain.slug}`}
      data-hatch-sound="open"
      className="group relative flex min-h-[112px] items-center gap-3 overflow-hidden rounded-xl border border-outline-variant/45 p-4 no-underline transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_34px_-28px_rgba(46,50,48,0.55)]"
      style={{ background: theme.bg }}
    >
      <DomainSketch accent={theme.accent} soft={theme.soft} />
      <span className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white shadow-[0_10px_24px_-18px_rgba(0,0,0,0.6)]" style={{ background: theme.accent }}>
        <span className="material-symbols-outlined text-[21px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          {domain.icon ?? 'category'}
        </span>
      </span>
      <span className="relative min-w-0 flex-1">
        <span className="block truncate font-headline text-[15px] font-bold text-on-surface">
          {domain.title}
        </span>
        <span className="mt-0.5 block text-[12px] font-label font-semibold text-on-surface-variant">
          {domain.challenge_count} challenges
          {domain.progress_percentage > 0 ? ` · ${Math.round(domain.progress_percentage)}% complete` : ''}
        </span>
        <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-white/65">
          <span
            className="block h-full rounded-full transition-[width] duration-500"
            style={{
              width: `${Math.min(100, Math.max(8, Math.round(domain.progress_percentage || 0)))}%`,
              background: theme.accent,
            }}
          />
        </span>
      </span>
      <span className="material-symbols-outlined relative shrink-0 text-[16px] text-on-surface-variant transition-transform group-hover:translate-x-0.5">
        arrow_forward
      </span>
    </Link>
  )
}

function DomainSketch({ accent, soft }: { accent: string; soft: string }) {
  return (
    <svg
      viewBox="0 0 220 120"
      className="pointer-events-none absolute inset-y-0 right-0 h-full w-44"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="158" cy="22" r="44" fill={soft} />
      <circle cx="198" cy="92" r="38" fill={soft} />
      <path d="M92 82 C116 42, 152 90, 196 28" stroke={accent} strokeWidth="7" strokeLinecap="round" opacity="0.16" />
      <path d="M138 30 H196 V88" stroke={accent} strokeWidth="2" strokeDasharray="5 7" opacity="0.20" />
      <rect x="132" y="48" width="22" height="22" rx="7" fill={accent} opacity="0.12" />
      <rect x="170" y="66" width="26" height="26" rx="8" fill={accent} opacity="0.10" />
    </svg>
  )
}

function RealInterviewSpotlight({ companyGroups }: { companyGroups: CompanyChallengeGroup[] }) {
  const questionCount = companyGroups.reduce((total, group) => total + group.challenges.length, 0)

  return (
    <section
      className="mb-10 overflow-hidden rounded-xl border border-primary/18 bg-surface-container-low p-4 shadow-[0_22px_52px_-42px_rgba(30,53,40,0.62)] sm:p-5"
      style={{
        background:
          'linear-gradient(135deg, rgba(74,124,89,0.12) 0%, rgba(255,255,255,0.42) 48%, rgba(201,147,58,0.10) 100%)',
      }}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-primary-fixed px-2 py-1 font-label text-[11px] font-bold text-primary">
            <span className="material-symbols-outlined text-[14px]">verified</span>
            Real interviews
          </span>
          <h2 className="mt-2 font-headline text-[25px] font-bold leading-tight text-on-surface">
            Asked at top companies
          </h2>
          <p className="mt-1 font-label text-[12px] font-semibold text-on-surface-variant">
            {questionCount} questions across {companyGroups.length} company loops
          </p>
        </div>
        <Link
          href="/challenges?real_interview=1"
          data-hatch-sound="open"
          className="inline-flex w-fit items-center gap-1 rounded-md bg-white/60 px-3 py-2 font-label text-xs font-bold text-primary no-underline ring-1 ring-primary/15 transition-colors hover:bg-primary-container hover:text-on-primary-container"
        >
          Browse all
          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {companyGroups.map(({ company, challenges }) => (
          <AskedAtCompanyGroup key={company} company={company} challenges={challenges} />
        ))}
      </div>
    </section>
  )
}

function AskedAtCompanyGroup({ company, challenges }: CompanyChallengeGroup) {
  const companyLabel = getCompanyDisplayName(company)
  const companyVisual = getCompanyVisual(company)
  const visibleChallenges = challenges.slice(0, 3)
  const hiddenCount = Math.max(0, challenges.length - visibleChallenges.length)

  return (
    <article
      className="group relative flex min-h-[188px] flex-col overflow-hidden rounded-lg border border-outline-variant/35 bg-surface-container-low p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_18px_34px_-30px_rgba(46,50,48,0.58)]"
      style={{
        background: `linear-gradient(135deg, ${companyVisual.soft} 0%, rgba(255,255,255,0.34) 46%, transparent 100%)`,
      }}
    >
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-1"
        style={{ background: companyVisual.accent }}
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute -right-8 top-0 h-full w-24 opacity-[0.08]"
        style={{
          backgroundImage: `repeating-linear-gradient(135deg, ${companyVisual.accent} 0 2px, transparent 2px 10px)`,
        }}
        aria-hidden="true"
      />

      <div className="relative flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md font-headline text-[15px] font-bold text-white shadow-[0_10px_22px_-18px_rgba(0,0,0,0.7)]"
            style={{ background: companyVisual.accent }}
            aria-hidden="true"
          >
            {getCompanyMark(companyLabel)}
          </span>
          <span className="min-w-0">
            <h3 className="truncate font-headline text-[17px] font-bold leading-tight text-on-surface">
              {companyLabel}
            </h3>
            <span className="mt-0.5 block font-label text-[11px] font-semibold text-on-surface-variant">
              {challenges.length} real interview {challenges.length === 1 ? 'question' : 'questions'}
            </span>
          </span>
        </div>
        <Link
          href={`/challenges?company=${company}`}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/55 text-on-surface-variant no-underline ring-1 ring-outline-variant/40 transition-colors hover:bg-primary-container hover:text-on-primary-container"
          aria-label={`Browse ${companyLabel} questions`}
          data-hatch-sound="open"
        >
          <span className="material-symbols-outlined text-[17px]">arrow_forward</span>
        </Link>
      </div>

      <div className="relative mt-3 flex flex-1 flex-col gap-1.5">
        {visibleChallenges.map((challenge, index) => (
          <AskedAtChallengeRow
            key={challenge.id}
            challenge={challenge}
            index={index}
            accent={companyVisual.accent}
          />
        ))}
      </div>

      {hiddenCount > 0 && (
        <Link
          href={`/challenges?company=${company}`}
          className="relative mt-2 inline-flex w-fit items-center gap-1 rounded-md px-1 py-0.5 font-label text-[11px] font-bold text-on-surface-variant no-underline transition-colors hover:text-primary"
          data-hatch-sound="open"
        >
          +{hiddenCount} more
          <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
        </Link>
      )}
    </article>
  )
}

function AskedAtChallengeRow({ challenge, index, accent }: {
  challenge: CuratedChallenge
  index: number
  accent: string
}) {
  const href = `/challenges/${challenge.slug ?? challenge.id}`
  const detail = challenge.technique_tags?.[0] ?? challenge.topic_tags?.[0] ?? challenge.challenge_type.replace(/_/g, ' ')

  return (
    <Link
      href={href}
      className="group/row flex min-h-[38px] items-center gap-2.5 rounded-md bg-white/42 px-2 py-1.5 no-underline ring-1 ring-outline-variant/20 transition-colors hover:bg-white/70 hover:ring-primary/20"
      data-hatch-sound="open"
    >
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] font-label text-[10px] font-bold tabular-nums text-white"
        style={{ background: accent }}
        aria-hidden="true"
      >
        {index + 1}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-body text-[13px] font-semibold leading-snug text-on-surface transition-colors group-hover/row:text-primary">
          {challenge.title}
        </span>
        <span className="mt-0.5 block truncate font-label text-[10.5px] font-semibold capitalize text-on-surface-variant">
          {challenge.difficulty.replace(/_/g, ' ')} · {detail.replace(/_/g, ' ')}
        </span>
      </span>
      <span className="material-symbols-outlined shrink-0 text-[14px] text-on-surface-variant transition-transform group-hover/row:translate-x-0.5 group-hover/row:text-primary">
        chevron_right
      </span>
    </Link>
  )
}

function getCompanyDisplayName(company: string) {
  return getCompanyLabel(company) ?? company
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function getCompanyMark(label: string) {
  const words = label.split(/\s+/).filter(Boolean)
  const mark = words.length > 1
    ? `${words[0]?.[0] ?? ''}${words[1]?.[0] ?? ''}`
    : label.slice(0, 2)

  return mark.toUpperCase()
}

function getCompanyVisual(company: string) {
  const palette = [
    { accent: '#4a7c59', soft: 'rgba(74,124,89,0.10)' },
    { accent: '#7a5c2e', soft: 'rgba(201,147,58,0.13)' },
    { accent: '#3b6ed4', soft: 'rgba(59,110,212,0.10)' },
    { accent: '#6d4cc2', soft: 'rgba(109,76,194,0.10)' },
    { accent: '#2f8b74', soft: 'rgba(47,139,116,0.10)' },
    { accent: '#c66a3b', soft: 'rgba(198,106,59,0.11)' },
  ]
  const hash = [...company].reduce((sum, char) => sum + char.charCodeAt(0), 0)

  return palette[hash % palette.length]
}

function SectionHeading({ title, href, linkLabel }: {
  title: string
  href: string
  linkLabel: string
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <h2 className="m-0 font-headline text-[24px] font-bold leading-tight text-on-surface">
        {title}
      </h2>
      <Link
        href={href}
        data-hatch-sound="open"
        className="inline-flex items-center gap-1 text-xs font-label font-bold text-primary no-underline hover:underline"
      >
        {linkLabel}
        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
      </Link>
    </div>
  )
}

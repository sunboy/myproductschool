import { getChallenges, getFeaturedChallenges } from '@/lib/data/challenges'
import Link from 'next/link'
import { ChallengeCard } from './ChallengeCard'
import { ChallengeSearch } from './ChallengeSearch'
import { LockedChallengeGrid } from './LockedChallengeGrid'
import { LumaPick } from './LumaPick'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

export interface FreePracticeContentProps {
  searchParams: Promise<{ paradigm?: string; role?: string; difficulty?: string; company?: string; tab?: string; view?: string; q?: string }>
}

const PARADIGMS = [
  { key: 'all',         label: 'All Formats', dot: null },
  { key: 'traditional', label: 'Traditional',  dot: 'bg-emerald-500' },
  { key: 'ai_assisted', label: 'AI-Assisted',  dot: 'bg-blue-500' },
  { key: 'agentic',     label: 'Agentic',       dot: 'bg-purple-500' },
  { key: 'ai_native',   label: 'AI-Native',     dot: 'bg-amber-500' },
] as const

const DIFFICULTIES = [
  { key: 'all',       label: 'All' },
  { key: 'warmup',    label: 'Warmup' },
  { key: 'standard',  label: 'Standard' },
  { key: 'advanced',  label: 'Advanced' },
  { key: 'staff_plus', label: 'Staff+' },
] as const

const ROLE_GROUPS = [
  {
    label: 'Engineering',
    roles: [
      { key: 'swe',          label: 'SWE' },
      { key: 'data_eng',     label: 'Data Eng' },
      { key: 'ml_eng',       label: 'ML Eng' },
      { key: 'devops',       label: 'DevOps' },
      { key: 'founding_eng', label: 'Founding Eng' },
      { key: 'em',           label: 'Eng Manager' },
      { key: 'tech_lead',    label: 'Tech Lead' },
    ],
  },
  {
    label: 'Product',
    roles: [
      { key: 'pm',             label: 'PM' },
      { key: 'designer',       label: 'Designer' },
      { key: 'data_scientist', label: 'Data Scientist' },
    ],
  },
]

const PARADIGM_DISPLAY: Record<string, string> = {
  traditional: 'Traditional',
  ai_assisted: 'AI-Assisted',
  agentic: 'Agentic',
  ai_native: 'AI-Native',
}
function getParadigmLabel(paradigm?: string | null): string {
  return (paradigm && PARADIGM_DISPLAY[paradigm]) ?? 'Traditional'
}

const MAX_COMPANY_CHIPS = 8

export async function FreePracticeContent({ searchParams }: FreePracticeContentProps) {
  const { paradigm, role, difficulty, company, view, q } = await searchParams
  const isListView = view === 'list'

  const [challenges, featuredChallenges] = await Promise.all([
    getChallenges({ difficulty, paradigm, role, company, q }),
    getFeaturedChallenges(),
  ])

  const paradigmMap: Record<string, string> = {}
  challenges.forEach(c => {
    paradigmMap[c.id] = getParadigmLabel(c.paradigm ?? undefined)
  })

  // Collect distinct company tags from result set
  const companySet = new Set<string>()
  challenges.forEach(c => {
    if (c.company_tags) c.company_tags.forEach(t => companySet.add(t))
  })
  const allCompanies = Array.from(companySet).sort()
  const visibleCompanies = allCompanies.slice(0, MAX_COMPANY_CHIPS)
  const hiddenCompanyCount = allCompanies.length - visibleCompanies.length

  const buildHref = (overrides: Record<string, string | undefined>) => {
    const p = new URLSearchParams()
    const pa = 'paradigm'   in overrides ? overrides.paradigm   : paradigm
    const r  = 'role'       in overrides ? overrides.role       : role
    const d  = 'difficulty' in overrides ? overrides.difficulty : difficulty
    const co = 'company'    in overrides ? overrides.company    : company
    const v  = 'view'       in overrides ? overrides.view       : view
    if (pa && pa !== 'all') p.set('paradigm', pa)
    if (r && r !== 'all')   p.set('role', r)
    if (d && d !== 'all')   p.set('difficulty', d)
    if (co)                 p.set('company', co)
    if (v && v !== 'grid')  p.set('view', v)
    if (q)                  p.set('q', q)
    const s = p.toString()
    return s ? `/challenges?${s}` : '/challenges'
  }

  const gridHref = buildHref({ view: 'grid' })
  const listHref = buildHref({ view: 'list' })

  return (
    <div>
      {/* Header */}
      <div className="mb-5 flex items-center justify-between gap-6">
        <p className="text-[15px] text-on-surface-variant font-body">Real scenarios from real companies. Pick what fits your role.</p>
        <ChallengeSearch total={challenges.length} />
      </div>

      {/* Luma's Pick */}
      <LumaPick />

      {/* ── FILTER BAR ──────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col gap-3">

        {/* Role filter */}
        <div className="flex items-start gap-3 flex-wrap">
          <span className="text-[11px] font-bold text-on-surface-variant font-label uppercase tracking-wider pt-1.5 w-20 shrink-0">Role</span>
          <div className="flex items-center gap-2 flex-wrap flex-1">
            <Link
              href={buildHref({ role: undefined })}
              className={[
                'px-3 py-1 text-xs font-semibold rounded-full transition-colors font-label',
                !role || role === 'all'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface hover:bg-surface-container-high',
              ].join(' ')}
            >
              All
            </Link>
            {ROLE_GROUPS.map((group, gi) => (
              <span key={group.label} className="flex items-center gap-1.5 flex-wrap">
                {gi > 0 && <span className="w-px h-4 bg-outline-variant/50 mx-1" />}
                <span className="text-[10px] font-bold text-on-surface-variant/60 font-label uppercase tracking-wider">{group.label}</span>
                {group.roles.map(r => (
                  <Link
                    key={r.key}
                    href={buildHref({ role: r.key })}
                    className={[
                      'px-3 py-1 text-xs font-semibold rounded-full transition-colors font-label',
                      role === r.key
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container text-on-surface hover:bg-surface-container-high',
                    ].join(' ')}
                  >
                    {r.label}
                  </Link>
                ))}
              </span>
            ))}
          </div>
        </div>

        {/* Format (paradigm) filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[11px] font-bold text-on-surface-variant font-label uppercase tracking-wider w-20 shrink-0">Format</span>
          <div className="flex items-center gap-2 flex-wrap">
            {PARADIGMS.map(p => {
              const isActive = (paradigm ?? 'all') === p.key
              return (
                <Link
                  key={p.key}
                  href={buildHref({ paradigm: p.key })}
                  className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5 transition-colors font-label ${
                    isActive
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  {p.dot && (
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? 'bg-on-primary/70' : p.dot}`} />
                  )}
                  {p.label}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Difficulty filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[11px] font-bold text-on-surface-variant font-label uppercase tracking-wider w-20 shrink-0">Level</span>
          <div className="flex items-center gap-2 flex-wrap">
            {DIFFICULTIES.map(d => {
              const isActive = (difficulty ?? 'all') === d.key
              return (
                <Link
                  key={d.key}
                  href={buildHref({ difficulty: d.key })}
                  className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors font-label ${
                    isActive
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  {d.label}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Company filter — only shown when company tags exist in current result set */}
        {allCompanies.length > 0 && (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[11px] font-bold text-on-surface-variant font-label uppercase tracking-wider w-20 shrink-0">Company</span>
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={buildHref({ company: undefined })}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors font-label ${
                  !company
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                }`}
              >
                All
              </Link>
              {visibleCompanies.map(co => (
                <Link
                  key={co}
                  href={buildHref({ company: co })}
                  className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors font-label ${
                    company === co
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  {co.charAt(0).toUpperCase() + co.slice(1)}
                </Link>
              ))}
              {hiddenCompanyCount > 0 && (
                <span className="text-xs text-on-surface-variant font-label">+{hiddenCompanyCount} more</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Featured Challenges — only when editorially pinned challenges exist */}
      {featuredChallenges.length > 0 && !paradigm && !role && !difficulty && !company && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1", color: '#c9933a' }}>star</span>
              <h2 className="font-headline text-[22px] font-[500] text-on-surface m-0">Featured</h2>
            </div>
            <span className="text-[12px] text-on-surface-variant font-label">Curated picks</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featuredChallenges.map((challenge) => (
              <ChallengeCard
                key={`featured-${challenge.id}`}
                challenge={challenge}
                paradigm={getParadigmLabel(challenge.paradigm)}
              />
            ))}
          </div>
          <div className="border-t border-outline-variant/20 mt-6 mb-6" />
        </div>
      )}

      {/* All Challenges */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-label text-xs font-bold text-on-surface-variant uppercase tracking-widest">
          {paradigm && paradigm !== 'all'
            ? `${PARADIGM_DISPLAY[paradigm] ?? paradigm} challenges`
            : 'All challenges'}
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-on-surface-variant font-label tabular-nums">{challenges.length} total</span>
          {/* View toggle */}
          <div className="flex items-center gap-0.5 bg-surface-container rounded-lg p-0.5">
            <Link
              href={gridHref}
              aria-label="Grid view"
              className={`p-1.5 rounded-md transition-colors ${!isListView ? 'bg-surface-container-highest text-on-surface' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>grid_view</span>
            </Link>
            <Link
              href={listHref}
              aria-label="List view"
              className={`p-1.5 rounded-md transition-colors ${isListView ? 'bg-surface-container-highest text-on-surface' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>list</span>
            </Link>
          </div>
        </div>
      </div>

      {challenges.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <LumaGlyph size={56} state="idle" className="text-primary" />
          <div>
            <p className="font-headline text-base font-bold text-on-surface mb-1">No challenges match that filter</p>
            <p className="text-sm text-on-surface-variant max-w-xs">
              Try removing a filter, or{' '}
              <Link href="/challenges" className="text-primary font-bold hover:underline">
                view all challenges
              </Link>
              .
            </p>
          </div>
        </div>
      ) : isListView ? (
        <div className="flex flex-col divide-y divide-outline-variant/20 border border-outline-variant/30 rounded-2xl overflow-hidden">
          <LockedChallengeGrid
            challenges={challenges}
            paradigms={paradigmMap}
            listView
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <LockedChallengeGrid
            challenges={challenges}
            paradigms={paradigmMap}
            listView={false}
          />
        </div>
      )}
    </div>
  )
}

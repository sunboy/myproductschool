import { getChallenges } from '@/lib/data/challenges'
import Link from 'next/link'
import { ChallengeCard } from './ChallengeCard'
import { LockedChallengeGrid } from './LockedChallengeGrid'
import { LumaPick } from './LumaPick'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

export interface FreePracticeContentProps {
  searchParams: Promise<{ paradigm?: string; role?: string; difficulty?: string; tab?: string; view?: string }>
}

const PARADIGMS = [
  { key: 'all',         label: 'All Paradigms', dot: null },
  { key: 'traditional', label: 'Traditional',   dot: 'bg-emerald-500' },
  { key: 'ai_assisted', label: 'AI-Assisted',   dot: 'bg-blue-500' },
  { key: 'agentic',     label: 'Agentic',        dot: 'bg-purple-500' },
  { key: 'ai_native',   label: 'AI-Native',      dot: 'bg-amber-500' },
] as const

const ROLES = [
  { key: 'swe',          label: 'SWE' },
  { key: 'data_eng',     label: 'Data Eng' },
  { key: 'ml_eng',       label: 'ML Eng' },
  { key: 'devops',       label: 'DevOps' },
  { key: 'em',           label: 'EM' },
  { key: 'founding_eng', label: 'Founding Eng' },
] as const

const PARADIGM_DISPLAY: Record<string, string> = {
  traditional: 'Traditional',
  ai_assisted: 'AI-Assisted',
  agentic: 'Agentic',
  ai_native: 'AI-Native',
}
function getParadigmLabel(paradigm?: string | null): string {
  return (paradigm && PARADIGM_DISPLAY[paradigm]) ?? 'Traditional'
}


export async function FreePracticeContent({ searchParams }: FreePracticeContentProps) {
  const { paradigm, role, difficulty, view } = await searchParams
  const isListView = view === 'list'
  const challenges = await getChallenges({ difficulty, paradigm, role })

  const paradigmMap: Record<string, string> = {}
  challenges.forEach(c => {
    paradigmMap[c.id] = getParadigmLabel(c.paradigm ?? undefined)
  })

  const buildHref = (overrides: Record<string, string | undefined>) => {
    const p = new URLSearchParams()
    const pa = 'paradigm' in overrides ? overrides.paradigm : paradigm
    const r  = 'role'     in overrides ? overrides.role      : role
    const d  = 'difficulty' in overrides ? overrides.difficulty : difficulty
    const v  = 'view'     in overrides ? overrides.view      : view
    if (pa && pa !== 'all') p.set('paradigm', pa)
    if (r) p.set('role', r)
    if (d) p.set('difficulty', d)
    if (v && v !== 'grid') p.set('view', v)
    const s = p.toString()
    return s ? `/challenges?${s}` : '/challenges'
  }

  const gridHref = buildHref({ view: 'grid' })
  const listHref = buildHref({ view: 'list' })

  return (
    <div>
      {/* Header */}
      <div className="mb-5">
        <h1 className="font-headline text-2xl font-extrabold text-on-surface leading-tight">Practice Hub</h1>
        <p className="text-sm text-on-surface-variant mt-0.5">Real scenarios from real companies. Pick what fits your role.</p>
      </div>

      {/* Luma's Pick */}
      <LumaPick />

      {/* Filters */}
      <div className="space-y-2.5 mb-8 p-4 bg-surface-container-low rounded-2xl border border-outline-variant/30">
        {/* Role */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-on-surface-variant font-label w-20 shrink-0">Role</span>
          <Link
            href={buildHref({ role: undefined })}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors font-label ${
              !role ? 'bg-on-surface text-inverse-on-surface' : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
            }`}
          >
            All
          </Link>
          {ROLES.map(r => (
            <Link
              key={r.key}
              href={buildHref({ role: role === r.key ? undefined : r.key })}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors font-label ${
                role === r.key
                  ? 'bg-on-surface text-inverse-on-surface'
                  : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
              }`}
            >
              {r.label}
            </Link>
          ))}
        </div>

        <div className="border-t border-outline-variant/20" />

        {/* Paradigm */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-on-surface-variant font-label w-20 shrink-0">Type</span>
          {PARADIGMS.map(p => {
            const isActive = (paradigm ?? 'all') === p.key
            return (
              <Link
                key={p.key}
                href={buildHref({ paradigm: p.key })}
                className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors font-label ${
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

      {/* Featured Challenges */}
      {!paradigm && !role && challenges.length >= 3 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-headline text-sm font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              Featured
            </h2>
            <span className="text-[11px] text-on-surface-variant font-label">Curated picks</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {challenges.slice(0, 3).map((challenge) => (
              <ChallengeCard
                key={`rec-${challenge.id}`}
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


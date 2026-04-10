import { getChallenges } from '@/lib/data/challenges'
import Link from 'next/link'
import { ChallengeCard } from './ChallengeCard'
import { LumaPick } from './LumaPick'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

export interface FreePracticeContentProps {
  searchParams: Promise<{ paradigm?: string; role?: string; difficulty?: string; tab?: string }>
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
  const { paradigm, role, difficulty } = await searchParams
  const challenges = await getChallenges({ difficulty, paradigm, role })

  const buildHref = (overrides: Record<string, string | undefined>) => {
    const p = new URLSearchParams()
    const pa = 'paradigm' in overrides ? overrides.paradigm : paradigm
    const r  = 'role'     in overrides ? overrides.role      : role
    const d  = 'difficulty' in overrides ? overrides.difficulty : difficulty
    if (pa && pa !== 'all') p.set('paradigm', pa)
    if (r) p.set('role', r)
    if (d) p.set('difficulty', d)
    const s = p.toString()
    return s ? `/challenges?${s}` : '/challenges'
  }

  return (
    <div>
      {/* Header Section */}
      <div className="flex items-baseline gap-3 mb-6">
        <h1 className="text-2xl font-bold font-headline text-primary">Practice Hub</h1>
        <p className="text-sm text-on-surface-variant">Master product thinking through real-world scenarios.</p>
      </div>

      {/* Luma's Pick Banner — dynamic, real challenge from API */}
      <LumaPick />

      {/* Filters */}
      <div className="space-y-3 mb-8">
        {/* Role Filter — primary filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mr-2">Role:</span>
          <Link
            href={buildHref({ role: undefined })}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              !role ? 'bg-on-surface text-on-primary' : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
            }`}
          >
            All Roles
          </Link>
          {ROLES.map(r => (
            <Link
              key={r.key}
              href={buildHref({ role: role === r.key ? undefined : r.key })}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                role === r.key
                  ? 'bg-on-surface text-on-primary'
                  : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
              }`}
            >
              {r.label}
            </Link>
          ))}
        </div>

        {/* Challenge Type Filter (formerly Paradigm) */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mr-2">Challenge Type:</span>
          {PARADIGMS.map(p => {
            const isActive = (paradigm ?? 'all') === p.key
            return (
              <Link
                key={p.key}
                href={buildHref({ paradigm: p.key })}
                className={`px-4 py-1.5 text-xs font-bold rounded-full flex items-center gap-2 transition-colors ${
                  isActive
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                }`}
              >
                {p.dot && (
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-on-primary' : p.dot}`} />
                )}
                {!p.dot && isActive && (
                  <span className="w-2 h-2 rounded-full bg-on-primary" />
                )}
                {p.label}
              </Link>
            )
          })}
        </div>

        {/* Challenge Type description — shown when a non-all type is active */}
        {paradigm && paradigm !== 'all' && (
          <p className="text-xs italic text-on-surface-variant pl-1">
            {paradigm === 'traditional' && 'Classic PM thinking — metrics, trade-offs, prioritization'}
            {paradigm === 'ai-assisted' && 'Using AI tools as a PM — prompting, validation, oversight'}
            {paradigm === 'agentic' && 'Multi-step AI systems — agents, evals, failure modes'}
            {paradigm === 'ai-native' && 'Products built entirely around AI — new paradigms'}
          </p>
        )}
      </div>

      {/* Recommended for you — Zhang Yiming: algorithmic surfacing above the fold */}
      {!paradigm && !role && challenges.length >= 3 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              Featured Challenges
            </h2>
            <span className="text-[10px] text-on-surface-variant font-medium">Curated picks</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {challenges.slice(0, 5).map((challenge) => (
              <ChallengeCard
                key={`rec-${challenge.id}`}
                challenge={challenge}
                paradigm={getParadigmLabel(challenge.paradigm)}
              />
            ))}
          </div>
          <div className="border-t border-outline-variant/30 mt-6 mb-2" />
        </div>
      )}

      {/* All Challenges Grid */}
      <h2 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-3">All Challenges</h2>
      {challenges.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <LumaGlyph size={64} state="idle" className="text-primary" />
          <div>
            <p className="text-base font-bold text-on-surface mb-1">No challenges match that filter</p>
            <p className="text-sm text-on-surface-variant max-w-xs">
              Try removing a filter, or{' '}
              <Link href="/challenges" className="text-primary font-bold hover:underline">
                view all challenges
              </Link>
              .
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {challenges.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              paradigm={getParadigmLabel(challenge.paradigm)}
            />
          ))}
        </div>
      )}
    </div>
  )
}


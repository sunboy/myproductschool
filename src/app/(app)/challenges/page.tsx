import { getChallenges } from '@/lib/data/challenges'
import { getDomains } from '@/lib/data/domains'
import Link from 'next/link'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import { ChallengeCard } from './ChallengeCard'

interface ChallengesPageProps {
  searchParams: Promise<{ paradigm?: string; role?: string; difficulty?: string }>
}

const PARADIGMS = [
  { key: 'all', label: 'All Paradigms', dot: null },
  { key: 'traditional', label: 'Traditional', dot: 'bg-emerald-500' },
  { key: 'ai-assisted', label: 'AI-Assisted', dot: 'bg-blue-500' },
  { key: 'agentic', label: 'Agentic', dot: 'bg-purple-500' },
  { key: 'ai-native', label: 'AI-Native', dot: 'bg-amber-500' },
] as const

const ROLES = ['SWE', 'Data Eng', 'ML Eng', 'DevOps', 'EM', 'Founding Eng'] as const

const PARADIGM_LABELS = ['Traditional', 'AI-Assisted', 'Agentic', 'AI-Native'] as const
function getParadigmLabel(index: number): string {
  return PARADIGM_LABELS[index % PARADIGM_LABELS.length]
}


export default async function ChallengesPage({ searchParams }: ChallengesPageProps) {
  const { paradigm, role, difficulty } = await searchParams
  const [, challenges] = await Promise.all([
    getDomains(),
    getChallenges({ difficulty }),
  ])

  const buildHref = (params: Record<string, string | undefined>) => {
    const p = new URLSearchParams()
    const pa = params.paradigm ?? paradigm
    const r = params.role ?? role
    const d = params.difficulty ?? difficulty
    if (pa && pa !== 'all') p.set('paradigm', pa)
    if (r) p.set('role', r)
    if (d) p.set('difficulty', d)
    const s = p.toString()
    return s ? `/challenges?${s}` : '/challenges'
  }

  return (
    <main className="p-6 max-w-7xl w-full mx-auto">
      {/* Header Section */}
      <div className="flex items-baseline gap-3 mb-6">
        <h1 className="text-2xl font-bold font-headline text-primary">Practice Hub</h1>
        <p className="text-sm text-on-surface-variant">Master product thinking through real-world scenarios.</p>
      </div>

      {/* Luma's Pick Banner */}
      <div className="bg-primary-container/20 border border-primary-container/30 rounded-xl p-4 mb-6 flex items-center gap-4">
        <LumaGlyph size={40} className="text-primary flex-shrink-0" />
        <div>
          <p className="text-sm font-bold text-primary">Luma&apos;s Pick: The Feature That Backfired</p>
          <p className="text-xs text-on-surface-variant">
            This challenge targets your weakest move <span className="font-bold">(Communication)</span>. Practice explaining trade-offs clearly.
          </p>
        </div>
        <Link
          href="/challenges/c0000001-0000-0000-0000-000000000001"
          className="ml-auto bg-primary text-on-primary text-xs font-bold px-4 py-2 rounded-full hover:opacity-90 transition-colors whitespace-nowrap"
        >
          Try Now
        </Link>
      </div>

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
              key={r}
              href={buildHref({ role: role === r ? undefined : r })}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                role === r
                  ? 'bg-on-surface text-on-primary'
                  : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
              }`}
            >
              {r}
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
              <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>recommend</span>
              Recommended for you
            </h2>
            <span className="text-[10px] text-on-surface-variant font-medium">Based on your weakest move</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {challenges.slice(0, 3).map((challenge, idx) => (
              <ChallengeCard
                key={`rec-${challenge.id}`}
                challenge={challenge}
                paradigm={getParadigmLabel(idx)}
              />
            ))}
          </div>
          <div className="border-t border-outline-variant/30 mt-6 mb-2" />
        </div>
      )}

      {/* All Challenges Grid */}
      <h2 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-3">All Challenges</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {challenges.map((challenge, idx) => (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
            paradigm={getParadigmLabel(idx)}
          />
        ))}
      </div>
    </main>
  )
}


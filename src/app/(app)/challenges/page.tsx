import { getChallenges } from '@/lib/data/challenges'
import { getDomains } from '@/lib/data/domains'
import Link from 'next/link'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import type { ChallengeWithDomain } from '@/lib/types'

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

const MOVE_DATA = [
  { label: 'Frame', symbol: '◇', color: 'text-blue-600' },
  { label: 'List', symbol: '◈', color: 'text-rose-600' },
  { label: 'Optimize', symbol: '◆', color: 'text-amber-600' },
  { label: 'Win', symbol: '◎', color: 'text-emerald-600' },
] as const

function getMoveBadges(index: number): Array<{ label: string; symbol: string; color: string }> {
  // Each card gets 1–3 moves based on index pattern
  const patterns = [
    [0, 1],
    [2, 3],
    [0, 1, 2],
    [3],
    [1, 3],
    [0, 2],
    [0, 1],
    [2, 3],
  ]
  const moves = patterns[index % patterns.length]
  return moves.map(i => MOVE_DATA[i])
}

function getCardRoles(index: number): string[] {
  const patterns = [
    ['SWE', 'EM'],
    ['ML Eng', 'SWE'],
    ['DevOps', 'ML Eng'],
    ['Founding Eng'],
    ['SWE', 'Data Eng'],
    ['Data Eng', 'ML Eng'],
    ['SWE', 'EM'],
    ['ML Eng', 'SWE'],
  ]
  return patterns[index % patterns.length]
}

const PARADIGM_LABELS = ['Traditional', 'AI-Assisted', 'Agentic', 'AI-Native'] as const
function getParadigmLabel(index: number): string {
  return PARADIGM_LABELS[index % PARADIGM_LABELS.length]
}

function getParadigmBadgeClass(paradigm: string): string {
  switch (paradigm) {
    case 'Traditional': return 'bg-emerald-100 text-emerald-800'
    case 'AI-Assisted': return 'bg-blue-100 text-blue-800'
    case 'Agentic': return 'bg-purple-100 text-purple-800'
    case 'AI-Native': return 'bg-amber-100 text-amber-800'
    default: return 'bg-surface-container-high text-on-surface-variant'
  }
}

function getDifficultyLabel(difficulty: string): string {
  switch (difficulty) {
    case 'beginner': return 'EASY'
    case 'intermediate': return 'MEDIUM'
    case 'advanced': return 'HARD'
    default: return difficulty.toUpperCase()
  }
}

function getDifficultyClass(difficulty: string): string {
  switch (difficulty) {
    case 'beginner': return 'text-on-surface-variant'
    case 'intermediate': return 'text-amber-600'
    case 'advanced': return 'text-red-600'
    default: return 'text-on-surface-variant'
  }
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
      <div className="space-y-4 mb-8">
        {/* Paradigm Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mr-2">Paradigm:</span>
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

        {/* Role Filter */}
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
      </div>

      {/* Challenge Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {challenges.map((challenge, idx) => (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
            moveBadges={getMoveBadges(idx)}
            cardRoles={getCardRoles(idx)}
            paradigm={getParadigmLabel(idx)}
          />
        ))}
      </div>
    </main>
  )
}

function ChallengeCard({
  challenge,
  moveBadges,
  cardRoles,
  paradigm,
}: {
  challenge: ChallengeWithDomain
  moveBadges: Array<{ label: string; symbol: string; color: string }>
  cardRoles: string[]
  paradigm: string
}) {
  return (
    <Link href={`/challenges/${challenge.id}`}>
      <div className="bg-surface-container rounded-xl p-4 border border-outline-variant hover:shadow-md transition-shadow flex flex-col group">
        {/* Paradigm badge + difficulty */}
        <div className="flex justify-between items-start mb-3">
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${getParadigmBadgeClass(paradigm)}`}>
            {paradigm}
          </span>
          <span className={`text-[10px] font-bold ${getDifficultyClass(challenge.difficulty)}`}>
            {getDifficultyLabel(challenge.difficulty)}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-base mb-2 group-hover:text-primary transition-colors">
          {challenge.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-on-surface-variant mb-4 line-clamp-2">
          {challenge.prompt_text}
        </p>

        {/* Role tags + move symbols */}
        <div className="flex flex-wrap gap-1.5 mb-6 mt-auto">
          {cardRoles.map(r => (
            <span key={r} className="px-2 py-0.5 bg-secondary-container text-secondary text-[10px] font-bold rounded-full">
              {r}
            </span>
          ))}
          <div className="flex gap-1 items-center ml-2 border-l border-outline-variant pl-2">
            {moveBadges.map(m => (
              <span key={m.label} className={`${m.color} text-[10px] font-bold`}>
                {m.symbol} {m.label}
              </span>
            ))}
          </div>
        </div>

        {/* Start button */}
        <button className="w-full py-2 bg-primary text-on-primary text-xs font-bold rounded-full flex items-center justify-center gap-2 group-hover:opacity-90 transition-opacity">
          Start <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </div>
    </Link>
  )
}

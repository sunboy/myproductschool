import { getChallenges } from '@/lib/data/challenges'
import { getDomains } from '@/lib/data/domains'
import Link from 'next/link'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import type { ChallengeWithDomain } from '@/lib/types'

interface ChallengesPageProps {
  searchParams: Promise<{ move?: string; paradigm?: string; role?: string; difficulty?: string }>
}

const FLOW_MOVES = [
  { key: 'all', label: 'All Moves' },
  { key: 'frame', label: 'Frame', symbol: '◇' },
  { key: 'lens', label: 'Lens', symbol: '◈' },
  { key: 'optimize', label: 'Optimize', symbol: '◆' },
  { key: 'win', label: 'Win', symbol: '◎' },
] as const

const PARADIGMS = [
  { key: 'all', label: 'All Paradigms' },
  { key: 'traditional', label: 'Traditional' },
  { key: 'ai-assisted', label: 'AI-Assisted' },
  { key: 'agentic', label: 'Agentic' },
  { key: 'ai-native', label: 'AI-Native' },
] as const

const ROLES = ['SWE', 'Data Eng', 'ML Eng', 'DevOps', 'EM', 'Founding Eng'] as const

const MOVE_DATA = [
  { label: 'Frame', symbol: '◇' },
  { label: 'Lens', symbol: '◈' },
  { label: 'Optimize', symbol: '◆' },
  { label: 'Win', symbol: '◎' },
] as const
function getMoveBadge(index: number): { label: string; symbol: string } {
  return MOVE_DATA[index % MOVE_DATA.length]
}

function getParticipantCount(index: number): number {
  const counts = [312, 487, 198, 563, 241, 89, 410, 175]
  return counts[index % counts.length]
}

const PARADIGM_COLORS = ['Traditional', 'AI-Assisted', 'Agentic', 'AI-Native'] as const
function getParadigmLabel(index: number): string {
  return PARADIGM_COLORS[index % PARADIGM_COLORS.length]
}

export default async function ChallengesPage({ searchParams }: ChallengesPageProps) {
  const { move, paradigm, role, difficulty } = await searchParams
  const [domains, challenges] = await Promise.all([
    getDomains(),
    getChallenges({ difficulty }),
  ])

  const freeChallenges = challenges.slice(0, 3)
  const premiumChallenges = challenges.slice(3)

  const buildHref = (params: Record<string, string | undefined>) => {
    const p = new URLSearchParams()
    const m = params.move ?? move
    const pa = params.paradigm ?? paradigm
    const r = params.role ?? role
    const d = params.difficulty ?? difficulty
    if (m && m !== 'all') p.set('move', m)
    if (pa && pa !== 'all') p.set('paradigm', pa)
    if (r) p.set('role', r)
    if (d) p.set('difficulty', d)
    const s = p.toString()
    return s ? `/challenges?${s}` : '/challenges'
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-3 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-extrabold text-primary">Practice Hub</h1>
          <p className="text-xs text-on-surface-variant font-body mt-0.5">Master product thinking through real-world scenarios.</p>
        </div>
        <LumaGlyph size={36} className="text-primary flex-shrink-0" />
      </div>

      {/* Luma&apos;s Pick */}
      <div className="p-4 bg-primary-fixed rounded-2xl border border-primary/20">
        <div className="flex items-center gap-3">
          <LumaGlyph size={28} className="text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold text-primary uppercase tracking-wider mb-0.5">Luma&apos;s Pick</div>
            <h3 className="font-headline text-sm font-bold text-on-surface">The Feature That Backfired</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">This challenge targets your weakest move (Communication). Practice explaining trade-offs clearly.</p>
          </div>
          <Link href="/challenges/c1000000-0000-0000-0000-000000000001" className="glow-primary inline-flex items-center gap-1 px-4 py-2 bg-primary text-on-primary rounded-full text-xs font-semibold hover:opacity-90 active:scale-95 transition-all flex-shrink-0">
            Try Now
          </Link>
        </div>
      </div>

      {/* Filter bar */}
      <div className="space-y-2">
        {/* Row 1: FLOW move tabs */}
        <div className="flex gap-1.5 flex-wrap items-center">
          <span className="text-[10px] font-bold text-on-surface-variant mr-1">Moves:</span>
          {FLOW_MOVES.map(m => (
            <Link
              key={m.key}
              href={buildHref({ move: m.key })}
              className={`px-3 py-1 rounded-full text-xs font-label font-bold transition-colors ${
                (move ?? 'all') === m.key
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {m.label}
            </Link>
          ))}
        </div>

        {/* Row 2: Paradigm filter pills */}
        <div className="flex gap-1.5 flex-wrap items-center">
          <span className="text-[10px] font-bold text-on-surface-variant mr-1">Paradigm:</span>
          {PARADIGMS.map(p => (
            <Link
              key={p.key}
              href={buildHref({ paradigm: p.key })}
              className={`px-3 py-1 rounded-full text-xs font-label font-bold transition-colors border ${
                (paradigm ?? 'all') === p.key
                  ? 'border-primary text-primary bg-primary-fixed'
                  : 'border-outline-variant text-on-surface-variant bg-surface-container hover:bg-surface-container-high'
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>

        {/* Row 3: Role chips */}
        <div className="flex gap-1.5 flex-wrap items-center">
          <span className="text-[10px] font-bold text-on-surface-variant mr-1">Role:</span>
          {ROLES.map(r => (
            <Link
              key={r}
              href={buildHref({ role: role === r ? undefined : r })}
              className={`px-3 py-1 rounded-full text-xs font-label font-bold transition-colors ${
                role === r
                  ? 'bg-secondary text-on-secondary'
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
              }`}
            >
              {r}
            </Link>
          ))}
        </div>
      </div>

      {/* Challenge cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {freeChallenges.map((challenge, idx) => (
          <ChallengeCard key={challenge.id} challenge={challenge} participantCount={getParticipantCount(idx)} moveBadge={getMoveBadge(idx)} paradigm={getParadigmLabel(idx)} />
        ))}
      </div>

      {/* Pro Access Banner */}
      {premiumChallenges.length > 0 && (
        <>
          <div className="bg-secondary-container rounded-2xl p-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-label font-semibold text-on-secondary-container text-sm">Unlock Pro Access</h3>
              <p className="text-xs text-on-secondary-container mt-0.5">Get unlimited challenges, model answers, and Luma&apos;s deeper coaching.</p>
            </div>
            <a
              href="/pricing"
              className="bg-primary text-on-primary rounded-full px-4 py-2 text-xs font-label font-semibold whitespace-nowrap hover:opacity-90 transition-opacity"
            >
              Upgrade
            </a>
          </div>

          {/* Premium Challenges */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {premiumChallenges.map((challenge, idx) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                participantCount={getParticipantCount(idx + 3)}
                moveBadge={getMoveBadge(idx + 3)}
                paradigm={getParadigmLabel(idx + 3)}
                locked
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function ChallengeCard({
  challenge,
  participantCount,
  moveBadge,
  paradigm,
  locked = false,
}: {
  challenge: ChallengeWithDomain
  participantCount: number
  moveBadge: { label: string; symbol: string }
  paradigm: string
  locked?: boolean
}) {
  const cardContent = (
    <div className={`card-elevated card-interactive rounded-2xl overflow-hidden border border-outline-variant/30 transition-all ${locked ? 'opacity-75' : ''}`}>
      <div className="p-4 space-y-2">
        {/* Paradigm + Lock indicator */}
        <div className="flex items-center justify-between">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${
            paradigm === 'Traditional' ? 'text-primary' :
            paradigm === 'AI-Assisted' ? 'text-tertiary' :
            paradigm === 'Agentic' ? 'text-primary-container' :
            'text-error'
          }`}>{paradigm}</span>
          {locked && (
            <span className="material-symbols-outlined text-on-surface-variant text-lg" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>lock</span>
          )}
          {challenge.is_completed && (
            <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>check_circle</span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-label font-bold text-on-surface text-sm">{challenge.title}</h3>

        {/* Meta row */}
        <div className="flex items-center gap-2 flex-wrap text-xs text-on-surface-variant">
          <span className={`px-2 py-0.5 rounded-full font-label font-bold uppercase text-[10px] ${
            challenge.difficulty === 'beginner'
              ? 'bg-primary-fixed text-primary'
              : challenge.difficulty === 'intermediate'
              ? 'bg-tertiary-container text-on-tertiary-container'
              : 'bg-error-container text-on-error-container'
          }`}>{challenge.difficulty === 'beginner' ? 'Easy' : challenge.difficulty === 'intermediate' ? 'Medium' : 'Hard'}</span>
          <span className="flex items-center gap-0.5 text-[11px]">
            <span className="material-symbols-outlined text-sm">schedule</span>
            ~{challenge.estimated_minutes} min
          </span>
          <span className="flex items-center gap-0.5 text-[11px]">
            <span className="material-symbols-outlined text-sm">group</span>
            {participantCount}
          </span>
        </div>

        {/* FLOW badge + Domain */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="badge-move">
            {moveBadge.symbol} {moveBadge.label}
          </span>
          <span className="text-[11px] text-on-surface-variant">{challenge.domain.title}</span>
        </div>

        {/* Action button */}
        {!locked && (
          <button className="glow-primary w-full bg-primary text-on-primary rounded-full py-2 text-xs font-label font-bold hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1">
            Start <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        )}
      </div>
    </div>
  )

  if (locked) {
    return cardContent
  }

  return (
    <Link href={`/challenges/${challenge.id}`}>
      {cardContent}
    </Link>
  )
}

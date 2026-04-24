'use client'

import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import { useMoveLevels } from '@/hooks/useMoveLevels'
import type { CareerBenchmark, FlowMove } from '@/lib/types'

function buildLinkedInUrl(moveName: string, level: number): string {
  const now = new Date()
  const certName = encodeURIComponent(`HackProduct ${moveName} Move — Level ${level}`)
  const certUrl = encodeURIComponent('https://hackproduct.io/verify')
  return `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${certName}&issueYear=${now.getFullYear()}&issueMonth=${now.getMonth() + 1}&certUrl=${certUrl}`
}

interface DnaRecommendation {
  challenge_id: string | null
  title: string | null
  reason: string | null
}

const FLOW_MOVES: FlowMove[] = ['frame', 'list', 'weigh', 'sell']

const MOVE_META: Record<FlowMove, { label: string; icon: string; description: string }> = {
  frame:  { label: 'Frame', icon: 'frame_inspect', description: 'Find the real problem behind the surface complaint' },
  list:   { label: 'List',  icon: 'format_list_bulleted', description: 'Generate structurally distinct options across stakeholders' },
  weigh:  { label: 'Weigh', icon: 'balance', description: 'Name the tradeoff and the criterion that resolves it' },
  sell:   { label: 'Sell',  icon: 'campaign', description: 'Frame the win so the decision-maker feels heard' },
}

const MOVE_LEVEL_NAMES: Record<FlowMove, string[]> = {
  frame: ['Frame Finder', 'Frame Builder', 'Frame Strategist', 'Frame Expert', 'Frame Master'],
  list:  ['List Finder',  'List Builder',  'List Strategist',  'List Expert',  'List Master'],
  weigh: ['Weigh Finder', 'Weigh Builder', 'Weigh Strategist', 'Weigh Expert', 'Weigh Master'],
  sell:  ['Sell Finder',  'Sell Builder',  'Sell Strategist',  'Sell Expert',  'Sell Master'],
}

function SkillLadderContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { moves } = useMoveLevels()
  const [benchmark, setBenchmark] = useState<CareerBenchmark | null>(null)
  const [recommendation, setRecommendation] = useState<DnaRecommendation | null>(null)

  useEffect(() => {
    fetch('/api/career-benchmark')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setBenchmark(data) })
      .catch(() => {})
    fetch('/api/dna/recommend')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setRecommendation(data) })
      .catch(() => {})
  }, [])

  const moveParam = searchParams.get('move') as FlowMove | null
  const validMoves = moves.filter(m => FLOW_MOVES.includes(m.move))
  const weakestMove: FlowMove = validMoves.length > 0
    ? validMoves.reduce((a, b) => a.progress_pct < b.progress_pct ? a : b).move
    : 'frame'
  const selectedMove: FlowMove = (moveParam && FLOW_MOVES.includes(moveParam)) ? moveParam : weakestMove

  const focusMove = moves.find(m => m.move === selectedMove)
  const meta = MOVE_META[selectedMove] ?? MOVE_META['frame']
  const moveLevelNames = MOVE_LEVEL_NAMES[selectedMove]
  const moveLevel = focusMove?.level ?? 1
  const moveProgress = focusMove?.progress_pct ?? 0
  const moveXp = focusMove?.xp ?? 0
  const userLevel = benchmark?.user_level ?? 'PM-2'

  // Other moves for Related Skills sidebar
  const otherMoves = FLOW_MOVES.filter(m => m !== selectedMove)

  function selectMove(move: FlowMove) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('move', move)
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 animate-fade-in-up">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-on-surface-variant font-medium mb-6">
        <Link href="/progress" className="hover:text-primary transition-colors">Progress</Link>
        <span className="material-symbols-outlined text-[10px]">chevron_right</span>
        <span>Skill Ladder</span>
        <span className="material-symbols-outlined text-[10px]">chevron_right</span>
        <span className="text-primary font-bold flex items-center gap-1">
          {meta.label} Move
          <span className="material-symbols-outlined text-[12px]">{meta.icon}</span>
        </span>
      </nav>

      {/* Move selector tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {FLOW_MOVES.map(move => {
          const m = MOVE_META[move]
          const moveData = moves.find(md => md.move === move)
          const isSelected = move === selectedMove
          return (
            <button
              key={move}
              onClick={() => selectMove(move)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                isSelected
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-surface-container-low text-on-surface-variant border-outline-variant hover:border-outline hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: isSelected ? "'FILL' 1" : "'FILL' 0" }}>
                {m.icon}
              </span>
              {m.label}
              {moveData && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-surface-container-high text-on-surface-variant'
                }`}>
                  L{moveData.level}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm">
          <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>{meta.icon}</span>
        </div>
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-headline font-bold text-primary">{meta.label} Move</h1>
            <span className="bg-primary-fixed text-primary px-3 py-0.5 rounded-full text-xs font-bold border border-primary/20">
              Level {moveLevel} — {moveLevelNames[moveLevel - 1]}
            </span>
          </div>
          <p className="text-on-surface-variant text-sm mt-1">{meta.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column */}
        <div className="lg:col-span-8 space-y-4">

          {/* Hatch coaching card */}
          <div className="bg-surface-container rounded-xl p-5 flex items-center gap-5 border border-outline-variant">
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-full border-2 border-primary flex items-center justify-center overflow-hidden bg-primary-fixed">
                <HatchGlyph size={48} state="speaking" className="text-primary" />
              </div>
              <div className="absolute -top-1 -right-1 bg-primary text-white p-0.5 rounded-full border border-white">
                <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
              </div>
            </div>
            <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant relative before:content-[''] before:absolute before:-left-2 before:top-4 before:w-4 before:h-4 before:bg-surface-container-low before:rotate-45 before:border-l before:border-b before:border-outline-variant">
              <p className="text-sm font-medium text-on-surface">
                You&apos;re {moveLevel < 5 ? `${Math.ceil((1 - moveProgress / 100) * 8)} challenges` : 'at the top'} away from Level {Math.min(moveLevel + 1, 5)}. Here&apos;s exactly what that unlocks.
              </p>
            </div>
          </div>

          {/* Skill ladder rungs */}
          <div className="space-y-3">

            {/* Level 1 — completed if level > 1 */}
            {moveLevel >= 2 ? (
              <div className="bg-primary text-white rounded-xl p-5 flex items-center gap-4 relative overflow-hidden border border-primary">
                <div className="absolute right-0 top-0 h-full w-24 bg-white/10 -skew-x-12 translate-x-10" />
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm">Level 1 — {moveLevelNames[0]} · Beginner</h3>
                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold">🥉 Earned</span>
                  </div>
                  <p className="text-xs text-white/80 mt-0.5">Typical: APM / Junior PM</p>
                </div>
                <button
                  onClick={() => router.push('/profile/share')}
                  className="bg-white text-primary px-4 py-1.5 rounded-full text-xs font-bold hover:bg-white/90 transition-colors shrink-0"
                >
                  Share →
                </button>
              </div>
            ) : (
              /* Level 1 is current */
              <CurrentLevelCard
                level={1}
                label={moveLevelNames[0]}
                tier="Beginner"
                moveLabel={meta.label}
                moveProgress={moveProgress}
                moveXp={moveXp}
                recommendation={recommendation}
                selectedMove={selectedMove}
              />
            )}

            {/* Level 2 */}
            {moveLevel > 2 ? (
              <CompletedRung level={2} label={moveLevelNames[1]} tier="Developing" />
            ) : moveLevel === 2 ? (
              <CurrentLevelCard
                level={2}
                label={moveLevelNames[1]}
                tier="Developing"
                focus="Multi-stakeholder alignment & edge-case discovery"
                moveLabel={meta.label}
                moveProgress={moveProgress}
                moveXp={moveXp}
                recommendation={recommendation}
                selectedMove={selectedMove}
              />
            ) : (
              <LockedRung level={2} label={moveLevelNames[1]} opacity="opacity-70" requirement="Complete 4 more Frame challenges" />
            )}

            {/* Level 3 */}
            {moveLevel > 3 ? (
              <CompletedRung level={3} label={moveLevelNames[2]} tier="Proficient" />
            ) : moveLevel === 3 ? (
              <CurrentLevelCard
                level={3}
                label={moveLevelNames[2]}
                tier="Proficient"
                focus="System-wide perspective & competitive positioning"
                moveLabel={meta.label}
                moveProgress={moveProgress}
                moveXp={moveXp}
                recommendation={recommendation}
                selectedMove={selectedMove}
              />
            ) : (
              <LockedRung level={3} label={moveLevelNames[2]} opacity="opacity-70" requirement={`Complete 6 more ${meta.label} challenges (2 Hard)`} showBadge />
            )}

            {/* Level 4 */}
            {moveLevel > 4 ? (
              <CompletedRung level={4} label={moveLevelNames[3]} tier="Expert" />
            ) : moveLevel === 4 ? (
              <CurrentLevelCard
                level={4}
                label={moveLevelNames[3]}
                tier="Expert"
                focus="Cross-functional leadership & strategic defensibility"
                moveLabel={meta.label}
                moveProgress={moveProgress}
                moveXp={moveXp}
                recommendation={recommendation}
                selectedMove={selectedMove}
              />
            ) : (
              <LockedRung level={4} label={moveLevelNames[3]} opacity="opacity-50" requirement="Master system-wide perspective moves" />
            )}

            {/* Level 5 */}
            {moveLevel === 5 ? (
              <CurrentLevelCard
                level={5}
                label={moveLevelNames[4]}
                tier="Master"
                focus="Full FLOW mastery — all four moves at senior level"
                moveLabel={meta.label}
                moveProgress={moveProgress}
                moveXp={moveXp}
                recommendation={recommendation}
                selectedMove={selectedMove}
              />
            ) : (
              <LockedRung level={5} label={moveLevelNames[4]} opacity="opacity-30" requirement="FLOW Mastery" isDiamond />
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 space-y-4">

          {/* Live Credential */}
          <div className="bg-surface-container rounded-xl p-5 border border-outline-variant">
            <h3 className="text-sm font-bold text-on-surface mb-4">Live credential</h3>
            <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant flex flex-col items-center text-center mb-4">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white mb-4 shadow-md">
                <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>{meta.icon}</span>
              </div>
              <h4 className="text-lg font-headline font-bold text-primary">{moveLevelNames[moveLevel - 1]}</h4>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mt-1">Level {moveLevel}</p>
              <div className="mt-4 flex items-center gap-2 bg-primary-fixed px-3 py-1 rounded-full text-[10px] font-black text-primary">
                <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                HACKPRODUCT VERIFIED
              </div>
            </div>
            <a
              href={buildLinkedInUrl(meta.label, moveLevel)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-white py-2.5 rounded-full text-sm font-bold flex items-center justify-center gap-2 shadow transition-colors hover:opacity-90"
              style={{ backgroundColor: '#0077b5' }}
            >
              <span className="material-symbols-outlined text-lg">add_circle</span>
              Add to LinkedIn profile →
            </a>
          </div>

          {/* Career Benchmark */}
          <div className="bg-surface-container rounded-xl p-5 border border-outline-variant">
            <h3 className="text-sm font-bold text-on-surface mb-4">Career benchmark</h3>
            <div className="space-y-4 pt-4">
              <div className="relative h-1 bg-outline-variant rounded-full mb-8">
                <div className="absolute left-0 -top-1 w-3 h-3 bg-outline-variant rounded-full">
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-bold text-on-surface-variant whitespace-nowrap">APM</div>
                </div>
                <div className="absolute left-[33%] -top-1 w-3 h-3 bg-primary/40 rounded-full">
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-bold text-on-surface-variant whitespace-nowrap">PM</div>
                </div>
                <div className="absolute left-[45%] -top-4 w-0.5 bg-primary h-6 flex flex-col items-center">
                  <div className="absolute -top-7 bg-primary text-white text-[9px] px-2 py-0.5 rounded-full font-black shadow-sm whitespace-nowrap">YOU</div>
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-black text-primary whitespace-nowrap">{userLevel}</div>
                </div>
                <div className="absolute left-[66%] -top-1 w-3 h-3 bg-outline-variant rounded-full">
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-bold text-on-surface-variant whitespace-nowrap">Senior</div>
                </div>
                <div className="absolute right-0 -top-1 w-3 h-3 bg-outline-variant rounded-full">
                  <div className="absolute -bottom-6 right-0 text-[9px] font-bold text-on-surface-variant whitespace-nowrap">Principal</div>
                </div>
              </div>
              <p className="text-[11px] text-on-surface-variant italic leading-relaxed pt-2">
                {benchmark?.hatch_message ?? `Your ${meta.label} Move skill places you in the developing range. Complete more challenges to advance your benchmark.`}
              </p>
            </div>
          </div>

          {/* Related Skills — other FLOW moves */}
          <div className="bg-surface-container rounded-xl p-5 border border-outline-variant">
            <h3 className="text-sm font-bold text-on-surface mb-3">Other FLOW moves</h3>
            <div className="grid grid-cols-1 gap-2">
              {otherMoves.map(move => {
                const moveData = moves.find(m => m.move === move)
                const m = MOVE_META[move]
                return (
                  <button
                    key={move}
                    onClick={() => selectMove(move)}
                    className="bg-surface-container-low p-3 rounded-lg border border-outline-variant hover:border-outline hover:bg-surface-container-high transition-all text-left flex items-center gap-3"
                  >
                    <div className="w-8 h-8 bg-primary-fixed rounded-lg flex items-center justify-center text-primary shrink-0">
                      <span className="material-symbols-outlined text-base">{m.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-on-surface uppercase tracking-wide">{m.label}</p>
                      <p className="text-[10px] text-on-surface-variant truncate">{m.description}</p>
                    </div>
                    <span className="text-xs font-bold text-on-surface-variant shrink-0">
                      L{moveData?.level ?? 1}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* FLOW framework note */}
          <div className="bg-tertiary-container/30 rounded-xl p-4 border border-tertiary/20 flex gap-3 items-start">
            <span className="material-symbols-outlined text-tertiary text-lg">info</span>
            <p className="text-[11px] text-tertiary font-medium leading-tight">
              <span className="font-bold block mb-0.5">FLOW Framework</span>
              The {meta.label} move is one of 4 FLOW thinking moves: Frame · List · Weigh · Sell
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Sub-components ─── */

function CompletedRung({ level, label, tier }: { level: number; label: string; tier: string }) {
  return (
    <div className="bg-primary text-white rounded-xl p-5 flex items-center gap-4 relative overflow-hidden border border-primary">
      <div className="absolute right-0 top-0 h-full w-24 bg-white/10 -skew-x-12 translate-x-10" />
      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-bold text-sm">Level {level} — {label} · {tier}</h3>
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold">🥉 Earned</span>
        </div>
      </div>
    </div>
  )
}

function LockedRung({
  level, label, opacity, requirement, showBadge, isDiamond
}: {
  level: number; label: string; opacity: string; requirement: string; showBadge?: boolean; isDiamond?: boolean
}) {
  return (
    <div className={`bg-surface-container-high border border-outline-variant rounded-xl p-5 flex items-center gap-4 ${opacity}`}>
      <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-outline">lock</span>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-on-surface-variant text-sm">Level {level} — {label}</h3>
          {showBadge && (
            <span className="material-symbols-outlined text-outline text-lg" style={{ fontVariationSettings: "'FILL' 0" }}>workspace_premium</span>
          )}
        </div>
        <p className="text-xs text-on-surface-variant mt-0.5">{requirement}</p>
      </div>
      <div className="w-10 h-10 rounded-lg bg-surface-container-highest/50 flex items-center justify-center border border-dashed border-outline-variant">
        <span className="material-symbols-outlined text-outline-variant text-xl">
          {isDiamond ? 'diamond' : 'military_tech'}
        </span>
      </div>
    </div>
  )
}

function CurrentLevelCard({
  level, label, tier, focus, moveLabel, moveProgress, moveXp, recommendation, selectedMove
}: {
  level: number
  label: string
  tier: string
  focus?: string
  moveLabel: string
  moveProgress: number
  moveXp: number
  recommendation: DnaRecommendation | null
  selectedMove: FlowMove
}) {
  const xpForNextLevel = 2000
  return (
    <div className="bg-primary-fixed border-2 border-primary rounded-xl p-6 relative">
      <div className="absolute -left-3 top-6 bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center shadow-md">
        <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
      </div>
      <div className="flex justify-between items-start mb-4 flex-wrap gap-2">
        <div>
          <h3 className="font-bold text-primary text-base">Level {level} — {label} · {tier}</h3>
          {focus && <p className="text-xs text-on-surface-variant font-medium mt-0.5">Focus: {focus}</p>}
        </div>
        <span className="bg-tertiary-container text-tertiary px-3 py-1 rounded-full text-xs font-bold border border-tertiary/20">
          {Math.max(0, Math.ceil((1 - moveProgress / 100) * 8))} challenges remaining
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-5">
        <div className="flex justify-between text-xs font-bold mb-1.5 text-on-surface">
          <span>Progress to Level {level + 1}</span>
          <span>{moveXp.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP · {moveProgress}%</span>
        </div>
        <div className="w-full bg-white/50 rounded-full h-3 p-0.5 border border-primary/20">
          <div
            className="bg-primary h-full rounded-full transition-all duration-1000"
            style={{ width: `${Math.min(100, moveProgress)}%` }}
          />
        </div>
      </div>

      {/* Hatch's pick */}
      <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-primary/10">
        <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Hatch&apos;s pick for you</p>
        {recommendation?.challenge_id ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-surface-container rounded-lg flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined">analytics</span>
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-on-surface truncate">{recommendation.title}</h4>
                <span className="text-[10px] text-on-surface-variant font-medium">{moveLabel} · Hard</span>
              </div>
            </div>
            <Link
              href={`/workspace/challenges/${recommendation.challenge_id}`}
              className="bg-primary text-white px-5 py-2 rounded-full text-sm font-bold hover:shadow-md transition-all active:scale-95 shrink-0"
            >
              Start →
            </Link>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-surface-container rounded-lg flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined">fitness_center</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-on-surface">Practice your {moveLabel} move</h4>
                <span className="text-[10px] text-on-surface-variant">Beginner–Intermediate</span>
              </div>
            </div>
            <Link
              href={`/challenges?move=${selectedMove}`}
              className="bg-primary text-white px-5 py-2 rounded-full text-sm font-bold hover:shadow-md transition-all active:scale-95 shrink-0"
            >
              Browse →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SkillLadderPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 text-on-surface-variant">Loading skill ladder…</div>}>
      <SkillLadderContent />
    </Suspense>
  )
}

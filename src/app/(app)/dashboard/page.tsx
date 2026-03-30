'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useMemo } from 'react'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import { useMoveLevels } from '@/hooks/useMoveLevels'
import { useProfile } from '@/hooks/useProfile'
import { useCohort } from '@/hooks/useCohort'

/* ── Move Colors ─────────────────────────────────────────────── */

// Move-specific accent colors are not in the design system token set;
// they are used only in SVG/style attributes (not className).
const MOVE_COLORS: Record<string, string> = {
  frame:  '#5eaeff',
  list:   '#2dd4a0',
  optimize: '#f59e0b',
  win:    '#a78bfa',
  // legacy aliases
  split:  '#2dd4a0',
  weigh:  '#f59e0b',
  sell:   '#a78bfa',
}

const MOVE_SYMBOLS: Record<string, string> = {
  frame: '◇', list: '◈', optimize: '◆', win: '◎',
}

const noCalMoves = [
  { name: 'Frame', symbol: '◇', color: MOVE_COLORS.frame, icon: 'crop_free' },
  { name: 'List',  symbol: '◈', color: MOVE_COLORS.list,  icon: 'grid_view', filled: true },
  { name: 'Optimize', symbol: '◆', color: MOVE_COLORS.optimize, icon: 'balance', filled: true },
  { name: 'Win',   symbol: '◎', color: MOVE_COLORS.win,   icon: 'campaign' },
]

const NEXT_CHALLENGES_MOCK = [
  { id: 'a0000001-0000-0000-0000-000000000001', title: 'Model Accuracy Up, Engagement Down', paradigm: 'AI-Assisted', difficulty: 'Advanced', roles: ['ML Eng', 'SWE', 'Data Eng'] },
  { id: 'c0000001-0000-0000-0000-000000000005', title: 'New Feature vs. Tech Debt: Allocating Next Quarter', paradigm: 'AI-Assisted', difficulty: 'Advanced', roles: ['SWE', 'EM'] },
  { id: 'c0000001-0000-0000-0000-000000000006', title: 'Checkout Funnel: Page 3 Drop-off Spike', paradigm: 'Agentic', difficulty: 'Intermediate', roles: ['SWE', 'ML Eng'] },
]

/* ── Returning User Dashboard ────────────────────────────────── */

function ReturningDashboard() {
  const router = useRouter()
  const [challengeIdx, setChallengeIdx] = useState(0)
  const [nextChallenges, setNextChallenges] = useState(NEXT_CHALLENGES_MOCK)
  const [quickTake, setQuickTake] = useState<{ id: string; scenario_text: string; move: string } | null>(null)
  const [quickTakePool, setQuickTakePool] = useState<Array<{ id: string; scenario_text: string; move: string }>>([])
  const [quickTakeIdx, setQuickTakeIdx] = useState(0)
  const [inProgressChallenge, setInProgressChallenge] = useState<{ id: string; title: string; stepsCompleted: number } | null>(null)
  const { moves, isLoading: movesLoading } = useMoveLevels()
  const { profile } = useProfile()
  const { challenge: cohortChallenge, submission: cohortSubmission, leaderboard: cohortLeaderboard } = useCohort()

  useEffect(() => {
    fetch('/api/challenges/next')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.length) setNextChallenges(data) })
      .catch(() => {})

    // Fetch most recent in-progress draft (Zhang Yiming: continue where you left off)
    fetch('/api/challenges/drafts?limit=1')
      .then(r => r.ok ? r.json() : null)
      .then((data: { id: string; challenge_id: string; challenge_title: string; steps_completed: number }[] | null) => {
        if (data?.[0]) {
          setInProgressChallenge({
            id: data[0].challenge_id,
            title: data[0].challenge_title,
            stepsCompleted: data[0].steps_completed ?? 1,
          })
        }
      })
      .catch(() => {})

    // Fetch a small pool for quick takes so we can cycle them
    fetch('/api/challenges/quick-take')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.id) {
          setQuickTake(data)
          setQuickTakePool([data])
        }
      })
      .catch(() => {})
  }, [])

  const activeQuickTake = quickTakePool[quickTakeIdx] ?? quickTake
  const cycleQuickTake = () => setQuickTakeIdx(i => (i + 1) % Math.max(1, quickTakePool.length))

  const nextChallenge = nextChallenges[challengeIdx] ?? nextChallenges[0]

  // Build move levels for display — fall back to mock if API empty
  const displayMoves = moves.length > 0
    ? moves.map(m => ({
        name: m.move.charAt(0).toUpperCase() + m.move.slice(1),
        symbol: MOVE_SYMBOLS[m.move] ?? '◇',
        color: MOVE_COLORS[m.move] ?? '#4a7c59',
        level: m.level,
        progress: m.progress_pct,
        nextLevel: m.level + 1,
      }))
    : [
        { name: 'Frame', symbol: '◇', color: MOVE_COLORS.frame, level: 2, progress: 68, nextLevel: 3 },
        { name: 'List',  symbol: '◈', color: MOVE_COLORS.list,  level: 3, progress: 22, nextLevel: 4 },
        { name: 'Optimize', symbol: '◆', color: MOVE_COLORS.optimize, level: 1, progress: 90, nextLevel: 2 },
        { name: 'Win',   symbol: '◎', color: MOVE_COLORS.win,   level: 1, progress: 45, nextLevel: 2 },
      ]

  const streakDays = profile?.streak_days ?? 0
  const xpTotal = profile?.xp_total ?? 0
  // Use xpTotal > 0 as the returning-user signal (any XP means they've completed at least one challenge)
  const hasAttempts = xpTotal > 0

  // Focus move: highest level (ties broken by progress_pct)
  const focusMove = moves.length > 0
    ? [...moves].sort((a, b) => b.level - a.level || b.progress_pct - a.progress_pct)[0]
    : null

  const daysLeft = useMemo(() => {
    if (!cohortChallenge?.week_end) return null
    const end = new Date(cohortChallenge.week_end)
    const now = new Date()
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diff > 0 ? diff : 0
  }, [cohortChallenge])

  const myRank = useMemo(() => {
    if (!cohortSubmission || !cohortLeaderboard.length) return null
    const idx = cohortLeaderboard.findIndex(e => e.user_id === cohortSubmission.user_id)
    return idx >= 0 ? idx + 1 : null
  }, [cohortSubmission, cohortLeaderboard])

  // Certification progress — derived from move levels (cert requires Level 3 in all 4 moves)
  // Each move contributes 25% max; each level contributes 25/3 ≈ 8.33% per level
  const certProgressPct = useMemo(() => {
    if (moves.length === 0) return 42 // fallback if no data yet
    const MAX_LEVEL = 3
    const perMoveMax = 25
    const total = moves.reduce((sum, m) => {
      const levelPct = Math.min(m.level, MAX_LEVEL) / MAX_LEVEL
      const withinLevel = m.progress_pct / 100 / MAX_LEVEL
      return sum + (levelPct + withinLevel) * perMoveMax
    }, 0)
    // Pad to 4 moves if fewer tracked
    const scale = 4 / Math.max(moves.length, 1)
    return Math.round(Math.min(total * scale, 100))
  }, [moves])

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* XP + Streak Status Bar — Luis von Ahn: persistent visible XP counter */}
      <div className="flex items-center gap-3">
        {streakDays > 0 ? (
          <div className="flex items-center gap-2 bg-tertiary/10 border border-tertiary/20 rounded-full px-4 py-2">
            <span className="material-symbols-outlined text-tertiary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
            <span className="font-bold text-tertiary text-sm">{streakDays}-day streak</span>
            <div className="flex gap-0.5 ml-1">
              {Array.from({ length: Math.min(7, streakDays) }).map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-tertiary" />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-surface-container border border-outline-variant/50 rounded-full px-4 py-2">
            <span className="material-symbols-outlined text-on-surface-variant text-base">local_fire_department</span>
            <span className="text-sm text-on-surface-variant">Start a streak today</span>
          </div>
        )}
        {xpTotal > 0 && (
          <div className="flex items-center gap-2 bg-primary-fixed/50 border border-primary-fixed rounded-full px-4 py-2">
            <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            <span className="font-black text-primary text-sm">{xpTotal.toLocaleString()} XP</span>
          </div>
        )}
      </div>

      {/* 1. Luma Greeting Card */}
      <section className="flex items-center gap-4 bg-primary-fixed/30 rounded-xl p-4 border border-primary/10">
        <LumaGlyph size={40} state="idle" className="text-primary shrink-0" />
        <p className="text-sm font-medium text-on-surface">
          {streakDays > 0 ? (
            <>You&apos;re on a <span className="font-bold">{streakDays}-day streak</span> with{' '}
            <span className="font-bold">{xpTotal.toLocaleString()} XP</span>! </>
          ) : (
            <>No streak yet — complete a challenge today to start one! </>
          )}
          Your <span className="font-bold">Frame</span> skills jumped last session. Try a Quick Take to keep the momentum.
        </p>
      </section>

      {/* 2. This Week's Community Challenge (cohort pinned card) */}
      {cohortChallenge && (
        <section className="bg-inverse-surface text-inverse-on-surface rounded-xl p-5">
          {/* Header row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span
                className="material-symbols-outlined text-base"
                style={{ color: '#8ecf9e', fontVariationSettings: "'FILL' 1" }}
              >
                emoji_events
              </span>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#8ecf9e' }}>
                This Week&apos;s Community Challenge
              </span>
            </div>
            {daysLeft !== null && (
              <span
                className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#f5f0e8' }}
              >
                {daysLeft === 0 ? 'Ends today' : `${daysLeft}d left`}
              </span>
            )}
          </div>

          {/* Title + move tag */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="font-headline text-lg font-bold leading-snug" style={{ color: '#f5f0e8' }}>
              {cohortChallenge.title}
            </h3>
            {cohortChallenge.move_tag && (
              <span className="shrink-0 bg-primary-fixed text-on-surface text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
                {cohortChallenge.move_tag}
              </span>
            )}
          </div>

          {/* Peer signal */}
          <div className="flex items-center gap-1.5 mb-4 text-xs" style={{ color: '#a0a8a0' }}>
            <span className="material-symbols-outlined text-sm">group</span>
            <span>{cohortLeaderboard.length} engineers submitted this week</span>
          </div>

          {/* CTA / submission status */}
          {cohortSubmission ? (
            <Link
              href="/cohort"
              className="inline-flex items-center gap-2 text-sm font-bold"
              style={{ color: '#8ecf9e' }}
            >
              <span
                className="material-symbols-outlined text-sm"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
              Submitted · {myRank ? `You ranked #${myRank} this week` : 'View leaderboard'}
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          ) : (
            <Link
              href="/cohort"
              className="inline-flex items-center gap-2 bg-primary text-on-primary rounded-full px-5 py-2 text-sm font-bold hover:brightness-110 transition-all"
            >
              Join Challenge
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          )}
        </section>
      )}

      {/* 3. Social proof strip — Wes Kao: community activity ticker */}
      <div className="flex items-center gap-4 text-xs text-on-surface-variant bg-surface-container rounded-xl px-4 py-3">
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm text-primary">group</span>
          <span><strong className="text-on-surface">47</strong> engineers practiced today</span>
        </span>
        <span className="text-outline-variant">·</span>
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm text-tertiary">local_fire_department</span>
          <span><strong className="text-on-surface">12</strong> on a streak this week</span>
        </span>
        <span className="text-outline-variant">·</span>
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
          <span>Alex Chen just scored <strong className="text-on-surface">94/100</strong> on Spotify Diagnosis</span>
        </span>
      </div>

      {/* 3b. Certification progress — Sebastian Thrun: outcomes story */}
      <section className="flex items-center gap-4 bg-surface-container-low border border-outline-variant/30 rounded-xl px-5 py-3">
        <span className="material-symbols-outlined text-primary/60 text-2xl">verified</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-on-surface">HackProduct Certified</p>
            <span className="text-[10px] text-on-surface-variant font-bold">{certProgressPct}% complete</span>
          </div>
          <div className="w-full bg-outline-variant/30 h-1.5 rounded-full overflow-hidden">
            <div className="h-full bg-primary/60 rounded-full" style={{ width: `${certProgressPct}%` }} />
          </div>
        </div>
        <Link href="/progress" className="text-xs font-bold text-primary hover:opacity-80 transition-opacity shrink-0 flex items-center gap-1">
          View path
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </Link>
      </section>

      {/* 4. Your Progress Banner — only shown when move data exists */}
      {focusMove && (
        <section className="bg-primary-fixed border border-primary/20 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 flex items-center justify-center bg-primary/10 rounded-lg shrink-0">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <p className="text-sm font-bold text-on-surface">
                Level {focusMove.level}{' '}
                <span className="text-primary">
                  {focusMove.move.charAt(0).toUpperCase() + focusMove.move.slice(1)} Builder
                </span>
              </p>
              <span className="text-xs text-on-surface-variant font-label shrink-0">
                {focusMove.xp} XP
              </span>
            </div>
            <div className="w-full bg-primary/10 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700"
                style={{ width: `${focusMove.progress_pct}%` }}
              />
            </div>
            <p className="text-xs text-on-surface-variant mt-1.5">{focusMove.progress_pct}% toward Level {focusMove.level + 1}</p>
          </div>
          <Link
            href="/progress/skill-ladder"
            className="text-xs font-bold text-primary flex items-center gap-1 shrink-0 hover:opacity-80 transition-opacity"
          >
            View ladder
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </section>
      )}

      {/* 4b. In-Progress Challenge — Zhang Yiming: continue where you left off */}
      {inProgressChallenge && (
        <section className="flex items-center gap-4 bg-tertiary/10 border border-tertiary/20 rounded-xl px-5 py-3">
          <span className="material-symbols-outlined text-tertiary text-xl shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>edit_note</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-tertiary mb-0.5">Continue where you left off</p>
            <p className="text-sm font-semibold text-on-surface truncate">{inProgressChallenge.title}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-bold text-tertiary bg-tertiary/10 px-2.5 py-1 rounded-full">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            Step {inProgressChallenge.stepsCompleted}/4
          </div>
          <Link
            href={`/challenges/${inProgressChallenge.id}`}
            className="shrink-0 bg-tertiary text-white rounded-full px-4 py-1.5 text-xs font-bold hover:opacity-90 transition-opacity"
          >
            Resume
          </Link>
        </section>
      )}

      {/* 5. Two-Column Grid — Quick Take leads for returning users */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Quick Take card */}
        <div
          className="bg-surface-container rounded-xl p-4 flex flex-col relative overflow-hidden"
          style={{ order: hasAttempts ? 1 : 2 }}
        >
          <div
            className="absolute top-4 right-16 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
            style={{ backgroundColor: MOVE_COLORS[activeQuickTake?.move ?? 'frame'] ?? MOVE_COLORS.frame }}
          >
            {(activeQuickTake?.move ?? 'Frame').charAt(0).toUpperCase() + (activeQuickTake?.move ?? 'frame').slice(1)} ◇
          </div>
          {/* Different question button — Zhang Yiming: algorithmic freshness */}
          <button
            onClick={cycleQuickTake}
            className="absolute top-3 right-4 p-1 hover:bg-surface-container-high rounded-full transition-colors"
            title="Different question"
          >
            <span className="material-symbols-outlined text-on-surface-variant text-base">refresh</span>
          </button>
          <div className="mb-4">
            <h2 className="font-headline text-lg font-bold text-on-surface">
              Quick Take
            </h2>
            <p className="text-xs text-on-surface-variant font-medium">Grade in 60 seconds · No commitment</p>
          </div>
          <div className="flex-1 space-y-4">
            <p className="text-sm font-semibold text-on-surface leading-relaxed">
              &ldquo;{activeQuickTake?.scenario_text ?? "Your app's DAU is up 20% but revenue is flat. What's the first question you ask?"}&rdquo;
            </p>
            <textarea
              className="w-full bg-white rounded-lg p-3 text-sm focus:ring-1 ring-primary placeholder:text-on-surface-variant/40 resize-none border-0 outline-none"
              placeholder="Write your thinking..."
              rows={3}
            />
          </div>
          <div className="mt-4">
            <button
              onClick={() => router.push('/challenges')}
              className="bg-primary text-on-primary rounded-full px-6 py-2 text-sm font-bold shadow-sm hover:brightness-110 transition-all"
            >
              Grade in 60s
            </button>
          </div>
        </div>

        {/* Next Challenge card */}
        <div
          className="bg-surface-container rounded-xl p-4 flex flex-col"
          style={{ order: hasAttempts ? 2 : 1 }}
        >
          <h2 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">Your Next Challenge</h2>
          <div className="flex-1 space-y-3">
            <h3 className="text-xl font-headline font-bold text-on-surface leading-tight">
              {nextChallenge.title}
            </h3>
            <div className="flex flex-wrap gap-2">
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${MOVE_COLORS.frame}33`, color: MOVE_COLORS.frame }}
              >
                {nextChallenge.paradigm}
              </span>
              <span className="text-[10px] font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">{nextChallenge.difficulty}</span>
            </div>
            <div className="flex gap-1.5">
              {nextChallenge.roles.map(r => (
                <span key={r} className="text-[9px] font-bold text-on-surface-variant bg-surface-container-highest/50 px-2 py-0.5 rounded-full border border-outline-variant/30 font-label">{r}</span>
              ))}
            </div>
            <p className="text-xs italic text-on-surface-variant">
              &ldquo;Your Communication is 2.8 — this targets that dimension&rdquo;
            </p>
          </div>
          <div className="mt-6 flex items-center gap-2">
            <Link
              href={`/challenges/${nextChallenge.id}`}
              className="flex-1 bg-primary text-on-primary rounded-full py-2.5 text-sm font-bold flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all"
            >
              Start Challenge
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
            <button
              onClick={() => setChallengeIdx(i => (i + 1) % nextChallenges.length)}
              className="px-4 py-2.5 border border-primary text-primary rounded-full hover:bg-primary/5 transition-colors"
              title="Shuffle challenge"
            >
              <span className="material-symbols-outlined text-base">refresh</span>
            </button>
          </div>
        </div>
      </section>

      {/* 4. Full-Width Card: Your Move Levels */}
      <section className="bg-surface-container rounded-xl p-4">
        <h2 className="text-sm font-semibold text-on-surface mb-6">Your Move Levels</h2>
        {movesLoading && <div className="text-xs text-on-surface-variant animate-pulse">Loading...</div>}
        <div className="space-y-5">
          {displayMoves.map((m) => (
            <div key={m.name} className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px] font-bold">
                <div className="flex items-center gap-2">
                  <span style={{ color: m.color }}>{m.name} {m.symbol}</span>
                  <span className="text-on-surface-variant">Level {m.level}</span>
                </div>
                <span className="text-on-surface-variant">{m.progress}% → Lv {m.nextLevel}</span>
              </div>
              <div className="h-2 w-full bg-white rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ backgroundColor: m.color, width: `${m.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

/* ── No-Calibration State ────────────────────────────────────── */

function NoCalibrationDashboard() {
  const router = useRouter()
  return (
    <div className="p-6 max-w-7xl mx-auto w-full space-y-8">

      {/* 1. Calibration Hero Card */}
      <section className="relative overflow-hidden bg-primary-container rounded-xl p-10 flex items-center justify-between gap-10">
        <div className="z-10 max-w-2xl">
          <h1 className="text-3xl font-headline font-bold text-on-surface mb-4">
            Discover your product thinking level
          </h1>
          <p className="text-on-surface/80 text-base mb-8 leading-relaxed max-w-lg font-body">
            Take a 10-minute calibration challenge. Luma will assess your baseline across all 4 thinking moves and assign your starting level.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/onboarding/welcome"
              className="bg-inverse-surface text-inverse-on-surface px-8 py-3 rounded-full font-bold font-label text-sm hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              Start Calibration
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
            <button
              onClick={() => router.push('/challenges')}
              className="text-on-surface font-bold text-sm hover:underline font-label"
            >
              Skip for now
            </button>
          </div>
        </div>
        <div className="relative flex items-center justify-center w-48 h-48 shrink-0">
          <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse" />
          <div className="relative flex items-center justify-center">
            <div className="absolute w-32 h-32 border-2 border-primary/30 rounded-full" />
            <div className="absolute w-24 h-24 border border-primary/50 rounded-full" />
            <div className="w-20 h-20 bg-primary rounded-2xl rotate-45 flex items-center justify-center shadow-lg">
              <LumaGlyph size={40} state="idle" className="text-on-primary -rotate-45" />
            </div>
          </div>
        </div>
        {/* Background pattern */}
        <div className="absolute -bottom-12 -right-12 w-64 h-64 opacity-10 pointer-events-none">
          <span className="material-symbols-outlined text-on-surface" style={{ fontSize: '200px' }}>hub</span>
        </div>
      </section>

      {/* 2. Move Levels — Locked State */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-headline font-bold text-on-surface">Your Thinking Moves</h2>
            <span className="material-symbols-outlined text-outline text-lg">lock</span>
          </div>
          <span className="text-xs font-semibold text-on-surface-variant bg-surface-container px-3 py-1 rounded-full font-label">
            Complete calibration to unlock
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {noCalMoves.map((m) => (
            <div
              key={m.name}
              className="bg-surface-container rounded-xl p-5 relative opacity-50 grayscale-[0.5] border border-outline-variant/30"
            >
              <span className="material-symbols-outlined absolute top-4 right-4 text-outline text-sm">lock</span>
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                style={{ backgroundColor: `${m.color}33`, color: m.color }}
              >
                <span className="material-symbols-outlined text-2xl" style={m.filled ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                  {m.icon}
                </span>
              </div>
              <h3 className="font-headline font-bold text-lg mb-1 text-on-surface">
                {m.name}
              </h3>
              <div className="flex items-center justify-between text-xs font-bold text-on-surface-variant mb-3">
                <span>Level</span>
                <span>—</span>
              </div>
              <div className="w-full bg-outline-variant h-1.5 rounded-full" />
            </div>
          ))}
        </div>
      </section>

      {/* 3. What to expect */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-outline-variant">
        {[
          {
            icon: 'psychology',
            title: '4 thinking moves assessed',
            desc: 'Evaluation of your ability to frame problems, split work, weigh trade-offs, and sell ideas.',
          },
          {
            icon: 'timer',
            title: '10 minutes, no pressure',
            desc: 'A short, scenario-based exercise designed to feel like a real product discussion.',
          },
          {
            icon: 'grade',
            title: 'Staff-level benchmarks',
            desc: 'See how you compare against expectations for Junior, Senior, and Staff product engineers.',
          },
        ].map((b) => (
          <div key={b.title} className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary">{b.icon}</span>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-1 text-on-surface font-label">{b.title}</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed font-body">{b.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* 4. Footer */}
      <footer className="flex justify-center pt-8 pb-12">
        <Link href="/challenges" className="text-primary font-bold text-sm flex items-center gap-2 hover:opacity-80 font-label">
          Or browse challenges without calibration
          <span className="material-symbols-outlined text-base">arrow_forward</span>
        </Link>
      </footer>

      {/* Luma Tip Overlay */}
      <div className="fixed bottom-6 right-6 max-w-xs bg-surface rounded-2xl shadow-xl p-4 border border-outline-variant flex gap-3 items-start z-50">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <LumaGlyph size={20} className="text-on-primary" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-primary uppercase tracking-wider mb-1 font-label">Luma&apos;s Tip</p>
          <p className="text-xs text-on-surface leading-snug font-body">
            &ldquo;Calibration helps me pick the perfect challenges for your current skill level!&rdquo;
          </p>
        </div>
      </div>
    </div>
  )
}

/* ── Page ─────────────────────────────────────────────────────── */

export default function DashboardPage() {
  const { profile, isLoading } = useProfile()

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6 flex items-center justify-center min-h-[200px]">
        <span className="text-sm text-on-surface-variant animate-pulse">Loading your dashboard...</span>
      </div>
    )
  }

  const isCalibrated = !!profile?.onboarding_completed_at

  return isCalibrated ? <ReturningDashboard /> : <NoCalibrationDashboard />
}

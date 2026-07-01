'use client'

import { useState, useEffect, useRef } from 'react'
import { HatchGlyph, type HatchState } from '@/components/shell/HatchGlyph'
import { QUESTIONS, FEEDBACK_BY_TIER } from '@/lib/calibration/questions'
import { clearOnboardingState, getOnboardingState, saveOnboardingState } from '@/lib/onboarding/state-client'
import type { OptionQuality } from '@/lib/types'
import { trackEvent } from '@/lib/posthog/client'
import { EVENT_ONBOARDING_STEP } from '@/lib/posthog/events'

// ── Types ─────────────────────────────────────────────────────────────────────

type CalScreen =
  | 'intro'
  | 'role'
  | 'context'
  | 'goal'
  | 'timeline'
  | 'flow_intro'
  | 'q0'
  | 'q1'
  | 'q2'
  | 'q3'
  | 'reading'
  | 'results'

type RoleContext = 'engineer_pm_interview' | 'engineer_on_job' | 'both'
type PrimaryGoal = 'land_pm_adjacent' | 'level_up_current' | 'ship_better' | 'explore'
type PrepTimeline = 'lt_1mo' | '1_3mo' | 'gt_3mo' | 'no_timeline'

interface CalibrationStateData {
  screen?: CalScreen
  selectedRole?: string | null
  roleContext?: RoleContext | null
  primaryGoal?: PrimaryGoal | null
  prepTimeline?: PrepTimeline | null
  targetCompany?: string | null
  answers?: Record<string, string>
}

interface Results {
  archetype: string
  archetype_description: string
  percentile: number
  hatch_observation: string
  starting_levels: Record<string, number>
  scores: Record<string, number>
  personalised_plan_slug: string | null
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CAL_SCREENS: CalScreen[] = [
  'intro', 'role', 'context', 'goal', 'timeline', 'flow_intro',
  'q0', 'q1', 'q2', 'q3', 'reading', 'results',
]

const QUESTION_SCREENS: CalScreen[] = ['q0', 'q1', 'q2', 'q3']

const ROLES = [
  { id: 'swe',            label: 'Software Engineer',   icon: 'terminal' },
  { id: 'data_eng',       label: 'Data Engineer',       icon: 'storage' },
  { id: 'ml_eng',         label: 'ML Engineer',         icon: 'model_training' },
  { id: 'devops',         label: 'DevOps / Platform',   icon: 'settings_suggest' },
  { id: 'em',             label: 'Eng Manager',         icon: 'groups' },
  { id: 'founding_eng',   label: 'Founding Engineer',   icon: 'rocket_launch' },
  { id: 'tech_lead',      label: 'Tech Lead',           icon: 'account_tree' },
  { id: 'pm',             label: 'Product Manager',     icon: 'track_changes' },
  { id: 'designer',       label: 'Designer',            icon: 'palette' },
  { id: 'data_scientist', label: 'Data Scientist',      icon: 'query_stats' },
]

const CONTEXT_OPTIONS: { id: RoleContext; label: string }[] = [
  { id: 'engineer_pm_interview', label: 'Prepping for PM-style interviews' },
  { id: 'engineer_on_job',       label: 'Sharpening product thinking on the job' },
  { id: 'both',                  label: 'Both, honestly' },
]

const GOAL_OPTIONS: { id: PrimaryGoal; label: string }[] = [
  { id: 'land_pm_adjacent', label: 'Land a PM or PM-adjacent role' },
  { id: 'level_up_current', label: 'Get promoted in my current eng role' },
  { id: 'ship_better',      label: 'Make sharper product calls at work' },
  { id: 'explore',          label: 'Just exploring product thinking' },
]

const TIMELINE_OPTIONS: { id: PrepTimeline; label: string; revealCompany: boolean }[] = [
  { id: 'lt_1mo',       label: 'Within a month',       revealCompany: true },
  { id: '1_3mo',        label: 'One to three months',  revealCompany: true },
  { id: 'gt_3mo',       label: 'Longer than that',     revealCompany: false },
  { id: 'no_timeline',  label: 'No fixed timeline',    revealCompany: false },
]

const FLOW_MOVES = [
  { key: 'frame',    label: 'Frame',    icon: '◇', color: '#4a7c59', bg: 'rgba(74,124,89,0.15)' },
  { key: 'list',     label: 'List',     icon: '◈', color: '#1565c0', bg: 'rgba(21,101,192,0.12)' },
  { key: 'optimize', label: 'Optimize', icon: '◆', color: '#ad1457', bg: 'rgba(173,20,87,0.12)' },
  { key: 'win',      label: 'Win',      icon: '◎', color: '#f57f17', bg: 'rgba(245,127,23,0.12)' },
]

const READING_PHRASES = ['Reading your answers…', 'Mapping your instincts…', 'Almost done…']

function isCalScreen(value: unknown): value is CalScreen {
  return typeof value === 'string' && CAL_SCREENS.includes(value as CalScreen)
}

function coerceAnswerMap(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const entries = Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === 'string')
  return Object.fromEntries(entries)
}

// ── Workshop SVG background ───────────────────────────────────────────────────

function WorkshopBg({ opacity = 0.12 }: { opacity?: number }) {
  return (
    <svg
      viewBox="0 0 800 600"
      className="absolute inset-0 w-full h-full pointer-events-none select-none"
      style={{ opacity }}
      fill="none"
      stroke="#4a7c59"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Desk 1: left */}
      <rect x="40" y="320" width="180" height="8" rx="2" />
      <line x1="50" y1="328" x2="50" y2="400" />
      <line x1="210" y1="328" x2="210" y2="400" />
      {/* Monitor on desk 1 */}
      <rect x="80" y="240" width="100" height="76" rx="4" />
      <line x1="128" y1="316" x2="128" y2="328" />
      <line x1="108" y1="328" x2="148" y2="328" />
      <line x1="96" y1="258" x2="162" y2="258" />
      <line x1="96" y1="268" x2="148" y2="268" />
      <line x1="96" y1="278" x2="155" y2="278" />
      <rect x="96" y="288" width="26" height="16" rx="2" />
      {/* Human 1 */}
      <circle cx="128" cy="210" r="18" />
      <path d="M110 235 Q128 250 146 235" />
      <line x1="128" y1="228" x2="128" y2="240" />
      {/* Desk 2: center */}
      <rect x="300" y="280" width="200" height="8" rx="2" />
      <line x1="310" y1="288" x2="310" y2="360" />
      <line x1="490" y1="288" x2="490" y2="360" />
      {/* Laptop on desk 2 */}
      <rect x="350" y="220" width="100" height="58" rx="3" />
      <path d="M340 278 L360 290 L440 290 L460 278" />
      <line x1="365" y1="232" x2="435" y2="232" />
      <line x1="365" y1="242" x2="430" y2="242" />
      <line x1="365" y1="252" x2="420" y2="252" />
      {/* Human 2 */}
      <circle cx="400" cy="190" r="18" />
      <path d="M382 215 Q400 230 418 215" />
      <line x1="400" y1="208" x2="400" y2="220" />
      <path d="M388 218 Q370 235 360 245" />
      {/* Desk 3: right */}
      <rect x="580" y="340" width="160" height="8" rx="2" />
      <line x1="590" y1="348" x2="590" y2="420" />
      <line x1="730" y1="348" x2="730" y2="420" />
      <rect x="600" y="308" width="14" height="32" rx="1" />
      <rect x="618" y="314" width="14" height="26" rx="1" />
      <rect x="636" y="318" width="14" height="22" rx="1" />
      <line x1="668" y1="300" x2="695" y2="340" />
      <path d="M668 300 L674 294 L680 300" />
      {/* Human 3: standing */}
      <circle cx="700" cy="270" r="18" />
      <line x1="700" y1="288" x2="700" y2="340" />
      <path d="M682 305 Q700 298 718 305" />
      <line x1="700" y1="340" x2="688" y2="390" />
      <line x1="700" y1="340" x2="712" y2="390" />
      {/* Whiteboard */}
      <rect x="260" y="60" width="280" height="140" rx="6" />
      <line x1="264" y1="200" x2="536" y2="200" strokeWidth="3" />
      <rect x="280" y="80" width="80" height="50" rx="2" />
      <rect x="380" y="80" width="80" height="50" rx="2" />
      <rect x="280" y="148" width="80" height="40" rx="2" />
      <rect x="380" y="148" width="80" height="40" rx="2" />
      <line x1="322" y1="130" x2="380" y2="130" />
      <line x1="322" y1="168" x2="380" y2="168" />
      <line x1="322" y1="130" x2="322" y2="168" />
      <line x1="380" y1="130" x2="380" y2="168" />
      {/* Hanging tools */}
      <line x1="100" y1="60" x2="100" y2="110" />
      <circle cx="100" cy="120" r="10" />
      <line x1="140" y1="40" x2="140" y2="100" />
      <rect x="132" y="100" width="16" height="20" rx="2" />
      {/* Floor */}
      <line x1="0" y1="430" x2="800" y2="430" strokeWidth="0.8" />
    </svg>
  )
}

// ── FLOW move strip ───────────────────────────────────────────────────────────

function FlowMoveStrip({ activeIdx, completedSet }: { activeIdx: number; completedSet: Set<number> }) {
  return (
    <div className="flex gap-1.5 w-full">
      {FLOW_MOVES.map((m, i) => {
        const isActive = i === activeIdx
        const isDone = completedSet.has(i)
        const isWaiting = i > activeIdx

        return (
          <div
            key={m.key}
            className="flex-1 flex items-center gap-1.5 px-2 py-1.5 rounded-xl transition-all duration-300"
            style={{
              background: isActive ? '#fff' : isDone ? 'rgba(74,124,89,0.10)' : m.bg,
              boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
              transform: isActive ? 'scale(1.05)' : 'scale(1)',
              opacity: isDone ? 0.45 : 1,
              animation: isWaiting ? `calWaitPulse ${1.8 + i * 0.4}s ease-in-out infinite` : 'none',
            }}
          >
            <span className="text-sm font-bold leading-none flex-shrink-0" style={{ color: isActive ? m.color : isDone ? '#888' : m.color }}>
              {m.icon}
            </span>
            <span className="text-[11px] font-label font-semibold truncate hidden sm:block" style={{ color: isActive ? m.color : '#aaa' }}>
              {m.label}
            </span>
            {isDone && (
              <span className="material-symbols-outlined text-[11px] ml-auto flex-shrink-0" style={{ color: '#4a7c59', fontVariationSettings: "'FILL' 1" }}>
                check
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Post-role FLOW card fan ───────────────────────────────────────────────────

function FlowCardFan() {
  return (
    <div className="relative w-full h-40 mt-2">
      {FLOW_MOVES.map((m, i) => (
        <div
          key={m.key}
          className="absolute rounded-2xl px-4 py-3 flex items-center gap-3 border border-outline-variant/50"
          style={{
            background: `linear-gradient(135deg, ${m.bg} 0%, rgba(250,246,240,0.8) 100%)`,
            top: i * 9,
            left: i * 5,
            right: i * 5,
            zIndex: FLOW_MOVES.length - i,
            animation: i === 0 ? 'none' : `calWaitPulse ${1.8 + i * 0.4}s ease-in-out infinite`,
            animationDelay: `${i * 0.2}s`,
            boxShadow: i === 0 ? '0 4px 16px rgba(0,0,0,0.10)' : '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <span className="text-xl font-bold" style={{ color: m.color }}>{m.icon}</span>
          <span className="font-headline font-bold text-sm text-on-surface">{m.label}</span>
          {i === 0 && (
            <span className="ml-auto text-[10px] font-label text-on-surface-variant">up first</span>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Results bar ───────────────────────────────────────────────────────────────

function ResultsBar({ move, level, score, revealDelay }: { move: typeof FLOW_MOVES[0]; level: number; score: number; revealDelay: number }) {
  const [visible, setVisible] = useState(false)
  const [filled, setFilled] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), revealDelay)
    const t2 = setTimeout(() => setFilled(true), revealDelay + 120)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [revealDelay])

  return (
    <div
      className="transition-all duration-400"
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(10px)' }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold" style={{ color: move.color }}>{move.icon}</span>
          <span className="text-sm font-label font-semibold text-on-surface">{move.label}</span>
        </div>
        <span className="text-xs font-label font-bold px-2 py-0.5 rounded-full" style={{ background: move.bg, color: move.color }}>
          Lv {level}
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden bg-surface-container-high">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: filled ? `${Math.max(score, 6)}%` : '0%',
            background: `linear-gradient(90deg, ${move.color}88, ${move.color})`,
          }}
        />
      </div>
    </div>
  )
}

// ── Single-tap option button used by context / goal / timeline screens ────────

function TapOption({
  id,
  label,
  selected,
  disabled,
  onClick,
}: {
  id: string
  label: string
  selected: boolean
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        'w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-200 active:scale-[0.98]',
        selected
          ? 'bg-primary-fixed border-primary'
          : 'bg-surface-container border-outline-variant hover:bg-surface-container-high',
      ].join(' ')}
      style={{ transform: selected ? 'scale(1.01)' : 'scale(1)' }}
    >
      <span
        className="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-150"
        style={{
          borderColor: selected ? '#4a7c59' : 'rgba(74,79,74,0.35)',
          background: selected ? '#4a7c59' : 'transparent',
        }}
      >
        {selected && (
          <span className="material-symbols-outlined text-[12px] text-white" style={{ fontVariationSettings: "'FILL' 1, 'wght' 700" }}>
            check
          </span>
        )}
      </span>
      <span className="text-[13px] text-on-surface font-body leading-relaxed">
        {label}
      </span>
    </button>
  )
}

// ── Main exported component ───────────────────────────────────────────────────

export function CalibrationFlow({
  onComplete,
}: {
  onComplete?: (path: 'challenge' | 'plan' | 'flow' | 'tour', slug?: string | null) => void
}) {
  const [screen, setScreen] = useState<CalScreen>('intro')
  const [hatchState, setHatchState] = useState<HatchState>('celebrating')
  const [visible, setVisible] = useState(true)
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [roleContext, setRoleContext] = useState<RoleContext | null>(null)
  const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoal | null>(null)
  const [prepTimeline, setPrepTimeline] = useState<PrepTimeline | null>(null)
  const [targetCompany, setTargetCompany] = useState<string>('')
  const [showFan, setShowFan] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [microFeedback, setMicroFeedback] = useState<string | null>(null)
  const [readingPhraseIdx, setReadingPhraseIdx] = useState(0)
  const [results, setResults] = useState<Results | null>(null)
  const [resultsReveal, setResultsReveal] = useState(false)
  const [stateLoaded, setStateLoaded] = useState(false)
  const [shouldPersistState, setShouldPersistState] = useState(true)
  const hasSubmitted = useRef(false)
  const profilePosted = useRef(false)
  // Holds the calibration submit request once it's been kicked off. We start it
  // the moment the 4th answer is locked (during q3 micro-feedback) so scoring
  // overlaps the reading animation instead of starting after it.
  const submitPromise = useRef<Promise<unknown> | null>(null)

  const questionIdx = QUESTION_SCREENS.indexOf(screen)
  const currentQuestion = questionIdx >= 0 ? QUESTIONS[questionIdx] : null
  const currentMove = questionIdx >= 0 ? FLOW_MOVES[questionIdx] : null
  const completedSet = new Set(QUESTION_SCREENS.slice(0, questionIdx).map((_, i) => i))

  // ── Restore-on-mount effect (RESUME — keep verbatim) ──────────────────────
  useEffect(() => {
    let cancelled = false

    getOnboardingState<CalibrationStateData>()
      .then(state => {
        if (cancelled || state?.step !== '/calibration') return
        const data = state.data ?? {}
        if (isCalScreen(data.screen) && data.screen !== 'results') setScreen(data.screen)
        if (typeof data.selectedRole === 'string') setSelectedRole(data.selectedRole)
        if (data.roleContext) setRoleContext(data.roleContext)
        if (data.primaryGoal) setPrimaryGoal(data.primaryGoal)
        if (data.prepTimeline) setPrepTimeline(data.prepTimeline)
        if (typeof data.targetCompany === 'string') setTargetCompany(data.targetCompany)
        const restoredAnswers = coerceAnswerMap(data.answers)
        if (restoredAnswers) setAnswers(restoredAnswers)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setStateLoaded(true)
      })

    return () => {
      cancelled = true
    }
  }, [])

  // ── Debounced persist effect (keep verbatim, extended with new fields) ─────
  useEffect(() => {
    if (!stateLoaded || !shouldPersistState) return
    const timeout = window.setTimeout(() => {
      saveOnboardingState('/calibration', {
        screen,
        selectedRole,
        roleContext,
        primaryGoal,
        prepTimeline,
        targetCompany: targetCompany || null,
        answers,
      }).catch(() => {})
    }, 400)

    return () => window.clearTimeout(timeout)
  }, [answers, screen, selectedRole, roleContext, primaryGoal, prepTimeline, targetCompany, shouldPersistState, stateLoaded])

  // ── Emit screen-change event (consumed by OnboardingModal illustration + close-button gating) ──
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('calibration-screen-change', { detail: screen }))
    }
  }, [screen])

  // ── Funnel instrumentation: fire onboarding_step on every screen transition ──
  useEffect(() => {
    trackEvent(EVENT_ONBOARDING_STEP, { step: screen, step_index: CAL_SCREENS.indexOf(screen) })
  }, [screen])

  // ── Intro: Hatch celebrates → speaking ────────────────────────────────────
  useEffect(() => {
    if (screen !== 'intro') return
    const t = setTimeout(() => setHatchState('speaking'), 1200)
    return () => clearTimeout(t)
  }, [screen])

  // ── Reading: cycle phrases ─────────────────────────────────────────────────
  useEffect(() => {
    if (screen !== 'reading') return
    const interval = setInterval(() => setReadingPhraseIdx(i => (i + 1) % READING_PHRASES.length), 700)
    return () => clearInterval(interval)
  }, [screen])

  // ── Reading: submit + min wait → results ──────────────────────────────────
  // Kick off the calibration submit + scoring. Called the moment the 4th answer
  // is locked (during q3 micro-feedback) so the network round-trip overlaps the
  // reading animation. Idempotent via hasSubmitted; result stored in submitPromise.
  function startSubmit(finalAnswers: Record<string, string>) {
    if (hasSubmitted.current) return submitPromise.current
    hasSubmitted.current = true

    const p = fetch('/api/onboarding/calibration/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        answers: finalAnswers,
        role: selectedRole ?? undefined,
        primary_goal: primaryGoal ?? undefined,
        prep_timeline: prepTimeline ?? undefined,
        role_context: roleContext ?? undefined,
        target_company: targetCompany || undefined,
      }),
    }).then(r => r.ok ? r.json() : null).then(data => {
      if (data) {
        setShouldPersistState(false)
        clearOnboardingState().catch(() => {})
        setResults({
          archetype: data.archetype,
          archetype_description: data.archetype_description,
          percentile: data.percentile,
          hatch_observation: data.hatch_observation,
          starting_levels: data.starting_levels,
          scores: data.scores,
          personalised_plan_slug: data.personalised_plan_slug ?? null,
        })
      }
    }).catch(() => {})

    submitPromise.current = p
    return p
  }

  useEffect(() => {
    if (screen !== 'reading') return

    // Reuse the request already in flight from the q3 answer; only start one here
    // as a fallback (e.g. resumed session that landed directly on reading).
    const doSubmit = startSubmit(answers) ?? Promise.resolve()

    // Cap how long we wait on the network so a slow/failed submit never traps
    // the user on the "Calibrating..." screen. Results degrades gracefully.
    const submitWithTimeout = Promise.race([
      doSubmit,
      new Promise<void>(r => setTimeout(r, 12000)),
    ])
    const minWait = new Promise<void>(r => setTimeout(r, 2500))
    Promise.all([submitWithTimeout, minWait]).then(() => transitionTo('results'))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen])

  // ── Results: staggered reveal ──────────────────────────────────────────────
  useEffect(() => {
    if (screen !== 'results') return
    const t = setTimeout(() => setResultsReveal(true), 300)
    return () => clearTimeout(t)
  }, [screen])

  function transitionTo(next: CalScreen) {
    setVisible(false)
    setTimeout(() => {
      setScreen(next)
      setSelectedOption(null)
      setMicroFeedback(null)
      setVisible(true)
      if (next === 'role') setHatchState('listening')
      if (next === 'context' || next === 'goal' || next === 'timeline') setHatchState('listening')
      if (next === 'flow_intro') setHatchState('speaking')
      if (next.startsWith('q')) setHatchState('listening')
      if (next === 'reading') setHatchState('reviewing')
      if (next === 'results') setHatchState('celebrating')
    }, 240)
  }

  function handleRoleSelect(roleId: string) {
    if (selectedRole) return
    setSelectedRole(roleId)
    setShowFan(true)
    setTimeout(() => transitionTo('context'), 1100)
  }

  // POST collected profile data (role + context + goal + timeline + company)
  // Called once when leaving the timeline screen
  async function postProfileData(
    role: string | null,
    context: RoleContext | null,
    goal: PrimaryGoal | null,
    timeline: PrepTimeline,
    company: string,
  ) {
    if (profilePosted.current) return
    profilePosted.current = true

    // Compute a soft interview_date default when timeline is lt_1mo
    const interviewDate =
      timeline === 'lt_1mo'
        ? new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : undefined

    try {
      await fetch('/api/onboarding/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: role ?? undefined,
          role_context: context ?? undefined,
          primary_goal: goal ?? undefined,
          prep_timeline: timeline,
          target_company: company || undefined,
          interview_date: interviewDate,
        }),
      })
    } catch {
      // Non-blocking — calibration scoring proceeds regardless
    }
  }

  function handleContextSelect(id: RoleContext) {
    if (roleContext) return
    setRoleContext(id)
    setTimeout(() => transitionTo('goal'), 700)
  }

  function handleGoalSelect(id: PrimaryGoal) {
    if (primaryGoal) return
    setPrimaryGoal(id)
    setTimeout(() => transitionTo('timeline'), 700)
  }

  function handleTimelineSelect(id: PrepTimeline) {
    if (prepTimeline) return
    setPrepTimeline(id)

    const needsCompany = TIMELINE_OPTIONS.find(t => t.id === id)?.revealCompany ?? false

    if (!needsCompany) {
      // Fire-and-forget the profile write so the UI advances immediately.
      // The /api/onboarding/profile route can take several seconds; awaiting it
      // here stalls the transition to flow_intro. Calibration scoring does not
      // depend on this POST completing (the submit route persists the same fields).
      void postProfileData(selectedRole, roleContext, primaryGoal, id, '')
      setTimeout(() => transitionTo('flow_intro'), 700)
    }
    // When company input is revealed, user taps "Continue" to advance
  }

  function handleTimelineContinue() {
    if (!prepTimeline) return
    void postProfileData(selectedRole, roleContext, primaryGoal, prepTimeline, targetCompany)
    transitionTo('flow_intro')
  }

  function handleOptionSelect(optionId: string) {
    if (selectedOption || !currentQuestion) return
    setSelectedOption(optionId)
    setHatchState('reviewing')

    // Micro-feedback: look up quality tier, show FEEDBACK_BY_TIER for ~1s then advance
    const chosen = currentQuestion.options.find(o => o.id === optionId)
    if (chosen) {
      const feedback = FEEDBACK_BY_TIER[chosen.quality as OptionQuality]
      setMicroFeedback(feedback)
    }

    const newAnswers = { ...answers, [currentQuestion.move]: optionId }
    setAnswers(newAnswers)

    // On the final question, start scoring immediately so the network round-trip
    // overlaps the micro-feedback + reading animation instead of starting after.
    if (screen === 'q3') {
      startSubmit(newAnswers)
    }

    const NEXT: Record<CalScreen, CalScreen> = {
      q0: 'q1', q1: 'q2', q2: 'q3', q3: 'reading',
      intro: 'role', role: 'context', context: 'goal', goal: 'timeline',
      timeline: 'flow_intro', flow_intro: 'q0', reading: 'results', results: 'results',
    }
    setTimeout(() => transitionTo(NEXT[screen]), 1050)
  }

  async function handleComplete(path: 'challenge' | 'plan' | 'flow' | 'tour') {
    try {
      await fetch('/api/onboarding/complete', { method: 'POST' })
      await clearOnboardingState()
    } catch {}
    const slug = results?.personalised_plan_slug ?? null
    onComplete?.(path, slug)
  }

  const timelineOption = TIMELINE_OPTIONS.find(t => t.id === prepTimeline)
  const showCompanyInput = !!(prepTimeline && timelineOption?.revealCompany)

  return (
    <>
      <style>{`
        @keyframes calWaitPulse {
          0%, 100% { transform: scale(1); opacity: 0.85; }
          50% { transform: scale(0.97); opacity: 0.6; }
        }
        @keyframes calFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <WorkshopBg opacity={questionIdx >= 0 ? 0.06 : 0.12} />

      <div
        className="relative z-10 w-full max-w-2xl mx-auto px-6 py-6 flex flex-col items-center gap-5"
        style={{
          transition: 'opacity 240ms ease, transform 240ms ease',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(8px)',
        }}
      >

        {/* ── INTRO ─────────────────────────────────────────────────────────── */}
        {screen === 'intro' && (
          <div className="flex flex-col items-center gap-5 text-center">
            <HatchGlyph size={96} state={hatchState} className="text-primary" />
            <div className="space-y-2.5">
              <h1 className="font-headline font-bold text-[28px] text-on-surface leading-tight">
                Let me figure out where you are.
              </h1>
              <p
                className="text-[15px] text-on-surface-variant font-body leading-relaxed"
                style={{ animation: 'calFadeUp 0.5s ease 0.8s both' }}
              >
                4 choices. Product, systems, data, SQL, code.<br />No wrong answers, just honest ones.
              </p>
            </div>
            <button
              onClick={() => transitionTo('role')}
              className="mt-1 bg-primary text-on-primary font-label font-semibold rounded-full px-8 py-3 text-base hover:bg-primary/90 active:scale-95 transition-all duration-150"
              style={{ animation: 'calFadeUp 0.5s ease 1.5s both' }}
            >
              Let&apos;s go
            </button>
          </div>
        )}

        {/* ── ROLE ──────────────────────────────────────────────────────────── */}
        {screen === 'role' && (
          <div className="w-full flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <HatchGlyph size={42} state={hatchState} className="text-primary flex-shrink-0" />
              <h2 className="font-headline font-bold text-[20px] text-on-surface leading-snug">
                What&apos;s your primary role?
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {ROLES.map(role => (
                <button
                  key={role.id}
                  onClick={() => handleRoleSelect(role.id)}
                  disabled={!!selectedRole}
                  className={[
                    'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all duration-150 active:scale-95',
                    selectedRole === role.id
                      ? 'bg-primary-fixed border-primary'
                      : 'bg-surface-container border-outline-variant hover:bg-surface-container-high',
                  ].join(' ')}
                >
                  <span
                    className="material-symbols-outlined text-[18px] flex-shrink-0"
                    style={{ color: '#4a7c59', fontVariationSettings: "'FILL' 1, 'wght' 400" }}
                  >
                    {role.icon}
                  </span>
                  <span className="text-[13px] font-label font-semibold text-on-surface leading-tight">
                    {role.label}
                  </span>
                </button>
              ))}
            </div>

            {showFan && <FlowCardFan />}
          </div>
        )}

        {/* ── CONTEXT ───────────────────────────────────────────────────────── */}
        {screen === 'context' && (
          <div className="w-full flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <HatchGlyph size={42} state={hatchState} className="text-primary flex-shrink-0" />
              <div>
                <h2 className="font-headline font-bold text-[20px] text-on-surface leading-snug">
                  What brings you here right now?
                </h2>
                <p className="text-[12px] text-on-surface-variant font-body italic leading-snug mt-1">
                  Hatch tunes its coaching depending on whether the pressure is an interview loop or a Tuesday standup.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {CONTEXT_OPTIONS.map(opt => (
                <TapOption
                  key={opt.id}
                  id={opt.id}
                  label={opt.label}
                  selected={roleContext === opt.id}
                  disabled={!!roleContext}
                  onClick={() => handleContextSelect(opt.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── GOAL ──────────────────────────────────────────────────────────── */}
        {screen === 'goal' && (
          <div className="w-full flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <HatchGlyph size={42} state={hatchState} className="text-primary flex-shrink-0" />
              <div>
                <h2 className="font-headline font-bold text-[20px] text-on-surface leading-snug">
                  What does winning look like in the next few months?
                </h2>
                <p className="text-[12px] text-on-surface-variant font-body italic leading-snug mt-1">
                  This sets how hard Hatch pushes and which move it drills first.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {GOAL_OPTIONS.map(opt => (
                <TapOption
                  key={opt.id}
                  id={opt.id}
                  label={opt.label}
                  selected={primaryGoal === opt.id}
                  disabled={!!primaryGoal}
                  onClick={() => handleGoalSelect(opt.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── TIMELINE ──────────────────────────────────────────────────────── */}
        {screen === 'timeline' && (
          <div className="w-full flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <HatchGlyph size={42} state={hatchState} className="text-primary flex-shrink-0" />
              <div>
                <h2 className="font-headline font-bold text-[20px] text-on-surface leading-snug">
                  How soon does this matter?
                </h2>
                <p className="text-[12px] text-on-surface-variant font-body italic leading-snug mt-1">
                  A date changes everything. Hatch front-loads the highest-leverage moves when the clock is short.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {TIMELINE_OPTIONS.map(opt => (
                <TapOption
                  key={opt.id}
                  id={opt.id}
                  label={opt.label}
                  selected={prepTimeline === opt.id}
                  disabled={!!prepTimeline && !showCompanyInput}
                  onClick={() => handleTimelineSelect(opt.id)}
                />
              ))}
            </div>

            {/* Optional company/team input revealed for lt_1mo and 1_3mo */}
            {showCompanyInput && (
              <div className="flex flex-col gap-3 mt-1" style={{ animation: 'calFadeUp 0.3s ease' }}>
                <div className="rounded-xl overflow-hidden border border-outline-variant bg-surface-container">
                  <label htmlFor="target-company-input" className="block px-4 pt-3 pb-1 text-[11px] font-label font-semibold text-on-surface-variant uppercase tracking-wider">
                    Any specific company or team you&apos;re aiming at? (optional)
                  </label>
                  <input
                    id="target-company-input"
                    type="text"
                    value={targetCompany}
                    onChange={e => setTargetCompany(e.target.value)}
                    placeholder="e.g. Stripe, Meta Growth, early-stage startup"
                    className="w-full px-4 pb-3 bg-transparent text-[13px] text-on-surface font-body placeholder:text-on-surface-variant/50 outline-none"
                  />
                </div>
                <button
                  onClick={handleTimelineContinue}
                  className="w-full bg-primary text-on-primary font-label font-semibold rounded-full py-3 text-[14px] hover:bg-primary/90 active:scale-95 transition-all duration-150"
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── QUESTIONS ─────────────────────────────────────────────────────── */}
        {currentQuestion && currentMove && (
          <div className="w-full flex flex-col gap-4">
            <FlowMoveStrip activeIdx={questionIdx} completedSet={completedSet} />

            <div className="flex items-start gap-3">
              <HatchGlyph size={40} state={hatchState} className="text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-label font-bold uppercase tracking-widest mb-0.5" style={{ color: currentMove.color }}>
                  {currentMove.label} move
                </p>
                <p className="text-[12px] text-on-surface-variant font-body italic leading-snug">
                  {currentQuestion.hatch}
                </p>
              </div>
            </div>

            {/* Scenario card */}
            <div className="rounded-2xl p-4 border border-outline-variant bg-surface-container">
              <p className="text-[10px] font-label font-bold uppercase tracking-wider mb-1.5 text-on-surface-variant">
                Scenario
              </p>
              <p className="text-[14px] text-on-surface font-body leading-relaxed">
                {currentQuestion.scenario}
              </p>
            </div>

            <p className="text-[17px] font-headline font-bold text-on-surface leading-snug">
              {currentQuestion.q}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
              {currentQuestion.options.map(opt => {
                const isSelected = selectedOption === opt.id
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleOptionSelect(opt.id)}
                    disabled={!!selectedOption}
                    className={[
                      'flex items-start gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-200 active:scale-[0.98]',
                      isSelected
                        ? 'bg-primary-fixed border-primary'
                        : 'bg-surface-container border-outline-variant hover:bg-surface-container-high',
                    ].join(' ')}
                    style={{ transform: isSelected ? 'scale(1.01)' : 'scale(1)' }}
                  >
                    <span
                      className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold font-label mt-0.5"
                      style={{
                        background: isSelected ? '#4a7c59' : 'rgba(74,79,74,0.15)',
                        color: isSelected ? '#fff' : '#4a4e4a',
                      }}
                    >
                      {opt.id}
                    </span>
                    <span className="text-[13px] text-on-surface font-body leading-relaxed">
                      {opt.text}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Per-answer micro-feedback */}
            {microFeedback && (
              <div
                className="flex items-start gap-2 rounded-xl px-4 py-3 transition-all duration-300"
                style={{
                  background: 'rgba(74,124,89,0.16)',
                  border: '1px solid rgba(74,124,89,0.28)',
                  animation: 'calFadeUp 0.25s ease',
                }}
              >
                <HatchGlyph size={20} state="speaking" className="text-primary flex-shrink-0 mt-0.5" />
                <p className="text-[12px] text-on-surface font-body leading-relaxed italic">
                  {microFeedback}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── READING ───────────────────────────────────────────────────────── */}
        {screen === 'reading' && (
          <div className="flex flex-col items-center gap-8 text-center py-10">
            <HatchGlyph size={112} state="reviewing" className="text-primary" />
            <div className="space-y-2">
              <p
                key={readingPhraseIdx}
                className="text-[20px] font-headline font-bold text-on-surface"
                style={{ animation: 'calFadeUp 0.3s ease' }}
              >
                {READING_PHRASES[readingPhraseIdx]}
              </p>
              <p className="text-sm text-on-surface-variant font-body">
                Calibrating your FLOW profile
              </p>
            </div>
          </div>
        )}

        {/* ── FLOW INTRO ────────────────────────────────────────────────────── */}
        {screen === 'flow_intro' && (
          <div className="flex flex-col items-center gap-5 text-center">
            <HatchGlyph size={88} state="speaking" className="text-primary" />
            <div className="space-y-3">
              <h2 className="font-headline font-bold text-[26px] text-on-surface leading-tight">
                Now the fun part.
              </h2>
              <p className="text-[14px] text-on-surface-variant font-body leading-relaxed max-w-xs mx-auto">
                Four quick scenarios, one per FLOW move. Hatch is reading your instincts, not checking right answers. Pick what feels most like how you actually think.
              </p>
            </div>
            <button
              onClick={() => transitionTo('q0')}
              className="mt-2 bg-primary text-on-primary font-label font-semibold rounded-full px-8 py-3 text-base hover:bg-primary/90 active:scale-95 transition-all duration-150"
              style={{ animation: 'calFadeUp 0.4s ease 0.4s both' }}
            >
              Begin
            </button>
          </div>
        )}

        {/* ── RESULTS ───────────────────────────────────────────────────────── */}
        {screen === 'results' && (
          <div className="w-full flex flex-col gap-5">

            {/* Hero: celebrating Hatch + heading */}
            <div className="flex flex-col items-center gap-2 pt-3 text-center">
              <HatchGlyph size={76} state="celebrating" className="text-primary" />
              <div
                className="transition-all duration-500"
                style={{
                  opacity: resultsReveal ? 1 : 0,
                  transform: resultsReveal ? 'translateY(0)' : 'translateY(12px)',
                  transitionDelay: '400ms',
                }}
              >
                <h2 className="font-headline font-bold text-[22px] text-on-surface leading-tight">
                  Here&apos;s where you&apos;re starting.
                </h2>
                {/* Archetype chip: only when present, never "Not set" */}
                {results?.archetype && (
                  <span className="inline-flex items-center mt-1.5 px-3 py-1 rounded-full text-[11px] font-label font-semibold bg-secondary-container text-on-secondary-container">
                    {results.archetype}
                  </span>
                )}
              </div>
            </div>

            {/* 4 score boxes */}
            <div
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 transition-all duration-500"
              style={{ opacity: resultsReveal ? 1 : 0, transitionDelay: '800ms' }}
            >
              {FLOW_MOVES.map((m, i) => {
                const score = results?.scores?.[m.key]
                const level = results?.starting_levels?.[m.key]
                return (
                  <div
                    key={m.key}
                    className="flex flex-col items-center gap-1.5 rounded-2xl p-3 border border-outline-variant"
                    style={{
                      background: m.bg,
                      animation: resultsReveal ? `calFadeUp 0.4s ease ${1000 + i * 150}ms both` : 'none',
                    }}
                  >
                    <span className="text-xl font-bold" style={{ color: m.color }}>{m.icon}</span>
                    <span className="text-[11px] font-label font-bold text-on-surface">{m.label}</span>
                    {score !== undefined && (
                      <span className="text-[18px] font-headline font-bold" style={{ color: m.color }}>
                        {score}
                      </span>
                    )}
                    {level !== undefined && (
                      <span className="text-[10px] font-label font-semibold px-2 py-0.5 rounded-full" style={{ background: m.color + '22', color: m.color }}>
                        Lv {level}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Hatch observation — one-line coaching note */}
            {results?.hatch_observation && (
              <div
                className="rounded-2xl p-3 transition-all duration-500 bg-surface-container border border-outline-variant"
                style={{
                  opacity: resultsReveal ? 1 : 0,
                  transitionDelay: '1600ms',
                }}
              >
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-primary text-[15px] mt-0.5 flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                    auto_awesome
                  </span>
                  <p className="text-[12px] text-on-surface font-body leading-relaxed italic">
                    {results.hatch_observation}
                  </p>
                </div>
              </div>
            )}

            {/* CTAs */}
            <div
              className="flex flex-col gap-2.5 mt-1 transition-all duration-500"
              style={{ opacity: resultsReveal ? 1 : 0, transitionDelay: '2000ms' }}
            >
              {/* Primary: always shown */}
              <button
                onClick={() => handleComplete('challenge')}
                className="w-full bg-primary text-on-primary font-label font-semibold rounded-full py-3 text-[15px] hover:bg-primary/90 active:scale-95 transition-all duration-150"
              >
                Start my first challenge
              </button>

              {/* Study plan: only when personalised_plan_slug is set */}
              {results?.personalised_plan_slug && (
                <button
                  onClick={() => handleComplete('plan')}
                  className="w-full bg-secondary-container text-on-secondary-container font-label font-semibold rounded-full py-3 text-[14px] hover:opacity-90 active:scale-95 transition-all duration-150"
                >
                  See my study plan
                </button>
              )}

              {/* Explore FLOW: opens the animated DisciplineExplorerModal via window event */}
              <button
                onClick={() => handleComplete('flow')}
                className="w-full font-label font-semibold rounded-full py-2.5 text-[13px] text-on-surface-variant hover:text-on-surface hover:bg-surface-container active:scale-95 transition-all duration-150 border border-outline-variant"
              >
                Explore what FLOW is
              </button>

              {/* Guided tour: routes to the dashboard and starts the intro tour */}
              <button
                onClick={() => handleComplete('tour')}
                className="flex w-full items-center justify-center gap-1.5 font-label font-semibold rounded-full py-2.5 text-[13px] text-on-surface-variant hover:text-primary active:scale-95 transition-all duration-150"
              >
                <span className="material-symbols-outlined text-[16px]">tour</span>
                Take me around
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

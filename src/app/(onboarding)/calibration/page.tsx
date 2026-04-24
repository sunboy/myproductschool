'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { HatchGlyph, type HatchState } from '@/components/shell/HatchGlyph'
import { QUESTIONS } from '@/lib/calibration/questions'

// ── Types ─────────────────────────────────────────────────────────────────────

type CalScreen = 'intro' | 'role' | 'q0' | 'q1' | 'q2' | 'q3' | 'reading' | 'results'

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

const FLOW_MOVES = [
  { key: 'frame',    label: 'Frame',    icon: '◇', color: '#4a7c59', bg: 'rgba(74,124,89,0.15)' },
  { key: 'list',     label: 'List',     icon: '◈', color: '#1565c0', bg: 'rgba(21,101,192,0.12)' },
  { key: 'optimize', label: 'Optimize', icon: '◆', color: '#ad1457', bg: 'rgba(173,20,87,0.12)' },
  { key: 'win',      label: 'Win',      icon: '◎', color: '#f57f17', bg: 'rgba(245,127,23,0.12)' },
]

const READING_PHRASES = ['Reading your answers\u2026', 'Mapping your instincts\u2026', 'Almost done\u2026']

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
      {/* Desk 1 — left */}
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
      {/* Desk 2 — center */}
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
      {/* Desk 3 — right */}
      <rect x="580" y="340" width="160" height="8" rx="2" />
      <line x1="590" y1="348" x2="590" y2="420" />
      <line x1="730" y1="348" x2="730" y2="420" />
      <rect x="600" y="308" width="14" height="32" rx="1" />
      <rect x="618" y="314" width="14" height="26" rx="1" />
      <rect x="636" y="318" width="14" height="22" rx="1" />
      <line x1="668" y1="300" x2="695" y2="340" />
      <path d="M668 300 L674 294 L680 300" />
      {/* Human 3 — standing */}
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
              background: isActive ? '#fff' : isDone ? 'rgba(255,255,255,0.25)' : m.bg,
              boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.18)' : 'none',
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
          className="absolute rounded-2xl px-4 py-3 flex items-center gap-3 border border-white/20"
          style={{
            background: `linear-gradient(135deg, ${m.bg} 0%, rgba(255,255,255,0.05) 100%)`,
            top: i * 9,
            left: i * 5,
            right: i * 5,
            zIndex: FLOW_MOVES.length - i,
            animation: i === 0 ? 'none' : `calWaitPulse ${1.8 + i * 0.4}s ease-in-out infinite`,
            animationDelay: `${i * 0.2}s`,
            boxShadow: i === 0 ? '0 4px 16px rgba(0,0,0,0.22)' : '0 2px 8px rgba(0,0,0,0.12)',
          }}
        >
          <span className="text-xl font-bold" style={{ color: m.color }}>{m.icon}</span>
          <span className="font-headline font-bold text-sm text-white/90">{m.label}</span>
          {i === 0 && (
            <span className="ml-auto text-[10px] font-label text-white/50">up first</span>
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
          <span className="text-sm font-label font-semibold text-inverse-on-surface">{move.label}</span>
        </div>
        <span className="text-xs font-label font-bold px-2 py-0.5 rounded-full" style={{ background: move.bg, color: move.color }}>
          Lv {level}
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.12)' }}>
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

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CalibrationPage() {
  const router = useRouter()
  const [screen, setScreen] = useState<CalScreen>('intro')
  const [hatchState, setHatchState] = useState<HatchState>('celebrating')
  const [visible, setVisible] = useState(true)
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [showFan, setShowFan] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [readingPhraseIdx, setReadingPhraseIdx] = useState(0)
  const [results, setResults] = useState<Results | null>(null)
  const [resultsReveal, setResultsReveal] = useState(false)
  const hasSubmitted = useRef(false)

  const questionIdx = QUESTION_SCREENS.indexOf(screen)
  const currentQuestion = questionIdx >= 0 ? QUESTIONS[questionIdx] : null
  const currentMove = questionIdx >= 0 ? FLOW_MOVES[questionIdx] : null
  const completedSet = new Set(QUESTION_SCREENS.slice(0, questionIdx).map((_, i) => i))

  // Intro: Hatch celebrates → speaking
  useEffect(() => {
    if (screen !== 'intro') return
    const t = setTimeout(() => setHatchState('speaking'), 1200)
    return () => clearTimeout(t)
  }, [screen])

  // Reading: cycle phrases
  useEffect(() => {
    if (screen !== 'reading') return
    const interval = setInterval(() => setReadingPhraseIdx(i => (i + 1) % READING_PHRASES.length), 700)
    return () => clearInterval(interval)
  }, [screen])

  // Reading: submit + min wait → results
  useEffect(() => {
    if (screen !== 'reading' || hasSubmitted.current) return
    hasSubmitted.current = true

    const doSubmit = fetch('/api/onboarding/calibration/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers }),
    }).then(r => r.ok ? r.json() : null).then(data => {
      if (data) {
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

    const minWait = new Promise<void>(r => setTimeout(r, 2500))
    Promise.all([doSubmit, minWait]).then(() => transitionTo('results'))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen])

  // Results: staggered reveal
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
      setVisible(true)
      if (next === 'role') setHatchState('listening')
      if (next.startsWith('q')) setHatchState('listening')
      if (next === 'reading') setHatchState('reviewing')
      if (next === 'results') setHatchState('celebrating')
    }, 240)
  }

  function handleRoleSelect(roleId: string) {
    if (selectedRole) return
    setSelectedRole(roleId)
    setShowFan(true)
    fetch('/api/onboarding/role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: roleId }),
    }).catch(() => {})
    setTimeout(() => transitionTo('q0'), 1100)
  }

  function handleOptionSelect(optionId: string) {
    if (selectedOption || !currentQuestion) return
    setSelectedOption(optionId)
    setHatchState('reviewing')
    const newAnswers = { ...answers, [currentQuestion.move]: optionId }
    setAnswers(newAnswers)
    const NEXT: Record<CalScreen, CalScreen> = {
      q0: 'q1', q1: 'q2', q2: 'q3', q3: 'reading',
      intro: 'role', role: 'q0', reading: 'results', results: 'results',
    }
    setTimeout(() => transitionTo(NEXT[screen]), 900)
  }

  async function handleComplete(path: 'challenge' | 'plan') {
    try { await fetch('/api/onboarding/complete', { method: 'POST' }) } catch {}
    if (path === 'plan') {
      const slug = results?.personalised_plan_slug
      router.push(slug ? `/explore/plans/${slug}` : '/explore/plans')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-inverse-surface flex flex-col items-center justify-center relative overflow-hidden">
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
        className="relative z-10 w-full max-w-md px-5 py-8 flex flex-col items-center gap-5"
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
              <h1 className="font-headline font-bold text-[28px] text-inverse-on-surface leading-tight">
                Let me figure out where you are.
              </h1>
              <p
                className="text-[15px] text-inverse-on-surface/65 font-body leading-relaxed"
                style={{ animation: 'calFadeUp 0.5s ease 0.8s both' }}
              >
                4 questions. 2 minutes.<br />No wrong answers — just honest ones.
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
              <h2 className="font-headline font-bold text-[20px] text-inverse-on-surface leading-snug">
                What&apos;s your primary role?
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {ROLES.map(role => (
                <button
                  key={role.id}
                  onClick={() => handleRoleSelect(role.id)}
                  disabled={!!selectedRole}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all duration-150 active:scale-95"
                  style={{
                    background: selectedRole === role.id ? 'rgba(74,124,89,0.28)' : 'rgba(255,255,255,0.09)',
                    borderColor: selectedRole === role.id ? '#4a7c59' : 'rgba(255,255,255,0.18)',
                  }}
                >
                  <span
                    className="material-symbols-outlined text-[18px] flex-shrink-0"
                    style={{ color: '#8ecf9e', fontVariationSettings: "'FILL' 1, 'wght' 400" }}
                  >
                    {role.icon}
                  </span>
                  <span className="text-[13px] font-label font-semibold text-inverse-on-surface leading-tight">
                    {role.label}
                  </span>
                </button>
              ))}
            </div>

            {showFan && <FlowCardFan />}
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
                <p className="text-[12px] text-inverse-on-surface/55 font-body italic leading-snug">
                  {currentQuestion.hatch}
                </p>
              </div>
            </div>

            {/* Scenario card */}
            <div className="rounded-2xl p-4 border border-white/12" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <p className="text-[10px] font-label font-bold uppercase tracking-wider mb-1.5 text-inverse-on-surface/50">
                Scenario
              </p>
              <p className="text-[14px] text-inverse-on-surface font-body leading-relaxed">
                {currentQuestion.scenario}
              </p>
            </div>

            <p className="text-[17px] font-headline font-bold text-inverse-on-surface leading-snug">
              {currentQuestion.q}
            </p>

            <div className="flex flex-col gap-2">
              {currentQuestion.options.map(opt => {
                const isSelected = selectedOption === opt.id
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleOptionSelect(opt.id)}
                    disabled={!!selectedOption}
                    className="flex items-start gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-200 active:scale-[0.98]"
                    style={{
                      background: isSelected ? 'rgba(74,124,89,0.22)' : 'rgba(255,255,255,0.07)',
                      borderColor: isSelected ? '#4a7c59' : 'rgba(255,255,255,0.14)',
                      transform: isSelected ? 'scale(1.01)' : 'scale(1)',
                    }}
                  >
                    <span
                      className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold font-label mt-0.5"
                      style={{
                        background: isSelected ? '#4a7c59' : 'rgba(255,255,255,0.14)',
                        color: isSelected ? '#fff' : 'rgba(255,255,255,0.65)',
                      }}
                    >
                      {opt.id}
                    </span>
                    <span className="text-[13px] text-inverse-on-surface font-body leading-relaxed">
                      {opt.text}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ── READING ───────────────────────────────────────────────────────── */}
        {screen === 'reading' && (
          <div className="flex flex-col items-center gap-8 text-center py-10">
            <HatchGlyph size={112} state="reviewing" className="text-primary" />
            <div className="space-y-2">
              <p
                key={readingPhraseIdx}
                className="text-[20px] font-headline font-bold text-inverse-on-surface"
                style={{ animation: 'calFadeUp 0.3s ease' }}
              >
                {READING_PHRASES[readingPhraseIdx]}
              </p>
              <p className="text-sm text-inverse-on-surface/45 font-body">
                Calibrating your FLOW profile
              </p>
            </div>
          </div>
        )}

        {/* ── RESULTS ───────────────────────────────────────────────────────── */}
        {screen === 'results' && (
          <div className="w-full flex flex-col gap-5">
            <div className="flex flex-col items-center gap-3 pt-3">
              <HatchGlyph size={76} state="celebrating" className="text-primary" />

              <div
                className="text-center transition-all duration-500"
                style={{
                  opacity: resultsReveal ? 1 : 0,
                  transform: resultsReveal ? 'translateY(0)' : 'translateY(14px)',
                  transitionDelay: '600ms',
                }}
              >
                <p className="text-[10px] font-label font-bold uppercase tracking-widest text-primary mb-1">
                  Your thinking archetype
                </p>
                <h2 className="font-headline font-bold text-[24px] text-inverse-on-surface">
                  {results?.archetype ?? '—'}
                </h2>
              </div>

              <div
                className="transition-all duration-400"
                style={{ opacity: resultsReveal ? 1 : 0, transitionDelay: '1000ms' }}
              >
                <p className="text-[13px] text-inverse-on-surface/60 font-body text-center">
                  Stronger product instincts than{' '}
                  <span className="text-inverse-on-surface font-semibold">{results?.percentile ?? 0}%</span>
                  {' '}of engineers at your stage
                </p>
              </div>
            </div>

            {/* Move level bars */}
            <div className="flex flex-col gap-3">
              {FLOW_MOVES.map((m, i) => (
                <ResultsBar
                  key={m.key}
                  move={m}
                  level={results?.starting_levels?.[m.key] ?? 1}
                  score={results?.scores?.[m.key] ?? 0}
                  revealDelay={1400 + i * 180}
                />
              ))}
            </div>

            {/* Hatch observation */}
            {results?.hatch_observation && (
              <div
                className="rounded-2xl p-4 transition-all duration-500"
                style={{
                  background: 'rgba(74,124,89,0.14)',
                  border: '1px solid rgba(74,124,89,0.3)',
                  opacity: resultsReveal ? 1 : 0,
                  transitionDelay: '2200ms',
                }}
              >
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-primary text-[15px] mt-0.5 flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                    auto_awesome
                  </span>
                  <p className="text-[13px] text-inverse-on-surface font-body leading-relaxed italic">
                    {results.hatch_observation}
                  </p>
                </div>
              </div>
            )}

            {/* CTAs */}
            <div
              className="flex flex-col gap-2.5 mt-1 transition-all duration-500"
              style={{ opacity: resultsReveal ? 1 : 0, transitionDelay: '2800ms' }}
            >
              <button
                onClick={() => handleComplete('challenge')}
                className="w-full bg-primary text-on-primary font-label font-semibold rounded-full py-3 text-[15px] hover:bg-primary/90 active:scale-95 transition-all duration-150"
              >
                Start my first challenge
              </button>
              <button
                onClick={() => handleComplete('plan')}
                className="w-full font-label font-semibold rounded-full py-3 text-[14px] hover:bg-white/15 active:scale-95 transition-all duration-150"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}
              >
                See my study plan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

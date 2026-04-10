'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import type { CalibrationResults } from '@/lib/types'
import { QUESTIONS } from '@/lib/calibration/questions'

const ROLES = [
  { id: 'swe',            icon: 'code',                     badge: 'SWE',          title: 'Software Engineer',    description: 'Ship clean code but keep getting passed over for Staff' },
  { id: 'data_eng',       icon: 'database',                 badge: 'Data Eng',     title: 'Data Engineer',        description: 'Build reliable pipelines but feel invisible to product decisions' },
  { id: 'ml_eng',         icon: 'psychology',               badge: 'ML Eng',       title: 'ML Engineer',          description: 'Improve model accuracy but struggle to translate it to business impact' },
  { id: 'devops',         icon: 'settings_input_component', badge: 'DevOps',       title: 'DevOps / SRE',         description: 'Keep systems running but rarely get credit for product value' },
  { id: 'em',             icon: 'groups',                   badge: 'EM',           title: 'Eng Manager',          description: 'Manage delivery but want to shape direction, not just execute' },
  { id: 'founding_eng',   icon: 'rocket_launch',            badge: 'Founding Eng', title: 'Founding Engineer',    description: 'You ARE the product team — need to think like a CPO' },
  { id: 'tech_lead',      icon: 'account_tree',             badge: 'Tech Lead',    title: 'Tech Lead',            description: 'Own architecture but want more say in product strategy' },
  { id: 'pm',             icon: 'manage_accounts',          badge: 'PM',           title: 'Product Manager',      description: 'Drive product direction and sharpen cross-functional thinking' },
  { id: 'designer',       icon: 'design_services',          badge: 'Designer',     title: 'Product Designer',     description: 'Craft experiences but want to drive product decisions, not just polish them' },
  { id: 'data_scientist', icon: 'query_stats',              badge: 'Data Sci',     title: 'Data Scientist',       description: 'Run analyses but struggle to turn findings into product decisions' },
]

const FLOW_MOVES = [
  { key: 'frame',    symbol: '◇', label: 'Frame',    color: '#e8f5e9', textColor: '#2e7d32', desc: 'Define the real problem' },
  { key: 'list',     symbol: '◈', label: 'List',     color: '#e3f2fd', textColor: '#1565c0', desc: 'Surface options & trade-offs' },
  { key: 'optimize', symbol: '◆', label: 'Optimize', color: '#fce4ec', textColor: '#ad1457', desc: 'Sharpen the recommendation' },
  { key: 'win',      symbol: '◎', label: 'Win',      color: '#fff8e1', textColor: '#f57f17', desc: 'Deliver the answer clearly' },
]

// ─────────────────────────────────────────────
// Debrief content — one per FLOW move
// interpretations[move][optionId] = Luma's read on that choice
// ─────────────────────────────────────────────
const DEBRIEF = {
  frame: {
    illustration: '/images/hacky_thinking.png',
    gradient: 'bg-frame-gradient',
    tint: 'bg-frame-tint',
    symbol: '◇',
    label: 'Frame',
    what: 'Frame is the move where you decide what problem you\'re actually solving. Most people skip it — they jump straight to solutions before questioning the brief. Strong framers slow down, challenge assumptions, and redefine the problem so the solution space becomes clearer.',
    why: 'The best product decisions start with the right question. If you Frame wrong, every subsequent move — no matter how sharp — solves the wrong thing.',
    interpretations: {
      '0': {
        A: 'You went for root cause before anything else. That\'s a strong Frame instinct — "why" shapes everything that follows.',
        B: 'You started with the human cost. That\'s empathy-first framing — valuable, but can sometimes lead you to solutions before you\'ve defined the problem clearly.',
        C: 'You reached for data to check your assumptions. Good calibration instinct — let\'s see what the numbers actually say before deciding what the problem is.',
        D: 'You moved to action quickly. Watch the impulse to fix before you\'ve framed — migration plans can lock in an assumption you haven\'t tested yet.',
      },
      '1': {
        A: 'You called out the narrative directly. That\'s precise Frame thinking — separating a story from a finding is exactly the move.',
        B: 'You looked for context before pushback. Checking comparables first is a smart way to pressure-test a claim without being adversarial.',
        C: 'You went for segmentation to stress-test the hypothesis. Good instinct — retention curves by use case can prove or disprove the story quickly.',
        D: 'You deferred to research. Not wrong, but leading with "let\'s do interviews" before reframing the exec\'s claim can look like avoidance.',
      },
    },
  },
  list: {
    illustration: '/images/hacky_practice.png',
    gradient: 'bg-lens-gradient',
    tint: 'bg-lens-tint',
    symbol: '◈',
    label: 'List',
    what: 'List is the move where you break a complex problem into distinct, non-overlapping pieces. Not a brainstorm dump — a structured decomposition. You\'re looking for the segments, dimensions, or options that collectively cover the problem space without overlapping.',
    why: 'A well-structured List prevents you from solving the loudest part of a problem while the real driver hides in a corner. It also shows stakeholders you\'ve thought past the obvious.',
    interpretations: {
      '2': {
        A: 'You segmented by behaviour, not identity. That\'s the sharp List instinct — what users did tells you more than who they are.',
        B: 'You split by jobs-to-be-done. Solid framing — different use cases often have fundamentally different needs and drop-off patterns.',
        C: 'You split by acquisition channel. That\'s a useful dimension — intent often correlates with how someone found the product.',
        D: 'You split by timing of churn. Good diagnostic thinking — but this is more of an Optimize move. At List stage, you want the full population mapped first.',
      },
      '3': {
        A: 'You pulled the segmented view upfront. That\'s strong List thinking — you want the whole population mapped before drawing any conclusions.',
        B: 'You looked at completion rate — does the product deliver its core promise? Solid instinct, focused on the product side of the equation.',
        C: 'Cohort retention curves are the canonical way to find the drop-off point. Time-based segmentation is a core List move.',
        D: 'NPS from churned users gives you signal, but it\'s lagging and self-selected. As a first pull, you\'d want something that shows you where, not just whether.',
      },
    },
  },
  optimize: {
    illustration: '/images/hacky_learning.png',
    gradient: 'bg-optimize-gradient',
    tint: 'bg-optimize-tint',
    symbol: '◆',
    label: 'Optimize',
    what: 'Optimize is where you sharpen from many options to the best one given real constraints — time, resources, risk, and evidence. It\'s not about picking the perfect option in a vacuum, it\'s about making the best defensible call with what you actually have.',
    why: 'Anyone can list options. Optimize is what separates PMs who produce clarity from PMs who produce decks full of bullets. Stakeholders need a recommendation, not a menu.',
    interpretations: {
      '4': {
        A: 'You defaulted to a closed beta — learn before scaling. That\'s a sharp Optimize move under time pressure: real signal, low blast radius.',
        B: 'You pushed back on the timeline. Protecting quality over speed is a valid call — but it needs to be paired with a counter-proposal, not just a "no."',
        C: 'You scoped to one high-impact workflow. That\'s classic 80/20 Optimize thinking — find the version of the solution that proves the value fastest.',
        D: 'You went to engineering first to understand feasibility. Sensible, but in an Optimize move you want to come in with a scoped option to negotiate around, not a blank question.',
      },
      '5': {
        A: 'You ran an assumption map before committing. That\'s rigorous Optimize thinking — validate the riskiest assumption in each bet before investing.',
        B: 'You followed existing traction. Smart shortcut — activation rate is a real signal, and doubling down on what\'s working beats a cold bet.',
        C: 'You defaulted to freemium. Sometimes that\'s right, but "it\'s the default" isn\'t an Optimize argument — it\'s a pattern without a rationale.',
        D: 'You called a leadership review before deciding. That\'s alignment-first, not Optimize-first. In a real decision, you\'d want a PoV before the meeting.',
      },
    },
  },
  win: {
    illustration: '/images/hacky_celebrate.png',
    gradient: 'bg-win-gradient',
    tint: 'bg-win-tint',
    symbol: '◎',
    label: 'Win',
    what: 'Win is the move where you land your recommendation with clarity and conviction. It\'s not just communication polish — it\'s structuring your argument so the most important thing lands first, handling pushback without losing the thread, and leaving the room with a clear decision.',
    why: 'A brilliant product call that can\'t be communicated isn\'t a product call — it\'s a document nobody reads. Win is what makes the other three moves count.',
    interpretations: {
      '6': {
        A: 'You opened with the reframe. "Sora didn\'t fail — it found the wrong customer" is a killer opener. Challenges the premise before anyone can anchor on "failure."',
        B: 'You led with the data story. Rigorous, but in 5 minutes, walking through evidence before landing a point risks losing the room before you get there.',
        C: 'You opened with a competitor. Urgency framing can work, but it can also feel like fear-mongering if your recommendation isn\'t already clear.',
        D: 'Recommendation first, evidence after — that\'s a strong Win structure. Clean BLUF (Bottom Line Up Front) keeps the audience with you.',
      },
      '7': {
        A: 'You acknowledged the constraint and absorbed it into the plan. That\'s the Win move — you didn\'t fight the pushback, you used it.',
        B: 'You proposed a phased approach on the spot. Strong Win response — you\'re redirecting the concern into a scoped solution without conceding the direction.',
        C: 'You parked the concern to regroup later. Sometimes right, but in the room it can read as "I don\'t have an answer." Better to have a partial answer live.',
        D: 'You opened a collaborative path forward. "Let\'s figure out if there\'s a path" keeps the door open without committing to something you can\'t deliver.',
      },
    },
  },
}

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
// Screens: 0=role, 15=flow intro, 1-8=questions, 9=grading, 10=results
// 11=Frame debrief, 12=List debrief, 13=Optimize debrief, 14=Win debrief
type Screen = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15

// ─────────────────────────────────────────────
// Radar chart
// ─────────────────────────────────────────────
function FlowMoveCard({ m }: { m: typeof FLOW_MOVES[number] }) {
  const [expanded, setExpanded] = useState(false)
  const debrief = DEBRIEF[m.key as keyof typeof DEBRIEF]
  return (
    <button
      onClick={() => setExpanded(e => !e)}
      className={`rounded-xl p-3.5 flex flex-col gap-1 text-left transition-all duration-200 ${expanded ? 'col-span-2' : 'hover:brightness-95 active:scale-[0.98]'}`}
      style={{ background: m.color, outline: expanded ? `2px solid ${m.textColor}` : 'none' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold" style={{ color: m.textColor }}>{m.symbol}</span>
        <span className="material-symbols-outlined text-sm transition-transform duration-200" style={{ color: m.textColor, transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', fontVariationSettings: "'FILL' 0" }}>
          expand_more
        </span>
      </div>
      <span className="font-bold text-sm text-on-surface">{m.label}</span>
      <span className="text-[11px] text-on-surface-variant leading-snug">{m.desc}</span>
      {expanded && (
        <div className="mt-2 pt-2 border-t border-black/10 text-left space-y-1">
          <p className="text-[12px] text-on-surface leading-snug">{debrief.what}</p>
          <p className="text-[11px] text-on-surface-variant leading-snug italic">{debrief.why}</p>
        </div>
      )}
    </button>
  )
}

function FlowMoveCards() {
  return (
    <div className="grid grid-cols-2 gap-2.5 w-full max-w-xs">
      {FLOW_MOVES.map(m => <FlowMoveCard key={m.key} m={m} />)}
    </div>
  )
}

function RadarChart({ scores, visible }: { scores: CalibrationResults['scores']; visible: boolean }) {
  return (
    <div className="relative w-52 h-52 flex items-center justify-center mx-auto">
      <svg className="w-full h-full -rotate-45" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="80" fill="none" stroke="#eae6de" strokeWidth="1" />
        <circle cx="100" cy="100" r="60" fill="none" stroke="#eae6de" strokeWidth="1" />
        <circle cx="100" cy="100" r="40" fill="none" stroke="#eae6de" strokeWidth="1" />
        <circle cx="100" cy="100" r="20" fill="none" stroke="#eae6de" strokeWidth="1" />
        <line x1="100" y1="20" x2="100" y2="180" stroke="#eae6de" strokeWidth="1" />
        <line x1="20" y1="100" x2="180" y2="100" stroke="#eae6de" strokeWidth="1" />
        <polygon
          points={`100,${100 - scores.frame * 0.8} ${100 + scores.list * 0.8},100 100,${100 + scores.optimize * 0.8} ${100 - scores.win * 0.8},100`}
          fill="#4a7c59"
          fillOpacity={visible ? 0.4 : 0}
          stroke="#4a7c59"
          strokeWidth="2"
          style={{
            transition: 'fill-opacity 800ms ease-out, transform 800ms ease-out',
            transformOrigin: '100px 100px',
            transform: visible ? 'scale(1)' : 'scale(0)',
          }}
        />
      </svg>
      {[
        { label: 'Frame',    pos: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1', val: scores.frame },
        { label: 'List',     pos: 'right-0 top-1/2 -translate-y-1/2 translate-x-3', val: scores.list },
        { label: 'Optimize', pos: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1', val: scores.optimize },
        { label: 'Win',      pos: 'left-0 top-1/2 -translate-y-1/2 -translate-x-3', val: scores.win },
      ].map(l => (
        <div key={l.label} className={`absolute ${l.pos} text-center`}>
          <span className="block text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">{l.label}</span>
          <span className="text-xs font-bold text-primary">{l.val}</span>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────
const CAL_STORAGE_KEY = 'hp_cal_progress'

export default function CalibrationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [screen, setScreen] = useState<Screen>(0)
  const [exiting, setExiting] = useState(false)
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')

  // Role selection (screen 0)
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [roleSubmitting, setRoleSubmitting] = useState(false)

  // Answers: questionIndex → chosen option id
  const [answers, setAnswers] = useState<Record<number, string>>({})
  // Which option just got selected (for pulse animation)
  const [justSelected, setJustSelected] = useState<string | null>(null)

  // Results
  const [results, setResults] = useState<CalibrationResults | null>(null)
  const [radarVisible, setRadarVisible] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)

  // ── Restore saved progress on mount ────────
  useEffect(() => {
    if (searchParams.get('resume') !== '1') {
      try { localStorage.removeItem(CAL_STORAGE_KEY) } catch { /* ignore */ }
      return
    }
    try {
      const saved = localStorage.getItem(CAL_STORAGE_KEY)
      if (!saved) return
      const { screen: savedScreen, answers: savedAnswers, role: savedRole } = JSON.parse(saved)
      if (!savedRole) return
      setSelectedRole(savedRole)
      if (savedScreen && savedScreen >= 1 && savedScreen <= 8) {
        setAnswers(savedAnswers ?? {})
        setScreen(savedScreen as Screen)
      }
    } catch { /* ignore */ }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Persist progress to localStorage ───────
  const saveProgress = useCallback((s: Screen, a: Record<number, string>) => {
    if (s >= 1 && s <= 8) {
      try { localStorage.setItem(CAL_STORAGE_KEY, JSON.stringify({ screen: s, answers: a, role: selectedRole })) } catch { /* ignore */ }
    }
  }, [selectedRole])

  // ── Role selection → advance to questions ──
  async function handleRoleNext() {
    if (!selectedRole) return
    setRoleSubmitting(true)
    try {
      await fetch('/api/onboarding/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole }),
      })
    } catch { /* non-fatal */ }
    setRoleSubmitting(false)
    goTo(15)
  }

  // ── Skip calibration → go to dashboard ─────
  async function handleSkip() {
    try { localStorage.removeItem(CAL_STORAGE_KEY) } catch { /* ignore */ }
    router.push('/dashboard')
  }

  // Road progress driven by question progress (screens 1-8), maxes out at 8
  const roadProgress = screen >= 1 && screen <= 8 ? screen : screen > 8 ? 8 : 0
  const roadOffset = 1200 * (1 - roadProgress / 8)

  // ── Screen transitions ──────────────────────
  function goTo(s: Screen, dir: 'forward' | 'back' = 'forward', currentAnswers?: Record<number, string>) {
    setDirection(dir)
    setExiting(true)
    setTimeout(() => {
      setScreen(s)
      setExiting(false)
      setJustSelected(null)
      saveProgress(s, currentAnswers ?? answers)
    }, 360)
  }

  // ── Grading: fetch results + auto-advance ───
  useEffect(() => {
    if (screen !== 9) return
    let cancelled = false
    const minWait = new Promise(r => setTimeout(r, 2800))
    const fetch$ = fetch('/api/onboarding/results')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setResults(data) })
      .catch(() => {})
    Promise.all([minWait, fetch$]).then(() => {
      if (!cancelled) goTo(10)
    })
    return () => { cancelled = true }
  }, [screen]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Radar reveal on results ─────────────────
  useEffect(() => {
    if (screen !== 10) return
    const t = setTimeout(() => setRadarVisible(true), 500)
    return () => clearTimeout(t)
  }, [screen])

  // ── Handle option tap ───────────────────────
  function handleSelect(questionIdx: number, optionId: string) {
    if (justSelected) return // debounce double-tap
    setJustSelected(optionId)
    const newAnswers = { ...answers, [questionIdx]: optionId }
    setAnswers(newAnswers)

    // Auto-advance after selection lands
    setTimeout(() => {
      if (screen === 2) {
        goTo(11, 'forward', newAnswers) // Frame debrief
      } else if (screen === 4) {
        goTo(12, 'forward', newAnswers) // List debrief
      } else if (screen === 6) {
        goTo(13, 'forward', newAnswers) // Optimize debrief
      } else if (screen === 8) {
        // Win debrief — also submit answers
        submitAnswers(newAnswers)
        goTo(14, 'forward', newAnswers)
      } else {
        goTo((screen + 1) as Screen, 'forward', newAnswers)
      }
    }, 680)
  }

  function submitAnswers(finalAnswers: Record<number, string>) {
    const frameAnswer    = `Q1: ${finalAnswers[0] ?? '?'} | Q2: ${finalAnswers[1] ?? '?'}`
    const listAnswer     = `Q3: ${finalAnswers[2] ?? '?'} | Q4: ${finalAnswers[3] ?? '?'}`
    const optimizeAnswer = `Q5: ${finalAnswers[4] ?? '?'} | Q6: ${finalAnswers[5] ?? '?'}`
    const winAnswer      = `Q7: ${finalAnswers[6] ?? '?'} | Q8: ${finalAnswers[7] ?? '?'}`
    fetch('/api/onboarding/calibration/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        responses: { frame: frameAnswer, list: listAnswer, optimize: optimizeAnswer, win: winAnswer },
      }),
    }).catch(() => {})
  }

  async function handleComplete(dest: '/dashboard' | '/prep') {
    setIsCompleting(true)
    try { localStorage.removeItem(CAL_STORAGE_KEY) } catch { /* ignore */ }
    try { await fetch('/api/onboarding/complete', { method: 'POST' }) } catch { /* ok */ }
    router.push(dest)
    router.refresh()
  }

  // ── Derived ─────────────────────────────────
  const isQuestion = screen >= 1 && screen <= 8
  const qIdx = screen - 1  // 0-based index into QUESTIONS
  const currentQ = isQuestion ? QUESTIONS[qIdx] : null

  // Debrief screens
  const isDebrief = screen === 11 || screen === 12 || screen === 13 || screen === 14
  const debriefMoveKey = screen === 11 ? 'frame' : screen === 12 ? 'list' : screen === 13 ? 'optimize' : screen === 14 ? 'win' : null
  const debriefMove = debriefMoveKey ? DEBRIEF[debriefMoveKey as keyof typeof DEBRIEF] : null
  // Question indices for the move on the current debrief screen
  const debriefQ1Idx = screen === 11 ? 0 : screen === 12 ? 2 : screen === 13 ? 4 : screen === 14 ? 6 : 0
  const debriefQ2Idx = debriefQ1Idx + 1
  // Next question screen after this debrief
  const debriefNextScreen: Screen = screen === 11 ? 3 : screen === 12 ? 5 : screen === 13 ? 7 : 9

  // Which FLOW move pills are done/active
  // Frame=1-2 (debrief=11), List=3-4 (debrief=12), Optimize=5-6 (debrief=13), Win=7-8 (debrief=14)
  // Done = past that move's questions. Active = currently on that move's questions or its debrief.
  const frameActive    = screen === 1 || screen === 2 || screen === 11
  const frameDone      = !frameActive && screen !== 0 && screen !== 15
  const listActive     = screen === 3 || screen === 4 || screen === 12
  const listDone       = !listActive && (screen === 13 || screen === 14 || screen === 9 || screen === 10 || screen === 5 || screen === 6 || screen === 7 || screen === 8)
  const optimizeActive = screen === 5 || screen === 6 || screen === 13
  const optimizeDone   = !optimizeActive && (screen === 14 || screen === 9 || screen === 10 || screen === 7 || screen === 8)
  const winActive      = screen === 7 || screen === 8 || screen === 14
  const winDone        = screen === 9 || screen === 10

  const scores = results?.scores ?? { frame: 72, list: 58, optimize: 65, win: 44 }
  const archetype = results?.archetype ?? 'The Systematic Builder'
  const archetypeDescription = results?.archetype_description ?? 'You construct solutions methodically with strong framing, but narrative communication is the area to develop.'
  const percentile = results?.percentile ?? 61
  const startingLevels = results?.starting_levels ?? { frame: 3, list: 2, optimize: 2, win: 1 }

  const contentClass = exiting
    ? direction === 'forward'
      ? 'opacity-0 -translate-x-10 transition-all duration-300 pointer-events-none'
      : 'opacity-0 translate-x-10 transition-all duration-300 pointer-events-none'
    : 'opacity-100 translate-x-0 transition-all duration-500'

  return (
    <div className="min-h-screen flex flex-col bg-surface overflow-hidden">

      {/* ── Road background ── */}
      <svg className="fixed inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <path d="M-100,200 C150,200 300,350 600,350 C900,350 1050,200 1300,180" fill="none" stroke="#4a7c59" strokeWidth="80" strokeLinecap="round" opacity="0.03" />
        <path d="M-100,200 C150,200 300,350 600,350 C900,350 1050,200 1300,180" fill="none" stroke="#4a7c59" strokeWidth="2.5" strokeDasharray="18 12" strokeLinecap="round" opacity="0.1"
          style={{ strokeDashoffset: roadOffset, transition: 'stroke-dashoffset 800ms cubic-bezier(0.4,0,0.2,1)' }} />
        <path d="M-100,580 C200,580 400,480 700,480 C1000,480 1100,560 1300,540" fill="none" stroke="#4a7c59" strokeWidth="50" strokeLinecap="round" opacity="0.02" />
        <circle cx="200" cy="210" r="6" fill="#4a7c59" opacity="0.07" />
        <circle cx="600" cy="355" r="7" fill="#4a7c59" opacity="0.06" />
        <circle cx="950" cy="270" r="5" fill="#4a7c59" opacity="0.05" />
      </svg>

      {/* ── Top bar ── */}
      <header className="relative z-10 h-12 flex items-center justify-between px-6 bg-background/90 backdrop-blur-sm border-b border-outline-variant flex-shrink-0">
        <span className="font-headline font-bold text-primary text-base tracking-tight">HackProduct</span>
        {isQuestion && (
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
            {screen} of 8
          </span>
        )}
        {screen <= 14 && screen !== 9 && screen !== 10 && (
          <button
            onClick={handleSkip}
            className="text-xs text-on-surface-variant font-label font-semibold hover:text-on-surface transition-colors"
          >
            Save &amp; exit
          </button>
        )}
        {(screen === 9 || screen === 10 || screen > 14) && <div className="w-20" />}
      </header>

      {/* ── Step pills (question screens + debrief + grading + results) ── */}
      {screen >= 1 && screen <= 14 && (
        <div className="relative z-10 flex items-center justify-center gap-3 px-6 py-2 bg-background/80 backdrop-blur-sm border-b border-outline-variant/40 flex-shrink-0">
          {[
            { symbol: '◇', label: 'Frame',    done: frameDone,     active: frameActive,    backTo: 11 as Screen },
            { symbol: '◈', label: 'List',     done: listDone,      active: listActive,     backTo: 12 as Screen },
            { symbol: '◆', label: 'Optimize', done: optimizeDone,  active: optimizeActive, backTo: 13 as Screen },
            { symbol: '◎', label: 'Win',      done: winDone,       active: winActive,      backTo: 14 as Screen },
          ].map((m, i) => (
            <div key={m.label} className="flex items-center gap-1.5">
              {m.done ? (
                <button
                  onClick={() => goTo(m.backTo, 'back')}
                  className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all duration-300 bg-primary text-on-primary hover:opacity-80 active:scale-95"
                  title={`Review ${m.label}`}
                >
                  <span className="material-symbols-outlined text-[11px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                  {m.label}
                </button>
              ) : (
                <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all duration-300 ${
                  m.active ? 'bg-white text-primary border-2 border-primary shadow-sm' :
                             'bg-surface-container-high text-on-surface-variant opacity-40'
                }`}>
                  <span>{m.symbol}</span>
                  {m.label}
                </div>
              )}
              {i < 3 && (
                <div className={`w-4 h-0.5 rounded-full transition-all duration-500 ${m.done ? 'bg-primary' : 'bg-outline-variant'}`} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Main content ── */}
      <main className="relative z-10 flex-1 overflow-y-auto">
        <div className={`max-w-xl mx-auto px-5 py-8 ${contentClass}`}>

          {/* ── Screen 0: Role selection ── */}
          {screen === 0 && (
            <div className="flex flex-col gap-6">
              <div className="flex items-start gap-4 bg-primary-fixed rounded-2xl p-4">
                <LumaGlyph size={44} state="listening" className="flex-shrink-0 mt-0.5" />
                <div>
                  <h1 className="font-headline text-xl font-bold text-on-surface mb-1">What&apos;s your role?</h1>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    Luma will personalize your calibration challenge and learning path for your role.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ROLES.map(role => {
                  const isSelected = selectedRole === role.id
                  return (
                    <button
                      key={role.id}
                      onClick={() => setSelectedRole(role.id)}
                      className={`text-left bg-surface-container border rounded-xl p-4 transition-all hover:bg-primary-fixed hover:border-primary hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary ${
                        isSelected ? 'bg-primary-fixed border-primary shadow-sm' : 'border-outline-variant'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="material-symbols-outlined text-primary text-2xl">{role.icon}</span>
                        <span className="bg-secondary-container text-on-secondary-container text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">{role.badge}</span>
                      </div>
                      <p className="font-label font-bold text-sm text-on-surface mb-0.5">{role.title}</p>
                      <p className="text-[11px] text-on-surface-variant leading-snug">{role.description}</p>
                    </button>
                  )
                })}
              </div>

              <div className="flex flex-col items-center gap-3 pt-1">
                <button
                  onClick={handleRoleNext}
                  disabled={!selectedRole || roleSubmitting}
                  className="inline-flex items-center gap-2 bg-primary text-on-primary rounded-full px-8 py-3 font-label font-bold text-sm shadow-lg shadow-primary/25 hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
                >
                  {roleSubmitting ? 'Saving…' : 'Start calibration'}
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </button>
                <button onClick={handleSkip} className="text-xs text-on-surface-variant hover:text-on-surface underline underline-offset-2 transition-colors">
                  Skip — browse challenges first
                </button>
              </div>
            </div>
          )}

          {/* ── Screen 15: FLOW intro ── */}
          {screen === 15 && (
            <div className="flex flex-col items-center text-center gap-6">
              <div className="animate-luma-glow">
                <LumaGlyph size={88} state="celebrating" />
              </div>
              <div>
                <h1 className="font-headline text-3xl font-bold text-on-surface mb-2 leading-tight">
                  Let&apos;s find your baseline
                </h1>
                <p className="text-sm text-on-surface-variant max-w-xs mx-auto leading-relaxed">
                  8 quick questions across all 4 FLOW moves. No typing — just pick the option that sounds most like you.
                </p>
              </div>

              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-label -mb-2">
                Tap any move to learn more
              </p>

              <FlowMoveCards />

              <button
                onClick={() => goTo(1)}
                className="inline-flex items-center gap-2 bg-primary text-on-primary rounded-full px-8 py-3 font-label font-bold text-sm shadow-lg shadow-primary/25 hover:brightness-110 active:scale-95 transition-all"
              >
                Let&apos;s go
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
              <button
                onClick={() => goTo(0, 'back')}
                className="text-xs text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Back to role selection
              </button>
            </div>
          )}

          {/* ── Screens 1–4: Questions ── */}
          {isQuestion && currentQ && (
            <div className="space-y-5">
              {/* Move badge + Luma tip */}
              <div className="flex items-start gap-3 bg-primary-fixed rounded-2xl p-4">
                <LumaGlyph size={36} state="listening" className="flex-shrink-0 mt-0.5" />
                <p className="text-sm text-on-surface leading-relaxed italic">&ldquo;{currentQ.luma}&rdquo;</p>
              </div>

              {/* Question */}
              <h2 className="font-headline text-xl font-bold text-on-surface leading-snug px-1">
                {currentQ.q}
              </h2>

              {/* Options */}
              <div className="space-y-2.5">
                {currentQ.options.map(opt => {
                  const isSelected = justSelected === opt.id
                  const otherSelected = justSelected && justSelected !== opt.id
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelect(qIdx, opt.id)}
                      disabled={!!justSelected}
                      className={`w-full text-left rounded-2xl px-5 py-4 flex items-start gap-3.5 transition-all duration-200 border-2 ${
                        isSelected
                          ? 'bg-primary border-primary text-on-primary shadow-lg shadow-primary/25 scale-[1.02]'
                          : otherSelected
                          ? 'bg-surface-container border-transparent text-on-surface opacity-35'
                          : 'bg-surface-container border-transparent text-on-surface hover:border-primary/30 hover:bg-primary-fixed/60 active:scale-[0.99]'
                      }`}
                    >
                      <span className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                        isSelected
                          ? 'bg-on-primary text-primary border-on-primary'
                          : 'border-outline-variant text-on-surface-variant'
                      }`}>
                        {isSelected
                          ? <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                          : opt.id
                        }
                      </span>
                      <span className={`text-sm font-medium leading-relaxed ${isSelected ? 'font-semibold' : ''}`}>
                        {opt.text}
                      </span>
                    </button>
                  )
                })}
              </div>

              {screen >= 1 && !justSelected && (
                <button
                  onClick={() => goTo(screen === 1 ? 15 : (screen - 1) as Screen, 'back')}
                  className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-on-surface transition-colors mt-2 mx-auto"
                >
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  Back
                </button>
              )}
            </div>
          )}

          {/* ── Screens 11–14: Move debriefs ── */}
          {isDebrief && debriefMove && (
            <div className="space-y-5 pb-8 animate-fade-in-up">

              {/* Illustration + gradient header */}
              <div className={`${debriefMove.gradient} rounded-3xl overflow-hidden relative`} style={{ minHeight: 200 }}>
                <div className="absolute inset-0 opacity-20"
                  style={{ background: 'radial-gradient(ellipse at 70% 50%, white 0%, transparent 70%)' }} />
                <div className="relative flex items-end justify-between px-6 pt-6 pb-0">
                  <div className="pb-6">
                    <span className="text-white/70 text-xs font-bold uppercase tracking-widest block mb-1">FLOW Move</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white text-3xl font-bold leading-none">{debriefMove.symbol}</span>
                      <span className="font-headline text-4xl font-bold text-white leading-none">{debriefMove.label}</span>
                    </div>
                  </div>
                  <Image
                    src={debriefMove.illustration}
                    alt={`${debriefMove.label} move illustration`}
                    width={130}
                    height={130}
                    className="object-contain drop-shadow-lg flex-shrink-0"
                    style={{ marginBottom: -4 }}
                  />
                </div>
              </div>

              {/* What this move is */}
              <div className={`${debriefMove.tint} rounded-2xl p-5`}>
                <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">What is {debriefMove.label}?</h3>
                <p className="text-sm text-on-surface leading-relaxed">{debriefMove.what}</p>
              </div>

              {/* Why it matters */}
              <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/40">
                <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Why it matters</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed italic">{debriefMove.why}</p>
              </div>

              {/* Luma's read on their answers */}
              <div className="bg-primary-fixed rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <LumaGlyph size={32} state="speaking" className="flex-shrink-0" />
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">Luma&apos;s read on your answers</span>
                </div>

                {/* Q1 of this move */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="bg-primary text-on-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Q{debriefQ1Idx + 1} — You picked {answers[debriefQ1Idx] ?? '?'}
                    </span>
                  </div>
                  <p className="text-sm text-on-surface leading-relaxed">
                    {(debriefMove.interpretations as Record<string, Record<string, string>>)[String(debriefQ1Idx)]?.[answers[debriefQ1Idx] ?? ''] ?? 'Interesting choice — Luma is building your profile.'}
                  </p>
                </div>

                {/* Q2 of this move */}
                <div className="space-y-1.5 pt-2 border-t border-primary/20">
                  <div className="flex items-center gap-2">
                    <span className="bg-primary text-on-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Q{debriefQ2Idx + 1} — You picked {answers[debriefQ2Idx] ?? '?'}
                    </span>
                  </div>
                  <p className="text-sm text-on-surface leading-relaxed">
                    {(debriefMove.interpretations as Record<string, Record<string, string>>)[String(debriefQ2Idx)]?.[answers[debriefQ2Idx] ?? ''] ?? 'Interesting choice — Luma is building your profile.'}
                  </p>
                </div>
              </div>

              {/* Continue CTA */}
              <button
                onClick={() => goTo(debriefNextScreen)}
                className="w-full bg-primary text-on-primary font-label font-bold py-3.5 rounded-full flex items-center justify-center gap-2 shadow-md shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all"
              >
                {screen === 14 ? 'See your results' : `On to ${screen === 11 ? 'List' : screen === 12 ? 'Optimize' : 'Win'} →`}
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
            </div>
          )}

          {/* ── Screen 9: Grading ── */}
          {screen === 9 && (
            <div className="flex flex-col items-center justify-center text-center gap-6 pt-16 min-h-[400px]">
              <div className="animate-luma-glow">
                <LumaGlyph size={80} state="reviewing" />
              </div>
              <div className="animate-fade-in space-y-2">
                <h2 className="font-headline text-2xl font-bold text-on-surface">
                  Luma is reading your answers…
                </h2>
                <p className="text-sm text-on-surface-variant">Mapping your thinking across all 4 FLOW moves</p>
              </div>
              <div className="dot-pulse flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />
              </div>
            </div>
          )}

          {/* ── Screen 10: Results ── */}
          {screen === 10 && (
            <div className="space-y-5 pb-8">
              {/* Header */}
              <div className="flex flex-col items-center text-center gap-3">
                <div className="animate-luma-glow">
                  <LumaGlyph size={64} state="celebrating" />
                </div>
                <div>
                  <h1 className="font-headline text-2xl font-bold text-on-surface mb-1">Your baseline is set!</h1>
                  <p className="text-sm text-on-surface-variant">Here&apos;s where you stand across the 4 FLOW moves.</p>
                </div>
              </div>

              {/* Radar */}
              <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 p-5">
                <RadarChart scores={scores} visible={radarVisible} />
                <div className="mt-4 flex justify-center">
                  <span className="bg-secondary-container text-on-secondary-container text-xs font-bold px-3 py-1 rounded-full">
                    Better than {percentile}% of engineers at your stage
                  </span>
                </div>
              </div>

              {/* Archetype */}
              <div className="bg-primary-fixed rounded-2xl p-5 border border-primary/10">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] font-bold text-primary uppercase tracking-widest">Your Thinking Archetype</span>
                  <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>diamond</span>
                </div>
                <h2 className="font-headline text-xl font-bold text-on-surface mb-1.5">{archetype}</h2>
                <p className="text-sm text-on-surface-variant leading-relaxed">{archetypeDescription}</p>
              </div>

              {/* Luma observation */}
              {results?.luma_observation && (
                <div className="bg-white rounded-xl border-l-4 border-primary shadow-sm p-4">
                  <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">What Luma noticed</h3>
                  <p className="text-sm text-on-surface-variant italic leading-relaxed">&ldquo;{results.luma_observation}&rdquo;</p>
                </div>
              )}

              {/* Starting levels */}
              <div className="grid grid-cols-4 gap-2">
                {FLOW_MOVES.map(m => {
                  const level = startingLevels[m.key as keyof typeof startingLevels] ?? 1
                  const isFocus = level < 2
                  return (
                    <div key={m.key} className={`rounded-xl p-3 flex flex-col items-center gap-1.5 border bg-white ${isFocus ? 'border-tertiary-container/60' : 'border-outline-variant/40'}`}>
                      <span className="text-base">{m.symbol}</span>
                      <span className="text-[9px] font-bold text-on-surface-variant uppercase">{m.label}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isFocus ? 'border border-tertiary text-tertiary' : 'bg-primary text-on-primary'}`}>
                        {isFocus ? 'Focus' : `Lvl ${level}`}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* CTAs */}
              <div className="space-y-3 pt-1">
                <button
                  onClick={() => handleComplete('/dashboard')}
                  disabled={isCompleting}
                  className="w-full bg-primary text-on-primary font-label font-bold py-3.5 rounded-full flex items-center justify-center gap-2 shadow-md shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60"
                >
                  {isCompleting ? 'Setting up…' : 'Start your first challenge'}
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </button>
                <button
                  onClick={() => handleComplete('/prep')}
                  disabled={isCompleting}
                  className="w-full text-center text-sm font-bold text-primary hover:underline underline-offset-4 decoration-2 disabled:opacity-50"
                >
                  See your personalized study plan →
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}

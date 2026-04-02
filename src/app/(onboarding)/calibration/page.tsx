'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import type { CalibrationResults } from '@/lib/types'

// ─────────────────────────────────────────────
// Question bank
// Each question has 4 options scored A/B/C/D
// where A = most advanced, D = least
// ─────────────────────────────────────────────
const QUESTIONS = [
  // ── Frame move ──────────────────────────────
  {
    move: 'frame',
    q: 'You\'re a PM at OpenAI. Leadership just told you Sora is being discontinued — effective in 60 days. What\'s your first move?',
    luma: 'Frame move — I\'m watching how you define the problem before jumping to solutions.',
    options: [
      { id: 'A', text: 'Ask why it\'s being discontinued — cost, safety, low adoption, or strategic pivot? The framing changes everything' },
      { id: 'B', text: 'Identify who the most affected users are and what they\'ll lose' },
      { id: 'C', text: 'Look at usage data to understand whether this is a surprise or something the metrics already showed' },
      { id: 'D', text: 'Draft a migration plan to move Sora users to alternative tools' },
    ],
  },
  {
    move: 'frame',
    q: 'An exec says "Sora failed because the market wasn\'t ready for AI video." How do you respond?',
    luma: 'Still on Frame — how you challenge (or accept) a narrative reveals your instincts.',
    options: [
      { id: 'A', text: '"That\'s a story, not a finding — what data are we looking at to separate market timing from product fit?"' },
      { id: 'B', text: 'Ask whether competitors in AI video saw similar drop-off, or if this is OpenAI-specific' },
      { id: 'C', text: 'Check whether Sora\'s retention curves differed by use case — creators vs. enterprise vs. hobbyists' },
      { id: 'D', text: 'Agree to do user interviews before drawing conclusions' },
    ],
  },
  // ── List move ───────────────────────────────
  {
    move: 'list',
    q: 'Sora had strong trial signups but low repeat usage. Which user segment do you investigate first?',
    luma: 'List move — I\'m watching how you slice a messy problem into distinct groups.',
    options: [
      { id: 'A', text: 'Users who generated more than 3 videos vs. those who only tried once — behaviour over demographics' },
      { id: 'B', text: 'Professional creators vs. casual experimenters — different jobs to be done' },
      { id: 'C', text: 'Users who came via API vs. the web UI — channel likely signals intent' },
      { id: 'D', text: 'Users who churned in week 1 vs. week 4 — timing of drop-off reveals the friction point' },
    ],
  },
  {
    move: 'list',
    q: 'You have one query to run before a 30-minute exec readout on why Sora failed. What do you pull?',
    luma: 'Still on List — your first-choice metric tells me how you prioritise signal over noise.',
    options: [
      { id: 'A', text: 'Week-over-week active users split by use case (creative, research, enterprise) — shows where value was and wasn\'t landing' },
      { id: 'B', text: 'Video generation completion rate — did users start and abandon, or not return after first success?' },
      { id: 'C', text: 'Cohort retention at day 1, 7, and 30 — when exactly did users stop coming back?' },
      { id: 'D', text: 'NPS from churned users — qualitative signal on the core disappointment' },
    ],
  },
  // ── Optimize move ────────────────────────────
  {
    move: 'optimize',
    q: 'You\'ve identified that Sora\'s best users were professional video editors who needed frame-level control. Leadership wants a fix in 6 weeks. What do you cut?',
    luma: 'Optimize move — I\'m watching how you sharpen a solution under real constraints.',
    options: [
      { id: 'A', text: 'Ship frame-level editing only for the top 500 power users as a closed beta — learn before scaling' },
      { id: 'B', text: 'Cut the 6-week timeline — a half-built feature for professionals will hurt more than help' },
      { id: 'C', text: 'Scope down to one workflow (e.g. trim + caption sync) that solves 80% of the professional pain' },
      { id: 'D', text: 'Negotiate scope with engineering to understand what\'s feasible before committing to anything' },
    ],
  },
  {
    move: 'optimize',
    q: 'Three possible bets: (A) re-launch with a freemium tier, (B) pivot to an API-first product for enterprises, (C) double down on creator tools for professional video editors. How do you choose?',
    luma: 'Still on Optimize — how you weigh bets under uncertainty reveals your product judgement.',
    options: [
      { id: 'A', text: 'Run a quick assumption map — list the 2 most critical unknowns for each bet, pick the one with the most validated assumptions' },
      { id: 'B', text: 'Go where the existing traction points — check which segment had the highest activation rate and double down there' },
      { id: 'C', text: 'Freemium is default — it lowers acquisition cost and lets the product speak for itself' },
      { id: 'D', text: 'Take it to a leadership review with a one-pager on each option — get alignment before going deep on any' },
    ],
  },
  // ── Win move ─────────────────────────────────
  {
    move: 'win',
    q: 'You\'re presenting your recommendation to re-launch Sora as an API-first product to the leadership team. You have 5 minutes. What\'s your opener?',
    luma: 'Win move — I\'m watching how you land an idea with clarity and conviction.',
    options: [
      { id: 'A', text: '"Sora didn\'t fail — it found the wrong customer. Here\'s who actually needs it and what we do next."' },
      { id: 'B', text: 'Walk through the data story first: signups, drop-off, segment behaviour, then the recommendation' },
      { id: 'C', text: 'Open with a competitor doing this well to establish urgency before proposing the pivot' },
      { id: 'D', text: 'State the recommendation up front, then spend 4 minutes on the evidence behind it' },
    ],
  },
  {
    move: 'win',
    q: 'An engineering lead pushes back: "We built Sora for consumers — pivoting to API-first means rewriting the auth layer." How do you respond?',
    luma: 'Still on Win — how you handle a hard pushback in the room is the real test.',
    options: [
      { id: 'A', text: '"That\'s a real constraint — help me understand the scope and we\'ll build it into the roadmap estimate"' },
      { id: 'B', text: '"We can phase it — ship read-only API access first to validate demand before touching auth"' },
      { id: 'C', text: 'Acknowledge the concern, park it, and bring it back with a concrete proposal after the meeting' },
      { id: 'D', text: '"Fair point — let\'s figure out if there\'s a path that avoids the rewrite before we commit"' },
    ],
  },
]

const FLOW_MOVES = [
  { key: 'frame',    symbol: '◇', label: 'Frame',    color: '#e8f5e9', textColor: '#2e7d32', desc: 'Define the real problem' },
  { key: 'list',     symbol: '◈', label: 'List',     color: '#e3f2fd', textColor: '#1565c0', desc: 'Surface options & trade-offs' },
  { key: 'optimize', symbol: '◆', label: 'Optimize', color: '#fce4ec', textColor: '#ad1457', desc: 'Sharpen the recommendation' },
  { key: 'win',      symbol: '◎', label: 'Win',      color: '#fff8e1', textColor: '#f57f17', desc: 'Deliver the answer clearly' },
]

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
// Screens: 0=intro, 1-8=questions, 9=grading, 10=results
type Screen = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

// ─────────────────────────────────────────────
// Radar chart
// ─────────────────────────────────────────────
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
export default function CalibrationPage() {
  const router = useRouter()

  const [screen, setScreen] = useState<Screen>(0)
  const [exiting, setExiting] = useState(false)
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')

  // Answers: questionIndex → chosen option id
  const [answers, setAnswers] = useState<Record<number, string>>({})
  // Which option just got selected (for pulse animation)
  const [justSelected, setJustSelected] = useState<string | null>(null)

  // Results
  const [results, setResults] = useState<CalibrationResults | null>(null)
  const [radarVisible, setRadarVisible] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)

  // Road progress based on screen (0–10)
  const roadOffset = 1200 * (1 - screen / 10)

  // ── Screen transitions ──────────────────────
  function goTo(s: Screen, dir: 'forward' | 'back' = 'forward') {
    setDirection(dir)
    setExiting(true)
    setTimeout(() => {
      setScreen(s)
      setExiting(false)
      setJustSelected(null)
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
    setAnswers(prev => ({ ...prev, [questionIdx]: optionId }))

    // Auto-advance after selection lands
    setTimeout(() => {
      const nextScreen = (screen + 1) as Screen
      if (screen === 8) {
        // Last question — submit all moves, go to grading
        submitAnswers({ ...answers, [questionIdx]: optionId })
        goTo(9)
      } else {
        goTo(nextScreen)
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
    try { await fetch('/api/onboarding/complete', { method: 'POST' }) } catch { /* ok */ }
    router.push(dest)
  }

  // ── Derived ─────────────────────────────────
  const isQuestion = screen >= 1 && screen <= 8
  const qIdx = screen - 1  // 0-based index into QUESTIONS
  const currentQ = isQuestion ? QUESTIONS[qIdx] : null

  // Which FLOW move pills are done/active
  // Frame=1-2, List=3-4, Optimize=5-6, Win=7-8
  const frameDone      = screen > 2
  const frameActive    = screen === 1 || screen === 2
  const listDone       = screen > 4
  const listActive     = screen === 3 || screen === 4
  const optimizeDone   = screen > 6
  const optimizeActive = screen === 5 || screen === 6
  const winDone        = screen > 8
  const winActive      = screen === 7 || screen === 8

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
        <div className="w-20" />
      </header>

      {/* ── Step pills (question screens + grading + results) ── */}
      {screen >= 1 && screen <= 10 && (
        <div className="relative z-10 flex items-center justify-center gap-3 px-6 py-2 bg-background/80 backdrop-blur-sm border-b border-outline-variant/40 flex-shrink-0">
          {[
            { symbol: '◇', label: 'Frame',    done: frameDone,     active: frameActive },
            { symbol: '◈', label: 'List',     done: listDone,      active: listActive },
            { symbol: '◆', label: 'Optimize', done: optimizeDone,  active: optimizeActive },
            { symbol: '◎', label: 'Win',      done: winDone,       active: winActive },
          ].map((m, i) => (
            <div key={m.label} className="flex items-center gap-1.5">
              <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all duration-300 ${
                m.done   ? 'bg-primary text-on-primary' :
                m.active ? 'bg-white text-primary border-2 border-primary shadow-sm' :
                           'bg-surface-container-high text-on-surface-variant opacity-40'
              }`}>
                {m.done
                  ? <span className="material-symbols-outlined text-[11px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                  : <span>{m.symbol}</span>
                }
                {m.label}
              </div>
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

          {/* ── Screen 0: Intro ── */}
          {screen === 0 && (
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

              <div className="grid grid-cols-2 gap-2.5 w-full max-w-xs">
                {FLOW_MOVES.map(m => (
                  <div key={m.key} className="rounded-xl p-3.5 flex flex-col gap-1 text-left" style={{ background: m.color }}>
                    <span className="text-lg font-bold" style={{ color: m.textColor }}>{m.symbol}</span>
                    <span className="font-bold text-sm text-on-surface">{m.label}</span>
                    <span className="text-[11px] text-on-surface-variant leading-snug">{m.desc}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => goTo(1)}
                className="inline-flex items-center gap-2 bg-primary text-on-primary rounded-full px-8 py-3 font-label font-bold text-sm shadow-lg shadow-primary/25 hover:brightness-110 active:scale-95 transition-all"
              >
                Let&apos;s go
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
              <a href="/challenges" className="text-xs text-on-surface-variant hover:text-on-surface underline underline-offset-2 transition-colors">
                Skip — browse challenges first
              </a>
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

              {/* Back link — subtle, only on screens 2+ */}
              {screen > 1 && !justSelected && (
                <button
                  onClick={() => goTo((screen - 1) as Screen, 'back')}
                  className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-on-surface transition-colors mt-2 mx-auto"
                >
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  Back
                </button>
              )}
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

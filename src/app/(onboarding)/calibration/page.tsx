'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import type { CalibrationResults } from '@/lib/types'

// ── Types ────────────────────────────────────────────────────
type CalibStep = 0 | 1 | 2 | 3 | 4

const FLOW_MOVES = [
  { key: 'frame', symbol: '◇', label: 'Frame', color: '#e8f5e9', textColor: '#2e7d32', desc: 'Define the real problem' },
  { key: 'list',  symbol: '◈', label: 'List',  color: '#e3f2fd', textColor: '#1565c0', desc: 'Surface options & trade-offs' },
  { key: 'optimize', symbol: '◆', label: 'Optimize', color: '#fce4ec', textColor: '#ad1457', desc: 'Sharpen the recommendation' },
  { key: 'win',   symbol: '◎', label: 'Win',   color: '#fff8e1', textColor: '#f57f17', desc: 'Deliver the answer clearly' },
]

const STEP_LABELS = ['Intro', 'Frame', 'List', 'Grading', 'Results']

// ── Transition helper ────────────────────────────────────────
function useStepTransition() {
  const [step, setStep] = useState<CalibStep>(0)
  const [exiting, setExiting] = useState(false)
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')

  function advance(to: CalibStep, dir: 'forward' | 'back' = 'forward') {
    setDirection(dir)
    setExiting(true)
    setTimeout(() => {
      setStep(to)
      setExiting(false)
    }, 220)
  }

  return { step, exiting, direction, advance }
}

// ── Radar chart (reused from results/page.tsx pattern) ───────
function RadarChart({ scores, radarVisible }: { scores: CalibrationResults['scores']; radarVisible: boolean }) {
  return (
    <div className="relative w-56 h-56 flex items-center justify-center mx-auto">
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
          fillOpacity={radarVisible ? 0.4 : 0}
          stroke="#4a7c59"
          strokeWidth="2"
          style={{
            transition: 'fill-opacity 800ms ease-out, transform 800ms ease-out',
            transformOrigin: '100px 100px',
            transform: radarVisible ? 'scale(1)' : 'scale(0)',
          }}
        />
      </svg>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 text-center">
        <span className="block text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Frame</span>
        <span className="text-xs font-bold text-primary">{scores.frame}</span>
      </div>
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 text-center">
        <span className="block text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">List</span>
        <span className="text-xs font-bold text-primary">{scores.list}</span>
      </div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 text-center">
        <span className="block text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Opt.</span>
        <span className="text-xs font-bold text-primary">{scores.optimize}</span>
      </div>
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 text-center">
        <span className="block text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Win</span>
        <span className="text-xs font-bold text-primary">{scores.win}</span>
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────
export default function CalibrationPage() {
  const router = useRouter()
  const { step, exiting, direction, advance } = useStepTransition()

  // Step 1 answers
  const [assumptions, setAssumptions] = useState('')
  const [reframe, setReframe] = useState('')

  // Step 2 answers
  const [segmentation, setSegmentation] = useState('')

  // Timer (step 1 + 2)
  const [seconds, setSeconds] = useState(522)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Results
  const [results, setResults] = useState<CalibrationResults | null>(null)
  const [radarVisible, setRadarVisible] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)

  // Road animation progress
  const roadProgress = step / 4
  const pathLength = 1200
  const roadOffset = pathLength * (1 - roadProgress)

  // Start timer when entering step 1
  useEffect(() => {
    if (step === 1) {
      timerRef.current = setInterval(() => setSeconds(s => s > 0 ? s - 1 : 0), 1000)
    } else if (step > 2) {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [step])

  // Grading step: fetch results then auto-advance
  useEffect(() => {
    if (step !== 3) return
    let done = false
    const minDelay = new Promise(r => setTimeout(r, 2500))
    const fetchResults = fetch('/api/onboarding/results')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setResults(data) })
      .catch(() => {})

    Promise.all([minDelay, fetchResults]).then(() => {
      if (!done) advance(4)
    })
    return () => { done = true }
  }, [step]) // eslint-disable-line react-hooks/exhaustive-deps

  // Animate radar on results step
  useEffect(() => {
    if (step !== 4) return
    const t = setTimeout(() => setRadarVisible(true), 400)
    return () => clearTimeout(t)
  }, [step])

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  async function handleNext() {
    if (step === 1) {
      // Submit Frame answers (non-fatal)
      fetch('/api/onboarding/calibration/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ move: 'frame', answers: { assumptions, reframe } }),
      }).catch(() => {})
      advance(2)
    } else if (step === 2) {
      // Submit List answers (non-fatal)
      fetch('/api/onboarding/calibration/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ move: 'list', answers: { segmentation } }),
      }).catch(() => {})
      advance(3)
    }
  }

  async function handleComplete(destination: '/dashboard' | '/prep') {
    setIsCompleting(true)
    try {
      await fetch('/api/onboarding/complete', { method: 'POST' })
    } catch { /* non-fatal */ }
    router.push(destination)
  }

  const wordCount = segmentation.trim().split(/\s+/).filter(Boolean).length
  const wordCountOk = wordCount >= 80 && wordCount <= 150

  // Fallback scores if API didn't return results
  const scores = results?.scores ?? { frame: 72, list: 58, optimize: 65, win: 44 }
  const archetype = results?.archetype ?? 'The Systematic Builder'
  const archetypeDescription = results?.archetype_description ?? 'You construct solutions methodically with strong framing, but your narrative communication needs development.'
  const percentile = results?.percentile ?? 61
  const startingLevels = results?.starting_levels ?? { frame: 3, list: 2, optimize: 2, win: 1 }

  // Content animation classes
  const contentClass = exiting
    ? direction === 'forward'
      ? 'opacity-0 -translate-x-8 transition-all duration-200'
      : 'opacity-0 translate-x-8 transition-all duration-200'
    : 'opacity-100 translate-x-0 transition-all duration-300'

  const showTimer = step === 1 || step === 2
  const showPills = step >= 1 && step <= 4
  const showBack = step === 2
  const showNext = step === 1 || step === 2
  const nextDisabled = step === 2 && !wordCountOk

  return (
    <div className="min-h-screen flex flex-col bg-surface overflow-hidden">

      {/* ── Road background SVG ── */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-none z-0"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {/* Faint wide road */}
        <path
          d="M-100,200 C150,200 300,350 600,350 C900,350 1050,200 1300,180"
          fill="none" stroke="#4a7c59" strokeWidth="80" strokeLinecap="round" opacity="0.035"
        />
        {/* Dashed centre line — animates forward */}
        <path
          d="M-100,200 C150,200 300,350 600,350 C900,350 1050,200 1300,180"
          fill="none" stroke="#4a7c59" strokeWidth="2.5"
          strokeDasharray="18 12" strokeLinecap="round" opacity="0.12"
          style={{
            strokeDashoffset: roadOffset,
            transition: 'stroke-dashoffset 600ms cubic-bezier(0.4,0,0.2,1)',
          }}
        />
        {/* Lower secondary road */}
        <path
          d="M-100,580 C200,580 400,480 700,480 C1000,480 1100,560 1300,540"
          fill="none" stroke="#4a7c59" strokeWidth="50" strokeLinecap="round" opacity="0.025"
        />
        {/* Journey dots */}
        <circle cx="200" cy="210" r="6" fill="#4a7c59" opacity="0.07" />
        <circle cx="450" cy="295" r="5" fill="#4a7c59" opacity="0.06" />
        <circle cx="700" cy="355" r="7" fill="#4a7c59" opacity="0.07" />
        <circle cx="950" cy="270" r="5" fill="#4a7c59" opacity="0.05" />
      </svg>

      {/* ── Top bar ── */}
      <header className="relative z-10 h-12 flex items-center justify-between px-6 bg-background/90 backdrop-blur-sm border-b border-outline-variant flex-shrink-0">
        <span className="font-headline font-bold text-primary text-base tracking-tight">HackProduct</span>
        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
          {step === 0 ? 'Calibration' : `Step ${step} of 4`}
        </span>
        {showTimer ? (
          <div className="flex items-center gap-1.5 text-primary font-mono font-bold text-sm">
            <span className="material-symbols-outlined text-base">timer</span>
            {formatTime(seconds)}
          </div>
        ) : (
          <div className="w-20" />
        )}
      </header>

      {/* ── Step pills (steps 1–4) ── */}
      {showPills && (
        <div className="relative z-10 flex items-center justify-center gap-3 px-6 py-2.5 bg-background/80 backdrop-blur-sm border-b border-outline-variant/50 flex-shrink-0">
          {FLOW_MOVES.map((m, i) => {
            const moveStep = i + 1
            const isDone = step > moveStep
            const isActive = step === moveStep
            return (
              <div key={m.key} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all duration-300 ${
                  isDone ? 'bg-primary text-on-primary' :
                  isActive ? 'bg-white text-primary border-2 border-primary shadow-sm' :
                  'bg-surface-container-high text-on-surface-variant opacity-50'
                }`}>
                  {isDone
                    ? <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    : <span>{m.symbol}</span>
                  }
                  {m.label}
                </div>
                {i < FLOW_MOVES.length - 1 && (
                  <div className={`w-5 h-0.5 rounded-full transition-all duration-500 ${isDone ? 'bg-primary' : 'bg-outline-variant'}`} />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Main content ── */}
      <main className="relative z-10 flex-1 overflow-y-auto pb-24">
        <div className={`max-w-2xl mx-auto px-5 py-6 ${contentClass}`}>

          {/* ── Step 0: Intro ── */}
          {step === 0 && (
            <div className="flex flex-col items-center text-center gap-6 pt-4">
              <div className="animate-luma-glow">
                <LumaGlyph size={96} state="celebrating" className="text-primary" />
              </div>
              <div>
                <h1 className="font-headline text-3xl font-bold text-on-surface mb-3 leading-tight">
                  Let&apos;s find your baseline
                </h1>
                <p className="text-sm text-on-surface-variant max-w-sm mx-auto leading-relaxed">
                  4 quick moves. ~10 minutes. No right answers — Luma reads how you think, not what you know.
                </p>
              </div>

              {/* FLOW move cards */}
              <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                {FLOW_MOVES.map(m => (
                  <div
                    key={m.key}
                    className="rounded-xl p-4 flex flex-col gap-1.5 text-left"
                    style={{ background: m.color }}
                  >
                    <div className="text-xl font-bold" style={{ color: m.textColor }}>{m.symbol}</div>
                    <div className="font-bold text-sm text-on-surface">{m.label}</div>
                    <div className="text-[11px] text-on-surface-variant leading-snug">{m.desc}</div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => advance(1)}
                className="inline-flex items-center gap-2 bg-primary text-on-primary rounded-full px-8 py-3 font-label font-bold text-sm shadow-lg shadow-primary/25 hover:brightness-110 active:scale-95 transition-all"
              >
                Start calibration
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
              <a href="/challenges" className="text-xs text-on-surface-variant hover:text-on-surface underline underline-offset-2 transition-colors">
                Skip — browse challenges first
              </a>
            </div>
          )}

          {/* ── Step 1: Frame ── */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in-up">
              {/* Luma tip */}
              <div className="flex items-start gap-3 bg-primary-fixed rounded-xl p-4">
                <LumaGlyph size={40} state="listening" className="text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm text-on-surface leading-relaxed">
                  <span className="font-bold text-primary">Frame move: </span>
                  I&apos;ll assess how you define the problem space. There are no right answers — I&apos;m looking at how you think, not what you know.
                </p>
              </div>

              {/* Challenge prompt */}
              <div className="bg-surface-container rounded-xl p-5">
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">AI-Assisted</span>
                  <span className="bg-primary-fixed text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Product Strategy</span>
                  <span className="bg-tertiary-container/40 text-tertiary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">B2C</span>
                </div>
                <h2 className="font-headline text-xl font-bold text-on-surface mb-2 leading-tight">
                  Spotify is seeing a 15% drop in podcast listening among 25–34 year olds
                </h2>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  You&apos;re the PM. What&apos;s the real problem here — and how would you frame it for your team?
                </p>
              </div>

              {/* Q1 */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-on-surface">
                  <span className="w-5 h-5 rounded-full bg-primary-fixed text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0">1</span>
                  What assumptions are baked into the way this problem was stated?
                </label>
                <div className="relative">
                  <textarea
                    value={assumptions}
                    onChange={e => setAssumptions(e.target.value.slice(0, 500))}
                    rows={5}
                    placeholder="Think about what the data does and doesn't tell you…"
                    className="w-full bg-surface-container-high border border-outline-variant/50 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all placeholder:text-on-surface-variant/40 resize-none"
                  />
                  <span className="absolute bottom-2.5 right-3 text-[10px] font-bold text-on-surface-variant/50">{assumptions.length}/500</span>
                </div>
              </div>

              {/* Q2 */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-on-surface">
                  <span className="w-5 h-5 rounded-full bg-primary-fixed text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0">2</span>
                  How would you reframe this problem to open up more solution space?
                </label>
                <div className="relative">
                  <textarea
                    value={reframe}
                    onChange={e => setReframe(e.target.value.slice(0, 500))}
                    rows={5}
                    placeholder="A good reframe changes what solutions become possible…"
                    className="w-full bg-surface-container-high border border-outline-variant/50 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all placeholder:text-on-surface-variant/40 resize-none"
                  />
                  <span className="absolute bottom-2.5 right-3 text-[10px] font-bold text-on-surface-variant/50">{reframe.length}/500</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: List ── */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in-up">
              {/* Luma tip */}
              <div className="flex items-start gap-3 bg-primary-fixed rounded-xl p-4">
                <LumaGlyph size={40} state="listening" className="text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm text-on-surface leading-relaxed">
                  <span className="font-bold text-primary">List move: </span>
                  I&apos;m looking at whether you can identify distinct, non-overlapping user segments — not just symptoms.
                </p>
              </div>

              {/* Challenge prompt */}
              <div className="bg-surface-container rounded-xl p-5">
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Traditional</span>
                  <span className="bg-primary-fixed text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Product Strategy</span>
                </div>
                <h2 className="font-headline text-xl font-bold text-on-surface mb-2 leading-tight">
                  The Feature That Backfired
                </h2>
                <p className="text-sm text-on-surface-variant leading-relaxed mb-3">
                  Spotify shipped a social share button. Downloads went up 12%, but sessions per user dropped 18% and purchases fell 9%. You&apos;re the PM reviewing the post-launch data.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-700">
                    <span className="material-symbols-outlined text-sm">trending_down</span>
                    New User Retention: −5%
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-green-50 text-green-700">
                    <span className="material-symbols-outlined text-sm">trending_up</span>
                    Viral K-Factor: +0.3
                  </span>
                </div>
              </div>

              {/* Segmentation textarea */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-on-surface">
                  <span className="w-5 h-5 rounded-full bg-primary-fixed text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0">1</span>
                  Segment the affected users into 3 distinct behavioral groups. What differentiates each one?
                </label>
                <div className="relative">
                  <textarea
                    value={segmentation}
                    onChange={e => setSegmentation(e.target.value)}
                    rows={8}
                    placeholder="Describe each segment — who they are, how they interact with the feature, and what metric tells their story…"
                    className="w-full bg-surface-container-high border border-outline-variant/50 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all placeholder:text-on-surface-variant/40 resize-none"
                  />
                  <span className={`absolute bottom-2.5 right-3 text-[10px] font-bold transition-colors ${
                    wordCount === 0 ? 'text-on-surface-variant/50' :
                    wordCountOk ? 'text-primary' : wordCount < 80 ? 'text-tertiary' : 'text-error'
                  }`}>
                    {wordCount} / 80–150 words
                  </span>
                </div>
                {wordCount > 0 && !wordCountOk && (
                  <p className="text-[11px] text-tertiary font-medium pl-1">
                    {wordCount < 80 ? `${80 - wordCount} more words to go` : `Trim to 150 words (${wordCount - 150} over)`}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── Step 3: Grading ── */}
          {step === 3 && (
            <div className="flex flex-col items-center justify-center text-center gap-6 pt-12 min-h-[360px]">
              <div className="animate-luma-glow">
                <LumaGlyph size={80} state="reviewing" className="text-primary" />
              </div>
              <div className="animate-fade-in">
                <h2 className="font-headline text-2xl font-bold text-on-surface mb-2">
                  Luma is reading your answers…
                </h2>
                <p className="text-sm text-on-surface-variant">Mapping your thinking across all 4 FLOW moves</p>
              </div>
              <div className="dot-pulse flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                <span className="w-2 h-2 rounded-full bg-primary inline-block" />
              </div>
            </div>
          )}

          {/* ── Step 4: Results ── */}
          {step === 4 && (
            <div className="space-y-5 animate-fade-in-up">
              {/* Header */}
              <div className="flex flex-col items-center text-center gap-3 pt-2">
                <LumaGlyph size={64} state="celebrating" className="text-primary animate-luma-glow" />
                <div>
                  <h1 className="font-headline text-2xl font-bold text-on-surface mb-1">Your baseline is set!</h1>
                  <p className="text-sm text-on-surface-variant">Here&apos;s where you stand across the 4 FLOW moves.</p>
                </div>
              </div>

              {/* Radar + percentile */}
              <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 p-5">
                <RadarChart scores={scores} radarVisible={radarVisible} />
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
                    <div
                      key={m.key}
                      className={`rounded-xl p-3 flex flex-col items-center gap-1.5 border ${isFocus ? 'border-tertiary-container/60' : 'border-outline-variant/40'} bg-white`}
                    >
                      <span className="text-lg">{m.symbol}</span>
                      <span className="text-[9px] font-bold text-on-surface-variant uppercase">{m.label}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isFocus ? 'border border-tertiary text-tertiary' : 'bg-primary text-on-primary'}`}>
                        {isFocus ? 'Focus' : `Lvl ${level}`}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* CTAs */}
              <div className="space-y-3 pt-2">
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

      {/* ── Footer bar (steps 1–2) ── */}
      {(showNext || showBack) && (
        <footer className="relative z-10 fixed bottom-0 left-0 right-0 h-16 flex items-center justify-between px-8 bg-background/90 backdrop-blur-sm border-t border-outline-variant">
          {showBack ? (
            <button
              onClick={() => advance((step - 1) as CalibStep, 'back')}
              className="flex items-center gap-1.5 text-on-surface-variant font-label font-bold text-sm hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Back
            </button>
          ) : (
            <div />
          )}

          <p className="hidden lg:block text-xs text-on-surface-variant italic">
            &ldquo;Take your time. Luma sees your reasoning, not just keywords.&rdquo;
          </p>

          <button
            onClick={handleNext}
            disabled={nextDisabled}
            className="inline-flex items-center gap-2 bg-primary text-on-primary rounded-full px-8 py-2.5 font-label font-bold text-sm shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {step === 1 ? 'Next: List' : 'Submit for grading'}
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </footer>
      )}
    </div>
  )
}

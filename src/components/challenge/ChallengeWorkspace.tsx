'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { ChallengePrompt } from '@/lib/types'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import { useSteps } from '@/hooks/useSteps'

/* ── Types ───────────────────────────────────────────────── */

interface ChallengeWorkspaceProps {
  challenge: ChallengePrompt
  domainTitle: string
  domainIcon: string
}

type WorkspaceMode = 'guided' | 'freeform'

interface FlowStep {
  key: string
  label: string
  subtitle: string
  color: string
}

/* ── Constants ───────────────────────────────────────────── */

const FLOW_STEPS: FlowStep[] = [
  { key: 'frame', label: 'Frame', subtitle: 'Define the core problem',          color: 'text-blue-500' },
  { key: 'list',     label: 'List',     subtitle: 'Who exactly is affected, and how?', color: 'text-green-500' },
  { key: 'optimize', label: 'Optimize', subtitle: 'Weigh your options',               color: 'text-amber-500' },
  { key: 'win',      label: 'Win',      subtitle: 'Make your recommendation',         color: 'text-purple-500' },
]

const MOCK_METRICS = [
  { label: 'Virality',    value: '+12%', positive: true  },
  { label: 'Engagement', value: '-18%', positive: false },
  { label: 'Revenue',    value: '-9%',  positive: false },
]

const GUIDED_MAX_CHARS  = 1200
const FREEFORM_MAX_CHARS = 2000

const COACHING_PROMPTS: Record<number, { thought: string; tip: string }> = {
  0: {
    thought: 'Start by identifying who is affected and what the core tension is. What changed, and why does it matter?',
    tip: 'Great product thinkers frame problems before jumping to solutions. Spend 30% of your time here.',
  },
  1: {
    thought: "Think about the \u2018power users\u2019 who might find the share button intrusive vs. \u2018new users\u2019 who use it to brag.",
    tip: "Don\u2019t treat all users as one group. Power users, new users, and casual users often respond very differently to the same change.",
  },
  2: {
    thought: 'Consider the trade-offs between reverting the feature, iterating on it, or layering a new solution on top.',
    tip: 'Use a 2x2 matrix: effort vs. impact. Name at least 3 options before picking one.',
  },
  3: {
    thought: 'Tie your recommendation back to the core metric the team cares about. Be specific about expected outcomes.',
    tip: 'Strong recommendations include a success metric, a timeline, and a rollback plan.',
  },
}

/* ── Helpers ─────────────────────────────────────────────── */

function difficultyLabel(d: string): string {
  return d.charAt(0).toUpperCase() + d.slice(1)
}

function formatAutoSave(date: Date | null): string {
  if (!date) return ''
  const mins = Math.floor((Date.now() - date.getTime()) / 60000)
  if (mins < 1) return 'Autosaved just now'
  return `Autosaved ${mins}m ago`
}

/* ── Component ───────────────────────────────────────────── */

export function ChallengeWorkspace({ challenge, domainTitle, domainIcon }: ChallengeWorkspaceProps) {
  const router = useRouter()

  const [mode, setMode]                   = useState<WorkspaceMode>('guided')
  const [activeStep, setActiveStep]       = useState(1) // Start on List (step 1) to match Stitch
  const [responses, setResponses]         = useState<Record<number, string>>({ 0: '', 1: '', 2: '', 3: '' })
  const [freeformResponse, setFreeformResponse] = useState('')
  const [submitting, setSubmitting]       = useState(false)
  const [autoSavedAt, setAutoSavedAt]     = useState<Date | null>(null)
  const [frameworkOpen, setFrameworkOpen] = useState(false)
  const [inputMode, setInputMode]         = useState<'text' | 'options'>('text')
  const [selectedOptions, setSelectedOptions] = useState<Set<number>>(new Set())

  const { steps } = useSteps(challenge.id)
  const scaffoldOptions = steps[activeStep]?.scaffold_options ?? []

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const responseRef = useRef('')

  useEffect(() => {
    responseRef.current = mode === 'guided' ? (responses[activeStep] ?? '') : freeformResponse
  }, [mode, activeStep, responses, freeformResponse])

  useEffect(() => {
    const interval = setInterval(() => {
      if (responseRef.current.trim()) setAutoSavedAt(new Date())
    }, 30_000)
    return () => clearInterval(interval)
  }, [])

  const [, setTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 60_000)
    return () => clearInterval(t)
  }, [])

  const currentResponse = mode === 'guided' ? (responses[activeStep] ?? '') : freeformResponse
  const maxChars        = mode === 'guided' ? GUIDED_MAX_CHARS : FREEFORM_MAX_CHARS

  // Reset options state when step changes
  useEffect(() => {
    setInputMode('text')
    setSelectedOptions(new Set())
  }, [activeStep])

  const handleResponseChange = useCallback((value: string) => {
    if (value.length > maxChars) return
    if (mode === 'guided') {
      setResponses(prev => ({ ...prev, [activeStep]: value }))
    } else {
      setFreeformResponse(value)
    }
  }, [mode, activeStep, maxChars])

  const toggleOption = useCallback((index: number) => {
    setSelectedOptions(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }, [])

  const applyOptions = useCallback(() => {
    const parts = [...selectedOptions].sort().map(i => scaffoldOptions[i])
    const seed = parts.join(' Additionally, ')
    handleResponseChange(seed + ' ')
    setInputMode('text')
    setSelectedOptions(new Set())
    setTimeout(() => textareaRef.current?.focus(), 0)
  }, [selectedOptions, scaffoldOptions, handleResponseChange])

  const handleSubmit = useCallback(async () => {
    if (submitting) return
    const responseText = mode === 'guided'
      ? Object.values(responses).filter(Boolean).join('\n\n---\n\n')
      : freeformResponse
    if (!responseText.trim()) return

    setSubmitting(true)
    try {
      const res  = await fetch('/api/challenges/submit', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          challengeId:      challenge.id,
          mode,
          response:         responseText,
          confidenceRating: 3,
        }),
      })
      const data = await res.json()
      router.push(`/challenges/${challenge.id}/grading?attempt=${data.attemptId ?? 'mock'}`)
    } catch {
      router.push(`/challenges/${challenge.id}/grading?attempt=mock`)
    }
  }, [challenge.id, mode, submitting, responses, freeformResponse, router])

  const step     = FLOW_STEPS[activeStep]
  const coaching = COACHING_PROMPTS[activeStep]

  /* ── Render ── */

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">

      {/* ═══════════════════════════════════════════════════════
          TOP BAR — matches Stitch exactly
          ═══════════════════════════════════════════════════════ */}
      <header className="h-12 w-full bg-background border-b border-outline-variant flex items-center justify-between px-6 z-30 flex-shrink-0">
        {/* Left: back + title */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-1 hover:bg-surface-container-high rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
          </button>
          <span className="font-headline font-black text-lg text-on-surface">{challenge.title}</span>
        </div>
        {/* Center: mode toggle */}
        <div className="flex items-center gap-6">
          <div className="bg-surface-container rounded-full p-1 flex items-center">
            <button
              onClick={() => setMode('guided')}
              className={`px-4 py-1 text-xs font-bold flex items-center gap-2 rounded-full transition-all ${
                mode === 'guided'
                  ? 'bg-white shadow-sm text-primary'
                  : 'text-on-surface-variant'
              }`}
            >
              <span className="text-[10px]">◇◈◆◎</span> Guided
            </button>
            <button
              onClick={() => setMode('freeform')}
              className={`px-4 py-1 text-xs font-bold flex items-center gap-2 rounded-full transition-all ${
                mode === 'freeform'
                  ? 'bg-white shadow-sm text-primary'
                  : 'text-on-surface-variant'
              }`}
            >
              <span
                className="material-symbols-outlined text-xs"
                style={mode === 'freeform' ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                check_circle
              </span>
              Freeform
            </button>
          </div>
          <button
            onClick={() => setFrameworkOpen(f => !f)}
            className="flex items-center gap-2 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined">menu_open</span>
            Frameworks
          </button>
          <div className="h-6 w-px bg-outline-variant" />
          {/* Streak + XP */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-tertiary-container/30 px-2 py-0.5 rounded-full border border-tertiary-container/50">
              <span className="material-symbols-outlined text-xs text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
              <span className="text-xs font-bold text-tertiary">5</span>
            </div>
            <div className="flex items-center gap-1 bg-primary-fixed/50 px-2 py-0.5 rounded-full border border-primary-fixed">
              <span className="text-xs font-bold text-primary">1250 XP</span>
            </div>
          </div>
          {/* Avatar */}
          <div className="flex items-center gap-2">
            <button className="p-1 hover:bg-surface-container-high rounded-full transition-colors">
              <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
            </button>
            <div className="h-8 w-8 rounded-full bg-surface-container-highest overflow-hidden border border-outline-variant flex items-center justify-center">
              <span className="material-symbols-outlined text-on-surface-variant text-lg">account_circle</span>
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════
          CONTENT AREA — guided split-pane or freeform scroll
          ═══════════════════════════════════════════════════════ */}
      {mode === 'freeform' ? (
        <FreeformView
          challenge={challenge}
          freeformResponse={freeformResponse}
          onResponseChange={setFreeformResponse}
          onSubmit={handleSubmit}
          submitting={submitting}
          autoSavedAt={autoSavedAt}
          frameworkOpen={frameworkOpen}
          onToggleFramework={() => setFrameworkOpen(f => !f)}
        />
      ) : (
      <div className="flex-1 flex overflow-hidden">

        {/* ── LEFT PANE — Scenario (w-2/5) ─────────────────── */}
        <section className="w-2/5 bg-surface-container-lowest border-r border-outline-variant flex flex-col overflow-y-auto p-6">

          {/* Title + bookmark */}
          <div className="flex items-start justify-between mb-4">
            <h1 className="font-headline text-lg font-bold leading-tight">{challenge.title}</h1>
            <button className="text-on-surface-variant hover:text-primary">
              <span className="material-symbols-outlined">bookmark</span>
            </button>
          </div>

          {/* Paradigm + Difficulty badges */}
          <div className="flex gap-2 mb-6">
            {challenge.paradigm && (
              <span className="bg-green-50 text-green-500 border border-green-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                {challenge.paradigm}
              </span>
            )}
            <span className="bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
              Difficulty: {difficultyLabel(challenge.difficulty)}
            </span>
          </div>

          {/* Scenario prose */}
          <div className="text-on-surface-variant leading-relaxed text-sm">
            <p>{challenge.prompt_text}</p>
          </div>

          {/* Hero image placeholder */}
          <div className="mt-8 rounded-xl overflow-hidden aspect-video bg-surface-container relative">
            <div className="absolute inset-0 flex items-center justify-center text-on-surface-variant/30">
              <span className="material-symbols-outlined text-6xl">monitoring</span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent" />
          </div>
        </section>

        {/* ── RIGHT PANE — Answer Workspace (flex-1) ───────── */}
        <section className="flex-1 bg-surface flex flex-col overflow-hidden relative">

          {/* Move Progress Bar */}
          <div className="px-6 pt-4 pb-2 border-b border-outline-variant/30 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-1 w-full max-w-lg">
              {FLOW_STEPS.map((s, i) => {
                const hasContent = (responses[i] ?? '').trim().length > 0
                const isComplete = hasContent && i < activeStep
                const isActive   = i === activeStep

                return (
                  <div key={s.key} className={`flex items-center gap-2 ${i > 0 ? '' : ''}`}>
                    {i > 0 && i < FLOW_STEPS.length && (
                      <div className="border-r border-outline-variant/30 h-4 mx-1" />
                    )}
                    <button
                      onClick={() => setActiveStep(i)}
                      className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-all ${
                        isActive
                          ? 'bg-primary-container text-on-primary-container'
                          : isComplete
                            ? ''
                            : 'opacity-40'
                      }`}
                    >
                      {isComplete ? (
                        <div className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs">✓</div>
                      ) : isActive ? (
                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>article</span>
                      ) : (
                        <span className="material-symbols-outlined text-sm">article</span>
                      )}
                      <span className="text-xs font-bold">{s.label}</span>
                    </button>
                  </div>
                )
              })}
            </div>
            <button
              onClick={() => setFrameworkOpen(f => !f)}
              className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-2 transition-all"
            >
              <span className="material-symbols-outlined text-sm">segment</span>
              ≡ Frameworks
            </button>
          </div>

          {/* Thinking Move Tabs */}
          <div className="px-6 flex items-center gap-6 border-b border-outline-variant/30 bg-surface-container-low flex-shrink-0">
            {FLOW_STEPS.map((s, i) => {
              const isActive = i === activeStep
              return (
                <button
                  key={s.key}
                  onClick={() => setActiveStep(i)}
                  className={`py-3 text-xs font-bold flex items-center gap-1.5 transition-colors ${
                    isActive
                      ? 'text-primary border-b-2 border-primary'
                      : i > activeStep
                        ? 'text-on-surface-variant opacity-60 hover:text-primary'
                        : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[16px] ${s.color}`}
                    style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    article
                  </span>
                  {s.label}
                </button>
              )
            })}
          </div>

          {/* Active Content */}
          <div className="flex-1 p-8 overflow-y-auto">
            <div className="max-w-3xl">
              <h2 className="text-xl font-bold font-headline mb-1">
                {step.label} — {step.subtitle}
              </h2>
              <p className="text-sm text-on-surface-variant mb-6 font-body">
                {activeStep === 0 && 'Identify the problem before jumping to solutions.'}
                {activeStep === 1 && 'Segment the affected users before deciding anything.'}
                {activeStep === 2 && 'Evaluate the options and their trade-offs.'}
                {activeStep === 3 && 'Make a clear, specific recommendation.'}
              </p>

              {/* Input mode toggle — only shown when scaffold options exist */}
              {scaffoldOptions.length > 0 && (
                <div className="flex gap-1 mb-4">
                  <button
                    onClick={() => setInputMode('text')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-label font-semibold transition-colors ${
                      inputMode === 'text'
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">edit</span>
                    Text
                  </button>
                  <button
                    onClick={() => setInputMode('options')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-label font-semibold transition-colors ${
                      inputMode === 'options'
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">format_list_bulleted</span>
                    Options
                  </button>
                </div>
              )}

              {/* Options cards — shown in options mode */}
              {inputMode === 'options' && scaffoldOptions.length > 0 ? (
                <div className="space-y-2">
                  {scaffoldOptions.map((opt, i) => {
                    const selected = selectedOptions.has(i)
                    return (
                      <button
                        key={i}
                        onClick={() => toggleOption(i)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all font-body text-sm leading-relaxed ${
                          selected
                            ? 'border-primary bg-primary-fixed text-on-surface'
                            : 'border-outline-variant bg-surface-container text-on-surface-variant hover:border-primary/40 hover:bg-surface-container-high'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 transition-colors ${
                            selected ? 'border-primary bg-primary' : 'border-outline-variant'
                          }`} />
                          <span>{opt}</span>
                        </div>
                      </button>
                    )
                  })}
                  <button
                    onClick={applyOptions}
                    disabled={selectedOptions.size === 0}
                    className="mt-2 w-full py-2.5 rounded-full bg-secondary-container text-on-secondary-container text-sm font-label font-semibold disabled:opacity-40 hover:bg-primary-fixed transition-colors"
                  >
                    Use selected — continue in text
                  </button>
                </div>
              ) : (
                /* Textarea */
                <div className="relative group">
                  <textarea
                    ref={textareaRef}
                    value={currentResponse}
                    onChange={e => handleResponseChange(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none font-body leading-relaxed"
                    placeholder={`Write your analysis here. Consider: ${step.subtitle.toLowerCase()}`}
                    rows={8}
                  />
                  <div className="absolute bottom-4 right-4 text-[10px] font-bold text-outline uppercase tracking-widest">
                    {currentResponse.length} / {maxChars} characters
                  </div>
                </div>
              )}

              {/* Action row — hidden in options mode */}
              {inputMode !== 'options' && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">save</span>
                      {autoSavedAt ? formatAutoSave(autoSavedAt) : 'Autosaved 2 mins ago'}
                    </span>
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-sm flex items-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit for Grading'}
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              )}

              {/* Data Cards Grid — Luma thought starter + Add custom segment */}
              <div className="mt-12 grid grid-cols-2 gap-4">
                <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30">
                  <div className="flex items-center gap-2 mb-3">
                    <LumaGlyph size={24} state="speaking" className="text-primary" />
                    <span className="text-[10px] font-bold uppercase text-on-surface-variant">Luma&apos;s Thought Starter</span>
                  </div>
                  <p className="text-xs italic text-on-surface-variant">
                    &ldquo;{coaching.thought}&rdquo;
                  </p>
                </div>
                <button className="bg-surface-container-lowest p-4 rounded-xl border border-dashed border-outline-variant/30 flex items-center justify-center hover:border-primary hover:text-primary transition-colors">
                  <div className="text-center">
                    <span className="material-symbols-outlined text-outline mb-1">add_circle</span>
                    <div className="text-[10px] font-bold text-outline uppercase">Add Custom Segment</div>
                  </div>
                </button>
              </div>

              {/* Frameworks drawer */}
              {frameworkOpen && (
                <div className="mt-6 bg-surface-container rounded-xl p-4 space-y-2 animate-fade-in">
                  <h3 className="font-label font-bold text-on-surface text-xs mb-3 uppercase tracking-widest">HEART Framework</h3>
                  {[
                    { letter: 'H', name: 'Happiness',    desc: 'User satisfaction, NPS, sentiment' },
                    { letter: 'E', name: 'Engagement',   desc: 'Session depth, frequency, feature usage' },
                    { letter: 'A', name: 'Adoption',     desc: 'New users, onboarding completion' },
                    { letter: 'R', name: 'Retention',    desc: 'Churn rate, return frequency' },
                    { letter: 'T', name: 'Task Success', desc: 'Completion rate, time-to-task, errors' },
                  ].map(f => (
                    <div key={f.letter} className="flex items-start gap-2.5 p-2.5 bg-surface-container-low rounded-xl">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-headline font-bold text-xs">
                        {f.letter}
                      </span>
                      <div>
                        <p className="font-label font-semibold text-on-surface text-xs">{f.name}</p>
                        <p className="text-on-surface-variant text-xs font-body mt-0.5">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Luma Coaching Strip (bottom) */}
          <div className="bg-primary-fixed/30 border-t border-primary/10 px-6 py-3 flex items-center gap-4 flex-shrink-0">
            <LumaGlyph size={28} state="speaking" className="text-primary flex-shrink-0" />
            <div className="flex-1 text-sm text-on-primary-container font-medium">
              <span className="font-bold">Pro tip:</span> {coaching.tip}
            </div>
            <a className="text-primary font-bold text-sm hover:underline flex items-center gap-1 flex-shrink-0" href="#">
              More tips
              <span className="material-symbols-outlined text-sm">open_in_new</span>
            </a>
          </div>
        </section>
      </div>
      )}
    </div>
  )
}

/* ── FreeformView ─────────────────────────────────────────────────────────── */

interface FreeformViewProps {
  challenge: ChallengePrompt
  freeformResponse: string
  onResponseChange: (v: string) => void
  onSubmit: () => void
  submitting: boolean
  autoSavedAt: Date | null
  frameworkOpen: boolean
  onToggleFramework: () => void
}

function FreeformView({
  challenge,
  freeformResponse,
  onResponseChange,
  onSubmit,
  submitting,
  autoSavedAt,
  frameworkOpen,
  onToggleFramework,
}: FreeformViewProps) {
  const wordCount = freeformResponse.trim() ? freeformResponse.trim().split(/\s+/).length : 0
  // aim 200-400 words → 100% at 400
  const wordPct   = Math.min(100, Math.round((wordCount / 400) * 100))

  return (
    <main className="flex-1 overflow-y-auto bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Challenge Header & Scenario ─────────────────────── */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          <div className="md:col-span-8 space-y-4">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-primary text-on-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Traditional
              </span>
              <span className="bg-secondary-container text-secondary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                {challenge.difficulty.charAt(0).toUpperCase() + challenge.difficulty.slice(1)}
              </span>
              <span className="bg-surface-container text-on-surface-variant text-[10px] font-bold px-2 py-0.5 rounded-full">
                #SWE
              </span>
              <span className="bg-surface-container text-on-surface-variant text-[10px] font-bold px-2 py-0.5 rounded-full">
                #Data Eng
              </span>
            </div>

            {/* Title */}
            <h2 className="font-headline text-3xl font-black text-on-surface tracking-tight">
              {challenge.title}
            </h2>

            {/* Scenario card */}
            <div className="bg-surface rounded-xl p-5 border border-outline-variant shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />
              <div className="flex gap-4 relative z-10">
                <div className="bg-secondary-container/50 p-2 rounded-lg h-fit">
                  <span
                    className="material-symbols-outlined text-secondary"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    assignment
                  </span>
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-sm text-secondary uppercase tracking-widest">Scenario</h3>
                  <p className="text-on-surface leading-relaxed text-sm">
                    {challenge.prompt_text}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Luma Insight sidebar */}
          <div className="md:col-span-4 space-y-4">
            <div className="bg-tertiary-container/10 border border-tertiary-container/30 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <LumaGlyph size={40} state="speaking" className="flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-sm text-tertiary">Luma&apos;s Insight</h4>
                  <p className="text-xs text-on-surface-variant">Focus on the cannibalization.</p>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-on-surface-variant">
                Why would more downloads lead to fewer sessions? Look for a disconnect between user
                acquisition and long-term utility.
              </p>
            </div>
          </div>
        </section>

        {/* ── Freeform Writing Workspace ──────────────────────── */}
        <section className="bg-surface rounded-2xl border border-outline-variant overflow-hidden flex flex-col min-h-[600px] shadow-sm">

          {/* Workspace header */}
          <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="font-headline text-lg font-extrabold">Your Analysis</h2>
                <span className="bg-primary-fixed text-primary text-[10px] font-black px-2 py-0.5 rounded-full">
                  FREEFORM MODE
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-1">
                Write your complete analysis. Think through Frame, List, Optimize, and Win in whatever
                order makes sense to you.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="p-2 hover:bg-surface-container-high rounded-lg transition-colors text-on-surface-variant"
                title="Formatting"
              >
                <span className="material-symbols-outlined">format_list_bulleted</span>
              </button>
              <button
                className="p-2 hover:bg-surface-container-high rounded-lg transition-colors text-on-surface-variant"
                title="Save Draft"
              >
                <span className="material-symbols-outlined">save</span>
              </button>
            </div>
          </div>

          {/* Textarea area */}
          <div className="flex-1 p-6 relative">
            <textarea
              value={freeformResponse}
              onChange={e => onResponseChange(e.target.value)}
              className="w-full h-full min-h-[400px] bg-transparent border-none focus:ring-0 font-body text-base leading-relaxed placeholder:text-outline/60 outline-none resize-none"
              placeholder="Start with what you notice in the data. What&apos;s the first question you&apos;d ask? Who&apos;s affected? What does leadership need to hear?"
            />
          </div>

          {/* Luma coaching strip */}
          <div className="bg-primary-fixed/30 border-y border-primary-fixed px-6 py-3 flex items-center gap-4">
            <LumaGlyph size={28} state="speaking" className="flex-shrink-0" />
            <p className="text-sm font-medium text-primary">
              <span className="font-bold">Freeform tip:</span> Structure is optional, but great answers
              usually address: What problem really is &rarr; Who&apos;s affected &rarr; What the tradeoff
              is &rarr; What you&apos;d recommend.
            </p>
          </div>

          {/* Bottom action bar */}
          <div className="px-6 py-4 bg-surface-container-low flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-on-surface">{wordCount} words</span>
                <span className="text-[10px] text-on-surface-variant font-medium">
                  Aim for 200–400 words for full analysis
                </span>
              </div>
              <div className="w-24 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all"
                  style={{ width: `${wordPct}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs font-semibold text-on-surface-variant italic">
                {autoSavedAt ? formatAutoSave(autoSavedAt) : 'Draft saved 2m ago'}
              </span>
              <button
                onClick={onSubmit}
                disabled={submitting}
                className="bg-primary hover:bg-primary/90 text-on-primary font-bold px-6 py-2.5 rounded-full text-sm flex items-center gap-2 shadow-md active:scale-95 transition-all disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit for Grading'}
                <span className="material-symbols-outlined text-sm">send</span>
              </button>
            </div>
          </div>
        </section>

        {/* ── Bento Context Grid ───────────────────────────────── */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Conversion funnel card */}
          <div className="bg-surface p-4 rounded-xl border border-outline-variant">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-on-surface-variant uppercase">
                Conversion Funnel
              </span>
              <span className="material-symbols-outlined text-xs text-primary">trending_down</span>
            </div>
            <div className="space-y-2">
              {MOCK_METRICS.map(m => (
                <div key={m.label} className="flex justify-between text-xs">
                  <span className="text-on-surface-variant">{m.label}</span>
                  <span className={`font-bold ${m.positive ? 'text-primary' : 'text-error'}`}>
                    {m.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Framework refresher card */}
          <div className="bg-surface p-4 rounded-xl border border-outline-variant md:col-span-2 flex items-center gap-4">
            <div className="flex-1">
              <h4 className="text-sm font-bold mb-1">Framework Refresher</h4>
              <p className="text-xs text-on-surface-variant">
                Stuck? Use the <strong>HEART</strong> framework to measure happiness, engagement,
                adoption, retention, and task success.
              </p>
              {frameworkOpen && (
                <div className="mt-4 space-y-2">
                  {[
                    { letter: 'H', name: 'Happiness',    desc: 'User satisfaction, NPS, sentiment' },
                    { letter: 'E', name: 'Engagement',   desc: 'Session depth, frequency, feature usage' },
                    { letter: 'A', name: 'Adoption',     desc: 'New users, onboarding completion' },
                    { letter: 'R', name: 'Retention',    desc: 'Churn rate, return frequency' },
                    { letter: 'T', name: 'Task Success', desc: 'Completion rate, time-to-task, errors' },
                  ].map(f => (
                    <div key={f.letter} className="flex items-start gap-2.5 p-2.5 bg-surface-container-low rounded-xl">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-headline font-bold text-xs">
                        {f.letter}
                      </span>
                      <div>
                        <p className="font-label font-semibold text-on-surface text-xs">{f.name}</p>
                        <p className="text-on-surface-variant text-xs font-body mt-0.5">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={onToggleFramework}
              className="border border-primary text-primary font-bold px-4 py-2 rounded-lg text-xs hover:bg-primary-fixed/20 transition-colors flex-shrink-0"
            >
              {frameworkOpen ? 'Hide HEART' : 'View HEART'}
            </button>
          </div>
        </section>

      </div>
    </main>
  )
}

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { ChallengePrompt } from '@/lib/types'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

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
  icon: string
  subtitle: string
}

/* ── Constants ───────────────────────────────────────────── */

const FLOW_STEPS: FlowStep[] = [
  { key: 'frame', label: 'Frame', icon: 'article', subtitle: 'Define the core problem' },
  { key: 'split', label: 'Split', icon: 'article', subtitle: 'Who exactly is affected, and how?' },
  { key: 'weigh', label: 'Weigh', icon: 'article', subtitle: 'Weigh your options' },
  { key: 'sell', label: 'Sell', icon: 'article', subtitle: 'Make your recommendation' },
]

const MOCK_METRICS = [
  { label: 'Virality', value: '+12%', positive: true },
  { label: 'Engagement', value: '-18%', positive: false },
  { label: 'Revenue', value: '-9%', positive: false },
]

const GUIDED_MAX_CHARS = 1200
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

  // Core state
  const [mode, setMode] = useState<WorkspaceMode>('guided')
  const [activeStep, setActiveStep] = useState(0)
  const [responses, setResponses] = useState<Record<number, string>>({ 0: '', 1: '', 2: '', 3: '' })
  const [freeformResponse, setFreeformResponse] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [autoSavedAt, setAutoSavedAt] = useState<Date | null>(null)
  const [frameworkOpen, setFrameworkOpen] = useState(false)

  const responseRef = useRef('')

  // Keep ref in sync
  useEffect(() => {
    responseRef.current = mode === 'guided' ? (responses[activeStep] ?? '') : freeformResponse
  }, [mode, activeStep, responses, freeformResponse])

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (responseRef.current.trim()) {
        setAutoSavedAt(new Date())
      }
    }, 30_000)
    return () => clearInterval(interval)
  }, [])

  // Refresh autosave display every minute
  const [, setTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 60_000)
    return () => clearInterval(t)
  }, [])

  const currentResponse = mode === 'guided' ? (responses[activeStep] ?? '') : freeformResponse
  const maxChars = mode === 'guided' ? GUIDED_MAX_CHARS : FREEFORM_MAX_CHARS

  const handleResponseChange = useCallback((value: string) => {
    if (value.length > maxChars) return
    if (mode === 'guided') {
      setResponses(prev => ({ ...prev, [activeStep]: value }))
    } else {
      setFreeformResponse(value)
    }
  }, [mode, activeStep, maxChars])

  const handleSubmit = useCallback(async () => {
    if (submitting) return
    const responseText = mode === 'guided'
      ? Object.values(responses).filter(Boolean).join('\n\n---\n\n')
      : freeformResponse
    if (!responseText.trim()) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/challenges/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: challenge.id,
          mode,
          response: responseText,
          confidenceRating: 3,
        }),
      })
      const data = await res.json()
      router.push(`/challenges/${challenge.id}/grading?attempt=${data.attemptId ?? 'mock'}`)
    } catch {
      router.push(`/challenges/${challenge.id}/grading?attempt=mock`)
    }
  }, [challenge.id, mode, submitting, responses, freeformResponse, router])

  const step = FLOW_STEPS[activeStep]
  const coaching = COACHING_PROMPTS[activeStep]

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* ── Top Bar ──────────────────────────────────────────── */}
      <header className="flex-shrink-0 h-14 bg-surface editorial-shadow flex items-center px-6 gap-4 z-20">
        {/* Back */}
        <Link
          href="/challenges"
          className="flex items-center gap-1 text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </Link>

        {/* Title + breadcrumb */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="material-symbols-outlined text-[20px] text-primary" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>bookmark</span>
          <h1 className="font-headline font-bold text-on-surface text-lg truncate">
            {challenge.title}
          </h1>
        </div>

        {/* Metadata chips */}
        <div className="hidden sm:flex items-center gap-2 ml-2">
          <span className="badge-move bg-secondary-container text-on-secondary-container">
            <span className="material-symbols-outlined text-[14px]">{domainIcon}</span>
            {domainTitle}
          </span>
          <span className="badge-move bg-tertiary-container text-on-surface">
            {difficultyLabel(challenge.difficulty)}
          </span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Mode toggle */}
        <div className="flex items-center bg-surface-container-high rounded-full p-0.5">
          <button
            onClick={() => setMode('guided')}
            className={`px-4 py-1.5 rounded-full text-sm font-label font-semibold transition-all ${
              mode === 'guided'
                ? 'bg-primary text-on-primary shadow-sm glow-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Guided
          </button>
          <button
            onClick={() => setMode('freeform')}
            className={`px-4 py-1.5 rounded-full text-sm font-label font-semibold transition-all ${
              mode === 'freeform'
                ? 'bg-primary text-on-primary shadow-sm glow-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Freeform
          </button>
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────── */}
      {mode === 'guided' ? (
        <GuidedView
          challenge={challenge}
          step={step}
          activeStep={activeStep}
          onStepChange={setActiveStep}
          response={currentResponse}
          onResponseChange={handleResponseChange}
          maxChars={GUIDED_MAX_CHARS}
          coaching={coaching}
          autoSavedAt={autoSavedAt}
          frameworkOpen={frameworkOpen}
          onFrameworkToggle={() => setFrameworkOpen(f => !f)}
          onSubmit={handleSubmit}
          submitting={submitting}
          responses={responses}
        />
      ) : (
        <FreeformView
          challenge={challenge}
          response={freeformResponse}
          onResponseChange={handleResponseChange}
          maxChars={FREEFORM_MAX_CHARS}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      )}
    </div>
  )
}

/* ── Guided Mode ─────────────────────────────────────────── */

interface GuidedViewProps {
  challenge: ChallengePrompt
  step: FlowStep
  activeStep: number
  onStepChange: (i: number) => void
  response: string
  onResponseChange: (v: string) => void
  maxChars: number
  coaching: { thought: string; tip: string }
  autoSavedAt: Date | null
  frameworkOpen: boolean
  onFrameworkToggle: () => void
  onSubmit: () => void
  submitting: boolean
  responses: Record<number, string>
}

function GuidedView({
  challenge,
  step,
  activeStep,
  onStepChange,
  response,
  onResponseChange,
  maxChars,
  coaching,
  autoSavedAt,
  frameworkOpen,
  onFrameworkToggle,
  onSubmit,
  submitting,
  responses,
}: GuidedViewProps) {
  const allStepsHaveContent = Object.values(responses).some(r => r.trim().length > 0)

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* ── Left Panel (Main Content) ──────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="flex-1 px-4 py-4 space-y-3 animate-fade-in-up">
          {/* Challenge header */}
          <div>
            <h1 className="font-headline text-2xl font-bold text-on-surface">
              {challenge.title}
            </h1>
            <p className="text-on-surface-variant font-body text-sm mt-1 leading-relaxed">
              {challenge.prompt_text}
            </p>
          </div>

          {/* Context info banner */}
          <div className="glass-card border-l-4 border-primary rounded-lg p-3">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-primary flex-shrink-0 mt-0.5" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>info</span>
              <div>
                <p className="font-label font-bold text-[10px] uppercase tracking-widest text-on-surface-variant mb-0.5">Context</p>
                <p className="text-xs text-on-surface font-body leading-relaxed">
                  The mobile gaming app &ldquo;QuestBound&rdquo; added a prominent &lsquo;Share with Friends&rsquo; button on the post-match screen. While it drove virality, retention and monetization dropped sharply. You need to diagnose why this happened and propose a path forward.
                </p>
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div>
            <h3 className="font-label font-bold text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">Key Metrics</h3>
            <div className="grid grid-cols-3 gap-3">
              {MOCK_METRICS.map(m => (
                <div
                  key={m.label}
                  className="card-elevated card-interactive p-3 text-center"
                >
                  <p className="text-xs text-on-surface-variant font-label mb-0.5">{m.label}</p>
                  <p className={`text-xl font-bold font-headline ${
                    m.positive ? 'text-primary' : 'text-error'
                  }`}>
                    {m.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* FLOW Tab Bar — pills */}
          <div>
            <p className="font-label font-bold text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">FLOW</p>
            <nav className="flex gap-2">
              {FLOW_STEPS.map((s, i) => {
                const isActive = i === activeStep
                const hasContent = (responses[i] ?? '').trim().length > 0
                return (
                  <button
                    key={s.key}
                    onClick={() => onStepChange(i)}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-label font-semibold transition-all ${
                      isActive
                        ? 'bg-primary text-on-primary shadow-sm'
                        : hasContent
                          ? 'bg-primary-fixed text-primary'
                          : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {hasContent && !isActive && (
                      <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>check</span>
                    )}
                    <span>{s.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab content card */}
          <div className="card-elevated p-4">
            <h2 className="font-headline text-base font-bold text-on-surface mb-0.5">
              {step.label} — {step.subtitle}
            </h2>
            <p className="text-on-surface-variant text-sm font-body mb-3">
              {activeStep === 0 && 'Identify the real problem before proposing any solutions.'}
              {activeStep === 1 && 'Segment the affected users before deciding anything.'}
              {activeStep === 2 && 'Compare trade-offs between your options.'}
              {activeStep === 3 && 'Present your final recommendation with conviction.'}
            </p>

            {/* Textarea */}
            <textarea
              value={response}
              onChange={e => onResponseChange(e.target.value)}
              placeholder="Start typing your analysis..."
              className="w-full min-h-[120px] border border-outline-variant bg-surface-container-low rounded-lg px-3 py-2.5 text-on-surface font-body text-sm leading-relaxed placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 ring-primary/20 focus:border-primary/40 resize-y transition-all"
            />

            {/* Bottom bar: char count + autosave */}
            <div className="flex items-center justify-between mt-2 text-xs font-label text-on-surface-variant">
              <span>{response.length} / {maxChars} characters</span>
              {autoSavedAt && (
                <span>{formatAutoSave(autoSavedAt)}</span>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 mt-3">
              <button
                onClick={onFrameworkToggle}
                className="inline-flex items-center gap-2 border border-outline-variant text-primary rounded-lg px-4 py-2 text-sm font-label font-semibold hover:bg-surface-container-low transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                Save
              </button>

              {activeStep < FLOW_STEPS.length - 1 ? (
                <button
                  onClick={() => onStepChange(activeStep + 1)}
                  className="glow-primary inline-flex items-center gap-2 bg-primary text-on-primary rounded-lg px-4 py-2 text-sm font-label font-semibold hover:bg-primary/90 active:scale-95 transition-all"
                >
                  Next: {FLOW_STEPS[activeStep + 1].label}
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              ) : (
                <button
                  onClick={onSubmit}
                  disabled={submitting || !allStepsHaveContent}
                  className="glow-primary inline-flex items-center gap-2 bg-primary text-on-primary rounded-lg px-4 py-2 text-sm font-label font-semibold hover:bg-primary/90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {submitting ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit for Grading
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Panel (Luma Coaching) ────────────────────── */}
      <aside className="hidden lg:flex flex-col w-[320px] flex-shrink-0 bg-surface-container-low border-l border-outline-variant/30 overflow-y-auto">
        <div className="px-4 py-4 space-y-3">
          {/* Luma Thought Starter */}
          <div className="card-elevated p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-full bg-primary/10">
                <LumaGlyph size={28} className="text-primary animate-luma-glow" state="speaking" />
              </div>
              <span className="font-label font-semibold text-on-surface text-sm">
                Luma&apos;s Thought Starter
              </span>
            </div>
            <p className="text-on-surface font-body text-sm leading-relaxed">
              &ldquo;{coaching.thought}&rdquo;
            </p>
          </div>

          {/* Add Segment button (step 1 only) */}
          {activeStep === 1 && (
            <button className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-outline-variant text-on-surface-variant rounded-lg px-3 py-2 text-sm font-label hover:border-primary hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              Add Custom Segment
            </button>
          )}

          {/* Pro tip card */}
          <div className="card-elevated p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>tips_and_updates</span>
              <span className="font-label font-semibold text-on-surface text-sm">Pro tip</span>
            </div>
            <p className="text-on-surface font-body text-sm leading-relaxed">
              {coaching.tip}
            </p>
            <button className="inline-flex items-center gap-1 text-primary text-xs font-label font-semibold mt-2 hover:opacity-80 transition-opacity">
              More tips
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            </button>
          </div>

          {/* Frameworks section */}
          <div>
            <p className="font-label font-bold text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">
              Frameworks
            </p>
            <div className="grid grid-cols-2 gap-2">
              {FLOW_STEPS.map(s => (
                <button
                  key={s.key}
                  className="card-interactive flex items-center gap-1.5 border border-outline-variant/50 rounded-lg px-2.5 py-2 text-xs font-label font-semibold text-primary hover:bg-surface-container-low transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">article</span>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Framework drawer content */}
          {frameworkOpen && (
            <div className="bg-surface-container rounded-xl p-4 space-y-2 animate-in slide-in-from-top-2">
              <h3 className="font-label font-bold text-on-surface text-xs">
                HEART Framework
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { letter: 'H', name: 'Happiness', desc: 'User satisfaction, NPS, sentiment' },
                  { letter: 'E', name: 'Engagement', desc: 'Session depth, frequency, feature usage' },
                  { letter: 'A', name: 'Adoption', desc: 'New users, onboarding completion' },
                  { letter: 'R', name: 'Retention', desc: 'Churn rate, return frequency' },
                  { letter: 'T', name: 'Task Success', desc: 'Completion rate, time-to-task, errors' },
                ].map(f => (
                  <div key={f.letter} className="flex items-start gap-2 p-2 bg-surface-container-low rounded-lg">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-headline font-bold text-xs">
                      {f.letter}
                    </span>
                    <div>
                      <p className="font-label font-semibold text-on-surface text-xs">{f.name}</p>
                      <p className="text-on-surface-variant text-xs font-body">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}

/* ── Freeform Mode ───────────────────────────────────────── */

interface FreeformViewProps {
  challenge: ChallengePrompt
  response: string
  onResponseChange: (v: string) => void
  maxChars: number
  onSubmit: () => void
  submitting: boolean
}

function FreeformView({
  challenge,
  response,
  onResponseChange,
  maxChars,
  onSubmit,
  submitting,
}: FreeformViewProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-4 space-y-3 animate-fade-in-up">
        {/* Mode badge */}
        <div className="flex items-center gap-3">
          <span className="badge-move bg-secondary-container text-on-secondary-container">
            Freeform
          </span>
          <span className="text-xs text-on-surface-variant font-label">
            {challenge.estimated_minutes} min · {difficultyLabel(challenge.difficulty)}
          </span>
        </div>

        {/* Challenge title */}
        <h1 className="font-headline text-2xl font-bold text-on-surface">
          {challenge.title}
        </h1>

        {/* Context & metrics description */}
        <div className="text-on-surface-variant font-body text-sm leading-relaxed space-y-2">
          <p>{challenge.prompt_text}</p>
          <p>
            The current data suggests a significant contradictory effect: While the share button successfully expanded the top of the funnel (Downloads +12%), the Retention (-18%) and Revenue (-9%) metrics suggest a negative impact on the core product experience.
          </p>
          <p>
            Your hypothesis is that the share button is driving growth in a demographic that is in the post-journey, perhaps leading content to key categories and disrupting engagement flow.
          </p>
          <div className="space-y-0.5 text-xs">
            <p>To submit, tell us:</p>
            <p>1. What is the root cause of this divergence?</p>
            <p>2. Who&rsquo;s affected and how?</p>
            <p>3. What should the PM do?</p>
          </div>
          <p className="text-xs italic text-on-surface-variant/80">
            The audience needs to understand that two sub-groups are heading off in opposite directions, so they show up as directly vs. organic.
          </p>
        </div>

        {/* Large textarea */}
        <div className="space-y-2">
          <textarea
            value={response}
            onChange={e => {
              if (e.target.value.length <= maxChars) onResponseChange(e.target.value)
            }}
            placeholder="Write your complete response here. Cover problem framing, user analysis, trade-offs, and your recommendation..."
            className="w-full min-h-[220px] border border-outline-variant bg-surface-container-low rounded-xl px-4 py-3 text-on-surface font-body text-sm leading-relaxed placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 ring-primary/20 focus:border-primary/40 resize-y transition-all"
          />

          {/* Bottom action bar */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-label text-on-surface-variant">
              {response.length} / {maxChars}
            </span>
            <button
              onClick={onSubmit}
              disabled={submitting || !response.trim()}
              className="glow-primary inline-flex items-center gap-2 bg-primary text-on-primary rounded-full px-5 py-2 text-sm font-label font-semibold hover:bg-primary/90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {submitting ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  Submitting...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  Submit for Grading
                </>
              )}
            </button>
          </div>
        </div>

        {/* Framework Reference collapsible */}
        <details className="group">
          <summary className="flex items-center gap-2 cursor-pointer select-none text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-[16px] transition-transform group-open:rotate-90">
              chevron_right
            </span>
            <span className="font-label font-semibold text-xs">Framework Reference</span>
          </summary>
          <div className="mt-2 bg-surface-container rounded-xl p-4 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { letter: 'H', name: 'Happiness', desc: 'User satisfaction, NPS, sentiment' },
                { letter: 'E', name: 'Engagement', desc: 'Session depth, frequency, feature usage' },
                { letter: 'A', name: 'Adoption', desc: 'New users, onboarding completion' },
                { letter: 'R', name: 'Retention', desc: 'Churn rate, return frequency' },
                { letter: 'T', name: 'Task Success', desc: 'Completion rate, time-to-task, errors' },
              ].map(f => (
                <div key={f.letter} className="flex items-start gap-2 p-2 bg-surface-container-low rounded-lg">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-headline font-bold text-xs">
                    {f.letter}
                  </span>
                  <div>
                    <p className="font-label font-semibold text-on-surface text-xs">{f.name}</p>
                    <p className="text-on-surface-variant text-xs font-body">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </details>

        {/* Luma status strip */}
        <div className="flex items-center gap-2 glass-card rounded-xl px-3 py-2">
          <div className="p-1 rounded-full bg-primary/10">
            <LumaGlyph size={18} className="text-primary animate-luma-glow" state="speaking" />
          </div>
          <p className="text-on-surface-variant text-xs font-body">
            Luma will review all 4 FLOW moves after you submit.
          </p>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import type { FlowStep, ResponseType, UserRoleV2 } from '@/lib/types'
import { useChallengeV2 } from '@/lib/v2/hooks/useChallengeV2'
import { useFlowStep } from '@/lib/v2/hooks/useFlowStep'
import { FlowStepper } from './FlowStepper'
import { StepQuestion } from './StepQuestion'
import { ChallengeComplete } from './ChallengeComplete'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

const FLOW_STEPS: FlowStep[] = ['frame', 'list', 'optimize', 'win']

interface RevealedOption {
  id: string
  points: number
  explanation: string
}

interface CompletionData {
  total_score: number
  max_score: number
  grade_label: string
  xp_awarded: number
  step_breakdown: Array<{ step: FlowStep; score: number; max_score: number }>
  competency_deltas: Array<{ competency: string; before: number; after: number }>
}

interface FlowWorkspaceProps {
  challengeId: string
  initialRoleId: UserRoleV2
  onExit?: () => void
}

export function FlowWorkspace({ challengeId, initialRoleId, onExit }: FlowWorkspaceProps) {
  const { detail, loading: challengeLoading, error: challengeError, startAttempt, reload } = useChallengeV2(challengeId)

  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState<FlowStep>('frame')
  const [completedSteps, setCompletedSteps] = useState<FlowStep[]>([])
  const [phase, setPhase] = useState<'intro' | 'loading' | 'question' | 'complete'>('intro')

  // Per-question state
  const [questionIdx, setQuestionIdx] = useState(0)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [elaboration, setElaboration] = useState('')
  const [revealedOptions, setRevealedOptions] = useState<RevealedOption[]>([])
  const [revealed, setRevealed] = useState(false)
  const [lastResult, setLastResult] = useState<{ step_complete: boolean } | null>(null)
  const [roleContext, setRoleContext] = useState('')
  const [careerSignal, setCareerSignal] = useState('')
  const [completionData, setCompletionData] = useState<CompletionData | null>(null)

  const startTimeRef = useRef<number>(Date.now())

  const { stepData, loading: stepLoading, submitting, error: stepError, submitAnswer, fetchCoaching, loadStep } = useFlowStep(challengeId, currentStep)

  // Bootstrap: load challenge
  useEffect(() => {
    reload()
  }, [reload])

  // Resume in-progress attempt; otherwise stay on intro
  useEffect(() => {
    if (detail && !attemptId) {
      if (detail.current_attempt?.status === 'in_progress') {
        setAttemptId(detail.current_attempt.id)
        setCurrentStep(detail.current_attempt.current_step === 'done' ? 'frame' : detail.current_attempt.current_step as FlowStep)
        setPhase('question')
      }
      // otherwise stay on 'intro' — user clicks Start
    }
  }, [detail, attemptId])

  // Load step data when step + attemptId are ready
  useEffect(() => {
    if (attemptId && phase === 'question') {
      setQuestionIdx(0)
      setSelectedOptionId(null)
      setElaboration('')
      setRevealedOptions([])
      startTimeRef.current = Date.now()
      void loadStep(attemptId)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, attemptId, phase])

  const currentQuestion = stepData?.questions[questionIdx] ?? null

  const callComplete = useCallback(async () => {
    try {
      const res = await fetch(`/api/v2/challenges/${challengeId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attempt_id: attemptId }),
      })
      if (res.ok) {
        const data = await res.json()
        setCompletionData({
          total_score: data.total_score,
          max_score: data.max_score,
          grade_label: data.grade_label,
          xp_awarded: data.xp_awarded,
          step_breakdown: data.step_breakdown ?? [],
          competency_deltas: data.competency_deltas ?? [],
        })
      }
    } catch { /* ignore */ }
    setPhase('complete')
  }, [challengeId, attemptId])

  const handleSubmit = useCallback(async () => {
    if (!attemptId || !currentQuestion) return

    const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000)
    const result = await submitAnswer({
      attemptId,
      questionId: currentQuestion.id,
      selectedOptionId,
      userText: elaboration || null,
      responseType: currentQuestion.response_type,
      timespentSeconds: elapsed,
    })

    if (!result) return

    setRevealedOptions(result.revealed_options ?? [])
    setRevealed(true)
    setLastResult({ step_complete: result.step_complete })

    // Fetch coaching
    const coaching = await fetchCoaching({
      attemptId,
      questionId: currentQuestion.id,
      optionId: selectedOptionId,
      roleId: initialRoleId,
      userText: elaboration || null,
    })
    if (coaching) {
      setRoleContext(coaching.role_context)
      setCareerSignal(coaching.career_signal)
    }
  }, [attemptId, currentQuestion, selectedOptionId, elaboration, submitAnswer, fetchCoaching, initialRoleId])

  const handleNext = useCallback(() => {
    setRevealed(false)
    setSelectedOptionId(null)
    setElaboration('')
    setRevealedOptions([])
    startTimeRef.current = Date.now()

    if (lastResult?.step_complete) {
      const stepIdx = FLOW_STEPS.indexOf(currentStep)
      if (stepIdx === FLOW_STEPS.length - 1) {
        // Last step done — call complete endpoint
        void callComplete()
      } else {
        setCompletedSteps((prev) => [...prev, currentStep])
        setCurrentStep(FLOW_STEPS[stepIdx + 1])
        setPhase('question')
      }
    } else {
      setQuestionIdx((i) => i + 1)
    }
    setLastResult(null)
  }, [lastResult, currentStep, callComplete])

  const handleStartChallenge = useCallback(async () => {
    setPhase('loading')
    const attempt = await startAttempt(initialRoleId)
    if (attempt) {
      setAttemptId(attempt.id)
      setCurrentStep('frame')
      setPhase('question')
    }
  }, [startAttempt, initialRoleId])

  // ── Render states ──────────────────────────────────────────────

  if (challengeError) {
    return (
      <div className="text-center py-12 space-y-2">
        <p className="font-body text-error text-sm">{challengeError}</p>
        <button onClick={reload} className="text-primary font-label text-sm underline">Retry</button>
      </div>
    )
  }

  if (phase === 'intro') {
    const ch = detail?.challenge
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Role + meta badges */}
        {ch && (
          <div className="flex flex-wrap items-center gap-2">
            {ch.scenario_role && (
              <span className="bg-primary-container text-on-surface rounded-full px-3 py-1 font-label text-sm font-semibold">
                {ch.scenario_role}
              </span>
            )}
            {ch.industry && (
              <span className="bg-secondary-container text-on-secondary-container rounded-full px-3 py-1 font-label text-xs">
                {ch.industry}
              </span>
            )}
            {ch.difficulty && (
              <span className="bg-secondary-container text-on-secondary-container rounded-full px-3 py-1 font-label text-xs capitalize">
                {ch.difficulty}
              </span>
            )}
            {ch.estimated_minutes && (
              <span className="bg-secondary-container text-on-secondary-container rounded-full px-3 py-1 font-label text-xs">
                {ch.estimated_minutes} min
              </span>
            )}
          </div>
        )}

        {/* Title */}
        {ch && (
          <h1 className="font-headline text-2xl text-on-surface">{ch.title}</h1>
        )}

        {/* Situation + trigger */}
        {ch?.scenario_context && (
          <div className="bg-surface-container rounded-xl p-5 space-y-1">
            <p className="font-label text-xs text-on-surface-variant uppercase tracking-wide">The situation</p>
            <p className="font-body text-sm text-on-surface">{ch.scenario_context}</p>
          </div>
        )}
        {ch?.scenario_trigger && (
          <div className="bg-surface-container rounded-xl p-5 space-y-1">
            <p className="font-label text-xs text-on-surface-variant uppercase tracking-wide">What just happened</p>
            <p className="font-body text-sm text-on-surface">{ch.scenario_trigger}</p>
          </div>
        )}

        {/* Your challenge — dark card */}
        {ch?.scenario_question && (
          <div className="bg-inverse-surface rounded-xl p-5 space-y-1">
            <p className="font-label text-xs text-inverse-on-surface uppercase tracking-wide opacity-70">Your challenge</p>
            <p className="font-body text-sm text-inverse-on-surface">{ch.scenario_question}</p>
          </div>
        )}

        {/* FLOW preview */}
        <div className="grid grid-cols-4 gap-2">
          {([
            { step: 'frame', label: 'Frame', desc: 'Define the problem' },
            { step: 'list', label: 'List', desc: 'Map the space' },
            { step: 'optimize', label: 'Optimize', desc: 'Sharpen trade-offs' },
            { step: 'win', label: 'Win', desc: 'Make the call' },
          ] as const).map(({ step, label, desc }) => (
            <div key={step} className="bg-surface-container-low rounded-xl p-3 text-center space-y-1">
              <p className="font-label text-sm font-semibold text-on-surface">{label}</p>
              <p className="font-label text-xs text-on-surface-variant">{desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex justify-end">
          <button
            onClick={handleStartChallenge}
            disabled={challengeLoading || !detail}
            className="bg-primary text-on-primary rounded-full px-6 py-2.5 font-label font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {challengeLoading ? 'Loading…' : 'Start Challenge →'}
          </button>
        </div>
      </div>
    )
  }

  if (challengeLoading || phase === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <LumaGlyph size={56} state="reviewing" className="text-primary" />
        <p className="font-body text-on-surface-variant text-sm">Loading challenge…</p>
      </div>
    )
  }

  if (phase === 'complete' && completionData && detail) {
    return (
      <ChallengeComplete
        challenge={detail.challenge}
        totalScore={completionData.total_score}
        maxScore={completionData.max_score}
        gradeLabel={completionData.grade_label}
        xpAwarded={completionData.xp_awarded}
        stepBreakdown={completionData.step_breakdown.map((s) => ({
          step: s.step,
          score: s.score,
          maxScore: s.max_score,
        }))}
        competencyDeltas={completionData.competency_deltas}
        onRetry={() => {
          setAttemptId(null)
          setCompletedSteps([])
          setCurrentStep('frame')
          setRevealed(false)
          setLastResult(null)
          setPhase('intro')
          reload()
        }}
        onNextChallenge={onExit ?? (() => window.history.back())}
      />
    )
  }

  // phase === 'question'
  const canSubmit = currentQuestion
    ? (currentQuestion.response_type === 'freeform'
        ? elaboration.trim().length > 0
        : selectedOptionId !== null)
    : false

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <FlowStepper currentStep={currentStep} completedSteps={completedSteps} />

      {/* Compact context bar */}
      {detail && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-body text-sm text-on-surface-variant truncate">{detail.challenge.title}</span>
          {detail.challenge.scenario_role && (
            <span className="bg-primary-container text-on-surface rounded-full px-2.5 py-0.5 font-label text-xs font-semibold shrink-0">
              {detail.challenge.scenario_role}
            </span>
          )}
        </div>
      )}

      {/* Nudge */}
      {stepData?.nudge && (
        <div className="flex items-start gap-2 bg-secondary-container rounded-xl px-4 py-3">
          <span
            className="material-symbols-outlined text-on-secondary-container text-[18px] shrink-0 mt-0.5"
            style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
          >
            lightbulb
          </span>
          <p className="font-body text-sm text-on-secondary-container">{stepData.nudge}</p>
        </div>
      )}

      {/* Question */}
      {stepLoading ? (
        <div className="flex justify-center py-8">
          <LumaGlyph size={40} state="reviewing" className="text-primary" />
        </div>
      ) : stepError ? (
        <p className="font-body text-error text-sm text-center">{stepError}</p>
      ) : currentQuestion ? (
        <StepQuestion
          question={currentQuestion}
          responseType={currentQuestion.response_type}
          selectedOptionId={selectedOptionId}
          elaboration={elaboration}
          revealed={revealed}
          revealedOptions={revealedOptions}
          onOptionSelect={setSelectedOptionId}
          onElaborationChange={setElaboration}
          disabled={submitting || revealed}
        />
      ) : null}

      {/* Luma coaching bubble — shown after reveal */}
      {revealed && (roleContext || careerSignal) && (
        <div className="flex items-start gap-3 bg-surface-container-low rounded-xl p-4 border border-outline-variant">
          <LumaGlyph size={40} state="speaking" className="text-primary shrink-0" />
          <div className="flex-1 min-w-0 space-y-1">
            {roleContext && <p className="font-body text-sm text-on-surface">{roleContext}</p>}
            {careerSignal && <p className="font-body text-xs text-on-surface-variant italic">{careerSignal}</p>}
          </div>
        </div>
      )}

      {/* Submit / Next toggle */}
      {currentQuestion && (
        <div className="flex justify-end">
          {revealed ? (
            <button
              onClick={handleNext}
              className="bg-primary text-on-primary rounded-full px-6 py-2.5 font-label font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              {lastResult?.step_complete
                ? (FLOW_STEPS.indexOf(currentStep) === FLOW_STEPS.length - 1 ? 'See Results →' : `Next: ${FLOW_STEPS[FLOW_STEPS.indexOf(currentStep) + 1].charAt(0).toUpperCase() + FLOW_STEPS[FLOW_STEPS.indexOf(currentStep) + 1].slice(1)} →`)
                : 'Next question →'}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className="bg-primary text-on-primary rounded-full px-6 py-2.5 font-label font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? 'Grading…' : 'Submit'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

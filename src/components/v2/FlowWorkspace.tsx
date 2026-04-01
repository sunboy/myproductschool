'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import type { FlowStep, ResponseType, UserRoleV2 } from '@/lib/types'
import { useChallengeV2 } from '@/lib/v2/hooks/useChallengeV2'
import { useFlowStep } from '@/lib/v2/hooks/useFlowStep'
import { FlowStepper } from './FlowStepper'
import { StepQuestion } from './StepQuestion'
import { StepReveal } from './StepReveal'
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
  const [phase, setPhase] = useState<'loading' | 'question' | 'reveal' | 'complete'>('loading')

  // Per-question state
  const [questionIdx, setQuestionIdx] = useState(0)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [elaboration, setElaboration] = useState('')
  const [revealedOptions, setRevealedOptions] = useState<RevealedOption[]>([])
  const [stepScore, setStepScore] = useState(0)
  const [stepGrade, setStepGrade] = useState('')
  const [roleContext, setRoleContext] = useState('')
  const [careerSignal, setCareerSignal] = useState('')
  const [completionData, setCompletionData] = useState<CompletionData | null>(null)

  const startTimeRef = useRef<number>(Date.now())

  const { stepData, loading: stepLoading, submitting, error: stepError, submitResult, loadStep, submitAnswer, fetchCoaching } = useFlowStep(challengeId, currentStep)

  // Bootstrap: load challenge + start attempt
  useEffect(() => {
    reload()
  }, [reload])

  useEffect(() => {
    if (detail && !attemptId) {
      if (detail.current_attempt?.status === 'in_progress') {
        setAttemptId(detail.current_attempt.id)
        setCurrentStep(detail.current_attempt.current_step === 'done' ? 'frame' : detail.current_attempt.current_step as FlowStep)
        setPhase('question')
      } else {
        startAttempt(initialRoleId).then((attempt) => {
          if (attempt) {
            setAttemptId(attempt.id)
            setCurrentStep('frame')
            setPhase('question')
          }
        })
      }
    }
  }, [detail, attemptId, initialRoleId, startAttempt])

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
    setStepScore(result.score)
    setStepGrade(result.grade_label)

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

    if (result.step_complete) {
      setPhase('reveal')
    } else {
      // Advance to next question
      setQuestionIdx((i) => i + 1)
      setSelectedOptionId(null)
      setElaboration('')
      setRevealedOptions([])
      startTimeRef.current = Date.now()
    }
  }, [attemptId, currentQuestion, selectedOptionId, elaboration, submitAnswer, fetchCoaching, initialRoleId])

  const handleNextStep = useCallback(async () => {
    const stepIdx = FLOW_STEPS.indexOf(currentStep)
    const isLast = stepIdx === FLOW_STEPS.length - 1

    if (isLast) {
      // Call complete endpoint
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
          setPhase('complete')
        }
      } catch {
        // fail silently — show complete anyway
        setPhase('complete')
      }
    } else {
      setCompletedSteps((prev) => [...prev, currentStep])
      setCurrentStep(FLOW_STEPS[stepIdx + 1])
      setPhase('question')
    }
  }, [challengeId, currentStep, attemptId])

  // ── Render states ──────────────────────────────────────────────

  if (challengeLoading || phase === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <LumaGlyph size={56} state="reviewing" className="text-primary" />
        <p className="font-body text-on-surface-variant text-sm">Loading challenge…</p>
      </div>
    )
  }

  if (challengeError) {
    return (
      <div className="text-center py-12 space-y-2">
        <p className="font-body text-error text-sm">{challengeError}</p>
        <button onClick={reload} className="text-primary font-label text-sm underline">Retry</button>
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
          setPhase('loading')
          reload()
        }}
        onNextChallenge={onExit ?? (() => window.history.back())}
      />
    )
  }

  if (phase === 'reveal') {
    const stepIdx = FLOW_STEPS.indexOf(currentStep)
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <FlowStepper currentStep={currentStep} completedSteps={completedSteps} />
        <StepReveal
          step={currentStep}
          stepScore={stepScore}
          maxScore={3.0}
          gradeLabel={stepGrade}
          roleContext={roleContext}
          careerSignal={careerSignal}
          onNext={handleNextStep}
          isLastStep={stepIdx === FLOW_STEPS.length - 1}
        />
      </div>
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

      {/* Challenge context */}
      {detail && (
        <div className="bg-surface-container-low rounded-xl p-4 space-y-1">
          <h1 className="font-headline text-lg text-on-surface">{detail.challenge.title}</h1>
          {detail.challenge.scenario_question && (
            <p className="font-body text-sm text-on-surface-variant">{detail.challenge.scenario_question}</p>
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
          revealed={false}
          onOptionSelect={setSelectedOptionId}
          onElaborationChange={setElaboration}
          disabled={submitting}
        />
      ) : null}

      {/* Submit */}
      {currentQuestion && (
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="bg-primary text-on-primary rounded-full px-6 py-2.5 font-label font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? 'Grading…' : 'Submit'}
          </button>
        </div>
      )}
    </div>
  )
}

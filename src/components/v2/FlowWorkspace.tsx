'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import type { FlowStep, ResponseType, UserRoleV2 } from '@/lib/types'
import type { ChallengeAdapter, AdapterCompletionData, AdapterStepData, SyntheticChallenge } from '@/lib/showcase/adapters/autopsyAdapter'
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

type FlowWorkspaceProps =
  | { mode: 'api'; challengeId: string; initialRoleId: UserRoleV2; onExit?: () => void }
  | { mode: 'adapter'; adapter: ChallengeAdapter; onComplete?: (data: AdapterCompletionData | null) => void; onExit?: () => void }

export function FlowWorkspace(props: FlowWorkspaceProps) {
  const isApiMode = props.mode === 'api'
  const challengeId = isApiMode ? props.challengeId : ''
  const initialRoleId = isApiMode ? props.initialRoleId : 'engineer' as UserRoleV2

  // Declare step state first so it's available for the hook call below
  const [currentStep, setCurrentStep] = useState<FlowStep>('frame')

  // Always call hooks unconditionally (React rules of hooks)
  const { detail, loading: challengeLoading, error: challengeError, startAttempt, reload } = useChallengeV2(challengeId)
  const { stepData, loading: stepLoading, submitting, error: stepError, loadStep, submitAnswer, fetchCoaching } = useFlowStep(challengeId, currentStep)

  const [attemptId, setAttemptId] = useState<string | null>(null)
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
  const [competencySignal, setCompetencySignal] = useState<{ primary: string; signal: string; framework_hint: string } | null>(null)
  const [completionData, setCompletionData] = useState<CompletionData | null>(null)

  // Adapter-mode state
  const [adapterChallenge, setAdapterChallenge] = useState<SyntheticChallenge | null>(null)
  const [adapterStepData, setAdapterStepData] = useState<AdapterStepData | null>(null)
  const [adapterSubmitting, setAdapterSubmitting] = useState(false)

  const startTimeRef = useRef<number>(Date.now())

  // Bootstrap
  useEffect(() => {
    if (isApiMode) {
      reload()
    } else {
      const ch = (props as Extract<FlowWorkspaceProps, { mode: 'adapter' }>).adapter.getChallenge()
      setAdapterChallenge(ch)
      setPhase('question')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // API mode: start attempt once detail loads
  useEffect(() => {
    if (!isApiMode) return
    if (detail && !attemptId) {
      if (detail.current_attempt?.status === 'in_progress') {
        setAttemptId(detail.current_attempt.id)
        const resumeStep = detail.current_attempt.current_step === 'done' ? 'frame' : detail.current_attempt.current_step as FlowStep
        setCurrentStep(resumeStep)
        // Mark all steps before the current one as completed
        const resumeIdx = FLOW_STEPS.indexOf(resumeStep)
        if (resumeIdx > 0) setCompletedSteps(FLOW_STEPS.slice(0, resumeIdx))
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
  }, [detail, attemptId, isApiMode, initialRoleId, startAttempt])

  // Load step data when step changes
  useEffect(() => {
    if (phase !== 'question') return
    setQuestionIdx(0)
    setSelectedOptionId(null)
    setElaboration('')
    setRevealedOptions([])
    startTimeRef.current = Date.now()
    if (isApiMode) {
      if (attemptId) void loadStep(attemptId)
    } else {
      const adapter = (props as Extract<FlowWorkspaceProps, { mode: 'adapter' }>).adapter
      adapter.loadStep(currentStep).then(setAdapterStepData)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, attemptId, phase, isApiMode])

  // Unified step data
  const activeStepData = isApiMode ? stepData : adapterStepData
  const currentQuestion = activeStepData?.questions[questionIdx] ?? null
  const activeSubmitting = isApiMode ? submitting : adapterSubmitting

  const handleSubmit = useCallback(async () => {
    if (!currentQuestion) return

    if (isApiMode) {
      if (!attemptId) return
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
      setCompetencySignal(result.competency_signal ?? null)
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
        setQuestionIdx((i) => i + 1)
        setSelectedOptionId(null)
        setElaboration('')
        setRevealedOptions([])
        startTimeRef.current = Date.now()
      }
    } else {
      const adapter = (props as Extract<FlowWorkspaceProps, { mode: 'adapter' }>).adapter
      setAdapterSubmitting(true)
      try {
        const result = await adapter.submitAnswer({
          step: currentStep,
          questionId: currentQuestion.id,
          selectedOptionId,
          userText: elaboration || null,
        })
        setRevealedOptions(result.revealed_options ?? [])
        setStepScore(result.score)
        setStepGrade(result.grade_label)
        const coaching = await adapter.fetchCoaching({
          step: currentStep,
          optionId: selectedOptionId,
          userText: elaboration || null,
        })
        if (coaching) {
          setRoleContext(coaching.role_context)
          setCareerSignal(coaching.career_signal)
        }
        if (result.step_complete) {
          setPhase('reveal')
        } else {
          setQuestionIdx((i) => i + 1)
          setSelectedOptionId(null)
          setElaboration('')
          setRevealedOptions([])
          startTimeRef.current = Date.now()
        }
      } finally {
        setAdapterSubmitting(false)
      }
    }
  }, [isApiMode, currentQuestion, attemptId, selectedOptionId, elaboration, submitAnswer, fetchCoaching, initialRoleId, currentStep, props])

  const handleStepClick = useCallback((step: FlowStep) => {
    if (!completedSteps.includes(step)) return
    setCurrentStep(step)
    setPhase('question')
    setSelectedOptionId(null)
    setElaboration('')
    setRevealedOptions([])
    setQuestionIdx(0)
  }, [completedSteps])

  const handleNextStep = useCallback(async () => {
    const stepIdx = FLOW_STEPS.indexOf(currentStep)
    const isLast = stepIdx === FLOW_STEPS.length - 1

    if (isLast) {
      if (isApiMode) {
        try {
          const res = await fetch(`/api/challenges/${challengeId}/complete`, {
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
          setPhase('complete')
        }
      } else {
        const adapterProps = props as Extract<FlowWorkspaceProps, { mode: 'adapter' }>
        const data = await adapterProps.adapter.complete()
        adapterProps.onComplete?.(data)
        setCompletionData(data ? {
          total_score: data.total_score,
          max_score: data.max_score,
          grade_label: data.grade_label,
          xp_awarded: data.xp_awarded,
          step_breakdown: data.step_breakdown ?? [],
          competency_deltas: data.competency_deltas ?? [],
        } : null)
        setPhase('complete')
      }
    } else {
      setCompletedSteps((prev) => [...prev, currentStep])
      setCurrentStep(FLOW_STEPS[stepIdx + 1])
      setPhase('question')
    }
  }, [isApiMode, challengeId, currentStep, attemptId, props])

  // ── Render states ──────────────────────────────────────────────

  if (isApiMode && challengeError) {
    return (
      <div className="text-center py-12 space-y-2">
        <p className="font-body text-error text-sm">{challengeError}</p>
        <button onClick={reload} className="text-primary font-label text-sm underline">Retry</button>
      </div>
    )
  }

  if ((isApiMode && challengeLoading) || phase === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <LumaGlyph size={56} state="reviewing" className="text-primary" />
        <p className="font-body text-on-surface-variant text-sm">Loading challenge…</p>
      </div>
    )
  }

  // Resolve challenge display data across both modes
  const challengeTitle = isApiMode ? detail?.challenge.title : adapterChallenge?.title
  const challengeScenarioQ = isApiMode ? detail?.challenge.scenario_question : adapterChallenge?.scenario_question
  const scenarioRole = isApiMode ? detail?.challenge.scenario_role : adapterChallenge?.scenario_role
  const scenarioContext = isApiMode ? detail?.challenge.scenario_context : adapterChallenge?.scenario_context
  const scenarioTrigger = isApiMode ? detail?.challenge.scenario_trigger : adapterChallenge?.scenario_trigger

  if (phase === 'complete') {
    return (
      <ChallengeComplete
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        challenge={{ title: challengeTitle ?? '', scenario_question: challengeScenarioQ ?? null } as any}
        totalScore={completionData?.total_score ?? 0}
        maxScore={completionData?.max_score ?? 12}
        gradeLabel={completionData?.grade_label ?? ''}
        xpAwarded={completionData?.xp_awarded ?? 0}
        stepBreakdown={(completionData?.step_breakdown ?? []).map((s) => ({
          step: s.step,
          score: s.score,
          maxScore: s.max_score,
        }))}
        competencyDeltas={completionData?.competency_deltas ?? []}
        onRetry={() => {
          setAttemptId(null)
          setCompletedSteps([])
          setCurrentStep('frame')
          setAdapterStepData(null)
          setRoleContext('')
          setCareerSignal('')
          setCompetencySignal(null)
          if (isApiMode) {
            setPhase('loading')
            reload()
          } else {
            setPhase('question')
            // step-load effect will fire because currentStep='frame' + phase='question'
          }
        }}
        onNextChallenge={props.onExit ?? (() => window.history.back())}
      />
    )
  }

  // Shared left panel (scenario brief)
  const scenarioPanel = (
    <aside className="w-[360px] shrink-0 bg-surface-taupe border-r border-outline-variant/40 overflow-y-auto p-6 space-y-4">
      {scenarioRole && (
        <span className="inline-block bg-secondary-container text-on-secondary-container rounded-full text-xs font-label px-3 py-1">
          {scenarioRole}
        </span>
      )}
      {challengeTitle && (
        <h1 className="font-headline text-xl text-on-surface leading-snug">{challengeTitle}</h1>
      )}
      {scenarioContext && (
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-label">Context</p>
          <p className="font-body text-sm text-on-surface-variant leading-relaxed">{scenarioContext}</p>
        </div>
      )}
      {scenarioTrigger && (
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-label">The Trigger</p>
          <p className="font-body text-sm text-on-surface-variant leading-relaxed">{scenarioTrigger}</p>
        </div>
      )}
      {challengeScenarioQ && (
        <div className="bg-surface-container rounded-xl p-4 space-y-1 border border-black/5">
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-label">Your Challenge</p>
          <p className="font-body text-sm text-on-surface font-medium leading-relaxed">{challengeScenarioQ}</p>
        </div>
      )}
    </aside>
  )

  if (phase === 'reveal') {
    const stepIdx = FLOW_STEPS.indexOf(currentStep)
    return (
      <div className="flex h-full">
        {scenarioPanel}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <FlowStepper currentStep={currentStep} completedSteps={completedSteps} onStepClick={handleStepClick} questionIdx={questionIdx} questionCount={activeStepData?.questions.length} />
          <StepReveal
            step={currentStep}
            stepScore={stepScore}
            maxScore={3.0}
            gradeLabel={stepGrade}
            roleContext={roleContext}
            careerSignal={careerSignal}
            competencySignal={competencySignal}
            onNext={handleNextStep}
            isLastStep={stepIdx === FLOW_STEPS.length - 1}
          />
        </div>
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
    <div className="flex h-full">
      {scenarioPanel}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        <FlowStepper currentStep={currentStep} completedSteps={completedSteps} questionIdx={questionIdx} questionCount={activeStepData?.questions.length} />

        {/* Nudge */}
        {activeStepData?.nudge && (
          <div className="flex items-start gap-3 bg-secondary-container rounded-xl px-4 py-3">
            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shrink-0">
              <span
                className="material-symbols-outlined text-primary text-[18px]"
                style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
              >
                lightbulb
              </span>
            </div>
            <p className="font-body text-sm text-on-secondary-container leading-relaxed">{activeStepData.nudge}</p>
          </div>
        )}

        {/* Question */}
        {(isApiMode ? stepLoading : false) ? (
          <div className="flex justify-center py-8">
            <LumaGlyph size={40} state="reviewing" className="text-primary" />
          </div>
        ) : (isApiMode && stepError) ? (
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
            disabled={activeSubmitting}
          />
        ) : null}

        {/* Submit */}
        {currentQuestion && (
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || activeSubmitting}
              className="bg-primary text-on-primary rounded-full px-6 py-2.5 font-label font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {activeSubmitting ? 'Grading…' : 'Submit'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

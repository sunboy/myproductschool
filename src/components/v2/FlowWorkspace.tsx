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
  option_label?: string
  option_text?: string
  quality?: string
  points: number
  explanation: string
  framework_hint?: string
}

export interface QuestionRevealRecord {
  questionText: string
  selectedOptionId: string | null
  userText: string | null
  revealedOptions: RevealedOption[]
  score: number
  gradeLabel: string
  competencySignal: { primary: string; signal: string; framework_hint: string } | null
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
  | { mode: 'api'; challengeId: string; initialRoleId: UserRoleV2; onExit?: () => void; fromPlan?: string; nextChallengeSlug?: string }
  | { mode: 'adapter'; adapter: ChallengeAdapter; onComplete?: (data: AdapterCompletionData | null) => void; onExit?: () => void; fromPlan?: string; nextChallengeSlug?: string }

export function FlowWorkspace(props: FlowWorkspaceProps) {
  const isApiMode = props.mode === 'api'
  const challengeId = isApiMode ? props.challengeId : ''
  const initialRoleId = isApiMode ? props.initialRoleId : 'engineer' as UserRoleV2
  const fromPlan = props.fromPlan
  const nextChallengeSlug = props.nextChallengeSlug

  // Declare step state first so it's available for the hook call below
  const [currentStep, setCurrentStep] = useState<FlowStep>('frame')

  // Always call hooks unconditionally (React rules of hooks)
  const { detail, loading: challengeLoading, error: challengeError, startAttempt, reload } = useChallengeV2(challengeId)
  const { stepData, loading: stepLoading, submitting, error: stepError, clearStepData, loadStep, submitAnswer, fetchCoaching } = useFlowStep(challengeId, currentStep)

  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [completedSteps, setCompletedSteps] = useState<FlowStep[]>([])
  const [phase, setPhase] = useState<'loading' | 'question' | 'reveal' | 'complete'>('loading')

  // Per-question state
  const [questionIdx, setQuestionIdx] = useState(0)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [elaboration, setElaboration] = useState('')
  const [revealedOptions, setRevealedOptions] = useState<RevealedOption[]>([])
  const [stepScore, setStepScore] = useState(0)
  const [stepTotalScore, setStepTotalScore] = useState<number | null>(null) // step_score from API on final question
  const [stepGrade, setStepGrade] = useState('')
  const [roleContext, setRoleContext] = useState('')
  const [careerSignal, setCareerSignal] = useState('')
  const [competencySignal, setCompetencySignal] = useState<{ primary: string; signal: string; framework_hint: string } | null>(null)
  const [completionData, setCompletionData] = useState<CompletionData | null>(null)

  // Accumulates per-question results for the reveal screen
  const [questionRevealHistory, setQuestionRevealHistory] = useState<QuestionRevealRecord[]>([])

  // Adapter-mode state
  const [adapterChallenge, setAdapterChallenge] = useState<SyntheticChallenge | null>(null)
  const [adapterStepData, setAdapterStepData] = useState<AdapterStepData | null>(null)
  const [adapterSubmitting, setAdapterSubmitting] = useState(false)

  const startTimeRef = useRef<number>(Date.now())
  // Prevents double-submit: locks for the full duration of submitAnswer + fetchCoaching
  const handlingSubmitRef = useRef(false)

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

  // Load step data when step changes — clear stale data immediately so no
  // previous step's questions flash while the new step loads
  useEffect(() => {
    if (phase !== 'question') return
    setQuestionIdx(0)
    setSelectedOptionId(null)
    setElaboration('')
    setRevealedOptions([])
    handlingSubmitRef.current = false
    startTimeRef.current = Date.now()
    setQuestionRevealHistory([])
    setStepTotalScore(null)
    setRoleContext('')
    setCareerSignal('')
    setCompetencySignal(null)
    if (isApiMode) {
      clearStepData()
      if (attemptId) void loadStep(attemptId)
    } else {
      setAdapterStepData(null)
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
    // Prevent double-submit: lock for the full duration including coaching fetch
    if (handlingSubmitRef.current) return
    handlingSubmitRef.current = true

    try {
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
        const thisRevealedOptions = result.revealed_options ?? []
        const thisCompetencySignal = result.competency_signal ?? null
        setRevealedOptions(thisRevealedOptions)
        setStepScore(result.score)
        setStepGrade(result.grade_label)
        setCompetencySignal(thisCompetencySignal)
        if (result.step_score !== undefined) setStepTotalScore(result.step_score)
        // Accumulate per-question reveal record
        setQuestionRevealHistory((prev) => [...prev, {
          questionText: currentQuestion.question_text,
          selectedOptionId,
          userText: elaboration || null,
          revealedOptions: thisRevealedOptions,
          score: result.score,
          gradeLabel: result.grade_label,
          competencySignal: thisCompetencySignal,
        }])
        // Fetch coaching in parallel — don't block step advancement on it
        fetchCoaching({
          attemptId,
          questionId: currentQuestion.id,
          optionId: selectedOptionId,
          roleId: initialRoleId,
          userText: elaboration || null,
        }).then((coaching) => {
          if (coaching) {
            setRoleContext(coaching.role_context)
            setCareerSignal(coaching.career_signal)
          }
        })
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
          const adapterRevealedOptions = result.revealed_options ?? []
          setRevealedOptions(adapterRevealedOptions)
          setStepScore(result.score)
          setStepGrade(result.grade_label)
          // Accumulate per-question reveal record
          if (adapterRevealedOptions.length > 0) {
            setQuestionRevealHistory((prev) => [...prev, {
              questionText: currentQuestion.question_text,
              selectedOptionId,
              userText: elaboration || null,
              revealedOptions: adapterRevealedOptions,
              score: result.score,
              gradeLabel: result.grade_label,
              competencySignal: null,
            }])
          }
          // Fetch coaching without blocking step advancement
          adapter.fetchCoaching({
            step: currentStep,
            optionId: selectedOptionId,
            userText: elaboration || null,
          }).then((coaching) => {
            if (coaching) {
              setRoleContext(coaching.role_context)
              setCareerSignal(coaching.career_signal)
            }
          })
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
    } finally {
      handlingSubmitRef.current = false
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
    setQuestionRevealHistory([])
    setStepTotalScore(null)
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

  // Shared left panel (scenario brief) — elevated with Terra green accent
  const scenarioPanel = (
    <aside
      className="w-[360px] shrink-0 border-r border-outline-variant/30 overflow-y-auto relative"
      style={{ background: '#f0ece8' }}
    >
      {/* Top accent line — Terra primary green */}
      <div className="absolute top-0 left-0 right-0 h-0.5 z-10 bg-primary" />

      {/* Radial ambient glow from top-left */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 0% 0%, rgba(74,124,89,0.09) 0%, transparent 60%)' }}
        aria-hidden
      />

      <div className="relative z-10 p-6 space-y-4 pt-7">
        {scenarioRole && (
          <span className="inline-block bg-secondary-container text-on-secondary-container rounded-full text-xs font-label px-3 py-1">
            {scenarioRole}
          </span>
        )}
        {challengeTitle && (
          <h1 className="font-headline text-xl text-on-surface leading-snug">{challengeTitle}</h1>
        )}
        {scenarioContext && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-primary/60" />
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-label">Context</p>
            </div>
            <p className="font-body text-sm text-on-surface-variant leading-relaxed">{scenarioContext}</p>
          </div>
        )}
        {scenarioTrigger && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-primary/60" />
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-label">The Trigger</p>
            </div>
            <p className="font-body text-sm text-on-surface-variant leading-relaxed">{scenarioTrigger}</p>
          </div>
        )}
        {challengeScenarioQ && (
          <div
            className="rounded-xl p-4 space-y-1.5 border border-outline-variant/40"
            style={{ background: '#fff', boxShadow: '0 2px 12px rgba(46,50,48,0.07)' }}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-primary" />
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-label">Your Challenge</p>
            </div>
            <p className="font-body text-sm text-on-surface font-medium leading-relaxed">{challengeScenarioQ}</p>
          </div>
        )}
      </div>
    </aside>
  )

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
        scenarioPanel={scenarioPanel}
        fromPlan={fromPlan}
        nextChallengeSlug={nextChallengeSlug}
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

  if (phase === 'reveal') {
    const stepIdx = FLOW_STEPS.indexOf(currentStep)
    return (
      <div className="flex h-full">
        {scenarioPanel}
        <div
          key={`${currentStep}-reveal`}
          className="flex-1 overflow-y-auto px-6 py-6 space-y-6 animate-step-enter"
          style={{ background: 'radial-gradient(ellipse at 100% 100%, rgba(74,124,89,0.04) 0%, transparent 55%)' }}
        >
          <FlowStepper currentStep={currentStep} completedSteps={completedSteps} onStepClick={handleStepClick} questionIdx={questionIdx} questionCount={activeStepData?.questions.length} />
          <StepReveal
            step={currentStep}
            stepScore={stepTotalScore ?? stepScore}
            maxScore={3.0}
            gradeLabel={stepGrade}
            roleContext={roleContext}
            careerSignal={careerSignal}
            competencySignal={competencySignal}
            questionRevealHistory={questionRevealHistory}
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
      <div
        key={`${currentStep}-question`}
        className="flex-1 overflow-y-auto px-6 py-6 space-y-6 animate-step-enter"
        style={{ background: 'radial-gradient(ellipse at 100% 100%, rgba(74,124,89,0.04) 0%, transparent 55%)' }}
      >
        <FlowStepper currentStep={currentStep} completedSteps={completedSteps} questionIdx={questionIdx} questionCount={activeStepData?.questions.length} />

        {/* Nudge — glass float with primary green left bar */}
        {activeStepData?.nudge && (
          <div
            className="flex items-start gap-3 rounded-xl px-4 py-3"
            style={{
              background: 'rgba(255,255,255,0.72)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(74,124,89,0.18)',
              borderLeft: '4px solid #4a7c59',
              boxShadow: '0 2px 12px rgba(46,50,48,0.06)',
            }}
          >
            <span
              className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
            >
              lightbulb
            </span>
            <p className="font-body text-sm text-on-surface leading-relaxed">{activeStepData.nudge}</p>
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
              className="bg-primary text-on-primary rounded-full px-6 py-2.5 font-label font-semibold text-sm shadow-sm hover:opacity-90 active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {activeSubmitting ? 'Grading…' : 'Submit'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

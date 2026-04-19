'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import gsap from 'gsap'
import type { FlowStep, UserRoleV2 } from '@/lib/types'
import type { ChallengeAdapter, AdapterCompletionData, AdapterStepData, SyntheticChallenge } from '@/lib/showcase/adapters/autopsyAdapter'
import { useChallengeV2 } from '@/lib/v2/hooks/useChallengeV2'
import { useFlowStep } from '@/lib/v2/hooks/useFlowStep'
import { FlowStepper } from './FlowStepper'
import { StepQuestion } from './StepQuestion'
import { StepReveal } from './StepReveal'
import { PostSessionMirror, type StepResult as MirrorStepResult, type CompetencyDelta as MirrorCompetencyDelta } from './PostSessionMirror'
import { ConfidenceDock } from './ConfidenceDock'
import { LumaSidePanel } from './LumaSidePanel'
import { CalibrationPreview } from './CalibrationPreview'
import type { StepCalibration } from './CalibrationPreview'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

const FLOW_STEPS: FlowStep[] = ['frame', 'list', 'optimize', 'win']
const CONF_LABELS = ['Guessing', 'Not sure', 'Fairly sure', 'Rock solid']

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
  | { mode: 'api'; challengeId: string; initialRoleId: UserRoleV2; onExit?: () => void; onPaywall?: (data: { used: number; limit: number }) => void; fromPlan?: string; nextChallengeSlug?: string }
  | { mode: 'adapter'; adapter: ChallengeAdapter; onComplete?: (data: AdapterCompletionData | null) => void; onExit?: () => void; fromPlan?: string; nextChallengeSlug?: string }

export function FlowWorkspace(props: FlowWorkspaceProps) {
  const isApiMode = props.mode === 'api'
  const challengeId = isApiMode ? props.challengeId : ''
  const initialRoleId = isApiMode ? props.initialRoleId : 'engineer' as UserRoleV2
  const onPaywall = isApiMode ? (props as Extract<FlowWorkspaceProps, { mode: 'api' }>).onPaywall : undefined
  const fromPlan = props.fromPlan
  const nextChallengeSlug = props.nextChallengeSlug

  // Declare step state first so it's available for the hook call below
  const [currentStep, setCurrentStep] = useState<FlowStep>('frame')

  // Always call hooks unconditionally (React rules of hooks)
  const { detail, loading: challengeLoading, error: challengeError, paywallData, startAttempt, reload } = useChallengeV2(challengeId)
  const { stepData, loading: stepLoading, submitting, error: stepError, clearStepData, loadStep, submitAnswer, fetchCoaching } = useFlowStep(challengeId, currentStep)

  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [completedSteps, setCompletedSteps] = useState<FlowStep[]>([])
  const [phase, setPhase] = useState<'loading' | 'question' | 'reveal' | 'complete'>('loading')

  // Per-question state
  const [questionIdx, setQuestionIdx] = useState(0)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [reasoning, setReasoning] = useState('')
  const [revealedOptions, setRevealedOptions] = useState<RevealedOption[]>([])
  const [stepScore, setStepScore] = useState(0)
  const [stepTotalScore, setStepTotalScore] = useState<number | null>(null) // step_score from API on final question
  const [stepGrade, setStepGrade] = useState('')
  const [roleContext, setRoleContext] = useState('')
  const [careerSignal, setCareerSignal] = useState('')
  const [competencySignal, setCompetencySignal] = useState<{ primary: string; signal: string; framework_hint: string } | null>(null)
  const [completionData, setCompletionData] = useState<CompletionData | null>(null)

  // Confidence state
  const [confidence, setConfidence] = useState<number | null>(null)

  // Derived: dock fade-out fires when answer has been submitted (phase leaves 'question')
  const dockSubmitted = phase === 'reveal' || phase === 'complete'

  // Accumulates per-question results for the reveal screen
  const [questionRevealHistory, setQuestionRevealHistory] = useState<QuestionRevealRecord[]>([])

  // Adapter-mode state
  const [adapterChallenge, setAdapterChallenge] = useState<SyntheticChallenge | null>(null)
  const [adapterStepData, setAdapterStepData] = useState<AdapterStepData | null>(null)
  const [adapterSubmitting, setAdapterSubmitting] = useState(false)

  // Accumulated per-step results for PostSessionMirror
  const [mirrorStepResults, setMirrorStepResults] = useState<MirrorStepResult[]>([])

  // Calibration state
  const [calibrationSteps, setCalibrationSteps] = useState<StepCalibration[]>([
    { stepKey: 'frame',    stepLabel: 'Frame',    status: 'pending', confidenceLabel: null },
    { stepKey: 'list',     stepLabel: 'List',     status: 'pending', confidenceLabel: null },
    { stepKey: 'optimize', stepLabel: 'Optimize', status: 'pending', confidenceLabel: null },
    { stepKey: 'win',      stepLabel: 'Win',      status: 'pending', confidenceLabel: null },
  ])

  // Luma message state
  const [lumaMessage, setLumaMessage] = useState('Ready when you are. Pick the option that fits best.')
  const [lumaState, setLumaState] = useState<'idle' | 'listening' | 'reviewing' | 'speaking'>('idle')

  // GSAP workspace ref for session-start animation
  const workspaceRef = useRef<HTMLDivElement>(null)

  const startTimeRef = useRef<number>(Date.now())
  // Prevents double-submit: locks for the full duration of submitAnswer + fetchCoaching
  const handlingSubmitRef = useRef(false)

  // Surface paywall to parent when 402 is returned from start API
  useEffect(() => {
    if (paywallData && onPaywall) {
      onPaywall(paywallData)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paywallData])

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
    setReasoning('')
    setConfidence(null)
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

  // Update Luma message when step loads
  useEffect(() => {
    if (phase !== 'question' || !activeStepData) return
    setLumaMessage(activeStepData.nudge ?? 'Pick the best option.')
    setLumaState('listening')
  }, [phase, activeStepData])

  // GSAP session-start animation — fires once when phase first becomes 'question'
  const hasAnimated = useRef(false)
  useEffect(() => {
    if (phase !== 'question') return
    if (hasAnimated.current) return
    hasAnimated.current = true
    const children = workspaceRef.current?.children
    if (!children) return
    const tween = gsap.fromTo(
      Array.from(children),
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, stagger: 0.07, duration: 0.4, ease: 'power2.out' }
    )
    return () => { tween.kill() }
  }, [phase])

  const canSubmit = selectedOptionId !== null && confidence !== null

  const handleSubmit = useCallback(async () => {
    if (!currentQuestion) return
    if (!canSubmit) return
    // Prevent double-submit: lock for the full duration including coaching fetch
    if (handlingSubmitRef.current) return
    handlingSubmitRef.current = true

    setLumaMessage('Reviewing your answer…')
    setLumaState('reviewing')

    try {
      if (isApiMode) {
        if (!attemptId) return
        const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000)
        const result = await submitAnswer({
          attemptId,
          questionId: currentQuestion.id,
          selectedOptionId,
          userText: reasoning || null,
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
          userText: reasoning || null,
          revealedOptions: thisRevealedOptions,
          score: result.score,
          gradeLabel: result.grade_label,
          competencySignal: thisCompetencySignal,
        }])

        // Set Luma message based on result
        const hasReasoning = reasoning.trim().length > 10
        const isCorrect = result.grade_label === 'best'
        let lumaMsg = ''
        if (isCorrect && hasReasoning) lumaMsg = 'Luma saw your thinking. Sharp pick.'
        else if (isCorrect) lumaMsg = 'Nice pick. Reasoning next time will get you tier 2.'
        else if (confidence === 3) lumaMsg = 'Rock solid — but missed. High-value learning moment.'
        else if (hasReasoning) lumaMsg = 'Worth looking at. Your reasoning shows the gap.'
        else lumaMsg = 'One to revisit. Think about why the best option works.'
        setLumaMessage(lumaMsg)
        setLumaState('speaking')

        // Fetch coaching in parallel — don't block step advancement on it
        fetchCoaching({
          attemptId,
          questionId: currentQuestion.id,
          optionId: selectedOptionId,
          roleId: initialRoleId,
          userText: reasoning || null,
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
          setReasoning('')
          setConfidence(null)
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
            userText: reasoning || null,
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
              userText: reasoning || null,
              revealedOptions: adapterRevealedOptions,
              score: result.score,
              gradeLabel: result.grade_label,
              competencySignal: null,
            }])
          }

          // Set Luma message based on result
          const hasReasoning = reasoning.trim().length > 10
          const isCorrect = result.grade_label === 'best'
          let lumaMsg = ''
          if (isCorrect && hasReasoning) lumaMsg = 'Luma saw your thinking. Sharp pick.'
          else if (isCorrect) lumaMsg = 'Nice pick. Reasoning next time will get you tier 2.'
          else if (confidence === 3) lumaMsg = 'Rock solid — but missed. High-value learning moment.'
          else if (hasReasoning) lumaMsg = 'Worth looking at. Your reasoning shows the gap.'
          else lumaMsg = 'One to revisit. Think about why the best option works.'
          setLumaMessage(lumaMsg)
          setLumaState('speaking')

          // Fetch coaching without blocking step advancement
          adapter.fetchCoaching({
            step: currentStep,
            optionId: selectedOptionId,
            userText: reasoning || null,
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
            setReasoning('')
            setConfidence(null)
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
  }, [isApiMode, currentQuestion, attemptId, selectedOptionId, reasoning, confidence, submitAnswer, fetchCoaching, initialRoleId, currentStep, props])

  const handleStepClick = useCallback((step: FlowStep) => {
    if (!completedSteps.includes(step)) return
    setCurrentStep(step)
    setPhase('question')
    setSelectedOptionId(null)
    setReasoning('')
    setConfidence(null)
    setRevealedOptions([])
    setQuestionIdx(0)
    setQuestionRevealHistory([])
    setStepTotalScore(null)
  }, [completedSteps])

  const handleNextStep = useCallback(async () => {
    const stepIdx = FLOW_STEPS.indexOf(currentStep)
    const isLast = stepIdx === FLOW_STEPS.length - 1

    // Update calibration for the completed step
    const lastRecord = questionRevealHistory[questionRevealHistory.length - 1]
    const isCorrect = lastRecord?.gradeLabel === 'best'
    setCalibrationSteps((prev) => prev.map((s, i) =>
      i === stepIdx
        ? { ...s, status: isCorrect ? 'correct' : 'incorrect', confidenceLabel: confidence !== null ? CONF_LABELS[confidence] : null }
        : s
    ))

    // Accumulate step result for PostSessionMirror
    const stepRevealRecord = questionRevealHistory[questionRevealHistory.length - 1]
    if (stepRevealRecord) {
      const mirrorResult: MirrorStepResult = {
        step: currentStep as 'frame' | 'list' | 'optimize' | 'win',
        score: stepRevealRecord.score ?? 0,
        quality_label: stepRevealRecord.gradeLabel ?? 'plausible_wrong',
        confidence: confidence,
        reasoning: reasoning,
        competency_signal: stepRevealRecord.competencySignal ?? undefined,
      }
      setMirrorStepResults((prev) => [...prev, mirrorResult])
    }

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
  }, [isApiMode, challengeId, currentStep, attemptId, props, questionRevealHistory, confidence])

  // Handle option select — update Luma message
  const handleOptionSelect = useCallback((id: string) => {
    setSelectedOptionId(id)
    setLumaMessage('Good. Now rate your confidence.')
    setLumaState('listening')
  }, [])

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
      <PostSessionMirror
        challengeTitle={challengeTitle ?? 'Challenge'}
        totalScore={completionData?.total_score ?? 0}
        xpAwarded={completionData?.xp_awarded ?? 0}
        stepResults={mirrorStepResults}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        competencyDeltas={(completionData?.competency_deltas ?? []).map((d: any) => ({
          competency: d.competency ?? d.competency_key ?? '',
          before: d.before ?? d.delta_before ?? 0,
          after: d.after ?? d.delta_after ?? 0,
          direction: d.direction ?? (d.delta > 0 ? 'up' : d.delta < 0 ? 'down' : 'flat'),
        } as MirrorCompetencyDelta))}
        onRunAnother={() => {
          setMirrorStepResults([])
          setCalibrationSteps([
            { stepKey: 'frame',    stepLabel: 'Frame',    status: 'pending', confidenceLabel: null },
            { stepKey: 'list',     stepLabel: 'List',     status: 'pending', confidenceLabel: null },
            { stepKey: 'optimize', stepLabel: 'Optimize', status: 'pending', confidenceLabel: null },
            { stepKey: 'win',      stepLabel: 'Win',      status: 'pending', confidenceLabel: null },
          ])
          hasAnimated.current = false
          if (isApiMode) {
            setPhase('loading')
            reload()
          } else {
            setCurrentStep('frame')
            setCompletedSteps([])
            setPhase('question')
          }
        }}
        onDashboard={props.onExit ?? (() => window.history.back())}
      />
    )
  }

  // Derive current step label for LumaSidePanel
  const stepLabelMap: Record<FlowStep, string> = {
    frame: 'Frame step',
    list: 'List step',
    optimize: 'Optimize step',
    win: 'Win step',
  }
  const currentStepLabel = stepLabelMap[currentStep]

  // Shared context card — challenge description shown in right sidebar
  const contextCard = (challengeTitle || scenarioContext || scenarioTrigger || challengeScenarioQ) ? (
    <div className="bg-surface-container rounded-xl overflow-hidden">
      {/* Top accent */}
      <div className="h-0.5 bg-primary" />
      <div className="p-4 space-y-3">
        {scenarioRole && (
          <p className="font-label text-[9px] uppercase tracking-widest text-on-surface-variant">{scenarioRole}</p>
        )}
        {challengeTitle && (
          <p className="font-headline text-sm text-on-surface leading-snug">{challengeTitle}</p>
        )}
        {scenarioContext && (
          <p className="font-body text-xs text-on-surface-variant leading-relaxed">{scenarioContext}</p>
        )}
        {scenarioTrigger && (
          <div className="border-t border-outline-variant/30 pt-3">
            <p className="font-label text-[9px] uppercase tracking-widest text-on-surface-variant mb-1">The trigger</p>
            <p className="font-body text-xs text-on-surface-variant leading-relaxed">{scenarioTrigger}</p>
          </div>
        )}
        {challengeScenarioQ && (
          <div className="rounded-lg p-3 bg-surface-container-high border border-outline-variant/40">
            <p className="font-label text-[9px] uppercase tracking-widest text-on-surface-variant mb-1">Your challenge</p>
            <p className="font-body text-xs text-on-surface font-medium leading-relaxed">{challengeScenarioQ}</p>
          </div>
        )}
      </div>
    </div>
  ) : null

  if (phase === 'reveal') {
    const stepIdx = FLOW_STEPS.indexOf(currentStep)
    return (
      <div className="flex flex-col h-full overflow-hidden">
        {/* Flow rail — full width */}
        <div className="shrink-0 px-6 py-3 border-b border-outline-variant/40 bg-background">
          <FlowStepper currentStep={currentStep} completedSteps={completedSteps} onStepClick={handleStepClick} questionIdx={questionIdx} questionCount={activeStepData?.questions.length} />
        </div>

        {/* Main grid */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left: reveal content */}
          <div
            key={`${currentStep}-reveal`}
            className="flex-1 overflow-y-auto px-6 py-6 space-y-6 animate-step-enter"
            style={{ background: 'radial-gradient(ellipse at 100% 100%, rgba(74,124,89,0.04) 0%, transparent 55%)' }}
          >
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

          {/* Right sidebar: Luma + calibration + context */}
          <div className="w-[300px] shrink-0 flex flex-col gap-3 p-4 overflow-y-auto border-l border-outline-variant/30">
            <LumaSidePanel message={lumaMessage} lumaState={lumaState} stepName={currentStepLabel} />
            <CalibrationPreview steps={calibrationSteps} />
            {contextCard}
          </div>
        </div>
      </div>
    )
  }

  // phase === 'question'
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Flow rail — full width */}
      <div className="shrink-0 px-6 py-3 border-b border-outline-variant/40 bg-background">
        <FlowStepper currentStep={currentStep} completedSteps={completedSteps} questionIdx={questionIdx} questionCount={activeStepData?.questions.length} />
      </div>

      {/* Main grid */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: question + dock */}
        <div
          ref={workspaceRef}
          key={`${currentStep}-question`}
          className="flex-1 overflow-y-auto px-6 py-6 space-y-6 animate-step-enter"
          style={{ background: 'radial-gradient(ellipse at 100% 100%, rgba(74,124,89,0.04) 0%, transparent 55%)' }}
        >
          {/* Nudge */}
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
              elaboration={reasoning}
              revealed={false}
              onOptionSelect={handleOptionSelect}
              onElaborationChange={setReasoning}
              disabled={activeSubmitting}
            />
          ) : null}

          {/* ConfidenceDock */}
          {currentQuestion && (
            <ConfidenceDock
              optionSelected={selectedOptionId !== null}
              confidence={confidence}
              onConfidenceChange={setConfidence}
              reasoning={reasoning}
              onReasoningChange={setReasoning}
              onSubmit={handleSubmit}
              submitting={activeSubmitting}
              submitted={dockSubmitted}
            />
          )}
        </div>

        {/* Right sidebar: Luma + calibration + context */}
        <div className="w-[300px] shrink-0 flex flex-col gap-3 p-4 overflow-y-auto border-l border-outline-variant/30">
          <LumaSidePanel message={lumaMessage} lumaState={lumaState} stepName={currentStepLabel} />
          <CalibrationPreview steps={calibrationSteps} />
          {contextCard}
        </div>
      </div>
    </div>
  )
}

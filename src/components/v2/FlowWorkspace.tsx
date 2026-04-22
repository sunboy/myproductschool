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
  step_signals?: Array<{ step: string; quality_label: string; luma_signal: string | null; framework_hint: string | null; selected_option_id?: string | null }>
}

interface SessionRecord {
  attemptId: string | null
  completedAt: Date
  gradeLabel: string
  totalScore: number
  maxScore: number
  xpAwarded: number
  stepResults: MirrorStepResult[]
  competencyDeltas: MirrorCompetencyDelta[]
}

type FlowWorkspaceProps =
  | { mode: 'api'; challengeId: string; challengeSlug?: string; initialRoleId: UserRoleV2; onExit?: () => void; onPaywall?: (data: { used: number; limit: number }) => void; fromPlan?: string; nextChallengeSlug?: string }
  | { mode: 'adapter'; adapter: ChallengeAdapter; onComplete?: (data: AdapterCompletionData | null) => void; onExit?: () => void; fromPlan?: string; nextChallengeSlug?: string }

export function FlowWorkspace(props: FlowWorkspaceProps) {
  const isApiMode = props.mode === 'api'
  const challengeId = isApiMode ? props.challengeId : ''
  const challengeSlug = isApiMode ? ((props as Extract<FlowWorkspaceProps, { mode: 'api' }>).challengeSlug ?? challengeId) : ''
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

  // Refs for option-select reveal animation
  const confidenceCardRef = useRef<HTMLDivElement>(null)
  const reasoningCardRef = useRef<HTMLTextAreaElement>(null)

  // Resizable panel state — left panel width as percentage of container
  const [leftWidth, setLeftWidth] = useState(30)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragCleanupRef = useRef<(() => void) | null>(null)

  // Left description tab state
  const [leftTab, setLeftTab] = useState<'Description' | 'Discussions' | 'Submissions'>('Description')

  // Session history for Submissions tab
  const [sessionHistory, setSessionHistory] = useState<SessionRecord[]>([])
  const [selectedHistoryIdx, setSelectedHistoryIdx] = useState<number | null>(null)

  // Load past completed attempts for this challenge from the DB on mount
  useEffect(() => {
    if (!isApiMode || !challengeId) return
    fetch('/api/attempts?limit=20')
      .then(r => r.ok ? r.json() : [])
      .then((rows: Array<{
        id: string
        challenge_id: string
        grade_label: string | null
        score: number | null
        max_score: number | null
        submitted_at: string | null
        feedback_json: {
          step_breakdown?: Array<{ step: string; score: number; max_score: number }>
          step_signals?: Array<{ step: string; quality_label: string; luma_signal: string | null; framework_hint: string | null; selected_option_id?: string | null }>
          competency_deltas?: Array<{ competency: string; before: number; after: number; delta?: number }>
          xp_awarded?: number
          total_score?: number
          max_score?: number
        } | null
      }>) => {
        const past = rows
          .filter(r => r.challenge_id === challengeSlug || r.challenge_id === challengeId)
          .map((r): SessionRecord => {
            const fb = r.feedback_json
            const stepResults: MirrorStepResult[] = (fb?.step_breakdown ?? []).map(s => {
              // step_breakdown scores are stored as 0-1; PostSessionMirror displays score/3
              const normalizedScore = s.max_score > 1 ? s.score : s.score * 3
              const sig = (fb?.step_signals ?? []).find(ss => ss.step === s.step)
              return {
                step: s.step as 'frame' | 'list' | 'optimize' | 'win',
                score: Math.round(normalizedScore * 10) / 10,
                quality_label: sig?.quality_label ?? (s.score >= 0.75 ? 'best' : s.score >= 0.45 ? 'good_but_incomplete' : 'plausible_wrong'),
                confidence: null,
                reasoning: '',
                competency_signal: undefined,
                lumaSignal: sig?.luma_signal ?? null,
                frameworkHint: sig?.framework_hint ?? null,
                selectedOptionId: sig?.selected_option_id ?? null,
              }
            })
            const competencyDeltas: MirrorCompetencyDelta[] = (fb?.competency_deltas ?? []).map(d => ({
              competency: d.competency,
              before: d.before,
              after: d.after,
              direction: d.after > d.before ? 'up' : d.after < d.before ? 'down' : 'flat',
            } as MirrorCompetencyDelta))
            return {
              attemptId: r.id,
              completedAt: r.submitted_at ? new Date(r.submitted_at) : new Date(),
              gradeLabel: r.grade_label ?? '',
              totalScore: fb?.total_score ?? r.score ?? 0,
              maxScore: fb?.max_score ?? r.max_score ?? 3,
              xpAwarded: fb?.xp_awarded ?? 0,
              stepResults,
              competencyDeltas,
            }
          })
        if (past.length > 0) setSessionHistory(past)
      })
      .catch(() => {/* silently ignore */})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isApiMode, challengeId, challengeSlug])

  // Hint card open/close state (right pane)
  const [hintOpen, setHintOpen] = useState(false)

  // Left panel footer interaction state
  const [liked, setLiked] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleSeparatorMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const container = containerRef.current
    if (!container) return

    const onMouseMove = (ev: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const pct = ((ev.clientX - rect.left) / rect.width) * 100
      setLeftWidth(Math.max(20, Math.min(80, pct)))
    }

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      document.body.style.cursor = ''
      dragCleanupRef.current = null
    }

    document.body.style.cursor = 'col-resize'
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    dragCleanupRef.current = onMouseUp
  }, [])

  useEffect(() => {
    return () => { dragCleanupRef.current?.() }
  }, [])

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

  // GSAP: slide-up + green glow pulse when user picks an option; kill on submit/question change
  const prevSelectedOptionRef = useRef<string | null>(null)
  const glowTweensRef = useRef<gsap.core.Tween[]>([])

  const killGlowTweens = useCallback(() => {
    glowTweensRef.current.forEach(t => t.kill())
    glowTweensRef.current = []
    // Reset box-shadow so no residual glow remains
    ;[reasoningCardRef.current, confidenceCardRef.current].forEach(el => {
      if (el) el.style.boxShadow = ''
    })
  }, [])

  useEffect(() => {
    if (!selectedOptionId || selectedOptionId === prevSelectedOptionRef.current) return
    prevSelectedOptionRef.current = selectedOptionId

    killGlowTweens()

    const targets = ([reasoningCardRef.current, confidenceCardRef.current] as Array<HTMLElement | null>).filter((el): el is HTMLElement => el !== null)
    if (!targets.length) return

    // 1. Slide-up entrance
    gsap.fromTo(
      targets,
      { opacity: 0.4, y: 12 },
      {
        opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', stagger: 0.1, clearProps: 'transform',
        onComplete: () => {
          confidenceCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        },
      }
    )

    // 2. Slow repeating glow pulse on each target independently
    targets.forEach(el => {
      const tween = gsap.fromTo(
        el,
        { boxShadow: '0 0 0px 0px rgba(74, 124, 89, 0)' },
        {
          boxShadow: '0 0 12px 3px rgba(74, 124, 89, 0.28)',
          duration: 1.4,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        }
      )
      glowTweensRef.current.push(tween)
    })
  }, [selectedOptionId, killGlowTweens])

  // Kill glow when the answer is submitted (phase leaves 'question')
  useEffect(() => {
    if (phase !== 'question') killGlowTweens()
  }, [phase, killGlowTweens])

  // Kill glow when moving to next question within a step
  useEffect(() => {
    killGlowTweens()
    prevSelectedOptionRef.current = null
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionIdx])

  const canSubmit = selectedOptionId !== null

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
    const mirrorResult: MirrorStepResult | null = stepRevealRecord ? {
      step: currentStep as 'frame' | 'list' | 'optimize' | 'win',
      score: stepRevealRecord.score ?? 0,
      quality_label: stepRevealRecord.gradeLabel ?? 'plausible_wrong',
      confidence: confidence,
      reasoning: reasoning,
      competency_signal: stepRevealRecord.competencySignal ?? undefined,
      lumaSignal: stepRevealRecord.competencySignal?.signal ?? null,
      frameworkHint: stepRevealRecord.competencySignal?.framework_hint ?? null,
      selectedOptionId: stepRevealRecord.selectedOptionId ?? null,
      questions: questionRevealHistory.map(q => ({
        questionText: q.questionText,
        selectedOptionId: q.selectedOptionId,
        options: q.revealedOptions.map(o => ({
          id: o.id,
          option_label: o.option_label ?? '',
          option_text: o.option_text ?? '',
          quality: o.quality ?? 'plausible_wrong',
          explanation: o.explanation,
          framework_hint: o.framework_hint,
        })),
      })),
    } : null
    if (mirrorResult) {
      setMirrorStepResults((prev) => [...prev, mirrorResult])
    }

    if (isLast) {
      const finalStepResults = [...mirrorStepResults]
      if (mirrorResult) finalStepResults.push(mirrorResult)

      const completeSession = (cd: CompletionData | null, stepRes: MirrorStepResult[]) => {
        const deltas: MirrorCompetencyDelta[] = (cd?.competency_deltas ?? []).map((d) => ({
          competency: d.competency,
          before: d.before,
          after: d.after,
          direction: d.after > d.before ? 'up' : d.after < d.before ? 'down' : 'flat',
        } as MirrorCompetencyDelta))
        // Enrich step results with real coaching text from the complete API response
        const dbSignals = cd?.step_signals ?? []
        const enrichedStepRes: MirrorStepResult[] = stepRes.map(r => {
          const sig = dbSignals.find(s => s.step === r.step)
          if (!sig) return r
          return {
            ...r,
            quality_label: sig.quality_label ?? r.quality_label,
            lumaSignal: sig.luma_signal ?? r.lumaSignal,
            frameworkHint: sig.framework_hint ?? r.frameworkHint,
            selectedOptionId: sig.selected_option_id ?? r.selectedOptionId,
          }
        })
        const record: SessionRecord = {
          attemptId,
          completedAt: new Date(),
          gradeLabel: cd?.grade_label ?? '',
          totalScore: cd?.total_score ?? 0,
          maxScore: cd?.max_score ?? 0,
          xpAwarded: cd?.xp_awarded ?? 0,
          stepResults: enrichedStepRes,
          competencyDeltas: deltas,
        }
        setSessionHistory((prev) => [record, ...prev])
        setSelectedHistoryIdx(0)
        setPhase('complete')
      }

      if (isApiMode) {
        try {
          const res = await fetch(`/api/challenges/${challengeId}/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              attempt_id: attemptId,
              from_plan: fromPlan,
              step_signals: finalStepResults.map(r => ({
                step: r.step,
                quality_label: r.quality_label,
                luma_signal: r.lumaSignal ?? null,
                framework_hint: r.frameworkHint ?? null,
              })),
            }),
          })
          if (res.ok) {
            const data = await res.json()
            const cd: CompletionData = {
              total_score: data.total_score,
              max_score: data.max_score,
              grade_label: data.grade_label,
              xp_awarded: data.xp_awarded,
              step_breakdown: data.step_breakdown ?? [],
              competency_deltas: data.competency_deltas ?? [],
              step_signals: data.step_signals ?? [],
            }
            setCompletionData(cd)
            if (fromPlan) {
              window.dispatchEvent(new CustomEvent('challenge-completed', { detail: { challengeId, fromPlan } }))
            }
            completeSession(cd, finalStepResults)
          } else {
            completeSession(null, finalStepResults)
          }
        } catch {
          completeSession(null, finalStepResults)
        }
      } else {
        const adapterProps = props as Extract<FlowWorkspaceProps, { mode: 'adapter' }>
        const data = await adapterProps.adapter.complete()
        adapterProps.onComplete?.(data)
        const cd: CompletionData | null = data ? {
          total_score: data.total_score,
          max_score: data.max_score,
          grade_label: data.grade_label,
          xp_awarded: data.xp_awarded,
          step_breakdown: data.step_breakdown ?? [],
          competency_deltas: data.competency_deltas ?? [],
        } : null
        setCompletionData(cd)
        completeSession(cd, finalStepResults)
      }
    } else {
      setCompletedSteps((prev) => [...prev, currentStep])
      setCurrentStep(FLOW_STEPS[stepIdx + 1])
      setPhase('question')
    }
  }, [isApiMode, challengeId, currentStep, attemptId, props, questionRevealHistory, confidence, mirrorStepResults])

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

  const handleRunAnother = () => {
    setMirrorStepResults([])
    setSelectedHistoryIdx(null)
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
  }

  const stepIdx = FLOW_STEPS.indexOf(currentStep)
  const isLastStep = stepIdx === FLOW_STEPS.length - 1

  const STAGE_COLOR: Record<FlowStep, string> = {
    frame:    '#4a7c59',
    list:     '#6b8275',
    optimize: '#c9933a',
    win:      '#a878d6',
  }
  const STAGE_ICON: Record<FlowStep, string> = {
    frame:    'crop_free',
    list:     'format_list_bulleted',
    optimize: 'tune',
    win:      'emoji_events',
  }
  const STEP_LABEL: Record<FlowStep, string> = {
    frame:    'Frame',
    list:     'List',
    optimize: 'Optimize',
    win:      'Win',
  }
  const NEXT_LABEL: Record<FlowStep, string> = {
    frame:    'List',
    list:     'Optimize',
    optimize: 'Win',
    win:      'Finish',
  }

  const tabs = ['Description', 'Discussions', 'Submissions'] as const

  // Left pane description content
  const descriptionPane = (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px' }}>
      {/* Chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        <span className="chip" style={{ background: 'var(--color-primary-container)', color: 'var(--color-on-primary-container)', fontSize: 11 }}>Intermediate</span>
        <span className="chip" style={{ fontSize: 11 }}>
          <span className="material-symbols-outlined msi-sm">local_offer</span> Topics
        </span>
        <span className="chip" style={{ fontSize: 11 }}>
          <span className="material-symbols-outlined msi-sm">domain</span> Companies
        </span>
        <span className="chip" style={{ background: 'var(--color-amber-soft, #f3e2b9)', color: '#8a5c00', border: '1px solid #e8d09a', fontSize: 11 }}>
          <span className="material-symbols-outlined msi-sm">lightbulb</span> Hint available
        </span>
      </div>

      {/* Title */}
      {challengeTitle && (
        <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: 22, fontWeight: 600, lineHeight: 1.3, letterSpacing: '-0.01em', color: 'var(--color-on-surface)', marginBottom: 10 }}>
          {challengeTitle}
        </h2>
      )}

      {/* Meta row */}
      <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--color-on-surface-variant)', marginBottom: 20 }}>
        {scenarioRole && <span>{scenarioRole}</span>}
        <span>·</span>
        <span>{STEP_LABEL[currentStep]} stage</span>
        <span>·</span>
        <span>~15 min</span>
      </div>

      {/* Context */}
      {scenarioContext && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.7, color: 'var(--color-on-surface-variant)' }}>
            {scenarioContext}
          </p>
        </div>
      )}

      {/* The trigger */}
      {scenarioTrigger && (
        <div style={{ marginBottom: 20, background: 'var(--color-amber-soft, #f3e2b9)', border: '1px solid #e8d09a', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#8a5c00', marginBottom: 6 }}>
            The trigger
          </div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13.5, lineHeight: 1.6, color: '#5c3a00' }}>
            {scenarioTrigger}
          </p>
        </div>
      )}

      {/* Your challenge */}
      {challengeScenarioQ && (
        <div style={{ marginBottom: 20, background: 'var(--color-primary-container)', border: '1px solid rgba(74,124,89,0.25)', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-on-surface-variant)', marginBottom: 6 }}>
            Your challenge
          </div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13.5, lineHeight: 1.6, color: 'var(--color-on-surface)', fontWeight: 500 }}>
            {challengeScenarioQ}
          </p>
        </div>
      )}
    </div>
  )

  const editorialPane = (
    <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--color-outline)' }}>lock</span>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-on-surface-variant)', textAlign: 'center' }}>
        Complete this challenge to unlock the editorial.
      </p>
    </div>
  )

  const discussionsPane = (
    <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--color-outline)' }}>forum</span>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-on-surface-variant)', textAlign: 'center' }}>
        Discussion forum coming soon.
      </p>
    </div>
  )

  const GRADE_STYLE: Record<string, { bg: string; color: string }> = {
    best:     { bg: 'var(--color-primary)', color: 'var(--color-on-primary)' },
    good:     { bg: 'var(--color-tertiary-container)', color: 'var(--color-on-surface)' },
    surface:  { bg: 'var(--color-secondary-container)', color: 'var(--color-on-secondary-container)' },
    default:  { bg: 'var(--color-surface-container-high)', color: 'var(--color-on-surface-variant)' },
  }
  const gradeStyle = (label: string) =>
    GRADE_STYLE[label] ?? GRADE_STYLE['default']

  const submissionsPane = sessionHistory.length === 0 ? (
    <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--color-outline)' }}>history</span>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-on-surface-variant)', textAlign: 'center' }}>
        No submissions yet.
      </p>
    </div>
  ) : (
    <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {sessionHistory.map((record, idx) => {
        const gs = gradeStyle(record.gradeLabel)
        const isSelected = selectedHistoryIdx === idx
        return (
          <button
            key={idx}
            onClick={() => setSelectedHistoryIdx(idx)}
            style={{
              textAlign: 'left',
              background: isSelected ? 'var(--color-primary-fixed)' : 'var(--color-surface-container-low)',
              border: isSelected ? '1.5px solid var(--color-primary)' : '1px solid var(--color-outline-variant)',
              borderRadius: 12,
              padding: '12px 14px',
              cursor: 'pointer',
              transition: 'background 120ms',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: 'var(--font-label)', fontSize: 12, fontWeight: 700, color: 'var(--color-on-surface-variant)' }}>
                Attempt {sessionHistory.length - idx}
              </span>
              <span style={{
                fontFamily: 'var(--font-label)', fontSize: 11, fontWeight: 600, padding: '2px 8px',
                borderRadius: 99, background: gs.bg, color: gs.color,
              }}>
                {record.gradeLabel || 'Scored'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-on-surface)' }}>
                {record.totalScore} / {record.maxScore} pts
              </span>
              <span style={{ fontFamily: 'var(--font-label)', fontSize: 11, color: 'var(--color-on-surface-variant)' }}>
                +{record.xpAwarded} XP
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-on-surface-variant)', marginTop: 4 }}>
              {record.completedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </button>
        )
      })}
    </div>
  )

  // Left description panel
  // Left panel — content only, no tab bar or footer (those are hoisted to span full width)
  const leftDescriptionPanel = (
    <section style={{
      width: `${leftWidth}%`,
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--color-surface)',
      overflow: 'hidden',
      minHeight: 0,
    }}>
      {leftTab === 'Description' && descriptionPane}
      {leftTab === 'Discussions' && discussionsPane}
      {leftTab === 'Submissions' && submissionsPane}
    </section>
  )

  // Shared top chrome — spans full width so the borderBottom is continuous
  const topChrome = (
    <div style={{
      display: 'flex',
      alignItems: 'flex-end',
      borderBottom: '1px solid var(--color-outline-faint)',
      background: 'var(--color-surface)',
      flexShrink: 0,
    }}>
      {/* Left side: back + tabs — constrained to leftWidth */}
      <div style={{ width: `${leftWidth}%`, display: 'flex', alignItems: 'flex-end', gap: 2, padding: '6px 8px 0', flexShrink: 0 }}>
        <button
          onClick={props.onExit ?? (() => window.history.back())}
          className="btn btn--ghost"
          style={{ padding: '6px 8px', fontSize: 12, marginBottom: 4, display: 'inline-flex', alignItems: 'center' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
        </button>
        {tabs.map(t => {
          const active = leftTab === t
          return (
            <button
              key={t}
              onClick={() => setLeftTab(t)}
              style={{
                padding: '7px 14px',
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                color: active ? 'var(--color-on-surface)' : 'var(--color-on-surface-variant)',
                background: active ? 'var(--color-surface-container-low)' : 'transparent',
                border: active ? '1px solid var(--color-outline-faint)' : '1px solid transparent',
                borderBottom: active ? '1px solid var(--color-surface-container-low)' : '1px solid transparent',
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                marginBottom: active ? -1 : 0,
                fontFamily: 'inherit',
                transition: 'color 120ms',
              }}
            >
              {t === 'Submissions' && sessionHistory.length > 0
                ? `Submissions (${sessionHistory.length})`
                : t}
            </button>
          )
        })}
      </div>
      {/* Drag handle spacer */}
      <div style={{ width: 6, flexShrink: 0 }} />
      {/* Right side: FLOW stepper + hint — takes remaining space */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
          <FlowStepper
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={handleStepClick}
            questionIdx={questionIdx}
            questionCount={activeStepData?.questions.length}
          />
          <span className="chip" style={{ fontSize: 11, flexShrink: 0 }}>Step {stepIdx + 1} of 4</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <button
            className="btn btn--ghost"
            style={{
              padding: '6px 10px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4,
              background: hintOpen ? '#f3e2b9' : undefined,
              color: hintOpen ? '#5c3a00' : undefined,
              borderRadius: 8,
            }}
            onClick={() => setHintOpen(v => !v)}
          >
            <span
              className="material-symbols-outlined msi-sm"
              style={{ fontVariationSettings: hintOpen ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" : undefined }}
            >lightbulb</span> Hint
          </button>
        </div>
      </div>
    </div>
  )

  // Shared bottom footer — spans full width so the borderTop is continuous
  const bottomFooter = currentQuestion ? (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      borderTop: '1px solid var(--color-outline-faint)',
      background: 'var(--color-surface)',
      flexShrink: 0,
    }}>
      {/* Left side: like/bookmark/share + online count */}
      <div style={{
        width: `${leftWidth}%`,
        flexShrink: 0,
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: 12,
        color: 'var(--color-on-surface-variant)',
      }}>
        {leftTab === 'Description' ? (
          <>
            <div style={{ display: 'flex', gap: 14 }}>
              <button
                className="btn btn--ghost"
                style={{ padding: '4px 10px', fontSize: 12, gap: 4, color: liked ? 'var(--color-primary)' : undefined }}
                onClick={() => setLiked(v => !v)}
              >
                <span
                  className="material-symbols-outlined msi-sm"
                  style={{ fontVariationSettings: liked ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" : undefined }}
                >thumb_up</span> {liked ? '1.1K+' : '1.1K'}
              </button>
              <button
                className="btn btn--ghost"
                style={{ padding: '4px 10px', fontSize: 12, gap: 4, color: bookmarked ? 'var(--color-primary)' : undefined }}
                onClick={() => setBookmarked(v => !v)}
              >
                <span
                  className="material-symbols-outlined msi-sm"
                  style={{ fontVariationSettings: bookmarked ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" : undefined }}
                >{bookmarked ? 'bookmark' : 'bookmark_border'}</span> {bookmarked ? '343' : '342'}
              </button>
              <button
                className="btn btn--ghost"
                style={{ padding: '4px 10px', fontSize: 12, gap: 4 }}
                onClick={() => {
                  const url = window.location.href
                  if (navigator.share) {
                    navigator.share({ url })
                  } else {
                    navigator.clipboard.writeText(url).then(() => {
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    })
                  }
                }}
              >
                <span className="material-symbols-outlined msi-sm">share</span>
                {copied && <span style={{ fontSize: 11 }}>Copied!</span>}
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: '#4a7c59', display: 'inline-block' }} />
              3,589 online
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: '#4a7c59', display: 'inline-block' }} />
            3,589 online
          </div>
        )}
      </div>
      {/* Drag handle spacer */}
      <div style={{ width: 6, flexShrink: 0 }} />
      {/* Right side: prev + submit */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px' }}>
        <button
          className="btn btn--ghost"
          style={{ fontSize: 12, padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
          disabled={questionIdx === 0}
        >
          <span className="material-symbols-outlined msi-sm">arrow_back</span> Previous
        </button>
        <button
          className="btn btn--primary"
          style={{ fontSize: 13, padding: '10px 22px', display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--color-primary)', color: 'var(--color-on-primary)', borderRadius: 99, fontWeight: 600, border: 'none' }}
          disabled={selectedOptionId === null || activeSubmitting}
          onClick={handleSubmit}
        >
          {activeSubmitting ? 'Grading…' : (isLastStep && questionIdx === (activeStepData?.questions.length ?? 1) - 1 ? 'Finish' : 'Submit')}
          {!activeSubmitting && <span className="material-symbols-outlined msi-sm">arrow_forward</span>}
          {activeSubmitting && <LumaGlyph size={16} state="reviewing" className="text-on-primary" />}
        </button>
      </div>
    </div>
  ) : null

  // Shared drag handle — sits between left and right panel content rows only
  const dragHandle = (
    <div
      onMouseDown={handleSeparatorMouseDown}
      style={{ width: 6, cursor: 'col-resize', background: 'transparent', flexShrink: 0, position: 'relative' }}
    >
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 2, height: 32, background: 'var(--color-outline-variant)', borderRadius: 999 }} />
    </div>
  )

  if (phase === 'reveal' || phase === 'complete' || selectedHistoryIdx !== null) {
    const historyRecord = selectedHistoryIdx !== null ? sessionHistory[selectedHistoryIdx] : null
    const showMirror = phase === 'complete' || historyRecord !== null

    return (
      <div className="flex flex-col overflow-hidden h-full">
        {/* Same full-width top chrome as question phase */}
        {topChrome}

        {/* Middle: resizable two-pane content */}
        <div ref={containerRef} className="flex flex-1 min-h-0 overflow-hidden">
          {leftDescriptionPanel}
          {dragHandle}

          {/* Right panel */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0" style={{ background: 'var(--color-background)' }}>
            {/* History back-nav banner */}
            {historyRecord && (
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderBottom: '1px solid var(--color-outline-faint)', background: 'var(--color-surface)' }}>
                <button
                  className="btn btn--ghost"
                  style={{ fontSize: 12, padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  onClick={() => setSelectedHistoryIdx(null)}
                >
                  <span className="material-symbols-outlined msi-sm">arrow_back</span> Back
                </button>
                <span style={{ fontFamily: 'var(--font-label)', fontSize: 12, color: 'var(--color-on-surface-variant)' }}>
                  Attempt {sessionHistory.length - selectedHistoryIdx!} — {historyRecord.completedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}

            {/* Session complete banner */}
            {phase === 'complete' && !historyRecord && (
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderBottom: '1px solid var(--color-outline-faint)', background: 'var(--color-primary-fixed)' }}>
                <span className="material-symbols-outlined msi-sm" style={{ color: 'var(--color-primary)' }}>check_circle</span>
                <span style={{ fontFamily: 'var(--font-label)', fontSize: 12, fontWeight: 600, color: 'var(--color-on-surface)' }}>
                  Session complete — reviewing your results
                </span>
              </div>
            )}

            {showMirror ? (
              <div className="flex-1 min-h-0 animate-step-enter">
                <PostSessionMirror
                  challengeTitle={challengeTitle ?? 'Challenge'}
                  totalScore={historyRecord ? historyRecord.totalScore : (completionData?.total_score ?? 0)}
                  maxScore={historyRecord ? historyRecord.maxScore : (completionData?.max_score ?? 3)}
                  xpAwarded={historyRecord ? historyRecord.xpAwarded : (completionData?.xp_awarded ?? 0)}
                  stepResults={historyRecord ? historyRecord.stepResults : mirrorStepResults}
                  attemptId={historyRecord ? (historyRecord.attemptId ?? undefined) : (attemptId ?? undefined)}
                  competencyDeltas={historyRecord
                    ? historyRecord.competencyDeltas
                    : (completionData?.competency_deltas ?? []).map(d => ({
                        competency: d.competency,
                        before: d.before,
                        after: d.after,
                        direction: d.after > d.before ? 'up' : d.after < d.before ? 'down' : 'flat',
                      } as MirrorCompetencyDelta))}
                  onRunAnother={historyRecord ? undefined : handleRunAnother}
                  onDashboard={props.onExit ?? (() => window.history.back())}
                  onNextChallenge={nextChallengeSlug && !historyRecord
                    ? () => { window.location.href = `/workspace/challenges/${nextChallengeSlug}` }
                    : undefined
                  }
                />
              </div>
            ) : (
              /* phase === 'reveal': per-step grading */
              <div
                key={`${currentStep}-reveal`}
                className="flex-1 overflow-y-auto px-6 py-6 space-y-6 animate-step-enter min-w-0"
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
                  isLastStep={isLastStep}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // phase === 'question'
  return (
    <div className="flex flex-col overflow-hidden h-full">
      {/* Full-width top chrome: tabs on left, stepper on right — one continuous borderBottom */}
      {topChrome}

      {/* Middle: resizable two-pane content area */}
      <div ref={containerRef} className="flex flex-1 min-h-0 overflow-hidden">
        {leftDescriptionPanel}
        {dragHandle}

        {/* Right pane: scrollable workspace content only */}
        <section style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--color-background)', overflow: 'hidden', minHeight: 0 }}>
          <div
            ref={workspaceRef}
            key={`${currentStep}-question`}
            className="flex-1 overflow-y-auto min-h-0 min-w-0"
            style={{ padding: '20px 24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            {/* Hint card */}
            {hintOpen && activeStepData?.nudge && (
              <div style={{
                background: 'var(--color-amber-soft, #f3e2b9)',
                border: '1px solid #e8d09a',
                borderRadius: 12,
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
              }}>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 18, color: '#8a5c00', flexShrink: 0, marginTop: 1, fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
                >
                  lightbulb
                </span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: '#5c3a00' }}>Hint · {STEP_LABEL[currentStep]} move: </span>
                  <span style={{ fontSize: 13, color: '#5c3a00', lineHeight: 1.6 }}>{activeStepData.nudge}</span>
                </div>
                <button
                  onClick={() => setHintOpen(false)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#8a5c00', flexShrink: 0 }}
                >
                  <span className="material-symbols-outlined msi-sm">close</span>
                </button>
              </div>
            )}

            {/* Question card */}
            {(isApiMode ? stepLoading : false) ? (
              <div className="flex justify-center py-8">
                <LumaGlyph size={40} state="reviewing" className="text-primary" />
              </div>
            ) : (isApiMode && stepError) ? (
              <p className="font-body text-error text-sm text-center">{stepError}</p>
            ) : currentQuestion ? (
              <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-outline-faint)', borderRadius: 14, padding: '18px 20px' }}>
                <StepQuestion
                  question={currentQuestion}
                  responseType={currentQuestion.response_type}
                  selectedOptionId={selectedOptionId}
                  elaboration={reasoning}
                  revealed={false}
                  onOptionSelect={handleOptionSelect}
                  onElaborationChange={setReasoning}
                  disabled={activeSubmitting}
                  elaborationRef={reasoningCardRef}
                />
              </div>
            ) : null}

            {/* Confidence card */}
            {currentQuestion && (
              <div ref={confidenceCardRef} style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-outline-faint)',
                borderRadius: 14,
                padding: '14px 16px',
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-on-surface-variant)', marginBottom: 10, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Confidence — how sure are you?
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {(['Guessing', 'Not sure', 'Fairly sure', 'Rock solid'] as const).map((c, i) => {
                    const active = confidence === i
                    return (
                      <button
                        key={c}
                        onClick={() => setConfidence(i)}
                        disabled={selectedOptionId === null}
                        style={{
                          padding: '9px 8px',
                          borderRadius: 999,
                          fontSize: 12.5,
                          fontWeight: 600,
                          background: active ? 'var(--color-on-surface)' : 'var(--color-surface-container-low)',
                          color: active ? 'var(--color-inverse-on-surface, #f5f0e8)' : 'var(--color-on-surface-variant)',
                          border: '1px solid ' + (active ? 'transparent' : 'var(--color-outline-faint)'),
                          opacity: selectedOptionId !== null ? 1 : 0.5,
                          cursor: selectedOptionId !== null ? 'pointer' : 'not-allowed',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 4,
                          fontFamily: 'inherit',
                          transition: 'background 120ms, color 120ms',
                        }}
                      >
                        {i === 3 && (
                          <span className="material-symbols-outlined msi-sm">verified</span>
                        )}
                        {c}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Full-width bottom footer: left actions + submit — one continuous borderTop */}
      {bottomFooter}
    </div>
  )
}

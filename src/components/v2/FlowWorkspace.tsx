'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { trackEvent } from '@/lib/posthog/client'
import { EVENT_CHALLENGE_STARTED, EVENT_CHALLENGE_STEP_ADVANCED } from '@/lib/posthog/events'
import gsap from 'gsap'
import type { FlowStep, UserRoleV2, InterviewGrade } from '@/lib/types'
import type { ChallengeAdapter, AdapterCompletionData, AdapterStepData, SyntheticChallenge } from '@/lib/showcase/adapters/autopsyAdapter'
import { useChallengeV2 } from '@/lib/v2/hooks/useChallengeV2'
import { useFlowStep } from '@/lib/v2/hooks/useFlowStep'
import { coerceDifficulty, DIFFICULTY_LABELS } from '@/lib/practice/difficulty'
import { FLOW_MOVES } from '@/lib/flow/moves'
import { FlowStepper } from './FlowStepper'
import { StepQuestion } from './StepQuestion'
import { StepReveal } from './StepReveal'
import { PostSessionMirror, type StepResult as MirrorStepResult, type CompetencyDelta as MirrorCompetencyDelta } from './PostSessionMirror'
import type { StepCalibration } from './CalibrationPreview'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import { useHatchContext } from '@/context/HatchContext'
import { CanvasChatPanel } from '@/components/challenge/CanvasChatPanel'
import { CanvasCoachCard } from '@/components/challenge/CanvasCoachCard'
import { CanvasEmptyState } from '@/components/challenge/CanvasEmptyState'
import { canvasStarterTemplate } from '@/lib/hatch/canvasSeeds'
import { CanvasReadinessMeter } from '@/components/challenge/CanvasReadinessMeter'
import { CanvasThinkingDock } from '@/components/challenge/CanvasThinkingDock'
import { TourRunner } from '@/components/shell/TourRunner'
import { CANVAS_TOUR, canvasTourSeen } from '@/lib/tours/canvasTour'
import { setCursor } from '@/lib/tours/shepherdEngine'
import { AppTooltip } from '@/components/ui/AppTooltip'
import { summarizeScene, type CanvasScene } from '@/lib/hatch/canvas-scene'
import { useCanvasGuidance } from '@/hooks/useCanvasGuidance'
import type { CanvasChallengeType } from '@/lib/hatch/canvasGuidance'
import { executeActions } from '@/components/challenge/canvasActionExecutor'
import type { CanvasAction } from '@/lib/types'
import { InterviewFeedback } from '@/components/v2/InterviewFeedback'
import { MonacoCodeEditor } from '@/components/challenge/MonacoCodeEditor'
import { CodeOutputPanel } from '@/components/challenge/CodeOutputPanel'
import { LanguageSelector } from '@/components/challenge/LanguageSelector'
import { SchemaDiagram } from '@/components/challenge/SchemaDiagram'
import { SampleDataPreview } from '@/components/challenge/SampleDataPreview'
import { ExpectedOutput, type ExpectedOutputTestCase } from '@/components/challenge/ExpectedOutput'
import { CodingFeedback } from '@/components/challenge/CodingFeedback'
import { useCodeRunner } from '@/hooks/useCodeRunner'
import { AppBreadcrumbs } from '@/components/navigation/AppBreadcrumbs'
import { workspaceBreadcrumbs, workspaceExitHref } from '@/lib/workspace/breadcrumbs'
import { useHatchSonics } from '@/hooks/useHatchSonics'
import { useIsMobile } from '@/hooks/useIsMobile'
import type { SupportedLanguage, RunResult, GradingFeedback } from '@/lib/coding/types'
import type { SchemaDiagramData } from '@/components/challenge/SchemaDiagram'
import { formatCompany } from '@/lib/format/company'
import { DiscussionThread } from '@/components/challenge/DiscussionThread'
import { DiscussionInput } from '@/components/challenge/DiscussionInput'
import type { ChallengeDiscussion } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { buildChallengeBrief, type ChallengeBriefSection } from '@/lib/challenges/presentation'
import { codingMarkdownComponents } from '@/components/challenge/markdownComponents'
import { SolutionsPane } from '@/components/solutions/SolutionsPane'
import type { SolutionTabResponse } from '@/lib/solutions/schema'

const ExcalidrawCanvas = dynamic(() => import('@/components/challenge/ExcalidrawCanvas'), { ssr: false })
const ReactMarkdown = dynamic(() => import('react-markdown'), { ssr: false })

function deriveDiscussionUpvotes(items: ChallengeDiscussion[], userId: string | null) {
  if (!userId) return new Set<string>()
  return new Set(
    items
      .filter(d => d.viewer_has_upvoted || (Array.isArray(d.upvoted_by) && d.upvoted_by.includes(userId)))
      .map(d => d.id)
  )
}

function applyDiscussionUpvoteState(
  discussion: ChallengeDiscussion,
  userId: string | null,
  upvoted: boolean
): ChallengeDiscussion {
  if (!userId) return discussion
  const previous = Array.isArray(discussion.upvoted_by) ? discussion.upvoted_by : []
  const next = upvoted
    ? Array.from(new Set([...previous, userId]))
    : previous.filter(id => id !== userId)

  return { ...discussion, upvoted_by: next, viewer_has_upvoted: upvoted }
}

export interface ContextPackField {
  id: string
  label: string
  helper: string
  icon: string
  placeholder: string
  value: string
  removable: boolean
}

type ContextPackState = ContextPackField[]

function buildDefaultContextPackFields(challengeType?: string): ContextPackField[] {
  const isDataModeling = challengeType === 'data_modeling'
  return [
    {
      id: 'assumptions',
      label: 'Assumptions',
      helper: 'What you are taking as given: traffic shape, tenant model, who the users are.',
      icon: 'fact_check',
      placeholder: 'e.g. ~10k tenants, read-heavy, data can be a few minutes stale',
      value: '',
      removable: false,
    },
    {
      id: 'constraints',
      label: 'Constraints',
      helper: 'Hard limits the design must respect.',
      icon: 'rule',
      placeholder: 'latency budget, privacy, consistency, storage, compliance',
      value: '',
      removable: false,
    },
    {
      id: 'interfaces',
      label: isDataModeling ? 'Access patterns' : 'APIs & events',
      helper: isDataModeling
        ? 'The queries this schema must serve fast.'
        : 'The endpoints, events, and read/write paths.',
      icon: 'hub',
      placeholder: isDataModeling
        ? '"top posts per user, last 7 days"'
        : 'POST /publish, fan-out event, read path for feed',
      value: '',
      removable: false,
    },
    {
      id: 'tradeoffs',
      label: 'Tradeoffs',
      helper: 'The decision you are betting on: what you gained, what you gave up, and why that is acceptable.',
      icon: 'balance',
      placeholder: 'chose eventual consistency for write throughput; stale reads acceptable because feeds tolerate lag',
      value: '',
      removable: false,
    },
    {
      id: 'risks',
      label: 'Open questions',
      helper: 'What you would clarify, monitor, or validate next.',
      icon: 'help',
      placeholder: 'what is the SLA on fan-out? how do we backfill?',
      value: '',
      removable: false,
    },
  ]
}

const EMPTY_CONTEXT_PACK_FIELDS: ContextPackField[] = buildDefaultContextPackFields()

const CHALLENGE_TYPE_FILTER_COPY: Record<string, { label: string; discipline: string; icon: string }> = {
  flow: { label: 'Product sense', discipline: 'product_sense', icon: 'psychology' },
  freeform: { label: 'Product sense', discipline: 'product_sense', icon: 'psychology' },
  quick_take: { label: 'Product sense', discipline: 'product_sense', icon: 'psychology' },
  claude_code_analytics: { label: 'Analytics', discipline: 'analytics', icon: 'analytics' },
  system_design: { label: 'System design', discipline: 'system_design', icon: 'hub' },
  data_modeling: { label: 'Data modeling', discipline: 'data_modeling', icon: 'account_tree' },
  sql: { label: 'SQL', discipline: 'sql', icon: 'database' },
  algorithm: { label: 'Coding', discipline: 'algorithm', icon: 'data_object' },
}

/** Keyed on canonical PracticeDifficulty. Legacy values are normalized via coerceDifficulty at the render site. */
const DIFFICULTY_LABEL: Record<string, string> = {
  easy: DIFFICULTY_LABELS.easy,
  medium: DIFFICULTY_LABELS.medium,
  hard: DIFFICULTY_LABELS.hard,
}

/** URL param value for the difficulty filter — canonical value maps to display label (identity). */
const DIFFICULTY_FILTER_VALUE: Record<string, string> = {
  easy: DIFFICULTY_LABELS.easy,
  medium: DIFFICULTY_LABELS.medium,
  hard: DIFFICULTY_LABELS.hard,
}

function practiceFilterHref(key: 'company' | 'difficulty' | 'discipline' | 'tag', value: string) {
  const params = new URLSearchParams()
  params.set(key, value)
  return `/challenges?${params.toString()}`
}

type QueuedHatchPrompt = { id: string; text: string; autoSend?: boolean }
type ContextPackIntent = 'clarify' | 'build' | 'stress'

function formatContextPack(fields: ContextPackState): string {
  return fields
    .map((field) => {
      const value = field.value.trim()
      return value ? `${field.label}:\n${value}` : null
    })
    .filter(Boolean)
    .join('\n\n')
}

function getCanvasArtifactCopy(challengeType?: string) {
  if (challengeType === 'data_modeling') {
    return {
      artifact: 'data model',
      buildTarget: 'tables, columns, foreign keys, cardinality, and indexes',
      gapTarget: 'entity boundaries, primary keys, foreign keys, cardinality, and query patterns',
    }
  }

  return {
    artifact: 'system design',
    buildTarget: 'components, APIs, events, stores, queues, and data flows',
    gapTarget: 'scale, failure modes, consistency, observability, and operational ownership',
  }
}

function buildContextPackPrompt(challengeType: string | undefined, intent: ContextPackIntent): string {
  const copy = getCanvasArtifactCopy(challengeType)
  if (intent === 'build') {
    return `Use my Context Pack and current canvas together. Update the ${copy.artifact} with the next missing ${copy.buildTarget}. Keep the canvas changes high-signal, then explain what changed in two sentences.`
  }
  if (intent === 'stress') {
    return `Stress-test my Context Pack against the current ${copy.artifact}. Find the most important unresolved ${copy.gapTarget} issue, and add a small canvas annotation or edit if it helps.`
  }
  return `Read my Context Pack like an interviewer. What is the one clarification that would most improve this ${copy.artifact}, and what should I change on the canvas after answering it?`
}

function buildContextFieldPrompt(challengeType: string | undefined, fieldLabel: string): string {
  const copy = getCanvasArtifactCopy(challengeType)
  return `Focus on the "${fieldLabel}" section of my Context Pack and compare it to the current canvas. Tell me what it implies for the ${copy.artifact}; if a small canvas update is clearly missing, make it.`
}

// extractNodeText / CopyablePre / codingMarkdownComponents moved to
// '@/components/challenge/markdownComponents' so the Solutions tab shares them.

// Single-document problem statement for technical challenge types (algorithm, sql,
// system_design, data_modeling). Renders the markdown body as one continuous document,
// LeetCode-style: section structure comes from the content's ## headings, styled as
// small-caps section headers. The narrative card stack (BriefSectionCard) stays for
// flow / quick_take scenario challenges.
const documentMarkdownComponents = {
  ...codingMarkdownComponents,
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h4 {...props} style={{
      fontFamily: 'var(--font-label)',
      fontSize: 11.5,
      fontWeight: 800,
      letterSpacing: '0.065em',
      textTransform: 'uppercase',
      color: 'var(--color-primary)',
      margin: '22px 0 10px',
      lineHeight: 1.3,
    }} />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h5 {...props} style={{ fontFamily: 'var(--font-headline)', fontSize: 14, fontWeight: 700, color: 'var(--color-on-surface)', margin: '16px 0 6px', lineHeight: 1.3 }} />
  ),
}

function ProblemDocument({ sections }: { sections: ChallengeBriefSection[] }) {
  const contextSections = sections.filter((s) => s.tone === 'context')
  const changeSections = sections.filter((s) => s.tone === 'change')
  const taskSections = sections.filter((s) => s.tone === 'task')
  const supportSections = sections.filter((s) => s.tone === 'support')

  return (
    <div>
      {/* The body as one continuous document; headings come from the content */}
      {contextSections.map((section) => (
        <div key={section.id} style={{ fontFamily: 'var(--font-body)', fontSize: 14.5, lineHeight: 1.72, color: 'var(--color-on-surface)' }}>
          <ReactMarkdown components={documentMarkdownComponents}>{section.body}</ReactMarkdown>
        </div>
      ))}

      {/* One-line destabilizing constraint (canvas) renders as an emphasis bar */}
      {changeSections.map((section) => (
        <div key={section.id} style={{
          borderLeft: '3px solid var(--color-tertiary)',
          padding: '6px 0 6px 12px',
          margin: '14px 0',
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          lineHeight: 1.6,
          fontWeight: 600,
          color: 'var(--color-on-surface)',
        }}>
          <ReactMarkdown components={documentMarkdownComponents}>{section.body}</ReactMarkdown>
        </div>
      ))}

      {/* Single highlighted task callout (canvas "What to draw" / "What to model") */}
      {taskSections.map((section) => (
        <section key={section.id} style={{
          marginTop: 16,
          background: 'var(--color-primary-container)',
          border: '1px solid rgba(74,124,89,0.28)',
          borderRadius: 14,
          padding: '14px 16px',
        }}>
          <div style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.065em',
            textTransform: 'uppercase',
            color: 'var(--color-primary)',
            marginBottom: 7,
            fontFamily: 'var(--font-label)',
          }}>
            {section.title}
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 14.5, lineHeight: 1.68, fontWeight: 650, color: 'var(--color-on-surface)' }}>
            <ReactMarkdown components={documentMarkdownComponents}>{section.body}</ReactMarkdown>
          </div>
        </section>
      ))}

      {/* Muted support footnote (tests/starter-code guidance) */}
      {supportSections.map((section) => (
        <div key={section.id} style={{
          marginTop: 14,
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          lineHeight: 1.6,
          color: 'var(--color-on-surface-variant)',
        }}>
          <ReactMarkdown components={documentMarkdownComponents}>{section.body}</ReactMarkdown>
        </div>
      ))}
    </div>
  )
}

function BriefSectionCard({ section }: { section: ChallengeBriefSection }) {
  const isTask = section.tone === 'task'
  const isSupport = section.tone === 'support'
  const bodyWeight = isTask ? 650 : 500
  const briefMarkdownComponents = {
    ...codingMarkdownComponents,
    p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
      <p {...props} style={{ fontFamily: 'var(--font-body)', fontSize: isTask ? 14.75 : 14.25, lineHeight: 1.68, fontWeight: bodyWeight, color: 'var(--color-on-surface)', margin: '0 0 10px' }} />
    ),
    ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
      <ul {...props} style={{ fontFamily: 'var(--font-body)', fontSize: isTask ? 14.75 : 14.25, lineHeight: 1.68, fontWeight: bodyWeight, color: 'var(--color-on-surface)', margin: '0 0 10px', paddingLeft: 22 }} />
    ),
    ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
      <ol {...props} style={{ fontFamily: 'var(--font-body)', fontSize: isTask ? 14.75 : 14.25, lineHeight: 1.68, fontWeight: bodyWeight, color: 'var(--color-on-surface)', margin: '0 0 10px', paddingLeft: 22 }} />
    ),
  }
  const background = isTask
    ? 'var(--color-primary-container)'
    : isSupport
      ? 'var(--color-surface-container-high)'
      : 'var(--color-surface-container-low)'
  const border = isTask
    ? '1px solid rgba(74,124,89,0.28)'
    : '1px solid var(--color-outline-variant)'

  return (
    <section
      style={{
        marginBottom: 14,
        background,
        border,
        borderRadius: 14,
        padding: '14px 16px',
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.065em',
          textTransform: 'uppercase',
          color: isTask ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
          marginBottom: 7,
          fontFamily: 'var(--font-label)',
        }}
      >
        {section.title}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: isTask ? 14.75 : 14.25,
          lineHeight: 1.68,
          color: 'var(--color-on-surface)',
          fontWeight: bodyWeight,
        }}
      >
        <ReactMarkdown components={briefMarkdownComponents}>
          {section.body}
        </ReactMarkdown>
      </div>
    </section>
  )
}

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
  confidence: number | null   // 0-3 index into CONF_LABELS, for the reveal calibration read
}

interface CompletionData {
  total_score: number
  max_score: number
  grade_label: string
  xp_awarded: number
  step_breakdown: Array<{ step: FlowStep; score: number; max_score: number }>
  competency_deltas: Array<{ competency: string; before: number; after: number }>
  step_signals?: Array<{ step: string; quality_label: string; hatch_signal: string | null; framework_hint: string | null; selected_option_id?: string | null }>
}

interface SessionRecord {
  attemptId: string | null
  challengeType?: string | null
  completedAt: Date
  gradeLabel: string
  totalScore: number
  maxScore: number
  xpAwarded: number
  stepResults: MirrorStepResult[]
  competencyDeltas: MirrorCompetencyDelta[]
  canvasPngUrl?: string | null
}

// Mirrors getGradeLabel() in coding-submit/route.ts so the optimistic history
// record shows the same label the server will return on refetch.
function scoreToGradeLabel(score: number): string {
  if (score >= 4.5) return 'best'
  if (score >= 3) return 'good'
  return 'surface'
}

type FlowWorkspaceProps =
  | { mode: 'api'; challengeId: string; challengeSlug?: string; initialRoleId: UserRoleV2; onExit?: () => void; onPaywall?: (data: { used: number; limit: number }) => void; fromPlan?: string; fromDomain?: string; nextChallengeSlug?: string; returnTo?: string }
  | { mode: 'adapter'; adapter: ChallengeAdapter; onComplete?: (data: AdapterCompletionData | null) => void; onExit?: () => void; fromPlan?: string; fromDomain?: string; nextChallengeSlug?: string; returnTo?: string }

// First-entry tour for the canvas workspace. Auto-fires once when a canvas
// challenge is interactive (desktop only), and on demand via 'start-canvas-tour'.
// Mirrors InterviewTourMount in live-interviews/[id]/page.tsx.
function CanvasTourMount({ active: canvasActive }: { active: boolean }) {
  const [run, setRun] = useState(false)
  const autoRef = useRef(false)

  useEffect(() => {
    if (autoRef.current || !canvasActive) return
    if (typeof window === 'undefined') return
    if (window.matchMedia('(max-width: 1023px)').matches) return // anchors are desktop layout
    if (canvasTourSeen()) return
    autoRef.current = true
    const t = window.setTimeout(() => {
      // Seed the cursor BEFORE activating — TourRunner no-ops when it is null.
      setCursor(CANVAS_TOUR.id, 0)
      setRun(true)
    }, 600)
    return () => window.clearTimeout(t)
  }, [canvasActive])

  useEffect(() => {
    const handler = () => {
      autoRef.current = true
      setCursor(CANVAS_TOUR.id, 0)
      setRun(true)
    }
    window.addEventListener('start-canvas-tour', handler)
    return () => window.removeEventListener('start-canvas-tour', handler)
  }, [])

  return <TourRunner config={CANVAS_TOUR} active={run} onFinish={() => setRun(false)} />
}

export function FlowWorkspace(props: FlowWorkspaceProps) {
  const isApiMode = props.mode === 'api'
  const challengeId = isApiMode ? props.challengeId : ''
  const challengeSlug = isApiMode ? ((props as Extract<FlowWorkspaceProps, { mode: 'api' }>).challengeSlug ?? challengeId) : ''
  const initialRoleId = isApiMode ? props.initialRoleId : 'engineer' as UserRoleV2
  const onPaywall = isApiMode ? (props as Extract<FlowWorkspaceProps, { mode: 'api' }>).onPaywall : undefined
  const fromPlan = props.fromPlan
  const fromDomain = props.fromDomain
  const nextChallengeSlug = props.nextChallengeSlug
  const nextChallengeHref = (() => {
    if (!nextChallengeSlug) return null
    // Carry the origin (plan / domain / returnTo) onto the next challenge so its
    // breadcrumb trail and side index panel stay in the same context instead of
    // silently resetting to generic Practice.
    const qs = new URLSearchParams()
    if (fromPlan) qs.set('from_plan', fromPlan)
    if (fromDomain) qs.set('from_domain', fromDomain)
    if (props.returnTo) qs.set('returnTo', props.returnTo)
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    return `/workspace/challenges/${nextChallengeSlug}${suffix}`
  })()

  // Declare step state first so it's available for the hook call below
  const [currentStep, setCurrentStep] = useState<FlowStep>('frame')

  // Always call hooks unconditionally (React rules of hooks)
  const { detail, loading: challengeLoading, error: challengeError, paywallData, startAttempt, reload } = useChallengeV2(challengeId)
  const { stepData, loading: stepLoading, submitting, error: stepError, clearStepData, loadStep, submitStep, fetchCoaching } = useFlowStep(challengeId, currentStep)

  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [completedSteps, setCompletedSteps] = useState<FlowStep[]>([])
  const [phase, setPhase] = useState<'loading' | 'question' | 'reveal' | 'complete'>('loading')

  // Per-question state
  const [questionIdx, setQuestionIdx] = useState(0)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([])
  const [reasoning, setReasoning] = useState('')
  const [elaboration, setElaboration] = useState('')
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

  // Per-step drafts: answers are held client-side and editable while the user
  // moves between a step's questions. Nothing is graded until the step is
  // submitted as a batch. Keyed by question id (stable across navigation).
  type QuestionDraft = {
    selectedOptionId: string | null
    selectedOptionIds: string[]
    reasoning: string
    confidence: number | null
  }
  const [stepDrafts, setStepDrafts] = useState<Record<string, QuestionDraft>>({})
  // Neutral between-questions acknowledgment ("Answer recorded, keep going").
  const [ackVisible, setAckVisible] = useState(false)
  const ackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Canvas / interview challenge state
  const [canvasMaximised, setCanvasMaximised] = useState(false)
  const [canvasLoopExpanded, setCanvasLoopExpanded] = useState(false)
  const [codingMaximised, setCodingMaximised] = useState(false)
  const [editorHeightPct, setEditorHeightPct] = useState(60)
  const [chatPanelOpen, setChatPanelOpen] = useState(false)
  const [queuedHatchPrompt, setQueuedHatchPrompt] = useState<QueuedHatchPrompt | null>(null)
  const [hintForceOpen, setHintForceOpen] = useState(false)
  const [interviewGrade, setInterviewGrade] = useState<InterviewGrade | null>(null)
  const [submittedCanvasPngUrl, setSubmittedCanvasPngUrl] = useState<string | null>(null)
  const [historyInterviewGrade, setHistoryInterviewGrade] = useState<InterviewGrade | null>(null)
  const [historyCodingFeedback, setHistoryCodingFeedback] = useState<GradingFeedback | null>(null)
  const [historyCodingCorrectness, setHistoryCodingCorrectness] = useState<RunResult | null>(null)
  const [historyCodingLanguage, setHistoryCodingLanguage] = useState<SupportedLanguage | null>(null)
  const [historySubmittedCode, setHistorySubmittedCode] = useState<string | null>(null)
  const [historyGradeLoading, setHistoryGradeLoading] = useState(false)
  // Cache /api/attempts/[id]/grade payloads by attemptId so re-clicking a past
  // submission is instant (no spinner, no refetch). Only canvas/coding attempts
  // ever populate this — FLOW renders from sessionHistory.stepResults directly.
  const historyGradeCacheRef = useRef<Map<string, {
    grade?: InterviewGrade | GradingFeedback | null
    challengeType?: string | null
    code?: string | null
    language?: SupportedLanguage | null
    correctness?: RunResult | null
  }>>(new Map())
  const [canvasScene, setCanvasScene] = useState<{ elements: unknown[]; appState: unknown } | null>(null)
  const [contextPackOpen, setContextPackOpen] = useState(true)
  const [contextPack, setContextPack] = useState<ContextPackState>(EMPTY_CONTEXT_PACK_FIELDS)
  const [isSubmittingInterview, setIsSubmittingInterview] = useState(false)
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const contextPackRef = useRef<HTMLDivElement>(null)

  // Coding challenge state
  const [currentCode, setCurrentCode] = useState('')
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('python')
  // 2-level draft map: 'default' key for single-prompt, or partId key for multi-part
  const [codingDrafts, setCodingDrafts] = useState<Record<string, Partial<Record<SupportedLanguage, string>>>>({})
  // Ref mirror of codingDrafts so language/part switch handlers can read the
  // freshest drafts synchronously. Reading the codingDrafts state variable in
  // the same tick as a setCodingDrafts call sees the stale value, which silently
  // dropped the buffer the user just wrote when switching language or part.
  const codingDraftsRef = useRef(codingDrafts)
  useEffect(() => { codingDraftsRef.current = codingDrafts }, [codingDrafts])
  // Tracks which attempt id we've already hydrated drafts for. Keyed to the
  // ATTEMPT, not the challenge: "Try Again" starts a fresh attempt on the same
  // challenge, so a challenge-id guard would never re-run and would bleed the
  // previous attempt's draft into the new one.
  const didHydrateDraftRef = useRef<string | null>(null)
  const [outputPanelStatus, setOutputPanelStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [outputPanelError, setOutputPanelError] = useState<string | undefined>(undefined)
  const [lastRunResult, setLastRunResult] = useState<RunResult | null>(null)
  const [codingFeedback, setCodingFeedback] = useState<GradingFeedback | null>(null)
  const [isSubmittingCoding, setIsSubmittingCoding] = useState(false)
  const [isLoadingGrading, setIsLoadingGrading] = useState(false)
  const [codingGradingError, setCodingGradingError] = useState<string | undefined>(undefined)
  const codingAutosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Multi-part coding state
  const [activePartId, setActivePartId] = useState<string | null>(null)
  // Map of partId → per-part run result (for status chips in collapsed rail)
  const [partRunResults, setPartRunResults] = useState<Record<string, RunResult>>({})
  // Map of partId → { submitted, score } for submitted parts
  const [partSubmissions, setPartSubmissions] = useState<Record<string, { submitted: boolean; score?: number }>>({})
  // MCQ selected answers per part: partId → selectedOptionId
  const [partMcqSelections, setPartMcqSelections] = useState<Record<string, string>>({})
  // MCQ revealed options per part (after submit)
  const [partMcqRevealed, setPartMcqRevealed] = useState<Record<string, boolean>>({})
  // Finalize result
  const [finalizeResult, setFinalizeResult] = useState<{
    weighted_total?: number
    weighted_score?: number
    max_score?: number
    score_breakdown?: GradingFeedback['score_breakdown']
    summary?: string
    next_actions?: string[]
    parts?: Array<{ id?: string; part_id?: string; title?: string; score?: number; weight?: number }>
  } | null>(null)
  const [finalizeError, setFinalizeError] = useState<string | null>(null)
  const [isFinalizingParts, setIsFinalizingParts] = useState(false)

  // Left panel collapse state - persisted to localStorage
  const [leftCollapsed, setLeftCollapsed] = useState(false)

  // Mobile (phone) layout. On phones the desktop two-pane split is replaced by a
  // vertical stack; the description becomes a collapsible top drawer (collapsed
  // by default so the question is visible first).
  // Use the stacked single-column layout through the TABLET range (≤1023px), not
  // just phones. The desktop two-pane chrome (left description panel + right
  // answer panel + centered FLOW stepper + the Description/Discussions/Submissions
  // tab row) needs ≥1024px; at 768px it collided ("Frame" sitting on the tab row).
  const isMobile = useIsMobile('(max-width: 1023px)')
  const [mobileDescOpen, setMobileDescOpen] = useState(false)

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

  // Hatch message state
  const [hatchMessage, setHatchMessage] = useState('Ready when you are. Pick the option that fits best.')
  const [hatchState, setHatchState] = useState<'idle' | 'listening' | 'reviewing' | 'speaking'>('idle')
  const hatchCtx = useHatchContext()
  const emitHatchCue = hatchCtx?.emitCue
  const activeHatchCue = hatchCtx?.activeCue
  const { play: playHatchSound } = useHatchSonics()

  // Sync local hatch state to FloatingHatch context
  const setHatch = useCallback((msg: string, s: 'idle' | 'listening' | 'reviewing' | 'speaking') => {
    setHatchMessage(msg)
    setHatchState(s)
    hatchCtx?.setHatch(msg, s)
  }, [hatchCtx])

  // GSAP workspace ref for session-start animation
  const workspaceRef = useRef<HTMLDivElement>(null)

  // Refs for option-select reveal animation
  const confidenceCardRef = useRef<HTMLDivElement>(null)
  const reasoningCardRef = useRef<HTMLTextAreaElement>(null)

  // Resizable panel state - left panel width as percentage of container
  const [leftWidth, setLeftWidth] = useState(30)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragCleanupRef = useRef<(() => void) | null>(null)

  // Load leftWidth + leftCollapsed from localStorage on challenge load
  useEffect(() => {
    if (!challengeId) return
    try {
      const stored = localStorage.getItem(`flowworkspace:${challengeId}`)
      if (stored) {
        const parsed = JSON.parse(stored) as { leftWidth?: number; leftCollapsed?: boolean }
        if (typeof parsed.leftWidth === 'number') setLeftWidth(parsed.leftWidth)
        if (typeof parsed.leftCollapsed === 'boolean') setLeftCollapsed(parsed.leftCollapsed)
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challengeId])

  // Persist leftWidth + leftCollapsed to localStorage on change
  useEffect(() => {
    if (!challengeId) return
    try {
      localStorage.setItem(`flowworkspace:${challengeId}`, JSON.stringify({ leftWidth, leftCollapsed }))
    } catch { /* ignore */ }
  }, [challengeId, leftWidth, leftCollapsed])

  // Left description tab state
  const [leftTab, setLeftTab] = useState<'Description' | 'Discussions' | 'Submissions' | 'Solutions'>('Description')

  // Helper: true for interview challenge types that use canvas/coding instead of MCQ
  // Canvas and coding challenges are only supported in API mode; adapter mode always returns false
  const apiChallengeType = isApiMode ? detail?.challenge?.challenge_type : undefined
  const isCanvasChallenge = apiChallengeType === 'system_design' || apiChallengeType === 'data_modeling'
  const isCodingChallenge = apiChallengeType === 'sql' || apiChallengeType === 'algorithm'
  // Either canvas or coding - both are full-panel interview modes (no MCQ FLOW steps)
  const isInterviewChallenge = isCanvasChallenge || isCodingChallenge

  // On a phone, FLOW/MCQ challenges stack vertically. Canvas/coding challenges
  // are gated to a "best on desktop" notice instead (see Fork C below).
  const mobileStacked = isMobile && !isInterviewChallenge

  const openContextPack = useCallback(() => {
    setLeftTab('Description')
    setLeftCollapsed(false)
    setContextPackOpen(true)
    window.setTimeout(() => {
      contextPackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 0)
  }, [])

  // Discussions tab state
  const [discussions, setDiscussions] = useState<ChallengeDiscussion[]>([])
  const [discussionsLoading, setDiscussionsLoading] = useState(false)
  const [discussionsLoaded, setDiscussionsLoaded] = useState(false)

  // Solutions tab state (lazy-loaded on first tab open, like discussions)
  const [solution, setSolution] = useState<SolutionTabResponse | null>(null)
  const [solutionLoading, setSolutionLoading] = useState(false)
  const [solutionLoaded, setSolutionLoaded] = useState(false)
  const [activeApproachId, setActiveApproachId] = useState<string | null>(null)
  const solutionGenerateTriggeredRef = useRef(false)
  const solutionStateRef = useRef<SolutionTabResponse | null>(null)
  const [upvoted, setUpvoted] = useState<Set<string>>(new Set())
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  // True once the Supabase session can no longer be refreshed (refresh token
  // expired / signed out). Drives an inline "session timed out" prompt instead
  // of letting the next 401 bubble into the app error boundary.
  const [sessionExpired, setSessionExpired] = useState(false)

  const deriveDiscussionUpvotes = useCallback((items: ChallengeDiscussion[], userId: string | null) => {
    if (!userId) return new Set<string>()
    return new Set(
      items
        .filter(d => d.viewer_has_upvoted || (Array.isArray(d.upvoted_by) && d.upvoted_by.includes(userId)))
        .map(d => d.id)
    )
  }, [])

  const applyDiscussionUpvoteState = useCallback((
    discussion: ChallengeDiscussion,
    userId: string | null,
    isUpvoted: boolean
  ): ChallengeDiscussion => {
    if (!userId) return discussion
    const previous = Array.isArray(discussion.upvoted_by) ? discussion.upvoted_by : []
    const next = isUpvoted
      ? Array.from(new Set([...previous, userId]))
      : previous.filter(id => id !== userId)

    return { ...discussion, upvoted_by: next, viewer_has_upvoted: isUpvoted }
  }, [])

  // Session history for Submissions tab
  const [sessionHistory, setSessionHistory] = useState<SessionRecord[]>([])
  const [selectedHistoryIdx, setSelectedHistoryIdx] = useState<number | null>(null)
  const [submissionsLoaded, setSubmissionsLoaded] = useState(false)
  const [submissionsLoading, setSubmissionsLoading] = useState(false)
  const [submissionsCount, setSubmissionsCount] = useState(0)

  // Load the persisted feedback payload when a history record is selected.
  // FLOW attempts have no interview_grades/test_results row, so the grade
  // endpoint always 404s for them — their detail renders from the in-memory
  // sessionHistory record instead. Only canvas/coding attempts need the fetch,
  // and once fetched the payload is cached so re-clicking a row is instant.
  useEffect(() => {
    if (selectedHistoryIdx === null) {
      setHistoryInterviewGrade(null)
      setHistoryCodingFeedback(null)
      setHistoryCodingCorrectness(null)
      setHistoryCodingLanguage(null)
      setHistorySubmittedCode(null)
      setHistoryGradeLoading(false)
      return
    }
    const record = sessionHistory[selectedHistoryIdx]
    if (!record?.attemptId) return

    const applyGrade = (data: {
      grade?: InterviewGrade | GradingFeedback | null
      challengeType?: string | null
      code?: string | null
      language?: SupportedLanguage | null
      correctness?: RunResult | null
    } | null) => {
      const historyChallengeType = data?.challengeType ?? record.challengeType ?? apiChallengeType ?? null
      if (historyChallengeType === 'sql' || historyChallengeType === 'algorithm') {
        setHistoryCodingFeedback((data?.grade as GradingFeedback | null) ?? null)
        setHistoryCodingCorrectness(data?.correctness ?? null)
        setHistoryCodingLanguage(data?.language ?? null)
        setHistorySubmittedCode(data?.code ?? null)
        setHistoryInterviewGrade(null)
      } else if (data?.grade) {
        setHistoryInterviewGrade(data.grade as InterviewGrade)
        setHistoryCodingFeedback(null)
        setHistoryCodingCorrectness(null)
        setHistoryCodingLanguage(null)
        setHistorySubmittedCode(null)
      } else {
        setHistoryInterviewGrade(null)
        setHistoryCodingFeedback(null)
        setHistoryCodingCorrectness(null)
        setHistoryCodingLanguage(null)
        setHistorySubmittedCode(null)
      }
    }

    // FLOW (and any non-canvas/non-coding type): no persisted grade row to load.
    // Render directly from sessionHistory; skip the guaranteed-404 round-trip.
    const recordType = record.challengeType ?? apiChallengeType ?? null
    const needsGradeFetch = recordType === 'sql' || recordType === 'algorithm'
      || recordType === 'system_design' || recordType === 'data_modeling'
    if (!needsGradeFetch) {
      setHistoryGradeLoading(false)
      applyGrade(null)
      return
    }

    // Cache hit — show the detail instantly, no spinner.
    const cached = historyGradeCacheRef.current.get(record.attemptId)
    if (cached) {
      setHistoryGradeLoading(false)
      applyGrade(cached)
      return
    }

    let cancelled = false
    setHistoryGradeLoading(true)
    setHistoryInterviewGrade(null)
    setHistoryCodingFeedback(null)
    setHistoryCodingCorrectness(null)
    setHistoryCodingLanguage(null)
    setHistorySubmittedCode(null)
    fetch(`/api/attempts/${record.attemptId}/grade`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: {
        grade?: InterviewGrade | GradingFeedback | null
        challengeType?: string | null
        code?: string | null
        language?: SupportedLanguage | null
        correctness?: RunResult | null
      } | null) => {
        if (data) historyGradeCacheRef.current.set(record.attemptId!, data)
        if (!cancelled) applyGrade(data)
      })
      .catch(() => { /* leave null - render handles empty state */ })
      .finally(() => { if (!cancelled) setHistoryGradeLoading(false) })
    return () => { cancelled = true }
  }, [apiChallengeType, selectedHistoryIdx, sessionHistory])

  // Load past completed attempts for this challenge from the DB. Reusable so it
  // can run on mount AND after each submit (server-truth reconciliation of the
  // optimistic record). CRITICAL: on a non-OK response or network failure, leave
  // the existing sessionHistory untouched — never wipe it to [] — so a transient
  // /api/attempts error right after a submit can't erase the record the user
  // just made.
  const loadSubmissionHistory = useCallback(async () => {
    if (!isApiMode || !challengeId) return
    setSubmissionsLoading(true)
    let rows: Array<{
      id: string
      challenge_id: string
      challenge_type: string | null
      grade_label: string | null
      score: number | null
      max_score: number | null
      submitted_at: string | null
      canvas_png_url?: string | null
      feedback_json: {
        step_breakdown?: Array<{ step: string; score: number; max_score: number }>
        step_signals?: Array<{ step: string; quality_label: string; hatch_signal: string | null; framework_hint: string | null; selected_option_id?: string | null }>
        competency_deltas?: Array<{ competency: string; before: number; after: number; delta?: number }>
        xp_awarded?: number
        total_score?: number
        max_score?: number
      } | null
    }>
    try {
      const res = await fetch(`/api/attempts?limit=20&summary=1&challenge_id=${encodeURIComponent(challengeId)}`)
      if (!res.ok) { setSubmissionsLoading(false); return } // preserve existing history on 401/5xx
      rows = await res.json()
    } catch {
      setSubmissionsLoading(false)
      return // preserve existing history on network failure
    }
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
            hatchSignal: sig?.hatch_signal ?? null,
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
          challengeType: r.challenge_type ?? apiChallengeType ?? null,
          completedAt: r.submitted_at ? new Date(r.submitted_at) : new Date(),
          gradeLabel: r.grade_label ?? '',
          totalScore: fb?.total_score ?? r.score ?? 0,
          maxScore: fb?.max_score ?? r.max_score ?? 3,
          xpAwarded: fb?.xp_awarded ?? 0,
          stepResults,
          competencyDeltas,
          canvasPngUrl: (r.canvas_png_url as string | null) ?? null,
        }
      })
    setSessionHistory(past)
    setSubmissionsLoaded(true)
    setSubmissionsLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isApiMode, challengeId, challengeSlug])

  // Lazy-load submission history on first Submissions-tab open, so it stays off
  // the workspace mount critical path (mirrors Discussions/Solutions). Post-submit
  // reconciliation still calls loadSubmissionHistory directly.
  useEffect(() => {
    if (leftTab === 'Submissions' && !submissionsLoaded && !submissionsLoading) {
      void loadSubmissionHistory()
    }
  }, [leftTab, submissionsLoaded, submissionsLoading, loadSubmissionHistory])

  // Cheap count for the Submissions tab pill — a head-only count query, no
  // feedback_json payload — so the pill can show the prior-attempt count on
  // mount without eagerly loading the full (heavy) history. When the count is
  // non-zero we ALSO warm the full history in the background (idle-scheduled,
  // off the mount critical path) so the first Submissions-tab open is instant
  // instead of flashing a skeleton while the list loads.
  useEffect(() => {
    if (!isApiMode || !challengeId) return
    let cancelled = false
    fetch(`/api/attempts?challenge_id=${encodeURIComponent(challengeId)}&count=1`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { count?: number } | null) => {
        if (cancelled || typeof d?.count !== 'number') return
        setSubmissionsCount(d.count)
        if (d.count > 0 && !submissionsLoaded && !submissionsLoading) {
          const warm = () => { if (!cancelled) void loadSubmissionHistory() }
          // Defer so it never competes with first paint or the active question.
          const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback
          if (typeof ric === 'function') ric(warm, { timeout: 1500 })
          else setTimeout(warm, 600)
        }
      })
      .catch(() => { /* pill just stays hidden on failure */ })
    return () => { cancelled = true }
    // submissionsLoaded/Loading are read for the warm guard but intentionally
    // excluded from deps — this effect should run once per challenge on mount,
    // and loadSubmissionHistory's own guards prevent a duplicate fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isApiMode, challengeId])

  // Tab pill count: the loaded history is authoritative once present; before
  // that (and before the tab is opened) fall back to the cheap mount count.
  const submissionBadgeCount = Math.max(sessionHistory.length, submissionsCount)

  // Optimistically prepend a just-completed submission to the history list,
  // deduped by attemptId (a re-submit reuses the same attempt row). Used by the
  // coding + canvas submit handlers; the FLOW path has its own inline push.
  const recordSubmission = useCallback((record: SessionRecord) => {
    setSessionHistory(prev => {
      const withoutDupe = prev.filter(r => r.attemptId !== record.attemptId)
      return [record, ...withoutDupe]
    })
    setSelectedHistoryIdx(0)
  }, [])

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

  // Vertical drag handler for the Monaco/Output divider in coding workspace.
  const codingPaneRef = useRef<HTMLDivElement>(null)
  const handleCodingDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const pane = codingPaneRef.current
    if (!pane) return

    const onMouseMove = (ev: MouseEvent) => {
      const rect = pane.getBoundingClientRect()
      const pct = ((ev.clientY - rect.top) / rect.height) * 100
      setEditorHeightPct(Math.max(20, Math.min(80, pct)))
    }

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      document.body.style.cursor = ''
      dragCleanupRef.current = null
    }

    document.body.style.cursor = 'ns-resize'
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    dragCleanupRef.current = onMouseUp
  }, [])

  useEffect(() => {
    return () => { dragCleanupRef.current?.() }
  }, [])

  // Structured scene for the chat panel + nudge endpoint + grader
  const scene: CanvasScene = useMemo(
    () => summarizeScene(canvasScene?.elements ?? []),
    [canvasScene]
  )
  const contextPackText = useMemo(() => formatContextPack(contextPack), [contextPack])
  const contextPackFieldCount = contextPack.filter((field) => field.value.trim().length > 0).length

  // Single source of truth for the draw → notes → ask → submit phase. Consumed
  // by the coach card, readiness meter, and Hatch opener (later tasks).
  const guidance = useCanvasGuidance({
    challengeType: apiChallengeType === 'data_modeling' ? 'data_modeling' : 'system_design',
    scene,
    fields: contextPack,
  })

  // Excalidraw API + library refs (for canvas action execution)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const excalidrawApiRef = useRef<any>(null)
  const canvasExportRef = useRef<(() => Promise<Blob | null>) | null>(null)
  const libraryItemsRef = useRef<Array<{ id: string; name?: string; elements: unknown[] }>>([])

  const handleCanvasActions = useCallback(async (response: { message: string; actions: unknown[] }) => {
    if (!excalidrawApiRef.current) return
    const actions = Array.isArray(response.actions) ? response.actions : []
    if (actions.length === 0) return
    try {
      const result = await executeActions(
        actions as CanvasAction[],
        excalidrawApiRef.current,
        libraryItemsRef.current,
        apiChallengeType ?? undefined
      )
      if (!result.ok || result.failed > 0) {
        setCanvasDrawFailure({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          text: "I couldn't finish that diagram cleanly. Want me to try again, or break it into smaller pieces?",
        })
      }
    } catch {
      // executeActions is internally hardened and shouldn't throw, but never
      // let a canvas draw take down the workspace.
      setCanvasDrawFailure({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        text: "I couldn't finish that diagram cleanly. Want me to try again, or break it into smaller pieces?",
      })
    }
  }, [apiChallengeType])

  const queueHatchPrompt = useCallback((text: string, autoSend = true) => {
    setChatPanelOpen(true)
    setQueuedHatchPrompt({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      text,
      autoSend,
    })
  }, [])

  // Drop the starter skeleton onto the canvas from the branded empty-state.
  // Reuses the same executeActions path Hatch uses, so the layout engine places
  // and connects the boxes; the empty-state un-mounts as soon as elements land.
  const handleUseTemplate = useCallback(() => {
    if (apiChallengeType !== 'system_design' && apiChallengeType !== 'data_modeling') return
    handleCanvasActions({
      message: 'starter template',
      actions: canvasStarterTemplate(apiChallengeType),
    })
  }, [apiChallengeType, handleCanvasActions])

  // Seed type-specific default field labels when challenge type is known
  useEffect(() => {
    if (!isCanvasChallenge) return
    setContextPack((prev) => {
      const seeded = buildDefaultContextPackFields(apiChallengeType)
      // Preserve any values already typed; update only label/helper/placeholder for defaults
      return seeded.map((seededField) => {
        const existing = prev.find((f) => f.id === seededField.id && !f.removable)
        return existing ? { ...seededField, value: existing.value } : seededField
      }).concat(prev.filter((f) => f.removable))
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiChallengeType, isCanvasChallenge])

  // Canvas blank-state paralysis fix: the Hatch dock auto-opens the first time a
  // user lands on a canvas challenge via CanvasChatPanel's autoOpenKey below (the
  // dock owns its open state through useHatchDockState, so setChatPanelOpen can't
  // drive it). One-shot, so a later collapse sticks.

  useEffect(() => {
    function handleOpenWorkspaceHatch(event: Event) {
      if (isInterviewChallenge) {
        const detail = (event as CustomEvent<{ cue?: { message?: string } }>).detail
        const prompt = detail?.cue?.message
          ? `Help me with this: ${detail.cue.message}`
          : "I'm stuck. Give me one useful nudge."
        queueHatchPrompt(prompt, false)
        return
      }
      setHintOpen(true)
    }

    window.addEventListener('open-hatch-workspace', handleOpenWorkspaceHatch)
    return () => window.removeEventListener('open-hatch-workspace', handleOpenWorkspaceHatch)
  }, [isInterviewChallenge, queueHatchPrompt])

  // Load library once API is ready, capture items for the executor
  useEffect(() => {
    if (!excalidrawApiRef.current) return
    fetch('/excalidraw-libraries/bundled-library.json')
      .then((r) => r.json())
      .then((lib) => {
        libraryItemsRef.current = lib.libraryItems ?? []
      })
      .catch(() => { /* non-fatal */ })
  }, [])

  // Proactive nudge state
  const [proactiveNudge, setProactiveNudge] = useState<{ id: string; text: string } | null>(null)
  const lastNudgeAtRef = useRef<number>(0)

  // Surfaces a graceful Hatch chat message when a canvas draw could not be
  // fully applied (instead of crashing to the error boundary).
  const [canvasDrawFailure, setCanvasDrawFailure] = useState<{ id: string; text: string } | null>(null)
  const nudgeCountRef = useRef<number>(0)
  const pendingDeltaRef = useRef<number>(0)
  const nudgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const chatPanelOpenRef = useRef(chatPanelOpen)
  const lastWorkspaceProgressRef = useRef(Date.now())
  const lastWorkspaceCueRef = useRef(0)

  useEffect(() => {
    chatPanelOpenRef.current = chatPanelOpen
  }, [chatPanelOpen])

  const requestNudge = useCallback(async (added: number) => {
    if (!isCanvasChallenge || !attemptId) return
    pendingDeltaRef.current += added
    if (nudgeTimerRef.current) clearTimeout(nudgeTimerRef.current)
    // Wait 4s after the last add - if user keeps drawing, we keep waiting.
    nudgeTimerRef.current = setTimeout(async () => {
      const delta = pendingDeltaRef.current
      pendingDeltaRef.current = 0
      try {
        const res = await fetch('/api/hatch/canvas/nudge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scene,
            recentDelta: { added: delta },
            challengeId: isApiMode ? (props as Extract<FlowWorkspaceProps, { mode: 'api' }>).challengeId : '',
            challengeType: apiChallengeType,
            attemptId,
            lastNudgeAt: lastNudgeAtRef.current || undefined,
            nudgeCount: nudgeCountRef.current,
          }),
        })
        if (!res.ok) return
        const data = (await res.json()) as { nudge: string | null }
        if (data.nudge) {
          lastNudgeAtRef.current = Date.now()
          nudgeCountRef.current += 1
          if (chatPanelOpenRef.current) {
            setProactiveNudge({ id: `n-${Date.now()}`, text: data.nudge })
          }
          emitHatchCue?.({
            id: `canvas-nudge-${Date.now()}`,
            surface: 'workspace',
            message: data.nudge,
            state: 'intrigued',
            animation: 'nudging',
            target: 'workspace-hatch-chat',
            source: 'nudge',
            priority: 6,
            cooldownKey: `canvas-nudge:${attemptId}`,
            cta: { label: 'Open Hatch', action: 'open-workspace-chat' },
          }, { force: true })
        }
      } catch { /* swallow */ }
    }, 4000)
  // chatPanelOpen intentionally excluded - we only want the snapshot at fire time, not retriggers
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCanvasChallenge, attemptId, scene, apiChallengeType, isApiMode, props, emitHatchCue])

  useEffect(() => {
    lastWorkspaceProgressRef.current = Date.now()
  }, [
    activePartId,
    canvasScene,
    confidence,
    contextPackText,
    currentCode,
    currentLanguage,
    currentStep,
    lastRunResult,
    phase,
    questionIdx,
    reasoning,
    selectedOptionId,
  ])

  useEffect(() => {
    if (!emitHatchCue || phase !== 'question') return

    const timer = window.setInterval(() => {
      if (activeHatchCue) return
      const now = Date.now()
      if (now - lastWorkspaceProgressRef.current < 90_000) return
      if (now - lastWorkspaceCueRef.current < 120_000) return

      lastWorkspaceCueRef.current = now
      const workspaceKind = isCanvasChallenge
        ? apiChallengeType === 'data_modeling' ? 'data model' : 'system design'
        : isCodingChallenge ? 'code' : 'answer'
      const target = isInterviewChallenge ? 'workspace-hatch-chat' : 'workspace-answer-area'
      const cta = isInterviewChallenge
        ? { label: 'Open Hatch', action: 'open-workspace-chat' as const }
        : { label: 'Show a hint', action: 'open-workspace-chat' as const }

      emitHatchCue({
        surface: 'workspace',
        message: `Stuck on your ${workspaceKind}? I can give you a hint.`,
        state: 'intrigued',
        animation: 'stuck-check',
        target,
        source: 'workspace',
        priority: 5,
        cooldownKey: `workspace-stuck:${attemptId ?? challengeId}`,
        cta,
      })
    }, 10_000)

    return () => window.clearInterval(timer)
  }, [
    activeHatchCue,
    apiChallengeType,
    attemptId,
    challengeId,
    emitHatchCue,
    isCanvasChallenge,
    isCodingChallenge,
    isInterviewChallenge,
    phase,
  ])

  // Autosave canvas snapshot and Context Pack every 10s when changed
  useEffect(() => {
    if (!isCanvasChallenge || !attemptId || (!canvasScene && !contextPackText)) return
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)
    autosaveTimerRef.current = setTimeout(async () => {
      try {
        await fetch('/api/hatch/session/autosave', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attemptId,
            draftSnapshot: {
              type: 'canvas',
              ...(canvasScene ?? { elements: [], appState: {} }),
              context_pack: contextPackText || null,
              context_pack_fields: contextPack,
            },
            updatedAt: new Date().toISOString(),
          }),
        })
      } catch { /* fire and forget */ }
    }, 10000)
    return () => { if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current) }
  }, [canvasScene, contextPack, contextPackText, isCanvasChallenge, attemptId])

  // Autosave coding drafts every 10s when currentCode changes
  useEffect(() => {
    if (!isCodingChallenge || !attemptId || !currentCode) return
    if (codingAutosaveTimerRef.current) clearTimeout(codingAutosaveTimerRef.current)
    codingAutosaveTimerRef.current = setTimeout(async () => {
      try {
        // Merge over ALL existing buckets (codingDraftsRef is the freshest copy)
        // so multi-part challenges don't lose other parts' code on each save.
        // Write the current code into the active part's bucket.
        const partKey = activePartId ?? 'default'
        const mergedDrafts = {
          ...codingDraftsRef.current,
          [partKey]: { ...(codingDraftsRef.current[partKey] ?? {}), [currentLanguage]: currentCode },
        }
        await fetch('/api/hatch/session/autosave', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attemptId,
            draftSnapshot: {
              type: apiChallengeType ?? 'coding',
              language: currentLanguage,
              drafts: mergedDrafts,
            },
            updatedAt: new Date().toISOString(),
          }),
        })
      } catch { /* fire and forget */ }
    }, 10000)
    return () => { if (codingAutosaveTimerRef.current) clearTimeout(codingAutosaveTimerRef.current) }
  }, [currentCode, currentLanguage, isCodingChallenge, attemptId, activePartId, apiChallengeType])

  // Autosave MCQ FLOW step drafts every 8s when they change. Without this a
  // refresh or expired session mid-step silently wipes the user's in-progress
  // answers (the batch submit only persists on full-step completion). Keyed by
  // step so navigating to a new step doesn't clobber earlier steps' drafts.
  const flowAutosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const coachTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (isInterviewChallenge || !isApiMode || !attemptId) return
    if (Object.keys(stepDrafts).length === 0) return
    if (flowAutosaveTimerRef.current) clearTimeout(flowAutosaveTimerRef.current)
    flowAutosaveTimerRef.current = setTimeout(async () => {
      try {
        await fetch('/api/hatch/session/autosave', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attemptId,
            draftSnapshot: {
              type: 'flow',
              step: currentStep,
              questionIdx,
              stepDrafts,
            },
            updatedAt: new Date().toISOString(),
          }),
        })
      } catch { /* fire and forget */ }
    }, 8000)
    return () => { if (flowAutosaveTimerRef.current) clearTimeout(flowAutosaveTimerRef.current) }
  }, [stepDrafts, questionIdx, currentStep, isInterviewChallenge, isApiMode, attemptId])

  // Pick the right default language for coding challenges:
  // - SQL challenges (have sql_schema) → 'sql'
  // - Otherwise honour metadata.supported_languages, falling back to 'python'
  // Runs once per challenge load (id change), before the starter_code effect below.
  useEffect(() => {
    if (!isCodingChallenge || !detail?.challenge?.metadata) return
    const meta = detail.challenge.metadata as {
      sql_schema?: unknown
      supported_languages?: SupportedLanguage[]
    }
    if (apiChallengeType === 'sql' || meta.sql_schema) {
      setCurrentLanguage('sql')
      return
    }
    const supported = meta.supported_languages
    if (supported && supported.length > 0 && !supported.includes(currentLanguage)) {
      setCurrentLanguage(supported[0])
    }
  // Intentionally omit currentLanguage from deps - would loop on every change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail?.challenge?.id, isCodingChallenge])

  // Initialize currentCode when the challenge loads / language flips. Prefer the
  // in-memory draft (codingDraftsRef) over the starter, so a hydrated or
  // in-progress draft survives a language switch. The hydration effect below
  // populates the ref from draft_snapshot, and clears it for fresh attempts, so
  // the starter is only used when there's genuinely no saved code.
  useEffect(() => {
    if (!isCodingChallenge || !detail?.challenge) return
    const metadata = detail.challenge.metadata as { starter_code?: Record<string, string> } | null | undefined
    const starterCode = metadata?.starter_code?.[currentLanguage] ?? ''
    const partKey = activePartId ?? 'default'
    const draft = codingDraftsRef.current[partKey]?.[currentLanguage]
    setCurrentCode(draft ?? starterCode)
    // Open chat panel by default for coding challenges
    setChatPanelOpen(true)
  // Only run when challenge first loads (detail.challenge.id changes) or language flips
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail?.challenge?.id, isCodingChallenge, currentLanguage])

  // Hydrate coding drafts from the persisted draft_snapshot once per attempt.
  // Keyed to the attempt id: "Try Again" reuses the same challenge but a new
  // attempt, so this re-runs and either restores that attempt's snapshot or
  // clears the ref so the starter shows (no stale bleed from the prior attempt).
  useEffect(() => {
    if (!isCodingChallenge || !detail?.challenge) return
    const attemptKey = detail.current_attempt?.id ?? attemptId
    if (!attemptKey || didHydrateDraftRef.current === attemptKey) return

    const snap = detail.current_attempt?.draft_snapshot as
      | { type?: string; language?: string; drafts?: Record<string, Partial<Record<SupportedLanguage, string>>> }
      | undefined

    if (snap?.drafts && Object.keys(snap.drafts).length > 0) {
      // Restore saved drafts for this attempt.
      codingDraftsRef.current = snap.drafts
      setCodingDrafts(snap.drafts)
      const supported: SupportedLanguage[] = ['python', 'javascript', 'java', 'cpp', 'go', 'sql']
      const savedLang = snap.language as SupportedLanguage | undefined
      const normLang = savedLang && supported.includes(savedLang) ? savedLang : currentLanguage
      if (normLang !== currentLanguage) setCurrentLanguage(normLang)
      const partKey = activePartId ?? 'default'
      const metadata = detail.challenge.metadata as { starter_code?: Record<string, string> } | null | undefined
      const saved = snap.drafts[partKey]?.[normLang]
      setCurrentCode(saved ?? metadata?.starter_code?.[normLang] ?? '')
    } else {
      // Fresh attempt with no saved draft: clear any ref left over from a prior
      // attempt AND reset the editor to starter. The starter-init effect doesn't
      // re-run on attempt changes, so without this a same-challenge "Try Again"
      // would keep the previous attempt's editor text (and autosave it).
      codingDraftsRef.current = {}
      setCodingDrafts({})
      const metadata = detail.challenge.metadata as { starter_code?: Record<string, string> } | null | undefined
      setCurrentCode(metadata?.starter_code?.[currentLanguage] ?? '')
    }

    didHydrateDraftRef.current = attemptKey
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail?.current_attempt?.id, attemptId, isCodingChallenge, detail?.challenge?.id])

  // useCodeRunner hook - always called (React rules of hooks); only active for coding challenges
  const codeChallenge = (isCodingChallenge && detail?.challenge)
    ? { id: detail.challenge.id, metadata: detail.challenge.metadata as Record<string, unknown> }
    : { id: '__no_coding__', metadata: {} }

  const codeRunner = useCodeRunner({
    challenge: codeChallenge,
    attemptId: attemptId ?? '',
    language: currentLanguage,
    onLastRunResult: (result) => {
      setLastRunResult(result)
      setOutputPanelStatus('done')
    },
  })

  const startTimeRef = useRef<number>(Date.now())
  // Prevents double-submit: locks for the full duration of submitAnswer + fetchCoaching
  const handlingSubmitRef = useRef(false)
  // Prevents double-advance: locks for the full duration of handleNextStep
  const handlingNextRef = useRef(false)

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
            trackEvent(EVENT_CHALLENGE_STARTED, { challenge_id: challengeId, attempt_id: attempt.id })
          }
        })
      }
    }
  }, [detail, attemptId, isApiMode, initialRoleId, startAttempt])

  // Load step data when step changes - clear stale data immediately so no
  // previous step's questions flash while the new step loads
  useEffect(() => {
    if (phase !== 'question') return
    setQuestionIdx(0)
    setSelectedOptionId(null)
    setSelectedOptionIds([])
    setReasoning('')
    setElaboration('')
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
      if (attemptId && !isInterviewChallenge) void loadStep(attemptId)
    } else {
      setAdapterStepData(null)
      const adapter = (props as Extract<FlowWorkspaceProps, { mode: 'adapter' }>).adapter
      if (!isInterviewChallenge) adapter.loadStep(currentStep).then(setAdapterStepData)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, attemptId, phase, isApiMode])

  // Warm the prompt cache for nudges on each step entry (best-effort)
  useEffect(() => {
    if (!isApiMode || !challengeId) return
    fetch('/api/hatch/nudge-warmup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step: currentStep }),
    }).catch(() => { /* silent */ })
  }, [challengeId, currentStep, isApiMode])

  // Unified step data
  const activeStepData = isApiMode ? stepData : adapterStepData
  const currentQuestion = activeStepData?.questions[questionIdx] ?? null
  const activeSubmitting = isApiMode ? submitting : adapterSubmitting

  // Rehydrate MCQ step drafts from the persisted snapshot once per attempt, but
  // only when the saved snapshot is for the step the server resumed us into.
  const didHydrateFlowRef = useRef<string | null>(null)
  useEffect(() => {
    if (isInterviewChallenge || !isApiMode || !detail?.challenge) return
    const attemptKey = detail.current_attempt?.id ?? attemptId
    if (!attemptKey || didHydrateFlowRef.current === attemptKey) return
    const snap = detail.current_attempt?.draft_snapshot as
      | { type?: string; step?: FlowStep; questionIdx?: number; stepDrafts?: Record<string, QuestionDraft> }
      | undefined
    const hasFlowSnapshot = snap?.type === 'flow' && !!snap.stepDrafts && Object.keys(snap.stepDrafts!).length > 0
    // If there's no flow draft to restore, mark hydrated immediately so we don't retry.
    if (!hasFlowSnapshot) {
      didHydrateFlowRef.current = attemptKey
      return
    }
    // There IS a snapshot, but it may belong to a step the resume hasn't applied
    // yet (currentStep starts at 'frame' and is updated async). Wait for the step
    // to match before consuming it — do NOT mark hydrated until it does.
    if (snap!.step !== currentStep) return
    setStepDrafts(snap!.stepDrafts!)
    const idx = typeof snap!.questionIdx === 'number' ? snap!.questionIdx : 0
    setQuestionIdx(idx)
    const q = activeStepData?.questions[idx] ?? activeStepData?.questions[0] ?? null
    const d = q ? snap!.stepDrafts![q.id] : undefined
    setSelectedOptionId(d?.selectedOptionId ?? null)
    setSelectedOptionIds(d?.selectedOptionIds ?? [])
    setReasoning(d?.reasoning ?? '')
    setElaboration(d?.reasoning ?? '')
    setConfidence(d?.confidence ?? null)
    didHydrateFlowRef.current = attemptKey
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail?.current_attempt?.id, attemptId, isInterviewChallenge, isApiMode, currentStep, activeStepData])

  // Update Hatch message when step loads
  useEffect(() => {
    if (phase !== 'question' || !activeStepData) return
    setHatch(activeStepData.nudge ?? 'Pick the best option.', 'listening')
  }, [phase, activeStepData])

  // GSAP session-start animation - fires once when phase first becomes 'question'
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

  // Clean up transient timers on unmount (ack beat + coaching-fallback).
  useEffect(() => () => {
    if (ackTimerRef.current) clearTimeout(ackTimerRef.current)
    if (coachTimerRef.current) clearTimeout(coachTimerRef.current)
  }, [])

  // Cancel a pending coaching-fallback timer when the step changes, so it can't
  // fire stale against a new step's reveal.
  useEffect(() => () => {
    if (coachTimerRef.current) { clearTimeout(coachTimerRef.current); coachTimerRef.current = null }
  }, [currentStep])

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

  const stepIdx = FLOW_STEPS.indexOf(currentStep)
  const isLastStep = stepIdx === FLOW_STEPS.length - 1

  // ── Draft helpers ─────────────────────────────────────────
  // A question is "answered" when its draft has the right selection for its type.
  const isQuestionAnswered = useCallback((q: { id: string; allow_multiple?: boolean } | null): boolean => {
    if (!q) return false
    const d = stepDrafts[q.id]
    if (q.allow_multiple) return (d?.selectedOptionIds.length ?? 0) > 0
    return !!d?.selectedOptionId
  }, [stepDrafts])

  const currentQuestionAnswered = isQuestionAnswered(currentQuestion)

  const stepQuestions = useMemo(() => activeStepData?.questions ?? [], [activeStepData])
  const isLastQuestionInStep = questionIdx === Math.max(0, stepQuestions.length - 1)
  const allStepQuestionsAnswered = stepQuestions.length > 0 && stepQuestions.every((q) => isQuestionAnswered(q))

  // Load a question's draft into the working state (used on navigation).
  const loadDraftIntoWorkingState = useCallback((q: { id: string } | null) => {
    const d = q ? stepDrafts[q.id] : undefined
    setSelectedOptionId(d?.selectedOptionId ?? null)
    setSelectedOptionIds(d?.selectedOptionIds ?? [])
    setReasoning(d?.reasoning ?? '')
    setElaboration(d?.reasoning ?? '')
    setConfidence(d?.confidence ?? null)
    setRevealedOptions([])
  }, [stepDrafts])

  // ── Navigation: forward within a step (no grading) ─────────
  const handleNextQuestion = useCallback(() => {
    if (!currentQuestionAnswered || ackVisible) return
    const nextIdx = questionIdx + 1
    const nextQ = stepQuestions[nextIdx] ?? null
    setAckVisible(true)
    setHatch('Answer recorded, keep going.', 'idle')
    if (ackTimerRef.current) clearTimeout(ackTimerRef.current)
    ackTimerRef.current = setTimeout(() => {
      setQuestionIdx(nextIdx)
      loadDraftIntoWorkingState(nextQ)
      startTimeRef.current = Date.now()
      setAckVisible(false)
    }, 500)
  }, [currentQuestionAnswered, ackVisible, questionIdx, stepQuestions, loadDraftIntoWorkingState, setHatch])

  // ── Navigation: backward within a step (instant, editable) ──
  const handlePreviousQuestion = useCallback(() => {
    if (questionIdx === 0 || ackVisible) return
    const prevIdx = questionIdx - 1
    const prevQ = stepQuestions[prevIdx] ?? null
    setQuestionIdx(prevIdx)
    loadDraftIntoWorkingState(prevQ)
    startTimeRef.current = Date.now()
    setHatch('You can change this answer before submitting the step.', 'listening')
  }, [questionIdx, ackVisible, stepQuestions, loadDraftIntoWorkingState, setHatch])

  // ── Step submit: grade all questions in the step at once ───
  const handleStepSubmit = useCallback(async () => {
    if (!allStepQuestionsAnswered) return
    if (handlingSubmitRef.current) return
    handlingSubmitRef.current = true
    setHatch('Reviewing your step…', 'reviewing')

    try {
      const orderedQuestions = [...stepQuestions].sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))

      if (isApiMode) {
        if (!attemptId) return
        const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000)
        const answers = orderedQuestions.map((q) => {
          const d = stepDrafts[q.id]
          return {
            question_id: q.id,
            response_type: q.response_type,
            selected_option_id: q.allow_multiple ? null : (d?.selectedOptionId ?? null),
            selected_option_ids: q.allow_multiple ? (d?.selectedOptionIds ?? []) : undefined,
            user_text: d?.reasoning || null,
            time_spent_seconds: elapsed,
            confidence: d?.confidence ?? null,
          }
        })
        const result = await submitStep({ attemptId, answers })
        if (!result) return

        // Build per-question reveal history in sequence order.
        const history: QuestionRevealRecord[] = result.questions.map((qr) => {
          const q = orderedQuestions.find((x) => x.id === qr.question_id)
          const d = q ? stepDrafts[q.id] : undefined
          return {
            questionText: q?.question_text ?? '',
            selectedOptionId: d?.selectedOptionId ?? (d?.selectedOptionIds?.[0] ?? null),
            userText: d?.reasoning || null,
            revealedOptions: qr.revealed_options,
            score: qr.score,
            gradeLabel: qr.grade_label,
            competencySignal: qr.competency_signal
              ? { primary: qr.competency_signal.competency, signal: qr.competency_signal.signal, framework_hint: qr.competency_signal.framework_hint ?? '' }
              : null,
            confidence: d?.confidence ?? null,
          }
        })
        setQuestionRevealHistory(history)
        setStepTotalScore(result.step_score)
        setStepScore(result.step_score)
        const last = result.questions[result.questions.length - 1]
        setStepGrade(last?.grade_label ?? 'plausible_wrong')
        setCompetencySignal(result.competency_signal
          ? { primary: result.competency_signal.competency, signal: result.competency_signal.signal, framework_hint: result.competency_signal.framework_hint ?? '' }
          : null)

        // Coaching for the step (uses the first question's pick as anchor).
        // The reveal shows a skeleton until roleContext lands. Guarantee it
        // resolves: if the async coach is slow or fails, fall back to the
        // synchronous competency signal so the reveal never strands on a
        // perpetual shimmer.
        const anchor = orderedQuestions[0]
        const anchorDraft = anchor ? stepDrafts[anchor.id] : undefined
        const fallbackCoach = result.competency_signal?.signal
          ?? history.find((h) => h.competencySignal?.signal)?.competencySignal?.signal
          ?? 'Step graded. Open each question below to see what the strongest answer does differently.'
        // Timer is held in a ref so a step change / unmount can cancel it
        // (cleanup effect below). setRoleContext(prev => prev || ...) makes the
        // late path idempotent: whichever of timer/response wins, the other no-ops.
        if (coachTimerRef.current) { clearTimeout(coachTimerRef.current); coachTimerRef.current = null }
        if (anchor) {
          coachTimerRef.current = setTimeout(() => {
            coachTimerRef.current = null
            setRoleContext((prev) => prev || fallbackCoach)
          }, 6000)
          fetchCoaching({
            attemptId,
            questionId: anchor.id,
            optionId: anchorDraft?.selectedOptionId ?? (anchorDraft?.selectedOptionIds?.[0] ?? null),
            roleId: initialRoleId,
            userText: anchorDraft?.reasoning || null,
          }).then((coaching) => {
            if (coachTimerRef.current) { clearTimeout(coachTimerRef.current); coachTimerRef.current = null }
            if (coaching) {
              setRoleContext((prev) => prev || coaching.role_context || fallbackCoach)
              if (coaching.career_signal) setCareerSignal(coaching.career_signal)
            } else {
              setRoleContext((prev) => prev || fallbackCoach)
            }
          }).catch(() => {
            if (coachTimerRef.current) { clearTimeout(coachTimerRef.current); coachTimerRef.current = null }
            setRoleContext((prev) => prev || fallbackCoach)
          })
        } else {
          setRoleContext(fallbackCoach)
        }
        setPhase('reveal')
      } else {
        // Adapter mode: one question per step, grade locally via submitAnswer.
        const adapter = (props as Extract<FlowWorkspaceProps, { mode: 'adapter' }>).adapter
        setAdapterSubmitting(true)
        try {
          const history: QuestionRevealRecord[] = []
          let lastGrade = 'plausible_wrong'
          let lastScore = 0
          for (const q of orderedQuestions) {
            const d = stepDrafts[q.id]
            const result = await adapter.submitAnswer({
              step: currentStep,
              questionId: q.id,
              selectedOptionId: d?.selectedOptionId ?? null,
              userText: d?.reasoning || null,
            })
            lastGrade = result.grade_label
            lastScore = result.score
            history.push({
              questionText: q.question_text,
              selectedOptionId: d?.selectedOptionId ?? null,
              userText: d?.reasoning || null,
              revealedOptions: result.revealed_options ?? [],
              score: result.score,
              gradeLabel: result.grade_label,
              competencySignal: null,
              confidence: d?.confidence ?? null,
            })
            const coaching = await adapter.fetchCoaching({ step: currentStep, optionId: d?.selectedOptionId ?? null, userText: d?.reasoning || null }).catch(() => null)
            if (coaching) {
              setRoleContext(coaching.role_context)
              setCareerSignal(coaching.career_signal)
            }
          }
          setQuestionRevealHistory(history)
          setStepScore(lastScore)
          setStepTotalScore(lastScore)
          setStepGrade(lastGrade)
          // Never leave the reveal coaching card on a perpetual skeleton.
          setRoleContext((prev) => prev || 'Step graded. Open each question below to see what the strongest answer does differently.')
          setPhase('reveal')
        } finally {
          setAdapterSubmitting(false)
        }
      }
    } finally {
      handlingSubmitRef.current = false
    }
  }, [allStepQuestionsAnswered, stepQuestions, stepDrafts, isApiMode, attemptId, submitStep, fetchCoaching, initialRoleId, currentStep, props, setHatch])

  const primaryButtonLabel = !isLastQuestionInStep
    ? 'Next question'
    : (isLastStep ? 'See results' : 'Submit step')

  const uploadCanvasPng = useCallback(async (attemptId: string): Promise<string | null> => {
    if (!canvasExportRef.current) return null
    const blob = await canvasExportRef.current()
    if (!blob) return null
    const supabase = createClient()
    const path = `canvas-snapshots/${attemptId}.png`
    const { error } = await supabase.storage.from('challenge-assets').upload(path, blob, {
      contentType: 'image/png',
      upsert: true,
    })
    if (error) return null
    const { data } = supabase.storage.from('challenge-assets').getPublicUrl(path)
    return data.publicUrl
  }, [])

  // Submit handler for canvas / interview challenge types (does NOT touch FLOW submit logic)
  const handleInterviewSubmit = useCallback(async () => {
    const challengeId = isApiMode ? (props as Extract<FlowWorkspaceProps, { mode: 'api' }>).challengeId : ''
    if (!challengeId || !attemptId || isSubmittingInterview) return
    playHatchSound('submit')
    setIsSubmittingInterview(true)
    try {
      const canvasPngUrl = await uploadCanvasPng(attemptId)
      if (canvasPngUrl) setSubmittedCanvasPngUrl(canvasPngUrl)
      const res = await fetch(`/api/challenges/${challengeId}/interview-submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId,
          canvasFinalSnapshot: {
            ...(canvasScene ?? { elements: [], appState: {} }),
            context_pack: contextPackText || null,
            context_pack_fields: contextPack,
          },
          contextPack: contextPackText || null,
          canvasPngUrl: canvasPngUrl ?? null,
        }),
      })
      if (!res.ok) throw new Error('Submit failed')
      const data = await res.json()
      playHatchSound('success')
      setInterviewGrade(data.grade)
      setPhase('complete')
      // Surface this submission in the history tab immediately (canvas types:
      // system_design / data_modeling). Optimistic; the refetch reconciles the
      // authoritative grade_label/score from the server.
      if (attemptId) {
        const score = typeof data.grade?.overall_score === 'number' ? data.grade.overall_score : 0
        recordSubmission({
          attemptId,
          challengeType: apiChallengeType ?? null,
          completedAt: new Date(),
          gradeLabel: scoreToGradeLabel(score),
          totalScore: score,
          maxScore: 5,
          xpAwarded: 0,
          stepResults: [],
          competencyDeltas: [],
          canvasPngUrl: canvasPngUrl ?? null,
        })
        void loadSubmissionHistory()
      }
    } catch (err) {
      playHatchSound('error')
      console.error('Interview submit error:', err)
    } finally {
      setIsSubmittingInterview(false)
    }
  }, [isApiMode, props, attemptId, canvasScene, contextPack, contextPackText, isSubmittingInterview, playHatchSound, uploadCanvasPng])

  // Run handler for coding challenges - fires visible test cases only
  const handleCodingRun = useCallback(async () => {
    if (codeRunner.status === 'running') return
    setOutputPanelStatus('running')
    setOutputPanelError(undefined)
    setCodingGradingError(undefined)
    try {
      const result = await codeRunner.run(currentCode)
      if (result) {
        setLastRunResult(result)
        setOutputPanelStatus('done')
      } else {
        setOutputPanelStatus('idle')
      }
    } catch (err) {
      setOutputPanelStatus('error')
      setOutputPanelError(err instanceof Error ? err.message : 'Run failed')
    }
  }, [codeRunner, currentCode])

  // Submit handler for coding challenges - final correctness first, then Hatch grading.
  const handleCodingSubmit = useCallback(async () => {
    const challengeId = isApiMode ? (props as Extract<FlowWorkspaceProps, { mode: 'api' }>).challengeId : ''
    if (!challengeId || !attemptId || isSubmittingCoding) return
    setIsSubmittingCoding(true)
    setOutputPanelStatus('running')
    setOutputPanelError(undefined)
    setCodingGradingError(undefined)
    setCodingFeedback(null)
    setIsLoadingGrading(true)

    try {
      const correctnessResult = await codeRunner.submit(currentCode)
      if (!correctnessResult) {
        throw new Error('Could not run final tests. Your attempt is saved locally.')
      }

      setLastRunResult(correctnessResult)
      setOutputPanelStatus('done')
      setPhase('complete')

      try {
        const gradingRes = await fetch(`/api/challenges/${challengeId}/coding-submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attemptId,
            finalCode: currentCode,
            language: currentLanguage,
            correctnessPayload: correctnessResult,
          }),
        })

        if (!gradingRes.ok) {
          const payload = await gradingRes.json().catch(() => null)
          if (payload?.status === 'not_ready') {
            setPhase('question')
            const nextAction = Array.isArray(payload.next_actions) ? payload.next_actions[0] : undefined
            throw new Error([payload.summary, nextAction].filter(Boolean).join(' '))
          }
          throw new Error(payload?.details ?? payload?.error ?? `Grading failed: ${gradingRes.status}`)
        }

        const gradingPayload = await gradingRes.json() as { grade?: GradingFeedback }
        if (gradingPayload.grade) {
          setCodingFeedback(gradingPayload.grade)
          // Surface this submission in the history tab immediately (coding types:
          // sql / algorithm). Optimistic; the refetch reconciles server truth.
          if (attemptId) {
            const score = gradingPayload.grade.overall_score ?? 0
            recordSubmission({
              attemptId,
              challengeType: apiChallengeType ?? null,
              completedAt: new Date(),
              gradeLabel: scoreToGradeLabel(score),
              totalScore: score,
              maxScore: 5,
              xpAwarded: 0,
              stepResults: [],
              competencyDeltas: [],
              canvasPngUrl: null,
            })
            void loadSubmissionHistory()
          }
        }
        else setCodingGradingError('Hatch did not return feedback for this submission.')
      } catch (gradingErr) {
        console.error('Coding grading error:', gradingErr)
        setCodingGradingError(gradingErr instanceof Error ? gradingErr.message : 'Hatch feedback failed')
      }
    } catch (err) {
      console.error('Coding submit error:', err)
      setOutputPanelStatus('error')
      setOutputPanelError(err instanceof Error ? err.message : 'Submit failed')
      setCodingGradingError(err instanceof Error ? err.message : 'Submit failed')
    } finally {
      setIsSubmittingCoding(false)
      setIsLoadingGrading(false)
    }
  }, [isApiMode, props, attemptId, currentCode, currentLanguage, isSubmittingCoding, codeRunner])

  // Re-run Hatch grading on the SAME submission, in place. Used by the "Retry
  // grading" button on the complete screen when the AI grader errored. Reuses the
  // already-computed correctness result (tests are deterministic — no need to
  // re-run them) and stays on phase==='complete' rather than starting a new attempt.
  const retryGradingInFlightRef = useRef(false)
  const retryCodingGrading = useCallback(async () => {
    const challengeId = isApiMode ? (props as Extract<FlowWorkspaceProps, { mode: 'api' }>).challengeId : ''
    // Synchronous in-flight guard — a state flag can lose a double-click race.
    if (!challengeId || !attemptId || !lastRunResult || isLoadingGrading || retryGradingInFlightRef.current) return
    retryGradingInFlightRef.current = true
    // Keep the existing error/feedback on screen until we have a result, so a
    // failed retry (e.g. 409) doesn't blank the panel.
    setIsLoadingGrading(true)
    try {
      const gradingRes = await fetch(`/api/challenges/${challengeId}/coding-submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId,
          finalCode: currentCode,
          language: currentLanguage,
          correctnessPayload: lastRunResult,
        }),
      })
      if (!gradingRes.ok) {
        const payload = await gradingRes.json().catch(() => null)
        // 409 means a grade already exists for this attempt (e.g. a prior
        // fallback grade persisted). Surface a clear, non-destructive message.
        if (gradingRes.status === 409) {
          setCodingGradingError('This attempt is already graded. Start a new attempt for a fresh grade.')
          return
        }
        throw new Error(payload?.details ?? payload?.error ?? `Grading failed: ${gradingRes.status}`)
      }
      const gradingPayload = await gradingRes.json() as { grade?: GradingFeedback }
      if (gradingPayload.grade) {
        setCodingGradingError(undefined)
        setCodingFeedback(gradingPayload.grade)
        const score = gradingPayload.grade.overall_score ?? 0
        recordSubmission({
          attemptId,
          challengeType: apiChallengeType ?? null,
          completedAt: new Date(),
          gradeLabel: scoreToGradeLabel(score),
          totalScore: score,
          maxScore: 5,
          xpAwarded: 0,
          stepResults: [],
          competencyDeltas: [],
          canvasPngUrl: null,
        })
        void loadSubmissionHistory()
      } else {
        setCodingGradingError('Hatch did not return feedback for this submission.')
      }
    } catch (gradingErr) {
      console.error('Coding grading retry error:', gradingErr)
      setCodingGradingError(gradingErr instanceof Error ? gradingErr.message : 'Hatch feedback failed')
    } finally {
      setIsLoadingGrading(false)
      retryGradingInFlightRef.current = false
    }
  }, [isApiMode, props, attemptId, currentCode, currentLanguage, lastRunResult, isLoadingGrading, apiChallengeType, recordSubmission, loadSubmissionHistory])

  // Per-language draft preservation: on language change, save current code and load draft/starter
  const handleLanguageChange = useCallback((newLang: SupportedLanguage) => {
    if (newLang === currentLanguage) return
    // Determine which draft bucket we're in (part-specific or 'default')
    const partKey = activePartId ?? 'default'
    // Save current code to drafts under the OLD language in this bucket. Update
    // the ref first (synchronous source of truth) then schedule the state update,
    // so the read below never sees a stale codingDrafts value.
    const nextDrafts = {
      ...codingDraftsRef.current,
      [partKey]: { ...(codingDraftsRef.current[partKey] ?? {}), [currentLanguage]: currentCode },
    }
    codingDraftsRef.current = nextDrafts
    setCodingDrafts(nextDrafts)
    // Load draft for new language in this bucket, or fall back to part starter / challenge starter
    const bucketDraft = nextDrafts[partKey]?.[newLang]
    const metadata = detail?.challenge?.metadata as { starter_code?: Record<string, string> } | null | undefined
    const activePart = detail?.codingParts?.find(p => p.id === activePartId)
    const partStarter = activePart?.coding_starter_code?.[newLang] ?? null
    const globalStarter = metadata?.starter_code?.[newLang] ?? ''
    setCurrentCode(bucketDraft ?? partStarter ?? globalStarter)
    setCurrentLanguage(newLang)
    setLastRunResult(null)
    setOutputPanelStatus('idle')
    setCodingGradingError(undefined)
  }, [activePartId, currentLanguage, currentCode, detail?.challenge?.metadata, detail?.codingParts])

  // Paste handler: log paste event to challenge_attempts.conversation_summary via autosave
  const handleCodePaste = useCallback(async (event: { length: number; percentOfBuffer: number; timestamp: number }) => {
    if (!attemptId) return
    try {
      await fetch('/api/hatch/session/autosave', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId,
          eventLog: {
            type: 'code_paste',
            language: currentLanguage,
            pastedLength: event.length,
            percentOfBuffer: event.percentOfBuffer,
            timestamp: event.timestamp,
          },
          updatedAt: new Date().toISOString(),
        }),
      })
    } catch { /* fire and forget */ }
  }, [attemptId, currentLanguage])

  const handleNextStep = useCallback(async () => {
    if (handlingNextRef.current) return
    handlingNextRef.current = true
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
      // Use the API-returned weighted step aggregate, not the last question's
      // individual score (which misrepresents multi-question steps).
      score: stepTotalScore ?? stepRevealRecord.score ?? 0,
      quality_label: stepRevealRecord.gradeLabel ?? 'plausible_wrong',
      // Source from the step's reveal record, not transient working state, so
      // multi-question steps report the representative answer's values.
      confidence: stepRevealRecord.confidence ?? confidence,
      reasoning: stepRevealRecord.userText ?? reasoning,
      competency_signal: stepRevealRecord.competencySignal ?? undefined,
      hatchSignal: stepRevealRecord.competencySignal?.signal ?? null,
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
            hatchSignal: sig.hatch_signal ?? r.hatchSignal,
            frameworkHint: sig.framework_hint ?? r.frameworkHint,
            selectedOptionId: sig.selected_option_id ?? r.selectedOptionId,
          }
        })
        // Fill in steps completed in a prior session that aren't in current in-memory results
        const FLOW_ORDER = ['frame', 'list', 'optimize', 'win'] as const
        const missingSteps: MirrorStepResult[] = dbSignals
          .filter(sig => !enrichedStepRes.some(r => r.step === sig.step))
          .map(sig => ({
            step: sig.step as 'frame' | 'list' | 'optimize' | 'win',
            score: 0,
            quality_label: sig.quality_label ?? 'plausible_wrong',
            confidence: null,
            reasoning: '',
            competency_signal: undefined,
            hatchSignal: sig.hatch_signal ?? null,
            frameworkHint: sig.framework_hint ?? null,
            selectedOptionId: sig.selected_option_id ?? null,
            questions: [],
          }))
        const allStepRes = [...enrichedStepRes, ...missingSteps]
        allStepRes.sort((a, b) => FLOW_ORDER.indexOf(a.step) - FLOW_ORDER.indexOf(b.step))
        const record: SessionRecord = {
          attemptId,
          challengeType: apiChallengeType ?? null,
          completedAt: new Date(),
          gradeLabel: cd?.grade_label ?? '',
          totalScore: cd?.total_score ?? 0,
          maxScore: cd?.max_score ?? 0,
          xpAwarded: cd?.xp_awarded ?? 0,
          stepResults: allStepRes,
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
                hatch_signal: r.hatchSignal ?? null,
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
            // Refresh whichever origin index panel is mounted. StudyPlanIndexPanel
            // keys off fromPlan, DomainIndexPanel off fromDomain — send both so the
            // side rail never goes stale after a completion.
            if (fromPlan || fromDomain) {
              window.dispatchEvent(new CustomEvent('challenge-completed', { detail: { challengeId, fromPlan, fromDomain } }))
            }
            completeSession(cd, finalStepResults)
            // Reconcile the optimistic inline record (pushed above) with the full
            // server record — step breakdown, competency deltas, XP — so the
            // Submissions tab matches without a manual reload.
            void loadSubmissionHistory()
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
      setCompletedSteps((prev) => prev.includes(currentStep) ? prev : [...prev, currentStep])
      const nextStep = FLOW_STEPS[stepIdx + 1]
      trackEvent(EVENT_CHALLENGE_STEP_ADVANCED, {
        challenge_id: challengeId,
        attempt_id: attemptId ?? '',
        step: nextStep,
      })
      setCurrentStep(nextStep)
      setStepDrafts({})       // fresh drafts for the next step
      setQuestionIdx(0)
      setSelectedOptionId(null)
      setSelectedOptionIds([])
      setReasoning('')
      setElaboration('')
      setConfidence(null)
      setPhase('question')
    }
    handlingNextRef.current = false
  }, [isApiMode, challengeId, currentStep, attemptId, props, questionRevealHistory, confidence, mirrorStepResults, stepTotalScore])

  // Persist the current question's working values into the step draft map so
  // they survive navigation between questions in the step.
  const writeDraft = useCallback((patch: Partial<QuestionDraft>) => {
    const qid = currentQuestion?.id
    if (!qid) return
    setStepDrafts((prev) => ({
      ...prev,
      [qid]: {
        selectedOptionId: prev[qid]?.selectedOptionId ?? null,
        selectedOptionIds: prev[qid]?.selectedOptionIds ?? [],
        reasoning: prev[qid]?.reasoning ?? '',
        confidence: prev[qid]?.confidence ?? null,
        ...patch,
      },
    }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion?.id])

  // Handle option select - update Hatch message + persist draft
  const handleOptionSelect = useCallback((id: string) => {
    setSelectedOptionId(id)
    writeDraft({ selectedOptionId: id })
    setHatch('Good. Add your reasoning, then keep going.', 'listening')
  }, [setHatch, writeDraft])

  // ── Discussions fetch ──────────────────────────────────────────

  const fetchDiscussions = useCallback(async () => {
    if (!challengeId) return
    setDiscussionsLoading(true)
    try {
      const res = await fetch(`/api/challenges/${challengeId}/discussions`)
      if (res.ok) {
        const data: ChallengeDiscussion[] = await res.json()
        setDiscussions(data)
        setUpvoted(deriveDiscussionUpvotes(data, currentUserId))
        setDiscussionsLoaded(true)
      }
    } finally {
      setDiscussionsLoading(false)
    }
  }, [challengeId, currentUserId, deriveDiscussionUpvotes])

  // Optimistic post: render the user's just-created discussion immediately, then
  // reconcile in the background (ordering, expert picks, joined display name).
  // Edits/deletes/replies pass no row and just trigger the background refetch.
  const handleDiscussionSubmitted = useCallback((created?: ChallengeDiscussion) => {
    if (created) {
      setDiscussions(prev =>
        prev.some(d => d.id === created.id) ? prev : [created, ...prev]
      )
    }
    void fetchDiscussions()
  }, [fetchDiscussions])

  useEffect(() => {
    if (leftTab === 'Discussions' && !discussionsLoaded) {
      void fetchDiscussions()
    }
  }, [leftTab, discussionsLoaded, fetchDiscussions])

  // ── Solutions fetch / lazy generation ──────────────────────────

  const fetchSolution = useCallback(async () => {
    if (!challengeId) return
    setSolutionLoading(true)
    try {
      const res = await fetch(`/api/challenges/${challengeId}/solution`)
      if (res.ok) {
        const data: SolutionTabResponse = await res.json()
        setSolution(data)
        setSolutionLoaded(true)
      }
    } catch { /* transient; user can re-open the tab */ }
    finally {
      setSolutionLoading(false)
    }
  }, [challengeId])

  const triggerSolutionGeneration = useCallback(async () => {
    if (!challengeId) return
    setSolution({ locked: false, status: 'generating' })
    try {
      const res = await fetch(`/api/challenges/${challengeId}/solution/generate`, { method: 'POST' })
      const data = await res.json().catch(() => null)
      if (res.ok && data) {
        setSolution(data as SolutionTabResponse)
      } else {
        setSolution({ locked: false, status: 'failed' })
      }
    } catch {
      setSolution({ locked: false, status: 'failed' })
    }
  }, [challengeId])

  // Lazy-load on first Solutions tab open
  useEffect(() => {
    if (leftTab === 'Solutions' && !solutionLoaded && !solutionLoading && challengeId) {
      void fetchSolution()
    }
  }, [leftTab, solutionLoaded, solutionLoading, fetchSolution, challengeId])

  // No stored solution yet -> trigger generation once; poll while generating
  useEffect(() => {
    if (leftTab !== 'Solutions' || !solution || solution.locked) return
    if (solution.status === 'none' && !solutionGenerateTriggeredRef.current) {
      solutionGenerateTriggeredRef.current = true
      void triggerSolutionGeneration()
      return
    }
    if (solution.status === 'generating') {
      const interval = window.setInterval(() => { void fetchSolution() }, 4000)
      return () => window.clearInterval(interval)
    }
  }, [leftTab, solution, triggerSolutionGeneration, fetchSolution])

  useEffect(() => { solutionStateRef.current = solution }, [solution])

  // Hatch awareness: which solution approach the user is reading (null when the
  // tab is closed, locked, or still generating). Sent with every chat turn.
  const activeSolutionApproach = useMemo(() => {
    if (!solution || solution.locked || solution.status !== 'ready') return null
    const approaches = solution.content.approaches
    const approach = approaches.find((a) => a.id === activeApproachId) ?? approaches[0]
    return approach ? { title: approach.title, tagline: approach.tagline } : null
  }, [solution, activeApproachId])
  const solutionsOpen = leftTab === 'Solutions' && activeSolutionApproach !== null

  // A completed submission unlocks the tab for free users without a reload.
  useEffect(() => {
    if (sessionHistory.length === 0) return
    if (solutionStateRef.current?.locked) {
      setSolution(null)
      setSolutionLoaded(false)
    }
  }, [sessionHistory.length])

  useEffect(() => {
    let cancelled = false
    fetch('/api/profile')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!cancelled) setCurrentUserId(data?.id ?? null)
      })
      .catch(() => {
        if (!cancelled) setCurrentUserId(null)
      })
    return () => { cancelled = true }
  }, [])

  // Keep a live Supabase browser client mounted for the whole workspace session.
  // @supabase/ssr's autoRefreshToken only ticks while a client instance is alive,
  // so a coding/SQL session left idle for a few minutes would otherwise let the
  // access token expire, 401 the autosave + refetches, and crash into the app
  // error boundary. Holding the client open keeps the token fresh; subscribing to
  // onAuthStateChange lets us catch the case where the refresh token itself has
  // finally expired and show an inline prompt instead of a hard crash.
  useEffect(() => {
    const supabase = createClient()
    let mounted = true
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      if (event === 'SIGNED_OUT' || (!session && event !== 'INITIAL_SESSION')) {
        setSessionExpired(true)
      } else if (session) {
        setSessionExpired(false)
      }
    })
    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    setUpvoted(deriveDiscussionUpvotes(discussions, currentUserId))
  }, [currentUserId, deriveDiscussionUpvotes, discussions])

  async function handleDiscussionUpvote(id: string) {
    if (!challengeId) return
    const wasUpvoted = upvoted.has(id)
    setUpvoted(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setDiscussions(prev =>
      prev.map(d => {
        if (d.id !== id) return d
        return applyDiscussionUpvoteState(
          { ...d, upvote_count: d.upvote_count + (wasUpvoted ? -1 : 1) },
          currentUserId,
          !wasUpvoted
        )
      })
    )
    try {
      const res = await fetch(`/api/challenges/${challengeId}/discussions/${id}/upvote`, { method: 'PATCH' })
      if (!res.ok) throw new Error('Upvote failed')
      const data = await res.json().catch(() => null)
      if (typeof data?.upvote_count === 'number') {
        setDiscussions(prev =>
          prev.map(d => d.id === id
            ? applyDiscussionUpvoteState(
              { ...d, upvote_count: data.upvote_count },
              currentUserId,
              Boolean(data.upvoted)
            )
            : d)
        )
      }
      if (typeof data?.upvoted === 'boolean') {
        setUpvoted(prev => {
          const next = new Set(prev)
          if (data.upvoted) next.add(id)
          else next.delete(id)
          return next
        })
      }
    } catch {
      setUpvoted(prev => {
        const next = new Set(prev)
        if (wasUpvoted) next.add(id)
        else next.delete(id)
        return next
      })
      setDiscussions(prev =>
        prev.map(d => d.id === id
          ? applyDiscussionUpvoteState(
            { ...d, upvote_count: Math.max(0, d.upvote_count + (wasUpvoted ? 1 : -1)) },
            currentUserId,
            wasUpvoted
          )
          : d)
      )
    }
  }

  // ── Render states ──────────────────────────────────────────────

  // Session timed out (token could not be refreshed). Recoverable prompt instead
  // of a generic error or the app-level error boundary. Latest draft is autosaved.
  if (sessionExpired || challengeError === 'session_expired') {
    const returnTo = typeof window !== 'undefined' ? window.location.pathname + window.location.search : ''
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8 text-center">
        <HatchGlyph size={48} state="idle" className="text-primary" />
        <h2 className="font-headline text-2xl font-bold text-on-surface">Your session timed out</h2>
        <p className="text-on-surface-variant max-w-md">Sign back in and you will land right back here. Your latest draft was autosaved.</p>
        <div className="flex gap-3">
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-surface-container border border-outline-variant text-on-surface rounded-full text-sm font-medium hover:bg-surface-container-high transition-colors">Try again</button>
          <a href={`/login?returnTo=${encodeURIComponent(returnTo)}`} className="px-4 py-2 bg-primary text-on-primary rounded-full text-sm font-medium hover:opacity-90 transition-opacity">Sign back in</a>
        </div>
      </div>
    )
  }

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
        <HatchGlyph size={56} state="reviewing" className="text-primary" />
        <p className="font-body text-on-surface-variant text-sm">Loading challenge…</p>
      </div>
    )
  }

  // Resolve challenge display data across both modes
  const challengeTitle = isApiMode ? detail?.challenge.title : adapterChallenge?.title
  const challengeScenarioQ = isApiMode ? detail?.challenge.scenario_question : adapterChallenge?.scenario_question
  const scenarioContext = isApiMode ? detail?.challenge.scenario_context : adapterChallenge?.scenario_context
  const scenarioTrigger = isApiMode ? detail?.challenge.scenario_trigger : adapterChallenge?.scenario_trigger
  const challenge = isApiMode ? detail?.challenge : adapterChallenge
  const challengeBriefSections = buildChallengeBrief({
    challenge_type: isApiMode
      ? ((challenge as { challenge_type?: string } | null | undefined)?.challenge_type ?? apiChallengeType)
      : 'flow',
    title: challengeTitle,
    scenario_context: scenarioContext,
    scenario_trigger: scenarioTrigger,
    scenario_question: challengeScenarioQ,
    prompt_text: (challenge as { prompt_text?: string | null } | null | undefined)?.prompt_text,
    metadata: (challenge as { metadata?: Record<string, unknown> | null } | null | undefined)?.metadata,
  })

  const handleRunAnother = () => {
    setMirrorStepResults([])
    setSelectedHistoryIdx(null)
    setAttemptId(null)
    setCalibrationSteps([
      { stepKey: 'frame',    stepLabel: 'Frame',    status: 'pending', confidenceLabel: null },
      { stepKey: 'list',     stepLabel: 'List',     status: 'pending', confidenceLabel: null },
      { stepKey: 'optimize', stepLabel: 'Optimize', status: 'pending', confidenceLabel: null },
      { stepKey: 'win',      stepLabel: 'Win',      status: 'pending', confidenceLabel: null },
    ])
    hasAnimated.current = false
    handlingNextRef.current = false
    setStepDrafts({})
    setQuestionIdx(0)
    setSelectedOptionId(null)
    setSelectedOptionIds([])
    setReasoning('')
    setElaboration('')
    setConfidence(null)
    setRevealedOptions([])
    setAckVisible(false)
    if (ackTimerRef.current) clearTimeout(ackTimerRef.current)
    if (isApiMode) {
      setPhase('loading')
      reload()
    } else {
      setCurrentStep('frame')
      setCompletedSteps([])
      setPhase('question')
    }
  }

  const STAGE_COLOR: Record<FlowStep, string> = {
    frame:    FLOW_MOVES.frame.color,
    list:     FLOW_MOVES.list.color,
    optimize: FLOW_MOVES.optimize.color,
    win:      FLOW_MOVES.win.color,
  }
  const STAGE_ICON: Record<FlowStep, string> = {
    frame:    FLOW_MOVES.frame.icon,
    list:     FLOW_MOVES.list.icon,
    optimize: FLOW_MOVES.optimize.icon,
    win:      FLOW_MOVES.win.icon,
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

  const tabs = ['Description', 'Discussions', 'Submissions', 'Solutions'] as const

  // Derived: active coding parts from detail (only meaningful for coding challenges)
  const codingParts = (isApiMode ? (detail?.codingParts ?? []) : [])

  // Left pane description content
  const descriptionPane = (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px' }}>
      {/* Chips */}
      {(() => {
        const ch = isApiMode ? detail?.challenge : adapterChallenge
        const diff = ch?.difficulty
        const challengeType = isApiMode
          ? ((ch as { challenge_type?: string } | null | undefined)?.challenge_type ?? apiChallengeType)
          : 'flow'
        const disciplineCopy = challengeType ? CHALLENGE_TYPE_FILTER_COPY[challengeType] : null
        const companyTags: string[] = (ch as { company_tags?: string[] })?.company_tags ?? []
        const topicTags: string[] = (ch as { tags?: string[] })?.tags ?? []
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 16 }}>
            {disciplineCopy && (
              <Link
                href={practiceFilterHref('discipline', disciplineCopy.discipline)}
                title={`Browse ${disciplineCopy.label} practice`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: 'var(--color-primary)', color: '#fff',
                  fontSize: 10.5, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase',
                  padding: '3px 9px', borderRadius: 999,
                  fontFamily: 'var(--font-label)', textDecoration: 'none',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 12, fontVariationSettings: "'FILL' 1" }}>{disciplineCopy.icon}</span>
                {disciplineCopy.label}
              </Link>
            )}
            {diff && (() => {
              const canonical = coerceDifficulty(diff)
              const label = canonical ? DIFFICULTY_LABEL[canonical] : diff
              const filterVal = canonical ? DIFFICULTY_FILTER_VALUE[canonical] : diff
              return (
                <Link href={practiceFilterHref('difficulty', filterVal ?? diff)} title={`Browse ${label} practice`} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: 'var(--color-surface-inverse)', color: 'var(--color-inverse-on-surface)',
                  fontSize: 10.5, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                  padding: '3px 9px', borderRadius: 999,
                  fontFamily: 'var(--font-label)', textDecoration: 'none',
                  position: 'relative', zIndex: 0,
                }}>
                  {label}
                </Link>
              )
            })()}
            {companyTags.map(tag => (
              <Link key={tag} href={practiceFilterHref('company', tag)} title={`Browse ${formatCompany(tag)} practice`} style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: 'var(--color-hero-forest)', color: '#9ee0b8',
                fontSize: 10.5, fontWeight: 700, letterSpacing: '0.04em',
                padding: '3px 9px', borderRadius: 999,
                fontFamily: 'var(--font-label)', textDecoration: 'none',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 11, fontVariationSettings: "'FILL' 1" }}>apartment</span>
                {formatCompany(tag)}
              </Link>
            ))}
            {topicTags.map(tag => (
              <Link key={tag} href={practiceFilterHref('tag', tag)} title={`Browse ${tag} practice`} style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: 'var(--color-surface-container-high)',
                color: 'var(--color-on-surface-variant)',
                fontSize: 10.5, fontWeight: 600,
                padding: '3px 9px', borderRadius: 999,
                border: '1px solid var(--color-outline-variant)',
                fontFamily: 'var(--font-label)', textDecoration: 'none',
              }}>
                {tag}
              </Link>
            ))}
          </div>
        )
      })()}

      {/* Title */}
      {challengeTitle && (
        <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: 23, fontWeight: 700, lineHeight: 1.22, letterSpacing: '-0.01em', color: 'var(--color-on-surface)', marginBottom: 10 }}>
          {challengeTitle}
        </h2>
      )}

      {/* Role is metadata, never user-facing copy (voice rule: no role framing).
          The scenario_role line that used to render here leaked labels like
          "staff engineer" under the title — dropped. */}

      {/* Problem statement: technical types render as one continuous document
          (structure from the content's ## headings); flow/quick_take keep the
          narrative card stack. */}
      {challengeBriefSections.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          {(isCodingChallenge || isCanvasChallenge) ? (
            <ProblemDocument sections={challengeBriefSections} />
          ) : (
            challengeBriefSections.map((section) => (
              <BriefSectionCard key={section.id} section={section} />
            ))
          )}
        </div>
      )}

      {isCanvasChallenge && (
        <div
          ref={contextPackRef}
          style={{
            marginBottom: 20,
            background: 'linear-gradient(135deg, #f7f3ea 0%, #eef5ee 100%)',
            border: '1px solid rgba(74,124,89,0.18)',
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          <button
            type="button"
            onClick={() => setContextPackOpen((v) => !v)}
            style={{
              width: '100%',
              border: 'none',
              background: 'transparent',
              padding: '13px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: 'inherit',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                width: 28,
                height: 28,
                borderRadius: 9,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--color-primary)',
                color: 'var(--color-on-primary)',
                fontSize: 16,
                fontVariationSettings: "'FILL' 1, 'wght' 500",
              }}
            >
              data_object
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: 'var(--font-label)', fontSize: 12, fontWeight: 800, color: 'var(--color-on-surface)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Context Pack
                </span>
                <span style={{ fontFamily: 'var(--font-label)', fontSize: 10.5, fontWeight: 700, color: contextPackFieldCount > 0 ? 'var(--color-primary)' : 'var(--color-on-surface-variant)' }}>
                  {contextPackFieldCount}/{contextPack.length} filled
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: 12, lineHeight: 1.45, color: 'var(--color-on-surface-variant)' }}>
                Assumptions and tradeoffs Hatch should grade with your diagram.
              </p>
            </div>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 18, color: 'var(--color-on-surface-variant)', transform: contextPackOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 160ms' }}
            >
              expand_more
            </span>
          </button>
          {contextPackOpen && (
            <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {contextPack.map((field, fieldIdx) => (
                <div key={field.id} style={{ display: 'block' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: field.helper ? 2 : 5 }}>
                    {field.removable ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 13, color: 'var(--color-on-surface-variant)', flexShrink: 0 }}>{field.icon}</span>
                        <input
                          type="text"
                          value={field.label}
                          maxLength={40}
                          onChange={(event) => setContextPack((prev) => prev.map((f, i) => i === fieldIdx ? { ...f, label: event.target.value } : f))}
                          style={{
                            flex: 1,
                            minWidth: 0,
                            fontFamily: 'var(--font-label)',
                            fontSize: 11,
                            fontWeight: 800,
                            color: 'var(--color-on-surface-variant)',
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: '1px dashed var(--color-outline-variant)',
                            outline: 'none',
                            padding: '0 2px',
                          }}
                        />
                      </div>
                    ) : (
                      <label
                        htmlFor={`context-pack-${field.id}`}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-label)', fontSize: 11, fontWeight: 800, color: 'var(--color-on-surface-variant)', letterSpacing: '0.04em', textTransform: 'uppercase' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>{field.icon}</span>
                        {field.label}
                      </label>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      {field.value.trim().length > 0 && (
                        <AppTooltip label="Ask Hatch to compare this note to your canvas." side="left">
                          <button
                            type="button"
                            onClick={() => queueHatchPrompt(buildContextFieldPrompt(apiChallengeType, field.label), true)}
                            style={{
                              border: '1px solid rgba(74,124,89,0.22)',
                              background: 'rgba(255,255,255,0.76)',
                              color: 'var(--color-primary)',
                              borderRadius: 999,
                              padding: '2px 7px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontFamily: 'var(--font-label)',
                              fontSize: 10.5,
                              fontWeight: 800,
                              cursor: 'pointer',
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>auto_awesome</span>
                            Check
                          </button>
                        </AppTooltip>
                      )}
                      {field.removable && (
                        <button
                          type="button"
                          aria-label="Remove this field"
                          onClick={() => setContextPack((prev) => prev.filter((_, i) => i !== fieldIdx))}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--color-on-surface-variant)',
                            cursor: 'pointer',
                            padding: '2px 3px',
                            lineHeight: 1,
                            display: 'inline-flex',
                            alignItems: 'center',
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                        </button>
                      )}
                    </div>
                  </div>
                  {field.helper ? (
                    <p style={{ margin: '0 0 5px', fontFamily: 'var(--font-label)', fontSize: 10.5, lineHeight: 1.4, color: 'var(--color-on-surface-variant)' }}>
                      {field.helper}
                    </p>
                  ) : null}
                  <textarea
                    id={`context-pack-${field.id}`}
                    value={field.value}
                    onChange={(event) => setContextPack((prev) => prev.map((f, i) => i === fieldIdx ? { ...f, value: event.target.value } : f))}
                    placeholder={field.placeholder}
                    rows={field.id === 'interfaces' ? 3 : 2}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      resize: 'vertical',
                      minHeight: field.id === 'interfaces' ? 78 : 58,
                      borderRadius: 12,
                      border: '1px solid var(--color-outline-variant)',
                      background: 'rgba(255,255,255,0.72)',
                      color: 'var(--color-on-surface)',
                      padding: '9px 10px',
                      fontFamily: 'var(--font-body)',
                      fontSize: 12.5,
                      lineHeight: 1.45,
                      outline: 'none',
                    }}
                  />
                </div>
              ))}
              {contextPack.filter((f) => f.removable).length < 6 && (
                <button
                  type="button"
                  onClick={() => {
                    const newField: ContextPackField = {
                      id: `custom-${Date.now()}`,
                      label: 'Custom note',
                      helper: '',
                      icon: 'sticky_note_2',
                      placeholder: '',
                      value: '',
                      removable: true,
                    }
                    setContextPack((prev) => [...prev, newField])
                  }}
                  style={{
                    alignSelf: 'flex-start',
                    border: '1px dashed var(--color-outline-variant)',
                    background: 'transparent',
                    color: 'var(--color-on-surface-variant)',
                    borderRadius: 999,
                    padding: '5px 10px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontFamily: 'var(--font-label)',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    marginTop: 2,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>add</span>
                  Add a note field
                </button>
              )}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 9,
                  marginTop: 2,
                  padding: 10,
                  borderRadius: 14,
                  background: 'rgba(255,255,255,0.62)',
                  border: '1px solid rgba(74,124,89,0.14)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <HatchGlyph size={22} state="listening" className="text-primary shrink-0" />
                  <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 11.5, lineHeight: 1.45, color: 'var(--color-on-surface-variant)' }}>
                    Hatch sees these notes with your canvas: {contextPackFieldCount}/{contextPack.length} notes, {scene.entities.length} {apiChallengeType === 'data_modeling' ? 'tables' : 'nodes'}, {scene.connections.length} {apiChallengeType === 'data_modeling' ? 'links' : 'flows'}.
                  </p>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {([
                    { label: 'Clarify', icon: 'help', intent: 'clarify' as const, tip: 'Find the one missing question worth asking before drawing more.' },
                    { label: 'Build', icon: 'auto_fix_high', intent: 'build' as const, tip: 'Turn your notes into concrete canvas changes.' },
                    { label: 'Stress', icon: 'bolt', intent: 'stress' as const, tip: 'Poke holes in notes and diagram together.' },
                  ]).map((action) => (
                    <AppTooltip key={action.intent} label={action.tip} side="bottom">
                      <button
                        type="button"
                        onClick={() => queueHatchPrompt(buildContextPackPrompt(apiChallengeType, action.intent), true)}
                        style={{
                          border: '1px solid var(--color-outline-variant)',
                          background: 'var(--color-surface-container-low)',
                          color: 'var(--color-on-surface)',
                          borderRadius: 999,
                          padding: '6px 9px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          fontFamily: 'var(--font-label)',
                          fontSize: 11,
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{action.icon}</span>
                        {action.label}
                      </button>
                    </AppTooltip>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SQL schema + sample data + expected output - only shown for coding challenges with SQL */}
      {isCodingChallenge && currentLanguage === 'sql' && (() => {
        const metadata = (isApiMode ? detail?.challenge?.metadata : null) as {
          sql_schema?: { schema_diagram?: SchemaDiagramData; sample_data_preview?: Record<string, Record<string, unknown>[]> }
          test_cases?: ExpectedOutputTestCase[]
        } | null | undefined
        const schemaDiagram = metadata?.sql_schema?.schema_diagram
        const sampleDataPreview = metadata?.sql_schema?.sample_data_preview
        const sqlTestCases = Array.isArray(metadata?.test_cases) ? metadata.test_cases : []
        if (!schemaDiagram && !sampleDataPreview && sqlTestCases.length === 0) return null
        return (
          <div style={{ marginTop: 8 }}>
            {schemaDiagram && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-on-surface-variant)', marginBottom: 8, fontFamily: 'var(--font-label)' }}>
                  Schema
                </div>
                <SchemaDiagram schema_diagram={schemaDiagram} />
              </div>
            )}
            {sampleDataPreview && Object.keys(sampleDataPreview).length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-on-surface-variant)', marginBottom: 8, fontFamily: 'var(--font-label)' }}>
                  Sample Data
                </div>
                <SampleDataPreview sample_data_preview={sampleDataPreview} />
              </div>
            )}
            {sqlTestCases.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-on-surface-variant)', marginBottom: 8, fontFamily: 'var(--font-label)' }}>
                  Expected Output
                </div>
                <ExpectedOutput test_cases={sqlTestCases} />
              </div>
            )}
          </div>
        )
      })()}

      {/* ── Parts list - multi-part coding challenges only ── */}
      {isCodingChallenge && codingParts.length > 0 && (
        <div data-testid="parts-list" style={{ padding: '0 16px 16px' }}>
          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--color-outline-variant)' }} />
            <span style={{ fontFamily: 'var(--font-label)', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--color-on-surface-variant)' }}>
              Parts
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--color-outline-variant)' }} />
          </div>

          {/* Part cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {codingParts.map((part) => {
              const isActive = activePartId === part.id
              const weightPct = Math.round(part.grading_weight_within_step * 100)
              const partRunResult = partRunResults[part.id]
              const partSub = partSubmissions[part.id]
              const isMcq = part.response_type === 'pure_mcq'
              const isRevealed = !!partMcqRevealed[part.id]

              // Status chip content
              let statusLabel = 'Not started'
              let statusBg = 'var(--color-surface-container-high)'
              let statusColor = 'var(--color-on-surface-variant)'
              if (partSub?.submitted) {
                statusLabel = 'Submitted'
                statusBg = 'var(--color-primary)'
                statusColor = 'var(--color-on-primary)'
              } else if (partRunResult) {
                statusLabel = `${partRunResult.testsPassed}/${partRunResult.testsTotal}`
                statusBg = partRunResult.testsPassed === partRunResult.testsTotal ? 'var(--color-primary-container)' : 'var(--color-tertiary-container)'
                statusColor = 'var(--color-on-surface)'
              } else if (isActive) {
                statusLabel = 'Open'
                statusBg = 'var(--color-surface-container)'
                statusColor = 'var(--color-on-surface-variant)'
              }

              return (
                <div
                  key={part.id}
                  data-testid={`part-card-${part.id}`}
                  style={{
                    border: isActive ? '1.5px solid var(--color-primary)' : '1px solid var(--color-outline-variant)',
                    borderRadius: 10,
                    background: isActive ? 'var(--color-primary-fixed)' : 'var(--color-surface-container-low)',
                    overflow: 'hidden',
                    transition: 'border-color 120ms, background 120ms',
                  }}
                >
                  {/* Part header - click to toggle expand */}
                  <button
                    data-testid={`part-toggle-${part.id}`}
                    onClick={() => {
                      // Save current code to previous part's draft before switching.
                      // Mutate the ref first so the load-read below is never stale.
                      if (activePartId && activePartId !== part.id) {
                        const nextDrafts = {
                          ...codingDraftsRef.current,
                          [activePartId]: { ...(codingDraftsRef.current[activePartId] ?? {}), [currentLanguage]: currentCode },
                        }
                        codingDraftsRef.current = nextDrafts
                        setCodingDrafts(nextDrafts)
                      }
                      setActivePartId(isActive ? null : part.id)
                      if (!isActive) {
                        // Load part draft or starter code (read from the fresh ref)
                        const partDraft = codingDraftsRef.current[part.id]?.[currentLanguage]
                        const partStarter = part.coding_starter_code?.[currentLanguage]
                        const meta = detail?.challenge?.metadata as { starter_code?: Record<string, string> } | null | undefined
                        const globalStarter = meta?.starter_code?.[currentLanguage] ?? ''
                        setCurrentCode(partDraft ?? partStarter ?? globalStarter)
                        setLastRunResult(partRunResults[part.id] ?? null)
                      }
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 12px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontFamily: 'inherit',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--color-on-surface-variant)', transition: 'transform 120ms', transform: isActive ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                      chevron_right
                    </span>
                    <span style={{ flex: 1, fontFamily: 'var(--font-label)', fontSize: 13, fontWeight: 600, color: 'var(--color-on-surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Part {part.sequence} · {part.title}
                    </span>
                    {/* Status chip */}
                    <span data-testid={`part-status-${part.id}`} style={{
                      fontFamily: 'var(--font-label)', fontSize: 10.5, fontWeight: 700,
                      padding: '2px 7px', borderRadius: 999,
                      background: statusBg, color: statusColor,
                      flexShrink: 0,
                    }}>
                      {statusLabel}
                    </span>
                    {/* Weight pill */}
                    <span style={{
                      fontFamily: 'var(--font-label)', fontSize: 10, fontWeight: 600,
                      padding: '2px 6px', borderRadius: 999,
                      background: 'var(--color-surface-container-high)',
                      color: 'var(--color-on-surface-variant)',
                      border: '1px solid var(--color-outline-variant)',
                      flexShrink: 0,
                    }}>
                      {weightPct}%
                    </span>
                    {/* Type badge */}
                    <span style={{ fontSize: 10, color: 'var(--color-on-surface-variant)', flexShrink: 0 }}>
                      {isMcq ? (
                        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>quiz</span>
                      ) : (
                        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>code</span>
                      )}
                    </span>
                  </button>

                  {/* Expanded content */}
                  {isActive && isMcq && part.options && (
                    <div style={{ padding: '0 12px 12px', borderTop: '1px solid var(--color-outline-variant)' }}>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.6, color: 'var(--color-on-surface-variant)', margin: '10px 0 12px' }}>
                        {part.coding_subtask_prompt ?? part.title}
                      </p>
                      {/* MCQ options */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {[...part.options].sort((a, b) => a.option_label.localeCompare(b.option_label)).map((opt) => {
                          const isSelected = partMcqSelections[part.id] === opt.id
                          const revealed = isRevealed

                          // Quality colours (revealed state)
                          let revealBg = 'var(--color-surface)'
                          let revealBorder = 'var(--color-outline-variant)'
                          if (revealed) {
                            if (opt.quality === 'best') { revealBg = 'var(--color-primary-container)'; revealBorder = 'var(--color-primary)' }
                            else if (opt.quality === 'good_but_incomplete') { revealBg = 'var(--color-surface-container-high)'; revealBorder = 'var(--color-outline-variant)' }
                            else if (opt.quality === 'surface') { revealBg = 'var(--color-tertiary-container)'; revealBorder = 'var(--color-tertiary-container)' }
                            else { revealBg = 'rgba(184,50,48,0.08)'; revealBorder = 'rgba(184,50,48,0.3)' }
                          }

                          return (
                            <button
                              key={opt.id}
                              disabled={isRevealed}
                              onClick={() => setPartMcqSelections(prev => ({ ...prev, [part.id]: opt.id }))}
                              style={{
                                textAlign: 'left',
                                width: '100%',
                                background: revealed ? revealBg : isSelected ? 'var(--color-primary-fixed)' : 'var(--color-surface-container-low)',
                                border: `1.5px solid ${revealed ? revealBorder : isSelected ? 'var(--color-primary)' : 'var(--color-outline-variant)'}`,
                                borderRadius: 8,
                                padding: '8px 10px',
                                cursor: isRevealed ? 'default' : 'pointer',
                                fontFamily: 'inherit',
                                transition: 'background 100ms, border-color 100ms',
                              }}
                            >
                              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                <span style={{
                                  fontFamily: 'var(--font-label)', fontSize: 11, fontWeight: 700,
                                  color: isSelected || revealed ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
                                  flexShrink: 0, marginTop: 1,
                                }}>
                                  {opt.option_label}
                                </span>
                                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-on-surface)', lineHeight: 1.5 }}>
                                  {opt.option_text}
                                </span>
                              </div>
                              {revealed && (
                                <div style={{ marginTop: 6, fontSize: 12, color: 'var(--color-on-surface-variant)', lineHeight: 1.5, fontStyle: 'italic' }}>
                                  {opt.explanation}
                                </div>
                              )}
                            </button>
                          )
                        })}
                      </div>
                      {/* Submit MCQ answer */}
                      {!isRevealed && (
                        <button
                          disabled={!partMcqSelections[part.id]}
                          onClick={async () => {
                            const selectedId = partMcqSelections[part.id]
                            if (!selectedId || !challengeId || !attemptId) return
                            try {
                              const res = await fetch(`/api/challenges/${challengeId}/step/coding/submit`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  attempt_id: attemptId,
                                  question_id: part.id,
                                  response_type: 'pure_mcq',
                                  selected_option_id: selectedId,
                                }),
                              })
                              if (res.ok) {
                                setPartMcqRevealed(prev => ({ ...prev, [part.id]: true }))
                                setPartSubmissions(prev => ({ ...prev, [part.id]: { submitted: true } }))
                              }
                            } catch { /* swallow */ }
                          }}
                          style={{
                            marginTop: 10,
                            width: '100%',
                            padding: '8px 0',
                            borderRadius: 8,
                            background: partMcqSelections[part.id] ? 'var(--color-primary)' : 'var(--color-surface-container)',
                            color: partMcqSelections[part.id] ? 'var(--color-on-primary)' : 'var(--color-on-surface-variant)',
                            border: 'none',
                            cursor: partMcqSelections[part.id] ? 'pointer' : 'not-allowed',
                            fontFamily: 'var(--font-label)', fontSize: 13, fontWeight: 600,
                          }}
                        >
                          Submit answer
                        </button>
                      )}
                    </div>
                  )}

                  {/* Expanded: coding subtask prompt */}
                  {isActive && !isMcq && (
                    <div style={{ padding: '0 12px 4px', borderTop: '1px solid var(--color-outline-variant)' }}>
                      {part.coding_subtask_prompt && (
                        <div style={{ padding: '10px 0 6px' }}>
                          <ReactMarkdown components={codingMarkdownComponents}>
                            {part.coding_subtask_prompt}
                          </ReactMarkdown>
                        </div>
                      )}
                      {part.coding_test_case_ids.length > 0 && (() => {
                        const allTcs = (detail?.challenge?.metadata as { test_cases?: Array<{ id: string; label: string; hidden?: boolean }> })?.test_cases ?? []
                        const partTcs = allTcs.filter(tc => part.coding_test_case_ids.includes(tc.id))
                        if (partTcs.length === 0) return null
                        return (
                          <div style={{ marginBottom: 8 }}>
                            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--color-on-surface-variant)', marginBottom: 6, fontFamily: 'var(--font-label)' }}>
                              Test cases for this part
                            </div>
                            {partTcs.map(tc => (
                              <div key={tc.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', fontSize: 12, fontWeight: 500, color: 'var(--color-on-surface-variant)' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 13, color: (tc as { hidden?: boolean }).hidden ? 'var(--color-outline)' : 'var(--color-primary)' }}>
                                  {(tc as { hidden?: boolean }).hidden ? 'visibility_off' : 'visibility'}
                                </span>
                                <span>{tc.label}</span>
                                <span style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.7 }}>
                                  {(tc as { hidden?: boolean }).hidden ? 'private' : 'visible'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )
                      })()}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Submit all parts button */}
          <div style={{ marginTop: 12 }}>
            {finalizeResult ? (
              // Finalize result card
              <div data-testid="finalize-result-card" style={{ background: 'var(--color-primary-fixed)', border: '1.5px solid var(--color-primary)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontFamily: 'var(--font-label)', fontSize: 13, fontWeight: 700, color: 'var(--color-on-surface)', marginBottom: 8 }}>
                  Total: {(finalizeResult.weighted_total ?? 0).toFixed(1)} / 5.0
                </div>
                {(finalizeResult.parts ?? []).map(p => {
                  const pid = p.id ?? p.part_id
                  const partDef = codingParts.find(cp => cp.id === pid)
                  return (
                    <div key={pid} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--color-on-surface-variant)', padding: '2px 0' }}>
                      <span>{partDef ? `Part ${partDef.sequence} · ${partDef.title}` : (p.title ?? pid)}</span>
                      <span>{(p.score ?? 0).toFixed(1)} ({Math.round((p.weight ?? 0) * 100)}%)</span>
                    </div>
                  )
                })}
                {finalizeResult.score_breakdown && (
                  <div style={{ marginTop: 10, display: 'grid', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12, color: 'var(--color-on-surface)' }}>
                      <span style={{ fontWeight: 700 }}>Correctness</span>
                      <span>{finalizeResult.score_breakdown.correctness.score.toFixed(1)} / 5</span>
                    </div>
                    <div style={{ fontSize: 12, lineHeight: 1.45, color: 'var(--color-on-surface-variant)' }}>
                      {finalizeResult.score_breakdown.correctness.summary}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12, color: 'var(--color-on-surface)' }}>
                      <span style={{ fontWeight: 700 }}>Process</span>
                      <span>{finalizeResult.score_breakdown.process.score.toFixed(1)} / 5</span>
                    </div>
                    <div style={{ fontSize: 12, lineHeight: 1.45, color: 'var(--color-on-surface-variant)' }}>
                      {finalizeResult.score_breakdown.process.summary}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  data-testid="submit-all-parts-button"
                  disabled={Object.values(partSubmissions).filter(s => s.submitted).length === 0 || isFinalizingParts}
                  onClick={async () => {
                    if (!challengeId || !attemptId) return
                    setIsFinalizingParts(true)
                    setFinalizeError(null)
                    try {
                      const res = await fetch(`/api/challenges/${challengeId}/finalize`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ attemptId }),
                      })
                      const data = await res.json().catch(() => null)
                      if (res.ok) {
                        setFinalizeResult(data)
                        setPhase('complete')
                      } else if (data?.status === 'not_ready') {
                        const nextAction = Array.isArray(data.next_actions) ? data.next_actions[0] : undefined
                        setFinalizeError([data.summary, nextAction].filter(Boolean).join(' '))
                      } else {
                        setFinalizeError(data?.details ?? data?.error ?? `Final grading failed: ${res.status}`)
                      }
                    } catch (error) {
                      setFinalizeError(error instanceof Error ? error.message : 'Final grading failed')
                    } finally {
                      setIsFinalizingParts(false)
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 0',
                    borderRadius: 10,
                    background: Object.values(partSubmissions).filter(s => s.submitted).length > 0 ? 'var(--color-primary)' : 'var(--color-surface-container)',
                    color: Object.values(partSubmissions).filter(s => s.submitted).length > 0 ? 'var(--color-on-primary)' : 'var(--color-on-surface-variant)',
                    border: 'none',
                    cursor: Object.values(partSubmissions).filter(s => s.submitted).length > 0 ? 'pointer' : 'not-allowed',
                    fontFamily: 'var(--font-label)', fontSize: 13, fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                >
                  {isFinalizingParts ? (
                    <>
                      <HatchGlyph size={14} state="reviewing" className="text-on-primary" />
                      Grading…
                    </>
                  ) : 'Submit all parts'}
                </button>
                {finalizeError && (
                  <div style={{ marginTop: 8, border: '1px solid var(--color-outline-variant)', background: 'var(--color-surface-container-low)', borderRadius: 10, padding: '10px 12px', fontFamily: 'var(--font-body)', fontSize: 12, lineHeight: 1.45, color: 'var(--color-on-surface-variant)' }}>
                    {finalizeError}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )

  const solutionsPane = !challengeId ? (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20 }}>
      <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--color-outline)' }}>menu_book</span>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-on-surface-variant)', textAlign: 'center' }}>
        Solutions not available in preview mode.
      </p>
    </div>
  ) : (
    <SolutionsPane
      solution={solution}
      loading={solutionLoading}
      challengeTitle={challengeTitle ?? null}
      onRetry={() => { void triggerSolutionGeneration() }}
      onGoToDescription={() => setLeftTab('Description')}
      activeApproachId={activeApproachId}
      onApproachChange={setActiveApproachId}
    />
  )

  const expertPicks = discussions.filter(d => d.is_expert_pick)
  const restDiscussions = discussions.filter(d => !d.is_expert_pick)

  const discussionsPane = !challengeId ? (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20 }}>
      <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--color-outline)' }}>forum</span>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-on-surface-variant)', textAlign: 'center' }}>
        Discussions not available in preview mode.
      </p>
    </div>
  ) : (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {discussionsLoading && !discussionsLoaded && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="animate-pulse"
                style={{
                  height: 112,
                  borderRadius: 12,
                  background: 'var(--color-surface-container-highest)',
                  border: '1px solid var(--color-outline-variant)',
                }}
              />
            ))}
          </div>
        )}
        {discussionsLoaded && expertPicks.length > 0 && (
          <div>
            <p style={{ fontFamily: 'var(--font-label)', fontSize: 11, fontWeight: 700, color: 'var(--color-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Expert picks
            </p>
            {expertPicks.map(d => (
              <DiscussionThread
                key={d.id}
                discussion={d}
                challengeId={challengeId}
                isOP
                upvoted={upvoted.has(d.id)}
                currentUserId={currentUserId}
                onUpvote={handleDiscussionUpvote}
                onReplyPosted={fetchDiscussions}
                onDiscussionChanged={fetchDiscussions}
                replies={d.replies ?? []}
              />
            ))}
          </div>
        )}
        {discussionsLoaded && restDiscussions.length === 0 && expertPicks.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 20 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'var(--color-outline)' }}>forum</span>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-on-surface-variant)', textAlign: 'center' }}>
              No discussions yet. Be the first to share your approach.
            </p>
          </div>
        )}
        {discussionsLoaded && restDiscussions.map(d => (
          <DiscussionThread
            key={d.id}
            discussion={d}
            challengeId={challengeId}
            upvoted={upvoted.has(d.id)}
            currentUserId={currentUserId}
            onUpvote={handleDiscussionUpvote}
            onReplyPosted={fetchDiscussions}
            onDiscussionChanged={fetchDiscussions}
            replies={d.replies ?? []}
          />
        ))}
      </div>
      <div style={{ flexShrink: 0, padding: '12px 16px', borderTop: '1px solid var(--color-outline-variant)' }}>
        <DiscussionInput challengeId={challengeId} onSubmitted={handleDiscussionSubmitted} />
      </div>
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

  const submissionsPane = (submissionsLoading && sessionHistory.length === 0) ? (
    <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[1, 2, 3].map(i => (
        <div key={i} className="animate-pulse" style={{ height: 84, borderRadius: 12, background: 'var(--color-surface-container-highest)', border: '1px solid var(--color-outline-variant)' }} />
      ))}
    </div>
  ) : sessionHistory.length === 0 ? (
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

  // Left description panel - collapses to a 32px rail when leftCollapsed=true
  const leftDescriptionPanel = leftCollapsed ? (
    // ── Collapsed 32px rail ──
    <section style={{
      width: 32,
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      background: 'var(--color-surface)',
      borderRight: '1px solid var(--color-outline-variant)',
      overflow: 'hidden',
      minHeight: 0,
    }}>
      {/* Expand chevron at top */}
      <button
        data-testid="expand-rail-button"
        onClick={() => setLeftCollapsed(false)}
        title="Expand panel"
        style={{
          marginTop: 8,
          width: 24,
          height: 24,
          borderRadius: 999,
          border: '1px solid var(--color-outline-variant)',
          background: 'var(--color-surface-container-low)',
          color: 'var(--color-on-surface-variant)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_right</span>
      </button>
      {/* "Parts" label rotated 90° */}
      <div style={{
        marginTop: 16,
        color: 'var(--color-on-surface-variant)',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        fontFamily: 'var(--font-label)',
        writingMode: 'vertical-rl',
        transform: 'rotate(180deg)',
        userSelect: 'none',
      }}>
        {isCodingChallenge && codingParts.length > 0 ? 'Parts' : 'Prompt'}
      </div>
    </section>
  ) : (
    // ── Full panel ──
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
      {leftTab === 'Solutions' && solutionsPane}
    </section>
  )

  // Origin-aware breadcrumb strip, rendered above the tab chrome on every
  // workspace type so the trail and exit are identical across FLOW / canvas /
  // coding (mirrors the analytics shell header). Deep-linking or arriving via
  // grading no longer drops the user out of the app.
  const workspaceCrumbs = workspaceBreadcrumbs(challengeTitle || 'Challenge', { fromPlan, fromDomain })
  const breadcrumbBar = (
    <div
      className="hidden md:flex items-center h-9 px-4 shrink-0 border-b"
      style={{ borderColor: 'var(--color-outline-faint)', background: 'var(--color-surface)' }}
    >
      <AppBreadcrumbs items={workspaceCrumbs} className="min-w-0" />
    </div>
  )

  // Shared top chrome - spans full width so the borderBottom is continuous
  const topChrome = (
    <div style={{
      display: 'flex',
      alignItems: 'flex-end',
      borderBottom: '1px solid var(--color-outline-faint)',
      background: 'var(--color-surface)',
      flexShrink: 0,
    }}>
      {/* Left side: back + tabs - constrained to leftWidth (or 32px rail when
          collapsed). minWidth:0 + overflowX:auto keep the four tab buttons
          inside the panel: they scroll horizontally within it instead of
          spilling past leftWidth into the centre answer pane. */}
      <div className="no-scrollbar" style={{ width: leftCollapsed ? 32 : `${leftWidth}%`, minWidth: 0, display: 'flex', alignItems: 'flex-end', gap: 2, padding: leftCollapsed ? '6px 4px 0' : '6px 8px 0', flexShrink: 0, overflowX: leftCollapsed ? 'visible' : 'auto', overflowY: 'hidden' }}>
        <button
          onClick={props.onExit ?? (() => window.history.back())}
          className="btn btn--ghost"
          style={{ padding: '6px 8px', fontSize: 12, marginBottom: 4, display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
        </button>
        {!leftCollapsed && tabs.map(t => {
          const active = leftTab === t
          return (
            <button
              key={t}
              onClick={() => setLeftTab(t)}
              style={{
                padding: '7px 11px',
                fontSize: 13,
                fontWeight: active ? 700 : 600,
                color: active ? 'var(--color-on-surface)' : 'var(--color-on-surface-variant)',
                background: active ? 'var(--color-surface-container-low)' : 'transparent',
                border: active ? '1px solid var(--color-outline-faint)' : '1px solid transparent',
                borderBottom: active ? '1px solid var(--color-surface-container-low)' : '1px solid transparent',
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                marginBottom: active ? -1 : 0,
                fontFamily: 'inherit',
                transition: 'color 120ms',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                flexShrink: 0,
                whiteSpace: 'nowrap',
              }}
            >
              <span>{t}</span>
              {t === 'Discussions' && discussionsLoaded && (
                <span style={{
                  minWidth: 18,
                  height: 18,
                  padding: '0 5px',
                  borderRadius: 99,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 800,
                  background: active ? 'var(--color-primary)' : 'var(--color-surface-container-highest)',
                  color: active ? 'var(--color-on-primary)' : 'var(--color-on-surface-variant)',
                }}>
                  {discussions.length}
                </span>
              )}
              {t === 'Submissions' && submissionBadgeCount > 0 && (
                <span style={{
                  minWidth: 18,
                  height: 18,
                  padding: '0 5px',
                  borderRadius: 99,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 800,
                  background: active ? 'var(--color-primary)' : 'var(--color-surface-container-highest)',
                  color: active ? 'var(--color-on-primary)' : 'var(--color-on-surface-variant)',
                }}>
                  {submissionBadgeCount}
                </span>
              )}
            </button>
          )
        })}
        {/* Collapse button - only shown when expanded and on coding challenges */}
        {!leftCollapsed && isCodingChallenge && (
          <button
            data-testid="collapse-toggle-button"
            onClick={() => setLeftCollapsed(true)}
            title="Collapse panel"
            style={{
              marginLeft: 'auto',
              marginBottom: 4,
              padding: '4px 6px',
              borderRadius: 6,
              border: '1px solid var(--color-outline-variant)',
              background: 'transparent',
              color: 'var(--color-on-surface-variant)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              fontSize: 11,
              gap: 2,
              fontFamily: 'inherit',
              flexShrink: 0,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_left</span>
          </button>
        )}
      </div>
      {/* Drag handle spacer - only when expanded */}
      <div style={{ width: leftCollapsed ? 0 : 6, flexShrink: 0 }} />
      {/* Right side: workspace controls only. Challenge type lives in the description tags. */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', gap: 16 }}>
        {isCanvasChallenge ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
              <CanvasThinkingDock
                challengeType={apiChallengeType as 'system_design' | 'data_modeling'}
                scene={scene}
                contextPackFilledCount={contextPackFieldCount}
                contextPackTotal={contextPack.length}
                contextPackText={contextPackText}
                expanded={canvasLoopExpanded}
                onAskHatch={queueHatchPrompt}
                onOpenContextPack={openContextPack}
                onToggleExpanded={() => setCanvasLoopExpanded((v) => !v)}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <button
                onClick={() => {
                  window.dispatchEvent(new Event('start-canvas-tour'))
                  setHintForceOpen(true)
                  window.setTimeout(() => setHintForceOpen(false), 400)
                }}
                className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-surface-container-low border border-outline-variant text-on-surface-variant hover:text-on-surface text-xs font-semibold"
                title="How this canvas works"
                aria-label="How this canvas works"
              >?</button>
              <button
                onClick={() => setCanvasMaximised((v) => !v)}
                className="inline-flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
                title={canvasMaximised ? 'Exit full screen' : 'Full screen canvas'}
                aria-label={canvasMaximised ? 'Exit full screen' : 'Full screen canvas'}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {canvasMaximised ? 'fullscreen_exit' : 'fullscreen'}
                </span>
              </button>
            </div>
          </>
        ) : isCodingChallenge ? (
          <>
            <div style={{ flex: 1 }} />
            <button
              onClick={() => setCodingMaximised((v) => !v)}
              className="inline-flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
              title={codingMaximised ? 'Exit full screen' : 'Full screen workspace'}
              aria-label={codingMaximised ? 'Exit full screen' : 'Full screen workspace'}
            >
              <span className="material-symbols-outlined text-[20px]">
                {codingMaximised ? 'fullscreen_exit' : 'fullscreen'}
              </span>
            </button>
          </>
        ) : (
          <>
            {/* Stepper centered in the right panel */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', minWidth: 0 }}>
              <FlowStepper
                currentStep={currentStep}
                completedSteps={completedSteps}
                /* Commit-forward: completed steps are locked. Retake the challenge to redo a step. */
                onStepClick={undefined}
                questionIdx={questionIdx}
                questionCount={activeStepData?.questions.length}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <button
                className="btn btn--ghost"
                style={{
                  padding: '6px 10px', fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: hintOpen ? 'var(--color-amber-soft)' : undefined,
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
          </>
        )}
      </div>
    </div>
  )

  // Shared bottom footer - spans full width so the borderTop is continuous
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
        width: leftCollapsed ? 32 : `${leftWidth}%`,
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
          </>
        ) : null}
      </div>
      {/* Drag handle spacer - matches drag handle visibility */}
      <div style={{ width: leftCollapsed ? 0 : 6, flexShrink: 0 }} />
      {/* Right side: prev + next/submit */}
      <div style={{ flex: 1, display: 'flex', justifyContent: questionIdx > 0 ? 'space-between' : 'flex-end', alignItems: 'center', padding: '10px 16px' }}>
        {questionIdx > 0 && (
          <button
            className="btn btn--ghost"
            style={{ fontSize: 12, padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            disabled={activeSubmitting || ackVisible}
            onClick={handlePreviousQuestion}
          >
            <span className="material-symbols-outlined msi-sm">arrow_back</span> Previous
          </button>
        )}
        <button
          className="btn btn--primary"
          style={{ fontSize: 13, padding: '10px 22px', display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--color-primary)', color: 'var(--color-on-primary)', borderRadius: 99, fontWeight: 600, border: 'none' }}
          disabled={!currentQuestionAnswered || activeSubmitting || ackVisible}
          onClick={isLastQuestionInStep ? handleStepSubmit : handleNextQuestion}
        >
          {activeSubmitting ? 'Grading…' : primaryButtonLabel}
          {!activeSubmitting && <span className="material-symbols-outlined msi-sm">arrow_forward</span>}
          {activeSubmitting && <HatchGlyph size={16} state="reviewing" className="text-on-primary" />}
        </button>
      </div>
    </div>
  ) : null

  // Shared drag handle - sits between left and right panel; hidden when rail is
  // collapsed or on mobile (the stacked layout has no side-by-side split to drag).
  const dragHandle = (leftCollapsed || isMobile) ? null : (
    <div
      onMouseDown={handleSeparatorMouseDown}
      style={{ width: 6, cursor: 'col-resize', background: 'transparent', flexShrink: 0, position: 'relative' }}
    >
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 2, height: 32, background: 'var(--color-outline-variant)', borderRadius: 999 }} />
    </div>
  )

  // ── Mobile (phone) chrome ──────────────────────────────────────────────────
  // On phones the desktop two-pane split is replaced by a vertical stack. These
  // consts are only consumed inside the `isMobile`/`mobileStacked` branches of the
  // return trees below; on desktop they evaluate to null so no extra work is done.
  const mobileTabBadge = (count: number, active: boolean) => (
    <span style={{
      minWidth: 18, height: 18, padding: '0 5px', borderRadius: 99,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11, fontWeight: 800,
      background: active ? 'var(--color-primary)' : 'var(--color-surface-container-highest)',
      color: active ? 'var(--color-on-primary)' : 'var(--color-on-surface-variant)',
    }}>{count}</span>
  )

  // Top bar: back button + horizontally scrollable tabs (no clipping).
  const mobileChrome = isMobile ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid var(--color-outline-faint)', background: 'var(--color-surface)', flexShrink: 0, padding: '6px 8px' }}>
      <button
        onClick={props.onExit ?? (() => window.history.back())}
        className="btn btn--ghost"
        style={{ padding: '6px 8px', display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}
        aria-label="Back"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
      </button>
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', flexWrap: 'nowrap', WebkitOverflowScrolling: 'touch', flex: 1 }}>
        {tabs.map(t => {
          const active = leftTab === t
          return (
            <button
              key={t}
              onClick={() => { setLeftTab(t); setMobileDescOpen(true) }}
              style={{
                flexShrink: 0, whiteSpace: 'nowrap', padding: '7px 14px', fontSize: 13,
                fontWeight: active ? 700 : 600,
                color: active ? 'var(--color-on-surface)' : 'var(--color-on-surface-variant)',
                background: active ? 'var(--color-surface-container-low)' : 'transparent',
                border: '1px solid ' + (active ? 'var(--color-outline-faint)' : 'transparent'),
                borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
            >
              <span>{t}</span>
              {t === 'Discussions' && discussionsLoaded && mobileTabBadge(discussions.length, active)}
              {t === 'Submissions' && submissionBadgeCount > 0 && mobileTabBadge(submissionBadgeCount, active)}
            </button>
          )
        })}
      </div>
    </div>
  ) : null

  // Collapsible description drawer (collapsed by default so the question shows first).
  const mobileDrawer = isMobile ? (
    <div style={{ flexShrink: 0, borderBottom: '1px solid var(--color-outline-faint)', background: 'var(--color-surface)' }}>
      <button
        onClick={() => setMobileDescOpen(v => !v)}
        aria-expanded={mobileDescOpen}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--color-on-surface-variant)', flexShrink: 0 }}>description</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-on-surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {mobileDescOpen
              ? `Hide ${leftTab.toLowerCase()}`
              : (leftTab === 'Description' ? (challengeTitle ?? 'Show brief') : `Show ${leftTab.toLowerCase()}`)}
          </span>
        </span>
        <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--color-on-surface-variant)', flexShrink: 0 }}>
          {mobileDescOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>
      {mobileDescOpen && (
        <div style={{ maxHeight: '55vh', overflowY: 'auto', borderTop: '1px solid var(--color-outline-faint)' }}>
          {leftTab === 'Description' && descriptionPane}
          {leftTab === 'Discussions' && discussionsPane}
          {leftTab === 'Submissions' && submissionsPane}
        </div>
      )}
    </div>
  ) : null

  // FLOW step bar in a horizontally scrollable wrapper.
  const mobileStepperBar = isMobile ? (
    <div style={{ flexShrink: 0, overflowX: 'auto', WebkitOverflowScrolling: 'touch', borderBottom: '1px solid var(--color-outline-faint)', background: 'var(--color-surface)', padding: '8px 12px', display: 'flex', justifyContent: 'center' }}>
      <FlowStepper
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={undefined}
        questionIdx={questionIdx}
        questionCount={activeStepData?.questions.length}
      />
    </div>
  ) : null

  // Full-width footer: prev + next/submit, reusing the same handlers as desktop.
  const mobileFooter = (isMobile && currentQuestion) ? (
    <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: questionIdx > 0 ? 'space-between' : 'flex-end', gap: 10, borderTop: '1px solid var(--color-outline-faint)', background: 'var(--color-surface)', padding: '10px 14px' }}>
      {questionIdx > 0 && (
        <button
          className="btn btn--ghost"
          style={{ fontSize: 12, padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
          disabled={activeSubmitting || ackVisible}
          onClick={handlePreviousQuestion}
        >
          <span className="material-symbols-outlined msi-sm">arrow_back</span> Previous
        </button>
      )}
      <button
        className="btn btn--primary"
        style={{ fontSize: 13, padding: '10px 22px', display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--color-primary)', color: 'var(--color-on-primary)', borderRadius: 99, fontWeight: 600, border: 'none' }}
        disabled={!currentQuestionAnswered || activeSubmitting || ackVisible}
        onClick={isLastQuestionInStep ? handleStepSubmit : handleNextQuestion}
      >
        {activeSubmitting ? 'Grading…' : primaryButtonLabel}
        {!activeSubmitting && <span className="material-symbols-outlined msi-sm">arrow_forward</span>}
        {activeSubmitting && <HatchGlyph size={16} state="reviewing" className="text-on-primary" />}
      </button>
    </div>
  ) : null

  // Canvas / coding challenges are gated to this notice on phones — the Excalidraw
  // canvas and Monaco editor need a larger screen. The full brief still renders so
  // the user knows what the challenge is.
  // Canvas (system design) / coding challenges on a phone: the editor can't run
  // here, so the answer surface is replaced by a "best on desktop" notice. The
  // rest of the workspace stays - scrollable tabs (Description / Discussions /
  // Submissions) and the full brief, which scrolls because each pane is a
  // flex:1 / overflowY:auto child of a bounded flex-column section (the same
  // pattern the desktop left panel uses). Bottom padding reserves space for the
  // fixed mobile BottomTabs nav so nothing is occluded.
  const mobileInterviewNotice = (
    <div className="flex flex-col items-center text-center gap-3 px-6 pt-8 pb-6 max-w-md mx-auto" style={{ flexShrink: 0 }}>
      <HatchGlyph size={56} state="idle" className="text-primary" />
      <h2 className="font-headline text-xl text-on-surface">Best experienced on desktop</h2>
      <p className="font-body text-sm text-on-surface-variant">
        {isCodingChallenge
          ? 'This coding challenge uses a full code editor that needs a larger screen. Open it on a desktop to work through it. You can still read the brief below.'
          : `This ${apiChallengeType === 'data_modeling' ? 'data modeling' : 'system design'} challenge uses a drawing canvas that needs a larger screen. Open it on a desktop to work through it. You can still read the brief below.`}
      </p>
      <a
        href="/challenges"
        className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-primary text-on-primary font-label font-semibold text-sm px-5 py-2.5"
      >
        <span className="material-symbols-outlined text-[18px]">grid_view</span> Back to Practice
      </a>
    </div>
  )

  const mobileInterviewView = (
    <div className="flex flex-col overflow-hidden h-full pb-[calc(56px+env(safe-area-inset-bottom))] md:pb-0" style={{ background: 'var(--color-background)' }}>
      {mobileChrome}
      <section style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0, background: 'var(--color-surface)' }}>
        {leftTab === 'Description' && mobileInterviewNotice}
        {leftTab === 'Description' && descriptionPane}
        {leftTab === 'Discussions' && discussionsPane}
        {leftTab === 'Submissions' && submissionsPane}
      </section>
    </div>
  )

  if (phase === 'reveal' || phase === 'complete' || selectedHistoryIdx !== null) {
    const historyRecord = selectedHistoryIdx !== null ? sessionHistory[selectedHistoryIdx] : null
    const showMirror = phase === 'complete' || historyRecord !== null
    // recordSubmission auto-selects the just-graded attempt (idx 0), flipping the
    // complete screen into "history view". When the selected record IS the attempt
    // we just finished in this session, the live code/run context is still in
    // memory, so Ask Hatch and Retry grading should remain available. Suppress them
    // only when browsing an OLDER attempt.
    const isCurrentAttemptRecord =
      historyRecord !== null && selectedHistoryIdx === 0 && historyRecord.attemptId === attemptId
    // Treat the current-attempt record like the live complete view for coding controls.
    const codingControlsLive = !historyRecord || isCurrentAttemptRecord

    return (
      <div className="flex flex-col overflow-hidden h-full pb-[calc(56px+env(safe-area-inset-bottom))] md:pb-0">
        {/* Same full-width top chrome as question phase (desktop only - on mobile
            the feedback fills the width and carries its own navigation). */}
        {!isMobile && breadcrumbBar}
        {!isMobile && topChrome}

        {/* Middle: resizable two-pane content on desktop, single column on mobile */}
        <div ref={containerRef} className={isMobile ? 'flex flex-col flex-1 min-h-0 overflow-hidden' : 'flex flex-1 min-h-0 overflow-hidden'}>
          {!isMobile && leftDescriptionPanel}
          {!isMobile && dragHandle}

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
                  Attempt {sessionHistory.length - selectedHistoryIdx!} - {historyRecord.completedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}

            {/* Session complete banner */}
            {phase === 'complete' && !historyRecord && (
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderBottom: '1px solid var(--color-outline-faint)', background: 'var(--color-primary-fixed)' }}>
                <span className="material-symbols-outlined msi-sm" style={{ color: 'var(--color-primary)' }}>check_circle</span>
                <span style={{ fontFamily: 'var(--font-label)', fontSize: 12, fontWeight: 600, color: 'var(--color-on-surface)' }}>
                  {isCodingChallenge
                    ? isLoadingGrading
                      ? 'Tests complete - Hatch is reviewing your solution'
                      : 'Review complete - inspect tests, ask Hatch, or return to the editor'
                    : 'Session complete - reviewing your results'}
                </span>
              </div>
            )}

            {/* Interview feedback for canvas challenge types - fills the right panel
                in place of the canvas, matching product sense PostSessionMirror UX.
                Renders for both fresh submissions (interviewGrade) and history view
                (historyInterviewGrade fetched by attempt id). */}
            {isCanvasChallenge && phase === 'complete' && interviewGrade && (
              <div className="flex-1 min-h-0 overflow-y-auto animate-step-enter">
                <InterviewFeedback
                  grade={interviewGrade}
                  challengeType={apiChallengeType ?? 'system_design'}
                  canvasPngUrl={submittedCanvasPngUrl}
                  nextChallengeHref={nextChallengeHref}
                  backToListHref={workspaceExitHref({ fromPlan, fromDomain }, props.returnTo)}
                  onRetry={() => window.location.reload()}
                  onBackToCanvas={() => {
                    setPhase('question')
                    setInterviewGrade(null)
                  }}
                />
              </div>
            )}
            {isCanvasChallenge && historyRecord && (
              historyGradeLoading ? (
                <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-4">
                  <HatchGlyph size={40} state="reviewing" className="text-primary" />
                  <p className="font-body text-sm text-on-surface-variant">Loading your feedback…</p>
                </div>
              ) : historyInterviewGrade ? (
                <div className="flex-1 min-h-0 overflow-y-auto animate-step-enter">
                  <InterviewFeedback
                    grade={historyInterviewGrade}
                    challengeType={apiChallengeType ?? 'system_design'}
                    canvasPngUrl={historyRecord.canvasPngUrl}
                    nextChallengeHref={nextChallengeHref}
                    backToListHref={workspaceExitHref({ fromPlan, fromDomain }, props.returnTo)}
                  />
                </div>
              ) : (
                <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
                  <span className="material-symbols-outlined text-on-surface-variant text-[40px]">description</span>
                  <p className="font-body text-sm text-on-surface-variant max-w-sm">
                    No feedback recorded for this attempt.
                  </p>
                </div>
              )
            )}

            {/* Coding challenge feedback - two-column correctness + grading view */}
            {isCodingChallenge && (phase === 'complete' || historyRecord) && (
              <div className="flex-1 min-h-0 overflow-y-auto p-4 animate-step-enter">
                {historyRecord && historyGradeLoading ? (
                  <div className="flex h-full flex-col items-center justify-center gap-4">
                    <HatchGlyph size={40} state="reviewing" className="text-primary" />
                    <p className="font-body text-sm text-on-surface-variant">Loading your SQL/code results…</p>
                  </div>
                ) : (
                  <CodingFeedback
                    // For the current-attempt record, prefer the live in-memory
                    // state (it reflects the latest retry); only browse persisted
                    // history data for OLDER attempts.
                    correctness={codingControlsLive ? lastRunResult : historyCodingCorrectness}
                    grading={codingControlsLive ? codingFeedback : historyCodingFeedback}
                    submittedCode={codingControlsLive ? currentCode : historySubmittedCode}
                    language={codingControlsLive ? currentLanguage : historyCodingLanguage}
                    isLoadingGrading={codingControlsLive ? isLoadingGrading : false}
                    isSqlMode={codingControlsLive
                      ? currentLanguage === 'sql'
                      : (historyCodingLanguage === 'sql' || historyRecord?.challengeType === 'sql')}
                    gradingError={codingControlsLive ? codingGradingError : undefined}
                    onRetry={codingControlsLive ? async () => {
                      setSelectedHistoryIdx(null)
                      setIsSubmittingCoding(false)
                      setIsLoadingGrading(false)
                      setLastRunResult(null)
                      setCodingFeedback(null)
                      setCodingGradingError(undefined)
                      setOutputPanelStatus('idle')
                      setOutputPanelError(undefined)
                      const nextAttempt = await startAttempt(initialRoleId)
                      if (nextAttempt) {
                        setAttemptId(nextAttempt.id)
                        setPhase('question')
                      }
                    } : undefined}
                    onRetryGrading={codingControlsLive ? retryCodingGrading : undefined}
                    onAskHatch={codingControlsLive ? () => queueHatchPrompt('My tests are failing. Can you help me figure out why?', false) : undefined}
                    onNextChallenge={nextChallengeHref && codingControlsLive
                      ? () => { window.location.href = nextChallengeHref }
                      : undefined
                    }
                  />
                )}
                {/* Hatch coach on the coding complete screen — the question-phase
                    CanvasChatPanel is unmounted here, so mount a dedicated instance
                    so "Ask Hatch" has a panel to open. Available for the live
                    complete view and the just-graded current attempt. */}
                {codingControlsLive && (
                  <CanvasChatPanel
                    attemptId={attemptId ?? ''}
                    challengeId={isApiMode ? (props as Extract<FlowWorkspaceProps, { mode: 'api' }>).challengeId : ''}
                    challengeType="coding"
                    scene={scene}
                    queuedPrompt={queuedHatchPrompt}
                    isOpen={chatPanelOpen}
                    onToggle={() => setChatPanelOpen((v) => !v)}
                    onCanvasActions={() => { /* no-op: coding mode doesn't execute canvas actions */ }}
                    currentCode={currentCode}
                    currentLanguage={currentLanguage}
                    lastRunResult={lastRunResult}
                    challengeTitle={challengeTitle ?? undefined}
                    problemStatement={scenarioContext ?? challengeScenarioQ ?? undefined}
                    solutionsOpen={solutionsOpen}
                    activeSolutionApproach={activeSolutionApproach}
                  />
                )}
              </div>
            )}

            {!isInterviewChallenge && (showMirror ? (
              <div className="flex-1 min-h-0 animate-step-enter">
                <PostSessionMirror
                  challengeTitle={challengeTitle ?? 'Challenge'}
                  totalScore={historyRecord ? historyRecord.totalScore : (completionData?.total_score ?? 0)}
                  maxScore={historyRecord ? historyRecord.maxScore : (completionData?.max_score ?? 3)}
                  xpAwarded={historyRecord ? historyRecord.xpAwarded : (completionData?.xp_awarded ?? 0)}
                  stepResults={historyRecord ? historyRecord.stepResults : mirrorStepResults}
                  challengeId={isApiMode ? (props as Extract<FlowWorkspaceProps, { mode: 'api' }>).challengeId : undefined}
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
                  onNextChallenge={nextChallengeHref && !historyRecord
                    ? () => { window.location.href = nextChallengeHref }
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
            ))}
          </div>
        </div>
      </div>
    )
  }

  // phase === 'question'
  // Canvas (system design) / coding challenges can't render their editor on a
  // phone - gate them to a "best on desktop" notice instead of a broken canvas.
  if (isMobile && isInterviewChallenge) {
    return mobileInterviewView
  }
  return (
    <div className="flex flex-col overflow-hidden h-full pb-[calc(56px+env(safe-area-inset-bottom))] md:pb-0">
      {/* Desktop: full-width chrome (tabs + stepper). Mobile: stacked chrome -
          scrollable tabs, collapsible description drawer, scrollable step bar. */}
      {mobileStacked ? (
        <>
          {mobileChrome}
          {mobileDrawer}
          {mobileStepperBar}
        </>
      ) : (
        <>
          {breadcrumbBar}
          {topChrome}
        </>
      )}

      {/* Middle: resizable two-pane on desktop, single column on mobile */}
      <div ref={containerRef} className={mobileStacked ? 'flex flex-col flex-1 min-h-0 overflow-hidden' : 'flex flex-1 min-h-0 overflow-hidden'}>
        {!mobileStacked && leftDescriptionPanel}
        {!mobileStacked && dragHandle}

        {/* Right pane: scrollable workspace content only */}
        <section style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--color-background)', overflow: 'hidden', minHeight: 0 }}>
          {/* Grading interstitial - fills the right panel while the model grades. */}
          {isCanvasChallenge && isSubmittingInterview && (
            <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-4 animate-step-enter">
              <HatchGlyph size={48} state="reviewing" className="text-primary" />
              <div className="font-headline text-xl text-on-surface">Hatch is reviewing your design…</div>
              <div className="font-body text-sm text-on-surface-variant max-w-md text-center">
                Reading the schema, checking relationships, and writing your feedback.
              </div>
            </div>
          )}

          {/* Canvas workspace for interview challenge types */}
          {isCanvasChallenge && !isSubmittingInterview && (
            <div style={canvasMaximised
              ? { position: 'fixed', inset: 0, zIndex: 50, display: 'flex', background: 'var(--color-background)' }
              : { flex: '1 1 auto', display: 'flex', minHeight: 0, minWidth: 0, position: 'relative' }
              }>
              {/* Canvas column - top chrome owns the guide so canvas stays clear. */}
              <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <div data-tour-target="canvas-surface" style={{ flex: 1, minWidth: 0, minHeight: 0, position: 'relative' }}>
                  <ExcalidrawCanvas
                    sessionId={attemptId ?? 'draft'}
                    onSnapshot={setCanvasScene}
                    onElementsAdded={(count) => requestNudge(count)}
                    apiRef={excalidrawApiRef}
                    exportRef={canvasExportRef}
                  />
                  <CanvasTourMount active={isCanvasChallenge && !isSubmittingInterview} />
                  {/* Branded empty-state: replaces the blank-Excalidraw paralysis
                      with a centered Hatch + three first moves. Shown only while
                      the canvas has no entity; un-mounts the moment one lands. */}
                  {scene.entities.length === 0 && (
                    <CanvasEmptyState
                      challengeType={apiChallengeType as CanvasChallengeType}
                      guidance={guidance}
                      onUseTemplate={handleUseTemplate}
                      onAskHatch={queueHatchPrompt}
                      onOpenNotes={openContextPack}
                    />
                  )}
                  {/* The compact coach card carries the later phases once the user
                      has drawn; hidden while the full empty-state is up. */}
                  {scene.entities.length > 0 && (
                    <CanvasCoachCard
                      challengeType={apiChallengeType as CanvasChallengeType}
                      guidance={guidance}
                      forceOpen={hintForceOpen}
                      onOpenNotes={openContextPack}
                      onAskHatch={queueHatchPrompt}
                    />
                  )}
                  {/* Exit fullscreen - only visible when maximised, since the
                      topChrome (which holds the toggle in the unmaximised view)
                      is hidden behind the fixed overlay. */}
                  {canvasMaximised && (
                    <button
                      onClick={() => setCanvasMaximised(false)}
                      className="absolute top-3 right-3 z-30 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-surface-container-high border border-outline-variant text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest shadow-sm font-label text-xs font-semibold transition-colors"
                      title="Exit full screen"
                      aria-label="Exit full screen"
                    >
                      <span className="material-symbols-outlined text-[16px]">fullscreen_exit</span>
                      Exit full screen
                    </button>
                  )}
                </div>
              </div>
              {/* Chat panel */}
              <CanvasChatPanel
                attemptId={attemptId ?? ''}
                challengeId={isApiMode ? (props as Extract<FlowWorkspaceProps, { mode: 'api' }>).challengeId : ''}
                challengeType={apiChallengeType as 'system_design' | 'data_modeling'}
                scene={scene}
                contextPack={contextPackText || undefined}
                queuedPrompt={queuedHatchPrompt}
                isOpen={chatPanelOpen}
                onToggle={() => setChatPanelOpen((v) => !v)}
                autoOpenKey="canvas"
                onCanvasActions={handleCanvasActions}
                proactiveNudge={proactiveNudge}
                onDismissNudge={() => setProactiveNudge(null)}
                canvasDrawFailure={canvasDrawFailure}
                guidancePhase={guidance.phase}
                guidanceLabels={guidance.labels}
                solutionsOpen={solutionsOpen}
                activeSolutionApproach={activeSolutionApproach}
              />
            </div>
          )}

          {/* Coding workspace - Monaco editor + output panel + Hatch chat */}
          {isCodingChallenge && phase === 'question' && (
            <div style={codingMaximised
              ? { position: 'fixed', inset: 0, zIndex: 50, display: 'flex', background: 'var(--color-background)' }
              : { flex: '1 1 auto', display: 'flex', minHeight: 0, minWidth: 0, position: 'relative' }
            }>
              {/* Floating tab strip - visible only when panel is collapsed + multi-part */}
              {leftCollapsed && codingParts.length > 0 && (
                <div data-testid="floating-tab-strip" style={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  zIndex: 20,
                  display: 'flex',
                  gap: 4,
                  flexWrap: 'wrap',
                }}>
                  {codingParts.map((part) => {
                    const isActive = activePartId === part.id
                    const partSub = partSubmissions[part.id]
                    const partRun = partRunResults[part.id]
                    let chipBg = 'var(--color-surface-container-high)'
                    let chipColor = 'var(--color-on-surface-variant)'
                    if (partSub?.submitted) { chipBg = 'var(--color-primary)'; chipColor = 'var(--color-on-primary)' }
                    else if (partRun) { chipBg = 'var(--color-primary-container)'; chipColor = 'var(--color-on-surface)' }
                    return (
                      <button
                        key={part.id}
                        onClick={() => {
                          setActivePartId(part.id)
                          setLeftCollapsed(false)
                        }}
                        style={{
                          fontFamily: 'var(--font-label)', fontSize: 11, fontWeight: 600,
                          padding: '3px 10px', borderRadius: 999,
                          background: isActive ? 'var(--color-primary)' : chipBg,
                          color: isActive ? 'var(--color-on-primary)' : chipColor,
                          border: '1px solid var(--color-outline-variant)',
                          cursor: 'pointer',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        }}
                      >
                        P{part.sequence}
                      </button>
                    )
                  })}
                </div>
              )}
              {codingMaximised && (
                <button
                  onClick={() => setCodingMaximised(false)}
                  className="absolute top-3 right-3 z-30 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-surface-container-high border border-outline-variant text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest shadow-sm font-label text-xs font-semibold transition-colors"
                  title="Exit full screen"
                  aria-label="Exit full screen"
                >
                  <span className="material-symbols-outlined text-[16px]">fullscreen_exit</span>
                  Exit full screen
                </button>
              )}
              {/* Editor column: toolbar + Monaco + resizable output panel */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
                {/* Toolbar: language selector + run + submit */}
                <div style={{
                  height: 40,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '0 12px',
                  borderBottom: '1px solid var(--color-outline-faint)',
                  background: 'var(--color-surface-container)',
                }}>
                  {/* Language selector */}
                  {(() => {
                    const metadata = (isApiMode ? detail?.challenge?.metadata : null) as { supported_languages?: string[] } | null | undefined
                    const supportedLangs = (metadata?.supported_languages ?? []) as SupportedLanguage[]
                    return (
                      <LanguageSelector
                        value={currentLanguage}
                        onChange={handleLanguageChange}
                        options={supportedLangs.length > 0 ? supportedLangs : undefined}
                        disabled={isSubmittingCoding || codeRunner.status === 'running'}
                      />
                    )
                  })()}
                  {/* Active part label (multi-part only) */}
                  {codingParts.length > 0 && activePartId && (
                    <span style={{ fontFamily: 'var(--font-label)', fontSize: 11, fontWeight: 600, color: 'var(--color-on-surface-variant)', padding: '2px 8px', borderRadius: 999, background: 'var(--color-surface-container-low)', border: '1px solid var(--color-outline-variant)' }}>
                      {(() => { const p = codingParts.find(cp => cp.id === activePartId); return p ? `Part ${p.sequence}` : '' })()}
                    </span>
                  )}
                  <div style={{ flex: 1 }} />
                  {/* SQL hydration status */}
                  {currentLanguage === 'sql' && codeRunner.status === 'hydrating' && (
                    <span className="text-xs text-on-surface-variant font-label flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
                      Setting up database…
                    </span>
                  )}
                  {currentLanguage === 'sql' && codeRunner.sqlError && (
                    <span className="text-xs text-error font-label">DB error: {codeRunner.sqlError}</span>
                  )}
                  {/* Run button */}
                  <button
                    onClick={async () => {
                      if (codeRunner.status === 'running') return
                      setOutputPanelStatus('running')
                      setOutputPanelError(undefined)
                      try {
                        // When a part is active, pass only that part's test case IDs
                        const activePart = codingParts.find(p => p.id === activePartId)
                        const testCaseIds = activePart?.coding_test_case_ids?.length
                          ? activePart.coding_test_case_ids
                          : undefined
                        const result = await codeRunner.run(currentCode, testCaseIds)
                        if (result) {
                          setLastRunResult(result)
                          setOutputPanelStatus('done')
                          // Save run result per part
                          if (activePartId) {
                            setPartRunResults(prev => ({ ...prev, [activePartId]: result }))
                          }
                        } else {
                          setOutputPanelStatus('idle')
                        }
                      } catch (err) {
                        setOutputPanelStatus('error')
                        setOutputPanelError(err instanceof Error ? err.message : 'Run failed')
                      }
                    }}
                    disabled={codeRunner.status === 'running' || codeRunner.status === 'hydrating' || isSubmittingCoding}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-surface-container-high border border-outline-variant text-on-surface font-label text-xs font-semibold hover:bg-surface-container-highest disabled:opacity-50 transition-colors"
                    data-testid="run-button"
                  >
                    {codeRunner.status === 'running' ? (
                      <>
                        <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
                        Running…
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[14px]">play_arrow</span>
                        Run
                      </>
                    )}
                  </button>
                  {/* Submit button - "Submit Part" in multi-part mode, "Submit" in single-prompt */}
                  {codingParts.length > 0 ? (
                    // Multi-part: Submit Part (only active when a coding subtask part is open)
                    activePartId && codingParts.find(p => p.id === activePartId)?.response_type === 'coding_subtask' ? (
                      <button
                        onClick={async () => {
                          const partId = activePartId
                          if (!partId || !challengeId || !attemptId || isSubmittingCoding) return
                          setIsSubmittingCoding(true)
                          setOutputPanelStatus('running')
                          setOutputPanelError(undefined)
                          try {
                            const activePart = codingParts.find(p => p.id === partId)
                            const testCaseIds = activePart?.coding_test_case_ids ?? []
                            // Run only this part's test cases (visible + hidden among them).
                            // Using submit() here would run every test case on the challenge,
                            // which the API rejects because results would be out of part scope.
                            const result = await codeRunner.run(currentCode, testCaseIds.length > 0 ? testCaseIds : undefined)
                            if (result) {
                              setLastRunResult(result)
                              setOutputPanelStatus('done')
                              setPartRunResults(prev => ({ ...prev, [partId]: result }))
                            }
                            // Post to coding-submit with partId
                            const submitRes = await fetch(`/api/challenges/${challengeId}/coding-submit`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                attemptId,
                                partId,
                                finalCode: currentCode,
                                language: currentLanguage,
                                correctnessPayload: result ?? null,
                                testCaseIds,
                              }),
                            })
                            if (submitRes.ok) {
                              setPartSubmissions(prev => ({ ...prev, [partId]: { submitted: true } }))
                              // Save current draft so it persists
                              setCodingDrafts(prev => ({
                                ...prev,
                                [partId]: { ...(prev[partId] ?? {}), [currentLanguage]: currentCode },
                              }))
                            }
                          } catch (err) {
                            setOutputPanelStatus('error')
                            setOutputPanelError(err instanceof Error ? err.message : 'Submit failed')
                          } finally {
                            setIsSubmittingCoding(false)
                          }
                        }}
                        disabled={codeRunner.status === 'running' || codeRunner.status === 'hydrating' || isSubmittingCoding}
                        className="inline-flex items-center gap-1.5 px-5 py-1.5 rounded-full bg-primary text-on-primary font-label text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
                        data-testid="submit-part-button"
                      >
                        {isSubmittingCoding ? (
                          <>
                            <HatchGlyph size={14} state="reviewing" className="text-on-primary" />
                            Submitting…
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[14px]">upload</span>
                            Submit Part
                          </>
                        )}
                      </button>
                    ) : null
                  ) : (
                    // Single-prompt: existing submit button
                    <button
                      onClick={handleCodingSubmit}
                      disabled={codeRunner.status === 'running' || codeRunner.status === 'hydrating' || isSubmittingCoding}
                      className="inline-flex items-center gap-1.5 px-5 py-1.5 rounded-full bg-primary text-on-primary font-label text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
                      data-testid="submit-button"
                    >
                      {isSubmittingCoding ? (
                        <>
                          <HatchGlyph size={14} state="reviewing" className="text-on-primary" />
                          Submitting…
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[14px]">upload</span>
                          Submit
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Monaco editor + draggable divider + output panel (default 60/40, user-resizable) */}
                <div ref={codingPaneRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  {/* Editor */}
                  <div style={{ flex: `${editorHeightPct} 1 0`, minHeight: 0 }} data-testid="monaco-editor-container">
                    <MonacoCodeEditor
                      value={currentCode}
                      onChange={setCurrentCode}
                      language={currentLanguage}
                      height="100%"
                      onPaste={handleCodePaste}
                      readOnly={isSubmittingCoding}
                    />
                  </div>
                  {/* Draggable divider */}
                  <div
                    onMouseDown={handleCodingDividerMouseDown}
                    role="separator"
                    aria-orientation="horizontal"
                    aria-label="Resize editor and output panel"
                    style={{
                      height: 6,
                      cursor: 'ns-resize',
                      flexShrink: 0,
                      background: 'var(--color-outline-faint)',
                      transition: 'background-color 120ms',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--color-outline-variant)' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--color-outline-faint)' }}
                  />
                  {/* Output panel */}
                  <div style={{ flex: `${100 - editorHeightPct} 1 0`, minHeight: 0 }}>
                    <CodeOutputPanel
                      results={lastRunResult}
                      status={outputPanelStatus}
                      isSqlMode={currentLanguage === 'sql'}
                      errorMessage={outputPanelError}
                    />
                  </div>
                </div>
              </div>

              {/* Hatch chat panel - right side */}
              {(() => {
                const activePart = codingParts.find(p => p.id === activePartId)
                return (
                  <CanvasChatPanel
                    attemptId={attemptId ?? ''}
                    challengeId={isApiMode ? (props as Extract<FlowWorkspaceProps, { mode: 'api' }>).challengeId : ''}
                    challengeType="coding"
                    scene={scene}
                    queuedPrompt={queuedHatchPrompt}
                    isOpen={chatPanelOpen}
                    onToggle={() => setChatPanelOpen((v) => !v)}
                    onCanvasActions={() => { /* no-op: coding mode doesn't execute canvas actions */ }}
                    currentCode={currentCode}
                    currentLanguage={currentLanguage}
                    lastRunResult={lastRunResult}
                    challengeTitle={challengeTitle ?? undefined}
                    problemStatement={scenarioContext ?? challengeScenarioQ ?? undefined}
                    activePartId={activePart?.id}
                    activePartSequence={activePart?.sequence}
                    activePartTitle={activePart?.title}
                    activePartPrompt={activePart?.coding_subtask_prompt ?? null}
                    activePartResponseType={activePart?.response_type}
                    activePartWeightPct={activePart ? Math.round(activePart.grading_weight_within_step * 100) : undefined}
                    solutionsOpen={solutionsOpen}
                    activeSolutionApproach={activeSolutionApproach}
                  />
                )
              })()}
            </div>
          )}

          <div
            ref={workspaceRef}
            key={`${currentStep}-question`}
            className={`relative flex-1 overflow-y-auto min-h-0 min-w-0${isInterviewChallenge ? ' hidden' : ''}`}
            style={isInterviewChallenge
              ? { display: 'none' }
              : { padding: '20px 24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            {/* Neutral between-questions acknowledgment - no grading, just a beat */}
            {ackVisible && (
              <div
                aria-live="polite"
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'color-mix(in srgb, var(--color-surface) 72%, transparent)',
                  backdropFilter: 'blur(2px)',
                }}
              >
                <div
                  className="animate-step-enter"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: 'var(--color-surface-container)',
                    border: '1px solid var(--color-outline-variant)',
                    borderRadius: 16,
                    padding: '16px 22px',
                    boxShadow: '0 4px 18px -8px rgba(30,27,20,0.25)',
                  }}
                >
                  <HatchGlyph size={34} state="idle" className="text-primary" />
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-on-surface)' }}>
                    Answer recorded, keep going.
                  </span>
                </div>
              </div>
            )}

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
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#5c3a00', lineHeight: 1.6 }}>{activeStepData.nudge}</span>
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
                <HatchGlyph size={40} state="reviewing" className="text-primary" />
              </div>
            ) : (isApiMode && stepError) ? (
              <p className="font-body text-error text-sm text-center">{stepError}</p>
            ) : currentQuestion ? (
              <div data-hatch-target="workspace-answer-area" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-outline-faint)', borderRadius: 14, padding: '18px 20px' }}>
                <StepQuestion
                  question={currentQuestion}
                  responseType={currentQuestion.response_type}
                  selectedOptionId={selectedOptionId}
                  selectedOptionIds={selectedOptionIds}
                  allowMultiple={currentQuestion.allow_multiple}
                  elaboration={reasoning || elaboration}
                  revealed={revealedOptions.length > 0}
                  revealedOptions={revealedOptions}
                  onOptionSelect={(id) => {
                    if (currentQuestion.allow_multiple) {
                      setSelectedOptionIds((prev) => {
                        const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                        writeDraft({ selectedOptionIds: next })
                        return next
                      })
                    } else {
                      handleOptionSelect(id)
                    }
                  }}
                  onElaborationChange={(text) => { setReasoning(text); setElaboration(text); writeDraft({ reasoning: text }) }}
                  disabled={activeSubmitting || ackVisible}
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
                  Confidence - how sure are you?
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {(['Guessing', 'Not sure', 'Fairly sure', 'Rock solid'] as const).map((c, i) => {
                    const active = confidence === i
                    return (
                      <button
                        key={c}
                        onClick={() => { setConfidence(i); writeDraft({ confidence: i }) }}
                        disabled={!currentQuestionAnswered}
                        style={{
                          padding: '9px 8px',
                          borderRadius: 999,
                          fontSize: 12.5,
                          fontWeight: 600,
                          background: active ? 'var(--color-on-surface)' : 'var(--color-surface-container-low)',
                          color: active ? 'var(--color-inverse-on-surface, #f5f0e8)' : 'var(--color-on-surface-variant)',
                          border: '1px solid ' + (active ? 'transparent' : 'var(--color-outline-faint)'),
                          opacity: currentQuestionAnswered ? 1 : 0.5,
                          cursor: currentQuestionAnswered ? 'pointer' : 'not-allowed',
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

      {/* Submit bar for canvas interview challenge types */}
      {isCanvasChallenge && (
        <div data-tour-target="canvas-submit" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          borderTop: '1px solid var(--color-outline-faint)',
          background: 'var(--color-surface)',
          flexShrink: 0,
          padding: '10px 16px',
        }}>
          <CanvasReadinessMeter guidance={guidance} />
          <button
            onClick={handleInterviewSubmit}
            disabled={isSubmittingInterview}
            className="rounded-full bg-primary text-on-primary font-label font-semibold px-6 py-2 disabled:opacity-60 hover:opacity-90 transition-opacity shrink-0"
          >
            {isSubmittingInterview ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      )}

      {/* Full-width bottom footer: left actions + submit - only for MCQ FLOW challenges.
          Mobile uses a compact full-width footer (no left stats column). */}
      {!isInterviewChallenge && (mobileStacked ? mobileFooter : bottomFooter)}
    </div>
  )
}

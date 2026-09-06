'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { canStartWorkspaceAttempt, loadWorkspaceHistory } from '@/lib/workspace/submission-history'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { trackEvent } from '@/lib/posthog/client'
import { HatchReviewCard, CANVAS_REVIEW_PHASES, DATA_MODEL_REVIEW_PHASES } from '@/components/feedback'
import { EVENT_CHALLENGE_STARTED, EVENT_CHALLENGE_STEP_ADVANCED } from '@/lib/posthog/events'
import gsap from 'gsap'
import type { FlowStep, UserRoleV2, InterviewGrade } from '@/lib/types'
import { applyVerdict, verdictFromScore, INITIAL_MACHINE, type GuidanceMachineState } from '@/lib/adaptive/branching'
import type { ChallengeAdapter, AdapterCompletionData, AdapterStepData, SyntheticChallenge } from '@/lib/showcase/adapters/autopsyAdapter'
import { useChallengeV2 } from '@/lib/v2/hooks/useChallengeV2'
import { useFlowStep } from '@/lib/v2/hooks/useFlowStep'
import { coerceDifficulty, DIFFICULTY_LABELS } from '@/lib/practice/difficulty'
import { usageEventBus } from '@/lib/usage/event-bus'
import { FLOW_MOVES } from '@/lib/flow/moves'
import { FlowStepper } from './FlowStepper'
import { StepQuestion } from './StepQuestion'
import { StepReveal } from './StepReveal'
import { PostSessionMirror, type StepResult as MirrorStepResult, type CompetencyDelta as MirrorCompetencyDelta } from './PostSessionMirror'
import type { StepCalibration } from './CalibrationPreview'
import { HatchImage } from '@/components/redesign/HatchImage'
import { FLOW_MAX_SCORE } from '@/lib/scoring/flow-scale'
import { useHatchContext } from '@/context/HatchContext'
import { CanvasChatPanel } from '@/components/challenge/CanvasChatPanel'
import { CanvasEmptyState } from '@/components/challenge/CanvasEmptyState'
import { canvasStarterTemplate, canvasTemplatesFor, type CanvasTemplate } from '@/lib/hatch/canvasSeeds'
import { DesignStepForm } from '@/components/challenge/design/DesignStepForm'
import { DesignRail } from '@/components/challenge/design/DesignRail'
import { CompactStepPips } from '@/components/challenge/design/CompactStepPips'
import {
  designStepsFor,
  allDesignSections,
  isDesignStepId,
  type DesignStepId,
  type DesignSection,
} from '@/components/challenge/design/designSteps'
import { Lightbulb, ListChecks } from 'lucide-react'
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
import { LanguageSelector } from '@/components/challenge/LanguageSelector'
import { CodingStepper } from '@/components/challenge/coding/CodingStepper'
import { advanceCodingStep, isCodingStep, type CodingStep } from '@/components/challenge/coding/codingSteps'
import { splitProblemSections } from '@/components/challenge/coding/descriptionTabs'
import { TestCasePanel } from '@/components/challenge/coding/TestCasePanel'
import { GuidanceTab, type CodingRailSelfCheck } from '@/components/challenge/coding/GuidanceTab'
import { HintsTab } from '@/components/challenge/coding/HintsTab'
import { SchemaDiagram } from '@/components/challenge/SchemaDiagram'
import { SampleDataPreview } from '@/components/challenge/SampleDataPreview'
import { ExpectedOutput, type ExpectedOutputTestCase } from '@/components/challenge/ExpectedOutput'
import { CodingFeedback } from '@/components/challenge/CodingFeedback'
import { useCodeRunner, getTestCases } from '@/hooks/useCodeRunner'
import { workspaceExitHref } from '@/lib/workspace/breadcrumbs'
import { WorkspacePanel } from '@/components/v2/WorkspacePanel'
import { useHatchSonics } from '@/hooks/useHatchSonics'
import { useIsMobile } from '@/hooks/useIsMobile'
import type { SupportedLanguage, RunResult, GradingFeedback, TestCase } from '@/lib/coding/types'
import type { SchemaDiagramData } from '@/components/challenge/SchemaDiagram'
import { formatCompany } from '@/lib/format/company'
import { DiscussionThread } from '@/components/challenge/DiscussionThread'
import { DiscussionInput } from '@/components/challenge/DiscussionInput'
import type { ChallengeDiscussion } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { buildChallengeBrief, type ChallengeBriefSection } from '@/lib/challenges/presentation'
import { mdRemarkPlugins, mdRehypePlugins, safeMarkdownUrl } from '@/components/ui/md-shared'
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

/** Structured SD/DM write-up: {stepId: {sectionId: text}}. Autosaved as
 *  step_answers, submitted into canvas_final_snapshot, and sent to Hatch's
 *  interpret/nudge endpoints on every turn. */
type StepAnswers = Partial<Record<DesignStepId, Record<string, string>>>

function buildDefaultContextPackFields(challengeType?: string): ContextPackField[] {
  // Coding (algorithm / sql) — the Notes tab: plan the approach before typing,
  // list the edge cases the tests will probe, and commit to a complexity claim.
  if (challengeType === 'algorithm' || challengeType === 'sql') {
    const isSql = challengeType === 'sql'
    return [
      {
        id: 'plan',
        label: 'Plan',
        helper: isSql
          ? 'The shape of the query before you write it: joins, filters, grouping.'
          : 'The approach in plain words before you write code.',
        icon: 'route',
        placeholder: isSql
          ? 'e.g. join orders to users, filter to last 30 days, group by user, keep counts > 3'
          : 'e.g. two pointers from both ends, move the smaller side inward',
        value: '',
        removable: false,
      },
      {
        id: 'edge_cases',
        label: 'Edge cases',
        helper: 'Inputs that would break a naive version.',
        icon: 'warning',
        placeholder: isSql
          ? 'ties, NULLs, users with no orders, duplicate rows'
          : 'empty input, single element, duplicates, overflow',
        value: '',
        removable: false,
      },
      {
        id: 'complexity',
        label: 'Complexity',
        helper: 'Your time and space claim, checked against the constraints.',
        icon: 'speed',
        placeholder: isSql
          ? 'which index makes this fast? what does the join multiply?'
          : 'O(n log n) time, O(1) extra space',
        value: '',
        removable: false,
      },
    ]
  }
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
  // Company filters match on normalized slugs (see challenges.ts) - normalize
  // here too so a tag stored as "New Relic" still produces a working filter.
  params.set(key, key === 'company' ? value.trim().toLowerCase().replace(/\s+/g, '-') : value)
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
          <ReactMarkdown remarkPlugins={mdRemarkPlugins} rehypePlugins={mdRehypePlugins} skipHtml urlTransform={safeMarkdownUrl} components={documentMarkdownComponents}>{section.body}</ReactMarkdown>
        </div>
      ))}

      {/* One-line destabilizing constraint (canvas) renders as a tonal card */}
      {changeSections.map((section) => (
        <div key={section.id} style={{
          background: 'var(--color-tertiary-container)',
          borderRadius: 10,
          padding: '8px 12px',
          margin: '14px 0',
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          lineHeight: 1.6,
          fontWeight: 600,
          color: 'var(--color-on-surface)',
        }}>
          <ReactMarkdown remarkPlugins={mdRemarkPlugins} rehypePlugins={mdRehypePlugins} skipHtml urlTransform={safeMarkdownUrl} components={documentMarkdownComponents}>{section.body}</ReactMarkdown>
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
            <ReactMarkdown remarkPlugins={mdRemarkPlugins} rehypePlugins={mdRehypePlugins} skipHtml urlTransform={safeMarkdownUrl} components={documentMarkdownComponents}>{section.body}</ReactMarkdown>
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
          <ReactMarkdown remarkPlugins={mdRemarkPlugins} rehypePlugins={mdRehypePlugins} skipHtml urlTransform={safeMarkdownUrl} components={documentMarkdownComponents}>{section.body}</ReactMarkdown>
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
  // Round-4 Problem Brief skin (spec 4 "Boxes: fewer, in a hierarchy"):
  // sections are de-carded — uppercase ink-secondary headings over plain body,
  // no nested tinted boxes. The task tone keeps a forest heading so the ask
  // still reads as the anchor.
  return (
    <section
      style={{
        marginBottom: 18,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: isTask ? 'var(--color-forest-700)' : 'var(--color-ink-secondary)',
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
        <ReactMarkdown remarkPlugins={mdRemarkPlugins} rehypePlugins={mdRehypePlugins} skipHtml urlTransform={safeMarkdownUrl} components={briefMarkdownComponents}>
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
  | { mode: 'api'; challengeId: string; challengeSlug?: string; initialAttemptId?: string; initialRoleId: UserRoleV2; onExit?: () => void; onPaywall?: (data: { used: number; limit: number }) => void; fromPlan?: string; fromDomain?: string; nextChallengeSlug?: string; returnTo?: string }
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

// Shared workspace action button treatments — round-4 chrome (spec §5):
// buttons are rounded rectangles, not pills. Primary = forest-950 fill with a
// subtle inner light; secondary = card surface + hairline border.
const WORKSPACE_BTN_PRIMARY = 'inline-flex items-center gap-1.5 px-5 py-2 rounded-[10px] bg-forest-950 text-white font-label text-xs font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:opacity-90 disabled:opacity-50 transition-opacity'
const WORKSPACE_BTN_TONAL = 'inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] bg-card-bright border border-hairline text-ink-strong font-label text-xs font-bold hover:bg-page-field disabled:opacity-50 transition-colors'

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
  const attemptStartPending = useRef(false)
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
  // transform-origin for the overlay's scale-in, as viewport percentages of
  // the trigger's center (DiagramSlot / "Open canvas" button) — the overlay
  // grows out of the slot instead of hard-swapping (Stage B motion pass).
  const [canvasOverlayOrigin, setCanvasOverlayOrigin] = useState<string>('50% 50%')
  const openCanvasOverlay = useCallback((origin?: { x: number; y: number }) => {
    if (origin && typeof window !== 'undefined' && window.innerWidth > 0 && window.innerHeight > 0) {
      const ox = Math.round((origin.x / window.innerWidth) * 100)
      const oy = Math.round((origin.y / window.innerHeight) * 100)
      setCanvasOverlayOrigin(`${ox}% ${oy}%`)
    } else {
      setCanvasOverlayOrigin('50% 50%')
    }
    setCanvasMaximised(true)
  }, [])
  // Structured SD/DM workspace: per-step write-up answers + which step/section
  // the user is on. Free navigation between design steps (unlike MCQ FLOW).
  const [stepAnswers, setStepAnswers] = useState<StepAnswers>({})
  const [activeDesignStep, setActiveDesignStep] = useState<DesignStepId>('frame')
  const [activeDesignSection, setActiveDesignSection] = useState<string | null>(null)
  // Object URL of the latest diagram snapshot embedded in the write-up.
  const [diagramThumbUrl, setDiagramThumbUrl] = useState<string | null>(null)
  const diagramThumbUrlRef = useRef<string | null>(null)
  useEffect(() => { diagramThumbUrlRef.current = diagramThumbUrl }, [diagramThumbUrl])
  useEffect(() => () => { if (diagramThumbUrlRef.current) URL.revokeObjectURL(diagramThumbUrlRef.current) }, [])
  const diagramThumbBusyRef = useRef(false)
  const didHydrateCanvasRef = useRef<string | null>(null)
  const [codingMaximised, setCodingMaximised] = useState(false)
  // Console collapse (visual-clarity inc. 4): header-only console, editor takes the space.
  const [consoleCollapsed, setConsoleCollapsed] = useState(false)
  const [editorHeightPct, setEditorHeightPct] = useState(60)
  const [chatPanelOpen, setChatPanelOpen] = useState(false)
  const [queuedHatchPrompt, setQueuedHatchPrompt] = useState<QueuedHatchPrompt | null>(null)
  const [interviewGrade, setInterviewGrade] = useState<InterviewGrade | null>(null)
  const [submittedCanvasPngUrl, setSubmittedCanvasPngUrl] = useState<string | null>(null)
  const [historyInterviewGrade, setHistoryInterviewGrade] = useState<InterviewGrade | null>(null)
  const [historyCanvasElements, setHistoryCanvasElements] = useState<unknown[] | null>(null)
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
  const [submittedCanvasScene, setSubmittedCanvasScene] = useState<{ attemptId: string; elements: unknown[] } | null>(null)
  const [contextPackOpen, setContextPackOpen] = useState(true)
  const [contextPack, setContextPack] = useState<ContextPackState>(EMPTY_CONTEXT_PACK_FIELDS)
  const [isSubmittingInterview, setIsSubmittingInterview] = useState(false)
  const [interviewSubmitError, setInterviewSubmitError] = useState<string | null>(null)
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
  const [mobileDescOpen, setMobileDescOpen] = useState(true)

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
  const [leftWidth, setLeftWidth] = useState(40)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragCleanupRef = useRef<(() => void) | null>(null)

  // Load leftWidth + leftCollapsed from localStorage on challenge load. Record
  // what was stored so the coding default-width effect below can tell a fresh
  // user (no record) or a stale pre-v2 default apart from a dragged width.
  const storedLayoutRef = useRef<{ had: boolean; v?: number; leftWidth?: number }>({ had: false })
  useEffect(() => {
    if (!challengeId) return
    try {
      const stored = localStorage.getItem(`flowworkspace:${challengeId}`)
      if (stored) {
        const parsed = JSON.parse(stored) as { leftWidth?: number; leftCollapsed?: boolean; v?: number }
        storedLayoutRef.current = { had: true, v: parsed.v, leftWidth: parsed.leftWidth }
        if (typeof parsed.leftWidth === 'number') setLeftWidth(parsed.leftWidth)
        if (typeof parsed.leftCollapsed === 'boolean') setLeftCollapsed(parsed.leftCollapsed)
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challengeId])

  // (The persist effect for leftWidth/leftCollapsed lives below, after the
  // challenge type derivation — it must not write before the type is known.)

  // Left description tab state. Coding challenges add doc tabs (Examples /
  // Constraints, present only when the description carries those sections) and
  // Notes; Solutions/Discussions/Submissions move behind a trailing More menu.
  const [leftTab, setLeftTab] = useState<
    'Description' | 'Examples' | 'Constraints' | 'Notes' | 'Discussions' | 'Submissions' | 'Solutions'
  >(props.mode === 'api' && props.initialAttemptId ? 'Submissions' : 'Description')

  // ── Coding workspace state (round-4 rebuild) ─────────────────────────────
  // Advisory solving path (Understand → Plan → Code → Test → Optimize).
  // Auto-signals only ever move it forward; a click can move it anywhere.
  const [codingStep, setCodingStep] = useState<CodingStep>('understand')
  const advanceStep = useCallback((next: CodingStep) => {
    setCodingStep((prev) => advanceCodingStep(prev, next))
  }, [])
  // Baseline editor text captured at hydration/starter init, so the first REAL
  // edit (differs from baseline) advances the path to Code.
  const initialCodeRef = useRef<string | null>(null)
  // Hints Hatch has delivered this session (rail list), oldest first.
  const [codingHints, setCodingHints] = useState<string[]>([])
  const [codingHintPending, setCodingHintPending] = useState(false)
  // Check-your-approach verdict flow (interpret self-check).
  const [codingSelfCheck, setCodingSelfCheck] = useState<CodingRailSelfCheck>({ status: 'idle' })
  // Learner-declared confidence before submitting (persisted with the draft).
  const [codingConfidence, setCodingConfidence] = useState<'low' | 'medium' | 'high' | null>(null)
  // Status bar autosave cell: real save lifecycle of the draft autosave below.
  const [codingSaveState, setCodingSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [codingSavedAt, setCodingSavedAt] = useState<Date | null>(null)

  // Helper: true for interview challenge types that use canvas/coding instead of MCQ
  // Canvas and coding challenges are only supported in API mode; adapter mode always returns false
  const apiChallengeType = isApiMode ? detail?.challenge?.challenge_type : undefined
  const isCanvasChallenge = apiChallengeType === 'system_design' || apiChallengeType === 'data_modeling'
  const isCodingChallenge = apiChallengeType === 'sql' || apiChallengeType === 'algorithm'
  // Either canvas or coding - both are full-panel interview modes (no MCQ FLOW steps)
  const isInterviewChallenge = isCanvasChallenge || isCodingChallenge
  // The MCQ FLOW stepper (Frame/List/Optimize/Win). API mode only - the idle nudge
  // posts to an authed endpoint keyed on a real challenge + attempt, which the
  // autopsy/showcase adapter path does not have.
  const isFlowChallenge = isApiMode && !isInterviewChallenge

  // On a phone, FLOW/MCQ challenges stack vertically. Canvas/coding challenges
  // share the same brief/work switch and preserve their saved state.
  const mobileStacked = isMobile

  // Coding left pane: floor the width so all four content tabs (Description /
  // Examples / Constraints / Notes) stay inline at >=1280 instead of clipping
  // behind the trailing More menu. The 38vw term keeps narrow desktops from
  // starving the editor; the strip's overflow scroll remains the fallback.
  const leftPaneMinWidth = isCodingChallenge && !leftCollapsed ? 'min(400px, 38vw)' : undefined

  // Coding + canvas default split moved 30 → 35 (description/work area 35-65).
  // Runs here, not in the load effect, because the challenge type is only known
  // once detail loads. Only two cases migrate: no stored record (fresh user)
  // and a pre-v2 record still sitting on the old 30 default (never dragged).
  // Anything else is a deliberate user width and is left alone.
  useEffect(() => {
    if (!isInterviewChallenge) return
    const stored = storedLayoutRef.current
    if (!stored.had) { setLeftWidth(35); return }
    if (stored.v === undefined && stored.leftWidth === 30) setLeftWidth(35)
  }, [isInterviewChallenge])

  // Persist leftWidth + leftCollapsed to localStorage on change. v:2 marks the
  // record as post-coding-default-change so the migration effect never touches
  // it. Held back until the challenge type is known: detail loads async, and an
  // early write would stamp the pre-migration default (30) with v:2, which the
  // coding 35% migration above would then respect as a user choice.
  const challengeTypeKnown = !isApiMode || Boolean(apiChallengeType)
  useEffect(() => {
    if (!challengeId || !challengeTypeKnown) return
    try {
      localStorage.setItem(`flowworkspace:${challengeId}`, JSON.stringify({ leftWidth, leftCollapsed, v: 2 }))
    } catch { /* ignore */ }
  }, [challengeId, challengeTypeKnown, leftWidth, leftCollapsed])

  // Coding challenges use the Notes tab fields (Plan / Edge cases / Complexity),
  // not the canvas Context Pack defaults the state initializes with. Swap them
  // in as soon as the type is known; the draft-hydration effect below merges any
  // persisted values on top, and typed values are never clobbered.
  useEffect(() => {
    if (!isCodingChallenge) return
    setContextPack((prev) => {
      if (prev.some((f) => f.id === 'plan')) return prev
      if (prev.some((f) => f.value.trim().length > 0)) return prev
      return buildDefaultContextPackFields(apiChallengeType)
    })
  }, [isCodingChallenge, apiChallengeType])

  // (The old openContextPack jump helper died with the thinking dock — the
  // Context Pack drawer still lives in the Description pane and opens inline.)

  // Discussions tab state
  const [discussions, setDiscussions] = useState<ChallengeDiscussion[]>([])
  const [discussionsLoading, setDiscussionsLoading] = useState(false)
  const [discussionsLoaded, setDiscussionsLoaded] = useState(false)

  // Solutions tab state (lazy-loaded on first tab open, like discussions)
  const [solution, setSolution] = useState<SolutionTabResponse | null>(null)
  const [solutionLoading, setSolutionLoading] = useState(false)
  const [solutionLoaded, setSolutionLoaded] = useState(false)
  const [activeApproachId, setActiveApproachId] = useState<string | null>(null)
  // Which step of an interactive walkthrough the learner is viewing, so Hatch
  // can reason about it ("why does mid move here?"). Reset when the approach changes.
  const [activeSolutionStep, setActiveSolutionStep] = useState<{ index: number; title: string; decision?: string } | null>(null)
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
  const [submissionsError, setSubmissionsError] = useState<string | null>(null)
  const [historyPracticeRequested, setHistoryPracticeRequested] = useState(false)
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
      setHistoryCanvasElements(null)
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
      canvasElements?: unknown[] | null
    } | null) => {
      const historyChallengeType = data?.challengeType ?? record.challengeType ?? apiChallengeType ?? null
      setHistoryCanvasElements(data?.canvasElements ?? null)
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
  const initialAttemptId = props.mode === 'api' ? props.initialAttemptId : undefined
  const historyDeepLinkApplied = useRef<string | null>(null)
  const loadSubmissionHistory = useCallback(async () => {
    if (!isApiMode || !challengeId) return
    setSubmissionsLoading(true)
    setSubmissionsError(null)
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
      const loaded = await loadWorkspaceHistory<(typeof rows)[number]>(challengeId, initialAttemptId)
      if (!loaded) {
        setSubmissionsError('Submission history could not be loaded. Please try again.')
        setSubmissionsLoading(false)
        return
      }
      rows = loaded
    } catch {
      setSubmissionsError('Submission history could not be loaded. Please try again.')
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
    if (initialAttemptId && historyDeepLinkApplied.current !== initialAttemptId) {
      const index = past.findIndex(record => record.attemptId === initialAttemptId)
      if (index !== -1) {
        setSelectedHistoryIdx(index)
        setPhase('question')
        historyDeepLinkApplied.current = initialAttemptId
      } else {
        setSubmissionsError('The linked submission could not be opened. Try again or choose another submission below.')
      }
    }
    setSubmissionsLoaded(true)
    setSubmissionsLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isApiMode, challengeId, challengeSlug, initialAttemptId])

  // Lazy-load submission history on first Submissions-tab open, so it stays off
  // the workspace mount critical path (mirrors Discussions/Solutions). Post-submit
  // reconciliation still calls loadSubmissionHistory directly.
  useEffect(() => {
    if (leftTab === 'Submissions' && !submissionsLoaded && !submissionsLoading && !submissionsError) {
      void loadSubmissionHistory()
    }
  }, [leftTab, submissionsLoaded, submissionsLoading, submissionsError, loadSubmissionHistory])

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
    // A successful submit (coding / canvas / interview) consumes a rep. Refresh
    // every usage surface: profile-stats-updated re-pulls SessionContext (which
    // backs useUsage / the at-limit checks) and the usage pill; usageEventBus is
    // the pill's in-app channel. The pill no longer polls, so these signals are
    // what keep it fresh. The FLOW MCQ path emits separately (not via here).
    window.dispatchEvent(new CustomEvent('profile-stats-updated', { detail: { source: 'challenge-submit' } }))
    usageEventBus.emit()
  }, [])

  // Hint card open/close state (right pane)
  const [hintOpen, setHintOpen] = useState(false)

  // ── Adaptation contract (SUN-251) ─────────────────────────────────────────
  // Guidance register from the step API (calibration-informed); the bounded
  // machine moves it on question verdicts. 'guided' is today's behavior.
  const [coachRegister, setCoachRegister] = useState<'scaffolded' | 'guided' | 'open'>('guided')
  const guidanceSeededRef = useRef(false)
  const guidanceMachineRef = useRef<GuidanceMachineState>({ ...INITIAL_MACHINE })
  const guidanceAdjustmentsRef = useRef<Array<{ from: string; to: string; trigger: string; atStepId: string | null }>>([])

  // Seed the register once from the first step payload. Scaffolded learners
  // get the hint card open before their first answer; open learners keep it
  // behind an explicit ask (the existing default).
  useEffect(() => {
    const g = stepData?.guidance
    if (!g || guidanceSeededRef.current) return
    guidanceSeededRef.current = true
    setCoachRegister(g)
    if (g === 'scaffolded') setHintOpen(true)
  }, [stepData])

  // Non-FLOW mediums (coding/SQL, canvas) have no step payload — fetch the
  // register once from the shared endpoint (SUN-252/253). Failure keeps
  // 'guided', which is exactly the pre-adaptive behavior.
  useEffect(() => {
    if (!isApiMode || guidanceSeededRef.current) return
    const type = apiChallengeType
    if (type === 'flow' || !type) return
    let cancelled = false
    void fetch('/api/adaptive/guidance')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { guidance?: 'scaffolded' | 'guided' | 'open' } | null) => {
        if (cancelled || !d?.guidance || guidanceSeededRef.current) return
        guidanceSeededRef.current = true
        setCoachRegister(d.guidance)
      })
      .catch(() => {})
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isApiMode, apiChallengeType])

  // Coding runs feed the guidance machine (SUN-252): full pass = pass, some
  // tests green = partial, none = retry. Movement adjusts Hatch's register
  // live through the guidanceLevel prop on the chat panel.
  const feedRunVerdict = useCallback((result: RunResult) => {
    const verdict = result.testsTotal > 0
      ? result.testsPassed === result.testsTotal
        ? 'pass' as const
        : result.testsPassed > 0
          ? 'partial' as const
          : 'retry' as const
      : 'retry' as const
    const adj = applyVerdict(guidanceMachineRef.current, verdict, coachRegister)
    guidanceMachineRef.current = adj.state
    if (adj.moved) {
      guidanceAdjustmentsRef.current.push({
        from: coachRegister,
        to: adj.guidance,
        trigger: adj.moved === 'down' ? 'two failing runs in a row' : 'two clean runs in a row',
        atStepId: null,
      })
      setCoachRegister(adj.guidance)
    }
  }, [coachRegister])

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

  // ── Structured SD/DM workspace derivations ────────────────────────────────
  const canvasType: CanvasChallengeType =
    apiChallengeType === 'data_modeling' ? 'data_modeling' : 'system_design'
  const designSteps = useMemo(
    () => (isCanvasChallenge ? designStepsFor(canvasType) : []),
    [isCanvasChallenge, canvasType]
  )
  const activeDesignStepDef =
    designSteps.find((s) => s.id === activeDesignStep) ?? designSteps[0] ?? null

  // The write-up sections feed the guidance phase machine alongside the
  // context pack — the `tradeoffs` section id advances it to ready unchanged.
  const designGuidanceFields = useMemo(() => {
    if (!isCanvasChallenge) return contextPack
    const sectionFields = allDesignSections(canvasType)
      .filter((s) => s.kind === 'textarea')
      .map((s) => ({ id: s.id, value: stepAnswers[s.stepId]?.[s.id] ?? '' }))
    return [...contextPack, ...sectionFields]
  }, [isCanvasChallenge, canvasType, contextPack, stepAnswers])

  // Single source of truth for the draw → notes → ask → submit phase. Consumed
  // by the design rail's live guidance panel and Hatch's chat opener.
  const guidance = useCanvasGuidance({
    challengeType: canvasType,
    scene,
    fields: designGuidanceFields,
    register: coachRegister,
  })

  const isDesignSectionDone = useCallback(
    (stepId: DesignStepId, section: DesignSection) => {
      if (section.kind === 'diagram') return scene.entities.length > 0
      const text = stepAnswers[stepId]?.[section.id] ?? ''
      return text.trim().length >= (section.minCharsDone ?? 80)
    },
    [scene.entities.length, stepAnswers]
  )
  const completedDesignSteps = useMemo(
    () =>
      designSteps
        .filter((s) => s.sections.every((sec) => isDesignSectionDone(s.id, sec)))
        .map((s) => s.id),
    [designSteps, isDesignSectionDone]
  )
  const designSectionTotals = useMemo(() => {
    const all = designSteps.flatMap((s) => s.sections.map((sec) => ({ stepId: s.id, sec })))
    return {
      done: all.filter((x) => isDesignSectionDone(x.stepId, x.sec)).length,
      total: all.length,
    }
  }, [designSteps, isDesignSectionDone])

  // The sub-section Hatch should treat as active: the focused textarea, else
  // the first section of the active step.
  const effectiveActiveSectionId = useMemo(() => {
    if (!activeDesignStepDef) return null
    if (
      activeDesignSection &&
      activeDesignStepDef.sections.some((s) => s.id === activeDesignSection)
    ) {
      return activeDesignSection
    }
    return activeDesignStepDef.sections[0]?.id ?? null
  }, [activeDesignStepDef, activeDesignSection])

  const selectDesignStep = useCallback((id: DesignStepId) => {
    setActiveDesignStep(id)
    setActiveDesignSection(null)
  }, [])

  const handleDesignAnswerChange = useCallback(
    (sectionId: string, value: string) => {
      setStepAnswers((prev) => ({
        ...prev,
        [activeDesignStep]: { ...(prev[activeDesignStep] ?? {}), [sectionId]: value },
      }))
    },
    [activeDesignStep]
  )

  // Excalidraw API + library refs (for canvas action execution)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const excalidrawApiRef = useRef<any>(null)
  const canvasExportRef = useRef<(() => Promise<Blob | null>) | null>(null)
  const libraryItemsRef = useRef<Array<{ id: string; name?: string; elements: unknown[] }>>([])

  const handleCanvasActions = useCallback(async (
    response: { message: string; actions: unknown[] },
    options?: { fitViewport?: boolean }
  ) => {
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
    // Push a snapshot immediately so the empty-state overlay, coach card, and
    // footer chips reflect the inserted elements without waiting for
    // ExcalidrawCanvas's 2s onChange debounce.
    try {
      setCanvasScene({
        elements: excalidrawApiRef.current.getSceneElements() as unknown[],
        appState: excalidrawApiRef.current.getAppState() as unknown,
      })
    } catch { /* non-fatal - the debounced snapshot will catch up */ }

    // Template scenes are laid out in scene coordinates, which can leave part
    // of a horizontal diagram outside a phone viewport. Fit only after an
    // explicit template action so normal drawing and Hatch edits keep the
    // user's current pan/zoom. This changes viewport state only; scene elements
    // and Excalidraw's undo history are untouched.
    if (options?.fitViewport) {
      window.requestAnimationFrame(() => {
        const api = excalidrawApiRef.current
        if (!api) return
        const elements = api.getSceneElements() as unknown[]
        if (elements.length === 0) return
        api.scrollToContent(elements, {
          fitToContent: true,
          viewportZoomFactor: 0.82,
          maxZoom: 1,
          animate: false,
        })
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

  // The branded empty-state hides the moment the user commits to a first move
  // (template or Ask Hatch) - gating on scene entities alone left it lingering
  // behind the snapshot debounce.
  const [emptyStateDismissed, setEmptyStateDismissed] = useState(false)

  // Drop the starter skeleton onto the canvas from the branded empty-state.
  // Reuses the same executeActions path Hatch uses, so the layout engine places
  // and connects the boxes; the empty-state un-mounts as soon as elements land.
  const handleUseTemplate = useCallback(() => {
    if (apiChallengeType !== 'system_design' && apiChallengeType !== 'data_modeling') return
    setEmptyStateDismissed(true)
    void handleCanvasActions({
      message: 'starter template',
      actions: canvasStarterTemplate(apiChallengeType),
    }, { fitViewport: true })
  }, [apiChallengeType, handleCanvasActions])

  // Overlay template chips — same executeActions path as Hatch and the
  // empty-state starter. Blank is an intentional no-op (empty actions list).
  const applyCanvasTemplate = useCallback(
    (template: CanvasTemplate) => {
      if (template.actions.length === 0) return
      setEmptyStateDismissed(true)
      void handleCanvasActions(
        { message: template.label, actions: template.actions },
        { fitViewport: true }
      )
    },
    [handleCanvasActions]
  )

  // Export the current drawing to a PNG object URL for the DiagramSlot inset.
  // One in flight at a time; the previous URL is revoked on replace.
  const refreshDiagramThumb = useCallback(async () => {
    const exportFn = canvasExportRef.current
    if (!exportFn || diagramThumbBusyRef.current) return
    diagramThumbBusyRef.current = true
    try {
      const blob = await exportFn()
      if (blob) {
        const url = URL.createObjectURL(blob)
        setDiagramThumbUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev)
          return url
        })
      }
    } catch {
      /* the thumbnail is cosmetic — the counts fallback renders instead */
    } finally {
      diagramThumbBusyRef.current = false
    }
  }, [])

  // "Done, back to write-up": snapshot the drawing into the write-up inset,
  // then close the overlay. Excalidraw and the chat stay mounted throughout.
  const closeCanvasOverlay = useCallback(() => {
    void refreshDiagramThumb()
    setCanvasMaximised(false)
  }, [refreshDiagramThumb])

  // Keep the write-up's embedded snapshot in sync while the overlay is closed
  // (covers resume hydration and Hatch drawing from the docked chat).
  useEffect(() => {
    if (!isCanvasChallenge || canvasMaximised) return
    if (scene.entities.length === 0) return
    const t = window.setTimeout(() => { void refreshDiagramThumb() }, 800)
    return () => window.clearTimeout(t)
  }, [isCanvasChallenge, canvasMaximised, scene, refreshDiagramThumb])

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

  // The nudge rate-limit + per-attempt cap refs are component-lifetime, so a new
  // attempt in the same mounted component (e.g. a retry without remount) would
  // otherwise inherit the prior attempt's cap and never nudge. Reset them when the
  // attempt changes so each attempt gets its own fresh nudge budget.
  useEffect(() => {
    lastNudgeAtRef.current = 0
    nudgeCountRef.current = 0
    lastWorkspaceCueRef.current = 0
    lastWorkspaceProgressRef.current = Date.now()
  }, [attemptId])

  // Snapshot of the user's live workspace state, read inside the idle-nudge timer
  // at fire time (the timer is declared before these values exist, and we don't
  // want to re-subscribe the interval on every keystroke). Populated by the
  // effect just below. Lets the idle nudge be grounded in what the user is
  // actually doing — the current FLOW question + selections, or the current code
  // + last test run — instead of a canned "stuck?" line.
  const nudgeGroundingRef = useRef<{
    flowStep: string | null
    flowQuestion: string | null
    flowSelectedLabels: string[]
    codeLanguage: string | null
    codeTail: string | null
    testsPassed: number | null
    testsTotal: number | null
    designStep: DesignStepId | null
    designSection: string | null
    designSectionText: string | null
  }>({
    flowStep: null,
    flowQuestion: null,
    flowSelectedLabels: [],
    codeLanguage: null,
    codeTail: null,
    testsPassed: null,
    testsTotal: null,
    designStep: null,
    designSection: null,
    designSectionText: null,
  })

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
            active_step: nudgeGroundingRef.current.designStep,
            active_section: nudgeGroundingRef.current.designSection,
            active_section_text: nudgeGroundingRef.current.designSectionText?.slice(0, 5000) ?? null,
          }),
        })
        if (!res.ok) return
        const data = (await res.json()) as { nudge: string | null }
        if (data.nudge) {
          lastNudgeAtRef.current = Date.now()
          nudgeCountRef.current += 1
          // One surface only: the docked panel thread. When the dock is collapsed
          // to the Ask Hatch pill, the pill shows an unread dot instead - the
          // floating bubble used to render on top of that pill and, emitted with
          // force, ignored its own dismiss snooze.
          setProactiveNudge({ id: `n-${Date.now()}`, text: data.nudge })
        }
      } catch { /* swallow */ }
    }, 4000)
  // chatPanelOpen intentionally excluded - we only want the snapshot at fire time, not retriggers
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCanvasChallenge, attemptId, scene, apiChallengeType, isApiMode, props])

  // "Show me a hint" (design rail): on-demand nudge grounded in the diagram and
  // the active write-up sub-section. Lands in the rail's guidance panel and the
  // chat thread via proactiveNudge.
  const [hintLoading, setHintLoading] = useState(false)
  const requestManualHint = useCallback(async () => {
    if (!isCanvasChallenge || !attemptId || hintLoading) return
    setHintLoading(true)
    const ground = nudgeGroundingRef.current
    try {
      const res = await fetch('/api/hatch/canvas/nudge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scene,
          recentDelta: { added: 1 },
          challengeId: isApiMode ? (props as Extract<FlowWorkspaceProps, { mode: 'api' }>).challengeId : '',
          challengeType: apiChallengeType,
          attemptId,
          nudgeCount: nudgeCountRef.current,
          active_step: ground.designStep,
          active_section: ground.designSection,
          active_section_text: ground.designSectionText?.slice(0, 5000) ?? null,
        }),
      })
      if (!res.ok) return
      const data = (await res.json()) as { nudge: string | null }
      lastNudgeAtRef.current = Date.now()
      if (data.nudge) nudgeCountRef.current += 1
      setProactiveNudge({
        id: `hint-${Date.now()}`,
        text: data.nudge ?? 'Nothing urgent from me. Keep building the section you are on.',
      })
    } catch {
      /* a missed hint is non-critical */
    } finally {
      setHintLoading(false)
    }
  }, [isCanvasChallenge, attemptId, hintLoading, scene, apiChallengeType, isApiMode, props])

  // "Run self-check" (design rail): asks Hatch for a verdict on the active step
  // through the interpret endpoint. The chat panel sends step_answers +
  // active_section with the turn, so the verdict reads the real write-up.
  const runSelfCheck = useCallback(() => {
    if (!activeDesignStepDef) return
    const section = effectiveActiveSectionId
      ? activeDesignStepDef.sections.find((s) => s.id === effectiveActiveSectionId)
      : undefined
    const focus = section && section.kind === 'textarea' ? `, weighing my "${section.label}" section first` : ''
    queueHatchPrompt(
      `Run a self-check on my ${activeDesignStepDef.label} step${focus}. Start with a one-word verdict: pass, partial, or retry. Then name the single most important fix.`,
      true
    )
  }, [activeDesignStepDef, effectiveActiveSectionId, queueHatchPrompt])

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

  // Uniform idle nudge. When the user goes quiet on a question (FLOW), in the
  // editor (coding), or on a populated canvas (system design / data modeling),
  // ask Hatch — via the same /api/hatch/canvas/nudge endpoint the analytics
  // medium uses — whether it has one grounded thing to say. This replaces the
  // old canned "Stuck on your X?" line so every challenge type gets the same
  // gentle, dismissible, context-aware nudge instead of a generic prompt.
  useEffect(() => {
    if (!emitHatchCue || phase !== 'question') return

    const fireNudge = async () => {
      const apiType = isFlowChallenge ? 'flow' : apiChallengeType
      const ground = nudgeGroundingRef.current

      // Per-type body. Canvas reuses the scene path (with a synthetic delta so the
      // trivial-change gate lets the current scene through on an idle tick).
      const body: Record<string, unknown> = {
        challengeId,
        challengeType: apiType,
        attemptId: attemptId ?? challengeId,
        lastNudgeAt: lastNudgeAtRef.current || undefined,
        nudgeCount: nudgeCountRef.current,
      }
      if (isFlowChallenge) {
        if (!ground.flowQuestion) return
        body.flow_step = ground.flowStep
        body.flow_question = ground.flowQuestion
        body.flow_selected_labels = ground.flowSelectedLabels
      } else if (isCodingChallenge) {
        if (!ground.codeTail && ground.testsTotal == null) return
        body.code_language = ground.codeLanguage
        body.code_tail = ground.codeTail
        body.tests_passed = ground.testsPassed
        body.tests_total = ground.testsTotal
      } else if (isCanvasChallenge) {
        const sectionDraft = ground.designSectionText?.trim() ?? ''
        if ((!scene || scene.elementCount < 2) && sectionDraft.length < 40) return
        body.scene = scene
        body.recentDelta = { added: 1 }
        body.active_step = ground.designStep
        body.active_section = ground.designSection
        body.active_section_text = ground.designSectionText?.slice(0, 5000) ?? null
      } else {
        return
      }

      try {
        const res = await fetch('/api/hatch/canvas/nudge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) return
        const data = (await res.json()) as { nudge: string | null }
        if (!data.nudge) return

        lastNudgeAtRef.current = Date.now()
        nudgeCountRef.current += 1
        // One surface at a time. Interview challenges (canvas/coding) have a
        // docked Hatch panel: the nudge always lands in its thread, and the
        // collapsed Ask Hatch pill shows an unread dot - never a floating bubble
        // hovering over the pill. FLOW (MCQ) challenges have no docked panel, so
        // they keep the dismissible floating cue.
        if (isInterviewChallenge) {
          setProactiveNudge({ id: `idle-${Date.now()}`, text: data.nudge })
        } else {
          // FLOW (MCQ): feed the wide-desktop right rail's "Hatch's read" note
          // with the live nudge, and keep the floating cue for narrow viewports
          // where the rail is hidden.
          if (isFlowChallenge) {
            setProactiveNudge({ id: `idle-${Date.now()}`, text: data.nudge })
          }
          emitHatchCue?.({
            surface: 'workspace',
            message: data.nudge,
            state: 'intrigued',
            animation: 'nudging',
            target: 'workspace-answer-area',
            source: 'nudge',
            priority: 5,
            cooldownKey: `workspace-stuck:${attemptId ?? challengeId}`,
            cta: { label: 'Show a hint', action: 'open-workspace-chat' as const },
          })
        }
      } catch { /* a missed nudge is non-critical */ }
    }

    const timer = window.setInterval(() => {
      if (activeHatchCue) return
      const now = Date.now()
      if (now - lastWorkspaceProgressRef.current < 90_000) return
      if (now - lastWorkspaceCueRef.current < 120_000) return
      lastWorkspaceCueRef.current = now
      void fireNudge()
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
    isFlowChallenge,
    isInterviewChallenge,
    phase,
    scene,
  ])

  // ── Canvas draft autosave ─────────────────────────────────────────────────
  // The freshest draft payload lives in a ref; every change marks it dirty and
  // schedules a save. Scheduling is a debounce WITH a max wait: quiet for 2.5s
  // → save, but while changes keep arriving a save still lands at least every
  // 10s (a pure debounce starved forever during continuous drawing). Flushes
  // also fire on tab hide/close (keepalive) and when the canvas overlay closes,
  // so resuming later always finds the drawing.
  const canvasDraftPayloadRef = useRef<{ attemptId: string; draftSnapshot: Record<string, unknown>; updatedAt: string } | null>(null)
  const canvasDraftDirtyRef = useRef(false)
  const canvasLastSaveAtRef = useRef(0)
  const [canvasSaveState, setCanvasSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')

  const flushCanvasDraft = useCallback(async (opts?: { keepalive?: boolean; force?: boolean }) => {
    const payload = canvasDraftPayloadRef.current
    if (!payload) return
    if (!canvasDraftDirtyRef.current && !opts?.force) return
    // The inner ExcalidrawCanvas snapshot is itself debounced (~2s), so strokes
    // made just before a flush may not have reached React state yet. Read the
    // live elements straight from the Excalidraw API when available.
    const api = excalidrawApiRef.current
    if (api) {
      try {
        payload.draftSnapshot = { ...payload.draftSnapshot, elements: api.getSceneElements() }
      } catch { /* keep the last snapshot's elements */ }
    }
    canvasDraftDirtyRef.current = false
    canvasLastSaveAtRef.current = Date.now()
    setCanvasSaveState('saving')
    try {
      await fetch('/api/hatch/session/autosave', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, updatedAt: new Date().toISOString() }),
        // keepalive lets the request outlive a closing tab (64KB payload cap;
        // an oversized scene falls back to the last periodic save).
        keepalive: opts?.keepalive,
      })
      setCanvasSaveState('saved')
    } catch {
      // A failed save re-arms: the next change tick (or flush) retries.
      canvasDraftDirtyRef.current = true
      setCanvasSaveState('idle')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (
      !isCanvasChallenge ||
      !attemptId ||
      (!canvasScene && !contextPackText && Object.keys(stepAnswers).length === 0)
    ) return
    canvasDraftPayloadRef.current = {
      attemptId,
      draftSnapshot: {
        type: 'canvas',
        ...(canvasScene ?? { elements: [], appState: {} }),
        context_pack: contextPackText || null,
        context_pack_fields: contextPack,
        step_answers: stepAnswers,
        active_design_step: activeDesignStep,
      },
      updatedAt: new Date().toISOString(),
    }
    canvasDraftDirtyRef.current = true
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)
    const sinceLastSave = Date.now() - canvasLastSaveAtRef.current
    const delay = Math.min(2500, Math.max(250, 10000 - sinceLastSave))
    autosaveTimerRef.current = setTimeout(() => { void flushCanvasDraft() }, delay)
    return () => { if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current) }
  }, [canvasScene, contextPack, contextPackText, stepAnswers, activeDesignStep, isCanvasChallenge, attemptId, flushCanvasDraft])

  // Flush pending canvas work when the tab hides, closes, or this workspace
  // unmounts (client-side nav away), so nothing drawn is lost between ticks.
  useEffect(() => {
    if (!isCanvasChallenge || !attemptId) return
    const flush = () => { void flushCanvasDraft({ keepalive: true, force: true }) }
    const onVisibility = () => { if (document.visibilityState === 'hidden') flush() }
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', onVisibility)
      flush()
    }
  }, [isCanvasChallenge, attemptId, flushCanvasDraft])

  // Closing the drawing overlay is a natural save point — flush immediately so
  // "Done, back to write-up" always leaves the diagram persisted.
  useEffect(() => {
    if (!isCanvasChallenge || canvasMaximised) return
    if (canvasDraftDirtyRef.current) void flushCanvasDraft()
  }, [canvasMaximised, isCanvasChallenge, flushCanvasDraft])

  // Autosave coding drafts every 10s when the code, notes, path step, or
  // confidence changes. Still silent in the chrome, but the status bar reflects
  // the real save lifecycle (saving → saved + timestamp).
  useEffect(() => {
    if (!isCodingChallenge || !attemptId) return
    if (!currentCode && !contextPackText) return
    if (codingAutosaveTimerRef.current) clearTimeout(codingAutosaveTimerRef.current)
    codingAutosaveTimerRef.current = setTimeout(async () => {
      try {
        setCodingSaveState('saving')
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
              coding_step: codingStep,
              coding_confidence: codingConfidence,
              context_pack_fields: contextPack,
            },
            updatedAt: new Date().toISOString(),
          }),
        })
        setCodingSaveState('saved')
        setCodingSavedAt(new Date())
      } catch {
        // fire and forget — a failed save retries on the next change tick
        setCodingSaveState('idle')
      }
    }, 10000)
    return () => { if (codingAutosaveTimerRef.current) clearTimeout(codingAutosaveTimerRef.current) }
  }, [currentCode, currentLanguage, isCodingChallenge, attemptId, activePartId, apiChallengeType, codingStep, codingConfidence, contextPack, contextPackText])

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
    // Algorithm challenges never run SQL. Check this FIRST so a stale sql_schema
    // wrongly attached to an algorithm challenge can't force the language to sql
    // (the SQL option is also hidden from the selector for these). Keep the active
    // language in the non-SQL set even when metadata is missing or lists sql.
    if (apiChallengeType === 'algorithm') {
      const NON_SQL_DEFAULTS: SupportedLanguage[] = ['python', 'javascript', 'java', 'cpp', 'go']
      const allowed = (meta.supported_languages ?? []).filter(l => l !== 'sql')
      const effective = allowed.length > 0 ? allowed : NON_SQL_DEFAULTS
      if (!effective.includes(currentLanguage)) setCurrentLanguage(effective[0])
      return
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
    // Baseline for the advisory path's Code signal: the first edit that
    // differs from this text means the user is writing code.
    initialCodeRef.current = draft ?? starterCode
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
      | {
          type?: string
          language?: string
          drafts?: Record<string, Partial<Record<SupportedLanguage, string>>>
          coding_step?: string
          coding_confidence?: string
          context_pack_fields?: ContextPackField[]
        }
      | undefined

    // Coding Notes tab fields (Plan / Edge cases / Complexity) — start from the
    // coding defaults and merge any values persisted with this attempt.
    const baseNoteFields = buildDefaultContextPackFields(apiChallengeType)
    const savedNoteFields = Array.isArray(snap?.context_pack_fields) ? snap.context_pack_fields : []
    setContextPack(
      baseNoteFields.map((field) => {
        const match = savedNoteFields.find((s) => s?.id === field.id)
        return match && typeof match.value === 'string' && match.value
          ? { ...field, value: match.value }
          : field
      })
    )
    // Restore the advisory path position and declared confidence. Direct set
    // (not advance) — the snapshot is this attempt's own truth.
    if (isCodingStep(snap?.coding_step)) setCodingStep(snap.coding_step)
    if (snap?.coding_confidence === 'low' || snap?.coding_confidence === 'medium' || snap?.coding_confidence === 'high') {
      setCodingConfidence(snap.coding_confidence)
    }

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
      initialCodeRef.current = saved ?? metadata?.starter_code?.[normLang] ?? ''
    } else {
      // Fresh attempt with no saved draft: clear any ref left over from a prior
      // attempt AND reset the editor to starter. The starter-init effect doesn't
      // re-run on attempt changes, so without this a same-challenge "Try Again"
      // would keep the previous attempt's editor text (and autosave it).
      codingDraftsRef.current = {}
      setCodingDrafts({})
      const metadata = detail.challenge.metadata as { starter_code?: Record<string, string> } | null | undefined
      setCurrentCode(metadata?.starter_code?.[currentLanguage] ?? '')
      initialCodeRef.current = metadata?.starter_code?.[currentLanguage] ?? ''
    }

    didHydrateDraftRef.current = attemptKey
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail?.current_attempt?.id, attemptId, isCodingChallenge, detail?.challenge?.id])

  // Hydrate the canvas workspace (write-up + context pack + scene) from the
  // persisted draft_snapshot once per attempt — mirrors the coding pattern
  // above. Elements restore goes through canvasInitialData below; setting
  // canvasScene here keeps summarizeScene + guidance in step immediately.
  useEffect(() => {
    if (!isCanvasChallenge || !detail?.challenge) return
    const attemptKey = detail.current_attempt?.id ?? attemptId
    if (!attemptKey || didHydrateCanvasRef.current === attemptKey) return

    type CanvasSnap = {
      type?: string
      elements?: unknown[]
      step_answers?: StepAnswers
      active_design_step?: string
      context_pack?: string
      context_pack_fields?: ContextPackField[]
    }
    // Prefer the in-progress draft; with no draft (fresh attempt after a
    // submit), restore the previously SUBMITTED drawing so the user can review
    // and build on it instead of facing an empty canvas.
    const draft = detail.current_attempt?.draft_snapshot as CanvasSnap | undefined
    const finalSnap = detail.latest_completed_attempt?.canvas_final_snapshot as
      | { elements?: unknown[] }
      | undefined
    // An empty canvas draft (fresh attempt that autosaved before any drawing)
    // must not block the submitted-scene fallback.
    const draftHasContent = draft?.type === 'canvas' &&
      ((Array.isArray(draft.elements) && draft.elements.length > 0) || Boolean(draft.step_answers))
    const snap: CanvasSnap | undefined =
      draftHasContent
        ? draft
        : Array.isArray(finalSnap?.elements) && finalSnap.elements.length > 0
          ? { type: 'canvas', elements: finalSnap.elements }
          : draft?.type === 'canvas' ? draft : undefined

    if (snap?.type === 'canvas') {
      if (snap.step_answers && typeof snap.step_answers === 'object') {
        setStepAnswers(snap.step_answers)
      }
      if (isDesignStepId(snap.active_design_step)) {
        setActiveDesignStep(snap.active_design_step)
      }
      if (Array.isArray(snap.context_pack_fields)) {
        const saved = snap.context_pack_fields
        setContextPack((prev) =>
          prev.map((field) => {
            const match = saved.find((s) => s?.id === field.id)
            return match && typeof match.value === 'string' && match.value
              ? { ...field, value: match.value }
              : field
          })
        )
      }
      if (Array.isArray(snap.elements) && snap.elements.length > 0) {
        setCanvasScene({ elements: snap.elements, appState: {} })
        setEmptyStateDismissed(true)
      }
    }

    didHydrateCanvasRef.current = attemptKey
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail?.current_attempt?.id, detail?.latest_completed_attempt?.id, attemptId, isCanvasChallenge, detail?.challenge?.id])

  // Elements-only initial data for Excalidraw on resume. Never pass the saved
  // appState — a persisted getAppState() carries `collaborators` and breaks
  // Excalidraw's initialData restore. Falls back to the last SUBMITTED scene
  // when there is no in-progress draft (re-entry after submit).
  const canvasInitialData = useMemo(() => {
    // The just-submitted scene is newer than the server detail fetched on mount.
    // Preserve it even when intentionally empty, and only for its own attempt.
    if (submittedCanvasScene?.attemptId === attemptId) {
      return { elements: submittedCanvasScene.elements }
    }
    const snap = detail?.current_attempt?.draft_snapshot as
      | { type?: string; elements?: unknown[] }
      | undefined
    if (snap?.type === 'canvas' && Array.isArray(snap.elements) && snap.elements.length > 0) {
      return { elements: snap.elements }
    }
    const finalSnap = detail?.latest_completed_attempt?.canvas_final_snapshot as
      | { elements?: unknown[] }
      | undefined
    if (Array.isArray(finalSnap?.elements) && finalSnap.elements.length > 0) {
      return { elements: finalSnap.elements }
    }
    return undefined
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail?.current_attempt?.id, detail?.latest_completed_attempt?.id, submittedCanvasScene, attemptId])

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

  // Viewing existing feedback must not create a new attempt or consume a quota.
  // A missing record or closing feedback is not consent to start practice.
  useEffect(() => {
    if (!isApiMode) return
    if (!canStartWorkspaceAttempt(initialAttemptId, historyPracticeRequested)) {
      if (detail) setPhase('question')
      return
    }
    if (detail && !challengeLoading && !attemptId && !attemptStartPending.current) {
      if (detail.current_attempt?.status === 'in_progress') {
        setAttemptId(detail.current_attempt.id)
        const resumeStep = detail.current_attempt.current_step === 'done' ? 'frame' : detail.current_attempt.current_step as FlowStep
        setCurrentStep(resumeStep)
        // Mark all steps before the current one as completed
        const resumeIdx = FLOW_STEPS.indexOf(resumeStep)
        if (resumeIdx > 0) setCompletedSteps(FLOW_STEPS.slice(0, resumeIdx))
        setPhase('question')
      } else {
        attemptStartPending.current = true
        startAttempt(initialRoleId).then((attempt) => {
          if (attempt) {
            setAttemptId(attempt.id)
            setCurrentStep('frame')
            setPhase('question')
            trackEvent(EVENT_CHALLENGE_STARTED, { challenge_id: challengeId, attempt_id: attempt.id })
          }
        }).finally(() => { attemptStartPending.current = false })
      }
    }
  }, [detail, challengeLoading, attemptId, isApiMode, initialRoleId, startAttempt, initialAttemptId, historyPracticeRequested, challengeId])

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

  // Keep the idle-nudge grounding snapshot current. Reads the live FLOW question
  // + the labels of options the user leaned toward, or the current code + last
  // test run, so the idle timer (declared above, before these values exist) can
  // build a grounded nudge body without re-subscribing on every keystroke.
  useEffect(() => {
    const selectedLabels: string[] = []
    if (currentQuestion) {
      const picked = currentQuestion.allow_multiple
        ? selectedOptionIds
        : selectedOptionId
          ? [selectedOptionId]
          : []
      for (const oid of picked) {
        const opt = currentQuestion.options.find(o => o.id === oid)
        if (opt?.option_text) selectedLabels.push(opt.option_text)
      }
    }
    nudgeGroundingRef.current = {
      flowStep: currentStep ?? null,
      flowQuestion: currentQuestion?.question_text ?? null,
      flowSelectedLabels: selectedLabels,
      codeLanguage: isCodingChallenge ? currentLanguage : null,
      codeTail: isCodingChallenge && currentCode ? currentCode.slice(-1500) : null,
      testsPassed: lastRunResult ? lastRunResult.testsPassed : null,
      testsTotal: lastRunResult ? lastRunResult.testsTotal : null,
      designStep: isCanvasChallenge ? activeDesignStep : null,
      designSection: isCanvasChallenge ? effectiveActiveSectionId : null,
      designSectionText:
        isCanvasChallenge && effectiveActiveSectionId
          ? stepAnswers[activeDesignStep]?.[effectiveActiveSectionId] ?? null
          : null,
    }
  }, [
    currentQuestion,
    selectedOptionId,
    selectedOptionIds,
    currentStep,
    currentCode,
    currentLanguage,
    lastRunResult,
    isCodingChallenge,
    isCanvasChallenge,
    activeDesignStep,
    effectiveActiveSectionId,
    stepAnswers,
  ])

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

        // Feed each question's grade into the bounded guidance machine
        // (SUN-251): a run of strong answers opens the register up, a run of
        // weak ones brings the hints back. One net movement per direction.
        for (const qr of result.questions) {
          const adj = applyVerdict(guidanceMachineRef.current, verdictFromScore(qr.score ?? 0), coachRegister)
          guidanceMachineRef.current = adj.state
          if (adj.moved) {
            guidanceAdjustmentsRef.current.push({
              from: coachRegister,
              to: adj.guidance,
              trigger: adj.moved === 'down' ? 'two weak answers in a row' : 'two strong answers in a row',
              atStepId: currentStep,
            })
            setCoachRegister(adj.guidance)
            if (adj.guidance === 'scaffolded') setHintOpen(true)
          }
        }

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
    setInterviewSubmitError(null)
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
          // Structured write-up — the server merges this into
          // canvas_final_snapshot.step_answers for the grader.
          stepAnswers,
        }),
      })
      if (!res.ok) {
        const failure = await res.json().catch(() => ({}))
        throw new Error(typeof failure.error === 'string' ? failure.error : 'We could not finish the review. Please retry.')
      }
      const data = await res.json()
      playHatchSound('success')
      setInterviewGrade(data.grade)
      setSubmittedCanvasScene({ attemptId, elements: canvasScene?.elements ?? [] })
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
          xpAwarded: typeof data.xp_awarded === 'number' ? data.xp_awarded : 0,
          stepResults: [],
          competencyDeltas: [],
          canvasPngUrl: canvasPngUrl ?? null,
        })
        void loadSubmissionHistory()
      }
    } catch (err) {
      playHatchSound('error')
      console.error('Interview submit error:', err)
      setInterviewSubmitError(err instanceof Error ? err.message : 'We could not finish the review. Please retry.')
    } finally {
      setIsSubmittingInterview(false)
    }
  }, [isApiMode, props, attemptId, canvasScene, contextPack, contextPackText, stepAnswers, isSubmittingInterview, playHatchSound, uploadCanvasPng])

  // Derived: active coding parts from detail (only meaningful for coding challenges)
  const codingParts = (isApiMode ? (detail?.codingParts ?? []) : [])

  // Run handler for coding challenges — fires visible test cases only. Part-
  // aware: when a multi-part coding subtask is active, only that part's test
  // cases run (running everything would be rejected as out of part scope).
  // This is the ONLY run path; the toolbar previously carried a duplicate
  // inline closure that bypassed the guidance machine.
  const handleCodingRun = useCallback(async () => {
    if (codeRunner.status === 'running') return
    // Advisory path: a run is the Test move (never regresses a later step).
    advanceStep('test')
    setOutputPanelStatus('running')
    setOutputPanelError(undefined)
    setCodingGradingError(undefined)
    try {
      const activePart = codingParts.find(p => p.id === activePartId)
      const testCaseIds = activePart?.coding_test_case_ids?.length
        ? activePart.coding_test_case_ids
        : undefined
      const result = await codeRunner.run(currentCode, testCaseIds)
      if (result) {
        setLastRunResult(result)
        feedRunVerdict(result)
        setOutputPanelStatus('done')
        // All visible tests green — the remaining move is Optimize (check
        // complexity against constraints, then submit for the hidden set).
        if (result.testsTotal > 0 && result.testsPassed === result.testsTotal) {
          advanceStep('optimize')
        }
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
  }, [codeRunner, currentCode, feedRunVerdict, codingParts, activePartId, advanceStep])

  // Submit handler for coding challenges - final correctness first, then Hatch grading.
  const handleCodingSubmit = useCallback(async () => {
    const challengeId = isApiMode ? (props as Extract<FlowWorkspaceProps, { mode: 'api' }>).challengeId : ''
    if (!challengeId || !attemptId || isSubmittingCoding) return
    setIsSubmittingCoding(true)
    setOutputPanelStatus('running')
    setOutputPanelError(undefined)
    setCodingGradingError(undefined)
    setCodingFeedback(null)

    try {
      // Submit is self-sufficient: it runs the full test suite itself, so the
      // user never has to manually Run first. If the runner is momentarily busy
      // or returns an empty result (transient Judge0 hiccup), retry once before
      // giving up — this is what otherwise surfaced as the server 422 "not_ready"
      // reset-to-question bounce.
      let correctnessResult = await codeRunner.submit(currentCode)
      if ((!correctnessResult || correctnessResult.testsTotal === 0)) {
        correctnessResult = await codeRunner.submit(currentCode)
      }
      if (!correctnessResult || correctnessResult.testsTotal === 0) {
        // Still no runnable signal — keep the user in place with an actionable
        // message instead of POSTing (which would 422 and reset the phase).
        setPhase('question')
        throw new Error(
          currentLanguage === 'sql'
            ? 'Could not run your query against the tests. Try Run once, then submit again.'
            : 'Could not run the tests for this submission. Try Run once, then submit again.'
        )
      }

      setLastRunResult(correctnessResult)
      setOutputPanelStatus('done')
      setPhase('complete')

      // Open-register learners who clear every test get pointed at the
      // approach comparison instead of congratulations (SUN-252).
      if (coachRegister === 'open' && correctnessResult.testsTotal > 0 && correctnessResult.testsPassed === correctnessResult.testsTotal) {
        setProactiveNudge({
          id: `adaptive-compare-${Date.now()}`,
          text: 'Clean solve. Open the Solutions tab and put your approach against the official one, the tradeoffs are where the learning is.',
        })
      }

      // Hatch's review is on demand: the user asks for it from the feedback
      // surface (retryCodingGrading), so submit ends at correctness. No AI
      // call, no analysing wait, and no spend for users who just want the
      // test verdict. The submitted code + results still persist so history
      // can show them even if feedback is never requested; fire-and-forget
      // with keepalive so navigating away doesn't lose the snapshot.
      void fetch(`/api/challenges/${challengeId}/coding-snapshot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          attemptId,
          finalCode: currentCode,
          language: currentLanguage,
          correctnessPayload: correctnessResult,
        }),
      }).catch(() => { /* non-fatal — coding-submit re-persists on grading */ })
    } catch (err) {
      console.error('Coding submit error:', err)
      setOutputPanelStatus('error')
      setOutputPanelError(err instanceof Error ? err.message : 'Submit failed')
      setCodingGradingError(err instanceof Error ? err.message : 'Submit failed')
    } finally {
      setIsSubmittingCoding(false)
      setIsLoadingGrading(false)
    }
  }, [isApiMode, props, attemptId, currentCode, currentLanguage, isSubmittingCoding, codeRunner, coachRegister])

  // Submit handler for a multi-part coding subtask — runs only the active
  // part's test cases, then posts the part-scoped grade. Extracted from the
  // toolbar's inline closure so the workspace bar can own the button.
  const handleSubmitPart = useCallback(async () => {
    const challengeId = isApiMode ? (props as Extract<FlowWorkspaceProps, { mode: 'api' }>).challengeId : ''
    const partId = activePartId
    if (!partId || !challengeId || !attemptId || isSubmittingCoding) return
    // Advisory path: a part submit runs its tests — the Test move.
    advanceStep('test')
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
      const submitRes = await fetch(`/api/challenges/${challengeId}/coding-submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(70_000),
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
  }, [isApiMode, props, activePartId, attemptId, isSubmittingCoding, codingParts, codeRunner, currentCode, currentLanguage, advanceStep])

  // Keyboard shortcuts for the workspace bar actions (coding only):
  // Cmd/Ctrl+' runs, Cmd/Ctrl+Enter submits — but never while Monaco has
  // focus, where Cmd+Enter is the editor's own binding.
  useEffect(() => {
    if (!isCodingChallenge) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return
      const inEditor = (e.target as HTMLElement | null)?.closest?.('.monaco-editor')
      if (inEditor) return
      if (e.key === "'") {
        e.preventDefault()
        void handleCodingRun()
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (codingParts.length > 0) void handleSubmitPart()
        else void handleCodingSubmit()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isCodingChallenge, handleCodingRun, handleCodingSubmit, handleSubmitPart, codingParts.length])

  // ── Coding workspace derivations + Hatch actions (round-4 rebuild) ─────────

  // Visible test cases for the Test Cases panel, from challenge metadata —
  // the same source useCodeRunner executes. Part-scoped when a multi-part
  // subtask is active (mirrors handleCodingRun). Hidden cases are counted for
  // the "+N hidden tests run on submit" footer, never shown.
  const { visibleTestCases, hiddenTestCount } = useMemo((): { visibleTestCases: TestCase[]; hiddenTestCount: number } => {
    if (!isCodingChallenge) return { visibleTestCases: [], hiddenTestCount: 0 }
    const all = getTestCases(detail?.challenge?.metadata as Record<string, unknown> | undefined)
    const activePart = codingParts.find(p => p.id === activePartId)
    const scoped = activePart?.coding_test_case_ids?.length
      ? all.filter(tc => activePart.coding_test_case_ids!.includes(tc.id))
      : all
    return {
      visibleTestCases: scoped
        .filter(tc => !tc.hidden)
        .map(tc => ({
          id: tc.id,
          label: tc.label,
          hidden: false,
          args: 'args' in tc && Array.isArray(tc.args) ? tc.args : [],
          expected: 'expected_rows' in tc ? tc.expected_rows : ('expected' in tc ? tc.expected : undefined),
        })),
      hiddenTestCount: scoped.filter(tc => tc.hidden).length,
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCodingChallenge, detail?.challenge?.id, detail?.challenge?.metadata, codingParts, activePartId])

  // Editor onChange wrapper: the first edit that differs from the hydrated
  // baseline advances the advisory path to Code. Run/submit stay untouched.
  const handleEditorChange = useCallback((value: string) => {
    setCurrentCode(value)
    if (initialCodeRef.current !== null && value !== initialCodeRef.current) {
      advanceStep('code')
    }
  }, [advanceStep])

  // Advisory path: 20s of reading the Description while the session is live
  // counts as moving into Plan (the other Plan signal is a Notes edit).
  useEffect(() => {
    if (!isCodingChallenge || phase !== 'question' || leftTab !== 'Description') return
    const timer = setTimeout(() => advanceStep('plan'), 20_000)
    return () => clearTimeout(timer)
  }, [isCodingChallenge, phase, leftTab, advanceStep])

  // "Show me a hint" (coding rail): on-demand nudge grounded in the current
  // code and last run — the same /api/hatch/canvas/nudge coding grounding the
  // idle nudge sends. Delivered hints accumulate in the rail's list.
  const requestCodingHint = useCallback(async () => {
    if (!isCodingChallenge || !attemptId || codingHintPending) return
    setCodingHintPending(true)
    try {
      const res = await fetch('/api/hatch/canvas/nudge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: isApiMode ? (props as Extract<FlowWorkspaceProps, { mode: 'api' }>).challengeId : '',
          challengeType: apiChallengeType,
          attemptId,
          nudgeCount: nudgeCountRef.current,
          code_language: currentLanguage,
          code_tail: currentCode ? currentCode.slice(-2000) : null,
          tests_passed: lastRunResult?.testsPassed ?? null,
          tests_total: lastRunResult?.testsTotal ?? null,
        }),
      })
      if (!res.ok) return
      const data = (await res.json()) as { nudge: string | null }
      lastNudgeAtRef.current = Date.now()
      if (data.nudge) nudgeCountRef.current += 1
      const hint = data.nudge ?? 'Nothing urgent from me. Run what you have — the failing case will say more than I can.'
      setCodingHints((prev) => [...prev, hint])
    } catch {
      /* a missed hint is non-critical */
    } finally {
      setCodingHintPending(false)
    }
  }, [isCodingChallenge, attemptId, codingHintPending, isApiMode, props, apiChallengeType, currentLanguage, currentCode, lastRunResult])

  // "Check your approach" (coding rail): asks Hatch for a pass / partial /
  // retry verdict on the current code through the interpret endpoint's
  // asserted_finding self-check flow. The verdict renders in the rail.
  const runCodingSelfCheck = useCallback(async () => {
    if (!isCodingChallenge || !attemptId || codingSelfCheck.status === 'checking') return
    setCodingSelfCheck((prev) => ({ status: 'checking', verdict: prev.verdict }))
    // challengeTitle / scenarioContext consts are declared later in the render
    // body (after the loading forks) — derive locally to avoid the TDZ.
    const selfCheckTitle = detail?.challenge?.title
    const selfCheckStatement = detail?.challenge?.scenario_context ?? detail?.challenge?.scenario_question
    try {
      const res = await fetch('/api/hatch/canvas/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Check my approach before I go further.',
          challengeId: isApiMode ? (props as Extract<FlowWorkspaceProps, { mode: 'api' }>).challengeId : '',
          challengeType: 'coding',
          attemptId,
          asserted_finding: 'I believe my current approach solves this problem and handles the constraints.',
          current_code: currentCode,
          current_language: currentLanguage,
          last_run_result: lastRunResult,
          coding_step: codingStep,
          context_pack: contextPackText || undefined,
          challenge_title: selfCheckTitle ?? undefined,
          problem_statement: selfCheckStatement ?? undefined,
          guidance_level: coachRegister,
          history: [],
        }),
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => null) as { error?: string } | null
        setCodingSelfCheck({
          status: 'done',
          verdict: payload?.error === 'limit_reached'
            ? 'You have hit the free Hatch review limit for now. The tests still tell the truth — run them.'
            : 'Hatch could not review that just now. Try again in a moment.',
        })
        return
      }
      const data = (await res.json()) as { message?: string }
      setCodingSelfCheck({
        status: 'done',
        verdict: data.message?.trim() || 'Hatch could not review that just now. Try again in a moment.',
      })
    } catch {
      setCodingSelfCheck({ status: 'done', verdict: 'Hatch could not review that just now. Try again in a moment.' })
    }
  }, [isCodingChallenge, attemptId, codingSelfCheck.status, isApiMode, props, currentCode, currentLanguage, lastRunResult, codingStep, contextPackText, coachRegister, detail?.challenge])

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
        signal: AbortSignal.timeout(70_000),
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
      const gradingPayload = await gradingRes.json() as { grade?: GradingFeedback; xp_awarded?: number }
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
          // A retry doesn't re-award XP (server 409s the second grade); the
          // background refetch reconciles the originally-awarded value.
          xpAwarded: gradingPayload.xp_awarded ?? 0,
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
        // FLOW completion consumes a rep; refresh every usage surface (SessionContext
        // + the no-longer-polling pill). See recordSubmission for the rationale.
        window.dispatchEvent(new CustomEvent('profile-stats-updated', { detail: { source: 'flow-complete' } }))
        usageEventBus.emit()
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
              adaptive: {
                guidance: coachRegister,
                adjustments: guidanceAdjustmentsRef.current,
              },
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
      // QA affordance: in mock mode, ?mock=stepped on the workspace URL surfaces
      // the interactive binary-search walkthrough. No effect outside mock mode.
      const steppedMock = typeof window !== 'undefined'
        && new URLSearchParams(window.location.search).get('mock') === 'stepped'
      const qs = steppedMock ? '?mock=stepped' : ''
      const res = await fetch(`/api/challenges/${challengeId}/solution${qs}`)
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
    if (!approach) return null
    return {
      title: approach.title,
      tagline: approach.tagline,
      // The walkthrough step the learner is on, so Hatch can coach the move itself.
      ...(activeSolutionStep
        ? { stepTitle: activeSolutionStep.title, stepDecision: activeSolutionStep.decision }
        : {}),
    }
  }, [solution, activeApproachId, activeSolutionStep])
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
        <HatchImage size={48} state="idle" />
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

  // Usage cap reached on start: render an inline, non-navigating panel in place
  // of the (otherwise infinite) loading spinner. The paywall modal handles the
  // upgrade offer; this keeps the user on the page with the challenge title in
  // view and one explicit way out, instead of ejecting them.
  if (isApiMode && paywallData && !attemptId) {
    const capExitHref = workspaceExitHref({ fromPlan, fromDomain }, props.returnTo)
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 px-6 py-12 text-center">
        <HatchImage size={56} state="idle" />
        {detail?.challenge.title && (
          <p className="font-label text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant">
            {detail.challenge.title}
          </p>
        )}
        <h2 className="font-headline text-2xl font-bold text-on-surface">
          You&rsquo;ve used {paywallData.used} of {paywallData.limit} free reps this month
        </h2>
        <p className="max-w-md font-body text-sm text-on-surface-variant">
          Upgrade to keep practicing without limits, or come back next month when your free reps reset.
        </p>
        <Link
          href={capExitHref}
          className="font-label text-sm font-semibold text-on-surface-variant underline underline-offset-4 transition-colors hover:text-primary"
        >
          Browse challenges
        </Link>
      </div>
    )
  }

  if ((isApiMode && challengeLoading) || phase === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <HatchImage size={56} state="reviewing" />
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

  const problemStatementForHatch = challengeBriefSections.map(section => `${section.title}: ${section.body}`).join('\n\n')
  const sqlSchema = currentLanguage === 'sql'
    ? (detail?.challenge.metadata?.sql_schema as { schema_diagram?: unknown; sample_data_preview?: unknown; setup_script?: string } | undefined)
    : undefined
  const sqlSchemaSummary = sqlSchema ? JSON.stringify({
    schema: sqlSchema.schema_diagram ?? sqlSchema.setup_script,
    sample_data: sqlSchema.sample_data_preview,
  }).slice(0, 20000) : undefined

  const handleRunAnother = () => {
    setHistoryPracticeRequested(true)
    setLeftTab('Description')
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

  const tabs = ['Description', 'Solutions', 'Discussions', 'Submissions'] as const

  // Coding doc tabs: split the description on ## Examples / ## Constraints
  // boundaries (per CHALLENGE_DESCRIPTION_SPEC — sql's ## Output is the ask and
  // stays in Description). An absent section means an absent tab, never an
  // empty pane. Non-coding challenge types keep the four tabs unchanged.
  const problemSections = isCodingChallenge
    ? splitProblemSections(
        challengeBriefSections
          .filter((s) => s.tone === 'context')
          .map((s) => s.body)
          .join('\n\n')
      )
    : null
  const codingPrimaryTabs: Array<'Description' | 'Examples' | 'Constraints' | 'Notes'> = [
    'Description',
    ...(problemSections?.examples ? (['Examples'] as const) : []),
    ...(problemSections?.constraints ? (['Constraints'] as const) : []),
    'Notes',
  ]
  const codingMoreTabs = ['Solutions', 'Discussions', 'Submissions'] as const
  // Description pane body for coding: the split description replaces the raw
  // context sections; change/task/support sections keep rendering as before.
  const briefSectionsForDisplay = isCodingChallenge && problemSections
    ? (() => {
        const nonContext = challengeBriefSections.filter((s) => s.tone !== 'context')
        const firstContext = challengeBriefSections.find((s) => s.tone === 'context')
        return firstContext
          ? [{ ...firstContext, body: problemSections.description }, ...nonContext]
          : challengeBriefSections
      })()
    : challengeBriefSections

  // Left pane description content
  const descriptionPane = (
    <div className="learning-workspace-brief" style={{ flex: 1, overflowY: 'auto', padding: '24px 24px' }}>
      {!isInterviewChallenge && (
        <div className="font-label" style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-ink-strong)', marginBottom: 12 }}>
          Problem Brief
        </div>
      )}
      {/* Chips */}
      {(() => {
        const ch = isApiMode ? detail?.challenge : adapterChallenge
        const diff = ch?.difficulty
        const challengeType = isApiMode
          ? ((ch as { challenge_type?: string } | null | undefined)?.challenge_type ?? apiChallengeType)
          : 'flow'
        const disciplineCopy = challengeType ? CHALLENGE_TYPE_FILTER_COPY[challengeType] : null
        const companyTags: string[] = ((ch as { company_tags?: string[] })?.company_tags ?? [])
          .filter((tag) => typeof tag === 'string' && tag.trim().length > 0)
        const topicTags: string[] = (ch as { tags?: string[] })?.tags ?? []
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 16 }}>
            {disciplineCopy && (
              <Link
                href={practiceFilterHref('discipline', disciplineCopy.discipline)}
                title={`Browse ${disciplineCopy.label} practice`}
                style={{
                  // Sticker chip (spec §7): tinted fill + 1.5px fg border, never
                  // a solid heavy pill on an inactive element.
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: 'var(--color-sd-bg)', color: 'var(--color-sd-fg)',
                  border: '1.5px solid var(--color-sd-fg)',
                  fontSize: 10.5, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase',
                  padding: '2px 9px', borderRadius: 999,
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
                  // Amber taxonomy chip instead of the near-black pill — heavy
                  // fills are reserved for active/primary elements.
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: 'var(--color-note-amber)', color: '#8a6116',
                  border: '1px solid var(--color-note-amber-border)',
                  fontSize: 10.5, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                  padding: '2.5px 9px', borderRadius: 999,
                  fontFamily: 'var(--font-label)', textDecoration: 'none',
                  position: 'relative', zIndex: 0,
                }}>
                  {label}
                </Link>
              )
            })()}
            {companyTags.map(tag => (
              <Link key={tag} href={practiceFilterHref('company', tag)} title={`Browse ${formatCompany(tag)} practice`} style={{
                // Quiet neutral chip, no repeated glyph (icon budget §4) and no
                // dark fill — company names are taxonomy, not state.
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: 'var(--color-surface-container-high)',
                color: 'var(--color-on-surface-variant)',
                border: '1px solid var(--color-outline-variant)',
                fontSize: 10.5, fontWeight: 600, letterSpacing: '0.04em',
                padding: '2.5px 9px', borderRadius: 999,
                fontFamily: 'var(--font-label)', textDecoration: 'none',
              }}>
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
        <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: 30, fontWeight: 500, lineHeight: 1.22, letterSpacing: '-0.025em', color: 'var(--color-on-surface)', marginBottom: 18 }}>
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
            <ProblemDocument sections={briefSectionsForDisplay} />
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
                Assumptions and tradeoffs Hatch should consider with your diagram.
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
                  <HatchImage size={22} state="listening" />
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
          sql_schema?: { schema_diagram?: SchemaDiagramData; sample_data_preview?: Record<string, Record<string, unknown>[]>; setup_script?: string }
          test_cases?: ExpectedOutputTestCase[]
        } | null | undefined
        const schemaDiagram = metadata?.sql_schema?.schema_diagram
        const sampleDataPreview = metadata?.sql_schema?.sample_data_preview
        // Over half the published SQL bank has a runnable setup_script but no
        // authored diagram; show the raw DDL so a schema is always visible.
        const setupScript = !schemaDiagram && typeof metadata?.sql_schema?.setup_script === 'string'
          ? metadata.sql_schema.setup_script.trim()
          : ''
        const sqlTestCases = Array.isArray(metadata?.test_cases) ? metadata.test_cases : []
        if (!schemaDiagram && !sampleDataPreview && !setupScript && sqlTestCases.length === 0) return null
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
            {setupScript && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-on-surface-variant)', marginBottom: 8, fontFamily: 'var(--font-label)' }}>
                  Schema &amp; Sample Data
                </div>
                <pre style={{ margin: 0, padding: '12px 14px', borderRadius: 10, border: '1px solid var(--color-outline-variant)', background: 'var(--color-surface-container-low)', fontSize: 12, lineHeight: 1.55, overflowX: 'auto', whiteSpace: 'pre', fontFamily: 'var(--font-mono, ui-monospace, monospace)', color: 'var(--color-on-surface)' }}>
                  {setupScript}
                </pre>
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
            <div style={{ flex: 1, height: 1, background: 'var(--color-hairline)' }} />
            <span style={{ fontFamily: 'var(--font-label)', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--color-ink-secondary)' }}>
              Parts
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--color-hairline)' }} />
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
              let statusBg = 'var(--color-page-field)'
              let statusColor = 'var(--color-ink-secondary)'
              if (partSub?.submitted) {
                statusLabel = 'Submitted'
                statusBg = 'var(--color-forest-600)'
                statusColor = '#ffffff'
              } else if (partRunResult) {
                statusLabel = `${partRunResult.testsPassed}/${partRunResult.testsTotal}`
                statusBg = partRunResult.testsPassed === partRunResult.testsTotal ? 'var(--color-note-mint)' : 'var(--color-note-amber)'
                statusColor = 'var(--color-ink-strong)'
              } else if (isActive) {
                statusLabel = 'Open'
                statusBg = 'var(--color-page-field)'
                statusColor = 'var(--color-ink-secondary)'
              }

              return (
                <div
                  key={part.id}
                  data-testid={`part-card-${part.id}`}
                  style={{
                    /* Current part = amber sticky note (spec §7: amber = current). */
                    border: isActive ? '1px solid var(--color-note-amber-border)' : '1px solid var(--color-hairline)',
                    borderRadius: 10,
                    background: isActive ? 'var(--color-note-amber)' : 'var(--color-card-bright)',
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
                          <ReactMarkdown remarkPlugins={mdRemarkPlugins} rehypePlugins={mdRehypePlugins} skipHtml urlTransform={safeMarkdownUrl} components={codingMarkdownComponents}>
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
                      <span>{finalizeResult.score_breakdown.process.score == null ? 'Not assessed' : `${finalizeResult.score_breakdown.process.score.toFixed(1)} / 5`}</span>
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
                      <HatchImage size={14} state="reviewing" />
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

  // ── Coding doc tabs: Examples / Constraints / Notes panes ─────────────────
  // Examples and Constraints render the split markdown substrings through the
  // same document renderer as the Description. They exist only when the
  // description carries the section (tab absent otherwise, never empty).
  const examplesPane = problemSections?.examples ? (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px' }}>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 14.5, lineHeight: 1.72, color: 'var(--color-on-surface)' }}>
        <ReactMarkdown remarkPlugins={mdRemarkPlugins} rehypePlugins={mdRehypePlugins} skipHtml urlTransform={safeMarkdownUrl} components={documentMarkdownComponents}>{problemSections.examples}</ReactMarkdown>
      </div>
    </div>
  ) : null

  const constraintsPane = problemSections?.constraints ? (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px' }}>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 14.5, lineHeight: 1.72, color: 'var(--color-on-surface)' }}>
        <ReactMarkdown remarkPlugins={mdRemarkPlugins} rehypePlugins={mdRehypePlugins} skipHtml urlTransform={safeMarkdownUrl} components={documentMarkdownComponents}>{problemSections.constraints}</ReactMarkdown>
      </div>
    </div>
  ) : null

  // Notes: the coding flavor of the context-pack fields (Plan / Edge cases /
  // Complexity). Autosaved with the draft and sent to Hatch as working notes
  // on every chat turn. The first edit advances the advisory path to Plan.
  const notesPane = (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <HatchImage size={22} state="listening" />
        <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 12, lineHeight: 1.45, color: 'var(--color-on-surface-variant)' }}>
          Hatch reads these notes with your code, so hints and reviews land on your actual plan.
        </p>
      </div>
      {contextPack.map((field, fieldIdx) => (
        <div key={field.id}>
          <label
            htmlFor={`coding-note-${field.id}`}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-label)', fontSize: 11, fontWeight: 800, color: 'var(--color-on-surface-variant)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 2 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>{field.icon}</span>
            {field.label}
          </label>
          {field.helper && (
            <p style={{ margin: '0 0 5px', fontFamily: 'var(--font-label)', fontSize: 10.5, lineHeight: 1.4, color: 'var(--color-on-surface-variant)' }}>
              {field.helper}
            </p>
          )}
          <textarea
            id={`coding-note-${field.id}`}
            value={field.value}
            onChange={(event) => {
              const text = event.target.value
              setContextPack((prev) => prev.map((f, i) => (i === fieldIdx ? { ...f, value: text } : f)))
              advanceStep('plan')
            }}
            placeholder={field.placeholder}
            rows={field.id === 'plan' ? 4 : 3}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              resize: 'vertical',
              minHeight: field.id === 'plan' ? 92 : 72,
              borderRadius: 12,
              border: '1px solid var(--color-outline-variant)',
              background: 'var(--color-card-bright)',
              color: 'var(--color-on-surface)',
              padding: '9px 10px',
              fontFamily: 'var(--font-body)',
              fontSize: 12.5,
              lineHeight: 1.45,
              outline: 'none',
            }}
            data-testid={`coding-note-${field.id}`}
          />
        </div>
      ))}
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
      onApproachChange={(id) => { setActiveApproachId(id); setActiveSolutionStep(null) }}
      onSteppedStepChange={setActiveSolutionStep}
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
        {submissionsError ?? 'No submissions yet.'}
      </p>
      {submissionsError && <button type="button" onClick={() => void loadSubmissionHistory()} className="min-h-11 rounded-lg border border-hairline px-4 text-sm font-bold">Try again</button>}
    </div>
  ) : (
    <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {sessionHistory.map((record, idx) => {
        const gs = gradeStyle(record.gradeLabel)
        const isSelected = selectedHistoryIdx === idx
        // One-line takeaway so a row says more than a score: Hatch's signal on
        // the weakest step when we have it, otherwise just name that step.
        const weakestStep = record.stepResults.length > 0
          ? [...record.stepResults].sort((a, b) => a.score - b.score)[0]
          : null
        const takeaway = weakestStep?.hatchSignal
          ?? (weakestStep ? `Focus next: ${weakestStep.step.charAt(0).toUpperCase()}${weakestStep.step.slice(1)}` : null)
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
              {/* Show the reward only when XP was actually granted. A re-attempt
                  earns 0 (XP is once per problem), so a "+0 XP" chip there would
                  read as unrewarding rather than informative. */}
              {record.xpAwarded > 0 && (
                <span style={{ fontFamily: 'var(--font-label)', fontSize: 11, color: 'var(--color-primary)', fontWeight: 700 }}>
                  +{record.xpAwarded} XP
                </span>
              )}
            </div>
            {takeaway && (
              <div style={{
                fontFamily: 'var(--font-body)', fontSize: 12, lineHeight: 1.45,
                color: 'var(--color-on-surface-variant)', marginTop: 6,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {takeaway}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--color-on-surface-variant)' }}>
                {record.completedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span style={{ fontFamily: 'var(--font-label)', fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                View feedback
                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>chevron_right</span>
              </span>
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
      background: 'var(--color-card-bright)',
      borderRight: '1px solid var(--color-hairline)',
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
          border: '1px solid var(--color-hairline)',
          background: 'var(--color-page-field)',
          color: 'var(--color-ink-secondary)',
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
    <section
      className="rounded-xl border border-hairline"
      style={{
        width: `${leftWidth}%`,
        minWidth: leftPaneMinWidth,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-card-bright)',
        overflow: 'hidden',
        minHeight: 0,
      }}>
      {<nav className="workspace-reference-nav" aria-label="Challenge reference">{(isCodingChallenge ? [...codingPrimaryTabs, ...codingMoreTabs] : tabs).map(tab => <button key={tab} type="button" aria-pressed={leftTab === tab} onClick={() => setLeftTab(tab)}>{tab === 'Description' ? 'The brief' : tab}{tab === 'Discussions' && discussionsLoaded && workspaceTabBadge(discussions.length, leftTab === tab)}{tab === 'Submissions' && submissionBadgeCount > 0 && workspaceTabBadge(submissionBadgeCount, leftTab === tab)}</button>)}</nav>}
      {leftTab === 'Description' && descriptionPane}
      {leftTab === 'Examples' && examplesPane}
      {leftTab === 'Constraints' && constraintsPane}
      {leftTab === 'Notes' && notesPane}
      {leftTab === 'Discussions' && discussionsPane}
      {leftTab === 'Submissions' && submissionsPane}
      {leftTab === 'Solutions' && solutionsPane}
    </section>
  )

  function workspaceTabBadge(count: number, active: boolean) {
    return (
      <span style={{
        minWidth: 18,
        height: 18,
        padding: '0 5px',
        borderRadius: 99,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 10.5,
        fontWeight: 800,
        lineHeight: 1,
        background: active ? 'var(--color-forest-800)' : 'var(--color-page-field)',
        color: active ? '#ffffff' : 'var(--color-ink-secondary)',
      }}>
        {count}
      </span>
    )
  }

  // Coding Run/Submit cluster — lives in the workspace bar (LeetCode-style),
  // one slim chrome band instead of a separate 40px toolbar row.
  const codingActions = isCodingChallenge ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
      {currentLanguage === 'sql' && codeRunner.status === 'hydrating' && (
        <span className="text-xs text-ink-secondary font-label flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
          Setting up database…
        </span>
      )}
      {currentLanguage === 'sql' && codeRunner.sqlError && (
        <span className="text-xs text-error font-label">DB error: {codeRunner.sqlError}</span>
      )}
      {attemptId && (
        <AppTooltip
          label={codingSaveState === 'saving' ? 'Saving your draft…' : codingSavedAt ? 'Draft auto-saved. Safe to leave anytime.' : 'Autosave is on. Safe to leave anytime.'}
          side="bottom"
        >
          <span
            data-testid="autosave-indicator"
            className="inline-flex h-6 w-6 items-center justify-center text-ink-muted"
            aria-label="Autosave status"
          >
            {codingSaveState === 'saving' ? (
              <span className="material-symbols-outlined animate-spin text-[15px]">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-[15px]">cloud_done</span>
            )}
          </span>
        </AppTooltip>
      )}
      <button
        onClick={handleCodingRun}
        disabled={codeRunner.status === 'running' || codeRunner.status === 'hydrating' || isSubmittingCoding}
        className={WORKSPACE_BTN_TONAL}
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
            <kbd className="hidden min-[1280px]:inline text-[11px] font-semibold px-1.5 py-0.5 rounded border border-hairline bg-page-field text-ink-muted">⌘'</kbd>
          </>
        )}
      </button>
      {codingParts.length > 0 ? (
        activePartId && codingParts.find(p => p.id === activePartId)?.response_type === 'coding_subtask' ? (
          <button
            onClick={handleSubmitPart}
            disabled={codeRunner.status === 'running' || codeRunner.status === 'hydrating' || isSubmittingCoding}
            className={WORKSPACE_BTN_PRIMARY}
            data-testid="submit-part-button"
          >
            {isSubmittingCoding ? (
              <>
                <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
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
        <button
          onClick={handleCodingSubmit}
          disabled={codeRunner.status === 'running' || codeRunner.status === 'hydrating' || isSubmittingCoding}
          className={WORKSPACE_BTN_PRIMARY}
          data-testid="submit-button"
        >
          {isSubmittingCoding ? (
            <>
              <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
              Submitting…
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[14px]">upload</span>
              Submit
              <kbd className="hidden min-[1280px]:inline text-[11px] font-semibold px-1.5 py-0.5 rounded border border-white/30 bg-transparent text-white/70">⌘⏎</kbd>
            </>
          )}
        </button>
      )}
    </div>
  ) : null

  // Read-only results/history keep navigation without controls for an absent editor.
  const topChrome = <header className="workspace-focus-header"><button type="button" onClick={props.onExit ?? (() => window.history.back())} aria-label="Back to practice">← Practice</button><h1>{challengeTitle}</h1></header>

  // Round-4 FLOW method strip: full-width card under the top bar holding the
  // Frame / List / Optimize / Win stepper (previews/round4/flow-workspace.html
  // .stepper-card). Desktop FLOW MCQ challenges only; canvas/coding keep their
  // own chrome and mobile keeps the scrollable stepper bar.
  const flowStepperStrip = !isInterviewChallenge ? (
    <div style={{ flexShrink: 0, padding: '10px 16px 2px', background: 'var(--color-page-field)' }}>
      <div style={{ background: 'var(--color-card-bright)', border: '1px solid var(--color-hairline)', borderRadius: 16, padding: '12px 20px' }}>
        <div className="font-label" style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-ink-secondary)', marginBottom: 8 }}>
          FLOW Method
        </div>
        <FlowStepper
          currentStep={currentStep}
          completedSteps={completedSteps}
          /* Commit-forward: completed steps are locked. Retake the challenge to redo a step. */
          onStepClick={undefined}
          questionIdx={questionIdx}
          questionCount={activeStepData?.questions.length}
        />
      </div>
    </div>
  ) : null

  // The main answer area stays focused; Hatch remains available through the
  // floating coach and the contextual nudge below the answer.

  // Shared bottom footer - spans full width so the borderTop is continuous
  const bottomFooter = currentQuestion ? (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      borderTop: '1px solid var(--color-hairline)',
      background: 'var(--color-card-bright)',
      flexShrink: 0,
    }}>
      {/* Left side: like/bookmark/share + online count */}
      <div style={{
        width: leftCollapsed ? 32 : `${leftWidth}%`,
        minWidth: leftPaneMinWidth,
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
                aria-label={liked ? 'Remove like' : 'Like challenge'}
                title={liked ? 'Remove like' : 'Like challenge'}
                style={{ padding: '4px 10px', fontSize: 12, gap: 4, color: liked ? 'var(--color-primary)' : undefined }}
                onClick={() => setLiked(v => !v)}
              >
                <span
                  className="material-symbols-outlined msi-sm"
                  style={{ fontVariationSettings: liked ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" : undefined }}
                >thumb_up</span>
              </button>
              <button
                className="btn btn--ghost"
                aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark challenge'}
                title={bookmarked ? 'Remove bookmark' : 'Bookmark challenge'}
                style={{ padding: '4px 10px', fontSize: 12, gap: 4, color: bookmarked ? 'var(--color-primary)' : undefined }}
                onClick={() => setBookmarked(v => !v)}
              >
                <span
                  className="material-symbols-outlined msi-sm"
                  style={{ fontVariationSettings: bookmarked ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" : undefined }}
                >{bookmarked ? 'bookmark' : 'bookmark_border'}</span>
              </button>
              <button
                className="btn btn--ghost"
                aria-label="Share challenge"
                title="Share challenge"
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
          style={{ fontSize: 13, padding: '10px 22px', display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--color-forest-950)', color: '#fff', borderRadius: 10, fontWeight: 700, border: 'none', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)' }}
          disabled={!currentQuestionAnswered || activeSubmitting || ackVisible}
          onClick={isLastQuestionInStep ? handleStepSubmit : handleNextQuestion}
        >
          {activeSubmitting ? 'Grading…' : primaryButtonLabel}
          {!activeSubmitting && <span className="material-symbols-outlined msi-sm">arrow_forward</span>}
          {activeSubmitting && <HatchImage size={18} state="reviewing" />}
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
    workspaceTabBadge(count, active)
  )

  const compactWorkspaceHeader = <header className="workspace-focus-header"><button type="button" onClick={props.onExit ?? (() => window.history.back())} aria-label="Back to practice">← Practice</button><h1>{challengeTitle}</h1></header>

  // Top bar: back button + horizontally scrollable tabs (no clipping).
  const mobileChrome = isMobile ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid var(--color-hairline)', background: 'var(--color-card-bright)', flexShrink: 0, padding: '6px 8px' }}>
      <button
        onClick={props.onExit ?? (() => window.history.back())}
        className="btn btn--ghost"
        title="Back to practice"
        style={{ padding: '6px 8px', display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}
        aria-label="Back to practice"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
        <span className="hidden min-[640px]:inline font-label" style={{ fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap' }}>Back to Practice</span>
      </button>
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', overflowY: 'hidden', flexWrap: 'nowrap', WebkitOverflowScrolling: 'touch', flex: 1, scrollbarWidth: 'none' }}>
        {(isCodingChallenge ? [...codingPrimaryTabs, ...codingMoreTabs] : tabs).map(t => {
          const active = leftTab === t
          return (
            <button
              key={t}
              onClick={() => { setLeftTab(t); setMobileDescOpen(true) }}
              style={{
                flexShrink: 0, whiteSpace: 'nowrap', padding: '6.5px 11px', fontSize: 12.5,
                fontWeight: active ? 800 : 650,
                color: active ? 'var(--color-forest-800)' : 'var(--color-ink-secondary)',
                background: 'transparent',
                border: 'none',
                boxShadow: active ? 'inset 0 -2px 0 var(--color-forest-600)' : 'none',
                borderRadius: 0, cursor: 'pointer', fontFamily: 'inherit',
                display: 'inline-flex', alignItems: 'center', gap: 6,
                minHeight: 44,
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

  // On phones the brief is a full-height reading surface, not a drawer above
  // the answer. The answer remains mounted below (hidden while reading).
  const mobileDrawer = isMobile ? (
    <>
      <div className="learning-workspace-mobile-tabs" role="group" aria-label="Workspace view">
        <button type="button" aria-pressed={mobileDescOpen && leftTab === 'Description'} onClick={() => { setLeftTab('Description'); setMobileDescOpen(true) }}>The brief</button>
        <button type="button" aria-pressed={!mobileDescOpen} onClick={() => setMobileDescOpen(false)}>Your work</button>
      </div>
      {mobileDescOpen && (
        <div className="flex-1 min-h-0 overflow-y-auto" aria-label={leftTab === 'Description' ? 'The brief' : leftTab}>
          {leftTab === 'Description' && descriptionPane}
          {leftTab === 'Solutions' && solutionsPane}
          {leftTab === 'Notes' && notesPane}
          {leftTab === 'Examples' && examplesPane}
          {leftTab === 'Constraints' && constraintsPane}
          {leftTab === 'Discussions' && discussionsPane}
          {leftTab === 'Submissions' && submissionsPane}
        </div>
      )}
    </>
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
        style={{ fontSize: 13, padding: '10px 22px', display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--color-forest-950)', color: '#fff', borderRadius: 10, fontWeight: 700, border: 'none', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)' }}
        disabled={!currentQuestionAnswered || activeSubmitting || ackVisible}
        onClick={isLastQuestionInStep ? handleStepSubmit : handleNextQuestion}
      >
        {activeSubmitting ? 'Grading…' : primaryButtonLabel}
        {!activeSubmitting && <span className="material-symbols-outlined msi-sm">arrow_forward</span>}
        {activeSubmitting && <HatchImage size={18} state="reviewing" />}
      </button>
    </div>
  ) : null

  // A historical deep link is a read-only visit, including failed/missing rows.
  // Do not mount coding/analytics practice surfaces until the user asks to start.
  if (!canStartWorkspaceAttempt(initialAttemptId, historyPracticeRequested) && selectedHistoryIdx === null) {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden pb-[calc(56px+env(safe-area-inset-bottom))] md:pb-0">
        {isMobile ? compactWorkspaceHeader : topChrome}
        <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col p-4 sm:p-6">
          <h1 className="font-headline text-2xl font-semibold text-ink-strong">Your submissions</h1>
          <p className="mt-2 text-base text-ink-secondary">Review your previous work or start a new attempt when you are ready.</p>
          {submissionsError && <p role="alert" className="mt-4 text-sm text-error">{submissionsError}</p>}
          <div className="my-4 flex flex-wrap gap-3">
            <button type="button" disabled={submissionsLoading} onClick={() => void loadSubmissionHistory()} className="min-h-11 rounded-lg border border-hairline px-4 text-sm font-bold disabled:opacity-50">{submissionsLoading ? 'Loading…' : 'Refresh submissions'}</button>
            <button type="button" onClick={handleRunAnother} className="min-h-11 rounded-lg bg-forest-950 px-4 text-sm font-bold text-white">{detail?.current_attempt?.status === 'in_progress' ? 'Continue your attempt' : 'Start a new attempt'}</button>
          </div>
          {submissionsPane}
        </div>
      </div>
    )
  }

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
        {isMobile ? compactWorkspaceHeader : topChrome}
        {!isMobile && flowStepperStrip}

        {/* Middle: resizable two-pane content on desktop, single column on mobile */}
        <div ref={containerRef} className={isMobile ? 'flex flex-col flex-1 min-h-0 overflow-hidden' : 'flex flex-1 min-h-0 overflow-hidden'}>
          {!isMobile && leftDescriptionPanel}
          {!isMobile && dragHandle}

          {/* Right panel */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0" style={{ background: 'var(--color-page-field)' }}>
            {/* History back-nav banner */}
            {historyRecord && (
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderBottom: '1px solid var(--color-hairline)', background: 'var(--color-card-bright)' }}>
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

            {/* No status banner here: the feedback surfaces (CodingFeedback /
                InterviewFeedback / PostSessionMirror) carry their own state.
                A banner on top duplicated them (Verdict → Coach → Evidence
                redesign, 2026-07). */}

            {/* Interview feedback for canvas challenge types - fills the right panel
                in place of the canvas, matching product sense PostSessionMirror UX.
                Renders for both fresh submissions (interviewGrade) and history view
                (historyInterviewGrade fetched by attempt id). */}
            {isCanvasChallenge && phase === 'complete' && interviewGrade && !historyRecord && (
              <div className="flex-1 min-h-0 overflow-y-auto animate-step-enter">
                <InterviewFeedback
                  grade={interviewGrade}
                  challengeType={apiChallengeType ?? 'system_design'}
                  canvasPngUrl={submittedCanvasPngUrl}
                  canvasElements={submittedCanvasScene?.attemptId === attemptId ? submittedCanvasScene.elements : canvasScene?.elements ?? null}
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
                  <HatchImage size={40} state="reviewing" />
                  <p className="font-body text-sm text-on-surface-variant">Loading your feedback…</p>
                </div>
              ) : historyInterviewGrade ? (
                <div className="flex-1 min-h-0 overflow-y-auto animate-step-enter">
                  <InterviewFeedback
                    grade={historyInterviewGrade}
                    challengeType={apiChallengeType ?? 'system_design'}
                    canvasPngUrl={historyRecord.canvasPngUrl}
                    canvasElements={historyCanvasElements}
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

            {/* Coding challenge feedback — single-column verdict flow with the
                Hatch chat docked as a SIBLING panel (never inline in the scroll
                column, where it would render as a stray block at the bottom). */}
            {isCodingChallenge && (phase === 'complete' || historyRecord) && (
              <div className="flex flex-1 min-h-0 animate-step-enter">
                <div className="flex-1 min-h-0 overflow-y-auto p-4">
                {historyRecord && historyGradeLoading ? (
                  <div className="flex h-full flex-col items-center justify-center gap-4">
                    <HatchImage size={80} state="reviewing" />
                    <p className="font-body text-sm text-ink-secondary">Loading your SQL/code results…</p>
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
                    onRequestGrading={codingControlsLive ? retryCodingGrading : undefined}
                    onAskHatch={codingControlsLive ? () => queueHatchPrompt('My tests are failing. Can you help me figure out why?', false) : undefined}
                    onNextChallenge={nextChallengeHref && codingControlsLive
                      ? () => { window.location.href = nextChallengeHref }
                      : undefined
                    }
                  />
                )}
                </div>
                {/* Hatch coach on the coding complete screen — the question-phase
                    CanvasChatPanel is unmounted here, so mount a dedicated instance
                    so "Ask Hatch" has a panel to open. Sibling of the scroll
                    column so it docks to the right edge like the question phase. */}
                {codingControlsLive && (() => {
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
                      problemStatement={problemStatementForHatch}
                      sqlSchemaSummary={sqlSchemaSummary}
                      activePartId={activePart?.id}
                      activePartSequence={activePart?.sequence}
                      activePartTitle={activePart?.title}
                      activePartPrompt={activePart?.coding_subtask_prompt ?? null}
                      activePartResponseType={activePart?.response_type}
                      activePartWeightPct={activePart ? Math.round(activePart.grading_weight_within_step * 100) : undefined}
                      solutionsOpen={solutionsOpen}
                      activeSolutionApproach={activeSolutionApproach}
                      guidanceLevel={coachRegister}
                      dockSurface="coding"
                    />
                  )
                })()}
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
                  onVoiceStep={!historyRecord
                    ? () => { window.location.href = '/live-interviews' }
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
                  maxScore={FLOW_MAX_SCORE}
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
  // All challenge types use the same brief/work switching on compact screens.

  return (
    <div className="flex flex-col overflow-hidden h-full pb-[calc(56px+env(safe-area-inset-bottom))] md:pb-0">
      {/* Desktop: full-width chrome (tabs + stepper). Mobile: stacked chrome -
          scrollable tabs, collapsible description drawer, scrollable step bar. */}
      {mobileStacked ? (
        <>
          {mobileChrome}
          {mobileDrawer}
          {!mobileDescOpen && !isInterviewChallenge && mobileStepperBar}
        </>
      ) : (
        <>
          {<header className="workspace-focus-header">
            <button type="button" onClick={props.onExit ?? (() => window.history.back())} aria-label="Back to practice">← <span>Practice</span></button>
            <h1>{challengeTitle}</h1>
            {!isInterviewChallenge && <button type="button" aria-pressed={hintOpen} onClick={() => setHintOpen(v => !v)}>Need a hint?</button>}
          </header>}
        </>
      )}

      {/* Middle: resizable two-pane on desktop, single column on mobile */}
      <div ref={containerRef} style={mobileStacked && mobileDescOpen ? { display: 'none' } : undefined} className={mobileStacked ? 'flex flex-col flex-1 min-h-0 overflow-hidden' : 'workspace-focus-columns flex flex-1 min-h-0 overflow-hidden bg-page-field'}>
        {!mobileStacked && leftDescriptionPanel}
        {!mobileStacked && dragHandle}

        {/* Right pane: scrollable workspace content only */}
        <section
          className={!isCanvasChallenge && !isCodingChallenge ? 'rounded-xl border border-hairline' : undefined}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            background: !isCanvasChallenge && !isCodingChallenge ? 'var(--color-card-bright)' : 'transparent',
            overflow: 'hidden', minHeight: 0,
          }}>
          {!mobileStacked && !isInterviewChallenge && <div className="workspace-work-header"><h2>Your work</h2>{flowStepperStrip}</div>}
          {isInterviewChallenge && !codingMaximised && <div className="workspace-specialist-toolbar">
            {isCodingChallenge ? <>
              <CodingStepper compact activeStep={codingStep} onSelectStep={id => {
                setCodingStep(id)
                if (id === 'understand' || id === 'plan') {
                  setLeftTab(id === 'plan' ? 'Notes' : 'Description')
                  setMobileDescOpen(true)
                } else if (id === 'test') setConsoleCollapsed(false)
              }} />
              <div className="workspace-specialist-actions">{codingActions}<button type="button" onClick={() => setCodingMaximised(v => !v)} aria-label="Full screen workspace">⛶</button></div>
            </> : <>
              <CompactStepPips steps={designSteps.map(step => ({ id: step.id, label: step.label }))} activeId={activeDesignStep} doneIds={completedDesignSteps} onSelect={id => { if (isDesignStepId(id)) selectDesignStep(id) }} ariaLabel="Design sections" />
              <button type="button" onClick={() => openCanvasOverlay()}>Open canvas</button>
            </>}
          </div>}

          {/* Grading interstitial - fills the right panel while the model grades. */}
          {isCanvasChallenge && isSubmittingInterview && (
            <div className="flex-1 min-h-0 flex flex-col animate-step-enter">
              <HatchReviewCard
                size="large"
                phases={apiChallengeType === 'data_modeling' ? DATA_MODEL_REVIEW_PHASES : CANVAS_REVIEW_PHASES}
              />
            </div>
          )}

          {/* Structured canvas workspace for interview challenge types (refs/14
              anatomy + the approved round4 canvas-workspace overlay). Inline:
              FLOW stepper (above) + Problem Brief (left panel) + DesignStepForm
              (center) + DesignRail (right) + docked Hatch chat. The Excalidraw
              canvas lives in a full-screen overlay that stays MOUNTED when
              closed (display:none) so scene, undo history, and the chat thread
              survive every round trip between drawing and writing. */}
          {isCanvasChallenge && (
            <div
              className={canvasMaximised ? 'canvas-overlay-scrim' : undefined}
              style={isSubmittingInterview ? { display: 'none' } : canvasMaximised
              ? { position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2vh 2vw', background: 'rgba(5, 35, 22, 0.35)' }
              : { flex: '1 1 auto', display: 'flex', minHeight: 0, minWidth: 0, position: 'relative' }
              }>
              {/* Overlay panel: in full screen everything floats on a rounded
                  surface above a forest scrim with its own top bar. Inline, this
                  wrapper is a flex passthrough — the same children switch
                  columns via display so nothing remounts across the toggle.
                  Entry scales from the DiagramSlot's viewport position
                  (canvasOverlayOrigin); exit is instant, the snapshot settling
                  into the slot carries the return. */}
              <div
                className={canvasMaximised ? 'canvas-overlay-panel workspace-canvas-overlay' : 'workspace-design-surface'}
                style={canvasMaximised
                ? { width: '100%', height: '100%', maxWidth: 1440, display: 'flex', flexDirection: 'column', minHeight: 0, background: 'var(--color-card-bright)', border: '1px solid var(--color-hairline)', borderRadius: 16, boxShadow: '0 32px 80px -24px rgba(5,35,22,0.45), 0 8px 24px -8px rgba(5,35,22,0.25)', overflow: 'hidden', transformOrigin: canvasOverlayOrigin }
                : { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }
                }>
                {canvasMaximised && (
                  <div className="flex items-center justify-between gap-4 px-5 py-3 border-b border-hairline shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                      {challengeTitle && (
                        <span className="font-label text-[15px] font-bold text-ink-strong truncate max-w-[420px]" title={challengeTitle}>
                          {challengeTitle}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-note-mint px-2.5 py-1 font-label text-xs font-bold text-forest-800 shrink-0">
                        <span className="h-1.5 w-1.5 rounded-full bg-forest-600" />
                        {activeDesignStepDef?.label ?? 'Optimize'} · {apiChallengeType === 'data_modeling' ? 'Data modeling' : 'System design'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <button
                        onClick={() => window.dispatchEvent(new Event('start-canvas-tour'))}
                        className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-card-bright border border-hairline text-ink-secondary hover:text-ink-strong text-xs font-semibold"
                        title="How this canvas works"
                        aria-label="How this canvas works"
                      >?</button>
                      {attemptId && (
                        <span className="flex items-center gap-1.5 font-label text-xs font-semibold text-ink-muted" data-testid="canvas-autosave-state">
                          {canvasSaveState === 'saving' ? (
                            <span className="material-symbols-outlined animate-spin text-forest-600" style={{ fontSize: 13 }}>progress_activity</span>
                          ) : (
                            <span className="flex h-[15px] w-[15px] items-center justify-center rounded-full bg-note-mint text-forest-600">
                              <span className="material-symbols-outlined" style={{ fontSize: 11 }}>check</span>
                            </span>
                          )}
                          {canvasSaveState === 'saving' ? 'Saving…' : canvasSaveState === 'saved' ? 'Saved' : 'Autosave on'}
                        </span>
                      )}
                      <button
                        onClick={closeCanvasOverlay}
                        className="inline-flex items-center gap-2 rounded-lg bg-forest-950 px-4 py-2 font-label text-[13px] font-bold text-white hover:bg-forest-800 transition-colors"
                        title="Done, back to write-up"
                        aria-label="Done, back to write-up"
                      >
                        <span className="material-symbols-outlined text-[15px]">arrow_back</span>
                        Done, back to write-up
                      </button>
                    </div>
                  </div>
                )}
                <div style={{ flex: 1, display: 'flex', minWidth: 0, minHeight: 0 }}>
                  {/* Write-up column (inline only, kept mounted so scroll and
                      focus state survive the overlay round trip) */}
                  <div style={{ flex: 1, minWidth: 0, minHeight: 0, overflowY: 'auto', scrollPaddingBottom: 96, display: canvasMaximised ? 'none' : 'flex', flexDirection: 'column', padding: '2px 8px 96px' }}>
                    {/* Full-width card: with the old 300px rail folded into the
                        Hatch dock this column owns the center, so the write-up
                        stretches instead of floating at 780px in empty space. */}
                    <div className="workspace-design-writeup rounded-2xl border border-hairline bg-card-bright" style={{ width: '100%', minHeight: 'calc(100% - 2px)', padding: '20px 28px' }}>
                      {activeDesignStepDef && (
                        <DesignStepForm
                          step={activeDesignStepDef}
                          values={stepAnswers[activeDesignStep] ?? {}}
                          onChange={handleDesignAnswerChange}
                          onSectionFocus={setActiveDesignSection}
                          diagramThumbUrl={diagramThumbUrl}
                          diagramEntityCount={scene.entities.length}
                          diagramConnectionCount={scene.connections.length}
                          diagramLabels={guidance.labels}
                          onOpenCanvas={openCanvasOverlay}
                        />
                      )}
                      {/* Free step navigation footer (design steps are not
                          commit-forward like MCQ FLOW) */}
                      {designSteps.length > 0 && (() => {
                        const idx = designSteps.findIndex((s) => s.id === activeDesignStep)
                        const prev = idx > 0 ? designSteps[idx - 1] : null
                        const next = idx >= 0 && idx < designSteps.length - 1 ? designSteps[idx + 1] : null
                        return (
                          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-hairline pt-4">
                            {prev ? (
                              <button
                                type="button"
                                onClick={() => selectDesignStep(prev.id)}
                                className={WORKSPACE_BTN_TONAL}
                              >
                                <span className="material-symbols-outlined text-[15px]">arrow_back</span>
                                {prev.label}
                              </button>
                            ) : null}
                            {next && (
                              <button
                                type="button"
                                onClick={() => selectDesignStep(next.id)}
                                className={WORKSPACE_BTN_PRIMARY}
                              >
                                Next: {next.label}
                                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                              </button>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                  {/* Canvas column — mounted always so Excalidraw keeps its scene
                      and undo stack; visible only while the overlay is up. */}
                  <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: canvasMaximised ? 'flex' : 'none', flexDirection: 'column' }}>
                    <div
                      data-tour-target="canvas-surface"
                      style={{ flex: 1, minWidth: 0, minHeight: 0, position: 'relative', background: 'var(--color-card-bright)' }}
                    >
                      <ExcalidrawCanvas
                        sessionId={attemptId ?? 'draft'}
                        onSnapshot={setCanvasScene}
                        onElementsAdded={(count) => requestNudge(count)}
                        initialData={canvasInitialData}
                        apiRef={excalidrawApiRef}
                        exportRef={canvasExportRef}
                      />
                      <CanvasTourMount active={isCanvasChallenge && !isSubmittingInterview && canvasMaximised} />
                      {/* Branded empty-state: replaces the blank-Excalidraw paralysis
                          with a centered Hatch + three first moves. Shown only while
                          the canvas has no entity; un-mounts the moment one lands. */}
                      {!emptyStateDismissed && scene.entities.length === 0 && (
                        <CanvasEmptyState
                          challengeType={apiChallengeType as CanvasChallengeType}
                          guidance={guidance}
                          onUseTemplate={handleUseTemplate}
                          onAskHatch={(text, autoSend) => {
                            setEmptyStateDismissed(true)
                            queueHatchPrompt(text, autoSend)
                          }}
                          onOpenNotes={closeCanvasOverlay}
                        />
                      )}
                      {/* Template chips (approved overlay preview): one tap drops a
                          starting shape through the same executeActions path Hatch
                          uses. Blank templates are filtered — nothing to draw. */}
                      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 max-[1023px]:bottom-[calc(76px+env(safe-area-inset-bottom))] max-[1023px]:left-3 max-[1023px]:right-3 max-[1023px]:overflow-x-auto max-[1023px]:pb-1">
                        {canvasTemplatesFor(canvasType)
                          .filter((t) => t.actions.length > 0)
                          .map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => applyCanvasTemplate(t)}
                              className="shrink-0 whitespace-nowrap rounded-full border border-hairline bg-card-bright px-3 py-1.5 font-label text-[11.5px] font-bold text-ink-secondary shadow-sm hover:text-ink-strong transition-colors"
                            >
                              {t.label}
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>
                  {/* Hatch chat — stable tree position so the thread survives the
                      overlay toggle. Docked, it is the rail's chat slot inline and
                      the right column of the overlay when the canvas is up. The
                      old 300px DesignRail folded into it as the Guidance tab. */}
                  <CanvasChatPanel
                    attemptId={attemptId ?? ''}
                    challengeId={isApiMode ? (props as Extract<FlowWorkspaceProps, { mode: 'api' }>).challengeId : ''}
                    challengeType={apiChallengeType as 'system_design' | 'data_modeling'}
                    scene={scene}
                    contextPack={contextPackText || undefined}
                    queuedPrompt={queuedHatchPrompt}
                    isOpen={chatPanelOpen}
                    onToggle={() => setChatPanelOpen((v) => !v)}
                    autoOpenKey={undefined}
                    onCanvasActions={handleCanvasActions}
                    proactiveNudge={proactiveNudge}
                    guidanceLevel={coachRegister}
                    onDismissNudge={() => setProactiveNudge(null)}
                    canvasDrawFailure={canvasDrawFailure}
                    guidancePhase={guidance.phase}
                    guidanceLabels={guidance.labels}
                    stepAnswers={stepAnswers}
                    activeStep={activeDesignStep}
                    activeSection={effectiveActiveSectionId}
                    solutionsOpen={solutionsOpen}
                    activeSolutionApproach={activeSolutionApproach}
                    sideTabs={[
                      {
                        id: 'guidance',
                        label: 'Guidance',
                        icon: ListChecks,
                        content: (
                          <div className="flex flex-col gap-3 overflow-y-auto p-3" data-testid="design-guidance-tab">
                            <DesignRail
                              steps={designSteps}
                              activeStepId={activeDesignStep}
                              onSelectStep={selectDesignStep}
                              isSectionDone={isDesignSectionDone}
                              guidance={guidance}
                              nudge={proactiveNudge ? { text: proactiveNudge.text, onDismiss: () => setProactiveNudge(null) } : null}
                            />
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => { void requestManualHint() }}
                                disabled={hintLoading || !attemptId}
                                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-hairline bg-card-bright px-3 py-2 font-label text-xs font-bold text-ink-strong hover:bg-page-field disabled:opacity-50 transition-colors"
                              >
                                <Lightbulb size={14} strokeWidth={1.8} />
                                {hintLoading ? 'Asking…' : 'Show me a hint'}
                              </button>
                              <button
                                type="button"
                                onClick={runSelfCheck}
                                disabled={!attemptId}
                                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-hairline bg-card-bright px-3 py-2 font-label text-xs font-bold text-ink-strong hover:bg-page-field disabled:opacity-50 transition-colors"
                              >
                                <ListChecks size={14} strokeWidth={1.8} />
                                Run self-check
                              </button>
                            </div>
                          </div>
                        ),
                      },
                    ]}
                    sideTabUnreadSignals={{ guidance: proactiveNudge?.id ?? '' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Coding workspace - Monaco editor + test-case console + Hatch rail/chat
              + status bar (round-4 rebuild). Column: workspace row on top, the
              status bar pinned underneath. */}
          {isCodingChallenge && phase === 'question' && (
            <div style={codingMaximised
              ? { position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', background: 'var(--color-background)' }
              : { flex: '1 1 auto', display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0 }
            }>
            {codingMaximised && <div className="workspace-specialist-toolbar"><CodingStepper compact activeStep={codingStep} onSelectStep={id => { setCodingStep(id); if (id === 'understand' || id === 'plan') { setCodingMaximised(false); setLeftTab(id === 'plan' ? 'Notes' : 'Description'); setMobileDescOpen(true) } else if (id === 'test') setConsoleCollapsed(false) }} /><div className="workspace-specialist-actions">{codingActions}<button type="button" onClick={() => setCodingMaximised(false)}>Exit full screen</button></div></div>}
            <div style={{ flex: 1, display: 'flex', minHeight: 0, minWidth: 0, position: 'relative' }}>
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
                    let chipBg = 'var(--color-card-bright)'
                    let chipColor = 'var(--color-ink-secondary)'
                    if (partSub?.submitted) { chipBg = 'var(--color-forest-600)'; chipColor = '#ffffff' }
                    else if (partRun) { chipBg = 'var(--color-note-mint)'; chipColor = 'var(--color-ink-strong)' }
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
              {/* Editor column: framed panels — editor card + grip gutter + console card
                  floating on the workspace canvas (visual-clarity inc. 4) */}
              <div
                ref={codingPaneRef}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0,
                  gap: 8, paddingLeft: 8,
                }}
              >
                <WorkspacePanel
                  icon="code"
                  title="Editor"
                  headerExtra={codingParts.length > 0 && activePartId ? (
                    <span style={{ fontFamily: 'var(--font-label)', fontSize: 11, fontWeight: 600, color: 'var(--color-ink-secondary)', padding: '2px 8px', borderRadius: 999, background: 'var(--color-page-field)', border: '1px solid var(--color-hairline)', whiteSpace: 'nowrap' }}>
                      {(() => { const cp = codingParts.find(x => x.id === activePartId); return cp ? `Part ${cp.sequence}` : '' })()}
                    </span>
                  ) : undefined}
                  actions={(() => {
                    const metadata = (isApiMode ? detail?.challenge?.metadata : null) as { supported_languages?: string[] } | null | undefined
                    const metaLangs = (metadata?.supported_languages ?? []) as SupportedLanguage[]
                    // Guard the option list by challenge type so the wrong language
                    // can't appear regardless of (often empty) metadata.
                    const NON_SQL_DEFAULTS: SupportedLanguage[] = ['python', 'javascript', 'java', 'cpp', 'go']
                    let supportedLangs: SupportedLanguage[]
                    if (apiChallengeType === 'sql') {
                      supportedLangs = ['sql']
                    } else if (apiChallengeType === 'algorithm') {
                      const fromMeta = metaLangs.filter(l => l !== 'sql')
                      supportedLangs = fromMeta.length > 0 ? fromMeta : NON_SQL_DEFAULTS
                    } else {
                      supportedLangs = metaLangs
                    }
                    return (
                      <LanguageSelector
                        value={currentLanguage}
                        onChange={handleLanguageChange}
                        options={supportedLangs.length > 0 ? supportedLangs : undefined}
                        disabled={isSubmittingCoding || codeRunner.status === 'running'}
                      />
                    )
                  })()}
                  style={{ flex: consoleCollapsed ? '1 1 0' : `${editorHeightPct} 1 0` }}
                >
                  <div style={{ flex: 1, minHeight: 0 }} data-testid="monaco-editor-container">
                    <MonacoCodeEditor
                      value={currentCode}
                      preferPlainEditor={isMobile}
                      onChange={handleEditorChange}
                      language={currentLanguage}
                      height="100%"
                      onPaste={handleCodePaste}
                      readOnly={isSubmittingCoding}
                    />
                  </div>
                </WorkspacePanel>
                {/* Grip gutter — resizes editor/console */}
                {!consoleCollapsed && (
                  <div
                    onMouseDown={handleCodingDividerMouseDown}
                    role="separator"
                    aria-orientation="horizontal"
                    aria-label="Resize editor and console"
                    style={{
                      height: 8, margin: '-8px 0', cursor: 'ns-resize', flexShrink: 0, zIndex: 5,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <div style={{ width: 36, height: 4, borderRadius: 999, background: 'var(--color-hairline)', transition: 'background 120ms' }} />
                  </div>
                )}
                {/* Console card — Test Cases / Run Results tabbed panel */}
                <div
                  className="rounded-xl border border-hairline overflow-hidden flex flex-col"
                  style={consoleCollapsed ? { flex: '0 0 auto' } : { flex: `${100 - editorHeightPct} 1 0`, minHeight: 0 }}
                >
                  <TestCasePanel
                    testCases={visibleTestCases}
                    results={lastRunResult}
                    status={outputPanelStatus}
                    isSqlMode={currentLanguage === 'sql'}
                    errorMessage={outputPanelError}
                    hiddenCount={hiddenTestCount}
                    collapsed={consoleCollapsed}
                    onToggleCollapse={() => setConsoleCollapsed(v => !v)}
                  />
                </div>
              </div>

              {/* Hatch chat panel - right side. The old 288px CodingRail folded
                  into it as Guidance/Hints tabs (opened from the top bar). */}
              {(() => {
                const activePart = codingParts.find(p => p.id === activePartId)
                return (
                  <CanvasChatPanel
                    attemptId={attemptId ?? ''}
                    challengeId={isApiMode ? (props as Extract<FlowWorkspaceProps, { mode: 'api' }>).challengeId : ''}
                    challengeType="coding"
                    scene={scene}
                    contextPack={contextPackText || undefined}
                    queuedPrompt={queuedHatchPrompt}
                    isOpen={chatPanelOpen}
                    onToggle={() => setChatPanelOpen((v) => !v)}
                    autoOpenKey={undefined}
                    proactiveNudge={proactiveNudge}
                    guidanceLevel={coachRegister}
                    onDismissNudge={() => setProactiveNudge(null)}
                    dockSurface="coding"
                    sideTabs={[
                      {
                        id: 'guidance',
                        label: 'Guidance',
                        icon: ListChecks,
                        content: (
                          <GuidanceTab
                            nudge={proactiveNudge ? { text: proactiveNudge.text, onDismiss: () => setProactiveNudge(null) } : null}
                            lastRun={lastRunResult ? { testsPassed: lastRunResult.testsPassed, testsTotal: lastRunResult.testsTotal } : null}
                            isRunning={outputPanelStatus === 'running'}
                            patterns={(detail?.challenge as { tags?: string[] } | null | undefined)?.tags?.filter(t => typeof t === 'string' && t.trim().length > 0)}
                            selfCheck={codingSelfCheck}
                            onRunSelfCheck={() => { void runCodingSelfCheck() }}
                            confidence={codingConfidence}
                            onConfidenceChange={setCodingConfidence}
                          />
                        ),
                      },
                      {
                        id: 'hints',
                        label: 'Hints',
                        icon: Lightbulb,
                        content: (
                          <HintsTab
                            hints={codingHints}
                            hintPending={codingHintPending}
                            onRequestHint={() => { void requestCodingHint() }}
                          />
                        ),
                      },
                    ]}
                    sideTabUnreadSignals={{ guidance: proactiveNudge?.id ?? '', hints: codingHints.length }}
                    onCanvasActions={() => { /* no-op: coding mode doesn't execute canvas actions */ }}
                    currentCode={currentCode}
                    currentLanguage={currentLanguage}
                    lastRunResult={lastRunResult}
                    codingStep={codingStep}
                    challengeTitle={challengeTitle ?? undefined}
                    problemStatement={problemStatementForHatch}
                      sqlSchemaSummary={sqlSchemaSummary}
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
                    background: 'var(--color-card-bright)',
                    border: '1px solid var(--color-hairline)',
                    borderRadius: 16,
                    padding: '16px 22px',
                    boxShadow: '0 4px 18px -8px rgba(30,27,20,0.25)',
                  }}
                >
                  <HatchImage size={40} state="listening" />
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-ink-strong)' }}>
                    Answer recorded, keep going.
                  </span>
                </div>
              </div>
            )}

            {/* Hint card */}
            {hintOpen && activeStepData?.nudge && (
              <div className="note-amber" style={{
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
                <HatchImage size={72} state="reviewing" />
              </div>
            ) : (isApiMode && stepError) ? (
              <p className="font-body text-error text-sm text-center">{stepError}</p>
            ) : currentQuestion ? (
              <div data-hatch-target="workspace-answer-area" style={{ background: 'var(--color-card-bright)', border: '1px solid var(--color-hairline)', borderRadius: 16, padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
                  <span className="font-label" style={{ background: 'var(--color-forest-800)', color: '#fff', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em', padding: '3px 10px', borderRadius: 999 }}>
                    Step {FLOW_STEPS.indexOf(currentStep) + 1} of {FLOW_STEPS.length} · {STEP_LABEL[currentStep]}
                  </span>
                  {stepQuestions.length > 1 && (
                    <span className="font-label" style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-ink-muted)', fontVariantNumeric: 'tabular-nums' }}>
                      Question {questionIdx + 1} of {stepQuestions.length}
                    </span>
                  )}
                </div>
                <StepQuestion
                  question={currentQuestion}
                  questionNumber={questionIdx + 1}
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
                background: 'var(--color-card-bright)',
                border: '1px solid var(--color-hairline)',
                borderRadius: 16,
                padding: '14px 16px',
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-ink-secondary)', marginBottom: 10, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
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
                          borderRadius: 8,
                          fontSize: 12.5,
                          fontWeight: 700,
                          background: active ? 'var(--color-forest-800)' : 'var(--color-card-bright)',
                          color: active ? '#ffffff' : 'var(--color-ink-secondary)',
                          border: '1px solid ' + (active ? 'transparent' : 'var(--color-hairline)'),
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
      {isCanvasChallenge && (!mobileStacked || !mobileDescOpen) && (
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
          {/* Readiness folded into the DesignRail's progress ring; the footer
              keeps a one-line summary so submit intent stays informed. */}
          <div>
            <span className="font-label text-xs font-semibold text-ink-secondary">
              {designSectionTotals.done} of {designSectionTotals.total} sections ready for feedback
            </span>
            {interviewSubmitError && <p role="alert" className="mt-1 font-body text-sm text-error">{interviewSubmitError}</p>}
          </div>
          <button
            onClick={handleInterviewSubmit}
            disabled={isSubmittingInterview}
            className="rounded-full bg-primary text-on-primary font-label font-semibold px-6 py-2 disabled:opacity-60 hover:opacity-90 transition-opacity shrink-0"
          >
            {isSubmittingInterview ? 'Submitting…' : interviewSubmitError ? 'Retry submission' : 'Submit'}
          </button>
        </div>
      )}

      {/* Full-width bottom footer: left actions + submit - only for MCQ FLOW challenges.
          Mobile uses a compact full-width footer (no left stats column). */}
      {!isInterviewChallenge && (!mobileStacked || !mobileDescOpen) && (mobileStacked ? mobileFooter : bottomFooter)}
    </div>
  )
}

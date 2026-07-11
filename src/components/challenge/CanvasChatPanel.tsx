'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { ReportButton } from '@/components/feedback/ReportButton'
import { Md } from '@/components/ui/Md'
import { HatchImage } from '@/components/redesign/HatchImage'
import { VoiceInputButton } from './VoiceInputButton'
import type { CanvasScene } from '@/lib/hatch/canvas-scene'
import type { GuidancePhase, GuidanceLabels } from '@/lib/hatch/canvasGuidance'
import type { CanvasInterpretResponse, InterviewGrade } from '@/lib/types'
import { useHatchDockState } from '@/hooks/useHatchDockState'
import { useHatchSonics } from '@/hooks/useHatchSonics'
import { PaywallModal } from '@/components/paywalls/PaywallModal'

interface ChatMessage {
  role: 'user' | 'hatch'
  content: string
  kind?: 'canvas_action' | 'chat' | 'nudge'
}

interface LimitErrorPayload {
  error?: string
  feature?: string
  used?: number
  limit?: number
  retryAfter?: number
}

interface CanvasChatPanelProps {
  attemptId: string
  challengeId: string
  challengeType: 'system_design' | 'data_modeling' | 'coding' | 'claude_code_analytics' | 'claude_code_debugging'
  scene: CanvasScene
  contextPack?: string
  queuedPrompt?: { id: string; text: string; autoSend?: boolean } | null
  isOpen: boolean
  onToggle: () => void
  /** When set, the dock auto-opens (docked) the FIRST time this key is seen,
   *  then never again. The panel owns its open state via useHatchDockState, so a
   *  parent `isOpen` cannot force it; this is the supported way to open it once.
   *  Used for first-session coaching on canvas and analytics. */
  autoOpenKey?: string
  onCanvasActions?: (response: { message: string; actions: unknown[] }) => void | Promise<void>
  feedbackMode?: boolean
  grade?: InterviewGrade | null
  proactiveNudge?: { id: string; text: string } | null
  onDismissNudge?: () => void
  // Set by the workspace when a canvas draw could not be fully applied, so
  // Hatch can offer a graceful retry instead of leaving the user confused.
  canvasDrawFailure?: { id: string; text: string } | null
  // Coding-mode context fields (only used when challengeType === 'coding')
  currentCode?: string
  currentLanguage?: string
  lastRunResult?: unknown
  timeElapsed?: number
  timeRemaining?: number
  challengeTitle?: string
  problemStatement?: string
  // Multi-part coding context (only when a part is active)
  activePartId?: string
  activePartSequence?: number
  activePartTitle?: string
  activePartPrompt?: string | null
  activePartResponseType?: string
  activePartWeightPct?: number
  // Analytics-mode context fields (only used when challengeType === 'claude_code_analytics')
  // Do NOT use currentCode for analytics — use these dedicated fields.
  terminalTail?: string | null
  /** Milestone-state summary of the analytics deliverable (artifact spine). */
  artifactState?: string | null
  mcpConnected?: boolean
  skillsWritten?: string[]
  activeSubProblemId?: string | null
  activeSubProblemSequence?: number
  activeSubProblemTitle?: string | null
  activeSubProblemObjective?: string | null
  activeSubProblemSuccessCriterion?: string | null
  markedFindings?: Array<{ id: string; text: string; verdict: 'pass' | 'partial' | 'retry' }>
  assertedFinding?: string | null
  /** Adaptive coaching register for this session (analytics only). */
  guidanceLevel?: 'scaffolded' | 'guided' | 'open'
  // Guidance phase (canvas types only) — keeps Hatch aware of where the user is
  // in the draw → notes → ask → submit loop, per CLAUDE.md Hatch-awareness.
  guidancePhase?: GuidancePhase
  guidanceLabels?: GuidanceLabels
  // Solutions tab awareness — set while the user has the official solution open,
  // so Hatch can coach relative to the approach they are reading.
  solutionsOpen?: boolean
  activeSolutionApproach?: { title: string; tagline: string; stepTitle?: string; stepDecision?: string } | null
}

// Defensive guard: a chat turn should be prose, but a malformed structured-output
// response could arrive wrapped in a ```json fence or as a bare { "message": "..." }
// object. Hatch must never show raw JSON to a user, so unwrap the common shapes
// before rendering. Anything we can't cleanly unwrap passes through unchanged.
function sanitizeHatchText(raw: string): string {
  let text = (raw ?? '').trim()
  if (!text) return text
  // Strip a leading/trailing markdown code fence (```json ... ``` or ``` ... ```).
  const fence = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  if (fence) text = fence[1].trim()
  // If what remains is a JSON object carrying a text field, surface that field.
  if (text.startsWith('{') && text.endsWith('}')) {
    try {
      const obj = JSON.parse(text) as Record<string, unknown>
      const field = obj.message ?? obj.nudge ?? obj.text ?? obj.reply ?? obj.content
      if (typeof field === 'string' && field.trim()) return field.trim()
    } catch {
      // not valid JSON - leave as-is rather than mangle real prose with braces
    }
  }
  return text
}

function getInitialMessage(
  challengeType: 'system_design' | 'data_modeling' | 'coding' | 'claude_code_analytics' | 'claude_code_debugging',
  phase?: GuidancePhase,
  labels?: GuidanceLabels,
): string {
  if (challengeType === 'coding') {
    return "I'm watching your code. Ask about your approach, edge cases, complexity, or why something isn't working."
  }

  // Phase-aware opener for canvas types. Falls back to the per-type default when
  // phase is not yet known at mount.
  if (phase && labels) {
    const entity = labels.entity
    switch (phase) {
      case 'empty':
        return `Let's design this. Draw a first ${entity} or tell me what to draw, then we make your case in notes and pressure-test it together.`
      case 'sketching':
        return `Good start. Add one more ${entity} and connect it, then I can tell you what is missing.`
      case 'has_canvas_no_notes':
        return 'The shape is there. Open notes and write your assumptions so I can judge the reasoning, not just the picture.'
      case 'notes_no_tradeoffs':
        return 'Solid. Tell me the tradeoff you are betting on and I will try to break it.'
      case 'ready':
        return 'This holds together. Ask me for a final gap check before you submit.'
    }
  }

  if (challengeType === 'data_modeling') {
    return "Let's model this data together. Draw your entities and relationships, or describe them and I'll add them to the canvas."
  }
  if (challengeType === 'claude_code_analytics') {
    return "I can see your session, the dataset connection, and the skills you have written. Ask me how to push the analysis further."
  }
  if (challengeType === 'claude_code_debugging') {
    return "I can see your session, the repository, and the failing tests. Ask me how to corner the root cause or prove your fix."
  }
  return "I'm here to help you design this system. You can draw by hand, type here, or speak - I'll help build and critique your diagram."
}

function getSuggestionPrompts(challengeType: 'system_design' | 'data_modeling' | 'coding' | 'claude_code_analytics' | 'claude_code_debugging', language?: string): string[] {
  if (challengeType === 'coding') {
    if (language === 'sql') {
      return [
        "What's the strongest query move I'm missing?",
        'Compare my SQL to a top response.',
        "What's the trade-off in this join or aggregation?",
      ]
    }
    return [
      "What's the strongest implementation move I'm missing?",
      'Compare my approach to a top response.',
      "What's the trade-off in this complexity choice?",
    ]
  }
  if (challengeType === 'data_modeling') {
    return [
      "What's the strongest schema move I'm missing?",
      'Compare my model to a top response.',
      "What's the trade-off in this relationship?",
    ]
  }
  if (challengeType === 'claude_code_analytics') {
    return [
      "Why is my query returning nothing?",
      'How do I segment this by device?',
      'Is this finding strong enough to mark the step?',
    ]
  }
  if (challengeType === 'claude_code_debugging') {
    return [
      'How do I reproduce this failure reliably?',
      'Is this the root cause or just a symptom?',
      'Does my fix hold against the full test suite?',
    ]
  }
  return [
    "What's the strongest system move I'm missing?",
    'Compare my design to a top response.',
    "What's the trade-off here?",
  ]
}

/** Two-line copy for the collapsed "Ask Hatch" pill, matched to what Hatch can
 *  actually see in each workspace context (round4 canvas-workspace preview). */
function getPillCopy(
  challengeType: 'system_design' | 'data_modeling' | 'coding' | 'claude_code_analytics' | 'claude_code_debugging',
): { title: string; sub: string } {
  if (challengeType === 'coding') return { title: 'Ask about your code', sub: 'Hatch can see your editor' }
  if (challengeType === 'claude_code_analytics' || challengeType === 'claude_code_debugging') {
    return { title: 'Ask about the session', sub: 'Hatch can see your terminal' }
  }
  if (challengeType === 'data_modeling') return { title: 'Ask about your model', sub: 'Hatch can see this diagram' }
  return { title: 'Ask about your design', sub: 'Hatch can see this diagram' }
}

export function CanvasChatPanel({
  attemptId,
  challengeId,
  challengeType,
  scene,
  contextPack,
  queuedPrompt,
  isOpen,
  onToggle,
  autoOpenKey,
  onCanvasActions,
  feedbackMode = false,
  grade = null,
  proactiveNudge = null,
  onDismissNudge,
  canvasDrawFailure = null,
  currentCode,
  currentLanguage,
  lastRunResult,
  timeElapsed,
  timeRemaining,
  challengeTitle,
  problemStatement,
  activePartId,
  activePartSequence,
  activePartTitle,
  activePartPrompt,
  activePartResponseType,
  activePartWeightPct,
  terminalTail,
  artifactState,
  mcpConnected,
  skillsWritten,
  guidanceLevel,
  activeSubProblemId,
  activeSubProblemSequence,
  activeSubProblemTitle,
  activeSubProblemObjective,
  activeSubProblemSuccessCriterion,
  markedFindings,
  assertedFinding,
  guidancePhase,
  guidanceLabels,
  solutionsOpen = false,
  activeSolutionApproach = null,
}: CanvasChatPanelProps) {
  const { mode, panelWidth, setMode, setPanelWidth, MIN_WIDTH, MAX_WIDTH } = useHatchDockState('canvas')
  const { muted, toggleMuted, play } = useHatchSonics()

  // One-shot: capture the phase-aware opener at mount only. Not reactive to
  // later phase changes, which would clobber an in-progress conversation.
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      role: 'hatch',
      content: getInitialMessage(challengeType, guidancePhase, guidanceLabels),
      kind: 'chat',
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [retryAfter, setRetryAfter] = useState<number | null>(null)
  const [limitGate, setLimitGate] = useState<{ feature: string; used: number; limit: number } | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null)
  const lastQueuedPromptIdRef = useRef<string | null>(null)
  const hasContextPack = Boolean(contextPack?.trim())
  const isAnalyticsMode = challengeType === 'claude_code_analytics' || challengeType === 'claude_code_debugging'
  const canvasStatusLabel = (challengeType === 'coding' || isAnalyticsMode)
    ? null
    : `${scene.entities.length} ${challengeType === 'data_modeling' ? 'tables' : 'nodes'} · ${scene.connections.length} ${challengeType === 'data_modeling' ? 'links' : 'flows'}`
  const suggestionPrompts = solutionsOpen
    ? ['Compare my work to this approach.', ...getSuggestionPrompts(challengeType, currentLanguage).slice(0, 2)]
    : getSuggestionPrompts(challengeType, currentLanguage)
  const isThrottled = retryAfter != null && retryAfter > 0
  const inputDisabled = isLoading || isThrottled
  const inputPlaceholder = isThrottled
    ? `Slow down. Try again in ${retryAfter}s.`
    : challengeType === 'coding'
      ? "Ask Hatch about your code…"
      : isAnalyticsMode
        ? "Ask Hatch about the session…"
        : "Ask Hatch, or tell it what to draw from your notes…"

  // Suppress unused variable warnings - grade is reserved for future use; isOpen kept for callers
  void grade
  void isOpen

  // First-session coaching: open the dock once (docked) the first time autoOpenKey
  // is seen, then never again. The dock state lives in useHatchDockState (a parent
  // isOpen can't drive it), so this is the supported one-shot open.
  useEffect(() => {
    if (!autoOpenKey) return
    if (typeof window === 'undefined') return
    try {
      const k = `hatch-dock-autoopen:${autoOpenKey}`
      if (!localStorage.getItem(k)) {
        localStorage.setItem(k, '1')
        if (mode === 'closed') setMode('docked')
      }
    } catch {
      if (mode === 'closed') setMode('docked')
    }
  // Run once on mount for this key; mode/setMode are stable enough and we only
  // act when currently closed.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenKey])

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragRef.current = { startX: e.clientX, startWidth: panelWidth }
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return
      const delta = dragRef.current.startX - ev.clientX
      setPanelWidth(dragRef.current.startWidth + delta)
    }
    const onUp = () => {
      dragRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [panelWidth, setPanelWidth])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!isThrottled) return
    const interval = window.setInterval(() => {
      setRetryAfter((current) => {
        if (!current || current <= 1) return null
        return current - 1
      })
    }, 1000)

    return () => window.clearInterval(interval)
  }, [isThrottled])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading || isThrottled) return
    const userMsg: ChatMessage = { role: 'user', content: text, kind: 'chat' }
    play('send')
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    // Unified coach endpoint - model decides build vs coach vs both.
    try {
      const baseBody = {
        message: text,
        scene,
        history: messages
          .slice(-10)
          .map((m) => ({ role: m.role === 'hatch' ? 'hatch' : 'user', content: m.content })),
        challengeId,
        challengeType,
        attemptId,
        context_pack: contextPack,
        guidance_level: guidanceLevel,
        guidance_phase: guidancePhase ?? null,
        solutions_tab_open: solutionsOpen,
        solution_approach_title: activeSolutionApproach?.title ?? null,
        solution_approach_tagline: activeSolutionApproach?.tagline ?? null,
        // The walkthrough step the learner is viewing, debounced to send-time
        // (this body is built per message-send, not on every step tick).
        solution_step_title: activeSolutionApproach?.stepTitle ?? null,
        solution_step_decision: activeSolutionApproach?.stepDecision ?? null,
      }

      const codingBody = challengeType === 'coding' ? {
        guidance_level: guidanceLevel,
        current_code: currentCode,
        current_language: currentLanguage,
        last_run_result: lastRunResult,
        time_elapsed_seconds: timeElapsed,
        time_remaining_seconds: timeRemaining,
        challenge_title: challengeTitle,
        problem_statement: problemStatement,
        active_part_id: activePartId,
        active_part_sequence: activePartSequence,
        active_part_title: activePartTitle,
        active_part_prompt: activePartPrompt ?? undefined,
        active_part_response_type: activePartResponseType,
        active_part_weight_pct: activePartWeightPct,
      } : isAnalyticsMode ? {
        // Analytics context — dedicated fields, never overloads currentCode.
        guidance_level: guidanceLevel,
        mcp_connected: mcpConnected,
        terminal_tail: terminalTail,
        artifact_state: artifactState,
        active_sub_problem_id: activeSubProblemId,
        active_sub_problem_sequence: activeSubProblemSequence,
        active_sub_problem_title: activeSubProblemTitle,
        active_sub_problem_objective: activeSubProblemObjective,
        active_sub_problem_success_criterion: activeSubProblemSuccessCriterion,
        skills_written: skillsWritten,
        marked_findings: markedFindings,
        asserted_finding: assertedFinding,
        time_elapsed_seconds: timeElapsed,
        challenge_title: challengeTitle,
        problem_statement: problemStatement,
      } : {}

      const res = await fetch('/api/hatch/canvas/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...baseBody, ...codingBody }),
      })
      if (!res.ok) {
        const errorPayload = await res.json().catch(() => ({})) as LimitErrorPayload
        if (res.status === 402 && errorPayload.error === 'limit_reached') {
          setLimitGate({
            feature: errorPayload.feature ?? 'hatch_canvas_interprets',
            used: errorPayload.used ?? errorPayload.limit ?? 0,
            limit: errorPayload.limit ?? 0,
          })
          play('error')
          setMessages((prev) => [
            ...prev,
            {
              role: 'hatch',
              content: 'You have hit the free Hatch canvas review limit. Upgrade to keep coaching available.',
              kind: 'chat',
            },
          ])
          return
        }

        if (res.status === 429) {
          const retryHeader = Number(res.headers.get('Retry-After'))
          const seconds = errorPayload.retryAfter ?? (Number.isFinite(retryHeader) && retryHeader > 0 ? retryHeader : 30)
          setRetryAfter(seconds)
          play('error')
          setMessages((prev) => [
            ...prev,
            {
              role: 'hatch',
              content: `Slow down. Try again in ${seconds}s.`,
              kind: 'chat',
            },
          ])
          return
        }

        throw new Error('coach call failed')
      }
      const data = (await res.json()) as CanvasInterpretResponse
      const safeMessage = sanitizeHatchText(data.message)
      const willBuild = data.actions.length > 0 && !!onCanvasActions
      if (willBuild && onCanvasActions) {
        onCanvasActions({ message: safeMessage, actions: data.actions })
      }
      play(willBuild ? 'draw' : 'reply')
      setMessages((prev) => [
        ...prev,
        {
          role: 'hatch',
          content: safeMessage,
          kind: willBuild ? 'canvas_action' : 'chat',
        },
      ])
    } catch {
      play('error')
      setMessages((prev) => [
        ...prev,
        {
          role: 'hatch',
          content: "I had trouble with that. Try rephrasing or breaking it into smaller requests.",
          kind: 'chat',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, scene, contextPack, challengeId, challengeType, attemptId, messages, onCanvasActions,
      currentCode, currentLanguage, lastRunResult, timeElapsed, timeRemaining,
      challengeTitle, problemStatement,
      activePartId, activePartSequence, activePartTitle, activePartPrompt,
      activePartResponseType, activePartWeightPct,
      // Analytics context
      isAnalyticsMode, terminalTail, artifactState, mcpConnected, skillsWritten, guidanceLevel,
      activeSubProblemId, activeSubProblemSequence, activeSubProblemTitle,
      activeSubProblemObjective, activeSubProblemSuccessCriterion,
      markedFindings, assertedFinding,
      // Canvas guidance context
      guidancePhase,
      // Solutions tab context
      solutionsOpen, activeSolutionApproach,
      play, isThrottled])

  useEffect(() => {
    if (!queuedPrompt || queuedPrompt.id === lastQueuedPromptIdRef.current) return
    setMode('docked')

    if (queuedPrompt.autoSend === false || isLoading) {
      setInput(queuedPrompt.text)
      return
    }

    lastQueuedPromptIdRef.current = queuedPrompt.id
    void sendMessage(queuedPrompt.text)
  }, [queuedPrompt, isLoading, sendMessage, setMode])

  // Proactive nudge: surface in chat thread, auto-dismiss-aware. When the dock
  // is collapsed to the Ask Hatch pill, mark it unread so the pill shows a dot
  // instead of raising a floating bubble over the workspace.
  const lastNudgeIdRef = useRef<string | null>(null)
  const [hasUnreadNudge, setHasUnreadNudge] = useState(false)
  useEffect(() => {
    if (!proactiveNudge) return
    if (proactiveNudge.id === lastNudgeIdRef.current) return
    lastNudgeIdRef.current = proactiveNudge.id
    play('nudge')
    setMessages((prev) => [
      ...prev,
      { role: 'hatch', content: proactiveNudge.text, kind: 'nudge' },
    ])
    if (mode === 'closed') setHasUnreadNudge(true)
  // mode intentionally read at fire time only - a later open clears the dot below
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proactiveNudge, play])

  useEffect(() => {
    if (mode !== 'closed') setHasUnreadNudge(false)
  }, [mode])

  // Canvas draw failure: surface a graceful retry message in the chat thread.
  const lastDrawFailureIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (!canvasDrawFailure) return
    if (canvasDrawFailure.id === lastDrawFailureIdRef.current) return
    lastDrawFailureIdRef.current = canvasDrawFailure.id
    play('error')
    setMessages((prev) => [
      ...prev,
      { role: 'hatch', content: canvasDrawFailure.text, kind: 'chat' },
    ])
  }, [canvasDrawFailure, play])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  if (mode === 'closed') {
    const pillCopy = getPillCopy(challengeType)
    return (
      <button
        data-hatch-target="workspace-hatch-chat"
        onClick={() => { play('open'); setMode('floating'); onToggle() }}
        className="absolute bottom-4 right-4 z-20 flex items-center gap-2.5 rounded-full bg-forest-950 py-2 pl-2 pr-4 text-white shadow-[0_12px_28px_-10px_rgba(5,35,22,0.5)] hover:bg-forest-800 transition-colors"
        title="Open Hatch chat"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-note-mint">
          <HatchImage size={28} state="avatar" />
        </span>
        <span className="flex flex-col items-start leading-tight">
          <span className="font-label text-[13px] font-bold">{pillCopy.title}</span>
          <span className="font-label text-[10.5px] font-semibold text-white/60">{pillCopy.sub}</span>
        </span>
        <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/10">
          <span className="material-symbols-outlined text-[13px]">expand_less</span>
        </span>
        {hasUnreadNudge && (
          <span
            className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-gold border-2 border-card-bright"
            aria-label="Hatch has a new tip"
          />
        )}
      </button>
    )
  }

  if (mode === 'docked') {
    return (
      <>
        <div
          data-testid="hatch-chat-panel"
          data-hatch-target="workspace-hatch-chat"
          style={{ width: panelWidth, minWidth: MIN_WIDTH, maxWidth: MAX_WIDTH }}
          className="relative ml-2 flex flex-col rounded-2xl border border-hairline bg-card-bright h-full overflow-hidden shrink-0"
        >
        {/* Drag handle */}
        <div
          onMouseDown={startResize}
          className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/20 z-10"
        />
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-hairline bg-card-bright shrink-0">
          <div className="flex min-w-0 flex-col">
            <div className="flex items-center gap-2">
              <HatchImage size={22} state={isLoading ? 'thinking' : 'avatar'} />
              <span className="font-label font-bold text-sm text-ink-strong">Hatch</span>
            </div>
            {canvasStatusLabel && (
              <div className="mt-0.5 flex min-w-0 items-center gap-1.5 font-label text-[10px] font-bold text-ink-secondary">
                <span className="truncate">{canvasStatusLabel}</span>
                <span className="h-1 w-1 rounded-full bg-hairline" />
                <span className={hasContextPack ? 'text-forest-600' : ''}>{hasContextPack ? 'context synced' : 'add context'}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { play('open'); setMode('floating') }}
              className="text-on-surface-variant hover:text-on-surface transition-colors"
              title="Undock"
            >
              <span className="material-symbols-outlined text-[18px]">open_in_new</span>
            </button>
            <button
              onClick={() => { play('close'); setMode('closed'); onToggle() }}
              className="text-on-surface-variant hover:text-on-surface transition-colors"
              title="Close"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
            <button
              onClick={toggleMuted}
              className="text-on-surface-variant hover:text-on-surface transition-colors"
              title={muted ? 'Turn Hatch sounds on' : 'Mute Hatch sounds'}
              aria-label={muted ? 'Turn Hatch sounds on' : 'Mute Hatch sounds'}
            >
              <span className="material-symbols-outlined text-[18px]">
                {muted ? 'volume_off' : 'volume_up'}
              </span>
            </button>
          </div>
        </div>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              {msg.role === 'hatch' && (
                <HatchImage size={20} state="avatar" className="mt-0.5 self-start h-5 w-5" />
              )}
              <div className={`flex max-w-[85%] flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  data-testid={msg.role === 'user' ? 'hatch-message-user' : 'hatch-message-assistant'}
                  className={`rounded-xl px-3 py-2 text-sm font-body leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary text-on-primary'
                      : msg.kind === 'canvas_action'
                        ? 'bg-primary-container text-on-primary-container'
                        : msg.kind === 'nudge'
                          ? 'note-amber text-ink-strong'
                          : 'bg-surface-container-high text-on-surface'
                  }`}
                >
                  {msg.kind === 'nudge' && (
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-semibold opacity-70">Hatch noticed</span>
                      {onDismissNudge && (
                        <button onClick={onDismissNudge} className="text-xs opacity-60 hover:opacity-100" aria-label="Dismiss nudge">✕</button>
                      )}
                    </div>
                  )}
                  {msg.role === 'hatch' ? <Md variant="chat">{msg.content}</Md> : msg.content}
                  {msg.kind === 'canvas_action' && (
                    <span className="material-symbols-outlined text-[14px] ml-1 opacity-70">draw</span>
                  )}
                </div>
                {msg.role === 'hatch' && (
                  <ReportButton
                    compact
                    targetType="hatch_response"
                    targetId={`${attemptId}:${i}`}
                    targetUrl={`/workspace/challenges/${challengeId}`}
                    metadata={{
                      attemptId,
                      challengeId,
                      challengeType,
                      messageKind: msg.kind ?? 'chat',
                      messageExcerpt: msg.content.slice(0, 240),
                    }}
                    className="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold text-on-surface-variant/70 hover:bg-surface-container-highest hover:text-on-surface disabled:opacity-50"
                  />
                )}
              </div>
            </div>
          ))}
          {suggestionPrompts.length > 0 && messages.length === 1 && !isLoading && (
            <div className="flex flex-col gap-1.5 mt-2">
              {suggestionPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-left text-xs px-3 py-2 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors font-body"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}
          {isLoading && (
            <div className="flex gap-2">
              <HatchImage size={20} state="thinking" />
              <div className="bg-surface-container-high rounded-xl px-3 py-2 text-sm text-on-surface-variant">
                {challengeType === 'coding' ? 'Hatch is thinking…' : isAnalyticsMode ? 'Hatch is reading the session…' : onCanvasActions ? 'Hatch is reading notes and canvas…' : '…'}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        {/* Input */}
        {!feedbackMode && (
          <div className="border-t border-outline-variant p-2 bg-surface-container-high shrink-0">
            <div className="flex gap-2 items-end">
              <textarea
                data-testid="hatch-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={inputDisabled}
                placeholder={inputPlaceholder}
                rows={2}
                className="flex-1 resize-none rounded-lg bg-surface-container border border-outline-variant text-on-surface text-sm px-3 py-2 font-body placeholder:text-on-surface-variant focus:outline-none focus:border-primary disabled:opacity-60"
              />
              <div className="flex flex-col gap-1">
                <VoiceInputButton onTranscript={sendMessage} disabled={inputDisabled} />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={inputDisabled || !input.trim()}
                  className="p-2 rounded-full bg-primary text-on-primary disabled:opacity-40 hover:opacity-90 transition-opacity"
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                </button>
              </div>
            </div>
            {isThrottled && (
              <p className="mt-2 font-body text-xs text-on-surface-variant">
                Slow down. Try again in {retryAfter}s.
              </p>
            )}
          </div>
        )}
        </div>
        <PaywallModal
          open={!!limitGate}
          used={limitGate?.used}
          limit={limitGate?.limit}
          feature={limitGate?.feature}
          onClose={() => setLimitGate(null)}
        />
      </>
    )
  }

  return (
    <>
    <div data-testid="hatch-chat-panel" data-hatch-target="workspace-hatch-chat" className="absolute bottom-4 right-4 z-20 flex flex-col w-80 h-[480px] max-h-[calc(100%-2rem)] border border-hairline rounded-2xl bg-card-bright shadow-[0_24px_56px_-16px_rgba(5,35,22,0.35)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-hairline bg-card-bright">
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-col">
            <div className="flex items-center gap-2">
              <HatchImage size={22} state={isLoading ? 'thinking' : 'avatar'} />
              <span className="font-label font-bold text-sm text-ink-strong">Hatch</span>
            </div>
            {canvasStatusLabel && (
              <div className="mt-0.5 flex min-w-0 items-center gap-1.5 font-label text-[10px] font-bold text-ink-secondary">
                <span className="truncate">{canvasStatusLabel}</span>
                <span className="h-1 w-1 rounded-full bg-hairline" />
                <span className={hasContextPack ? 'text-forest-600' : ''}>{hasContextPack ? 'context synced' : 'add context'}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { play('open'); setMode('docked') }}
            className="text-on-surface-variant hover:text-on-surface transition-colors"
            title="Dock to side"
          >
            <span className="material-symbols-outlined text-[18px]">push_pin</span>
          </button>
          <button
            onClick={() => { play('close'); setMode('closed'); onToggle() }}
            className="text-on-surface-variant hover:text-on-surface transition-colors"
            title="Close"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
          <button
            onClick={toggleMuted}
            className="text-on-surface-variant hover:text-on-surface transition-colors"
            title={muted ? 'Turn Hatch sounds on' : 'Mute Hatch sounds'}
            aria-label={muted ? 'Turn Hatch sounds on' : 'Mute Hatch sounds'}
          >
            <span className="material-symbols-outlined text-[18px]">
              {muted ? 'volume_off' : 'volume_up'}
            </span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            {msg.role === 'hatch' && (
              <HatchImage size={20} state="avatar" className="mt-0.5 self-start h-5 w-5" />
            )}
            <div className={`flex max-w-[85%] flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                data-testid={msg.role === 'user' ? 'hatch-message-user' : 'hatch-message-assistant'}
                className={`rounded-xl px-3 py-2 text-sm font-body leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary text-on-primary'
                    : msg.kind === 'canvas_action'
                      ? 'bg-primary-container text-on-primary-container'
                      : msg.kind === 'nudge'
                        ? 'note-amber text-ink-strong'
                        : 'bg-surface-container-high text-on-surface'
                }`}
              >
                {msg.kind === 'nudge' && (
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-semibold opacity-70">Hatch noticed</span>
                    {onDismissNudge && (
                      <button
                        onClick={onDismissNudge}
                        className="text-xs opacity-60 hover:opacity-100"
                        aria-label="Dismiss nudge"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                )}
                {msg.role === 'hatch' ? <Md variant="chat">{msg.content}</Md> : msg.content}
                {msg.kind === 'canvas_action' && (
                  <span className="material-symbols-outlined text-[14px] ml-1 opacity-70">draw</span>
                )}
              </div>
              {msg.role === 'hatch' && (
                <ReportButton
                  compact
                  targetType="hatch_response"
                  targetId={`${attemptId}:${i}`}
                  targetUrl={`/workspace/challenges/${challengeId}`}
                  metadata={{
                    attemptId,
                    challengeId,
                    challengeType,
                    messageKind: msg.kind ?? 'chat',
                    messageExcerpt: msg.content.slice(0, 240),
                  }}
                  className="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold text-on-surface-variant/70 hover:bg-surface-container-highest hover:text-on-surface disabled:opacity-50"
                />
              )}
            </div>
          </div>
        ))}
        {/* Suggestion chips shown while the Hatch thread is still empty. */}
        {suggestionPrompts.length > 0 && messages.length === 1 && !isLoading && (
          <div className="flex flex-col gap-1.5 mt-2">
            {suggestionPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                className="text-left text-xs px-3 py-2 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors font-body"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}
        {isLoading && (
          <div className="flex gap-2">
            <HatchImage size={20} state="thinking" />
            <div className="bg-surface-container-high rounded-xl px-3 py-2 text-sm text-on-surface-variant">
              {challengeType === 'coding' ? 'Hatch is thinking…' : isAnalyticsMode ? 'Hatch is reading the session…' : onCanvasActions ? 'Hatch is reading notes and canvas…' : '…'}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!feedbackMode && (
        <div className="border-t border-outline-variant p-2 bg-surface-container-high">
          <div className="flex gap-2 items-end">
            <textarea
              data-testid="hatch-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={inputDisabled}
              placeholder={inputPlaceholder}
              rows={2}
              className="flex-1 resize-none rounded-lg bg-surface-container border border-outline-variant text-on-surface text-sm px-3 py-2 font-body placeholder:text-on-surface-variant focus:outline-none focus:border-primary disabled:opacity-60"
            />
            <div className="flex flex-col gap-1">
              <VoiceInputButton onTranscript={sendMessage} disabled={inputDisabled} />
              <button
                onClick={() => sendMessage(input)}
                disabled={inputDisabled || !input.trim()}
                className="p-2 rounded-full bg-primary text-on-primary disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
            </div>
          </div>
          {isThrottled && (
            <p className="mt-2 font-body text-xs text-on-surface-variant">
              Slow down. Try again in {retryAfter}s.
            </p>
          )}
        </div>
      )}
    </div>
    <PaywallModal
      open={!!limitGate}
      used={limitGate?.used}
      limit={limitGate?.limit}
      feature={limitGate?.feature}
      onClose={() => setLimitGate(null)}
    />
    </>
  )
}

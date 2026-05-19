'use client'

import { Component, use, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { HatchAvatarState } from '@/components/live-interview/HatchAvatar'
import dynamic from 'next/dynamic'
import DeepgramVoiceSession, { type DeepgramVoiceSessionHandle } from '@/components/live-interview/DeepgramVoiceSession'
import { HatchConversationMascot } from '@/components/live-interview/HatchConversationMascot'
import type { TalkingHeadHandle } from '@/components/live-interview/TalkingHeadAvatar'
import { LoopProgressBar } from '@/components/live-interviews/LoopProgressBar'
import { PriorRoundRecap } from '@/components/live-interviews/PriorRoundRecap'
import type { LoopRound } from '@/lib/interview-loops/types'

const TalkingHeadAvatar = dynamic(
  () => import('@/components/live-interview/TalkingHeadAvatar'),
  { ssr: false }
)

const ExcalidrawCanvas = dynamic(
  () => import('@/components/challenge/ExcalidrawCanvas'),
  { ssr: false }
)

const MonacoCodeEditor = dynamic(
  () => import('@/components/challenge/MonacoCodeEditor').then(m => m.MonacoCodeEditor),
  { ssr: false }
)

import type { PasteEvent } from '@/components/challenge/MonacoCodeEditor'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import {
  AnimatedProgress,
  CollapsiblePanel,
  FocusSurface,
  PresencePanel,
  motion,
  type FocusSurfaceEvent,
} from '@/components/motion'
import { Md } from '@/components/ui/Md'
import { useInterviewTimer } from '@/hooks/useInterviewTimer'
import { InterviewLimitModal } from '@/components/paywalls/InterviewLimitModal'
import { useUpgrade } from '@/hooks/useUpgrade'
import { useEntitlements } from '@/hooks/useEntitlements'
import { parseGradingSignal } from '@/lib/live-interview/parse-grading-signal'
import type { LiveInterviewArtifactSnapshot } from '@/lib/live-interview/artifact-context'
import {
  DISCIPLINE_META,
  normalizeDiscipline,
  type LiveInterviewDiscipline,
} from '@/lib/live-interview/disciplines'
import { MOCK_LIVE_SESSION, MOCK_LIVE_TURNS } from '@/lib/mock-live-interviews'

const IS_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'

class AvatarErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('[AvatarErrorBoundary] 3D avatar crashed:', error.message, info.componentStack)
  }
  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}

interface CoachingSignal {
  flowMove: string
  competency: string
  signal: string
}

interface TranscriptTurn {
  id: string
  role: 'hatch' | 'user'
  content: string
  source: 'voice' | 'chat'
  coachingSignal?: CoachingSignal
  artifactSignal?: string
}

type InterviewPhase = 'loading' | 'ready' | 'active' | 'ended'

const FLOW_COLORS: Record<string, string> = {
  frame: '#4a7c59',
  list: '#6b8275',
  optimize: '#c9933a',
  win: '#a878d6',
}

const FLOW_NAMES: Record<string, string> = {
  frame: 'Frame',
  list: 'List',
  optimize: 'Optimize',
  win: 'Win',
}

const COMPETENCY_LABELS: Record<string, string> = {
  motivation_theory: 'Motivation',
  cognitive_empathy: 'Empathy',
  taste: 'Taste',
  strategic_thinking: 'Strategy',
  creative_execution: 'Creativity',
  domain_expertise: 'Domain',
}

const SNAPSHOT_CODE_MAX_CHARS = 40000
const IDLE_FEELER_DELAY_MS = 45_000
const IDLE_FEELER_COOLDOWN_MS = 120_000

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

async function liveInterviewErrorMessage(response: Response) {
  const fallback = response.status === 503
    ? 'Hatch is temporarily unavailable. Try again in a moment.'
    : 'Failed to send message. Please try again.'
  const body = await response.json().catch(() => null) as { error?: unknown } | null
  return typeof body?.error === 'string' && body.error.trim() ? body.error : fallback
}

function isFocusSurfaceEvent(value: unknown): value is FocusSurfaceEvent {
  if (!isRecord(value)) return false
  return (
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.body === 'string' &&
    typeof value.kind === 'string' &&
    ['challenge', 'topic', 'rubric', 'flow-signal', 'memory'].includes(value.kind)
  )
}

function summarizeCanvasElements(elements: unknown[]) {
  const elementTypes: Record<string, number> = {}
  const textLabels: string[] = []

  for (const element of elements) {
    if (!isRecord(element)) continue
    const type = typeof element.type === 'string' ? element.type : 'unknown'
    elementTypes[type] = (elementTypes[type] ?? 0) + 1

    const label = isRecord(element.label) && typeof element.label.text === 'string'
      ? element.label.text
      : typeof element.text === 'string'
      ? element.text
      : null

    if (label?.trim()) {
      textLabels.push(label.trim().slice(0, 80))
    }
  }

  return {
    elementTypes,
    textLabels: [...new Set(textLabels)].slice(0, 12),
  }
}

// ─── Signal Card ───
function SignalCard({ signal, index }: { signal: CoachingSignal; index: number }) {
  const color = FLOW_COLORS[signal.flowMove] ?? '#4a7c59'
  return (
    <div
      className="rounded-[10px] p-3 mb-2"
      style={{
        background: `${color}12`,
        border: `1px solid ${color}25`,
        animationDelay: `${index * 80}ms`,
      }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
          <span className="font-label text-[11px] font-semibold uppercase tracking-wider" style={{ color }}>
            {FLOW_NAMES[signal.flowMove] ?? signal.flowMove}
          </span>
          {signal.competency && (
            <span className="font-label text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
              · {COMPETENCY_LABELS[signal.competency] ?? signal.competency}
            </span>
          )}
        </div>
        <span className="material-symbols-outlined text-[14px]" style={{ color: '#7ee099' }}>thumb_up</span>
      </div>
      <p className="font-body text-[12px] leading-[1.5]" style={{ color: 'rgba(243,237,224,0.75)' }}>
        {signal.signal}
      </p>
    </div>
  )
}

// ─── Transcript Turn Bubble ───
function TurnBubble({ turn }: { turn: TranscriptTurn }) {
  const isHatch = turn.role === 'hatch'

  return (
    <div className={cn('flex flex-col mb-3', isHatch ? 'items-start' : 'items-end')}>
      {/* Coaching signal pill above user bubble */}
      {!isHatch && turn.coachingSignal && (
        <div
          className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 mb-1.5 font-label text-[10.5px] font-semibold"
          style={{
            background: `${FLOW_COLORS[turn.coachingSignal.flowMove] ?? '#4a7c59'}20`,
            border: `1px solid ${FLOW_COLORS[turn.coachingSignal.flowMove] ?? '#4a7c59'}40`,
            color: FLOW_COLORS[turn.coachingSignal.flowMove] ?? '#4a7c59',
          }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: FLOW_COLORS[turn.coachingSignal.flowMove] ?? '#4a7c59' }}
          />
          <span>{FLOW_NAMES[turn.coachingSignal.flowMove]}</span>
          {turn.coachingSignal.competency && (
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>
              · {COMPETENCY_LABELS[turn.coachingSignal.competency]}
            </span>
          )}
        </div>
      )}

      <div className="flex items-end gap-2 max-w-[90%]">
        {/* Hatch avatar dot */}
        {isHatch && (
          <div
            className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center"
            style={{
              background: 'radial-gradient(circle at 35% 35%, #6fa87a, #2d5240)',
              boxShadow: '0 0 8px rgba(74,124,89,0.4)',
            }}
          >
            <div className="w-2 h-2 rounded-full" style={{ background: 'rgba(126,224,153,0.8)' }} />
          </div>
        )}

        <div
          className="px-3 py-2 font-body text-[13.5px] leading-[1.55]"
          style={
            isHatch
              ? {
                  background: 'rgba(74,124,89,0.2)',
                  border: '1px solid rgba(74,124,89,0.25)',
                  borderRadius: '12px 12px 12px 4px',
                  color: 'rgba(243,237,224,0.9)',
                }
              : {
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px 12px 4px 12px',
                  color: 'rgba(243,237,224,0.9)',
                }
          }
        >
          {isHatch ? <Md variant="chat">{turn.content}</Md> : turn.content}
        </div>

        {/* User initials */}
        {!isHatch && (
          <div
            className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center font-label font-bold text-[10px]"
            style={{
              background: 'rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.6)',
            }}
          >
            ME
          </div>
        )}
      </div>

      {/* Artifact signal note below user bubble */}
      {!isHatch && turn.artifactSignal && (
        <div
          className="flex items-center gap-1.5 mt-1 mr-9 font-label text-[10.5px]"
          style={{ color: 'rgba(243,237,224,0.45)' }}
        >
          <span className="material-symbols-outlined text-[11px]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 12" }}>
            visibility
          </span>
          <span>{turn.artifactSignal}</span>
        </div>
      )}
    </div>
  )
}

// ─── Control Button ───
function CtrlBtn({
  icon,
  label,
  active,
  danger,
  large,
  onClick,
  disabled,
}: {
  icon: string
  label: string
  active?: boolean
  danger?: boolean
  large?: boolean
  onClick: () => void
  disabled?: boolean
}) {
  const size = large ? 64 : 52
  const iconSize = large ? 28 : 22

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        onClick={onClick}
        disabled={disabled}
        className="flex items-center justify-center rounded-full transition-all duration-150"
        style={{
          width: size,
          height: size,
          background: danger
            ? '#b23a2a'
            : active
            ? 'rgba(74,124,89,0.4)'
            : 'rgba(255,255,255,0.08)',
          border: active && !danger ? '2px solid rgba(74,124,89,0.6)' : '2px solid transparent',
          boxShadow: active && !danger ? '0 0 12px rgba(74,124,89,0.3)' : 'none',
        }}
        onMouseEnter={(e) => {
          if (danger) {
            (e.currentTarget as HTMLButtonElement).style.background = '#c9402a'
          } else {
            (e.currentTarget as HTMLButtonElement).style.background = active
              ? 'rgba(74,124,89,0.5)'
              : 'rgba(255,255,255,0.16)'
            ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'
          }
        }}
        onMouseLeave={(e) => {
          if (danger) {
            (e.currentTarget as HTMLButtonElement).style.background = '#b23a2a'
          } else {
            (e.currentTarget as HTMLButtonElement).style.background = active
              ? 'rgba(74,124,89,0.4)'
              : 'rgba(255,255,255,0.08)'
            ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'
          }
        }}
        aria-label={label}
        aria-pressed={typeof active === 'boolean' ? active : undefined}
      >
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: iconSize,
            color: danger ? '#fff' : active ? 'rgba(126,224,153,0.9)' : 'rgba(243,237,224,0.7)',
          }}
        >
          {icon}
        </span>
      </button>
      <span
        className="font-label uppercase tracking-wider"
        style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)' }}
      >
        {label}
      </span>
    </div>
  )
}

// ─── Main Page ───
const ENABLE_DIRECT_VOICE_AGENT = true

export default function SessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ company?: string; role?: string; autostart?: string; loop_id?: string; round_index?: string; discipline?: string }>
}) {
  const { id } = use(params)
  const { company, role: roleParam, autostart, loop_id: loopIdParam, round_index: roundIndexParam, discipline: disciplineParam } = use(searchParams)
  const router = useRouter()
  const { startUpgrade } = useUpgrade()
  const { isPro, isAdmin } = useEntitlements()

  const [sessionId, setSessionId] = useState<string>(IS_MOCK ? 'mock-session-id' : id)
  const [companyName, setCompanyName] = useState(IS_MOCK ? MOCK_LIVE_SESSION.companyName ?? '' : '')
  const [roleName, setRoleName] = useState(IS_MOCK ? MOCK_LIVE_SESSION.role ?? '' : '')
  const [scenarioTitle, setScenarioTitle] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [interviewPhase, setInterviewPhase] = useState<InterviewPhase>(IS_MOCK ? 'active' : 'loading')
  const [interviewStartedAt, setInterviewStartedAt] = useState<number | null>(IS_MOCK ? Date.now() : null)

  const [flowCoverage, setFlowCoverage] = useState(
    IS_MOCK ? MOCK_LIVE_SESSION.flowCoverage : { frame: 0, list: 0, optimize: 0, win: 0 }
  )
  const [totalTurns, setTotalTurns] = useState(IS_MOCK ? MOCK_LIVE_SESSION.totalTurns : 0)
  const [turns, setTurns] = useState<TranscriptTurn[]>(
    IS_MOCK
      ? MOCK_LIVE_TURNS.map((t) => ({ id: t.id, role: t.role, content: t.content, source: 'voice' as const }))
      : []
  )

  const [hatchState, setHatchState] = useState<HatchAvatarState>('idle')
  const [isThinking, setIsThinking] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isVoiceActive, setIsVoiceActive] = useState(false)
  const [isVoiceAvailable, setIsVoiceAvailable] = useState(false)
  const [isCaptionsOn, setIsCaptionsOn] = useState(true)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(true)
  const [isFlowPanelOpen, setIsFlowPanelOpen] = useState(true)
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [focusCollapsed, setFocusCollapsed] = useState(false)
  const [focusDismissedId, setFocusDismissedId] = useState<string | null>(null)
  const [remoteFocusEvent, setRemoteFocusEvent] = useState<FocusSurfaceEvent | null>(null)
  const [isEnding, setIsEnding] = useState(false)
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [interviewUsageData, setInterviewUsageData] = useState<{ used: number; limit: number }>({ used: 1, limit: 5 })
  const [currentCaption, setCurrentCaption] = useState('')
  const [recentSignals, setRecentSignals] = useState<Array<CoachingSignal & { id: string; time: number }>>([])
  const talkingHeadRef = useRef<TalkingHeadHandle | null>(null)
  const voiceSessionRef = useRef<DeepgramVoiceSessionHandle | null>(null)
  const transcriptRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<HTMLInputElement>(null)
  const [chatInput, setChatInput] = useState('')
  const [isChatSending, setIsChatSending] = useState(false)
  const chatListRef = useRef<HTMLDivElement>(null)

  const [loopRounds, setLoopRounds] = useState<LoopRound[]>([])
  const [previousRound, setPreviousRound] = useState<LoopRound | null>(null)

  // Artifact workspace state
  const [centerMode, setCenterMode] = useState<'orb' | 'canvas' | 'editor'>('orb')
  const [canvasScene, setCanvasScene] = useState<{ elements: unknown[]; appState: unknown } | null>(null)
  const [currentCode, setCurrentCode] = useState('')
  const [currentLanguage, setCurrentLanguage] = useState<'python' | 'javascript' | 'java' | 'cpp' | 'go' | 'sql'>('python')
  const [lastRunResult, setLastRunResult] = useState<unknown>(null)
  const [editorPasteEvents, setEditorPasteEvents] = useState<PasteEvent[]>([])
  const [editorCursorLine, setEditorCursorLine] = useState<number | undefined>(undefined)

  const eventSourceRef = useRef<EventSource | null>(null)
  const lastSignalTurnIndexRef = useRef<number>(-1)
  const openingRequestedRef = useRef(false)
  const openingSpokenRef = useRef(false)
  const idleFeelerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastFeelerAtRef = useRef(0)
  const snapshotPersistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { formatted: timerDisplay, isWarning, isLimitReached } = useInterviewTimer(
    interviewStartedAt,
    interviewPhase === 'active',
    isPro || isAdmin ? undefined : 30
  )

  // Overall score derived from flow coverage
  const overallScore = Math.round(
    ((flowCoverage.frame + flowCoverage.list + flowCoverage.optimize + flowCoverage.win) / 4) * 100
  )

  const currentRoundIndex = roundIndexParam ? parseInt(roundIndexParam) : 0
  const discipline: LiveInterviewDiscipline | null =
    (loopRounds[currentRoundIndex]?.discipline as LiveInterviewDiscipline | undefined)
    ?? normalizeDiscipline(disciplineParam)
    ?? null

  const buildCurrentArtifactSnapshot = useCallback((): LiveInterviewArtifactSnapshot | null => {
    if (centerMode === 'canvas') {
      const elements = (canvasScene?.elements ?? []) as unknown[]
      const summary = summarizeCanvasElements(elements)
      if (elements.length === 0) return null

      return {
        type: 'canvas',
        discipline: discipline ?? undefined,
        capturedAt: Date.now(),
        elementCount: elements.length,
        elementTypes: summary.elementTypes,
        textLabels: summary.textLabels,
      }
    }

    if (centerMode === 'editor') {
      const hasCode = currentCode.trim().length > 0
      const hasRunResult = lastRunResult != null
      if (!hasCode && !hasRunResult && editorPasteEvents.length === 0) return null

      return {
        type: 'editor',
        discipline: discipline ?? undefined,
        capturedAt: Date.now(),
        code: currentCode.slice(0, SNAPSHOT_CODE_MAX_CHARS),
        language: currentLanguage,
        cursorLine: editorCursorLine,
        pasteEvents: editorPasteEvents.slice(-5),
        runResult: lastRunResult,
      }
    }

    return null
  }, [
    canvasScene,
    centerMode,
    currentCode,
    currentLanguage,
    discipline,
    editorCursorLine,
    editorPasteEvents,
    lastRunResult,
  ])

  // Set the editor's default language based on discipline (sql vs coding).
  // Guard with !currentCode so we never stomp on user input.
  useEffect(() => {
    if (!discipline) return
    const meta = DISCIPLINE_META[discipline]
    if (meta.artifact === 'editor' && meta.defaultLanguage && !currentCode) {
      setCurrentLanguage(meta.defaultLanguage)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discipline])

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
    }
  }, [turns])

  useEffect(() => {
    if (chatListRef.current) {
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight
    }
  }, [turns, isThinking])

  // Start session - if autostart=1 the session was already created by StartInterviewButton
  // so we use the id directly and skip the POST, going straight to active.
  useEffect(() => {
    if (IS_MOCK) return
    const isAutostart = autostart === '1'

    if (isAutostart) {
      // Session already exists; company/role passed via query params
      setCompanyName(company ?? '')
      setRoleName(roleParam ?? '')
      setInterviewPhase('active')
      setInterviewStartedAt(Date.now())
      return
    }

    // Resume path: loop_id present and no autostart means the user is
    // returning to a paused round. Hit /resume to rebuild session instructions
    // against current move levels before going active.
    if (loopIdParam) {
      let cancelled = false
      ;(async () => {
        try {
          const res = await fetch(`/api/live-interview/${id}/resume`, { method: 'POST' })
          if (!res.ok) return
          const data = await res.json()
          if (cancelled) return
          if (data.session?.company_id) setCompanyName(company ?? data.session.company_id)
          else setCompanyName(company ?? '')
          setRoleName(roleParam ?? '')
          setInterviewPhase('active')
          setInterviewStartedAt(Date.now())
        } catch {
          // Fall through silently - UI will still render in 'starting' phase
        }
      })()
      return () => { cancelled = true }
    }

    let cancelled = false
    async function startSession() {
      try {
        const res = await fetch('/api/live-interview/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companyId: company, roleId: roleParam }),
        })
        if (!res.ok) {
          const d = await res.json().catch(() => ({}))
          throw new Error(d.error ?? `Failed to start session (${res.status})`)
        }
        const data = await res.json()
        if (cancelled) return
        setSessionId(data.sessionId)
        setCompanyName(data.companyName ?? company ?? '')
        setRoleName(data.role ?? roleParam ?? '')
        setScenarioTitle(data.scenarioTitle ?? null)
        setInterviewPhase('ready')
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to start session')
        setInterviewPhase('ready')
      }
    }
    startSession()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (IS_MOCK) return
    fetch('/api/usage/me')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setInterviewUsageData({ used: d.interviews.used, limit: d.interviews.limit }) })
      .catch(() => {})
  }, [])

  // Fetch loop data when this session belongs to a loop
  useEffect(() => {
    if (!loopIdParam) return
    const roundIndex = parseInt(roundIndexParam ?? '0', 10)
    fetch(`/api/interview-loops/${loopIdParam}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.rounds) {
          setLoopRounds(data.rounds as LoopRound[])
          const prev = (data.rounds as LoopRound[]).find(
            (r) => r.round_index === roundIndex - 1 && r.status === 'completed'
          )
          setPreviousRound(prev ?? null)
        }
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loopIdParam])

  useEffect(() => {
    if (interviewPhase !== 'active' || !sessionId || turns.length > 0 || openingRequestedRef.current) return
    openingRequestedRef.current = true
    setError(null)

    if (IS_MOCK) {
      setTurns([{
        id: crypto.randomUUID(),
        role: 'hatch',
        content: "Hey. Good to see you. I'll make this feel like a real interview, and I'm going to push hardest on whether you diagnose before solving.",
        source: 'chat',
      }])
      setTotalTurns(1)
      setIsChatOpen(true)
      return
    }

    let cancelled = false
    setHatchState('thinking')
    setIsThinking(true)
    setError(null)

    fetch(`/api/live-interview/${sessionId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'opening',
        artifactSnapshot: buildCurrentArtifactSnapshot() ?? undefined,
      }),
    })
      .then(async (res) => {
        if (res.ok) return res.json()
        throw new Error(await liveInterviewErrorMessage(res))
      })
      .then((data) => {
        if (cancelled || !data?.reply) return
        setTurns((prev) => prev.length > 0 ? prev : [{
          id: crypto.randomUUID(),
          role: 'hatch',
          content: data.reply,
          source: 'chat',
        }])
        setTotalTurns((prev) => Math.max(prev, 1))
        setCurrentCaption(data.reply)
        if (!isVoiceAvailable) {
          setIsChatOpen(true)
          setTimeout(() => chatInputRef.current?.focus(), 50)
        }
      })
      .catch((err) => {
        openingRequestedRef.current = false
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Hatch is temporarily unavailable. Try again in a moment.')
          setIsChatOpen(true)
        }
      })
      .finally(() => {
        if (cancelled) return
        setHatchState('idle')
        setIsThinking(false)
      })

    return () => { cancelled = true }
  }, [buildCurrentArtifactSnapshot, interviewPhase, isVoiceAvailable, sessionId, turns.length])

  useEffect(() => {
    if (
      !ENABLE_DIRECT_VOICE_AGENT ||
      openingSpokenRef.current ||
      !isVoiceActive ||
      !isVoiceAvailable ||
      turns.length !== 1
    ) {
      return
    }

    const firstTurn = turns[0]
    if (firstTurn?.role !== 'hatch') return

    if (voiceSessionRef.current?.injectAgentMessage(firstTurn.content)) {
      openingSpokenRef.current = true
    }
  }, [isVoiceActive, isVoiceAvailable, turns])

  useEffect(() => {
    if (IS_MOCK || interviewPhase !== 'active' || centerMode === 'orb' || !sessionId) return
    const snapshot = buildCurrentArtifactSnapshot()
    if (!snapshot) return

    if (snapshotPersistTimerRef.current) {
      clearTimeout(snapshotPersistTimerRef.current)
    }

    snapshotPersistTimerRef.current = setTimeout(() => {
      fetch(`/api/live-interview/${sessionId}/snapshot`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artifactSnapshot: snapshot }),
      }).catch(() => {})
    }, 1500)

    return () => {
      if (snapshotPersistTimerRef.current) {
        clearTimeout(snapshotPersistTimerRef.current)
      }
    }
  }, [buildCurrentArtifactSnapshot, centerMode, interviewPhase, sessionId])

  const handleStartInterview = useCallback(() => {
    setInterviewPhase('active')
    setInterviewStartedAt(Date.now())
  }, [])

  // SSE
  useEffect(() => {
    if (IS_MOCK || interviewPhase !== 'active' || !sessionId) return
    const es = new EventSource(`/api/live-interview/${sessionId}/status`)
    eventSourceRef.current = es
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.flowCoverage) setFlowCoverage(data.flowCoverage)
        if (data.totalTurns != null) setTotalTurns(data.totalTurns)
        if (data.emotionalBeat && data.emotionalBeat !== 'neutral') {
          const beatToState: Record<string, HatchAvatarState> = {
            intrigued: 'intrigued',
            challenging: 'challenging',
            delighted: 'delighted',
            concerned: 'thinking',
          }
          const mappedState = beatToState[data.emotionalBeat]
          if (mappedState) {
            setHatchState(mappedState)
            setTimeout(() => setHatchState('listening'), 3000)
          }
        }
        if (data.latestSignal?.flowMove && data.latestSignal.turnIndex != null) {
          const signalTurnIndex = data.latestSignal.turnIndex as number
          if (signalTurnIndex > lastSignalTurnIndexRef.current) {
            lastSignalTurnIndexRef.current = signalTurnIndex
            const signalData: CoachingSignal = {
              flowMove: data.latestSignal.flowMove,
              competency: data.latestSignal.competency,
              signal: data.latestSignal.signal,
            }
            setRecentSignals(prev => [
              { ...signalData, id: crypto.randomUUID(), time: Date.now() },
              ...prev.slice(0, 9),
            ])
            setTurns((prev) => {
              const lastHatchIdx = prev.findLastIndex((t) => t.role === 'hatch' && t.source === 'voice')
              if (lastHatchIdx === -1) return prev
              const turn = prev[lastHatchIdx]
              if (turn.coachingSignal) return prev
              const updated = [...prev]
              updated[lastHatchIdx] = { ...turn, coachingSignal: signalData }
              return updated
            })
          }
        }
        if (isFocusSurfaceEvent(data.focusEvent)) {
          setRemoteFocusEvent(data.focusEvent)
        }
        if (data.sessionPhase === 'done' && !isEnding) {
          setTimeout(() => {
            setIsEnding(true)
            setInterviewPhase('ended')
            es.close()
            fetch(`/api/live-interview/${sessionId}/end`, { method: 'POST' })
              .then(() => {
                window.dispatchEvent(new CustomEvent('profile-stats-updated', { detail: { source: 'live-interview' } }))
                router.push(`/live-interviews/${sessionId}/debrief`)
              })
              .catch(() => setError('Failed to generate debrief'))
          }, 2000)
        }
        if (data.done) es.close()
      } catch { /* ignore */ }
    }
    return () => { es.close(); eventSourceRef.current = null }
  }, [sessionId, interviewPhase, isEnding, router])

  useEffect(() => {
    if (interviewPhase !== 'active') return
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      if (loopIdParam) {
        // Loop session: pause instead of abandon so the user can resume later
        navigator.sendBeacon(
          `/api/live-interview/${sessionId}/pause`,
          new Blob([JSON.stringify({})], { type: 'application/json' })
        )
      } else {
        navigator.sendBeacon(
          `/api/live-interview/${sessionId}/end`,
          new Blob([JSON.stringify({ abandoned: true })], { type: 'application/json' })
        )
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [interviewPhase, sessionId, loopIdParam])

  useEffect(() => {
    if (isLimitReached && interviewPhase === 'active' && !showLimitModal) {
      setShowLimitModal(true)
      setIsMuted(true)
    }
  }, [isLimitReached, interviewPhase, showLimitModal])

  const handleTranscript = useCallback((text: string, role: 'hatch' | 'user') => {
    const { cleanContent, signal } = parseGradingSignal(text)
    if (!cleanContent) return
    const turnIndex = totalTurns

    // Update caption for hatch
    if (role === 'hatch') setCurrentCaption(cleanContent)

    let coachingSignal: CoachingSignal | undefined
    if (signal && signal.flowMove) coachingSignal = signal

    if (coachingSignal) {
      setRecentSignals(prev => [
        { ...coachingSignal!, id: crypto.randomUUID(), time: Date.now() },
        ...prev.slice(0, 9),
      ])
    }

    const turn: TranscriptTurn = {
      id: crypto.randomUUID(),
      role,
      content: cleanContent,
      source: 'voice',
      coachingSignal,
    }
    const localTurnsWithNewTurn = [...turns, turn]
    const shouldGradeVoiceExchange = role === 'hatch' && turns[turns.length - 1]?.role === 'user'
    const lastUserTurnIndex = shouldGradeVoiceExchange
      ? turns.findLastIndex((t) => t.role === 'user')
      : -1
    setTurns((prev) => [...prev, turn])
    setTotalTurns((prev) => prev + 1)

    const persistVoiceTurn = !IS_MOCK
      ? fetch(`/api/live-interview/${sessionId}/voice-turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: cleanContent,
          role,
          turnIndex,
        }),
      })
      : null

    persistVoiceTurn?.then((res) => {
      if (!res.ok) {
        console.error('Failed to persist voice turn:', res.status)
        return
      }

      if (shouldGradeVoiceExchange && lastUserTurnIndex >= 0) {
        const artifactSnapshot = buildCurrentArtifactSnapshot()
        fetch(`/api/live-interview/${sessionId}/grade-turn`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recentTurns: localTurnsWithNewTurn.slice(-4).map((t) => ({
              role: t.role,
              content: t.content,
            })),
            turnIndex: lastUserTurnIndex,
            artifactSnapshot: artifactSnapshot ?? undefined,
          }),
        }).then((gradeRes) => {
          if (!gradeRes.ok) console.error('Async voice grade-turn failed:', gradeRes.status)
        }).catch((err) => {
          console.error('Async voice grade-turn failed:', err)
        })
      }
    }).catch((err) => {
      console.error('Failed to persist voice turn:', err)
    })

    const CLOSING_PHRASES = ["wrap up", "stop here", "covered good ground", "have what i need", "call it", "good session", "shall we stop", "want to stop"]
    const lower = cleanContent.toLowerCase()
    if (role === 'hatch' && CLOSING_PHRASES.some((phrase) => lower.includes(phrase))) {
      setTimeout(() => {
        setIsEnding(true)
        setInterviewPhase('ended')
        eventSourceRef.current?.close()
        fetch(`/api/live-interview/${sessionId}/end`, { method: 'POST' })
          .then(() => {
            window.dispatchEvent(new CustomEvent('profile-stats-updated', { detail: { source: 'live-interview' } }))
            router.push(`/live-interviews/${sessionId}/debrief`)
          })
          .catch(() => setError('Failed to generate debrief'))
      }, 2000)
    }

    if (role === 'user' && cleanContent) {
      const artifactSnapshot = buildCurrentArtifactSnapshot()

      const turnId = turn.id

      // turn_index for dedup/credit: this user turn is being appended at this
      // position in the local transcript.
      const userTurnIndex = turnIndex

      fetch(`/api/live-interview/${sessionId}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: cleanContent,
          role: 'user',
          turnIndex: userTurnIndex,
          ...(artifactSnapshot ? { artifactSnapshot } : {}),
        }),
      }).then((res) => res.ok ? res.json() : null).then((data) => {
        if (data?.flowMove) {
          setFlowCoverage((prev) => ({
            ...prev,
            [data.flowMove]: Math.min(1.0, (prev[data.flowMove as keyof typeof prev] ?? 0) + 0.15),
          }))
        }
        if (data?.artifactSignal) {
          // Patch the turn bubble with the artifact signal
          setTurns(prev => prev.map(t => t.id === turnId ? { ...t, artifactSignal: data.artifactSignal } : t))
        }
      }).catch(() => {})
    }
  }, [sessionId, router, totalTurns, buildCurrentArtifactSnapshot, turns])

  const handleAgentSpeaking = useCallback(() => {
    setHatchState('speaking')
    setCurrentCaption('')
  }, [])

  const handleAgentDoneSpeaking = useCallback(() => {
    setHatchState('listening')
    setTimeout(() => setCurrentCaption(''), 2000)
  }, [])

  const handleCanvasSnapshot = useCallback((scene: { elements: unknown[]; appState: unknown }) => {
    setCanvasScene(scene)
  }, [])

  const handleConnected = useCallback(() => {
    setIsVoiceActive(true)
    setIsVoiceAvailable(true)
    setHatchState('listening')
  }, [])

  const [voiceError, setVoiceError] = useState<string | null>(null)

  const handleVoiceError = useCallback((err: string) => {
    setVoiceError(err)
    setIsVoiceAvailable(false)
    setIsVoiceActive(false)
    setIsChatOpen(true)
  }, [])

  const handleSendChatMessage = useCallback(async (text: string) => {
    const userTurn: TranscriptTurn = { id: crypto.randomUUID(), role: 'user', content: text, source: 'chat' }
    setTurns((prev) => [...prev, userTurn])
    setTotalTurns((prev) => prev + 1)
    setHatchState('thinking')
    setIsThinking(true)

    if (IS_MOCK) {
      setTimeout(() => {
        const hatchReply: TranscriptTurn = {
          id: crypto.randomUUID(),
          role: 'hatch',
          content: "Hold on - you jumped straight to a solution. What's the actual problem here?",
          source: 'chat',
        }
        setTurns((prev) => [...prev, hatchReply])
        setTotalTurns((prev) => prev + 1)
        setHatchState('idle')
        setIsThinking(false)
      }, 800)
      return
    }

    try {
      const artifactSnapshot = buildCurrentArtifactSnapshot()
      const res = await fetch(`/api/live-interview/${sessionId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          artifactSnapshot: artifactSnapshot ?? undefined,
        }),
      })
      if (res.ok) {
        const { reply } = await res.json()
        const hatchTurn: TranscriptTurn = {
          id: crypto.randomUUID(),
          role: 'hatch',
          content: reply,
          source: 'chat',
        }
        setTurns((prev) => [...prev, hatchTurn])
        setTotalTurns((prev) => prev + 1)
      } else {
        setError(res.status === 410 ? 'This session has ended.' : await liveInterviewErrorMessage(res))
      }
    } catch {
      setError('Network error - check your connection.')
    } finally {
      setHatchState('idle')
      setIsThinking(false)
    }
  }, [buildCurrentArtifactSnapshot, sessionId])

  const requestHatchFeeler = useCallback(async (idleSeconds: number) => {
    if (interviewPhase !== 'active' || isThinking || isChatSending || isEnding) return

    const now = Date.now()
    if (now - lastFeelerAtRef.current < IDLE_FEELER_COOLDOWN_MS) return
    lastFeelerAtRef.current = now

    if (IS_MOCK) {
      const mockReply = "Still with me? Want a hint, a minute to think, or a quick break?"
      setTurns((prev) => [...prev, {
        id: crypto.randomUUID(),
        role: 'hatch',
        content: mockReply,
        source: 'chat',
      }])
      setTotalTurns((prev) => prev + 1)
      setCurrentCaption(mockReply)
      setIsChatOpen(true)
      return
    }

    setHatchState('thinking')
    setIsThinking(true)

    try {
      const artifactSnapshot = buildCurrentArtifactSnapshot()
      const res = await fetch(`/api/live-interview/${sessionId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'feeler',
          idleSeconds,
          artifactSnapshot: artifactSnapshot ?? undefined,
        }),
      })

      if (!res.ok) return

      const { reply } = await res.json()
      if (!reply) return

      const hatchTurn: TranscriptTurn = {
        id: crypto.randomUUID(),
        role: 'hatch',
        content: reply,
        source: 'chat',
      }
      setTurns((prev) => [...prev, hatchTurn])
      setTotalTurns((prev) => prev + 1)
      setCurrentCaption(reply)
      setIsChatOpen(true)
    } catch {
      // Silent feelers should never interrupt the interview with an error toast.
    } finally {
      setHatchState('idle')
      setIsThinking(false)
    }
  }, [
    buildCurrentArtifactSnapshot,
    interviewPhase,
    isChatSending,
    isEnding,
    isThinking,
    sessionId,
  ])

  const handleQuickChatMessage = useCallback(async (text: string) => {
    if (isChatSending || isThinking) return
    setIsChatOpen(true)
    setIsChatSending(true)
    try {
      await handleSendChatMessage(text)
    } finally {
      setIsChatSending(false)
    }
  }, [handleSendChatMessage, isChatSending, isThinking])

  useEffect(() => {
    if (idleFeelerTimerRef.current) {
      clearTimeout(idleFeelerTimerRef.current)
      idleFeelerTimerRef.current = null
    }

    const lastTurn = turns[turns.length - 1]
    if (
      interviewPhase !== 'active' ||
      !lastTurn ||
      lastTurn.role !== 'hatch' ||
      isThinking ||
      isChatSending ||
      isEnding ||
      chatInput.trim()
    ) {
      return
    }

    const sinceLastFeeler = Date.now() - lastFeelerAtRef.current
    const cooldownDelay = Math.max(0, IDLE_FEELER_COOLDOWN_MS - sinceLastFeeler)
    const delay = Math.max(IDLE_FEELER_DELAY_MS, cooldownDelay)

    idleFeelerTimerRef.current = setTimeout(() => {
      void requestHatchFeeler(Math.round(delay / 1000))
    }, delay)

    return () => {
      if (idleFeelerTimerRef.current) {
        clearTimeout(idleFeelerTimerRef.current)
        idleFeelerTimerRef.current = null
      }
    }
  }, [
    chatInput,
    interviewPhase,
    isChatSending,
    isEnding,
    isThinking,
    requestHatchFeeler,
    turns,
  ])

  const handleEndInterview = useCallback(() => {
    if (isEnding) return
    setShowEndConfirm(true)
  }, [isEnding])

  const confirmEndInterview = useCallback(async () => {
    setShowEndConfirm(false)
    setIsEnding(true)
    setInterviewPhase('ended')
    eventSourceRef.current?.close()
    if (IS_MOCK) {
      router.push(`/live-interviews/${sessionId}/debrief`)
      return
    }
    try {
      // Save artifact snapshot before ending so the end route can grade it
      if (centerMode !== 'orb' && sessionId) {
        const snapshot = buildCurrentArtifactSnapshot()
        try {
          if (snapshot) {
            await fetch(`/api/live-interview/${sessionId}/snapshot`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ artifactSnapshot: snapshot }),
            })
          }
        } catch {
          // Non-fatal - end still proceeds
        }
      }

      await fetch(`/api/live-interview/${sessionId}/end`, { method: 'POST' })
      window.dispatchEvent(new CustomEvent('profile-stats-updated', { detail: { source: 'live-interview' } }))
      router.push(`/live-interviews/${sessionId}/debrief`)
    } catch {
      setError('Failed to generate debrief')
      setIsEnding(false)
      setInterviewPhase('active')
    }
  }, [sessionId, router, centerMode, buildCurrentArtifactSnapshot])

  const latestSignalFocus = useMemo<FocusSurfaceEvent | null>(() => {
    const signal = recentSignals[0]
    if (!signal) return null
    return {
      id: `local-signal-${signal.id}`,
      kind: 'flow-signal',
      title: `${FLOW_NAMES[signal.flowMove] ?? signal.flowMove} signal detected`,
      body: signal.signal,
    }
  }, [recentSignals])

  const scenarioFocus = useMemo<FocusSurfaceEvent | null>(() => {
    if (!scenarioTitle && !discipline && !IS_MOCK) return null
    return {
      id: `scenario-${sessionId}`,
      kind: 'challenge',
      title: scenarioTitle ?? (IS_MOCK ? 'Mock interview challenge' : 'Interview challenge'),
      body: discipline
        ? `Keep the center of gravity on ${DISCIPLINE_META[discipline].label}. Hatch will watch for Frame, List, Optimize, and Win signals as the conversation develops.`
        : IS_MOCK
        ? 'Keep the prompt visible while you practice. As grading signals arrive, the most useful challenge context will stay centered here.'
        : 'Keep the challenge prompt visible while you work through the conversation.',
    }
  }, [discipline, scenarioTitle, sessionId])

  const activeFocusEvent = remoteFocusEvent ?? latestSignalFocus ?? scenarioFocus
  const activeFocusEventId = activeFocusEvent?.id ?? null
  const visibleFocusEvent = activeFocusEvent?.id === focusDismissedId ? null : activeFocusEvent

  useEffect(() => {
    if (!activeFocusEventId || activeFocusEventId === focusDismissedId) return
    setFocusCollapsed(false)
  }, [activeFocusEventId, focusDismissedId])

  // ─── Loading ───
  if (interviewPhase === 'loading') {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', zIndex: 200 }}
      >
        <div
          className="flex flex-col items-center gap-4 px-10 py-8"
          style={{
            background: '#1a2420',
            borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div
            className="w-8 h-8 rounded-full"
            style={{
              border: '2px solid rgba(74,124,89,0.2)',
              borderTopColor: '#4a7c59',
              animation: 'spin 1s linear infinite',
            }}
          />
          <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Starting interview session...
          </p>
        </div>
        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // ─── Ended / Generating Debrief ───
  if (interviewPhase === 'ended') {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#0d1410', zIndex: 200 }}>
        <div className="flex flex-col items-center gap-6 max-w-sm text-center px-6">
          <HatchGlyph size={80} state="reviewing" className="text-primary" />
          <div className="space-y-2">
            <h2
              className="font-headline text-2xl font-bold"
              style={{ color: 'rgba(243,237,224,0.95)' }}
            >
              Generating your debrief
            </h2>
            <p className="font-body text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Hatch is analyzing your interview across all four FLOW moves. Just a moment.
            </p>
          </div>
          <div className="w-64 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div
              className="h-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, #4a7c59, #7ee099)',
                animation: 'shimmer 2s ease-in-out infinite',
                backgroundSize: '200% 100%',
              }}
            />
          </div>
          <span className="font-label text-xs tabular-nums" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {timerDisplay} recorded
          </span>
          {error && (
            <div
              className="rounded-lg px-4 py-2 w-full"
              style={{ background: 'rgba(178,58,42,0.15)', border: '1px solid rgba(178,58,42,0.3)' }}
            >
              <p className="font-body text-sm" style={{ color: '#e37d4a' }}>{error}</p>
              <button
                onClick={() => { setError(null); setIsEnding(false); setInterviewPhase('active') }}
                className="text-xs underline mt-1"
                style={{ color: 'rgba(227,125,74,0.7)' }}
              >
                Return to interview
              </button>
            </div>
          )}
        </div>
        <style jsx>{`
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
      </div>
    )
  }

  // ─── Ready - modal overlay ───
  if (interviewPhase === 'ready') {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', zIndex: 200 }}
        onClick={(e) => { if (e.target === e.currentTarget) router.push('/live-interviews') }}
      >
        <div
          className="relative flex flex-col items-center gap-5 text-center mx-4 w-full"
          style={{
            maxWidth: 420,
            background: '#1a2420',
            borderRadius: 20,
            padding: '32px 32px 28px',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
            animation: 'fadeUp 0.25s ease-out',
          }}
        >
          {/* Close button */}
          <button
            onClick={() => router.push('/live-interviews')}
            className="absolute top-4 right-4 flex items-center justify-center rounded-full transition-colors"
            style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.07)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.14)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)' }}
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[18px]" style={{ color: 'rgba(255,255,255,0.5)' }}>close</span>
          </button>

          <HatchGlyph size={64} state="idle" className="text-primary" />

          {/* Company / discipline / role tags */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {companyName && (
              <span
                className="rounded-full px-3 py-1 font-label text-xs font-semibold"
                style={{ background: 'rgba(74,124,89,0.2)', color: 'rgba(126,224,153,0.85)' }}
              >
                {companyName}
              </span>
            )}
            {discipline && (
              <span className="font-label text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {DISCIPLINE_META[discipline].label}
              </span>
            )}
            {roleName && (
              <span className="font-label text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                · {roleName}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <h2 className="font-headline text-xl font-bold" style={{ color: 'rgba(243,237,224,0.95)' }}>
              Ready to begin?
            </h2>
            <p className="font-body text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Hatch will play the role of your interviewer. Speak naturally - your microphone
              activates when you start. Cover all four FLOW moves: Frame, List, Optimize, Win.
            </p>
          </div>

          {error && (
            <div
              className="rounded-lg px-4 py-2 w-full"
              style={{ background: 'rgba(178,58,42,0.15)', border: '1px solid rgba(178,58,42,0.3)' }}
            >
              <p className="font-body text-sm" style={{ color: '#e37d4a' }}>{error}</p>
            </div>
          )}

          {/* Mic notice */}
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2 w-full"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <span className="material-symbols-outlined text-[16px]" style={{ color: 'rgba(255,255,255,0.3)' }}>mic</span>
            <span className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Your browser will request microphone access when you start.
            </span>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 w-full pt-1">
            <button
              onClick={handleStartInterview}
              className="w-full rounded-full py-3 font-label font-semibold text-base transition-opacity hover:opacity-90"
              style={{ background: '#4a7c59', color: '#ffffff' }}
            >
              Start Interview
            </button>
            <button
              onClick={() => router.push('/live-interviews')}
              className="w-full rounded-full py-2.5 font-label text-sm font-semibold transition-colors"
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
            >
              ← Back to interviews
            </button>
          </div>
        </div>

        <style jsx>{`
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    )
  }

  // ─── Active Interview ───
  const flowMoves = [
    { key: 'frame' as const, label: 'F', name: 'Frame' },
    { key: 'list' as const, label: 'L', name: 'List' },
    { key: 'optimize' as const, label: 'O', name: 'Optimize' },
    { key: 'win' as const, label: 'W', name: 'Win' },
  ]

  const hatchStateLabel =
    hatchState === 'speaking'
      ? 'Hatch is speaking'
      : hatchState === 'listening'
      ? 'Listening'
      : isThinking
      ? 'Hatch is thinking…'
      : 'Interview active'

  const captionText =
    hatchState === 'speaking'
      ? currentCaption || '...'
      : isThinking
      ? 'processing your response…'
      : hatchState === 'listening'
      ? 'speak when ready'
      : ''

  const captionIsItalic = hatchState !== 'speaking'
  const showTranscriptPanel = isTranscriptOpen && !isFocusMode
  const showFlowPanel = isFlowPanelOpen && !isFocusMode

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ background: '#0d1410', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200 }}
    >
      <style jsx global>{`
        @keyframes orbRingAnim {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.35); opacity: 0; }
        }
        @keyframes wavebarAnim {
          0% { transform: scaleY(0.4); }
          100% { transform: scaleY(1); }
        }
        @keyframes floatHatchAnim {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes blinkAnim {
          0%, 90%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.1); }
        }
        @keyframes pulseSoft {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmerBar {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes spinAnim {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Loop progress bar - shown when this session is part of a loop */}
      {loopRounds.length > 0 && loopIdParam && (
        <LoopProgressBar
          loopTitle={companyName ? `${companyName} Loop` : 'Interview Loop'}
          rounds={loopRounds}
          currentRoundIndex={parseInt(roundIndexParam ?? '0', 10)}
          onPause={async () => {
            // Close SSE stream before navigating to prevent "Lock broken by another request" AbortError
            if (eventSourceRef.current) {
              eventSourceRef.current.close()
              eventSourceRef.current = null
            }
            await fetch(`/api/live-interview/${sessionId}/pause`, { method: 'POST' })
            router.push(`/live-interviews/loop/${loopIdParam}`)
          }}
        />
      )}

      {/* Mock banner */}
      {IS_MOCK && (
        <div
          className="shrink-0 text-center py-1 px-4"
          style={{ background: 'rgba(201,147,58,0.15)', borderBottom: '1px solid rgba(201,147,58,0.25)' }}
        >
          <span className="font-label text-xs font-semibold" style={{ color: '#c9933a' }}>
            Mock Mode - Voice disabled
          </span>
        </div>
      )}

      {/* ── Top Bar (52px) ── */}
      <div
        className="shrink-0 flex items-center justify-between px-4"
        style={{
          height: 52,
          background: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {/* Left */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            onClick={() => router.push('/live-interviews')}
            className="flex items-center justify-center rounded-full transition-colors"
            style={{
              width: 32,
              height: 32,
              background: 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.6)',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.16)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)' }}
            aria-label="Back"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          </button>

          {companyName && (
            <span
              className="max-w-[120px] truncate rounded-full px-2.5 py-0.5 font-label text-xs font-semibold sm:max-w-none"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)' }}
            >
              {companyName}
            </span>
          )}
          {discipline && (
            <span className="hidden font-label text-sm font-semibold sm:inline" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {DISCIPLINE_META[discipline].label}
            </span>
          )}
          {roleName && (
            <span className="hidden font-label text-xs md:inline" style={{ color: 'rgba(255,255,255,0.45)' }}>
              · {roleName}
            </span>
          )}

          {/* LIVE indicator */}
          <div
            className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5"
            style={{ background: 'rgba(126,224,153,0.1)', border: '1px solid rgba(126,224,153,0.2)' }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: '#7ee099',
                animation: interviewPhase === 'active' ? 'pulseSoft 1.5s ease-in-out infinite' : 'none',
              }}
            />
            <span className="font-label text-[10.5px] font-semibold" style={{ color: '#7ee099' }}>
              LIVE
            </span>
          </div>
        </div>

        {/* Center - Timer */}
        <div
          className="shrink-0 rounded-full px-3 py-1 font-mono tabular-nums sm:px-4"
          style={{
            fontSize: 20,
            fontWeight: 500,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: isWarning ? '#e37d4a' : 'rgba(243,237,224,0.85)',
          }}
        >
          {timerDisplay}
        </div>

        {/* Right — FLOW mini-bars */}
        <div className="hidden items-center gap-4 sm:flex">
          {flowMoves.map(({ key, label }) => {
            const score = flowCoverage[key] ?? 0
            const color = FLOW_COLORS[key]
            const active = score > 0.5
            return (
              <div key={key} className="flex flex-col items-center gap-1">
                <span
                  className="font-label font-bold"
                  style={{
                    fontSize: 11,
                    color: active ? color : 'rgba(255,255,255,0.3)',
                    letterSpacing: '0.05em',
                  }}
                >
                  {label}
                </span>
                <div
                  className="rounded-full overflow-hidden"
                  style={{ width: 24, height: 3, background: 'rgba(255,255,255,0.1)' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${score * 100}%`,
                      background: active ? color : 'rgba(255,255,255,0.25)',
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Error / Voice-error banner */}
      {(error || voiceError) && (
        <div
          className="shrink-0 flex items-center justify-between px-4 py-1.5 mx-4 mt-2 rounded-lg"
          style={{
            background: error ? 'rgba(178,58,42,0.12)' : 'rgba(112,92,48,0.12)',
            border: `1px solid ${error ? 'rgba(178,58,42,0.25)' : 'rgba(112,92,48,0.2)'}`,
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-[18px]"
              style={{ color: error ? '#e37d4a' : '#c9933a' }}
            >
              {error ? 'error' : 'headset_off'}
            </span>
            <p className="font-body text-sm" style={{ color: error ? '#e37d4a' : '#c9933a' }}>
              {error ?? voiceError}
            </p>
          </div>
          <button
            onClick={() => { setError(null); setVoiceError(null) }}
            style={{ color: 'rgba(255,255,255,0.3)' }}
            aria-label="Dismiss"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* ── Body: 3-column ── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">

        {/* LEFT: Transcript (320px) */}
        <PresencePanel isOpen={showTranscriptPanel} className="hidden shrink-0 lg:flex">
          <CollapsiblePanel
            open
            onOpenChange={setIsTranscriptOpen}
            title="Transcript"
            icon="notes"
            className="h-full w-[320px] border-r border-white/10"
            headerClassName="px-4 pt-3 pb-2 font-label text-[10.5px] font-semibold uppercase tracking-widest text-white/25 [&_button]:text-white/35 [&_button:hover]:bg-white/10"
            bodyClassName="flex flex-col"
          >
            <div
              ref={transcriptRef}
              className="flex-1 overflow-y-auto px-4 pb-4"
              style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}
            >
              {turns.length === 0 ? (
                <p
                  className="font-body text-sm text-center mt-8"
                  style={{ color: 'rgba(255,255,255,0.2)' }}
                >
                  Conversation will appear here
                </p>
              ) : (
                turns.map((turn) => <TurnBubble key={turn.id} turn={turn} />)
              )}
            </div>
          </CollapsiblePanel>
        </PresencePanel>

        {/* CENTER: Hatch orb / canvas / editor */}
        <div
          className="flex-1 flex flex-col items-center justify-center relative overflow-hidden"
          style={{ minWidth: 0 }}
        >
          {/* Ambient radial glow - always visible */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(600px at 50% 40%, rgba(74,124,89,0.1), transparent)',
            }}
          />
          {/* Dot grid */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
              opacity: 0.4,
            }}
          />

          {/* Mode badge (top right) */}
          <div
            className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 z-10"
            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <span className="material-symbols-outlined text-[14px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {centerMode === 'orb' ? (isVoiceAvailable ? 'mic' : 'chat') : centerMode === 'canvas' ? 'draw' : 'code'}
            </span>
            <span className="font-label text-[10.5px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {centerMode === 'orb' ? (isVoiceAvailable ? 'Voice mode' : 'Chat mode') : centerMode === 'canvas' ? 'Canvas' : 'Editor'}
            </span>
          </div>

          <div className="absolute left-1/2 top-14 z-20 w-[min(620px,calc(100%-32px))] -translate-x-1/2">
            <FocusSurface
              event={visibleFocusEvent}
              collapsed={focusCollapsed}
              onCollapsedChange={setFocusCollapsed}
              onDismiss={() => {
                if (activeFocusEvent) setFocusDismissedId(activeFocusEvent.id)
              }}
              tone="dark"
            />
          </div>

          {centerMode === 'orb' && (
            <div className="relative z-10 flex flex-col items-center gap-4">
              <div style={{ animation: 'floatHatchAnim 5s ease-in-out infinite' }}>
                <HatchConversationMascot state={hatchState === 'speaking' ? 'speaking' : 'listening'} />
              </div>
              <span
                className="font-label uppercase tracking-widest text-[12px]"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                {hatchStateLabel}
              </span>
              {isCaptionsOn && captionText && (
                <div
                  className="max-w-[560px] px-5 py-3 text-center rounded-xl"
                  style={{
                    background: 'rgba(0,0,0,0.55)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    animation: 'fadeUp 0.3s ease-out',
                  }}
                >
                  <p
                    className="font-body"
                    style={{
                      fontSize: 15,
                      fontStyle: captionIsItalic ? 'italic' : 'normal',
                      color: captionIsItalic ? 'rgba(255,255,255,0.4)' : 'rgba(243,237,224,0.9)',
                      lineHeight: 1.5,
                    }}
                  >
                    {captionText}
                  </p>
                </div>
              )}
            </div>
          )}

          {centerMode === 'canvas' && (
            <div className="absolute inset-0">
              <ExcalidrawCanvas
                sessionId={sessionId}
                onSnapshot={handleCanvasSnapshot}
                initialData={canvasScene ?? undefined}
              />
            </div>
          )}

          {centerMode === 'editor' && (
            <div className="absolute inset-0 flex flex-col">
              <MonacoCodeEditor
                value={currentCode}
                onChange={(val) => setCurrentCode(val ?? '')}
                language={currentLanguage}
                theme="vs-dark"
                height="100%"
                onPaste={(event) => setEditorPasteEvents((prev) => [...prev.slice(-4), event])}
                onCursorMove={(line) => setEditorCursorLine(line)}
              />
            </div>
          )}

          {/* Hatch pip - shown when workspace is active */}
          {centerMode !== 'orb' && (
            <div
              className="absolute bottom-4 left-4 z-20 flex items-center justify-center"
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'rgba(13,20,16,0.9)',
                border: `1px solid ${hatchState === 'listening' ? 'rgba(74,124,89,0.6)' : 'rgba(255,255,255,0.1)'}`,
                boxShadow: hatchState === 'listening' ? '0 0 12px rgba(74,124,89,0.4)' : 'none',
                transition: 'border-color 0.3s, box-shadow 0.3s',
                pointerEvents: 'none',
              }}
            >
              <HatchGlyph
                size={28}
                state={
                  hatchState === 'thinking'
                    ? 'reviewing'
                    : hatchState
                }
              />
            </div>
          )}
        </div>

        {/* RIGHT: FLOW HUD (280px) */}
        <PresencePanel isOpen={showFlowPanel} className="hidden shrink-0 lg:flex">
          <CollapsiblePanel
            open
            onOpenChange={setIsFlowPanelOpen}
            title="FLOW Coverage"
            icon="analytics"
            className="h-full w-[280px] border-l border-white/10 bg-black/15"
            headerClassName="px-4 pt-4 pb-3 font-label text-[10.5px] font-semibold uppercase tracking-widest text-white/25 [&_button]:text-white/35 [&_button:hover]:bg-white/10"
            bodyClassName="flex flex-col"
          >
            <div className="shrink-0 px-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex flex-col gap-3">
                {flowMoves.map(({ key, name }) => {
                  const score = flowCoverage[key] ?? 0
                  const pct = Math.round(score * 100)
                  const color = FLOW_COLORS[key]
                  const active = score > 0.5
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px]" style={{ color: active ? color : 'rgba(255,255,255,0.25)' }}>
                            {key === 'frame' ? 'frame_inspect' : key === 'list' ? 'list' : key === 'optimize' ? 'tune' : 'emoji_events'}
                          </span>
                          <span className="font-label text-[12px] font-semibold" style={{ color: active ? 'rgba(243,237,224,0.85)' : 'rgba(255,255,255,0.35)' }}>
                            {name}
                          </span>
                        </div>
                        <span className="font-label text-[11px] tabular-nums" style={{ color: active ? color : 'rgba(255,255,255,0.25)' }}>
                          {pct}%
                        </span>
                      </div>
                      <AnimatedProgress
                        value={pct}
                        state={active ? 'complete' : pct > 0 ? 'active' : 'idle'}
                        trackClassName="h-[5px] bg-white/10"
                        barStyle={{
                          background: color,
                          boxShadow: active ? `0 0 8px ${color}88` : 'none',
                        }}
                      />
                    </div>
                  )
                })}
              </div>

              {/* Overall score card */}
              <div
                className="mt-4 rounded-xl p-3 flex items-center justify-between"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div>
                  <p className="font-label text-[11px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    Overall signal
                  </p>
                  <p
                    className="font-label text-[12px] font-semibold mt-0.5"
                    style={{ color: overallScore >= 60 ? '#7ee099' : overallScore >= 35 ? '#c9933a' : 'rgba(255,255,255,0.4)' }}
                  >
                    {overallScore >= 60 ? 'Strong' : overallScore >= 35 ? 'Building' : 'Developing'}
                  </p>
                </div>
                <span
                  className="font-headline font-bold"
                  style={{ fontSize: 28, color: 'rgba(243,237,224,0.9)' }}
                >
                  {overallScore}
                  <span className="font-label font-normal text-[13px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    /100
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <span className="material-symbols-outlined text-[12px]" style={{ color: 'rgba(255,255,255,0.25)' }}>swap_horiz</span>
                <span className="font-label text-[10.5px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  {totalTurns} exchanges
                </span>
              </div>
            </div>

            {/* Recent signals - scrollable */}
            <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
              <span
                className="font-label font-semibold tracking-widest uppercase mb-2 block"
                style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.25)' }}
              >
                Recent Signals
              </span>

              {recentSignals.length === 0 ? (
                <p
                  className="font-body text-[12px] text-center mt-4"
                  style={{ color: 'rgba(255,255,255,0.2)' }}
                >
                  Signals appear as you answer
                </p>
              ) : (
                recentSignals.map((s) => (
                  <motion.div
                    key={s.id}
                    layout
                    className="rounded-[10px] p-3 mb-2"
                    style={{
                      background: `${FLOW_COLORS[s.flowMove] ?? '#4a7c59'}12`,
                      border: `1px solid ${FLOW_COLORS[s.flowMove] ?? '#4a7c59'}25`,
                    }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: FLOW_COLORS[s.flowMove] ?? '#4a7c59' }} />
                        <span
                          className="font-label text-[11px] font-semibold uppercase tracking-wider"
                          style={{ color: FLOW_COLORS[s.flowMove] ?? '#4a7c59' }}
                        >
                          {FLOW_NAMES[s.flowMove] ?? s.flowMove}
                        </span>
                        {s.competency && (
                          <span className="font-label text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                            · {COMPETENCY_LABELS[s.competency] ?? s.competency}
                          </span>
                        )}
                      </div>
                      <span className="material-symbols-outlined text-[14px]" style={{ color: '#7ee099' }}>thumb_up</span>
                    </div>
                    <p className="font-body text-[12px] leading-[1.5]" style={{ color: 'rgba(243,237,224,0.7)' }}>
                      {s.signal}
                    </p>
                    <p className="font-label text-[11px] mt-1.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      {totalTurns} exchanges · {Math.round((Date.now() - s.time) / 60000)}m ago
                    </p>
                  </motion.div>
                ))
              )}

              {/* Prior round recap - only visible in loop sessions */}
              {previousRound && (
                <div className="mt-3">
                  <PriorRoundRecap previousRound={previousRound} />
                </div>
              )}
            </div>
          </CollapsiblePanel>
        </PresencePanel>
      </div>

      {/* ── Controls Bar (96px) ── */}
      <div
        className="shrink-0 flex items-center justify-center"
        style={{
          height: 96,
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div className="flex max-w-full items-center gap-3 overflow-x-auto px-4">
          {isVoiceAvailable && (
            <CtrlBtn
              icon={isMuted ? 'mic_off' : 'mic'}
              label={isMuted ? 'Unmuted' : 'Mute'}
              active={!isMuted && isVoiceActive}
              onClick={() => setIsMuted((m) => !m)}
            />
          )}

          <CtrlBtn
            icon="pause"
            label="Break"
            onClick={() => { void handleQuickChatMessage('Can we take a quick break?') }}
          />

          <CtrlBtn
            icon="closed_caption"
            label="Captions"
            active={isCaptionsOn}
            onClick={() => setIsCaptionsOn((c) => !c)}
          />

          <CtrlBtn
            icon="notes"
            label="Transcript"
            active={showTranscriptPanel}
            onClick={() => {
              setIsFocusMode(false)
              setIsTranscriptOpen((open) => !open)
            }}
          />

          <CtrlBtn
            icon="analytics"
            label="FLOW"
            active={showFlowPanel}
            onClick={() => {
              setIsFocusMode(false)
              setIsFlowPanelOpen((open) => !open)
            }}
          />

          <CtrlBtn
            icon="chat"
            label="Chat"
            active={isChatOpen}
            onClick={() => setIsChatOpen((o) => !o)}
          />

          <CtrlBtn
            icon="center_focus_strong"
            label="Focus"
            active={isFocusMode}
            onClick={() => {
              setIsFocusMode((focused) => !focused)
              if (activeFocusEvent) setFocusDismissedId(null)
            }}
          />

          {/* Canvas button - system_design or data_modeling rounds */}
          {(discipline === 'system_design' || discipline === 'data_modeling') && (
            <CtrlBtn
              icon="draw"
              label={centerMode === 'canvas' ? 'Hide Canvas' : 'Canvas'}
              active={centerMode === 'canvas'}
              onClick={() => setCenterMode(m => m === 'canvas' ? 'orb' : 'canvas')}
            />
          )}

          {/* Editor button - coding + sql rounds */}
          {(discipline === 'coding' || discipline === 'sql') && (
            <CtrlBtn
              icon={discipline === 'sql' ? 'terminal' : 'code'}
              label={centerMode === 'editor' ? 'Hide Editor' : 'Editor'}
              active={centerMode === 'editor'}
              onClick={() => setCenterMode(m => m === 'editor' ? 'orb' : 'editor')}
            />
          )}

          {/* Divider */}
          <div
            className="rounded-full"
            style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.1)' }}
          />

          <CtrlBtn
            icon="call_end"
            label="End"
            danger
            large
            onClick={handleEndInterview}
          />
        </div>
      </div>

      {/* ── Chat Slide-in Panel (340px) ── */}
      <PresencePanel
        isOpen={isChatOpen}
        className="fixed top-0 right-0 h-full flex flex-col z-40"
        initial={{ opacity: 0, x: 36 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 36 }}
        style={{
          width: 340,
          background: 'rgba(13,20,16,0.97)',
          backdropFilter: 'blur(16px)',
          borderLeft: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {/* Chat header */}
        <div
          className="shrink-0 flex items-center justify-between px-4 py-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]" style={{ color: '#4a7c59' }}>chat</span>
            <span className="font-label font-semibold text-sm" style={{ color: 'rgba(243,237,224,0.85)' }}>
              Chat mode
            </span>
          </div>
          <button
            onClick={() => setIsChatOpen(false)}
            className="flex items-center justify-center rounded-full w-8 h-8 transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)' }}
            aria-label="Close chat"
          >
            <span className="material-symbols-outlined text-[16px]" style={{ color: 'rgba(255,255,255,0.5)' }}>close</span>
          </button>
        </div>

        {/* Messages */}
        <div
          ref={chatListRef}
          className="flex-1 overflow-y-auto px-4 py-4"
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}
        >
          {turns.length === 0 && !isThinking ? (
            <p
              className="font-body text-sm text-center mt-8"
              style={{ color: 'rgba(255,255,255,0.25)' }}
            >
              Type to respond to Hatch instead of speaking.
            </p>
          ) : (
            <>
              {turns.map((turn) => (
                <div
                  key={turn.id}
                  className={cn('flex flex-col mb-3', turn.role === 'user' ? 'items-end' : 'items-start')}
                >
                  <span className="font-label text-[10.5px] mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {turn.role === 'hatch' ? 'Hatch' : 'You'}
                  </span>
                  <div
                    className="px-3 py-2 font-body text-sm leading-relaxed max-w-[85%]"
                    style={
                      turn.role === 'hatch'
                        ? {
                            background: 'rgba(74,124,89,0.18)',
                            border: '1px solid rgba(74,124,89,0.22)',
                            borderRadius: '10px 10px 10px 3px',
                            color: 'rgba(243,237,224,0.88)',
                          }
                        : {
                            background: 'rgba(255,255,255,0.09)',
                            border: '1px solid rgba(255,255,255,0.07)',
                            borderRadius: '10px 10px 3px 10px',
                            color: 'rgba(243,237,224,0.88)',
                          }
                    }
                  >
                    {turn.role === 'hatch' ? <Md variant="chat">{turn.content}</Md> : turn.content}
                  </div>
                </div>
              ))}
              {isThinking && (
                <div className="flex flex-col items-start mb-3">
                  <span className="font-label text-[10.5px] mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Hatch</span>
                  <div
                    className="px-3 py-2"
                    style={{
                      background: 'rgba(74,124,89,0.18)',
                      border: '1px solid rgba(74,124,89,0.22)',
                      borderRadius: '10px 10px 10px 3px',
                    }}
                  >
                    <span className="inline-flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="rounded-full"
                          style={{
                            width: 6,
                            height: 6,
                            background: 'rgba(126,224,153,0.6)',
                            display: 'inline-block',
                            animation: `bounce 1s ease-in-out ${i * 0.15}s infinite`,
                          }}
                        />
                      ))}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Suggestion chips */}
        <div className="shrink-0 flex gap-2 flex-wrap px-4 pb-2">
          {["I'm here", 'Give me a hint', 'I need a minute', 'Can we take a quick break?'].map((chip) => (
            <button
              key={chip}
              type="button"
              disabled={isChatSending || isThinking}
              onClick={() => { void handleQuickChatMessage(chip) }}
              className="rounded-full px-3 py-1 font-label text-[11px] transition-colors"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.09)',
                color: isChatSending || isThinking ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.5)',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.11)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)' }}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input */}
        <form
          className="shrink-0 flex items-center gap-2 px-4 py-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
          onSubmit={async (e) => {
            e.preventDefault()
            const text = chatInput.trim()
            if (!text || isChatSending) return
            setIsChatSending(true)
            setChatInput('')
            try { await handleSendChatMessage(text) } finally { setIsChatSending(false) }
          }}
        >
          <input
            ref={chatInputRef}
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            disabled={isChatSending}
            placeholder="Type a message..."
            className="flex-1 rounded-full px-4 py-2 font-body text-sm focus:outline-none disabled:opacity-50"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(243,237,224,0.88)',
            }}
          />
          <button
            type="submit"
            disabled={isChatSending || !chatInput.trim()}
            className="flex items-center justify-center rounded-full disabled:opacity-40"
            style={{ width: 38, height: 38, background: '#4a7c59' }}
            aria-label="Send"
          >
            <span className="material-symbols-outlined text-[18px]" style={{ color: '#fff' }}>send</span>
          </button>
        </form>
      </PresencePanel>

      {ENABLE_DIRECT_VOICE_AGENT && (
        <DeepgramVoiceSession
          ref={voiceSessionRef}
          sessionId={sessionId}
          isMuted={isMuted}
          onTranscript={handleTranscript}
          onAgentSpeaking={handleAgentSpeaking}
          onAgentDoneSpeaking={handleAgentDoneSpeaking}
          onConnected={handleConnected}
          onError={handleVoiceError}
          onAnalyserReady={(analyser) => talkingHeadRef.current?.setAnalyser(analyser)}
          disabled={IS_MOCK || interviewPhase !== 'active'}
        />
      )}

      {/* Interview limit modal */}
      {showLimitModal && (
        <InterviewLimitModal
          used={interviewUsageData.used}
          limit={interviewUsageData.limit}
          onUpgrade={startUpgrade}
          onEndSession={() => {
            setShowLimitModal(false)
            handleEndInterview()
          }}
        />
      )}

      {/* End confirm modal */}
      {showEndConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
        >
          <div
            className="flex flex-col items-center gap-5 text-center mx-4 p-6"
            style={{
              background: '#1a2420',
              borderRadius: 20,
              maxWidth: 380,
              width: '100%',
              border: '1px solid rgba(255,255,255,0.08)',
              animation: 'fadeUp 0.25s ease-out',
            }}
          >
            <HatchGlyph size={56} state="reviewing" className="text-primary" />
            <div>
              <h3 className="font-headline text-lg font-bold" style={{ color: 'rgba(243,237,224,0.95)' }}>
                End this interview?
              </h3>
              <p className="font-body text-sm mt-1 leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Hatch will analyze your performance and generate a detailed debrief.
              </p>
            </div>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="flex-1 py-2.5 rounded-full font-label text-sm font-semibold transition-colors"
                style={{
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(243,237,224,0.6)',
                  background: 'transparent',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
              >
                Keep going
              </button>
              <button
                onClick={confirmEndInterview}
                className="flex-1 py-2.5 rounded-full font-label text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ background: '#b23a2a', color: '#fff' }}
              >
                End &amp; debrief
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  )
}

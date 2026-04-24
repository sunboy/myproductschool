'use client'

import { Component, use, useCallback, useEffect, useRef, useState } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import HatchAvatar, { type HatchAvatarState } from '@/components/live-interview/HatchAvatar'
import dynamic from 'next/dynamic'
import DeepgramVoiceSession from '@/components/live-interview/DeepgramVoiceSession'
import type { TalkingHeadHandle } from '@/components/live-interview/TalkingHeadAvatar'

const TalkingHeadAvatar = dynamic(
  () => import('@/components/live-interview/TalkingHeadAvatar'),
  { ssr: false }
)

import { HatchGlyph } from '@/components/shell/HatchGlyph'
import { useInterviewTimer } from '@/hooks/useInterviewTimer'
import { InterviewLimitModal } from '@/components/paywalls/InterviewLimitModal'
import { useUpgrade } from '@/hooks/useUpgrade'
import { useEntitlements } from '@/hooks/useEntitlements'
import { parseGradingSignal } from '@/lib/live-interview/parse-grading-signal'
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

// ─── Hatch Orb ───
function HatchOrb({ state }: { state: HatchAvatarState }) {
  const isActive = state === 'speaking' || state === 'listening'
  const isSpeaking = state === 'speaking'

  return (
    <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
      {/* Expanding rings */}
      {isActive && (
        <>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: 200,
                height: 200,
                border: '1px solid rgba(74,124,89,0.4)',
                animation: `orbRing 2s ease-out ${i * 0.6}s infinite`,
              }}
            />
          ))}
        </>
      )}

      {/* Main orb */}
      <div
        className="relative rounded-full flex items-center justify-center overflow-hidden"
        style={{
          width: 200,
          height: 200,
          background: isSpeaking
            ? 'radial-gradient(circle at 40% 35%, #6fa87a, #3a6347 50%, #1e3a28)'
            : 'radial-gradient(circle at 40% 35%, #527a60, #2d5240 50%, #162a20)',
          boxShadow: isSpeaking
            ? '0 0 60px rgba(74,124,89,0.5), 0 0 120px rgba(74,124,89,0.2)'
            : isActive
            ? '0 0 30px rgba(74,124,89,0.25)'
            : '0 0 20px rgba(74,124,89,0.1)',
          animation: 'floatHatch 5s ease-in-out infinite',
          transition: 'box-shadow 0.5s ease',
        }}
      >
        {/* Wave bars when speaking */}
        {isSpeaking && (
          <div className="flex items-end gap-1" style={{ height: 40 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-full"
                style={{
                  width: 5,
                  height: 24,
                  background: 'rgba(126,224,153,0.7)',
                  animation: `wavebar 0.6s ease-in-out ${i * 0.1}s infinite alternate`,
                }}
              />
            ))}
          </div>
        )}

        {/* Hatch face — simple glowing eyes */}
        {!isSpeaking && (
          <div className="flex flex-col items-center gap-3">
            <div className="flex gap-4">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="rounded-full"
                  style={{
                    width: 10,
                    height: 10,
                    background: state === 'listening' ? '#7ee099' : 'rgba(126,224,153,0.5)',
                    boxShadow: state === 'listening' ? '0 0 8px #7ee099' : 'none',
                    animation: 'blink 3s ease-in-out infinite',
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes orbRing {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.35); opacity: 0; }
        }
        @keyframes wavebar {
          0% { transform: scaleY(0.4); }
          100% { transform: scaleY(1); }
        }
        @keyframes floatHatch {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes blink {
          0%, 90%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.1); }
        }
      `}</style>
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
          {turn.content}
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
export default function SessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ company?: string; role?: string; autostart?: string }>
}) {
  const { id } = use(params)
  const { company, role: roleParam, autostart } = use(searchParams)
  const router = useRouter()
  const { startUpgrade } = useUpgrade()
  const { isPro, isAdmin } = useEntitlements()

  const [sessionId, setSessionId] = useState<string>(IS_MOCK ? 'mock-session-id' : id)
  const [systemPrompt, setSystemPrompt] = useState('')
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
  const [isEnding, setIsEnding] = useState(false)
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [interviewUsageData, setInterviewUsageData] = useState<{ used: number; limit: number }>({ used: 1, limit: 5 })
  const [currentCaption, setCurrentCaption] = useState('')
  const [recentSignals, setRecentSignals] = useState<Array<CoachingSignal & { id: string; time: number }>>([])
  const talkingHeadRef = useRef<TalkingHeadHandle | null>(null)
  const transcriptRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<HTMLInputElement>(null)
  const [chatInput, setChatInput] = useState('')
  const [isChatSending, setIsChatSending] = useState(false)
  const chatListRef = useRef<HTMLDivElement>(null)

  const eventSourceRef = useRef<EventSource | null>(null)
  const lastSignalTurnIndexRef = useRef<number>(-1)

  const { formatted: timerDisplay, isWarning, isLimitReached } = useInterviewTimer(
    interviewStartedAt,
    interviewPhase === 'active',
    isPro || isAdmin ? undefined : 30
  )

  // Overall score derived from flow coverage
  const overallScore = Math.round(
    ((flowCoverage.frame + flowCoverage.list + flowCoverage.optimize + flowCoverage.win) / 4) * 100
  )

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

  // Start session — if autostart=1 the session was already created by StartInterviewButton
  // so we use the id directly and skip the POST, going straight to active.
  useEffect(() => {
    if (IS_MOCK) return
    const isAutostart = autostart === '1'

    if (isAutostart) {
      // Session already exists; company/role passed via query params
      setCompanyName(company ?? '')
      setRoleName(roleParam ?? '')
      // Recover systemPrompt stashed by StartInterviewButton before navigation
      const stored = sessionStorage.getItem(`hatch_prompt_${id}`)
      if (stored) {
        setSystemPrompt(stored)
        sessionStorage.removeItem(`hatch_prompt_${id}`)
      }
      setInterviewPhase('active')
      setInterviewStartedAt(Date.now())
      return
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
        setSystemPrompt(data.systemPrompt ?? '')
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
            const { turnIndex: _, ...signalData } = data.latestSignal
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
        if (data.sessionPhase === 'done' && !isEnding) {
          setTimeout(() => {
            setIsEnding(true)
            setInterviewPhase('ended')
            es.close()
            fetch(`/api/live-interview/${sessionId}/end`, { method: 'POST' })
              .then(() => router.push(`/live-interviews/${sessionId}/debrief`))
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
      navigator.sendBeacon(
        `/api/live-interview/${sessionId}/end`,
        new Blob([JSON.stringify({ abandoned: true })], { type: 'application/json' })
      )
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [interviewPhase, sessionId])

  useEffect(() => {
    if (isLimitReached && interviewPhase === 'active' && !showLimitModal) {
      setShowLimitModal(true)
      setIsMuted(true)
    }
  }, [isLimitReached, interviewPhase, showLimitModal])

  const handleTranscript = useCallback((text: string, role: 'hatch' | 'user') => {
    const { cleanContent, signal } = parseGradingSignal(text)
    if (!cleanContent) return

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
    setTurns((prev) => [...prev, turn])
    setTotalTurns((prev) => prev + 1)
    if (role === 'hatch') setHatchState('idle')

    const CLOSING_PHRASES = ["wrap up", "stop here", "covered good ground", "have what i need", "call it", "good session", "shall we stop", "want to stop"]
    const lower = cleanContent.toLowerCase()
    if (role === 'hatch' && CLOSING_PHRASES.some((phrase) => lower.includes(phrase))) {
      setTimeout(() => {
        setIsEnding(true)
        setInterviewPhase('ended')
        eventSourceRef.current?.close()
        fetch(`/api/live-interview/${sessionId}/end`, { method: 'POST' })
          .then(() => router.push(`/live-interviews/${sessionId}/debrief`))
          .catch(() => setError('Failed to generate debrief'))
      }, 2000)
    }

    if (role === 'user' && cleanContent) {
      fetch(`/api/live-interview/${sessionId}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: cleanContent, role: 'user' }),
      }).then((res) => res.ok ? res.json() : null).then((data) => {
        if (data?.flowMove) {
          setFlowCoverage((prev) => ({
            ...prev,
            [data.flowMove]: Math.min(1.0, (prev[data.flowMove as keyof typeof prev] ?? 0) + 0.15),
          }))
        }
      }).catch(() => {})
    }
  }, [sessionId, router])

  const handleAgentSpeaking = useCallback(() => {
    setHatchState('speaking')
    setCurrentCaption('')
  }, [])

  const handleAgentDoneSpeaking = useCallback(() => {
    setHatchState('listening')
    setTimeout(() => setCurrentCaption(''), 2000)
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
          content: "Hold on — you jumped straight to a solution. What's the actual problem here?",
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
      const res = await fetch(`/api/live-interview/${sessionId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
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
      } else if (res.status === 410) {
        setError('This session has ended.')
      } else {
        setError('Failed to send message. Please try again.')
      }
    } catch {
      setError('Network error — check your connection.')
    } finally {
      setHatchState('idle')
      setIsThinking(false)
    }
  }, [sessionId])

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
      await fetch(`/api/live-interview/${sessionId}/end`, { method: 'POST' })
      router.push(`/live-interviews/${sessionId}/debrief`)
    } catch {
      setError('Failed to generate debrief')
      setIsEnding(false)
      setInterviewPhase('active')
    }
  }, [sessionId, router])

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

  // ─── Ready — modal overlay ───
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

          {/* Company / role tags */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {companyName && (
              <span
                className="rounded-full px-3 py-1 font-label text-xs font-semibold"
                style={{ background: 'rgba(74,124,89,0.2)', color: 'rgba(126,224,153,0.85)' }}
              >
                {companyName}
              </span>
            )}
            {roleName && (
              <span className="font-label text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {roleName} Round
              </span>
            )}
          </div>

          <div className="space-y-2">
            <h2 className="font-headline text-xl font-bold" style={{ color: 'rgba(243,237,224,0.95)' }}>
              Ready to begin?
            </h2>
            <p className="font-body text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Hatch will play the role of your interviewer. Speak naturally — your microphone
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

      {/* Mock banner */}
      {IS_MOCK && (
        <div
          className="shrink-0 text-center py-1 px-4"
          style={{ background: 'rgba(201,147,58,0.15)', borderBottom: '1px solid rgba(201,147,58,0.25)' }}
        >
          <span className="font-label text-xs font-semibold" style={{ color: '#c9933a' }}>
            Mock Mode — Voice disabled
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
        <div className="flex items-center gap-3">
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
              className="rounded-full px-2.5 py-0.5 font-label text-xs font-semibold"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)' }}
            >
              {companyName}
            </span>
          )}
          {roleName && (
            <span className="font-label text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {roleName} Round
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

        {/* Center — Timer */}
        <div
          className="rounded-full px-4 py-1 font-mono tabular-nums"
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
        <div className="flex items-center gap-4">
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
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* LEFT: Transcript (320px) */}
        <div
          className="shrink-0 flex flex-col overflow-hidden"
          style={{
            width: 320,
            borderRight: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          {/* Header */}
          <div className="shrink-0 px-4 pt-3 pb-2">
            <span
              className="font-label font-semibold tracking-widest uppercase"
              style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.25)' }}
            >
              Transcript
            </span>
          </div>

          {/* Turns */}
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
        </div>

        {/* CENTER: Hatch orb + captions */}
        <div
          className="flex-1 flex flex-col items-center justify-center relative overflow-hidden"
          style={{ minWidth: 0 }}
        >
          {/* Ambient radial glow */}
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

          {/* Mode badge (top right of center) */}
          <div
            className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full px-2.5 py-1"
            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <span className="material-symbols-outlined text-[14px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {isVoiceAvailable ? 'mic' : 'chat'}
            </span>
            <span className="font-label text-[10.5px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {isVoiceAvailable ? 'Voice mode' : 'Chat mode'}
            </span>
          </div>

          {/* Hatch Orb */}
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div style={{ animation: 'floatHatchAnim 5s ease-in-out infinite' }}>
              <HatchOrb state={hatchState} />
            </div>

            {/* State label */}
            <span
              className="font-label uppercase tracking-widest text-[12px]"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              {hatchStateLabel}
            </span>

            {/* Live captions */}
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
        </div>

        {/* RIGHT: FLOW HUD (280px) */}
        <div
          className="shrink-0 flex flex-col overflow-hidden"
          style={{
            width: 280,
            background: 'rgba(0,0,0,0.15)',
            borderLeft: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          {/* FLOW Coverage */}
          <div className="shrink-0 px-4 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span
              className="font-label font-semibold tracking-widest uppercase mb-3 block"
              style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.25)' }}
            >
              FLOW Coverage
            </span>

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
                    <div
                      className="w-full rounded-full overflow-hidden"
                      style={{ height: 5, background: 'rgba(255,255,255,0.07)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: color,
                          boxShadow: active ? `0 0 8px ${color}88` : 'none',
                        }}
                      />
                    </div>
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

          {/* Recent signals — scrollable */}
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
              recentSignals.map((s, i) => (
                <div
                  key={s.id}
                  className="rounded-[10px] p-3 mb-2"
                  style={{
                    background: `${FLOW_COLORS[s.flowMove] ?? '#4a7c59'}12`,
                    border: `1px solid ${FLOW_COLORS[s.flowMove] ?? '#4a7c59'}25`,
                    animation: 'fadeUp 0.3s ease-out',
                  }}
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
                </div>
              ))
            )}
          </div>
        </div>
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
        <div className="flex items-center gap-4">
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
            label="Pause"
            onClick={() => {}}
          />

          <CtrlBtn
            icon="closed_caption"
            label="Captions"
            active={isCaptionsOn}
            onClick={() => setIsCaptionsOn((c) => !c)}
          />

          <CtrlBtn
            icon="chat"
            label="Chat"
            active={isChatOpen}
            onClick={() => setIsChatOpen((o) => !o)}
          />

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
      <div
        className="fixed top-0 right-0 h-full flex flex-col z-40"
        style={{
          width: 340,
          background: 'rgba(13,20,16,0.97)',
          backdropFilter: 'blur(16px)',
          borderLeft: '1px solid rgba(255,255,255,0.07)',
          transform: isChatOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease',
        }}
        aria-hidden={!isChatOpen}
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
                    {turn.content}
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
          {['Repeat the question', 'Give me a hint', 'Rephrase my answer'].map((chip) => (
            <button
              key={chip}
              onClick={() => handleSendChatMessage(chip)}
              className="rounded-full px-3 py-1 font-label text-[11px] transition-colors"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.09)',
                color: 'rgba(255,255,255,0.5)',
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
      </div>

      {/* Deepgram Voice */}
      <DeepgramVoiceSession
        sessionId={sessionId}
        systemPrompt={systemPrompt}
        isMuted={isMuted}
        onTranscript={handleTranscript}
        onAgentSpeaking={handleAgentSpeaking}
        onAgentDoneSpeaking={handleAgentDoneSpeaking}
        onConnected={handleConnected}
        onError={handleVoiceError}
        onAnalyserReady={(analyser) => talkingHeadRef.current?.setAnalyser(analyser)}
        disabled={IS_MOCK || interviewPhase !== 'active'}
      />

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

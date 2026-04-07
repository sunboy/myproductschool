'use client'

import { use, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import LumaAvatar, { type LumaAvatarState } from '@/components/live-interview/LumaAvatar'
import DeepgramVoiceSession from '@/components/live-interview/DeepgramVoiceSession'
// FlowCoveragePanel hidden during active interview — only shown on debrief page
import TranscriptPanel from '@/components/live-interview/TranscriptPanel'
import ChatPanel from '@/components/live-interview/ChatPanel'
import InterviewControls from '@/components/live-interview/InterviewControls'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import { useInterviewTimer } from '@/hooks/useInterviewTimer'
import { parseGradingSignal } from '@/lib/live-interview/parse-grading-signal'
import { MOCK_LIVE_SESSION, MOCK_LIVE_TURNS } from '@/lib/mock-live-interviews'

const IS_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'

interface CoachingSignal {
  flowMove: string
  competency: string
  signal: string
}

interface TranscriptTurn {
  id: string
  role: 'luma' | 'user'
  content: string
  source: 'voice' | 'chat'
  coachingSignal?: CoachingSignal
}

type InterviewPhase = 'loading' | 'ready' | 'active' | 'ended'

export default function SessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ company?: string; role?: string }>
}) {
  const { id } = use(params)
  const { company, role: roleParam } = use(searchParams)
  const router = useRouter()

  // Session state
  const [sessionId, setSessionId] = useState<string>(IS_MOCK ? 'mock-session-id' : id)
  const [systemPrompt, setSystemPrompt] = useState('')
  const [companyName, setCompanyName] = useState(IS_MOCK ? MOCK_LIVE_SESSION.companyName ?? '' : '')
  const [roleName, setRoleName] = useState(IS_MOCK ? MOCK_LIVE_SESSION.role ?? '' : '')
  const [scenarioTitle, setScenarioTitle] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [interviewPhase, setInterviewPhase] = useState<InterviewPhase>(IS_MOCK ? 'ready' : 'loading')
  const [interviewStartedAt, setInterviewStartedAt] = useState<number | null>(null)

  // Interview state
  const [flowCoverage, setFlowCoverage] = useState(
    IS_MOCK
      ? MOCK_LIVE_SESSION.flowCoverage
      : { frame: 0, list: 0, optimize: 0, win: 0 }
  )
  const [totalTurns, setTotalTurns] = useState(IS_MOCK ? MOCK_LIVE_SESSION.totalTurns : 0)
  const [turns, setTurns] = useState<TranscriptTurn[]>(
    IS_MOCK
      ? MOCK_LIVE_TURNS.map((t) => ({ id: t.id, role: t.role, content: t.content, source: 'voice' as const }))
      : []
  )

  // UI state
  const [lumaState, setLumaState] = useState<LumaAvatarState>('idle')
  const [isThinking, setIsThinking] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isVoiceActive, setIsVoiceActive] = useState(false)
  const [isVoiceAvailable, setIsVoiceAvailable] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isEnding, setIsEnding] = useState(false)
  const [showEndConfirm, setShowEndConfirm] = useState(false)

  const eventSourceRef = useRef<EventSource | null>(null)
  const lastSignalTurnIndexRef = useRef<number>(-1)

  // Timer
  const { formatted: timerDisplay, isWarning } = useInterviewTimer(
    interviewStartedAt,
    interviewPhase === 'active'
  )

  // Start session (non-mock)
  useEffect(() => {
    if (IS_MOCK) return

    let cancelled = false

    async function startSession() {
      try {
        const res = await fetch('/api/live-interview/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companyId: company, roleId: roleParam }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error ?? `Failed to start session (${res.status})`)
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

  // Handle starting the interview (user clicks "Start Interview")
  const handleStartInterview = useCallback(() => {
    setInterviewPhase('active')
    setInterviewStartedAt(Date.now())
  }, [])

  // SSE connection for flow coverage updates
  useEffect(() => {
    if (IS_MOCK || interviewPhase !== 'active' || !sessionId) return

    const es = new EventSource(`/api/live-interview/${sessionId}/status`)
    eventSourceRef.current = es

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.flowCoverage) setFlowCoverage(data.flowCoverage)
        if (data.totalTurns != null) setTotalTurns(data.totalTurns)
        // Drive avatar emotional state from grading response
        if (data.emotionalBeat && data.emotionalBeat !== 'neutral') {
          const beatToState: Record<string, LumaAvatarState> = {
            intrigued: 'intrigued',
            challenging: 'challenging',
            delighted: 'delighted',
            concerned: 'thinking',
          }
          const mappedState = beatToState[data.emotionalBeat]
          if (mappedState) {
            setLumaState(mappedState)
            setTimeout(() => setLumaState('listening'), 3000)
          }
        }
        // Attach latestSignal to the most recent luma voice turn
        if (data.latestSignal?.flowMove && data.latestSignal.turnIndex != null) {
          const signalTurnIndex = data.latestSignal.turnIndex as number
          if (signalTurnIndex > lastSignalTurnIndexRef.current) {
            lastSignalTurnIndexRef.current = signalTurnIndex
            const { turnIndex: _, ...signalData } = data.latestSignal
            setTurns((prev) => {
              const lastLumaIdx = prev.findLastIndex((t) => t.role === 'luma' && t.source === 'voice')
              if (lastLumaIdx === -1) return prev
              const turn = prev[lastLumaIdx]
              if (turn.coachingSignal) return prev
              const updated = [...prev]
              updated[lastLumaIdx] = { ...turn, coachingSignal: signalData }
              return updated
            })
          }
        }
        // Detect session phase 'done' from grading signal
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
        if (data.done) {
          es.close()
        }
      } catch {
        // ignore malformed SSE data
      }
    }

    es.onerror = () => {
      // EventSource will auto-reconnect; no need to surface transient errors
    }

    return () => {
      es.close()
      eventSourceRef.current = null
    }
  }, [sessionId, interviewPhase])

  // Warn before leaving during active interview + beacon to mark abandoned
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

  // Deepgram callbacks
  const handleTranscript = useCallback((text: string, role: 'luma' | 'user') => {
    // Strip grading signal JSON from voice responses (can appear on any role)
    const { cleanContent, signal } = parseGradingSignal(text)

    // Drop turns that are nothing but a signal block (no spoken content)
    if (!cleanContent) return

    let coachingSignal: CoachingSignal | undefined
    if (signal && signal.flowMove) {
      coachingSignal = signal
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
    if (role === 'luma') setLumaState('idle')

    // Detect natural session ending — Luma uses varied closing phrases
    const CLOSING_PHRASES = ["wrap up", "stop here", "covered good ground", "have what i need", "call it", "good session", "shall we stop", "want to stop"]
    const lower = cleanContent.toLowerCase()
    if (role === 'luma' && CLOSING_PHRASES.some((phrase) => lower.includes(phrase))) {
      setTimeout(() => {
        setIsEnding(true)
        setInterviewPhase('ended')
        eventSourceRef.current?.close()
        fetch(`/api/live-interview/${sessionId}/end`, { method: 'POST' })
          .then(() => router.push(`/live-interviews/${sessionId}/debrief`))
          .catch(() => setError('Failed to generate debrief'))
      }, 2000)
    }

    // Analyze user voice turns for FLOW move — update coverage locally on response
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
  }, [sessionId])

  const handleAgentSpeaking = useCallback(() => {
    setLumaState('speaking')
  }, [])

  const handleAgentDoneSpeaking = useCallback(() => {
    setLumaState('listening')
  }, [])

  const handleConnected = useCallback(() => {
    setIsVoiceActive(true)
    setIsVoiceAvailable(true)
    setLumaState('listening')
  }, [])

  const [voiceError, setVoiceError] = useState<string | null>(null)

  const handleVoiceError = useCallback((err: string) => {
    // Voice errors are non-fatal — fall back to chat-only mode with a visible warning
    setVoiceError(err)
    setIsVoiceAvailable(false)
    setIsVoiceActive(false)
    setIsChatOpen(true)
  }, [])

  // Chat text message
  const handleSendChatMessage = useCallback(async (text: string) => {
    const userTurn: TranscriptTurn = { id: crypto.randomUUID(), role: 'user', content: text, source: 'chat' }
    setTurns((prev) => [...prev, userTurn])
    setTotalTurns((prev) => prev + 1)
    setLumaState('thinking')
    setIsThinking(true)

    if (IS_MOCK) {
      setTimeout(() => {
        const lumaReply: TranscriptTurn = {
          id: crypto.randomUUID(),
          role: 'luma',
          content: "Hold on — you jumped straight to a solution. What's the actual problem here?",
          source: 'chat',
        }
        setTurns((prev) => [...prev, lumaReply])
        setTotalTurns((prev) => prev + 1)
        setLumaState('idle')
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
        const lumaTurn: TranscriptTurn = {
          id: crypto.randomUUID(),
          role: 'luma',
          content: reply,
          source: 'chat',
        }
        setTurns((prev) => [...prev, lumaTurn])
        setTotalTurns((prev) => prev + 1)
      } else if (res.status === 410) {
        setError('This session has ended.')
      } else {
        setError('Failed to send message. Please try again.')
      }
    } catch {
      setError('Network error — check your connection.')
    } finally {
      setLumaState('idle')
      setIsThinking(false)
    }
  }, [sessionId])

  // End interview — show confirmation modal first
  const handleEndInterview = useCallback(() => {
    if (isEnding) return
    setShowEndConfirm(true)
  }, [isEnding])

  // Confirmed end — actually terminate the session
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

  // Removed: hard turn limit. Interviews end naturally via time-based soft signal
  // or when Luma/user decides to wrap up.

  // Both panels show the full conversation — voice and chat are interleaved
  // The `source` tag is kept for potential styling differences

  // ── Loading state ──
  if (interviewPhase === 'loading') {
    return (
      <div className="min-h-screen bg-inverse-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          <p className="text-white/60 font-body text-sm">Starting interview session...</p>
        </div>
      </div>
    )
  }

  // ── Generating debrief screen ──
  if (interviewPhase === 'ended') {
    return (
      <div className="min-h-screen bg-inverse-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-6 max-w-sm text-center px-6">
          <LumaGlyph size={80} state="reviewing" className="text-primary" />
          <div className="space-y-2">
            <h2 className="font-headline text-xl font-bold text-white">Generating your debrief</h2>
            <p className="font-body text-sm text-white/60 leading-relaxed">
              Luma is analyzing your interview performance across all four FLOW moves. This usually takes a few seconds.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-1 w-24 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
            <span className="text-xs text-white/40 font-label">{timerDisplay}</span>
          </div>
          {error && (
            <div className="rounded-lg bg-error/20 border border-error/30 px-4 py-2 w-full">
              <p className="font-body text-sm text-error">{error}</p>
              <button
                onClick={() => { setError(null); setIsEnding(false); setInterviewPhase('active') }}
                className="text-xs text-error/80 hover:text-error mt-1 underline"
              >
                Return to interview
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Ready screen ──
  if (interviewPhase === 'ready') {
    return (
      <div className="min-h-screen bg-inverse-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-6 max-w-md text-center px-6">
          <LumaGlyph size={80} state="idle" className="text-primary" />

          <div className="flex items-center gap-2">
            {companyName && (
              <span className="rounded-full bg-white/10 px-3 py-1 font-label text-xs font-semibold text-white/80">
                {companyName}
              </span>
            )}
            {roleName && (
              <span className="font-label text-sm text-white/60">{roleName} Round</span>
            )}
          </div>

          <div className="space-y-2">
            <h2 className="font-headline text-xl font-bold text-white">Ready to begin?</h2>
            <p className="font-body text-sm text-white/60 leading-relaxed">
              Luma will play the role of your interviewer. Speak naturally —
              your microphone will activate when you start. Aim to cover all
              four FLOW moves: Frame, List, Optimize, Win.
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-error/20 border border-error/30 px-4 py-2 w-full">
              <p className="font-body text-sm text-error">{error}</p>
            </div>
          )}

          <div className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-4 py-2">
            <span className="material-symbols-outlined text-white/40 text-[18px]">mic</span>
            <span className="font-body text-xs text-white/40">
              Your browser will request microphone access when you start.
            </span>
          </div>

          <button
            onClick={handleStartInterview}
            className="bg-primary text-on-primary rounded-full px-8 py-3 font-label font-semibold text-base hover:opacity-90 transition-opacity"
          >
            Start Interview
          </button>

          <button
            onClick={() => router.push('/live-interviews')}
            className="font-label text-sm text-white/40 hover:text-white/60 transition-colors"
          >
            Back to interview list
          </button>
        </div>
      </div>
    )
  }

  // ── Active interview ──
  return (
    <div className="min-h-screen bg-inverse-surface flex flex-col">
      {/* Mock mode banner */}
      {IS_MOCK && (
        <div className="bg-tertiary/20 border-b border-tertiary/30 px-4 py-1.5 text-center">
          <span className="font-label text-xs font-semibold text-tertiary">
            Mock Mode — Voice disabled
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/live-interviews')}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/60 hover:bg-white/20 transition-colors"
            aria-label="Back to interviews"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1 font-label text-xs font-semibold text-white/80">
              {companyName}
            </span>
            <span className="font-label text-sm text-white/60">{roleName} Round</span>
            {scenarioTitle && (
              <span className="rounded-full bg-primary/20 px-3 py-1 font-label text-xs text-primary/80 hidden md:inline">
                {scenarioTitle}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Timer */}
          <span className={cn(
            'rounded-full px-3 py-1 font-label text-sm font-mono tabular-nums',
            isWarning
              ? 'bg-error/20 text-error'
              : 'bg-white/10 text-white/80'
          )}>
            {timerDisplay}
          </span>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-4 mb-2 rounded-lg bg-error/20 border border-error/30 px-4 py-2 md:mx-6">
          <p className="font-body text-sm text-error">{error}</p>
        </div>
      )}

      {/* Voice fallback banner — dismissible */}
      {voiceError && (
        <div className="mx-4 mb-2 rounded-lg bg-tertiary/10 border border-tertiary/20 px-4 py-2 md:mx-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary text-[18px]">headset_off</span>
            <p className="font-body text-sm text-tertiary">{voiceError}</p>
          </div>
          <button
            onClick={() => setVoiceError(null)}
            className="text-tertiary/60 hover:text-tertiary shrink-0"
            aria-label="Dismiss"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col gap-4 px-4 pb-4 md:px-6">
        {/* Avatar — full width during active interview */}
        <div>
          <LumaAvatar
            state={lumaState}
            className="h-full min-h-[200px] bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl"
          />
        </div>

        {/* Transcript — voice turns only */}
        <div className="flex-1 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 p-4">
          <TranscriptPanel
            turns={turns}
            className="[&_span]:text-white/50 [&_.text-on-surface-variant]:text-white/50 [&_.bg-primary-container]:bg-primary/30 [&_.text-on-primary-container]:text-white/90 [&_.bg-surface-container-high]:bg-white/10 [&_.text-on-surface]:text-white/80"
          />
        </div>

        {/* Controls */}
        <div className="flex justify-center pb-2">
          <InterviewControls
            isMuted={isMuted}
            isVoiceActive={isVoiceActive}
            isVoiceAvailable={isVoiceAvailable}
            isChatOpen={isChatOpen}
            onToggleMute={() => setIsMuted((m) => !m)}
            onToggleVoice={() => setIsVoiceActive((v) => !v)}
            onToggleChat={() => setIsChatOpen((o) => !o)}
            onEndInterview={handleEndInterview}
          />
        </div>
      </div>

      {/* Chat Panel — chat turns only */}
      <ChatPanel
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        turns={turns}
        isThinking={isThinking}
        onSendMessage={handleSendChatMessage}
      />

      {/* Deepgram Voice Session (invisible — renders null) */}
      <DeepgramVoiceSession
        sessionId={sessionId}
        systemPrompt={systemPrompt}
        isMuted={isMuted}
        onTranscript={handleTranscript}
        onAgentSpeaking={handleAgentSpeaking}
        onAgentDoneSpeaking={handleAgentDoneSpeaking}
        onConnected={handleConnected}
        onError={handleVoiceError}
        disabled={IS_MOCK || interviewPhase !== 'active'}
      />

      {/* End interview confirmation modal */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-container rounded-2xl p-6 max-w-sm mx-4 shadow-lg">
            <div className="flex flex-col items-center gap-4 text-center">
              <LumaGlyph size={48} state="reviewing" className="text-primary" />
              <div>
                <h3 className="font-headline text-lg font-bold text-on-surface">End this interview?</h3>
                <p className="font-body text-sm text-on-surface-variant mt-1">
                  Luma will analyze your performance and generate a detailed debrief.
                </p>
              </div>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowEndConfirm(false)}
                  className="flex-1 py-2.5 rounded-full border border-outline-variant text-on-surface-variant font-label text-sm font-semibold hover:bg-surface-container-high transition-colors"
                >
                  Keep going
                </button>
                <button
                  onClick={confirmEndInterview}
                  className="flex-1 py-2.5 rounded-full bg-primary text-on-primary font-label text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  End &amp; debrief
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

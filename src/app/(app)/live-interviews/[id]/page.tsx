'use client'

import { use, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import LumaAvatar from '@/components/live-interview/LumaAvatar'
import DeepgramVoiceSession from '@/components/live-interview/DeepgramVoiceSession'
import FlowCoveragePanel from '@/components/live-interview/FlowCoveragePanel'
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
  const [lumaState, setLumaState] = useState<'idle' | 'listening' | 'speaking' | 'thinking'>('idle')
  const [isThinking, setIsThinking] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isVoiceActive, setIsVoiceActive] = useState(false)
  const [isVoiceAvailable, setIsVoiceAvailable] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isEnding, setIsEnding] = useState(false)

  const eventSourceRef = useRef<EventSource | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const nextPlayTimeRef = useRef<number>(0)
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
  }, [])

  const handleAgentSpeaking = useCallback(() => {
    setLumaState('speaking')
    // Reset audio queue for new utterance
    nextPlayTimeRef.current = 0
  }, [])

  const handleAudioChunk = useCallback((buffer: ArrayBuffer) => {
    if (IS_MOCK) return

    if (!audioCtxRef.current) {
      // Use browser's default sample rate for smooth playback
      const ctx = new AudioContext()
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.8
      analyser.connect(ctx.destination)
      audioCtxRef.current = ctx
      analyserRef.current = analyser
    }

    const ctx = audioCtxRef.current
    const analyser = analyserRef.current
    if (!analyser) return

    // Deepgram sends raw linear16 PCM at 16kHz — convert to float32
    const int16 = new Int16Array(buffer)
    const float32 = new Float32Array(int16.length)
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 0x8000
    }

    // Create buffer at 16kHz source rate — browser resamples to output rate
    const audioBuffer = ctx.createBuffer(1, float32.length, 16000)
    audioBuffer.getChannelData(0).set(float32)

    // Schedule chunks sequentially to avoid overlap/gaps
    const now = ctx.currentTime
    const startTime = Math.max(now, nextPlayTimeRef.current)
    const duration = float32.length / 16000

    const source = ctx.createBufferSource()
    source.buffer = audioBuffer
    source.connect(analyser)
    source.start(startTime)

    nextPlayTimeRef.current = startTime + duration
  }, [])

  const handleConnected = useCallback(() => {
    setIsVoiceActive(true)
    setIsVoiceAvailable(true)
    setLumaState('listening')
  }, [])

  const handleVoiceError = useCallback((err: string) => {
    setError(err)
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
          content: "That's interesting — can you say more about that?",
          source: 'chat',
          coachingSignal: { flowMove: 'frame', competency: 'cognitive_empathy', signal: 'Good instinct to explore the problem space.' },
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
        const { reply, signal } = await res.json()
        const lumaTurn: TranscriptTurn = {
          id: crypto.randomUUID(),
          role: 'luma',
          content: reply,
          source: 'chat',
          coachingSignal: signal ?? undefined,
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

  // End interview
  const handleEndInterview = useCallback(async () => {
    if (isEnding) return
    setIsEnding(true)
    setInterviewPhase('ended')

    eventSourceRef.current?.close()
    audioCtxRef.current?.close().catch(() => {})

    if (IS_MOCK) {
      router.push(`/live-interviews/${sessionId}/debrief`)
      return
    }

    try {
      await fetch(`/api/live-interview/${sessionId}/end`, { method: 'POST' })
      router.push(`/live-interviews/${sessionId}/debrief`)
    } catch {
      setError('Failed to end interview')
      setIsEnding(false)
      setInterviewPhase('active')
    }
  }, [sessionId, isEnding, router])

  // Filter turns by source for each panel
  const voiceTurns = turns.filter((t) => t.source === 'voice')
  const chatTurns = turns.filter((t) => t.source === 'chat')

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
          {/* Turn counter */}
          <span className="rounded-full bg-white/10 px-3 py-1 font-label text-xs text-white/60">
            Turn: {totalTurns} / 10
          </span>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-4 mb-2 rounded-lg bg-error/20 border border-error/30 px-4 py-2 md:mx-6">
          <p className="font-body text-sm text-error">{error}</p>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col gap-4 px-4 pb-4 md:px-6">
        {/* Top row: Avatar + Flow Coverage */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="md:w-2/3">
            <LumaAvatar
              state={lumaState}
              audioAnalyser={analyserRef.current}
              className="h-full min-h-[200px] bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl"
            />
          </div>

          <div className="md:w-1/3">
            <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 p-5 h-full">
              <FlowCoveragePanel
                flowCoverage={flowCoverage}
                totalTurns={totalTurns}
                className="[&_span]:text-white/80 [&_.text-on-surface]:text-white/80 [&_.text-on-surface-variant]:text-white/50 [&_.bg-surface-container]:bg-white/10 [&_.bg-surface-container-high]:bg-white/5"
              />
            </div>
          </div>
        </div>

        {/* Transcript — voice turns only */}
        <div className="flex-1 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 p-4">
          <TranscriptPanel
            turns={voiceTurns}
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
        turns={chatTurns}
        isThinking={isThinking}
        onSendMessage={handleSendChatMessage}
      />

      {/* Deepgram Voice Session (invisible — renders null) */}
      <DeepgramVoiceSession
        sessionId={sessionId}
        systemPrompt={systemPrompt}
        isMuted={isMuted}
        onTranscript={handleTranscript}
        onAudioChunk={handleAudioChunk}
        onAgentSpeaking={handleAgentSpeaking}
        onConnected={handleConnected}
        onError={handleVoiceError}
        disabled={IS_MOCK || interviewPhase !== 'active'}
      />
    </div>
  )
}

'use client'

import { use, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import LumaAvatar from '@/components/live-interview/LumaAvatar'
import DeepgramVoiceSession from '@/components/live-interview/DeepgramVoiceSession'
import FlowCoveragePanel from '@/components/live-interview/FlowCoveragePanel'
import TranscriptPanel from '@/components/live-interview/TranscriptPanel'
import ChatPanel from '@/components/live-interview/ChatPanel'
import InterviewControls from '@/components/live-interview/InterviewControls'
import { MOCK_LIVE_SESSION, MOCK_LIVE_TURNS } from '@/lib/mock-live-interviews'

const IS_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'

interface TranscriptTurn {
  id: string
  role: 'luma' | 'user'
  content: string
}

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
  const [isLoading, setIsLoading] = useState(!IS_MOCK)

  // Interview state
  const [flowCoverage, setFlowCoverage] = useState(
    IS_MOCK
      ? MOCK_LIVE_SESSION.flowCoverage
      : { frame: 0, list: 0, optimize: 0, win: 0 }
  )
  const [totalTurns, setTotalTurns] = useState(IS_MOCK ? MOCK_LIVE_SESSION.totalTurns : 0)
  const [turns, setTurns] = useState<TranscriptTurn[]>(
    IS_MOCK
      ? MOCK_LIVE_TURNS.map((t) => ({ id: t.id, role: t.role, content: t.content }))
      : []
  )

  // UI state
  const [lumaState, setLumaState] = useState<'idle' | 'listening' | 'speaking'>('idle')
  const [isMuted, setIsMuted] = useState(false)
  const [isVoiceActive, setIsVoiceActive] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isEnding, setIsEnding] = useState(false)

  const eventSourceRef = useRef<EventSource | null>(null)

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
        setIsLoading(false)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to start session')
        setIsLoading(false)
      }
    }

    startSession()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // SSE connection for flow coverage updates
  useEffect(() => {
    if (IS_MOCK || isLoading || !sessionId) return

    const es = new EventSource(`/api/live-interview/${sessionId}/status`)
    eventSourceRef.current = es

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.flowCoverage) setFlowCoverage(data.flowCoverage)
        if (data.totalTurns != null) setTotalTurns(data.totalTurns)
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
  }, [sessionId, isLoading])

  // Deepgram callbacks
  const handleTranscript = useCallback((text: string, role: 'luma' | 'user') => {
    const turn: TranscriptTurn = {
      id: crypto.randomUUID(),
      role,
      content: text,
    }
    setTurns((prev) => [...prev, turn])
    setTotalTurns((prev) => prev + 1)
    // ConversationText with role='luma' means agent finished speaking — go idle
    if (role === 'luma') setLumaState('idle')
  }, [])

  const handleAgentSpeaking = useCallback(() => {
    setLumaState('speaking')
  }, [])

  const handleAudioChunk = useCallback(() => {
    // noop — TalkingHead.js not available
  }, [])

  const handleConnected = useCallback(() => {
    setIsVoiceActive(true)
    setLumaState('listening')
  }, [])

  const handleError = useCallback((err: string) => {
    setError(err)
  }, [])

  // Chat text message
  const handleSendChatMessage = useCallback(async (text: string) => {
    // Optimistically add user turn
    const userTurn: TranscriptTurn = { id: crypto.randomUUID(), role: 'user', content: text }
    setTurns((prev) => [...prev, userTurn])
    setTotalTurns((prev) => prev + 1)

    if (IS_MOCK) {
      setTimeout(() => {
        const lumaReply: TranscriptTurn = {
          id: crypto.randomUUID(),
          role: 'luma',
          content: "That's interesting — can you say more about that?",
        }
        setTurns((prev) => [...prev, lumaReply])
        setTotalTurns((prev) => prev + 1)
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
        const lumaTurn: TranscriptTurn = { id: crypto.randomUUID(), role: 'luma', content: reply }
        setTurns((prev) => [...prev, lumaTurn])
        setTotalTurns((prev) => prev + 1)
      } else if (res.status === 410) {
        setError('This session has ended.')
      } else {
        setError('Failed to send message. Please try again.')
      }
    } catch {
      setError('Network error — check your connection.')
    }
  }, [sessionId])

  // End interview
  const handleEndInterview = useCallback(async () => {
    if (isEnding) return
    setIsEnding(true)

    // Close SSE
    eventSourceRef.current?.close()

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
    }
  }, [sessionId, isEnding, router])

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-inverse-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          <p className="text-white/60 font-body text-sm">Starting interview session...</p>
        </div>
      </div>
    )
  }

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
        <span className="rounded-full bg-white/10 px-3 py-1 font-label text-xs text-white/60">
          Turn: {totalTurns} / 10
        </span>
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
          {/* Luma Avatar */}
          <div className="md:w-2/3">
            <LumaAvatar
              state={lumaState}
              className="h-full min-h-[200px] bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl"
            />
          </div>

          {/* Flow Coverage */}
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

        {/* Transcript */}
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
            isChatOpen={isChatOpen}
            onToggleMute={() => setIsMuted((m) => !m)}
            onToggleVoice={() => setIsVoiceActive((v) => !v)}
            onToggleChat={() => setIsChatOpen((o) => !o)}
            onEndInterview={handleEndInterview}
          />
        </div>
      </div>

      {/* Chat Panel */}
      <ChatPanel
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        turns={turns}
        onSendMessage={handleSendChatMessage}
      />

      {/* Deepgram Voice Session (invisible — renders null) */}
      <DeepgramVoiceSession
        sessionId={sessionId}
        systemPrompt={systemPrompt}
        onTranscript={handleTranscript}
        onAudioChunk={handleAudioChunk}
        onAgentSpeaking={handleAgentSpeaking}
        onConnected={handleConnected}
        onError={handleError}
        disabled={IS_MOCK}
      />
    </div>
  )
}

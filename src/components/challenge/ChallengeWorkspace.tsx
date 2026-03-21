'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { ChallengePrompt, ChallengeMode } from '@/lib/types'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

interface ChallengeWorkspaceProps {
  challenge: ChallengePrompt
  domainTitle: string
  domainIcon: string
}

const modes: Array<{ id: ChallengeMode; label: string; desc: string; icon: string }> = [
  { id: 'spotlight', label: 'Spotlight', desc: '10 min timer, no hints', icon: 'timer' },
  { id: 'workshop', label: 'Workshop', desc: 'Luma nudges every 3 min', icon: 'school' },
  { id: 'live', label: 'Live', desc: 'Back-and-forth with Luma', icon: 'chat' },
  { id: 'solo', label: 'Solo', desc: 'Open-ended, no pressure', icon: 'self_improvement' },
]

export function ChallengeWorkspace({ challenge, domainTitle, domainIcon }: ChallengeWorkspaceProps) {
  const [selectedMode, setSelectedMode] = useState<ChallengeMode | null>(null)
  const [started, setStarted] = useState(false)
  const [response, setResponse] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [timeLeft, setTimeLeft] = useState(10 * 60) // 10 minutes in seconds
  const [nudge, setNudge] = useState<string | null>(null)
  const [liveMessages, setLiveMessages] = useState<Array<{ role: 'user' | 'luma'; content: string }>>([])
  const [liveInput, setLiveInput] = useState('')
  const [liveSending, setLiveSending] = useState(false)
  const nudgeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const router = useRouter()

  // Spotlight: countdown timer
  useEffect(() => {
    if (!started || selectedMode !== 'spotlight') return
    if (timeLeft <= 0) {
      handleSubmit()
      return
    }
    const t = setTimeout(() => setTimeLeft(prev => prev - 1), 1000)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, selectedMode, timeLeft])

  // Workshop: nudge every 3 minutes
  useEffect(() => {
    if (!started || selectedMode !== 'workshop') return
    nudgeTimerRef.current = setInterval(async () => {
      if (!response.trim()) return
      try {
        const res = await fetch('/api/luma/nudge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ challengeId: challenge.id, draft: response }),
        })
        const data = await res.json()
        if (data.nudge) setNudge(data.nudge)
      } catch {
        // ignore nudge errors silently
      }
    }, 3 * 60 * 1000) // 3 minutes
    return () => { if (nudgeTimerRef.current) clearInterval(nudgeTimerRef.current) }
  }, [started, selectedMode, response, challenge.id])

  const handleSubmit = useCallback(async () => {
    if (submitting || !response.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/challenges/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: challenge.id,
          mode: selectedMode,
          response,
        }),
      })
      const data = await res.json()
      if (data.attemptId) {
        router.push(`/challenges/${challenge.id}/feedback?attempt=${data.attemptId}`)
      } else {
        router.push(`/challenges/${challenge.id}/feedback?attempt=mock`)
      }
    } catch {
      router.push(`/challenges/${challenge.id}/feedback?attempt=mock`)
    }
  }, [challenge.id, selectedMode, response, submitting, router])

  const handleLiveSend = useCallback(async () => {
    if (!liveInput.trim() || liveSending) return
    const userMsg = liveInput.trim()
    setLiveMessages(m => [...m, { role: 'user', content: userMsg }])
    setLiveInput('')
    setLiveSending(true)
    try {
      const res = await fetch('/api/luma/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: challenge.id,
          message: userMsg,
          history: liveMessages,
        }),
      })
      const data = await res.json()
      setLiveMessages(m => [...m, { role: 'luma', content: data.reply ?? 'Let me think about that...' }])
    } catch {
      setLiveMessages(m => [...m, { role: 'luma', content: 'Something went wrong. Please try again.' }])
    } finally {
      setLiveSending(false)
    }
  }, [liveInput, liveSending, challenge.id, liveMessages])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // Mode selection screen
  if (!selectedMode) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Challenge header */}
        <div>
          <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-3">
            <span className="material-symbols-outlined text-base">{domainIcon}</span>
            {domainTitle}
          </div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">{challenge.title}</h1>
          <p className="text-sm text-on-surface-variant mt-2">~{challenge.estimated_minutes} min · {challenge.difficulty}</p>
        </div>

        {/* Mode picker */}
        <div>
          <h2 className="font-medium text-on-surface mb-3">Choose your mode</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {modes.map(mode => (
              <button
                key={mode.id}
                onClick={() => setSelectedMode(mode.id)}
                className="flex items-start gap-3 p-4 rounded-2xl border-2 border-outline-variant bg-surface-container hover:border-primary/50 hover:bg-surface-container-high transition-all text-left"
              >
                <span className="material-symbols-outlined text-primary mt-0.5">{mode.icon}</span>
                <div>
                  <div className="font-medium text-on-surface">{mode.label}</div>
                  <div className="text-sm text-on-surface-variant">{mode.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Challenge prompt (after mode selected, before start)
  if (!started) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-2">
          <button onClick={() => setSelectedMode(null)} className="p-2 rounded-lg hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
          </button>
          <div className="flex items-center gap-2 px-3 py-1 bg-primary-container rounded-full">
            <span className="material-symbols-outlined text-primary text-sm">{modes.find(m => m.id === selectedMode)?.icon}</span>
            <span className="text-sm font-medium text-on-primary-container capitalize">{selectedMode} mode</span>
          </div>
        </div>

        <div className="p-5 bg-surface-container rounded-2xl border border-outline-variant">
          <h2 className="font-headline text-xl font-bold text-on-surface mb-4">{challenge.title}</h2>
          <p className="text-on-surface whitespace-pre-wrap leading-relaxed">{challenge.prompt_text}</p>
        </div>

        {selectedMode === 'spotlight' && (
          <div className="p-4 bg-tertiary-container rounded-xl flex items-center gap-3">
            <span className="material-symbols-outlined text-tertiary">timer</span>
            <p className="text-sm text-on-tertiary-container">You have 10 minutes. The timer starts when you click &ldquo;Begin&rdquo;.</p>
          </div>
        )}

        <button
          onClick={() => setStarted(true)}
          className="w-full py-3 bg-primary text-on-primary font-medium rounded-xl hover:opacity-90 transition-opacity"
        >
          Begin challenge
        </button>
      </div>
    )
  }

  // Live mode
  if (selectedMode === 'live') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <LumaGlyph size={28} className="text-primary" animated />
          <div>
            <div className="font-medium text-on-surface">Luma — Live coaching</div>
            <div className="text-xs text-on-surface-variant">{challenge.title}</div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pb-4">
          {/* Initial prompt from Luma */}
          <div className="flex gap-3">
            <LumaGlyph size={24} className="text-primary flex-shrink-0 mt-1" />
            <div className="bg-primary-container rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
              <p className="text-on-primary-container text-sm">{challenge.prompt_text}</p>
            </div>
          </div>
          {liveMessages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {msg.role === 'luma' && <LumaGlyph size={24} className="text-primary flex-shrink-0 mt-1" />}
              <div className={`rounded-2xl px-4 py-3 max-w-[85%] text-sm ${
                msg.role === 'user'
                  ? 'bg-surface-container-high text-on-surface rounded-tr-sm ml-auto'
                  : 'bg-primary-container text-on-primary-container rounded-tl-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {liveSending && (
            <div className="flex gap-3">
              <LumaGlyph size={24} className="text-primary flex-shrink-0 mt-1" />
              <div className="bg-primary-container rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex gap-2 mt-4">
          <input
            value={liveInput}
            onChange={e => setLiveInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleLiveSend() } }}
            placeholder="Type your response..."
            className="flex-1 px-4 py-3 bg-surface-container border border-outline-variant rounded-xl text-on-surface focus:outline-none focus:border-primary transition-colors text-sm"
          />
          <button
            onClick={handleLiveSend}
            disabled={liveSending || !liveInput.trim()}
            className="p-3 bg-primary text-on-primary rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            <span className="material-symbols-outlined">send</span>
          </button>
        </div>
      </div>
    )
  }

  // Spotlight / Workshop / Solo — textarea mode
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {/* Header with timer (spotlight) */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <h2 className="font-medium text-on-surface text-sm">{challenge.title}</h2>
        </div>
        {selectedMode === 'spotlight' && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono font-bold text-sm ${
            timeLeft < 60 ? 'bg-error-container text-on-error-container' :
            timeLeft < 180 ? 'bg-tertiary-container text-on-tertiary-container' :
            'bg-surface-container-high text-on-surface'
          }`}>
            <span className="material-symbols-outlined text-base">timer</span>
            {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {/* Prompt (collapsible) */}
      <details className="group">
        <summary className="flex items-center gap-2 cursor-pointer text-sm text-on-surface-variant hover:text-on-surface">
          <span className="material-symbols-outlined text-base">expand_more</span>
          View challenge prompt
        </summary>
        <div className="mt-3 p-4 bg-surface-container rounded-xl border border-outline-variant">
          <p className="text-sm text-on-surface whitespace-pre-wrap leading-relaxed">{challenge.prompt_text}</p>
        </div>
      </details>

      {/* Workshop nudge */}
      {selectedMode === 'workshop' && nudge && (
        <div className="flex gap-3 p-4 bg-primary-container rounded-xl">
          <LumaGlyph size={20} className="text-primary flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-semibold text-primary mb-1">Luma nudge</div>
            <p className="text-sm text-on-primary-container">{nudge}</p>
          </div>
        </div>
      )}

      {/* Response textarea */}
      <div>
        <textarea
          value={response}
          onChange={e => setResponse(e.target.value)}
          placeholder="Write your response here..."
          className="w-full min-h-64 px-4 py-3 bg-surface-container border border-outline-variant rounded-xl text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors resize-none text-sm leading-relaxed"
          disabled={selectedMode === 'spotlight' && timeLeft <= 0}
        />
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-on-surface-variant">{response.length} characters</span>
          {selectedMode === 'workshop' && (
            <span className="text-xs text-on-surface-variant flex items-center gap-1">
              <LumaGlyph size={12} className="text-primary" />
              Luma coaches every 3 min
            </span>
          )}
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting || !response.trim() || (selectedMode === 'spotlight' && timeLeft <= 0)}
        className="w-full py-3 bg-primary text-on-primary font-medium rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <LumaGlyph size={16} className="animate-luma-glow" />
            Luma is thinking...
          </span>
        ) : 'Submit for Luma feedback'}
      </button>
    </div>
  )
}

'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Md } from '@/components/ui/Md'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import { VoiceInputButton } from './VoiceInputButton'
import type { CanvasScene } from '@/lib/hatch/canvas-scene'
import type { CanvasInterpretResponse, InterviewGrade } from '@/lib/types'
import { useHatchDockState } from '@/hooks/useHatchDockState'
import { useHatchSonics } from '@/hooks/useHatchSonics'
import { ChallengePaywallGate } from '@/components/paywalls/ChallengePaywallGate'
import { useUpgrade } from '@/hooks/useUpgrade'

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
  challengeType: 'system_design' | 'data_modeling' | 'coding'
  scene: CanvasScene
  contextPack?: string
  queuedPrompt?: { id: string; text: string; autoSend?: boolean } | null
  isOpen: boolean
  onToggle: () => void
  onCanvasActions?: (response: { message: string; actions: unknown[] }) => void
  feedbackMode?: boolean
  grade?: InterviewGrade | null
  proactiveNudge?: { id: string; text: string } | null
  onDismissNudge?: () => void
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
}

function getInitialMessage(challengeType: 'system_design' | 'data_modeling' | 'coding'): string {
  if (challengeType === 'coding') {
    return "I'm watching your code. Ask about your approach, edge cases, complexity, or why something isn't working."
  }
  if (challengeType === 'data_modeling') {
    return "Let's model this data together. Draw your entities and relationships, or describe them and I'll add them to the canvas."
  }
  return "I'm here to help you design this system. You can draw by hand, type here, or speak — I'll help build and critique your diagram."
}

function getSuggestionPrompts(challengeType: 'system_design' | 'data_modeling' | 'coding', language?: string): string[] {
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
  return [
    "What's the strongest system move I'm missing?",
    'Compare my design to a top response.',
    "What's the trade-off here?",
  ]
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
  onCanvasActions,
  feedbackMode = false,
  grade = null,
  proactiveNudge = null,
  onDismissNudge,
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
}: CanvasChatPanelProps) {
  const { mode, panelWidth, setMode, setPanelWidth, MIN_WIDTH, MAX_WIDTH } = useHatchDockState('canvas')
  const { muted, toggleMuted, play } = useHatchSonics()
  const { startUpgrade } = useUpgrade()

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'hatch',
      content: getInitialMessage(challengeType),
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
  const canvasStatusLabel = challengeType === 'coding'
    ? null
    : `${scene.entities.length} ${challengeType === 'data_modeling' ? 'tables' : 'nodes'} · ${scene.connections.length} ${challengeType === 'data_modeling' ? 'links' : 'flows'}`
  const suggestionPrompts = getSuggestionPrompts(challengeType, currentLanguage)
  const isThrottled = retryAfter != null && retryAfter > 0
  const inputDisabled = isLoading || isThrottled
  const inputPlaceholder = isThrottled
    ? `Slow down. Try again in ${retryAfter}s.`
    : challengeType === 'coding'
      ? "Ask Hatch about your code…"
      : "Ask Hatch, or tell it what to draw from your notes…"

  // Suppress unused variable warnings — grade is reserved for future use; isOpen kept for callers
  void grade
  void isOpen

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

    // Unified coach endpoint — model decides build vs coach vs both.
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
      }

      const codingBody = challengeType === 'coding' ? {
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
      const willBuild = data.actions.length > 0 && !!onCanvasActions
      if (willBuild && onCanvasActions) {
        onCanvasActions({ message: data.message, actions: data.actions })
      }
      play(willBuild ? 'draw' : 'reply')
      setMessages((prev) => [
        ...prev,
        {
          role: 'hatch',
          content: data.message,
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
      activePartResponseType, activePartWeightPct, play, isThrottled])

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

  // Proactive nudge: surface in chat thread, auto-dismiss-aware.
  const lastNudgeIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (!proactiveNudge) return
    if (proactiveNudge.id === lastNudgeIdRef.current) return
    lastNudgeIdRef.current = proactiveNudge.id
    play('nudge')
    setMessages((prev) => [
      ...prev,
      { role: 'hatch', content: proactiveNudge.text, kind: 'nudge' },
    ])
  }, [proactiveNudge, play])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  if (mode === 'closed') {
    return (
      <button
        data-hatch-target="workspace-hatch-chat"
        onClick={() => { play('open'); setMode('floating'); onToggle() }}
        className="absolute bottom-4 right-4 z-20 flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-on-primary shadow-lg hover:shadow-xl hover:scale-105 transition-all"
        title="Open Hatch chat"
      >
        <HatchGlyph size={20} state="idle" className="text-on-primary" />
        <span className="font-label font-semibold text-sm">Ask Hatch</span>
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
          className="relative flex flex-col border-l border-outline-variant bg-surface-container h-full overflow-hidden shrink-0"
        >
        {/* Drag handle */}
        <div
          onMouseDown={startResize}
          className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/20 z-10"
        />
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-outline-variant bg-surface-container-high shrink-0">
          <div className="flex min-w-0 flex-col">
            <div className="flex items-center gap-2">
              <HatchGlyph size={20} state={isLoading ? 'reviewing' : 'idle'} className="text-primary" />
              <span className="font-label font-semibold text-sm text-on-surface">Hatch</span>
            </div>
            {canvasStatusLabel && (
              <div className="mt-0.5 flex min-w-0 items-center gap-1.5 font-label text-[10px] font-bold text-on-surface-variant">
                <span className="truncate">{canvasStatusLabel}</span>
                <span className="h-1 w-1 rounded-full bg-outline-variant" />
                <span className={hasContextPack ? 'text-primary' : ''}>{hasContextPack ? 'context synced' : 'add context'}</span>
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
                <HatchGlyph size={20} state="idle" className="text-primary shrink-0 mt-0.5" />
              )}
              <div
                data-testid={msg.role === 'user' ? 'hatch-message-user' : 'hatch-message-assistant'}
                className={`rounded-xl px-3 py-2 text-sm max-w-[85%] font-body leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary text-on-primary'
                    : msg.kind === 'canvas_action'
                      ? 'bg-primary-container text-on-primary-container'
                      : msg.kind === 'nudge'
                        ? 'bg-tertiary-container text-on-secondary-container border border-outline-variant'
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
                {msg.role === 'hatch' ? <Md>{msg.content}</Md> : msg.content}
                {msg.kind === 'canvas_action' && (
                  <span className="material-symbols-outlined text-[14px] ml-1 opacity-70">draw</span>
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
              <HatchGlyph size={20} state="reviewing" className="text-primary shrink-0" />
              <div className="bg-surface-container-high rounded-xl px-3 py-2 text-sm text-on-surface-variant">
                {challengeType === 'coding' ? 'Hatch is thinking…' : onCanvasActions ? 'Hatch is reading notes and canvas…' : '…'}
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
        {limitGate && (
          <ChallengePaywallGate
            used={limitGate.used}
            limit={limitGate.limit}
            feature={limitGate.feature}
            onUpgrade={startUpgrade}
            onDismiss={() => setLimitGate(null)}
          />
        )}
      </>
    )
  }

  return (
    <>
    <div data-testid="hatch-chat-panel" data-hatch-target="workspace-hatch-chat" className="absolute bottom-4 right-4 z-20 flex flex-col w-80 h-[480px] max-h-[calc(100%-2rem)] border border-outline-variant rounded-xl bg-surface-container shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-outline-variant bg-surface-container-high">
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-col">
            <div className="flex items-center gap-2">
              <HatchGlyph size={20} state={isLoading ? 'reviewing' : 'idle'} className="text-primary" />
              <span className="font-label font-semibold text-sm text-on-surface">Hatch</span>
            </div>
            {canvasStatusLabel && (
              <div className="mt-0.5 flex min-w-0 items-center gap-1.5 font-label text-[10px] font-bold text-on-surface-variant">
                <span className="truncate">{canvasStatusLabel}</span>
                <span className="h-1 w-1 rounded-full bg-outline-variant" />
                <span className={hasContextPack ? 'text-primary' : ''}>{hasContextPack ? 'context synced' : 'add context'}</span>
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
              <HatchGlyph size={20} state="idle" className="text-primary shrink-0 mt-0.5" />
            )}
            <div
              data-testid={msg.role === 'user' ? 'hatch-message-user' : 'hatch-message-assistant'}
              className={`rounded-xl px-3 py-2 text-sm max-w-[85%] font-body leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary text-on-primary'
                  : msg.kind === 'canvas_action'
                    ? 'bg-primary-container text-on-primary-container'
                    : msg.kind === 'nudge'
                      ? 'bg-tertiary-container text-on-secondary-container border border-outline-variant'
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
              {msg.role === 'hatch' ? <Md>{msg.content}</Md> : msg.content}
              {msg.kind === 'canvas_action' && (
                <span className="material-symbols-outlined text-[14px] ml-1 opacity-70">draw</span>
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
            <HatchGlyph size={20} state="reviewing" className="text-primary shrink-0" />
            <div className="bg-surface-container-high rounded-xl px-3 py-2 text-sm text-on-surface-variant">
              {challengeType === 'coding' ? 'Hatch is thinking…' : onCanvasActions ? 'Hatch is reading notes and canvas…' : '…'}
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
    {limitGate && (
      <ChallengePaywallGate
        used={limitGate.used}
        limit={limitGate.limit}
        feature={limitGate.feature}
        onUpgrade={startUpgrade}
        onDismiss={() => setLimitGate(null)}
      />
    )}
    </>
  )
}

'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Md } from '@/components/ui/Md'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import { VoiceInputButton } from './VoiceInputButton'
import type { CanvasScene } from '@/lib/hatch/canvas-scene'
import type { CanvasInterpretResponse, InterviewGrade } from '@/lib/types'
import { useHatchDockState } from '@/hooks/useHatchDockState'

interface ChatMessage {
  role: 'user' | 'hatch'
  content: string
  kind?: 'canvas_action' | 'chat' | 'nudge'
}

interface CanvasChatPanelProps {
  attemptId: string
  challengeId: string
  challengeType: 'system_design' | 'data_modeling' | 'coding'
  scene: CanvasScene
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

function getExamplePrompts(challengeType: 'system_design' | 'data_modeling' | 'coding', language?: string): string[] {
  if (challengeType === 'coding') {
    if (language === 'sql') {
      return [
        "Can you explain the schema?",
        "What kind of JOIN do I need here?",
        "How do I aggregate by user?",
      ]
    }
    return [
      "What approach should I take?",
      "What edge cases should I think about?",
      "Walk me through the time complexity",
    ]
  }
  return []
}

export function CanvasChatPanel({
  attemptId,
  challengeId,
  challengeType,
  scene,
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
  const { mode, panelWidth: _panelWidth, setMode, setPanelWidth: _setPanelWidth, MIN_WIDTH: _MIN_WIDTH, MAX_WIDTH: _MAX_WIDTH } = useHatchDockState('canvas')

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'hatch',
      content: getInitialMessage(challengeType),
      kind: 'chat',
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Suppress unused variable warnings — grade is reserved for future use; isOpen kept for callers
  void grade
  void isOpen

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return
    const userMsg: ChatMessage = { role: 'user', content: text, kind: 'chat' }
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
      if (!res.ok) throw new Error('coach call failed')
      const data = (await res.json()) as CanvasInterpretResponse
      const willBuild = data.actions.length > 0 && !!onCanvasActions
      if (willBuild && onCanvasActions) {
        onCanvasActions({ message: data.message, actions: data.actions })
      }
      setMessages((prev) => [
        ...prev,
        {
          role: 'hatch',
          content: data.message,
          kind: willBuild ? 'canvas_action' : 'chat',
        },
      ])
    } catch {
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
  }, [isLoading, scene, challengeId, challengeType, attemptId, messages, onCanvasActions,
      currentCode, currentLanguage, lastRunResult, timeElapsed, timeRemaining,
      challengeTitle, problemStatement,
      activePartId, activePartSequence, activePartTitle, activePartPrompt,
      activePartResponseType, activePartWeightPct])

  // Proactive nudge: surface in chat thread, auto-dismiss-aware.
  const lastNudgeIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (!proactiveNudge) return
    if (proactiveNudge.id === lastNudgeIdRef.current) return
    lastNudgeIdRef.current = proactiveNudge.id
    setMessages((prev) => [
      ...prev,
      { role: 'hatch', content: proactiveNudge.text, kind: 'nudge' },
    ])
  }, [proactiveNudge])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  if (mode === 'closed') {
    return (
      <button
        onClick={() => { setMode('floating'); onToggle() }}
        className="absolute bottom-4 right-4 z-20 flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-on-primary shadow-lg hover:shadow-xl hover:scale-105 transition-all"
        title="Open Hatch chat"
      >
        <HatchGlyph size={20} state="idle" className="text-on-primary" />
        <span className="font-label font-semibold text-sm">Ask Hatch</span>
      </button>
    )
  }

  return (
    <div data-testid="hatch-chat-panel" className="absolute bottom-4 right-4 z-20 flex flex-col w-80 h-[480px] max-h-[calc(100%-2rem)] border border-outline-variant rounded-xl bg-surface-container shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-outline-variant bg-surface-container-high">
        <div className="flex items-center gap-2">
          <HatchGlyph size={20} state={isLoading ? 'reviewing' : 'idle'} className="text-primary" />
          <span className="font-label font-semibold text-sm text-on-surface">Hatch</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMode('docked')}
            className="text-on-surface-variant hover:text-on-surface transition-colors"
            title="Dock to side"
          >
            <span className="material-symbols-outlined text-[18px]">dock_to_bottom</span>
          </button>
          <button
            onClick={() => { setMode('closed'); onToggle() }}
            className="text-on-surface-variant hover:text-on-surface transition-colors"
            title="Close"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
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
        {/* Example prompts — shown in coding mode when chat is at initial state */}
        {challengeType === 'coding' && messages.length === 1 && !isLoading && (
          <div className="flex flex-col gap-1.5 mt-2">
            {getExamplePrompts(challengeType, currentLanguage).map((prompt) => (
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
              {challengeType === 'coding' ? 'Hatch is thinking…' : onCanvasActions ? 'Hatch is drawing…' : '…'}
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
              placeholder={challengeType === 'coding' ? "Ask Hatch about your code…" : "Ask Hatch or describe what to add…"}
              rows={2}
              className="flex-1 resize-none rounded-lg bg-surface-container border border-outline-variant text-on-surface text-sm px-3 py-2 font-body placeholder:text-on-surface-variant focus:outline-none focus:border-primary"
            />
            <div className="flex flex-col gap-1">
              <VoiceInputButton onTranscript={sendMessage} disabled={isLoading} />
              <button
                onClick={() => sendMessage(input)}
                disabled={isLoading || !input.trim()}
                className="p-2 rounded-full bg-primary text-on-primary disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

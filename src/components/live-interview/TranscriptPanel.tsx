'use client'

import { useEffect, useRef, useState } from 'react'

export interface CoachingSignal {
  flowMove: string
  competency: string
  signal: string
}

export interface TranscriptTurn {
  id: string
  role: 'luma' | 'user'
  content: string
  coachingSignal?: CoachingSignal
}

interface TranscriptPanelProps {
  turns: TranscriptTurn[]
  isThinking?: boolean
  className?: string
}

const FLOW_LABELS: Record<string, string> = {
  frame: 'Frame',
  list: 'List',
  optimize: 'Optimize',
  win: 'Win',
}

const COMPETENCY_LABELS: Record<string, string> = {
  motivation_theory: 'Motivation Theory',
  cognitive_empathy: 'Cognitive Empathy',
  taste: 'Taste',
  strategic_thinking: 'Strategic Thinking',
  creative_execution: 'Creative Execution',
  domain_expertise: 'Domain Expertise',
}

function CoachingChip({ signal }: { signal: CoachingSignal }) {
  const [expanded, setExpanded] = useState(false)

  if (!signal.flowMove && !signal.signal) return null

  return (
    <div className="mt-1.5" data-coaching-chip>
      <button
        onClick={() => setExpanded(!expanded)}
        className="rounded-full text-xs px-2 py-0.5 font-label font-semibold hover:opacity-80 transition-opacity"
        style={{ backgroundColor: 'var(--color-primary-fixed, #c8e8d0)', color: 'var(--color-primary, #4a7c59)' }}
      >
        {FLOW_LABELS[signal.flowMove] ?? signal.flowMove}
        {expanded ? ' \u25BE' : ' \u25B8'}
      </button>
      {expanded && (
        <div className="rounded-lg p-2 mt-1 text-xs max-w-[85%]" style={{ backgroundColor: 'var(--color-surface-container-low, #f5f1ea)', color: 'var(--color-on-surface-variant, #4a4e4a)' }}>
          {signal.competency && (
            <span className="font-label font-semibold" style={{ color: 'var(--color-on-surface-variant, #4a4e4a)' }}>
              {COMPETENCY_LABELS[signal.competency] ?? signal.competency}
              {signal.signal ? ' — ' : ''}
            </span>
          )}
          {signal.signal}
        </div>
      )}
    </div>
  )
}

export default function TranscriptPanel({ turns, isThinking, className }: TranscriptPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const lastTurnId = turns[turns.length - 1]?.id

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [lastTurnId, isThinking])

  return (
    <div
      ref={containerRef}
      className={`overflow-y-auto max-h-48 md:max-h-64 ${className ?? ''}`}
    >
      <div className="flex flex-col gap-3">
        {turns.map((turn) => (
          <div
            key={turn.id}
            className={`flex flex-col ${turn.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <span className="text-xs text-on-surface-variant mb-1 font-label">
              {turn.role === 'luma' ? 'Luma' : 'You'}
            </span>
            <div
              className={
                turn.role === 'luma'
                  ? 'bg-primary-container text-on-primary-container rounded-xl rounded-tl-sm p-3 max-w-[85%] font-body text-sm'
                  : 'bg-surface-container-high text-on-surface rounded-xl rounded-tr-sm p-3 max-w-[85%] ml-auto font-body text-sm'
              }
            >
              {turn.content}
            </div>
            {turn.role === 'luma' && turn.coachingSignal && (
              <CoachingChip signal={turn.coachingSignal} />
            )}
          </div>
        ))}

        {/* Thinking indicator */}
        {isThinking && (
          <div className="flex flex-col items-start">
            <span className="text-xs text-on-surface-variant mb-1 font-label">Luma</span>
            <div className="bg-primary-container text-on-primary-container rounded-xl rounded-tl-sm p-3 font-body text-sm">
              <span className="inline-flex gap-1">
                <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

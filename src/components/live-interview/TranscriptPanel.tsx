'use client'

import { useEffect, useRef } from 'react'

interface TranscriptTurn {
  id: string
  role: 'luma' | 'user'
  content: string
}

interface TranscriptPanelProps {
  turns: TranscriptTurn[]
  className?: string
}

export default function TranscriptPanel({ turns, className }: TranscriptPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const lastTurnId = turns[turns.length - 1]?.id

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [lastTurnId])

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
          </div>
        ))}
      </div>
    </div>
  )
}

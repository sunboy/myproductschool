'use client'

import { useEffect, useRef } from 'react'

interface ChatPanelProps {
  isOpen: boolean
  onClose: () => void
  turns: Array<{ role: 'luma' | 'user'; content: string; id: string }>
}

export default function ChatPanel({ isOpen, onClose, turns }: ChatPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const lastTurnId = turns[turns.length - 1]?.id

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [lastTurnId])

  // Set inert via DOM ref to avoid React type conflicts (inert is boolean in React but '' in HTML spec)
  useEffect(() => {
    if (panelRef.current) {
      if (!isOpen) {
        panelRef.current.setAttribute('inert', '')
      } else {
        panelRef.current.removeAttribute('inert')
      }
    }
  }, [isOpen])

  return (
    <div
      ref={panelRef}
      className="fixed right-0 top-0 h-full w-80 bg-surface-container-low border-l border-outline-variant z-50 flex flex-col transition-transform duration-300"
      style={{ transform: isOpen ? 'translateX(0)' : 'translateX(100%)' }}
      aria-hidden={!isOpen}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant bg-surface-container-low">
        <span className="font-label font-semibold text-on-surface text-sm">Chat</span>
        <button
          onClick={onClose}
          className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors"
          aria-label="Close chat panel"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      {/* Message list */}
      <div ref={listRef} className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-3">
          {turns.length === 0 ? (
            <p className="text-center text-on-surface-variant font-body text-sm mt-8">
              The conversation will appear here.
            </p>
          ) : (
            turns.map((turn) => (
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
            ))
          )}
        </div>
      </div>
    </div>
  )
}

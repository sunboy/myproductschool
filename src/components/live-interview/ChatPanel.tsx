'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'

interface ChatPanelProps {
  isOpen: boolean
  onClose: () => void
  turns: Array<{ role: 'luma' | 'user'; content: string; id: string }>
  sessionId?: string
  onSendMessage?: (text: string) => Promise<void>
}

export default function ChatPanel({ isOpen, onClose, turns, onSendMessage }: ChatPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [inputText, setInputText] = useState('')
  const [isSending, setIsSending] = useState(false)
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

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const text = inputText.trim()
    if (!text || isSending || !onSendMessage) return
    setIsSending(true)
    setInputText('')
    try {
      await onSendMessage(text)
    } finally {
      setIsSending(false)
      inputRef.current?.focus()
    }
  }

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

      {/* Text input */}
      {onSendMessage && (
        <form onSubmit={handleSubmit} className="p-3 border-t border-outline-variant flex gap-2 shrink-0">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isSending}
            placeholder="Type a message..."
            className="flex-1 bg-surface-container border border-outline-variant rounded-full px-4 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/40 font-body focus:outline-none focus:border-primary disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isSending || !inputText.trim()}
            className="h-9 w-9 rounded-full bg-primary flex items-center justify-center disabled:opacity-40"
            aria-label="Send message"
          >
            <span className="material-symbols-outlined text-on-primary text-[18px]">send</span>
          </button>
        </form>
      )}
    </div>
  )
}

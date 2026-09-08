'use client'

import type { RefObject } from 'react'

interface TranscriptComposerProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (text: string) => Promise<void> | void
  sending: boolean
  inputRef?: RefObject<HTMLInputElement | null>
  placeholder?: string
}

/**
 * Chat composer for the dark interview room. Extracted from the legacy
 * chat-drawer <form> (input + send button) so both the legacy chat drawer
 * and the density transcript column submit through identical markup and
 * disabled/empty-input guards.
 */
export function TranscriptComposer({ value, onChange, onSubmit, sending, inputRef, placeholder = 'Type a message...' }: TranscriptComposerProps) {
  return (
    <form
      className="shrink-0 flex items-center gap-2 px-4 py-3"
      style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
      onSubmit={async (e) => {
        e.preventDefault()
        const text = value.trim()
        if (!text || sending) return
        onChange('')
        await onSubmit(text)
      }}
    >
      <input
        ref={inputRef}
        data-testid="live-interview-chat-input"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={sending}
        placeholder={placeholder}
        className="flex-1 rounded-full px-4 py-2 font-body text-sm focus:outline-none disabled:opacity-50"
        style={{
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: 'rgba(243,237,224,0.88)',
        }}
      />
      <button
        type="submit"
        data-testid="live-interview-chat-send"
        disabled={sending || !value.trim()}
        className="flex items-center justify-center rounded-full disabled:opacity-40"
        style={{ width: 38, height: 38, background: '#4a7c59' }}
        aria-label="Send"
      >
        <span className="material-symbols-outlined text-[18px]" style={{ color: '#fff' }}>send</span>
      </button>
    </form>
  )
}

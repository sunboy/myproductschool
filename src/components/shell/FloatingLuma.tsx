'use client'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

const CONTEXT_LINES: Record<string, string> = {
  '/dashboard': 'Set your first challenge of the day with me?',
  '/explore': 'Want me to recommend a plan for your role?',
  '/challenges': 'I can pre-filter challenges to your weakest move.',
  '/live-interviews': "I'll be your interviewer — ready when you are.",
  '/progress': 'Want a 60-second recap of your week?',
}

const QUICK_REPLIES = ['Yes please', 'Not now', 'Something else']

export function FloatingLuma() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')

  const contextKey = Object.keys(CONTEXT_LINES).find(k => pathname.startsWith(k)) ?? ''
  const contextLine = CONTEXT_LINES[contextKey] ?? 'Want to talk it through?'

  function sendMessage() {
    if (!message.trim()) return
    console.log('[FloatingLuma] send:', message.trim())
    setMessage('')
  }

  return (
    <div className="fixed bottom-6 right-6 z-30">
      {/* Expanded panel */}
      {open && (
        <div
          className="animate-fade-up absolute bottom-20 right-0 w-[340px] rounded-2xl overflow-hidden border border-outline-faint"
          style={{ background: 'var(--color-surface)', boxShadow: '0 24px 60px -12px rgba(30,27,20,0.3)' }}
        >
          {/* Panel header */}
          <div
            className="flex items-center gap-2.5 px-4 py-3 border-b border-outline-faint"
            style={{ background: 'linear-gradient(180deg, var(--color-primary-fixed), transparent)' }}
          >
            <LumaGlyph size={36} state="speaking" className="text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-label font-bold text-sm text-on-surface">Ask Luma</div>
              <div className="text-xs" style={{ color: 'var(--color-on-surface-muted)' }}>Contextual to this screen</div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-on-surface-variant hover:text-on-surface transition-colors"
              aria-label="Close"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          {/* Coach message */}
          <div className="p-4">
            <div
              className="text-sm leading-relaxed px-3.5 py-2.5 rounded-2xl rounded-bl-sm text-on-primary-container"
              style={{ background: 'var(--color-primary-container)' }}
            >
              {contextLine}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {QUICK_REPLIES.map(r => (
                <button
                  key={r}
                  onClick={() => setMessage(r)}
                  className="px-3 py-1 rounded-full text-xs font-label font-semibold border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Input bar */}
          <div className="px-3 py-2.5 border-t border-outline-faint flex items-center gap-2 bg-surface-container-low">
            <input
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message…"
              className="flex-1 text-sm px-3 py-1.5 rounded-full border border-outline-variant bg-surface text-on-surface placeholder:text-on-surface-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button
              onClick={sendMessage}
              className="w-8 h-8 rounded-full flex items-center justify-center text-on-primary shrink-0"
              style={{ background: 'var(--color-primary)' }}
              aria-label="Send"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
            </button>
          </div>
        </div>
      )}

      {/* FAB button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-16 h-16 rounded-2xl flex items-center justify-center relative"
        style={{
          background: 'linear-gradient(135deg, #4a7c59, #264a34)',
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: '0 24px 60px -24px rgba(30,27,20,0.4)',
        }}
        aria-label="Ask Luma"
      >
        <LumaGlyph size={44} state={open ? 'speaking' : 'idle'} className="text-white" />
        {!open && (
          <span
            className="absolute -top-1 -right-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white font-label"
            style={{ background: 'var(--color-amber)' }}
          >
            Ask
          </span>
        )}
      </button>
    </div>
  )
}

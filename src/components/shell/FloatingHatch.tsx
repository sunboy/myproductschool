'use client'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef, useCallback } from 'react'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import { useHatchContext } from '@/context/HatchContext'
import type { HatchChatMessage } from '@/context/HatchContext'

// ── Page context ──────────────────────────────────────────────

const PAGE_PROMPTS: { pattern: RegExp; message: string }[] = [
  { pattern: /^\/workspace\/challenges\//, message: "Need a nudge on your approach?" },
  { pattern: /^\/challenges\/[^/]+\/feedback/, message: "Want to dig into your feedback?" },
  { pattern: /^\/explore\/plans\//, message: "Thinking about this plan? I can tell you if it fits your gaps." },
  { pattern: /^\/explore\/domains\//, message: "Want to know which challenges here will help you most?" },
  { pattern: /^\/explore/, message: "Not sure where to start? Tell me your role." },
  { pattern: /^\/challenges/, message: "I can filter these to the FLOW move you need most." },
  { pattern: /^\/progress/, message: "Want to understand what your numbers actually mean?" },
  { pattern: /^\/cohort/, message: "Ask me what to focus on this week." },
  { pattern: /^\/dashboard/, message: "Ready to pick your first challenge today?" },
]

function getPagePrompt(pathname: string): string {
  for (const { pattern, message } of PAGE_PROMPTS) {
    if (pattern.test(pathname)) return message
  }
  return "Ask me anything about FLOW or product thinking."
}

function parsePageContext(pathname: string): { pageType: string; entityId: string | null } {
  const m = pathname.match(/^\/workspace\/challenges\/([^/]+)/)
  if (m) return { pageType: 'challenge', entityId: m[1] }
  const fb = pathname.match(/^\/challenges\/([^/]+)\/feedback/)
  if (fb) return { pageType: 'challenge_feedback', entityId: fb[1] }
  const sp = pathname.match(/^\/explore\/plans\/([^/]+)/)
  if (sp) return { pageType: 'study_plan', entityId: sp[1] }
  const dm = pathname.match(/^\/explore\/domains\/([^/]+)/)
  if (dm) return { pageType: 'domain', entityId: dm[1] }
  if (pathname.startsWith('/dashboard')) return { pageType: 'dashboard', entityId: null }
  if (pathname.startsWith('/explore')) return { pageType: 'explore', entityId: null }
  if (pathname.startsWith('/challenges')) return { pageType: 'practice', entityId: null }
  if (pathname.startsWith('/progress')) return { pageType: 'progress', entityId: null }
  if (pathname.startsWith('/cohort')) return { pageType: 'cohort', entityId: null }
  return { pageType: 'general', entityId: null }
}

// ── Markdown renderer ─────────────────────────────────────────

function InlineMarkdown({ text, onNavigate }: { text: string; onNavigate: (href: string) => void }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/)
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**')) {
          return <strong key={i} className="font-semibold">{p.slice(2, -2)}</strong>
        }
        const linkMatch = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
        if (linkMatch) {
          const [, label, href] = linkMatch
          const isInternal = href.startsWith('/')
          if (isInternal) {
            return (
              <button
                key={i}
                onClick={() => onNavigate(href)}
                className="underline underline-offset-2 font-medium hover:opacity-70 transition-opacity text-left"
                style={{ color: 'var(--color-primary)' }}
              >
                {label}
              </button>
            )
          }
          return (
            <a key={i} href={href} target="_blank" rel="noopener noreferrer"
              className="underline underline-offset-2 font-medium hover:opacity-70 transition-opacity"
              style={{ color: 'var(--color-primary)' }}
            >
              {label}
            </a>
          )
        }
        return <span key={i}>{p}</span>
      })}
    </>
  )
}

function HatchText({ text, onNavigate }: { text: string; onNavigate: (href: string) => void }) {
  const paragraphs = text.split(/\n\n+/)
  return (
    <span className="flex flex-col gap-1.5">
      {paragraphs.map((para, i) => {
        const lines = para.split(/\n/)
        const isList = lines.every(l => /^[-*]\s/.test(l.trim()) || l.trim() === '')
        if (isList) {
          return (
            <ul key={i} className="list-disc list-outside pl-3 flex flex-col gap-0.5">
              {lines.filter(l => l.trim()).map((l, j) => (
                <li key={j}><InlineMarkdown text={l.replace(/^[-*]\s+/, '')} onNavigate={onNavigate} /></li>
              ))}
            </ul>
          )
        }
        return <p key={i}><InlineMarkdown text={para} onNavigate={onNavigate} /></p>
      })}
    </span>
  )
}

// ── Main component ────────────────────────────────────────────

export function FloatingHatch() {
  const pathname = usePathname()
  const router = useRouter()
  const hatchCtx = useHatchContext()
  const glyphState = hatchCtx?.state ?? 'idle'

  // Suppress on the challenge workspace — workspace has its own Hatch affordance
  // (HatchSidePanel for FLOW, CanvasChatPanel for system_design/data_modeling)
  const isInWorkspace = /^\/workspace\/challenges\/[^/]+/.test(pathname)
  if (isInWorkspace) return null

  // Chat messages live in context so they persist across page navigations
  const messages: HatchChatMessage[] = hatchCtx?.chatMessages ?? []
  const setMessages = hatchCtx?.setChatMessages ?? (() => {})

  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [bubble, setBubble] = useState(false)
  const [bubbleDismissed, setBubbleDismissed] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const bubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Show bubble on each page change (but not if chat has started)
  useEffect(() => {
    if (messages.length > 0) return
    setBubbleDismissed(false)
    setBubble(false)
    if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current)
    bubbleTimerRef.current = setTimeout(() => setBubble(true), 1200)
    return () => { if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current) }
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-hide bubble after 6s
  useEffect(() => {
    if (!bubble) return
    const t = setTimeout(() => setBubble(false), 6000)
    return () => clearTimeout(t)
  }, [bubble])

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80)
  }, [open])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Listen for open-ask-hatch event
  useEffect(() => {
    const handler = () => { setOpen(true); setBubble(false) }
    window.addEventListener('open-ask-hatch', handler)
    return () => window.removeEventListener('open-ask-hatch', handler)
  }, [])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: HatchChatMessage = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    const { pageType, entityId } = parsePageContext(pathname)

    try {
      const res = await fetch('/api/hatch/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages,
          challengeId: null,
          challengePrompt: null,
          pageContext: { pageType, entityId, pathname },
        }),
      })
      const data = res.ok ? await res.json() : null
      const reply = data?.reply ?? "I'm having trouble responding right now. Try again in a moment."
      setMessages(prev => [...prev, { role: 'hatch', content: reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'hatch', content: "I'm having trouble responding right now. Try again in a moment." }])
    } finally {
      setLoading(false)
    }
  }, [input, loading, messages, pathname, setMessages])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  function handleNavigate(href: string) {
    setOpen(false)
    router.push(href)
  }

  function toggleOpen() {
    setOpen(o => !o)
    setBubble(false)
    setBubbleDismissed(true)
  }

  function dismissBubble(e: React.MouseEvent) {
    e.stopPropagation()
    setBubble(false)
    setBubbleDismissed(true)
  }

  const contextMessage = (hatchCtx?.message && hatchCtx.message.length > 0)
    ? hatchCtx.message
    : getPagePrompt(pathname)

  const showBubble = bubble && !bubbleDismissed && !open && messages.length === 0
  const isWorkspace = pathname.startsWith('/workspace')

  return (
    <div className={`fixed right-5 z-40 flex flex-col items-end gap-2 pointer-events-none ${isWorkspace ? 'bottom-20' : 'bottom-5'}`}>

      {/* ── Floating chat panel ── */}
      {open && (
        <div
          className="flex flex-col rounded-2xl overflow-hidden pointer-events-auto"
          style={{
            width: 320,
            height: 440,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-outline-variant)',
            boxShadow: '0 16px 48px -8px rgba(30,27,20,0.22), 0 2px 8px rgba(30,27,20,0.08)',
            animation: 'hatchSlideUp 0.2s cubic-bezier(0.34,1.56,0.64,1) both',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-2.5 px-4 py-2.5 shrink-0"
            style={{
              background: 'linear-gradient(135deg, var(--color-primary-fixed), var(--color-surface-container-low))',
              borderBottom: '1px solid var(--color-outline-variant)',
            }}
          >
            <HatchGlyph size={28} state={loading ? 'speaking' : 'idle'} className="text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-on-surface font-headline leading-tight">Hatch</p>
              <p className="text-[10px] text-on-surface-variant leading-tight">
                {parsePageContext(pathname).pageType === 'challenge' ? 'Coaching on this challenge' :
                 parsePageContext(pathname).pageType === 'progress' ? 'Reviewing your progress' :
                 'Your product thinking coach'}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  className="p-1 rounded-lg hover:bg-black/10 transition-colors"
                  aria-label="Clear chat"
                  title="Clear chat"
                >
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant">delete_sweep</span>
                </button>
              )}
              <button
                onClick={toggleOpen}
                className="p-1 rounded-lg hover:bg-black/10 transition-colors"
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">close</span>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5" style={{ scrollbarWidth: 'none' }}>
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-2 pb-4">
                <HatchGlyph size={44} state="listening" className="text-primary" />
                <p className="text-xs text-on-surface-variant text-center leading-relaxed px-4">
                  {contextMessage}
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-1.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {msg.role === 'hatch' && (
                  <HatchGlyph size={18} state="speaking" className="text-primary shrink-0 mt-0.5" />
                )}
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary text-on-primary rounded-tr-sm'
                      : 'bg-surface-container text-on-surface rounded-tl-sm'
                  }`}
                >
                  {msg.role === 'hatch'
                    ? <HatchText text={msg.content} onNavigate={handleNavigate} />
                    : msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-1.5">
                <HatchGlyph size={18} state="speaking" className="text-primary shrink-0 mt-0.5" />
                <div className="bg-surface-container rounded-xl rounded-tl-sm px-3 py-2 flex gap-1 items-center">
                  <span className="w-1 h-1 bg-on-surface-variant rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-1 bg-on-surface-variant rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-1 bg-on-surface-variant rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div
            className="px-3 py-2.5 shrink-0"
            style={{ borderTop: '1px solid var(--color-outline-variant)' }}
          >
            <div className="flex gap-2 items-center">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about FLOW or product thinking…"
                disabled={loading}
                className="flex-1 bg-surface-container-low rounded-full px-3 py-1.5 text-xs text-on-surface placeholder:text-on-surface-variant/50 outline-none border border-outline-variant/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="w-7 h-7 rounded-full bg-primary flex items-center justify-center disabled:opacity-30 hover:opacity-90 transition-opacity shrink-0"
                aria-label="Send"
              >
                <span className="material-symbols-outlined text-on-primary text-[14px]">send</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Contextual bubble ── */}
      {showBubble && (
        <div
          className="relative cursor-pointer select-none pointer-events-auto"
          style={{ maxWidth: 220, animation: 'hatchFadeUp 0.2s ease both' }}
          onClick={toggleOpen}
        >
          <div
            className="rounded-2xl rounded-br-sm px-3 py-2 text-xs leading-relaxed font-label shadow-md"
            style={{
              background: 'var(--color-inverse-surface)',
              color: 'var(--color-inverse-on-surface)',
            }}
          >
            {contextMessage}
          </div>
          <div
            className="absolute -bottom-1.5 right-5 w-3 h-3 rotate-45"
            style={{ background: 'var(--color-inverse-surface)' }}
          />
          <button
            onClick={dismissBubble}
            className="absolute -top-2 -right-2 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
            style={{ background: 'var(--color-surface-container-highest)', color: 'var(--color-on-surface-variant)' }}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {/* ── FAB ── */}
      <button
        onClick={toggleOpen}
        className="pointer-events-auto rounded-2xl flex items-center justify-center relative transition-transform active:scale-95 hover:scale-105"
        style={{
          width: 52,
          height: 52,
          background: open
            ? 'linear-gradient(135deg, #264a34, #1a3325)'
            : 'linear-gradient(135deg, #4a7c59, #264a34)',
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: '0 6px 24px -6px rgba(36,62,40,0.45)',
        }}
        aria-label={open ? 'Close Hatch' : 'Ask Hatch'}
      >
        <HatchGlyph size={36} state={open ? 'listening' : glyphState} className="text-white" />
        {/* Unread dot when chat has messages and panel is closed */}
        {!open && messages.length > 0 && (
          <span
            className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full border-2"
            style={{ background: 'var(--color-tertiary)', borderColor: 'var(--color-background)' }}
          />
        )}
      </button>

      <style>{`
        @keyframes hatchSlideUp {
          from { opacity: 0; transform: translateY(12px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
        @keyframes hatchFadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

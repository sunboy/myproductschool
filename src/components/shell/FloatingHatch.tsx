'use client'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { CSSProperties, Dispatch, SetStateAction } from 'react'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import { HatchChoreography } from '@/components/shell/HatchChoreography'
import { useHatchContext } from '@/context/HatchContext'
import type { HatchChatMessage, HatchCue } from '@/context/HatchContext'
import { useHatchSonics } from '@/hooks/useHatchSonics'

// ── Page context ──────────────────────────────────────────────

const EMPTY_MESSAGES: HatchChatMessage[] = []
const noopSetMessages: Dispatch<SetStateAction<HatchChatMessage[]>> = () => undefined

const PAGE_PROMPTS: { pattern: RegExp; message: string }[] = [
  { pattern: /^\/workspace\/challenges\//, message: "Need a nudge on your approach?" },
  { pattern: /^\/challenges\/[^/]+\/feedback/, message: "Want to dig into your feedback?" },
  { pattern: /^\/explore\/plans\//, message: "Thinking about this plan? I can tell you if it fits your gaps." },
  { pattern: /^\/explore\/domains\//, message: "Want to know which challenges here will help you most?" },
  { pattern: /^\/explore/, message: "Not sure where to start? Tell me your role." },
  { pattern: /^\/challenges/, message: "I can filter these to the FLOW move you need most." },
  { pattern: /^\/progress/, message: "Want to understand what your numbers actually mean?" },
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
  const activeCue = hatchCtx?.activeCue ?? null
  const clearCue = hatchCtx?.clearCue
  const glyphState = hatchCtx?.state ?? 'idle'
  const { muted, toggleMuted, play } = useHatchSonics()

  // Suppress on the challenge workspace - workspace has its own Hatch affordance
  // (HatchSidePanel for FLOW, CanvasChatPanel for system_design/data_modeling)
  const isInWorkspace = /^\/workspace\/challenges\/[^/]+/.test(pathname)

  // Chat messages live in context so they persist across page navigations
  const messages = hatchCtx?.chatMessages ?? EMPTY_MESSAGES
  const setMessages = hatchCtx?.setChatMessages ?? noopSetMessages

  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [bubble, setBubble] = useState(false)
  const [bubbleDismissed, setBubbleDismissed] = useState(false)
  const [markerPosition, setMarkerPosition] = useState<CSSProperties | null>(null)

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

  useEffect(() => {
    if (!activeCue?.autoHideMs || !clearCue) return
    const timer = setTimeout(() => clearCue(), activeCue.autoHideMs)
    return () => clearTimeout(timer)
  }, [activeCue?.autoHideMs, activeCue?.id, clearCue])

  useEffect(() => {
    const highlighted = new Set<Element>()
    let scrolledTargetIntoView = false

    function clearHighlights() {
      highlighted.forEach((el) => el.classList.remove('hatch-target-highlight'))
      highlighted.clear()
    }

    if (!activeCue?.target || typeof window === 'undefined') {
      setMarkerPosition(null)
      return clearHighlights
    }

    const selector = `[data-hatch-target="${CSS.escape(activeCue.target)}"]`
    const target = document.querySelector<HTMLElement>(selector)
    if (!target) {
      setMarkerPosition(null)
      return clearHighlights
    }

    target.classList.add('hatch-target-highlight')
    highlighted.add(target)

    const keepTargetReachable = () => {
      const rect = target.getBoundingClientRect()
      const offscreen = rect.bottom < 72 || rect.top > window.innerHeight - 72
      if (offscreen && activeCue.source === 'tour' && !scrolledTargetIntoView) {
        scrolledTargetIntoView = true
        target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' })
        return
      }
      if (offscreen) {
        setMarkerPosition(null)
        return
      }

      const markerWidth = 34
      const left = Math.max(14, Math.min(window.innerWidth - markerWidth - 14, rect.left + rect.width / 2 - markerWidth / 2))
      const placeBelow = rect.top < 120
      const top = placeBelow
        ? Math.min(window.innerHeight - 58, rect.bottom + 12)
        : Math.max(78, rect.top - 46)

      setMarkerPosition({
        left,
        top,
      })
    }

    keepTargetReachable()
    target.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
    if (activeCue.source === 'tour') play('nudge')
    window.addEventListener('resize', keepTargetReachable)
    window.addEventListener('scroll', keepTargetReachable, true)

    return () => {
      window.removeEventListener('resize', keepTargetReachable)
      window.removeEventListener('scroll', keepTargetReachable, true)
      clearHighlights()
      setMarkerPosition(null)
    }
  }, [activeCue?.id, activeCue?.source, activeCue?.target, play])

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
    play('send')
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
      play(res.ok ? 'reply' : 'error')
      setMessages(prev => [...prev, { role: 'hatch', content: reply }])
    } catch {
      play('error')
      setMessages(prev => [...prev, { role: 'hatch', content: "I'm having trouble responding right now. Try again in a moment." }])
    } finally {
      setLoading(false)
    }
  }, [input, loading, messages, pathname, setMessages, play])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  function handleNavigate(href: string) {
    setOpen(false)
    router.push(href)
  }

  function toggleOpen() {
    setOpen(o => {
      const next = !o
      play(next ? 'open' : 'close')
      return next
    })
    setBubble(false)
    setBubbleDismissed(true)
  }

  function dismissBubble(e: React.MouseEvent) {
    e.stopPropagation()
    setBubble(false)
    setBubbleDismissed(true)
  }

  function runCueAction(cue: HatchCue) {
    const cta = cue.cta
    if (cta?.href) {
      hatchCtx?.clearCue()
      router.push(cta.href)
      return
    }
    if (cta?.event) {
      window.dispatchEvent(new CustomEvent(cta.event, { detail: { cue } }))
      hatchCtx?.clearCue()
      return
    }

    switch (cta?.action) {
      case 'start-tour':
        play('open')
        setOpen(false)
        setBubble(false)
        hatchCtx?.startTour()
        return
      case 'next-tour-step':
        hatchCtx?.nextTourStep()
        return
      case 'complete-tour':
        play('success')
        hatchCtx?.completeTour()
        return
      case 'skip-tour':
        hatchCtx?.skipTour()
        return
      case 'open-workspace-chat':
        window.dispatchEvent(new CustomEvent('open-hatch-workspace', { detail: { cue } }))
        hatchCtx?.clearCue()
        return
      case 'open-chat':
        if (isInWorkspace) {
          window.dispatchEvent(new CustomEvent('open-hatch-workspace', { detail: { cue } }))
          hatchCtx?.clearCue()
          return
        }
        play('open')
        setOpen(true)
        setBubble(false)
        hatchCtx?.clearCue()
        return
      default:
        if (isInWorkspace) {
          window.dispatchEvent(new CustomEvent('open-hatch-workspace', { detail: { cue } }))
          hatchCtx?.clearCue()
          return
        }
        toggleOpen()
    }
  }

  function handleCuePrimary() {
    if (!activeCue) {
      toggleOpen()
      return
    }
    runCueAction(activeCue)
  }

  function dismissCue(e: React.MouseEvent) {
    e.stopPropagation()
    if (activeCue?.source === 'tour') {
      hatchCtx?.skipTour()
      return
    }
    hatchCtx?.dismissCue({ snooze: true })
  }

  const contextMessage = (hatchCtx?.message && hatchCtx.message.length > 0)
    ? hatchCtx.message
    : getPagePrompt(pathname)

  const cueMessage = activeCue?.message ?? contextMessage
  const showBubble = !open && (
    Boolean(activeCue) ||
    (bubble && !bubbleDismissed && messages.length === 0)
  )
  const isWorkspace = pathname.startsWith('/workspace')
  const wrapperPositionClass = `right-5 ${isWorkspace ? 'bottom-20' : 'bottom-5'}`
  const currentAnimation = activeCue?.animation ?? (open ? 'listening' : 'idle-hover')
  const currentGlyphState = open ? 'listening' : activeCue?.state ?? glyphState

  if (isInWorkspace && !activeCue) return null

  return (
    <div
      data-testid="floating-hatch"
      className={`fixed z-[60] flex flex-col items-end gap-2 pointer-events-none ${wrapperPositionClass}`}
    >
      {markerPosition && (
        <div
          data-testid="hatch-target-marker"
          className="fixed z-50 pointer-events-none flex h-8 w-8 items-center justify-center rounded-full hatch-target-marker"
          style={markerPosition}
          aria-hidden="true"
        >
          <span className="material-symbols-outlined text-[18px] leading-none">ads_click</span>
        </div>
      )}

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
                onClick={toggleMuted}
                className="p-1 rounded-lg hover:bg-black/10 transition-colors"
                aria-label={muted ? 'Turn Hatch sounds on' : 'Mute Hatch sounds'}
                title={muted ? 'Turn Hatch sounds on' : 'Mute Hatch sounds'}
              >
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                  {muted ? 'volume_off' : 'volume_up'}
                </span>
              </button>
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
                {!isInWorkspace && (
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false)
                      setBubble(false)
                      hatchCtx?.startTour()
                    }}
                    className="mt-1 inline-flex items-center gap-1 rounded-full border border-outline-variant px-3 py-1.5 text-[11px] font-label font-bold text-primary hover:bg-primary-fixed"
                  >
                    Show me around
                    <span className="material-symbols-outlined text-[13px]">route</span>
                  </button>
                )}
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
          className={`relative select-none pointer-events-auto ${activeCue ? 'cursor-default' : 'cursor-pointer'}`}
          style={{ maxWidth: activeCue ? 260 : 220, animation: 'hatchFadeUp 0.2s ease both' }}
          onClick={activeCue ? undefined : toggleOpen}
          data-testid={activeCue ? 'hatch-cue-bubble' : 'hatch-page-bubble'}
        >
          <div
            className="rounded-2xl rounded-br-sm px-3 py-2 text-xs leading-relaxed font-label shadow-md"
            style={{
              background: 'var(--color-inverse-surface)',
              color: 'var(--color-inverse-on-surface)',
            }}
          >
            <p className="m-0 font-label text-[12px] leading-relaxed">
              {cueMessage}
            </p>
            {activeCue?.cta && (
              <button
                type="button"
                data-testid="hatch-cue-action"
                onClick={handleCuePrimary}
                className="mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-label text-[11px] font-extrabold transition-transform active:scale-95"
                style={{
                  background: 'rgba(255,255,255,0.14)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  color: 'var(--color-inverse-on-surface)',
                }}
              >
                {activeCue.cta.label}
                <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
              </button>
            )}
          </div>
          <div
            className="absolute -bottom-1.5 right-5 w-3 h-3 rotate-45"
            style={{ background: 'var(--color-inverse-surface)' }}
          />
          <button
            onClick={activeCue ? dismissCue : dismissBubble}
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
        onClick={activeCue ? handleCuePrimary : toggleOpen}
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
        data-testid="hatch-fab"
      >
        <HatchChoreography animation={currentAnimation}>
          <HatchGlyph size={36} state={currentGlyphState} className="text-white" />
        </HatchChoreography>
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

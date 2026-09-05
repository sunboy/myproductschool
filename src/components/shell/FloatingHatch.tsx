'use client'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { motion, PresencePanel } from '@/components/motion'
import type { HatchState } from '@/components/shell/HatchGlyph'
import { HatchImage } from '@/components/redesign/HatchImage'
import type { HatchImageState } from '@/components/redesign/HatchImage'
import { HatchChoreography } from '@/components/shell/HatchChoreography'
import { HatchTargetPointer } from '@/components/shell/hatch/HatchTargetPointer'
import {
  getPagePromptEntry,
  pagePromptDestination,
  promptForFreshConversation,
  type HatchPickResponse,
  type PagePromptCta,
} from '@/components/shell/hatch/pagePrompts'
import { useHatchContext } from '@/context/HatchContext'
import type { HatchChatMessage, HatchCue } from '@/context/HatchContext'
import { useHatchSonics } from '@/hooks/useHatchSonics'
import { buildHatchPageContext, parseHatchPageContext } from '@/lib/hatch/page-context'

// ── Constants ──────────────────────────────────────────────

const EMPTY_MESSAGES: HatchChatMessage[] = []

// HatchGlyph state -> HatchImage pose. States with no direct v2 pose map to the
// closest pose in HATCH_STATE_MAP (see src/components/redesign/HatchImage.tsx).
const GLYPH_STATE_TO_IMAGE: Record<HatchState, HatchImageState> = {
  idle: 'idle',
  listening: 'listening',
  reviewing: 'reviewing',
  speaking: 'speaking',
  celebrating: 'celebrating',
  intrigued: 'thinking',
  challenging: 'pointing',
  delighted: 'celebrating',
  none: 'idle',
}
const noopSetMessages: Dispatch<SetStateAction<HatchChatMessage[]>> = () => undefined

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
  // (the in-workspace coach dock for FLOW/coding, CanvasChatPanel for
  // system_design/data_modeling).
  const isInWorkspace = /^\/workspace\/challenges\/[^/]+/.test(pathname)

  // Chat messages live in context so they persist across page navigations
  const messages = hatchCtx?.chatMessages ?? EMPTY_MESSAGES
  const setMessages = hatchCtx?.setChatMessages ?? noopSetMessages

  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [pageCtaBusy, setPageCtaBusy] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!activeCue?.autoHideMs || !clearCue) return
    const timer = setTimeout(() => clearCue(), activeCue.autoHideMs)
    return () => clearTimeout(timer)
  }, [activeCue?.autoHideMs, activeCue?.id, clearCue])

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80)
  }, [open])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Listen for open-ask-hatch events from contextual cards. A prompt may prime
  // a fresh conversation, but it never overwrites an active thread or draft.
  useEffect(() => {
    const handler = (event: Event) => {
      const candidate = (event as CustomEvent<{ prompt?: unknown }>).detail?.prompt
      const prompt = promptForFreshConversation(candidate, messages.length > 0, input)
      if (prompt) setInput(prompt)
      setOpen(true)
    }
    window.addEventListener('open-ask-hatch', handler)
    return () => window.removeEventListener('open-ask-hatch', handler)
  }, [input, messages.length])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: HatchChatMessage = { role: 'user', content: text }
    play('send')
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    const pageContext = buildHatchPageContext(pathname)

    try {
      const res = await fetch('/api/hatch/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages,
          challengeId: null,
          challengePrompt: null,
          pageContext,
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
  }


  // Fire-and-forget click log so Hatch's session memory sees which cues convert.
  // Contract shared with /api/hatch/interactions: { kind, payload } (payload jsonb).
  const logCueClick = useCallback((cta: string) => {
    try {
      const body = JSON.stringify({ kind: 'cue_click', payload: { path: pathname, cta } })
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon('/api/hatch/interactions', new Blob([body], { type: 'application/json' }))
      } else {
        void fetch('/api/hatch/interactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true,
        }).catch(() => {})
      }
    } catch {
      // Logging must never break the interaction itself.
    }
  }, [pathname])

  function runCueAction(cue: HatchCue) {
    const cta = cue.cta
    if (cta?.label) logCueClick(cta.label)
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
      case 'open-workspace-chat':
        window.dispatchEvent(new CustomEvent('open-hatch-workspace', { detail: { cue } }))
        hatchCtx?.clearCue()
        return
      case 'open-chat': {
        if (isInWorkspace) {
          window.dispatchEvent(new CustomEvent('open-hatch-workspace', { detail: { cue } }))
          hatchCtx?.clearCue()
          return
        }
        const prompt = cta?.prompt?.trim()
        // Only prime a fresh conversation; never overwrite text the user is mid-typing
        // or an existing thread.
        if (prompt && messages.length === 0 && input.trim().length === 0) {
          setInput(prompt)
        }
        play('open')
        setOpen(true)
        hatchCtx?.clearCue()
        return
      }
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

  const pagePrompt = getPagePromptEntry(pathname)

  function openPagePromptChat(cta: PagePromptCta, fallbackPrompt?: string) {
    const prompt = promptForFreshConversation(
      cta.prompt ?? fallbackPrompt,
      messages.length > 0,
      input,
    )
    if (prompt) setInput(prompt)
    logCueClick(cta.label)
    play('open')
    setOpen(true)
  }

  async function runPagePromptCta(cta: PagePromptCta) {
    if (pageCtaBusy) return

    if (cta.action === 'open-chat') {
      openPagePromptChat(cta)
      return
    }

    setPageCtaBusy(true)
    try {
      let pick: HatchPickResponse | null = null
      if (cta.action === 'show-plan') {
        try {
          const response = await fetch('/api/hatch/pick')
          pick = response.ok ? await response.json() as HatchPickResponse : null
        } catch {
          pick = null
        }
      }

      const href = pagePromptDestination(cta.action, pick)
      if (href) {
        logCueClick(cta.label)
        setOpen(false)
        router.push(href)
        return
      }

      openPagePromptChat(cta, 'Which study plan fits my weakest FLOW move right now?')
    } finally {
      setPageCtaBusy(false)
    }
  }

  // In-panel greeting for an empty chat (NOT a nudge — only visible after the
  // user opens the panel). Proactive nudge bubbles were removed entirely on
  // 2026-07-24 (founder call): clicking to invoke is sufficient.
  const contextMessage = (hatchCtx?.message && hatchCtx.message.length > 0)
    ? hatchCtx.message
    : pagePrompt.message
  const isWorkspace = pathname.startsWith('/workspace')
  const wrapperPositionClass = `right-4 md:right-5 ${isWorkspace ? 'bottom-24 md:bottom-20' : 'bottom-24 md:bottom-5'}`
  const currentAnimation = activeCue?.animation ?? (open ? 'listening' : 'idle-hover')
  const currentGlyphState = open ? 'listening' : activeCue?.state ?? glyphState
  const currentPageType = parseHatchPageContext(pathname).pageType

  // Target resolved at emit time but vanished mid-cue. Clear so the marker never
  // lingers on a dead target. Memoized so it doesn't refire on unrelated parent
  // rerenders while `missing` stays true. MUST be declared before any early return
  // so hook order stays stable across renders.
  const handleMissing = useCallback(() => {
    if (!activeCue) return
    hatchCtx?.clearCue()
  }, [activeCue, hatchCtx])

  if (isInWorkspace && !activeCue) return null

  return (
    <>
      {/* Target marker + highlight overlay portal — owns its own RAF tracking loop. */}
      <HatchTargetPointer
        targetId={activeCue?.target}
        highlightInset={activeCue?.highlightInset}
        keepVisible={false}
        onMissing={handleMissing}
      />
      <div
        data-hatch-ignore
        data-hatch-chat
        data-testid="floating-hatch"
        className={`fixed z-[60] flex flex-col items-end gap-2 pointer-events-none ${wrapperPositionClass}`}
      >
      {/* ── Floating chat panel ── */}
      <PresencePanel
        isOpen={open}
          className="flex flex-col rounded-2xl overflow-hidden pointer-events-auto"
          style={{
            width: 320,
            height: 440,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-outline-variant)',
            boxShadow: '0 16px 48px -8px rgba(30,27,20,0.22), 0 2px 8px rgba(30,27,20,0.08)',
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
            <HatchImage size={28} state={loading ? 'speaking' : 'idle'} className="shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-on-surface font-headline leading-tight">Hatch</p>
              <p className="text-[10px] text-on-surface-variant leading-tight">
                {currentPageType === 'challenge' ? 'Coaching on this challenge' :
                 currentPageType === 'learning_module' ? 'Reading this module with you' :
                 currentPageType === 'progress' ? 'Reviewing your progress' :
                 currentPageType === 'live_interviews' ? 'Practicing an interview with you' :
                 currentPageType === 'practice' ? 'Helping you pick the right rep' :
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
                <HatchImage size={44} state="listening" />
                <p className="text-xs text-on-surface-variant text-center leading-relaxed px-4">
                  {contextMessage}
                </p>
                {pagePrompt.cta && (
                  <button
                    type="button"
                    data-testid="hatch-page-prompt-action"
                    onClick={() => { void runPagePromptCta(pagePrompt.cta!) }}
                    disabled={pageCtaBusy}
                    className="mt-1 inline-flex min-h-11 items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-[11px] font-label font-bold text-on-primary transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    {pageCtaBusy ? 'One moment' : pagePrompt.cta.label}
                    <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                  </button>
                )}
                {!isInWorkspace && (
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false)
                      window.dispatchEvent(new Event('start-intro-tour'))
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
                  <HatchImage size={18} state="speaking" className="shrink-0 mt-0.5" />
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
                <HatchImage size={18} state="speaking" className="shrink-0 mt-0.5" />
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
      </PresencePanel>

      {/* ── FAB ── */}
      <motion.button
        onClick={activeCue ? handleCuePrimary : toggleOpen}
        className="pointer-events-auto rounded-2xl flex items-center justify-center relative transition-transform active:scale-95 hover:scale-105"
        animate={{
          y: open ? 0 : [0, -2, 0],
          boxShadow: activeCue
            ? '0 10px 28px -8px rgba(36,62,40,0.62)'
            : '0 6px 24px -6px rgba(36,62,40,0.45)',
        }}
        transition={{
          y: { duration: 3.6, repeat: Infinity, ease: 'easeInOut' },
          boxShadow: { duration: 0.22 },
        }}
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        style={{
          width: 52,
          height: 52,
          background: open
            ? 'linear-gradient(135deg, #264a34, #1a3325)'
            : 'linear-gradient(135deg, #4a7c59, #264a34)',
          border: '1px solid rgba(255,255,255,0.15)',
        }}
        aria-label={open ? 'Close Hatch' : 'Ask Hatch'}
        data-testid="hatch-fab"
      >
        <HatchChoreography animation={currentAnimation}>
          <HatchImage size={36} state={GLYPH_STATE_TO_IMAGE[currentGlyphState]} />
        </HatchChoreography>
        {/* Unread dot when chat has messages and panel is closed */}
        {!open && messages.length > 0 && (
          <span
            className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full border-2"
            style={{ background: 'var(--color-tertiary)', borderColor: 'var(--color-background)' }}
          />
        )}
      </motion.button>
      </div>
    </>
  )
}

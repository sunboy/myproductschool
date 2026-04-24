'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { HatchGlyph } from './HatchGlyph'

interface Message {
  role: 'user' | 'hatch'
  content: string
}

interface AskHatchDrawerProps {
  open: boolean
  onClose: () => void
}

/** Render Hatch markdown: bold, bullets, paragraphs. No external dependency. */
function HatchText({ text }: { text: string }) {
  const paragraphs = text.split(/\n\n+/)
  return (
    <span className="flex flex-col gap-2">
      {paragraphs.map((para, i) => {
        const lines = para.split(/\n/)
        const isList = lines.every(l => /^[-*]\s/.test(l.trim()) || l.trim() === '')
        if (isList) {
          return (
            <ul key={i} className="list-disc list-outside pl-4 flex flex-col gap-0.5">
              {lines.filter(l => l.trim()).map((l, j) => (
                <li key={j}><Bold text={l.replace(/^[-*]\s+/, '')} /></li>
              ))}
            </ul>
          )
        }
        return <p key={i}><Bold text={para} /></p>
      })}
    </span>
  )
}

function Bold({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**')
          ? <strong key={i} className="font-semibold">{p.slice(2, -2)}</strong>
          : <span key={i}>{p}</span>
      )}
    </>
  )
}

/** Derive entity type + ID from the current pathname */
function parsePageContext(pathname: string): { pageType: string; entityId: string | null } {
  const challengeWorkspace = pathname.match(/^\/workspace\/challenges\/([^/]+)/)
  if (challengeWorkspace) return { pageType: 'challenge', entityId: challengeWorkspace[1] }

  const challengeFeedback = pathname.match(/^\/challenges\/([^/]+)\/feedback/)
  if (challengeFeedback) return { pageType: 'challenge_feedback', entityId: challengeFeedback[1] }

  const studyPlan = pathname.match(/^\/explore\/plans\/([^/]+)/)
  if (studyPlan) return { pageType: 'study_plan', entityId: studyPlan[1] }

  const domain = pathname.match(/^\/explore\/domains\/([^/]+)/)
  if (domain) return { pageType: 'domain', entityId: domain[1] }

  const domainAlt = pathname.match(/^\/domains\/([^/]+)/)
  if (domainAlt) return { pageType: 'domain', entityId: domainAlt[1] }

  if (pathname.startsWith('/dashboard')) return { pageType: 'dashboard', entityId: null }
  if (pathname.startsWith('/explore')) return { pageType: 'explore', entityId: null }
  if (pathname.startsWith('/challenges')) return { pageType: 'practice', entityId: null }
  if (pathname.startsWith('/progress')) return { pageType: 'progress', entityId: null }
  if (pathname.startsWith('/cohort')) return { pageType: 'cohort', entityId: null }

  return { pageType: 'general', entityId: null }
}

export function AskHatchDrawer({ open, onClose }: AskHatchDrawerProps) {
  const pathname = usePathname()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = { role: 'user', content: text }
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
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!open) return null

  const { pageType } = parsePageContext(pathname)
  const contextLabel: Record<string, string> = {
    challenge: 'Talking about this challenge',
    challenge_feedback: 'Reviewing your feedback',
    study_plan: 'Talking about this plan',
    domain: 'Talking about this topic',
    dashboard: 'Your dashboard',
    explore: 'Explore hub',
    practice: 'Practice hub',
    progress: 'Your progress',
    cohort: 'Cohort',
    general: 'FLOW & product thinking',
  }
  const subtitle = contextLabel[pageType] ?? 'FLOW & product thinking'

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-80 bg-background flex flex-col shadow-2xl border-l border-outline-variant">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-outline-variant/40 bg-primary-fixed">
          <HatchGlyph size={28} state={loading ? 'speaking' : 'idle'} className="shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-on-surface font-headline">Ask Hatch</p>
            <p className="text-[11px] text-on-surface-variant">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-black/10 transition-colors"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-base text-on-surface-variant">close</span>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <HatchGlyph size={48} state="listening" className="mx-auto mb-3" />
              <p className="text-sm font-semibold text-on-surface mb-1">Hi! I&apos;m Hatch.</p>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Ask me anything about the FLOW framework or how to practice product thinking.
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {msg.role === 'hatch' && (
                <HatchGlyph size={22} state="speaking" className="shrink-0 mt-0.5" />
              )}
              <div
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary text-on-primary rounded-tr-sm'
                    : 'bg-surface-container text-on-surface rounded-tl-sm'
                }`}
              >
                {msg.role === 'hatch' ? <HatchText text={msg.content} /> : msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-2">
              <HatchGlyph size={22} state="speaking" className="shrink-0 mt-0.5" />
              <div className="bg-surface-container rounded-xl rounded-tl-sm px-3 py-2 flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-on-surface-variant rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-on-surface-variant rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-on-surface-variant rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-outline-variant/40">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about FLOW or product thinking..."
              className="flex-1 bg-surface-container rounded-full px-4 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/60 outline-none border border-outline-variant/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-full bg-primary flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-opacity shrink-0"
            >
              <span className="material-symbols-outlined text-on-primary text-base">send</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

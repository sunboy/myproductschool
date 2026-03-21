'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

interface Message {
  role: 'luma' | 'user'
  content: string
}

const MOCK_OPENING = "Hi! I'm going to walk you through a product sense question as a Stripe PM interview. We'll have a conversation — I'll ask follow-ups as we go. \n\nReady? Here's the question:\n\nStripe's core product is payments infrastructure. How would you improve the onboarding experience for new developers integrating the Stripe API for the first time?"

export default function SimulationPage() {
  const params = useParams()
  const sessionId = params.sessionId as string
  void sessionId
  const [messages, setMessages] = useState<Message[]>([
    { role: 'luma', content: MOCK_OPENING }
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [ended, setEnded] = useState(false)

  async function handleSend() {
    if (!input.trim() || sending) return
    const userMsg = input.trim()
    setMessages(m => [...m, { role: 'user', content: userMsg }])
    setInput('')
    setSending(true)

    try {
      const res = await fetch('/api/luma/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengePrompt: MOCK_OPENING,
          message: userMsg,
          history: messages,
        }),
      })
      const data = await res.json()
      setMessages(m => [...m, { role: 'luma', content: data.reply ?? 'Interesting. Tell me more.' }])
    } catch {
      setMessages(m => [...m, { role: 'luma', content: "Let me think about that. Can you elaborate on your approach?" }])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col" style={{ height: 'calc(100vh - 4rem)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-outline-variant mb-4">
        <LumaGlyph size={28} className="text-primary" animated />
        <div>
          <p className="font-medium text-on-surface">Stripe Interview Simulation</p>
          <p className="text-xs text-on-surface-variant">Luma as PM Interviewer</p>
        </div>
        <button
          onClick={() => setEnded(true)}
          className="ml-auto text-sm text-on-surface-variant hover:text-on-surface border border-outline-variant px-3 py-1.5 rounded-lg transition-colors"
        >
          End session
        </button>
      </div>

      {ended ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <LumaGlyph size={48} className="text-primary mx-auto" />
            <h2 className="font-headline text-2xl font-bold text-on-surface">Session complete</h2>
            <p className="text-on-surface-variant">Good practice. Keep working on your product sense.</p>
            <div className="flex gap-3 justify-center">
              <Link href="/interview-prep" className="px-4 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
                More companies
              </Link>
              <Link href="/challenges" className="px-4 py-2.5 bg-surface-container border border-outline-variant text-on-surface rounded-xl text-sm font-medium hover:bg-surface-container-high transition-colors">
                Practice challenges
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 pb-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {msg.role === 'luma' && <LumaGlyph size={24} className="text-primary flex-shrink-0 mt-1" />}
                <div className={`rounded-2xl px-4 py-3 max-w-[85%] text-sm whitespace-pre-wrap leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-surface-container-high text-on-surface rounded-tr-sm'
                    : 'bg-primary-container text-on-primary-container rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex gap-3">
                <LumaGlyph size={24} className="text-primary flex-shrink-0 mt-1" />
                <div className="bg-primary-container rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1">
                  {[0, 150, 300].map(delay => (
                    <span key={delay} className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex gap-2 pt-4 border-t border-outline-variant">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder="Your response..."
              className="flex-1 px-4 py-3 bg-surface-container border border-outline-variant rounded-xl text-on-surface focus:outline-none focus:border-primary transition-colors text-sm"
            />
            <button
              onClick={handleSend}
              disabled={sending || !input.trim()}
              className="p-3 bg-primary text-on-primary rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}

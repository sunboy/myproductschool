'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import { useSimulation } from '@/hooks/useSimulation'

interface DebriefData {
  overall_score?: number
  interview_summary?: string
  overall?: string
}

export default function SimulationPage() {
  const params = useParams()
  const sessionId = params.sessionId as string

  const { session, turns, isLoading, isSending, debrief, questionsRemaining, sendMessage, endSession } =
    useSimulation(sessionId)

  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [turns, isSending])

  async function handleSend() {
    if (!input.trim() || isSending) return
    const text = input.trim()
    setInput('')
    await sendMessage(text)
  }

  async function handleEndSession() {
    await endSession()
    // debrief will be set by the hook; the UI will switch to the completion screen
  }

  const debriefData = debrief as DebriefData | null
  const companyName = session?.company_name as string | undefined
  const challengeTitle = session?.challenge_title as string | undefined

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col items-center justify-center" style={{ height: 'calc(100vh - 4rem)' }}>
        <LumaGlyph size={48} className="text-primary mx-auto mb-4" animated />
        <p className="text-on-surface-variant text-sm">Loading session…</p>
      </div>
    )
  }

  // Debrief / completion screen
  if (debriefData) {
    const score = debriefData.overall_score != null ? debriefData.overall_score / 10 : null
    const summary = debriefData.interview_summary ?? debriefData.overall ?? 'Great work completing this session.'

    return (
      <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col" style={{ height: 'calc(100vh - 4rem)' }}>
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-outline-variant mb-4">
          <LumaGlyph size={28} className="text-primary" animated />
          <div>
            <p className="font-medium text-on-surface">{companyName ?? 'Interview Simulation'}</p>
            <p className="text-xs text-on-surface-variant">{challengeTitle ?? 'Luma as PM Interviewer'}</p>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-5 max-w-md">
            <LumaGlyph size={56} className="text-primary mx-auto" />
            <h2 className="font-headline text-2xl font-bold text-on-surface">Session complete</h2>

            {score != null && (
              <div className="bg-primary-container rounded-2xl px-6 py-4 inline-block">
                <p className="text-on-primary-container text-sm font-label font-semibold uppercase tracking-wide mb-1">Overall score</p>
                <p className="font-headline text-4xl font-bold text-primary">{score.toFixed(1)}<span className="text-lg text-on-primary-container font-label"> / 10</span></p>
              </div>
            )}

            <p className="text-on-surface-variant text-sm leading-relaxed">{summary}</p>

            <div className="flex gap-3 justify-center pt-2">
              <Link
                href="/interview-prep"
                className="px-4 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Back to Interview Prep
              </Link>
              <Link
                href="/challenges"
                className="px-4 py-2.5 bg-surface-container border border-outline-variant text-on-surface rounded-xl text-sm font-medium hover:bg-surface-container-high transition-colors"
              >
                Practice challenges
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Active simulation
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col" style={{ height: 'calc(100vh - 4rem)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-outline-variant mb-4">
        <LumaGlyph size={28} className="text-primary" animated />
        <div>
          <p className="font-medium text-on-surface">{companyName ?? 'Interview Simulation'}</p>
          <p className="text-xs text-on-surface-variant">{challengeTitle ?? 'Luma as PM Interviewer'}</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-on-surface-variant font-label">
            {questionsRemaining} question{questionsRemaining !== 1 ? 's' : ''} remaining
          </span>
          <button
            onClick={handleEndSession}
            className="text-sm text-on-surface-variant hover:text-on-surface border border-outline-variant px-3 py-1.5 rounded-lg transition-colors"
          >
            End session
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {turns.map((turn, i) => (
          <div key={i} className={`flex gap-3 ${turn.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {turn.role === 'luma' && <LumaGlyph size={24} className="text-primary flex-shrink-0 mt-1" />}
            <div className={`rounded-2xl px-4 py-3 max-w-[85%] text-sm whitespace-pre-wrap leading-relaxed ${
              turn.role === 'user'
                ? 'bg-surface-container-high text-on-surface rounded-tr-sm'
                : 'bg-primary-container text-on-primary-container rounded-tl-sm'
            }`}>
              {turn.content}
            </div>
          </div>
        ))}
        {isSending && (
          <div className="flex gap-3">
            <LumaGlyph size={24} className="text-primary flex-shrink-0 mt-1" />
            <div className="bg-primary-container rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1">
              {[0, 150, 300].map(delay => (
                <span key={delay} className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
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
          disabled={isSending || !input.trim()}
          className="p-3 bg-primary text-on-primary rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          <span className="material-symbols-outlined">send</span>
        </button>
      </div>
    </div>
  )
}

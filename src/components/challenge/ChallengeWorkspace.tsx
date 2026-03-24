'use client'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { ChallengePrompt, ChallengeMode } from '@/lib/types'
import { CaseContextPane } from './CaseContextPane'
import { AnswerPane } from './AnswerPane'
import { LumaCoachingStrip } from './LumaCoachingStrip'

/* ── Types ───────────────────────────────────────────────── */

interface ChallengeWorkspaceProps {
  challenge: ChallengePrompt
  domainTitle: string
  domainIcon: string
}

type AnswerTab = 'answer' | 'canvas' | 'frameworks'

/* ── Helpers ─────────────────────────────────────────────── */

function parseSubQuestions(text: string): string[] {
  const lines = text.split('\n')
  const questions: string[] = []
  for (const line of lines) {
    const match = line.match(/^\s*(\d+)\.\s+(.+)/)
    if (match) questions.push(match[2].trim())
  }
  return questions.length > 0 ? questions : [text]
}

/* ── Component ───────────────────────────────────────────── */

export function ChallengeWorkspace({ challenge, domainTitle, domainIcon }: ChallengeWorkspaceProps) {
  const router = useRouter()

  // Mode — Solo (default) or Live
  const [selectedMode, setSelectedMode] = useState<ChallengeMode>('solo')
  const [activeTab, setActiveTab] = useState<AnswerTab>('answer')

  // Response state
  const [response, setResponse] = useState('')
  const [confidence, setConfidence] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [autoSavedAt, setAutoSavedAt] = useState<Date | null>(null)

  // Timer toggle (optional, independent of mode)
  const [timerEnabled, setTimerEnabled] = useState(false)
  const [timeLeft, setTimeLeft] = useState(10 * 60)
  const [timeExpired, setTimeExpired] = useState(false)

  const responseRef = useRef('')

  // Luma chat messages (live mode)
  const [lumaMessages, setLumaMessages] = useState<Array<{ role: 'user' | 'luma'; content: string }>>([])
  const [lumaSending, setLumaSending] = useState(false)

  const subQuestions = useMemo(
    () => challenge.sub_questions ?? parseSubQuestions(challenge.prompt_text),
    [challenge.sub_questions, challenge.prompt_text]
  )

  // Keep ref in sync with response
  useEffect(() => {
    responseRef.current = response
  }, [response])

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (responseRef.current.trim()) {
        setAutoSavedAt(new Date())
      }
    }, 30_000)
    return () => clearInterval(interval)
  }, [])

  // Timer countdown (only when enabled)
  useEffect(() => {
    if (!timerEnabled) return
    if (timeLeft <= 0) {
      setTimeExpired(true)
      return
    }
    const t = setTimeout(() => setTimeLeft(prev => prev - 1), 1000)
    return () => clearTimeout(t)
  }, [timerEnabled, timeLeft])

  // Auto-submit when timer expires
  useEffect(() => {
    if (timeExpired && !submitting && responseRef.current.trim()) {
      handleSubmit()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeExpired])

  // Initialize Luma greeting when entering live mode
  useEffect(() => {
    if (selectedMode === 'live' && lumaMessages.length === 0) {
      setLumaMessages([{
        role: 'luma',
        content: `Let's work through "${challenge.title}" together. Share your initial thoughts and I'll guide you step by step.`,
      }])
    }
  }, [selectedMode, challenge.title, lumaMessages.length])

  const handleSubmit = useCallback(async () => {
    if (submitting || !response.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/challenges/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: challenge.id,
          mode: selectedMode,
          response,
          confidenceRating: confidence || 3,
        }),
      })
      const data = await res.json()
      router.push(`/challenges/${challenge.id}/feedback?attempt=${data.attemptId ?? 'mock'}`)
    } catch {
      router.push(`/challenges/${challenge.id}/feedback?attempt=mock`)
    }
  }, [challenge.id, selectedMode, submitting, response, confidence, router])

  const handleLiveSend = useCallback(async () => {
    if (!response.trim() || lumaSending) return
    const userMsg = response.trim()
    setLumaMessages(m => [...m, { role: 'user', content: userMsg }])
    setResponse('')
    setLumaSending(true)
    try {
      const res = await fetch('/api/luma/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: challenge.id,
          message: userMsg,
          history: lumaMessages,
        }),
      })
      const data = await res.json()
      setLumaMessages(m => [...m, { role: 'luma', content: data.reply ?? 'Let me think about that...' }])
    } catch {
      setLumaMessages(m => [...m, { role: 'luma', content: 'Something went wrong. Please try again.' }])
    } finally {
      setLumaSending(false)
    }
  }, [response, lumaSending, challenge.id, lumaMessages])

  const handleHintRequest = useCallback(async () => {
    const draft = responseRef.current
    try {
      const res = await fetch('/api/luma/nudge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId: challenge.id, draft }),
      })
      const data = await res.json()
      if (data.nudge) {
        // Show hint as a Luma message if in live mode, otherwise just log
      }
    } catch {
      // ignore
    }
  }, [challenge.id])

  const autoSaveText = autoSavedAt
    ? `Saved ${Math.floor((Date.now() - autoSavedAt.getTime()) / 60000)}m ago`
    : 'Saved'

  return (
    <>
      {/* ── Two-Pane Main (full viewport) ──────────────────────── */}
      <main className="flex h-[calc(100vh-48px)] overflow-hidden">
        <CaseContextPane
          challenge={challenge}
          domainTitle={domainTitle}
          domainIcon={domainIcon}
          timerEnabled={timerEnabled}
          onTimerToggle={() => setTimerEnabled(prev => !prev)}
          timeLeft={timeLeft}
        />
        <AnswerPane
          activeTab={activeTab}
          onTabChange={setActiveTab}
          response={response}
          onResponseChange={setResponse}
          confidence={confidence}
          onConfidenceChange={setConfidence}
          onSubmit={handleSubmit}
          submitting={submitting}
          mode={selectedMode}
          onModeChange={setSelectedMode}
          subQuestions={subQuestions}
          autoSaveText={autoSaveText}
          lumaMessages={lumaMessages}
          onLiveSend={handleLiveSend}
          lumaSending={lumaSending}
          timeLeft={timeLeft}
          timeExpired={timeExpired}
        />
      </main>

      {/* ── Bottom Coaching Strip ─────────────────────────────── */}
      <LumaCoachingStrip
        mode={selectedMode}
        onHintRequest={handleHintRequest}
        onShowFramework={() => setActiveTab('frameworks')}
      />
    </>
  )
}

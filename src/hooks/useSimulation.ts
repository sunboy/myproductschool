'use client'

import { useState, useEffect, useCallback } from 'react'

interface SimTurn {
  role: 'user' | 'luma'
  content: string
  turn_index: number
}

export function useSimulation(sessionId: string | null) {
  const [turns, setTurns] = useState<SimTurn[]>([])
  const [session, setSession] = useState<Record<string, unknown> | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [debrief, setDebrief] = useState<unknown>(null)
  const [questionsRemaining, setQuestionsRemaining] = useState(5)

  useEffect(() => {
    if (!sessionId) return
    setIsLoading(true)
    fetch(`/api/simulation/${sessionId}`)
      .then(res => res.json())
      .then(data => {
        setSession(data.session)
        setTurns(data.turns ?? [])
        if (data.session?.status === 'completed') setDebrief(data.session.debrief_json)
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [sessionId])

  const sendMessage = useCallback(async (content: string) => {
    if (!sessionId) return
    setIsSending(sending => {
      if (sending) return sending
      return true
    })

    const optimisticTurn: SimTurn = { role: 'user', content, turn_index: -1 }
    setTurns(prev => [...prev, optimisticTurn])

    try {
      const res = await fetch(`/api/simulation/${sessionId}/turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const data = await res.json()
      setTurns(prev => [...prev, { role: 'luma', content: data.reply, turn_index: data.turn_index }])
      setQuestionsRemaining(data.questions_remaining ?? 0)
    } catch (e) {
      setTurns(prev => prev.filter(t => t !== optimisticTurn))
      console.error(e)
    } finally {
      setIsSending(false)
    }
  }, [sessionId])

  const endSession = useCallback(async () => {
    if (!sessionId) return
    const res = await fetch(`/api/simulation/${sessionId}/end`, { method: 'POST' })
    const data = await res.json()
    setDebrief(data)
    return data
  }, [sessionId])

  return { session, turns, isLoading, isSending, debrief, questionsRemaining, sendMessage, endSession }
}

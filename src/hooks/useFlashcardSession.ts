'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface FlashCard {
  id: string
  front: string
  back: string
  hint?: string
  progress?: { confidence: number; next_review_at: string } | null
  [key: string]: unknown
}

interface SessionStats {
  total_due: number
  total_new: number
}

export function useFlashcardSession(domainSlug?: string) {
  const [cards, setCards] = useState<FlashCard[]>([])
  const [stats, setStats] = useState<SessionStats>({ total_due: 0, total_new: 0 })
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sessionCorrect, setSessionCorrect] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isComplete, setIsComplete] = useState(false)
  const cardsRef = useRef<FlashCard[]>([])

  useEffect(() => {
    const url = domainSlug
      ? `/api/progress/vocabulary?domainSlug=${domainSlug}`
      : '/api/progress/vocabulary'
    fetch(url)
      .then(res => res.json())
      .then(data => {
        const loaded = data.cards ?? []
        cardsRef.current = loaded
        setCards(loaded)
        setStats({ total_due: data.total_due ?? 0, total_new: data.total_new ?? 0 })
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [domainSlug])

  const rateCard = useCallback(async (conceptId: string, confidence: number) => {
    const current = cardsRef.current[currentIndex]
    const flashcardId = (current?.flashcards as FlashCard[])?.[0]?.id ?? current?.id

    try {
      await fetch('/api/progress/vocabulary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conceptId, flashcardId, confidence }),
      })
    } catch (e) {
      console.error(e)
    }

    if (confidence >= 4) setSessionCorrect(c => c + 1)

    const next = currentIndex + 1
    if (next >= cardsRef.current.length) {
      setIsComplete(true)
    } else {
      setCurrentIndex(next)
    }
  }, [currentIndex])

  const accuracy = cards.length > 0 ? Math.round((sessionCorrect / Math.max(currentIndex, 1)) * 100) : 0

  return {
    cards,
    currentCard: cards[currentIndex] ?? null,
    currentIndex,
    totalCards: cards.length,
    remaining: cards.length - currentIndex,
    accuracy,
    isComplete,
    isLoading,
    stats,
    rateCard,
  }
}

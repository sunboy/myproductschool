'use client'
import { useState, useCallback } from 'react'
import Link from 'next/link'
import type { Domain, Flashcard, Concept } from '@/lib/types'

interface FlashcardSessionProps {
  domain: Domain
  flashcards: Flashcard[]
  conceptMap: Record<string, Concept>
}

type ConfidenceLevel = 1 | 2 | 3 | 4 | 5

const confidenceLevels: { level: ConfidenceLevel; label: string; color: string; bg: string }[] = [
  { level: 1, label: 'Forgot', color: 'text-error', bg: 'bg-error-container hover:bg-error/20' },
  { level: 2, label: 'Hard', color: 'text-error', bg: 'bg-error-container/70 hover:bg-error/20' },
  { level: 3, label: 'Good', color: 'text-tertiary', bg: 'bg-tertiary-container hover:bg-tertiary/20' },
  { level: 4, label: 'Easy', color: 'text-primary', bg: 'bg-primary-container hover:bg-primary/20' },
  { level: 5, label: 'Perfect', color: 'text-primary', bg: 'bg-primary hover:opacity-90 text-on-primary' },
]

export function FlashcardSession({ domain, flashcards, conceptMap }: FlashcardSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [results, setResults] = useState<Array<{ flashcardId: string; confidence: ConfidenceLevel }>>([])
  const [completed, setCompleted] = useState(false)
  const [showHint, setShowHint] = useState(false)

  const currentCard = flashcards[currentIndex]
  const concept = currentCard ? conceptMap[currentCard.concept_id] : null
  const progress = flashcards.length > 0 ? ((currentIndex) / flashcards.length) * 100 : 0

  const handleFlip = useCallback(() => {
    setIsFlipped(f => !f)
    setShowHint(false)
  }, [])

  const handleRate = useCallback(async (confidence: ConfidenceLevel) => {
    if (!currentCard) return

    const newResults = [...results, { flashcardId: currentCard.id, confidence }]
    setResults(newResults)

    // Call progress API (fire and forget in mock mode)
    if (process.env.NODE_ENV !== 'test') {
      fetch('/api/progress/vocabulary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conceptId: currentCard.concept_id, confidence }),
      }).catch(() => {})
    }

    if (currentIndex + 1 >= flashcards.length) {
      setCompleted(true)
    } else {
      setCurrentIndex(i => i + 1)
      setIsFlipped(false)
      setShowHint(false)
    }
  }, [currentCard, currentIndex, flashcards.length, results])

  if (flashcards.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-4 block">style</span>
        <h2 className="font-headline text-xl font-bold text-on-surface">No flashcards yet</h2>
        <p className="text-on-surface-variant mt-2">This domain doesn&apos;t have flashcards yet.</p>
        <Link href="/flashcards" className="mt-4 inline-block text-primary hover:underline">← Back to decks</Link>
      </div>
    )
  }

  if (completed) {
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length
    return (
      <div className="text-center py-8 space-y-6">
        <div className="w-20 h-20 bg-primary-container rounded-full flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-4xl text-primary">check_circle</span>
        </div>
        <div>
          <h2 className="font-headline text-3xl font-bold text-on-surface">Session complete!</h2>
          <p className="text-on-surface-variant mt-2">You reviewed {flashcards.length} cards from {domain.title}</p>
        </div>
        <div className="p-5 bg-surface-container rounded-2xl inline-block">
          <div className="text-4xl font-bold text-primary">{avgConfidence.toFixed(1)}</div>
          <div className="text-sm text-on-surface-variant">avg confidence</div>
        </div>
        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={() => { setCurrentIndex(0); setIsFlipped(false); setResults([]); setCompleted(false) }}
            className="px-5 py-2.5 bg-primary text-on-primary rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            Study again
          </button>
          <Link href="/flashcards" className="px-5 py-2.5 bg-surface-container border border-outline-variant text-on-surface rounded-xl font-medium hover:bg-surface-container-high transition-colors">
            Choose another deck
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/flashcards" className="p-2 rounded-lg hover:bg-surface-container transition-colors">
          <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
        </Link>
        <div className="flex-1">
          <h1 className="font-headline font-bold text-on-surface">{domain.title}</h1>
          <p className="text-sm text-on-surface-variant">{currentIndex + 1} of {flashcards.length}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Concept label */}
      {concept && (
        <div className="text-center">
          <span className="text-xs font-medium text-on-surface-variant uppercase tracking-wide">{concept.title}</span>
        </div>
      )}

      {/* Flashcard */}
      <div
        onClick={handleFlip}
        className="relative min-h-64 cursor-pointer"
        style={{ perspective: '1000px' }}
      >
        <div
          className="w-full transition-all duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front */}
          <div
            className="p-8 bg-surface-container rounded-2xl border-2 border-outline-variant flex flex-col items-center justify-center min-h-64 text-center"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <p className="text-xl font-medium text-on-surface leading-relaxed">{currentCard?.front}</p>
            {!isFlipped && (
              <p className="text-sm text-on-surface-variant mt-6">Tap to reveal answer</p>
            )}
          </div>
          {/* Back */}
          <div
            className="p-8 bg-primary-container rounded-2xl border-2 border-primary/30 flex flex-col items-center justify-center min-h-64 text-center absolute inset-0"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <p className="text-on-primary-container leading-relaxed">{currentCard?.back}</p>
          </div>
        </div>
      </div>

      {/* Hint */}
      {!isFlipped && currentCard?.hint && (
        <div className="text-center">
          {showHint ? (
            <p className="text-sm text-on-surface-variant italic">{currentCard.hint}</p>
          ) : (
            <button onClick={(e) => { e.stopPropagation(); setShowHint(true) }} className="text-sm text-primary hover:underline">
              Show hint
            </button>
          )}
        </div>
      )}

      {/* Rating buttons (shown after flip) */}
      {isFlipped && (
        <div className="space-y-3 animate-fade-in-up">
          <p className="text-center text-sm text-on-surface-variant font-medium">How well did you know this?</p>
          <div className="grid grid-cols-5 gap-2">
            {confidenceLevels.map(({ level, label, color, bg }) => (
              <button
                key={level}
                onClick={() => handleRate(level)}
                className={`flex flex-col items-center gap-1 py-3 rounded-xl transition-all ${bg}`}
              >
                <span className={`text-lg font-bold ${level === 5 ? '' : color}`}>{level}</span>
                <span className={`text-xs ${level === 5 ? '' : color}`}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

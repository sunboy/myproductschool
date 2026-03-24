'use client'
import { useState, useCallback } from 'react'
import Link from 'next/link'
import type { Domain } from '@/lib/types'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import { useFlashcardSession } from '@/hooks/useFlashcardSession'

interface FlashcardSessionProps {
  domain: Domain
  domainSlug: string
}

type ConfidenceLevel = 1 | 2 | 3 | 4 | 5

const confidenceLevels: { level: ConfidenceLevel; label: string; color: string; bg: string }[] = [
  { level: 1, label: 'Forgot', color: 'text-error', bg: 'bg-error-container hover:bg-error/20' },
  { level: 2, label: 'Hard', color: 'text-error', bg: 'bg-error-container/70 hover:bg-error/20' },
  { level: 3, label: 'Good', color: 'text-tertiary', bg: 'bg-tertiary-container hover:bg-tertiary/20' },
  { level: 4, label: 'Easy', color: 'text-primary', bg: 'bg-primary-container hover:bg-primary/20' },
  { level: 5, label: 'Perfect', color: 'text-primary', bg: 'bg-primary hover:opacity-90 text-on-primary' },
]

export function FlashcardSession({ domain, domainSlug }: FlashcardSessionProps) {
  const {
    cards,
    currentCard,
    currentIndex,
    totalCards,
    isComplete,
    isLoading,
    stats,
    rateCard,
    accuracy,
  } = useFlashcardSession(domainSlug)

  const [isFlipped, setIsFlipped] = useState(false)
  const [showHint, setShowHint] = useState(false)

  const progress = totalCards > 0 ? (currentIndex / totalCards) * 100 : 0
  const conceptTitle = currentCard ? (currentCard as Record<string, unknown>)['concept_title'] as string | undefined : undefined

  const handleFlip = useCallback(() => {
    setIsFlipped(f => !f)
    setShowHint(false)
  }, [])

  const handleRate = useCallback(async (confidence: ConfidenceLevel) => {
    if (!currentCard) return
    const conceptId = ((currentCard as Record<string, unknown>)['concept_id'] as string | undefined) ?? currentCard.id
    await rateCard(conceptId, confidence)
    setIsFlipped(false)
    setShowHint(false)
  }, [currentCard, rateCard])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (totalCards === 0 && !isLoading) {
    return (
      <div className="text-center py-12">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-4 block">check_circle</span>
        <h2 className="font-headline text-xl font-bold text-on-surface">You&apos;re all caught up!</h2>
        <p className="text-on-surface-variant mt-2">No cards due today.</p>
        <Link href="/flashcards" className="mt-4 inline-block text-primary hover:underline">← Back to decks</Link>
      </div>
    )
  }

  if (isComplete) {
    const masteredCount = Math.round((accuracy / 100) * currentIndex)
    const needsPracticeCount = currentIndex - masteredCount
    return (
      <div className="text-center py-8 space-y-6">
        <div className="w-20 h-20 bg-primary-container rounded-full flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-4xl text-primary">check_circle</span>
        </div>
        <div>
          <h2 className="font-headline text-3xl font-bold text-on-surface">Session complete!</h2>
          <p className="text-on-surface-variant mt-2">You reviewed {totalCards} cards from {domain.title}</p>
        </div>
        <div className="p-5 bg-surface-container rounded-2xl inline-block">
          <div className="text-4xl font-bold text-primary">{accuracy}%</div>
          <div className="text-sm text-on-surface-variant">accuracy</div>
        </div>
        {/* Mastery summary */}
        <p className="text-sm text-on-surface">
          <span className="font-semibold text-primary">{masteredCount} concept{masteredCount !== 1 ? 's' : ''} mastered</span>
          {needsPracticeCount > 0 && (
            <>, <span className="font-semibold text-tertiary">{needsPracticeCount} need{needsPracticeCount === 1 ? 's' : ''} more practice</span></>
          )}
        </p>
        {/* Next review schedule */}
        <p className="text-xs text-on-surface-variant">
          Next review: 1 day (Hard), 3 days (Good), 7 days (Easy)
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href={`/flashcards/${domainSlug}`} className="px-5 py-2.5 bg-primary text-on-primary rounded-xl font-medium hover:opacity-90 transition-opacity">
            Study again
          </Link>
          <Link href="/flashcards" className="px-5 py-2.5 bg-surface-container border border-outline-variant text-on-surface rounded-xl font-medium hover:bg-surface-container-high transition-colors">
            Choose another deck
          </Link>
        </div>
        {/* CTA: Practice a related challenge */}
        <Link href="/challenges" className="flex items-center justify-center gap-2 mt-4 px-6 py-2.5 bg-primary text-on-primary rounded-full font-semibold text-sm hover:opacity-90 transition-opacity">
          Practice a related challenge
          <span className="material-symbols-outlined text-lg">arrow_forward</span>
        </Link>
        {/* Luma post-session nudge */}
        <div className="flex gap-3 p-4 bg-primary-fixed rounded-xl mt-4 text-left">
          <LumaGlyph size={20} className="text-primary flex-shrink-0 mt-0.5" />
          <p className="text-sm text-on-surface-variant">
            You reviewed {totalCards} concepts. Want to test your knowledge in a challenge?
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/flashcards" className="p-2 rounded-lg hover:bg-surface-container transition-colors">
          <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
        </Link>
        <div className="flex-1">
          <h1 className="font-headline font-bold text-on-surface">{domain.title}</h1>
        </div>
        {(stats.total_due > 0 || stats.total_new > 0) && (
          <div className="flex gap-2 text-xs font-label">
            {stats.total_due > 0 && (
              <span className="bg-tertiary-container text-on-secondary-container rounded-full px-2.5 py-0.5">
                {stats.total_due} due
              </span>
            )}
            {stats.total_new > 0 && (
              <span className="bg-secondary-container text-on-secondary-container rounded-full px-2.5 py-0.5">
                {stats.total_new} new
              </span>
            )}
          </div>
        )}
      </div>

      {/* Progress indicator */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-label text-on-surface-variant">{currentIndex + 1} / {totalCards}</span>
        </div>
        <div className="h-1 bg-surface-container-highest rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-fixed rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Concept label */}
      {conceptTitle && (
        <div className="text-center">
          <span className="text-xs font-medium text-on-surface-variant uppercase tracking-wide">{conceptTitle}</span>
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

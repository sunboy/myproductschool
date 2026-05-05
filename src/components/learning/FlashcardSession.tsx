'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useFlashcardSession } from '@/hooks/useFlashcardSession'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import type { Domain } from '@/lib/types'

/* ── Types ───────────────────────────────────────────────── */

interface FlashcardSessionProps {
  domain: Domain
  domainSlug: string
  allDomains?: Domain[]
}

/* ── Component ───────────────────────────────────────────── */

export function FlashcardSession({ domain, domainSlug, allDomains = [] }: FlashcardSessionProps) {
  const {
    currentCard,
    currentIndex,
    totalCards,
    accuracy,
    isComplete,
    isLoading,
    rateCard,
  } = useFlashcardSession(domainSlug)

  const [revealed, setRevealed] = useState(false)
  const [ratings, setRatings] = useState<number[]>([])
  const [sessionStart] = useState(Date.now())
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - sessionStart) / 60000)), 30_000)
    return () => clearInterval(interval)
  }, [sessionStart])

  useEffect(() => {
    setRevealed(false)
  }, [currentIndex])

  const handleRate = (confidence: number) => {
    if (!currentCard) return
    setRatings(prev => [...prev, confidence])
    rateCard(currentCard.id, confidence)
  }

  const streakCount = (() => {
    let count = 0
    for (let i = ratings.length - 1; i >= 0; i--) {
      if (ratings[i] >= 3) count++
      else break
    }
    return count
  })()

  const masteryPercent = totalCards > 0 ? Math.round((currentIndex / totalCards) * 100) : 0

  /* ── Loading ───────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  /* ── Empty ─────────────────────────────────────────────── */
  if (!currentCard && !isComplete) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <span className="material-symbols-outlined text-5xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
        <h2 className="font-headline text-2xl font-bold">All caught up!</h2>
        <p className="text-on-surface-variant">No cards due today in {domain.title}.</p>
        <Link href="/flashcards" className="text-primary font-bold hover:underline">← Back to decks</Link>
      </div>
    )
  }

  /* ── Complete ──────────────────────────────────────────── */
  if (isComplete) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="max-w-md text-center space-y-6">
          <div className="w-20 h-20 mx-auto bg-primary-container rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>celebration</span>
          </div>
          <h2 className="font-headline text-3xl font-bold text-on-surface">Session Complete!</h2>
          <div className="bg-surface-container rounded-2xl p-6 space-y-3">
            <div className="text-4xl font-headline font-bold text-primary">{accuracy}%</div>
            <div className="text-sm text-on-surface-variant">Accuracy across {totalCards} cards</div>
          </div>
          <div className="bg-primary-fixed rounded-xl p-4 flex items-start gap-3 text-left">
            <HatchGlyph size={24} className="text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm text-on-primary-fixed-variant">
              Keep reviewing to strengthen recall. Spaced repetition works best with consistent daily practice.
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={() => window.location.reload()} className="px-6 py-3 bg-primary text-on-primary rounded-full font-bold hover:opacity-90 transition-opacity">
              Study again
            </button>
            <Link href="/flashcards" className="px-6 py-3 bg-surface-container text-on-surface rounded-full font-bold hover:bg-surface-container-high transition-colors">
              Choose another deck
            </Link>
          </div>
        </div>
      </div>
    )
  }

  /* ── Active Session — Two-Pane Layout ──────────────────── */
  return (
    <>
      {/* Slim Top Bar */}
      <header className="fixed top-0 w-full h-12 z-50 bg-background/80 backdrop-blur-md border-b border-outline-variant/10" style={{ boxShadow: '0 12px 48px rgba(46,50,48,0.08)' }}>
        <div className="flex items-center justify-between px-6 w-full h-full">
          <div className="flex items-center gap-4">
            <Link href="/flashcards" className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors text-xl">arrow_back</Link>
            <span className="font-headline font-bold text-xl text-primary tracking-tight">HackProduct</span>
          </div>
          <span className="font-headline font-bold text-lg text-on-surface-variant/50">
            Card {currentIndex + 1} of {totalCards}
          </span>
          <div className="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-on-surface-variant text-lg">account_circle</span>
          </div>
        </div>
      </header>

    <main className="pt-12 min-h-screen flex w-full max-w-screen-2xl mx-auto">
      {/* Left Pane: Flashcard Area (65%) */}
      <section className="w-[65%] p-8 flex flex-col gap-8">
        <div className="flex-1 flex flex-col">

        {/* Flashcard */}
        <article
          className="flex-1 bg-surface-container-lowest rounded-2xl overflow-hidden flex flex-col cursor-pointer ghost-border"
          style={{ boxShadow: '0 12px 48px rgba(46,50,48,0.08)' }}
          onClick={() => !revealed && setRevealed(true)}
        >
          <div className="h-10 bg-gradient-to-r from-primary to-primary-container flex items-center px-6">
            <span className="material-symbols-outlined text-white text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
              {domain.icon ?? 'analytics'}
            </span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-16 text-center">
            {!revealed ? (
              <h2 className="font-headline font-bold text-2xl leading-relaxed text-on-surface max-w-2xl">
                {currentCard.front}
              </h2>
            ) : (
              <div className="space-y-6 max-w-2xl animate-fade-in-up">
                <p className="text-sm text-on-surface-variant/60 font-label font-bold uppercase tracking-wider">Answer</p>
                <p className="font-body text-lg leading-relaxed text-on-surface">{currentCard.back}</p>
                {currentCard.hint && (
                  <p className="text-sm italic text-on-surface-variant/60 mt-4">Hint: {currentCard.hint}</p>
                )}
              </div>
            )}
          </div>

          {!revealed && (
            <div className="p-8 flex flex-col items-center">
              <span className="font-label font-semibold text-on-surface-variant/50 tracking-wide uppercase text-xs flex items-center gap-1">
                Tap to reveal
                <span className="material-symbols-outlined text-sm">keyboard_arrow_down</span>
              </span>
            </div>
          )}

          <div className="px-8 pb-8 flex flex-col gap-4">
            <div className="w-full h-1 bg-surface-container-high rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-container rounded-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / totalCards) * 100}%` }}
              />
            </div>
            <div className="flex justify-center gap-2">
              {Array.from({ length: Math.min(totalCards, 12) }).map((_, i) => {
                const rating = ratings[i]
                let dotClass = 'bg-surface-container-high'
                if (i === currentIndex) dotClass = 'border-2 border-primary bg-surface-container-lowest'
                else if (rating !== undefined) dotClass = rating >= 3 ? 'bg-primary' : 'bg-tertiary'
                return <div key={i} className={`w-2.5 h-2.5 rounded-full ${dotClass}`} />
              })}
              {totalCards > 12 && <span className="text-[10px] text-on-surface-variant font-bold">+{totalCards - 12}</span>}
            </div>
          </div>
        </article>
        </div>

        {/* Action Buttons */}
        {revealed && (
          <div className="flex items-center justify-center gap-6 pb-4 animate-fade-in-up">
            <button
              onClick={() => handleRate(1)}
              className="flex items-center gap-2 px-10 py-4 bg-surface-container-lowest border-2 border-error text-error rounded-lg font-label font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ boxShadow: '0 12px 48px rgba(46,50,48,0.08)' }}
            >
              <span className="material-symbols-outlined text-xl">refresh</span>
              Again
            </button>
            <button
              onClick={() => handleRate(3)}
              className="flex items-center gap-2 px-10 py-4 bg-tertiary-container text-on-surface rounded-lg font-label font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ boxShadow: '0 12px 48px rgba(46,50,48,0.08)' }}
            >
              <span className="material-symbols-outlined text-xl">thumb_up</span>
              Good
            </button>
            <button
              onClick={() => handleRate(5)}
              className="flex items-center gap-2 px-10 py-4 bg-primary-container text-white rounded-lg font-label font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ boxShadow: '0 12px 48px rgba(46,50,48,0.08)' }}
            >
              <span className="material-symbols-outlined text-xl">bolt</span>
              Easy
            </button>
          </div>
        )}
      </section>

      {/* Right Pane: Sidebar (35%) */}
      <aside className="w-[35%] bg-surface-container-low border-l border-outline-variant/15 p-8 flex flex-col gap-6 sticky top-12 h-[calc(100vh-3rem)] overflow-y-auto">
        {/* Session Stats */}
        <section className="bg-surface-container-lowest rounded-xl p-6 flex flex-col gap-6 ghost-border" style={{ boxShadow: '0 12px 48px rgba(46,50,48,0.08)' }}>
          <div className="flex items-center justify-between">
            <h3 className="font-headline font-bold text-lg">Session Stats</h3>
            <span className="material-symbols-outlined text-primary">analytics</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
                <circle className="text-surface-container-high" cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" strokeWidth="4" />
                <circle
                  className="text-primary"
                  cx="32" cy="32" fill="transparent" r="28"
                  stroke="currentColor" strokeWidth="4"
                  strokeDasharray={Math.PI * 56}
                  strokeDashoffset={Math.PI * 56 * (1 - masteryPercent / 100)}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute font-label font-bold text-sm">{masteryPercent}%</span>
            </div>
            <div className="flex flex-col">
              <span className="text-on-surface-variant font-label text-xs font-semibold uppercase tracking-wider">Overall Mastery</span>
              <span className="font-headline font-bold text-xl text-primary">
                {masteryPercent < 30 ? 'Starting' : masteryPercent < 60 ? 'Progressing' : masteryPercent < 90 ? 'Strong' : 'Mastered'}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-container-low p-3 rounded-lg flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                <span className="font-label font-bold text-sm">{streakCount} in a row</span>
              </div>
              <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">Current Streak</span>
            </div>
            <div className="bg-surface-container-low p-3 rounded-lg flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-on-surface-variant text-sm">timer</span>
                <span className="font-label font-bold text-sm">{elapsed || '<1'} min</span>
              </div>
              <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">Session Time</span>
            </div>
          </div>
          <div className="flex flex-col gap-3 pt-2 border-t border-outline-variant/10">
            <div className="flex items-center justify-between">
              <span className="font-label text-xs font-bold text-on-surface-variant uppercase">Accuracy</span>
              <span className="font-label font-bold text-sm text-primary">{accuracy}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-label text-xs font-bold text-on-surface-variant uppercase">Cards Reviewed</span>
              <span className="font-label font-bold text-sm text-on-surface">{currentIndex} / {totalCards}</span>
            </div>
          </div>
        </section>

        {/* Domain Info */}
        <section className="bg-surface-container-lowest rounded-xl p-6 flex flex-col gap-4 ghost-border" style={{ boxShadow: '0 12px 48px rgba(46,50,48,0.08)' }}>
          <div className="flex items-center justify-between">
            <h3 className="font-headline font-bold text-lg">Domain Info</h3>
            <span className="material-symbols-outlined text-primary">info</span>
          </div>
          <div className="flex flex-col gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed-variant font-label font-bold text-xs w-fit">
              <span className="material-symbols-outlined text-sm">{domain.icon ?? 'category'}</span>
              {domain.title}
            </span>
            {domain.description && (
              <p className="font-body text-sm leading-relaxed text-on-surface-variant">{domain.description}</p>
            )}
          </div>
        </section>

        {/* Other Decks */}
        {allDomains.length > 1 && (
          <section className="bg-surface-container-lowest rounded-xl p-6 flex flex-col gap-4 flex-1 ghost-border" style={{ boxShadow: '0 12px 48px rgba(46,50,48,0.08)' }}>
            <div className="flex items-center justify-between">
              <h3 className="font-headline font-bold text-lg">Other Decks</h3>
              <span className="material-symbols-outlined text-primary">library_books</span>
            </div>
            <div className="flex flex-col gap-1">
              {allDomains.filter(d => d.slug !== domainSlug).slice(0, 5).map(d => (
                <Link key={d.id} href={`/flashcards/${d.slug}`} className="group flex items-center justify-between p-3 rounded-lg hover:bg-surface-container-low transition-colors">
                  <div className="flex flex-col">
                    <span className="font-label font-bold text-sm text-primary">{d.title}</span>
                    <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
                      {d.description?.slice(0, 30) ?? 'Flashcard deck'}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-sm opacity-0 group-hover:opacity-100 transition-opacity text-primary">arrow_forward</span>
                </Link>
              ))}
            </div>
            <Link href="/flashcards" className="mt-auto w-full py-3 bg-surface-container-high text-on-surface-variant rounded-lg font-label font-bold text-sm hover:bg-surface-container-highest transition-colors text-center block">
              End Session
            </Link>
          </section>
        )}
      </aside>
    </main>
    </>
  )
}

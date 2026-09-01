'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { HatchImage } from '@/components/redesign/HatchImage'
import { cleanDisplayCopy } from '@/lib/copy/display'
import { useNextChallenge } from '@/components/redesign/practice/useNextChallenge'

// Fixed card height across loading/loaded/empty states so the page below it
// never shifts once the client-side recommendation fetch resolves (was
// previously a shorter p-4 skeleton swapping for a taller px-4/py-3 card, or
// disappearing to nothing when there's no recommendation).
const BANNER_HEIGHT = 'h-[76px]'

/**
 * `banner`: wide horizontal strip for the main results column (mobile/tablet,
 * where there's no side rail to hold it).
 * `card`: vertical layout matching NextBestRepCard's rail styling — used on
 * lg+ where HatchPick moves into the right rail, above Next best rep, so
 * both "what to do next" surfaces sit together instead of splitting across
 * the main column and the rail.
 */
export function HatchPick({ className = 'mb-6', variant = 'banner' }: { className?: string; variant?: 'banner' | 'card' }) {
  const router = useRouter()
  const { data, loading } = useNextChallenge()
  const [navigating, setNavigating] = useState(false)

  if (variant === 'card') {
    if (loading) {
      return (
        <div className={`animate-pulse rounded-2xl border border-note-mint-border bg-note-mint/60 p-4 ${className}`}>
          <div className="mb-1.5 h-4 w-28 rounded bg-note-mint-border/50" />
          <div className="h-3 w-full rounded bg-note-mint-border/40" />
          <div className="mt-1.5 h-3 w-2/3 rounded bg-note-mint-border/40" />
          <div className="mt-3 h-8 w-24 rounded-full bg-note-mint-border/50" />
        </div>
      )
    }

    const target = data ? (data.challenge.slug ?? data.challenge.id) : null
    if (!data || !target) return null

    const href = `/workspace/challenges/${target}`
    const challengeTitle = cleanDisplayCopy(data.challenge.title) || data.challenge.title
    const tip = cleanDisplayCopy(data.tip ?? '')

    return (
      <div className={`rounded-2xl border border-note-mint-border bg-note-mint p-4 ${className}`}>
        <div className="mb-1.5 flex items-center gap-2">
          <HatchImage size={22} state="speaking" className="flex-shrink-0" />
          <span className="font-label text-[10px] font-bold uppercase tracking-[0.08em] text-forest-700">Hatch&apos;s Pick</span>
        </div>
        <p className="mb-0.5 font-body text-[14.5px] font-bold leading-snug text-ink-strong">{challengeTitle}</p>
        {tip && <p className="mb-3 line-clamp-2 text-[12.5px] leading-[1.45] text-ink-secondary">{tip}</p>}
        <button
          type="button"
          disabled={navigating}
          onClick={() => {
            setNavigating(true)
            router.push(href)
          }}
          className="inline-flex items-center gap-1.5 rounded-full bg-forest-800 px-4 py-2 text-[12.5px] font-bold text-white transition-opacity disabled:cursor-wait disabled:opacity-70"
        >
          {navigating ? 'Opening…' : 'Try Now'}
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`flex ${BANNER_HEIGHT} animate-pulse items-center gap-4 rounded-xl border border-note-mint-border bg-note-mint/60 px-4 py-3 ${className}`}>
        <div className="size-11 flex-shrink-0 rounded-full bg-note-mint-border/50" />
        <div className="flex-1 space-y-2.5">
          <div className="h-4 w-52 rounded bg-note-mint-border/50" />
          <div className="h-3 w-80 rounded bg-note-mint-border/40" />
        </div>
      </div>
    )
  }

  // Resolve a navigable target. The workspace route accepts either a slug or
  // the challenge UUID; guard against a recommendation with neither so we never
  // render a CTA that points nowhere.
  const target = data ? (data.challenge.slug ?? data.challenge.id) : null

  if (!data || !target) {
    // No recommendation to show — keep the reserved height as blank space
    // rather than collapsing the card, so nothing below it jumps up.
    return <div className={`${BANNER_HEIGHT} ${className}`} aria-hidden="true" />
  }

  const href = `/workspace/challenges/${target}`
  const challengeTitle = cleanDisplayCopy(data.challenge.title) || data.challenge.title
  const tip = cleanDisplayCopy(data.tip ?? '')

  return (
    <div className={`flex ${BANNER_HEIGHT} items-center gap-4 rounded-xl border border-note-mint-border bg-note-mint px-4 py-3 ${className}`}>
      <HatchImage size={44} state="speaking" className="flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="mb-0.5 font-label text-[10px] font-bold uppercase tracking-[0.08em] text-forest-700">Hatch&apos;s Pick</p>
        <p className="truncate font-headline text-[15px] font-bold leading-snug text-ink-strong">{challengeTitle}</p>
        <p className="mt-0.5 line-clamp-1 text-[12.5px] font-semibold leading-snug text-ink-secondary">{tip}</p>
      </div>
      <button
        type="button"
        disabled={navigating}
        onClick={() => {
          setNavigating(true)
          router.push(href)
        }}
        className="flex-shrink-0 whitespace-nowrap rounded-full bg-forest-800 px-5 py-2 text-sm font-bold text-white transition-all duration-[120ms] hover:-translate-y-px hover:bg-forest-900 active:translate-y-0 disabled:cursor-wait disabled:opacity-70"
      >
        {navigating ? 'Opening…' : 'Try Now'}
      </button>
    </div>
  )
}

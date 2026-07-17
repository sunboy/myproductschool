'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { HatchImage } from '@/components/redesign/HatchImage'
import { cleanDisplayCopy } from '@/lib/copy/display'
import { useNextChallenge } from '@/components/redesign/practice/useNextChallenge'

export function HatchPick({ className = 'mb-6' }: { className?: string }) {
  const router = useRouter()
  const { data, loading } = useNextChallenge()
  const [navigating, setNavigating] = useState(false)

  if (loading) {
    return (
      <div className={`flex animate-pulse items-center gap-4 rounded-xl border border-note-mint-border bg-note-mint/60 p-4 ${className}`}>
        <div className="size-11 flex-shrink-0 rounded-full bg-note-mint-border/50" />
        <div className="flex-1 space-y-2.5">
          <div className="h-4 w-52 rounded bg-note-mint-border/50" />
          <div className="h-3 w-80 rounded bg-note-mint-border/40" />
        </div>
      </div>
    )
  }

  if (!data) return null

  // Resolve a navigable target. The workspace route accepts either a slug or
  // the challenge UUID; guard against a recommendation with neither so we never
  // render a CTA that points nowhere.
  const target = data.challenge.slug ?? data.challenge.id
  if (!target) return null
  const href = `/workspace/challenges/${target}`

  const challengeTitle = cleanDisplayCopy(data.challenge.title) || data.challenge.title
  const tip = cleanDisplayCopy(data.tip ?? '')

  return (
    <div className={`flex items-center gap-4 rounded-xl border border-note-mint-border bg-note-mint px-4 py-3 ${className}`}>
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

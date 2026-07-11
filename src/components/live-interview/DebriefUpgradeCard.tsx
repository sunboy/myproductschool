'use client'

import Link from 'next/link'
import { HatchImage } from '@/components/redesign/HatchImage'

interface DebriefUpgradeCardProps {
  scorePercent: number
  grade: string
  focusArea: string
}

const STRONG_SCORE_THRESHOLD = 70

export function DebriefUpgradeCard({ scorePercent, grade, focusArea }: DebriefUpgradeCardProps) {
  const isStrong = scorePercent >= STRONG_SCORE_THRESHOLD

  const headline = isStrong
    ? "You're close. Pro drills sharpen the edge you just showed."
    : 'Pro drills target exactly the gap Hatch just flagged.'

  const body = isStrong
    ? `That ${grade.toLowerCase()} round showed real range. Pro unlocks more live interviews and deeper coaching so ${focusArea} becomes a strength you can count on.`
    : `Hatch flagged ${focusArea} as the gap to close. Pro opens up more live interviews and targeted coaching built around exactly that.`

  return (
    <div
      data-testid="debrief-upgrade-card"
      className="relative overflow-hidden rounded-xl bg-surface-container p-6 border border-primary/20"
    >
      <div className="flex items-start gap-4">
        <HatchImage
          size={56}
          state={isStrong ? 'celebrating' : 'speaking'}
          className="shrink-0"
        />
        <div className="flex-1 min-w-0">
          <span className="inline-block bg-primary-container text-on-primary-container rounded-full px-3 py-1 font-label text-xs font-bold mb-2">
            Pro unlock
          </span>
          <h2 className="font-headline text-lg font-bold text-on-surface mb-1.5">
            {headline}
          </h2>
          <p className="text-sm text-on-surface-variant font-body leading-relaxed">
            {body}
          </p>
          <Link
            href="/pricing?plan=monthly&checkout=1"
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 font-label text-sm font-bold text-on-primary no-underline transition-opacity hover:opacity-90 active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
            Go Pro
          </Link>
        </div>
      </div>
    </div>
  )
}

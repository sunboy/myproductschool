'use client'

import { useState } from 'react'

interface ShareableCardProps {
  name: string
  score: number
  topDimension: string
  challengeCount: number
  streak: number
  percentile: number
  lumaQuote: string
}

export function ShareableCard({
  name,
  score,
  topDimension,
  challengeCount,
  streak,
  percentile,
  lumaQuote,
}: ShareableCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin + '/profile/share')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback — silently fail
    }
  }

  const handleShareLinkedIn = () => {
    const url = encodeURIComponent(window.location.origin + '/profile/share')
    const text = encodeURIComponent(
      `My ProductIQ score is ${score} — Top ${percentile}% on HackProduct! Check it out:`
    )
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${url}&summary=${text}`,
      '_blank'
    )
  }

  return (
    <div className="space-y-4">
      {/* The shareable card */}
      <div className="bg-gradient-to-br from-inverse-surface to-primary/80 rounded-2xl p-8 text-white">
        <p className="text-xs uppercase tracking-widest opacity-60 text-center">
          HackProduct
        </p>

        <p className="text-6xl font-headline font-bold text-center mt-4">
          {score}
        </p>
        <p className="text-sm uppercase tracking-wider opacity-70 text-center mt-1">
          ProductIQ
        </p>

        <p className="text-lg font-medium text-center mt-2">{topDimension}</p>

        <div className="flex justify-center gap-6 text-sm opacity-80 mt-4">
          <span>{challengeCount} challenges</span>
          <span className="opacity-40">·</span>
          <span>{streak}-day streak</span>
          <span className="opacity-40">·</span>
          <span>Top {percentile}%</span>
        </div>

        <p className="italic text-sm opacity-70 mt-4 text-center">
          &ldquo;{lumaQuote}&rdquo;
        </p>

        <p className="text-xs opacity-40 text-center mt-4">{name}</p>
      </div>

      {/* Action buttons — outside the card */}
      <div className="flex gap-3">
        <button
          onClick={handleCopyLink}
          className="flex-1 flex items-center justify-center gap-2 bg-secondary-container text-on-secondary-container rounded-full px-6 py-2.5 font-label font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-lg">
            {copied ? 'check' : 'link'}
          </span>
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
        <button
          onClick={handleShareLinkedIn}
          className="flex-1 flex items-center justify-center gap-2 bg-secondary-container text-on-secondary-container rounded-full px-6 py-2.5 font-label font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-lg">share</span>
          Share to LinkedIn
        </button>
      </div>
    </div>
  )
}

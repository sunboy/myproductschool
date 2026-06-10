'use client'
// Share buttons for fit/roast reports — used on the public tool's result view
// and on the share page itself. Fires the funnel event per channel.

import { useState } from 'react'
import { trackEvent } from '@/lib/posthog/client'
import { EVENT_FIT_RESULT_SHARED } from '@/lib/posthog/events'
import type { PublicFitMode } from '@/lib/careerops/public/types'

interface FitShareActionsProps {
  shareUrl: string
  shareText: string
  mode: PublicFitMode
  className?: string
}

export function FitShareActions({ shareUrl, shareText, mode, className }: FitShareActionsProps) {
  const [copied, setCopied] = useState(false)

  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`

  function share(channel: 'copy' | 'x' | 'linkedin') {
    trackEvent(EVENT_FIT_RESULT_SHARED, { mode, channel })
  }

  async function copyLink() {
    share('copy')
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard can be unavailable; the visible URL is still selectable.
    }
  }

  return (
    <div className={className ?? 'flex flex-wrap gap-2'}>
      <a
        href={linkedInUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => share('linkedin')}
        className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 font-label text-sm font-semibold text-on-primary no-underline"
      >
        <span className="material-symbols-outlined text-[16px]" aria-hidden>share</span>
        Share to LinkedIn
      </a>
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => share('x')}
        className="inline-flex items-center gap-1.5 rounded-full bg-secondary-container px-5 py-2 font-label text-sm font-semibold text-on-secondary-container no-underline"
      >
        <span className="material-symbols-outlined text-[16px]" aria-hidden>alternate_email</span>
        Share to X
      </a>
      <button
        onClick={copyLink}
        className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant px-5 py-2 font-label text-sm font-semibold text-on-surface"
      >
        <span className="material-symbols-outlined text-[16px]" aria-hidden>{copied ? 'check' : 'link'}</span>
        {copied ? 'Copied' : 'Copy link'}
      </button>
    </div>
  )
}

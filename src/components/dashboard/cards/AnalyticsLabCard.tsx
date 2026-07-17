'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Lock, Play, Share2, Terminal } from 'lucide-react'
import { PaywallModal } from '@/components/paywalls/PaywallModal'
import type { CcAnalyticsFrontDoor } from '@/lib/data/cc-analytics-frontdoor'

interface AnalyticsLabCardProps {
  data: CcAnalyticsFrontDoor
}

/**
 * Claude Code Lab front door on the dashboard. Light system card: the dark
 * hero above is the page's single dark surface (spec §4), so this stays on
 * card-bright with hairline structure, Lucide inline icons (§9), rectangular
 * buttons (§ shape), and no zero-count stats (§3 — absent data renders as an
 * invitation line, never "0").
 */
export function AnalyticsLabCard({ data }: AnalyticsLabCardProps) {
  const [paywallOpen, setPaywallOpen] = useState(false)

  if (!data.enabled) return null

  const entryHref = data.entryChallengeSlug
    ? `/workspace/challenges/${data.entryChallengeSlug}`
    : '/challenges?discipline=analytics'
  const ctaLabel = data.isResume
    ? 'Resume session'
    : data.lastSession
    ? 'Start new run'
    : 'Start first run'

  const metaParts: string[] = []
  if (data.skillsCount > 0) {
    metaParts.push(`${data.skillsCount} reusable skill${data.skillsCount === 1 ? '' : 's'} saved`)
  }
  if (data.lastSession?.gradeLabel) {
    metaParts.push(`Last scorecard: ${data.lastSession.gradeLabel}`)
  }

  return (
    <article className="rounded-2xl border border-hairline bg-card-bright p-4 shadow-[0_1px_2px_rgba(30,27,20,.04),0_12px_32px_-24px_rgba(30,27,20,.18)] sm:p-5">
      <div className="mb-2 flex items-center gap-2">
        <Terminal size={16} strokeWidth={1.7} className="text-forest-700" />
        <span className="font-label text-[11px] font-extrabold uppercase tracking-[0.09em] text-forest-700">
          Claude Code Lab
        </span>
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="min-w-0">
          <h2 className="font-body text-[17px] font-bold leading-snug text-ink-strong">
            Run a live analysis with Claude Code.
          </h2>
          <p className="mt-1 max-w-[64ch] font-body text-[13px] leading-[1.55] text-ink-secondary">
            A real terminal running Claude Code against warehouse data. You direct it, Claude Code
            writes and runs the queries, and Hatch grades your judgment.
          </p>
          <p className="mt-1.5 text-[12px] font-semibold text-ink-muted">
            {metaParts.length > 0
              ? metaParts.join(' · ')
              : 'Your first session produces a graded scorecard.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 lg:justify-end">
          {data.hasAccess ? (
            <Link
              href={entryHref}
              className="inline-flex items-center gap-1.5 rounded-lg bg-forest-800 px-4 py-2.5 font-label text-[13px] font-bold text-white no-underline transition-opacity hover:opacity-90"
            >
              <Play size={13} strokeWidth={0} fill="currentColor" />
              {ctaLabel}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setPaywallOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-forest-800 px-4 py-2.5 font-label text-[13px] font-bold text-white transition-opacity hover:opacity-90"
            >
              <Lock size={14} strokeWidth={1.8} />
              Unlock lab
            </button>
          )}

          {data.lastSession?.shareId && data.lastSession.challengeSlug && (
            <Link
              href={`/workspace/challenges/${data.lastSession.challengeSlug}/share/${data.lastSession.shareId}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-white px-3.5 py-2.5 font-label text-[13px] font-bold text-ink-strong no-underline transition-colors hover:bg-surface-container-low"
            >
              <Share2 size={14} strokeWidth={1.8} />
              Scorecard
            </Link>
          )}
        </div>
      </div>

      {!data.hasAccess && (
        <PaywallModal
          open={paywallOpen}
          feature="claude_code_analytics"
          dismissible
          onClose={() => setPaywallOpen(false)}
        />
      )}
    </article>
  )
}

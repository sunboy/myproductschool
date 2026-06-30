'use client'

import Link from 'next/link'
import { useState } from 'react'
import { PaywallModal } from '@/components/paywalls/PaywallModal'
import type { CcAnalyticsFrontDoor } from '@/lib/data/cc-analytics-frontdoor'

interface AnalyticsLabCardProps {
  data: CcAnalyticsFrontDoor
}

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

  return (
    <article
      className="relative overflow-hidden rounded-[22px] p-4 text-inverse-on-surface shadow-[0_22px_44px_-30px_rgba(15,24,19,0.95)] sm:p-5"
      style={{ background: 'radial-gradient(120% 120% at 0% 0%, #203126 0%, #17221c 54%, #101812 100%)' }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.055]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(142,207,158,0.2), transparent 62%)' }}
      />

      <div className="relative flex min-h-[218px] flex-col">
        <div className="mb-2.5 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-[#8ecf9e]" style={{ fontVariationSettings: "'FILL' 1" }}>
            terminal
          </span>
          <span className="font-label text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#8ecf9e]">
            Analytics Lab
          </span>
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-label font-bold text-[#8ecf9e]">
            Anchor
          </span>
        </div>

        <h2 className="max-w-[13ch] text-balance font-headline text-[23px] font-semibold leading-[0.98] tracking-tight text-[#f5f0e8] sm:text-[26px]">
          Drive a live AI analyst.
        </h2>
        <p className="mt-2 max-w-[34ch] font-body text-[13px] leading-5 text-[#f5f0e8]/70">
          A real terminal wired to warehouse data. You direct, Claude queries, Hatch grades the judgment.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-white/[0.065] px-3 py-2.5">
            <div className="font-headline text-xl font-bold tabular-nums text-[#f5f0e8]">{data.skillsCount}</div>
            <div className="mt-0.5 text-[11px] font-label font-semibold text-[#f5f0e8]/60">
              reusable skill{data.skillsCount === 1 ? '' : 's'}
            </div>
          </div>
          <div className="rounded-2xl bg-white/[0.065] px-3 py-2.5">
            <div className="truncate font-headline text-[15px] font-bold text-[#f5f0e8]">
              {data.lastSession?.gradeLabel ?? 'No grade yet'}
            </div>
            <div className="mt-1 text-[11px] font-label font-semibold text-[#f5f0e8]/60">last scorecard</div>
          </div>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-2.5 pt-4">
          {data.hasAccess ? (
            <Link
              href={entryHref}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#8ecf9e] px-4 py-2.5 font-label text-sm font-bold text-[#101812] transition-opacity hover:opacity-90"
            >
              <span className="material-symbols-outlined text-[18px]">play_arrow</span>
              {ctaLabel}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setPaywallOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#8ecf9e] px-4 py-2.5 font-label text-sm font-bold text-[#101812] transition-opacity hover:opacity-90"
            >
              <span className="material-symbols-outlined text-[18px]">lock_open</span>
              Unlock lab
            </button>
          )}

          {data.lastSession?.shareId && data.lastSession.challengeSlug && (
            <Link
              href={`/workspace/challenges/${data.lastSession.challengeSlug}/share/${data.lastSession.shareId}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-2.5 font-label text-sm font-semibold text-[#f5f0e8]/90 transition-colors hover:bg-white/[0.14]"
            >
              <span className="material-symbols-outlined text-[17px]">ios_share</span>
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

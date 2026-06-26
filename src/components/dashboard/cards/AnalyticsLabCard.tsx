'use client'

import Link from 'next/link'
import { useState } from 'react'
import { PaywallModal } from '@/components/paywalls/PaywallModal'
import type { CcAnalyticsFrontDoor } from '@/lib/data/cc-analytics-frontdoor'

interface AnalyticsLabCardProps {
  data: CcAnalyticsFrontDoor
}

// The anchor feature's dashboard front door. A dominant, dark-terminal-toned
// tile that makes Claude Code Analytics the thing you reach for. Entitled users
// get start/resume + their compounding skills + last scorecard; users without
// the tier get an honest unlock tile that opens the paywall (no dead-end).
export function AnalyticsLabCard({ data }: AnalyticsLabCardProps) {
  const [paywallOpen, setPaywallOpen] = useState(false)

  if (!data.enabled) return null

  const entryHref = data.entryChallengeSlug
    ? `/workspace/challenges/${data.entryChallengeSlug}`
    : '/challenges?discipline=analytics'

  const resuming = Boolean(data.lastSession) === false && data.skillsCount > 0
  const ctaLabel = data.lastSession ? 'Start a new run' : resuming ? 'Resume your session' : 'Start your first run'

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6 text-inverse-on-surface"
      style={{
        background:
          'radial-gradient(120% 120% at 0% 0%, #1f2b24 0%, #16201b 55%, #0f1813 100%)',
      }}
    >
      {/* faint terminal-grid texture */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <span
            className="material-symbols-outlined text-[18px]"
            style={{ color: '#8ecf9e', fontVariationSettings: "'FILL' 1" }}
          >
            terminal
          </span>
          <span className="font-label text-[11px] font-extrabold uppercase tracking-[0.12em]" style={{ color: '#8ecf9e' }}>
            Analytics Lab
          </span>
          <span className="ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-label font-bold" style={{ background: 'rgba(142,207,158,0.14)', color: '#8ecf9e' }}>
            <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
            Anchor
          </span>
        </div>

        <h3 className="font-headline text-2xl font-semibold tracking-tight leading-tight">
          Drive a real analysis with Claude Code
        </h3>
        <p className="mt-1.5 font-body text-sm leading-relaxed" style={{ color: 'rgba(245,240,232,0.72)' }}>
          A live terminal wired to BigQuery. You direct, Claude queries, Hatch grades
          how you think. Every skill you write makes the next run sharper.
        </p>

        {/* Stat strip: skills compounded + last scorecard */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <span className="material-symbols-outlined text-[18px]" style={{ color: '#8ecf9e', fontVariationSettings: "'FILL' 1" }}>construction</span>
            <span className="font-headline text-lg font-bold tabular-nums">{data.skillsCount}</span>
            <span className="font-label text-[11px]" style={{ color: 'rgba(245,240,232,0.7)' }}>
              skill{data.skillsCount === 1 ? '' : 's'} compounded
            </span>
          </div>

          {data.lastSession?.gradeLabel && (
            <div className="inline-flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <span className="material-symbols-outlined text-[18px]" style={{ color: '#c4a66a', fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
              <span className="font-headline text-sm font-bold">{data.lastSession.gradeLabel}</span>
              <span className="font-label text-[11px]" style={{ color: 'rgba(245,240,232,0.7)' }}>last run</span>
            </div>
          )}
        </div>

        {/* CTAs */}
        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          {data.hasAccess ? (
            <Link
              href={entryHref}
              className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 font-label text-sm font-bold transition-opacity hover:opacity-90"
              style={{ background: '#8ecf9e', color: '#0f1813' }}
            >
              <span className="material-symbols-outlined text-[18px]">play_arrow</span>
              {ctaLabel}
            </Link>
          ) : (
            <button
              onClick={() => setPaywallOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 font-label text-sm font-bold transition-opacity hover:opacity-90"
              style={{ background: '#8ecf9e', color: '#0f1813' }}
            >
              <span className="material-symbols-outlined text-[18px]">lock_open</span>
              Unlock Analytics Lab
            </button>
          )}

          {data.lastSession?.shareId && data.lastSession.challengeSlug && (
            <Link
              href={`/workspace/challenges/${data.lastSession.challengeSlug}/share/${data.lastSession.shareId}`}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 font-label text-sm font-semibold transition-colors"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(245,240,232,0.9)' }}
            >
              <span className="material-symbols-outlined text-[17px]">ios_share</span>
              Last scorecard
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
    </div>
  )
}

'use client'

import Link from 'next/link'
import { FreemiumUsageSummary } from '@/components/billing/FreemiumUsageSummary'

interface UpgradeSponsorCardProps {
  plan?: string | null
  focusMove?: string | null
  dailyDone?: number
  analyticsEnabled?: boolean
  analyticsHasAccess?: boolean
}

export function UpgradeSponsorCard({
  plan,
  focusMove,
  dailyDone = 0,
  analyticsEnabled = false,
  analyticsHasAccess = false,
}: UpgradeSponsorCardProps) {
  const isFree = plan === 'free' || !plan
  const focus = focusMove ? focusMove.toLowerCase() : 'highest-leverage'
  const showAnalyticsOffer = !isFree && analyticsEnabled && !analyticsHasAccess

  const promo = isFree
    ? {
        badge: 'Pro unlock',
        icon: 'workspace_premium',
        title: 'More reps when the brief is working.',
        body: `Keep momentum after today's ${focus} rep with deeper practice, mock loops, and AI feedback.`,
        cta: dailyDone > 0 ? "Extend today's run" : 'Upgrade for more reps',
      }
    : showAnalyticsOffer
    ? {
        badge: 'Analytics tier',
        icon: 'terminal',
        title: 'Add the analyst lab to your prep loop.',
        body: 'Practice with a live terminal, warehouse-style data, and scored AI-agent judgment.',
        cta: 'Unlock Analytics Lab',
        href: '/pricing?plan=analytics_monthly&checkout=1',
      }
    : {
        badge: 'Live loop',
        icon: 'record_voice_over',
        title: 'Turn this week into a mock loop.',
        body: `Use your ${focus} focus to run one interview round, then review the scorecard while the signal is fresh.`,
        cta: 'Run a live loop',
        href: '/live-interviews',
      }
  const promoHref = 'href' in promo ? promo.href : '/pricing'

  return (
    <aside className="relative overflow-hidden rounded-[22px] border border-primary/20 bg-primary-fixed/55 p-4 shadow-[0_18px_38px_-32px_rgba(74,124,89,0.85)] sm:p-5">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(74,124,89,0.22), transparent 64%)' }}
      />
      <div className="relative">
        <div className="mb-2.5 flex justify-end">
          <span className="rounded-full border border-primary/20 bg-surface/55 px-2.5 py-1 text-[10px] font-label font-bold text-primary">
            {promo.badge}
          </span>
        </div>
        <h2 className="max-w-[17ch] font-headline text-[20px] font-bold leading-[1.02] tracking-tight text-on-surface">
          {promo.title}
        </h2>
        <p className="mt-2 text-[13px] leading-5 text-on-surface-variant">
          {promo.body}
        </p>

        {isFree && (
          <div className="mt-3">
            <FreemiumUsageSummary plan={plan} compact className="border-primary/15 bg-surface/70" />
          </div>
        )}

        {isFree ? (
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-upgrade-modal'))}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-label font-bold text-on-primary transition-[transform,opacity] hover:opacity-90 active:translate-y-px"
          >
            <span className="material-symbols-outlined text-[18px]">{promo.icon}</span>
            {promo.cta}
          </button>
        ) : (
          <Link
            href={promoHref}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-label font-bold text-on-primary no-underline transition-[transform,opacity] hover:opacity-90 active:translate-y-px"
          >
            <span className="material-symbols-outlined text-[18px]">{promo.icon}</span>
            {promo.cta}
          </Link>
        )}
      </div>
    </aside>
  )
}

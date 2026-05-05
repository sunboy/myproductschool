'use client'

import { FreemiumUsageSummary } from './FreemiumUsageSummary'

export function BillingDashboardNudge({ plan }: { plan?: string | null }) {
  if (plan !== 'free') return null

  return (
    <section className="rounded-[20px] border border-outline-variant/50 bg-surface-container-low p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-label text-[10px] font-extrabold uppercase tracking-[0.12em] text-on-surface-variant">Freemium</p>
          <h2 className="font-headline text-lg font-bold leading-tight text-on-surface">Use your free reps with intent.</h2>
        </div>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('open-upgrade-modal'))}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-label font-bold text-on-primary"
        >
          Upgrade
          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
        </button>
      </div>
      <FreemiumUsageSummary plan={plan} />
    </section>
  )
}

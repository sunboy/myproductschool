'use client'

/**
 * "Why this order?" rail card (returning users only). Explains today's path
 * ordering in a green sticky-note tint and offers a small dark CTA that fires
 * the existing Shepherd intro tour via the `start-intro-tour` window event.
 */
export function WhyThisOrderCard() {
  return (
    <div className="rounded-2xl border border-note-mint-border bg-note-mint p-4">
      <div className="mb-1.5 text-[15.5px] font-bold text-ink-strong">Why this order?</div>
      <p className="text-[12.5px] leading-[1.5] text-ink-secondary">
        Quick Take warms up the decision muscle. The core challenge completes your paused rep.
        Reflection turns Hatch feedback into the next rep.
      </p>
      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event('start-intro-tour'))}
        className="mt-3 rounded-lg bg-forest-800 px-3.5 py-[7px] text-[12px] font-bold text-white transition-opacity hover:opacity-90"
      >
        Take the tour
      </button>
    </div>
  )
}

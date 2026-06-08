'use client'

interface PricingCtaProps {
  className: string
  next: string
  children: React.ReactNode
}

/**
 * Client CTA that opens the in-page signup modal (via the `open-auth-modal`
 * event handled by V3AuthGate) instead of navigating to /signup, while
 * preserving the plan deep-link through the modal's `redirectTo`.
 */
export function PricingCta({ className, next, children }: PricingCtaProps) {
  return (
    <button
      type="button"
      className={className}
      onClick={() =>
        window.dispatchEvent(
          new CustomEvent('open-auth-modal', { detail: { mode: 'signup', next } }),
        )
      }
    >
      {children}
    </button>
  )
}

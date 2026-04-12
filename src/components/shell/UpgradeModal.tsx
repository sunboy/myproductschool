'use client'

import { useState, useEffect, useCallback } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ??
  'pk_live_51PnserEGJUB78L7n83OomVTkj4BNTLMiwg5Vl2PuUydBlFImSoXRS5N82pRoYJWJerH8hh63iUT8BOlvsQ9AP1cB00tVBDfI8t'
)

const FEATURES = [
  { icon: 'all_inclusive',     text: 'Unlimited challenge attempts' },
  { icon: 'psychology',        text: 'Full Luma coaching on every step' },
  { icon: 'analytics',         text: 'Learner DNA — competency radar' },
  { icon: 'school',            text: 'All study plans, unlocked' },
  { icon: 'mic',               text: 'Live AI interview sessions' },
  { icon: 'workspace_premium', text: 'Early access to new features' },
]

type BillingCycle = 'monthly' | 'annual'

interface UpgradeModalProps {
  open: boolean
  onClose: () => void
  userId?: string | null
}

export function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  const [billing, setBilling] = useState<BillingCycle>('annual')
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [checkoutBilling, setCheckoutBilling] = useState<BillingCycle>('annual')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const annualSavings = Math.round(((29 * 12 - 199) / (29 * 12)) * 100)
  const monthlyCost   = (199 / 12).toFixed(2)

  function handleClose() {
    setCheckoutOpen(false)
    setError(null)
    onClose()
  }

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // Lock body scroll
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  async function handleUpgrade() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: billing, embedded: true }),
      })
      const data = await res.json()
      if (data.clientSecret) {
        setCheckoutBilling(billing)
        setCheckoutOpen(true)
      } else {
        setError(data.error ?? 'Could not start checkout. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Called by EmbeddedCheckoutProvider to get a fresh client secret
  const fetchClientSecret = useCallback(async () => {
    const res = await fetch('/api/stripe/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: checkoutBilling, embedded: true }),
    })
    const data = await res.json()
    return data.clientSecret as string
  }, [checkoutBilling])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Upgrade to Pro"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-inverse-surface/60"
        style={{ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
        onClick={handleClose}
      />

      {/* Modal panel */}
      <div
        className="relative w-full max-w-md rounded-2xl animate-step-enter"
        style={{
          background: '#ffffff',
          boxShadow: '0 32px 80px rgba(46,50,48,0.22), 0 0 0 1px rgba(196,200,188,0.3)',
        }}
      >
        {/* Header */}
        <div
          className="px-5 pt-4 pb-3 flex items-center justify-between rounded-t-2xl"
          style={{ background: 'linear-gradient(145deg, #2d5a3d 0%, #4a7c59 60%, #3a6b4a 100%)' }}
        >
          <div className="flex items-center gap-2">
            {checkoutOpen && (
              <button
                onClick={() => setCheckoutOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors mr-1"
                aria-label="Back"
              >
                <span className="material-symbols-outlined text-[17px]">arrow_back</span>
              </button>
            )}
            <span
              className="material-symbols-outlined text-[18px]"
              style={{ fontVariationSettings: "'FILL' 1, 'wght' 400", color: '#fbbf24' }}
            >
              workspace_premium
            </span>
            <span className="font-headline font-bold text-white leading-tight" style={{ fontSize: '1.15rem', letterSpacing: '-0.02em' }}>
              HackProduct Pro
            </span>
          </div>
          <button
            onClick={handleClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[17px]">close</span>
          </button>
        </div>

        {checkoutOpen ? (
          /* ── Embedded Stripe Checkout ── */
          <div className="p-1">
            <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret }}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
        ) : (
          /* ── Plan selection ── */
          <>
            {/* Billing toggle + price */}
            <div className="px-5 pt-3">
              <div className="flex rounded-xl p-1 gap-1" style={{ background: '#f0ece4' }}>
                {(['monthly', 'annual'] as BillingCycle[]).map((cycle) => (
                  <button
                    key={cycle}
                    onClick={() => setBilling(cycle)}
                    className="relative flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-label font-semibold transition-all duration-200"
                    style={{
                      background: billing === cycle ? '#ffffff' : 'transparent',
                      color: billing === cycle ? '#2e3230' : '#74796e',
                      boxShadow: billing === cycle
                        ? '0 1px 4px rgba(46,50,48,0.10), 0 0 0 1px rgba(196,200,188,0.25)'
                        : 'none',
                    }}
                  >
                    {cycle === 'annual' ? 'Annual' : 'Monthly'}
                    {cycle === 'annual' && (
                      <span
                        className="font-label text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(74,124,89,0.12)', color: '#4a7c59' }}
                      >
                        Save {annualSavings}%
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex items-end gap-2 mt-2">
                <span
                  className="font-headline font-bold text-on-surface tabular-nums"
                  style={{ fontSize: '1.9rem', letterSpacing: '-0.03em', lineHeight: 1 }}
                >
                  ${billing === 'annual' ? '199' : '29'}
                </span>
                <div className="pb-0.5 space-y-0.5">
                  <p className="font-label text-xs text-on-surface-variant font-semibold">
                    {billing === 'annual' ? 'per year' : 'per month'}
                  </p>
                  {billing === 'annual' && (
                    <p className="font-label text-[10px] text-primary font-semibold">
                      ~${monthlyCost}/mo — billed annually
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Feature list */}
            <ul className="px-5 pt-3 pb-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
              {FEATURES.map(({ icon, text }) => (
                <li key={text} className="flex items-center gap-2">
                  <span
                    className="material-symbols-outlined text-primary text-[14px] shrink-0"
                    style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}
                  >
                    {icon}
                  </span>
                  <span className="font-body text-[11px] text-on-surface">{text}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <div className="px-5 pb-5 space-y-2">
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-full py-3 font-label font-bold text-sm text-white transition-all duration-200 active:scale-[0.98] disabled:opacity-70"
                style={{
                  background: 'linear-gradient(135deg, #4a7c59 0%, #3a6b4a 100%)',
                  boxShadow: '0 4px 16px rgba(74,124,89,0.30)',
                }}
              >
                {loading ? (
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    workspace_premium
                  </span>
                )}
                {loading ? 'Loading checkout…' : `Unlock Pro — $${billing === 'annual' ? '199/yr' : '29/mo'}`}
              </button>
              {error && (
                <p className="text-center font-body text-[11px] text-error">{error}</p>
              )}
              <p className="text-center font-body text-[11px] text-on-surface-variant">
                Secure checkout via Stripe. Cancel any time.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

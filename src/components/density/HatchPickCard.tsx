'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { HatchImage } from '@/components/redesign/HatchImage'

const DISMISS_MS = 24 * 60 * 60 * 1000
export function hatchPickDismissKey(scope: string) { return `hp:hatch-pick-dismissed:${scope}` }

export interface HatchPickCardProps {
  eyebrow: string
  title: string
  reason?: string
  href: string
  ctaLabel: string
  ctaVariant?: 'primary' | 'outline'
  /** When set, a ✕ hides the card for 24h in localStorage under this scope. */
  dismissScope?: string
  onCta?: () => void
  testId?: string
}

export function HatchPickCard({ eyebrow, title, reason, href, ctaLabel, ctaVariant = 'primary', dismissScope, onCta, testId = 'hatch-pick' }: HatchPickCardProps) {
  const [hidden, setHidden] = useState(false)
  useEffect(() => {
    if (!dismissScope) return
    try { const t = Number(localStorage.getItem(hatchPickDismissKey(dismissScope)) ?? 0); if (Date.now() - t < DISMISS_MS) setHidden(true) } catch { /* ignore */ }
  }, [dismissScope])
  if (hidden) return null
  return (
    <div data-testid={testId} className="relative flex items-center gap-2.5 rounded-xl border border-primary-fixed bg-card-bright px-3 py-2">
      <HatchImage state="speaking" size={36} />
      <div className="min-w-0 flex-1">
        <div className="text-[9px] font-bold uppercase tracking-[.08em] text-primary">{eyebrow}</div>
        <Link href={href} className="block truncate font-headline text-[14px] font-bold leading-tight text-ink-strong hover:underline">{title}</Link>
        {reason && <div className="truncate text-[11px] text-ink-secondary">{reason}</div>}
      </div>
      <Link href={href} onClick={onCta} data-testid={`${testId}-cta`} className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-bold ${ctaVariant === 'primary' ? 'bg-forest-800 text-white' : 'border border-forest-800 bg-card-bright text-forest-800'}`}>{ctaLabel}</Link>
      {dismissScope && (
        <button type="button" aria-label="Dismiss for today" data-testid={`${testId}-dismiss`} onClick={() => { try { localStorage.setItem(hatchPickDismissKey(dismissScope), String(Date.now())) } catch {} ; setHidden(true) }} className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full text-ink-muted hover:bg-surface-container">
          <X size={12} aria-hidden />
        </button>
      )}
    </div>
  )
}

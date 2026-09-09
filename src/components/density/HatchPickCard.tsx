'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { HatchImage } from '@/components/redesign/HatchImage'
import { Button, Card, IconButton, Text } from '@/design'

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

/** Compact recommendation card: Hatch pose, eyebrow, title, reason, one CTA,
 *  optional dismiss that reserves its own space (never overlaps the CTA). */
export function HatchPickCard({ eyebrow, title, reason, href, ctaLabel, ctaVariant = 'primary', dismissScope, onCta, testId = 'hatch-pick' }: HatchPickCardProps) {
  const [hidden, setHidden] = useState(false)
  useEffect(() => {
    if (!dismissScope) return
    try { const t = Number(localStorage.getItem(hatchPickDismissKey(dismissScope)) ?? 0); if (Date.now() - t < DISMISS_MS) setHidden(true) } catch { /* ignore */ }
  }, [dismissScope])
  if (hidden) return null
  return (
    <Card tone="bright" padding="none" data-testid={testId} className="flex-row items-center gap-2.5 border-primary-fixed px-3 py-1.5">
      <HatchImage state="speaking" size={36} />
      <div className="min-w-0 flex-1">
        <Text variant="caption" tone="primary">{eyebrow}</Text>
        <Link href={href} onClick={onCta} className="block truncate font-headline text-body font-bold leading-tight text-ink-strong hover:underline">{title}</Link>
        {reason && <Text variant="meta" className="truncate">{reason}</Text>}
      </div>
      <Button asChild size="sm" variant={ctaVariant === 'primary' ? 'primary' : 'outline'} className={ctaVariant === 'outline' ? 'border-forest-800 text-forest-800' : undefined}>
        <Link href={href} onClick={onCta} data-testid={`${testId}-cta`}>{ctaLabel}</Link>
      </Button>
      {dismissScope && (
        <IconButton size="sm" variant="ghost" label="Dismiss for today" tooltip={false} data-testid={`${testId}-dismiss`} onClick={() => { try { localStorage.setItem(hatchPickDismissKey(dismissScope), String(Date.now())) } catch {} ; setHidden(true) }} className="text-ink-muted">
          <X aria-hidden />
        </IconButton>
      )}
    </Card>
  )
}

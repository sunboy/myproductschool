import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/site'
import { JsonLdScript, breadcrumbJsonLd } from '@/lib/seo/json-ld'
import { V3PageShell } from '@/components/landing-v3/V3PageShell'
import { V3PageHero, V3Section, V3CardGrid, V3Card, V3CtaBand } from '@/components/landing-v3/sections'
import { getPublicPlanLimits } from '@/lib/usage/public-limits'
import { OfferClient } from './OfferClient'

// This page reads the ACTIVE monthly price at runtime (client fetches
// /api/billing/prices) and live plan limits server-side, so nothing about the
// offer is hardcoded. The founding offer itself is promo-agnostic: it is NOT a
// new Stripe price. Founding = existing monthly plan + a percent-off promotion
// code created out-of-band via scripts/billing/create-promo.ts. The CTA deep-
// links to /pricing?plan=monthly&checkout=1, which resumes Stripe checkout on
// mount; the founding code is applied on the Stripe page.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = buildMetadata({
  title: 'Founding Member Offer | HackProduct',
  description:
    'Founding member price for the first 100 engineers. Lock the founding rate on HackProduct Pro before it goes up. Start free, no card, then claim the founding price.',
  path: '/offer',
  keywords: [
    'HackProduct founding member',
    'founding price product interview practice',
    'early access product practice',
    'engineer interview practice offer',
  ],
})

// Founding window close. Set NEXT_PUBLIC_OFFER_DEADLINE (ISO 8601) to pin an
// exact close time; otherwise the window rolls 14 days out from render so the
// countdown always reads as live in lower environments.
function resolveDeadlineIso(): string {
  const configured = process.env.NEXT_PUBLIC_OFFER_DEADLINE?.trim()
  if (configured) {
    const parsed = new Date(configured)
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString()
  }
  return new Date(Date.now() + 14 * 86_400_000).toISOString()
}

export default async function OfferPage() {
  const limits = await getPublicPlanLimits()
  const deadlineIso = resolveDeadlineIso()

  const proofPoints = [
    {
      title: 'The price you claim is the price you keep',
      body: 'Founding members lock the rate for as long as the subscription stays active. When the standard price rises, yours does not move.',
    },
    {
      title: 'One connected practice system',
      body: 'Live AI interviews, Hatch coaching, scoring, autopsies, study plans, code, and canvas reps in one place, not a stack of scattered tools.',
    },
    {
      title: 'Start free, upgrade on your terms',
      body: `No card to begin. Run ${limits.free.challenges} challenge starts every month, and claim the founding price the week practice becomes a habit.`,
    },
  ]

  return (
    <V3PageShell>
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: 'Home', path: 'https://www.hackproduct.com/' },
            { name: 'Founding Member Offer', path: 'https://www.hackproduct.com/offer' },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'Offer',
            name: 'HackProduct founding member price',
            url: 'https://www.hackproduct.com/offer',
            description:
              'Founding member price on HackProduct Pro for the first 100 engineers. Locks in before the standard price rises.',
            availability: 'https://schema.org/LimitedAvailability',
            priceValidUntil: deadlineIso,
          },
        ]}
      />

      <V3PageHero
        eyebrow="Founding member price"
        title="First 100 engineers. Locks in before it goes up."
        subtitle="Founding pricing is the founding member rate on HackProduct Pro. Claim it now and the number holds while standard members pay more later. Start free with no card, then lock the founding rate whenever the reps become weekly."
      />

      <OfferClient freeChallengeStarts={limits.free.challenges} deadlineIso={deadlineIso} />

      <V3Section eyebrow="Why claim it now" title="Three reasons the founding rate is worth locking.">
        <V3CardGrid>
          {proofPoints.map((point) => (
            <V3Card key={point.title} title={point.title} body={point.body} />
          ))}
        </V3CardGrid>
      </V3Section>

      <V3CtaBand
        title="Lock the founding price while the window is open."
        subtitle="Start free, run a few reps, then claim the founding rate before the first 100 seats fill."
        ctas={[
          { label: 'Start free', href: '/signup' },
          { label: 'Claim founding price', href: '/pricing?plan=monthly&checkout=1' },
        ]}
      />
    </V3PageShell>
  )
}

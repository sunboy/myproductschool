import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/site'
import { V3PageShell } from '@/components/landing-v3/V3PageShell'
import { getPublicPlanLimits } from '@/lib/usage/public-limits'
import { PricingClient } from './PricingClient'

export const metadata: Metadata = buildMetadata({
  title: 'Pricing | HackProduct AI-Native Practice System',
  description:
    'Choose monthly or annual access to HackProduct Pro. Train with live interviews, Hatch AI coaching, scoring, study plans, autopsies, code, and canvas practice.',
  path: '/pricing',
  keywords: [
    'HackProduct pricing',
    'product interview practice pricing',
    'AI interview practice pricing',
    'product sense practice pricing',
    'system design practice pricing',
  ],
})

export default async function PricingPage() {
  const limits = await getPublicPlanLimits()
  return (
    <V3PageShell>
      <PricingClient limits={limits} />
    </V3PageShell>
  )
}

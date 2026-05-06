import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/site'
import { PricingClient } from './PricingClient'

export const metadata: Metadata = buildMetadata({
  title: 'Pricing | HackProduct',
  description:
    'Start free or try HackProduct Pro free for 7 days. Compare challenge starts, Hatch AI coaching, live interview practice, study plans, and billing options.',
  path: '/pricing',
  keywords: [
    'HackProduct pricing',
    'product interview practice pricing',
    'AI interview practice pricing',
    'product sense practice pricing',
    'system design practice pricing',
  ],
})

export default function PricingPage() {
  return <PricingClient />
}

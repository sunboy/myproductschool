import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/site'
import { LeadMagnetShell } from '@/components/landing-v3/lead-magnet/LeadMagnetShell'
import { FailureModeClient } from './FailureModeClient'

export const metadata: Metadata = buildMetadata({
  title: 'Find your product-sense failure mode | HackProduct',
  description:
    'Four scenarios, three minutes. Discover the exact FLOW move you skip under interview pressure, the archetype it creates, and the concrete rewrite that fixes it.',
  path: '/go/failure-mode',
  keywords: [
    'product sense interview',
    'PM interview failure mode',
    'product thinking diagnostic',
    'engineering to product manager',
    'product sense framework',
  ],
})

export default function FailureModePage() {
  return (
    <LeadMagnetShell>
      <FailureModeClient />
    </LeadMagnetShell>
  )
}

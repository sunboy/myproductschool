import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/site'
import { LeadMagnetShell } from '@/components/landing-v3/lead-magnet/LeadMagnetShell'
import { TeardownClient } from './TeardownClient'

export const metadata: Metadata = buildMetadata({
  title: 'Decode a real product decision | HackProduct',
  description:
    'Two real product decisions from public company history. Score your instinct on each one in three minutes and see how the reasoning holds up.',
  path: '/go/teardown',
  keywords: [
    'product decision teardown',
    'product thinking quiz',
    'product sense practice',
    'engineering product manager',
    'product strategy examples',
  ],
})

export default function TeardownPage() {
  return (
    <LeadMagnetShell>
      <TeardownClient />
    </LeadMagnetShell>
  )
}

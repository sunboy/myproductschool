import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/site'
import { LeadMagnetShell } from '@/components/landing-v3/lead-magnet/LeadMagnetShell'
import { SpotTheFlawClient } from './SpotTheFlawClient'

export const metadata: Metadata = buildMetadata({
  title: 'Spot the rejection flaw — AI-PM interview answer trainer',
  description:
    'Read three real-sounding weak answers, tap the flaw, see the rejection reason interviewers never say out loud. Train the eye they use in the first ninety seconds.',
  path: '/go/spot-the-flaw',
  keywords: [
    'AI PM interview',
    'product interview answer flaw',
    'product sense interview rejection',
    'PM interview coaching',
  ],
})

export default function SpotTheFlawPage() {
  return (
    <LeadMagnetShell>
      <SpotTheFlawClient />
    </LeadMagnetShell>
  )
}

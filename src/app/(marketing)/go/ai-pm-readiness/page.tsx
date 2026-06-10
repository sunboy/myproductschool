import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/site'
import { LeadMagnetShell } from '@/components/landing-v3/lead-magnet/LeadMagnetShell'
import { AiPmReadinessClient } from './AiPmReadinessClient'

export const metadata: Metadata = buildMetadata({
  title: 'Would you pass a 2026 AI product-sense round today?',
  description:
    'The AI product-sense round is now standard, and the prep that worked in 2023 gets you rejected in 2026. Five scenarios, one readiness band, a per-dimension gap report.',
  path: '/go/ai-pm-readiness',
  keywords: [
    'AI product manager interview',
    'AI PM readiness',
    'product sense AI round',
    '2026 PM interview prep',
  ],
})

export default function AiPmReadinessPage() {
  return (
    <LeadMagnetShell>
      <AiPmReadinessClient />
    </LeadMagnetShell>
  )
}

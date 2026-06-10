import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/site'
import { LeadMagnetShell } from '@/components/landing-v3/lead-magnet/LeadMagnetShell'
import { AnalystInstinctClient } from './AnalystInstinctClient'

export const metadata: Metadata = buildMetadata({
  title: 'Drive a live AI analyst | HackProduct',
  description:
    'Watch a Claude Code analyst investigate a real revenue drop, move by move. See how the finding surfaces, then take the wheel and run your own live investigation.',
  path: '/go/analyst-instinct',
  keywords: [
    'live AI data analyst',
    'Claude Code analytics',
    'SQL investigation',
    'data analyst scorecard',
    'product analytics skill',
  ],
})

export default function AnalystInstinctPage() {
  return (
    <LeadMagnetShell>
      <AnalystInstinctClient />
    </LeadMagnetShell>
  )
}

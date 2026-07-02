import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/site'
import { LeadMagnetShell } from '@/components/landing-v3/lead-magnet/LeadMagnetShell'
import { SalaryClient } from './SalaryClient'

export const metadata: Metadata = buildMetadata({
  title: 'Should you push your offer? | HackProduct',
  description:
    'Answer two questions. Get a push or hold signal, the directional comp band for your profile, and the negotiation script if you push.',
  path: '/go/salary',
  keywords: [
    'salary negotiation',
    'offer negotiation',
    'PM salary negotiation',
    'should I negotiate salary',
    'how to counter offer',
    'tech salary negotiation',
  ],
})

export default function SalaryPage() {
  return (
    <LeadMagnetShell>
      <SalaryClient />
    </LeadMagnetShell>
  )
}

import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/site'
import { LeadMagnetShell } from '@/components/landing-v3/lead-magnet/LeadMagnetShell'
import { SwitchClient } from './SwitchClient'

export const metadata: Metadata = buildMetadata({
  title: 'Engineer to PM: audit your interview story | HackProduct',
  description:
    'Five steps, one real story. Find out which product lens your engineering story is missing, get the reframe, and leave with a 30-day transition plan.',
  path: '/go/switch',
  keywords: [
    'engineer to product manager',
    'PM transition interview',
    'engineering story reframe',
    'PM interview prep',
    'software engineer to PM',
  ],
})

export default function SwitchPage() {
  return (
    <LeadMagnetShell>
      <SwitchClient />
    </LeadMagnetShell>
  )
}

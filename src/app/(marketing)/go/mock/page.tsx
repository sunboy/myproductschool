import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/site'
import { LeadMagnetShell } from '@/components/landing-v3/lead-magnet/LeadMagnetShell'
import { MockClient } from './MockClient'

export const metadata: Metadata = buildMetadata({
  title: 'Get your product answer graded | HackProduct',
  description:
    'Sixty seconds, one answer, graded the way an interviewer grades it. See how your product reasoning holds up before it costs you a real interview.',
  path: '/go/mock',
  keywords: [
    'product sense interview',
    'PM interview practice',
    'product thinking grader',
    'product sense answer feedback',
    'engineering to PM interview prep',
  ],
})

export default function MockPage() {
  return (
    <LeadMagnetShell>
      <MockClient />
    </LeadMagnetShell>
  )
}

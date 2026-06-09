import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/site'
import { LeadMagnetShell } from '@/components/landing-v3/lead-magnet/LeadMagnetShell'
import { AnswerFixClient } from './AnswerFixClient'

export const metadata: Metadata = buildMetadata({
  title: 'Turn a rambling product answer into an interview-ready one',
  description:
    'Watch a weak product-interview answer get rebuilt move by move. See why each move scores higher, then get the structure strong candidates run without thinking.',
  path: '/go/answer-fix',
  keywords: ['product interview answer structure', 'PM interview framework', 'product sense answer'],
})

export default function AnswerFixPage() {
  return (
    <LeadMagnetShell>
      <AnswerFixClient />
    </LeadMagnetShell>
  )
}

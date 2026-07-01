import type { Metadata } from 'next'
import { V3PageShell } from '@/components/landing-v3/V3PageShell'
import { buildMetadata } from '@/lib/seo/site'
import { ReadinessChecker } from '@/components/quiz/ReadinessChecker'

export const metadata: Metadata = buildMetadata({
  title: 'Level Readiness Checker | Are You Reasoning at Staff Level? | HackProduct',
  description:
    'Pick your role and target level and see the reasoning bar you have to clear on one real prompt, with a typical answer next to a staff-level answer. No account required, no comp guarantees.',
  path: '/quiz/readiness',
  keywords: [
    'staff engineer readiness',
    'senior engineer level up',
    'engineering level expectations',
    'product thinking for engineers',
    'promotion readiness check',
  ],
})

export default function ReadinessCheckerPage() {
  return (
    <V3PageShell>
      <ReadinessChecker />
    </V3PageShell>
  )
}

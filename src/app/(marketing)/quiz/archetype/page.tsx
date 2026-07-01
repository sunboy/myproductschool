import type { Metadata } from 'next'
import { V3PageShell } from '@/components/landing-v3/V3PageShell'
import { buildMetadata } from '@/lib/seo/site'
import { ArchetypeQuiz } from '@/components/quiz/ArchetypeQuiz'

export const metadata: Metadata = buildMetadata({
  title: 'What Kind of Product Thinker Are You? | HackProduct Archetype Quiz',
  description:
    'Answer four scenario questions and find out which of eight product-thinking archetypes you are, plus the blind spot that comes with it. No account required.',
  path: '/quiz/archetype',
  keywords: ['product thinking quiz', 'product sense archetype', 'product manager personality test', 'engineer product thinking'],
})

export default function ArchetypeQuizPage() {
  return (
    <V3PageShell>
      <ArchetypeQuiz />
    </V3PageShell>
  )
}

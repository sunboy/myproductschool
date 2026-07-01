import type { Metadata } from 'next'
import { V3PageShell } from '@/components/landing-v3/V3PageShell'
import { buildMetadata } from '@/lib/seo/site'
import { ProductSenseQuiz } from '@/components/quiz/ProductSenseQuiz'

export const metadata: Metadata = buildMetadata({
  title: 'Can You Pass a Product-Sense Round? | HackProduct Taste Test',
  description:
    'One real scenario, two taste-checks, and a recommendation you write yourself. Hatch scores your product sense out of nine and names the move costing you the room. No account required.',
  path: '/quiz/product-sense',
  keywords: [
    'product sense test',
    'product sense interview',
    'product thinking quiz',
    'engineer product sense',
    'pm interview practice',
  ],
})

export default function ProductSenseQuizPage() {
  return (
    <V3PageShell>
      <ProductSenseQuiz />
    </V3PageShell>
  )
}

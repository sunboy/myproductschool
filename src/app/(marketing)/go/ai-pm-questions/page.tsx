import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/site'
import { LeadMagnetShell } from '@/components/landing-v3/lead-magnet/LeadMagnetShell'
import { AiPmQuestionsClient } from './AiPmQuestionsClient'

export const metadata: Metadata = buildMetadata({
  title: 'The AI-PM questions that expose unready candidates | HackProduct',
  description:
    'Ten questions ranked by rejection risk, plus the reasoning move each one tests. Three of them separate app-layer thinking from model-layer thinking in under a minute.',
  path: '/go/ai-pm-questions',
  keywords: [
    'AI PM interview questions',
    'product manager AI interview',
    'AI product sense',
    'engineer to PM transition',
    'product thinking framework',
  ],
})

export default function AiPmQuestionsPage() {
  return (
    <LeadMagnetShell>
      <AiPmQuestionsClient />
    </LeadMagnetShell>
  )
}

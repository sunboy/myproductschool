import { getChallengeById } from '@/lib/data/challenges'
import { notFound } from 'next/navigation'
import { ChallengeWorkspace } from '@/components/challenge/ChallengeWorkspace'
import { MOCK_DOMAINS } from '@/lib/mock-data'

export default async function ChallengeWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const challenge = await getChallengeById(id)
  if (!challenge) notFound()

  const domain = MOCK_DOMAINS.find(d => d.id === challenge.domain_id)

  return (
    <ChallengeWorkspace
      challenge={challenge}
      domainTitle={domain?.title ?? 'Product Thinking'}
      domainIcon={domain?.icon ?? 'fitness_center'}
    />
  )
}

import { getChallengeById } from '@/lib/data/challenges'
import { notFound } from 'next/navigation'
import { ModelAnswer } from '@/components/challenge/ModelAnswer'
import { BackButton } from '@/components/navigation/BackButton'
import { IS_MOCK } from '@/lib/mock'

export default async function ModelAnswerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const challenge = await getChallengeById(id)
  if (!challenge) notFound()

  // In mock mode, always show as pro for dev purposes
  const isPro = IS_MOCK ? true : false

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <BackButton href={`/challenges/${id}/feedback`} label="Back to feedback" />
      <div>
        <h1 className="font-headline font-bold text-on-surface">Model Answer</h1>
        <p className="text-sm text-on-surface-variant">{challenge.title}</p>
      </div>
      <ModelAnswer challenge={challenge} isPro={isPro} />
    </div>
  )
}

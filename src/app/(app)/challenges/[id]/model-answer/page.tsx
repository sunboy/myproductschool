import { getChallengeById } from '@/lib/data/challenges'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ModelAnswer } from '@/components/challenge/ModelAnswer'

export default async function ModelAnswerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const challenge = await getChallengeById(id)
  if (!challenge) notFound()

  // In mock mode, always show as pro for dev purposes
  const isPro = process.env.USE_MOCK_DATA === 'true' ? true : false

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/challenges/${id}/feedback`} className="p-2 rounded-lg hover:bg-surface-container transition-colors">
          <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
        </Link>
        <div>
          <h1 className="font-headline font-bold text-on-surface">Model Answer</h1>
          <p className="text-sm text-on-surface-variant">{challenge.title}</p>
        </div>
      </div>
      <ModelAnswer challenge={challenge} isPro={isPro} />
    </div>
  )
}

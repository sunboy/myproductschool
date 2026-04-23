import { notFound } from 'next/navigation'
import { getStudyPlanBySlug } from '@/lib/data/study-plans'
import { StudyPlanDetailClient } from './StudyPlanDetailClient'

interface StudyPlanDetailPageProps {
  params: Promise<{ slug: string }>
}

export default async function StudyPlanDetailPage({ params }: StudyPlanDetailPageProps) {
  const { slug } = await params
  const plan = await getStudyPlanBySlug(slug)
  if (!plan) notFound()
  return <StudyPlanDetailClient plan={plan} slug={slug} />
}

import { notFound } from 'next/navigation'
import { isCareerOpsFeatureEnabled } from '@/lib/careerops/flags'
import { CareerOpsHub } from '@/components/careerops/CareerOpsHub'

export const metadata = { title: 'Career' }

export default function CareerOpsPage() {
  if (!isCareerOpsFeatureEnabled('master')) notFound()
  return <CareerOpsHub />
}

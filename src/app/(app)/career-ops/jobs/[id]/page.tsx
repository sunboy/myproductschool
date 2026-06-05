import { notFound } from 'next/navigation'
import { isCareerOpsFeatureEnabled } from '@/lib/careerops/flags'
import { ApplicationDetail } from '@/components/careerops/ApplicationDetail'

export const metadata = { title: 'Application' }

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!isCareerOpsFeatureEnabled('tracker')) notFound()
  const { id } = await params
  return (
    <div className="mx-auto w-full max-w-[860px] px-4 py-8 sm:px-6">
      <ApplicationDetail id={id} />
    </div>
  )
}

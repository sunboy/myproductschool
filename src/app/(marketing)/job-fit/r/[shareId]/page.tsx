import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SITE_NAME, SITE_URL } from '@/lib/seo/site'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSharedFitReport } from '@/lib/careerops/public/share'
import { EVENT_FIT_SHARE_VIEWED } from '@/lib/posthog/events'
import { captureServerImmediate } from '@/lib/posthog/server'
import { FitShareBody } from './FitShareBody'

interface FitSharePageProps {
  params: Promise<{ shareId: string }>
}

export async function generateMetadata({ params }: FitSharePageProps): Promise<Metadata> {
  const { shareId } = await params
  const report = await getSharedFitReport(createAdminClient(), shareId)

  if (!report) {
    return { title: 'Shared report not found', robots: { index: false, follow: false } }
  }

  const role = [report.roleTitle, report.company].filter(Boolean).join(' at ')
  const title =
    report.mode === 'resume_roast'
      ? report.includeScore && report.grade
        ? `Resume roast: grade ${report.grade}`
        : 'Resume roast'
      : role
        ? `What it takes to land ${role}`
        : 'Job fit report'
  const description =
    report.mode === 'resume_roast'
      ? report.roast?.verdict_line || 'A line-by-line resume teardown by Hatch on HackProduct.'
      : 'The bar this role actually sets, per interview discipline, read by Hatch on HackProduct.'
  const url = `${SITE_URL}/job-fit/r/${shareId}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: SITE_NAME, type: 'website' },
    twitter: { card: 'summary_large_image', title, description, creator: '@hackproduct' },
  }
}

export default async function FitSharePage({ params }: FitSharePageProps) {
  const { shareId } = await params
  const report = await getSharedFitReport(createAdminClient(), shareId)
  if (!report) notFound()

  await captureServerImmediate({
    distinctId: shareId,
    event: EVENT_FIT_SHARE_VIEWED,
    properties: { mode: report.mode },
  })

  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? SITE_URL}/job-fit/r/${shareId}`
  const isRoast = report.mode === 'resume_roast'
  const role = [report.roleTitle, report.company].filter(Boolean).join(' at ')
  const shareText = isRoast
    ? 'Hatch roasted my resume. The verdict is fair and it hurts.'
    : role
      ? `The real bar behind the ${role} listing, read by Hatch.`
      : 'The real bar behind a job listing, read by Hatch.'

  return (
    <FitShareBody
      report={report}
      shareId={shareId}
      shareUrl={shareUrl}
      shareText={shareText}
    />
  )
}

import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { buildMetadata } from '@/lib/seo/site'
import { createClient } from '@/lib/supabase/server'
import { isCareerOpsFeatureEnabled } from '@/lib/careerops/flags'
import { V3PageShell } from '@/components/landing-v3/V3PageShell'
import { PublicFitTool } from '@/components/careerops/public/PublicFitTool'

export const metadata: Metadata = buildMetadata({
  title: 'Free Job Fit Score and Resume Roast | HackProduct',
  description:
    'Paste a job description and get an honest fit score with the gaps named, or get your resume roasted line by line. One free run, no account needed.',
  path: '/job-fit',
  keywords: [
    'job fit score',
    'am I qualified for this job',
    'resume roast',
    'resume review free',
    'engineer interview readiness',
  ],
})

export default async function JobFitPage() {
  if (!isCareerOpsFeatureEnabled('public_score')) notFound()

  // Members already have the plan-limited scorer with their real history
  // behind it; the anonymous tool would only give them a worse answer.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/career-ops/score')

  return (
    <V3PageShell>
      <PublicFitTool />
    </V3PageShell>
  )
}

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isCareerOpsFeatureEnabled } from '@/lib/careerops/flags'
import { ScorePanel } from '@/components/careerops/ScorePanel'

export const metadata = { title: 'Score a job' }

export default function CareerOpsScorePage() {
  if (!isCareerOpsFeatureEnabled('scorer')) notFound()

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-8 sm:px-6">
      <Link href="/career-ops" className="inline-flex items-center gap-1 font-label text-sm text-on-surface-variant no-underline hover:text-on-surface">
        <span className="material-symbols-outlined text-[18px]" aria-hidden>arrow_back</span>
        Career
      </Link>
      <h1 className="mt-3 font-headline text-2xl font-bold text-on-surface sm:text-3xl">Score a job</h1>
      <p className="mb-6 font-body text-sm text-on-surface-variant">
        Paste a job description. Hatch scores the fit and turns the gaps into a per-discipline practice plan.
      </p>
      <ScorePanel />
    </div>
  )
}

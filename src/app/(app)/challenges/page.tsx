import { Suspense } from 'react'
import { FreePracticeContent } from './FreePracticeContent'
import { UsageProvider } from '@/context/UsageContext'
import { getAppFlag } from '@/lib/config/app-flags'

export default async function ChallengesPage({
  searchParams,
}: {
  searchParams: Promise<{
    company?: string
    difficulty?: string
    discipline?: string
    move?: string
    paradigm?: string
    q?: string
    real_interview?: string
    role?: string
    scope?: string
    tab?: string
    tag?: string
    technique?: string
    topic?: string
    type?: string
    view?: string
  }>
}) {
  // Card mode has a tight y<=300 layout budget for the first result card;
  // the legacy page keeps its taller py-7 top padding unchanged.
  const density = await getAppFlag('ui_density_v1', false)
  return (
    <UsageProvider>
      <main data-tour-target="practice-hero" className={`mx-auto max-w-[1440px] px-4 sm:px-6 ${density ? 'py-3' : 'py-7'}`}>
        <Suspense fallback={<div className="animate-pulse h-64 bg-surface-container rounded-xl" />}>
          <FreePracticeContent searchParams={searchParams} />
        </Suspense>
      </main>
    </UsageProvider>
  )
}

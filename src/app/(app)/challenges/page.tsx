import { Suspense } from 'react'
import { FreePracticeContent } from './FreePracticeContent'
import { UsageProvider } from '@/context/UsageContext'

export default async function ChallengesPage({
  searchParams,
}: {
  searchParams: Promise<{
    company?: string
    difficulty?: string
    discipline?: string
    paradigm?: string
    q?: string
    role?: string
    scope?: string
    tab?: string
    tag?: string
    type?: string
    view?: string
  }>
}) {
  return (
    <UsageProvider>
      <main className="mx-auto max-w-[1440px] px-4 py-7 sm:px-6">
        <Suspense fallback={<div className="animate-pulse h-64 bg-surface-container rounded-xl" />}>
          <FreePracticeContent searchParams={searchParams} />
        </Suspense>
      </main>
    </UsageProvider>
  )
}

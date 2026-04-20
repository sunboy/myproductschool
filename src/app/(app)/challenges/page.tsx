import { Suspense } from 'react'
import { FreePracticeContent } from './FreePracticeContent'
import { UsageProvider } from '@/context/UsageContext'

export default async function ChallengesPage({
  searchParams,
}: {
  searchParams: Promise<{ paradigm?: string; role?: string; difficulty?: string; tab?: string; view?: string }>
}) {
  return (
    <UsageProvider>
      <main className="max-w-[1440px] mx-auto px-6 py-7">
        <Suspense fallback={<div className="animate-pulse h-64 bg-surface-container rounded-xl" />}>
          <FreePracticeContent searchParams={searchParams} />
        </Suspense>
      </main>
    </UsageProvider>
  )
}

import { Suspense } from 'react'
import { FreePracticeContent } from './FreePracticeContent'
import { UsageProvider } from '@/context/UsageContext'

export default async function ChallengesPage({
  searchParams,
}: {
  searchParams: Promise<{ paradigm?: string; role?: string; difficulty?: string }>
}) {
  return (
    <UsageProvider>
      <main className="p-6 max-w-7xl w-full mx-auto">
        <Suspense fallback={<div className="animate-pulse h-64 bg-surface-container rounded-xl" />}>
          <FreePracticeContent searchParams={searchParams} />
        </Suspense>
      </main>
    </UsageProvider>
  )
}

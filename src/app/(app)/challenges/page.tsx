import { Suspense } from 'react'
import { FreePracticeContent } from './FreePracticeContent'

export default async function ChallengesPage({
  searchParams,
}: {
  searchParams: Promise<{ paradigm?: string; role?: string; difficulty?: string }>
}) {
  return (
    <main className="p-6 max-w-7xl w-full mx-auto">
      <Suspense fallback={<div className="animate-pulse h-64 bg-surface-container rounded-xl" />}>
        <FreePracticeContent searchParams={searchParams} />
      </Suspense>
    </main>
  )
}

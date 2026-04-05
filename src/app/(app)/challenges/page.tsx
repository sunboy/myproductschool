import { Suspense } from 'react'
import { TabToggle } from './TabToggle'
import { FreePracticeContent } from './FreePracticeContent'
import { GuidedTab } from './GuidedTab'

export default async function ChallengesPage({
  searchParams,
}: {
  searchParams: Promise<{ paradigm?: string; role?: string; difficulty?: string; tab?: string }>
}) {
  const params = await searchParams
  const activeTab = params.tab === 'guided' ? 'guided' : 'free'

  return (
    <main className="p-6 max-w-7xl w-full mx-auto">
      <TabToggle activeTab={activeTab} />

      {activeTab === 'free' ? (
        <Suspense fallback={<div className="animate-pulse h-64 bg-surface-container rounded-xl" />}>
          <FreePracticeContent searchParams={searchParams} />
        </Suspense>
      ) : (
        <GuidedTab />
      )}
    </main>
  )
}

'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FreePracticeContent } from './FreePracticeContent'
import { GuidedTab } from './GuidedTab'

type Tab = 'free' | 'guided'

function ChallengesShell() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const activeTab: Tab = tabParam === 'guided' ? 'guided' : 'free'

  const switchTab = (tab: Tab) => {
    if (tab === 'guided') {
      router.push('/challenges?tab=guided')
    } else {
      router.push('/challenges')
    }
  }

  // Build searchParams promise for FreePracticeContent
  const [freeSearchParams, setFreeSearchParams] = useState<Promise<{ paradigm?: string; role?: string; difficulty?: string; tab?: string }>>(
    Promise.resolve({
      paradigm: searchParams.get('paradigm') ?? undefined,
      role: searchParams.get('role') ?? undefined,
      difficulty: searchParams.get('difficulty') ?? undefined,
      tab: searchParams.get('tab') ?? undefined,
    })
  )

  useEffect(() => {
    setFreeSearchParams(Promise.resolve({
      paradigm: searchParams.get('paradigm') ?? undefined,
      role: searchParams.get('role') ?? undefined,
      difficulty: searchParams.get('difficulty') ?? undefined,
      tab: searchParams.get('tab') ?? undefined,
    }))
  }, [searchParams])

  return (
    <main className="p-6 max-w-7xl w-full mx-auto">
      {/* Tab Toggle */}
      <div className="flex items-center gap-1 mb-6 bg-surface-container rounded-xl p-1 w-fit">
        <button
          onClick={() => switchTab('free')}
          className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors ${
            activeTab === 'free'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Free Practice
        </button>
        <button
          onClick={() => switchTab('guided')}
          className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors ${
            activeTab === 'guided'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Guided Prep
        </button>
      </div>

      {activeTab === 'free' ? (
        <Suspense fallback={<div className="animate-pulse h-64 bg-surface-container rounded-xl" />}>
          <FreePracticeContent searchParams={freeSearchParams} />
        </Suspense>
      ) : (
        <GuidedTab />
      )}
    </main>
  )
}

export default function ChallengesPage() {
  return (
    <Suspense fallback={<div className="p-6 animate-pulse h-64 bg-surface-container rounded-xl" />}>
      <ChallengesShell />
    </Suspense>
  )
}

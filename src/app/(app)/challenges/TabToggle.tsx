'use client'

import { useRouter } from 'next/navigation'

type Tab = 'free' | 'guided'

export function TabToggle({ activeTab }: { activeTab: Tab }) {
  const router = useRouter()

  const switchTab = (tab: Tab) => {
    router.push(tab === 'guided' ? '/challenges?tab=guided' : '/challenges')
  }

  return (
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
  )
}

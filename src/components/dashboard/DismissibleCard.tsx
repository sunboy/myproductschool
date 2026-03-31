'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { dismissCard } from '@/app/actions/dashboard'

export function DismissibleCard({ cardId, children }: { cardId: string; children: React.ReactNode }) {
  const router = useRouter()
  const [dismissed, setDismissed] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (dismissed) return null

  const handleDismiss = () => {
    setDismissed(true) // optimistic — hide immediately
    startTransition(async () => {
      await dismissCard(cardId)
      router.refresh()
    })
  }

  return (
    <div className="relative group overflow-visible h-full">
      <button
        onClick={handleDismiss}
        disabled={isPending}
        className="absolute -top-2 -right-2 z-20 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity w-6 h-6 rounded-full bg-surface-container-highest text-on-surface-variant text-xs flex items-center justify-center hover:bg-outline-variant"
        aria-label="Dismiss card"
      >
        <span className="material-symbols-outlined text-sm">close</span>
      </button>
      {children}
    </div>
  )
}

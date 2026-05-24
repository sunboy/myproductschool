'use client'

import Link from 'next/link'

interface DunningBannerProps {
  message: string
  daysUntilSuspension?: number
}

export function DunningBanner({ message, daysUntilSuspension }: DunningBannerProps) {
  return (
    <div className="w-full py-2 px-4 bg-error text-white text-sm font-label flex items-center justify-center gap-3">
      <span className="material-symbols-outlined text-base">warning</span>
      <span>{message}</span>
      {daysUntilSuspension !== undefined && daysUntilSuspension > 0 && (
        <span className="opacity-80">({daysUntilSuspension}d left)</span>
      )}
      <Link
        href="/settings/billing"
        className="rounded-full px-3 py-0.5 text-xs font-semibold bg-white text-error ml-1"
      >
        Fix payment
      </Link>
    </div>
  )
}

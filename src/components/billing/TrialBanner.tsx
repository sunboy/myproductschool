'use client'

import Link from 'next/link'

interface TrialBannerProps {
  daysLeft: number
  trialEndsAt: string
}

export function TrialBanner({ daysLeft, trialEndsAt }: TrialBannerProps) {
  if (daysLeft > 7) return null

  const date = new Date(trialEndsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const isUrgent = daysLeft <= 2

  return (
    <div className={`w-full py-2 px-4 text-center text-sm font-label flex items-center justify-center gap-3 ${
      isUrgent ? 'bg-error text-white' : 'bg-tertiary-container text-on-surface'
    }`}>
      <span>
        {isUrgent
          ? `Trial ends ${date} — upgrade today to keep access.`
          : `${daysLeft} days left in your trial.`}
      </span>
      <Link
        href="/pricing"
        className={`rounded-full px-3 py-0.5 text-xs font-semibold ${
          isUrgent ? 'bg-white text-error' : 'bg-primary text-on-primary'
        }`}
      >
        Upgrade
      </Link>
    </div>
  )
}

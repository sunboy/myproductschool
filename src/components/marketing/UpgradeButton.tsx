'use client'
import { useState } from 'react'

interface UpgradeButtonProps {
  variant?: 'default' | 'hero'
}

export function UpgradeButton({ variant = 'default' }: UpgradeButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handleUpgrade() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch {
      setLoading(false)
    }
  }

  const className =
    variant === 'hero'
      ? 'mt-auto w-full py-4 px-6 rounded-full bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300 transform active:scale-[0.98] disabled:opacity-70'
      : 'mt-auto w-full py-3 bg-surface-container-lowest text-primary font-bold rounded-lg shadow-sm hover:bg-white transition-all active:scale-95 disabled:opacity-70'

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      className={className}
    >
      {loading ? 'Loading...' : 'Upgrade to Pro'}
    </button>
  )
}

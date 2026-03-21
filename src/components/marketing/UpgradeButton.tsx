'use client'
import { useState } from 'react'

export function UpgradeButton() {
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

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      className="block w-full py-3 text-center bg-primary text-on-primary font-medium rounded-xl hover:opacity-90 disabled:opacity-70 transition-opacity"
    >
      {loading ? 'Loading...' : 'Upgrade to Pro'}
    </button>
  )
}

'use client'

import { useState } from 'react'

export function useUpgrade(plan: 'annual' | 'monthly' = 'annual') {
  const [loading, setLoading] = useState(false)

  async function startUpgrade() {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const text = await res.text()
      if (!text) return
      const data = JSON.parse(text)
      if (data.url) {
        window.location.href = data.url
      }
    } finally {
      setLoading(false)
    }
  }

  return { startUpgrade, loading }
}

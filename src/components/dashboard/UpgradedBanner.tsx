'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

export function UpgradedBanner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (searchParams.get('upgraded') === '1') {
      setShow(true)
      // Clean the URL without a reload
      const url = new URL(window.location.href)
      url.searchParams.delete('upgraded')
      router.replace(url.pathname + (url.search || ''), { scroll: false })
    }
  }, [searchParams, router])

  if (!show) return null

  return (
    <div
      className="mx-6 mt-4 flex items-center gap-3 rounded-xl px-4 py-3 animate-step-enter"
      style={{
        background: 'rgba(200,232,208,0.6)',
        border: '1px solid rgba(74,124,89,0.2)',
        boxShadow: '0 2px 8px rgba(74,124,89,0.10)',
      }}
    >
      <span
        className="material-symbols-outlined text-primary text-[20px] shrink-0"
        style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}
      >
        workspace_premium
      </span>
      <div className="flex-1">
        <p className="font-body text-sm text-on-surface font-semibold">Welcome to Pro.</p>
        <p className="font-body text-xs text-on-surface-variant">Unlimited challenges, full Hatch coaching, and Learner DNA are now unlocked.</p>
      </div>
      <button
        onClick={() => setShow(false)}
        className="text-on-surface-variant hover:text-on-surface transition-colors shrink-0"
        aria-label="Dismiss"
      >
        <span className="material-symbols-outlined text-[18px]">close</span>
      </button>
    </div>
  )
}

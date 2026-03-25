'use client'

import { useEffect, useState } from 'react'

const TARGET = new Date('2026-04-15T00:00:00').getTime()

export function WaitlistCountdown() {
  const [remaining, setRemaining] = useState({ d: '--', h: '--' })
  const [live, setLive] = useState(false)

  useEffect(() => {
    function tick() {
      const gap = TARGET - Date.now()
      if (gap <= 0) {
        setLive(true)
        return
      }
      setRemaining({
        d: String(Math.floor(gap / 86400000)),
        h: String(Math.floor((gap % 86400000) / 3600000)),
      })
      // Update every minute — days+hours don't need per-second updates
      setTimeout(tick, 60000)
    }
    tick()
  }, [])

  if (live) {
    return <span className="font-bold text-primary font-label text-sm">Beta is live!</span>
  }

  return (
    <div className="flex items-center gap-1.5 text-sm font-label font-semibold text-on-surface-variant">
      <span
        className="material-symbols-outlined text-tertiary text-base"
        style={{ fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 20" }}
      >
        timer
      </span>
      <span>Beta in <strong className="text-on-background">{remaining.d}d {remaining.h}h</strong></span>
    </div>
  )
}

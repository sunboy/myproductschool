'use client'

import { useEffect, useState } from 'react'

const TARGET = new Date('2026-04-15T00:00:00').getTime()

export function WaitlistCountdown() {
  const [remaining, setRemaining] = useState({ d: '--', h: '--', m: '--', s: '--' })
  const [live, setLive] = useState(false)

  useEffect(() => {
    function tick() {
      const gap = TARGET - Date.now()
      if (gap <= 0) {
        setLive(true)
        return
      }
      setRemaining({
        d: String(Math.floor(gap / 86400000)).padStart(2, '0'),
        h: String(Math.floor((gap % 86400000) / 3600000)).padStart(2, '0'),
        m: String(Math.floor((gap % 3600000) / 60000)).padStart(2, '0'),
        s: String(Math.floor((gap % 60000) / 1000)).padStart(2, '0'),
      })
      requestAnimationFrame(tick)
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
      <span>Beta opens in</span>
      <span className="tabular-nums font-bold text-on-background">{remaining.d}</span>d
      <span className="tabular-nums font-bold text-on-background">{remaining.h}</span>h
      <span className="tabular-nums font-bold text-on-background">{remaining.m}</span>m
      <span className="tabular-nums font-bold text-on-background">{remaining.s}</span>s
    </div>
  )
}

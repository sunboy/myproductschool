'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const SPOTS_LEFT = 84

export function FomoBlock() {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    setNow(new Date())
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const friday = (() => {
    const d = now ?? new Date(0)
    const day = d.getDay()
    const delta = ((5 - day) + 7) % 7 || 7
    const f = new Date(d)
    f.setDate(d.getDate() + delta)
    f.setHours(23, 59, 0, 0)
    return f
  })()

  const ms = now ? Math.max(0, friday.getTime() - now.getTime()) : 0
  const days  = Math.floor(ms / 86400000)
  const hours = Math.floor((ms % 86400000) / 3600000)
  const mins  = Math.floor((ms % 3600000) / 60000)
  const secs  = Math.floor((ms % 60000) / 1000)
  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <section className="land-fomo">
      <div className="land-fomo-eyebrow">
        <span className="land-dot-orange" /> Cohort 018 closes in
      </div>
      <h2>Every engineer and PM you compete with<br /><em>is already practicing.</em></h2>
      <p>The next cohort starts Monday. Unlimited access to all five disciplines, weekly Hatch office hours, and the leaderboard that&apos;s launched 412 careers. Start now, cancel anytime.</p>
      <div className="land-fomo-spots">
        <div><b>{pad(days)}</b><span>days</span></div>
        <div><b>{pad(hours)}</b><span>hours</span></div>
        <div><b>{pad(mins)}</b><span>min</span></div>
        <div><b>{pad(secs)}</b><span>sec</span></div>
        <div className="land-fomo-spots-divider">
          <b>{SPOTS_LEFT}</b><span>seats left</span>
        </div>
      </div>
      <div>
        <Link href="/login" className="land-cta-big">Start for free, no card required →</Link>
      </div>
      <p style={{ fontSize: 12.5, opacity: 0.45, marginTop: 18 }}>Cancel anytime · join 18k+ engineers &amp; PMs</p>
    </section>
  )
}

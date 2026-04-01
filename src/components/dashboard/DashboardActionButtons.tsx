'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export function DashboardActionButtons() {
  const [dailyHref, setDailyHref] = useState('/challenges')
  const [resumeHref, setResumeHref] = useState('/challenges')

  useEffect(() => {
    // Daily Challenge — fetch once per day and cache in localStorage
    const today = new Date().toISOString().slice(0, 10)
    const cacheKey = `hackproduct_daily_challenge_${today}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      setDailyHref(`/challenges/${cached}`)
    } else {
      fetch('/api/challenges/next')
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.id) {
            localStorage.setItem(cacheKey, data.id)
            setDailyHref(`/challenges/${data.id}`)
          }
        })
        .catch(() => {})
    }

    // Resume Learning — last attempted challenge
    fetch('/api/attempts?limit=1')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const last = Array.isArray(data) ? data[0] : null
        if (last?.challenge_id) setResumeHref(`/challenges/${last.challenge_id}`)
      })
      .catch(() => {})
  }, [])

  return (
    <div className="flex gap-2 flex-wrap">
      <Link
        href={dailyHref}
        className="bg-primary text-on-primary px-4 py-2 rounded-full text-sm font-label font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
      >
        Daily Challenge
      </Link>
      <Link
        href={resumeHref}
        className="border border-outline-variant text-on-surface px-4 py-2 rounded-full text-sm font-label font-semibold hover:bg-surface-container transition-colors whitespace-nowrap"
      >
        Resume Learning
      </Link>
    </div>
  )
}

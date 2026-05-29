'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import { cleanDisplayCopy } from '@/lib/copy/display'

interface HatchPickData {
  challenge: { id: string; slug?: string; title: string }
  tip: string
  is_calibrated: boolean
}

export function HatchPick() {
  const router = useRouter()
  const [data, setData] = useState<HatchPickData | null>(null)
  const [loading, setLoading] = useState(true)
  const [navigating, setNavigating] = useState(false)

  useEffect(() => {
    fetch('/api/challenges/next')
      .then(r => r.ok ? r.json() : null)
      .then(json => { if (json?.challenge) setData(json) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="bg-primary-container/20 border border-primary-container/30 rounded-xl p-4 mb-6 flex items-center gap-4 animate-pulse">
        <div className="w-10 h-10 rounded-full bg-primary-container/40 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-48 bg-primary-container/40 rounded" />
          <div className="h-3 w-72 bg-primary-container/30 rounded" />
        </div>
      </div>
    )
  }

  if (!data) return null

  // Resolve a navigable target. The workspace route accepts either a slug or
  // the challenge UUID; guard against a recommendation with neither so we never
  // render a CTA that points nowhere.
  const target = data.challenge.slug ?? data.challenge.id
  if (!target) return null
  const href = `/workspace/challenges/${target}`

  const challengeTitle = cleanDisplayCopy(data.challenge.title) || data.challenge.title
  const tip = cleanDisplayCopy(data.tip)

  return (
    <div
      className="rounded-xl p-4 mb-6 flex items-center gap-4"
      style={{ background: 'linear-gradient(90deg, #cfe3d3 0%, #d8ead9 100%)', border: '1px solid rgba(74,124,89,0.15)' }}
    >
      <HatchGlyph size={40} state="speaking" className="text-primary flex-shrink-0" />
      <div>
        <p className="text-sm font-bold text-primary">Hatch&apos;s Pick: {challengeTitle}</p>
        <p className="text-xs text-on-surface-variant font-semibold">{tip}</p>
      </div>
      <button
        type="button"
        disabled={navigating}
        onClick={() => {
          setNavigating(true)
          router.push(href)
        }}
        className="ml-auto text-xs font-bold px-4 py-2 rounded-full transition-colors whitespace-nowrap hover:-translate-y-px active:translate-y-0 duration-[120ms] disabled:opacity-70 disabled:cursor-wait"
        style={{ backgroundColor: '#1f2421', color: '#f0ede4' }}
        onMouseEnter={e => { if (!navigating) e.currentTarget.style.backgroundColor = '#111614' }}
        onMouseLeave={e => { if (!navigating) e.currentTarget.style.backgroundColor = '#1f2421' }}
      >
        {navigating ? 'Opening…' : 'Try Now'}
      </button>
    </div>
  )
}

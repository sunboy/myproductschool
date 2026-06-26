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
      <div className="bg-primary-container/20 border border-primary-container/30 rounded-xl p-5 mb-6 flex items-center gap-5 animate-pulse">
        <div className="w-14 h-14 rounded-full bg-primary-container/40 flex-shrink-0" />
        <div className="flex-1 space-y-2.5">
          <div className="h-4 w-52 bg-primary-container/40 rounded" />
          <div className="h-3 w-80 bg-primary-container/30 rounded" />
          <div className="h-3 w-64 bg-primary-container/25 rounded" />
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
      className="rounded-xl p-5 mb-6 flex items-center gap-5 shadow-[0_12px_32px_-20px_rgba(30,53,40,0.35)]"
      style={{ background: 'linear-gradient(135deg, #cfe3d3 0%, #d8ead9 60%, #e8f2eb 100%)', border: '1px solid rgba(74,124,89,0.20)' }}
    >
      <HatchGlyph size={56} state="speaking" className="text-primary flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-primary/70 font-label mb-1">Hatch&apos;s Pick</p>
        <p className="text-[16px] font-bold text-on-surface font-headline leading-snug truncate">{challengeTitle}</p>
        <p className="text-[13px] text-on-surface-variant font-semibold mt-0.5 leading-snug line-clamp-2">{tip}</p>
      </div>
      <button
        type="button"
        disabled={navigating}
        onClick={() => {
          setNavigating(true)
          router.push(href)
        }}
        className="flex-shrink-0 text-sm font-bold px-5 py-2.5 rounded-full transition-all whitespace-nowrap hover:-translate-y-px active:translate-y-0 duration-[120ms] disabled:opacity-70 disabled:cursor-wait shadow-[0_8px_20px_-12px_rgba(30,53,40,0.55)]"
        style={{ backgroundColor: '#1f2421', color: '#f0ede4' }}
        onMouseEnter={e => { if (!navigating) e.currentTarget.style.backgroundColor = '#111614' }}
        onMouseLeave={e => { if (!navigating) e.currentTarget.style.backgroundColor = '#1f2421' }}
      >
        {navigating ? 'Opening…' : 'Try Now'}
      </button>
    </div>
  )
}

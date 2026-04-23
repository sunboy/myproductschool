'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

interface LumaPickData {
  challenge: { id: string; slug?: string; title: string }
  tip: string
  is_calibrated: boolean
}

export function LumaPick() {
  const [data, setData] = useState<LumaPickData | null>(null)
  const [loading, setLoading] = useState(true)

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

  return (
    <div
      className="rounded-xl p-4 mb-6 flex items-center gap-4"
      style={{ background: 'linear-gradient(90deg, #cfe3d3 0%, #d8ead9 100%)', border: '1px solid rgba(74,124,89,0.15)' }}
    >
      <LumaGlyph size={40} state="speaking" className="text-primary flex-shrink-0" />
      <div>
        <p className="text-sm font-bold text-primary">Luma&apos;s Pick: {data.challenge.title}</p>
        <p className="text-xs text-on-surface-variant">{data.tip}</p>
      </div>
      <Link
        href={`/workspace/challenges/${data.challenge.slug ?? data.challenge.id}`}
        className="ml-auto text-xs font-bold px-4 py-2 rounded-full transition-colors whitespace-nowrap hover:-translate-y-px active:translate-y-0 duration-[120ms]"
        style={{ backgroundColor: '#1f2421', color: '#f0ede4' }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#111614')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#1f2421')}
      >
        Try Now
      </Link>
    </div>
  )
}

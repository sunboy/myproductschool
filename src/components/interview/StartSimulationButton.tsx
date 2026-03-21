'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

interface StartSimulationButtonProps {
  companyId: string
  companyName: string
}

export function StartSimulationButton({ companyId, companyName }: StartSimulationButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleStart() {
    setLoading(true)
    try {
      const res = await fetch('/api/simulation/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId }),
      })
      const { sessionId } = await res.json()
      router.push(`/simulation/${sessionId}`)
    } catch {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleStart}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-on-primary font-medium rounded-xl hover:opacity-90 disabled:opacity-70 transition-opacity"
    >
      {loading ? (
        <><LumaGlyph size={16} className="animate-luma-glow" />Starting...</>
      ) : (
        <><span className="material-symbols-outlined text-sm">play_circle</span>Start {companyName} simulation</>
      )}
    </button>
  )
}

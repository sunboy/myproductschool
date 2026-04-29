// src/app/(app)/live-interviews/loop/new/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { LoopDiscipline } from '@/lib/interview-loops/types'

const DISCIPLINE_OPTIONS: { key: LoopDiscipline; label: string; duration: string; emoji: string }[] = [
  { key: 'coding', label: 'Coding', duration: '25 min', emoji: '💻' },
  { key: 'system_design', label: 'System Design', duration: '35 min', emoji: '🏗️' },
  { key: 'data_modeling', label: 'Data Modeling', duration: '30 min', emoji: '🗄️' },
  { key: 'product_sense', label: 'Product Sense', duration: '30 min', emoji: '🧠' },
]

const ROLE_SUGGESTIONS: Record<string, LoopDiscipline[]> = {
  'staff eng': ['coding', 'system_design', 'product_sense'],
  'founding eng': ['coding', 'system_design', 'data_modeling', 'product_sense'],
  'pm': ['product_sense', 'data_modeling'],
  'tech lead': ['system_design', 'product_sense', 'coding'],
}

function suggestRoundOrder(role: string): LoopDiscipline[] {
  const lower = role.toLowerCase()
  for (const [key, order] of Object.entries(ROLE_SUGGESTIONS)) {
    if (lower.includes(key)) return order
  }
  return ['coding', 'system_design', 'product_sense']
}

export default function LoopBuilderPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [targetCompany, setTargetCompany] = useState('')
  const [targetRole, setTargetRole] = useState('')
  const [roundOrder, setRoundOrder] = useState<LoopDiscipline[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleNext() {
    if (step === 1) {
      setRoundOrder(suggestRoundOrder(targetRole))
      setStep(2)
    } else if (step === 2) {
      setStep(3)
    }
  }

  function removeRound(idx: number) {
    setRoundOrder((prev) => prev.filter((_, i) => i !== idx))
  }

  function addRound(discipline: LoopDiscipline) {
    if (!roundOrder.includes(discipline)) {
      setRoundOrder((prev) => [...prev, discipline])
    }
  }

  async function handleStart() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/interview-loops/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetCompany, targetRole, roundOrder }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to create loop')
        return
      }
      const { loopId } = await res.json()
      router.push(`/live-interviews/loop/${loopId}`)
    } finally {
      setLoading(false)
    }
  }

  const totalMinutes = roundOrder.reduce((sum, d) => {
    const opt = DISCIPLINE_OPTIONS.find((o) => o.key === d)
    return sum + (opt ? parseInt(opt.duration) : 0)
  }, 0)

  return (
    <div className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-6">
      <div>
        <h1 className="font-headline font-bold text-on-surface text-xl mb-1">Build your loop</h1>
        <p className="font-body text-sm text-on-surface-variant">Configure a multi-round interview simulation.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            {s > 1 && <div className={`h-px w-6 ${step >= s ? 'bg-primary' : 'bg-outline-variant'}`} />}
            <div className={[
              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
              step >= s ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant',
            ].join(' ')}>
              {s}
            </div>
            <span className={`text-xs font-label ${step === s ? 'text-primary font-semibold' : 'text-on-surface-variant'}`}>
              {s === 1 ? 'Target' : s === 2 ? 'Rounds' : 'Confirm'}
            </span>
          </div>
        ))}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div className="bg-surface-container rounded-xl p-5 border border-outline-variant flex flex-col gap-4">
          <div className="font-label font-bold text-on-surface">Who are you targeting?</div>
          <div className="flex flex-col gap-3">
            <div>
              <label className="font-label text-xs text-on-surface-variant font-semibold mb-1 block">Company</label>
              <input
                className="w-full border border-outline-variant rounded-lg px-3 py-2 font-body text-sm bg-surface text-on-surface focus:outline-none focus:border-primary"
                placeholder="e.g. Stripe, Google, Series B startup…"
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
              />
            </div>
            <div>
              <label className="font-label text-xs text-on-surface-variant font-semibold mb-1 block">Role &amp; Level</label>
              <input
                className="w-full border border-outline-variant rounded-lg px-3 py-2 font-body text-sm bg-surface text-on-surface focus:outline-none focus:border-primary"
                placeholder="e.g. Staff Eng L6, Founding PM…"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
              />
            </div>
          </div>
          <button
            onClick={handleNext}
            disabled={!targetRole.trim()}
            className="bg-primary text-on-primary rounded-xl py-2.5 font-label font-bold text-sm disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            Next →
          </button>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="bg-surface-container rounded-xl p-5 border border-outline-variant flex flex-col gap-4">
          <div>
            <div className="font-label font-bold text-on-surface mb-1">Configure rounds</div>
            <div className="font-body text-xs text-on-surface-variant">Hatch suggested this order based on your role. Remove or add rounds below.</div>
          </div>
          <div className="flex flex-col gap-2">
            {roundOrder.map((discipline, idx) => {
              const opt = DISCIPLINE_OPTIONS.find((o) => o.key === discipline)!
              return (
                <div key={discipline} className="flex items-center gap-3 bg-surface-container-low rounded-lg px-3 py-2.5 border border-outline-variant">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-on-primary text-xs font-bold shrink-0">{idx + 1}</div>
                  <div className="flex-1">
                    <div className="font-label font-semibold text-sm text-on-surface">{opt.emoji} {opt.label}</div>
                    <div className="font-label text-xs text-on-surface-variant">{opt.duration}</div>
                  </div>
                  <button onClick={() => removeRound(idx)} className="text-on-surface-variant/40 hover:text-error transition-colors">
                    <span className="material-symbols-outlined text-base leading-none">close</span>
                  </button>
                </div>
              )
            })}
            {DISCIPLINE_OPTIONS.filter((o) => !roundOrder.includes(o.key)).length > 0 && (
              <div className="border border-dashed border-outline-variant rounded-lg p-2 flex gap-2 flex-wrap">
                {DISCIPLINE_OPTIONS.filter((o) => !roundOrder.includes(o.key)).map((o) => (
                  <button
                    key={o.key}
                    onClick={() => addRound(o.key)}
                    className="text-xs font-label text-on-surface-variant border border-outline-variant rounded-lg px-2.5 py-1 hover:bg-surface-container-high transition-colors"
                  >
                    + {o.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="border border-outline-variant rounded-xl py-2.5 px-4 font-label text-sm text-on-surface-variant">
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={roundOrder.length < 2}
              className="flex-1 bg-primary text-on-primary rounded-xl py-2.5 font-label font-bold text-sm disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div className="bg-surface-container rounded-xl p-5 border border-outline-variant flex flex-col gap-4">
          <div className="font-label font-bold text-on-surface">Confirm your loop</div>
          <div className="flex flex-col gap-1.5 text-sm font-body text-on-surface-variant">
            <div><span className="font-semibold text-on-surface">Target:</span> {[targetCompany, targetRole].filter(Boolean).join(' · ')}</div>
            <div><span className="font-semibold text-on-surface">Rounds:</span> {roundOrder.map((d) => DISCIPLINE_OPTIONS.find((o) => o.key === d)?.label).join(' → ')}</div>
            <div><span className="font-semibold text-on-surface">Est. total:</span> {totalMinutes} min</div>
          </div>
          <div className="font-body text-xs text-on-surface-variant bg-surface-container-high rounded-lg p-3">
            You can pause between rounds and resume at any time. Hatch will carry context from each completed round into the next.
          </div>
          {error && <div className="text-error text-xs font-label">{error}</div>}
          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="border border-outline-variant rounded-xl py-2.5 px-4 font-label text-sm text-on-surface-variant">
              Back
            </button>
            <button
              onClick={handleStart}
              disabled={loading}
              className="flex-1 bg-primary text-on-primary rounded-xl py-2.5 font-label font-bold text-sm disabled:opacity-60"
            >
              {loading ? 'Creating…' : 'Start loop →'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

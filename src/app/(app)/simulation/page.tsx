'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { HatchGlyph } from '@/components/shell/HatchGlyph'

const COMPANIES = ['Meta', 'Google', 'Stripe', 'Airbnb']

export default function SimulationPage() {
  const router = useRouter()
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null)
  const [suggestedCompany, setSuggestedCompany] = useState<string | null>(null)
  const [difficulty, setDifficulty] = useState<'standard' | 'advanced'>('standard')
  const [isStarting, setIsStarting] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)

  // Zhang Yiming: pre-select company based on user's prep context
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('hackproduct_prep_company') : null
    if (saved && COMPANIES.includes(saved)) {
      setSuggestedCompany(saved)
      setSelectedCompany(saved)
    } else {
      // Default suggestion: Google (most common first prep target)
      setSuggestedCompany('Google')
      setSelectedCompany('Google')
    }
  }, [])

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-10">
      {/* Hero */}
      <div className="text-center space-y-3">
        <span className="inline-block bg-tertiary-container text-on-tertiary-container rounded-full px-3 py-1 text-xs font-semibold font-label">
          Pro Feature
        </span>
        <h1 className="font-headline text-3xl font-bold text-on-surface">
          Practice like it&apos;s real
        </h1>
        <p className="text-on-surface-variant">
          3 rounds. 45 minutes. Hatch debriefs you at the end.
        </p>
      </div>

      {/* Company Selector */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-label text-sm font-semibold text-on-surface-variant uppercase tracking-wider">
            Choose a company
          </h2>
          {suggestedCompany && (
            <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant">
              <HatchGlyph size={16} state="none" className="text-primary" />
              <span>Hatch suggests: <span className="font-bold text-primary">{suggestedCompany}</span></span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {COMPANIES.map(company => (
            <button
              key={company}
              onClick={() => setSelectedCompany(company)}
              className={`bg-surface-container rounded-xl p-5 text-center transition-all relative ${
                selectedCompany === company
                  ? 'ring-2 ring-primary bg-primary-container text-on-primary-container'
                  : 'text-on-surface hover:bg-surface-container-high'
              }`}
            >
              <span className="font-headline text-lg font-bold">{company}</span>
              {company === suggestedCompany && selectedCompany !== company && (
                <span className="absolute top-1.5 right-1.5 text-[9px] font-bold text-primary bg-primary-fixed px-1.5 py-0.5 rounded-full">Suggested</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty Toggle */}
      <div className="space-y-4">
        <h2 className="font-label text-sm font-semibold text-on-surface-variant uppercase tracking-wider">
          Difficulty
        </h2>
        <div className="flex gap-3">
          <button
            onClick={() => setDifficulty('standard')}
            className={`flex-1 py-2.5 rounded-full text-sm font-label font-semibold transition-colors ${
              difficulty === 'standard'
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            Standard
          </button>
          <button
            onClick={() => setDifficulty('advanced')}
            className={`flex-1 py-2.5 rounded-full text-sm font-label font-semibold transition-colors ${
              difficulty === 'advanced'
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            Advanced
          </button>
        </div>
      </div>

      {/* CTA */}
      {!selectedCompany && (
        <p className="text-center text-xs text-on-surface-variant -mb-4">Select a company above to begin</p>
      )}
      {startError && (
        <p className="text-center text-xs text-error -mb-4">{startError}</p>
      )}
      <button
        disabled={isStarting || !selectedCompany}
        onClick={async () => {
          setStartError(null)
          setIsStarting(true)
          try {
            const res = await fetch('/api/simulation/start', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ company: selectedCompany, difficulty }),
            })
            const data = await res.json()
            if (data?.sessionId) {
              router.push(`/simulation/${data.sessionId}`)
            } else {
              setStartError(data?.error ?? 'Could not start session. Try again.')
              setIsStarting(false)
            }
          } catch {
            setStartError('Network error. Please check your connection and try again.')
            setIsStarting(false)
          }
        }}
        className="bg-primary text-on-primary rounded-full w-full py-3.5 font-label font-semibold text-base hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {isStarting ? 'Starting…' : 'Start Mock Interview'}
      </button>
    </div>
  )
}

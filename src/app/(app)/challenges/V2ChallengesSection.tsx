'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Challenge, DifficultyV2, ParadigmV2 } from '@/lib/types'
import { PARADIGM_V2_LABELS, DIFFICULTY_V2_LABELS } from '@/lib/types'
import { TaxonomyFilters } from '@/components/v2/TaxonomyFilters'
import { ChallengeCardV2 } from '@/components/v2/ChallengeCardV2'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

interface V2ChallengeWithMeta extends Challenge {
  attempt_count?: number
  best_score?: number
  is_completed?: boolean
}

const PARADIGM_OPTIONS = Object.entries(PARADIGM_V2_LABELS).map(([k, v]) => ({ key: k as ParadigmV2, label: v }))
const DIFFICULTY_OPTIONS = Object.entries(DIFFICULTY_V2_LABELS).map(([k, v]) => ({ key: k as DifficultyV2, label: v }))

export function V2ChallengesSection() {
  const router = useRouter()
  const [challenges, setChallenges] = useState<V2ChallengeWithMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedParadigm, setSelectedParadigm] = useState<string | null>(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams()
    if (selectedParadigm) params.set('paradigm', selectedParadigm)
    if (selectedDifficulty) params.set('difficulty', selectedDifficulty)
    setLoading(true)
    fetch(`/api/challenges?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.challenges) setChallenges(data.challenges)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [selectedParadigm, selectedDifficulty])

  if (!loading && challenges.length === 0 && !selectedParadigm && !selectedDifficulty) {
    // No v2 challenges seeded yet — don't render the section
    return null
  }

  return (
    <section className="mt-10 space-y-5">
      <div className="flex items-center gap-2">
        <span
          className="material-symbols-outlined text-primary"
          style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
        >
          auto_awesome
        </span>
        <h2 className="font-headline text-lg text-on-surface">FLOW Challenges</h2>
        <span className="bg-primary text-on-primary rounded-full px-2.5 py-0.5 text-xs font-label font-semibold">New</span>
      </div>
      <p className="font-body text-sm text-on-surface-variant -mt-2">
        Frame → List → Optimize → Win. Structured 4-step challenges with role-lens coaching from Luma.
      </p>

      <TaxonomyFilters
        paradigms={PARADIGM_OPTIONS.map((p) => p.label)}
        selectedParadigm={selectedParadigm ? (PARADIGM_V2_LABELS[selectedParadigm as ParadigmV2] ?? null) : null}
        difficulties={DIFFICULTY_OPTIONS.map((d) => d.label)}
        selectedDifficulty={selectedDifficulty ? (DIFFICULTY_V2_LABELS[selectedDifficulty as DifficultyV2] ?? null) : null}
        onParadigmChange={(label) => {
          const entry = PARADIGM_OPTIONS.find((p) => p.label === label)
          setSelectedParadigm(entry ? entry.key : null)
        }}
        onDifficultyChange={(label) => {
          const entry = DIFFICULTY_OPTIONS.find((d) => d.label === label)
          setSelectedDifficulty(entry ? entry.key : null)
        }}
      />

      {loading ? (
        <div className="flex justify-center py-8">
          <LumaGlyph size={40} state="reviewing" className="text-primary" />
        </div>
      ) : challenges.length === 0 ? (
        <p className="text-center font-body text-sm text-on-surface-variant py-8">
          No FLOW challenges match that filter.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {challenges.map((c) => (
            <ChallengeCardV2
              key={c.id}
              challenge={c}
              onStart={(id) => router.push(`/workspace/challenges/${id}`)}
            />
          ))}
        </div>
      )}
    </section>
  )
}

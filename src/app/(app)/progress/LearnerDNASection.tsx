'use client'

import { useLearnerDNA } from '@/lib/v2/hooks/useLearnerDNA'
import { CompetencyRadar } from '@/components/v2/CompetencyRadar'
import { COMPETENCY_LABELS } from '@/lib/types'

export function LearnerDNASection() {
  const { dna, loading } = useLearnerDNA()

  if (loading || !dna || dna.competencies.length === 0) return null

  return (
    <div className="bg-surface-container rounded-xl p-5 border border-outline-variant/30 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold">Learner DNA</h3>
          <p className="text-[11px] text-on-surface-variant">6-axis competency profile</p>
        </div>
        <span className={`text-xs font-label font-semibold px-3 py-1 rounded-full ${
          dna.overall_level === 'Expert' ? 'bg-primary text-on-primary' :
          dna.overall_level === 'Advanced' ? 'bg-tertiary-container text-on-surface' :
          dna.overall_level === 'Developing' ? 'bg-secondary-container text-on-secondary-container' :
          'bg-surface-container-highest text-on-surface-variant'
        }`}>
          {dna.overall_level}
        </span>
      </div>
      <CompetencyRadar
        competencies={dna.competencies.map((c) => ({
          label: COMPETENCY_LABELS[c.competency],
          score: c.score,
        }))}
      />
      {dna.weakest_link && (
        <p className="text-[11px] text-on-surface-variant text-center">
          Focus area: <span className="font-semibold text-on-surface">{COMPETENCY_LABELS[dna.weakest_link]}</span>
        </p>
      )}
    </div>
  )
}

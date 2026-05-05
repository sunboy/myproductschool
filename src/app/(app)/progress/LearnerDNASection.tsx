'use client'

import { useLearnerDNA } from '@/lib/v2/hooks/useLearnerDNA'
import { CompetencyRadar } from '@/components/v2/CompetencyRadar'
import { COMPETENCY_LABELS, type Competency } from '@/lib/types'

type LearnerDNAPayload = {
  overall_level: 'Expert' | 'Advanced' | 'Developing' | 'Beginner'
  competencies: { label: string; score: number }[]
  weakest_link_label: string | null
  weakest_link_key: Competency | null
}

export function useLearnerDNAData(): { data: LearnerDNAPayload | null; loading: boolean } {
  const { dna, loading } = useLearnerDNA()
  if (loading) return { data: null, loading: true }
  if (!dna || dna.competencies.length === 0) return { data: null, loading: false }
  return {
    loading: false,
    data: {
      overall_level: dna.overall_level,
      competencies: dna.competencies.map((c) => ({
        label: COMPETENCY_LABELS[c.competency],
        score: c.score,
      })),
      weakest_link_label: dna.weakest_link ? COMPETENCY_LABELS[dna.weakest_link] : null,
      weakest_link_key: dna.weakest_link ?? null,
    },
  }
}

interface LearnerDNASectionProps {
  variant?: 'standalone' | 'embedded'
}

export function LearnerDNASection({ variant = 'standalone' }: LearnerDNASectionProps) {
  const { data } = useLearnerDNAData()

  if (!data) return null

  const levelChipClass =
    data.overall_level === 'Expert' ? 'bg-primary text-on-primary' :
    data.overall_level === 'Advanced' ? 'bg-tertiary-container text-on-surface' :
    data.overall_level === 'Developing' ? 'bg-secondary-container text-on-secondary-container' :
    'bg-surface-container-highest text-on-surface-variant'

  if (variant === 'embedded') {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-end">
          <span className={`text-xs font-label font-semibold px-3 py-1 rounded-full ${levelChipClass}`}>
            {data.overall_level}
          </span>
        </div>
        <CompetencyRadar competencies={data.competencies} />
        {data.weakest_link_label && (
          <p className="text-[11px] text-on-surface-variant text-center">
            Focus area: <span className="font-semibold text-on-surface">{data.weakest_link_label}</span>
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="bg-surface-container rounded-xl p-5 border border-outline-variant/30 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold">Learner DNA</h3>
          <p className="text-[11px] text-on-surface-variant">6-axis competency profile</p>
        </div>
        <span className={`text-xs font-label font-semibold px-3 py-1 rounded-full ${levelChipClass}`}>
          {data.overall_level}
        </span>
      </div>
      <CompetencyRadar competencies={data.competencies} />
      {data.weakest_link_label && (
        <p className="text-[11px] text-on-surface-variant text-center">
          Focus area: <span className="font-semibold text-on-surface">{data.weakest_link_label}</span>
        </p>
      )}
    </div>
  )
}

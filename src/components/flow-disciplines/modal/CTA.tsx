'use client'

import Link from 'next/link'
import type { DisciplineId } from '@/lib/data/flow-framework/types'

interface CTAProps {
  disciplineId: DisciplineId
}

const DISCIPLINE_LABELS: Record<DisciplineId, string> = {
  product_sense: 'Product Sense',
  system_design: 'System Design',
  data_modeling: 'Data Modeling',
  coding: 'Coding',
}

const DISCIPLINE_HREFS: Record<DisciplineId, string> = {
  product_sense: '/challenges?discipline=product_sense',
  system_design: '/challenges?discipline=system_design',
  data_modeling: '/challenges?discipline=data_modeling',
  coding: '/challenges?discipline=algorithm',
}

export function CTA({ disciplineId }: CTAProps) {
  const label = DISCIPLINE_LABELS[disciplineId]
  return (
    <div
      className="flex flex-col items-start justify-between gap-2.5 px-4 py-2.5 sm:flex-row sm:items-center sm:px-5"
      style={{ borderTop: '1px solid rgba(212,165,116,0.18)', background: '#162620' }}
    >
      <p className="font-body text-[13px] leading-snug" style={{ color: 'rgba(245,240,230,0.64)' }}>
        Practice {label}: Hatch will score the same Frame, List, Optimize, and Win moves.
      </p>
      <Link
        href={DISCIPLINE_HREFS[disciplineId]}
        className="shrink-0 font-label text-[13px] font-bold px-3.5 py-1.5 rounded-full transition-opacity duration-200 hover:opacity-90 focus-visible:outline-2"
        style={{ background: '#d4a574', color: '#1f362d' }}
      >
        Practice this discipline
      </Link>
    </div>
  )
}

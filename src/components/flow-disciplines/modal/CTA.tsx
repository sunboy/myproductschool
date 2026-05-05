'use client'

import Link from 'next/link'
import type { DisciplineId } from '@/lib/data/flow-framework/types'

interface CTAProps {
  disciplineId: DisciplineId
}

const DISCIPLINE_LABELS: Record<DisciplineId, string> = {
  product_sense: 'product sense',
  system_design: 'system design',
  data_modeling: 'data modeling',
  coding: 'coding',
}

export function CTA({ disciplineId }: CTAProps) {
  const label = DISCIPLINE_LABELS[disciplineId]
  return (
    <div
      className="flex items-center justify-between gap-4 px-6 py-4"
      style={{ borderTop: '1px solid rgba(212,165,116,0.18)', background: '#162620' }}
    >
      <p className="font-body text-[17.5px]" style={{ color: 'rgba(245,240,230,0.6)' }}>
        Build {label} instincts through deliberate practice.
      </p>
      <Link
        href={`/challenges?discipline=${disciplineId}`}
        className="shrink-0 font-label text-[17.5px] font-bold px-5 py-2.5 rounded-full transition-opacity duration-200 hover:opacity-90 focus-visible:outline-2"
        style={{ background: '#d4a574', color: '#1f362d' }}
      >
        Practice this discipline
      </Link>
    </div>
  )
}

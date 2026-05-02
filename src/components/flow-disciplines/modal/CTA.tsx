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
    <div className="flex items-center justify-between gap-4 px-6 py-4 border-t border-outline-variant bg-surface-container-low">
      <p className="font-body text-sm text-on-surface-variant">
        Build {label} instincts through deliberate practice.
      </p>
      <Link
        href={`/challenges?discipline=${disciplineId}`}
        className="shrink-0 font-label text-sm font-semibold px-5 py-2.5 rounded-full bg-primary text-on-primary transition-opacity duration-200 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-primary"
      >
        Practice this discipline
      </Link>
    </div>
  )
}

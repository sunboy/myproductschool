'use client'

import { Md } from '@/components/ui/Md'

interface PracticeGoalProps {
  goalMd: string
}

export function PracticeGoal({ goalMd }: PracticeGoalProps) {
  return (
    <section className="rounded-xl border border-outline-variant bg-surface-container-low p-5">
      <h2 className="font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
        The goal
      </h2>
      <div className="mt-2 font-body text-sm leading-relaxed text-on-surface">
        <Md variant="compact">{goalMd}</Md>
      </div>
    </section>
  )
}

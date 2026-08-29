'use client'

import { Md } from '@/components/ui/Md'

interface ChallengeBriefProps {
  hook: string
  briefMd: string
  estMinutes: number
}

export function ChallengeBrief({ hook, briefMd, estMinutes }: ChallengeBriefProps) {
  return (
    <section className="rounded-xl border border-outline-variant bg-surface-container-low p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
          The situation
        </h2>
        <span className="rounded-full bg-tertiary-container px-3 py-1 font-label text-xs font-semibold text-on-surface">
          About {estMinutes} min
        </span>
      </div>
      <p className="mt-2 font-body text-sm font-semibold italic text-on-surface">{hook}</p>
      <div className="mt-3 font-body text-sm leading-relaxed text-on-surface">
        <Md variant="compact">{briefMd}</Md>
      </div>
    </section>
  )
}

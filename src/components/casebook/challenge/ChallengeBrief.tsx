'use client'

import { Md } from '@/components/ui/Md'

interface ChallengeBriefProps {
  hook: string
  briefMd: string
  estMinutes: number
}

// brief_md is authored as a fixed two-section convention: "## Situation"
// (context, quieter) then "## Your job" (the actual task, the thing a
// learner needs to act on). Splitting them lets "Your job" get a distinct
// callout treatment instead of rendering at the same weight as everything
// else in the card — without that split, "Situation" appeared twice at
// equal visual weight (the italic hook line, then the heading) and the
// task itself never stood out.
function splitBrief(briefMd: string): { situation: string | null; job: string | null } {
  const jobIndex = briefMd.indexOf('## Your job')
  if (jobIndex === -1) return { situation: briefMd, job: null }
  return {
    situation: briefMd.slice(0, jobIndex).trim() || null,
    job: briefMd.slice(jobIndex).replace('## Your job', '').trim(),
  }
}

export function ChallengeBrief({ hook, briefMd, estMinutes }: ChallengeBriefProps) {
  const { situation, job } = splitBrief(briefMd)

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
      <p className="mt-2 font-headline text-lg font-semibold leading-snug text-on-surface">{hook}</p>
      {situation && (
        <div className="mt-3 font-body text-sm leading-relaxed text-on-surface-variant">
          <Md variant="compact">{situation}</Md>
        </div>
      )}
      {job && (
        <div className="mt-4 rounded-lg bg-primary-container p-4">
          <h3 className="font-label text-xs font-bold uppercase tracking-wide text-on-primary-container">
            Your job
          </h3>
          <div className="mt-1.5 font-body text-sm font-medium leading-relaxed text-on-primary-container">
            <Md variant="compact">{job}</Md>
          </div>
        </div>
      )}
    </section>
  )
}

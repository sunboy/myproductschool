import Link from 'next/link'
import { HatchImage } from '@/components/redesign/HatchImage'
import { difficultyLabel } from '@/lib/utils'

interface NextChallengeCardProps {
  title: string
  domain: string
  difficulty: string
  challengeId: string
  hatchInsight?: string | null
  activePlanSlug?: string | null
  catalogNumber?: string | null
}

export function NextChallengeCard({ title, domain, difficulty, challengeId, hatchInsight, activePlanSlug, catalogNumber }: NextChallengeCardProps) {
  const href = activePlanSlug
    ? `/workspace/challenges/${challengeId}?from_plan=${encodeURIComponent(activePlanSlug)}`
    : `/workspace/challenges/${challengeId}`
  return (
    <div className="flex h-full flex-col gap-3 rounded-2xl border border-outline-variant/40 bg-surface-container-low p-4 shadow-[0_16px_34px_-34px_rgba(30,27,20,0.45)]" data-hatch-target="dashboard-next-challenge">
      <div className="flex items-center gap-2">
        <HatchImage size={20} state="idle" />
        <span className="text-[10px] font-bold text-primary uppercase tracking-widest font-label">For you</span>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="line-clamp-2 font-headline text-[15px] font-semibold leading-snug text-on-surface">{title}</h3>
        <div className="flex items-center gap-1.5 flex-wrap">
          {catalogNumber && (
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant">
              {catalogNumber}
            </span>
          )}
          <span className="bg-tertiary-fixed/80 text-on-tertiary-fixed-variant rounded-full text-[11px] px-2.5 py-0.5 font-label font-semibold">
            {difficultyLabel(difficulty)}
          </span>
          <span className="bg-secondary-container text-on-secondary-container rounded-full text-[11px] px-2.5 py-0.5 font-label">
            {domain}
          </span>
        </div>
      </div>

      {hatchInsight && (
        <div className="flex items-start gap-2 rounded-xl bg-primary-fixed/60 p-2.5">
          <span className="material-symbols-outlined text-primary text-[14px] mt-0.5 shrink-0">auto_awesome</span>
          <p className="line-clamp-3 text-[11.5px] font-label font-semibold leading-5 text-on-surface">{hatchInsight}</p>
        </div>
      )}

      <Link
        href={href}
        data-hatch-target="dashboard-next-challenge-start"
        className="rounded-full bg-on-surface px-4 py-2 text-center font-label text-sm font-semibold text-inverse-on-surface transition-all duration-150 hover:bg-on-surface/85 active:scale-95"
      >
        Start challenge
      </Link>
    </div>
  )
}

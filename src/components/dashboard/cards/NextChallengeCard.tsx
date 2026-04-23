import Link from 'next/link'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import { difficultyLabel } from '@/lib/utils'

interface NextChallengeCardProps {
  title: string
  domain: string
  difficulty: string
  challengeId: string
  lumaInsight?: string | null
}

export function NextChallengeCard({ title, domain, difficulty, challengeId, lumaInsight }: NextChallengeCardProps) {
  return (
    <div className="bg-surface-container-low rounded-2xl p-5 flex flex-col gap-3 border border-outline-variant/30">
      <div className="flex items-center gap-2">
        <LumaGlyph size={22} state="idle" />
        <span className="text-[10px] font-bold text-primary uppercase tracking-widest font-label">For you</span>
      </div>

      <div className="flex-1 flex flex-col gap-2.5">
        <h3 className="font-headline font-semibold text-[15px] text-on-surface leading-snug">{title}</h3>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="bg-tertiary-fixed/80 text-on-tertiary-fixed-variant rounded-full text-[11px] px-2.5 py-0.5 font-label font-semibold">
            {difficultyLabel(difficulty)}
          </span>
          <span className="bg-secondary-container text-on-secondary-container rounded-full text-[11px] px-2.5 py-0.5 font-label">
            {domain}
          </span>
        </div>
      </div>

      {lumaInsight && (
        <div className="flex items-start gap-2 bg-primary-fixed/60 rounded-xl p-3">
          <span className="material-symbols-outlined text-primary text-[14px] mt-0.5 shrink-0">auto_awesome</span>
          <p className="text-[11px] text-on-surface font-label leading-relaxed">{lumaInsight}</p>
        </div>
      )}

      <Link
        href={`/workspace/challenges/${challengeId}`}
        className="bg-on-surface text-inverse-on-surface rounded-full px-5 py-2 text-sm font-label font-semibold text-center hover:bg-on-surface/85 active:scale-95 transition-all duration-150"
      >
        Start Challenge
      </Link>
    </div>
  )
}

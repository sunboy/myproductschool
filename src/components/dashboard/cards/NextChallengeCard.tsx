import Link from 'next/link'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

interface NextChallengeCardProps {
  title: string
  domain: string
  difficulty: string
  challengeId: string
  lumaInsight?: string | null
}

export function NextChallengeCard({ title, domain, difficulty, challengeId, lumaInsight }: NextChallengeCardProps) {
  return (
    <div className="bg-surface-container rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <LumaGlyph size={28} state="idle" />
        <span className="text-xs font-bold text-primary uppercase tracking-wider font-label">Next Challenge</span>
      </div>

      <div className="flex-1 flex flex-col gap-2">
        <h3 className="font-headline font-semibold text-base text-on-surface leading-snug">{title}</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="bg-tertiary-container text-on-tertiary-container rounded-full text-xs px-2.5 py-0.5 font-label">
            {difficulty}
          </span>
          <span className="bg-secondary-container text-on-secondary-container rounded-full text-xs px-2.5 py-0.5 font-label">
            {domain}
          </span>
        </div>
      </div>

      {lumaInsight && (
        <div className="flex items-start gap-2 bg-primary-fixed rounded-lg p-2.5">
          <span className="material-symbols-outlined text-primary text-sm mt-0.5">auto_awesome</span>
          <p className="text-xs text-on-surface font-label leading-relaxed">{lumaInsight}</p>
        </div>
      )}

      <Link
        href={`/workspace/challenges/${challengeId}`}
        className="bg-primary text-on-primary rounded-full px-5 py-2 text-sm font-label font-semibold text-center hover:opacity-90 transition-opacity"
      >
        Start Challenge
      </Link>
    </div>
  )
}

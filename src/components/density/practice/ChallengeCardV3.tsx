import Link from 'next/link'
import { GeoArt } from '@/components/density/GeoArt'
import { appendReturnTo } from '@/lib/navigation/return-to'
import { challengePath } from '@/lib/challenges/challengeNumber'
import { DIFFICULTY_LABELS, coerceDifficulty } from '@/lib/practice/difficulty'
import type { ChallengeWithDomain } from '@/lib/types'

const TYPE_LABEL: Record<string, string> = { algorithm: 'Coding', sql: 'SQL', system_design: 'Design', data_modeling: 'Modeling', flow: 'Product', freeform: 'Product', analytics: 'Analytics' }
const DIFF_CLS: Record<string, string> = { easy: 'bg-amber-soft text-tertiary', medium: 'bg-surface-container-highest text-on-surface-variant', hard: 'bg-[#f5d5d3] text-error' }

export function ChallengeCardV3({ challenge, summary, returnHref, locked, hatchPick }: { challenge: ChallengeWithDomain; summary?: string; returnHref?: string; locked?: boolean; hatchPick?: boolean }) {
  const destination = challengePath(challenge)
  const href = appendReturnTo(challenge.is_in_progress ? `${destination}${destination.includes('?') ? '&' : '?'}resume=1` : destination, returnHref)
  const diff = coerceDifficulty(challenge.difficulty)
  const cta = locked ? 'View' : challenge.is_completed ? 'Review' : challenge.is_in_progress ? 'Resume' : 'Start'
  const type = challenge.challenge_type ?? ''
  return (
    <div data-testid="challenge-card" className={`flex flex-col rounded-2xl border bg-card-bright p-3 ${hatchPick ? 'border-primary-fixed' : 'border-hairline'}`}>
      <GeoArt seed={challenge.slug ?? challenge.id} height={44} className="mb-2 rounded-lg" />
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1.5"><span className="rounded-full bg-primary-fixed px-2 py-0.5 text-[10px] font-bold text-forest-800">{TYPE_LABEL[type] ?? type}</span>{diff && <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${DIFF_CLS[diff] ?? DIFF_CLS.medium}`}>{DIFFICULTY_LABELS[diff] ?? diff}</span>}</div>
        {hatchPick && <span className="text-[11px] font-bold text-primary">Hatch&apos;s pick</span>}
      </div>
      <Link href={href} className="mt-2 line-clamp-2 font-headline text-[15px] font-bold leading-tight hover:underline">{challenge.title}</Link>
      {summary && <p className="mt-1 line-clamp-2 text-[12px] text-ink-secondary">{summary}</p>}
      <div className="mt-auto flex items-center justify-between pt-2.5">
        <span className="rounded-full border border-hairline px-2 py-0.5 text-[10px]">{challenge.technique_tags?.[0] ?? challenge.topic_tags?.[0] ?? TYPE_LABEL[type] ?? ''}</span>
        <Link href={href} data-testid="challenge-cta" className={`rounded-full px-3 py-1.5 text-[12px] font-bold ${cta === 'Start' ? 'bg-forest-800 text-white' : 'border border-hairline bg-card-bright text-ink-strong'}`}>{cta}</Link>
      </div>
    </div>
  )
}

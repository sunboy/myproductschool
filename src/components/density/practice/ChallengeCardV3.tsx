import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { GeoArt } from '@/components/density/GeoArt'
import { Badge, Button, Card, Chip, Row, Text } from '@/design'
import { appendReturnTo } from '@/lib/navigation/return-to'
import { challengePath } from '@/lib/challenges/challengeNumber'
import { DIFFICULTY_LABELS, coerceDifficulty } from '@/lib/practice/difficulty'
import type { ChallengeWithDomain } from '@/lib/types'

const TYPE_LABEL: Record<string, string> = { algorithm: 'Coding', sql: 'SQL', system_design: 'Design', data_modeling: 'Modeling', flow: 'Product', freeform: 'Product', analytics: 'Analytics' }

function useCardModel(challenge: ChallengeWithDomain, returnHref?: string, locked?: boolean) {
  const destination = challengePath(challenge)
  const href = appendReturnTo(challenge.is_in_progress ? `${destination}${destination.includes('?') ? '&' : '?'}resume=1` : destination, returnHref)
  const diff = coerceDifficulty(challenge.difficulty)
  const cta = locked ? 'View' : challenge.is_completed ? 'Review' : challenge.is_in_progress ? 'Resume' : 'Start'
  const type = challenge.challenge_type ?? ''
  const minutes = challenge.estimated_minutes ?? null
  return { href, diff, cta, type, minutes }
}

/** Practice card (cards mode): art, type + difficulty, title, optional
 *  summary, technique tag, one CTA. */
export function ChallengeCardV3({ challenge, summary, returnHref, locked, hatchPick }: { challenge: ChallengeWithDomain; summary?: string; returnHref?: string; locked?: boolean; hatchPick?: boolean }) {
  const { href, diff, cta, type } = useCardModel(challenge, returnHref, locked)
  return (
    <Card tone="bright" padding="sm" data-testid="challenge-card" className={hatchPick ? 'border-primary-fixed' : undefined}>
      <GeoArt seed={challenge.slug ?? challenge.id} height="auto" style={{ aspectRatio: '16/3' }} className="mb-2 rounded-tile" />
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1.5"><Badge tone="type" value={type}>{TYPE_LABEL[type] ?? type}</Badge>{diff && <Badge tone="difficulty" value={diff}>{DIFFICULTY_LABELS[diff] ?? diff}</Badge>}</div>
        {hatchPick && <Text variant="caption" tone="primary">Hatch&apos;s pick</Text>}
      </div>
      <Link href={href} className="mt-2 line-clamp-2 font-headline text-body font-bold leading-tight text-ink-strong hover:underline">{challenge.title}</Link>
      {summary && <Text variant="meta" className="mt-1 line-clamp-2">{summary}</Text>}
      <div className="mt-auto flex items-center justify-between pt-2.5">
        <Chip variant="tag">{challenge.technique_tags?.[0] ?? challenge.topic_tags?.[0] ?? TYPE_LABEL[type] ?? ''}</Chip>
        <Button asChild size="sm" variant={cta === 'Start' ? 'primary' : 'outline'}><Link href={href} data-testid="challenge-cta">{cta}</Link></Button>
      </div>
    </Card>
  )
}

/** Practice row (list mode): badge, title, `difficulty · minutes`, one
 *  action. No excerpt and no "In progress" tag; Resume carries that. */
export function ChallengeRowV3({ challenge, returnHref, locked, hatchPick }: { challenge: ChallengeWithDomain; returnHref?: string; locked?: boolean; hatchPick?: boolean }) {
  const { href, diff, cta, type, minutes } = useCardModel(challenge, returnHref, locked)
  const metaParts = [diff ? DIFFICULTY_LABELS[diff] ?? diff : null, minutes ? `${minutes} min` : null, hatchPick ? "Hatch's pick" : null].filter(Boolean)
  return (
    <Row
      data-testid="challenge-row"
      data-challenge-id={challenge.id}
      leading={<Badge tone="type" value={type}>{TYPE_LABEL[type] ?? type}</Badge>}
      title={<Link href={href} className="hover:underline">{challenge.title}</Link>}
      meta={<span className="inline-flex items-center gap-1.5">{challenge.is_completed && <CheckCircle2 size={14} aria-label="Completed" className="text-primary" />}{metaParts.join(' · ')}</span>}
      action={<Button asChild size="sm" variant={cta === 'Start' ? 'primary' : cta === 'Review' ? 'ghost' : 'outline'}><Link href={href} data-testid="challenge-cta">{cta}</Link></Button>}
    />
  )
}

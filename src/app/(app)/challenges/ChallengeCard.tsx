'use client'

import Link from 'next/link'
import { ArrowUpRight, MessageSquare, Layers3, Code2, Database, Lightbulb, ChartColumn, Check } from 'lucide-react'
import { motion, motionTokens } from '@/components/motion'
import { appendReturnTo } from '@/lib/navigation/return-to'
import { cleanDisplayCopy } from '@/lib/copy/display'
import { challengeTaskSummary } from '@/lib/challenges/presentation'
import { challengePath, formatChallengeNumber } from '@/lib/challenges/challengeNumber'
import { deriveChallengeStatus } from '@/lib/challenges/status'
import { coerceDifficulty, DIFFICULTY_LABELS } from '@/lib/practice/difficulty'
import { getTopicLabelAny, getTechniqueLabelAny } from '@/lib/data/taxonomy'
import { askedAtLabel } from '@/lib/format/company'
import type { ChallengeWithDomain } from '@/lib/types'

const disciplines: Record<string, { label: string; icon: typeof Layers3; tone: string }> = {
  system_design: { label: 'System design', icon: Layers3, tone: 'sage' },
  data_modeling: { label: 'Data modeling', icon: Database, tone: 'sage' },
  algorithm: { label: 'Coding', icon: Code2, tone: 'cream' },
  claude_code_debugging: { label: 'Coding', icon: Code2, tone: 'cream' },
  sql: { label: 'SQL', icon: Database, tone: 'amber' },
  claude_code_analytics: { label: 'AI analytics', icon: ChartColumn, tone: 'forest' },
  flow: { label: 'Product sense', icon: Lightbulb, tone: 'amber' },
  freeform: { label: 'Product sense', icon: Lightbulb, tone: 'amber' },
  quick_take: { label: 'Quick question', icon: Lightbulb, tone: 'amber' },
}

export function ChallengeCard({ challenge, paradigm, listView = false, locked = false, returnHref, layoutId, summary }: {
  challenge: ChallengeWithDomain
  paradigm: string
  listView?: boolean
  locked?: boolean
  returnHref?: string
  layoutId?: string
  summary?: string
}) {
  const discipline = disciplines[challenge.challenge_type ?? ''] ?? { label: 'Challenge', icon: Layers3, tone: 'sage' }
  const Icon = discipline.icon
  const bucket = coerceDifficulty(challenge.difficulty)
  const difficulty = bucket ? DIFFICULTY_LABELS[bucket] : challenge.difficulty
  const title = cleanDisplayCopy(challenge.title) || challenge.title
  const description = summary ?? challengeTaskSummary(challenge)
  const destination = challengePath(challenge)
  const href = appendReturnTo(challenge.is_in_progress ? `${destination}${destination.includes('?') ? '&' : '?'}resume=1` : destination, returnHref)
  const discussion = appendReturnTo(`/challenges/${challenge.slug ?? challenge.id}/discussion`, returnHref)
  const status = deriveChallengeStatus(challenge)
  const number = formatChallengeNumber(challenge.challenge_type, challenge.display_number)
  const topic = challenge.topic_tags?.[0] ? getTopicLabelAny(challenge.topic_tags[0]) : null
  const technique = challenge.technique_tags?.[0] ? getTechniqueLabelAny(challenge.technique_tags[0]) : null
  const company = challenge.is_real_interview && challenge.company_tags?.[0] ? askedAtLabel(challenge.company_tags[0]) : null
  return <motion.article layout layoutId={layoutId} layoutDependency={listView} initial={false}
    transition={motionTokens.spring.layout} className={`learning-challenge-card${listView ? ' is-list' : ''}`}>
    {!listView && <div className={`learning-challenge-art tone-${discipline.tone}`} aria-hidden="true"><Icon size={29}/><i/><span>{number}</span></div>}
    <div className="learning-challenge-copy">
      <div className="learning-challenge-meta"><span>{discipline.label}</span><span>{difficulty}</span></div>
      <h3><Link href={href} data-hatch-sound="open">{title}</Link></h3>
      {description && <p className="learning-challenge-description">{description}</p>}
      <div className="learning-challenge-tags">{[topic, technique, company, paradigm.toLowerCase() !== 'traditional' ? paradigm : null].filter(Boolean).map((tag,i) => <span key={`${tag}-${i}`}>{tag}</span>)}</div>
      <div className="learning-challenge-footer">
        <span>{status === 'completed' ? <><Check size={14}/>Completed</> : challenge.is_in_progress ? 'In progress' : challenge.attempt_count ? `${challenge.attempt_count} attempts` : 'Not started'}</span>
        <Link href={discussion} aria-label={`Discuss ${title}`}><MessageSquare size={17}/></Link>
      </div>
      <Link href={href} className="learning-challenge-open" data-hatch-sound="open">
        {locked ? 'View challenge' : challenge.is_in_progress ? 'Continue working' : 'Explore challenge'}<ArrowUpRight size={18}/>
      </Link>
      {locked && <small>Session limit reached. You can still read the brief.</small>}
    </div>
  </motion.article>
}

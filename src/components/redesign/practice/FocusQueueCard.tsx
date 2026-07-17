'use client'

import Link from 'next/link'
import type { ChallengeWithDomain } from '@/lib/types'
import { challengePath } from '@/lib/challenges/challengeNumber'
import { useNextChallenge } from './useNextChallenge'

export interface FocusQueueCardProps {
  inProgress: ChallengeWithDomain[]
  disciplineLabel: string
}

interface FocusQueueItem {
  title: string
  detail: string
  href?: string
}

/**
 * Ordered up-next list: finish what's paused, then patch the weakest move
 * per the Hatch recommendation, then a standing "add depth" nudge. Renders
 * null when fewer than 2 real (non-static) items resolve, so the rail never
 * shows a queue of one static line.
 */
export function FocusQueueCard({ inProgress }: FocusQueueCardProps) {
  const { data } = useNextChallenge()

  const items: FocusQueueItem[] = []

  if (inProgress.length > 0) {
    const first = inProgress[0]
    items.push({
      title: `Finish ${inProgress.length} paused rep${inProgress.length === 1 ? '' : 's'}`,
      detail: first.title,
      href: challengePath(first),
    })
  }

  if (data?.targets_move || data?.reason) {
    items.push({
      title: 'Patch your weakest move',
      detail: data.challenge.title,
      href: `/workspace/challenges/${data.challenge.slug ?? data.challenge.id}`,
    })
  }

  items.push({
    title: 'Then add medium reps',
    detail: 'Build depth once the basics hold',
    href: '/challenges?difficulty=medium',
  })

  if (items.length < 2) return null

  return (
    <div className="rounded-2xl border border-hairline bg-card-bright p-4 shadow-[0_1px_2px_rgba(30,27,20,.04),0_12px_32px_-24px_rgba(30,27,20,.18)]">
      <div className="mb-3 font-body text-[15.5px] font-bold text-ink-strong">Focus queue</div>
      <div className="flex flex-col gap-1">
        {items.map((item, i) => {
          const content = (
            <>
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full border-[1.5px] border-forest-600 text-[11px] font-bold text-forest-700">
                {i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-bold text-ink-strong">{item.title}</div>
                <div className="mt-0.5 truncate text-[12px] text-ink-secondary">{item.detail}</div>
              </div>
            </>
          )
          if (item.href) {
            return (
              <Link
                key={item.title}
                href={item.href}
                className="flex items-center gap-3 rounded-lg p-1.5 hover:bg-page-field"
              >
                {content}
              </Link>
            )
          }
          return (
            <div key={item.title} className="flex items-center gap-3 rounded-lg p-1.5">
              {content}
            </div>
          )
        })}
      </div>
    </div>
  )
}

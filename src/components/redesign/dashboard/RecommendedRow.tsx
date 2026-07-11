import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { difficultyLabel } from '@/lib/utils'
import { disciplineLabelFor } from '@/components/redesign/dashboard/discipline'

export interface RecommendedCardData {
  key: string
  href: string
  title: string
  challengeType: string | null
  domainName?: string | null
  difficulty?: string | null
  metaExtra?: string | null
  reason: string
}

export interface RecommendedRowProps {
  title?: string
  viewAllHref?: string
  cards: RecommendedCardData[]
  /** Shows the connecting arrow badge between the strip and the panel below (returning-state only, per dashboard.html .rec-arrow). */
  withArrow?: boolean
}

const EYEBROW_CLASS: Record<string, string> = {
  'System Design': 'text-sd-fg',
  'Product Sense': 'text-ps-fg',
  'Data Modeling': 'text-dm-fg',
  SQL: 'text-sql-fg',
  'AI / ML': 'text-aiml-fg',
}

/**
 * "Picked for you" recommendation strip. Per spec §4 "no invented metrics" —
 * every card's reason line is a real, specific sentence (hatch_insight, "Next
 * up in today's path", "Picked because {move} is your weakest move"), never a
 * match percentage.
 */
export function RecommendedRow({ title = 'Picked for you', viewAllHref, cards, withArrow }: RecommendedRowProps) {
  if (cards.length === 0) return null

  return (
    <div>
      <div className="mb-0.5 flex items-center justify-between">
        <h2 className="font-body text-lg font-bold text-ink-strong">{title}</h2>
        {viewAllHref && (
          <Link href={viewAllHref} className="inline-flex items-center gap-1 text-[12.5px] font-bold text-forest-700 no-underline">
            View all
            <ChevronRight size={13} strokeWidth={2} />
          </Link>
        )}
      </div>

      <div className="relative mt-3">
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${Math.min(cards.length, 4)}, minmax(0, 1fr))` }}
        >
          {cards.map(card => {
            const label = disciplineLabelFor(card.challengeType, card.domainName)
            const meta = [difficultyLabel2(card.difficulty), card.metaExtra].filter(Boolean).join(' · ')
            return (
              <Link
                key={card.key}
                href={card.href}
                className="flex flex-col gap-2.5 rounded-xl border border-hairline bg-card-bright p-4 no-underline shadow-[0_1px_2px_rgba(30,27,20,.04),0_12px_32px_-24px_rgba(30,27,20,.18)]"
              >
                <div className={`font-label text-[10.5px] font-extrabold uppercase tracking-[0.07em] ${EYEBROW_CLASS[label] ?? 'text-ink-secondary'}`}>
                  {label}
                </div>
                <div className="min-h-[39px] text-[14.5px] font-bold leading-[1.35] text-ink-strong">{card.title}</div>
                {meta && <div className="text-[11.5px] font-semibold tabular-nums text-ink-muted">{meta}</div>}
                <div className="mt-auto border-t border-hairline pt-2.5 text-[11.5px] font-semibold leading-[1.4] text-ink-secondary">
                  {card.reason}
                </div>
              </Link>
            )
          })}
        </div>

        {withArrow && (
          <div className="absolute right-[-14px] top-1/2 flex size-[30px] -translate-y-1/2 items-center justify-center rounded-full border border-hairline bg-white text-ink-secondary shadow-[0_4px_12px_rgba(30,27,20,.08)]">
            <ChevronRight size={14} strokeWidth={2.2} />
          </div>
        )}
      </div>
    </div>
  )
}

function difficultyLabel2(d: string | null | undefined): string | null {
  if (!d) return null
  return difficultyLabel(d)
}

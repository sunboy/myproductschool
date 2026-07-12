'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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
}

const EYEBROW_CLASS: Record<string, string> = {
  'System Design': 'text-sd-fg',
  'Product Sense': 'text-ps-fg',
  'Data Modeling': 'text-dm-fg',
  SQL: 'text-sql-fg',
  'Coding / DSA': 'text-sql-fg',
  'AI / ML': 'text-aiml-fg',
}

/**
 * "Picked for you" recommendation strip. Per spec §4 "no invented metrics" —
 * every card's reason line is a real, specific sentence (hatch_insight, "Next
 * up in today's path", "Picked because {move} is your weakest move"), never a
 * match percentage. Cards live in a horizontal snap-scroll row: chevrons and
 * the right-edge fade only appear when the row actually overflows.
 */
export function RecommendedRow({ title = 'Picked for you', viewAllHref, cards }: RecommendedRowProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [scrollable, setScrollable] = useState(false)
  const [atEnd, setAtEnd] = useState(false)

  const measure = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    setScrollable(el.scrollWidth > el.clientWidth + 1)
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1)
  }, [])

  useEffect(() => {
    measure()
    const el = scrollerRef.current
    if (!el) return
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [measure, cards.length])

  const scrollByAmount = (amount: number) => {
    scrollerRef.current?.scrollBy({ left: amount, behavior: 'smooth' })
  }

  if (cards.length === 0) return null

  return (
    <div>
      <div className="mb-0.5 flex items-center justify-between">
        <h2 className="font-body text-lg font-bold text-ink-strong">{title}</h2>
        <div className="flex items-center gap-2.5">
          {scrollable && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Scroll recommendations left"
                onClick={() => scrollByAmount(-480)}
                className="flex size-[26px] items-center justify-center rounded-full border border-hairline bg-card-bright text-ink-secondary shadow-[0_1px_2px_rgba(30,27,20,.04)] transition-[background-color,color,transform] duration-150 hover:bg-page-field hover:text-ink-strong active:scale-[0.92]"
              >
                <ChevronLeft size={14} strokeWidth={2.2} />
              </button>
              <button
                type="button"
                aria-label="Scroll recommendations right"
                onClick={() => scrollByAmount(480)}
                className="flex size-[26px] items-center justify-center rounded-full border border-hairline bg-card-bright text-ink-secondary shadow-[0_1px_2px_rgba(30,27,20,.04)] transition-[background-color,color,transform] duration-150 hover:bg-page-field hover:text-ink-strong active:scale-[0.92]"
              >
                <ChevronRight size={14} strokeWidth={2.2} />
              </button>
            </div>
          )}
          {viewAllHref && (
            <Link href={viewAllHref} className="inline-flex items-center gap-1 text-[12.5px] font-bold text-forest-700 no-underline">
              View all
              <ChevronRight size={13} strokeWidth={2} />
            </Link>
          )}
        </div>
      </div>

      <div className="relative mt-3">
        <div
          ref={scrollerRef}
          onScroll={measure}
          className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto"
        >
          {cards.map(card => {
            const label = disciplineLabelFor(card.challengeType, card.domainName)
            const meta = [difficultyLabel2(card.difficulty), card.metaExtra].filter(Boolean).join(' · ')
            return (
              <Link
                key={card.key}
                href={card.href}
                className="flex w-[240px] shrink-0 grow-0 snap-start flex-col gap-2.5 rounded-xl border border-hairline bg-card-bright p-4 no-underline shadow-[0_1px_2px_rgba(30,27,20,.04),0_12px_32px_-24px_rgba(30,27,20,.18)] transition-transform duration-150 hover:-translate-y-px"
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

        {/* Edge fade stays mounted and transitions opacity, so reaching the
            end eases the fade out instead of snapping it away. */}
        {scrollable && (
          <div
            aria-hidden
            className={`pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent transition-opacity duration-200 ${atEnd ? 'opacity-0' : 'opacity-100'}`}
          />
        )}
      </div>
    </div>
  )
}

function difficultyLabel2(d: string | null | undefined): string | null {
  if (!d) return null
  return difficultyLabel(d)
}

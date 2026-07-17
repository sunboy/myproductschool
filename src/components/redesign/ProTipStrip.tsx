import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ProTipStripProps {
  /** Bold lead phrase, ends with punctuation ("Finish, then start."). */
  lead: string
  /** One or two sentence craft tip in the writing-style-guide register. */
  tip: string
  /** Optional action. Both label and href required — no stub buttons. */
  ctaLabel?: string
  ctaHref?: string
  className?: string
}

/**
 * Full-width footer coaching strip, per the round-4 previews' `.protip-strip`
 * (amber sticky-note band + bold lead + sentence + right-aligned forest CTA).
 * It carries a craft tip tied to the surface it sits on, never an upsell, so
 * it renders identically for free and pro users.
 */
export function ProTipStrip({ lead, tip, ctaLabel, ctaHref, className }: ProTipStripProps) {
  return (
    <div
      className={cn(
        'note-amber mt-6 flex flex-wrap items-center gap-3.5 rounded-xl px-5 py-3.5',
        className
      )}
    >
      <p className="m-0 min-w-0 flex-1 basis-64 text-[13px] leading-[1.5] text-ink-secondary">
        <b className="font-extrabold text-ink-strong">{lead}</b> {tip}
      </p>
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-forest-950 px-[18px] py-2.5 text-[12.5px] font-extrabold text-white no-underline"
        >
          {ctaLabel}
          <ArrowRight size={14} strokeWidth={2} />
        </Link>
      )}
    </div>
  )
}

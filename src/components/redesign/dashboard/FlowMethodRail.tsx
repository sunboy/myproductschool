import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

const FLOW_DEFS = [
  { key: 'frame', title: 'Frame', desc: 'Find the problem behind the problem', dotClass: 'bg-sd-fg' },
  { key: 'list', title: 'List', desc: 'Map stakeholders and distinct options', dotClass: 'bg-ps-fg' },
  { key: 'optimize', title: 'Optimize', desc: 'Name the criterion, accept the tradeoff', dotClass: 'bg-dm-fg' },
  { key: 'win', title: 'Win', desc: 'Define the metric that proves it worked', dotClass: 'bg-sql-fg' },
] as const

export interface FlowMethodRailProps {
  /** Real move levels from the loader — used only to bold the weakest move to ground the rail in real state. */
  weakestMove?: string | null
  learnMoreHref?: string
}

/**
 * Right-rail FLOW Method card: colored dot + title + one-line description per
 * step, tile-free per spec §4. No icon boxes — the dot carries the taxonomy
 * color, matching previews/round4/dashboard.html .flow-card exactly.
 */
export function FlowMethodRail({ weakestMove, learnMoreHref = '/explore/plans' }: FlowMethodRailProps) {
  return (
    <div className="rounded-2xl border border-hairline bg-card-bright p-4 pb-3.5 shadow-[0_1px_2px_rgba(30,27,20,.04),0_12px_32px_-24px_rgba(30,27,20,.18)]">
      <div className="mb-3 font-body text-base font-bold text-ink-strong">FLOW Method</div>

      {FLOW_DEFS.map((step, i) => (
        <div
          key={step.key}
          className={`flex items-start gap-3 py-2.5 ${i < FLOW_DEFS.length - 1 ? 'border-b border-hairline' : 'pb-1'}`}
        >
          <span className={`mt-1.5 size-2 shrink-0 rounded-full ${step.dotClass}`} />
          <div className="flex-1">
            <div className={`mb-0.5 text-[13.5px] font-bold ${weakestMove === step.key ? 'text-forest-800' : 'text-ink-strong'}`}>
              {step.title}
              {weakestMove === step.key && <span className="ml-1.5 text-[10px] font-bold uppercase tracking-[0.06em] text-forest-600">Weakest</span>}
            </div>
            <div className="text-[11.5px] leading-[1.4] text-ink-muted">{step.desc}</div>
          </div>
        </div>
      ))}

      <Link href={learnMoreHref} className="mt-3.5 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-forest-700 no-underline">
        Learn more about FLOW
        <ChevronRight size={13} strokeWidth={2} />
      </Link>
    </div>
  )
}

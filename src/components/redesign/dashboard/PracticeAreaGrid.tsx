import Link from 'next/link'
import { ArrowRight, Braces, Database, Lightbulb, LineChart, Network, Workflow } from 'lucide-react'

const AREAS = [
  { label: 'Coding / DSA', detail: 'Algorithms and implementation', href: '/challenges?discipline=algorithm', icon: Braces, tint: 'bg-sql-bg text-sql-fg' },
  { label: 'SQL & Data', detail: 'Query and interpret data', href: '/challenges?discipline=sql', icon: Database, tint: 'bg-dm-bg text-dm-fg' },
  { label: 'System Design', detail: 'Architecture and tradeoffs', href: '/challenges?discipline=system_design', icon: Network, tint: 'bg-sd-bg text-sd-fg' },
  { label: 'Data Modeling', detail: 'Schemas and durable models', href: '/challenges?discipline=data_modeling', icon: Workflow, tint: 'bg-dm-bg text-dm-fg' },
  { label: 'AI Analytics', detail: 'Explore and explain datasets', href: '/challenges?discipline=analytics', icon: LineChart, tint: 'bg-aiml-bg text-aiml-fg' },
  { label: 'Product Sense', detail: 'Make sound product calls', href: '/challenges?discipline=product_sense', icon: Lightbulb, tint: 'bg-ps-bg text-ps-fg' },
]

export function PracticeAreaGrid() {
  return (
    <section aria-labelledby="practice-areas-title">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <p className="font-label text-xs font-extrabold uppercase tracking-[.11em] text-forest-700">Explore</p>
          <h2 id="practice-areas-title" className="mt-1 font-headline text-[24px] font-semibold tracking-[-.02em] text-ink-strong">Practice areas</h2>
        </div>
        <Link href="/challenges" className="hidden items-center gap-1.5 text-sm font-bold text-forest-700 sm:inline-flex">View all <ArrowRight size={15} /></Link>
      </div>

      <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-hairline bg-card-bright shadow-[0_14px_42px_-34px_rgba(30,27,20,.35)] sm:grid-cols-3 xl:grid-cols-6">
        {AREAS.map(({ label, detail, href, icon: Icon, tint }) => (
          <Link key={label} href={href} className="group min-w-0 border-b border-r border-hairline p-4 no-underline transition-colors hover:bg-page-field xl:border-b-0 xl:last:border-r-0">
            <span className={`flex size-10 items-center justify-center rounded-full ${tint}`}><Icon size={19} strokeWidth={1.8} /></span>
            <h3 className="mt-3 text-sm font-extrabold leading-tight text-ink-strong">{label}</h3>
            <p className="mt-1 text-xs leading-snug text-ink-muted">{detail}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}

import Link from 'next/link'
import { CoverCard } from '@/components/density/CoverCard'
import { Text } from '@/design'
import { PRACTICE_AREAS, areaPct, type AreaStat } from '@/lib/data/dashboard-density'

export function PracticeAreaShelf({ stats }: { stats: AreaStat[] }) {
  const by = new Map(stats.map(s => [s.discipline, s]))
  return (
    <section data-testid="practice-areas" data-hatch-target="dashboard-practice-areas" className="mb-3">
      <div className="mb-2 flex items-baseline justify-between"><Text variant="h4" as="h2" className="text-lede">Practice areas</Text><Link href="/challenges" className="text-meta font-bold text-primary">View all →</Link></div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {PRACTICE_AREAS.map(a => { const s = by.get(a.discipline); const total = s?.total ?? 0; return (
          <CoverCard key={a.discipline} href={a.href} seed={a.seed} artIndex={a.artIndex} title={a.label} artRatio="16/5" pct={areaPct(s?.completed ?? 0, total)} meta={[{ value: total, label: a.discipline === 'analytics' ? 'labs' : 'problems' }]} testId={`area-${a.discipline}`} />
        )})}
      </div>
    </section>
  )
}

import Link from 'next/link'
import { CoverCard } from '@/components/density/CoverCard'
import { QuickTakePanel } from '@/components/redesign/dashboard/QuickTakePanel'
import { Card, Text } from '@/design'
import { cn } from '@/lib/utils'

export interface PathCard { slug: string; name: string; eyebrow: string; done: number; total: number; unit: 'chapters' | 'reps' }
export interface WeekDay { label: string; completed: boolean; today: boolean }

export function PathsRow({ paths, quickTake, week, streakDays, focusMove }: { paths: PathCard[]; quickTake: { prompt: string; challengeId: string; move?: string } | null; week: WeekDay[]; streakDays: number; focusMove: string | null }) {
  return (
    <section data-testid="paths-row" className="grid grid-flow-dense gap-card-gap lg:grid-cols-[1fr_1fr_1fr_300px]">
      {paths.slice(0, 2).map(p => <CoverCard key={p.slug} href={`/explore/plans/${p.slug}`} seed={`plan-${p.slug}`} eyebrow={p.eyebrow} title={p.name} artRatio="16/5" pct={p.total ? Math.round((p.done / p.total) * 100) : 0} meta={[{ value: p.total, label: p.unit }, { value: p.done, label: 'done' }]} testId={`path-${p.slug}`} />)}
      <div className={cn(paths.length < 2 && 'lg:col-span-2')}>{quickTake ? <QuickTakePanel compact prompt={quickTake.prompt} challengeId={quickTake.challengeId} move={quickTake.move} /> : <Link href="/explore/plans" data-testid="paths-browse" className="flex h-full min-h-24 items-center justify-center rounded-card border border-dashed border-hairline text-meta font-bold text-primary">Browse study paths →</Link>}</div>
      <Card asChild tone="bright" padding="sm" interactive>
        <Link href="/progress" data-testid="week-card">
          <Text variant="caption" className="text-tertiary">Your week</Text>
          <div className="my-1.5 flex gap-1.5">{week.map((d, i) => <i key={`${i}-${d.label}`} title={d.label} className={cn('block size-5 rounded-md', d.completed ? 'bg-gold' : 'border border-hairline', d.today && 'ring-2 ring-primary-fixed')} />)}</div>
          <div className="flex justify-between rounded-tile bg-primary-fixed px-2 py-1 text-meta font-ui text-forest-800"><b className="font-strong">{focusMove ? `Focus: ${focusMove}` : `Streak: ${streakDays} day${streakDays === 1 ? '' : 's'}`}</b><span>{streakDays} day streak</span></div>
        </Link>
      </Card>
    </section>
  )
}

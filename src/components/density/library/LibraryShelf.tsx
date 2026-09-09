import Link from 'next/link'
import { CoverCard } from '@/components/density/CoverCard'
import { readMins, type GuideItem, type PlanItem, type StoryItem } from '@/lib/data/library-density'
import { Badge, Text } from '@/design'

type Item = GuideItem | PlanItem | StoryItem
export function LibraryShelf({ title, moreHref, moreLabel, items, testId }: { title: string; moreHref: string; moreLabel: string; items: Item[]; testId: string }) {
  if (!items.length) return null
  return (
    <section data-testid={testId} className="mb-3">
      <div className="mb-2 flex items-baseline justify-between"><Text variant="h4" as="h2" className="text-lede">{title}</Text><Link href={moreHref} className="text-meta font-bold text-primary">{moreLabel}</Link></div>
      <div className="grid grid-cols-2 gap-card-gap lg:grid-cols-4">
        {items.map((it, i) => it.kind === 'guide'
          ? <CoverCard key={it.id} href={it.href} seed={it.slug} artIndex={i % 8} eyebrow={`Module · ${it.chapters} chapters`} title={it.title} pct={it.chapters ? Math.round((it.completed / it.chapters) * 100) : 0} meta={[{ value: it.chapters, label: 'chapters' }]} footer={<span className="text-caption">{it.completed > 0 ? `Chapter ${it.completed + 1} of ${it.chapters}` : `${it.minutes} min`}</span>} testId="lib-card" />
          : it.kind === 'plan'
          ? <CoverCard key={it.id} href={it.href} seed={it.slug} artIndex={(i + 1) % 8} eyebrow={`Study plan · ${it.reps} reps`} title={it.title} pct={it.reps ? Math.round((it.done / it.reps) * 100) : 0} meta={[{ value: it.reps, label: 'reps' }]} footer={<span className="text-caption">{it.move ? `Move: ${it.move.charAt(0).toUpperCase() + it.move.slice(1)}` : it.enrolled ? 'Enrolled' : ''}</span>} testId="lib-card" />
          : <CoverCard key={it.id} href={it.href} seed={`${it.companySlug}/${it.storySlug}`} artIndex={(i + 2) % 8} eyebrow={`Autopsy · ${it.company}`} title={it.title} pct={it.progress > 0 ? Math.round(it.progress * 100) : 0} meta={[{ value: readMins(it.readTime), label: 'min' }]} footer={it.saved ? <Badge tone="status">Saved</Badge> : undefined} testId="lib-card" />
        )}
      </div>
    </section>
  )
}

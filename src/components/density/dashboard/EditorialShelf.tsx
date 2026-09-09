import Link from 'next/link'
import { EditorialCard } from '@/components/density/EditorialCard'
import { GeoArt } from '@/components/density/GeoArt'
import { Card, Text } from '@/design'
import type { EditorialItem } from '@/lib/data/dashboard-density'

/** "Worth reading this week": featured card spanning two columns, then tiles.
 *  auto-fit grid so the shelf reflows instead of cropping. */
export function EditorialShelf({ featured, items }: { featured: EditorialItem | null; items: EditorialItem[] }) {
  if (!featured && items.length === 0) return null
  return (
    <section data-testid="editorial-shelf" className="mb-3">
      <div className="mb-2 flex items-baseline justify-between"><Text variant="h4" as="h2" className="text-lede">Worth reading this week</Text><Link href="/explore" className="text-meta font-bold text-primary">Library →</Link></div>
      <div className="grid gap-card-gap [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
        {featured && <EditorialCard href={featured.href} eyebrow={`Saved for you · ${featured.kind}`} title={featured.title} sub={featured.sub} meta={`${featured.eyebrow.split(' · ')[1] ?? ''} · ${featured.readMins} min`} className="md:col-span-2" testId="editorial-featured" />}
        {items.map(it => (
          <Card key={it.id} asChild tone="bright" padding="none" interactive>
            <Link href={it.href} data-testid="editorial-item">
              <GeoArt seed={it.id} height="auto" style={{ aspectRatio: '16/6' }} className="flex flex-col justify-end px-3 py-2.5 text-white"><div className="relative truncate text-caption font-bold uppercase tracking-[.08em] opacity-85">{it.eyebrow}</div><div className="relative mt-0.5 line-clamp-2 font-headline text-[clamp(13px,7cqw,15px)] font-bold leading-[1.15]">{it.title}</div></GeoArt>
              <div className="flex flex-1 flex-col px-3 py-2 text-meta font-ui text-ink-secondary"><div className="line-clamp-2 leading-[1.45]">{it.sub ?? ''}</div><div className="mt-auto flex justify-between pt-1.5 text-caption"><span>{it.readMins} min</span><span className="font-bold text-primary">Read →</span></div></div>
            </Link>
          </Card>
        ))}
      </div>
    </section>
  )
}

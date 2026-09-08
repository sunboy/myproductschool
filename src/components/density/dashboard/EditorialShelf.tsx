import Link from 'next/link'
import { EditorialCard } from '@/components/density/EditorialCard'
import { GeoArt } from '@/components/density/GeoArt'
import type { EditorialItem } from '@/lib/data/dashboard-density'

export function EditorialShelf({ featured, items }: { featured: EditorialItem | null; items: EditorialItem[] }) {
  if (!featured && items.length === 0) return null
  return (
    <section data-testid="editorial-shelf" className="mb-3">
      <div className="mb-2 flex items-baseline justify-between"><h2 className="font-headline text-[16px] font-bold">Worth reading this week</h2><Link href="/explore" className="text-[12px] font-bold text-primary">Library →</Link></div>
      <div className="grid gap-2.5 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        {featured && <EditorialCard href={featured.href} eyebrow={`Saved for you · ${featured.kind}`} title={featured.title} sub={featured.sub} meta={`${featured.eyebrow.split(' · ')[1] ?? ''} · ${featured.readMins} min`} height={150} testId="editorial-featured" />}
        {items.map(it => (
          <Link key={it.id} href={it.href} data-testid="editorial-item" className="flex flex-col overflow-hidden rounded-2xl border border-hairline bg-card-bright">
            <GeoArt seed={it.id} height={74} className="px-3 py-2.5 text-white"><div className="relative text-[9px] font-bold uppercase tracking-[.08em] opacity-85">{it.eyebrow}</div><div className="relative mt-0.5 line-clamp-2 font-headline text-[14px] font-bold leading-[1.15]">{it.title}</div></GeoArt>
            <div className="px-3 py-2 text-[11px] leading-[1.4] text-ink-secondary"><div className="line-clamp-2">{it.sub ?? ''}</div><div className="mt-1.5 flex justify-between text-[10px]"><span>{it.readMins} min</span><span className="font-bold text-primary">Read →</span></div></div>
          </Link>
        ))}
      </div>
    </section>
  )
}

import Link from 'next/link'
import { getDomains } from '@/lib/data/domains'

export default async function DomainsPage() {
  const domains = await getDomains()

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      <div className="flex items-center gap-2 mb-5 font-label text-xs text-on-surface-variant">
        <Link href="/explore" className="hover:text-primary transition-colors">Explore</Link>
        <span>/</span>
        <span className="text-on-surface font-bold">Domains</span>
      </div>
      <h1 className="font-headline text-2xl font-bold text-on-surface mb-1">Domains</h1>
      <p className="font-body text-sm text-on-surface-variant mb-6">Topic areas — each groups related challenges together</p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {domains.map(d => (
          <Link key={d.id} href={`/domains/${d.slug}`}
            className="flex items-center gap-3 bg-surface-container rounded-xl p-4 hover:bg-surface-container-high transition-colors">
            <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl text-primary" style={{ fontVariationSettings: "'FILL' 0" }}>{d.icon ?? 'category'}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-label text-sm font-bold text-on-surface">{d.title}</div>
              <div className="font-body text-xs text-on-surface-variant">{d.challenge_count} challenges</div>
              {d.completed_challenges > 0 && (
                <div className="mt-1.5 h-1 bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${d.progress_percentage}%` }} />
                </div>
              )}
            </div>
            <span className="material-symbols-outlined text-outline-variant text-base ml-auto shrink-0" style={{ fontVariationSettings: "'FILL' 0" }}>chevron_right</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

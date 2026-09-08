import Link from 'next/link'
export interface FirstRep { href: string; title: string; summary: string; typeLabel: string; difficulty: string; minutes: number; chip: string }
export function FirstRepsShelf({ reps }: { reps: FirstRep[] }) {
  return (
    <section data-testid="first-reps" className="mb-3">
      <div className="mb-2 flex items-baseline justify-between"><h2 className="font-headline text-[16px] font-bold">A good place to begin</h2><Link href="/challenges" className="text-[12px] font-bold text-primary">All practice →</Link></div>
      <div className="grid gap-2.5 md:grid-cols-3">
        {reps.map(r => (
          <div key={r.href} className="rounded-2xl border border-hairline bg-card-bright p-3">
            <div className="flex gap-1.5"><span className="rounded-full bg-primary-fixed px-2 py-0.5 text-[10px] font-bold text-forest-800">{r.typeLabel}</span><span className="rounded-full bg-amber-soft px-2 py-0.5 text-[10px] font-bold text-tertiary">{r.difficulty} · {r.minutes} min</span></div>
            <h3 className="mt-2 font-headline text-[15px] font-bold leading-tight">{r.title}</h3>
            <p className="mt-1 line-clamp-2 text-[12px] text-ink-secondary">{r.summary}</p>
            <div className="mt-2.5 flex items-center justify-between"><span className="rounded-full border border-hairline px-2 py-0.5 text-[10px]">{r.chip}</span><Link href={r.href} data-testid="first-rep-start" className="rounded-full bg-forest-800 px-3 py-1.5 text-[12px] font-bold text-white">Start</Link></div>
          </div>
        ))}
      </div>
    </section>
  )
}

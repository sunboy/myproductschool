import Link from 'next/link'

export function EditorialCard({ href, eyebrow, title, sub, meta, ctaLabel = 'Start reading →', height = 160, className = '', testId }: { href: string; eyebrow: string; title: string; sub?: string; meta?: string; ctaLabel?: string; height?: number; className?: string; testId?: string }) {
  return (
    <div data-testid={testId} className={`relative grid overflow-hidden rounded-2xl bg-forest-800 text-white ${className}`} style={{ height, gridTemplateColumns: 'minmax(0,1fr) 42%' }}>
      <div className="relative flex flex-col justify-center px-5 py-4">
        <div className="text-[10px] font-bold uppercase tracking-[.08em] text-gold">{eyebrow}</div>
        <h2 className="mt-1.5 line-clamp-2 font-headline text-[30px] font-bold leading-[1]">{title}</h2>
        {sub && <p className="mt-1.5 line-clamp-1 text-[13px] opacity-85">{sub}</p>}
        <div className="mt-2.5"><Link href={href} className="inline-block rounded-full bg-card-bright px-3.5 py-1.5 text-[12px] font-bold text-ink-strong">{ctaLabel}</Link></div>
      </div>
      <div className="relative overflow-hidden bg-forest-900" aria-hidden>
        <i className="absolute block" style={{ left: 40, top: 30, width: 150, height: 150, background: '#c4a66a', clipPath: 'polygon(50% 0,100% 50%,50% 100%,0 50%)' }} />
        <i className="absolute block rounded-full" style={{ right: 30, top: 20, width: 110, height: 110, border: '22px solid #2f5f3f' }} />
        {meta && <div className="absolute bottom-4 left-24 rounded-xl px-3.5 py-2 text-[11px]" style={{ background: 'rgba(255,255,255,.14)', backdropFilter: 'blur(6px)' }}>{meta}</div>}
      </div>
    </div>
  )
}

import Link from 'next/link'
export function ContinueReadingCard({ title, sub, href }: { title: string; sub: string; href: string }) {
  return (
    <div data-testid="continue-reading" className="relative flex h-full flex-col justify-center overflow-hidden rounded-[14px] bg-forest-900 px-4 py-3.5 text-white">
      <i className="absolute block" style={{ right: -20, top: 20, width: 120, height: 120, background: '#c4a66a', clipPath: 'polygon(50% 0,100% 50%,50% 100%,0 50%)', opacity: .9 }} aria-hidden />
      <i className="absolute block rounded-full" style={{ right: 60, bottom: -30, width: 90, height: 90, border: '16px solid #2f5f3f' }} aria-hidden />
      <div className="relative text-[10px] font-bold uppercase tracking-[.08em] text-gold">Continue · reading</div>
      <Link href={href} className="relative mt-1.5 line-clamp-2 max-w-[70%] font-headline text-[17px] font-bold leading-[1.15] hover:underline">{title}</Link>
      <div className="relative mt-1 text-[11px] opacity-85">{sub}</div>
      <div className="relative mt-2"><Link href={href} className="inline-block rounded-full bg-card-bright px-3 py-1.5 text-[11px] font-bold text-ink-strong">Keep reading</Link></div>
    </div>
  )
}

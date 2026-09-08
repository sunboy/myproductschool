import Link from 'next/link'
export function ContinueChallengeCard({ title, meta, href }: { title: string; meta: string; href: string }) {
  return (
    <div data-testid="continue-challenge" className="relative flex h-full flex-col justify-center overflow-hidden rounded-[14px] bg-forest-800 px-4 py-3.5 text-white">
      <i className="absolute block rounded-full" style={{ right: -30, top: -40, width: 140, height: 140, background: '#d9a441', opacity: .9 }} aria-hidden />
      <i className="absolute block rounded-[10px]" style={{ right: 20, top: 50, width: 100, height: 66, background: '#9db8a0', transform: 'rotate(-15deg)' }} aria-hidden />
      <div className="relative text-[10px] font-bold uppercase tracking-[.08em] text-gold">Continue · challenge</div>
      <Link href={href} className="relative mt-1.5 line-clamp-2 max-w-[78%] font-headline text-[17px] font-bold leading-[1.15] hover:underline">{title}</Link>
      <div className="relative mt-1 text-[11px] opacity-85">{meta}</div>
      <div className="relative mt-2"><Link href={href} data-hatch-target="dashboard-session" className="inline-block rounded-full bg-card-bright px-3 py-1.5 text-[11px] font-bold text-ink-strong">▷ Resume</Link></div>
    </div>
  )
}

export function ReaderHeader({ eyebrow, title, lede }: { eyebrow: string; title: string; lede?: string }) {
  return (
    <header className="mb-4">
      <div className="mb-2 text-[11px] font-bold uppercase tracking-[.08em] text-primary">{eyebrow}</div>
      <h1 className="font-headline text-[34px] font-bold leading-[1.15]">{title}</h1>
      {lede && <p className="mt-2.5 font-headline text-[18px] leading-[1.4] text-on-surface-variant">{lede}</p>}
    </header>
  )
}

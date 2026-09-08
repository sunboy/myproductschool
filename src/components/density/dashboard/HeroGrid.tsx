import type { ReactNode } from 'react'
export function HeroGrid({ greeting, cells }: { greeting: ReactNode; cells: ReactNode[] }) {
  const cols = cells.length === 3 ? '260px 1fr 1fr 300px' : '260px 1fr 300px'
  return (
    <section data-testid="dashboard-hero" className="relative mb-4 grid gap-3 overflow-hidden rounded-[18px] bg-surface-container p-4 lg:min-h-[240px]">
      <style>{`@media (min-width:1024px){[data-testid=dashboard-hero]{grid-template-columns:${cols}}}`}</style>
      <div className="pointer-events-none absolute inset-0 opacity-70" aria-hidden>
        <i className="absolute block rounded-[60px] bg-primary-fixed" style={{ left: 120, top: -80, width: 420, height: 420, transform: 'rotate(45deg)', opacity: .5 }} />
      </div>
      <div className="relative flex flex-col justify-center">{greeting}</div>
      {cells.map((c, i) => <div key={i} className="relative min-w-0">{c}</div>)}
    </section>
  )
}

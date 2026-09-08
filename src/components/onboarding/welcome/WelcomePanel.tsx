import { HatchImage, type HatchImageState } from '@/components/redesign/HatchImage'

export function WelcomePanel({ pose, headline, accent, body }: { pose: HatchImageState; headline: string; accent: string; body: string }) {
  return (
    <aside data-testid="welcome-panel" className="relative flex flex-col overflow-hidden px-8 py-8 lg:px-14 lg:py-12" style={{ background: 'linear-gradient(160deg, var(--color-primary-fixed) 0%, var(--color-surface-container-low) 55%, var(--color-amber-soft) 100%)' }}>
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <i className="absolute block rounded-[60px] bg-primary-fixed" style={{ right: -120, top: -120, width: 380, height: 380, transform: 'rotate(45deg)', opacity: .6 }} />
        <i className="absolute block rounded-full" style={{ left: -80, bottom: -140, width: 320, height: 320, border: '40px solid var(--color-amber-soft)', opacity: .6 }} />
        <i className="absolute block bg-forest-800" style={{ right: 60, bottom: 120, width: 120, height: 120, clipPath: 'polygon(50% 0,100% 100%,0 100%)', opacity: .08 }} />
      </div>
      <div className="relative font-headline text-[15px] font-bold tracking-[.04em] text-primary">HACKPRODUCT</div>
      <div className="relative flex flex-1 flex-col justify-center gap-4">
        <div className="flex items-center gap-3">
          <div className="grid size-14 place-items-center rounded-full bg-forest-800 shadow-lg"><HatchImage state={pose} size={40} /></div>
          <div>
            <div className="font-headline text-[18px] font-bold">Hatch <span className="ml-1 inline-block size-2 rounded-full bg-primary align-middle" /></div>
            <div className="text-[12px] text-ink-secondary">Your HackProduct coach</div>
          </div>
        </div>
        <h1 className="max-w-[480px] font-headline text-[32px] font-medium leading-[1.08] lg:text-[40px]">{headline} <b className="font-bold">{accent}</b></h1>
        <p className="max-w-[440px] text-[15px] leading-[1.5] text-on-surface-variant">{body}</p>
      </div>
      <div className="relative text-[11px] text-ink-secondary">About 5 minutes. Reset anytime from Settings.</div>
    </aside>
  )
}

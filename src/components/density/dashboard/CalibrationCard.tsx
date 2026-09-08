import Link from 'next/link'
const MOVES = ['Frame the problem', 'List the options', 'Optimize the trade-off', 'Win the room']
export function CalibrationCard({ startHref, skipHref }: { startHref: string; skipHref: string }) {
  return (
    <div data-testid="calibration-card" className="relative grid h-full overflow-hidden rounded-[14px] bg-forest-800 px-4 py-3.5 text-white lg:grid-cols-[1fr_200px] lg:gap-3">
      <i className="absolute block rounded-full" style={{ right: -30, top: -40, width: 160, height: 160, background: '#d9a441', opacity: .9 }} aria-hidden />
      <i className="absolute block rounded-[10px]" style={{ right: 30, top: 50, width: 110, height: 70, background: '#9db8a0', transform: 'rotate(-15deg)' }} aria-hidden />
      <div className="relative flex flex-col justify-center">
        <div className="text-[10px] font-bold uppercase tracking-[.08em] text-gold">Set your baseline · 5 min</div>
        <h2 className="mt-1.5 font-headline text-[19px] font-bold leading-[1.15]">Let Hatch figure out where you are.</h2>
        <p className="mt-1 text-[11px] opacity-85">Four scenarios, one per FLOW move. No wrong answers, just honest ones.</p>
        <div className="mt-2 flex items-center gap-2">
          <Link href={startHref} data-testid="calibration-start" data-hatch-target="dashboard-session" className="inline-block rounded-full bg-card-bright px-3 py-1.5 text-[11px] font-bold text-ink-strong">Start calibration →</Link>
          <Link href={skipHref} data-testid="calibration-skip" className="text-[10px] opacity-75 hover:underline">or skip and pick a challenge</Link>
        </div>
      </div>
      <div className="relative hidden flex-col justify-center gap-1 lg:flex">
        <div className="text-[9px] font-bold tracking-[.08em] text-gold">FLOW · 4 MOVES</div>
        {MOVES.map(m => <div key={m} className="flex items-center gap-1.5 text-[10px]"><i className="block size-3.5 rounded-full border-[1.5px] border-primary-fixed-dim" aria-hidden />{m}</div>)}
      </div>
    </div>
  )
}

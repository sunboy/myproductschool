import Link from 'next/link'
import { Button, Card, Text } from '@/design'
const MOVES = ['Frame the problem', 'List the options', 'Optimize the trade-off', 'Win the room']
export function CalibrationCard({ startHref, skipHref }: { startHref: string; skipHref: string }) {
  return (
    <Card tone="forest" padding="none" data-testid="calibration-card" className="h-full">
      <i className="absolute block rounded-full" style={{ right: -30, top: -40, width: 160, height: 160, background: '#d9a441', opacity: .9 }} aria-hidden />
      <i className="absolute block rounded-[10px]" style={{ right: 30, top: 50, width: 110, height: 70, background: '#9db8a0', transform: 'rotate(-15deg)' }} aria-hidden />
      <div className="relative grid h-full gap-3 px-4 py-3.5 lg:grid-cols-[1fr_200px]">
        <div className="flex flex-col justify-center">
          <Text variant="caption" tone="gold">Set your baseline · 5 min</Text>
          <Text variant="h3" as="h2" tone="inverse" className="mt-1.5 text-[clamp(17px,4cqw,22px)]">Let Hatch figure out where you are.</Text>
          <p className="mt-1 text-meta font-ui text-white/85">Four scenarios, one per FLOW move. No wrong answers, just honest ones.</p>
          <div className="mt-2.5 flex items-center gap-3">
            <Button asChild size="sm" variant="outline" className="border-transparent"><Link href={startHref} data-testid="calibration-start" data-hatch-target="dashboard-session">Start calibration →</Link></Button>
            <Link href={skipHref} data-testid="calibration-skip" className="text-caption font-ui text-white/75 hover:underline">or skip and pick a challenge</Link>
          </div>
        </div>
        <div className="hidden flex-col justify-center gap-1 lg:flex">
          <Text variant="caption" tone="gold">FLOW · 4 moves</Text>
          {MOVES.map(m => <div key={m} className="flex items-center gap-1.5 text-caption font-ui"><i className="block size-3.5 rounded-full border-[1.5px] border-primary-fixed-dim" aria-hidden />{m}</div>)}
        </div>
      </div>
    </Card>
  )
}

import type { Metadata } from 'next'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import type { HatchState } from '@/components/shell/HatchGlyph'
import { buildMetadata } from '@/lib/seo/site'
import { V3PageShell } from '@/components/landing-v3/V3PageShell'
import { V3PageHero, V3Section } from '@/components/landing-v3/sections'

export const metadata: Metadata = buildMetadata({
  title: 'Hatch Animation States | HackProduct',
  description:
    'Preview Hatch animation states used across HackProduct coaching, feedback, and practice surfaces.',
  path: '/hatch-preview',
  keywords: ['Hatch', 'HackProduct', 'animation states', 'product coaching UI'],
})

const states: { state: HatchState; label: string; description: string }[] = [
  { state: 'none', label: 'Static', description: 'No animation. Reduced motion or static contexts.' },
  { state: 'idle', label: 'Idle / Standby', description: 'Gentle floating. Nav, badges, passive presence.' },
  { state: 'listening', label: 'Listening', description: 'Ears pulse, eyes widen. User is typing.' },
  { state: 'reviewing', label: 'Reviewing', description: 'Eyes scan, smile concentrates. Processing answer.' },
  { state: 'speaking', label: 'Speaking', description: 'Mouth moves, head pulses. Delivering feedback.' },
  { state: 'celebrating', label: 'Celebrating', description: 'Cap bounces, eyes blink, big smile. Achievement!' },
]

export default function HatchPreviewPage() {
  return (
    <V3PageShell>
      <V3PageHero
        eyebrow="Hatch"
        title="Hatch animation states."
        subtitle="Every HatchGlyph animation state used across coaching, feedback, and practice surfaces, shown at three sizes."
      />

      <V3Section title="States at a glance.">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {states.map(({ state, label, description }) => (
            <div key={state} className="v3-card flex flex-col items-center gap-5">
              <div className="flex items-end gap-6">
                <HatchGlyph size={32} state={state} />
                <HatchGlyph size={64} state={state} />
                <HatchGlyph size={96} state={state} />
              </div>
              <div className="text-center">
                <p className="font-label font-bold text-sm">{label}</p>
                <p className="text-xs text-on-surface-variant mt-1">{description}</p>
                <code className="text-[10px] text-outline mt-2 block">state=&quot;{state}&quot;</code>
              </div>
            </div>
          ))}
        </div>
      </V3Section>

      <V3Section title="On dark background.">
        <div
          className="rounded-xl p-8"
          style={{ background: '#2e3230', color: '#f5f0e8' }}
        >
          <div className="flex flex-wrap items-center gap-8">
            {states.map(({ state, label }) => (
              <div key={state} className="flex flex-col items-center gap-2">
                <HatchGlyph size={64} state={state} />
                <span className="text-xs font-label">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </V3Section>
    </V3PageShell>
  )
}

import { LumaGlyph } from '@/components/shell/LumaGlyph'
import type { LumaState } from '@/components/shell/LumaGlyph'

const states: { state: LumaState; label: string; description: string }[] = [
  { state: 'none', label: 'Static', description: 'No animation. Reduced motion or static contexts.' },
  { state: 'idle', label: 'Idle / Standby', description: 'Gentle floating. Nav, badges, passive presence.' },
  { state: 'listening', label: 'Listening', description: 'Ears pulse, eyes widen. User is typing.' },
  { state: 'reviewing', label: 'Reviewing', description: 'Eyes scan, smile concentrates. Processing answer.' },
  { state: 'speaking', label: 'Speaking', description: 'Mouth moves, head pulses. Delivering feedback.' },
  { state: 'celebrating', label: 'Celebrating', description: 'Cap bounces, eyes blink, big smile. Achievement!' },
]

export default function LumaPreviewPage() {
  return (
    <div className="min-h-screen bg-background text-on-background font-body p-12">
      <h1 className="font-headline font-bold text-3xl mb-2">Luma Animation States</h1>
      <p className="text-on-surface-variant mb-10">Preview all LumaGlyph animation states.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {states.map(({ state, label, description }) => (
          <div key={state} className="bg-surface-container rounded-xl p-8 flex flex-col items-center gap-5">
            <div className="flex items-end gap-6">
              <LumaGlyph size={32} state={state} />
              <LumaGlyph size={64} state={state} />
              <LumaGlyph size={96} state={state} />
            </div>
            <div className="text-center">
              <p className="font-label font-bold text-sm">{label}</p>
              <p className="text-xs text-on-surface-variant mt-1">{description}</p>
              <code className="text-[10px] text-outline mt-2 block">state=&quot;{state}&quot;</code>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-inverse-surface text-inverse-on-surface rounded-xl p-8">
        <h2 className="font-headline font-bold text-xl mb-6">On dark background</h2>
        <div className="flex flex-wrap items-center gap-8">
          {states.map(({ state, label }) => (
            <div key={state} className="flex flex-col items-center gap-2">
              <LumaGlyph size={64} state={state} />
              <span className="text-xs font-label">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

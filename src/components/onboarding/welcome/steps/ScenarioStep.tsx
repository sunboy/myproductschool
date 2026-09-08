'use client'
import type { ComponentType } from 'react'
import { GUT_CALLS } from '@/lib/calibration/gut-calls'
import { Search, MessageSquare, Zap, RotateCcw, Layers, SlidersHorizontal, Palette, X, Target, ShoppingCart, FlaskConical, Flag, Users, Megaphone, Pause } from 'lucide-react'

const ICONS: Record<string, ComponentType<{ size?: number }>> = { search: Search, chat: MessageSquare, bolt: Zap, refresh: RotateCcw, layers: Layers, sliders: SlidersHorizontal, palette: Palette, x: X, target: Target, cart: ShoppingCart, zap: Zap, flask: FlaskConical, flag: Flag, users: Users, megaphone: Megaphone, pause: Pause }
const MOVES = ['frame', 'list', 'optimize', 'win']

export function ScenarioStep({ index, answers, onAnswer }: { index: number; answers: Record<string, string>; onAnswer: (move: string, optionId: string) => void }) {
  const g = GUT_CALLS[index]
  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-1.5 text-[11px] font-bold">
        {MOVES.map((m, i) => (
          <span key={m} className={`rounded-full border px-2.5 py-0.5 ${i < index ? 'border-forest-800 bg-forest-800 text-white' : i === index ? 'border-forest-800 text-forest-800' : 'border-hairline text-ink-muted'}`}>{m.charAt(0).toUpperCase() + m.slice(1)}{i < index ? ' ✓' : ''}</span>
        ))}
      </div>
      <h2 className="font-headline text-[26px] font-bold leading-[1.15]">{g.headline} <em className="font-medium not-italic text-tertiary">{g.question}</em></h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {g.options.map(o => {
          const Icon = ICONS[o.icon] ?? Target
          const on = answers[g.move] === o.optionId
          return (
            <button key={o.optionId} type="button" data-testid={`option-${g.move}-${o.optionId}`} aria-pressed={on} onClick={() => onAnswer(g.move, o.optionId)} className={`flex items-center gap-3 rounded-xl border px-4 py-4 text-left ${on ? 'border-forest-800 bg-primary-fixed' : 'border-hairline bg-card-bright hover:bg-surface-container'}`}>
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-container text-forest-800"><Icon size={18} /></span>
              <span><b className="block text-[15px] leading-tight">{o.title}</b><span className="text-[12px] text-ink-secondary">{o.reason}</span></span>
            </button>
          )
        })}
      </div>
      <p className="text-[12px] text-ink-secondary">Pick your gut call. Hatch reads the instinct, not the wording.</p>
    </div>
  )
}

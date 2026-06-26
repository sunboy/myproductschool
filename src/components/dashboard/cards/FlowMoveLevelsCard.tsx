import Link from 'next/link'
import { FLOW_MOVES, FLOW_MOVE_ORDER } from '@/lib/flow/moves'

// Short dashboard-context taglines (the canonical FLOW_MOVES taglines are
// longer and tuned for grading copy; these fit the compact tile).
const MOVE_DESC: Record<string, string> = {
  frame: 'Find the right problem',
  list: 'Generate options',
  optimize: 'Pick & refine',
  win: 'Drive outcomes',
}

interface MoveLevel {
  move: string
  xp: number
  level: number
  progress_pct: number
}

interface FlowMoveLevelsCardProps {
  levels?: MoveLevel[]
}

export function FlowMoveLevelsCard({ levels = [] }: FlowMoveLevelsCardProps) {
  const moves = FLOW_MOVE_ORDER.map(key => {
    const meta = FLOW_MOVES[key]
    const live = levels.find(l => l.move === key)
    return {
      key: meta.label,
      icon: meta.icon,
      // One accent family: the move's solid color for the icon chip + bar,
      // its soft tint for the tile background, its border tint for the edge.
      tint: meta.soft,
      iconBg: meta.color,
      border: meta.border,
      desc: MOVE_DESC[key],
      level: live?.level ?? 1,
      pct: live ? live.progress_pct / 100 : 0,
    }
  })

  return (
    <div className="rounded-2xl p-6 bg-surface border border-outline-variant/30" data-hatch-target="dashboard-flow-levels">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-headline text-xl font-medium tracking-tight">FLOW Levels</h3>
          <p className="text-sm text-on-surface-variant mt-0.5">
            The four moves that compound into product judgment.
          </p>
        </div>
        <Link
          href="/progress"
          className="flex items-center gap-1 text-xs font-label font-bold uppercase tracking-wider text-primary"
        >
          Your skills{' '}
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-3.5 relative">
        <div
          aria-hidden
          className="absolute top-7 z-0 pointer-events-none hidden sm:block"
          style={{
            left: '12%', right: '12%', height: 2,
            backgroundImage: 'repeating-linear-gradient(90deg, var(--color-outline-variant) 0 6px, transparent 6px 12px)',
          }}
        />
        {moves.map(m => (
          <div
            key={m.key}
            className="relative z-10 rounded-2xl p-4 border bg-surface"
            style={{ background: m.tint, borderColor: m.border }}
          >
            <div className="flex items-start justify-between mb-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: m.iconBg }}
              >
                <span
                  className="material-symbols-outlined text-white text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {m.icon}
                </span>
              </div>
              <span className="text-xs font-label font-bold text-on-surface-variant">
                Lv {m.level}
              </span>
            </div>
            <div className="font-headline text-lg font-semibold tracking-tight text-on-surface">{m.key}</div>
            <div className="text-xs mt-0.5 mb-2.5 text-on-surface-variant">
              {m.desc}
            </div>
            <div className="h-1 rounded-full overflow-hidden bg-surface-container-highest">
              <div style={{ width: `${m.pct * 100}%`, background: m.iconBg, height: '100%' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

import { FLOW_MOVES, type FlowMoveKey } from '@/lib/flow/moves'

interface MoveLevel {
  move: string
  icon: string
  level: number
  pct: number
}

interface MoveLevelsCardProps {
  levels: MoveLevel[]
}

// FLOW move accent colors — resolved from the single source of truth.
function moveColors(move: string): { bar: string; bg: string; text: string } {
  const m = FLOW_MOVES[move.toLowerCase() as FlowMoveKey]
  if (!m) return { bar: '#4a7c59', bg: 'rgba(74,124,89,0.10)', text: '#4a7c59' }
  return { bar: m.color, bg: m.soft, text: m.color }
}

export function MoveLevelsCard({ levels }: MoveLevelsCardProps) {
  return (
    <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-headline font-semibold text-sm text-on-surface">FLOW Levels</h3>
        <span className="text-[10px] text-on-surface-variant font-label uppercase tracking-wider">Your skills</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {levels.map((lvl) => {
          const colors = moveColors(lvl.move)
          return (
            <div
              key={lvl.move}
              className="rounded-xl p-3 flex flex-col gap-2.5"
              style={{ backgroundColor: colors.bg }}
            >
              <div className="flex items-center justify-between">
                <span className="text-base leading-none">{lvl.icon}</span>
                <span className="text-[10px] font-bold font-label tabular-nums" style={{ color: colors.text }}>
                  Lv {lvl.level}
                </span>
              </div>
              <span className="text-xs font-bold text-on-surface font-label">{lvl.move}</span>
              <div className="h-1 bg-surface-container-highest/60 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${lvl.pct}%`, backgroundColor: colors.bar }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

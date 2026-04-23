interface MoveLevel {
  move: string
  icon: string
  level: number
  pct: number
}

interface MoveLevelsCardProps {
  levels: MoveLevel[]
}

// FLOW move accent colors
const MOVE_COLORS: Record<string, { bar: string; bg: string; text: string }> = {
  Frame:    { bar: '#3b82f6', bg: 'rgba(59,130,246,0.10)',  text: '#3b82f6' },
  List:     { bar: '#10b981', bg: 'rgba(16,185,129,0.10)',  text: '#10b981' },
  Optimize: { bar: '#f59e0b', bg: 'rgba(245,158,11,0.10)',  text: '#b45309' },
  Win:      { bar: '#8b5cf6', bg: 'rgba(139,92,246,0.10)',  text: '#7c3aed' },
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
          const colors = MOVE_COLORS[lvl.move] ?? { bar: '#4a7c59', bg: 'rgba(74,124,89,0.10)', text: '#4a7c59' }
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

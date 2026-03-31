interface MoveLevel {
  move: string
  icon: string
  level: number
  pct: number
}

interface MoveLevelsCardProps {
  levels: MoveLevel[]
}

export function MoveLevelsCard({ levels }: MoveLevelsCardProps) {
  return (
    <div className="bg-surface-container rounded-xl p-4 flex flex-col gap-3">
      <h3 className="font-headline font-semibold text-base text-on-surface">Move Levels</h3>

      <div className="flex flex-col gap-2.5">
        {levels.map((lvl) => (
          <div key={lvl.move} className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{lvl.icon}</span>
                <span className="text-sm font-semibold text-on-surface font-label">{lvl.move}</span>
              </div>
              <span className="text-xs text-on-surface-variant font-label">Lv {lvl.level}</span>
            </div>
            <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${lvl.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

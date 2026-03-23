interface Pattern {
  name: string
  count: number
}

interface PatternBreakdownProps {
  patterns: Pattern[]
}

export function PatternBreakdown({ patterns }: PatternBreakdownProps) {
  const maxCount = Math.max(...patterns.map((p) => p.count), 1)

  return (
    <div className="space-y-4">
      {patterns.map((pattern) => (
        <div key={pattern.name}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm text-on-surface">{pattern.name}</span>
            <span className="text-xs text-on-surface-variant">
              {pattern.count}x
            </span>
          </div>
          <div className="h-2 rounded-full bg-primary/20">
            <div
              className="h-2 rounded-full bg-tertiary transition-all duration-500"
              style={{ width: `${(pattern.count / maxCount) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

interface PercentileContextProps {
  score: number      // e.g. 3.2
  maxScore: number   // e.g. 4
  percentile: number // e.g. 72
}

export function PercentileContext({ score, maxScore, percentile }: PercentileContextProps) {
  return (
    <div className="bg-surface-container rounded-2xl p-5 flex items-center gap-6 my-4">
      <div className="text-center">
        <p className="font-headline text-3xl text-on-surface">{score.toFixed(1)}<span className="text-on-surface-variant text-lg">/{maxScore}</span></p>
        <p className="text-xs text-on-surface-variant font-label mt-1">Overall Score</p>
      </div>
      <div className="h-10 w-px bg-outline-variant" />
      <div>
        <p className="font-headline text-2xl text-primary">Top {100 - percentile}%</p>
        <p className="text-xs text-on-surface-variant font-label mt-1">of all submissions</p>
      </div>
      <div className="flex-1 hidden md:block">
        <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${percentile}%` }} />
        </div>
        <p className="text-xs text-on-surface-variant mt-1">Better than {percentile}% of responses</p>
      </div>
    </div>
  )
}

interface Props {
  streakDays: number
  totalAttempts: number
  productiqScore: number
}

export function StreakRingCard({ streakDays, totalAttempts, productiqScore }: Props) {
  // Determine tier badge
  const tierLabel =
    productiqScore >= 90 ? 'TOP PERFORMER'
    : productiqScore >= 75 ? 'RISING STAR'
    : productiqScore >= 60 ? 'BUILDING'
    : 'GETTING STARTED'

  // Percentile estimate based on score
  const percentile =
    productiqScore >= 90 ? 2
    : productiqScore >= 80 ? 10
    : productiqScore >= 70 ? 25
    : productiqScore >= 60 ? 40
    : 60

  return (
    <div className="bg-surface-container-lowest p-6 rounded-xl editorial-shadow ghost-border flex flex-col items-center justify-center h-full relative">
      <div className="absolute top-4 right-4">
        <span
          className="material-symbols-outlined text-secondary"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          local_fire_department
        </span>
      </div>
      <div className="relative flex items-center justify-center w-32 h-32">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
          <circle className="text-surface-variant" cx="64" cy="64" fill="transparent" r="58" stroke="currentColor" strokeWidth="8" />
          <circle className="text-primary" cx="64" cy="64" fill="transparent" r="58" stroke="currentColor" strokeDasharray="364.4" strokeDashoffset={364.4 - (364.4 * Math.min(streakDays, 30) / 30)} strokeLinecap="round" strokeWidth="8" />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-4xl font-headline font-black text-primary leading-none">{streakDays}</span>
          <span className="text-[10px] font-bold text-on-surface-variant uppercase">Days</span>
        </div>
      </div>
      <p className="mt-4 text-xs font-bold text-on-surface-variant">
        {totalAttempts} sessions &bull; Top {percentile}%
      </p>
    </div>
  )
}
